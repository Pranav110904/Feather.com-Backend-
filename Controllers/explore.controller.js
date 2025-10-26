import { getTrendingHashtags, getTopTrend } from "../Services/exploreService.js";
import Tweet from "../Models/tweet.model.js";

// Get top and trending hashtags by main category and subcategory
export const getExploreData = async (req, res) => {
  try {
    // Query global trends, and by main categories
    const [
      topGlobalTrend,
      globalTrends,
      newsTrends,
      sportsTrends,
      entertainmentTrends
    ] = await Promise.all([
      getTopTrend("global"),
      getTrendingHashtags("global", null, 10),
      getTrendingHashtags("main", "news", 10),
      getTrendingHashtags("main", "sports", 10),
      getTrendingHashtags("main", "entertainment", 10)
    ]);

    // “For You”: random mix
    const forYou = [...newsTrends, ...sportsTrends, ...entertainmentTrends]
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        topGlobalTrend,
        globalTrends,
        newsTrends,
        sportsTrends,
        entertainmentTrends,
        forYou
      },
    });
  } catch (error) {
    console.error("Explore fetch error:", error);
    res.status(500).json({ success: false, error: "Failed to load explore data" });
  }
};

// Get trending for a subcategory (optional, useful for UI subfilters)
// /explore/subcategory?sub=sports or &sub=film_tv_&_video
export const getSubCategoryTrends = async (req, res) => {
  try {
    const { sub } = req.query;
    
    if (!sub) return res.status(400).json({ success: false, error: "Subcategory required" });
    const subTrends = await getTrendingHashtags("sub", sub, 10);
    console.log(subTrends);
    res.json({ success: true, subTrends });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch subcategory trends" });
  }
};

// Get Tweets for a trending hashtag (works for all categories)
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
