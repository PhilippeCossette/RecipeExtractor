import { isIP } from "node:net";
import { isPublicIp } from "./isPublicIp.js";

const PRIVATE_HOSTNAMES = [/^localhost$/, /\.localhost$/, /\.local$/, /\.internal$/, /\.home\.arpa$/];

/**
 * Throw if the URL can't safely be fetched by the server (no network lookup; see assertPublicHost for DNS):
 * not http(s), has a user:password@, a non-standard port, an IP in a private range, or a local hostname.
 * Stops a public deployment from being used to probe internal machines (SSRF).
 */
export function assertPublicUrl(url) {
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only http/https URLs are allowed");
  if (url.username || url.password) throw new Error("Links with a username or password aren't allowed");
  if (url.port && !["80", "443"].includes(url.port)) throw new Error("That address is not allowed");

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (isIP(host)) {
    if (!isPublicIp(host)) throw new Error("That address is not allowed");
    return;
  }
  if (!host.includes(".") || PRIVATE_HOSTNAMES.some((re) => re.test(host))) {
    throw new Error("That address is not allowed");
  }
}
