/**
 * Shared content contracts. Every piece of copy on the site is data shaped by
 * these types; components never hard-code reader-facing strings.
 */

export type Lang = 'en' | 'zh';

export type Depth = 'starter' | 'curious' | 'developer';

export const DEPTHS: readonly Depth[] = ['starter', 'curious', 'developer'];

/** A value written once per language. `zh` is Traditional Chinese in Hong Kong usage. */
export type L<T> = { en: T; zh: T };

export type SectionId =
  | 'abstract'
  | 'introduction'
  | 'transactions'
  | 'timestamp-server'
  | 'proof-of-work'
  | 'network'
  | 'incentive'
  | 'reclaiming-disk-space'
  | 'spv'
  | 'combining-splitting-value'
  | 'privacy'
  | 'calculations'
  | 'conclusion';

export const SECTION_IDS: readonly SectionId[] = [
  'abstract',
  'introduction',
  'transactions',
  'timestamp-server',
  'proof-of-work',
  'network',
  'incentive',
  'reclaiming-disk-space',
  'spv',
  'combining-splitting-value',
  'privacy',
  'calculations',
  'conclusion',
];

export type PartNumber = 1 | 2 | 3 | 4 | 5 | 6;

/* ------------------------------------------------------------------ sections */

export type ActorId =
  | 'software-wallet'
  | 'hardware-wallet'
  | 'full-node'
  | 'mining-pool'
  | 'asic-miner'
  | 'light-client'
  | 'explorer';

export type ArtifactKind = 'rpc' | 'cli' | 'p2p' | 'file' | 'hardware' | 'bip';

export interface WhoRunsItem {
  actor: ActorId;
  /** What this actor does for this step of the paper. Rich text. */
  role: L<string>;
  artifact: {
    kind: ArtifactKind;
    /** Untranslated identifier: an RPC name, a file path, a BIP number, a message name. */
    label: string;
    /** One or two sentences on what it is. Rich text. */
    detail: L<string>;
    /** Optional literal the reader can copy, shown at developer depth. */
    snippet?: string;
  };
}

export interface FigureStep {
  title: string;
  /** Rich text. */
  text: string;
}

export interface SectionContent {
  id: SectionId;
  /** 0 is the Abstract; 1 to 12 are the paper's numbered sections. */
  number: number;
  part: PartNumber;
  title: L<string>;
  /** One or two plain sentences. Rich text. */
  tldr: L<string>;
  /** One everyday comparison. Rich text. */
  analogy: L<string>;
  /** Three to six paragraphs. Rich text. */
  body: L<string[]>;
  /** The Abstract has no figure of its own: the hero and the journey stand in for it. */
  figure: {
    /** File name in src/figures, without extension. */
    component: string;
    title: L<string>;
    /** Guided steps. Both languages must have the same number of steps. */
    steps: L<FigureStep[]>;
  } | null;
  whoRuns: WhoRunsItem[];
  /** Where the 2008 paper and today's Bitcoin differ. Rich text. */
  paperVsToday: L<string[]>;
}

/* ---------------------------------------------------------- whitepaper text */

export type PaperFigureId =
  | 'tx-chain'
  | 'timestamp-chain'
  | 'pow-blocks'
  | 'merkle-prune'
  | 'spv-chain'
  | 'combine-split'
  | 'privacy-models';

/**
 * One block of the paper as printed. Text is plain, not rich text: the
 * original is shown verbatim, citations such as "[1]" included.
 */
export type OriginalBlock =
  | { type: 'p'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'figure'; id: PaperFigureId; caption?: string }
  | { type: 'math'; mathml: string }
  | { type: 'code'; code: string }
  | { type: 'table'; caption?: string; rows: string[][] };

export interface WhitepaperSection {
  id: SectionId;
  number: number;
  heading: L<string>;
  /** Verbatim English from the PDF. */
  en: OriginalBlock[];
  /** Our translation. Must mirror `en` block for block (same types, same order). */
  zh: OriginalBlock[];
}

/* ------------------------------------------------------------ source glances */

export interface SourceAnnotation {
  /** Inclusive line numbers in the file at that tag. */
  lines: [number, number];
  /** Our note, not part of the source. Rich text. */
  note: L<string>;
}

export interface SourceExcerpt {
  id: string;
  title: L<string>;
  repo: 'bitcoin/bitcoin';
  /** Git tag the excerpt was copied from, e.g. "v32.1" or "v0.1.5". */
  tag: string;
  /** Path inside the repository, e.g. "src/pow.cpp". */
  path: string;
  /** Line number of the first line of `code` in that file. */
  startLine: number;
  /** Verbatim source. Never edited, never reflowed. */
  code: string;
  annotations: SourceAnnotation[];
}

export interface SectionSources {
  id: SectionId;
  excerpts: SourceExcerpt[];
}

/* ----------------------------------------------------------------- glossary */

export type TermCategory =
  | 'crypto'
  | 'money'
  | 'chain'
  | 'network'
  | 'mining'
  | 'storage'
  | 'privacy'
  | 'math'
  | 'engineering';

export const TERM_CATEGORIES: readonly TermCategory[] = [
  'crypto',
  'money',
  'chain',
  'network',
  'mining',
  'storage',
  'privacy',
  'math',
  'engineering',
];

export interface TermDef {
  /** Lowercase, hyphenated. Also the file name of its visual, if it has one. */
  id: string;
  category: TermCategory;
  name: L<string>;
  /** Other names the reader may have met, e.g. the Taiwan or mainland rendering. */
  aka?: L<string>;
  /** One plain sentence anyone can follow. Rich text. */
  short: L<string>;
  /** One more exact line for developers. Rich text. */
  precise?: L<string>;
  /** Section numbers (0 to 12) where the term matters. */
  sections: number[];
  /** Ids of two to four neighbouring terms. */
  related: string[];
}
