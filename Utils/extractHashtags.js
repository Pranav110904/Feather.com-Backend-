export function extractHashtags(text) {
  if (!text) return [];
  const matches = text.match(/#\w+/g);
  return matches ? matches.map(tag => tag.toLowerCase()) : [];
}
