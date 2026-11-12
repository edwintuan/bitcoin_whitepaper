// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { MAX_BLOCKS, NET_OPTIONS, createDirector, isWornOut, renew } from './director';
import { chainView, hopDistances } from './view';

describe('the figure’s network', () => {
  it('is the same ten nodes for every reader', () => {
    const a = createDirector().snapshot();
    const b = createDirector().snapshot();
    expect(a).toEqual(b);
    expect(a.nodes).toHaveLength(NET_OPTIONS.nodes);
    expect(a.nodes).toHaveLength(10);
    for (const node of a.nodes) {
      expect(node.online).toBe(true);
      expect(node.peers.length).toBeGreaterThanOrEqual(2);
      expect(node.peers.length).toBeLessThanOrEqual(3);
    }
  });

  it('is wide enough for a fork to split it: some nodes are four hops apart', () => {
    const s = createDirector().snapshot();
    const widest = Math.max(...s.nodes.flatMap((node) => hopDistances(s, node.id)));
    expect(widest).toBe(4);
  });

  it('replays the same run from the same calls', () => {
    const run = () => {
      const director = createDirector();
      director.sendTx();
      director.advance(1.3);
      director.findBlock();
      director.hop();
      director.makeFork();
      director.advance(2);
      director.setOnline(5, false);
      director.findBlock();
      director.settle();
      return director.snapshot();
    };
    expect(run()).toEqual(run());
  });
});

