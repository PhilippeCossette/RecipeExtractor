import { cleanText } from "../../../utils/index.js";

/** NutritionInformation -> { calories, fat, saturatedFat, protein, ... } ("fatContent" -> "fat"). */
export function parseNutrition(value) {
  if (!value || typeof value !== "object") return {};
  const out = {};
  for (const [key, val] of Object.entries(value)) {
    if (key.startsWith("@")) continue;
    out[key.replace(/Content$/, "")] = cleanText(val);
  }
  return out;
}
