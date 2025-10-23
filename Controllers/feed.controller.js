import Tweet from "../Models/tweet.model.js";
import Follow from "../Models/follow.model.js";
import User from "../Models/user.model.js";
import redis from "../Config/redis.js";

export const getFeed = async (req, res) => {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const feedKey = `feed:${userId}`;
    const bookmarkKey = `bookmarks:${userId}`;

    // 1️⃣ Try fetching tweet IDs from Redis
    let tweetIds = await redis.lRange(feedKey, 0, limit - 1);
    let tweets = [];

    if (tweetIds && tweetIds.length > 0) {
      const tweetDocs = await Tweet.find({ _id: { $in: tweetIds } })
        .populate("author", "name username avatar");

      // Maintain Redis order
      tweets = tweetIds
        .map(id => tweetDocs.find(t => t._id.toString() === id))
        .filter(Boolean);
    } else {
      // 2️⃣ Redis empty → fallback to DB
      const following = await Follow.find({ follower: userId }).select("following");
      const followingIds = following.map(f => f.following);
      const authorsToInclude = [...followingIds, userId];

      const fallbackTweets = await Tweet.find({ author: { $in: authorsToInclude } })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("author", "name username avatar");

      tweets = fallbackTweets;
    }

    // 3️⃣ Try fetching user's bookmarks from Redis
    let bookmarkedIds = await redis.sMembers(bookmarkKey);

    // If Redis cache is empty, fetch from MongoDB once and store in Redis
    if (!bookmarkedIds || bookmarkedIds.length === 0) {
      const user = await User.findById(userId).select("bookmarks");
      bookmarkedIds = user.bookmarks.map(id => id.toString());
      if (bookmarkedIds.length > 0) {
        await redis.sAdd(bookmarkKey, ...bookmarkedIds);
      }
    }

    // 4️⃣ Attach bookmark status
    const tweetsWithBookmarkStatus = tweets.map(tweet => ({
      ...tweet.toObject(),
      isBookmarked: bookmarkedIds.includes(tweet._id.toString()),
    }));

    res.json({
      page,
      limit,
      count: tweetsWithBookmarkStatus.length,
      feed: tweetsWithBookmarkStatus,
    });
  } catch (err) {
    console.error("Error fetching feed:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
