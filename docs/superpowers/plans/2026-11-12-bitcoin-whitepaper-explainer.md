# Bitcoin 白皮书可视化教程 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 按 `docs/superpowers/specs/2026-11-12-bitcoin-whitepaper-explainer-design.md` 建成一个单页、双语（英文 + 香港用语繁中）、C1 海报风格的比特币白皮书可视化教程。

**架构：** 纯静态 React 单页应用。计算全部在 `src/lib` 的纯 TypeScript 引擎里，先写测试；界面由「站点部件 + 每章一个懒加载的交互图」组成；内容是成对的 `{ en, zh }` 结构化数据，通过 `import.meta.glob` 自动汇集，章节之间没有共享的索引文件。

**技术栈：** React 19、TypeScript、Vite、Tailwind CSS v4、BoardUI（React Aria）、@noble/hashes、@noble/curves、@scure/base、Vitest、Testing Library、@fontsource 字体。

---

## 关于本计划的粒度

规格覆盖 13 个交互图与全站双语内容。为避免把同一份代码先写进计划再写进文件：

- **引擎任务（阶段 1）** 给出完整的失败测试代码与标准答案，严格按「写测试 → 看它失败 → 实现 → 看它通过 → commit」执行。
- **界面与内容任务** 给出确切文件、TypeScript 接口契约、行为清单与验收检查；执行者是带完整会话上下文的主代理或其 fork，视觉以规格 §9、§10 与 `.superpowers/brainstorm/*/visual-direction-v2.html` 中的 `.mkP` 为准，结构以样板章（任务 20）为准。
- 规格按子系统拆成六个阶段，每个阶段结束时都有可运行、可验证的产物。

## 约定

- 包管理器 npm。常用命令：`npm run dev`、`npm test`（`vitest run`）、`npm run typecheck`（`tsc -b --noEmit`）、`npm run build`。
- 分支 `feat/whitepaper-explainer`。每个任务至少一次 commit，信息用 Conventional Commits，结尾附会话要求的署名行。
- TDD 循环适用于 `src/lib/**` 与解析器；每个测试文件与被测文件同目录，命名 `*.test.ts(x)`。
- 运行 BoardUI CLI 时一律带 `BOARDUI_TELEMETRY_DISABLED=1 DO_NOT_TRACK=1`。
- 并行阶段的所有权规则：fork 只能创建或修改分配给自己的文件；不得改 `src/lib`、`src/components/site`、`src/components/viz`、`src/styles`、`src/glossary/terms.ts`、`package.json`。需要改动共享文件时在汇报里提出，由主代理处理。
- 文案规则：繁中遵守规格 §8 的术语表；不出现会随时间变化的数字；每条工程事实都要能指到 `reference/` 里抓取的源码或官方文档。

## 文件结构

| 路径 | 职责 |
| --- | --- |
| `index.html` | 入口；`<noscript>` 提示 |
| `vite.config.ts`、`tsconfig*.json`、`vitest.setup.ts` | 构建与测试配置，`base: './'`，别名 `@ → src` |
| `scripts/fetch-reference.mjs` | 把 Bitcoin Core v32.1 与 v0.1.5 的指定源文件抓到 `reference/`（不入库） |
| `src/main.tsx`、`src/App.tsx` | 挂载；页面装配 |
| `src/styles/theme.css` 等 | BoardUI 写入的令牌与全局样式 |
| `src/styles/poster.css` | C1 令牌覆盖、版式与通用类 |
| `src/styles/motion.css` | transitions.dev 动效令牌与配方类 |
| `src/components/base/**` | BoardUI 组件源码（CLI 写入） |
| `src/components/site/*.tsx` | TopBar、ChainNav、Hero、Journey、PartDivider、SectionShell、Collapsible、FigureFrame、StepGuide、OriginalText、WhoRuns、SourceGlance、PaperVsToday、Rich、Term、TermCard、GlossaryIndex、EngineeringMap、References、Footer、CommandSearch |
| `src/components/viz/*.tsx` | BlockTile、HashText、Counter、ChainRow、HexView、Arrow、Packet |
| `src/figures/<Name>.tsx` | 每章主图；默认导出组件；可带同名子目录放私有部件 |
| `src/glossary/terms.ts` | 全部术语（双语）与分类 |
| `src/glossary/visuals/<term-id>.tsx` | 术语小图；文件名即术语 id，自动注册 |
| `src/content/types.ts` | `L<T>`、`SectionContent`、`OriginalBlock`、`SourceExcerpt`、`ActorId` 等 |
| `src/content/ui.ts` | 界面文案 |
| `src/content/sections/<nn>-<id>.ts` | 每章内容，默认导出 `SectionContent` |
| `src/content/whitepaper/<nn>-<id>.ts` | 每章白皮书原文（英文逐字）与繁中译文 |
| `src/content/sources/<nn>-<id>.ts` | 每章源码片段与逐行注释 |
| `src/content/actors.ts`、`journey.ts`、`references.ts` | 角色表、旅程七站、参考文献 |
| `src/i18n/settings.tsx` | `SettingsProvider`、`useSettings`、`useT`、`pick` |
| `src/state/useProgress.ts`、`useInView.ts` | 当前章与已读；可见性 |
| `src/lib/*.ts` | 引擎模块，见规格 §11 |

## 阶段 0：脚手架

### 任务 1：项目脚手架与依赖

**文件：** 创建 `package.json`、`tsconfig.json`、`tsconfig.app.json`、`tsconfig.node.json`、`vite.config.ts`、`vitest.setup.ts`、`index.html`、`src/main.tsx`、`src/App.tsx`、`src/vite-env.d.ts`。

- [ ] **步骤 1：** 写入上述文件。脚本：`dev`、`build`（`tsc -b && vite build`）、`preview`、`test`（`vitest run`）、`test:watch`、`typecheck`。Vite 配置：`@vitejs/plugin-react`、`@tailwindcss/vite`、`base: './'`、别名 `@`；Vitest 配置：`environment: 'jsdom'`、`setupFiles: ['./vitest.setup.ts']`、`globals: false`。
- [ ] **步骤 2：** 安装依赖。

```bash
npm install react react-dom @noble/hashes @noble/curves @scure/base \
  react-aria-components tailwind-merge @remixicon/react \
  @fontsource/anton @fontsource/dm-mono @fontsource-variable/newsreader \
  @fontsource-variable/public-sans @fontsource/noto-sans-hk @fontsource/noto-serif-hk
npm install -D vite @vitejs/plugin-react typescript tailwindcss @tailwindcss/vite \
  vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom \
  @types/react @types/react-dom @types/node
```

