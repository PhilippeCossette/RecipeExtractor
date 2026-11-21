import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Holds the paid calls made while handling one request ({ items: [...] }).
 * The trackCost middleware opens it; services add to it with recordCost() without needing `req`.
 */
export const costStorage = new AsyncLocalStorage();
