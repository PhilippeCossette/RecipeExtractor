import { asList } from "../../../utils/index.js";

/** Returns the first VideoObject's contentUrl or embedUrl. */
export function parseVideo(value) {
  for (const video of asList(value)) {
    const url = video?.contentUrl || video?.embedUrl;
    if (url) return url;
  }
  return null;
}
