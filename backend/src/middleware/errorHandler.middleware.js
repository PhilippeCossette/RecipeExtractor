import multer from "multer";
import { config } from "../config/index.js";

// Express recognises error handlers by their 4 arguments, so `next` must stay even though it's unused.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON body" });
  }
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: `File is larger than ${Math.round(config.maxUploadBytes / 1024 / 1024)} MB` });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}. Send one file in the "video" field.` });
  }
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: "Internal error" });
}
