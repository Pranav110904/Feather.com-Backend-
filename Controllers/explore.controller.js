import { getTrendingHashtags, getTopTrend } from "../Services/exploreService.js";
import Tweet from "../Models/tweet.model.js";

export const getExploreData = async (req, res) => {
  try {
    const [topTrend, globalTrends, newsTrends, sportsTrends, entertainmentTrends] = await Promise.all([
      getTopTrend(),
      getTrendingHashtags("global", 10),
      getTrendingHashtags("news", 10),
      getTrendingHashtags("sports", 10),
      getTrendingHashtags("entertainment", 10),
    ]);

    // “For You” could be a mix of all categories (simplified for now)
    const forYou = [...newsTrends, ...sportsTrends, ...entertainmentTrends]
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        topTrend,
        globalTrends,
        newsTrends,
        sportsTrends,
        entertainmentTrends,
        forYou,
      },
    });
  } catch (error) {
    console.error("Explore fetch error:", error);
    res.status(500).json({ success: false, error: "Failed to load explore data" });
  }
};

// existing route for hashtag-specific tweets
export const getHashtagTweets = async (req, res) => {
  try {
    const { tag } = req.params;
    const tweets = await Tweet.find({ content: new RegExp(`#${tag}`, "i") })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, tweets });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch hashtag tweets" });
  }
};
