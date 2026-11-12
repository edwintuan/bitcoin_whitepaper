/**
 * The paper as data: thirteen section files, each with the English exactly as
 * printed and a Traditional Chinese translation that mirrors it block for block.
 *
 * The English is checked against `__fixtures__/bitcoin.pdf.txt`, the plain text
 * of bitcoin.org/bitcoin.pdf. That extraction is good for prose and poor for the
 * rest: it scatters the diagram labels, garbles the four formulas, reads two of
 * the result listings column by column, drops the hyphen wherever the PDF breaks
 * a hyphenated word across lines, and marks each page break with a form feed.
 * The fixture helpers below deal with those quirks and nothing else.
 */
import { describe, expect, it } from 'vitest';
import { REFERENCES, WHITEPAPER_META } from '../references';
import type { OriginalBlock, PaperFigureId, SectionId, WhitepaperSection } from '../types';
import { findZhProblems } from '../zhChecks';
import fixture from './__fixtures__/bitcoin.pdf.txt?raw';

/* ------------------------------------------------------------- expectations */

/** The paper's thirteen parts in order: id, headings, and the blocks each is set in on the page. */
const PAPER: { id: SectionId; en: string; zh: string; layout: string }[] = [
  { id: 'abstract', en: 'Abstract', zh: '摘要', layout: 'p' },
  { id: 'introduction', en: 'Introduction', zh: '引言', layout: 'p p' },
  { id: 'transactions', en: 'Transactions', zh: '交易', layout: 'p figure p p' },
  { id: 'timestamp-server', en: 'Timestamp Server', zh: '時間戳伺服器', layout: 'p figure' },
  { id: 'proof-of-work', en: 'Proof-of-Work', zh: '工作量證明', layout: 'p p figure p p' },
  { id: 'network', en: 'Network', zh: '網絡', layout: 'p list p p' },
  { id: 'incentive', en: 'Incentive', zh: '激勵', layout: 'p p p' },
  { id: 'reclaiming-disk-space', en: 'Reclaiming Disk Space', zh: '回收磁碟空間', layout: 'p figure p' },
  { id: 'spv', en: 'Simplified Payment Verification', zh: '簡易支付驗證', layout: 'p figure p' },
  { id: 'combining-splitting-value', en: 'Combining and Splitting Value', zh: '價值的合併與分割', layout: 'p figure p' },
  { id: 'privacy', en: 'Privacy', zh: '私隱', layout: 'p figure p' },
  {
    id: 'calculations',
    en: 'Calculations',
    zh: '計算',
    layout: 'p p p list math p p p p math p math p math p code p code code p code',
  },
  { id: 'conclusion', en: 'Conclusion', zh: '結論', layout: 'p' },
];

/** The seven diagrams: where each sits, and the words that end the paragraph it follows on the page. */
const FIGURES: [id: PaperFigureId, section: SectionId, follows: string][] = [
  ['tx-chain', 'transactions', 'to verify the chain of ownership.'],
  ['timestamp-chain', 'timestamp-server', 'reinforcing the ones before it.'],
  ['pow-blocks', 'proof-of-work', 'redoing all the blocks after it.'],
  ['merkle-prune', 'reclaiming-disk-space', 'do not need to be stored.'],
  ['spv-chain', 'spv', 'confirm the network has accepted it.'],
  ['combine-split', 'combining-splitting-value', 'back to the sender.'],
  ['privacy-models', 'privacy', 'telling who the parties were.'],
];

/**
 * The four displayed formulas of section 11, read off the PDF page: the symbols
 * in reading order (invisible operators and spacing aside) and the layout
 * elements each needs. Sub- and superscripts, fractions and limits read inline
 * here, so "qz" is q with subscript z and "λke−λk!" is λ^k e^−λ over k!.
 */
const FORMULAS: [reads: string, needs: string[]][] = [
  ['qz={1ifp≤q(q/p)zifp>q}', ['msub', 'msup', 'mtable']],
  ['λ=zqp', ['mfrac']],
  ['∑k=0∞λke−λk!·{(q/p)(z−k)ifk≤z1ifk>z}', ['munderover', 'mfrac', 'msup', 'mtable']],
  ['1−∑k=0zλke−λk!(1−(q/p)(z−k))', ['munderover', 'mfrac', 'msup']],
];

