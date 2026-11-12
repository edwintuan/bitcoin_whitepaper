// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import * as OpenCC from 'opencc-js';
import { describe, expect, it } from 'vitest';
import { buildTable } from '../../scripts/hans.mjs';
import { toHans, toHansDeep } from './hans';
import { HANS_TERMS } from './hans-table';

const SRC = `${join(process.cwd(), 'src')}/`;

describe('toHans', () => {
  it('writes Traditional characters in their Simplified form', () => {
    expect(toHans('比特幣：一種點對點的電子現金系統')).toBe('比特币：一种点对点的电子现金系统');
  });

  it('uses the mainland word where the two differ, not only its characters', () => {
    expect(toHans('區塊頭有六個欄位，合共 80 位元組')).toBe('区块头有六个字段，合共 80 字节');
    expect(toHans('開頭要有 18 個零位元')).toBe('开头要有 18 个零位');
    expect(toHans('數碼簽署')).toBe('数字签名');
    expect(toHans('訊息在記憶池裏等候')).toBe('消息在内存池里等候');
  });

  it('turns corner brackets into curly quotes', () => {
    expect(toHans('按「挖礦」')).toBe('按“挖矿”');
  });

  it('leaves everything that is not Chinese as it is', () => {
    expect(toHans('SHA-256 → 0x1d00ffff [[nonce|隨機數]] {n}')).toBe('SHA-256 → 0x1d00ffff [[nonce|随机数]] {n}');
  });
});

describe('toHansDeep', () => {
  it('converts every string inside lists and records, and gives the same result object each time', () => {
    const steps = [{ title: '廣播', body: ['節點', 3] }];
    const out = toHansDeep(steps);
    expect(out).toEqual([{ title: '广播', body: ['节点', 3] }]);
    expect(toHansDeep(steps)).toBe(out);
  });
});

function* sourceFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      if (entry.name !== '__fixtures__' && entry.name !== 'assets') yield* sourceFiles(path);
    } else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) && !['zhChecks.ts', 'hans-table.ts'].includes(entry.name)) {
      yield path;
    }
  }
}

describe('the conversion table', () => {
  it('is the one scripts/hans.mjs writes for the copy as it stands (npm run hans)', () => {
    expect(readFileSync(`${SRC}i18n/hans-table.ts`, 'utf8')).toBe(buildTable());
  });

  // The table maps one character at a time. A full dictionary also knows words
  // whose characters convert differently together (回覆 → 回复); every such word
  // in the copy has to be in the list of terms.
  it('agrees with a full dictionary on every run of Chinese in the copy', () => {
    const full = OpenCC.Converter({ from: 'hk', to: 'cn' });
    const disagreements: string[] = [];
    for (const file of sourceFiles(SRC.replace(/\/$/, ''))) {
      for (const run of new Set(readFileSync(file, 'utf8').match(/[㐀-鿿]+/g) ?? [])) {
        const ours = toHans(run);
        // Where a term rewrote the run the two differ on purpose; compare the rest.
        if (!HANS_TERMS.some(([term]) => run.includes(term)) && ours !== full(run)) {
          disagreements.push(`${run} → ${ours}, dictionary: ${full(run)}`);
        }
      }
    }
    expect(disagreements).toEqual([]);
  });

  it('leaves no Traditional-only character in any run of the copy', () => {
    const full = OpenCC.Converter({ from: 'hk', to: 'cn' });
    const left = new Set<string>();
    for (const file of sourceFiles(SRC.replace(/\/$/, ''))) {
      for (const run of readFileSync(file, 'utf8').match(/[㐀-鿿]+/g) ?? []) {
        for (const char of toHans(run)) if (full(char) !== char) left.add(char);
      }
    }
    expect([...left]).toEqual([]);
  });
});
