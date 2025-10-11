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

      uploadResult = await uploadImageCloudinary({ buffer: mediaBuffer, mimeType });
      thumbResult = await uploadImageCloudinary({ buffer: thumbnailBuffer, mimetype: "image/jpeg" });
    } 
    // Handle Video
    else {
      const tempInputPath = path.join(os.tmpdir(), `input-${uuidv4()}.mp4`);
      const tempOutputPath = path.join(os.tmpdir(), `output-${uuidv4()}.mp4`);
      const tempThumbPath = path.join(os.tmpdir(), `thumb-${uuidv4()}.jpg`);

      fs.writeFileSync(tempInputPath, file.buffer);

      await new Promise((resolve, reject) => {
        ffmpeg(tempInputPath)
          .outputOptions(["-vcodec libx264", "-crf 28", "-preset fast"])
          .save(tempOutputPath)
          .on("end", resolve)
          .on("error", reject);
      });

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

      mediaBuffer = fs.readFileSync(tempOutputPath);
      thumbnailBuffer = fs.readFileSync(tempThumbPath);

      uploadResult = await uploadVideoCloudinary(mediaBuffer);
      thumbResult = await uploadImageCloudinary({ buffer: thumbnailBuffer, mimetype: "image/jpeg" });

      fs.unlinkSync(tempInputPath);
      fs.unlinkSync(tempOutputPath);
      fs.unlinkSync(tempThumbPath);
    }

    if (!uploadResult?.secure_url || !thumbResult?.secure_url) {
      return res.status(500).json({ success: false, message: "Failed to upload media to Cloudinary" });
    }

    const user = await User.findById(userId).select("username avatar");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

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
      mediaUrl: story.mediaUrl,
      caption: story.caption,
      mediaType: story.mediaType,
      createdAt: story.createdAt,
      expiresAt: story.expiresAt,
    };

    // Push to Redis using ZSET with score = expiresAt timestamp
    const followers = await Follow.find({ following: userId }).select("follower");
    const allFeeds = [userId, ...followers.map(f => f.follower.toString())];
    const expiresAtMs = new Date(storyMetadata.expiresAt).getTime();

    for (const id of allFeeds) {
      const cacheKey = `stories:feed:${id}`;
      
      // ensure old wrong type keys are removed
      const type = await redis.type(cacheKey);
      if (type !== 'zset') {
        await redis.del(cacheKey);
      }
    
      const expiresAtMs = new Date(storyMetadata.expiresAt).getTime();
      await redis.zAdd(cacheKey, { score: expiresAtMs, value: JSON.stringify(storyMetadata) });
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
// Get Stories
export const getStoriesController = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const cacheKey = `stories:feed:${userId}`;
    const now = Date.now();

    // Remove expired stories
    await redis.zRemRangeByScore(cacheKey, 0, now);

    // Fetch only active stories
    const cachedStories = await redis.zRangeByScore(cacheKey, now, '+inf');
    let stories = cachedStories.map(s => JSON.parse(s));

    if (stories.length === 0) {
      const following = await Follow.find({ follower: userId }).select("following");
      const followingIds = following.map(f => f.following);
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
        const nowMs = Date.now();
        for (const story of stories) {
          const score = new Date(story.expiresAt).getTime();
          pipeline.zAdd(cacheKey, { score, value: JSON.stringify(story) });
        }
        await pipeline.exec();
      }
    }

    return res.status(200).json({ success: true, count: stories.length, stories });

  } catch (error) {
    console.error("Get stories error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch stories", error: error.message });
  }
};
