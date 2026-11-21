import { extractTikTokRecipe } from "../services/tiktok/index.js";
import { readVideoRequest } from "../utils/readVideoRequest.js";

/**
 * GET  /tiktok?url=...&caption=...
 * POST /tiktok  JSON { url?, caption? }
 */
export async function tiktokController(req, res) {
  const input = readVideoRequest(req);
  if (input.error) return res.status(400).json({ error: input.error });
  if (!input.url && !input.caption) {
    return res.status(400).json({ error: "Send 'url', 'caption', or both" });
  }
  res.json(await extractTikTokRecipe({ url: input.url, caption: input.caption }));
}
