// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { sha256Hex } from '@/lib/hash';
import { merkleLevels } from '@/lib/merkle';
import { centre, childrenOf, treeLayout } from './layout';
import type { Slot } from './layout';

const ids = (n: number) => Array.from({ length: n }, (_, i) => sha256Hex(`layout ${i}`));
const real = (row: Slot[]) => row.filter((slot) => !slot.ghost);
const ghosts = (row: Slot[]) => row.filter((slot) => slot.ghost);

describe('treeLayout', () => {
  it('lays four leaves out on four columns, with no copies', () => {
    const layout = treeLayout(4);
    expect(layout.cols).toBe(4);
    expect(layout.rows.map((row) => row.length)).toEqual([4, 2, 1]);
    expect(layout.rows.flat().some((slot) => slot.ghost)).toBe(false);
    expect(layout.rows[0].map((slot) => [slot.col, slot.span])).toEqual([[0, 1], [1, 1], [2, 1], [3, 1]]);
    expect(layout.rows[1].map((slot) => [slot.col, slot.span])).toEqual([[0, 2], [2, 2]]);
    expect(layout.rows[2].map((slot) => [slot.col, slot.span])).toEqual([[0, 4]]);
  });

  it('gives the lone last node of an odd level a copy beside it', () => {
    const three = treeLayout(3);
    expect(three.cols).toBe(4);
    expect(three.rows[0]).toHaveLength(4);
    expect(three.rows[0][3]).toEqual({ level: 0, index: 3, ghost: true, col: 3, span: 1 });
    expect(ghosts(three.rows[1])).toHaveLength(0);
  });

  it('adds a copy on every odd level: five leaves need one at the bottom and one above', () => {
    const five = treeLayout(5);
    expect(five.cols).toBe(8);
    expect(five.rows.map((row) => real(row).length)).toEqual([5, 3, 2, 1]);
    expect(ghosts(five.rows[0])).toEqual([{ level: 0, index: 5, ghost: true, col: 5, span: 1 }]);
    expect(ghosts(five.rows[1])).toEqual([{ level: 1, index: 3, ghost: true, col: 6, span: 2 }]);
    expect(ghosts(five.rows[2])).toEqual([]);
  });

  it('copies only where a level is odd: six leaves pair up, their three parents do not', () => {
    const six = treeLayout(6);
    expect(ghosts(six.rows[0])).toEqual([]);
    expect(ghosts(six.rows[1])).toEqual([{ level: 1, index: 3, ghost: true, col: 6, span: 2 }]);
    const seven = treeLayout(7);
    expect(ghosts(seven.rows[0])).toEqual([{ level: 0, index: 7, ghost: true, col: 7, span: 1 }]);
    expect(ghosts(seven.rows[1])).toEqual([]);
  });

  it('has one real slot for every node the engine computes', () => {
    for (let n = 1; n <= 8; n++) {
      const layout = treeLayout(n);
      expect(layout.rows.map((row) => real(row).length), `${n} leaves`).toEqual(
        merkleLevels(ids(n)).map((level) => level.length),
      );
    }
  });

  it('keeps every row inside the grid without overlaps', () => {
    for (let n = 1; n <= 8; n++) {
      const { cols, rows } = treeLayout(n);
      for (const row of rows) {
        let edge = 0;
        for (const slot of row) {
          expect(slot.col, `${n} leaves, level ${slot.level}`).toBeGreaterThanOrEqual(edge);
          edge = slot.col + slot.span;
        }
        expect(edge).toBeLessThanOrEqual(cols);
      }
    }
  });

  it('refuses a tree without leaves', () => {
    expect(() => treeLayout(0)).toThrow(RangeError);
    expect(() => treeLayout(2.5)).toThrow(RangeError);
  });
});

describe('childrenOf', () => {
  it('finds the two slots a parent is hashed from, tiling its span exactly', () => {
    for (let n = 2; n <= 8; n++) {
      const layout = treeLayout(n);
      for (const row of layout.rows.slice(1)) {
        for (const parent of real(row)) {
          const pair = childrenOf(layout, parent);
          expect(pair, `${n} leaves`).not.toBeNull();
          const [left, right] = pair!;
          expect(left.col).toBe(parent.col);
          expect(right.col).toBe(parent.col + parent.span / 2);
          expect(left.span + right.span).toBe(parent.span);
          expect(left.ghost).toBe(false);
        }
      }
    }
  });

  it('pairs a lone node with its copy', () => {
    const layout = treeLayout(5);
    const [left, right] = childrenOf(layout, layout.rows[1][2])!;
    expect([left.index, left.ghost]).toEqual([4, false]);
    expect([right.index, right.ghost]).toEqual([5, true]);
  });

  it('gives leaves and copies no children', () => {
    const layout = treeLayout(5);
    expect(childrenOf(layout, layout.rows[0][0])).toBeNull();
    expect(childrenOf(layout, layout.rows[1][3])).toBeNull();
  });
});

describe('centre', () => {
  it('is the middle of a slot as a percentage of the width', () => {
    const layout = treeLayout(4);
    expect(layout.rows[0].map((slot) => centre(slot, layout.cols))).toEqual([12.5, 37.5, 62.5, 87.5]);
    expect(centre(layout.rows[2][0], layout.cols)).toBe(50);
  });
});
