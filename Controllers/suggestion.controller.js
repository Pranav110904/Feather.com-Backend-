import { getTrendingHashtags } from "../Services/exploreService.js";
import Tweet from "../Models/tweet.model.js";
import User from "../Models/user.model.js"; // For user info if you display avatars

export const trendingSuggestions = async (req, res) => {
  try {
    // Get top 10 trending hashtags globally or for a main category, e.g.: "global" or "main", "sports"
    const trends = await getTrendingHashtags("global", null, 10);

    // Aggregate tweets matching these trending hashtags, limit to 20 results overall
    let suggestionTweets = [];
    for (const { value: tag } of trends) {
      const tweets = await Tweet.find({ content: new RegExp(`#${tag}`, "i") })
                               .sort({ createdAt: -1 })
                               .limit(3); // Up to 3 per tag for variety
      suggestionTweets.push(...tweets);
    }
    // Optionally, shuffle and slice to 20 unique tweets
    suggestionTweets = suggestionTweets
      .sort(() => Math.random() - 0.5)
      .slice(0, 20);

    res.json({ success: true, tweets: suggestionTweets });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to load trending suggestions" });
  }
};
