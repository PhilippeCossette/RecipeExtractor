import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { API_BASE_URL } from "@/utils";

/**
 * Better Auth client for the recipe API (its auth routes live at <API>/api/auth).
 * The session is a cookie set by the API, so every call sends credentials.
 */
export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  fetchOptions: { credentials: "include" },
  plugins: [
    // The API adds `role` ("user" | "admin") to users; this types it on session.user.
    inferAdditionalFields({ user: { role: { type: "string", required: false, input: false } } }),
  ],
});

export type Session = typeof authClient.$Infer.Session;

export const isAdmin = (session: Session | null | undefined) => session?.user.role === "admin";
