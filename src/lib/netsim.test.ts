// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { createNetwork } from './netsim';
import type { Network, SimEvent, Snapshot } from './netsim';
import { mulberry32 } from './rng';

const OPTIONS = {
  nodes: 10,
  degree: 3,
  latency: [0.05, 0.2] as [number, number],
  blockInterval: 10,
  seed: 42,
};
const make = (overrides: Partial<typeof OPTIONS> = {}): Network => createNetwork({ ...OPTIONS, ...overrides });

/** A small network where every hop takes exactly one second, so each stage can be observed. */
const slow = (nodes: number): Network => make({ nodes, degree: 2, latency: [1, 1] });

/** Advances in small steps, as an animation loop would. */
function run(net: Network, seconds: number, dt = 0.05): void {
  for (let i = 0; i < Math.round(seconds / dt); i++) net.step(dt);
}

const onlineTips = (s: Snapshot) => new Set(s.nodes.filter((n) => n.online).map((n) => n.tip));
const eventsAt = (s: Snapshot, node: number) => s.events.filter((e) => e.node === node);
const wire = (s: Snapshot) => s.inFlight.map(({ kind, from, to, ref }) => ({ kind, from, to, ref }));
const heightOf = (s: Snapshot, id: string) => s.blocks[id].height;

function hops(s: Snapshot, from: number): number[] {
  const distance = s.nodes.map(() => Number.POSITIVE_INFINITY);
  distance[from] = 0;
  for (const queue = [from]; queue.length > 0; ) {
    const node = queue.shift() as number;
    for (const peer of s.nodes[node].peers) {
      if (distance[peer] === Number.POSITIVE_INFINITY) {
        distance[peer] = distance[node] + 1;
        queue.push(peer);
      }
    }
  }
  return distance;
}

function farthestPair(s: Snapshot): [number, number] {
  let best: [number, number] = [0, 1];
  let bestHops = 0;
  s.nodes.forEach((node) => hops(s, node.id).forEach((d, other) => {
    if (d > bestHops) { bestHops = d; best = [node.id, other]; }
  }));
  return best;
}

describe('a new network', () => {
  it('starts every node on one shared genesis block at height 0, with nothing in motion', () => {
    const s = make().snapshot();
    expect(s.t).toBe(0);
    expect(s.nodes).toHaveLength(10);
    expect(s.inFlight).toEqual([]);
    expect(s.events).toEqual([]);
    const genesis = s.nodes[0].tip;
    expect(Object.keys(s.blocks)).toEqual([genesis]);
    expect(s.blocks[genesis]).toEqual({ id: genesis, parent: null, height: 0, miner: -1, txs: [] });
    s.nodes.forEach((node, i) => {
      expect(node.id).toBe(i);
      expect(node.online).toBe(true);
      expect(node.tip).toBe(genesis);
      expect(node.knownBlocks).toEqual([genesis]);
      expect(node.mempool).toEqual([]);
    });
  });

  it('wires a connected ring plus chords, never exceeding the degree', () => {
    for (const nodes of [2, 3, 6, 10, 16]) {
      for (const degree of [2, 3, 4]) {
        for (let seed = 1; seed <= 8; seed++) {
          const s = make({ nodes, degree, seed }).snapshot();
          s.nodes.forEach((node) => {
            expect(node.peers).toEqual([...new Set(node.peers)].sort((a, b) => a - b));
            expect(node.peers).not.toContain(node.id);
            expect(node.peers.length).toBeLessThanOrEqual(degree);
            expect(node.peers).toContain((node.id + 1) % nodes);
            for (const peer of node.peers) expect(s.nodes[peer].peers).toContain(node.id);
          });
          expect(hops(s, 0).every((d) => d < nodes)).toBe(true);
        }
      }
    }
  });
  it('adds chords when the degree leaves room for them', () => {
    for (let seed = 1; seed <= 8; seed++) {
      const edges = (degree: number) =>
        make({ degree, seed }).snapshot().nodes.reduce((sum, node) => sum + node.peers.length, 0) / 2;
      expect(edges(2)).toBe(10);
      expect(edges(3)).toBeGreaterThan(10);
      expect(edges(4)).toBeGreaterThan(edges(3));
    }
  });
  it('places nodes at distinct points inside the unit square', () => {
    const { nodes } = make().snapshot();
    for (const node of nodes) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x).toBeLessThanOrEqual(1);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeLessThanOrEqual(1);
    }
    expect(new Set(nodes.map((n) => `${n.x},${n.y}`)).size).toBe(nodes.length);
  });
  it('splits the hash power into positive shares that sum to 1', () => {
    const { nodes } = make().snapshot();
    for (const node of nodes) expect(node.hashPower).toBeGreaterThan(0);
    expect(nodes.reduce((sum, node) => sum + node.hashPower, 0)).toBeCloseTo(1, 12);
  });
  it('gives nodes unequal hash power, but none more than three times another', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const shares = make({ seed }).snapshot().nodes.map((node) => node.hashPower);
      expect(new Set(shares).size).toBe(shares.length);
      expect(Math.max(...shares) / Math.min(...shares)).toBeLessThan(3);
    }
  });
  it('rejects options it cannot build a network from', () => {
    const bad: Partial<typeof OPTIONS>[] = [
      { nodes: 1 }, { nodes: 0 }, { nodes: 2.5 }, { degree: 1 }, { degree: 2.5 },
      { latency: [-1, 1] }, { latency: [2, 1] }, { latency: [0, Number.POSITIVE_INFINITY] },
      { blockInterval: 0 }, { blockInterval: -5 }, { blockInterval: Number.NaN },
    ];
    for (const overrides of bad) expect(() => make(overrides)).toThrow(RangeError);
  });
});

