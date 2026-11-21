import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addRecipeToList,
  createList,
  deleteList,
  getList,
  getLists,
  removeRecipeFromList,
  updateList,
  type ListInput,
} from "@/api/lists";

export const LISTS_KEY = ["lists"] as const;

/** All of the user's lists (with counts). */
export function useLists() {
  return useQuery({ queryKey: LISTS_KEY, queryFn: getLists });
}

/** One list with its recipes. */
export function useList(id: string) {
  return useQuery({ queryKey: [...LISTS_KEY, id], queryFn: () => getList(id) });
}

/** After any list change: lists, the list pages and saved recipes (their "in lists") may be stale. */
function useRefreshLists() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: LISTS_KEY }),
      queryClient.invalidateQueries({ queryKey: ["saved-recipes"] }),
    ]);
}

export function useCreateList() {
  const refresh = useRefreshLists();
  return useMutation({ mutationFn: (input: ListInput) => createList(input), onSuccess: refresh });
}

export function useUpdateList(id: string) {
  const refresh = useRefreshLists();
  return useMutation({ mutationFn: (changes: Partial<ListInput>) => updateList(id, changes), onSuccess: refresh });
}

/**
 * Delete a list, then call `leave` (e.g. navigate to /lists) BEFORE the cache is refreshed:
 * refreshing while the deleted list's page is still open would refetch it and get a 404.
 */
export function useDeleteList({ leave }: { leave: () => Promise<unknown> }) {
  const queryClient = useQueryClient();
  const refresh = useRefreshLists();
  return useMutation({
    mutationFn: (id: string) => deleteList(id),
    onSuccess: async (_, id) => {
      await leave();
      queryClient.removeQueries({ queryKey: [...LISTS_KEY, id], exact: true });
      await refresh();
    },
  });
}

/** Put a recipe in a list, or take it out. */
export function useSetRecipeInList() {
  const refresh = useRefreshLists();
  return useMutation({
    mutationFn: ({ listId, recipeId, inList }: { listId: string; recipeId: string; inList: boolean }) =>
      inList ? addRecipeToList(listId, recipeId) : removeRecipeFromList(listId, recipeId),
    onSuccess: refresh,
  });
}
