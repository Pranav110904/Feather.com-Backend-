import Tweet from "../Models/tweet.modal.js";
import redis from "../Config/redis.js";

export const getFeed = async (req, res) => {
  try {
    const { userId } = req.params;

    // 1️⃣ Fetch only top 20 tweet IDs from Redis
    const tweetIds = await redis.lRange(`feed:${userId}`, 0, 19);

    // 2️⃣ Fallback to MongoDB if Redis is empty
    if (!tweetIds || tweetIds.length === 0) {
      const fallbackTweets = await Tweet.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("author", "name username avatar");
      return res.json({ feed: fallbackTweets });
    }

    // 3️⃣ Fetch tweets from MongoDB
    const tweets = await Tweet.find({ _id: { $in: tweetIds } })
      .populate("author", "name username avatar");

    // 4️⃣ Sort tweets in same order as Redis (most recent first)
    const sortedTweets = tweetIds
      .map(id => tweets.find(t => t._id.toString() === id))
      .filter(Boolean);

    res.json({ feed: sortedTweets });
  } catch (err) {
    console.error("Error fetching feed:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
