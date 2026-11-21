import type { ReactNode } from "react";
import type { RecipeResponse } from "@/types/recipe";
import { describeMethod, formatMinutes, groupBySection } from "@/utils";

/** A recipe from the API (or a saved one). `actions` is shown under the title, e.g. a Save button. */
export function RecipeResult({ recipe, actions }: { recipe: RecipeResponse; actions?: ReactNode }) {
  if (!recipe.found) {
    return (
      <div className="flex flex-col gap-2">
        <p>No recipe found: {recipe.reason}</p>
        {recipe.attempts?.length ? (
          <ul className="text-muted-foreground list-disc pl-5 text-sm">
            {recipe.attempts.map((a) => (
              <li key={a.method}>
                {a.method}: {a.reason}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  const times = [
    ["Prep", formatMinutes(recipe.timesMinutes?.prep)],
    ["Cook", formatMinutes(recipe.timesMinutes?.cook)],
    ["Total", formatMinutes(recipe.timesMinutes?.total)],
  ].filter(([, value]) => value);
  const serves = recipe.yield ?? recipe.servings;
  const facts = [...times.map(([label, value]) => `${label}: ${value}`), ...(serves ? [`Serves: ${serves}`] : [])];

  return (
    <article className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold">{recipe.title ?? "Untitled recipe"}</h2>
        {recipe.author ? <p className="text-muted-foreground text-sm">By {recipe.author}</p> : null}
        {facts.length ? <p className="text-muted-foreground text-sm">{facts.join(" · ")}</p> : null}
        {actions ? <div className="mt-2">{actions}</div> : null}
      </div>

      {recipe.image ? (
        <img src={recipe.image} alt={recipe.title ?? ""} className="max-h-80 w-full max-w-sm rounded-lg object-cover" />
      ) : null}
      {recipe.description ? <p>{recipe.description}</p> : null}

      <section>
        <h3 className="mb-2 text-lg font-semibold">Ingredients</h3>
        <ul className="list-disc pl-5">
          {recipe.ingredients?.map((ingredient, i) => (
            <li key={i}>{ingredient}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-lg font-semibold">Steps</h3>
        {groupBySection(recipe.instructions ?? []).map((group) => (
          <div key={group.startIndex} className="mb-2">
            {group.section ? <h4 className="font-medium">{group.section}</h4> : null}
            {/* start keeps the numbering going across sections */}
            <ol start={group.startIndex + 1} className="flex list-decimal flex-col gap-1 pl-5">
              {group.items.map((step, i) => (
                <li key={i}>{step.text}</li>
              ))}
            </ol>
          </div>
        ))}
      </section>

      {recipe.tips?.length ? (
        <section>
          <h3 className="mb-2 text-lg font-semibold">Tips</h3>
          <ul className="list-disc pl-5">
            {recipe.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-muted-foreground text-xs">
        {describeMethod(recipe.extractionMethod, recipe.transcriptSource)}
        {recipe.sourceUrl ? (
          <>
            {" · "}
            <a href={recipe.sourceUrl} target="_blank" rel="noreferrer" className="underline">
              Source
            </a>
          </>
        ) : null}
      </p>
    </article>
  );
}
