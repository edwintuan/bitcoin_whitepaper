import { describe, expect, it } from 'vitest';
import { TERM_CATEGORIES } from '@/content/types';
import type { Lang, TermCategory, TermDef } from '@/content/types';
import { findZhProblems } from '@/content/zhChecks';
import { TERM_IDS, TERMS, TERMS_WITH_VISUALS } from './terms';

/* The glossary as specified: nine categories, 94 terms, in the order the index shows them. */
const SPEC: Record<TermCategory, readonly string[]> = {
  crypto: [
    'hash', 'sha-256', 'double-sha256', 'digital-signature', 'public-key', 'private-key',
    'key-pair', 'ecdsa', 'address', 'hash160',
  ],
  money: [
    'electronic-coin', 'transaction', 'input', 'output', 'utxo', 'change', 'fee', 'coinbase',
    'satoshi-unit', 'double-spending', 'trusted-third-party', 'mint', 'script', 'txid', 'psbt',
    'coin-selection', 'irreversibility', 'escrow',
  ],
  chain: [
    'block', 'block-header', 'block-height', 'genesis-block', 'blockchain', 'timestamp',
    'timestamp-server', 'proof-of-work', 'nonce', 'hashcash', 'difficulty', 'target', 'bits',
    'zero-bits', 'retarget', 'hash-rate', 'longest-chain', 'chainwork', 'fork', 'stale-block',
    'reorg', 'confirmation', 'majority-attack',
  ],
  network: [
    'peer-to-peer', 'node', 'full-node', 'light-client', 'broadcast', 'mempool', 'inv', 'getdata',
    'version-handshake', 'best-effort', 'compact-blocks',
  ],
  mining: [
    'incentive', 'block-subsidy', 'halving', 'supply-cap', 'miner', 'mining', 'mining-pool',
    'asic', 'stratum', 'getblocktemplate',
  ],
  storage: [
    'merkle-tree', 'merkle-root', 'merkle-branch', 'pruning', 'spv', 'bloom-filter',
    'compact-block-filters',
  ],
  privacy: ['pseudonymity', 'address-reuse', 'common-input-heuristic', 'hd-wallet', 'seed-phrase'],
  math: ['poisson-distribution', 'binomial-random-walk', 'gamblers-ruin'],
  engineering: [
    'wallet', 'software-wallet', 'hardware-wallet', 'rpc', 'bitcoin-core', 'bitcoind',
    'bitcoin-cli',
  ],
};

const SPEC_IDS: readonly string[] = TERM_CATEGORIES.flatMap((category) => SPEC[category]);

/* The 29 terms whose card carries a live visual, in glossary order. */
const SPEC_VISUALS: readonly string[] = [
  'hash', 'digital-signature', 'key-pair', 'address',
  'transaction', 'utxo', 'change', 'fee', 'coinbase', 'double-spending',
  'block', 'block-header', 'timestamp-server', 'proof-of-work', 'nonce', 'difficulty',
  'longest-chain', 'fork', 'confirmation',
  'peer-to-peer', 'mempool',
  'halving', 'mining-pool',
  'merkle-tree', 'merkle-branch', 'spv',
  'hd-wallet',
  'poisson-distribution', 'gamblers-ruin',
];

const LANGS: readonly Lang[] = ['en', 'zh'];
const ALL: readonly TermDef[] = Object.values(TERMS);

/** `[[term-id]]` or `[[term-id|shown words]]`. */
const LINK = /\[\[([^\]|]*)(?:\|([^\]]*))?\]\]/g;

/** One reader-facing string and where it lives, for failure messages. */
interface Copy {
  at: string;
  lang: Lang;
  text: string;
}

/** `short` and `precise` are rich text: links and code marks are allowed. */
function richCopy(term: TermDef): Copy[] {
  return LANGS.flatMap((lang) => [
    { at: `${term.id} short.${lang}`, lang, text: term.short[lang] },
    ...(term.precise ? [{ at: `${term.id} precise.${lang}`, lang, text: term.precise[lang] }] : []),
  ]);
}

/** `name` and `aka` are plain text. */
function plainCopy(term: TermDef): Copy[] {
  return LANGS.flatMap((lang) => [
    { at: `${term.id} name.${lang}`, lang, text: term.name[lang] },
    ...(term.aka ? [{ at: `${term.id} aka.${lang}`, lang, text: term.aka[lang] }] : []),
  ]);
}

const RICH: readonly Copy[] = ALL.flatMap(richCopy);
const PLAIN: readonly Copy[] = ALL.flatMap(plainCopy);
const EVERY: readonly Copy[] = [...PLAIN, ...RICH];

