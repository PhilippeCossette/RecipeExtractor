/**
 * Regexes for reading recipes out of free-form social-media captions (English + French).
 * Captions arrive either with real line breaks or flattened onto one line, so most patterns
 * work anywhere in the text, not only at the start of a line.
 */

// What can follow a heading: a colon, a line break, a 👇, or straight into a bullet / number.
const HEADING_END = String.raw`\s*(?:[:：]|\n|👇|(?=\s*(?:[-•▪◦*✔✅]|\d|[½¼¾⅓⅔])))`;

/** "Ingredients:", "INGRÉDIENTS", "What you'll need:" */
export const INGREDIENTS_HEADING_RE = new RegExp(
  String.raw`(?:^|[\s.!👇])(ingr[eé]dients?|what you(?:'|’)?ll need|you(?:'|’)?ll need|what you need)` + HEADING_END,
  "iu"
);

/** "Instructions:", "Directions", "Recipe Steps", "Method:", "Préparation :", "Étapes" */
export const INSTRUCTIONS_HEADING_RE = new RegExp(
  String.raw`(?:^|[\s.!👇])(instructions?|directions?|method|recipe steps|steps|how to make(?: it)?|pr[eé]paration|[eé]tapes|m[eé]thode)` +
    String.raw`\s*(?:[:：]|\n|👇|(?=\s*(?:step\s*)?1[.)]?\s))`,
  "iu"
);

/** Numbered step markers: "1." "2)" "Step 3:" "Étape 4". Group 1 is the number. */
export const STEP_NUMBER_RE = /(?:^|\s)(?:(?:step|[eé]tape)\s*)?(\d{1,2})(?:[.)]|\s*[:：-])\s+/giu;

/** Bullets used in captions: "-", "•", "▪️", "✔️", "✅", "➡️", "🔸". Must follow whitespace or start. */
export const BULLET_SPLIT_RE = /(?:^|\s)(?:[-•▪◦*✔✅➡🔸🔹▫]️?)\s*(?=\S)/u;

/** Short label ending with ":" inside an ingredient list: "For the sauce:", "Prep these veggies:". */
export const SUB_HEADING_RE = /(^|\s)([\p{L}][^:\n\d]{1,35})[:：](?=\s|$)/gu;

/** Split point before a quantity, for one-line lists with no bullets: "... oil 2 cups flour 1 tsp salt". */
export const QUANTITY_START_RE = /^(?:\d+\s+\d+\/\d+|\d+(?:[.,/]\d+)?|\d*[½¼¾⅓⅔⅛])\s*[\p{L}(]/u;

export const HASHTAG_RE = /#([\p{L}\p{N}_]+)/gu;

/** Phrases that are about the post, not the dish name. */
export const NOT_A_TITLE_RE =
  /(full recipe|recipe (?:below|in the|is in)|here(?:'|’)?s? (?:is )?the recipe|follow (?:for|me)|read (?:the )?caption(?: for)?|link in bio|giving credit|inspired by|recette (?:ci-dessous|en bas))/i;

export const SERVINGS_RE = /(?:serves|servings?|makes|yields?|portions?|pour)\s*[:：]?\s*(\d+)/i;

/** "Prep time: 10 min", "Cook time 1 hour", "Total: 45 minutes" */
export const TIME_RE = {
  prep: /prep(?:aration)?(?:\s*time)?\s*[:：]?\s*(\d+)\s*(min|minutes?|h|hrs?|hours?)\b/i,
  cook: /cook(?:ing)?(?:\s*time)?\s*[:：]?\s*(\d+)\s*(min|minutes?|h|hrs?|hours?)\b/i,
  total: /total(?:\s*time)?\s*[:：]?\s*(\d+)\s*(min|minutes?|h|hrs?|hours?)\b/i,
};
