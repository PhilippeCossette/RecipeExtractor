/** 0.025936 -> "$0.0259", 12.5 -> "$12.50". Small amounts keep 4 decimals so a single call isn't "$0.00". */
export function formatUsd(amount: number | null | undefined): string {
  const n = Number(amount ?? 0);
  return `$${n.toFixed(Math.abs(n) >= 1 || n === 0 ? 2 : 4)}`;
}
