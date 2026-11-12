import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GENESIS_HEADER, meetsTarget, targetFromZeroBits } from '@/lib/header';
import { mineSync } from '@/lib/miner';
import { useMiner } from './useMiner';

/** A clock and a frame queue the test turns by hand. */
let now = 0;
let nextId = 1;
let queue = new Map<number, FrameRequestCallback>();

function frame(ms = 16) {
  now += ms;
  const due = [...queue.values()];
  queue = new Map();
  act(() => due.forEach((callback) => callback(now)));
}

beforeEach(() => {
  now = 1000;
  nextId = 1;
  queue = new Map();
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    queue.set(nextId, callback);
    return nextId++;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    queue.delete(id);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const HEADER = { ...GENESIS_HEADER, nonce: 0 };
const EASY = targetFromZeroBits(4);
/** Never met in the few hundred tries a test makes. */
const HARD = targetFromZeroBits(60);
/** Hashes a second. At 16 ms a frame that is 16 tries a frame. */
const CAP = 1000;

describe('useMiner', () => {
  it('finds the same block the engine finds, and counts every try', () => {
    const expected = mineSync(HEADER, EASY, 1_000_000);
    const { result } = renderHook(() => useMiner({ active: true, maxRate: CAP }));
    act(() => result.current.start(HEADER, EASY));
    for (let i = 0; i < 100 && result.current.view.status !== 'found'; i++) frame();

    expect(result.current.view.status).toBe('found');
    expect(result.current.view.nonce).toBe(expected.nonce);
    expect(result.current.view.hash).toBe(expected.hash);
    expect(result.current.view.tried).toBe(expected.nonce + 1);
    expect(meetsTarget(result.current.view.hash, EASY)).toBe(true);
  });

  it('gives no rate for a run too short to measure', () => {
    const { result } = renderHook(() => useMiner({ active: true, maxRate: CAP }));
    act(() => result.current.start(HEADER, EASY));
    for (let i = 0; i < 10 && result.current.view.status !== 'found'; i++) frame();

    // Found within a few frames: dividing a handful of tries by a floor of
    // 50 ms would print a number that is only "tries × 20".
    expect(result.current.view.status).toBe('found');
    expect(result.current.view.rate).toBe(0);
  });

  it('gives tries over time once a quarter of a second has been measured', () => {
    const { result } = renderHook(() => useMiner({ active: true, maxRate: CAP }));
    act(() => result.current.start(HEADER, HARD));

    for (let i = 0; i < 10; i++) frame(); // 160 ms
    expect(result.current.view.rate).toBe(0);

    for (let i = 0; i < 10; i++) frame(); // 320 ms
    expect(result.current.view.tried).toBe(320);
    expect(result.current.view.rate).toBeCloseTo(CAP, 0);
  });

  it('does not count the time spent paused', () => {
    const { result, rerender } = renderHook(({ active }) => useMiner({ active, maxRate: CAP }), {
      initialProps: { active: true },
    });
    act(() => result.current.start(HEADER, HARD));
    for (let i = 0; i < 20; i++) frame();
    const before = result.current.view.tried;

    rerender({ active: false });
    now += 5000;
    frame();
    expect(result.current.view.tried).toBe(before); // nothing was mined off screen

    rerender({ active: true });
    for (let i = 0; i < 20; i++) frame();
    expect(result.current.view.tried).toBeGreaterThan(before);
    expect(result.current.view.rate).toBeCloseTo(CAP, -1);
  });

  it('calls back once with the result', () => {
    const found = vi.fn();
    const { result } = renderHook(() => useMiner({ active: true, maxRate: CAP }));
    act(() => result.current.start(HEADER, EASY, found));
    for (let i = 0; i < 100; i++) frame();

    expect(found).toHaveBeenCalledTimes(1);
    expect(found.mock.calls[0][0]).toMatchObject({ status: 'found', hash: result.current.view.hash });
  });

  it('stops where it is and can be cleared', () => {
    const { result } = renderHook(() => useMiner({ active: true, maxRate: CAP }));
    act(() => result.current.start(HEADER, HARD));
    for (let i = 0; i < 5; i++) frame();

    act(() => result.current.stop());
    const stopped = result.current.view.tried;
    for (let i = 0; i < 5; i++) frame();
    expect(result.current.view.status).toBe('idle');
    expect(result.current.view.tried).toBe(stopped);

    act(() => result.current.reset());
    expect(result.current.view).toMatchObject({ status: 'idle', tried: 0, hash: '', rate: 0 });
  });
});
