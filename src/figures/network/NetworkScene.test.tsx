import { fireEvent, render, screen } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { SettingsProvider } from '@/i18n/settings';
import type { Snapshot } from '@/lib/netsim';
import { createDirector } from './director';
import { NetworkScene } from './NetworkScene';
import type { NetworkControls } from './useNetwork';
import { chainView, lastReorg, situation } from './view';
import type { Hint } from './walkthrough';

// The segmented control measures itself; jsdom has no ResizeObserver.
// Nor does it lay anything out: the graph draws its nodes once it has a width, so it is given one.
const realWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 560 });
});
afterAll(() => {
  if (realWidth) Object.defineProperty(HTMLElement.prototype, 'clientWidth', realWidth);
});

/** The controls the scene is given, on a network frozen at `snap`. */
const controls = (snap: Snapshot, over: Partial<NetworkControls> = {}): NetworkControls => ({
  snap,
  playing: true,
  setPlaying: vi.fn(),
  speed: 1,
  setSpeed: vi.fn(),
  mining: false,
  setMining: vi.fn(),
  sendTx: vi.fn(),
  findBlock: vi.fn(),
  makeFork: vi.fn(),
  setOnline: vi.fn(),
  hop: vi.fn(),
  reset: vi.fn(),
  enter: vi.fn(),
  renewed: false,
  ...over,
});

const show = (
  net: NetworkControls,
  hint: Hint = null,
  selected: number | null = null,
  onSelect: (node: number | null) => void = () => {},
) =>
  render(
    <SettingsProvider initialLang="en" initialDepth="developer">
      <NetworkScene net={net} hint={hint} selected={selected} onSelect={onSelect} still={false} />
    </SettingsProvider>,
  );

const atRest = () => createDirector().snapshot();

/** A network in which a fork has just been made, so another cannot be. */
const forked = () => {
  const director = createDirector();
  director.makeFork();
  return director.snapshot();
};

describe('the network scene', () => {
  it('points at the row of actions when the walkthrough asks for one of them', () => {
    for (const hint of ['send', 'mine', 'fork'] as const) {
      const { container, unmount } = show(controls(atRest()), hint);
      const pointed = container.querySelectorAll('.fig-pointed');
      expect(pointed).toHaveLength(1);
      expect(pointed[0].contains(screen.getByRole('button', { name: 'Send a transaction' }))).toBe(true);
      expect(pointed[0].contains(screen.getByRole('button', { name: 'Make a fork' }))).toBe(true);
      unmount();
    }
  });

  it('points at nothing when the walkthrough has nothing to ask', () => {
    const { container } = show(controls(atRest()), null, 3);
    expect(container.querySelector('.fig-pointed')).toBeNull();
  });

  it('points at the node’s panel, or at its head when the step is about going offline', () => {
    const panel = show(controls(atRest()), 'panel', 3);
    expect(panel.container.querySelector('.net-panel')?.classList.contains('fig-pointed')).toBe(true);
    expect(panel.container.querySelectorAll('.fig-pointed')).toHaveLength(1);
    panel.unmount();

    for (const hint of ['offline', 'online'] as const) {
      const { container, unmount } = show(controls(atRest()), hint, 3);
      const pointed = container.querySelectorAll('.fig-pointed');
      expect(pointed).toHaveLength(1);
      expect(pointed[0].classList.contains('net-panel-head')).toBe(true);
      expect(pointed[0].contains(screen.getByRole('button', { name: 'Take offline' }))).toBe(true);
      unmount();
    }
  });

  it('leaves the pointing to the shared bar: nothing of its own marks a region', () => {
    const { container } = show(controls(atRest()), 'send', 3);
    expect(container.querySelector('[data-hl]')).toBeNull();
  });

  it('returns the focus to the node when its panel is closed', () => {
    const onSelect = vi.fn();
    show(controls(atRest()), null, 3, onSelect);
    const close = screen.getByRole('button', { name: 'Close' });
    close.focus();
    fireEvent.click(close);
    expect(onSelect).toHaveBeenCalledWith(null);
    // The button that closed the panel is about to go: the node it belonged to takes the focus.
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /^Node 3,/ }));
  });

  it('keeps Make a fork in reach of the keyboard while a fork cannot be made', () => {
    const net = controls(forked());
    show(net);
    const fork = screen.getByRole('button', { name: 'Make a fork' });
    expect(fork).toHaveAttribute('aria-disabled', 'true');
    expect(fork).not.toBeDisabled();
    fireEvent.click(fork);
    expect(net.makeFork).not.toHaveBeenCalled();
  });

  it('makes a fork when one can be made', () => {
    const net = controls(atRest());
    show(net);
    const fork = screen.getByRole('button', { name: 'Make a fork' });
    expect(fork).not.toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(fork);
    expect(net.makeFork).toHaveBeenCalledTimes(1);
  });

  it('keeps Step in reach of the keyboard when there is nothing to deliver', () => {
    const quiet = controls(atRest(), { playing: false });
    const { unmount } = show(quiet);
    const step = screen.getByRole('button', { name: 'Step' });
    expect(step).toHaveAttribute('aria-disabled', 'true');
    expect(step).not.toBeDisabled();
    fireEvent.click(step);
    expect(quiet.hop).not.toHaveBeenCalled();
    unmount();

    const busy = controls(forked(), { playing: false });
    show(busy);
    fireEvent.click(screen.getByRole('button', { name: 'Step' }));
    expect(busy.hop).toHaveBeenCalledTimes(1);
  });
});

