import { asList, cleanText } from "../../../utils/index.js";

/** author can be a string, { name }, or a list of either. Returns the first name found. */
export function parseAuthor(value) {
  for (const author of asList(value)) {
    const name = cleanText(author && typeof author === "object" ? author.name : author);
    if (name) return name;
  }
  return null;
}
