import type { RecipeResponse } from "@/types/recipe";
import { API_BASE_URL } from "@/utils";

export type RecipeStatus = { step: string; message: string };

/** A new recipe to save, or one the user already saved (nothing was extracted). */
export type StreamOutcome = { kind: "new"; recipe: RecipeResponse } | { kind: "existing"; id: string; title: string };

type StreamEvent =
  | ({ type: "status" } & RecipeStatus)
  | { type: "result"; recipe: RecipeResponse }
  | { type: "existing"; recipe: { id: string; title: string } }
  | { type: "error"; message: string };

/**
 * POST /recipe/stream { url }: calls onStatus for each step the API reports
 * ("Getting the video from TikTok", "Reading the caption"...) and resolves with the outcome.
 * Throws with the API's message if the link is refused (400), the stream reports an error, or it ends early.
 * Pass an AbortSignal to cancel.
 */
export async function streamRecipe(
  url: string,
  { onStatus, signal }: { onStatus: (status: RecipeStatus) => void; signal?: AbortSignal }
): Promise<StreamOutcome> {
  const res = await fetch(`${API_BASE_URL}/recipe/stream`, {
    method: "POST",
    credentials: "include", // the API uses the session to find already saved recipes and to log costs
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
    signal,
  });

  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.issues?.[0]?.message ?? body?.error ?? `The recipe API returned HTTP ${res.status}`);
  }

  // Newline-delimited JSON: read chunks, split on "\n", keep the unfinished last line for the next chunk.
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (value) buffer += value;
    const lines = buffer.split("\n");
    buffer = done ? "" : (lines.pop() ?? "");

    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line) as StreamEvent;
      if (event.type === "status") onStatus({ step: event.step, message: event.message });
      else if (event.type === "result") return { kind: "new", recipe: event.recipe };
      else if (event.type === "existing") return { kind: "existing", ...event.recipe };
      else if (event.type === "error") throw new Error(event.message);
    }
    if (done) throw new Error("The connection to the recipe API closed early. Try again.");
  }
}
