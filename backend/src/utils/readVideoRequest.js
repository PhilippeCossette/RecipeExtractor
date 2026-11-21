import { config } from "../config/index.js";
import { uploadedFile } from "../middleware/uploadVideo.middleware.js";

/**
 * Read { url, caption, file } from a query string, JSON body or multipart form.
 * Returns { error } with a message when the input is invalid.
 *
 * Not exported from utils/index.js: it imports the upload middleware, which imports services that import utils.
 * Import this file directly to avoid an import loop.
 */
export function readVideoRequest(req) {
  const url = req.query.url ?? req.body?.url;
  const caption = req.query.caption ?? req.body?.caption;
  const file = uploadedFile(req);

  if (url != null && typeof url !== "string") return { error: "'url' must be a string" };
  if (caption != null && typeof caption !== "string") return { error: "'caption' must be a string" };
  if (caption && caption.length > config.maxCaptionLength) {
    return { error: `'caption' is longer than ${config.maxCaptionLength} characters` };
  }
  return { url: url || undefined, caption: caption || undefined, file };
}