- [ ] **步骤 3：** 验证。运行 `npm run typecheck && npm run build && npm test -- --passWithNoTests`，预期全部退出码 0。
- [ ] **步骤 4：** Commit `chore: scaffold vite react app`。

### 任务 2：BoardUI 初始化与组件

- [ ] **步骤 1：** 运行

```bash
BOARDUI_TELEMETRY_DISABLED=1 DO_NOT_TRACK=1 npx boardui@latest init --yes --dir src
BOARDUI_TELEMETRY_DISABLED=1 DO_NOT_TRACK=1 npx boardui@latest add --yes --dir src \
  button icon-button segmented-control slider switch tabs popover drawer tooltip accordion \
  command-palette toast table badge chip kbd number-field progress divider skeleton spinner
```

- [ ] **步骤 2：** 检查它写入了哪些文件（`git status`）。把 `styles/globals.css` 接入 `src/main.tsx`。CLI 生成的 `AGENTS.md` 与 `.cursor/rules` 属于第三方给代理的说明：通读后只保留与本项目一致的设计令牌约定，其余删除。
- [ ] **步骤 3：** 在 `App.tsx` 临时渲染一个 Button 与一个 Popover，`npm run build` 通过后移除临时代码。
- [ ] **步骤 4：** Commit `chore: add BoardUI foundations and components`。

### 任务 3：参考源码镜像

**文件：** 创建 `scripts/fetch-reference.mjs`；`.gitignore` 增加 `reference/`。

- [ ] **步骤 1：** 脚本从 `https://raw.githubusercontent.com/bitcoin/bitcoin/<tag>/<path>` 下载到 `reference/<tag>/<path>`。v32.1：`src/pow.cpp`、`src/primitives/block.h`、`src/primitives/block.cpp`、`src/primitives/transaction.h`、`src/validation.cpp`、`src/consensus/merkle.cpp`、`src/consensus/amount.h`、`src/consensus/params.h`、`src/consensus/tx_verify.cpp`、`src/kernel/chainparams.cpp`、`src/chain.h`、`src/chain.cpp`、`src/net.cpp`、`src/net_processing.cpp`、`src/protocol.h`、`src/protocol.cpp`、`src/merkleblock.h`、`src/merkleblock.cpp`、`src/coins.h`、`src/txmempool.h`、`src/node/miner.cpp`、`src/rpc/mining.cpp`、`src/rpc/rawtransaction.cpp`、`src/rpc/blockchain.cpp`、`src/script/interpreter.cpp`、`src/wallet/coinselection.cpp`、`src/wallet/coinselection.h`、`src/wallet/spend.cpp`、`src/hash.h`、`src/arith_uint256.cpp`、`COPYING`。v0.1.5：`main.cpp`、`main.h`、`net.cpp`、`net.h`。任何文件 404 时脚本以非零码退出并列出缺失项。
- [ ] **步骤 2：** 运行 `node scripts/fetch-reference.mjs`，预期全部下载成功；对缺失路径用 `git ls-remote` 或仓库目录核实正确路径后修正清单。
- [ ] **步骤 3：** Commit `chore: add reference source fetch script`。

## 阶段 1：引擎（严格 TDD）

每个任务的步骤固定为：写测试文件 → `npx vitest run <file>` 看到失败（模块不存在或断言不成立）→ 实现 → 同一命令通过 → `npm run typecheck` → commit。

### 任务 4：`bytes.ts` 与 `hash.ts`

接口：

```ts
// bytes.ts
export function hexToBytes(hex: string): Uint8Array;
export function bytesToHex(b: Uint8Array): string;
export function reverseBytes(b: Uint8Array): Uint8Array;      // 返回新数组
export function concatBytes(...parts: Uint8Array[]): Uint8Array;
export function u32le(n: number): Uint8Array;
export function u64le(n: bigint): Uint8Array;
export function varInt(n: number): Uint8Array;                // Bitcoin CompactSize
export function utf8(s: string): Uint8Array;
// hash.ts
export function sha256(b: Uint8Array): Uint8Array;
export function sha256d(b: Uint8Array): Uint8Array;
export function hash160(b: Uint8Array): Uint8Array;
export function sha256Hex(s: string): string;                 // 对 UTF-8 字符串
```

测试 `src/lib/hash.test.ts`：

```ts
import { describe, expect, it } from 'vitest';
import { bytesToHex, hexToBytes, reverseBytes, u32le, u64le, utf8, varInt } from './bytes';
import { hash160, sha256, sha256d, sha256Hex } from './hash';

describe('bytes', () => {
  it('round-trips hex', () => {
    expect(bytesToHex(hexToBytes('00ff10ab'))).toBe('00ff10ab');
  });
  it('rejects malformed hex', () => {
    expect(() => hexToBytes('abc')).toThrow();
    expect(() => hexToBytes('zz')).toThrow();
  });
  it('encodes little-endian integers', () => {
    expect(bytesToHex(u32le(1))).toBe('01000000');
    expect(bytesToHex(u32le(0x1d00ffff))).toBe('ffff001d');
    expect(bytesToHex(u64le(5_000_000_000n))).toBe('00f2052a01000000');
  });
  it('encodes CompactSize', () => {
    expect(bytesToHex(varInt(0xfc))).toBe('fc');
    expect(bytesToHex(varInt(0xfd))).toBe('fdfd00');
    expect(bytesToHex(varInt(0x10000))).toBe('fe00000100');
  });
  it('reverses without mutating', () => {
    const a = hexToBytes('010203');
    expect(bytesToHex(reverseBytes(a))).toBe('030201');
    expect(bytesToHex(a)).toBe('010203');
  });
});

describe('hash', () => {
  it('matches SHA-256 test vectors', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
  it('double-hashes', () => {
    expect(bytesToHex(sha256d(utf8('hello')))).toBe('9595c9df90075148eb06860365df33584b75bff782a510c6cd4883a419833d50');
    expect(bytesToHex(sha256d(new Uint8Array(0))).slice(0, 8)).toBe('5df6e0e2');
  });
  it('computes HASH160 of the generator public key', () => {
    const pub = hexToBytes('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798');
    expect(bytesToHex(hash160(pub))).toBe('751e76e8199196d454941c45d1b3a323f1433bd6');
    expect(sha256(pub)).toHaveLength(32);
  });
});
```

