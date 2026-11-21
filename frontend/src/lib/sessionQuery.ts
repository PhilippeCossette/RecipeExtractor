import type { QueryClient } from "@tanstack/react-query";
import { authClient, type Session } from "./authClient";

export const SESSION_QUERY_KEY = ["session"] as const;

/**
 * The current session (or null), cached for a minute so moving between pages doesn't refetch it every time.
 * Used by route guards (beforeLoad), which only run in the browser (ssr: false) where the cookie is.
 */
export function getSession(queryClient: QueryClient): Promise<Session | null> {
  return queryClient.fetchQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async () => (await authClient.getSession()).data ?? null,
    staleTime: 60_000,
  });
}

/** Forget the cached session (after signing in or out). */
export function clearSession(queryClient: QueryClient) {
  queryClient.removeQueries({ queryKey: SESSION_QUERY_KEY });
}