describe('the status line', () => {
  /** What the line says about a network frozen at `snap`. */
  const status = (snap: Snapshot): string => {
    const { container, unmount } = show(controls(snap));
    const text = container.querySelector('[role="status"]')?.textContent ?? '';
    unmount();
    return text;
  };

  it('says the network is at rest among the nodes that are online', () => {
    expect(status(atRest())).toBe('At rest. Every node that is online builds on b0, height 0.');
  });

  it('names the nodes that are offline, so that taking one offline or bringing it back is news', () => {
    const director = createDirector();
    director.setOnline(3, false);
    expect(status(director.snapshot())).toBe(
      'At rest. Every node that is online builds on b0, height 0. Node 3 is offline.',
    );
    director.setOnline(7, false);
    expect(status(director.snapshot())).toBe(
      'At rest. Every node that is online builds on b0, height 0. Nodes 3, 7 are offline.',
    );
    director.setOnline(3, true);
    director.settle();
    expect(status(director.snapshot())).toBe(
      'At rest. Every node that is online builds on b0, height 0. Node 7 is offline.',
    );
  });

  it('does not claim a node that is offline on an older block', () => {
    const director = createDirector();
    director.setOnline(3, false);
    director.findBlock();
    director.settle();
    const s = director.snapshot();
    expect(s.nodes[3].tip).toBe('b0');
    expect(status(s)).toBe('At rest. Every node that is online builds on b1, height 1. Node 3 is offline.');
  });

  it('names them while a transaction or a block is on its way, and during a fork', () => {
    const director = createDirector();
    director.setOnline(3, false);
    director.sendTx(0);
    expect(status(director.snapshot())).toBe('tx1 is on its way from node to node. Node 3 is offline.');
    director.settle();
    director.findBlock();
    expect(status(director.snapshot())).toBe('Block b1, height 1, is on its way from node to node. Node 3 is offline.');
    director.settle();
    director.makeFork();
    expect(status(director.snapshot())).toMatch(/^Fork at height 2: .* The next block decides\. Node 3 is offline\.$/);
  });

  it('does not call it a block on its way when only a transaction is travelling', () => {
    const director = createDirector();
    // Without its three peers, node 3 is alone: whoever finds the next block, it and the rest cannot agree.
    for (const peer of director.snapshot().nodes[3].peers) director.setOnline(peer, false);
    director.findBlock();
    director.settle();
    expect(status(director.snapshot())).toMatch(/^Some nodes cannot hear the news/);

    director.sendTx(0);
    const s = director.snapshot();
    expect(s.inFlight.length).toBeGreaterThan(0);
    expect(status(s)).toMatch(/^Some nodes cannot hear the news/);
    expect(status(s)).not.toMatch(/is on its way/);
  });

  it('says nothing is new when nodes only compare notes', () => {
    const director = createDirector();
    director.setOnline(3, false);
    director.setOnline(3, true); // both sides announce a tip the other already has
    const s = director.snapshot();
    expect(situation(s).kind).toBe('busy');
    expect(status(s)).toBe('Nodes are comparing what they have. Nothing new so far.');
  });

  it('does not say nothing is new just before it reports a reorg', () => {
    const director = createDirector();
    director.makeFork();
    director.settle();
    director.findBlock();
    // The moment after the last node has switched, while the tail of the announcements is still in flight.
    let found: Snapshot | null = null;
    for (let i = 0; i < 600 && !found; i++) {
      director.advance(0.02);
      const s = director.snapshot();
      if (situation(s).kind === 'busy' && lastReorg(s)?.block === chainView(s).leader) found = s;
    }
    expect(found).not.toBeNull();
    const text = status(found as Snapshot);
    expect(text).toMatch(/^Nodes are comparing what they have\. Nodes? [0-9, ]+ left .* a reorg\.$/);
    expect(text).not.toContain('Nothing new');
  });
});
