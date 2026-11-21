/** Central config. Override with environment variables (see .env.example). */
import { env as checkedEnv } from "./env.js";

const env = process.env;
const list = (value) => value.split(",").map((s) => s.trim()).filter(Boolean);

export const config = {
  port: Number(env.PORT) || 3000,
  corsOrigin: env.CORS_ORIGIN || "*",
  /** Your frontends. They may send the login cookie (CORS with credentials) and are trusted by Better Auth. */
  appOrigins: list(env.APP_ORIGINS || "http://localhost:3001"),
  fetchTimeoutMs: Number(env.FETCH_TIMEOUT_MS) || 20_000,
  maxPageBytes: 8 * 1024 * 1024, // refuse pages bigger than 8 MB
  maxIngredientLines: 200, // per /ingredients/parse request
  maxCaptionLength: 10_000, // TikTok captions max out around 4,000 characters
  requestHeaders: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
  },

  /** Claude turns messy captions and transcripts into recipes. Off unless a key is set. */
  ai: {
    enabled: Boolean(env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN),
    model: env.AI_MODEL || "claude-opus-5-5",
    effort: env.AI_EFFORT || "low", // extraction is a simple task; raise if results are poor
    maxTokens: 16_000,
    maxInputChars: 60_000, // ~15 min of speech; longer transcripts are refused, not cut
  },

  /** OpenAI speech-to-text for uploaded videos (Claude doesn't take audio). Off unless a key is set. */
  transcription: {
    enabled: Boolean(env.OPENAI_API_KEY),
    model: env.TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe",
    maxFileBytes: 25 * 1024 * 1024, // OpenAI's limit per file
    ffmpegPath: env.FFMPEG_PATH || "ffmpeg", // optional: shrinks videos to audio and handles .mov
  },

  maxUploadBytes: (Number(env.MAX_UPLOAD_MB) || 100) * 1024 * 1024,

  /**
   * Paid social data API (ScrapeCreators) for TikTok, Instagram and YouTube, so a link alone is enough:
   * it returns the caption/description and the transcript or subtitles. ~1 credit per call.
   */
  scrapeCreators: {
    enabled: Boolean(env.SCRAPECREATORS_API_KEY),
    apiKey: env.SCRAPECREATORS_API_KEY || null,
    baseUrl: "https://api.scrapecreators.com",
    region: env.SCRAPECREATORS_REGION || undefined, // two-letter country code; their default is US
    timeoutMs: 30_000,
    maxVideoSeconds: Number(env.TIKTOK_MAX_VIDEO_SECONDS) || 600, // longer videos aren't downloaded for speech-to-text
  },

  /** Neon Postgres via Drizzle. Off (routes answer 503) until DATABASE_URL is set. */
  database: {
    enabled: Boolean(checkedEnv.DATABASE_URL),
    url: checkedEnv.DATABASE_URL ?? null,
  },

  /** Better Auth: email + password sign-in, session cookie. */
  auth: {
    secret: checkedEnv.BETTER_AUTH_SECRET ?? null,
    baseUrl: checkedEnv.BETTER_AUTH_URL, // where this API runs; the auth routes live under /api/auth
  },

  /** What each request cost (prices in config/pricing.js): a console line, plus one JSON line per request in `file`. */
  costLog: {
    enabled: env.COST_LOG !== "off",
    file: env.COST_LOG_FILE === "off" ? null : env.COST_LOG_FILE || "logs/costs.jsonl",
  },
};
