/**
 * Cross-checks over everything the page is assembled from: the thirteen
 * chapters, the paper's text, the source excerpts, the glossary, the journey
 * and the appendices. Each file is written on its own; this is where they are
 * held to each other.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TERMS, TERMS_WITH_VISUALS, TERM_IDS } from '@/glossary/terms';
import { parseRich, plainRich } from '@/text/richtext';
import { ACTORS } from './actors';
import { JOURNEY } from './journey';
import { PARTS, partOfSection } from './parts';
import { SECTIONS } from './sections';
import { SOURCES } from './sources';
import { SECTION_IDS } from './types';
import type { ActorId, Lang, PaperFigureId, SectionContent } from './types';
import { UI } from './ui';
import { WHITEPAPER } from './whitepaper';
import { findZhProblems } from './zhChecks';

/* -------------------------------------------------------------- collecting */

interface Leaf {
  /** Where the string lives, for the failure message. */
  at: string;
  lang: Lang;
  text: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** A value written once per language: an object holding `en` and `zh` and nothing else. */
const isPair = (value: unknown): value is { en: unknown; zh: unknown } =>
  isRecord(value) && Object.keys(value).sort().join() === 'en,zh';

/** The shape of one side of a pair: what the other side has to match. */
function shapeOf(value: unknown): string {
  if (typeof value === 'string') return 'text';
  if (Array.isArray(value)) return `[${value.map(shapeOf).join(',')}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${key}:${shapeOf(value[key])}`)
      .join(',')}}`;
  }
  return typeof value;
}

function stringsIn(value: unknown, at: string, lang: Lang, out: Leaf[]): void {
  if (typeof value === 'string') out.push({ at, lang, text: value });
  else if (Array.isArray(value)) value.forEach((item, i) => stringsIn(item, `${at}[${i}]`, lang, out));
  else if (isRecord(value)) for (const [key, item] of Object.entries(value)) stringsIn(item, `${at}.${key}`, lang, out);
}

interface Collected {
  leaves: Leaf[];
  /** Pairs whose two sides are not the same shape. */
  lopsided: string[];
  /** Every pair of strings, side by side. */
  pairs: { at: string; en: string; zh: string }[];
}

const none = (): Collected => ({ leaves: [], lopsided: [], pairs: [] });

/** Matching strings of the two sides of a pair, however deep they sit. */
function pairUp(en: unknown, zh: unknown, at: string, out: Collected['pairs']): void {
  if (typeof en === 'string' && typeof zh === 'string') out.push({ at, en, zh });
  else if (Array.isArray(en) && Array.isArray(zh)) en.forEach((item, i) => pairUp(item, zh[i], `${at}[${i}]`, out));
  else if (isRecord(en) && isRecord(zh)) for (const key of Object.keys(en)) pairUp(en[key], zh[key], `${at}.${key}`, out);
}

/** Every bilingual string under `value`, and every pair whose languages disagree in shape. */
function collect(value: unknown, at: string, into: Collected = none()): Collected {
  if (isPair(value)) {
    if (shapeOf(value.en) !== shapeOf(value.zh)) into.lopsided.push(at);
    else pairUp(value.en, value.zh, at, into.pairs);
    stringsIn(value.en, at, 'en', into.leaves);
    stringsIn(value.zh, at, 'zh', into.leaves);
  } else if (Array.isArray(value)) {
    value.forEach((item, i) => collect(item, `${at}[${i}]`, into));
  } else if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) collect(item, `${at}.${key}`, into);
  }
  return into;
}

const figureCopy = import.meta.glob<Record<string, unknown>>('../figures/*/copy.ts', { eager: true });

const sectionAt = (section: SectionContent) => `§${section.number}`;

/** Copy the reader meets in the article itself, where every keyword is a link. */
const article: Collected = none();
for (const section of SECTIONS) collect(section, sectionAt(section), article);
for (const [id, sources] of Object.entries(SOURCES)) collect(sources, `sources/${id}`, article);
collect(JOURNEY, 'journey', article);

/** Copy around the article: interface strings, appendices and the words inside figures. */
const chrome: Collected = none();
collect(UI, 'ui', chrome);
collect(ACTORS, 'actors', chrome);
collect(PARTS, 'parts', chrome);
for (const [file, module] of Object.entries(figureCopy)) collect(module, file.replace('../', ''), chrome);

const everything: Collected = {
  leaves: [...article.leaves, ...chrome.leaves],
  lopsided: [...article.lopsided, ...chrome.lopsided],
  pairs: [...article.pairs, ...chrome.pairs],
};

const zhName = (termId: string) => TERMS[termId]?.name.zh;
const enName = (termId: string) => TERMS[termId]?.name.en;

/** The text as the reader sees it, markup resolved. */
const shown = ({ lang, text }: Leaf) => plainRich(text, lang === 'zh' ? zhName : enName);

const report = (leaf: Leaf, problem: string) => `${leaf.at} (${leaf.lang}) ${problem}: ${leaf.text}`;

/* ---------------------------------------------------------------- chapters */

describe('the thirteen chapters', () => {
  it('are all present, numbered 0 to 12 in the order of the paper', () => {
    expect(SECTIONS.map((section) => section.id)).toEqual([...SECTION_IDS]);
    expect(SECTIONS.map((section) => section.number)).toEqual(SECTION_IDS.map((_, number) => number));
  });

  it('sit in the part that lists them', () => {
    for (const section of SECTIONS) {
      expect(section.part, sectionAt(section)).toBe(partOfSection(section.number).number);
    }
    expect(PARTS.flatMap((part) => part.sections)).toEqual(SECTION_IDS.map((_, number) => number));
  });

  it('carry the heading the paper gives them', () => {
    for (const section of SECTIONS) {
      expect(section.title, sectionAt(section)).toEqual(WHITEPAPER[section.id]?.heading);
    }
  });

  it('each have the paper’s text and at least one source excerpt', () => {
    for (const id of SECTION_IDS) {
      expect(WHITEPAPER[id], `whitepaper/${id}`).toBeDefined();
      expect(SOURCES[id]?.excerpts.length ?? 0, `sources/${id}`).toBeGreaterThan(0);
    }
    expect(Object.keys(WHITEPAPER).sort()).toEqual([...SECTION_IDS].sort());
    expect(Object.keys(SOURCES).sort()).toEqual([...SECTION_IDS].sort());
  });

  it('keep to the agreed sizes', () => {
    const words = (text: string) => plainRich(text, enName).split(/\s+/).filter(Boolean).length;
    for (const section of SECTIONS) {
      const at = sectionAt(section);
      expect(words(section.tldr.en), `${at} tldr words`).toBeLessThanOrEqual(45);
      expect(section.body.en.length, `${at} body paragraphs`).toBeGreaterThanOrEqual(3);
      expect(section.body.en.length, `${at} body paragraphs`).toBeLessThanOrEqual(6);
      expect(section.whoRuns.length, `${at} actors`).toBeGreaterThanOrEqual(2);
      expect(section.whoRuns.length, `${at} actors`).toBeLessThanOrEqual(4);
      expect(section.paperVsToday.en.length, `${at} paper vs today`).toBeGreaterThanOrEqual(3);
      expect(section.paperVsToday.en.length, `${at} paper vs today`).toBeLessThanOrEqual(6);
      if (section.figure) {
        expect(section.figure.steps.en.length, `${at} steps`).toBeGreaterThanOrEqual(3);
        expect(section.figure.steps.en.length, `${at} steps`).toBeLessThanOrEqual(6);
        for (const step of section.figure.steps.en) {
          expect(step.title.split(/\s+/).length, `${at} step title "${step.title}"`).toBeLessThanOrEqual(5);
        }
      }
    }
  });

  it('name each actor once per chapter', () => {
    for (const section of SECTIONS) {
      const actors = section.whoRuns.map((item) => item.actor);
      expect(new Set(actors).size, sectionAt(section)).toBe(actors.length);
    }
  });
});

/* ------------------------------------------------------------------- files */

describe('files found by name', () => {
  const figures = Object.keys(import.meta.glob(['../figures/*.tsx', '!**/*.test.tsx'])).map((file) => file.slice('../figures/'.length, -'.tsx'.length));
  const visuals = Object.keys(import.meta.glob(['../glossary/visuals/*.tsx', '!**/*.test.tsx'])).map((file) =>
    file.slice('../glossary/visuals/'.length, -'.tsx'.length),
  );
  const paperFigures = Object.keys(import.meta.glob(['../components/site/paper-figures/*.tsx', '!**/*.test.tsx'])).map((file) =>
    file.slice('../components/site/paper-figures/'.length, -'.tsx'.length),
  );

  it('give every chapter but the Abstract one figure, and every figure a chapter', () => {
    const used = SECTIONS.flatMap((section) => (section.figure ? [section.figure.component] : []));
    expect(SECTIONS.filter((section) => !section.figure).map((section) => section.id)).toEqual(['abstract']);
    expect([...used].sort()).toEqual([...figures].sort());
  });

  it('give a visual to exactly the terms marked as having one', () => {
    expect([...visuals].sort()).toEqual([...TERMS_WITH_VISUALS].sort());
  });

  it('redraw every diagram the paper prints', () => {
    const placed = Object.values(WHITEPAPER).flatMap((section) =>
      section.en.flatMap((block) => (block.type === 'figure' ? [block.id] : [])),
    );
    const expected: PaperFigureId[] = [
      'tx-chain',
      'timestamp-chain',
      'pow-blocks',
      'merkle-prune',
      'spv-chain',
      'combine-split',
      'privacy-models',
    ];
    expect(placed).toEqual(expected);
    expect(paperFigures.filter((name) => name !== 'kit').sort()).toEqual([...expected].sort());
  });
});

/* ------------------------------------------------------------- both languages */

describe('bilingual copy', () => {
  it('has the same shape in English and Chinese everywhere', () => {
    expect(everything.lopsided).toEqual([]);
  });

  it('leaves nothing empty', () => {
    const empty = everything.leaves.filter(
      // A few interface strings are deliberately empty in one language: a suffix English does not need.
      (leaf) => leaf.text.trim() === '' && !/Suffix$/.test(leaf.at),
    );
    expect(empty.map((leaf) => `${leaf.at} (${leaf.lang})`)).toEqual([]);
  });

  it('writes Chinese in Hong Kong usage', () => {
    const problems = everything.leaves
      .filter((leaf) => leaf.lang === 'zh')
      .flatMap((leaf) => findZhProblems(shown(leaf)).map((problem) => report(leaf, problem)));
    expect(problems).toEqual([]);
  });

  it('actually translates: Chinese copy contains Chinese', () => {
    const untranslated = article.leaves.filter(
      (leaf) => leaf.lang === 'zh' && shown(leaf).length > 12 && !/\p{Script=Han}/u.test(leaf.text),
    );
    expect(untranslated.map((leaf) => report(leaf, 'no Chinese'))).toEqual([]);
  });

  it('spaces and punctuates Chinese by the house rules', () => {
    const rules: [rule: string, breach: RegExp][] = [
      ['needs a space between Chinese and Latin letters or digits', /\p{Script=Han}[A-Za-z0-9]|[A-Za-z0-9]\p{Script=Han}/u],
      ['has a space beside full-width punctuation', /\s[，。、；：？！「」（）]|[，。、；：？！「」（）]\s/u],
      ['uses half-width punctuation next to Chinese', /\p{Script=Han}[,;:?!()]|[,;:?!(]\p{Script=Han}/u],
      ['uses Latin quotation marks', /\p{Script=Han}["“”‘’]|["“”‘’]\p{Script=Han}/u],
    ];
    // A placeholder is filled in later, with a name as often as with a number,
    // so it cannot be held to the spacing rule: it stands here as a word
    // joiner, which is neither a letter, a digit, a space nor punctuation.
    const settled = (leaf: Leaf) => shown(leaf).replace(/\{\w+\}/g, '\u2060');
    const breaches = everything.leaves
      .filter((leaf) => leaf.lang === 'zh')
      .flatMap((leaf) => rules.filter(([, breach]) => breach.test(settled(leaf))).map(([rule]) => report(leaf, rule)));
    expect(breaches).toEqual([]);
  });

  it('fills the same placeholders in both languages', () => {
    const names = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort().join();
    const uneven = everything.pairs.filter((pair) => names(pair.en) !== names(pair.zh));
    expect(uneven.map((pair) => `${pair.at}: {${names(pair.en)}} in English, {${names(pair.zh)}} in Chinese`)).toEqual([]);
  });

  it('keeps English plain: no em dashes, no filler', () => {
    const rules: [rule: string, breach: RegExp][] = [
      ['has an em dash', /—/],
      ['has filler', /\b(essentially|basically|simply|in essence|it is worth noting|needless to say)\b/i],
    ];
    const breaches = everything.leaves
      .filter((leaf) => leaf.lang === 'en')
      .flatMap((leaf) => rules.filter(([, breach]) => breach.test(shown(leaf))).map(([rule]) => report(leaf, rule)));
    expect(breaches).toEqual([]);
  });
});

/* ------------------------------------------------------------- interface */

describe('interface copy', () => {
  /** Every source file but tests and the file that defines the strings. */
  const sourceText = (() => {
    const root = join(process.cwd(), 'src');
    const files: string[] = [];
    const walk = (folder: string) => {
      for (const entry of readdirSync(folder, { withFileTypes: true })) {
        const path = join(folder, entry.name);
        if (entry.isDirectory()) walk(path);
        else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) && !path.endsWith(join('content', 'ui.ts'))) files.push(path);
      }
    };
    walk(root);
    return files.map((file) => readFileSync(file, 'utf8')).join('\n');
  })();

  it('is all in use: a string nobody shows is a string nobody keeps true', () => {
    const paths: string[][] = [];
    const walk = (value: unknown, path: string[]) => {
      if (isPair(value)) paths.push(path);
      else if (isRecord(value)) for (const [key, item] of Object.entries(value)) walk(item, [...path, key]);
    };
    walk(UI, []);
    const used = (path: string[]) =>
      // Read by name somewhere, or picked out of its group by a computed key (UI.depth[value]).
      new RegExp(`\\.${path[path.length - 1]}\\b`).test(sourceText) ||
      path.slice(0, -1).some((group) => new RegExp(`\\b${group}\\[`).test(sourceText));
    expect(paths.filter((path) => !used(path)).map((path) => `UI.${path.join('.')}`)).toEqual([]);
  });
});

/* ------------------------------------------------------------------ markup */

describe('rich text', () => {
  it('links only to terms the glossary defines', () => {
    const unknown = everything.leaves.flatMap((leaf) =>
      parseRich(leaf.text).flatMap((token) =>
        token.type === 'term' && !TERMS[token.id] ? [report(leaf, `unknown term "${token.id}"`)] : [],
      ),
    );
    expect(unknown).toEqual([]);
  });

  it('links only to places that exist on the page', () => {
    const places = new Set<string>([...SECTION_IDS, 'top', 'journey', 'engineering-map', 'glossary', 'references']);
    const lost = everything.leaves.flatMap((leaf) =>
      [...leaf.text.matchAll(/\]\(#([^)]+)\)/g)]
        .map((match) => match[1])
        .filter((id) => !places.has(id) && !(id.startsWith('term-') && TERM_IDS.includes(id.slice(5))))
        .map((id) => report(leaf, `links to #${id}, which is not on the page`)),
    );
    expect(lost).toEqual([]);
  });

  it('leaves no unparsed marker in the article', () => {
    const stray = article.leaves.filter((leaf) =>
      /\[\[|\]\]|\{§|`|\*/.test(
        parseRich(leaf.text)
          .filter((token) => token.type === 'text')
          .map((token) => token.text)
          .join(''),
      ),
    );
    expect(stray.map((leaf) => report(leaf, 'stray marker'))).toEqual([]);
  });

  it('does not leave an English word as the label of a term that has a Chinese name', () => {
    // Abbreviations such as ASIC or SPV are fine inside Chinese copy; an untranslated word is not.
    const untranslated = article.leaves
      .filter((leaf) => leaf.lang === 'zh')
      .flatMap((leaf) =>
        parseRich(leaf.text).flatMap((token) => {
          if (token.type !== 'term' || !token.label) return [];
          const hasChineseName = /\p{Script=Han}/u.test(zhName(token.id) ?? '');
          const labelIsEnglishWord = !/\p{Script=Han}/u.test(token.label) && /[a-z]{3}/.test(token.label);
          return hasChineseName && labelIsEnglishWord ? [report(leaf, `English label "${token.label}" for ${token.id}`)] : [];
        }),
      );
    expect(untranslated).toEqual([]);
  });

  it('reaches every glossary term from the article', () => {
    const linked = new Set(
      article.leaves.flatMap((leaf) => parseRich(leaf.text).flatMap((token) => (token.type === 'term' ? [token.id] : []))),
    );
    expect(TERM_IDS.filter((id) => !linked.has(id))).toEqual([]);
  });

  it('links a term from at least one of the sections it is filed under', () => {
    const linkedIn = new Map<number, Set<string>>();
    for (const section of SECTIONS) {
      const ids = new Set(
        [...collect(section, '').leaves, ...collect(SOURCES[section.id] ?? {}, '').leaves].flatMap((leaf) =>
          parseRich(leaf.text).flatMap((token) => (token.type === 'term' ? [token.id] : [])),
        ),
      );
      linkedIn.set(section.number, ids);
    }
    const adrift = TERM_IDS.filter((id) => !TERMS[id].sections.some((number) => linkedIn.get(number)?.has(id)));
    expect(adrift).toEqual([]);
  });
});

/* ----------------------------------------------------------------- journey */

describe('the journey and the engineering map', () => {
  it('points each stop at sections that exist', () => {
    for (const station of JOURNEY.list) {
      for (const number of station.sections) {
        expect(SECTIONS.some((section) => section.number === number), `${station.id} → §${number}`).toBe(true);
      }
    }
    expect(new Set(JOURNEY.list.map((station) => station.id)).size).toBe(JOURNEY.list.length);
  });

  it('gives every actor at least one chapter that names it', () => {
    const named = new Set(SECTIONS.flatMap((section) => section.whoRuns.map((item) => item.actor)));
    expect(Object.keys(ACTORS).filter((id) => !named.has(id as ActorId))).toEqual([]);
  });
});

/* ----------------------------------------------------------------- sources */

describe('source excerpts', () => {
  const excerpts = Object.values(SOURCES).flatMap((sources) => sources.excerpts.map((excerpt) => ({ section: sources.id, excerpt })));
  // Tests run from the project root.
  const reference = join(process.cwd(), 'reference');
  const lineCount = (code: string) => code.split('\n').length;

  it('have unique ids and come from a pinned tag', () => {
    const ids = excerpts.map(({ excerpt }) => excerpt.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const { excerpt } of excerpts) expect(['v32.1', 'v0.1.5'], excerpt.id).toContain(excerpt.tag);
  });

  it('stay short enough to read, and are annotated', () => {
    for (const { excerpt } of excerpts) {
      expect(lineCount(excerpt.code), excerpt.id).toBeLessThanOrEqual(60);
      expect(excerpt.annotations.length, excerpt.id).toBeGreaterThan(0);
      expect(excerpt.code, excerpt.id).not.toMatch(/^\n|\n$|\r|\t/);
    }
  });

  it('annotate only lines that are in the excerpt, in order', () => {
    for (const { excerpt } of excerpts) {
      const last = excerpt.startLine + lineCount(excerpt.code) - 1;
      let previous = 0;
      for (const { lines } of excerpt.annotations) {
        const [from, to] = lines;
        expect(from, `${excerpt.id} L${from}-${to}`).toBeGreaterThanOrEqual(excerpt.startLine);
        expect(to, `${excerpt.id} L${from}-${to}`).toBeLessThanOrEqual(last);
        expect(to, `${excerpt.id} L${from}-${to}`).toBeGreaterThanOrEqual(from);
        expect(from, `${excerpt.id} notes are in line order`).toBeGreaterThanOrEqual(previous);
        previous = from;
      }
    }
  });

  // The mirror is git-ignored; `npm run fetch-reference` restores it.
  it.skipIf(!existsSync(reference))('match the tagged file line for line', () => {
    for (const { excerpt } of excerpts) {
      const file = join(reference, excerpt.tag, excerpt.path);
      expect(existsSync(file), `${excerpt.id}: ${excerpt.tag}/${excerpt.path} is not mirrored`).toBe(true);
      const lines = readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');
      const expected = lines.slice(excerpt.startLine - 1, excerpt.startLine - 1 + lineCount(excerpt.code)).join('\n');
      expect(excerpt.code, `${excerpt.id}: ${excerpt.tag}/${excerpt.path} from line ${excerpt.startLine}`).toBe(expected);
    }
  });
});
