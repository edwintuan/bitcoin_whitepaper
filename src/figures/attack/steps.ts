/**
 * The guided steps of section 11, and the two rules that keep the walkthrough
 * and the figure in step with each other.
 *
 * z is the paper's z: blocks on top of the block that holds the payment.
 */

export type Scene = 'calculator' | 'code' | 'race';
export type Highlight = 'q' | 'z' | 'wait' | 'watch' | 'tables' | 'tally';

export interface Step {
  /** The scene the step opens. */
  scene: Scene;
  /** The part of it the step points at. */
  highlight: Highlight;
  /** Inputs the step sets when the reader arrives with Next or Back. */
  percent?: number;
  z?: number;
  /** True where the step's text quotes those inputs: it is then only true of a figure that shows them. */
  quoted?: boolean;
}

export const STEPS: readonly Step[] = [
  { scene: 'calculator', highlight: 'q' },
  { scene: 'calculator', highlight: 'z' },
  { scene: 'calculator', highlight: 'wait', percent: 10, z: 5, quoted: true },
  { scene: 'code', highlight: 'watch', percent: 10, z: 5 },
  { scene: 'code', highlight: 'tables' },
  { scene: 'race', highlight: 'tally', percent: 30, z: 3, quoted: true },
];

export interface Arrival {
  scene?: Scene;
  percent?: number;
  z?: number;
}

/**
 * What the figure sets on arriving at a step. Reached with Next or Back, a
 * step opens its scene and sets the inputs it relies on. When the walkthrough
 * only followed a scene the reader opened by hand (`byHand`), the inputs are
 * the reader's and stay as they are.
 */
export function onArrival(step: number | null, byHand: boolean): Arrival {
  const entry = step === null ? undefined : STEPS[step];
  if (!entry) return {};
  if (byHand || entry.percent === undefined || entry.z === undefined) return { scene: entry.scene };
  return { scene: entry.scene, percent: entry.percent, z: entry.z };
}

/**
 * The step that describes a scene the reader has opened by hand: the first
 * step of that scene whose text does not quote other inputs than the ones on
 * screen. `null` when there is none, and the walkthrough steps aside.
 */
export function stepForScene(scene: Scene, shown: { percent: number; z: number }): number | null {
  const index = STEPS.findIndex(
    (step) => step.scene === scene && (!step.quoted || (step.percent === shown.percent && step.z === shown.z)),
  );
  return index === -1 ? null : index;
}
