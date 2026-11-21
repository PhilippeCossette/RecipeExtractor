import { extractYouTubeRecipe } from "../services/youtube/index.js";
import { readVideoRequest } from "../utils/readVideoRequest.js";

/**
 * GET  /youtube?url=...&caption=...
 * POST /youtube  JSON { url?, caption? }
 */
export async function youtubeController(req, res) {
  const input = readVideoRequest(req);
  if (input.error) return res.status(400).json({ error: input.error });
  if (!input.url && !input.caption) {
    return res.status(400).json({ error: "Send 'url', 'caption', or both" });
  }
  res.json(await extractYouTubeRecipe({ url: input.url, caption: input.caption }));
}
