import { config } from "../../config/index.js";
import { transcribeAudio } from "../transcription/index.js";
import { tiktokProvider } from "./provider/index.js";
import { reportProgress } from "../progress/index.js";

const MIN_SUBTITLE_CHARS = 40; // shorter subtitles are usually just "music" or a word or two

/**
 * What's said in a TikTok video, cheapest source first:
 *   1. "tiktok-subtitles"  TikTok's own captions, already returned by the TikTok API (free)
 *   2. "speech-to-text"    the server downloads the video and OpenAI transcribes it
 * Returns { ok: true, text, source } or { ok: false, reason }.
 */
export async function getTikTokTranscript(video) {
  if (video.subtitles && video.subtitles.length >= MIN_SUBTITLE_CHARS) {
    return { ok: true, text: video.subtitles, source: "tiktok-subtitles" };
  }

  const downloadUrl = video.smallVideoUrl || video.videoUrl; // smallest quality: same sound, much smaller file
  if (!downloadUrl) return { ok: false, reason: "The TikTok API didn't return a video to transcribe." };
  if (!config.transcription.enabled) {
    return { ok: false, reason: "This video has no subtitles, and transcription is off. Set OPENAI_API_KEY to turn it on." };
  }
  if (video.durationSeconds && video.durationSeconds > config.scrapeCreators.maxVideoSeconds) {
    return { ok: false, reason: `The video is longer than ${Math.round(config.scrapeCreators.maxVideoSeconds / 60)} minutes.` };
  }

  let file;
  try {
    reportProgress("download-video");
    file = await tiktokProvider.downloadVideo(downloadUrl);
  } catch (err) {
    return { ok: false, reason: `Couldn't download the video: ${err.message}` };
  }
  return transcribeAudio({ ...file, durationSeconds: video.durationSeconds });
}
