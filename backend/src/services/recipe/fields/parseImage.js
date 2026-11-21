import { asList, toAbsoluteUrl } from "../../../utils/index.js";

/** image can be a URL, an ImageObject, or a list of either. Returns the first absolute URL. */
export function parseImage(value, baseUrl) {
  for (const item of asList(value)) {
    if (typeof item === "string") return toAbsoluteUrl(item, baseUrl);
    const url = item?.url || item?.contentUrl || item?.["@id"];
    if (url) return toAbsoluteUrl(url, baseUrl);
  }
  return null;
}
