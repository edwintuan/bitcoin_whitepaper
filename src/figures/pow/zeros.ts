/**
 * What a hash with `bits` leading zero bits looks like in hex.
 *
 * One hex digit is four bits. Whole digits of zeros come first; when the bits
 * do not fill a digit, the next digit may be anything up to `max`.
 */
export function hexPrefix(bits: number): { zeros: string; max: number | null } {
  const rest = bits % 4;
  return {
    zeros: '0'.repeat(Math.floor(bits / 4)),
    max: rest === 0 ? null : (1 << (4 - rest)) - 1,
  };
}
