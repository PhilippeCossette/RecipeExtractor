import { extractRecipe } from "../services/recipe/index.js";

/** GET /extract?url=...  or  POST /extract { url } */
export async function extractController(req, res) {
  const url = req.query.url ?? req.body?.url;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing 'url' (query string or JSON body)" });
  }
  // Always 200 with found: true/false, so the client only has one shape to handle.
  res.json(await extractRecipe(url));
}
