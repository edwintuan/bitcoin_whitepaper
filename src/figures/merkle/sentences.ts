/**
 * The status lines of the Merkle tree figure, put together from its copy and
 * the numbers on screen. Kept out of the scenes so that each sentence can be
 * read, and tested, as the reader will read it.
 */
import type { Lang } from '@/content/types';
import { fill } from '@/text/format';
import { COPY } from './copy';
import { LARGEST_BLOCK_BYTES, megabytes, yearlyHeaderBytes } from './model';
import type { StorageCount } from './model';
import { pick } from '@/i18n/settings';

/** What goes between two sentences: a space in English, nothing in Chinese, whose sentences end in full-width punctuation. */
export const gap = (lang: Lang): string => (lang === 'en' ? ' ' : '');

/** Joins sentences that were written separately, leaving out any that are missing. */
export function sentences(lang: Lang, ...parts: (string | null | false | undefined)[]): string {
  return parts.filter((part): part is string => typeof part === 'string' && part !== '').join(gap(lang));
}

/** A status line: what happened, and sometimes a quieter remark after it. */
export interface Status {
  text: string;
  aside: string | null;
}

/** What the tree scene shows, as far as its status line is concerned. */
export interface TreeStatusInput {
  /**
   * While the tree builds: the level being hashed (1 is the row of
   * transactions), how many levels there are, and whether the level below has
   * a lone last hash. Null at rest.
   */
  building: { level: number; levels: number; oddBelow: boolean } | null;
  /** Transactions in the block. */
  count: number;
  /** Transactions marked as spent. */
  spent: number;
  /** Of those, the ones marked since the last pruning. */
  waiting: number;
  pruned: boolean;
  counts: StorageCount;
}

/** The status line under the tree. */
export function treeStatus(lang: Lang, state: TreeStatusInput): Status {
  const { building, counts } = state;
  if (building) {
    const template = building.level === 1 ? COPY.buildingLeaves : building.oddBelow ? COPY.buildingOdd : COPY.building;
    return { text: fill(pick(template, lang), { level: building.level, levels: building.levels }), aside: null };
  }
  if (!state.pruned) {
    if (state.spent > 0) return { text: fill(pick(COPY.marked, lang), { n: state.spent, total: state.count }), aside: null };
    return { text: pick((state.count % 2 === 1 ? COPY.idleOdd : COPY.idle), lang), aside: null };
  }

  let text: string;
  if (state.waiting > 0) {
    text = fill(pick(COPY.markedMore, lang), { n: state.waiting });
  } else if (counts.txKept === 0) {
    text = pick(COPY.prunedAll, lang);
  } else {
    text = fill(pick(COPY.pruned, lang), {
      dropped: counts.txTotal - counts.txKept,
      total: counts.txTotal,
      stubs: counts.stubHashes === 1 ? pick(COPY.oneHash, lang) : fill(pick(COPY.hashes, lang), { n: counts.stubHashes }),
    });
  }
  return { text, aside: pick(COPY.prunedLocked, lang) };
}

/** The status line of the header storage scene, for a block every `minutes` minutes. */
export function storageStatus(lang: Lang, minutes: number): string {
  if (minutes === 10) return pick(COPY.storagePaper, lang);
  const yearly = yearlyHeaderBytes(minutes);
  return fill(pick(COPY.storageOther, lang), {
    minutes,
    megabytes: megabytes(yearly),
    blocks: (yearly / LARGEST_BLOCK_BYTES).toFixed(1),
  });
}