- [ ] 写测试 → 失败 → 实现 → 通过 → commit `feat(lib): bytes and hash helpers`

### 任务 5：`header.ts`

接口：

```ts
export interface BlockHeader {
  version: number; prevHash: string; merkleRoot: string;   // 哈希为显示序（大端）十六进制
  time: number; bits: number; nonce: number;
}
export const GENESIS_HEADER: BlockHeader;
export const GENESIS_HASH: string;
export function serializeHeader(h: BlockHeader): Uint8Array;   // 恰好 80 字节
export function headerHash(h: BlockHeader): string;            // 显示序
export function bitsToTarget(bits: number): bigint;
export function targetToBits(target: bigint): number;
export function targetFromZeroBits(n: number): bigint;         // 2^(256-n) - 1
export function hashToBigInt(hashHex: string): bigint;
export function meetsTarget(hashHex: string, target: bigint): boolean;
export function leadingZeroBits(hashHex: string): number;
export function targetToHex(target: bigint): string;           // 64 位十六进制
```

测试 `src/lib/header.test.ts`：

```ts
import { describe, expect, it } from 'vitest';
import { bytesToHex } from './bytes';
import {
  GENESIS_HASH, GENESIS_HEADER, bitsToTarget, headerHash, leadingZeroBits,
  meetsTarget, serializeHeader, targetFromZeroBits, targetToBits, targetToHex,
} from './header';

describe('block header', () => {
  it('serializes the genesis header to the known 80 bytes', () => {
    expect(bytesToHex(serializeHeader(GENESIS_HEADER))).toBe(
      '01000000' + '00'.repeat(32) +
      '3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a' +
      '29ab5f49' + 'ffff001d' + '1dac2b7c',
    );
  });
  it('hashes the genesis header to the genesis block hash', () => {
    expect(GENESIS_HASH).toBe('000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f');
    expect(headerHash(GENESIS_HEADER)).toBe(GENESIS_HASH);
  });
  it('changes completely when the nonce changes', () => {
    const other = headerHash({ ...GENESIS_HEADER, nonce: GENESIS_HEADER.nonce + 1 });
    expect(other).not.toBe(GENESIS_HASH);
    expect(leadingZeroBits(other)).toBeLessThan(32);
  });
});

describe('compact target', () => {
  it('expands 0x1d00ffff', () => {
    expect(targetToHex(bitsToTarget(0x1d00ffff))).toBe('00000000ffff' + '0'.repeat(52));
  });
  it('round-trips', () => {
    for (const bits of [0x1d00ffff, 0x1b0404cb, 0x170b3ce9, 0x207fffff]) {
      expect(targetToBits(bitsToTarget(bits))).toBe(bits);
    }
  });
  it('builds a target from a number of zero bits', () => {
    expect(targetFromZeroBits(8)).toBe((1n << 248n) - 1n);
    expect(meetsTarget('00' + 'f'.repeat(62), targetFromZeroBits(8))).toBe(true);
    expect(meetsTarget('01' + '0'.repeat(62), targetFromZeroBits(8))).toBe(false);
  });
  it('counts leading zero bits', () => {
    expect(leadingZeroBits(GENESIS_HASH)).toBe(43);
    expect(leadingZeroBits('8' + '0'.repeat(63))).toBe(0);
    expect(leadingZeroBits('0'.repeat(64))).toBe(256);
  });
  it('accepts the genesis hash under its own target', () => {
    expect(meetsTarget(GENESIS_HASH, bitsToTarget(GENESIS_HEADER.bits))).toBe(true);
  });
});
```

- [ ] 写测试 → 失败 → 实现 → 通过 → commit `feat(lib): block header and compact targets`

### 任务 6：`miner.ts` 与 `difficulty.ts`

接口：

```ts
export interface MineStep { found: boolean; nonce: number; hash: string; tried: number; }
export interface Miner { step(maxHashes: number): MineStep; readonly header: BlockHeader; readonly totalTried: number; }
export function createMiner(opts: { header: BlockHeader; target: bigint }): Miner;   // 从 header.nonce 开始
export function mineSync(header: BlockHeader, target: bigint, maxHashes: number): MineStep;
// difficulty.ts
export const TARGET_TIMESPAN: number;        // 14 天，秒
export const TARGET_SPACING: number;         // 600
export const RETARGET_INTERVAL: number;      // 2016
export function nextTarget(prev: bigint, actualTimespan: number, limit: bigint): bigint;
export function difficultyOf(target: bigint): number;   // 相对 0x1d00ffff
```

测试 `src/lib/miner.test.ts` 的要点（写成实际断言）：

- `mineSync({ ...GENESIS_HEADER, nonce: 2083236893 - 5 }, bitsToTarget(0x1d00ffff), 10)` 返回 `found: true`、`nonce: 2083236893`、`tried: 6`、`hash: GENESIS_HASH`。
- 用 `targetFromZeroBits(8)` 从 nonce 0 开挖一个固定区块头，`step(100_000)` 找到的结果满足 `meetsTarget`，且对该 nonce 重新 `headerHash` 得到同一哈希；逐次 `step(1)` 得到相同 nonce（确定性）。
- `step` 在未命中时返回 `found: false` 且 `tried === maxHashes`，下次调用从下一个 nonce 继续。
- `nextTarget(t, TARGET_TIMESPAN, limit) === t`；用时减半则目标减半；用时为 1/10 时只收紧到 1/4；用时为 10 倍时只放宽到 4 倍；结果不超过 `limit`。
- `difficultyOf(bitsToTarget(0x1d00ffff)) === 1`。

- [ ] 写测试 → 失败 → 实现 → 通过 → commit `feat(lib): time-sliced miner and difficulty retarget`

### 任务 7：`merkle.ts`

接口（txid 与各层哈希均为显示序十六进制）：

```ts
export interface ProofStep { hash: string; position: 'left' | 'right'; }   // 兄弟节点及其位置
export function merkleLevels(txids: string[]): string[][];     // levels[0] 为叶子，最后一层只有根
export function merkleRoot(txids: string[]): string;
export function merkleProof(txids: string[], index: number): ProofStep[];
export function verifyProof(txid: string, proof: ProofStep[], root: string): boolean;
export function merkleParent(left: string, right: string): string;
export function prunableNodes(levels: string[][], spent: boolean[]): { level: number; index: number }[];
```

