/**
 * Prices used to log what each request cost. They only affect the logs, never what you're billed.
 * Update them when a provider changes its prices.
 */
const env = process.env;

export const pricing = {
  /** Claude, USD per million tokens. https://www.anthropic.com/pricing */
  anthropic: {
    "claude-fable-5-2": { input: 8, output: 40 },
    "claude-opus-5-5": { input: 4, output: 20 },
    "claude-opus-5": { input: 5, output: 25 },
    "claude-opus-4-8": { input: 5, output: 25 },
    "claude-sonnet-5-5": { input: 2, output: 10 },
    "claude-sonnet-5": { input: 2, output: 10 },
    "claude-haiku-5-5": { input: 0.1, output: 0.5 },
  },
  /** Cache reads cost 0.1x the input price, cache writes 1.25x. */
  anthropicCacheReadMultiplier: 0.1,
  anthropicCacheWriteMultiplier: 1.25,

  /** OpenAI speech-to-text, USD per minute of audio. https://openai.com/api/pricing */
  transcriptionPerMinute: {
    "gpt-4o-mini-transcribe": 0.003,
    "gpt-4o-transcribe": 0.006,
    "whisper-1": 0.006,
  },

  /** ScrapeCreators: $47 for 25,000 credits on the Freelance pack. Set your own rate if you bought another pack. */
  scrapeCreators: {
    usdPerCredit: Number(env.SCRAPECREATORS_USD_PER_CREDIT) || 47 / 25_000,
    creditsPerCall: Number(env.SCRAPECREATORS_CREDITS_PER_CALL) || 1,
  },
};
