import { costStorage } from "./costStorage.js";

/**
 * Note one paid call for the current request. Does nothing outside a tracked request (CLI, tests).
 * @param {{ service: string, usd: number | null, detail?: string, [key: string]: unknown }} item
 */
export function recordCost(item) {
  costStorage.getStore()?.items.push(item);
}