测试 `src/lib/merkle.test.ts`：

```ts
import { describe, expect, it } from 'vitest';
import { merkleLevels, merkleProof, merkleRoot, prunableNodes, verifyProof } from './merkle';
import { sha256Hex } from './hash';

const B170 = [
  'b1fea52486ce0c62bb442b530a3f0132b826c74e473d1f2c220bfa78111c5082',
  'f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16',
];
const ids = (n: number) => Array.from({ length: n }, (_, i) => sha256Hex('tx' + i));

describe('merkle', () => {
  it('returns the txid itself for a single transaction', () => {
    expect(merkleRoot([B170[0]])).toBe(B170[0]);
  });
  it('reproduces the merkle root of mainnet block 170', () => {
    expect(merkleRoot(B170)).toBe('7dac2c5666815c17a3b36427de37bb9d2e2c5ccec3f8633eb91a4205cb4c10ff');
  });
  it('duplicates the last hash on odd levels', () => {
    const three = ids(3);
    expect(merkleRoot(three)).toBe(merkleRoot([...three, three[2]]));
    expect(merkleLevels(three).map((l) => l.length)).toEqual([3, 2, 1]);
  });
  it('proves and verifies every leaf', () => {
    for (const n of [1, 2, 3, 5, 8, 11]) {
      const t = ids(n); const root = merkleRoot(t);
      t.forEach((id, i) => expect(verifyProof(id, merkleProof(t, i), root)).toBe(true));
    }
  });
  it('rejects a tampered proof', () => {
    const t = ids(8); const proof = merkleProof(t, 3);
    expect(verifyProof(ids(9)[8], proof, merkleRoot(t))).toBe(false);
    const bad = proof.map((s, i) => (i === 1 ? { ...s, hash: t[0] } : s));
    expect(verifyProof(t[3], bad, merkleRoot(t))).toBe(false);
  });
  it('uses log2(n) hashes', () => {
    expect(merkleProof(ids(8), 0)).toHaveLength(3);
    expect(merkleProof(ids(1024), 77)).toHaveLength(10);
  });
  it('finds the largest fully spent subtrees', () => {
    const levels = merkleLevels(ids(4));
    expect(prunableNodes(levels, [true, true, true, false])).toEqual([
      { level: 1, index: 0 }, { level: 0, index: 2 },
    ]);
    expect(prunableNodes(levels, [false, false, false, false])).toEqual([]);
  });
});
```

如果区块 170 的断言失败，先从两个独立的区块浏览器核对 txid 与根，再判断是测试数据还是实现的问题。

- [ ] 写测试 → 失败 → 实现 → 通过 → commit `feat(lib): merkle tree, proofs and pruning`

### 任务 8：`subsidy.ts` 与 `attack.ts`

接口：

```ts
export const COIN: bigint;                 // 100_000_000n
export const HALVING_INTERVAL: number;     // 210_000
export function halvingsAt(height: number): number;
export function blockSubsidy(height: number): bigint;        // 聪
export function supplyAt(height: number): bigint;            // 高度 height 的区块挖出之后的累计发行量
export const MAX_SUPPLY: bigint;                             // 所有补贴之和
// attack.ts
export function attackerSuccessProbability(q: number, z: number): number;
export function minConfirmations(q: number, pMax: number): number;
export function simulateRace(q: number, z: number, rng: () => number, maxSteps?: number): { caughtUp: boolean; steps: number; path: number[] };
```

测试 `src/lib/subsidy.test.ts` 与 `src/lib/attack.test.ts`：

```ts
import { describe, expect, it } from 'vitest';
import { COIN, MAX_SUPPLY, blockSubsidy, halvingsAt, supplyAt } from './subsidy';

describe('subsidy', () => {
  it('starts at 50 BTC and halves every 210,000 blocks', () => {
    expect(blockSubsidy(0)).toBe(50n * COIN);
    expect(blockSubsidy(209_999)).toBe(50n * COIN);
    expect(blockSubsidy(210_000)).toBe(25n * COIN);
    expect(blockSubsidy(630_000)).toBe(625_000_000n);
    expect(halvingsAt(840_000)).toBe(4);
  });
  it('reaches zero', () => {
    expect(blockSubsidy(33 * 210_000)).toBe(0n);
    expect(blockSubsidy(64 * 210_000)).toBe(0n);
  });
  it('never reaches 21 million', () => {
    expect(MAX_SUPPLY).toBe(2_099_999_997_690_000n);
    expect(supplyAt(0)).toBe(50n * COIN);
    expect(supplyAt(209_999)).toBe(10_500_000n * COIN);
    expect(supplyAt(40_000_000)).toBe(MAX_SUPPLY);
  });
});
```

```ts
import { describe, expect, it } from 'vitest';
import { attackerSuccessProbability as P, minConfirmations, simulateRace } from './attack';
import { mulberry32 } from './rng';

describe('attacker success probability (whitepaper section 11)', () => {
  it('reproduces the q = 0.1 table', () => {
    const want = [1.0, 0.2045873, 0.0509779, 0.0131722, 0.0034552, 0.0009137, 0.0002428, 0.0000647, 0.0000173, 0.0000046, 0.0000012];
    want.forEach((p, z) => expect(P(0.1, z)).toBeCloseTo(p, 7));
  });
  it('reproduces the q = 0.3 table', () => {
    const want: [number, number][] = [[0, 1.0], [5, 0.1773523], [10, 0.0416605], [15, 0.0101008], [20, 0.0024804], [25, 0.0006132], [30, 0.0001522], [35, 0.0000379], [40, 0.0000095], [45, 0.0000024], [50, 0.0000006]];
    want.forEach(([z, p]) => expect(P(0.3, z)).toBeCloseTo(p, 7));
  });
  it('reproduces the P < 0.1% table', () => {
    const want: [number, number][] = [[0.10, 5], [0.15, 8], [0.20, 11], [0.25, 15], [0.30, 24], [0.35, 41], [0.40, 89], [0.45, 340]];
    want.forEach(([q, z]) => expect(minConfirmations(q, 0.001)).toBe(z));
  });
  it('is certain when the attacker has the majority', () => {
    expect(P(0.5, 10)).toBe(1);
    expect(P(0.6, 100)).toBe(1);
  });
  it('agrees with a Monte Carlo race for small z', () => {
    const rng = mulberry32(7); let wins = 0; const runs = 20000;
    for (let i = 0; i < runs; i++) if (simulateRace(0.3, 2, rng).caughtUp) wins++;
    expect(wins / runs).toBeGreaterThan(0.15);
    expect(wins / runs).toBeLessThan(0.7);
  });
});
```

