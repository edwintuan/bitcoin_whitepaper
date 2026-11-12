/**
 * Drives the simulation for the network figure: the one network every reader
 * sees, and the things a reader can make happen on it. Each choice the page
 * makes for the reader (which node sends, which node finds a block) comes from
 * a seeded generator, so a run can be replayed step for step.
 */
import { createNetwork } from '@/lib/netsim';
import type { Snapshot } from '@/lib/netsim';
import { mulberry32 } from '@/lib/rng';
import { chainView, farthestPair } from './view';

/**
 * Ten nodes with at most three peers each. A hop takes about two thirds of a
 * simulated second, slow enough to follow a message by eye. The seed was
 * picked for its layout: no two nodes crowd each other on a phone, and the
 * widest pair is four hops apart, so a fork has room to split the network.
 */
export const NET_OPTIONS = {
  nodes: 10,
  degree: 3,
  latency: [0.45, 0.85] as [number, number],
  /** Average simulated seconds between blocks while continuous mining is on. */
  blockInterval: 18,
  seed: 390,
};

/** Seed for the page's own picks. Chosen so the guided fork is settled without its two sides trading looks. */
const CHOICE_SEED = 4;

/** Simulated seconds one press of Step moves on when nothing is in flight but blocks are being mined. */
const IDLE_HOP = 2;

/**
 * The most blocks a network may hold before the figure starts a fresh one.
 * `snapshot()` copies every block ever mined, and the figure takes one per
 * frame, so its cost would otherwise creep up for as long as blocks are mined.
 * At the fastest speed this takes hours to reach.
 */
export const MAX_BLOCKS = 3_000;

/** Upper bound on the waves of messages `settle` will wait for: a node may fetch every block one by one. */
const MAX_WAVES = 3 * MAX_BLOCKS + 100;

export interface Director {
  /** The state of the network now, as plain data. */
  snapshot(): Snapshot;
  /** Moves simulated time on by `seconds`. */
  advance(seconds: number): void;
  /**
   * Moves time on just far enough to deliver everything now in flight. With
   * nothing in flight it waits a little for a block if mining is on, and
   * otherwise does nothing. Returns whether time moved.
   */
  hop(): boolean;
  /** Runs until nothing is in flight. Switch mining off first, or it may never rest. */
  settle(): void;
  /**
   * Creates a transaction at `from`, or at an online node of the page's
   * choosing when `from` is missing or offline. `null` if no node is online.
   */
  sendTx(from?: number | null): { tx: string; from: number } | null;
  /** Has one online node, picked in proportion to hash power, find a block now. `null` if none is online. */
  findBlock(): { block: string; miner: number } | null;
  /** Whether {@link makeFork} can act: at least two online nodes that can reach each other share the best tip. */
  canFork(): boolean;
  /**
   * Has the two most distant online nodes on the best tip each find a block at
   * the same moment. The first of `blocks` is the one mined first.
   */
  makeFork(): { blocks: [string, string]; miners: [number, number] } | null;
  setOnline(node: number, online: boolean): void;
  /** Switches continuous mining on or off. */
  setMining(on: boolean): void;
  readonly mining: boolean;
}

/**
 * The two nodes a fork would start from: the online nodes on the best tip
 * with the most hops between them. `null` when there are not two such nodes
 * that can reach each other.
 */
export function forkPair(s: Snapshot): [number, number] | null {
  const { leader } = chainView(s);
  return farthestPair(
    s,
    s.nodes.filter((node) => node.online && node.tip === leader).map((node) => node.id),
  );
}

export function createDirector(): Director {
  const net = createNetwork(NET_OPTIONS);
  const choose = mulberry32(CHOICE_SEED);
  // A snapshot copies every block ever mined, so none is taken where the answer is already
  // known: hash power never changes, and nodes go offline only through this object.
  const hashPower = net.snapshot().nodes.map((node) => node.hashPower);
  const online = hashPower.map(() => true);
  let mining = false;

  const onlineIds = (): number[] => online.flatMap((isOnline, id) => (isOnline ? [id] : []));

  /** Moves time to a hair past the last arrival, so rounding cannot leave a message undelivered. */
  const deliver = (s: Snapshot): void => {
    net.step(Math.max(...s.inFlight.map((message) => message.arriveAt)) - s.t + 1e-9);
  };

  return {
    snapshot: () => net.snapshot(),
    advance: (seconds) => net.step(seconds),

    hop() {
      const s = net.snapshot();
      if (s.inFlight.length > 0) deliver(s);
      else if (mining) net.step(IDLE_HOP);
      else return false;
      return true;
    },

    settle() {
      // One look at the network per wave of messages, not per tick of a clock.
      for (let wave = 0; wave < MAX_WAVES; wave++) {
        const s = net.snapshot();
        if (s.inFlight.length === 0) return;
        deliver(s);
      }
    },

    sendTx(from) {
      const ids = onlineIds();
      if (ids.length === 0) return null;
      const sender = from != null && online[from] === true ? from : ids[Math.floor(choose() * ids.length)];
      return { tx: net.broadcastTx(sender), from: sender };
    },

    findBlock() {
      const ids = onlineIds();
      if (ids.length === 0) return null;
      let roll = choose() * ids.reduce((sum, id) => sum + hashPower[id], 0);
      const finder = ids.find((id) => (roll -= hashPower[id]) < 0) ?? ids[ids.length - 1];
      return { block: net.forceBlock(finder), miner: finder };
    },

    canFork: () => forkPair(net.snapshot()) !== null,

    makeFork() {
      const pair = forkPair(net.snapshot());
      if (!pair) return null;
      // No step in between: neither has heard of the other's block.
      return { blocks: [net.forceBlock(pair[0]), net.forceBlock(pair[1])], miners: pair };
    },

    setOnline(node, isOnline) {
      net.setOnline(node, isOnline);
      online[node] = isOnline;
    },

    setMining(on) {
      mining = on;
      net.setMining(on);
    },
    get mining() {
      return mining;
    },
  };
}

/** Whether a network has mined so many blocks that copying its state has become slow. */
export function isWornOut(s: Snapshot): boolean {
  return Object.keys(s.blocks).length > MAX_BLOCKS;
}

/**
 * A fresh network in place of an old one, with the reader's settings carried
 * over: the same nodes offline, and continuous mining on or off as it was.
 */
export function renew(old: Director): Director {
  const fresh = createDirector();
  for (const node of old.snapshot().nodes) {
    if (!node.online) fresh.setOnline(node.id, false);
  }
  fresh.setMining(old.mining);
  return fresh;
}
