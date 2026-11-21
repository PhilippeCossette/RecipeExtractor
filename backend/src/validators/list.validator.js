import { z } from "zod";

const name = z.string().trim().min(1, "Give the list a name").max(50, "At most 50 characters");
const description = z.string().trim().max(300, "At most 300 characters").transform((d) => d || null);

/** POST /lists */
export const CreateListSchema = z.object({
  name,
  description: description.nullish(),
});

/** PATCH /lists/:id: send what changes */
export const UpdateListSchema = z
  .object({ name: name.optional(), description: description.nullish() })
  .refine((v) => v.name !== undefined || v.description !== undefined, "Send a name or a description to change");

/** /lists/:id */
export const ListIdSchema = z.object({ id: z.uuid("Not a list id") });

/** /lists/:id/recipes/:recipeId */
export const ListRecipeParamsSchema = z.object({
  id: z.uuid("Not a list id"),
  recipeId: z.uuid("Not a recipe id"),
});
