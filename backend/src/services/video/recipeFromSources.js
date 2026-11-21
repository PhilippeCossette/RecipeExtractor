import { config } from "../../config/index.js";
import { extractRecipeWithAI, toRecipeResponse } from "../ai/index.js";
import { transcribeAudio } from "../transcription/index.js";
import { recipeFromCaption } from "./recipeFromCaption.js";
import { reportProgress } from "../progress/index.js";

/**
 * Get a recipe from a video post, cheapest method first:
 *   1-2. recipeFromCaption: rules, then Claude on the caption
 *   3.   "ai-transcript": get what's said in the video, then Claude reads transcript + caption
 *
 * The transcript comes from `getTranscript` (an async function returning { ok, text, source } or
 * { ok: false, reason }), or from an uploaded `file` via speech-to-text. It is only called when
 * the caption didn't have the recipe, so nothing is downloaded or transcribed unless needed.
 *
 * @param {{ caption?: string, file?: { buffer: Buffer, filename: string }, getTranscript?: () => Promise<object>, noTranscriptReason?: string }} sources
 * @returns {Promise<object>} recipe response, or { found: false, reason, attempts }
 */
export async function recipeFromSources({ caption, file, getTranscript, noTranscriptReason = "No video file was uploaded." }) {
  const transcriptSource = getTranscript ?? (file ? () => transcribeAudio(file) : null);

  // When the audio is available as a next step, don't spend an AI call on a caption with no recipe in it.
  const fromCaption = await recipeFromCaption(caption, { skipUnlikelyCaptions: Boolean(transcriptSource) });
  if (fromCaption.found) return fromCaption;

  const { attempts, keywords } = fromCaption;
  const text = caption?.trim() || null;

  // 3. Transcript + AI
  if (!transcriptSource) {
    attempts.push({ method: "ai-transcript", reason: noTranscriptReason });
    return notFound(attempts);
  }
  if (!config.ai.enabled) {
    attempts.push({ method: "ai-transcript", reason: "AI extraction is off. Set ANTHROPIC_API_KEY to turn it on." });
    return notFound(attempts);
  }

  let transcript;
  try {
    reportProgress("get-transcript");
    transcript = await transcriptSource();
  } catch (err) {
    transcript = { ok: false, reason: err.message };
  }
  if (!transcript.ok) {
    attempts.push({ method: "ai-transcript", reason: transcript.reason });
    return notFound(attempts);
  }

  reportProgress("ai-transcript");
  const ai = await extractRecipeWithAI({ caption: text, transcript: transcript.text });
  if (ai.found) {
    return toRecipeResponse(ai.recipe, {
      extractionMethod: "ai-transcript",
      transcriptSource: transcript.source ?? null,
      caption: text,
      transcript: transcript.text,
      keywords,
    });
  }
  attempts.push({ method: "ai-transcript", reason: ai.reason });
  return { ...notFound(attempts), transcript: transcript.text };
}

function notFound(attempts) {
  return { found: false, reason: attempts.at(-1).reason, attempts };
}
