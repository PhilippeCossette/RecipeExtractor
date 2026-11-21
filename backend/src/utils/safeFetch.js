import { assertPublicHost } from "./assertPublicHost.js";
import { assertPublicUrl } from "./assertPublicUrl.js";

const MAX_REDIRECTS = 5;

/**
 * fetch() for URLs that came from users: follows redirects one at a time and checks every hop
 * (scheme, no credentials, public IPs after DNS) BEFORE requesting it, so a public page can't
 * redirect the server to an internal address. Returns the final Response; res.url is the final URL.
 *
 * @param {string | URL} input
 * @param {RequestInit} [init] `redirect` is ignored (always handled here)
 */
export async function safeFetch(input, init = {}) {
  let url = new URL(input);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    assertPublicUrl(url);
    await assertPublicHost(url);

    const res = await fetch(url, { ...init, redirect: "manual" });
    const location = res.headers.get("location");
    if (res.status < 300 || res.status >= 400 || !location) {
      // fetch with redirect: "manual" leaves res.url as the requested URL, which is what we want here.
      return Object.defineProperty(res, "url", { value: url.href });
    }
    await res.body?.cancel(); // don't keep the redirect's body around
    url = new URL(location, url);
  }
  throw new Error("Too many redirects");
}
