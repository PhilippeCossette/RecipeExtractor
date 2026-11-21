/** "https://www.example.com/x" -> "example.com", or null for invalid URLs. */
export function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
