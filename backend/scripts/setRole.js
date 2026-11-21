/**
 * Make a user an admin, or back to a normal user.
 *   npm run admin:grant -- someone@example.com
 *   npm run admin:revoke -- someone@example.com
 * The user must have signed up first. They see the change after signing in again (or within a minute).
 */
import { eq } from "drizzle-orm";
import { getDb, schema } from "../src/db/index.js";

const [role, email] = process.argv.slice(2);
if (!["admin", "user"].includes(role) || !email) {
  console.error("Usage: node scripts/setRole.js <admin|user> <email>");
  process.exit(1);
}

const db = getDb();
if (!db) {
  console.error("DATABASE_URL isn't set in .env.");
  process.exit(1);
}

const updated = await db
  .update(schema.user)
  .set({ role, updatedAt: new Date() })
  .where(eq(schema.user.email, email.toLowerCase()))
  .returning({ email: schema.user.email, role: schema.user.role });

if (!updated.length) {
  console.error(`No user with the email ${email}. Sign up first, then run this again.`);
  process.exit(1);
}
console.log(`${updated[0].email} is now: ${updated[0].role}`);
process.exit(0);
