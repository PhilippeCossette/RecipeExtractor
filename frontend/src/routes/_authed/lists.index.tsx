import { useCallback, useState, type ReactNode } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { AnimatePresence } from "motion/react";
import { SketchIcon } from "sketchicon";
import { ChefHatIcon, LeftToRightListBulletIcon } from "@sketchicon/hugeicons";
import { CardStack, ExpandedCard, STACK_COLORS, StackCard } from "@/components/CardStack";
import { AddToListDialog } from "@/components/lists/AddToListDialog";
import { useList, useLists } from "@/hooks/useLists";
import { useSavedRecipes } from "@/hooks/useSavedRecipes";
import type { RecipeList } from "@/types/list";

export const Route = createFileRoute("/_authed/lists/")({
  component: ListsPage,
});

/** The pinned card at the top with every saved recipe. Not a real list, so it gets its own id. */
const ALL_ID = "all-recipes";
const ALL_COLOR = "bg-paper";

const recipesLabel = (count: number) => `${count} ${count === 1 ? "recipe" : "recipes"}`;
const colorFor = (index: number) => STACK_COLORS[index % STACK_COLORS.length];

/** The list's cover image in the round icon, or a list icon when it has none. */
function ListIcon({ list }: { list: RecipeList }) {
  return list.coverImage ? (
    <img src={list.coverImage} alt="" className="size-full object-cover" />
  ) : (
    <SketchIcon icon={LeftToRightListBulletIcon} size={22} roughness={3} aria-hidden />
  );
}

const AllIcon = () => <SketchIcon icon={ChefHatIcon} size={22} roughness={3} aria-hidden />;

/**
 * The user's lists as a stack of cards, with an "All recipes" card always pinned on top.
 * Tap a card and it grows into a full page with its recipes.
 */
function ListsPage() {
  const lists = useLists();
  const saved = useSavedRecipes();
  const [openId, setOpenId] = useState<string | null>(null);
  const close = useCallback(() => setOpenId(null), []);
  const openIndex = lists.data?.findIndex((list) => list.id === openId) ?? -1;
  const open = openIndex >= 0 ? lists.data?.[openIndex] : undefined;
  const savedLabel = saved.data ? recipesLabel(saved.data.length) : "Loading...";

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Lists</h1>

      <CardStack>
        <StackCard
          layoutId={ALL_ID}
          open={openId === ALL_ID}
          onOpen={() => setOpenId(ALL_ID)}
          title="All recipes"
          subtitle={savedLabel}
          color={ALL_COLOR}
          leading={<AllIcon />}
        />
        {lists.data?.map((list, i) => (
          <StackCard
            key={list.id}
            layoutId={`list-${list.id}`}
            open={list.id === openId}
            onOpen={() => setOpenId(list.id)}
            title={list.name}
            subtitle={recipesLabel(list.recipeCount)}
            color={colorFor(i)}
            leading={<ListIcon list={list} />}
          />
        ))}
      </CardStack>

      {lists.isPending ? <p className="text-muted-foreground text-sm">Loading lists...</p> : null}
      {lists.isError ? <p className="text-destructive text-sm">{lists.error.message}</p> : null}
      {lists.data?.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No lists yet. Open "All recipes" and use "Add to list" to make one.
        </p>
      ) : null}

      <AnimatePresence>
        {openId === ALL_ID ? (
          <ExpandedCard
            key={ALL_ID}
            layoutId={ALL_ID}
            onBack={close}
            title="All recipes"
            subtitle={savedLabel}
            color={ALL_COLOR}
            leading={<AllIcon />}
          >
            <AllRecipes />
          </ExpandedCard>
        ) : open ? (
          <ExpandedCard
            key={open.id}
            layoutId={`list-${open.id}`}
            onBack={close}
            title={open.name}
            subtitle={recipesLabel(open.recipeCount)}
            color={colorFor(openIndex)}
            leading={<ListIcon list={open} />}
          >
            {open.description ? (
              <p className="mb-5 font-heading text-2xl leading-tight font-semibold text-balance">{open.description}</p>
            ) : null}
            <ListRecipes listId={open.id} />
          </ExpandedCard>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** Every saved recipe, each with an "Add to list" button. */
function AllRecipes() {
  const saved = useSavedRecipes();

  if (saved.isPending) return <p className="text-sm font-semibold text-ink/70">Loading recipes...</p>;
  if (saved.isError) return <p className="text-destructive text-sm">{saved.error.message}</p>;
  if (saved.data.length === 0) {
    return (
      <p className="text-sm font-semibold text-ink/70">
        Nothing saved yet.{" "}
        <Link to="/home" className="underline">
          Get a recipe
        </Link>
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {saved.data.map((recipe) => (
        <RecipeRow
          key={recipe.id}
          recipe={recipe}
          action={<AddToListDialog recipeId={recipe.id} />}
        />
      ))}
    </ul>
  );
}

/** The recipes inside one list. */
function ListRecipes({ listId }: { listId: string }) {
  const list = useList(listId);

  if (list.isPending) return <p className="text-sm font-semibold text-ink/70">Loading recipes...</p>;
  if (list.isError) return <p className="text-destructive text-sm">{list.error.message}</p>;
  if (list.data.recipes.length === 0) {
    return (
      <p className="text-sm font-semibold text-ink/70">
        No recipes in this list yet. Open "All recipes" and use "Add to list".
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {list.data.recipes.map((recipe) => (
        <RecipeRow key={recipe.id} recipe={recipe} />
      ))}
    </ul>
  );
}

/** One recipe as a white doodle card: tap it to open the recipe. `action` sits on the right (e.g. a button). */
function RecipeRow({
  recipe,
  action,
}: {
  recipe: { id: string; title: string; siteName: string | null; image: string | null };
  action?: ReactNode;
}) {
  return (
    <li className="flex items-center gap-2 rounded-2xl border-2 border-ink bg-paper p-2 pr-3 shadow-doodle">
      <Link
        to="/recipes/$recipeId"
        params={{ recipeId: recipe.id }}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        {recipe.image ? (
          <img src={recipe.image} alt="" className="size-16 shrink-0 rounded-xl border-2 border-ink object-cover" />
        ) : (
          <span className="size-16 shrink-0 rounded-xl border-2 border-ink bg-muted" />
        )}
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 font-heading text-lg leading-tight font-semibold hover:underline">
            {recipe.title}
          </span>
          <span className="block truncate text-xs font-semibold text-ink/70">{recipe.siteName ?? "Recipe"}</span>
        </span>
      </Link>
      {action}
    </li>
  );
}
