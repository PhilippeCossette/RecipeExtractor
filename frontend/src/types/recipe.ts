/** Where a link is from. The API picks it from the link's host (POST /recipe); the form only shows it. */
export type RecipeSource = "website" | "tiktok" | "instagram" | "youtube";

export type ParsedIngredient = {
  raw: string;
  quantity: number | null;
  quantityMax: number | null;
  unit: string | null;
  name: string;
  notes: string | null;
};

export type InstructionStep = { section: string | null; text: string };

export type Attempt = { method: string; reason: string };

/** What the recipe API returns. Most fields are only there when `found` is true. */
export type RecipeResponse = {
  found: boolean;
  platform?: RecipeSource;
  reason?: string;
  attempts?: Attempt[];
  warnings?: string[];
  extractionMethod?: string;
  transcriptSource?: string | null;
  sourceUrl?: string | null;
  siteName?: string | null;
  title?: string | null;
  description?: string | null;
  author?: string | null;
  image?: string | null;
  timesMinutes?: { prep: number | null; cook: number | null; total: number | null };
  yield?: string | null;
  servings?: number | null;
  ingredients?: string[];
  ingredientsParsed?: ParsedIngredient[];
  instructions?: InstructionStep[];
  tips?: string[];
};

/** A row in GET /recipes (the list, without the full recipe). */
export type SavedRecipeSummary = {
  id: string;
  title: string;
  sourceUrl: string | null;
  siteName: string | null;
  image: string | null;
  createdAt: string;
};

/** GET /recipes/:id: the saved row, with the full recipe in `data` and the user's lists it's in. */
export type SavedRecipe = SavedRecipeSummary & {
  userId: string;
  data: RecipeResponse;
  lists?: { id: string; name: string }[];
};
