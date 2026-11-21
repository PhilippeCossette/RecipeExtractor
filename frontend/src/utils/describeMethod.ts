const TRANSCRIPT_LABELS: Record<string, string> = {
  "tiktok-subtitles": "AI read the video's subtitles",
  "youtube-captions": "AI read the video's captions",
  "instagram-transcript": "AI listened to the reel",
  "speech-to-text": "AI listened to the video",
};

/** Human-readable label for the API's extractionMethod / transcriptSource. */
export function describeMethod(method?: string, transcriptSource?: string | null): string | null {
  switch (method) {
    case "json-ld":
    case "microdata":
    case "heuristic":
      return "Read from the recipe page";
    case "caption":
      return "Read from the caption";
    case "ai-caption":
      return "AI read the caption";
    case "ai-transcript":
      return (transcriptSource && TRANSCRIPT_LABELS[transcriptSource]) || "AI listened to the video";
    default:
      return null;
  }
}
