import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { isPublicIp } from "./isPublicIp.js";

/**
 * Resolve the URL's hostname and throw if ANY of its addresses is private (e.g. a public-looking
 * domain pointing at 127.0.0.1 or the cloud metadata IP). Call it before every request, including each redirect.
 */
export async function assertPublicHost(url) {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) {
    if (!isPublicIp(host)) throw new Error("That address is not allowed");
    return;
  }
  let addresses;
  try {
    addresses = await lookup(host, { all: true, verbatim: true });
  } catch {
    throw new Error(`Couldn't find the site ${host}`);
  }
  if (!addresses.length || addresses.some((a) => !isPublicIp(a.address))) {
    throw new Error("That address is not allowed");
  }
}
