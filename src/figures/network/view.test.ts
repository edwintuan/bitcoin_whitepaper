// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createNetwork } from '@/lib/netsim';
import type { Network, Snapshot } from '@/lib/netsim';
import { mulberry32 } from '@/lib/rng';
import {
  chainOf,
  chainView,
  farthestPair,
  hopDistances,
  isOnChain,
  lastReorg,
  packetProgress,
  recentEvents,
  sideBlocks,
  situation,
} from './view';

const make = (nodes = 10, latency: [number, number] = [0.05, 0.2]): Network =>
  createNetwork({ nodes, degree: 3, latency, blockInterval: 10, seed: 42 });
/** Two or three nodes in a ring where every hop takes exactly one second. */
const slow = (nodes: number): Network =>
  createNetwork({ nodes, degree: 2, latency: [1, 1], blockInterval: 10, seed: 42 });

function settle(net: Network): Snapshot {
  for (let i = 0; i < 2000 && net.snapshot().inFlight.length > 0; i++) net.step(0.25);
  return net.snapshot();
}

describe('chains', () => {
  it('lists a chain from the genesis block to the tip', () => {
    const net = slow(2);
    const a = net.forceBlock(0);
    const b = net.forceBlock(0);
    const { blocks } = net.snapshot();
    expect(chainOf(blocks, b)).toEqual(['b0', a, b]);
    expect(chainOf(blocks, 'b0')).toEqual(['b0']);
  });

  it('knows whether a block is on the chain that ends at a tip', () => {
    const net = slow(2);
    const mine = net.forceBlock(0);
    const theirs = net.forceBlock(1);
    const next = net.forceBlock(0);
    const { blocks } = net.snapshot();
    expect(isOnChain(blocks, next, mine)).toBe(true);
    expect(isOnChain(blocks, next, 'b0')).toBe(true);
    expect(isOnChain(blocks, next, next)).toBe(true);
    expect(isOnChain(blocks, next, theirs)).toBe(false);
    expect(isOnChain(blocks, mine, next)).toBe(false);
  });

  it('lists the blocks a node keeps aside: known, but not on its own chain', () => {
    const net = slow(2);
    const mine = net.forceBlock(0);
    const theirs = net.forceBlock(1);
    const s = settle(net);
    expect(sideBlocks(s.nodes[0], s.blocks)).toEqual([theirs]);
    expect(sideBlocks(s.nodes[1], s.blocks)).toEqual([mine]);
    const fresh = slow(2).snapshot();
    expect(sideBlocks(fresh.nodes[0], fresh.blocks)).toEqual([]);
  });
});