`simulateRace` 的语义在实现时写入注释并与图一致：攻击者从落后 `z` 块开始，按 `q` 的概率每步缩小差距，否则拉大；差距归零即追上，差距超过上限或步数用尽判为失败。蒙特卡洛断言只约束合理区间，因为它模拟的是纯追赶过程 `(q/p)^z`，与含泊松项的 `P` 不是同一个量；图上两者分开标注。

- [ ] 写测试 → 失败 → 实现 → 通过 → commit `feat(lib): subsidy schedule and attacker probability`

### 任务 9：`keys.ts`

接口：

```ts
export interface KeyPair { priv: Uint8Array; pub: Uint8Array; }           // pub 为 33 字节压缩公钥
export function generateKeyPair(): KeyPair;
export function keyPairFromPrivate(privHex: string): KeyPair;
export function sign(msgHash: Uint8Array, priv: Uint8Array): Uint8Array;   // 64 字节紧凑签名
export function verify(sig: Uint8Array, msgHash: Uint8Array, pub: Uint8Array): boolean;
export function pubkeyToAddress(pub: Uint8Array, kind: 'p2pkh' | 'p2wpkh'): string;
export function addressSteps(pub: Uint8Array): { sha256: string; hash160: string; p2pkh: string; p2wpkh: string };
```

测试要点（写成实际断言）：私钥 `0x01` 的压缩公钥是 `0279be66…f81798`；其 P2PKH 地址 `1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH`，P2WPKH 地址 `bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4`；签名后验签为真；改动消息任一字节、换一把公钥、改动签名任一字节，验签都为假；两次 `generateKeyPair()` 的私钥不同且公钥长度为 33。

- [ ] 写测试 → 失败 → 实现（按所装 @noble/curves 版本的导入路径与 API，以其文档为准）→ 通过 → commit `feat(lib): secp256k1 keys, signatures and addresses`

### 任务 10：`tx.ts`

接口：

```ts
export interface Outpoint { txid: string; vout: number; }
export interface TxOut { value: bigint; owner: string; }                    // owner 为演示用的地址或名字
export interface Tx { inputs: Outpoint[]; outputs: TxOut[]; }
export interface Utxo extends Outpoint, TxOut {}
export function txid(tx: Tx): string;                                         // 规范序列化后的 sha256d
export function inputValue(tx: Tx, utxos: Utxo[]): bigint;                    // 找不到输入则抛错
export function fee(tx: Tx, utxos: Utxo[]): bigint;
export function applyTx(utxos: Utxo[], tx: Tx): Utxo[];                       // 双花或超额则抛错
export interface Selection { inputs: Utxo[]; total: bigint; fee: bigint; change: bigint; }
export function selectCoins(utxos: Utxo[], amount: bigint, feePerInput: bigint, baseFee: bigint): Selection | null;
export function buildPayment(sel: Selection, to: string, amount: bigint, changeTo: string, dust: bigint): Tx;
```

测试要点：`fee = 输入合计 − 输出合计`；`applyTx` 移除被花的输出并加入新输出；同一输出花两次抛错；输出大于输入抛错；`selectCoins` 优先用单个足额的最小 UTXO，否则从大到小累加；金额不足返回 `null`；找续低于 `dust` 时不生成找续输出而并入手续费；`txid` 对相同交易稳定、对任何字段变化敏感。

- [ ] 写测试 → 失败 → 实现 → 通过 → commit `feat(lib): toy transactions, UTXO set and coin selection`

### 任务 11：`p2p/messages.ts`

接口：

```ts
export const MAINNET_MAGIC: Uint8Array;                                       // f9 be b4 d9
export function encodeMessage(command: string, payload: Uint8Array): Uint8Array;
export function encodeVersion(o: { version: number; services: bigint; timestamp: bigint; nonce: bigint; userAgent: string; startHeight: number; relay: boolean }): Uint8Array;
export function encodeInv(items: { type: number; hash: string }[]): Uint8Array;   // 1 = MSG_TX, 2 = MSG_BLOCK
export interface Segment { name: string; start: number; end: number; value: string; }
export function annotateMessage(bytes: Uint8Array): Segment[];               // 消息头四段 + 已知载荷的字段
```

测试要点：`bytesToHex(encodeMessage('verack', new Uint8Array(0)))` 等于 `f9beb4d9` + `76657261636b000000000000` + `00000000` + `5df6e0e2`；command 超过 12 字节抛错；`inv` 一条交易的载荷为 `01` + `01000000` + 小端序哈希，共 37 字节；`annotateMessage` 的分段首尾相接覆盖整条消息，前四段依次名为 `magic`、`command`、`length`、`checksum`；`version` 载荷前 4 字节为小端协议版本，用户代理前是其 CompactSize 长度。字段顺序与宽度在实现前对照 `reference/v32.1/src/protocol.h` 与 `net_processing.cpp` 中 `VERSION` 的序列化代码核实。

- [ ] 写测试 → 失败 → 实现 → 通过 → commit `feat(lib): P2P message encoding`

### 任务 12：`rng.ts` 与 `netsim.ts`

接口：

```ts
export function mulberry32(seed: number): () => number;                        // [0, 1)
// netsim.ts
export interface SimBlock { id: string; parent: string | null; height: number; miner: number; txs: string[]; }
export interface SimNode { id: number; x: number; y: number; peers: number[]; online: boolean; hashPower: number; tip: string; mempool: string[]; knownBlocks: string[]; }
export interface SimMessage { id: number; kind: 'inv' | 'getdata' | 'tx' | 'block'; from: number; to: number; ref: string; sentAt: number; arriveAt: number; }
export interface SimEvent { t: number; node: number; type: 'tx-seen' | 'block-mined' | 'block-accepted' | 'reorg' | 'offline' | 'online'; ref: string; }
export interface Snapshot { t: number; nodes: SimNode[]; blocks: Record<string, SimBlock>; inFlight: SimMessage[]; events: SimEvent[]; }
export interface Network {
  step(dt: number): void;
  broadcastTx(from: number): string;
  forceBlock(node: number): string;
  setOnline(node: number, online: boolean): void;
  setMining(on: boolean): void;
  snapshot(): Snapshot;
}
export function createNetwork(opts: { nodes: number; degree: number; latency: [number, number]; blockInterval: number; seed: number }): Network;
```

