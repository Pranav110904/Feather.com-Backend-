import cron from "node-cron";
import TrendingBackup from "../Models/trendingBackup.model.js";
import { updateTrendingHashtags } from "../Utils/trending.js";

cron.schedule("*/5 * * * *", async () => {
  try {
    const backups = await TrendingBackup.find({});
    if (backups.length === 0) return;

    for (const { hashtag, category } of backups) {
      await updateTrendingHashtags([hashtag], category);
    }

    // Clear backup once synced
    await TrendingBackup.deleteMany({});
    console.log("✅ Trending data restored from MongoDB backup to Redis");
  } catch (error) {
    console.error("Redis Sync Error:", error);
  }
});
