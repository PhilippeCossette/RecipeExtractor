# Recipe Frontend (TanStack Start + Query + Form, shadcn, zod)

A basic frontend for the recipe API in `../recipe-extractor-node`: sign in, get a recipe from a link, save it, see your saved recipes.

```bash
npm install
npm run dev        # http://localhost:3001
npm run typecheck
```

The API must be running too (`npm start` in `recipe-extractor-node`, port 3000), with its Neon database set up. To point at another API, copy `.env.example` to `.env` and set `VITE_API_URL`.

Sign-in uses the API's session cookie, so the frontend must run on an origin listed in the API's `APP_ORIGINS` (default `http://localhost:3001`).

## Pages

| URL | |
|---|---|
| `/` | goes to `/home` |
| `/auth` | sign in, with a button to switch to sign up |
| `/home` | paste any link or share text (website, TikTok, Instagram, YouTube). A popup shows each step live (POST /recipe/stream); on success the recipe is saved and `/recipes/:id` opens, otherwise the popup shows why (signed in) |
| `/recipes` | your saved recipes, open or delete (signed in) |
| `/recipes/:recipeId` | one saved recipe, its list badges and "Add to list" (tick lists, or create one) (signed in) |
| `/lists` | your lists + a form to create one (signed in) |
| `/lists/:listId` | a list's recipes; Edit (name, description), Remove a recipe, Delete the list (signed in) |
| `/profile` | your name, email, sign out (signed in) |
| `/admin?days=30` | API costs: totals, by service / route / user / day, latest requests (admins only) |

Signed-out visitors to a signed-in page go to `/auth`; signed-in visitors to `/auth` go to `/home`.

## Forms

Every form uses TanStack Form through `useAppForm` (`src/hooks/useAppForm.ts`), with a zod schema from `src/validators/`:

```tsx
const form = useAppForm({
  defaultValues: { email: "" },
  validators: { onSubmit: MySchema },          // zod; errors show under each field
  onSubmit: async ({ value }) => { ... },
});

<form.AppField name="email">{(field) => <field.TextField label="Email" type="email" />}</form.AppField>
<form.AppForm>
  <form.FormError />                           {/* form-level errors, e.g. from the API */}
  <form.SubmitButton label="Save" />
</form.AppForm>
```

For an API error, return a string from an `onSubmitAsync` validator (see `SignInForm.tsx`). It shows in `<form.FormError />`.

## Structure

```
src/
  router.tsx               getRouter(): router + QueryClient
  styles.css               Tailwind + the shadcn theme
  routes/
    __root.tsx             <html> shell
    index.tsx              / -> /home
    auth.tsx               /auth
    _authed.tsx            layout for signed-in pages: checks the session, shows the nav
    _authed/               home.tsx, recipes.index.tsx, recipes.$recipeId.tsx, profile.tsx
  components/
    ui/                    shadcn components (button, input, label, card, select): add more with `npx shadcn@latest add <name>`
    form/                  TanStack Form fields shared by every form: TextField, SelectField, SubmitButton, FormError
    auth/                  AuthForm (the card + switch button), SignInForm, SignUpForm
    AppNav.tsx             Home / Recipes / Lists / Profile (+ Admin for admins)
    admin/                 PeriodForm, CostTable
    lists/                 ListForm (create / edit), AddToListDialog (checkboxes + new list)
    RecipeForm.tsx         one link box + button; shows what it detected (no type to pick)
    RecipeResult.tsx       a recipe: title, image, ingredients, steps
    ExtractRecipeDialog.tsx  shadcn Dialog + Spinner: live steps, Cancel, or the error
  lib/
    authClient.ts          Better Auth client (talks to <API>/api/auth)
    sessionQuery.ts        cached session for the route guards
    utils.ts               cn() for shadcn
  hooks/                   useAppForm (TanStack Form), useExtractRecipe, useSavedRecipes (TanStack Query)
  validators/              zod schemas for the forms (auth, recipe link)
  api/                     streamRecipe (reads the API's status lines), savedRecipes, adminCosts, apiRequest
  types/recipe.ts          the API's response shapes
  utils/                   one function per file
```
