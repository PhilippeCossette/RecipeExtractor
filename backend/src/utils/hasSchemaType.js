import { asList } from "./asList.js";

/** True if a schema.org node's @type includes `wanted` (handles arrays and full URLs). */
export function hasSchemaType(node, wanted) {
  return asList(node?.["@type"]).some(
    (t) => typeof t === "string" && t.split("/").pop().toLowerCase() === wanted.toLowerCase()
  );
}