function linkedIds(text: string): string[] {
  return [...text.matchAll(LINK)].map((match) => match[1]);
}

/** The string as the reader sees it: links become their shown words, code marks disappear. */
function shown({ text, lang }: Copy): string {
  return text
    .replace(
      LINK,
      (_match, id: string, label: string | undefined) => label ?? TERMS[id]?.name[lang] ?? id,
    )
    .replaceAll('`', '');
}

function isFilled(text: unknown): boolean {
  return typeof text === 'string' && text.length > 0 && text === text.trim();
}

/** Runs a check over every term and labels each problem with the term's id. */
function problemsPerTerm(check: (term: TermDef) => string[]): string[] {
  return ALL.flatMap((term) => check(term).map((problem) => `${term.id}: ${problem}`));
}

describe('glossary terms', () => {
  it('defines exactly the 94 terms of the spec', () => {
    expect(SPEC_IDS).toHaveLength(94);
    expect(new Set(SPEC_IDS).size).toBe(94);

    expect(Object.keys(TERMS)).toHaveLength(94);
    expect(Object.keys(TERMS).sort()).toEqual([...SPEC_IDS].sort());
  });

  it('lists TERM_IDS in category order, then listed order, with no duplicates', () => {
    expect(new Set(TERM_IDS).size).toBe(TERM_IDS.length);
    expect([...TERM_IDS]).toEqual(SPEC_IDS);
  });

  it('uses lowercase hyphenated ids, each equal to its key', () => {
    for (const [key, term] of Object.entries(TERMS)) {
      expect(key).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(term.id).toBe(key);
    }
  });

  it('files every term under its category', () => {
    for (const category of TERM_CATEGORIES) {
      const filed = TERM_IDS.filter((id) => TERMS[id]?.category === category);
      expect(filed, category).toEqual(SPEC[category]);
    }
  });

  it('gives every term a name and a short definition in both languages', () => {
    const problems = problemsPerTerm((term) =>
      LANGS.flatMap((lang) => [
        ...(isFilled(term.name[lang]) ? [] : [`name.${lang} is empty or padded`]),
        ...(isFilled(term.short[lang]) ? [] : [`short.${lang} is empty or padded`]),
      ]),
    );
    expect(problems).toEqual([]);
  });

  it('fills both languages wherever precise or aka is present', () => {
    const problems = problemsPerTerm((term) =>
      LANGS.flatMap((lang) => [
        ...(term.precise === undefined || isFilled(term.precise[lang])
          ? []
          : [`precise.${lang} is empty or padded`]),
        ...(term.aka === undefined || isFilled(term.aka[lang])
          ? []
          : [`aka.${lang} is empty or padded`]),
      ]),
    );
    expect(problems).toEqual([]);
  });

  it('places every term in at least one part of the paper, numbered 0 to 12', () => {
    const problems = problemsPerTerm(({ sections }) => {
      if (sections.length === 0) return ['sections is empty'];
      const found: string[] = [];
      if (!sections.every((n) => Number.isInteger(n) && n >= 0 && n <= 12)) {
        found.push(`sections outside 0 to 12: ${sections.join(', ')}`);
      }
      if (!sections.every((n, i) => i === 0 || n > sections[i - 1])) {
        found.push(`sections not ascending or repeated: ${sections.join(', ')}`);
      }
      return found;
    });
    expect(problems).toEqual([]);
  });

  it('relates every term to two to four other terms', () => {
    const problems = problemsPerTerm(({ id, related }) => {
      const found: string[] = [];
      if (related.length < 2 || related.length > 4) found.push(`${related.length} related terms`);
      if (new Set(related).size !== related.length) found.push('related repeats an id');
      for (const other of related) {
        if (other === id) found.push('related names the term itself');
        else if (!(other in TERMS)) found.push(`related names unknown id "${other}"`);
      }
      return found;
    });
    expect(problems).toEqual([]);
  });

  it('links only to other existing terms, at most twice per string', () => {
    const problems = RICH.flatMap(({ at, text }) => {
      const termId = at.split(' ')[0];
      const found: string[] = [];
      const matches = [...text.matchAll(LINK)];
      if (matches.length > 2) found.push(`${at}: ${matches.length} links`);
      for (const [whole, id, label] of matches) {
        if (id === termId) found.push(`${at}: links to itself`);
        else if (!(id in TERMS)) found.push(`${at}: links to unknown id "${id}"`);
        if (label !== undefined && !isFilled(label)) found.push(`${at}: empty label in ${whole}`);
      }
      if (/\[\[|\]\]/.test(text.replace(LINK, ''))) found.push(`${at}: malformed link`);
      return found;
    });
    expect(problems).toEqual([]);
  });

  it('marks exactly the 29 terms that have a visual', () => {
    expect(SPEC_VISUALS).toHaveLength(29);
    expect([...TERMS_WITH_VISUALS]).toEqual(SPEC_VISUALS);
  });

  it('leaves no card unreachable: each term is named by at least one other card', () => {
    const named = new Set<string>();
    for (const term of ALL) {
      for (const id of term.related) named.add(id);
      for (const { text } of richCopy(term)) for (const id of linkedIds(text)) named.add(id);
    }
    expect(SPEC_IDS.filter((id) => !named.has(id))).toEqual([]);
  });
});

