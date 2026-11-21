import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { config } from "../../config/index.js";
import { getDb, schema } from "../../db/index.js";

/**
 * Better Auth with email + password. Its routes are mounted at /api/auth/* in app.js:
 *   POST /api/auth/sign-up/email   { name, email, password }
 *   POST /api/auth/sign-in/email   { email, password }
 *   POST /api/auth/sign-out
 *   GET  /api/auth/get-session
 * Sessions are a cookie, so browsers must call with credentials: "include".
 */
function createAuth(db) {
  return betterAuth({
    secret: config.auth.secret,
    baseURL: config.auth.baseUrl,
    trustedOrigins: config.appOrigins,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification },
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    user: {
      additionalFields: {
        // "user" or "admin". input: false means sign-up can't set it; only the admin:grant script does.
        role: { type: "string", required: false, defaultValue: "user", input: false },
      },
    },
  });
}

let auth = null;

/** The Better Auth instance, or null when the database isn't configured. Created on first use. */
export function getAuth() {
  if (!auth) {
    const db = getDb();
    if (db) auth = createAuth(db);
  }
  return auth;
}

/** Replace the instance (tests). */
export function setAuth(replacement) {
  auth = replacement;
}
