// Query parameters that only track where a click came from; they never change the page.
const TRACKING_PARAM_RE = /^(utm_\w+|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|igsh|igshid|si|feature|ref|ref_src|_ga|_gl|share_\w+|is_from_webapp|sender_device)$/i;

/**
 * The same page written one way, for comparing links:
 *   "https://WWW.Site.com/recette/?utm_source=x&b=2&a=1#comments" -> "site.com/recette?a=1&b=2"
 * Ignores http vs https, "www.", the #fragment, tracking parameters, parameter order and a trailing slash.
 * Returns null for something that isn't a URL.
 */
export function canonicalUrl(input) {
  let url;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const params = [...url.searchParams]
    .filter(([key]) => !TRACKING_PARAM_RE.test(key))
    .sort(([a], [b]) => a.localeCompare(b));
  const query = new URLSearchParams(params).toString();
  return `${host}${path === "/" ? "" : path}${query ? `?${query}` : ""}`;
}
