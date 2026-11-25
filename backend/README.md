# Recipe Extractor API (Node.js + Express)

Give it a URL → it tells you if there's a recipe and returns ingredients (raw + parsed), steps, times, servings, nutrition, rating and image as JSON. Part of [RecipeExtractor](../README.md); the web app is in [`../frontend`](../frontend/README.md).

Requires Node 22+.

```bash
npm install
cp .env.example .env # add your API keys (optional, for AI + video, see below)
npm start            # http://localhost:3000
npm run dev          # auto-restarts when you edit files
npm test             # run the test suite
```

## Endpoints

| Endpoint | What it does |
|---|---|
| `POST /recipe { url }` | Any link: sent to the right extractor by its host (see [One route for any link](#one-route-for-any-link-post-recipe--url-)) |
| `POST /recipe/stream { url }` | Same, with live progress (used by the frontend) |
| `GET /extract?url=<recipe url>` | Extract a recipe from a website |
| `POST /extract` with `{ "url": "..." }` | Same, URL in the body |
| `POST /tiktok` with `{ "url": "..." }` (caption optional) | Recipe from a TikTok link: caption, AI, then the video's speech (see below) |
| `GET /tiktok?url=<tiktok link>` | Same, link only |
| `POST /instagram`, `POST /youtube` with `{ "url": "..." }` | Recipe from an Instagram reel or a YouTube Short (see below) |
| `POST /video` (multipart) with `video`, optional `caption`, `url` | Recipe from any uploaded short video (Reels, Shorts...) |
| `POST /ingredients/parse` with `{ "lines": ["2 cups milk", ...] }` | Parse ingredient lines only |
| `GET /health` | `{ ok: true }` |
| `GET /` | Lists every endpoint and which features are on |

From your app:

```js
const res = await fetch("http://localhost:3000/extract?url=" + encodeURIComponent(recipeUrl));
const recipe = await res.json();
if (recipe.found) console.log(recipe.title, recipe.ingredientsParsed);
else console.log(recipe.reason);
```

## TikTok

Send a TikTok **link**; the user never downloads anything. With `SCRAPECREATORS_API_KEY` set, a paid TikTok API ([ScrapeCreators](https://scrapecreators.com), 1 credit, about $0.002 per link) returns the post's caption, TikTok's own subtitles and a video URL. The server then tries, cheapest first:

| Step | `extractionMethod` | Needs | Cost |
|---|---|---|---|
| 1. Rule-based caption parser | `caption` | | free |
| 2. Claude reads the caption | `ai-caption` | `ANTHROPIC_API_KEY` | about a cent or less |
| 3a. Claude reads TikTok's own subtitles (+ caption) | `ai-transcript`, `transcriptSource: "tiktok-subtitles"` | `ANTHROPIC_API_KEY` | about a cent; subtitles are free |
| 3b. No subtitles: the **server** downloads the video, OpenAI transcribes it, Claude reads it | `ai-transcript`, `transcriptSource: "speech-to-text"` | + `OPENAI_API_KEY` | about a cent per minute |

```js
await fetch("http://localhost:3000/tiktok", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: tiktokUrl }), // caption is optional: if your app has it, send it too
});
```

- Short links (`vm.tiktok.com/...`, `tiktok.com/t/...`) work.
- The response includes `author`, `image` (cover), `videoId`, and `transcript` when step 3 ran. Steps that didn't work are listed in `attempts`; TikTok API problems (bad key, out of credits, post not found) appear in `warnings`.
- Videos longer than `TIKTOK_MAX_VIDEO_SECONDS` (10 min) aren't downloaded. The downloaded video is kept in memory only and never saved.
- **Without `SCRAPECREATORS_API_KEY`**, the server can only use TikTok's free oEmbed endpoint, which returns no caption for most videos: send the caption yourself as `caption`, or you get `found: false`.
- The rule parser handles "Ingredients:" / "Ingrédients :" headings, one-per-line lists, `-` / `•` / `✅` bullets (even all on one line), sub-headings like "For the sauce:", numbered or unnumbered steps, "Serves 4", "Prep time: 10 min", hashtags (returned as `keywords`) and emojis.

## Uploaded videos (`/video`)

For a video file your app already has (Instagram Reels, YouTube Shorts, a screen recording). Same steps 1 and 2 on the optional `caption`, plus:

| Step | `extractionMethod` | Needs | Cost |
|---|---|---|---|
| 3. Speech-to-text on the video, then Claude reads transcript + caption | `ai-transcript` | a `video` file + `OPENAI_API_KEY` + `ANTHROPIC_API_KEY` | about a cent per minute of video |

```js
const form = new FormData();
form.append("video", videoFile); // a File / Blob: .mp4, .m4a, .mp3, .wav, .webm (.mov needs ffmpeg)
form.append("caption", captionText); // optional
const recipe = await (await fetch("http://localhost:3000/video", { method: "POST", body: form })).json();
```

With **ffmpeg** installed on the server, any video (including iPhone `.mov`) is first shrunk to a small audio file, so 100 MB videos work. Without ffmpeg, the file is sent as-is, so it must be an OpenAI-supported type and under 25 MB. Responses include the `transcript`.

When nothing works on either endpoint, you get `found: false`, a `reason`, and an `attempts` list saying why each step didn't work. AI responses also include `tips`.

### AI setup

Put keys in `.env` (copy `.env.example`). Both are optional: without them, steps 2 and 3 are skipped and explained in `attempts`. `GET /` shows which features are on.

| Variable | Default | |
|---|---|---|
| `ANTHROPIC_API_KEY` | none | turns on AI (steps 2 and 3) ([console.anthropic.com](https://console.anthropic.com)) |
| `AI_MODEL` | `claude-opus-5-5` | |
| `AI_EFFORT` | `low` | `low` / `medium` / `high`: raise it if extraction misses things |
| `OPENAI_API_KEY` | none | turns on transcription for `/video` ([platform.openai.com](https://platform.openai.com)) |
| `TRANSCRIBE_MODEL` | `gpt-4o-mini-transcribe` | |
| `FFMPEG_PATH` | `ffmpeg` | optional |
| `MAX_UPLOAD_MB` | `100` | |
| `SCRAPECREATORS_API_KEY` | none | paid TikTok API: caption, subtitles and video from a link ([scrapecreators.com](https://scrapecreators.com)) |
| `SCRAPECREATORS_REGION` | `US` | two-letter country code |
| `TIKTOK_MAX_VIDEO_SECONDS` | `600` | longer TikToks aren't downloaded for speech-to-text |

Notes:
- **Claude doesn't take audio**, so transcription uses OpenAI. Claude then structures the transcript with **structured outputs**, so the response always matches the schema in `src/services/ai/recipeSchema.js`.
- **Fallbacks are on:** if Claude's safety filter wrongly declines a request, the API automatically retries on a fallback model (`fallbacks: "default"` in `src/services/ai/extractRecipeWithAI.js`).
- **Captions and transcripts are treated as untrusted data.** The prompt tells Claude to ignore any instructions inside them.

Other environment variables: `PORT` (default 3000), `CORS_ORIGIN` (default `*`; set it to your app's domain in production), `FETCH_TIMEOUT_MS` (default 20000).

## One route for any link: `POST /recipe { url }`

`POST /recipe/stream { url }` does the same but streams JSON lines as it works: `{"type":"status","step":"read-caption","message":"Reading the caption"}` for each step (steps are in `services/progress/steps.js`), then `{"type":"result","recipe":{...}}` or `{"type":"error","message":"..."}`. The frontend uses this one.

The link is checked first (zod, `validators/recipeUrl.validator.js`), then sent to the right extractor by its host: `tiktok.com` → TikTok, `instagram.com` → Instagram, `youtube.com` / `youtu.be` → YouTube, anything else → recipe website. The response has `platform`.

**Link safety** (refused with 400 and a message):
- share text is OK ("try this https://vm.tiktok.com/… 🔥" → the link inside); a bare `www.site.com/x` gets https://
- http(s) only, max 2048 characters, no `user:password@`, standard ports only
- no localhost, private / link-local / reserved IPs (incl. IPv6 forms like `[::ffff:127.0.0.1]`), no `.local` / `.internal` hosts

When the server fetches a page or a video (`utils/safeFetch.js`), it resolves the host and checks every IP, and follows redirects one at a time, checking each before requesting it, so a public page can't redirect the server to an internal address (e.g. cloud metadata at 169.254.169.254).

## Instagram and YouTube Shorts

Same idea as TikTok, through ScrapeCreators (`SCRAPECREATORS_API_KEY`):

| Route | Steps, cheapest first |
|---|---|
| `POST /instagram { url }` | caption rules → AI on the caption → Instagram's transcript (1 credit) → download + OpenAI speech-to-text |
| `POST /youtube { url }` | rules on title + description → AI on them → YouTube's captions (1 credit) → AI |

Links: `instagram.com/reel/…`, `/reels/…`, `/p/…`; `youtube.com/shorts/…`, `/watch?v=…`, `youtu.be/…`.
YouTube videos are never downloaded: a Short with no recipe in its description and no captions comes back `found: false`.
ScrapeCreators sometimes answers 404 for a public post that works a second later, so the post lookup retries once (failed calls cost nothing).

## Admin: API costs

Every recipe request is stored in the `api_request` table: who sent it, the route, the link, its total in USD and each paid call (Claude tokens, ScrapeCreators credits, speech-to-text seconds).

Make yourself admin (sign up first):
```bash
npm run admin:grant -- you@example.com
npm run admin:revoke -- you@example.com
```
Users can't give themselves the role: it's not accepted at sign-up.

| Route (admins only) | |
|---|---|
| `GET /admin/costs/summary?days=30` | total, requests, by service (per Claude model), by route, by user, by day |
| `GET /admin/costs/requests?limit=50&offset=0` | each request with its calls and cost, newest first |

The frontend's `/admin` page shows both. Prices come from `src/config/pricing.js`; ScrapeCreators credits are read from each response (`credits_charged`).

## Accounts and saved recipes (Better Auth + Neon + Drizzle)

Users sign up with email + password (Better Auth) and save recipes to a Neon Postgres database (Drizzle ORM). Input is checked with zod. Without `DATABASE_URL` everything else still works; the account routes answer 503.

### Set up Neon (once)

1. Create a free project at https://neon.tech, then **Connect** > copy the connection string.
2. Paste it in `.env` as `DATABASE_URL=postgresql://...`, and set `BETTER_AUTH_SECRET` (the command to generate one is in `.env.example`).
3. Create the tables:
   ```bash
   npm run db:migrate
   ```
4. Restart the API (`npm start`). `GET /` now shows `"accounts": true`.

### Routes

| Route | What it does |
|---|---|
| `POST /api/auth/sign-up/email` `{ name, email, password }` | Create an account, sets the session cookie |
| `POST /api/auth/sign-in/email` `{ email, password }` | Sign in, sets the session cookie |
| `POST /api/auth/sign-out` | Sign out |
| `GET /api/auth/get-session` | Current session, or `null` |
| `GET /me` | The signed-in user |
| `GET /recipes?limit=20&offset=0` | Your saved recipes, newest first (title, image, source) |
| `POST /recipes` `{ recipe }` | Save a recipe exactly as `/extract`, `/tiktok` or `/video` returned it |
| `GET /recipes/:id` | One saved recipe with all its data |
| `DELETE /recipes/:id` | Delete one |

`/me` and `/recipes` need a signed-in user (401 otherwise), and each user only sees their own recipes. The session is a cookie: from a browser, call with `credentials: "include"`. Only origins in `APP_ORIGINS` (default `http://localhost:3001`) may send it. Mobile apps can use Better Auth's client libraries.

Try it with curl:
```bash
curl -c cookies.txt -X POST localhost:3000/api/auth/sign-up/email -H "Content-Type: application/json"   -d '{"name":"Chef","email":"chef@example.com","password":"a-long-password"}'
curl -b cookies.txt localhost:3000/me
```

### Lists ("Asian", "Quick"...)

| Route (signed in) | |
|---|---|
| `GET /lists` | your lists, by name, with `recipeCount` and a `coverImage` |
| `POST /lists { name, description? }` | create; 409 if you already have that name (letter case ignored) |
| `GET /lists/:id` | the list, its recipes (newest added first) and `permissions` |
| `PATCH /lists/:id { name?, description? }` | rename / change the description |
| `DELETE /lists/:id` | delete the list; its recipes stay saved |
| `PUT /lists/:id/recipes/:recipeId` | add one of your recipes (adding twice is fine) |
| `DELETE /lists/:id/recipes/:recipeId` | take it out |

A recipe can be in many lists; `GET /recipes/:id` also returns `lists` (the ones it's in). Deleting a recipe takes it out of every list.

**Ready for sharing later** (nothing is shared today):
- `recipe_list.visibility` is `private` for now; later e.g. `link` (anyone with the link can view) or `public`.
- `recipe_list.share_id` is empty for now; later the random id in a share link (replace it to revoke a link).
- `recipe_list_item.added_by` records who added a recipe, for shared editing.
- Who can view / edit a list is decided only in `services/lists/listAccess.js` (today: the owner). Sharing means changing that one function (and adding a members table for invites); the routes ask for "view" or "edit" and stay the same. A list someone can't see answers 404, like one that doesn't exist.

### No duplicates

Each saved recipe has a `source_key`: `tiktok:<video id>`, `instagram:<shortcode>`, `youtube:<video id>`, or `web:<cleaned url>` (no www, https, #, tracking params like utm_* / fbclid, or trailing slash). Different links to the same post give the same key (`youtu.be/x`, `/shorts/x?si=…`, `m.youtube.com/watch?v=x`).

- A unique index on (user, source_key) means a user can't save the same source twice, even with two saves at the same moment. `POST /recipes` then answers 200 with the existing recipe and `alreadySaved: true` (201 when new).
- `POST /recipe/stream` checks first: if you're signed in and already saved that link, it answers `{"type":"existing","recipe":{id,title}}` without extracting (nothing paid). TikTok short links (vm.tiktok.com) can't be recognized before extracting, but the save still won't duplicate.
- Recipes saved before source keys existed: `npm run db:backfill-keys` (safe to run again).

### Database commands

| Command | Use it when |
|---|---|
| `npm run db:generate` | You changed a file in `src/db/schema/`: writes a new SQL migration in `drizzle/` |
| `npm run db:migrate` | Apply the migrations in `drizzle/` to Neon |
| `npm run db:studio` | Browse the tables in your browser |

TikTok image links expire after about a day, so a saved TikTok recipe's `image` will stop loading later.

## Cost per request

Every recipe route (`/recipe`, `/extract`, `/tiktok`, `/instagram`, `/youtube`, `/video`) tracks what each request spends on paid APIs (Claude, OpenAI speech-to-text, ScrapeCreators):

- **Console:** one line per request, e.g.
  `[cost] POST /tiktok 200 $0.0371 in 14.2 s (scrapecreators $0.0019 + claude-opus-5-5 1912 in / 1760 out $0.0352)`
- **File:** one JSON line per request in `logs/costs.jsonl`, to add up later.
- **Response:** a `cost` field: `{ totalUsd, complete, items: [...] }`. `complete` is false when a call had no known price.

The numbers are estimates from `src/config/pricing.js` and the token counts the APIs return. Your provider dashboards show what you were actually billed. ScrapeCreators is counted at 1 credit per call, $47 / 25,000 credits; set `SCRAPECREATORS_USD_PER_CREDIT` if you bought another pack. Turn it off with `COST_LOG=off`, or keep only the console line with `COST_LOG_FILE=off`.

## Project structure

```
src/
  server.js                 starts the server (npm start)
  app.js                    builds the Express app: middleware + routes
  cli.js                    command-line version (npm run extract)
  config/index.js           port, CORS, timeouts, request headers
  config/pricing.js         API prices used for the cost log
  config/env.js             database + auth settings, checked with zod at startup
  db/                       Drizzle: client.js (Neon), schema/ (auth, recipes, lists, api_request)
  validators/               zod schemas for request input
  routes/                   URL → controller, one file per path (recipe, extract, tiktok, instagram, youtube,
                            video, recipes, lists, admin, me, auth...); index.js mounts them
  controllers/              read the request, call a service, send the response
  middleware/               cors, notFound (404), errorHandler, uploadVideo (multer), trackCost,
                            requireAuth, requireAdmin, validate (zod): *.middleware.js
  services/
    recipe/                 the recipe extraction logic
      extractRecipe.js          fetch a URL, then extract
      extractRecipeFromHtml.js  try each strategy on HTML
      normalizeRecipe.js        raw schema.org data → clean response
      strategies/               json-ld, microdata, heuristic
      fields/                   one parser per field (times, yield, rating, steps...)
    video/                  recipeFromCaption.js (rules -> AI), recipeFromSources.js (+ transcript)
    ai/                     Claude: extractRecipeWithAI, prompts, recipeSchema, toRecipeResponse
    transcription/          OpenAI speech-to-text + optional ffmpeg conversion
    tiktok/                 TikTok posts
      extractTikTokRecipe.js    link + caption -> recipe
      parseTikTokUrl.js, resolveShortLink.js, fetchTikTokOEmbed.js, getTikTokTranscript.js
      provider/                 ScrapeCreators: fetchTikTokVideo (caption, subtitles, video URL)
      caption/                  caption -> recipe (works for Instagram / Shorts captions too)
        parseCaption.js, splitCaptionSections.js, splitIngredientItems.js,
        splitSteps.js, findTitle.js, findTimesAndServings.js, patterns.js ...
    cost/                   per-request cost tracking: recordCost, priceClaudeUsage, summarizeCost, logCost, saveCostLog
    admin/                  getCostSummary, listCostLogs (admin pages)
    scrapeCreators/         scrapeCreatorsRequest: shared by TikTok, Instagram, YouTube
    instagram/              extractInstagramRecipe, parseInstagramUrl, provider/ (post, transcript)
    youtube/                extractYouTubeRecipe, parseYouTubeUrl, provider/ (video, captions)
    auth/                   Better Auth setup (auth.js) and getSessionFromRequest
    recipes/                saved recipes: saveRecipe, listRecipes, getRecipe, deleteRecipe, sourceKey
    lists/                  recipe lists; listAccess.js decides who can view / edit
    ingredients/            the ingredient parser
      parseIngredient.js        "2 cups milk" → { quantity, unit, name, notes }
      matchUnit.js, toNumber.js
      constants/                units, fractions, number words, regexes
    progress/               live step reporting for POST /recipe/stream
  utils/                    small shared helpers, one function per file
drizzle/                    generated SQL migrations (npm run db:generate)
drizzle.config.js           drizzle-kit settings
scripts/                    setRole.js (admin:grant / revoke), backfillSourceKeys.js
tests/                      node:test tests; accountsDatabase.test.js runs real Better Auth on in-memory Postgres
```

**Adding an endpoint:**
1. Put the logic in a folder under `services/`.
2. Add a controller in `controllers/` (and a zod schema in `validators/` if it takes input).
3. Add a route file in `routes/` and mount it in `routes/index.js`.

## Command line

```bash
npm run extract -- "https://www.bbcgoodfood.com/recipes/easy-pancakes"
npm run extract -- "<url>" -o recipe.json
npm run extract -- --parse "2-3 cloves garlic, minced" "15 ml (1 c. à soupe) d'huile d'olive"
```

## Response shape

```json
{
  "found": true,
  "extractionMethod": "json-ld",
  "sourceUrl": "...", "siteName": "...",
  "title": "...", "description": "...", "author": "...", "image": "...", "video": null,
  "timesMinutes": { "prep": 10, "cook": 20, "total": 30 },
  "yield": "Makes 12", "servings": 12,
  "ingredients": ["100g plain flour", "..."],
  "ingredientsParsed": [
    { "raw": "100g plain flour", "quantity": 100, "quantityMax": null, "unit": "gram", "name": "plain flour", "notes": null }
  ],
  "instructions": [{ "section": null, "text": "..." }],
  "category": [], "cuisine": [], "keywords": [],
  "nutrition": { "calories": "61 calories", "fat": "2 g" },
  "rating": { "value": 4.6, "count": 120 },
  "datePublished": "..."
}
```

No recipe: `{ "found": false, "reason": "..." }`.

## Limits
- Some sites block automated requests. Allrecipes returns HTTP 402 to this Node version. Pages that load the recipe only with JavaScript also won't work.
- The API refuses localhost and private network addresses, so a public deployment can't be used to probe your own network.
- Ingredient parsing is rule-based (English + French). The original line is always kept in `raw`.
- When testing `POST` with French text from Git Bash, send the body from a UTF-8 file (`--data-binary @body.json`); typed accents can get mangled by the terminal.
