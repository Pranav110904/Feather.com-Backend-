// Utils/classifyCategory.js

const KEYWORDS = {
  news: ["breaking", "news", "update", "report", "journal", "headline"],
  sports: ["match", "goal", "tournament", "league", "cricket", "football", "soccer", "nba"],
  entertainment: ["movie", "music", "song", "album", "film", "tv", "show", "celebrity", "concert"],
  technology: ["tech", "ai", "software", "app", "gadget", "coding", "programming", "machine learning"],
  business: ["market", "stock", "finance", "startup", "investment", "business", "economy"],
  politics: ["election", "government", "policy", "minister", "president", "senate", "bill"],
  lifestyle: ["fashion", "travel", "food", "fitness", "health", "wellness", "style"],
};

const DEFAULT_CATEGORY = "other";

export function classifyCategory(text) {
  if (!text || typeof text !== "string") return DEFAULT_CATEGORY;
  const lower = text.toLowerCase();

  for (const [category, keywords] of Object.entries(KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return category;
    }
  }
  return DEFAULT_CATEGORY;
}
