import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Snapshot } from '@/lib/netsim';
import { createDirector, isWornOut, renew } from './director';
import type { Director } from './director';
import { enterStep } from './walkthrough';

/** Simulated seconds per real second the reader can choose from. */
export const SPEEDS = [0.5, 1, 2, 4] as const;

/** Longest stretch of real time one frame may account for, so a stalled tab does not jump ahead. */
const MAX_FRAME_MS = 100;

export interface NetworkControls {
  /** The network as of the last frame. */
  snap: Snapshot;
  playing: boolean;
  setPlaying(playing: boolean): void;
  speed: number;
  setSpeed(speed: number): void;
  mining: boolean;
  setMining(on: boolean): void;
  sendTx(from: number | null): void;
  findBlock(): void;
  makeFork(): void;
  setOnline(node: number, online: boolean): void;
  /** Delivers everything in flight at once: the Step button. */
  hop(): void;
  reset(): void;
  /** Puts the network into a guided step and returns the state it is then in. */
  enter(step: number): Snapshot;
  /**
   * True from the moment a very long run was replaced by a fresh network until
   * the reader next does something. The status line says so.
   */
  renewed: boolean;
}

/**
 * Owns the simulation for the figure and plays it in animation frames. Time
 * moves only while the figure is `active`, the reader has not paused, motion
 * is not reduced, and there is something to wait for.
 */
export function useNetwork({ active, still }: { active: boolean; still: boolean }): NetworkControls {
  const director = useRef<Director | null>(null);
  const current = useCallback((): Director => (director.current ??= createDirector()), []);

  const [snap, setSnap] = useState<Snapshot>(() => current().snapshot());
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<number>(1);
  const [mining, setMiningState] = useState(false);
  const [renewed, setRenewed] = useState(false);
  const speedNow = useRef(speed);
  speedNow.current = speed;

  // The one place the network's state is copied: once per frame, or once after an action.
  const sync = useCallback((): Snapshot => {
    let next = current().snapshot();
    if (isWornOut(next)) {
      // Every copy includes every block ever mined. After a few thousand, start again.
      director.current = renew(current());
      next = current().snapshot();
      setRenewed(true);
    }
    setSnap(next);
    setMiningState(current().mining);
    return next;
  }, [current]);

  const waiting = snap.inFlight.length > 0 || mining;
  const running = active && playing && !still && waiting;

  useEffect(() => {
    if (!running) return;
    let frame = 0;
    // The clock is taken from the first frame, not from `performance.now()` here: a frame is
    // stamped with the time it began, which can be before this effect ran. Time never runs
    // backwards, whatever the stamps do, or the engine would refuse the step and the loop would die.
    let last: number | null = null;
    const tick = (now: number) => {
      const elapsed = last === null ? 0 : Math.max(0, Math.min(now - last, MAX_FRAME_MS));
      last = now;
      current().advance((elapsed / 1000) * speedNow.current);
      sync();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, current, sync]);

  const actions = useMemo(() => {
    /** Runs something the reader asked for, then shows the result. */
    const act = (change: () => void): Snapshot => {
      setRenewed(false);
      change();
      return sync();
    };
    return {
      setMining: (on: boolean) => void act(() => current().setMining(on)),
      sendTx: (from: number | null) => void act(() => current().sendTx(from)),
      findBlock: () => void act(() => current().findBlock()),
      makeFork: () => void act(() => current().makeFork()),
      setOnline: (node: number, online: boolean) => void act(() => current().setOnline(node, online)),
      hop: () => void act(() => current().hop()),
      reset: () => void act(() => (director.current = createDirector())),
      enter: (step: number): Snapshot => act(() => (director.current = enterStep(step, director.current))),
    };
  }, [current, sync]);

  return { snap, playing, setPlaying, speed, setSpeed, mining, renewed, ...actions };
}
