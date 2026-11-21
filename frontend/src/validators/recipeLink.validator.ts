import { z } from "zod";
import { normalizeUrlInput, unsafeLinkReason } from "@/utils";

/**
 * The "get a recipe" form: one pasted link (or share text containing one).
 * Same rules as the API's RecipeUrlSchema: http(s) only, max 2048 characters, no user:password@,
 * no localhost or private addresses. The API checks again (with DNS and redirects).
 */
export const RecipeLinkSchema = z.object({
  url: z
    .string()
    .max(4000, "That's too long to be a link")
    .superRefine((input, ctx) => {
      if (!input.trim()) return ctx.addIssue({ code: "custom", message: "Paste a link" });
      const link = normalizeUrlInput(input);
      if (!link) return ctx.addIssue({ code: "custom", message: "That doesn't look like a link" });
      if (link.length > 2048) return ctx.addIssue({ code: "custom", message: "That link is too long" });
      let url: URL;
      try {
        url = new URL(link);
      } catch {
        return ctx.addIssue({ code: "custom", message: "That doesn't look like a link" });
      }
      const reason = unsafeLinkReason(url);
      if (reason) ctx.addIssue({ code: "custom", message: reason });
    }),
});

export type RecipeLinkValues = z.infer<typeof RecipeLinkSchema>;
