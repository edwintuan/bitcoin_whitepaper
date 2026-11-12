// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { SECTIONS } from '@/content/sections';
import { STEPS, afterProofAction, afterScene } from './walkthrough';

describe('the guided steps of the payment verification figure', () => {
  it('has one entry for each step the chapter writes', () => {
    const section = SECTIONS.find((entry) => entry.id === 'spv')!;
    expect(STEPS).toHaveLength(section.figure!.steps.en.length);
    expect(STEPS).toHaveLength(section.figure!.steps.zh.length);
  });

  it('plays the first four in the check and the last in the size scene', () => {
    expect(STEPS.map((step) => step.scene)).toEqual(['proof', 'proof', 'proof', 'proof', 'size']);
    expect(STEPS.map((step) => step.highlight)).toEqual(['pick', 'ask', 'next', 'tamper', 'size']);
  });
});

describe('acting by hand in the check', () => {
  it('stays put when a payment is picked in the two steps that come before the fold', () => {
    expect(afterProofAction(0, 'pick')).toBeUndefined();
    expect(afterProofAction(1, 'pick')).toBeUndefined();
  });

  it('goes back to asking when another payment is picked later: its branch has not been asked for', () => {
    expect(afterProofAction(2, 'pick')).toBe(1);
    expect(afterProofAction(3, 'pick')).toBe(1);
  });

  it('moves on to the step about asking when the reader asks in the first step', () => {
    expect(afterProofAction(0, 'ask')).toBe(1);
    expect(afterProofAction(1, 'ask')).toBeUndefined();
  });

  it('moves on to the fold when the reader presses Next hash before the walkthrough gets there', () => {
    expect(afterProofAction(0, 'next')).toBe(2);
    expect(afterProofAction(1, 'next')).toBe(2);
    expect(afterProofAction(2, 'next')).toBeUndefined();
    expect(afterProofAction(3, 'next')).toBeUndefined();
  });

  it('goes to the step about forgery whenever the reader tampers', () => {
    for (const step of [0, 1, 2]) expect(afterProofAction(step, 'tamper')).toBe(3);
    expect(afterProofAction(3, 'tamper')).toBeUndefined();
  });

  it('goes back to asking when the check is started again after the fold', () => {
    expect(afterProofAction(2, 'startAgain')).toBe(1);
    expect(afterProofAction(3, 'startAgain')).toBe(1);
    expect(afterProofAction(1, 'startAgain')).toBeUndefined();
  });

  it('never pulls a reader who is exploring freely back into the walkthrough', () => {
    for (const action of ['pick', 'ask', 'next', 'tamper', 'startAgain'] as const) {
      expect(afterProofAction(null, action)).toBeUndefined();
    }
    expect(afterScene(null, 'size')).toBeUndefined();
  });
});

describe('choosing a scene by hand', () => {
  it('goes to the last step for the size scene', () => {
    for (const step of [0, 1, 2, 3]) expect(afterScene(step, 'size')).toBe(4);
  });

  it('lets the walkthrough go when the reader returns to the check, which is as they left it', () => {
    expect(afterScene(4, 'proof')).toBeNull();
  });

  it('stays when the scene chosen is the one the step plays in', () => {
    expect(afterScene(1, 'proof')).toBeUndefined();
    expect(afterScene(4, 'size')).toBeUndefined();
  });
});
