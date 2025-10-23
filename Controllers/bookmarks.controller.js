
import User from "../Models/user.model.js";
import redis from "../Config/redis.js";

export const bookmarkTweet = async (req, res) => {
  const userId = req.userId;
  const tweetId = req.params.id;

  try {
    const bookmarkKey = `bookmarks:${userId}`;

    // 1️⃣ Update MongoDB
    const user = await User.findById(userId);
    if (!user.bookmarks.includes(tweetId)) {
      user.bookmarks.push(tweetId);
      await user.save();
    }

    // 2️⃣ Update Redis
    await redis.sAdd(bookmarkKey, tweetId);

    res.status(200).json({ success: true, message: "Tweet bookmarked successfully" });
  } catch (error) {
    console.error("Bookmark error:", error);
    res.status(500).json({ success: false, message: "Error bookmarking tweet" });
  }
};

// Remove bookmark
export const removeBookmark = async (req, res) => {
  const userId = req.userId;
  const tweetId = req.params.id;

  try {
    const bookmarkKey = `bookmarks:${userId}`;

    // 1️⃣ Remove from MongoDB
    await User.findByIdAndUpdate(userId, { $pull: { bookmarks: tweetId } });

    // 2️⃣ Remove from Redis
    await redis.sRem(bookmarkKey, tweetId);

    res.status(200).json({ success: true, message: "Bookmark removed" });
  } catch (error) {
    console.error("Remove bookmark error:", error);
    res.status(500).json({ success: false, message: "Error removing bookmark" });
  }
};

export const getBookmarks = async (req, res) => {
  try {
    const userId = req.userId;
    const bookmarkKey = `bookmarks:${userId}`;

    // 1️⃣ Get bookmark IDs from Redis
    let tweetIds = await redis.sMembers(bookmarkKey);

    // 2️⃣ Fallback to Mongo if cache empty
    if (!tweetIds || tweetIds.length === 0) {
      const user = await User.findById(userId).select("bookmarks");
      tweetIds = user.bookmarks.map(id => id.toString());
      if (tweetIds.length > 0) await redis.sAdd(bookmarkKey, ...tweetIds);
    }

    // 3️⃣ Fetch actual tweet data
    const tweets = await Tweet.find({ _id: { $in: tweetIds } })
      .populate("author", "name username avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Bookmarks fetched successfully",
      count: tweets.length,
      data: tweets,
    });
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    res.status(500).json({ success: false, message: "Error fetching bookmarks" });
  }
};
