import { config } from "../config/index.js";
import { decodeBody } from "./decodeBody.js";
import { safeFetch } from "./safeFetch.js";

/** Download a page as text. Returns { html, finalUrl } (finalUrl is after redirects, each one checked). */
export async function fetchHtml(url, { timeoutMs = config.fetchTimeoutMs } = {}) {
  const res = await safeFetch(url, {
    headers: config.requestHeaders,
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

  if (Number(res.headers.get("content-length")) > config.maxPageBytes) throw new Error("Page is too large");
  const buffer = await res.arrayBuffer();
  if (buffer.byteLength > config.maxPageBytes) throw new Error("Page is too large");

  return { html: decodeBody(buffer, res.headers.get("content-type")), finalUrl: res.url };
}
