// @vitest-environment node
import { describe, expect, it } from 'vitest';
import paper from '@/content/whitepaper/11-calculations';
import { paperListings, recomputeTables } from './tables';

describe('paperListings', () => {
  const listings = paperListings(paper);

  it('finds the C function and the three result tables, as the paper prints them', () => {
    expect(listings.code.split('\n')[1]).toBe('double AttackerSuccessProbability(double q, int z)');
    expect(listings.code.split('\n')).toHaveLength(16);
    expect(listings.tables.map((table) => table[0])).toEqual(['q=0.1', 'q=0.3', 'P < 0.001']);
    expect(listings.tables.map((table) => table.length)).toEqual([12, 12, 9]);
  });
});

describe('recomputeTables', () => {
  const tables = recomputeTables(paperListings(paper).tables);

  it('recomputes every line of every table to the very characters the paper prints', () => {
    const rows = tables.flatMap((table) => table.rows);
    expect(rows).toHaveLength(11 + 11 + 8);
    for (const row of rows) {
      expect(row.computed, row.printed).toBe(row.printed);
      expect(row.matches).toBe(true);
    }
  });

  it('keeps the paper’s headings and order', () => {
    expect(tables.map((table) => table.heading)).toEqual(['q=0.1', 'q=0.3', 'P < 0.001']);
    expect(tables[0].rows[5].printed).toBe('z=5    P=0.0009137');
    expect(tables[1].rows[10].printed).toBe('z=50   P=0.0000006');
    expect(tables[2].rows[4].printed).toBe('q=0.30   z=24');
    expect(tables[2].rows[7].printed).toBe('q=0.45   z=340');
  });

  it('would notice a table that did not match', () => {
    const [table] = recomputeTables([['q=0.1', 'z=5    P=0.0009138']]);
    expect(table.rows[0].computed).toBe('z=5    P=0.0009137');
    expect(table.rows[0].matches).toBe(false);
  });

  it('refuses a listing it does not understand, rather than skipping it', () => {
    expect(() => recomputeTables([['r=0.1', 'z=5    P=0.0009137']])).toThrow();
    expect(() => recomputeTables([['q=0.1', 'five blocks']])).toThrow();
  });
});
