/**
 * The guided steps of the network scene: the state each one starts from, and
 * what to point at as the reader works through it.
 *
 *   0  broadcast a transaction      1  find a block      2  see it accepted
 *   3  two blocks at once           4  miss a block, catch up
 */
import type { Snapshot } from '@/lib/netsim';
import { createDirector } from './director';
import type { Director } from './director';
import { chainView, hopDistances, lastReorg, recentEvents, situation } from './view';

/** How many guided steps play in the network scene. */
export const NETWORK_STEPS = 5;

/** The node the outage step proposes to take offline: one with three peers, away from the edge of the picture. */
export const OUTAGE_NODE = 2;

/** A control the walkthrough points at. */
export type Hint = 'send' | 'mine' | 'fork' | 'panel' | 'offline' | 'online' | null;

/**
 * Whether the network can serve as the starting point of a step. Every step
 * starts quiet (nothing in flight), whole (every node online) and agreed (one
 * tip). On top of that the first wants empty mempools, the second a waiting
 * transaction, and the third a block to look back on.
 */
export function isReady(step: number, s: Snapshot): boolean {
  if (!Number.isInteger(step) || step < 0 || step >= NETWORK_STEPS) return false;
  const now = situation(s);
  if (now.kind !== 'rest' || !s.nodes.every((node) => node.online)) return false;
  if (step === 0) return now.waiting === 0;
  if (step === 1) return s.nodes.every((node) => node.mempool.length > 0);
  if (step === 2) return now.height >= 1;
  return true;
}

/** The state a step starts from when the reader has not built one of their own. */
export function prepare(step: number): Director {
  const director = createDirector();
  if (step >= 1) {
    director.sendTx();
    director.settle();
  }
  if (step >= 2) {
    director.findBlock();
    director.settle();
  }
  return director;
}

/**
 * Puts the figure into a step. The reader's own network is kept if, once it
 * has come to rest, it fits the step; otherwise the prepared one replaces it.
 */
export function enterStep(step: number, current: Director | null): Director {
  if (current) {
    current.setMining(false);
    current.settle();
    if (isReady(step, current.snapshot())) return current;
  }
  return prepare(step);
}

/** The node whose panel a step wants open, given the reader's own choice. */
export function focusNode(step: number, s: Snapshot, selected: number | null): number | null {
  if (step === 2) {
    const finder = s.blocks[chainView(s).leader].miner;
    if (selected !== null && selected !== finder && s.nodes[selected]?.online) return selected;
    // The node that heard of the block last, so its log tells the whole story.
    const distance = finder >= 0 ? hopDistances(s, finder) : s.nodes.map(() => 0);
    const others = s.nodes.filter((node) => node.online && node.id !== finder && distance[node.id] !== Infinity);
    if (others.length === 0) return selected;
    return others.reduce((far, node) => (distance[node.id] > distance[far.id] ? node : far)).id;
  }
  if (step === 4) return selected ?? OUTAGE_NODE;
  return selected;
}

/** What the reader should press next in a step, or `null` when there is nothing to press. */
export function hintFor(step: number, s: Snapshot, selected: number | null): Hint {
  const now = situation(s);
  const quiet = s.inFlight.length === 0;
  switch (step) {
    case 0:
      return now.kind === 'rest' && now.waiting === 0 ? 'send' : null;
    case 1:
      return now.kind === 'rest' && now.waiting > 0 ? 'mine' : null;
    case 2:
      return 'panel';
    case 3: {
      if (now.kind === 'fork') return quiet ? 'mine' : null;
      if (now.kind !== 'rest') return null;
      // Once the latest block has made nodes switch branch, the step has been played.
      return lastReorg(s)?.block === now.tip ? null : 'fork';
    }
    case 4: {
      const node = selected === null ? undefined : s.nodes[selected];
      if (!node) return null;
      if (!node.online) return s.blocks[node.tip].height < chainView(s).best ? 'online' : quiet ? 'mine' : null;
      // Back from an outage: the step has been played.
      const wasAway = recentEvents(s, node.id, 50).some((event) => event.type === 'online');
      return wasAway || !quiet ? null : 'offline';
    }
    default:
      return null;
  }
}
