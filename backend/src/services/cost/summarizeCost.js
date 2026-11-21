/**
 * Total of a request's paid calls. `totalUsd` adds up the known prices; `complete` is false when a call had no price.
 * @param {Array<{ usd: number | null }>} items
 */
export function summarizeCost(items) {
  const totalUsd = items.reduce((sum, item) => sum + (item.usd ?? 0), 0);
  return {
    totalUsd: Math.round(totalUsd * 1_000_000) / 1_000_000,
    complete: items.every((item) => item.usd !== null),
    items,
  };
}
