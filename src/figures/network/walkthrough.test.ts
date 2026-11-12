// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createDirector } from './director';
import { chainView, recentEvents } from './view';
import { NETWORK_STEPS, OUTAGE_NODE, enterStep, focusNode, hintFor, isReady, prepare } from './walkthrough';

const STEPS = Array.from({ length: NETWORK_STEPS }, (_, step) => step);

describe('the prepared state of each guided step', () => {
  it.each(STEPS)('is ready for step %i', (step) => {
    expect(isReady(step, prepare(step).snapshot())).toBe(true);
  });

  it('is the same every time', () => {
    for (const step of STEPS) expect(prepare(step).snapshot()).toEqual(prepare(step).snapshot());
  });

  it('starts step 0 from a network nobody has touched', () => {
    const s = prepare(0).snapshot();
    expect(s).toEqual(createDirector().snapshot());
    expect(s.t).toBe(0);
  });

  it('has one transaction waiting in every mempool for step 1', () => {
    const s = prepare(1).snapshot();
    expect(s.inFlight).toEqual([]);
    for (const node of s.nodes) expect(node.mempool).toEqual(['tx1']);
    expect(Object.keys(s.blocks)).toEqual(['b0']);
  });

  it('has one block, holding that transaction, on every node from step 2 on', () => {
    for (const step of [2, 3, 4]) {
      const s = prepare(step).snapshot();
      expect(s.inFlight).toEqual([]);
      expect(s.blocks.b1).toMatchObject({ height: 1, parent: 'b0', txs: ['tx1'] });
      for (const node of s.nodes) {
        expect(node.tip).toBe('b1');
        expect(node.mempool).toEqual([]);
        expect(node.online).toBe(true);
      }
    }
  });

  it('follows from the step before when the reader does what that step asks', () => {
    const director = prepare(0);
    director.sendTx();
    director.settle();
    expect(director.snapshot()).toEqual(prepare(1).snapshot());
    director.findBlock();
    director.settle();
    expect(director.snapshot()).toEqual(prepare(2).snapshot());
  });
});

describe('isReady', () => {
  it('wants a quiet, whole, agreed network for every step', () => {
    for (const step of STEPS) {
      const moving = prepare(step);
      moving.findBlock();
      expect(isReady(step, moving.snapshot())).toBe(false);

      const partial = prepare(step);
      partial.setOnline(3, false);
      expect(isReady(step, partial.snapshot())).toBe(false);

      const forked = prepare(step);
      forked.makeFork();
      forked.settle();
      expect(isReady(step, forked.snapshot())).toBe(false);
    }
  });

  it('wants empty mempools before the first transaction, and a waiting one before the first block', () => {
    expect(isReady(0, prepare(1).snapshot())).toBe(false);
    expect(isReady(1, prepare(0).snapshot())).toBe(false);
    expect(isReady(1, prepare(2).snapshot())).toBe(false);
  });

  it('wants at least one block before showing how it was accepted', () => {
    expect(isReady(2, prepare(0).snapshot())).toBe(false);
    expect(isReady(2, prepare(1).snapshot())).toBe(false);
  });

  it('lets the fork and the outage start from any quiet, agreed network', () => {
    for (const from of [0, 1, 2]) {
      expect(isReady(3, prepare(from).snapshot())).toBe(true);
      expect(isReady(4, prepare(from).snapshot())).toBe(true);
    }
  });

  it('is never ready for a step that is not played in the network scene', () => {
    expect(isReady(NETWORK_STEPS, prepare(0).snapshot())).toBe(false);
    expect(isReady(-1, prepare(0).snapshot())).toBe(false);
  });
});

describe('enterStep', () => {
  it('makes the prepared network when there is none', () => {
    expect(enterStep(2, null).snapshot()).toEqual(prepare(2).snapshot());
  });

  it('keeps the reader’s own network when it fits, after letting it come to rest', () => {
    const director = createDirector();
    director.sendTx(7);
    director.sendTx(2); // both still in flight
    const kept = enterStep(1, director);
    expect(kept).toBe(director);
    const s = kept.snapshot();
    expect(s.inFlight).toEqual([]);
    for (const node of s.nodes) expect([...node.mempool].sort()).toEqual(['tx1', 'tx2']);
  });

  it('starts over when the reader’s network does not fit the step', () => {
    const director = createDirector();
    director.setOnline(3, false);
    const fresh = enterStep(0, director);
    expect(fresh).not.toBe(director);
    expect(fresh.snapshot()).toEqual(prepare(0).snapshot());
  });

  it('switches continuous mining off', () => {
    const director = createDirector();
    director.setMining(true);
    expect(enterStep(3, director).mining).toBe(false);
  });
});

