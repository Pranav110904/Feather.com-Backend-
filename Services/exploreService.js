import redisClient from "../Config/redis.js";

export async function updateTrendingHashtags(hashtags, category) {
  const globalKey = `trending:global`;
  const categoryKey = `trending:category:${category}`;

  for (const tag of hashtags) {
    await redisClient.zIncrBy(globalKey, 1, tag);
    await redisClient.zIncrBy(categoryKey, 1, tag);
  }
}

export async function getTrendingHashtags(category = "global", limit = 10) {
  const key = category === "global" ? `trending:global` : `trending:category:${category}`;
  const list = await redisClient.zRangeWithScores(key, -limit, -1);
  return list.reverse(); // highest score first
}
