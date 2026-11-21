import OpenAI, { toFile } from "openai";
import { config } from "../../config/index.js";
import { pricing } from "../../config/pricing.js";
import { recordCost } from "../cost/index.js";
import { DIRECTLY_SUPPORTED_EXTENSIONS } from "./constants.js";
import { convertToAudio, hasFfmpeg } from "./convertToAudio.js";
import { getOpenAIClient } from "./openaiClient.js";
import { reportProgress } from "../progress/index.js";

const fail = (reason) => ({ ok: false, reason });
const extensionOf = (name) => String(name).split(".").pop().toLowerCase();

/** Pick what to send: a small MP3 via ffmpeg when available, otherwise the original file if OpenAI accepts it. */
async function prepareAudio({ buffer, filename }) {
  if (await hasFfmpeg()) {
    return { data: await convertToAudio(buffer), name: "audio.mp3" };
  }
  if (!DIRECTLY_SUPPORTED_EXTENSIONS.has(extensionOf(filename))) {
    throw new Error(
      `.${extensionOf(filename)} files need ffmpeg installed on the server. ` +
        `Send an .mp4, .m4a, .mp3, .wav or .webm file instead.`
    );
  }
  return { data: buffer, name: filename };
}

/** Note the call's cost. OpenAI bills by audio length: from its usage block when it sends seconds, else the known video length. */
function recordTranscriptionCost(result, durationSeconds) {
  const model = config.transcription.model;
  const seconds = result.usage?.type === "duration" ? result.usage.seconds : durationSeconds ?? null;
  const perMinute = pricing.transcriptionPerMinute[model];
  const usd = seconds != null && perMinute != null ? (seconds / 60) * perMinute : null;
  recordCost({ service: "transcription", model, seconds, usd });
}

/**
 * Speech-to-text for an uploaded video or audio file.
 * `durationSeconds` (optional) is only used to estimate the cost when OpenAI doesn't report it.
 * Returns { ok: true, text } or { ok: false, reason }. Never throws.
 */
export async function transcribeAudio({ buffer, filename, durationSeconds }) {
  if (!config.transcription.enabled) {
    return fail("Transcription is off. Set OPENAI_API_KEY to turn it on.");
  }

  let audio;
  try {
    audio = await prepareAudio({ buffer, filename });
  } catch (err) {
    return fail(err.message);
  }
  if (audio.data.length > config.transcription.maxFileBytes) {
    return fail("The file is over 25 MB. Install ffmpeg on the server (it shrinks videos to audio), or send a shorter clip.");
  }

  try {
    reportProgress("transcribe");
    const result = await getOpenAIClient().audio.transcriptions.create({
      file: await toFile(audio.data, audio.name),
      model: config.transcription.model,
    });
    recordTranscriptionCost(result, durationSeconds);
    const text = result.text?.trim();
    return text ? { ok: true, text, source: "speech-to-text" } : fail("No speech was found in the video.");
  } catch (err) {
    console.error("Transcription failed:", err);
    if (err instanceof OpenAI.AuthenticationError) return fail("Transcription failed: the OpenAI API key is invalid.");
    if (err instanceof OpenAI.RateLimitError) return fail("Transcription failed: rate limited, try again shortly.");
    if (err instanceof OpenAI.APIError) return fail(`Transcription failed: OpenAI API error ${err.status ?? ""}`.trim());
    return fail(`Transcription failed: ${err.message}`);
  }
}
