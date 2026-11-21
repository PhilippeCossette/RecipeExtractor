import { z } from "zod";
import { assertPublicUrl, normalizeUrlInput } from "../utils/index.js";

const MAX_INPUT = 4000; // pasted share text can be longer than the link itself
const MAX_URL = 2048;

/**
 * A link pasted by a user, made safe before anything is fetched:
 *   - pulls the URL out of pasted share text, adds https:// to a bare domain
 *   - http(s) only, at most 2048 characters, no user:password@, standard ports only
 *   - no localhost, private or reserved IPs, no local hostnames
 * The server also checks DNS and every redirect when it fetches (utils/safeFetch.js).
 * Output: the cleaned URL string.
 */
export const SafeUrlSchema = z
  .string({ error: "Send a link" })
  .max(MAX_INPUT, "That's too long to be a link")
  .transform((input, ctx) => {
    const candidate = normalizeUrlInput(input);
    if (!candidate) {
      ctx.addIssue({ code: "custom", message: "That doesn't look like a link" });
      return z.NEVER;
    }
    if (candidate.length > MAX_URL) {
      ctx.addIssue({ code: "custom", message: "That link is too long" });
      return z.NEVER;
    }
    let url;
    try {
      url = new URL(candidate);
    } catch {
      ctx.addIssue({ code: "custom", message: "That doesn't look like a link" });
      return z.NEVER;
    }
    try {
      assertPublicUrl(url);
    } catch (err) {
      ctx.addIssue({ code: "custom", message: err.message });
      return z.NEVER;
    }
    url.hash = ""; // never needed, and keeps logs clean
    return url.href;
  });

/** POST /recipe { url } and GET /recipe?url= */
export const RecipeUrlSchema = z.object({ url: SafeUrlSchema });
