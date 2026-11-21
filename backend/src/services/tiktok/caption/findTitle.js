import { stripEmojis } from "../../../utils/index.js";
import { NOT_A_TITLE_RE } from "./patterns.js";

const MAX_TITLE_LENGTH = 70;

/** Share of words that start with a capital letter: "One Pot Creamy Pasta" = 1, "this is my dish" = 0. */
function titleCaseRatio(text) {
  const words = text.split(/\s+/).filter((w) => /\p{L}/u.test(w));
  if (!words.length) return 0;
  return words.filter((w) => /^\P{L}*\p{Lu}/u.test(w)).length / words.length;
}

function toCandidate(segment) {
  return stripEmojis(segment)
    .replace(/^.*?read (?:the )?caption(?: for)?\s*[:：-]?\s*/i, "") // "Read caption for : Pikliz" -> "Pikliz"
    .replace(/^[\s:：\-–—]+|[\s:：\-–—.!]+$/g, "")
    .trim();
}

/**
 * Guess the dish name from the caption text before the ingredients.
 * Dish names tend to be short, Title Case, not questions, and not "recipe below / follow me" chatter.
 */
export function findTitle(intro) {
  if (!intro) return null;

  const candidates = intro
    .split(/\n|(?<=[.!?])\s+/)
    .map(toCandidate)
    .filter((c) => c.length >= 3 && c.length <= MAX_TITLE_LENGTH)
    .filter((c) => !c.includes("?") && !c.includes("@") && !NOT_A_TITLE_RE.test(c));

  let best = null;
  let bestScore = -1;
  for (const c of candidates) {
    const score = titleCaseRatio(c);
    if (score > bestScore) {
      best = c;
      bestScore = score;
    }
  }
  return best;
}
