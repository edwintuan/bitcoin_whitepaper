import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MiniTree } from './MiniTree';
import { Tree } from './Tree';
import { treeLayout } from './layout';

const hash = (name: string) => name.padEnd(64, '0');
const LEVELS = [[hash('a'), hash('b'), hash('c'), hash('d')], [hash('ab'), hash('cd')], [hash('abcd')]];

describe('Tree', () => {
  const draw = (flowInto: number | null) =>
    render(
      <Tree
        layout={treeLayout(4)}
        label="A tree of four"
        renderNode={(slot) => <span>{`${slot.level}:${slot.index}`}</span>}
        flowInto={flowInto}
      />,
    );

  it('draws one box per node, in a group with a name', () => {
    draw(null);
    const tree = screen.getByRole('group', { name: 'A tree of four' });
    expect(tree.querySelectorAll('.mtree-slot')).toHaveLength(7);
    expect(tree).toHaveTextContent('2:0');
  });

  it('keeps the markers that travel up the links inside one layer that clips them, so they cannot widen the page', () => {
    const { container } = draw(1);
    const markers = [...container.querySelectorAll('.mtree-flow')];
    // Two parents on level 1, a marker from each of their two children.
    expect(markers).toHaveLength(4);
    const layer = container.querySelector('.mtree-flows');
    expect(layer).not.toBeNull();
    for (const marker of markers) expect(marker.parentElement).toBe(layer);
  });

  it('draws no markers, and no layer for them, at rest', () => {
    const { container } = draw(null);
    expect(container.querySelector('.mtree-flow')).toBeNull();
    expect(container.querySelector('.mtree-flows')).toBeNull();
  });
});

describe('MiniTree', () => {
  it('draws its leaves as buttons when pressing one does something', () => {
    render(
      <MiniTree levels={LEVELS} tone={() => 'on'} leafName={(i) => `Tx${i}`} leafLabel={(i) => `Pick ${i}`} onLeaf={() => {}} rootLabel="root" />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'Pick 2' })).toHaveTextContent('Tx2');
  });

  it('draws them as plain shapes when nothing listens, with each name as text of its own', () => {
    render(<MiniTree levels={LEVELS} tone={() => 'on'} leafName={(i) => `Tx${i}`} rootLabel="root" />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.getByText('Tx3')).toBeInTheDocument();
    expect(screen.getByText('root')).toBeInTheDocument();
  });

  it('is one named picture for readers who cannot see it, when it is given the words', () => {
    render(<MiniTree levels={LEVELS} tone={() => 'on'} leafName={(i) => `Tx${i}`} rootLabel="root" label="A tree of four hashes" />);
    expect(screen.getByRole('img', { name: 'A tree of four hashes' })).toBeInTheDocument();
  });

  it('hangs from whatever is given as its head, in place of a root row of its own', () => {
    const { container } = render(
      <MiniTree levels={LEVELS} tone={() => 'on'} leafName={(i) => `Tx${i}`} head={<p>the header</p>} />,
    );
    expect(screen.getByText('the header')).toBeInTheDocument();
    expect(container.querySelector('[data-row="root"]')).toBeNull();
  });

  it('marks each node with its tone, and leaves a gap for a hash that is still to be worked out', () => {
    const { container } = render(
      <MiniTree
        levels={LEVELS}
        tone={(level, index) => (level === 1 && index === 1 ? 'wait' : level === 0 && index < 2 ? 'none' : 'hit')}
        leafName={(i) => `Tx${i}`}
        rootLabel="root"
      />,
    );
    const tones = [...container.querySelectorAll('.mtree-mini-node')].map((node) => node.getAttribute('data-tone'));
    expect(tones).toEqual(['hit', 'hit', 'wait', 'none', 'none', 'hit', 'hit']);
    expect(container.querySelector('[data-tone="wait"]')).toHaveTextContent('…');
    // Nothing is drawn down to leaves that are not held.
    expect(container.querySelectorAll('.mtree-mini-links')[1].querySelectorAll('path')).toHaveLength(1);
  });
});
