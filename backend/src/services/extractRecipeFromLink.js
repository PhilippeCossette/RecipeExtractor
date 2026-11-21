import { extractInstagramRecipe } from "./instagram/index.js";
import { extractRecipe } from "./recipe/index.js";
import { extractTikTokRecipe } from "./tiktok/index.js";
import { extractYouTubeRecipe } from "./youtube/index.js";
import { detectPlatform } from "../utils/index.js";

const EXTRACTORS = {
  tiktok: (url) => extractTikTokRecipe({ url }),
  instagram: (url) => extractInstagramRecipe({ url }),
  youtube: (url) => extractYouTubeRecipe({ url }),
  website: (url) => extractRecipe(url),
};

/**
 * Any checked link -> recipe, using the extractor that fits its host
 * (tiktok.com, instagram.com, youtube.com / youtu.be, or a recipe website).
 * Returns { platform, ...result }. The URL must already be validated (RecipeUrlSchema).
 */
export async function extractRecipeFromLink(url) {
  const platform = detectPlatform(new URL(url));
  return { platform, ...(await EXTRACTORS[platform](url)) };
}
