import redisClient from "../Config/redis.js";

const DECAY_INTERVAL = 10 * 60 * 1000; // 10 minutes
const DECAY_FACTOR = 0.9; // reduce score by 10% every interval

export async function updateTrendingHashtags(hashtags, category) {
  const globalKey = `trending:global`;
  const categoryKey = `trending:category:${category}`;
  const timestamp = Date.now();

  for (const tag of hashtags) {
    // Score based on time: newer tweets have slightly more weight
    const timeBoost = 1 + (timestamp % DECAY_INTERVAL) / DECAY_INTERVAL;

    await redisClient.zIncrBy(globalKey, timeBoost, tag);
    await redisClient.zIncrBy(categoryKey, timeBoost, tag);
  }
}

export async function getTrendingHashtags(category = "global", limit = 10) {
  const key = category === "global" ? `trending:global` : `trending:category:${category}`;
  const list = await redisClient.zRangeWithScores(key, -limit, -1);
  return list.reverse(); // highest score first
}

export async function getTopTrend() {
  const list = await redisClient.zRangeWithScores("trending:global", -1, -1);
  return list.length > 0 ? list[0] : null;
}

// Optional decay job — run every few mins
export async function applyDecay() {
  const keys = await redisClient.keys("trending:*");
  for (const key of keys) {
    const list = await redisClient.zRangeWithScores(key, 0, -1);
    for (const { value: tag, score } of list) {
      const newScore = score * DECAY_FACTOR;
      await redisClient.zAdd(key, [{ score: newScore, value: tag }]);
    }
  }
}
