import User from "../models/User.js";

export const bookmarkTweet = async (req, res) => {
  const userId = req.userId;
  const tweetId = req.params.id;

  try {
    const user = await User.findById(userId);
    if (!user.bookmarks.includes(tweetId)) {
      user.bookmarks.push(tweetId);
      await user.save();
    }
    res.status(200).json({ message: "Tweet bookmarked successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error bookmarking tweet" });
  }
};

// Remove bookmark
export const removeBookmark = async (req, res) => {
  const userId = req.userId;
  const tweetId = req.params.id;

  try {
    await User.findByIdAndUpdate(userId, {
      $pull: { bookmarks: tweetId },
    });
    res.status(200).json({ message: "Bookmark removed" });
  } catch (error) {
    res.status(500).json({ error: "Error removing bookmark" });
  }
};