describe('focusNode', () => {
  it('leaves the reader’s choice alone where the step has nothing to show in the panel', () => {
    const s = prepare(0).snapshot();
    for (const step of [0, 1, 3]) {
      expect(focusNode(step, s, null)).toBeNull();
      expect(focusNode(step, s, 7)).toBe(7);
    }
  });

  it('shows the accepted block through a node that did not find it', () => {
    const s = prepare(2).snapshot();
    const finder = s.blocks.b1.miner;
    const shown = focusNode(2, s, null);
    expect(shown).not.toBeNull();
    expect(shown).not.toBe(finder);
    expect(recentEvents(s, shown as number, 3).map((event) => event.type)).toEqual(['block-accepted', 'tx-seen']);
    // The reader's own choice stands, unless it is the finder.
    const other = s.nodes.find((node) => node.id !== finder && node.id !== shown)!.id;
    expect(focusNode(2, s, other)).toBe(other);
    expect(focusNode(2, s, finder)).toBe(shown);
  });

  it('proposes a node to take offline, or keeps the one already chosen', () => {
    const s = prepare(4).snapshot();
    expect(focusNode(4, s, null)).toBe(OUTAGE_NODE);
    expect(focusNode(4, s, 8)).toBe(8);
    expect(s.nodes[OUTAGE_NODE].peers).toHaveLength(3);
  });
});

describe('hintFor', () => {
  it('points at Send, then at nothing while the transaction spreads', () => {
    const director = prepare(0);
    expect(hintFor(0, director.snapshot(), null)).toBe('send');
    director.sendTx();
    expect(hintFor(0, director.snapshot(), null)).toBeNull();
    director.settle();
    expect(hintFor(0, director.snapshot(), null)).toBeNull();
  });

  it('points at Find a block while a transaction waits', () => {
    const director = prepare(1);
    expect(hintFor(1, director.snapshot(), null)).toBe('mine');
    director.findBlock();
    expect(hintFor(1, director.snapshot(), null)).toBeNull();
    director.settle();
    expect(hintFor(1, director.snapshot(), null)).toBeNull();
  });

  it('points at the node panel for the accepted block', () => {
    expect(hintFor(2, prepare(2).snapshot(), 4)).toBe('panel');
  });

  it('points at Make a fork, then at Find a block once the network has split', () => {
    const director = prepare(3);
    expect(hintFor(3, director.snapshot(), null)).toBe('fork');
    director.makeFork();
    expect(hintFor(3, director.snapshot(), null)).toBeNull(); // still spreading
    director.settle();
    expect(hintFor(3, director.snapshot(), null)).toBe('mine');
    director.findBlock();
    director.settle();
    expect(hintFor(3, director.snapshot(), null)).toBeNull(); // resolved: nothing left to press
  });

  it('walks the outage: offline, find a block, back online', () => {
    const director = prepare(4);
    const node = OUTAGE_NODE;
    expect(hintFor(4, director.snapshot(), null)).toBeNull();
    expect(hintFor(4, director.snapshot(), node)).toBe('offline');
    director.setOnline(node, false);
    expect(hintFor(4, director.snapshot(), node)).toBe('mine');
    director.findBlock();
    director.settle();
    expect(hintFor(4, director.snapshot(), node)).toBe('online');
    director.setOnline(node, true);
    director.settle();
    expect(hintFor(4, director.snapshot(), node)).toBeNull();
  });

  it('has nothing to point at outside the guided steps', () => {
    expect(hintFor(NETWORK_STEPS, prepare(0).snapshot(), null)).toBeNull();
  });
});

describe('the guided fork, on the figure’s own network', () => {
  it('splits the network into two groups of several nodes each', () => {
    const director = prepare(3);
    director.makeFork();
    director.settle();
    const view = chainView(director.snapshot());
    expect(view.forked).toBe(true);
    expect(view.tips).toHaveLength(2);
    for (const group of view.tips) expect(group.nodes.length).toBeGreaterThanOrEqual(3);
  });

  it('is settled by the next block without the two groups trading places', () => {
    const director = prepare(3);
    const fork = director.makeFork();
    director.settle();
    const found = director.findBlock();
    director.settle();
    const s = director.snapshot();
    // The block mined first stays the main branch: the reader sees the other group switch over.
    expect(s.blocks[found!.block].parent).toBe(fork!.blocks[0]);
    expect(chainView(s).converged).toBe(true);
  });
});

describe('the guided outage, on the figure’s own network', () => {
  it('lets a node that missed two blocks catch up when it returns', () => {
    const director = prepare(4);
    director.setOnline(OUTAGE_NODE, false);
    director.findBlock();
    director.settle();
    director.findBlock();
    director.settle();
    expect(director.snapshot().nodes[OUTAGE_NODE].tip).toBe('b1');

    director.setOnline(OUTAGE_NODE, true);
    director.settle();
    const s = director.snapshot();
    expect(chainView(s).converged).toBe(true);
    expect(s.nodes[OUTAGE_NODE].tip).toBe('b3');
    expect(recentEvents(s, OUTAGE_NODE, 4).map((event) => event.type)).toEqual([
      'block-accepted',
      'block-accepted',
      'online',
      'offline',
    ]);
  });
});
