/**
 * The paper's loop with the lid off: the same statements as the engine's
 * `attackerSuccessProbability`, in the same order, keeping every intermediate
 * value so the figure can show the loop at work. A test holds the final sum to
 * the engine's result, bit for bit.
 */

/** One pass of the outer loop. */
export interface LoopRow {
  /** Blocks the attacker is supposed to have found while the merchant waited. */
  k: number;
  /** `poisson` after the inner loop: the chance of exactly k blocks, λ^k e^−λ / k!. */
  poisson: number;
  /** `pow(q / p, z - k)`: the chance of ever catching up from z − k behind. */
  catchUp: number;
  /** `sum` once this pass has subtracted its term. */
  sum: number;
}

export interface Trace {
  p: number;
  /** q / p. */
  ratio: number;
  lambda: number;
  rows: LoopRow[];
  /** What the function returns: `sum` after the last pass. */
  result: number;
}

/**
 * The Poisson probability of exactly `k` events when `lambda` are expected,
 * computed as the paper's inner loop computes it: start from e^−λ and
 * multiply by λ / i for i = 1 … k.
 */
export function poisson(lambda: number, k: number): number {
  let value = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) value *= lambda / i;
  return value;
}

/**
 * The positions of the largest values in a row of bars: one, or several when
 * they are equal. A Poisson distribution whose mean is a whole number λ has
 * two, at λ − 1 and λ.
 */
export function tallest(bars: readonly number[]): number[] {
  const top = Math.max(...bars);
  return bars.flatMap((value, index) => (top - value <= top * 1e-12 ? [index] : []));
}

/** Runs the paper's function for an attacker below half the hash power and records each pass. */
export function traceAttack(q: number, z: number): Trace {
  const p = 1.0 - q;
  const ratio = q / p;
  const lambda = z * (q / p);
  let sum = 1.0;
  const rows: LoopRow[] = [];
  for (let k = 0; k <= z; k++) {
    const weight = poisson(lambda, k);
    const catchUp = Math.pow(q / p, z - k);
    sum -= weight * (1 - catchUp);
    rows.push({ k, poisson: weight, catchUp, sum });
  }
  return { p, ratio, lambda, rows, result: sum };
}

/**
 * A variable as the watch list prints it: seven significant figures, with an
 * exponent only where a plain decimal would be mostly zeros.
 */
export function formatValue(x: number): string {
  if (x === 0) return '0';
  const text = Math.abs(x) < 1e-5 ? x.toExponential(4) : String(Number(x.toPrecision(7)));
  return text.replaceAll('-', '−');
}

export interface PortListing {
  code: string;
  /** Line number of the first line of `code` in the file. */
  startLine: number;
}

/**
 * The TypeScript port exactly as it stands in src/lib/attack.ts, cut out of
 * the file's own text so that what the page shows is what the page runs.
 *
 * @throws Error if the function cannot be found.
 */
export function portSource(file: string): PortListing {
  const lines = file.replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex((line) => line.startsWith('export function attackerSuccessProbability('));
  const length = start === -1 ? -1 : lines.slice(start).findIndex((line) => line === '}');
  if (length === -1) throw new Error('attackerSuccessProbability is not where the figure expects it');
  return { code: lines.slice(start, start + length + 1).join('\n'), startLine: start + 1 };
}
