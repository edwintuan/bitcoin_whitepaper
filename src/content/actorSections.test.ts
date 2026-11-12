import { describe, expect, it } from 'vitest';
import { ACTOR_ORDER } from './actors';
import { ACTOR_SECTIONS } from './actorSections';
import { SECTIONS } from './sections';

describe('ACTOR_SECTIONS', () => {
  it('lists, for each actor, exactly the chapters whose "who runs this" names it', () => {
    for (const actor of ACTOR_ORDER) {
      const named = SECTIONS.filter((section) => section.whoRuns.some((item) => item.actor === actor)).map((section) => section.number);
      expect(ACTOR_SECTIONS[actor], actor).toEqual(named);
    }
  });

  it('is in the order of the paper, without repeats', () => {
    for (const actor of ACTOR_ORDER) {
      const numbers = ACTOR_SECTIONS[actor];
      expect(numbers, actor).toEqual([...new Set(numbers)].sort((a, b) => a - b));
    }
  });

  it('places the machine that searches for the proof in the proof-of-work chapter', () => {
    expect(ACTOR_SECTIONS['asic-miner']).toContain(4);
  });
});
