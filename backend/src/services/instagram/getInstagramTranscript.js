import { config } from "../../config/index.js";
import { transcribeAudio } from "../transcription/index.js";
import { instagramProvider } from "./provider/index.js";
import { reportProgress } from "../progress/index.js";

const MIN_TRANSCRIPT_CHARS = 40; // shorter is usually just music or a word or two

/**
 * What's said in an Instagram reel, cheapest source first:
 *   1. "instagram-transcript"  ScrapeCreators' transcript (1 credit, videos up to 2 minutes)
 *   2. "speech-to-text"        the server downloads the video and OpenAI transcribes it
 * Returns { ok: true, text, source } or { ok: false, reason }.
 */
export async function getInstagramTranscript(post) {
  try {
    const text = await instagramProvider.fetchTranscript(post.url);
    if (text && text.length >= MIN_TRANSCRIPT_CHARS) return { ok: true, text, source: "instagram-transcript" };
  } catch {
    // fall through to speech-to-text
  }

  if (!post.videoUrl) return { ok: false, reason: "No speech was found in the reel." };
  if (!config.transcription.enabled) {
    return { ok: false, reason: "No transcript was available, and transcription is off. Set OPENAI_API_KEY to turn it on." };
  }
  if (post.durationSeconds && post.durationSeconds > config.scrapeCreators.maxVideoSeconds) {
    return { ok: false, reason: `The video is longer than ${Math.round(config.scrapeCreators.maxVideoSeconds / 60)} minutes.` };
  }

  let file;
  try {
    reportProgress("download-video");
    file = await instagramProvider.downloadVideo(post.videoUrl);
  } catch (err) {
    return { ok: false, reason: `Couldn't download the video: ${err.message}` };
  }
  return transcribeAudio({ ...file, durationSeconds: post.durationSeconds });
}
