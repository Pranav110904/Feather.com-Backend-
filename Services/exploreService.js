import redisClient from "../Config/redis.js";

const DECAY_INTERVAL = 10 * 60 * 1000; // 10 minutes
const DECAY_FACTOR = 0.9;

export async function updateTrendingHashtags(hashtags, mainCategory, subcategory) {
  const globalKey = `trending:global`;
  const mainKey = `trending:category:${mainCategory}`;
  const subKey = `trending:subcategory:${subcategory}`;
  const timestamp = Date.now();
  const timeBoost = 1 + (timestamp % DECAY_INTERVAL) / DECAY_INTERVAL;

  for (const tag of hashtags) {
    await redisClient.zIncrBy(globalKey, timeBoost, tag);
    await redisClient.zIncrBy(mainKey, timeBoost, tag);
    await redisClient.zIncrBy(subKey, timeBoost, tag);
  }
}

// Query top hashtags by global, main category, or subcategory
export async function getTrendingHashtags(type = "global", value = null, limit = 10) {
  let key;
  if (type === "global" || !value) {
    key = `trending:global`;
  } else if (type === "main") {
    key = `trending:category:${value}`;
  } else if (type === "sub") {
    key = `trending:subcategory:${value}`;
  } else {
    throw new Error("Invalid trending type");
  }

  const list = await redisClient.zRangeWithScores(key, -limit, -1);
  return list.reverse();
}

// Get single top hashtag from global/main/subcategory
export async function getTopTrend(type = "global", value = null) {
  let key;
  if (type === "global" || !value) {
    key = `trending:global`;
  } else if (type === "main") {
    key = `trending:category:${value}`;
  } else if (type === "sub") {
    key = `trending:subcategory:${value}`;
  } else {
    throw new Error("Invalid trending type");
  }

  const list = await redisClient.zRangeWithScores(key, -1, -1);
  return list.length > 0 ? list[0] : null;
}

// Optional decay job — run every few mins to keep trending list fresh
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
