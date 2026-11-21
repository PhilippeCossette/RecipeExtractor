import { z } from "zod";

const text = (max) => z.string().trim().max(max);
const optionalText = (max) => text(max).nullish();

/**
 * A recipe as /extract, /tiktok or /video returns it (found: true). Only the fields the app relies on are checked;
 * other fields (nutrition, rating, keywords...) are kept as they are.
 */
export const RecipeSchema = z.looseObject({
  found: z.literal(true, { error: "Only found recipes can be saved" }),
  title: optionalText(300),
  description: optionalText(5000),
  sourceUrl: z.url().max(2000).nullish(),
  siteName: optionalText(200),
  image: z.url().max(4000).nullish(),
  author: optionalText(200),
  ingredients: z.array(text(1000)).min(1, "A recipe needs at least one ingredient").max(300),
  instructions: z
    .array(z.looseObject({ section: optionalText(300), text: text(5000) }))
    .max(300)
    .default([]),
});

/** POST /recipes */
export const SaveRecipeSchema = z.object({
  recipe: RecipeSchema,
});

/** /recipes/:id */
export const RecipeIdSchema = z.object({
  id: z.uuid("Not a recipe id"),
});

/** GET /recipes?limit=&offset= */
export const ListRecipesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