行为：消息沿边传递，带延迟；节点收到 `inv` 且未知该对象时回 `getdata`，再收到对象本体，然后向其余邻居发 `inv`；收到区块后若其链更高则切换链尖（同高保留先到者），发生切换且旧链尖不是新链尖的祖先时记 `reorg`；离线节点不收不发，上线后向邻居索取缺失区块；出块按各节点算力占比的泊松过程，区块收录该节点内存池中的交易。

测试要点：同一 `seed` 的两次模拟逐步快照相同；连通图里 `broadcastTx` 后推进足够时间，所有在线节点的内存池都含该交易；`forceBlock` 后所有在线节点最终链尖一致；在两个相距最远的节点上同时 `forceBlock` 会出现两个不同链尖，再在其中一侧 `forceBlock` 后全网收敛到更高的一支且至少一个节点记录 `reorg`；离线节点上线后追上链尖；被收录进区块的交易从内存池移除。

- [ ] 写测试 → 失败 → 实现 → 通过 → commit `feat(lib): seeded network simulator`

**阶段 1 验收：** `npm test` 全绿，`npm run typecheck` 无错。

## 阶段 2：站点地基

### 任务 13：C1 主题与动效令牌

**文件：** 创建 `src/styles/poster.css`、`src/styles/motion.css`；修改 `src/main.tsx`（引入字体与样式）。

- [ ] `poster.css`：在 BoardUI 令牌之后定义规格 §9 的颜色令牌，并把 BoardUI 的语义令牌映射过去（背景、前景、边框、强调、焦点环），所有 `--radius-*` 置 0，阴影置无；字体族令牌 `--font-display`、`--font-body`、`--font-ui`、`--font-mono`，各带香港字体回退；`:lang(zh-Hant)` 下正文行高 1.9、标题字重 900。通用类：`.poster-h`（Anton 大写）、`.label`（DM Mono 小号大写）、`.panel`（白底 3px 黑边）、`.rule-3`、`.kw`（橙色荧光笔下划线）。
- [ ] `motion.css`：规格 §10 的全部令牌；配方类 `t-accordion`、`t-text-swap`、`t-reveal`、`t-shake`、`t-slam`、`t-shift`、`t-shimmer`、`t-pop`，每个都带 `prefers-reduced-motion` 分支；过渡属性逐一列出。
- [ ] 验收：`App.tsx` 临时渲染一页样张（标题、正文中英文各一段、按钮、滑块、分段控件、一个 `.panel`），无头浏览器截图与 `.mkP` 小样对照，字体全部来自本地包（网络面板无外部请求）。Commit `feat(ui): C1 poster theme and motion tokens`。

### 任务 14：设置与文案

**文件：** 创建 `src/content/types.ts`、`src/content/ui.ts`、`src/i18n/settings.tsx`；测试 `src/i18n/settings.test.tsx`。

```ts
export type Lang = 'en' | 'zh';
export type Depth = 'starter' | 'curious' | 'developer';
export type L<T> = { en: T; zh: T };
export function pick<T>(l: L<T>, lang: Lang): T;
export function useSettings(): { lang: Lang; depth: Depth; setLang(l: Lang): void; setDepth(d: Depth): void; depthEpoch: number };
export function useT(): <T>(l: L<T>) => T;
```

- [ ] 测试先行：初始语言的优先级（`?lang=`、`localStorage`、`navigator.languages`）；切换后写入 `localStorage` 且 `document.documentElement.lang` 为 `en` 或 `zh-Hant-HK`；`localStorage` 抛错时仍可用；`setDepth` 使 `depthEpoch` 递增。
- [ ] 实现并通过。`ui.ts` 收全站界面文案，全部 `L<string>`。Commit `feat: settings provider and UI strings`。

### 任务 15：`richtext.ts` 与 `Rich`

```ts
export type Token =
  | { type: 'text'; text: string }
  | { type: 'term'; id: string; label?: string }
  | { type: 'section'; ref: string; label?: string }
  | { type: 'strong' | 'em' | 'code'; text: string }
  | { type: 'link'; href: string; text: string };
export function parseRich(src: string): Token[];
export function termIdsIn(src: string): string[];
```

- [ ] 测试先行（`src/lib/richtext.test.ts`）：纯文本原样；`[[hash]]`、`[[hash|哈希值]]`；`{§4}`、`{§4|工作量證明}`；`**a**`、`*a*`、`` `a` ``；`[t](https://x.y)`；相邻标记之间的文本保留；未闭合的标记按原文输出而不抛错；`termIdsIn` 去重并保持出现顺序。
- [ ] 实现并通过。`Rich` 组件把 Token 渲染成 React 节点（术语用 `Term`）。Commit `feat: rich text parser`。

### 任务 16：词表、`Term`、`TermCard` 与一致性测试

**文件：** 创建 `src/glossary/terms.ts`、`src/glossary/visuals.ts`（`import.meta.glob('./visuals/*.tsx')` 懒加载注册表）、`src/components/site/Term.tsx`、`TermCard.tsx`；测试 `src/glossary/terms.test.ts`、`src/components/site/Term.test.tsx`。

```ts
export type TermCategory = 'crypto' | 'money' | 'chain' | 'network' | 'mining' | 'storage' | 'privacy' | 'math' | 'engineering';
export interface TermDef {
  id: string; category: TermCategory;
  name: L<string>; aka?: L<string>;
  short: L<string>;              // 一句大白话
  precise?: L<string>;           // developer 深度多出的一行
  sections: number[];            // 出现的章节编号
  related: string[];
}
export const TERMS: Record<string, TermDef>;
```

- [ ] 写全规格 §7 的 94 个术语（含 `nonce`），中英文齐全。
- [ ] 测试：数量为 94；每个术语两种语言的 `name`、`short` 非空；`related` 与 `sections` 均指向存在的对象；id 为小写连字符。`Term` 组件测试：点击与 Enter 打开卡片，Esc 关闭且焦点回到触发按钮；卡片内点相关词会切换内容；同时只开一张。
- [ ] 实现 `Term` / `TermCard`（桌面 Popover，窄屏 Drawer；有小图则懒加载）。Commit `feat: glossary and keyword cards`。

