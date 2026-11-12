/**
 * A small discrete-event simulation of the network in whitepaper section 5:
 * nodes gossip transactions and blocks over a fixed graph, mine on the tip
 * they know, and settle forks by following the longest chain.
 *
 * What is modelled: announce-then-fetch relay (`inv`, `getdata`, then the
 * `tx` or `block` itself), per-hop latency, first-seen fork choice, reorgs
 * with mempool bookkeeping, nodes dropping out and catching up.
 *
 * A node passes a block on only when the block becomes its tip. A competing
 * block of the same height is saved but not announced further, so a fork
 * shows as two regions of the graph, and nodes deep inside one region first
 * hear of the other branch when it grows longer.
 *
 * What is not: signatures, scripts and proof-of-work (every object is taken
 * as valid, and every block counts the same, so height stands in for
 * accumulated work), block size limits, any peer discovery, and the effect of
 * lost hash power on the pace of blocks (blocks keep their average interval
 * however many nodes are offline).
 *
 * Time is in simulated seconds and moves only when `step` is called. All
 * randomness comes from one generator seeded by `opts.seed`, so the same seed
 * and the same sequence of calls always replay the same run.
 */
import { mulberry32 } from './rng';

/** A block. Blocks are shared by the whole simulation; nodes differ in which ones they know. */
export interface SimBlock {
  /** Short id such as `b7`, numbered in the order blocks were mined. */
  id: string;
  /** Id of the block this one builds on; `null` only for the genesis block. */
  parent: string | null;
  /** Distance from the genesis block, which is at height 0. */
  height: number;
  /** Node that mined it; -1 for the genesis block. */
  miner: number;
  /** Ids of the transactions it confirms. */
  txs: string[];
}

/** One node as a snapshot shows it. */
export interface SimNode {
  /** Its index: 0 … nodes − 1. */
  id: number;
  /** Position for drawing, inside the unit square. */
  x: number;
  y: number;
  /** Ids of the nodes it is connected to, ascending. The graph never changes. */
  peers: number[];
  online: boolean;
  /** Its share of the network's hash power; the shares of all nodes sum to 1. */
  hashPower: number;
  /** The block it is mining on: the highest it knows, the first seen among equals. */
  tip: string;
  /** Unconfirmed transactions it holds, oldest first. */
  mempool: string[];
  /** Every block it has connected to its tree, in the order it did so, side branches included. */
  knownBlocks: string[];
}

/** A message travelling along one edge. */
export interface SimMessage {
  /** Counts up from 1 in the order messages are sent. */
  id: number;
  /** `inv` announces an object, `getdata` asks for it, `tx` and `block` deliver it. */
  kind: 'inv' | 'getdata' | 'tx' | 'block';
  from: number;
  to: number;
  /** Id of the transaction or block the message is about. */
  ref: string;
  /** Simulated time it left `from`. */
  sentAt: number;
  /** Simulated time it reaches `to`. */
  arriveAt: number;
}

/**
 * Something that happened at a node:
 *
 * - `tx-seen`: it put a transaction in its mempool for the first time;
 * - `block-mined`: it mined a block (and now builds on it);
 * - `block-accepted`: it received a block and adopted it as its tip. A block
 *   that only ties with the tip is saved without an event;
 * - `reorg`: adopting that tip meant abandoning blocks of its previous chain;
 * - `offline` / `online`: it left or rejoined; `ref` is its tip at that moment.
 */
export interface SimEvent {
  t: number;
  node: number;
  type: 'tx-seen' | 'block-mined' | 'block-accepted' | 'reorg' | 'offline' | 'online';
  ref: string;
}

/** The whole state at one moment, as plain data that is safe to keep or modify. */
export interface Snapshot {
  /** Simulated time in seconds. */
  t: number;
  nodes: SimNode[];
  /** Every block ever mined, by id, abandoned ones included. */
  blocks: Record<string, SimBlock>;
  /** Messages still travelling, in the order they will arrive. */
  inFlight: SimMessage[];
  /** The most recent events, oldest first, at most 200. */
  events: SimEvent[];
}

