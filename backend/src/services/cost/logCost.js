import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { config } from "../../config/index.js";

const usd = (n) => (n === null ? "$?" : `$${n.toFixed(4)}`);

function describeItem(item) {
  if (item.service === "claude") return `${item.model} ${item.inputTokens} in / ${item.outputTokens} out ${usd(item.usd)}`;
  if (item.service === "transcription") return `${item.model} ${item.seconds ?? "?"} s ${usd(item.usd)}`;
  return `${item.service} ${usd(item.usd)}`;
}

/**
 * Print one line per request and append it to the JSON-lines cost log (config.costLog.file).
 * Never throws: a logging problem must not break the request.
 */
export async function logCost({ method, path, status, durationMs, summary }) {
  if (!config.costLog.enabled) return;

  const parts = summary.items.map(describeItem).join(" + ") || "no paid calls";
  console.log(`[cost] ${method} ${path} ${status} ${usd(summary.totalUsd)} in ${(durationMs / 1000).toFixed(1)} s (${parts})`);

  if (!config.costLog.file) return;
  const entry = { time: new Date().toISOString(), method, path, status, durationMs, ...summary };
  try {
    await mkdir(dirname(config.costLog.file), { recursive: true });
    await appendFile(config.costLog.file, JSON.stringify(entry) + "\n");
  } catch (err) {
    console.error("Couldn't write the cost log:", err.message);
  }
}
