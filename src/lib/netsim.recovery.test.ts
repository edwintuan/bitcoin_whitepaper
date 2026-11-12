// @vitest-environment node
/**
 * Nodes come and go: whitepaper section 5 says a node that missed a block
 * "will request it when it receives the next block and realizes it missed
 * one". These tests hold the simulator to the consequence a reader can see:
 * once the network is at rest, no online node sits on a shorter chain than an
 * online neighbour, however nodes were switched off and on along the way.
 */
import { describe, expect, it } from 'vitest';
import { createNetwork } from './netsim';
import type { Network, Snapshot } from './netsim';
import { mulberry32 } from './rng';

/** A ring where every hop takes exactly one second. */
const ring = (nodes: number): Network => createNetwork({ nodes, degree: 2, latency: [1, 1], blockInterval: 10, seed: 42 });
const heightOf = (s: Snapshot, id: string) => s.blocks[id].height;

/** Online nodes that sit below an online peer: at rest there must be none. */
function leftBehind(s: Snapshot): number[] {
  return s.nodes
    .filter((n) => n.online && n.peers.some((p) => s.nodes[p].online && heightOf(s, s.nodes[p].tip) > heightOf(s, n.tip)))
    .map((n) => n.id);
}

describe('a new tip reaches every peer that lacks it', () => {
  it('announces a tip that arrived before its parent to the peer that only supplied the parent', () => {
    const net = ring(4); // 0-1-2-3-0
    net.setOnline(1, false);
    net.forceBlock(0); // reaches node 3, then node 2
    net.step(10);
    net.setOnline(3, false); // nodes 0 and 2 can now only talk through node 1
    const tip = net.forceBlock(0); // nobody is listening
    net.step(10);
    net.setOnline(1, true); // node 1 fetches the tip from node 0 and its parent from node 2
    net.step(20);
    const s = net.snapshot();
    expect(s.inFlight).toEqual([]);
    expect(s.nodes.filter((n) => n.online).map((n) => n.tip)).toEqual([tip, tip, tip]);
  });
});

describe('a request lost to a departing peer', () => {
  it('is made again to another peer that has the block', () => {
    const net = ring(4);
    const block = net.forceBlock(0);
    net.step(4); // node 2 has heard from nodes 1 and 3 and asked the first of them
    const asked = net
      .snapshot()
      .inFlight.filter((m) => m.kind === 'getdata' && m.from === 2)
      .map((m) => m.to);
    expect(asked).toHaveLength(1);
    net.setOnline(asked[0], false);
    net.step(20);
    const s = net.snapshot();
    expect(s.inFlight).toEqual([]);
    expect(s.nodes[2].tip).toBe(block);
  });

  it('does not stop a returning node from catching up through its other peers', () => {
    const net = ring(5);
    net.setOnline(0, false);
    let tip = '';
    for (let i = 0; i < 4; i++) {
      tip = net.forceBlock(2);
      net.step(10);
    }
    net.setOnline(0, true);
    net.step(4); // part of the way through fetching four blocks backwards from one peer
    const serving = net
      .snapshot()
      .inFlight.find((m) => (m.kind === 'getdata' && m.from === 0) || (m.kind === 'block' && m.to === 0));
    if (!serving) throw new Error('node 0 should be in the middle of catching up');
    net.setOnline(serving.kind === 'getdata' ? serving.to : serving.from, false);
    net.step(60);
    const s = net.snapshot();
    expect(s.inFlight).toEqual([]);
    expect(s.nodes[0].tip).toBe(tip);
  });
});

describe('at rest', () => {
  it('no online node sits below an online peer, whatever was switched off and on along the way', () => {
    for (let seed = 1; seed <= 150; seed++) {
      const pick = mulberry32(seed * 7907);
      const nodes = 4 + Math.floor(pick() * 9);
      const net = createNetwork({ nodes, degree: 2 + Math.floor(pick() * 3), latency: [0.2, 0.9], blockInterval: 10, seed });
      const online = new Array<boolean>(nodes).fill(true);
      for (let i = 0; i < 120; i++) {
        const roll = pick();
        const node = Math.floor(pick() * nodes);
        if (roll < 0.18) {
          if (online[node]) net.forceBlock(node);
        } else if (roll < 0.3) {
          if (online[node]) net.broadcastTx(node);
        } else if (roll < 0.5 && (online.filter(Boolean).length > 2 || !online[node])) {
          online[node] = !online[node];
          net.setOnline(node, online[node]);
        }
        net.step(pick() * 1.5);
      }
      net.step(500);
      const s = net.snapshot();
      expect(s.inFlight).toEqual([]);
      expect({ seed, behind: leftBehind(s) }).toEqual({ seed, behind: [] });
    }
  });
});
