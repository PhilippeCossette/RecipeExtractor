import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { saveRecipe } from "@/api/savedRecipes";
import { streamRecipe, type RecipeStatus } from "@/api/streamRecipe";
import type { Attempt } from "@/types/recipe";

/** "No recipe found", with why each method didn't work. */
export class RecipeNotFoundError extends Error {
  constructor(
    message: string,
    readonly attempts: Attempt[] = []
  ) {
    super(message);
  }
}

/**
 * Get a recipe from a link, then save it and open it:
 *   1. stream the API's progress (statuses shows each step as it happens)
 *   2. save the recipe to the user's account (never twice: an already saved post opens the existing one)
 *   3. go to /recipes/:id (?already=true when it was saved before)
 * `cancel()` stops the request; `reset()` clears an error.
 */
export function useExtractRecipe() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statuses, setStatuses] = useState<RecipeStatus[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const mutation = useMutation({
    mutationKey: ["extract-recipe"],
    mutationFn: async (url: string) => {
      abortRef.current = new AbortController();
      setStatuses([]);
      const onStatus = (status: RecipeStatus) => setStatuses((prev) => [...prev, status]);

      const outcome = await streamRecipe(url, { onStatus, signal: abortRef.current.signal });
      // Already saved: the API recognized the link before extracting anything.
      if (outcome.kind === "existing") return { id: outcome.id, alreadySaved: true };

      const { recipe } = outcome;
      if (!recipe.found) {
        throw new RecipeNotFoundError(recipe.reason ?? "No recipe was found at that link.", recipe.attempts);
      }
      onStatus({ step: "save", message: "Saving the recipe" });
      // The API returns the existing recipe instead of a copy if the same post was saved through another link.
      const saved = await saveRecipe(recipe);
      return { id: saved.recipe.id, alreadySaved: saved.alreadySaved };
    },
    onSuccess: async ({ id, alreadySaved }) => {
      await queryClient.invalidateQueries({ queryKey: ["saved-recipes"] });
      await navigate({
        to: "/recipes/$recipeId",
        params: { recipeId: id },
        search: alreadySaved ? { already: true } : {},
      });
    },
  });

  const cancel = () => {
    abortRef.current?.abort();
    mutation.reset();
    setStatuses([]);
  };

  const wasCancelled = mutation.error?.name === "AbortError";
  return {
    start: mutation.mutate,
    statuses,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: wasCancelled ? null : mutation.error,
    cancel,
    reset: () => {
      mutation.reset();
      setStatuses([]);
    },
  };
}
