import Anthropic from "@anthropic-ai/sdk";

let client = null;

/** One shared client. Reads ANTHROPIC_API_KEY (or ANTHROPIC_AUTH_TOKEN) from the environment. */
export function getAnthropicClient() {
  client ??= new Anthropic();
  return client;
}

/** Replace the client (tests use this to avoid real API calls). Pass null to reset. */
export function setAnthropicClient(replacement) {
  client = replacement;
}
