import * as cheerio from "cheerio";
import { decodeEntities } from "./decodeEntities.js";

/** Strip HTML tags/entities and collapse whitespace into single spaces. */
export function cleanText(text) {
  if (text == null) return "";
  let s = decodeEntities(String(text));
  if (s.includes("<")) s = cheerio.load(s, null, false).text();
  return s.replace(/\s+/g, " ").trim();
}
