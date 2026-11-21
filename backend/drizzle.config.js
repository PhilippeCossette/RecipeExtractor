import { defineConfig } from "drizzle-kit";

// Used by the db:* npm scripts (they load .env first, so DATABASE_URL is set).
export default defineConfig({
  schema: "./src/db/schema/index.js",
  out: "./drizzle", // generated SQL migrations, commit these
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL },
});
