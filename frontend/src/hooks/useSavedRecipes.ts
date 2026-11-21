import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteSavedRecipe, getSavedRecipe, listSavedRecipes } from "@/api/savedRecipes";

const SAVED_RECIPES_KEY = ["saved-recipes"] as const;

/** The signed-in user's saved recipes (dashboard). */
export function useSavedRecipes() {
  return useQuery({ queryKey: SAVED_RECIPES_KEY, queryFn: listSavedRecipes });
}

/** One saved recipe with all its data. */
export function useSavedRecipe(id: string) {
  return useQuery({ queryKey: [...SAVED_RECIPES_KEY, id], queryFn: () => getSavedRecipe(id) });
}

/** Delete a saved recipe, then refresh the dashboard list. */
export function useDeleteRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSavedRecipe(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SAVED_RECIPES_KEY }),
  });
}
