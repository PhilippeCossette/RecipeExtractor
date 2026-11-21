import { useAppForm } from "@/hooks/useAppForm";
import type { RecipeSource } from "@/types/recipe";
import { detectSource, normalizeUrlInput } from "@/utils";
import { RecipeLinkSchema, type RecipeLinkValues } from "@/validators/recipeLink.validator";

type Props = {
  onSubmit: (url: string) => void;
  pending: boolean;
};

const defaultValues: RecipeLinkValues = { url: "" };
const SOURCE_LABELS: Record<RecipeSource, string> = {
  website: "Recipe website",
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
};

/**
 * One box for any link (or pasted share text). No type to pick: the API sends it to the right
 * extractor from its host; the form only shows what it detected. The request runs in the page (TanStack Query).
 */
export function RecipeForm({ onSubmit, pending }: Props) {
  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: RecipeLinkSchema },
    onSubmit: ({ value }) => onSubmit(normalizeUrlInput(value.url) ?? value.url.trim()),
  });

  return (
    <form
      noValidate
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <form.AppField name="url">
          {(field) => (
            <field.TextField
              label="Recipe, TikTok, Instagram or YouTube link"
              hideLabel
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              placeholder="Paste a recipe, TikTok, Instagram or YouTube link"
              className="flex flex-1 flex-col gap-1"
            />
          )}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton label="Get recipe" pendingLabel="Getting recipe..." pending={pending} />
        </form.AppForm>
      </div>
      <form.Subscribe selector={(state) => detectSource(state.values.url)}>
        {(source) =>
          source ? <p className="text-muted-foreground text-xs">Detected: {SOURCE_LABELS[source]}</p> : null
        }
      </form.Subscribe>
    </form>
  );
}
