/**
 * What the network figure reads off a snapshot of the simulation: who is on
 * which branch, how far a block or transaction has spread, what just happened.
 * Pure functions; nothing here changes the simulation.
 */
import type { SimBlock, SimEvent, SimMessage, SimNode, Snapshot } from '@/lib/netsim';

type Blocks = Record<string, SimBlock>;

/** Blocks are numbered in the order they were mined: `b7` came before `b9`. */
const minedOrder = (id: string): number => Number(id.slice(1));

/** The chain that ends at `tip`, from the genesis block to the tip. */
export function chainOf(blocks: Blocks, tip: string): string[] {
  const chain: string[] = [];
  for (let id: string | null = tip; id !== null; id = blocks[id].parent) chain.push(id);
  return chain.reverse();
}

/** Whether `id` is the tip itself or one of the blocks beneath it. */
export function isOnChain(blocks: Blocks, tip: string, id: string): boolean {
  const height = blocks[id].height;
  let cursor: string | null = tip;
  while (cursor !== null && blocks[cursor].height > height) cursor = blocks[cursor].parent;
  return cursor === id;
}

/** Blocks a node has kept that are not on its own chain: the other side of a fork. */
export function sideBlocks(node: SimNode, blocks: Blocks): string[] {
  const own = new Set(chainOf(blocks, node.tip));
  return node.knownBlocks.filter((id) => !own.has(id));
}

/**
 * How a node is drawn. `main` is the branch that ends at the leading tip;
 * `side` is any other. `behind` means its tip is lower than the best one any
 * online node has.
 */
export interface NodeLook {
  branch: 'main' | 'side';
  behind: boolean;
}

/** The online nodes that share one tip. */
export interface TipGroup {
  tip: string;
  height: number;
  branch: 'main' | 'side';
  /** Node ids, ascending. */
  nodes: number[];
}

export interface ChainView {
  /** The greatest tip height among online nodes. */
  best: number;
  /**
   * The tip that defines the main branch: the one at the best height, and of
   * two at that height the one mined first. It stays the leader for as long as
   * a tie lasts, so the two sides of a fork keep their looks.
   */
  leader: string;
  /** Two or more tips at the best height. */
  forked: boolean;
  /** Every online node is on the same tip. */
  converged: boolean;
  /** One entry per node, offline ones included. */
  looks: NodeLook[];
  /** The tips online nodes are on: highest first, then in the order they were mined. */
  tips: TipGroup[];
}

export function chainView(s: Snapshot): ChainView {
  const online = s.nodes.filter((node) => node.online);
  // With every node offline there is still a picture to draw: judge by all of them.
  const judged = online.length > 0 ? online : s.nodes;
  const heightOf = (node: SimNode) => s.blocks[node.tip].height;
  const best = Math.max(...judged.map(heightOf));
  const leaders = [...new Set(judged.filter((node) => heightOf(node) === best).map((node) => node.tip))].sort(
    (a, b) => minedOrder(a) - minedOrder(b),
  );
  const leader = leaders[0];
  const branchOf = (tip: string) => (isOnChain(s.blocks, leader, tip) ? 'main' : 'side');

  const groups = new Map<string, TipGroup>();
  for (const node of online) {
    const group = groups.get(node.tip) ?? {
      tip: node.tip,
      height: heightOf(node),
      branch: branchOf(node.tip),
      nodes: [],
    };
    group.nodes.push(node.id);
    groups.set(node.tip, group);
  }

  return {
    best,
    leader,
    forked: leaders.length > 1,
    converged: groups.size <= 1,
    looks: s.nodes.map((node) => ({ branch: branchOf(node.tip), behind: heightOf(node) < best })),
    tips: [...groups.values()].sort((a, b) => b.height - a.height || minedOrder(a.tip) - minedOrder(b.tip)),
  };
}

/** Hops from `from` to every node over links whose two ends are online; `Infinity` where there is no way. */
export function hopDistances(s: Snapshot, from: number): number[] {
  const distance = s.nodes.map(() => Infinity);
  if (!s.nodes[from]?.online) return distance;
  distance[from] = 0;
  for (const queue = [from]; queue.length > 0;) {
    const node = queue.shift() as number;
    for (const peer of s.nodes[node].peers) {
      if (s.nodes[peer].online && distance[peer] === Infinity) {
        distance[peer] = distance[node] + 1;
        queue.push(peer);
      }
    }
  }
  return distance;
}