/**
 * Fixture fragments long enough to be checked for completeness that are not text
 * of any section. Diagram labels, broken formula lines and page numbers never
 * get here: the sentence splitter leaves them as short scraps.
 */
const EXTRACTION_NOISE = [
  // The title block, which the extraction runs together: title, author, e-mail, site.
  // Title and author are held in WHITEPAPER_META and checked there; the contact lines are not content.
  'Bitcoin: A Peer-to-Peer Electronic Cash System Satoshi Nakamoto satoshin@gmx.com www.bitcoin.org',
];

/**
 * The binding vocabulary. Where an English paragraph or list item uses the term,
 * the Chinese one in the same position must use our rendering of it.
 */
const VOCABULARY: [en: RegExp, zh: string][] = [
  [/\bhash/i, '哈希'],
  [/\bdigital(ly)? sign/i, '數碼簽署'],
  [/\bpublic keys?\b/i, '公鑰'],
  [/\bprivate keys?\b/i, '私鑰'],
  [/\bkey pair/i, '密鑰對'],
  [/\btransact/i, '交易'],
  [/\bdouble[- ]spen/i, '雙重支付'],
  [/\btrusted third part/i, '可信第三方'],
  [/\bmint\b/i, '鑄幣廠'],
  [/\btimestamp server/i, '時間戳伺服器'],
  [/\btimestamp/i, '時間戳'],
  [/\bproof-of-work\b/i, '工作量證明'],
  [/\bnonce\b/i, '隨機數'],
  [/\bblock headers?\b/i, '區塊頭'],
  [/\bblocks?\b/i, '區塊'],
  [/\bnodes?\b/i, '節點'],
  [/\bnetwork\b/i, '網絡'],
  [/\bpeer-to-peer\b/i, '點對點'],
  [/\bbroadcast/i, '廣播'],
  [/\bCPU power\b/, 'CPU 算力'],
  [/\bdifficulty\b/i, '難度'],
  [/\blongest chain\b/i, '最長鏈'],
  [/\bincentives?\b/i, '激勵'],
  [/\btransaction fees?\b/i, '交易手續費'],
  [/\bMerkle Tree\b/i, '默克爾樹'],
  [/\bonly the root\b/i, '默克爾根'],
  [/\bMerkle branch\b/i, '默克爾分支'],
  [/\bdisk space\b/i, '磁碟空間'],
  [/\binputs?\b/i, '輸入'],
  [/\boutputs?\b/i, '輸出'],
  [/\bthe change, if any\b/i, '找續'],
  [/\bprivacy\b/i, '私隱'],
  [/\bprobability\b/i, '概率'],
  [/\bPoisson distribution\b/, '泊松分佈'],
  [/\bPoisson\b/, '泊松'],
  [/\bBinomial Random Walk\b/, '二項隨機漫步'],
  [/\bGambler's Ruin\b/, '賭徒破產問題'],
  [/\bInternet\b/, '互聯網'],
  [/\bonline payments\b/, '網上付款'],
  [/\bfinancial institutions?\b/, '金融機構'],
  [/\belectronic cash\b/, '電子現金'],
  [/\belectronic coin\b/, '電子貨幣'],
  [/\bpayee\b/, '收款人'],
  [/\bowners?\b/, '擁有者'],
  [/\bmerchants?\b/i, '商戶'],
  [/fraud/i, '欺詐'],
  [/\bescrow\b/, '託管'],
  [/\bmediat/, '調解'],
  [/\bsoftware\b/, '軟件'],
  [/\bstorage\b/, '儲存'],
  [/\bmemory\b/, '記憶體'],
  [/\binflation\b/, '通脹'],
  [/\battackers?\b/i, '攻擊者'],
  [/honest/i, '誠實'],
];

/**
 * Renderings close to ours that `findZhProblems` does not know. The table above
 * only asks that our term is present, so one of these could hide behind a
 * correct use in the same paragraph: 簽署 not 簽名, 哈希 not 散列, 雙重支付 not
 * 雙花, 交易手續費 not 交易費, 找續 not 找贖, 概率 not 機會率.
 */
const NEAR_MISSES = /簽名|簽章|散列|雙花|雙重花費|交易費|礦工費|找贖|機會率|或然率|時間戳記|工作證明/;

/** Punctuation and spacing rules for the Chinese, each with the pattern that breaks it. */
const ZH_STYLE: [rule: string, breach: RegExp][] = [
  [
    'a space between Chinese and Latin letters, digits or symbols',
    /\p{Script=Han}[A-Za-z0-9+\-=<>*%\[]|[A-Za-z0-9+\-=<>*%\]]\p{Script=Han}/u,
  ],
  ['no space beside full-width punctuation', /\s[，。、；：？！「」（）…—]|[，。、；：？！「」（）…—]\s/u],
  ['full-width punctuation and 「」, never half-width marks or Latin quotes', /[,;:?!()"'‘’“”]|\.\.\.|\p{Script=Han}\./u],
  ['single spaces only, none at either end', /^\s|\s$|\s\s|[^\S ]/u],
];

/* ------------------------------------------------------------------ loading */

const modules = import.meta.glob<{ default: WhitepaperSection }>('./[0-9][0-9]-*.ts', { eager: true });
const files = Object.keys(modules).sort();
const sections = files.map((file) => modules[file].default);

function section(id: SectionId): WhitepaperSection {
  const found = sections.find((s) => s.id === id);
  if (!found) throw new Error(`no section file exports the id "${id}"`);
  return found;
}

/** Paragraphs and list items, in reading order. */
const prose = (blocks: OriginalBlock[]): string[] =>
  blocks.flatMap((b) => (b.type === 'p' ? [b.text] : b.type === 'list' ? b.items : []));

const codes = (blocks: OriginalBlock[]): string[] => blocks.flatMap((b) => (b.type === 'code' ? [b.code] : []));

/** English and Chinese paragraphs and list items, paired by position. */
function pairs(id: SectionId): [en: string, zh: string][] {
  const { en, zh } = section(id);
  const translated = prose(zh);
  return prose(en).map((text, i) => [text, translated[i] ?? '']);
}

/** Everything about a block that the translation has to reproduce unchanged. */
function shape(b: OriginalBlock): string {
  const captioned = 'caption' in b && b.caption !== undefined ? ' +caption' : '';
  switch (b.type) {
    case 'p':
      return 'p';
    case 'list':
      return `list ${b.ordered ? 'ordered' : 'unordered'} ${b.items.length}`;
    case 'figure':
      return `figure ${b.id}${captioned}`;
    case 'math':
      return `math ${b.mathml}`;
    case 'code':
      return `code ${b.code}`;
    case 'table':
      return `table ${b.rows.map((row) => row.length).join(',')}${captioned}`;
  }
}

/** How a paragraph ends, in either language. */
const ending = (text: string) =>
  /(\.\.\.|……)$/.test(text) ? 'ellipsis' : /[:：]$/.test(text) ? 'colon' : /[.。]$/.test(text) ? 'full stop' : 'open';

const sentencesEn = (text: string) => text.split(/(?<=[.!?])\s+/);
const sentencesZh = (text: string) => text.split(/(?<=[。？！])(?=.)/su);

/* ------------------------------------------------------------------ fixture */

/**
 * Comparison form: case, white space, hyphens (soft ones and dashes too), quote
 * style and ligatures set aside. NFKC is what opens the ligatures.
 */
const norm = (s: string) =>
  s
    .normalize('NFKC')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .toLowerCase()
    .replace(/[\s\xAD\p{Dash_Punctuation}]/gu, '');

/** Strict form: only line breaks and spacing set aside. */
const squash = (s: string) => s.replace(/\s+/g, '');

const lenientFixture = norm(fixture);

/** The extraction marks each page break with a form feed; for line work that is one more line break. */
const fixtureLines = fixture.replace(/\f/g, '\n').split('\n');

/**
 * The fixture as printed. Where the PDF breaks a hyphenated word across two
 * lines the extraction lost the hyphen: "non-/reversible" on page 1 and
 * "proof-/of-work" twice on page 3. This puts the three back.
 */
const printedFixture = squash(
  fixture.replace('nonreversible', 'non-reversible').replaceAll('proofof-work', 'proof-of-work'),
);

/**
 * A listing re-read the way the extraction read the two "z, P" tables: where
 * rows hold several columns, all of the first column and then all of the second.
 */
function byColumn(code: string): string {
  const out: string[] = [];
  let rows: string[][] = [];
  const flush = () => {
    const width = Math.max(0, ...rows.map((row) => row.length));
    for (let c = 0; c < width; c++) out.push(...rows.map((row) => row[c] ?? ''));
    rows = [];
  };
  for (const line of code.split('\n')) {
    const cells = line.trim().split(/ {2,}/);
    if (cells.length > 1) rows.push(cells);
    else {
      flush();
      out.push(line);
    }
  }
  flush();
  return out.join('\n');
}

/**
 * The fixture cut into sentences. Blank lines separate chunks; inside a chunk a
 * sentence ends at . ! or ? before white space, or at a colon that ends a line.
 * Sections 10 to 12 have their heading on the line above the first paragraph;
 * those three lines go first, since headings are checked on their own.
 */
const headingLines = new Set(PAPER.map(({ en }, number) => `${number}. ${en}`));
const paperSentences = fixtureLines
  .filter((line) => !headingLines.has(line))
  .join('\n')
  .split(/\n\s*\n/)
  .flatMap((chunk) => chunk.split(/(?<=[.!?])\s+|(?<=:)\n/))
  .map((s) => s.replace(/\s+/g, ' ').trim())
  .filter(Boolean);
const knownSentences = new Set(paperSentences.map(norm));

/** Prose reads as a sentence; a diagram label or a formula scrap does not. */
const readsAsSentence = (s: string) => s.length > 20 && /^[A-Z]/.test(s) && /[.!?:]$/.test(s);

/* -------------------------------------------------------------------- tests */

describe('the whitepaper sections', () => {
  it('are thirteen files, numbered 0 to 12 without gaps, in the order of the paper', () => {
    expect(files).toEqual(PAPER.map(({ id }, number) => `./${String(number).padStart(2, '0')}-${id}.ts`));
    expect(sections.map((s) => s.number)).toEqual(PAPER.map((_, number) => number));
    expect(sections.map((s) => s.id)).toEqual(PAPER.map(({ id }) => id));
  });

  it('carry the agreed heading in both languages', () => {
    expect(sections.map((s) => s.heading)).toEqual(PAPER.map(({ en, zh }) => ({ en, zh })));
    for (const { heading } of sections) {
      expect(heading.en.trim()).not.toBe('');
      expect(heading.zh.trim()).not.toBe('');
    }
  });

  it('take each English heading from the paper', () => {
    const lines = new Set(fixtureLines);
    expect(fixture).toContain(`\n${PAPER[0].en}. `);
    for (const [number, { en }] of [...PAPER.entries()].slice(1)) {
      expect(lines.has(en) || lines.has(`${number}. ${en}`), en).toBe(true);
    }
  });

  it('place each of the seven diagrams once, where the paper has it', () => {
    const placed = sections.flatMap((s) =>
      s.en.flatMap((block, i) => (block.type === 'figure' ? [{ id: block.id, section: s.id, after: s.en[i - 1] }] : [])),
    );
    expect(placed.map(({ id, section: where }) => [id, where])).toEqual(FIGURES.map(([id, where]) => [id, where]));
    for (const [i, [id, , follows]] of FIGURES.entries()) {
      const before = placed[i].after;
      expect(before?.type === 'p' && before.text.endsWith(follows), `${id} follows "… ${follows}"`).toBe(true);
    }
  });

  it('give the six network steps of section 5 as an ordered list', () => {
    const lists = section('network').en.flatMap((b) => (b.type === 'list' ? [b] : []));
    expect(lists).toHaveLength(1);
    expect(lists[0].ordered).toBe(true);
    expect(lists[0].items).toHaveLength(6);
  });

  it('leave out nothing the paper says', () => {
    // Held to account: every fixture fragment over 60 characters, and every shorter one that reads as a sentence.
    const content = norm(
      [
        ...sections.flatMap((s) => s.en.flatMap((b) => (b.type === 'code' ? [b.code, byColumn(b.code)] : prose([b])))),
        ...REFERENCES.map((r) => `[${r.n}] ${r.text}`),
      ].join('\n'),
    );
    const missing = paperSentences
      .filter((s) => s.length > 60 || readsAsSentence(s))
      .filter((s) => !EXTRACTION_NOISE.includes(s) && !content.includes(norm(s)));
    expect(missing).toEqual([]);
  });

  it('allow-list only fragments the fixture really has', () => {
    for (const noise of EXTRACTION_NOISE) expect(paperSentences).toContain(noise);
  });

  it('gloss nonce once per section: 隨機數（nonce）on first use, 隨機數 after', () => {
    expect(prose(section('proof-of-work').zh).join('')).toContain('隨機數（nonce）');
    for (const s of sections) {
      const text = prose(s.zh).join('');
      if (!text.includes('隨機數')) continue;
      expect(text.indexOf('隨機數（nonce）'), s.id).toBe(text.indexOf('隨機數'));
      expect(text.split('（nonce）'), s.id).toHaveLength(2);
    }
  });
});

describe.each(PAPER)('$id', ({ id, layout }) => {
  it('is set in the same blocks as the paper', () => {
    expect(
      section(id)
        .en.map((b) => b.type)
        .join(' '),
    ).toBe(layout);
  });

  it('has a Chinese text that mirrors the English block for block', () => {
    const { en, zh } = section(id);
    expect(zh.map(shape)).toEqual(en.map(shape));
  });

  it('takes every English paragraph, list item and code line from the paper', () => {
    const { en } = section(id);
    for (const text of prose(en)) expect(lenientFixture, text).toContain(norm(text));
    for (const code of codes(en)) {
      for (const line of code.split('\n')) {
        for (const cell of line.trim().split(/ {2,}/)) expect(lenientFixture, line).toContain(norm(cell));
      }
      // The whole listing, in order, read by rows or (the two P tables) by columns.
      expect([code, byColumn(code)].some((reading) => lenientFixture.includes(norm(reading))), code).toBe(true);
    }
  });

  it('is the paper character for character, line breaks aside', () => {
    const { en } = section(id);
    for (const text of prose(en)) expect(printedFixture, text).toContain(squash(text));
    for (const code of codes(en)) {
      expect([code, byColumn(code)].some((reading) => printedFixture.includes(squash(reading))), code).toBe(true);
    }
  });

  it('sets each English paragraph as one line of whole sentences, free of labels and formula debris', () => {
    const { en } = section(id);
    for (const text of prose(en)) {
      expect(text, 'single spaces, no line breaks').not.toMatch(/^\s|\s$|\s\s|[^\S ]/);
      expect(text, "plain ASCII, as the paper's prose is").toMatch(/^[\x20-\x7E]+$/);
    }
    for (const block of en) {
      if (block.type !== 'p') continue;
      expect(block.text).toMatch(/^[A-Z]/);
      expect(ending(block.text), block.text).not.toBe('open');
      for (const sentence of sentencesEn(block.text)) expect(knownSentences.has(norm(sentence)), sentence).toBe(true);
    }
  });

  it('translates every paragraph and list item into clean Traditional Chinese', () => {
    for (const [, zh] of pairs(id)) {
      expect(zh.trim()).not.toBe('');
      expect(zh).toMatch(/\p{Script=Han}/u);
      expect(findZhProblems(zh), zh).toEqual([]);
    }
  });

  it('punctuates and spaces the Chinese by the house rules', () => {
    for (const [, zh] of pairs(id)) {
      for (const [rule, breach] of ZH_STYLE) expect(zh, rule).not.toMatch(breach);
    }
  });

  it('keeps the Chinese sentence for sentence with the English', () => {
    for (const [en, zh] of pairs(id)) {
      expect(ending(zh), zh).toBe(ending(en));
      expect(sentencesZh(zh), zh).toHaveLength(sentencesEn(en).length);
    }
  });

  it('uses the binding vocabulary', () => {
    for (const [en, zh] of pairs(id)) {
      expect(zh).not.toMatch(NEAR_MISSES);
      for (const [term, rendering] of VOCABULARY) {
        if (term.test(en)) expect(zh, `${rendering} for ${term} in: ${en}`).toContain(rendering);
      }
    }
  });
});

describe('section 11, calculations', () => {
  it('defines p, q and qz in an unordered list of three', () => {
    const lists = section('calculations').en.flatMap((b) => (b.type === 'list' ? [b] : []));
    expect(lists).toHaveLength(1);
    expect(lists[0].ordered).toBe(false);
    expect(lists[0].items.map((item) => item.split(' = ')[0])).toEqual(['p', 'q', 'qz']);
  });

  it('writes the four displayed formulas as Presentation MathML, as the paper prints them', () => {
    const formulas = section('calculations').en.flatMap((b) => (b.type === 'math' ? [b.mathml] : []));
    expect(formulas).toHaveLength(FORMULAS.length);
    for (const [i, [reads, needs]] of FORMULAS.entries()) {
      const mathml = formulas[i];
      expect(mathml.startsWith('<math display="block">'), mathml).toBe(true);
      const doc = new DOMParser().parseFromString(mathml, 'application/xml');
      expect(doc.getElementsByTagName('parsererror'), mathml).toHaveLength(0);
      expect(doc.documentElement.tagName).toBe('math');
      expect(doc.documentElement.textContent?.replace(/[\s\p{Format}]/gu, '')).toBe(reads);
      for (const element of needs) expect(doc.getElementsByTagName(element).length, `${reads}: ${element}`).toBeGreaterThan(0);
    }
  });

  it('keeps the C function and the three result listings with their line breaks and indentation', () => {
    const listings = codes(section('calculations').en);
    expect(listings).toHaveLength(4);
    const [fn, slow, fast, solved] = listings.map((code) => code.split('\n'));

    expect(fn.join('\n')).toContain('AttackerSuccessProbability');
    expect(fn.map((line) => line.search(/\S/))).toEqual([0, 0, 0, 4, 4, 4, 4, 4, 4, 8, 8, 12, 8, 4, 4, 0]);

    expect(slow[0]).toBe('q=0.1');
    expect(fast[0]).toBe('q=0.3');
    expect(solved[0]).toBe('P < 0.001');
    // The second column starts where it does in the PDF.
    expect(slow.slice(1).map((line) => line.indexOf('P='))).toEqual(Array(11).fill(7));
    expect(fast.slice(1).map((line) => line.indexOf('P='))).toEqual(Array(11).fill(7));
    expect(solved.slice(1).map((line) => line.indexOf('z='))).toEqual(Array(8).fill(9));
  });
});

describe('references and metadata', () => {
  it("lists the paper's eight references, numbered 1 to 8", () => {
    expect(REFERENCES.map((r) => r.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('takes each reference from the paper', () => {
    for (const { n, text } of REFERENCES) {
      expect(lenientFixture, text).toContain(norm(`[${n}] ${text}`));
      expect(printedFixture, text).toContain(squash(`[${n}] ${text}`));
    }
  });

  it('names the paper as printed and points at the file it was taken from', () => {
    const [title, author] = fixtureLines;
    expect(WHITEPAPER_META).toEqual({
      title,
      author,
      url: 'https://bitcoin.org/bitcoin.pdf',
      sha256: 'b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553',
    });
  });
});

describe('the fixture helpers', () => {
  it('know the three places where the extraction lost a line-break hyphen', () => {
    expect(fixture.match(/nonreversible/g)).toHaveLength(1);
    expect(fixture.match(/proofof-work/g)).toHaveLength(2);
  });

  it('re-read a two-column listing by columns and leave one-column lines alone', () => {
    expect(byColumn('q=0.1\nz=0    P=1.0\nz=1    P=0.2')).toBe('q=0.1\nz=0\nz=1\nP=1.0\nP=0.2');
    expect(byColumn('{\n    return sum;\n}')).toBe('{\n    return sum;\n}');
  });
});
