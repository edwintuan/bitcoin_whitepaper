/**
 * The paper's three result tables, read from the paper's own text and worked
 * out again with the engine. Each line is rebuilt in the layout the paper
 * prints, so "matches" means the same characters, not a number that is close.
 */
import type { WhitepaperSection } from '@/content/types';
import { attackerSuccessProbability, minConfirmations } from '@/lib/attack';

export interface PaperListings {
  /** The C function, as printed. */
  code: string;
  /** The three tables, one line per entry, heading first. */
  tables: string[][];
}

/**
 * Picks the listings out of section 11 as stored in src/content/whitepaper:
 * the first is the C function, the next three are the tables.
 *
 * @throws Error if the section does not hold exactly those four listings.
 */
export function paperListings(section: WhitepaperSection): PaperListings {
  const [code, ...tables] = section.en.flatMap((block) => (block.type === 'code' ? [block.code] : []));
  if (!code || tables.length !== 3) throw new Error('section 11 should print one function and three tables');
  return { code, tables: tables.map((table) => table.split('\n')) };
}

export interface TableRow {
  /** The line as the paper prints it. */
  printed: string;
  /** The same line, with its value computed here. */
  computed: string;
  matches: boolean;
}

export interface RecomputedTable {
  heading: string;
  rows: TableRow[];
}

/**
 * Recomputes each table from its heading:
 *
 * - `q=0.1`: lines `z=5    P=0.0009137`, the probability for that q and each z;
 * - `P < 0.001`: lines `q=0.10   z=5`, the smallest z that brings P under the limit.
 *
 * @throws Error on a heading or a line in any other form.
 */
export function recomputeTables(tables: readonly string[][]): RecomputedTable[] {
  return tables.map(([heading, ...lines]) => {
    const fixedShare = /^q=(\d+\.\d+)$/.exec(heading);
    const limit = /^P < (\d+\.\d+)$/.exec(heading);
    if (!fixedShare && !limit) throw new Error(`unexpected table heading: ${heading}`);

    const rows = lines.map((printed) => {
      let computed: string;
      if (fixedShare) {
        const line = /^z=(\d+) +P=\d\.\d+$/.exec(printed);
        if (!line) throw new Error(`unexpected table line: ${printed}`);
        const z = Number(line[1]);
        computed = `${`z=${z}`.padEnd(7)}P=${attackerSuccessProbability(Number(fixedShare[1]), z).toFixed(7)}`;
      } else {
        const line = /^q=(\d\.\d+) +z=\d+$/.exec(printed);
        if (!line || !limit) throw new Error(`unexpected table line: ${printed}`);
        const q = Number(line[1]);
        computed = `${`q=${q.toFixed(2)}`.padEnd(9)}z=${minConfirmations(q, Number(limit[1]))}`;
      }
      return { printed, computed, matches: computed === printed };
    });
    return { heading, rows };
  });
}
