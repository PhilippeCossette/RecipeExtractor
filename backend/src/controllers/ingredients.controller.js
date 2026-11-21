import { config } from "../config/index.js";
import { parseIngredient } from "../services/ingredients/index.js";

/** POST /ingredients/parse { lines: ["2 cups milk", ...] } */
export function parseIngredientsController(req, res) {
  const lines = req.body?.lines;
  if (!Array.isArray(lines)) {
    return res.status(400).json({ error: "Body must be { lines: [string, ...] }" });
  }
  res.json(lines.slice(0, config.maxIngredientLines).map((line) => parseIngredient(String(line))));
}
