/**
 * Check req.body / req.params / req.query against zod schemas. On success the parsed (cleaned) values
 * replace the originals in req.valid; on failure the request stops with 400 and the list of problems.
 *
 *   router.post("/", validate({ body: SaveRecipeSchema }), controller)
 *
 * @param {{ body?: import("zod").ZodType, params?: import("zod").ZodType, query?: import("zod").ZodType }} schemas
 */
export function validate(schemas) {
  return (req, res, next) => {
    req.valid = {};
    for (const [part, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(req[part] ?? {});
      if (!result.success) {
        return res.status(400).json({
          error: `Invalid ${part}`,
          issues: result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        });
      }
      req.valid[part] = result.data;
    }
    next();
  };
}
