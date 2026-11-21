const SINGLE_PROPS = [
  "name", "description", "image", "author", "prepTime", "cookTime", "totalTime",
  "recipeYield", "recipeCategory", "recipeCuisine", "keywords",
];
const VALUE_ATTRS = ["content", "datetime", "src", "href"];

/** Strategy 2: HTML microdata, itemtype="http://schema.org/Recipe" (older sites). */
export function fromMicrodata($) {
  const root = $('[itemtype*="schema.org/Recipe" i]').first();
  if (!root.length) return null;

  const valueOf = (el) => {
    const $el = $(el);
    for (const attr of VALUE_ATTRS) if ($el.attr(attr)) return $el.attr(attr);
    return $el.text().trim();
  };
  const all = (prop) => root.find(`[itemprop="${prop}"]`).toArray().map(valueOf);
  const first = (prop) => all(prop)[0] ?? null;

  const node = { "@type": "Recipe" };
  for (const prop of SINGLE_PROPS) node[prop] = first(prop);

  const ingredients = all("recipeIngredient");
  node.recipeIngredient = ingredients.length ? ingredients : all("ingredients");
  node.recipeInstructions = all("recipeInstructions");

  return node.recipeIngredient.length ? node : null;
}
