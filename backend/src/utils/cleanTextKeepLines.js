import * as cheerio from "cheerio";
import { decodeEntities } from "./decodeEntities.js";

/** Like cleanText, but turns <br>, </p>, </li>, </div> into line breaks instead of dropping them. */
export function cleanTextKeepLines(text) {
  let s = decodeEntities(String(text));
  if (s.includes("<")) {
    s = s.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|li|div)>/gi, "\n");
    s = cheerio.load(s, null, false).text();
  }
  return s;
}