describe('determinism', () => {
  function scripted(seed: number): Snapshot[] {
    const net = make({ seed });
    const shots = [net.snapshot()];
    net.setMining(true);
    for (let i = 0; i < 400; i++) {
      if (i === 10) net.broadcastTx(2);
      if (i === 40) { net.forceBlock(0); net.forceBlock(5); }
      if (i === 80) net.setOnline(7, false);
      if (i === 90) net.broadcastTx(1);
      if (i === 200) net.setOnline(7, true);
      net.step(0.1);
      shots.push(net.snapshot());
    }
    return shots;
  }

  it('replays the same snapshots, step for step, from the same seed', () => {
    expect(scripted(7)).toEqual(scripted(7));
  });
  it('lays out and times things differently for another seed', () => {
    const [a, b] = [scripted(7), scripted(8)];
    expect(a[0].nodes).not.toEqual(b[0].nodes);
    expect(a[a.length - 1]).not.toEqual(b[b.length - 1]);
  });
  it('never consults Math.random or the clock', () => {
    const random = vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('Math.random was called'); });
    const dateNow = vi.spyOn(Date, 'now').mockImplementation(() => { throw new Error('Date.now was called'); });
    const perfNow = vi.spyOn(performance, 'now').mockImplementation(() => { throw new Error('performance.now was called'); });
    let shots = 0;
    try {
      shots = scripted(3).length;
    } finally {
      random.mockRestore();
      dateNow.mockRestore();
      perfNow.mockRestore();
    }
    expect(shots).toBe(401);
  });
  it('gives the same result whatever the size of the steps', () => {
    const play = (dt: number): Snapshot => {
      const net = make();
      net.broadcastTx(3);
      net.forceBlock(0);
      net.forceBlock(6);
      run(net, 30, dt);
      return { ...net.snapshot(), t: 30 };
    };
    expect(play(0.01)).toEqual(play(30));
    expect(play(0.25)).toEqual(play(30));
  });
});

