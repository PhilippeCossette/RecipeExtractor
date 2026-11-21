import { isoDurationToMinutes } from "../../../utils/index.js";

/** prepTime / cookTime / totalTime -> minutes. Fills total from prep + cook when missing. */
export function parseTimes(node) {
  const times = {
    prep: isoDurationToMinutes(node.prepTime),
    cook: isoDurationToMinutes(node.cookTime),
    total: isoDurationToMinutes(node.totalTime),
  };
  if (times.total == null && (times.prep || times.cook)) {
    times.total = (times.prep || 0) + (times.cook || 0);
  }
  return times;
}
