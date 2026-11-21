const PRIVATE_HOSTNAMES = [/^localhost$/, /\.localhost$/, /\.local$/, /\.internal$/, /\.home\.arpa$/];
const PRIVATE_IPV4 = [/^0\./, /^10\./, /^127\./, /^169\.254\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./];

/**
 * Why a link isn't allowed, or null when it's fine. A quick check for instant feedback in the form;
 * the API does the real check (including DNS and redirects) and refuses the same links.
 */
export function unsafeLinkReason(url: URL): string | null {
  if (url.protocol !== "https:" && url.protocol !== "http:") return "Only http and https links work";
  if (url.username || url.password) return "Links with a username or password aren't allowed";
  if (url.port && url.port !== "80" && url.port !== "443") return "That address is not allowed";

  const host = url.hostname.toLowerCase();
  if (host.startsWith("[")) return "That address is not allowed"; // IPv6 literal: never a recipe site
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return PRIVATE_IPV4.some((re) => re.test(host)) ? "That address is not allowed" : null;
  }
  if (!host.includes(".") || PRIVATE_HOSTNAMES.some((re) => re.test(host))) return "That address is not allowed";
  return null;
}
