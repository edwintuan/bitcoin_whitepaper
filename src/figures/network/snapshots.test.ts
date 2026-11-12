// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** Counts how often the figure asks the simulation for a copy of its whole state. */
let snapshots = 0;

vi.mock('@/lib/netsim', async (original) => {
  const real = await original<typeof import('@/lib/netsim')>();
  return {
    ...real,
    createNetwork: (...args: Parameters<typeof real.createNetwork>) => {
      const net = real.createNetwork(...args);
      return {
        ...net,
        snapshot: () => {
          snapshots += 1;
          return net.snapshot();
        },
      };
    },
  };
});

const { createDirector } = await import('./director');

describe('copies of the network’s state', () => {
  beforeEach(() => {
    snapshots = 0;
  });

  it('are not taken to move time on: that is the one thing done every frame', () => {
    const director = createDirector();
    director.sendTx(0);
    snapshots = 0;
    for (let frame = 0; frame < 600; frame++) director.advance(1 / 60);
    expect(snapshots).toBe(0);
  });

  it('are taken at most once for each thing the reader does', () => {
    const director = createDirector();
    for (const act of [
      () => director.sendTx(),
      () => director.sendTx(4),
      () => director.findBlock(),
      () => director.hop(),
      () => director.canFork(),
      () => director.makeFork(),
    ]) {
      snapshots = 0;
      act();
      expect(snapshots).toBeLessThanOrEqual(1);
    }
    snapshots = 0;
    director.setOnline(2, false);
    director.setMining(true);
    expect(snapshots).toBe(0);
  });

  it('are taken once per wave of messages while the network settles', () => {
    const director = createDirector();
    director.sendTx(0);
    snapshots = 0;
    director.settle();
    const forOneTransaction = snapshots;
    // inv, getdata, tx for each of at most four hops, and a last look to see that all is quiet
    expect(forOneTransaction).toBeLessThanOrEqual(16);
    expect(director.snapshot().inFlight).toEqual([]);

    // A node that missed many blocks fetches them one by one; settling still looks only once per wave.
    director.setOnline(6, false);
    for (let i = 0; i < 40; i++) director.findBlock();
    director.settle();
    director.setOnline(6, true);
    snapshots = 0;
    director.settle();
    expect(snapshots).toBeLessThanOrEqual(2 * 40 + 12);
    snapshots = 0;
    const s = director.snapshot();
    expect(s.inFlight).toEqual([]);
    expect(new Set(s.nodes.map((node) => node.tip)).size).toBe(1);
  });
});
