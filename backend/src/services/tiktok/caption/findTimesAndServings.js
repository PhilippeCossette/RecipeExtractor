import { SERVINGS_RE, TIME_RE } from "./patterns.js";

const toMinutes = (amount, unit) => (/^h/i.test(unit) ? Number(amount) * 60 : Number(amount));

/** Look for "Serves 4", "Prep time: 10 min", "Cook 1 hour" anywhere in the caption. */
export function findTimesAndServings(text) {
  const times = {};
  for (const [key, re] of Object.entries(TIME_RE)) {
    const m = text.match(re);
    times[key] = m ? toMinutes(m[1], m[2]) : null;
  }
  if (times.total == null && (times.prep || times.cook)) times.total = (times.prep || 0) + (times.cook || 0);

  const servings = text.match(SERVINGS_RE);
  return {
    timesMinutes: times,
    servings: servings ? Number(servings[1]) : null,
    yield: servings ? servings[0].trim() : null,
  };
}
