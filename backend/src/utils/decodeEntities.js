const ENTITY_RE = /&(#\d+|#x[\da-f]+|amp|lt|gt|quot|apos|nbsp|#39);/gi;
const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** Decode common HTML entities: "&amp;" -> "&", "&#233;" -> "é". */
export function decodeEntities(text) {
  return text.replace(ENTITY_RE, (match, entity) => {
    const key = entity.toLowerCase();
    if (key.startsWith("#x")) return String.fromCodePoint(parseInt(key.slice(2), 16));
    if (key.startsWith("#")) return String.fromCodePoint(parseInt(key.slice(1), 10));
    return NAMED[key] ?? match;
  });
}
