import { WORD_NUMBERS } from "./constants/wordNumbers.js";
import {
  ANY_PAREN_RE,
  BULLET_RE,
  CONNECTOR_RE,
  CONTAINER_SIZE_RE,
  LEADING_PAREN_RE,
  QUANTITY_RE,
  STRIP_PARENS_RE,
  TRAILING_NOTE_RE,
  VAGUE_AMOUNT_RE,
  WORD_QUANTITY_RE,
} from "./constants/patterns.js";
import { matchUnit } from "./matchUnit.js";
import { toNumber } from "./toNumber.js";

/** Index of the first comma that isn't inside parentheses, or -1. */
function topLevelCommaIndex(text) {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")") depth = Math.max(0, depth - 1);
    else if (text[i] === "," && depth === 0) return i;
  }
  return -1;
}

/** Remove a regex match from the start of `text`; push group 1 to `notes`. */
function takeLeading(text, re, notes) {
  const m = text.match(re);
  if (!m) return text;
  notes.push(m[1].trim());
  return text.slice(m[0].length);
}

/**
 * Split an ingredient line into quantity / unit / name / notes.
 *
 *   parseIngredient("1 1/2 cups all-purpose flour, sifted")
 *   -> { raw, quantity: 1.5, quantityMax: null, unit: "cup", name: "all-purpose flour", notes: "sifted" }
 */
export function parseIngredient(line) {
  const raw = String(line).replace(/\s+/g, " ").trim();
  const result = { raw, quantity: null, quantityMax: null, unit: null, name: raw, notes: null };
  const notes = [];
  let text = raw.replace(BULLET_RE, "");

  // 1. quantity: "2", "1 1/2", "2-3", or a word like "a" / "two"
  const qty = text.match(QUANTITY_RE);
  if (qty) {
    result.quantity = toNumber(qty[1]);
    if (qty[2]) result.quantityMax = toNumber(qty[2]);
    text = text.slice(qty[0].length);
  } else {
    const word = text.match(WORD_QUANTITY_RE);
    const key = word?.[1].toLowerCase();
    if (key && key in WORD_NUMBERS && !VAGUE_AMOUNT_RE.test(text)) {
      result.quantity = WORD_NUMBERS[key];
      text = text.slice(word[0].length);
    }
  }

  // 2. size before the unit: "1 (14 oz) can tomatoes"
  text = takeLeading(text, LEADING_PAREN_RE, notes);

  // 3. unit, then a container size or alternate measure right after it
  const [unit, rest] = matchUnit(text);
  if (unit) {
    result.unit = unit;
    text = takeLeading(rest, CONTAINER_SIZE_RE, notes); // "boîte de 540 ml"
    text = takeLeading(text, LEADING_PAREN_RE, notes); // "680 g (4 tasses)"
  }

  // 4. drop "de" / "d'" / "of"
  text = text.trim().replace(CONNECTOR_RE, "");

  // 5. notes: after the first comma (outside parentheses), any parentheses, and "to taste"-style endings
  const comma = topLevelCommaIndex(text);
  if (comma !== -1) {
    notes.push(text.slice(comma + 1).trim());
    text = text.slice(0, comma);
  }
  for (const m of text.matchAll(ANY_PAREN_RE)) notes.push(m[1].trim());
  text = text.replace(STRIP_PARENS_RE, " ");
  const trailing = text.match(TRAILING_NOTE_RE);
  if (trailing) {
    notes.push(trailing[1]);
    text = text.slice(0, trailing.index);
  }

  const name = text.replace(/\s+/g, " ").replace(/^[\s.\-–]+|[\s.\-–]+$/g, "");
  result.name = name || raw;
  result.notes = notes.filter(Boolean).join("; ") || null;
  return result;
}