/** The two candidates with the most hops between them; the lowest-numbered pair on a tie. */
export function farthestPair(s: Snapshot, candidates: number[]): [number, number] | null {
  const sorted = [...candidates].sort((a, b) => a - b);
  let pair: [number, number] | null = null;
  let widest = 0;
  for (const a of sorted) {
    const distance = hopDistances(s, a);
    for (const b of sorted) {
      if (b > a && distance[b] !== Infinity && distance[b] > widest) {
        widest = distance[b];
        pair = [a, b];
      }
    }
  }
  return pair;
}

/** What is going on among the nodes that are online. */
type News =
  /** No node is online. */
  | { kind: 'dark' }
  /** Two or more tips at the best height. */
  | { kind: 'fork'; groups: TipGroup[] }
  /** A block is on its way: `have` of the `online` nodes have made it their tip. */
  | { kind: 'block-spreading'; block: string; height: number; have: number; online: number }
  /** A transaction is on its way: it is in `have` of the `online` nodes' mempools. */
  | { kind: 'tx-spreading'; tx: string; have: number; online: number }
  /** Messages are in flight, but everyone already agrees and no transaction is travelling. */
  | { kind: 'busy' }
  /** Some online nodes are behind and no message about a block is in flight: nothing connects them to the rest. */
  | { kind: 'cut-off'; behind: number[] }
  /** Nothing is in flight and every online node is on `tip`; `waiting` transactions sit in the fullest mempool. */
  | { kind: 'rest'; tip: string; height: number; waiting: number };

/**
 * One line of news about the network as a whole. Whatever the news, it carries
 * the nodes that are `offline`, in ascending order: what the online ones agree
 * on says nothing about them.
 */
export type Situation = News & { offline: number[] };

export function situation(s: Snapshot): Situation {
  const online = s.nodes.filter((node) => node.online);
  const offline = s.nodes.filter((node) => !node.online).map((node) => node.id);
  if (online.length === 0) return { kind: 'dark', offline };
  const view = chainView(s);
  if (view.forked) {
    return { kind: 'fork', groups: view.tips.filter((group) => group.height === view.best), offline };
  }

  if (!view.converged) {
    // Only a message about a block can bring a node that is behind up to date. Other
    // traffic, a transaction being announced for instance, does not make a block spread.
    const blockOnItsWay = s.inFlight.some((message) => Object.hasOwn(s.blocks, message.ref));
    if (!blockOnItsWay) {
      const behind = online.filter((node) => node.tip !== view.leader).map((node) => node.id);
      return { kind: 'cut-off', behind, offline };
    }
    return {
      kind: 'block-spreading',
      block: view.leader,
      height: view.best,
      have: online.filter((node) => node.tip === view.leader).length,
      online: online.length,
      offline,
    };
  }

  if (s.inFlight.length > 0) {
    // The transaction whose message left most recently.
    const latest = s.inFlight
      .filter((message) => !Object.hasOwn(s.blocks, message.ref))
      .reduce<SimMessage | null>((newest, message) => (newest && newest.id > message.id ? newest : message), null);
    if (!latest) return { kind: 'busy', offline };
    return {
      kind: 'tx-spreading',
      tx: latest.ref,
      have: online.filter((node) => node.mempool.includes(latest.ref)).length,
      online: online.length,
      offline,
    };
  }

  return {
    kind: 'rest',
    tip: view.leader,
    height: view.best,
    waiting: Math.max(...online.map((node) => node.mempool.length)),
    offline,
  };
}

/** A node's latest events, newest first. */
export function recentEvents(s: Snapshot, node: number, limit: number): SimEvent[] {
  const found: SimEvent[] = [];
  for (let i = s.events.length - 1; i >= 0 && found.length < limit; i--) {
    if (s.events[i].node === node) found.push(s.events[i]);
  }
  return found;
}

/** The most recent reorg still in the log: the block that caused it and the nodes that switched to it. */
export function lastReorg(s: Snapshot): { block: string; nodes: number[] } | null {
  const reorgs = s.events.filter((event) => event.type === 'reorg');
  if (reorgs.length === 0) return null;
  const block = reorgs[reorgs.length - 1].ref;
  const nodes = [...new Set(reorgs.filter((event) => event.ref === block).map((event) => event.node))];
  return { block, nodes: nodes.sort((a, b) => a - b) };
}

/** How far along its link a message is at time `t`: 0 on leaving, 1 on arrival. */
export function packetProgress(message: SimMessage, t: number): number {
  const span = message.arriveAt - message.sentAt;
  if (span <= 0) return 1;
  return Math.max(0, Math.min(1, (t - message.sentAt) / span));
}