describe('sending a transaction', () => {
  it('starts at the node asked for', () => {
    const director = createDirector();
    expect(director.sendTx(4)).toEqual({ tx: 'tx1', from: 4 });
    const s = director.snapshot();
    expect(s.nodes[4].mempool).toEqual(['tx1']);
    expect(s.inFlight.every((message) => message.kind === 'inv' && message.from === 4)).toBe(true);
    expect(s.inFlight).toHaveLength(s.nodes[4].peers.length);
  });

  it('picks an online node itself when none is given, or the one given is offline', () => {
    const director = createDirector();
    director.setOnline(4, false);
    const sent = director.sendTx(4);
    expect(sent).not.toBeNull();
    expect(sent?.from).not.toBe(4);

    const again = createDirector();
    again.setOnline(4, false);
    expect(again.sendTx(4)).toEqual(sent);
    expect(createDirector().sendTx()).toEqual(createDirector().sendTx(null));
  });

  it('spreads its picks over the nodes', () => {
    const director = createDirector();
    const senders = new Set<number>();
    for (let i = 0; i < 200; i++) senders.add(director.sendTx()?.from ?? -1);
    expect([...senders].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('does nothing when every node is offline', () => {
    const director = createDirector();
    for (let node = 0; node < 10; node++) director.setOnline(node, false);
    expect(director.sendTx()).toBeNull();
    expect(director.sendTx(2)).toBeNull();
    expect(director.findBlock()).toBeNull();
    expect(director.makeFork()).toBeNull();
  });
});

describe('finding a block', () => {
  it('builds on the finder’s tip and confirms what waits in its mempool', () => {
    const director = createDirector();
    director.sendTx(0);
    director.settle();
    const found = director.findBlock();
    expect(found).not.toBeNull();
    const s = director.snapshot();
    expect(s.blocks[found!.block]).toMatchObject({ parent: 'b0', height: 1, miner: found!.miner, txs: ['tx1'] });
    expect(s.nodes[found!.miner].tip).toBe(found!.block);
  });

  it('goes to online nodes only, in proportion to their hash power', () => {
    const director = createDirector();
    director.setOnline(3, false);
    const counts = new Array<number>(10).fill(0);
    const rounds = 3000;
    for (let i = 0; i < rounds; i++) counts[director.findBlock()?.miner ?? 3]++;
    expect(counts[3]).toBe(0);

    const online = director.snapshot().nodes.filter((node) => node.online);
    const power = online.reduce((sum, node) => sum + node.hashPower, 0);
    for (const node of online) {
      const expected = (rounds * node.hashPower) / power;
      expect(Math.abs(counts[node.id] - expected)).toBeLessThan(5 * Math.sqrt(expected));
    }
  });
});

describe('making a fork', () => {
  it('has the two most distant nodes on the best tip find a block at the same moment', () => {
    const director = createDirector();
    const before = director.snapshot();
    const fork = director.makeFork();
    expect(fork).not.toBeNull();
    const { blocks, miners } = fork!;
    const s = director.snapshot();
    expect(s.t).toBe(before.t);
    expect(s.blocks[blocks[0]]).toMatchObject({ parent: 'b0', height: 1, miner: miners[0] });
    expect(s.blocks[blocks[1]]).toMatchObject({ parent: 'b0', height: 1, miner: miners[1] });
    const widest = Math.max(...before.nodes.flatMap((node) => hopDistances(before, node.id)));
    expect(hopDistances(before, miners[0])[miners[1]]).toBe(widest);
  });

  it('leaves the network on two tips of the same height once the news has spread', () => {
    const director = createDirector();
    const fork = director.makeFork();
    director.settle();
    const view = chainView(director.snapshot());
    expect(view.forked).toBe(true);
    expect(view.tips.map((group) => group.tip)).toEqual(fork!.blocks);
    expect(view.tips.map((group) => group.height)).toEqual([1, 1]);
    expect(view.tips[0].nodes.length + view.tips[1].nodes.length).toBe(10);
  });

  it('waits until at least two online nodes share the best tip', () => {
    const director = createDirector();
    director.findBlock(); // only the finder is on the best tip so far
    expect(director.canFork()).toBe(false);
    expect(director.makeFork()).toBeNull();
    director.settle();
    expect(director.canFork()).toBe(true);
    expect(director.makeFork()).not.toBeNull();
  });

  it('is settled by the next block: the nodes on the losing tip reorganise', () => {
    const director = createDirector();
    const fork = director.makeFork();
    director.settle();
    const split = director.snapshot();
    const found = director.findBlock();
    director.settle();
    const healed = director.snapshot();

    expect(chainView(healed).converged).toBe(true);
    const winner = healed.blocks[found!.block].parent;
    const loser = fork!.blocks.find((block) => block !== winner);
    const switched = split.nodes.filter((node) => node.tip === loser).map((node) => node.id);
    const reorged = healed.events.filter((event) => event.type === 'reorg').map((event) => event.node);
    expect(reorged.sort((a, b) => a - b)).toEqual(switched);
    expect(switched.length).toBeGreaterThan(0);
  });
});

describe('time', () => {
  it('advances by the seconds given', () => {
    const director = createDirector();
    director.advance(0.4);
    director.advance(0.35);
    expect(director.snapshot().t).toBeCloseTo(0.75, 12);
  });

  it('settles: runs until nothing is in flight', () => {
    const director = createDirector();
    director.sendTx(0);
    director.findBlock();
    expect(director.snapshot().inFlight.length).toBeGreaterThan(0);
    director.settle();
    const s = director.snapshot();
    expect(s.inFlight).toEqual([]);
    expect(chainView(s).converged).toBe(true);
  });

  it('hops: delivers everything that was in flight', () => {
    const director = createDirector();
    director.sendTx(0);
    const before = director.snapshot();
    expect(director.hop()).toBe(true);
    const after = director.snapshot();
    const still = new Set(after.inFlight.map((message) => message.id));
    for (const message of before.inFlight) expect(still.has(message.id)).toBe(false);
    expect(after.t).toBeCloseTo(Math.max(...before.inFlight.map((message) => message.arriveAt)), 6);
    expect(after.inFlight.length).toBeGreaterThan(0); // the answers are now on their way
  });

  it('has nothing to hop to at rest, unless blocks are being mined', () => {
    const director = createDirector();
    expect(director.hop()).toBe(false);
    expect(director.snapshot().t).toBe(0);
    director.setMining(true);
    expect(director.hop()).toBe(true);
    expect(director.snapshot().t).toBeGreaterThan(0);
  });

  it('mines by itself only while switched on', () => {
    const director = createDirector();
    expect(director.mining).toBe(false);
    director.advance(600);
    expect(Object.keys(director.snapshot().blocks)).toHaveLength(1);

    director.setMining(true);
    expect(director.mining).toBe(true);
    director.advance(600);
    const mined = Object.keys(director.snapshot().blocks).length;
    expect(mined).toBeGreaterThan(10);

    director.setMining(false);
    expect(director.mining).toBe(false);
    director.advance(600);
    expect(Object.keys(director.snapshot().blocks)).toHaveLength(mined);
  });
});

describe('going offline', () => {
  it('takes a node off the network and brings it back', () => {
    const director = createDirector();
    director.setOnline(6, false);
    expect(director.snapshot().nodes[6].online).toBe(false);
    director.findBlock();
    director.settle();
    expect(director.snapshot().nodes[6].tip).toBe('b0');
    director.setOnline(6, true);
    director.settle();
    const s = director.snapshot();
    expect(s.nodes[6].online).toBe(true);
    expect(chainView(s).converged).toBe(true);
    expect(s.nodes[6].tip).not.toBe('b0');
  });
});

describe('a network that has grown old', () => {
  // Every snapshot copies every block ever mined, so a very long run is replaced by a fresh one.
  it('counts as worn out once it holds more blocks than the limit', () => {
    const director = createDirector();
    expect(isWornOut(director.snapshot())).toBe(false);
    for (let i = 0; i < MAX_BLOCKS - 1; i++) director.findBlock();
    expect(Object.keys(director.snapshot().blocks)).toHaveLength(MAX_BLOCKS);
    expect(isWornOut(director.snapshot())).toBe(false);
    director.findBlock();
    expect(isWornOut(director.snapshot())).toBe(true);
  });

  it('is replaced by a fresh network that keeps the reader’s settings', () => {
    const old = createDirector();
    old.setMining(true);
    old.setOnline(3, false);
    old.setOnline(8, false);
    old.sendTx();
    old.advance(200);

    const fresh = renew(old);
    expect(fresh).not.toBe(old);
    const s = fresh.snapshot();
    expect(s.t).toBe(0);
    expect(Object.keys(s.blocks)).toEqual(['b0']);
    expect(s.inFlight).toEqual([]);
    expect(s.nodes.filter((node) => !node.online).map((node) => node.id)).toEqual([3, 8]);
    expect(fresh.mining).toBe(true);
    fresh.advance(600);
    expect(Object.keys(fresh.snapshot().blocks).length).toBeGreaterThan(10);
  });

  it('leaves mining off and every node online when that is how the old one was', () => {
    const fresh = renew(createDirector());
    expect(fresh.mining).toBe(false);
    expect(fresh.snapshot().nodes.every((node) => node.online)).toBe(true);
    // Apart from the log, it is a network nobody has touched.
    expect(fresh.snapshot()).toEqual(createDirector().snapshot());
  });
});
