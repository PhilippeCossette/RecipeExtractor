/** Canonical unit -> every spelling that maps to it (English + French). */
export const UNITS = {
  cup: ["cups", "cup", "c.", "tasses", "tasse"],
  tablespoon: ["tablespoons", "tablespoon", "tbsps", "tbsp", "tbs", "tbl", "T",
    "c. à soupe", "c. a soupe", "c.à soupe", "cuillères à soupe", "cuillère à soupe", "c. à s.", "cas"],
  teaspoon: ["teaspoons", "teaspoon", "tsps", "tsp", "t",
    "c. à thé", "c. a the", "c. à café", "c.à thé", "cuillères à thé", "cuillère à thé",
    "cuillères à café", "cuillère à café", "c. à t.", "cac"],
  gram: ["grams", "gram", "grammes", "gramme", "gr", "g"],
  kilogram: ["kilograms", "kilogram", "kilos", "kilo", "kg"],
  milligram: ["milligrams", "milligram", "mg"],
  milliliter: ["milliliters", "millilitres", "milliliter", "millilitre", "ml"],
  centiliter: ["centiliters", "centilitres", "cl"],
  deciliter: ["deciliters", "décilitres", "dl"],
  liter: ["liters", "litres", "liter", "litre", "l"],
  ounce: ["ounces", "ounce", "oz"],
  "fluid ounce": ["fluid ounces", "fluid ounce", "fl. oz", "fl oz"],
  pound: ["pounds", "pound", "lbs", "lb", "livres", "livre"],
  pint: ["pints", "pint", "pt"],
  quart: ["quarts", "quart", "qt"],
  gallon: ["gallons", "gallon", "gal"],
  pinch: ["pinches", "pinch", "pincées", "pincée"],
  dash: ["dashes", "dash", "trait"],
  clove: ["cloves", "clove", "gousses", "gousse"],
  can: ["cans", "can", "boîtes", "boîte", "conserves"],
  package: ["packages", "package", "pkg", "packets", "packet", "paquets", "paquet", "sachets", "sachet"],
  stick: ["sticks", "stick"],
  slice: ["slices", "slice", "tranches", "tranche"],
  bunch: ["bunches", "bunch", "bottes", "botte"],
  sprig: ["sprigs", "sprig", "brins", "brin"],
  handful: ["handfuls", "handful", "poignées", "poignée"],
  head: ["heads", "head"],
  piece: ["pieces", "piece", "morceaux", "morceau"],
  jar: ["jars", "jar", "pots", "pot"],
  bottle: ["bottles", "bottle", "bouteilles", "bouteille"],
  drop: ["drops", "drop", "gouttes", "goutte"],
};

/** Spellings where case matters: "T" = tablespoon, "t" = teaspoon. */
export const CASE_SENSITIVE_UNITS = new Set(["T", "t"]);

/** [spelling, canonical] pairs, longest first so "c. à soupe" wins over "c.". */
export const UNIT_LOOKUP = Object.entries(UNITS)
  .flatMap(([canonical, spellings]) => spellings.map((s) => [s, canonical]))
  .sort((a, b) => b[0].length - a[0].length);
