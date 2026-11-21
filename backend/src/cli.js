#!/usr/bin/env node
// Usage:
//   npm run extract -- <url>                 print recipe JSON
//   npm run extract -- <url> -o recipe.json  save to file
//   npm run extract -- --parse "2 cups milk" "1 c. à thé de sel"
import { writeFileSync } from "node:fs";
import { parseIngredient } from "./services/ingredients/index.js";
import { extractRecipe } from "./services/recipe/index.js";

const USAGE = 'Usage: node src/cli.js <url> [-o file.json]  |  node src/cli.js --parse "<ingredient>" ...';
const args = process.argv.slice(2);

if (!args.length) {
  console.log(USAGE);
  process.exit(1);
}

if (args[0] === "--parse") {
  for (const line of args.slice(1)) console.log(JSON.stringify(parseIngredient(line)));
  process.exit(0);
}

const outIdx = args.findIndex((a) => a === "-o" || a === "--output");
const outFile = outIdx === -1 ? null : args[outIdx + 1];
const url = args.find((a, i) => !a.startsWith("-") && (outIdx === -1 || i !== outIdx + 1));

const result = await extractRecipe(url);
const json = JSON.stringify(result, null, 2);

if (outFile) {
  writeFileSync(outFile, json, "utf8");
  console.log(`Saved to ${outFile}  (found=${result.found})`);
} else {
  console.log(json);
}
process.exit(result.found ? 0 : 1);
