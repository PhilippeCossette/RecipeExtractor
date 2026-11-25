# Recipe Frontend

The web app for [RecipeExtractor](../README.md): sign in, paste a link, get the recipe saved to your account, and sort recipes into lists. It talks to the API in [`../backend`](../backend/README.md).

**Stack:** TanStack Start (Router, Query, Form), React 19, Tailwind 4, shadcn/ui, Motion, zod, Better Auth client. Hand-drawn icons come from [sketchicon](https://sketchicon.com) (Hugeicons set).

```bash
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:3000
npm run dev            # http://localhost:3001
npm run typecheck
npm run build
```

The API must be running too (`npm run dev` in `../backend`, port 3000) with its database set up. Sign-in uses the API's session cookie, so this app must run on an origin listed in the API's `APP_ORIGINS` (default `http://localhost:3001`).

## Pages

| URL | |
|---|---|
| `/` | Goes to `/home` |
| `/auth` | Sign in, with a button to switch to sign up |
| `/home` | Paste a link or share text; a popup shows each step live, then the saved recipe opens |
| `/recipes` | Your saved recipes: open or delete |
| `/recipes/:recipeId` | One recipe, the lists it's in, and "Add to list" |
| `/lists` | Your lists as a stack of cards ("All recipes" pinned on top); a card grows into a full page |
| `/lists/:listId` | One list: edit its name and description, remove recipes, delete it |
| `/profile` | Your name, email, sign out |
| `/admin?days=30` | API costs by service, route, user and day (admins only) |

Every page except `/auth` needs a signed-in user (`routes/_authed.tsx` sends others to `/auth`).

The bottom nav (`AppNav`) has a "+" button that opens a menu of ways to add a recipe. "Paste a link" opens `PasteLinkDrawer`; the other options are marked "soon".

## Forms

Every form uses TanStack Form through `useAppForm` (`src/hooks/useAppForm.ts`) with a zod schema from `src/validators/`:

```tsx
const form = useAppForm({
  defaultValues: { email: "" },
  validators: { onSubmit: MySchema },          // errors show under each field
  onSubmit: async ({ value }) => { ... },
});

<form.AppField name="email">{(field) => <field.TextField label="Email" type="email" />}</form.AppField>
<form.AppForm>
  <form.FormError />                           {/* form-level errors, e.g. from the API */}
  <form.SubmitButton label="Save" />
</form.AppForm>
```

For an API error, return a string from an `onSubmitAsync` validator (see `SignInForm.tsx`); it shows in `<form.FormError />`.

## Styling

The "doodle" theme (ink outlines, hard shadows, pastel colors like `bg-doodle-pink`) lives in `src/styles.css`, with a cheat sheet of the classes at the top. The shadcn components in `src/components/ui/` are restyled to match. Add more with `npx shadcn@latest add <name>`.

## Structure

```
src/
  router.tsx               getRouter(): router + QueryClient
  styles.css               Tailwind + the doodle theme
  routes/                  file-based routes (see Pages); _authed/ holds the signed-in pages
  components/
    ui/                    shadcn components (button, card, dialog, drawer, select, table...)
    form/                  TanStack Form fields: TextField, SelectField, SubmitButton, FormError
    auth/                  AuthForm, SignInForm, SignUpForm
    lists/                 ListForm (create / edit), AddToListDialog
    admin/                 PeriodForm, CostTable
    AppNav.tsx             bottom nav with the "+" button
    AddRecipeButton.tsx    the "+" and its menu
    PasteLinkDrawer.tsx    paste a link, watch the steps, open the recipe
    CardStack.tsx          stacked cards that grow into a full page (lists page)
    Backdrop.tsx           dark blurred layer behind menus
    RecipeForm.tsx, ExtractRecipeDialog.tsx   link form + progress popup (home page)
    RecipeResult.tsx       a recipe: title, image, ingredients, steps
  api/                     fetch functions: streamRecipe (reads the API's status lines), savedRecipes, lists, adminCosts
  hooks/                   useAppForm, useExtractRecipe, useSavedRecipes, useLists, useAdminCosts
  lib/                     authClient (Better Auth), sessionQuery (cached session for route guards)
  validators/              zod schemas for the forms
  types/                   API response shapes
  utils/                   one small function per file
```
