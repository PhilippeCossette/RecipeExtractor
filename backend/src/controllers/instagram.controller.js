import { extractInstagramRecipe } from "../services/instagram/index.js";
import { readVideoRequest } from "../utils/readVideoRequest.js";

/**
 * GET  /instagram?url=...&caption=...
 * POST /instagram  JSON { url?, caption? }
 */
export async function instagramController(req, res) {
  const input = readVideoRequest(req);
  if (input.error) return res.status(400).json({ error: input.error });
  if (!input.url && !input.caption) {
    return res.status(400).json({ error: "Send 'url', 'caption', or both" });
  }
  res.json(await extractInstagramRecipe({ url: input.url, caption: input.caption }));
}
