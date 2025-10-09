import Tweet from "../Models/tweet.model.js";
import Follow from "../Models/follow.model.js";
import redis from "../Config/redis.js";

export const getFeed = async (req, res) => {
  try {
    const userId = req.userId; // Authenticated user
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const feedKey = `feed:${userId}`;

    // 1️⃣ Try fetching top tweets from Redis
    let tweetIds = await redis.lRange(feedKey, 0, limit - 1);

    let tweets = [];

    if (tweetIds && tweetIds.length > 0) {
      // Fetch tweets from MongoDB
      const tweetDocs = await Tweet.find({ _id: { $in: tweetIds } })
        .populate("author", "name username avatar");

      // Sort according to Redis order
      tweets = tweetIds
        .map(id => tweetDocs.find(t => t._id.toString() === id))
        .filter(Boolean);
    } else {
      // 2️⃣ Redis empty → fetch personalized feed from MongoDB
      // Get all users current user is following
      const following = await Follow.find({ follower: userId }).select("following");
        const followingIds = following.map(f => f.following);
      
        // Include user's own tweets
        const authorsToInclude = [...followingIds, userId];
      
        const fallbackTweets = await Tweet.find({ author: { $in: authorsToInclude } })
          .sort({ createdAt: -1 })
          .limit(limit)
          .populate("author", "name username avatar");
      
        tweets = fallbackTweets;
    }

    res.json({
      page,
      limit,
      count: tweets.length,
      feed: tweets
    });

  } catch (err) {
    console.error("Error fetching feed:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
