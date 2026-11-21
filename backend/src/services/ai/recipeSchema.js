import { z } from "zod";

/** The JSON shape Claude must return. Enforced by structured outputs. */
export const AiRecipeSchema = z.object({
  isRecipe: z.boolean().describe("false if the text doesn't describe how to make a dish"),
  title: z.string().nullable(),
  description: z.string().nullable().describe("one sentence about the dish, or null"),
  servings: z.number().nullable(),
  yield: z.string().nullable().describe('as stated, e.g. "12 cookies"'),
  prepMinutes: z.number().nullable(),
  cookMinutes: z.number().nullable(),
  totalMinutes: z.number().nullable(),
  ingredients: z
    .array(z.string())
    .describe('one ingredient per item, quantity first when known, e.g. "2 cups flour, sifted"'),
  instructions: z.array(z.string()).describe("one step per item, in order"),
  tips: z.array(z.string()).describe("useful tips or substitutions mentioned, or empty"),
});
