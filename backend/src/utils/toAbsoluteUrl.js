/** Resolve a possibly-relative URL against a base. Returns the input unchanged if it can't be parsed. */
export function toAbsoluteUrl(url, base) {
  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
}
