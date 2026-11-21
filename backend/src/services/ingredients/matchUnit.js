import { CASE_SENSITIVE_UNITS, UNIT_LOOKUP } from "./constants/units.js";

/**
 * If `text` starts with a unit, return [canonicalUnit, restOfText]; otherwise [null, text].
 * The unit must end at a word boundary, so "g" doesn't match "garlic".
 */
export function matchUnit(text) {
  const lower = text.toLowerCase();
  for (const [spelling, canonical] of UNIT_LOOKUP) {
    const caseSensitive = CASE_SENSITIVE_UNITS.has(spelling);
    const s = caseSensitive ? spelling : spelling.toLowerCase();
    if (!(caseSensitive ? text : lower).startsWith(s)) continue;

    const after = text.slice(s.length);
    if (after && /[\p{L}\p{N}]/u.test(after[0]) && !s.endsWith(".")) continue;
    return [canonical, after.replace(/^[\s.]+/, "")];
  }
  return [null, text];
}
