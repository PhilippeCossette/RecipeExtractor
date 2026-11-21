/**
 * WebVTT subtitles -> plain text.
 *   "WEBVTT\n\n00:00:00.140 --> 00:00:04.020\nAdd two cups of flour" -> "Add two cups of flour"
 * Drops the header, cue numbers, timestamps and tags, and repeated lines (auto-captions often repeat).
 */
export function vttToText(vtt) {
  if (!vtt || typeof vtt !== "string") return "";
  const lines = [];
  for (const raw of vtt.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line || /^WEBVTT/i.test(line) || /^(NOTE|STYLE|REGION)\b/.test(line)) continue;
    if (/-->/.test(line) || /^\d+$/.test(line)) continue; // timestamps, cue numbers
    const text = line.replace(/<[^>]+>/g, "").trim();
    if (text && text !== lines.at(-1)) lines.push(text);
  }
  return lines.join(" ").replace(/\s+/g, " ").trim();
}
