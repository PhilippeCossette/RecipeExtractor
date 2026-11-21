import type { RecipeSource } from "@/types/recipe";
import { normalizeUrlInput } from "./normalizeUrlInput";

/**
 * What kind of link was pasted, from its host (the API decides the same way):
 * tiktok.com -> "tiktok", instagram.com -> "instagram", youtube.com / youtu.be -> "youtube",
 * any other link -> "website", not a link -> null.
 */
export function detectSource(input: string): RecipeSource | null {
  const link = normalizeUrlInput(input);
  if (!link) return null;
  let host: string;
  try {
    host = new URL(link).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (/(^|\.)tiktok\.com$/.test(host)) return "tiktok";
  if (/(^|\.)instagram\.com$/.test(host)) return "instagram";
  if (/(^|\.)youtube\.com$/.test(host) || host === "youtu.be") return "youtube";
  return "website";
}
