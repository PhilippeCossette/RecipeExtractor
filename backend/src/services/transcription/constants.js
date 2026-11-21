/** File types OpenAI's transcription API accepts as-is. */
export const DIRECTLY_SUPPORTED_EXTENSIONS = new Set([
  "flac", "m4a", "mp3", "mp4", "mpeg", "mpga", "oga", "ogg", "wav", "webm",
]);

/** Anything audio/video can be converted by ffmpeg when it's installed (.mov screen recordings, .3gp...). */
export const ACCEPTED_MIME_RE = /^(audio|video)\//i;
