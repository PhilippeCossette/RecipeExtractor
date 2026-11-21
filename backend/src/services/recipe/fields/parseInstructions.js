import { cleanText, cleanTextKeepLines, hasSchemaType } from "../../../utils/index.js";

const STEP_SPLIT_RE = /\n+|(?:^|\s)(?=\d+[.)]\s)/; // new lines, or "1. ", "2) "
const STEP_NUMBER_RE = /^\s*\d+[.)]\s*/;

/**
 * Normalise recipeInstructions into [{ section, text }].
 * Handles a plain string, a list of strings, HowToStep, HowToSection and nested lists.
 */
export function parseInstructions(value) {
  const steps = [];

  const walk = (node, section = null) => {
    if (node == null) return;

    if (typeof node === "string") {
      for (const part of cleanTextKeepLines(node).split(STEP_SPLIT_RE)) {
        const text = cleanText(part.replace(STEP_NUMBER_RE, ""));
        if (text) steps.push({ section, text });
      }
    } else if (Array.isArray(node)) {
      node.forEach((child) => walk(child, section));
    } else if (typeof node === "object") {
      if (hasSchemaType(node, "HowToSection")) {
        walk(node.itemListElement, cleanText(node.name) || section);
      } else if (node.itemListElement && !node.text) {
        walk(node.itemListElement, section);
      } else {
        const text = cleanText(node.text || node.name || node.description);
        if (text) steps.push({ section, text });
      }
    }
  };

  walk(value);
  return steps;
}
