/**
 * Whitepaper section 11: how likely an attacker is to replace a payment.
 *
 * Throughout, `q` is the attacker's share of the hash power and `z` is the
 * paper's z: the number of blocks linked after the block that holds the
 * payment ("the transaction has been added to a block and z blocks have been
 * linked after it"). Wallets count the block that holds the payment as the
 * first confirmation, so z blocks on top is z + 1 confirmations.
 */

function check(q: number, z: number): void {
  if (!(q >= 0 && q <= 1)) throw new RangeError('q must be a share of the hash power between 0 and 1');
  if (!Number.isInteger(z) || z < 0) throw new RangeError('z must be a whole number of blocks, 0 or more');
}

/**
 * The paper's q_z: the probability that an attacker who is `z` blocks behind
 * ever catches up with the honest chain. `(q/p)^z` while the attacker has less
 * than half the hash power, certainty from half upward. Drawing level counts
 * as catching up, so it is 1 for `z = 0`.
 *
 * @param q attacker's share of the hash power, 0 … 1
 * @param z blocks the attacker is behind, a non-negative integer
 * @throws RangeError if an argument is out of range.
 */
export function catchUpProbability(q: number, z: number): number {
  check(q, z);
  return q >= 0.5 ? 1 : Math.pow(q / (1 - q), z);
}

/**
 * The paper's P: the probability that an attacker with a fraction `q` of the
 * hash power ever catches up with the honest chain, given that the recipient
 * waited until `z` blocks were linked after the one holding the payment. It
 * averages {@link catchUpProbability} over how far the attacker may have got
 * in secret while those blocks arrived.
 *
 * Below the first two statements this is the paper's C function
 * `AttackerSuccessProbability`, ported line for line: same variable names,
 * same loop bounds, same order of floating-point operations, so that it
 * reproduces the paper's tables digit for digit and can be shown beside the
 * original.
 *
 * Limits inherited from that code, which a caller should know about:
 *
 * - The result carries rounding error of roughly 1e-15, because it is computed
 *   as 1 minus a sum that approaches 1. Once the true value is smaller than
 *   that, the result is noise: it can be 0 or slightly negative. Clamp before
 *   taking a logarithm for a chart.
 * - `exp(-lambda)` runs out of double precision once `lambda = z * q / p`
 *   passes about 708 and is exactly 0 beyond about 745, from where the result
 *   is a flat, wrong 1. Nothing with z ≤ 100 and q ≤ 0.49 comes close (lambda
 *   stays under 97).
 *
 * @param q attacker's share of the hash power, 0 … 1
 * @param z blocks linked after the block that holds the payment, a
 * non-negative integer (z + 1 confirmations as wallets count them)
 * @throws RangeError if an argument is out of range.
 */
export function attackerSuccessProbability(q: number, z: number): number {
  // The next two lines are not in the paper's code, which takes its arguments
  // on trust and assumes p > q; its own case analysis gives q_z = 1 if p ≤ q.
  check(q, z);
  if (q >= 0.5) return 1.0;

  const p = 1.0 - q;
  const lambda = z * (q / p);
  let sum = 1.0;
  let i: number, k: number;
  for (k = 0; k <= z; k++) {
    let poisson = Math.exp(-lambda);
    for (i = 1; i <= k; i++)
      poisson *= lambda / i;
    sum -= poisson * (1 - Math.pow(q / p, z - k));
  }
  return sum;
}

/** `lambda` up to which `exp(-lambda)` keeps full double precision (it turns subnormal near 708). */
const MAX_LAMBDA = 700;

/** Thresholds below this are within reach of the formula's rounding error. */
const MIN_THRESHOLD = 1e-12;

/**
 * The smallest `z` for which `attackerSuccessProbability(q, z)` is strictly
 * below `pMax`: the paper's "Solving for P less than 0.1%" table is
 * `minConfirmations(q, 0.001)`.
 *
 * Despite its name the result is the paper's z, the number of blocks to wait
 * for on top of the one that holds the payment. As wallets count, that is
 * z + 1 confirmations: the paper's z = 5 for q = 0.1 is the familiar six.
 *
 * Returns `Infinity` when there is no such `z` to find:
 *
 * - `q` is 0.5 or more, so the probability is 1 for every `z`;
 * - the answer lies beyond what the paper's formula can compute in double
 *   precision (see {@link attackerSuccessProbability}). For `pMax = 0.001`
 *   that is any `q` above about 0.4675, where the answer would lie beyond
 *   z = 789;
 * - `pMax` is below 1e-12, or an argument is NaN or `q` is outside 0 … 1.
 *
 * The probability falls as z grows, so the search doubles z until it is
 * below the threshold and then bisects: a few dozen evaluations, a few
 * milliseconds at worst.
 */
