import { API_BASE_URL } from "@/utils";

/**
 * Call the recipe API with the session cookie. Returns the JSON body (or null for 204).
 * Throws an Error with the API's message on 4xx/5xx.
 */
export async function apiRequest<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: init.method ?? "GET",
    credentials: "include",
    headers: init.body === undefined ? undefined : { "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (res.status === 204) return null as T;

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const details = body?.issues?.map((i: { path: string; message: string }) => `${i.path}: ${i.message}`).join(", ");
    throw new Error(details || body?.error || `The recipe API returned HTTP ${res.status}`);
  }
  return body as T;
}
