import { progressStorage } from "./progressStorage.js";
import { STEPS } from "./steps.js";

/**
 * Tell the client what the pipeline is doing now. Does nothing outside POST /recipe/stream.
 * @param {keyof typeof STEPS} step
 */
export function reportProgress(step) {
  const listener = progressStorage.getStore();
  if (!listener) return;
  try {
    listener.onStep({ step, message: STEPS[step] ?? step });
  } catch {
    // a closed connection must not break the extraction
  }
}
