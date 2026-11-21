import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Holds the current request's progress listener ({ onStep(step) }), so the extraction pipeline can say
 * what it's doing ("Reading the caption", "Listening to the video"...) without passing it around.
 * Opened by POST /recipe/stream; outside of it, reportProgress does nothing.
 */
export const progressStorage = new AsyncLocalStorage();