export interface Network {
  /**
   * Advances simulated time by `dt` seconds, delivering every message and
   * mining every block that falls due, in timestamp order. The outcome does
   * not depend on how the time is cut into steps.
   *
   * @throws RangeError unless `dt` is a finite number ≥ 0.
   */
  step(dt: number): void;
  /**
   * Creates a transaction at node `from` and announces it to that node's
   * peers. Returns its id. Relay is best effort: a node that is offline while
   * the transaction spreads first hears of it when a block confirms it.
   *
   * @throws RangeError if there is no such node; Error if the node is offline.
   */
  broadcastTx(from: number): string;
  /**
   * Makes `node` mine a block right now, on its current tip, confirming
   * everything in its mempool. Returns the block's id. Calling this on two
   * nodes without stepping in between produces a fork.
   *
   * @throws RangeError if there is no such node; Error if the node is offline.
   */
  forceBlock(node: number): string;
  /**
   * Takes a node off the network or brings it back. An offline node sends
   * nothing, is sent nothing, does not mine, and loses whatever reaches it
   * while it is offline (a message still on its way when the node returns is
   * delivered). A peer left waiting for an answer from it asks its other
   * peers instead. When the node returns, it and each online peer announce
   * their tips to each other, and it fetches the blocks it missed.
   *
   * @throws RangeError if there is no such node.
   */
  setOnline(node: number, online: boolean): void;
  /**
   * Switches random mining on or off. It starts off. While on, blocks arrive
   * as a Poisson process averaging one per `blockInterval` seconds for the
   * whole network, each going to an online node chosen in proportion to its
   * `hashPower`.
   */
  setMining(on: boolean): void;
  /**
   * A deep copy of the current state. Its cost grows with history: every block
   * ever mined is copied, about a third of a millisecond per thousand blocks
   * for ten nodes. A figure that snapshots every frame should start a fresh
   * network after a few thousand blocks.
   */
  snapshot(): Snapshot;
}

interface NodeState {
  id: number;
  x: number;
  y: number;
  peers: number[];
  online: boolean;
  hashPower: number;
  tip: string;
  /** Unconfirmed transactions, in arrival order. */
  mempool: Set<string>;
  /** Transactions in the blocks of the chain that ends at `tip`. */
  confirmed: Set<string>;
  /** Blocks connected to the tree, in the order they were connected. */
  known: Set<string>;
  /** Blocks received before their parent, held until the gap is filled, each with the peer it came from. */
  orphans: Map<string, number>;
  /** Objects asked for and not yet received, with the peer that was asked. */
  requested: Map<string, number>;
}

const GENESIS_ID = 'b0';
const MAX_EVENTS = 200;

/** A ring through all nodes, plus random chords while both ends have fewer than `degree` peers. */
function buildPeers(count: number, degree: number, rng: () => number): number[][] {
  const peers = Array.from({ length: count }, () => new Set<number>());
  const link = (a: number, b: number): void => {
    peers[a].add(b);
    peers[b].add(a);
  };
  for (let i = 0; i < count; i++) link(i, (i + 1) % count);

  const chords: [number, number][] = [];
  for (let a = 0; a < count; a++) {
    for (let b = a + 1; b < count; b++) if (!peers[a].has(b)) chords.push([a, b]);
  }
  for (let i = chords.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [chords[i], chords[j]] = [chords[j], chords[i]];
  }
  for (const [a, b] of chords) {
    if (peers[a].size < degree && peers[b].size < degree) link(a, b);
  }
  return peers.map((set) => [...set].sort((a, b) => a - b));
}

/**
 * Creates a network of `nodes` nodes, all online, all on the same genesis
 * block, with mining switched off. Hash power is shared out unevenly but
 * mildly: the strongest node has less than three times the weakest.
 *
 * @param opts.nodes how many nodes, at least 2
 * @param opts.degree the most peers a node may have, at least 2. Nodes form a
 * ring, then random extra links are added while both ends have room
 * @param opts.latency `[min, max]` seconds; every message draws its own travel
 * time uniformly from this range
 * @param opts.blockInterval average seconds between blocks while mining is on
 * @param opts.seed seed for all randomness: layout, links, hash power,
 * latencies and mining
 * @throws RangeError if an option is out of range.
 */
