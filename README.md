# RecipeExtractor

Paste a link to a recipe (a website, TikTok, Instagram reel or YouTube Short) and get a clean recipe back: title, ingredients, steps, times and servings. Recipes are saved to your account and can be sorted into lists.

| Folder | What it is | Stack |
|---|---|---|
| [`backend/`](backend/README.md) | REST API that extracts, saves and lists recipes | Node 22, Express 5, Drizzle + Neon Postgres, Better Auth, zod, Claude, OpenAI speech-to-text |
| [`frontend/`](frontend/README.md) | Web app | TanStack Start / Router / Query / Form, React 19, Tailwind 4, shadcn/ui, Motion |

Each folder has its own README with the details.

## How a link becomes a recipe

1. The frontend sends the link to `POST /recipe/stream`.
2. The API checks the link is safe (public http(s) only), then picks an extractor from its host.
3. It tries the cheapest method first and stops as soon as one works:
   - **Websites:** schema.org JSON-LD, then microdata, then an "Ingredients" heading.
   - **TikTok / Instagram / YouTube:** caption rules, then Claude on the caption, then Claude on what's said in the video (the platform's subtitles, or speech-to-text).
4. Each step is streamed back, so the app shows live progress. The recipe is then saved (once per post or page) and opened.

## Getting started

Requires Node 22+. Run the API and the app in two terminals.

```bash
# 1. API (http://localhost:3000)
cd backend
npm install
cp .env.example .env        # add DATABASE_URL, BETTER_AUTH_SECRET and any API keys
npm run db:migrate          # create the tables (once)
npm run dev

# 2. App (http://localhost:3001)
cd frontend
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:3000
npm run dev
```

Open http://localhost:3001, create an account, then paste a link.

### Keys

| Variable (`backend/.env`) | Needed for |
|---|---|
| `DATABASE_URL`, `BETTER_AUTH_SECRET` | Accounts, saved recipes, lists ([Neon](https://neon.tech)) |
| `ANTHROPIC_API_KEY` | AI extraction from messy captions and transcripts |
| `OPENAI_API_KEY` | Speech-to-text when a video has no subtitles |
| `SCRAPECREATORS_API_KEY` | TikTok, Instagram and YouTube links |

Website recipes work without any API key. See [`backend/README.md`](backend/README.md#ai-setup) for every option.

## Scripts

| Where | Command | |
|---|---|---|
| backend | `npm run dev` | API with auto-restart |
| backend | `npm test` | Test suite (`node:test`) |
| backend | `npm run db:generate` / `db:migrate` | New migration after a schema change / apply migrations |
| backend | `npm run admin:grant -- you@example.com` | Give a user access to the `/admin` cost page |
| backend | `npm run extract -- <url>` | Extract a recipe from the command line |
| frontend | `npm run dev` | App with hot reload |
| frontend | `npm run typecheck` | TypeScript check |
| frontend | `npm run build` | Production build |
