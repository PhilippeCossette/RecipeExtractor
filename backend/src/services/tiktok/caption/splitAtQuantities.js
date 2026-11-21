import { QUANTITY_START_RE } from "./patterns.js";

/**
 * Split a one-line list with no bullets before each quantity, ignoring text inside parentheses:
 *   "2 lb beef (lamb, or 2 goats) 1 tsp salt" -> ["2 lb beef (lamb, or 2 goats)", "1 tsp salt"]
 */
export function splitAtQuantities(line) {
  const parts = [];
  let depth = 0;
  let start = 0;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    else if (
      depth === 0 &&
      i > start &&
      /\s/.test(line[i - 1]) &&
      !/(?:^|\s)\d+\s+$/.test(line.slice(start, i)) && // keep mixed numbers together: "1 1/2 cups"
      QUANTITY_START_RE.test(line.slice(i, i + 12))
    ) {
      parts.push(line.slice(start, i));
      start = i;
    }
  }
  parts.push(line.slice(start));
  return parts.map((p) => p.trim()).filter(Boolean);
}
