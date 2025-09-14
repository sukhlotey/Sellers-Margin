export const extractKeywords = (text) => {
  if (!text) return [];

  const words = text.toLowerCase().split(/\s+/);
  const stopwords = ["the", "is", "and", "for", "with", "this", "that", "from"];
  const freq = {};

  words.forEach((word) => {
    if (!stopwords.includes(word) && word.length > 2) {
      freq[word] = (freq[word] || 0) + 1;
    }
  });

  return Object.keys(freq)
    .sort((a, b) => freq[b] - freq[a])
    .slice(0, 10); // Top 10 keywords
};
