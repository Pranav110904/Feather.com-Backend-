
import Tweet from "../Models/tweet.model.js";
import AIPrompt from "../Models/aiPrompt.model.js";
import { generateTweetContent } from "../Services/geminiService.js";
import { createTweetPrompt } from "../Utils/generatePromptTemplate.js";
import Follow from "../Models/follow.model.js";
import mongoose from "mongoose";
import redis from "../Config/redis.js"; 
import { extractHashtags }  from "../Utils/extractHashtags.js";
import { classifyCategory }  from "../Utils/classifyCategory.js";
import { updateTrendingHashtags }  from "../Services/exploreService.js"; // trending logic from earlier
import TrendingBackup from "../Models/trendingBackup.model.js"; 

// 🔹 Generate a tweet using AI
export const generateTweet = async (req, res) => {
  try {
    const userId = req.userId; // Authenticated user
    const { prompt } = req.body;
    const fullPrompt = createTweetPrompt(prompt);
    if (!prompt || prompt.trim() === "") {
      return res.status(400).json({ message: "Prompt cannot be empty" });
    }

    // Call your service instead of Gemini SDK directly
    const generatedText = await generateTweetContent(fullPrompt);

    // Save the AI prompt in DB
    const aiPrompt = await AIPrompt.create({
      user: userId,
      promptText: prompt,
      generatedText,
    });

    res.status(200).json({ generatedText, promptId: aiPrompt._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to generate tweet" });
  }
};


// 🔹 Post a tweet (AI or manual)
export const postTweet = async (req, res) => {
  try {
    const userId = req.userId; // Authenticated user
    const { content, promptId, media } = req.body;

    // Check for empty content
    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Tweet content cannot be empty" });
    }

    // Enforce Twitter character limit
    if (content.length > 280) {
      return res.status(400).json({ message: "Tweet cannot exceed 280 characters" });
    }

    // 1️⃣ Create tweet in MongoDB
    const tweet = await Tweet.create({
      author: userId,
      content,
      media: media || [],
      generatedByAI: !!promptId,
      originalPromptId: promptId || null,
    });

    // 2️⃣ Update AI prompt if used
    if (promptId && mongoose.Types.ObjectId.isValid(promptId)) {
      await AIPrompt.findByIdAndUpdate(promptId, { usedInTweet: tweet._id });
    }

    // 3️⃣ Get followers of the author
    const followers = await Follow.find({ following: userId }).select("follower");

    // 4️⃣ Use Redis pipeline to push tweet to feeds
    const pipeline = redis.multi();
    const feedKey = (uid) => `feed:${uid}`;

    // Push to author's own feed
    pipeline.lPush(feedKey(userId), tweet._id.toString());
    pipeline.lTrim(feedKey(userId), 0, 19); // Keep only last 20 tweets

    // Push to all followers
    followers.forEach(({ follower }) => {
      pipeline.lPush(feedKey(follower.toString()), tweet._id.toString());
      pipeline.lTrim(feedKey(follower.toString()), 0, 19);
    });

    await pipeline.exec();
    // 4️⃣ Hashtag + category tracking for Explore section
    const hashtags = extractHashtags(content);
    if (hashtags.length > 0) {
      const category = classifyCategory(content);

      try {
        // update in Redis (main trending engine)
        await updateTrendingHashtags(hashtags, category);
      } catch (redisError) {
        console.error("⚠️ Redis down, saving backup to MongoDB:", redisError.message);
        // Fallback — store hashtag + category in MongoDB backup collection
        for (const tag of hashtags) {
          await TrendingBackup.create({ hashtag: tag, category });
        }
      }
    }
    
    res.status(201).json({ message: "Tweet posted successfully", tweet });
  } catch (error) {
    console.error("Tweet post error:", error);
    res.status(500).json({ message: "Failed to post tweet" });
  }
};

// 🔹 Optional: Get AI prompt history for a user
export const getAIPrompts = async (req, res) => {
  try {
    const userId = req.userId;
    const prompts = await AIPrompt.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json(prompts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch AI prompts" });
  }
};
