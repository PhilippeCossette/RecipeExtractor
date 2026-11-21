/** AggregateRating -> { value, count }, or null if neither is present. */
export function parseRating(value) {
  if (!value || typeof value !== "object") return null;

  const rating = Number.parseFloat(value.ratingValue);
  const rawCount = String(value.ratingCount ?? value.reviewCount ?? "").replace(/,/g, "");
  const count = Number.parseInt(rawCount, 10);

  if (Number.isNaN(rating) && Number.isNaN(count)) return null;
  return {
    value: Number.isNaN(rating) ? null : rating,
    count: Number.isNaN(count) ? null : count,
  };
}
