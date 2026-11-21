import { UNICODE_FRACTIONS } from "./fractions.js";

const FRACTION_CHARS = Object.keys(UNICODE_FRACTIONS).join("");
// 1 1/2 | 1/2 | 1½ or ½ | 2 | 2.5 | 2,5
const NUMBER = `(?:\\d+\\s+\\d+/\\d+|\\d+/\\d+|\\d*[${FRACTION_CHARS}]|\\d+(?:[.,]\\d+)?)`;

/** Leading quantity, with optional range: "2", "1 1/2", "2-3", "2 to 3", "2 à 3". */
export const QUANTITY_RE = new RegExp(`^\\s*(${NUMBER})(?:\\s*(?:-|–|—|to|or|à|ou)\\s*(${NUMBER}))?\\s*`, "i");

/** Leading word quantity: "a pinch", "two eggs". */
export const WORD_QUANTITY_RE = /^\s*([\p{L}]+)\s+/u;
export const VAGUE_AMOUNT_RE = /^(a few|a little)\b/i;

export const BULLET_RE = /^[-•*▢□]\s*/;
export const LEADING_PAREN_RE = /^\(([^)]*)\)\s*/;
export const ANY_PAREN_RE = /\(([^)]*)\)/g;
export const STRIP_PARENS_RE = /\s*\([^)]*\)\s*/g;

/** Size of a container after the unit: "boîte de 540 ml", "can of 400 g". */
export const CONTAINER_SIZE_RE = /^(?:de\s+|of\s+)?(\d+(?:[.,]\d+)?\s*(?:ml|cl|l|g|kg|oz|lb)\.?)(?=\s|\()\s*/i;

/** "de farine", "d'huile", "of flour". */
export const CONNECTOR_RE = /^(?:de\s+|d['’]\s*|of\s+)/i;

export const TRAILING_NOTE_RE =
  /\s+(to taste|as needed|for serving|for garnish|optional|au goût|au besoin|facultatif)\s*$/i;