describe('chainView', () => {
  it('puts every node of a new network on the main branch, up to date', () => {
    const view = chainView(make().snapshot());
    expect(view.best).toBe(0);
    expect(view.leader).toBe('b0');
    expect(view.forked).toBe(false);
    expect(view.converged).toBe(true);
    expect(view.looks).toHaveLength(10);
    for (const look of view.looks) expect(look).toEqual({ branch: 'main', behind: false });
    expect(view.tips).toEqual([{ tip: 'b0', height: 0, branch: 'main', nodes: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] }]);
  });

  it('shows the finder of a new block as up to date and everyone else as behind on the same branch', () => {
    const net = make();
    const block = net.forceBlock(3);
    const view = chainView(net.snapshot());
    expect(view.best).toBe(1);
    expect(view.leader).toBe(block);
    expect(view.forked).toBe(false);
    expect(view.converged).toBe(false);
    view.looks.forEach((look, node) => {
      expect(look).toEqual({ branch: 'main', behind: node !== 3 });
    });
    expect(view.tips.map((group) => group.tip)).toEqual([block, 'b0']);
  });

  it('splits a forked network into two groups; the block mined first is the main one', () => {
    const net = slow(2);
    const first = net.forceBlock(0);
    const second = net.forceBlock(1);
    const view = chainView(settle(net));
    expect(view.forked).toBe(true);
    expect(view.converged).toBe(false);
    expect(view.leader).toBe(first);
    expect(view.looks).toEqual([
      { branch: 'main', behind: false },
      { branch: 'side', behind: false },
    ]);
    expect(view.tips).toEqual([
      { tip: first, height: 1, branch: 'main', nodes: [0] },
      { tip: second, height: 1, branch: 'side', nodes: [1] },
    ]);
  });

  it('keeps the same main branch for as long as the tie lasts, whichever side is larger', () => {
    const net = make();
    const first = net.forceBlock(9);
    const second = net.forceBlock(4);
    for (let i = 0; i < 200; i++) {
      net.step(0.05);
      const view = chainView(net.snapshot());
      expect(view.leader).toBe(first);
      expect(view.tips.find((group) => group.tip === second)?.branch).toBe('side');
    }
  });

  it('marks nodes on the losing tip as a side branch until they switch', () => {
    const net = slow(2);
    net.forceBlock(0);
    const theirs = net.forceBlock(1);
    settle(net);
    const next = net.forceBlock(0); // extends node 0's block
    const during = chainView(net.snapshot());
    expect(during.leader).toBe(next);
    expect(during.forked).toBe(false);
    expect(during.looks).toEqual([
      { branch: 'main', behind: false },
      { branch: 'side', behind: true },
    ]);
    expect(during.tips.map((group) => [group.tip, group.branch])).toEqual([
      [next, 'main'],
      [theirs, 'side'],
    ]);

    const after = chainView(settle(net));
    expect(after.converged).toBe(true);
    expect(after.looks).toEqual([
      { branch: 'main', behind: false },
      { branch: 'main', behind: false },
    ]);
  });

  it('turns the tables when the block mined second gets the next block', () => {
    const net = slow(2);
    const first = net.forceBlock(0);
    net.forceBlock(1);
    settle(net);
    const next = net.forceBlock(1);
    const view = chainView(net.snapshot());
    expect(view.leader).toBe(next);
    expect(view.looks).toEqual([
      { branch: 'side', behind: true },
      { branch: 'main', behind: false },
    ]);
    expect(view.tips.find((group) => group.tip === first)?.branch).toBe('side');
  });

  it('judges the best height by online nodes only, and still places offline ones', () => {
    const net = make();
    net.setOnline(6, false);
    const block = net.forceBlock(0);
    const view = chainView(settle(net));
    expect(view.best).toBe(1);
    expect(view.converged).toBe(true);
    expect(view.looks[6]).toEqual({ branch: 'main', behind: true });
    expect(view.tips).toEqual([{ tip: block, height: 1, branch: 'main', nodes: [0, 1, 2, 3, 4, 5, 7, 8, 9] }]);
  });

  it('falls back to all nodes when none is online', () => {
    const net = slow(2);
    net.setOnline(0, false);
    net.setOnline(1, false);
    const view = chainView(net.snapshot());
    expect(view.best).toBe(0);
    expect(view.converged).toBe(true);
    expect(view.tips).toEqual([]);
  });
});

describe('distances', () => {
  it('counts hops over the links between online nodes', () => {
    const s = slow(4).snapshot(); // a square: 0-1-2-3-0
    expect(hopDistances(s, 0)).toEqual([0, 1, 2, 1]);
    const net = slow(4);
    net.setOnline(1, false);
    expect(hopDistances(net.snapshot(), 0)).toEqual([0, Infinity, 2, 1]);
  });

  it('finds the two candidates that are farthest apart, lowest numbers first on a tie', () => {
    const s = slow(4).snapshot();
    expect(farthestPair(s, [0, 1, 2, 3])).toEqual([0, 2]);
    expect(farthestPair(s, [1, 2, 3])).toEqual([1, 3]);
    expect(farthestPair(s, [2, 3])).toEqual([2, 3]);
    expect(farthestPair(s, [3])).toBeNull();
    expect(farthestPair(s, [])).toBeNull();
  });

  it('never pairs nodes that cannot reach each other', () => {
    const net = slow(4);
    net.setOnline(1, false);
    net.setOnline(3, false);
    expect(farthestPair(net.snapshot(), [0, 2])).toBeNull();
  });
});