export function minConfirmations(q: number, pMax: number): number {
  if (!(q >= 0 && q <= 1) || !(pMax >= MIN_THRESHOLD)) return Infinity;
  if (pMax > 1) return 0;
  if (q >= 0.5) return Infinity;
  // The last z the formula can evaluate; Infinity for q = 0.
  const zMax = Math.floor(MAX_LAMBDA / (q / (1 - q)));
  const below = (z: number): boolean => attackerSuccessProbability(q, z) < pMax;
  let lo = 1;
  let hi = 1;
  while (!below(hi)) {
    if (hi >= zMax) return Infinity;
    lo = hi + 1;
    hi = Math.min(hi * 2, zMax);
  }
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (below(mid)) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

/** The attacker abandons a race when its odds of merely regaining its starting deficit fall below this. */
const GIVE_UP_ODDS = 0.001;

/**
 * The gap at which the attacker in {@link simulateRace} abandons a race that
 * began `z` blocks behind: the first gap from which getting back even to the
 * starting gap has odds under 1 in 1000, i.e. `z + n` for the smallest `n`
 * with `(q/p)^n < 0.001`. `Infinity` for an attacker with half the hash power
 * or more, who never gives up.
 *
 * @throws RangeError if an argument is out of range.
 */
export function giveUpGap(q: number, z: number): number {
  check(q, z);
  const p = 1 - q;
  return q < p ? z + Math.floor(Math.log(GIVE_UP_ODDS) / Math.log(q / p)) + 1 : Infinity;
}

/**
 * Plays out one catch-up race block by block: the binomial random walk of
 * whitepaper section 11. The attacker starts `z` blocks behind. For each new
 * block one number is drawn from `rng`; below `q` the attacker found it and
 * the gap shrinks by one, otherwise an honest node did and the gap grows by one.
 *
 * The race ends in one of three ways:
 *
 * - the gap reaches 0: the attacker caught up (`caughtUp: true`);
 * - the attacker gives up at {@link giveUpGap}, having fallen so much further
 *   behind than where it started that getting back even to that starting gap
 *   has odds under 1 in 1000. A majority attacker (q ≥ 0.5) never gives up;
 * - `maxSteps` blocks have been found without either of the above.
 *
 * Averaged over many runs with q below 0.5, `caughtUp` estimates
 * {@link catchUpProbability}, `(q/p)^z`, to within the 0.1% the give-up rule
 * cuts off. Close to an even split races become long: at q = 0.499 about one
 * race in twenty is still undecided after the default 100,000 blocks and is
 * counted as not caught up. That is not the same quantity as
 * {@link attackerSuccessProbability}, which also averages over how far the
 * attacker got while the `z` blocks arrived; label the two separately.
 *
 * @param q attacker's share of the hash power, 0 … 1
 * @param z blocks the attacker starts behind, a non-negative integer
 * @param rng source of numbers in [0, 1); pass a seeded one to replay a race
 * @param maxSteps cap on the number of blocks, 100,000 by default
 * @returns `path` holds the gap before the first block and after every block,
 * so `path[0]` is `z` and `steps` is `path.length - 1`
 * @throws RangeError if `q` or `z` is out of range.
 */
export function simulateRace(
  q: number,
  z: number,
  rng: () => number,
  maxSteps = 100_000,
): { caughtUp: boolean; steps: number; path: number[] } {
  const giveUpAt = giveUpGap(q, z);
  const path = [z];
  let gap = z;
  while (gap > 0 && gap < giveUpAt && path.length <= maxSteps) {
    gap += rng() < q ? -1 : 1;
    path.push(gap);
  }
  return { caughtUp: gap <= 0, steps: path.length - 1, path };
}
