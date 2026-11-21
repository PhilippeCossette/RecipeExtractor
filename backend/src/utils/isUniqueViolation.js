/** True when a database error is Postgres' "unique constraint" error (code 23505), whatever the driver wraps it in. */
export function isUniqueViolation(err) {
  return err?.code === "23505" || err?.cause?.code === "23505";
}
