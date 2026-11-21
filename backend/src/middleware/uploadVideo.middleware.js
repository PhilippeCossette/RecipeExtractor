import multer from "multer";
import { config } from "../config/index.js";
import { ACCEPTED_MIME_RE } from "../services/transcription/index.js";

/**
 * Accepts one optional video/audio file in the multipart field "video", kept in memory.
 * Text fields sent alongside it (caption, url) end up in req.body.
 */
export const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes, files: 1 },
  fileFilter(req, file, accept) {
    if (ACCEPTED_MIME_RE.test(file.mimetype)) return accept(null, true);
    const err = new Error(`Unsupported file type "${file.mimetype}". Upload a video or audio file.`);
    err.status = 415;
    accept(err);
  },
}).single("video");

/** The uploaded file in the shape the services expect, or undefined. */
export const uploadedFile = (req) => (req.file ? { buffer: req.file.buffer, filename: req.file.originalname } : undefined);
