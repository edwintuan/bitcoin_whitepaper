/** A waiting time in the unit a reader would use, rounded to what the estimate supports. */
export interface Wait {
  value: string;
  unit: 'seconds' | 'minutes' | 'hours';
  /** True when the wait is shorter than the value shown ("under 1 second"). */
  under: boolean;
}

/**
 * The average wait for a block that takes `expectedTries` hashes on average,
 * on a machine doing `rate` hashes a second. Null while no rate is known.
 */
export function waitFor(expectedTries: number, rate: number): Wait | null {
  if (!(rate > 0)) return null;
  const seconds = expectedTries / rate;
  if (seconds < 1) return { value: '1', unit: 'seconds', under: true };
  if (seconds < 120) return { value: String(Math.round(seconds)), unit: 'seconds', under: false };
  const scaled = (amount: number) => (amount < 10 ? amount.toFixed(1).replace(/\.0$/, '') : String(Math.round(amount)));
  if (seconds < 7200) return { value: scaled(seconds / 60), unit: 'minutes', under: false };
  return { value: scaled(seconds / 3600), unit: 'hours', under: false };
}
