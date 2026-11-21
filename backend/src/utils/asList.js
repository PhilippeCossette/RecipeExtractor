/** Wrap a value in an array: null -> [], x -> [x], [x] -> [x]. */
export function asList(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}
