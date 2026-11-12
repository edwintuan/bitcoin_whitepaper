/** Small formatting helpers shared by the figures. Numbers use the same digits and grouping in both languages. */

const grouped = new Intl.NumberFormat('en-US');

/** 1048576 → "1,048,576". */
export function formatCount(value: number): string {
  return grouped.format(value);
}

/** Satoshis as bitcoin, without trailing zeros: 4990000n → "0.0499". */
export function formatBtc(sats: bigint): string {
  const whole = grouped.format(sats / 100_000_000n);
  const fraction = (sats % 100_000_000n).toString().padStart(8, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole;
}

/** The two ends of a long hex string: shortHex(h, 8, 4) → "00000000…e26f". With `tail` 0 it ends on the ellipsis. */
export function shortHex(hex: string, lead = 10, tail = 4): string {
  if (hex.length <= lead + tail + 1) return hex;
  return `${hex.slice(0, lead)}…${tail > 0 ? hex.slice(-tail) : ''}`;
}

/** Fills `{name}` placeholders in a line of copy. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}