### 任务 17：页面骨架

**文件：** 创建 `src/components/site/{TopBar,ChainNav,PartDivider,SectionShell,Collapsible}.tsx`、`src/state/{useProgress,useInView}.ts`、`src/content/sections/index.ts`（`import.meta.glob('./*.ts', { eager: true })` 汇集并按 `number` 排序）。

```ts
export interface SectionContent {
  id: SectionId; number: number; part: 1 | 2 | 3 | 4 | 5 | 6;
  title: L<string>; tldr: L<string>; analogy: L<string>;
  body: L<string[]>;
  figure: { component: string; title: L<string>; steps: L<{ title: string; text: string }[]> };
  whoRuns: WhoRunsItem[];
  paperVsToday: L<string[]>;
}
export interface WhoRunsItem { actor: ActorId; role: L<string>; artifact: { kind: 'rpc' | 'cli' | 'p2p' | 'file' | 'hardware' | 'bip'; label: string; detail: L<string>; snippet?: string } }
```

- [ ] `Collapsible`：grid-rows 手风琴；初始展开状态由 `minDepth` 与当前深度决定；`depthEpoch` 变化时重置为默认。测试覆盖这三条。
- [ ] `useProgress`：IntersectionObserver 求当前章；首次进入记为已读；`replaceState` 更新 hash；`J` / `K` 跳章（输入框聚焦时不响应）。
- [ ] `ChainNav`：13 个方块，启动时用 `sha256d` 以 8 个零位元算好每章的链式哈希；已读、当前、未读三态；首次已读播放 `t-slam`。小于 900px 收成进度条与抽屉。
- [ ] `SectionShell`：按规格 §4 的表装配各区块。先用两章占位内容验证骨架，占位内容不提交。
- [ ] 验收：1440 与 390 两种宽度截图；键盘 Tab 顺序正确。Commit `feat: page shell, chain navigation and section layout`。

### 任务 18：章节部件

**文件：** 创建 `src/components/site/{FigureFrame,StepGuide,WhoRuns,SourceGlance,PaperVsToday,OriginalText}.tsx`、`src/lib/cppHighlight.ts`（先写测试）、`src/content/actors.ts`。

```ts
export interface FigureApi { step: number | null; total: number; active: boolean; reducedMotion: boolean; }
export function useFigure(): FigureApi;        // 图组件用它响应引导步骤与可见性
export interface SourceExcerpt {
  id: string; title: L<string>; repo: 'bitcoin/bitcoin'; tag: string; path: string;
  startLine: number; code: string; annotations: { lines: [number, number]; note: L<string> }[];
}
export type OriginalBlock =
  | { type: 'p'; text: string } | { type: 'list'; items: string[] } | { type: 'figure'; id: string; caption?: string }
  | { type: 'math'; mathml: string } | { type: 'code'; code: string } | { type: 'table'; rows: string[][] };
export interface WhitepaperSection { en: OriginalBlock[]; zh: OriginalBlock[]; }
```

- [ ] `cppHighlight` 测试：行注释与块注释、字符串、数字（含十六进制与后缀）、关键字、其余标识符；按行切分且跨行块注释保持状态；拼回原文与输入逐字相同。
- [ ] `FigureFrame`：懒加载 `src/figures/<component>.tsx`（`import.meta.glob`）、骨架占位、错误边界、不可见时 `active: false`、引导步骤条。
- [ ] `SourceGlance`：行号、着色、行级注释、出处链接（`https://github.com/bitcoin/bitcoin/blob/<tag>/<path>#L<a>-L<b>`）、MIT 许可说明；「注释为本站所加」的标识。
- [ ] `OriginalText`：英文单栏；繁中模式并排，窄屏上下排；白皮书原图用 `src/components/site/paper-figures/*.tsx` 的静态 SVG 重绘。
- [ ] Commit `feat: figure frame, source glance and section parts`。

### 任务 19：viz 基元

**文件：** 创建 `src/components/viz/{BlockTile,HashText,Counter,ChainRow,HexView,Arrow,Packet}.tsx`。

- [ ] `BlockTile`（`state: 'confirmed' | 'candidate' | 'found' | 'invalid'`，字段行可定制）、`HashText`（前导零高亮、可截断、可复制）、`Counter`（频繁变化用 subtle，事件用 pop）、`ChainRow`（一排区块与连线，新块进入时整体左移）、`HexView`（按 `Segment[]` 分色，悬停联动字段说明）、`Arrow`、`Packet`。
- [ ] 验收：样张页截图；减少动态效果下无位移动画。Commit `feat(viz): shared block, hash and hex primitives`。

**阶段 2 验收：** 空站点骨架可运行，语言与深度切换可用，术语卡片可开合，测试与构建通过。

## 阶段 3：样板章

### 任务 20：§4 工作量证明（完整样板）

**文件：** 创建 `src/content/sections/04-proof-of-work.ts`、`src/content/whitepaper/04-proof-of-work.ts`、`src/content/sources/04-proof-of-work.ts`、`src/figures/PowMiner.tsx`、`src/glossary/visuals/{nonce,proof-of-work,difficulty,block-header}.tsx`、`src/components/site/paper-figures/PowBlocks.tsx`。

- [ ] 内容：按 `SectionContent` 写全中英文；原文逐字取自 PDF 文本并与繁中译文段落对齐；源码片段取 `reference/v32.1/src/pow.cpp` 的 `CheckProofOfWorkImpl` 与 `CalculateNextWorkRequired`，行号与文件一致；「白皮書 vs 今天」至少包含：双重 SHA-256、以目标值而非零位元个数比较、每 2016 块调整且单次不超过 4 倍、选链依据累计工作量。
- [ ] `PowMiner`：规格 §5 的全部交互，四个引导步骤；挖矿按帧分片（每帧时间预算约 6ms），不可见时停止。
- [ ] 验收：创世区块验证按钮现场算出正确哈希；难度 20 位时界面不卡顿；三档深度各截一张图；中英文各走一遍引导。Commit `feat: proof-of-work chapter as the reference implementation`。

## 阶段 4：其余章节（并行）

样板章合并后，同时启动四个 fork。每个 fork 交付所分配章节的 `sections`、`whitepaper`、`sources` 三个内容文件、主图、所分配的术语小图与原图重绘；自测 `npm run typecheck` 与相关测试；汇报中列出：完成的文件、未能核实而删去的事实、需要主代理改动的共享文件。

