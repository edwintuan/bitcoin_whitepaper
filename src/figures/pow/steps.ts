export type Scene = 'mine' | 'tamper' | 'genesis' | 'retarget';

/** The part of a scene a step of the walkthrough points at. */
export type Point = 'header' | 'difficulty' | 'mine' | 'chain' | 'hash' | 'power';

/**
 * The guided steps of section 4, in the order of the copy in
 * `src/content/sections/04-proof-of-work.ts`: the scene each one opens and the
 * part of it the pointer stands beside.
 */
export const STEPS: readonly { scene: Scene; point: Point }[] = [
  { scene: 'mine', point: 'header' },
  { scene: 'mine', point: 'difficulty' },
  { scene: 'mine', point: 'mine' },
  { scene: 'tamper', point: 'chain' },
  { scene: 'genesis', point: 'hash' },
  { scene: 'retarget', point: 'power' },
];
