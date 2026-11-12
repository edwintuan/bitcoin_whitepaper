// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { STEPS, onArrival, stepForScene } from './steps';
import type { Scene } from './steps';

const SCENES: Scene[] = ['calculator', 'code', 'race'];

describe('the guided steps of the attack calculator', () => {
  it('visit the three scenes in order', () => {
    expect(STEPS.map((step) => step.scene)).toEqual(['calculator', 'calculator', 'calculator', 'code', 'code', 'race']);
  });

  it('give both inputs wherever the text of a step quotes numbers', () => {
    for (const step of STEPS) {
      if (step.quoted) {
        expect(step.percent).toBeGreaterThanOrEqual(1);
        expect(step.percent).toBeLessThanOrEqual(49);
        expect(Number.isInteger(step.z)).toBe(true);
      }
    }
    expect(STEPS.filter((step) => step.quoted).map((step) => [step.percent, step.z])).toEqual([
      [10, 5],
      [30, 3],
    ]);
  });
});

describe('onArrival', () => {
  it('opens the scene of a step reached with Next or Back and sets the inputs the step relies on', () => {
    expect(onArrival(2, false)).toEqual({ scene: 'calculator', percent: 10, z: 5 });
    expect(onArrival(3, false)).toEqual({ scene: 'code', percent: 10, z: 5 });
    expect(onArrival(5, false)).toEqual({ scene: 'race', percent: 30, z: 3 });
  });

  it('leaves the inputs alone on a step that names none', () => {
    expect(onArrival(0, false)).toEqual({ scene: 'calculator' });
    expect(onArrival(1, false)).toEqual({ scene: 'calculator' });
    expect(onArrival(4, false)).toEqual({ scene: 'code' });
  });

  it('keeps the reader’s inputs when the walkthrough only followed a scene opened by hand', () => {
    STEPS.forEach((step, index) => expect(onArrival(index, true)).toEqual({ scene: step.scene }));
  });

  it('changes nothing outside the walkthrough', () => {
    expect(onArrival(null, false)).toEqual({});
    expect(onArrival(null, true)).toEqual({});
    expect(onArrival(STEPS.length, false)).toEqual({});
  });
});

describe('stepForScene', () => {
  it('follows a scene opened by hand to the first step that describes it', () => {
    expect(stepForScene('calculator', { percent: 45, z: 10 })).toBe(0);
    expect(stepForScene('code', { percent: 45, z: 10 })).toBe(3);
    expect(stepForScene('code', { percent: 10, z: 5 })).toBe(3);
  });

  it('follows to a step that quotes numbers only when the figure shows those numbers', () => {
    expect(stepForScene('race', { percent: 30, z: 3 })).toBe(5);
    expect(stepForScene('race', { percent: 45, z: 10 })).toBeNull();
    expect(stepForScene('race', { percent: 30, z: 4 })).toBeNull();
    expect(stepForScene('race', { percent: 31, z: 3 })).toBeNull();
  });

  it('never lands on a step whose text would contradict the figure', () => {
    for (const scene of SCENES) {
      for (const percent of [1, 10, 30, 45, 49]) {
        for (const z of [0, 3, 5, 10, 100]) {
          const target = stepForScene(scene, { percent, z });
          if (target === null) continue;
          const step = STEPS[target];
          expect(step.scene).toBe(scene);
          if (step.quoted) expect([step.percent, step.z]).toEqual([percent, z]);
        }
      }
    }
  });
});
