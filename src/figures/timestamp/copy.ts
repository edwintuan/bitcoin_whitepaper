import type { L } from '@/content/types';

/** Interface copy for the timestamp-chain figure. */
export const COPY = {
  intro: {
    en: 'Four blocks of items. Each one was hashed together with the hash of the block before it, and that hash was made public.',
    zh: '四個裝着項目的區塊。每個區塊都連同前一個區塊的哈希一併計算哈希，所得結果隨即公開發佈。',
  },
  blockN: { en: 'Block', zh: '區塊' },
  itemLabel: { en: 'Block {block}, item {item}', zh: '區塊 {block} 的第 {item} 項' },
  first: { en: 'nothing before it', zh: '之前沒有區塊' },
  stale: { en: 'old', zh: '舊值' },

  status: {
    ok: { en: 'intact', zh: '完好' },
    changed: { en: 'edited', zh: '已改動' },
    broken: { en: 'cut off', zh: '已脫節' },
    publishing: { en: 'publishing…', zh: '發佈中…' },
  },

  republish: { en: 'Publish again', zh: '重新發佈' },
  startOver: { en: 'Start over', zh: '重新開始' },
  cutOff: { en: 'Blocks cut off', zh: '已脫節的區塊' },
  repairCost: { en: 'Hashes spent on repair', zh: '修復所耗的哈希次數' },

  untouched: {
    en: 'Every block carries the hash of the one before it. Change a word in block 1 or 2 and see what happens to the blocks after it.',
    zh: '每個區塊都帶着前一個區塊的哈希。改動區塊 1 或區塊 2 裏的一個字，看看其後的區塊會怎樣。',
  },
  broken: {
    en: 'Block {block} has a new hash. Every block after it was published on top of the old one and no longer follows. Anyone who compares the hashes can see that something was changed.',
    zh: '區塊 {block} 的哈希變了。其後的每個區塊當初都建基於舊哈希，如今再也接不上。任何人只要比對哈希，便看得出有人動過手腳。',
  },
  changedOnly: {
    en: 'Block {block} has a new hash, which is no longer the one that was published. Nothing has been built on it yet, so no other block shows the change.',
    zh: '區塊 {block} 的哈希變了，不再是當初發佈的那一個。它之後還沒有別的區塊，所以沒有其他區塊顯示出這次改動。',
  },
  publishing: { en: 'Publishing block {block} again…', zh: '正在重新發佈區塊 {block}…' },
  repaired: {
    en: 'Whole again. Hashes needed: {count}, done in an instant. A chain of hashes shows that the past was changed, but it does nothing to make changing it costly. That cost is what section 4 adds.',
    zh: '整條鏈又接上了。所需哈希運算：{count} 次，轉眼完成。哈希鏈能顯示歷史被人改動過，卻不會令改動付出任何代價；第 4 章要補上的，正是這個代價。',
  },

  samples: {
    en: [
      ['Alice pays Bob 5', 'Bob pays Carol 2'],
      ['Carol pays Dan 1', 'Dan pays Erin 3'],
      ['Erin pays Bob 2', 'Alice pays Dan 4'],
      ['Bob pays Dan 1', 'Carol pays Bob 2'],
    ],
    zh: [
      ['愛麗絲付給鮑勃 5', '鮑勃付給卡蘿 2'],
      ['卡蘿付給丹 1', '丹付給艾琳 3'],
      ['艾琳付給鮑勃 2', '愛麗絲付給丹 4'],
      ['鮑勃付給丹 1', '卡蘿付給鮑勃 2'],
    ],
  },
} satisfies Record<string, L<unknown> | Record<string, unknown>>;
