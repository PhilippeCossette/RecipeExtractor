import { spawn } from "node:child_process";
import { config } from "../../config/index.js";

let ffmpegAvailable = null;

/** True if ffmpeg can be run. Checked once, then cached. */
export async function hasFfmpeg() {
  if (ffmpegAvailable !== null) return ffmpegAvailable;
  ffmpegAvailable = await new Promise((resolve) => {
    const proc = spawn(config.transcription.ffmpegPath, ["-version"], { stdio: "ignore" });
    proc.on("error", () => resolve(false));
    proc.on("close", (code) => resolve(code === 0));
  });
  return ffmpegAvailable;
}

/**
 * Turn any audio/video buffer into a small mono 16 kHz MP3 (speech quality),
 * so a 60 MB video becomes ~1 MB of audio. Requires ffmpeg.
 */
export function convertToAudio(buffer) {
  return new Promise((resolve, reject) => {
    const args = ["-hide_banner", "-loglevel", "error", "-i", "pipe:0", "-vn", "-ac", "1", "-ar", "16000", "-b:a", "48k", "-f", "mp3", "pipe:1"];
    const proc = spawn(config.transcription.ffmpegPath, args);
    const chunks = [];
    let stderr = "";

    proc.stdout.on("data", (chunk) => chunks.push(chunk));
    proc.stderr.on("data", (chunk) => (stderr += chunk));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve(Buffer.concat(chunks));
      else reject(new Error(`ffmpeg couldn't read this file${stderr ? `: ${stderr.trim().split("\n").pop()}` : ""}`));
    });

    proc.stdin.on("error", () => {}); // ffmpeg may close stdin early on bad input; the close handler reports it
    proc.stdin.end(buffer);
  });
}
