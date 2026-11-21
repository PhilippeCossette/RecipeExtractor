import { UNICODE_FRACTIONS } from "./constants/fractions.js";

const round3 = (n) => Math.round(n * 1000) / 1000;

/** "1 1/2" -> 1.5, "½" -> 0.5, "1½" -> 1.5, "2,5" -> 2.5. */
export function toNumber(text) {
  const s = text.trim().replace(",", ".");
  if (!s) return null;

  let total = 0;
  for (const part of s.split(/\s+/)) {
    const lastChar = part.at(-1);
    if (part.includes("/")) {
      const [num, den] = part.split("/").map(Number);
      total += den ? num / den : 0;
    } else if (lastChar in UNICODE_FRACTIONS) {
      const whole = part.length > 1 ? Number(part.slice(0, -1)) : 0;
      total += whole + UNICODE_FRACTIONS[lastChar];
    } else {
      total += Number(part);
    }
  }
  return round3(total);
}
