import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Snapshot } from '@/lib/netsim';

// A network counts as worn out after a handful of blocks here, instead of thousands.
const LIMIT = 5;
vi.mock('./director', async (original) => {
  const real = await original<typeof import('./director')>();
  return { ...real, isWornOut: (s: Snapshot) => Object.keys(s.blocks).length > LIMIT };
});

const { useNetwork } = await import('./useNetwork');

const blocksIn = (s: Snapshot) => Object.keys(s.blocks).length;

describe('useNetwork', () => {
  it('starts with the figure’s network at rest', () => {
    const { result } = renderHook(() => useNetwork({ active: false, still: false }));
    expect(result.current.snap.t).toBe(0);
    expect(result.current.snap.nodes).toHaveLength(10);
    expect(result.current.mining).toBe(false);
    expect(result.current.renewed).toBe(false);
  });

  it('shows what each action did', () => {
    const { result } = renderHook(() => useNetwork({ active: false, still: false }));
    act(() => result.current.sendTx(4));
    expect(result.current.snap.nodes[4].mempool).toEqual(['tx1']);
    act(() => result.current.setOnline(7, false));
    expect(result.current.snap.nodes[7].online).toBe(false);
    act(() => result.current.setMining(true));
    expect(result.current.mining).toBe(true);
    act(() => result.current.reset());
    expect(result.current.snap.nodes[4].mempool).toEqual([]);
    expect(result.current.snap.nodes[7].online).toBe(true);
    expect(result.current.mining).toBe(false);
  });

  it('does not move time by itself while the figure is off screen or motion is reduced', async () => {
    for (const options of [
      { active: false, still: false },
      { active: true, still: true },
    ]) {
      const { result, unmount } = renderHook(() => useNetwork(options));
      act(() => result.current.sendTx(0));
      await new Promise((resolve) => setTimeout(resolve, 80));
      expect(result.current.snap.t).toBe(0);
      // Stepping by hand still works.
      act(() => result.current.hop());
      expect(result.current.snap.t).toBeGreaterThan(0);
      unmount();
    }
  });

  it('replaces a network that has grown too long, keeps the settings, and says so until the reader acts', () => {
    const { result } = renderHook(() => useNetwork({ active: false, still: true }));
    act(() => result.current.setOnline(2, false));
    act(() => result.current.setMining(true));
    for (let i = 0; i < LIMIT; i++) act(() => result.current.findBlock());
    expect(blocksIn(result.current.snap)).toBe(1); // the sixth block tipped it over: a fresh network
    expect(result.current.renewed).toBe(true);
    expect(result.current.snap.t).toBe(0);
    expect(result.current.snap.nodes[2].online).toBe(false);
    expect(result.current.mining).toBe(true);

    act(() => result.current.sendTx(0));
    expect(result.current.renewed).toBe(false);
  });

  it('puts the network into a guided step', () => {
    const { result } = renderHook(() => useNetwork({ active: false, still: false }));
    let entered: Snapshot | undefined;
    act(() => {
      entered = result.current.enter(2);
    });
    expect(entered).toEqual(result.current.snap);
    expect(result.current.snap.nodes.every((node) => node.tip === 'b1')).toBe(true);
  });
});

describe('the animation loop', () => {
  it('survives a first frame stamped before the loop began, and keeps the clock running', () => {
    // A browser stamps a frame with the time the frame began, which can be before the effect that asked for it ran.
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback));
    vi.stubGlobal('cancelAnimationFrame', () => {});
    try {
      const { result } = renderHook(() => useNetwork({ active: true, still: false }));
      act(() => result.current.sendTx(0)); // something is in flight: the loop starts
      expect(frames).toHaveLength(1);

      const before = performance.now() - 40;
      expect(() => act(() => frames[0](before))).not.toThrow();
      // The first frame only sets the clock; it has asked for the next one.
      expect(result.current.snap.t).toBe(0);
      expect(frames).toHaveLength(2);

      act(() => frames[1](before + 16));
      expect(result.current.snap.t).toBeCloseTo(0.016, 6);
      act(() => frames[2](before + 32));
      expect(result.current.snap.t).toBeCloseTo(0.032, 6);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('never runs time backwards, and never by more than a tenth of a second per frame', () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback));
    vi.stubGlobal('cancelAnimationFrame', () => {});
    try {
      const { result } = renderHook(() => useNetwork({ active: true, still: false }));
      act(() => result.current.setMining(true)); // keeps the loop alive whatever is in flight
      act(() => frames[0](1_000));
      // A timestamp earlier than the last one: nothing moves, nothing throws.
      expect(() => act(() => frames[1](990))).not.toThrow();
      expect(result.current.snap.t).toBe(0);
      // A tab that was stalled for five seconds accounts for a tenth of one.
      act(() => frames[2](5_990));
      expect(result.current.snap.t).toBeCloseTo(0.1, 6);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
