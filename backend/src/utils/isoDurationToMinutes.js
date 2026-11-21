const ISO_DURATION =
  /^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i;

/** "PT1H30M" -> 90, "P0DT0H45M" -> 45, 20 -> 20. Returns null when there is no duration. */
export function isoDurationToMinutes(value) {
  if (!value) return null;
  if (typeof value === "number") return Math.round(value);

  const match = String(value).trim().match(ISO_DURATION);
  if (!match) {
    const digits = String(value).match(/\d+/);
    return digits ? Number(digits[0]) : null;
  }
  const [days, hours, minutes, seconds] = match.slice(1).map((x) => (x ? Number(x) : 0));
  const total = days * 1440 + hours * 60 + minutes + seconds / 60;
  return total ? Math.round(total) : null;
}
