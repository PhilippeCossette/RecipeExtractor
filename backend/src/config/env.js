import { z } from "zod";

/**
 * Database and auth settings from .env, checked with zod at startup.
 * The database is optional: without DATABASE_URL the recipe extraction routes still work,
 * and /api/auth, /me and /recipes answer 503 until it's set.
 */
const EnvSchema = z
  .object({
    DATABASE_URL: z
      .string()
      .regex(/^postgres(ql)?:\/\//, "DATABASE_URL must be a postgres:// connection string (Neon dashboard > Connect)")
      .optional(),
    BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters").optional(),
    BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  })
  .refine((env) => !env.DATABASE_URL || env.BETTER_AUTH_SECRET, {
    message: "BETTER_AUTH_SECRET is required when DATABASE_URL is set",
    path: ["BETTER_AUTH_SECRET"],
  });

const result = EnvSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL || undefined,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || undefined,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || undefined,
});

if (!result.success) {
  const problems = result.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Invalid environment variables in .env:\n${problems}`);
}

export const env = result.data;