describe('glossary copy', () => {
  it('passes the Hong Kong usage checks in Chinese names and definitions', () => {
    // `aka` is left out on purpose: it is where the Taiwan and mainland renderings are named.
    const problems = [...PLAIN, ...RICH]
      .filter(({ at, lang }) => lang === 'zh' && !at.includes(' aka.'))
      .flatMap(({ at, text }) => findZhProblems(text).map((problem) => `${at}: ${problem}`));
    expect(problems).toEqual([]);
  });

  it('keeps the English short definition to 32 words', () => {
    const problems = RICH.filter(({ at }) => at.endsWith(' short.en')).flatMap((copy) => {
      const words = shown(copy).split(/\s+/).filter(Boolean).length;
      return words > 32 ? [`${copy.at}: ${words} words`] : [];
    });
    expect(problems).toEqual([]);
  });

  it('keeps the Chinese short definition to about 45 characters', () => {
    // Each Han character and each Latin word or number counts once; 50 is the hard stop.
    const problems = RICH.filter(({ at }) => at.endsWith(' short.zh')).flatMap((copy) => {
      const length = (shown(copy).match(/[㐀-鿿]|[A-Za-z0-9][A-Za-z0-9.,/-]*/g) ?? [])
        .length;
      return length > 50 ? [`${copy.at}: ${length} characters`] : [];
    });
    expect(problems).toEqual([]);
  });

  it('follows the English style rules: no em dashes, filler or questions', () => {
    const rules: [problem: string, pattern: RegExp][] = [
      ['em dash', /—/],
      ['filler', /\b(?:essentially|simply|basically|in other words)\b/i],
      ['question', /\?/],
    ];
    const problems = EVERY.filter(({ lang }) => lang === 'en').flatMap(({ at, text }) =>
      rules.flatMap(([problem, pattern]) => (pattern.test(text) ? [`${at}: ${problem}`] : [])),
    );
    expect(problems).toEqual([]);
  });

  it('follows the Chinese typography rules: spacing, full-width punctuation, 「」', () => {
    const han = '\\u3400-\\u9fff';
    const rules: [problem: string, pattern: RegExp][] = [
      [
        'no space between Chinese and Latin text',
        new RegExp(`[${han}][A-Za-z0-9]|[A-Za-z0-9][${han}]`),
      ],
      [
        'half-width punctuation beside Chinese',
        new RegExp(`[${han}][,.;:?!()]|[,.;:?!()][${han}]`),
      ],
      ['space between Chinese characters', new RegExp(`[${han}]\\s+[${han}]`)],
      ['space beside full-width punctuation', /\s[，。、；：？！「」（）]|[，。、；：？！「」（）]\s/],
      ['quotation marks other than 「」', /["“”]/],
      ['question', /？/],
    ];
    const problems = EVERY.filter(({ lang }) => lang === 'zh').flatMap((copy) => {
      const text = shown(copy);
      return rules.flatMap(([problem, pattern]) => {
        const match = pattern.exec(text);
        return match ? [`${copy.at}: ${problem} at "${match[0]}"`] : [];
      });
    });
    expect(problems).toEqual([]);
  });

  it('uses no markup beyond term links and code marks', () => {
    const problems = [
      ...PLAIN.filter(({ text }) => /\[\[|\]\]|`|\*/.test(text)).map(
        ({ at }) => `${at}: markup in plain text`,
      ),
      ...RICH.flatMap(({ at, text }) => [
        ...(/\*|\{§|\]\(/.test(text) ? [`${at}: markup other than links and code`] : []),
        ...((text.match(/`/g) ?? []).length % 2 === 0 ? [] : [`${at}: unclosed code mark`]),
      ]),
    ];
    expect(problems).toEqual([]);
  });
});