describe('situation', () => {
  it('reports a network at rest, with what is waiting', () => {
    const net = make();
    expect(situation(net.snapshot())).toEqual({ kind: 'rest', tip: 'b0', height: 0, waiting: 0, offline: [] });
    net.broadcastTx(0);
    net.broadcastTx(4);
    expect(situation(settle(net))).toEqual({ kind: 'rest', tip: 'b0', height: 0, waiting: 2, offline: [] });
  });

  it('reports a transaction on its way, and how many mempools it has reached', () => {
    const net = slow(3);
    const tx = net.broadcastTx(0);
    expect(situation(net.snapshot())).toEqual({ kind: 'tx-spreading', tx, have: 1, online: 3, offline: [] });
    net.step(3);
    expect(situation(net.snapshot())).toEqual({ kind: 'tx-spreading', tx, have: 3, online: 3, offline: [] });
  });

  it('reports a block on its way, and how many nodes have made it their tip', () => {
    const net = slow(3);
    const block = net.forceBlock(0);
    expect(situation(net.snapshot())).toEqual({
      kind: 'block-spreading',
      block,
      height: 1,
      have: 1,
      online: 3,
      offline: [],
    });
    expect(situation(settle(net))).toEqual({ kind: 'rest', tip: block, height: 1, waiting: 0, offline: [] });
  });

  it('reports a fork with its two groups, moving or at rest', () => {
    const net = slow(2);
    const first = net.forceBlock(0);
    const second = net.forceBlock(1);
    const groups = [
      { tip: first, height: 1, branch: 'main', nodes: [0] },
      { tip: second, height: 1, branch: 'side', nodes: [1] },
    ];
    expect(situation(net.snapshot())).toEqual({ kind: 'fork', groups, offline: [] });
    expect(situation(settle(net))).toEqual({ kind: 'fork', groups, offline: [] });
  });

  it('leaves out what only offline nodes know', () => {
    const net = slow(3);
    net.forceBlock(0);
    net.step(1); // both neighbours have asked node 0 for the block
    net.setOnline(0, false); // and it leaves before answering
    net.step(5);
    const s = net.snapshot();
    expect(s.inFlight).toEqual([]);
    expect(situation(s)).toEqual({ kind: 'rest', tip: 'b0', height: 0, waiting: 0, offline: [0] });
  });

  it('reports online nodes that are behind with nothing on its way to them', () => {
    const net = slow(4); // a square; without nodes 1 and 3, nodes 0 and 2 cannot reach each other
    net.setOnline(1, false);
    net.setOnline(3, false);
    net.forceBlock(0);
    net.step(5);
    const s = net.snapshot();
    expect(s.inFlight).toEqual([]);
    expect(situation(s)).toEqual({ kind: 'cut-off', behind: [2], offline: [1, 3] });
  });

  it('reports other traffic while everyone already agrees', () => {
    const net = slow(2);
    net.setOnline(1, false);
    net.setOnline(1, true); // both sides announce a tip the other already has
    expect(net.snapshot().inFlight.length).toBeGreaterThan(0);
    expect(situation(net.snapshot())).toEqual({ kind: 'busy', offline: [] });
  });

  it('carries the nodes that are offline, whatever else is going on', () => {
    const net = slow(5);
    net.setOnline(4, false);
    net.setOnline(1, false);
    expect(situation(net.snapshot())).toMatchObject({ kind: 'rest', offline: [1, 4] });
    net.broadcastTx(2);
    expect(situation(net.snapshot())).toMatchObject({ kind: 'tx-spreading', offline: [1, 4] });
    settle(net);
    net.forceBlock(2);
    expect(situation(net.snapshot())).toMatchObject({ kind: 'block-spreading', offline: [1, 4] });
    net.forceBlock(3);
    expect(situation(net.snapshot())).toMatchObject({ kind: 'fork', offline: [1, 4] });
  });

  it('calls traffic a block on its way only when it is about a block', () => {
    // A ring of five. Without nodes 1 and 4, node 0 is alone; nodes 2 and 3 still talk to each other.
    const net = slow(5);
    net.setOnline(1, false);
    net.setOnline(4, false);
    net.forceBlock(2);
    const quiet = settle(net);
    expect(situation(quiet)).toEqual({ kind: 'cut-off', behind: [0], offline: [1, 4] });

    // A transaction announced between 2 and 3 does not carry the block to node 0.
    net.broadcastTx(2);
    const s = net.snapshot();
    expect(s.inFlight.length).toBeGreaterThan(0);
    expect(s.inFlight.every((message) => !Object.hasOwn(s.blocks, message.ref))).toBe(true);
    expect(situation(s)).toEqual({ kind: 'cut-off', behind: [0], offline: [1, 4] });
  });

  it('says so when every node is offline', () => {
    const net = slow(2);
    net.setOnline(0, false);
    net.setOnline(1, false);
    expect(situation(net.snapshot())).toEqual({ kind: 'dark', offline: [0, 1] });
  });
});

