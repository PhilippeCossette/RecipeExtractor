import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createList, addRecipeToList } from "@/api/lists";
import { useLists, useSetRecipeInList } from "@/hooks/useLists";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSavedRecipe } from "@/api/savedRecipes";
import type { ListRef } from "@/types/list";
import { ListForm } from "./ListForm";

/**
 * "Add to list" popup for one recipe: a checkbox per list (tick = in the list) and a box to create
 * a new list, which the recipe is put into right away.
 * `inLists`: the lists the recipe is already in. Leave it out when you don't have them (e.g. in a
 * list of recipe summaries): they're then loaded when the popup opens.
 */
export function AddToListDialog({ recipeId, inLists }: { recipeId: string; inLists?: ListRef[] }) {
  const [open, setOpen] = useState(false);
  const lists = useLists();
  const setInList = useSetRecipeInList();
  const queryClient = useQueryClient();
  // Same key as useSavedRecipe, so it refreshes after a tick (useSetRecipeInList refreshes "saved-recipes")
  const recipe = useQuery({
    queryKey: ["saved-recipes", recipeId],
    queryFn: () => getSavedRecipe(recipeId),
    enabled: open && !inLists,
  });
  const currentLists = inLists ?? recipe.data?.lists;
  const inListIds = new Set((currentLists ?? []).map((l) => l.id));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Add to list
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lists</DialogTitle>
          <DialogDescription>Tick the lists this recipe belongs in.</DialogDescription>
        </DialogHeader>

        {lists.isPending || !currentLists ? <p className="text-muted-foreground text-sm">Loading...</p> : null}
        {lists.data?.length === 0 ? <p className="text-muted-foreground text-sm">No lists yet. Create one below.</p> : null}
        <ul className="flex flex-col gap-3">
          {lists.data?.map((list) => {
            const id = `list-${list.id}`;
            const busy = setInList.isPending && setInList.variables?.listId === list.id;
            return (
              <li key={list.id} className="flex items-center gap-2">
                <Checkbox
                  id={id}
                  checked={inListIds.has(list.id)}
                  disabled={busy || !currentLists}
                  onCheckedChange={(checked) => setInList.mutate({ listId: list.id, recipeId, inList: checked === true })}
                />
                <Label htmlFor={id} className="font-normal">
                  {list.name} <span className="text-muted-foreground">({list.recipeCount})</span>
                </Label>
              </li>
            );
          })}
        </ul>
        {setInList.isError ? <p className="text-destructive text-sm">{setInList.error.message}</p> : null}

        <div className="border-t pt-4">
          <ListForm
            compact
            submitLabel="Create"
            onSave={async ({ name }) => {
              const list = await createList({ name });
              await addRecipeToList(list.id, recipeId);
              await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["lists"] }),
                queryClient.invalidateQueries({ queryKey: ["saved-recipes"] }),
              ]);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
