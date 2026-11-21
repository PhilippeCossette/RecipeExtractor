import { hostnameOf } from "../utils/index.js";
import { recipeFromSources } from "../services/video/index.js";
import { readVideoRequest } from "../utils/readVideoRequest.js";

/**
 * POST /video  multipart { video, caption?, url? }
 * For any short-form video (Instagram Reels, YouTube Shorts, a screen recording...).
 * `url` is only stored as the source; nothing is downloaded from it.
 */
export async function videoController(req, res) {
  const input = readVideoRequest(req);
  if (input.error) return res.status(400).json({ error: input.error });
  if (!input.file && !input.caption) {
    return res.status(400).json({ error: "Upload a file in the 'video' field (multipart/form-data), or send a 'caption'" });
  }

  const result = await recipeFromSources({ caption: input.caption, file: input.file });
  res.json({ ...result, sourceUrl: input.url ?? null, siteName: input.url ? hostnameOf(input.url) : null });
}
