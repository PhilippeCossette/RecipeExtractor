import { Link, createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDeleteRecipe, useSavedRecipes } from "@/hooks/useSavedRecipes";

export const Route = createFileRoute("/_authed/recipes/")({
  component: RecipesPage,
});

/** The signed-in user's saved recipes. */
function RecipesPage() {
  const recipes = useSavedRecipes();
  const remove = useDeleteRecipe();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Saved recipes</h1>

      {recipes.isPending ? <p className="text-muted-foreground text-sm">Loading...</p> : null}
      {recipes.isError ? <p className="text-destructive text-sm">{recipes.error.message}</p> : null}
      {recipes.data?.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nothing saved yet.{" "}
          <Link to="/home" className="underline">
            Get a recipe
          </Link>
        </p>
      ) : null}

      <ul className="flex flex-col gap-2">
        {recipes.data?.map((recipe) => (
          <li key={recipe.id}>
            <Card className="py-3">
              <CardContent className="flex items-center gap-3">
                {recipe.image ? (
                  <img src={recipe.image} alt="" className="size-12 shrink-0 rounded-md object-cover" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <Link to="/recipes/$recipeId" params={{ recipeId: recipe.id }} className="font-medium hover:underline">
                    {recipe.title}
                  </Link>
                  <p className="text-muted-foreground truncate text-xs">
                    {recipe.siteName ?? "Recipe"} · saved {new Date(recipe.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={remove.isPending && remove.variables === recipe.id}
                  onClick={() => remove.mutate(recipe.id)}
                >
                  Delete
                </Button>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
