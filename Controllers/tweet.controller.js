import Tweet from "../Models/tweet.model.js";
import Follow from "../Models/follow.model.js";
import redis from "../Config/redis.js";
import { extractHashtags }  from "../Utils/extractHashtags.js";
import { classifyCategory }  from "../Utils/classifyCategory.js";
import { updateTrendingHashtags }  from "../Services/exploreService.js"; // trending logic from earlier
import TrendingBackup from "../Models/trendingBackup.model.js"; // Mongo backup model

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

    res.status(201).json({ success: true, tweet });
  } catch (error) {
    console.error("Tweet create error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
