import { fromHeuristics } from "./fromHeuristics.js";
import { fromJsonLd } from "./fromJsonLd.js";
import { fromMicrodata } from "./fromMicrodata.js";

/** Tried in order; the first one that finds a recipe wins. */
export const STRATEGIES = [
  { name: "json-ld", run: fromJsonLd },
  { name: "microdata", run: fromMicrodata },
  { name: "heuristic", run: fromHeuristics },
];