describe('events', () => {
  it('lists a node’s latest events, newest first', () => {
    const net = slow(2);
    const tx = net.broadcastTx(0);
    net.step(3);
    const block = net.forceBlock(0);
    net.step(3);
    const s = net.snapshot();
    expect(recentEvents(s, 1, 5).map((event) => [event.type, event.ref])).toEqual([
      ['block-accepted', block],
      ['tx-seen', tx],
    ]);
    expect(recentEvents(s, 1, 1)).toHaveLength(1);
    expect(recentEvents(s, 1, 1)[0].type).toBe('block-accepted');
  });

  it('finds the nodes that switched branch for the latest reorg', () => {
    const net = slow(2);
    expect(lastReorg(net.snapshot())).toBeNull();
    net.forceBlock(0);
    net.forceBlock(1);
    settle(net);
    expect(lastReorg(net.snapshot())).toBeNull();
    const next = net.forceBlock(0);
    expect(lastReorg(settle(net))).toEqual({ block: next, nodes: [1] });
  });

  it('groups every node that switched to the same block', () => {
    const net = make();
    const a = net.forceBlock(9);
    const b = net.forceBlock(4);
    const split = settle(net);
    const onB = split.nodes.filter((node) => node.tip === b).map((node) => node.id);
    expect(onB.length).toBeGreaterThan(0);
    const winner = net.forceBlock(split.nodes.find((node) => node.tip === a)!.id);
    expect(lastReorg(settle(net))).toEqual({ block: winner, nodes: onB });
  });
});

describe('packetProgress', () => {
  const message = { id: 1, kind: 'inv' as const, from: 0, to: 1, ref: 'tx1', sentAt: 2, arriveAt: 4 };
  it('runs from 0 when sent to 1 on arrival', () => {
    expect(packetProgress(message, 2)).toBe(0);
    expect(packetProgress(message, 3)).toBe(0.5);
    expect(packetProgress(message, 4)).toBe(1);
  });
  it('stays within 0 and 1', () => {
    expect(packetProgress(message, 1)).toBe(0);
    expect(packetProgress(message, 9)).toBe(1);
    expect(packetProgress({ ...message, arriveAt: 2 }, 2)).toBe(1);
  });
});

describe('whatever the reader does', () => {
  it('always yields a picture that adds up', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const net = createNetwork({ nodes: 10, degree: 3, latency: [0.45, 0.85], blockInterval: 6, seed: 390 });
      const pick = mulberry32(seed);
      const online = new Array<boolean>(10).fill(true);
      net.setMining(true);
      for (let i = 0; i < 500; i++) {
        const roll = pick();
        const node = Math.floor(pick() * 10);
        if (roll < 0.1 && online[node]) net.broadcastTx(node);
        else if (roll < 0.16) net.setOnline(node, (online[node] = !online[node]));
        else if (roll < 0.2 && online[node]) net.forceBlock(node);
        net.step(0.3);

        const s = net.snapshot();
        const view = chainView(s);
        const live = s.nodes.filter((n) => n.online).map((n) => n.id);
        expect(view.looks).toHaveLength(10);
        // The groups split the online nodes between them, each node in exactly one.
        expect(view.tips.flatMap((group) => group.nodes).sort((a, b) => a - b)).toEqual(live);
        for (const group of view.tips) {
          for (const id of group.nodes) expect(s.nodes[id].tip).toBe(group.tip);
          expect(group.height).toBe(s.blocks[group.tip].height);
          expect(group.height).toBeLessThanOrEqual(view.best);
        }
        expect(view.converged).toBe(view.tips.length <= 1);
        if (live.length > 0) {
          expect(view.tips[0].tip).toBe(view.leader);
          expect(view.tips[0].branch).toBe('main');
          expect(view.tips[0].height).toBe(view.best);
        }

        const now = situation(s);
        if (now.kind === 'fork') {
          expect(now.groups.length).toBeGreaterThanOrEqual(2);
          for (const group of now.groups) expect(group.height).toBe(view.best);
        }
        if (now.kind === 'rest') expect(s.inFlight).toEqual([]);
        if (now.kind === 'dark') expect(live).toEqual([]);
        const reorg = lastReorg(s);
        if (reorg) expect(Object.hasOwn(s.blocks, reorg.block)).toBe(true);
        for (const n of s.nodes) expect(chainOf(s.blocks, n.tip)[0]).toBe('b0');
      }
    }
  });
});