export function createNetwork(opts: {
  nodes: number;
  degree: number;
  latency: [number, number];
  blockInterval: number;
  seed: number;
}): Network {
  const [minLatency, maxLatency] = opts.latency;
  if (!Number.isInteger(opts.nodes) || opts.nodes < 2) {
    throw new RangeError('a network needs at least 2 nodes');
  }
  if (!Number.isInteger(opts.degree) || opts.degree < 2) {
    throw new RangeError('degree must be an integer of at least 2, since the ring alone gives each node 2 peers');
  }
  if (!(minLatency >= 0 && maxLatency >= minLatency && Number.isFinite(maxLatency))) {
    throw new RangeError('latency must be [min, max] in seconds with 0 ≤ min ≤ max');
  }
  if (!(opts.blockInterval > 0 && Number.isFinite(opts.blockInterval))) {
    throw new RangeError('blockInterval must be a positive number of seconds');
  }

  const rng = mulberry32(opts.seed);
  const blocks: Record<string, SimBlock> = {
    [GENESIS_ID]: { id: GENESIS_ID, parent: null, height: 0, miner: -1, txs: [] },
  };
  const queue: SimMessage[] = [];
  const events: SimEvent[] = [];
  let now = 0;
  let nextBlockAt = Infinity;
  let messageCount = 0;
  let blockCount = 0;
  let txCount = 0;

  // Nodes sit on a slightly irregular circle; hash power is uneven but no node is negligible.
  const layout = Array.from({ length: opts.nodes }, (_, i) => {
    const angle = (2 * Math.PI * (i + (rng() - 0.5) / 2)) / opts.nodes;
    const radius = 0.3 + 0.15 * rng();
    return { x: 0.5 + radius * Math.cos(angle), y: 0.5 + radius * Math.sin(angle), weight: 0.5 + rng() };
  });
  const totalWeight = layout.reduce((sum, spot) => sum + spot.weight, 0);
  const peersOf = buildPeers(opts.nodes, opts.degree, rng);
  const nodes: NodeState[] = layout.map((spot, id) => ({
    id,
    x: spot.x,
    y: spot.y,
    peers: peersOf[id],
    online: true,
    hashPower: spot.weight / totalWeight,
    tip: GENESIS_ID,
    mempool: new Set(),
    confirmed: new Set(),
    known: new Set([GENESIS_ID]),
    orphans: new Map(),
    requested: new Map(),
  }));

  const nodeAt = (index: number): NodeState => {
    if (!Number.isInteger(index) || index < 0 || index >= nodes.length) {
      throw new RangeError(`there is no node ${index}`);
    }
    return nodes[index];
  };
  const onlineNodeAt = (index: number): NodeState => {
    const node = nodeAt(index);
    if (!node.online) throw new Error(`node ${index} is offline`);
    return node;
  };

  const log = (node: NodeState, type: SimEvent['type'], ref: string): void => {
    events.push({ t: now, node: node.id, type, ref });
    if (events.length > MAX_EVENTS) events.shift();
  };

  /** Puts a message on the wire unless the receiving end is offline. Returns whether it was sent. */
  const send = (kind: SimMessage['kind'], from: number, to: number, ref: string): boolean => {
    if (!nodes[to].online) return false;
    const arriveAt = now + minLatency + (maxLatency - minLatency) * rng();
    let at = queue.length;
    while (at > 0 && queue[at - 1].arriveAt > arriveAt) at--;
    queue.splice(at, 0, { id: ++messageCount, kind, from, to, ref, sentAt: now, arriveAt });
    return true;
  };

  const announce = (node: NodeState, ref: string, except?: number): void => {
    for (const peer of node.peers) if (peer !== except) send('inv', node.id, peer, ref);
  };

  /** The peer a node was relying on is gone: its other online peers tell it what they have. */
  const askAround = (node: NodeState, gone: number): void => {
    if (!node.online) return;
    for (const peer of node.peers) {
      if (peer !== gone && nodes[peer].online) send('inv', peer, node.id, nodes[peer].tip);
    }
  };

  /** Asks `peer` for an object, unless a request for it is already outstanding. */
  const request = (node: NodeState, ref: string, peer: number): void => {
    if (node.requested.has(ref)) return;
    if (send('getdata', node.id, peer, ref)) node.requested.set(ref, peer);
    else askAround(node, peer);
  };

  const knowsTx = (node: NodeState, tx: string): boolean => node.mempool.has(tx) || node.confirmed.has(tx);

  /** The block below `id`; the genesis block stands in as its own parent so walks end there. */
  const parentOf = (id: string): string => blocks[id].parent ?? id;

  /**
   * The block `node` must fetch next before `id` can join its tree, or `null`
   * if `id` is already connected. If `id` is held as an orphan this is the
   * first ancestor the node has never received.
   */
  const missing = (node: NodeState, id: string): string | null => {
    let cursor = id;
    while (node.orphans.has(cursor)) cursor = parentOf(cursor);
    return node.known.has(cursor) ? null : cursor;
  };

  /**
   * Moves the node's tip to `to` and keeps its mempool in step: transactions
   * of blocks left behind go back to the mempool, transactions of blocks
   * gained leave it. Returns whether any block was left behind (a reorg).
   */
  const moveTip = (node: NodeState, to: string): boolean => {
    const gained: string[] = [];
    let left = node.tip;
    let joined = to;
    let reorg = false;
    while (left !== joined) {
      if (blocks[left].height >= blocks[joined].height) {
        for (const tx of blocks[left].txs) {
          node.confirmed.delete(tx);
          node.mempool.add(tx);
        }
        left = parentOf(left);
        reorg = true;
      } else {
        gained.push(joined);
        joined = parentOf(joined);
      }
    }
    for (const id of gained) {
      for (const tx of blocks[id].txs) {
        node.confirmed.add(tx);
        node.mempool.delete(tx);
        node.requested.delete(tx);
      }
    }
    node.tip = to;
    return reorg;
  };

  /**
   * Adds a block whose parent the node already has. The longest chain wins:
   * the block becomes the tip only if it is higher than the current one, so
   * of two blocks at the same height the node keeps working on the first it
   * saw, and saves the other in case that branch grows.
   */
  const connect = (node: NodeState, id: string, how: 'block-mined' | 'block-accepted'): void => {
    node.known.add(id);
    node.orphans.delete(id);
    if (blocks[id].height > blocks[node.tip].height) {
      const reorg = moveTip(node, id);
      log(node, how, id);
      if (reorg) log(node, 'reorg', id);
    }
  };

  const mine = (node: NodeState): string => {
    const id = `b${++blockCount}`;
    blocks[id] = { id, parent: node.tip, height: blocks[node.tip].height + 1, miner: node.id, txs: [...node.mempool] };
    connect(node, id, 'block-mined');
    announce(node, id);
    return id;
  };

  const deliver = (message: SimMessage): void => {
    const { kind, from, ref } = message;
    const node = nodes[message.to];
    if (!node.online) {
      // The link went down under the message. A request lost this way must
      // not stop the sender from asking someone else later.
      if (kind === 'getdata' && nodes[from].requested.get(ref) === node.id) {
        nodes[from].requested.delete(ref);
        askAround(nodes[from], node.id);
      }
      return;
    }
    const isBlock = Object.hasOwn(blocks, ref);

    if (kind === 'inv') {
      const want = isBlock ? missing(node, ref) : knowsTx(node, ref) ? null : ref;
      if (want !== null) request(node, want, from);
    } else if (kind === 'getdata') {
      if (isBlock ? node.known.has(ref) : knowsTx(node, ref)) send(isBlock ? 'block' : 'tx', node.id, from, ref);
    } else if (kind === 'tx') {
      node.requested.delete(ref);
      if (!knowsTx(node, ref)) {
        node.mempool.add(ref);
        log(node, 'tx-seen', ref);
        announce(node, ref, from);
      }
    } else {
      node.requested.delete(ref);
      if (node.known.has(ref) || node.orphans.has(ref)) return;
      const tipBefore = node.tip;
      // The peer known to hold whatever ends up as the tip: whoever delivered that block.
      let tipFrom = from;
      if (node.known.has(parentOf(ref))) {
        connect(node, ref, 'block-accepted');
        // Blocks that were waiting for this one, and those waiting for them.
        for (let progress = true; progress; ) {
          progress = false;
          for (const [orphan, sender] of [...node.orphans]) {
            if (node.known.has(parentOf(orphan))) {
              const before = node.tip;
              connect(node, orphan, 'block-accepted');
              if (node.tip !== before) tipFrom = sender;
              progress = true;
            }
          }
        }
      } else {
        // Whitepaper section 5: a node that missed a block "will request it
        // when it receives the next block and realizes it missed one". The
        // sender has this block in its tree, so it has every ancestor too.
        node.orphans.set(ref, from);
        const want = missing(node, ref);
        if (want !== null) request(node, want, from);
      }
      // Only a new tip is passed on. A block that merely ties is kept but not
      // announced, which is why a fork splits the network into two regions.
      if (node.tip !== tipBefore) announce(node, node.tip, tipFrom);
    }
  };

  const scheduleBlock = (): void => {
    nextBlockAt = now - Math.log(1 - rng()) * opts.blockInterval;
  };

  const mineSomewhere = (): void => {
    const miners = nodes.filter((node) => node.online);
    if (miners.length === 0) return;
    let roll = rng() * miners.reduce((sum, node) => sum + node.hashPower, 0);
    const winner = miners.find((node) => (roll -= node.hashPower) < 0) ?? miners[miners.length - 1];
    mine(winner);
  };

  return {
    step(dt) {
      if (!(dt >= 0) || !Number.isFinite(dt)) {
        throw new RangeError(`dt must be a finite number of seconds ≥ 0, got ${dt}`);
      }
      const end = now + dt;
      for (;;) {
        const arrival = queue.length > 0 ? queue[0].arriveAt : Infinity;
        const due = Math.min(arrival, nextBlockAt);
        if (due > end) break;
        now = due;
        if (arrival <= nextBlockAt) {
          deliver(queue.splice(0, 1)[0]);
        } else {
          mineSomewhere();
          scheduleBlock();
        }
      }
      now = end;
    },

    broadcastTx(from) {
      const node = onlineNodeAt(from);
      const id = `tx${++txCount}`;
      node.mempool.add(id);
      log(node, 'tx-seen', id);
      announce(node, id);
      return id;
    },

    forceBlock(node) {
      return mine(onlineNodeAt(node));
    },

    setOnline(index, online) {
      const node = nodeAt(index);
      if (node.online === online) return;
      node.online = online;
      log(node, online ? 'online' : 'offline', node.tip);
      if (!online) {
        node.requested.clear();
        node.orphans.clear();
        return;
      }
      for (const peer of node.peers) {
        if (send('inv', node.id, peer, node.tip)) send('inv', peer, node.id, nodes[peer].tip);
      }
    },

    setMining(on) {
      if (!on) nextBlockAt = Infinity;
      else if (nextBlockAt === Infinity) scheduleBlock();
    },

    snapshot() {
      return {
        t: now,
        nodes: nodes.map((node) => ({
          id: node.id,
          x: node.x,
          y: node.y,
          peers: [...node.peers],
          online: node.online,
          hashPower: node.hashPower,
          tip: node.tip,
          mempool: [...node.mempool],
          knownBlocks: [...node.known],
        })),
        blocks: Object.fromEntries(Object.values(blocks).map((block) => [block.id, { ...block, txs: [...block.txs] }])),
        inFlight: queue.map((message) => ({ ...message })),
        events: events.map((event) => ({ ...event })),
      };
    },
  };
}
