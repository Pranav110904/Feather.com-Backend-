import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import streamifier from "streamifier";

import fs from "fs";
import os from "os";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import Story from "../Models/story.model.js";
import User from "../Models/user.model.js";
import Follow from "../Models/follow.model.js";
import uploadImageCloudinary from "../Utils/uploadImageToCloudinary.js";
import redis from "../Config/redis.js";
import uploadVideoCloudinary from "../Utils/uploadVideoCloudinary.js";



const STORY_EXPIRY_SECONDS = 24 * 60 * 60; // 24 hours

// Upload Story
export const uploadStoryController = async (req, res) => {
  try {
    const userId = req.userId;
    const { caption } = req.body;
    const file = req.file;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!file) return res.status(400).json({ success: false, message: "No file provided" });

    const mimeType = file.mimetype;
    if (!mimeType.startsWith("image") && !mimeType.startsWith("video")) {
      return res.status(400).json({ success: false, message: "Unsupported file type" });
    }

    let mediaBuffer = file.buffer;
    let thumbnailBuffer;

    let uploadResult, thumbResult;

    // Handle Image
    if (mimeType.startsWith("image")) {
      mediaBuffer = await sharp(file.buffer)
        .resize({ width: 1080 })
        .jpeg({ quality: 70 })
        .toBuffer();

      thumbnailBuffer = await sharp(file.buffer)
        .resize({ width: 300 })
        .jpeg({ quality: 50 })
        .toBuffer();

      // Upload image and thumbnail
      uploadResult = await uploadImageCloudinary({ buffer: mediaBuffer, mimetype });
      thumbResult = await uploadImageCloudinary({ buffer: thumbnailBuffer, mimetype: "image/jpeg" });
    } 
    // Handle Video
    else {
      // Create temp file paths
      const tempInputPath = path.join(os.tmpdir(), `input-${uuidv4()}.mp4`);
      const tempOutputPath = path.join(os.tmpdir(), `output-${uuidv4()}.mp4`);
      const tempThumbPath = path.join(os.tmpdir(), `thumb-${uuidv4()}.jpg`);

      // Save buffer to temp input file
      fs.writeFileSync(tempInputPath, file.buffer);

      // Compress video
      await new Promise((resolve, reject) => {
        ffmpeg(tempInputPath)
          .outputOptions(["-vcodec libx264", "-crf 28", "-preset fast"])
          .save(tempOutputPath)
          .on("end", resolve)
          .on("error", reject);
      });

      // Extract thumbnail
      await new Promise((resolve, reject) => {
        ffmpeg(tempInputPath)
          .screenshots({
            timestamps: ["00:00:01"],
            filename: path.basename(tempThumbPath),
            folder: path.dirname(tempThumbPath),
            size: "300x?"
          })
          .on("end", resolve)
          .on("error", reject);
      });

      // Read buffers
      mediaBuffer = fs.readFileSync(tempOutputPath);
      thumbnailBuffer = fs.readFileSync(tempThumbPath);

      // Upload video and thumbnail
      uploadResult = await uploadVideoCloudinary(mediaBuffer);
      thumbResult = await uploadImageCloudinary({ buffer: thumbnailBuffer, mimetype: "image/jpeg" });

      // Clean up temp files
      fs.unlinkSync(tempInputPath);
      fs.unlinkSync(tempOutputPath);
      fs.unlinkSync(tempThumbPath);
    }

    if (!uploadResult || !uploadResult.secure_url) {
      return res.status(500).json({ success: false, message: "Failed to upload media to Cloudinary" });
    }

    if (!thumbResult || !thumbResult.secure_url) {
      return res.status(500).json({ success: false, message: "Failed to upload thumbnail to Cloudinary" });
    }

    // Fetch user info
    const user = await User.findById(userId).select("username avatar");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Save story in DB
    const story = await Story.create({
      user: userId,
      mediaUrl: uploadResult.secure_url,
      thumbnailUrl: thumbResult.secure_url,
      mediaType: mimeType.startsWith("video") ? "video" : "image",
      caption,
    });

    const storyMetadata = {
      _id: story._id,
      storyKey: uuidv4(),
      user: { _id: user._id, username: user.username, avatar: user.avatar },
      thumbnailUrl: story.thumbnailUrl,
      caption: story.caption,
      mediaType: story.mediaType,
      createdAt: story.createdAt,
      expiresAt: story.expiresAt,
    };

    // Push to Redis (user + followers)
    const followers = await Follow.find({ following: userId }).select("follower");
    const allFeeds = [userId, ...followers.map(f => f.follower.toString())];

    for (const id of allFeeds) {
      const cacheKey = `stories:feed:${id}`;
      const storyString = JSON.stringify(storyMetadata);
      await redis.lPush(cacheKey, storyString);
      await redis.lTrim(cacheKey, 0, 99); // keep latest 100 stories
      await redis.expire(cacheKey, STORY_EXPIRY_SECONDS);
    }

    return res.status(201).json({
      success: true,
      message: "Story uploaded successfully",
      story: storyMetadata,
    });

  } catch (error) {
    console.error("Story upload error:", error);
    return res.status(500).json({ success: false, message: "Story upload failed", error: error.message });
  }
};


// Get Stories (cached or rebuild from DB)
export const getStoriesController = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const cacheKey = `stories:feed:${userId}`;

    // Try fetching from Redis
    const cachedStories = await redis.lRange(cacheKey, 0, -1);
    let stories = [];

    if (cachedStories && cachedStories.length > 0) {
      stories = cachedStories.map((s) => JSON.parse(s));
    } else {
      // No cache → rebuild from DB
      const following = await Follow.find({ follower: userId }).select("following");
      const followingIds = following.map((f) => f.following);
      const userIds = [...followingIds, userId];

      const activeStories = await Story.find({
        user: { $in: userIds },
        expiresAt: { $gt: new Date() },
      })
        .sort({ createdAt: -1 })
        .populate("user", "username avatar");

      stories = activeStories.map((story) => ({
        _id: story._id,
        storyKey: uuidv4(),
        user: story.user,
        thumbnailUrl: story.thumbnailUrl,
        caption: story.caption,
        mediaType: story.mediaType,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
      }));

      if (stories.length > 0) {
        const pipeline = redis.multi();
        stories.forEach((story) => pipeline.rPush(cacheKey, JSON.stringify(story)));
        pipeline.expire(cacheKey, STORY_EXPIRY_SECONDS);
        await pipeline.exec();
      }
    }

    return res.status(200).json({
      success: true,
      count: stories.length,
      stories,
    });
  } catch (error) {
    console.error("Get stories error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stories",
      error: error.message,
    });
  }
};
