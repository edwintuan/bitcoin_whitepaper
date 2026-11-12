// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { SECTIONS } from '@/content/sections';
import { STEPS, afterScene, afterTreeAction } from './walkthrough';
import type { TreeState } from './walkthrough';

const four: TreeState = { count: 4, waiting: 0, pruned: false };
const five: TreeState = { count: 5, waiting: 0, pruned: false };
const marked = (count: number, waiting = 1): TreeState => ({ count, waiting, pruned: false });

describe('the guided steps of the Merkle tree figure', () => {
  it('has one entry for each step the chapter writes', () => {
    const section = SECTIONS.find((entry) => entry.id === 'reclaiming-disk-space')!;
    expect(STEPS).toHaveLength(section.figure!.steps.en.length);
    expect(STEPS).toHaveLength(section.figure!.steps.zh.length);
  });

  it('plays the first four in the tree and the last in the storage scene', () => {
    expect(STEPS.map((step) => step.scene)).toEqual(['tree', 'tree', 'tree', 'tree', 'storage']);
    expect(STEPS.map((step) => step.highlight)).toEqual(['play', 'play', 'leaves', 'prune', 'interval']);
  });
});

describe('marking a transaction by hand', () => {
  it('moves from the build of four to the step about marking, which says "Back to four"', () => {
    expect(afterTreeAction(0, 'mark', marked(4))).toBe(2);
  });

  it('lets the walkthrough go at "Add an odd one": five are on screen, and the next step says four', () => {
    expect(afterTreeAction(1, 'mark', marked(5))).toBeNull();
  });

  it('lets go as well when the reader has changed the count in the first step', () => {
    expect(afterTreeAction(0, 'mark', marked(6))).toBeNull();
  });

  it('stays in the step about marking, and in the step about pruning while there is something to prune', () => {
    expect(afterTreeAction(2, 'mark', marked(4))).toBeUndefined();
    expect(afterTreeAction(2, 'mark', four)).toBeUndefined();
    expect(afterTreeAction(3, 'mark', marked(4, 2))).toBeUndefined();
  });

  it('leaves "Press Prune" once the last mark is taken away and nothing was pruned', () => {
    expect(afterTreeAction(3, 'mark', four)).toBe(2);
    expect(afterTreeAction(3, 'mark', five)).toBeNull();
  });

  it('stays at "Press Prune" after a pruning, whatever is marked next', () => {
    expect(afterTreeAction(3, 'mark', { count: 4, waiting: 0, pruned: true })).toBeUndefined();
    expect(afterTreeAction(3, 'mark', { count: 4, waiting: 1, pruned: true })).toBeUndefined();
  });
});

describe('changing the number of transactions by hand', () => {
  it('lets the walkthrough go in the three steps that name a number', () => {
    for (const step of [0, 1, 2]) expect(afterTreeAction(step, 'resize', five), `step ${step}`).toBeNull();
  });

  it('stays at "Press Prune", which holds for a block of any size', () => {
    expect(afterTreeAction(3, 'resize', marked(5, 3))).toBeUndefined();
  });
});

describe('pruning and starting over by hand', () => {
  it('goes to the step about pruning from any earlier one', () => {
    for (const step of [0, 1, 2]) expect(afterTreeAction(step, 'prune', { count: 4, waiting: 0, pruned: true })).toBe(3);
    expect(afterTreeAction(3, 'prune', { count: 4, waiting: 0, pruned: true })).toBeUndefined();
  });

  it('goes back to marking when Start over leaves nothing to prune', () => {
    expect(afterTreeAction(3, 'startOver', four)).toBe(2);
    expect(afterTreeAction(3, 'startOver', five)).toBeNull();
  });

  it('stays put when Start over is pressed in the step about marking', () => {
    expect(afterTreeAction(2, 'startOver', four)).toBeUndefined();
  });
});

describe('a reader who is already exploring freely', () => {
  it('is never pulled back into the walkthrough', () => {
    for (const kind of ['mark', 'resize', 'prune', 'startOver'] as const) {
      expect(afterTreeAction(null, kind, marked(4))).toBeUndefined();
    }
    expect(afterScene(null, 'storage')).toBeUndefined();
    expect(afterScene(null, 'tree')).toBeUndefined();
  });
});

describe('choosing a scene by hand', () => {
  it('goes to the last step for the storage scene', () => {
    for (const step of [0, 1, 2, 3]) expect(afterScene(step, 'storage')).toBe(4);
  });

  it('lets the walkthrough go when the reader returns to the tree, which is as they left it', () => {
    expect(afterScene(4, 'tree')).toBeNull();
  });

  it('stays when the scene chosen is the one the step plays in', () => {
    expect(afterScene(2, 'tree')).toBeUndefined();
    expect(afterScene(4, 'storage')).toBeUndefined();
  });
});
