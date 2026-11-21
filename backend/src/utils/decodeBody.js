/**
 * Decode a response body. Most sites are UTF-8 even when they say otherwise,
 * so try strict UTF-8 first, then the charset from Content-Type, then Windows-1252.
 */
export function decodeBody(buffer, contentType) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    const charset = contentType?.match(/charset=([\w-]+)/i)?.[1] || "windows-1252";
    try {
      return new TextDecoder(charset).decode(buffer);
    } catch {
      return new TextDecoder("windows-1252").decode(buffer);
    }
  }
}
