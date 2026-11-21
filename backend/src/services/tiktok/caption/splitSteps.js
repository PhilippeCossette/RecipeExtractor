import { stripEmojis } from "../../../utils/index.js";
import { BULLET_SPLIT_RE, STEP_NUMBER_RE } from "./patterns.js";

const tidy = (step) =>
  stripEmojis(step)
    .replace(/\s+/g, " ")
    .replace(/\s+[.]+$/, "") // "Serve and enjoy! ." -> "Serve and enjoy!"
    .trim();

/**
 * Positions of "1." "2." "3."... in order. Numbers that break the sequence
 * (like "350. " in "bake at 350. ") are ignored.
 */
function numberedStepPositions(text) {
  const positions = [];
  let expected = 1;
  for (const m of text.matchAll(STEP_NUMBER_RE)) {
    if (Number(m[1]) !== expected) continue;
    positions.push({ start: m.index, contentStart: m.index + m[0].length });
    expected++;
  }
  return positions;
}

/** Turn the instructions block of a caption into [{ section: null, text }]. */
export function splitSteps(block) {
  if (!block) return [];
  let steps;

  const numbered = numberedStepPositions(block);
  if (numbered.length >= 2) {
    steps = numbered.map((pos, i) => block.slice(pos.contentStart, numbered[i + 1]?.start ?? block.length));
  } else if (block.includes("\n")) {
    steps = block.split("\n");
  } else if (BULLET_SPLIT_RE.test(block)) {
    steps = block.split(new RegExp(BULLET_SPLIT_RE.source, "gu"));
  } else {
    steps = block.split(/(?<=[.!?])\s+/);
  }

  return steps
    .map(tidy)
    .filter((text) => text.length > 1 && /\p{L}/u.test(text))
    .map((text) => ({ section: null, text }));
}