describe('time', () => {
  it('advances only through step', () => {
    const net = make();
    net.broadcastTx(0);
    net.forceBlock(1);
    net.setOnline(2, false);
    net.setMining(true);
    expect(net.snapshot().t).toBe(0);
    net.step(0.5);
    net.step(0.25);
    expect(net.snapshot().t).toBe(0.75);
    net.step(0);
    expect(net.snapshot().t).toBe(0.75);
  });
  it('rejects a step that is negative or not a number', () => {
    const net = make();
    expect(() => net.step(-0.1)).toThrow(RangeError);
    expect(() => net.step(Number.NaN)).toThrow(RangeError);
    expect(() => net.step(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
  it('sends messages only between peers, with a latency drawn from the configured range', () => {
    const net = make();
    for (const node of [0, 5, 8]) net.broadcastTx(node);
    net.forceBlock(2);
    net.forceBlock(7);
    const seen = new Map<number, Snapshot['inFlight'][number]>();
    let topology = net.snapshot();
    for (let i = 0; i < 600; i++) {
      net.step(0.02);
      topology = net.snapshot();
      for (const message of topology.inFlight) seen.set(message.id, message);
    }
    expect(seen.size).toBeGreaterThan(100);
    for (const m of seen.values()) {
      expect(topology.nodes[m.from].peers).toContain(m.to);
      expect(m.arriveAt - m.sentAt).toBeGreaterThanOrEqual(0.05 - 1e-12);
      expect(m.arriveAt - m.sentAt).toBeLessThanOrEqual(0.2 + 1e-12);
    }
    const latencies = [...seen.values()].map((m) => m.arriveAt - m.sentAt);
    expect(Math.max(...latencies) - Math.min(...latencies)).toBeGreaterThan(0.1);
  });
  it('lists messages in flight in order of arrival and removes them once delivered', () => {
    const net = make();
    net.broadcastTx(0);
    const first = net.snapshot();
    expect(first.inFlight.length).toBe(first.nodes[0].peers.length);
    for (let i = 0; i < 300; i++) {
      net.step(0.03);
      const s = net.snapshot();
      const arrivals = s.inFlight.map((m) => m.arriveAt);
      expect(arrivals).toEqual([...arrivals].sort((a, b) => a - b));
      for (const m of s.inFlight) {
        expect(m.sentAt).toBeLessThanOrEqual(s.t);
        expect(m.arriveAt).toBeGreaterThan(s.t);
      }
    }
    expect(net.snapshot().inFlight).toEqual([]);
  });
});

describe('gossip, one hop at a time', () => {
  it('passes a transaction along as inv, getdata, tx', () => {
    const net = slow(2);
    const tx = net.broadcastTx(0);
    expect(net.snapshot().inFlight).toMatchObject([{ kind: 'inv', from: 0, to: 1, ref: tx, sentAt: 0, arriveAt: 1 }]);
    expect(net.snapshot().nodes.map((n) => n.mempool)).toEqual([[tx], []]);

    net.step(1);
    expect(net.snapshot().inFlight).toMatchObject([{ kind: 'getdata', from: 1, to: 0, ref: tx, sentAt: 1, arriveAt: 2 }]);
    net.step(1);
    expect(net.snapshot().inFlight).toMatchObject([{ kind: 'tx', from: 0, to: 1, ref: tx, sentAt: 2, arriveAt: 3 }]);
    expect(net.snapshot().nodes[1].mempool).toEqual([]);
    net.step(1);

    const end = net.snapshot();
    expect(end.inFlight).toEqual([]);
    expect(end.nodes.map((n) => n.mempool)).toEqual([[tx], [tx]]);
    expect(end.events).toEqual([
      { t: 0, node: 0, type: 'tx-seen', ref: tx },
      { t: 3, node: 1, type: 'tx-seen', ref: tx },
    ]);
  });
  it('passes a block along as inv, getdata, block', () => {
    const net = slow(2);
    const genesis = net.snapshot().nodes[0].tip;
    const block = net.forceBlock(0);
    expect(net.snapshot().blocks[block]).toEqual({ id: block, parent: genesis, height: 1, miner: 0, txs: [] });
    expect(wire(net.snapshot())).toEqual([{ kind: 'inv', from: 0, to: 1, ref: block }]);
    net.step(1);
    expect(wire(net.snapshot())).toEqual([{ kind: 'getdata', from: 1, to: 0, ref: block }]);
    net.step(1);
    expect(wire(net.snapshot())).toEqual([{ kind: 'block', from: 0, to: 1, ref: block }]);
    expect(net.snapshot().nodes[1].tip).toBe(genesis);
    net.step(1);

    const end = net.snapshot();
    expect(end.inFlight).toEqual([]);
    expect(end.nodes.map((n) => n.tip)).toEqual([block, block]);
    expect(end.nodes[1].knownBlocks).toEqual([genesis, block]);
    expect(end.events).toEqual([
      { t: 0, node: 0, type: 'block-mined', ref: block },
      { t: 3, node: 1, type: 'block-accepted', ref: block },
    ]);
  });
  it('announces a new object to every peer except the one it came from', () => {
    const net = slow(3); // a triangle
    const tx = net.broadcastTx(0);
    expect(wire(net.snapshot())).toEqual([
      { kind: 'inv', from: 0, to: 1, ref: tx }, { kind: 'inv', from: 0, to: 2, ref: tx },
    ]);
    net.step(3); // nodes 1 and 2 have fetched it from node 0
    expect(wire(net.snapshot())).toEqual([
      { kind: 'inv', from: 1, to: 2, ref: tx }, { kind: 'inv', from: 2, to: 1, ref: tx },
    ]);
    net.step(1); // both already have it: nothing more to say
    expect(net.snapshot().inFlight).toEqual([]);
  });
  it('asks only the first announcer while that request is outstanding', () => {
    const net = slow(4); // a square: node 2 hears of the transaction from 1 and 3 at once
    const tx = net.broadcastTx(0);
    net.step(4);
    expect(wire(net.snapshot())).toEqual([{ kind: 'getdata', from: 2, to: 1, ref: tx }]);
    net.step(2);
    expect(net.snapshot().nodes[2].mempool).toEqual([tx]);
    expect(wire(net.snapshot())).toEqual([{ kind: 'inv', from: 2, to: 3, ref: tx }]);
    net.step(1);
    expect(net.snapshot().inFlight).toEqual([]);
  });
  it('numbers messages in the order they are sent', () => {
    const net = make();
    net.broadcastTx(0);
    net.forceBlock(4);
    const ids: number[] = [];
    for (let i = 0; i < 80; i++) {
      for (const m of net.snapshot().inFlight) if (!ids.includes(m.id)) ids.push(m.id);
      net.step(0.02);
    }
    const bySendTime = [...ids].sort((a, b) => a - b);
    expect(new Set(ids).size).toBe(ids.length);
    expect(bySendTime[0]).toBe(1);
    expect(bySendTime[bySendTime.length - 1]).toBe(bySendTime.length);
  });
});

describe('transactions', () => {
  it('reach the mempool of every online node', () => {
    const net = make();
    const tx = net.broadcastTx(0);
    run(net, 20);
    const s = net.snapshot();
    for (const node of s.nodes) expect(node.mempool).toEqual([tx]);
    expect(s.events.filter((e) => e.type === 'tx-seen' && e.ref === tx)).toHaveLength(10);
    expect(s.inFlight).toEqual([]);
  });
  it('get short ids that are unique and repeat from run to run', () => {
    const [a, b] = [make(), make()];
    const ids = [a.broadcastTx(0), a.broadcastTx(1), a.broadcastTx(0)];
    expect(new Set(ids).size).toBe(3);
    for (const id of ids) expect(id.length).toBeLessThanOrEqual(8);
    expect([b.broadcastTx(0), b.broadcastTx(1), b.broadcastTx(0)]).toEqual(ids);
  });
  it('leave every mempool once a block includes them', () => {
    const net = make();
    const first = net.broadcastTx(0);
    const second = net.broadcastTx(5);
    run(net, 20);
    const block = net.forceBlock(8);
    expect(net.snapshot().nodes[8].mempool).toEqual([]);
    run(net, 20);
    const s = net.snapshot();
    expect([...s.blocks[block].txs].sort()).toEqual([first, second].sort());
    for (const node of s.nodes) {
      expect(node.mempool).toEqual([]);
      expect(node.tip).toBe(block);
    }
  });
  it('are served to a peer that asks after they were mined, and leave its mempool when the block follows', () => {
    const net = slow(2);
    const tx = net.broadcastTx(0); // the inv is on its way to node 1
    const block = net.forceBlock(0); // and so is the block that already contains it
    net.step(3);
    expect(net.snapshot().blocks[block].txs).toEqual([tx]);
    expect(net.snapshot().nodes.map((n) => n.mempool)).toEqual([[], []]);
    expect(net.snapshot().nodes.map((n) => n.tip)).toEqual([block, block]);
    expect(eventsAt(net.snapshot(), 1).map((e) => [e.type, e.ref])).toEqual([
      ['tx-seen', tx], ['block-accepted', block],
    ]);
  });
});

describe('blocks and forks', () => {
  it('converge on a forced block everywhere', () => {
    const net = make();
    const block = net.forceBlock(3);
    run(net, 20);
    const s = net.snapshot();
    expect(onlineTips(s)).toEqual(new Set([block]));
    expect(s.blocks[block]).toMatchObject({ height: 1, miner: 3 });
    expect(s.events.filter((e) => e.type === 'block-accepted')).toHaveLength(9);
    expect(s.events.filter((e) => e.type === 'reorg')).toEqual([]);
  });
  it('get short ids that are unique and repeat from run to run', () => {
    const [a, b] = [make(), make()];
    const ids = [a.forceBlock(0), a.forceBlock(0), a.forceBlock(4)];
    expect(new Set([...ids, a.snapshot().nodes[9].tip]).size).toBe(4);
    for (const id of ids) expect(id.length).toBeLessThanOrEqual(8);
    expect([b.forceBlock(0), b.forceBlock(0), b.forceBlock(4)]).toEqual(ids);
  });
  it('split the network when two distant nodes mine at once, then heal on the next block', () => {
    const net = make();
    const [a, b] = farthestPair(net.snapshot());
    const blockA = net.forceBlock(a);
    const blockB = net.forceBlock(b);
    run(net, 20);

    const split = net.snapshot();
    expect(onlineTips(split)).toEqual(new Set([blockA, blockB]));
    expect(split.nodes[a].tip).toBe(blockA);
    expect(split.nodes[b].tip).toBe(blockB);
    expect(heightOf(split, blockA)).toBe(1);
    expect(heightOf(split, blockB)).toBe(1);
    expect(split.events.filter((e) => e.type === 'reorg')).toEqual([]);
    expect(split.inFlight).toEqual([]);

    const blockC = net.forceBlock(a);
    run(net, 20);

    const healed = net.snapshot();
    expect(healed.blocks[blockC]).toMatchObject({ parent: blockA, height: 2 });
    expect(onlineTips(healed)).toEqual(new Set([blockC]));
    const reorgs = healed.events.filter((e) => e.type === 'reorg');
    expect(reorgs.length).toBeGreaterThanOrEqual(1);
    expect(reorgs.map((e) => e.node)).toContain(b);
    expect(reorgs.map((e) => e.node)).not.toContain(a);
    for (const e of reorgs) expect(e.ref).toBe(blockC);
    const numerically = (x: number, y: number) => x - y;
    const switched = split.nodes.filter((n) => n.tip === blockB).map((n) => n.id).sort(numerically);
    expect(reorgs.map((e) => e.node).sort(numerically)).toEqual(switched);
    for (const node of healed.nodes) {
      expect(node.knownBlocks).toContain(blockA);
      expect(node.knownBlocks).toContain(blockC);
    }
  });
  it('keep the block seen first on a tie, and save the other branch', () => {
    const net = slow(2);
    const genesis = net.snapshot().nodes[0].tip;
    const mine = net.forceBlock(0);
    const theirs = net.forceBlock(1);
    run(net, 6, 1);
    const tied = net.snapshot();
    expect(tied.nodes.map((n) => n.tip)).toEqual([mine, theirs]);
    expect(tied.nodes[0].knownBlocks).toEqual([genesis, mine, theirs]);
    expect(tied.nodes[1].knownBlocks).toEqual([genesis, theirs, mine]);
    expect(tied.events.map((e) => e.type)).toEqual(['block-mined', 'block-mined']);

    const next = net.forceBlock(0);
    run(net, 6, 1);
    const resolved = net.snapshot();
    expect(resolved.nodes.map((n) => n.tip)).toEqual([next, next]);
    expect(eventsAt(resolved, 1).map((e) => [e.type, e.ref])).toEqual([
      ['block-mined', theirs], ['block-accepted', next], ['reorg', next],
    ]);
    expect(eventsAt(resolved, 0).map((e) => e.type)).toEqual(['block-mined', 'block-mined']);
  });
  it('return the transactions of an abandoned branch to the mempool', () => {
    const net = slow(3);
    const tx = net.broadcastTx(0);
    const loser = net.forceBlock(0); // contains tx
    net.forceBlock(1);
    const winner = net.forceBlock(1); // two blocks, mined before node 1 heard of tx
    run(net, 12, 1);

    const s = net.snapshot();
    expect(s.blocks[loser].txs).toEqual([tx]);
    expect(s.blocks[winner]).toMatchObject({ height: 2, txs: [] });
    expect(onlineTips(s)).toEqual(new Set([winner]));
    for (const node of s.nodes) expect(node.mempool).toEqual([tx]);
    expect(eventsAt(s, 0).map((e) => e.type)).toContain('reorg');

    const next = net.forceBlock(2);
    run(net, 12, 1);
    const end = net.snapshot();
    expect(end.blocks[next].txs).toEqual([tx]);
    for (const node of end.nodes) {
      expect(node.mempool).toEqual([]);
      expect(node.tip).toBe(next);
    }
  });
});

describe('going offline and coming back', () => {
  it('cuts a node off: it neither receives nor sends', () => {
    const net = make();
    const genesis = net.snapshot().nodes[4].tip;
    net.setOnline(4, false);
    const tx = net.broadcastTx(0);
    const block = net.forceBlock(1);
    for (let i = 0; i < 400; i++) {
      net.step(0.05);
      for (const m of net.snapshot().inFlight) {
        expect(m.to).not.toBe(4);
        expect(m.from).not.toBe(4);
      }
    }
    const s = net.snapshot();
    expect(s.nodes[4]).toMatchObject({ online: false, tip: genesis, mempool: [], knownBlocks: [genesis] });
    expect(onlineTips(s)).toEqual(new Set([block]));
    expect(s.blocks[block].txs).toEqual([]);
    for (const node of s.nodes.filter((n) => n.online)) expect(node.mempool).toEqual([tx]);
    expect(() => net.broadcastTx(4)).toThrow(/offline/);
    expect(() => net.forceBlock(4)).toThrow(/offline/);
  });
  it('lets a returning node catch up with the tip', () => {
    const net = make();
    net.setOnline(6, false);
    let tip = '';
    for (const miner of [0, 2, 9]) {
      tip = net.forceBlock(miner);
      run(net, 10);
    }
    expect(onlineTips(net.snapshot())).toEqual(new Set([tip]));
    expect(heightOf(net.snapshot(), tip)).toBe(3);
    expect(net.snapshot().nodes[6].knownBlocks).toHaveLength(1);

    net.setOnline(6, true);
    run(net, 20);
    const s = net.snapshot();
    expect(s.nodes[6].tip).toBe(tip);
    expect(s.nodes[6].knownBlocks).toHaveLength(4);
    expect(eventsAt(s, 6).map((e) => e.type)).toEqual([
      'offline', 'online', 'block-accepted', 'block-accepted', 'block-accepted',
    ]);
    expect(s.inFlight).toEqual([]);
  });
  it('asks for each block it missed when the next one shows the gap', () => {
    const net = slow(2);
    const genesis = net.snapshot().nodes[0].tip;
    net.setOnline(1, false);
    const [a, b, c] = [net.forceBlock(0), net.forceBlock(0), net.forceBlock(0)];
    net.step(5);
    expect(net.snapshot().inFlight).toEqual([]);

    net.setOnline(1, true); // both sides announce their tips
    expect(wire(net.snapshot())).toEqual([
      { kind: 'inv', from: 1, to: 0, ref: genesis }, { kind: 'inv', from: 0, to: 1, ref: c },
    ]);
    net.step(3); // inv, getdata, block c: its parent b is unknown
    expect(wire(net.snapshot())).toEqual([{ kind: 'getdata', from: 1, to: 0, ref: b }]);
    expect(net.snapshot().nodes[1].tip).toBe(genesis);
    net.step(2); // block b: its parent a is unknown too
    expect(wire(net.snapshot())).toEqual([{ kind: 'getdata', from: 1, to: 0, ref: a }]);
    net.step(2); // block a connects, and b and c after it

    const s = net.snapshot();
    expect(s.nodes[1].tip).toBe(c);
    expect(s.nodes[1].knownBlocks).toEqual([genesis, a, b, c]);
    expect(eventsAt(s, 1)).toEqual([
      { t: 0, node: 1, type: 'offline', ref: genesis },
      { t: 5, node: 1, type: 'online', ref: genesis },
      { t: 12, node: 1, type: 'block-accepted', ref: a },
      { t: 12, node: 1, type: 'block-accepted', ref: b },
      { t: 12, node: 1, type: 'block-accepted', ref: c },
    ]);
    expect(s.inFlight).toEqual([]);
  });
  it('asks again after a request was lost to a peer going offline', () => {
    const net = slow(3);
    const block = net.forceBlock(0);
    net.step(1); // nodes 1 and 2 have asked node 0 for the block
    net.setOnline(0, false);
    net.step(2); // their requests arrive at a node that is gone
    expect(net.snapshot().inFlight).toEqual([]);
    expect(net.snapshot().nodes.map((n) => n.knownBlocks.length)).toEqual([2, 1, 1]);

    net.setOnline(0, true);
    net.step(3);
    expect(net.snapshot().nodes.map((n) => n.tip)).toEqual([block, block, block]);
  });
  it('drops what is in flight to a node that has gone offline', () => {
    const net = slow(2);
    net.broadcastTx(0);
    net.setOnline(1, false);
    net.step(1);
    net.setOnline(1, true);
    net.step(10);
    expect(net.snapshot().nodes[1].mempool).toEqual([]);
  });
  it('logs each change of state once', () => {
    const net = slow(2);
    const genesis = net.snapshot().nodes[0].tip;
    net.setOnline(1, true); // already online
    net.setOnline(1, false);
    net.setOnline(1, false);
    net.step(2);
    net.setOnline(1, true);
    expect(net.snapshot().events).toEqual([
      { t: 0, node: 1, type: 'offline', ref: genesis },
      { t: 2, node: 1, type: 'online', ref: genesis },
    ]);
    expect(net.snapshot().nodes[1].online).toBe(true);
  });
  it('rejects node numbers that do not exist', () => {
    const net = make();
    for (const bad of [-1, 10, 1.5, Number.NaN]) {
      expect(() => net.broadcastTx(bad)).toThrow(RangeError);
      expect(() => net.forceBlock(bad)).toThrow(RangeError);
      expect(() => net.setOnline(bad, false)).toThrow(RangeError);
    }
  });
});

describe('mining', () => {
  it('is off until switched on', () => {
    const net = make();
    run(net, 500, 1);
    expect(Object.keys(net.snapshot().blocks)).toHaveLength(1);
  });
  it('finds blocks at the configured average interval, shared out by hash power', () => {
    const net = make();
    net.setMining(true);
    run(net, 20_000, 1);
    const s = net.snapshot();
    const mined = Object.values(s.blocks).filter((block) => block.parent !== null);

    expect(Math.abs(mined.length - 2000)).toBeLessThan(150); // Poisson: sd is about 45
    for (const node of s.nodes) {
      const count = mined.filter((block) => block.miner === node.id).length;
      const expected = mined.length * node.hashPower;
      const sd = Math.sqrt(expected * (1 - node.hashPower));
      expect(Math.abs(count - expected)).toBeLessThan(5 * sd);
    }
    const best = Math.max(...s.nodes.map((node) => heightOf(s, node.tip)));
    expect(best).toBeGreaterThan(mined.length * 0.8);
    expect(best).toBeLessThanOrEqual(mined.length);
  });
  it('stops when switched off, and every node ends at the same height', () => {
    const net = make();
    net.setMining(true);
    run(net, 300, 0.5);
    net.setMining(false);
    run(net, 20);
    const before = Object.keys(net.snapshot().blocks).length;
    expect(before).toBeGreaterThan(1);
    run(net, 500, 1);
    const s = net.snapshot();
    expect(Object.keys(s.blocks)).toHaveLength(before);
    expect(new Set(s.nodes.map((node) => heightOf(s, node.tip))).size).toBe(1);
    expect(s.inFlight).toEqual([]);
  });
  it('leaves offline nodes out', () => {
    const net = make();
    net.setOnline(2, false);
    net.setOnline(7, false);
    net.setMining(true);
    run(net, 3000, 1);
    const miners = new Set(Object.values(net.snapshot().blocks).map((block) => block.miner));
    expect(miners.has(2)).toBe(false);
    expect(miners.has(7)).toBe(false);
    expect(miners.size).toBeGreaterThan(5);
  });
  it('does nothing while every node is offline', () => {
    const net = slow(2);
    net.setOnline(0, false);
    net.setOnline(1, false);
    net.setMining(true);
    run(net, 500, 1);
    expect(Object.keys(net.snapshot().blocks)).toHaveLength(1);
  });
  it('confirms every transaction exactly once on the chain the network settles on', () => {
    const net = make();
    const txs = [net.broadcastTx(0), net.broadcastTx(3), net.broadcastTx(3), net.broadcastTx(8)];
    net.setMining(true);
    for (let i = 0; i < 300; i++) {
      if (i % 60 === 30) txs.push(net.broadcastTx(i % 10));
      net.step(1);
    }
    net.setMining(false);
    run(net, 20);
    net.forceBlock(0);
    run(net, 20);

    const s = net.snapshot();
    expect(onlineTips(s).size).toBe(1);
    const confirmed: string[] = [];
    for (let id: string | null = s.nodes[0].tip; id !== null; id = s.blocks[id].parent) {
      confirmed.push(...s.blocks[id].txs);
    }
    expect([...confirmed].sort()).toEqual([...txs].sort());
    for (const node of s.nodes) expect(node.mempool).toEqual([]);
  });

  it('spaces blocks as a Poisson process: counts per window vary as much as their mean', () => {
    // Evenly spaced blocks with the same average would pass a test of the mean alone.
    const net = make();
    net.setMining(true);
    const counts: number[] = [];
    let before = 1;
    for (let window = 0; window < 300; window++) {
      net.step(100);
      const now = Object.keys(net.snapshot().blocks).length;
      counts.push(now - before);
      before = now;
    }
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((a, b) => a + (b - mean) ** 2, 0) / (counts.length - 1);
    expect(mean).toBeGreaterThan(9);
    expect(mean).toBeLessThan(11);
    expect(variance / mean).toBeGreaterThan(0.75);
    expect(variance / mean).toBeLessThan(1.25);
  });

  it('does not redraw the next block when mining is switched on twice', () => {
    const once = make();
    const twice = make();
    once.setMining(true);
    twice.setMining(true);
    twice.setMining(true);
    once.step(200);
    twice.step(200);
    expect(twice.snapshot()).toEqual(once.snapshot());
  });
});

describe('the event log', () => {
  it('keeps only the latest 200 events, oldest first', () => {
    const net = slow(2);
    net.setOnline(1, false);
    const refs: string[] = [];
    for (let i = 0; i < 250; i++) {
      refs.push(net.broadcastTx(0));
      net.step(1);
    }
    const { events } = net.snapshot();
    expect(events).toHaveLength(200);
    expect(events.map((e) => e.ref)).toEqual(refs.slice(-200));
    expect(events.map((e) => e.t)).toEqual(Array.from({ length: 200 }, (_, i) => i + 50));
  });
  it('records events in the order they happen', () => {
    const net = make();
    net.setMining(true);
    net.broadcastTx(0);
    run(net, 60, 0.5);
    const { events, t } = net.snapshot();
    const times = events.map((e: SimEvent) => e.t);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(times[times.length - 1]).toBeLessThanOrEqual(t);
  });
});

describe('snapshot', () => {
  it('is a copy: editing it does not disturb the simulation', () => {
    // Compared with an untouched twin, not with an earlier snapshot of the same
    // network: if snapshots shared anything with the simulation, an earlier one
    // would be edited along with it and the comparison could never fail.
    const net = make();
    const twin = make();
    for (const n of [net, twin]) {
      n.broadcastTx(0);
      n.forceBlock(1);
      n.step(0.01);
    }

    const s = net.snapshot();
    const block = s.nodes[1].tip;
    s.nodes[0].mempool.push('forged');
    s.nodes[0].peers.length = 0;
    s.nodes[1].knownBlocks.length = 0;
    s.nodes[1].tip = 'forged';
    s.nodes[2].online = false;
    s.blocks[block].txs.push('forged');
    s.blocks[block].height = 99;
    delete s.blocks[block];
    s.inFlight[0].to = 9;
    s.inFlight[0].arriveAt = 1e9;
    s.inFlight.length = 0;
    s.events[0].ref = 'forged';
    s.events.length = 0;

    expect(net.snapshot()).toEqual(twin.snapshot());
    for (const n of [net, twin]) n.step(20);
    expect(net.snapshot()).toEqual(twin.snapshot());
  });
});

describe('invariants under a random schedule', () => {
  /** Everything that must hold for every node at every moment; returns what does not. */
  function violations(s: Snapshot): string[] {
    const found: string[] = [];
    for (const node of s.nodes) {
      const known = new Set(node.knownBlocks);
      if (known.size !== node.knownBlocks.length) found.push(`node ${node.id} lists a block twice`);
      for (const id of node.knownBlocks) {
        const parent = s.blocks[id].parent;
        if (parent !== null && !known.has(parent)) found.push(`node ${node.id} has ${id} without its parent`);
      }
      const best = Math.max(...node.knownBlocks.map((id) => s.blocks[id].height));
      if (s.blocks[node.tip].height !== best) found.push(`node ${node.id} is not on its highest block`);

      const confirmed = new Set<string>();
      for (let id: string | null = node.tip; id !== null; id = s.blocks[id].parent) {
        if (s.blocks[id].parent !== null && s.blocks[id].height !== s.blocks[s.blocks[id].parent as string].height + 1) {
          found.push(`block ${id} is not one above its parent`);
        }
        for (const tx of s.blocks[id].txs) {
          if (confirmed.has(tx)) found.push(`node ${node.id} has ${tx} twice on its chain`);
          confirmed.add(tx);
        }
      }
      if (new Set(node.mempool).size !== node.mempool.length) found.push(`node ${node.id} has a duplicate in its mempool`);
      for (const tx of node.mempool) {
        if (confirmed.has(tx)) found.push(`node ${node.id} keeps confirmed ${tx} in its mempool`);
      }
    }
    for (const m of s.inFlight) {
      if (!s.nodes[m.from].peers.includes(m.to)) found.push(`message ${m.id} travels between strangers`);
      if (m.arriveAt < m.sentAt || m.arriveAt <= s.t) found.push(`message ${m.id} should have arrived`);
    }
    const seen = new Set<string>();
    for (const e of s.events) {
      if (e.type !== 'tx-seen') continue;
      if (seen.has(`${e.node}:${e.ref}`)) found.push(`node ${e.node} saw ${e.ref} twice`);
      seen.add(`${e.node}:${e.ref}`);
    }
    if (s.events.length > 200) found.push('the event log outgrew its limit');
    return found;
  }

  it('holds while nodes drop out, transactions arrive and blocks race slow links', () => {
    for (let seed = 1; seed <= 12; seed++) {
      // Slow links and fast blocks, so that blocks often overtake each other and transactions.
      const net = make({ seed, latency: [0.05, 1.5], blockInterval: 3 });
      const pick = mulberry32(seed * 7919);
      const pickNode = () => Math.floor(pick() * 10);
      const online = new Array<boolean>(10).fill(true);
      net.setMining(true);
      for (let i = 0; i < 400; i++) {
        const roll = pick();
        const node = pickNode();
        if (roll < 0.25) {
          if (online[node]) net.broadcastTx(node);
        } else if (roll < 0.3) {
          online[node] = !online[node];
          net.setOnline(node, online[node]);
        } else if (roll < 0.32) {
          if (online[node]) net.forceBlock(node);
        }
        net.step(0.25);
        expect(violations(net.snapshot())).toEqual([]);
      }

      // Everyone back, mining stopped: the network must come to rest at one height,
      // and one more block must bring every node to the same tip.
      for (let node = 0; node < 10; node++) net.setOnline(node, true);
      net.setMining(false);
      run(net, 300, 1);
      const rest = net.snapshot();
      expect(violations(rest)).toEqual([]);
      expect(rest.inFlight).toEqual([]);
      expect(new Set(rest.nodes.map((n) => heightOf(rest, n.tip))).size).toBe(1);

      const last = net.forceBlock(0);
      run(net, 60, 1);
      const end = net.snapshot();
      expect(violations(end)).toEqual([]);
      expect(onlineTips(end)).toEqual(new Set([last]));
    }
  });
});
