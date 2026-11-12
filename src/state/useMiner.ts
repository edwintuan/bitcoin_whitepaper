import { useCallback, useEffect, useRef, useState } from 'react';
import type { BlockHeader } from '@/lib/header';
import { createMiner } from '@/lib/miner';
import type { Miner } from '@/lib/miner';

export interface MinerView {
  status: 'idle' | 'mining' | 'found';
  /** Nonce of the latest attempt. */
  nonce: number;
  /** Hash of the latest attempt, display order. Empty before the first attempt. */
  hash: string;
  /** Attempts made in this run. */
  tried: number;
  /** Attempts per second over this run, or 0 while the run is too short to tell. */
  rate: number;
}

const IDLE: MinerView = { status: 'idle', nonce: 0, hash: '', tried: 0, rate: 0 };

/** Milliseconds of each animation frame given to hashing. Leaves the rest for painting. */
const FRAME_BUDGET_MS = 6;

/**
 * A rate is only stated once this much mining has been timed. An easy block is
 * found within a frame or two, and a handful of tries over a few milliseconds
 * says nothing about the machine.
 */
const MIN_MEASURE_MS = 250;

interface Run {
  miner: Miner;
  tried: number;
  /** Hashes to attempt this frame; adapts to the machine. */
  batch: number;
  /** Time spent mining, excluding pauses. */
  elapsedMs: number;
  lastTick: number;
  lastPaint: number;
  onFound?: (view: MinerView) => void;
}

/**
 * Real proof-of-work on the main thread, a slice per animation frame.
 *
 * - `active`: mining pauses while false (figure off screen, tab hidden) and
 *   resumes where it stopped.
 * - `maxRate`: cap in hashes per second, for scenes where the point is to
 *   watch the cost rather than to finish quickly.
 * - `calm`: repaint a few times a second instead of every frame (reduced motion).
 */
export function useMiner({ active, maxRate, calm = false }: { active: boolean; maxRate?: number; calm?: boolean }) {
  const [view, setView] = useState<MinerView>(IDLE);
  const run = useRef<Run | null>(null);
  const frame = useRef(0);
  const options = useRef({ active, maxRate, calm });
  options.current = { active, maxRate, calm };

  const tick = useCallback(() => {
    const current = run.current;
    if (!current) return;
    const { maxRate: cap, calm: slowPaint } = options.current;

    const now = performance.now();
    const frameMs = Math.min(now - current.lastTick, 100);
    current.lastTick = now;
    current.elapsedMs += frameMs;

    const allowance = cap ? Math.max(1, Math.round((cap * frameMs) / 1000)) : current.batch;
    const before = performance.now();
    const result = current.miner.step(allowance);
    const spent = performance.now() - before;
    if (!cap) {
      const scaled = Math.round(current.batch * (FRAME_BUDGET_MS / Math.max(spent, 0.2)));
      current.batch = Math.min(80_000, Math.max(32, scaled));
    }

    current.tried += result.tried;
    const next: MinerView = {
      status: result.found ? 'found' : 'mining',
      nonce: result.nonce,
      hash: result.hash,
      tried: current.tried,
      rate: current.elapsedMs >= MIN_MEASURE_MS ? current.tried / (current.elapsedMs / 1000) : 0,
    };

    if (result.found) {
      run.current = null;
      setView(next);
      current.onFound?.(next);
      return;
    }
    if (!slowPaint || now - current.lastPaint > 240) {
      current.lastPaint = now;
      setView(next);
    }
    frame.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(
    (header: BlockHeader, target: bigint, onFound?: (view: MinerView) => void) => {
      cancelAnimationFrame(frame.current);
      const now = performance.now();
      run.current = {
        miner: createMiner({ header, target }),
        tried: 0,
        batch: 256,
        elapsedMs: 0,
        lastTick: now,
        lastPaint: 0,
        onFound,
      };
      setView({ ...IDLE, status: 'mining', nonce: header.nonce });
      if (options.current.active) frame.current = requestAnimationFrame(tick);
    },
    [tick],
  );

  const stop = useCallback(() => {
    cancelAnimationFrame(frame.current);
    run.current = null;
    setView((previous) => (previous.status === 'mining' ? { ...previous, status: 'idle' } : previous));
  }, []);

  const reset = useCallback(() => {
    cancelAnimationFrame(frame.current);
    run.current = null;
    setView(IDLE);
  }, []);

  // Pause off screen; pick up again on return.
  useEffect(() => {
    cancelAnimationFrame(frame.current);
    if (active && run.current) {
      run.current.lastTick = performance.now();
      frame.current = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(frame.current);
  }, [active, tick]);

  return { view, start, stop, reset };
}
