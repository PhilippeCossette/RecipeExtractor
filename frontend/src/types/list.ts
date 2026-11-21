/** A row in GET /lists. */
export type RecipeList = {
  id: string;
  name: string;
  description: string | null;
  visibility: "private" | string; // only "private" today; sharing will add more
  createdAt: string;
  updatedAt: string;
  recipeCount: number;
  coverImage: string | null;
};

/** GET /lists/:id */
export type RecipeListDetail = Omit<RecipeList, "recipeCount" | "coverImage"> & {
  ownerId: string;
  recipes: {
    id: string;
    title: string;
    sourceUrl: string | null;
    siteName: string | null;
    image: string | null;
    createdAt: string;
    addedAt: string;
  }[];
  permissions: { edit: boolean; isOwner: boolean };
};

/** A list a recipe is in (GET /recipes/:id -> recipe.lists). */
export type ListRef = { id: string; name: string };
