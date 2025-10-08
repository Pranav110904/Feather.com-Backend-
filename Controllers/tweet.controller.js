import Tweet from "../Models/tweet.modal.js";
import Follow from "../Models/follow.modal.js";
import redis from "../Config/redis.js";

export const createTweet = async (req, res) => {
  try {
    const { authorId, content, media } = req.body;

    if (!authorId || !content) {
      return res.status(400).json({ success: false, error: "authorId and content are required" });
    }

    // 1️⃣ Save tweet in MongoDB
    const tweet = await Tweet.create({ author: authorId, content, media });

    // 2️⃣ Get all followers of the author
    const followers = await Follow.find({ following: authorId }).select("follower");

    // 3️⃣ Use Redis pipeline to push tweet to all feeds
    const pipeline = redis.multi();

    const feedKey = (userId) => `feed:${userId}`;

    // Push to author's own feed queue
    pipeline.lPush(feedKey(authorId), tweet._id.toString());
    pipeline.lTrim(feedKey(authorId), 0, 19); // Keep only last 20 tweets

    // Push to all followers
    followers.forEach(({ follower }) => {
      pipeline.lPush(feedKey(follower), tweet._id.toString());
      pipeline.lTrim(feedKey(follower), 0, 19); // Keep only last 20 tweets
    });

    await pipeline.exec();

    res.status(201).json({ success: true, tweet });
  } catch (error) {
    console.error("Tweet create error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
