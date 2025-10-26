import Tweet from "../Models/tweet.model.js";
import Follow from "../Models/follow.model.js";
import redis from "../Config/redis.js";
import { extractHashtags } from "../Utils/extractHashtags.js";
import { updateTrendingHashtags } from "../Services/exploreService.js";
import TrendingBackup from "../Models/trendingBackup.model.js";
import { mlCategoryPredict } from "../Utils/mlCategoryPredict.js";
import { SUBCATEGORY_TO_MAIN, DEFAULT_MAIN_CATEGORY } from "../Utils/subcategoryMapping.js";

export const createTweet = async (req, res) => {
  try {
    const authorId = req.userId;
    const { content, media } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, error: "Content is required" });
    }

    // 1️⃣ Save tweet in MongoDB
    const tweet = await Tweet.create({ author: authorId, content, media });

    // 2️⃣ Get all followers
    const followers = await Follow.find({ following: authorId }).select("follower");

    // 3️⃣ Push to Redis feeds
    const pipeline = redis.multi();
    const feedKey = (userId) => `feed:${userId}`;

    pipeline.lPush(feedKey(authorId), tweet._id.toString());
    pipeline.lTrim(feedKey(authorId), 0, 19);

    followers.forEach(({ follower }) => {
      pipeline.lPush(feedKey(follower.toString()), tweet._id.toString());
      pipeline.lTrim(feedKey(follower.toString()), 0, 19);
    });

    await pipeline.exec();

    // 4️⃣ Hashtag + ML-based category tracking for Explore/trending section
    const hashtags = extractHashtags(content);

    if (hashtags.length > 0) {
      // Use ML to get subcategory/category
      const categoryPrediction = await mlCategoryPredict({ text: content, hashtags }); // <-- note correct property name 'text'
      const subcategory = categoryPrediction.category;
      const mainCategory = SUBCATEGORY_TO_MAIN[subcategory] || DEFAULT_MAIN_CATEGORY;

      try {
        // Update in Redis for trending
        await updateTrendingHashtags(hashtags, mainCategory, subcategory);
      } catch (redisError) {
        // Fallback—store in MongoDB backup
        console.error("⚠️ Redis down, saving backup to MongoDB:", redisError.message);
        for (const tag of hashtags) {
          await TrendingBackup.create({ hashtag: tag, mainCategory, subcategory });
        }
      }
    }

    res.status(201).json({ success: true, tweet });
  } catch (error) {
    console.error("Tweet create error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
