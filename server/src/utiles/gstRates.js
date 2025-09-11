// simple GST lookup - extendable
const gstRates = {
  "default": 18,
  "books": 5,
  "electronics": 18,
  "fashion": 12,
  "general": 18,
};

export function getGSTRate(categoryOrKey) {
  if (!categoryOrKey) return gstRates.default;
  const key = String(categoryOrKey).toLowerCase();
  return gstRates[key] ?? gstRates.default;
}

export default gstRates;
