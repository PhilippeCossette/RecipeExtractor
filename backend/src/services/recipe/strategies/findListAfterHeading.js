import { cleanText } from "../../../utils/index.js";

const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "strong", "p", "span", "div"]);
const MAX_HEADING_LENGTH = 40;
const MIN_ITEMS = 2;

/** Find a short element whose text matches `pattern`, and return the items of the next <ul>/<ol>. */
export function findListAfterHeading($, pattern) {
  const all = $("*").toArray(); // document order

  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    if (!HEADING_TAGS.has(el.name)) continue;

    const text = $(el).text().trim();
    if (text.length > MAX_HEADING_LENGTH || !pattern.test(text)) continue;

    const list = all.slice(i + 1).find((next) => next.name === "ul" || next.name === "ol");
    if (!list) continue;

    const items = $(list).find("li").toArray().map((li) => cleanText($(li).text())).filter(Boolean);
    if (items.length >= MIN_ITEMS) return items;
  }
  return [];
}
