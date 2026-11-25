import { Link, createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AddToListDialog } from "@/components/lists/AddToListDialog";
import { RecipeResult } from "@/components/RecipeResult";
import { Badge } from "@/components/ui/badge";
import { useSavedRecipe } from "@/hooks/useSavedRecipes";

const SearchSchema = z.object({
  already: z.boolean().optional().catch(undefined), // set when the link had been saved before
});

export const Route = createFileRoute("/_authed/recipes/$recipeId")({
  validateSearch: SearchSchema,
  component: SavedRecipePage,
});

/** One saved recipe, with the lists it's in and "Add to list". */
function SavedRecipePage() {
  const { recipeId } = Route.useParams();
  const { already } = Route.useSearch();
  const recipe = useSavedRecipe(recipeId);
  const lists = recipe.data?.lists ?? [];

  return (
    <div className="flex flex-col gap-4">
      <Link to="/recipes" className="text-muted-foreground text-sm hover:underline">
        ← Saved recipes
      </Link>
      {already ? (
        <p role="status" className="bg-muted rounded-md px-3 py-2 text-sm">
          You already saved this recipe, so here it is.
        </p>
      ) : null}
      {recipe.isPending ? <p className="text-muted-foreground text-sm">Loading...</p> : null}
      {recipe.isError ? <p className="text-destructive text-sm">{recipe.error.message}</p> : null}
      {recipe.data ? (
        <RecipeResult
          recipe={recipe.data.data}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {lists.map((list) => (
                <Badge key={list.id} variant="secondary" asChild>
                  <Link to="/lists/$listId" params={{ listId: list.id }}>
                    {list.name}
                  </Link>
                </Badge>
              ))}
              <AddToListDialog recipeId={recipe.data.id} inLists={lists} />
            </div>
          }
        />
      ) : null}
    </div>
  );
}
