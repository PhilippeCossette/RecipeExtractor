import { createFileRoute } from "@tanstack/react-router";
import { ExtractRecipeDialog } from "@/components/ExtractRecipeDialog";
import { RecipeForm } from "@/components/RecipeForm";
import { useExtractRecipe } from "@/hooks/useExtractRecipe";

export const Route = createFileRoute("/_authed/home")({
  component: HomePage,
});

/** Paste a link: a popup shows each step, then the saved recipe opens (/recipes/:id), or the popup shows why it failed. */
function HomePage() {
  const extract = useExtractRecipe();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Get a recipe</h1>
      <RecipeForm pending={extract.isPending} onSubmit={(url) => extract.start(url)} />

      <ExtractRecipeDialog
        // stays open (spinner) until the recipe page has opened
        open={extract.isPending || extract.isSuccess || Boolean(extract.error)}
        statuses={extract.statuses}
        error={extract.error}
        onCancel={extract.cancel}
        onClose={extract.reset}
      />
    </div>
  );
}
