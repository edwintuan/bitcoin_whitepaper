import { describe, expect, it } from 'vitest';
import section from '@/content/sections/04-proof-of-work';
import { STEPS } from './steps';

describe('the walkthrough of Fig. 4.1', () => {
  it('has one entry for every step of the copy, in both languages', () => {
    expect(section.figure).not.toBeNull();
    expect(section.figure!.steps.en).toHaveLength(STEPS.length);
    expect(section.figure!.steps.zh).toHaveLength(STEPS.length);
  });

  it('visits every scene', () => {
    expect(new Set(STEPS.map((step) => step.scene))).toEqual(new Set(['mine', 'tamper', 'genesis', 'retarget']));
  });

  it('points at something in every step', () => {
    for (const step of STEPS) expect(step.point).toBeTruthy();
  });
});
