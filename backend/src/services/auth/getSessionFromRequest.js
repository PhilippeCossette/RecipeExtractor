import { fromNodeHeaders } from "better-auth/node";
import { getAuth } from "./auth.js";

/** The signed-in user's { user, session } from the request's cookie, or null. */
export async function getSessionFromRequest(req) {
  const auth = getAuth();
  if (!auth) return null;
  return auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
}
