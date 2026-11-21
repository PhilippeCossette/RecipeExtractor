import { toNodeHandler } from "better-auth/node";
import { getAuth } from "../services/auth/index.js";

/**
 * Hands every /api/auth/* request to Better Auth (sign-up, sign-in, sign-out, get-session...).
 * Mounted in app.js BEFORE express.json(): Better Auth reads the raw request body itself.
 */
let handler = null;

export function authRoutes(req, res) {
  const auth = getAuth();
  if (!auth) {
    return res.status(503).json({ error: "Accounts are off: set DATABASE_URL and BETTER_AUTH_SECRET in .env." });
  }
  handler ??= toNodeHandler(auth);
  return handler(req, res);
}