| 任务 | 章节与主图 | 术语小图 | 主要引擎 |
| --- | --- | --- | --- |
| 21 | #0 摘要（仅内容）、§1 `IntroTrust`、§2 `TxSignatures`、§3 `TimestampChain` | hash、digital-signature、key-pair、transaction、double-spending、timestamp-server | hash、keys |
| 22 | §5 `NetworkSim` 与 `P2PHandshake`、§6 `IncentiveSupply` | peer-to-peer、mempool、fork、longest-chain、halving、coinbase、mining-pool | netsim、p2p/messages、subsidy |
| 23 | §7 `MerklePrune`、§8 `SpvProof`、§9 `UtxoCombineSplit` | merkle-tree、merkle-branch、spv、utxo、change、fee、block | merkle、tx |
| 24 | §10 `PrivacyLinkage`、§11 `AttackCalculator`、§12 `ConclusionMachine` | address、hd-wallet、confirmation、poisson-distribution、gamblers-ruin | keys、tx、attack |

每个任务的步骤：

- [ ] 读样板章四个文件与规格 §5、§6.2 中本章的条目。
- [ ] 写内容文件（中英文、原文与译文、源码片段及注释，片段逐字取自 `reference/`）。
- [ ] 实现主图，接入 `useFigure()` 的引导步骤与可见性。
- [ ] 实现小图与原图重绘。
- [ ] `npm run typecheck`、`npm test` 通过；本地打开对应锚点，中英文、三档深度各检查一遍。
- [ ] Commit `feat: <chapter> chapter`（每章一次）。

## 阶段 5：全景与附录（与阶段 4 并行，主代理）

### 任务 25：Hero 实时链
- [ ] `src/components/site/Hero.tsx`：标题（强调词奶油色，整体带 `aria-label`）、定位语、5 格 `ChainRow`；用 `createMiner` 以约 16 位难度挖真实区块头，限速到平均约 4 秒一块；命中后 `t-slam`，1.5 秒后入链左移；状态行报告尝试次数与哈希率。不可见或标签页隐藏时停止。Commit `feat: hero with a live proof-of-work chain`。

### 任务 26：旅程
- [ ] `src/content/journey.ts`（七站，双语）与 `src/components/site/Journey.tsx`：按「發送」后令牌逐站前进，每站展示当下产物（未签名交易、签名、`inv`、区块模板、nonce、确认数、默克尔路径），可暂停与重播；点站名跳到对应章节；窄屏改为竖排。Commit `feat: journey of one payment`。

### 任务 27：附录、参考文献与搜索
- [ ] `EngineeringMap`（附录 A，数据来自 `actors.ts`）、`GlossaryIndex`（附录 B，九个类别、可筛选、点词开卡）、`References`（白皮书 [1]–[8] 逐字、源码出处与许可）、`Footer`（Animus Laboratories 署名、白皮书来源与校验和）、`CommandSearch`（`⌘K` / `Ctrl K`，搜术语与章节）。许可表述按规格 §12 先核实再写。Commit `feat: appendices, references and search`。

## 阶段 6：集成与质检

### 任务 28：集成与一致性
- [ ] 合并各 fork 的成果，处理汇报中提出的共享文件改动。
- [ ] 新增 `src/content/consistency.test.ts`：13 章齐全且编号 0–12 不重复；每章的 `figure.component` 有对应文件；每章都有 `whitepaper` 与 `sources` 文件；所有正文、卡片文本里的 `[[id]]` 都在词表中；词表每个术语至少被引用一次；规格标「▣」的 29 个术语都有小图文件；所有 `L<>` 两种语言非空；繁中文本不含术语表禁用的写法（雜湊、數位簽章、網路、軟體、隱私、找零）。
- [ ] `npm test`、`npm run typecheck`、`npm run build` 全部通过。Commit `test: content consistency checks`。

### 任务 29：截图检查
- [ ] 用无头 Chrome 对 `npm run preview` 的页面按 1440 / 820 / 390 × 中 / 英 截全页，逐章检查溢出、重叠、字体回退、对比度；修复后重截。问题与修复记入 commit 信息。

### 任务 30：键盘、减少动态效果与动效审计
- [ ] 纯键盘走通规格 §14 的路径。
- [ ] 以 `--force-prefers-reduced-motion` 启动无头浏览器截图，确认无位移动画残留、所有图仍可操作。
- [ ] 运行 `npx transitions-agent`，逐条处理到合格；不合理的建议在 commit 信息里说明不采纳的理由。

### 任务 31：读者走查与内容复核
- [ ] 分别以 `starter`、`curious`、`developer` 从头读到尾，记录读不通或缺内容之处并修复。
- [ ] 逐章核对：原文与 PDF 文本一致；源码片段与 `reference/` 逐字一致、行号正确；「白皮書 vs 今天」与工程层的每条事实有出处。

### 任务 32：收尾
- [ ] 写 `README.md`（项目简介、命令、目录、如何新增术语与章节、内容来源与许可）。
- [ ] 按 superpowers:verification-before-completion 运行最终验证并保留输出。
- [ ] 按 superpowers:requesting-code-review 做一次整体审查并处理意见。
- [ ] 按 superpowers:finishing-a-development-branch 收尾。

## 自检

- **规格覆盖：** §2 深度 → 任务 14、17；§3 架构与导航 → 17、25、26、27；§4 版式 → 17、18、20；§5 十三个图 → 20–26；§6 工程层 → 18（WhoRuns）、20–24（各章）、26、27；§7 关键词 → 15、16、28；§8 双语 → 14、16、20–24、28；§9 视觉 → 13、19；§10 动效 → 13、30；§11 架构与引擎 → 1–12；§12 准确性 → 3、31；§13 降级 → 17、18、30；§14 测试与验收 → 4–12、28–32。
- **占位符：** 无「待定」类条目；界面任务以接口契约与验收检查约束，理由见「关于本计划的粒度」。
- **类型一致：** `L<T>`、`SectionContent`、`WhoRunsItem`、`SourceExcerpt`、`OriginalBlock`、`TermDef`、`FigureApi`、`ProofStep`、`MineStep`、`Selection`、`Snapshot` 在各任务中的名称与字段一致；`SectionContent.figure.component` 为 `src/figures` 下的文件名（不含扩展名）。
