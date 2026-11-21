import { getAuth, getSessionFromRequest } from "../services/auth/index.js";

/**
 * Only let signed-in users through. Sets req.user and req.session from the Better Auth cookie.
 * 503 when accounts aren't configured, 401 when there's no valid session.
 */
export async function requireAuth(req, res, next) {
  if (!getAuth()) {
    return res.status(503).json({ error: "Accounts are off: set DATABASE_URL and BETTER_AUTH_SECRET in .env." });
  }
  const result = await getSessionFromRequest(req);
  if (!result?.user) {
    return res.status(401).json({ error: "Sign in first (POST /api/auth/sign-in/email)." });
  }
  req.user = result.user;
  req.session = result.session;
  next();
}
