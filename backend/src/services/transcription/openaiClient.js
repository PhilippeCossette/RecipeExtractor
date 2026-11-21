import OpenAI from "openai";

let client = null;

/** One shared client. Reads OPENAI_API_KEY from the environment. */
export function getOpenAIClient() {
  client ??= new OpenAI();
  return client;
}

/** Replace the client (tests use this to avoid real API calls). Pass null to reset. */
export function setOpenAIClient(replacement) {
  client = replacement;
}
