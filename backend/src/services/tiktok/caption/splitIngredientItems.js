import { stripEmojis } from "../../../utils/index.js";
import { BULLET_SPLIT_RE, SUB_HEADING_RE } from "./patterns.js";
import { splitAtQuantities } from "./splitAtQuantities.js";

const MIN_LENGTH_TO_SPLIT_AT_QUANTITIES = 50;

const tidy = (item) => stripEmojis(item).replace(/^[\s,;]+|[\s,;.]+$/g, "").replace(/\s+/g, " ");

/**
 * Turn the ingredients block of a caption into one string per ingredient.
 * Handles one per line, "-" / "•" bullets (even all on one line), and bare one-line lists.
 * Sub-headings like "For the sauce:" are dropped.
 */
export function splitIngredientItems(block) {
  if (!block) return [];
  const withoutSubHeadings = block.replace(SUB_HEADING_RE, "$1\n");

  const items = [];
  for (const line of withoutSubHeadings.split("\n")) {
    if (!line.trim()) continue;

    if (BULLET_SPLIT_RE.test(line)) {
      items.push(...line.split(new RegExp(BULLET_SPLIT_RE.source, "gu")));
    } else if (line.length >= MIN_LENGTH_TO_SPLIT_AT_QUANTITIES) {
      items.push(...splitAtQuantities(line));
    } else {
      items.push(line);
    }
  }
  return items.map(tidy).filter((item) => item.length > 1);
}
