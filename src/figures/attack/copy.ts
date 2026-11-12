import type { L } from '@/content/types';

/**
 * Interface copy for the attack calculator. z is always the paper's z: blocks
 * on top of the payment's block. In labels, which are set in capitals,
 * backticks mark a variable so that it keeps its own case (see vars.tsx).
 */
export const COPY = {
  scenes: { en: 'Scene', zh: '場景' },
  sceneCalculator: { en: 'Calculator', zh: '計算器' },
  sceneCode: { en: 'The paper’s code', zh: '白皮書的程式碼' },
  sceneRace: { en: 'The race', zh: '競賽' },

  /* -------------------------------------------------------------- inputs */
  share: { en: 'Attacker’s share of hash power, `q`', zh: '攻擊者的算力佔比 `q`' },
  blocks: { en: 'Blocks on top of the payment, `z`', zh: '付款之上的區塊數 `z`' },
  honestShare: { en: 'honest share p = {p}', zh: '誠實算力 p = {p}' },
  confirmationOne: { en: '= 1 confirmation', zh: '即 1 個確認' },
  confirmationMany: { en: '= {count} confirmations', zh: '即 {count} 個確認' },
  zNote: {
    en: 'z counts the blocks added on top of the block that holds the payment. That block is itself the first confirmation, so z blocks on top make z + 1 confirmations.',
    zh: 'z 是付款所在的區塊之上再接上的區塊數目。付款所在的區塊本身已算第一個確認，所以上面有 z 個區塊，就是 z + 1 個確認。',
  },

  /* A count of blocks, as it reads inside the sentences below. */
  blocksOne: { en: '1 block', zh: '1 個區塊' },
  blocksMany: { en: '{count} blocks', zh: '{count} 個區塊' },

  /* ---------------------------------------------------------- calculator */
  result: { en: 'Chance the attacker can still take the payment back, P', zh: '攻擊者仍能收回這筆付款的概率 P' },
  oneIn: { en: '1 in {n}', zh: '{n} 分之一' },
  inHundred: { en: 'about {n} in 100', zh: '每 100 次約 {n} 次' },
  belowFloor: { en: 'less than 1 in a billion', zh: '低於十億分之一' },
  axisP: {
    en: 'P on a logarithmic scale: each line down is ten times less likely',
    zh: 'P（對數刻度）：每往下一條線，概率減至十分之一',
  },
  axisZ: { en: '`z`, blocks on top of the payment', zh: '`z`：付款之上的區塊數' },
  wait: {
    en: 'At a {share} share, wait until {z} blocks sit on top of the one holding the payment ({conf} confirmations) to get below 0.1%.',
    zh: '攻擊者佔 {share} 算力時，要等到付款所在的區塊之上再接上 {z} 個區塊（即 {conf} 個確認），概率才低於 0.1%。',
  },
  waitBeyond: {
    en: 'At a {share} share, P stays above 0.1% until {z} blocks sit on top of the payment ({conf} confirmations): far beyond this chart.',
    zh: '攻擊者佔 {share} 算力時，要等到付款之上有 {z} 個區塊（即 {conf} 個確認），概率才低於 0.1%，遠遠超出本圖的範圍。',
  },
  waitUnknown: {
    en: 'At a {share} share the answer runs to many hundreds of blocks, beyond what the paper’s formula can compute in ordinary floating-point numbers.',
    zh: '攻擊者佔 {share} 算力時，所需的區塊多達數百個，已超出白皮書這條公式以一般浮點數所能計算的範圍。',
  },
  status: {
    en: 'With {share} of the hash power against {blocks} on top ({conf} confirmations), the attacker succeeds about once in {n} attempts.',
    zh: '攻擊者掌握 {share} 算力，而付款之上已有 {blocks}（即 {conf} 個確認）：他大約每 {n} 次嘗試才成功一次。',
  },
  statusLikely: {
    en: 'With {share} of the hash power against {blocks} on top ({conf} confirmations), the attacker succeeds about {n} times in 100.',
    zh: '攻擊者掌握 {share} 算力，而付款之上已有 {blocks}（即 {conf} 個確認）：他每 100 次嘗試大約成功 {n} 次。',
  },
  statusZero: {
    en: 'At z = 0 the formula gives P = 1: it counts only blocks on top of the payment, and there are none yet. The payment’s own block is not in the sum, so this is the formula’s starting point, not the risk of one confirmation.',
    zh: 'z = 0 時，公式給出 P = 1：它只計算付款之上的區塊，而此刻一個也沒有。付款所在的區塊並不在公式之內，所以這只是公式的起點，並不代表一個確認的實際風險。',
  },
  statusFloor: {
    en: 'With {share} of the hash power against {blocks} on top ({conf} confirmations), fewer than one attempt in a billion succeeds.',
    zh: '攻擊者掌握 {share} 算力，而付款之上已有 {blocks}（即 {conf} 個確認）：每十億次嘗試，成功的不足一次。',
  },
  chartAlt: {
    en: 'Line chart of P against z for an attacker with {share} of the hash power, z from 0 to {zMax}. P is 100% at z = 0 and falls by a roughly constant factor with every block. At the selected z = {z} it is {p}.',
    zh: '折線圖：攻擊者掌握 {share} 算力時，P 隨 z 的變化，z 由 0 至 {zMax}。z = 0 時 P 為 100%，其後每多一個區塊，P 大致按固定倍數下降。在所選的 z = {z}，P 為 {p}。',
  },
  chartAltWait: {
    en: 'P first falls below 0.1% at z = {wait}.',
    zh: 'P 在 z = {wait} 時首次低於 0.1%。',
  },

  /* ---------------------------------------------------------------- code */
  paperCode: { en: 'The paper · C', zh: '白皮書 · C' },
  portCode: { en: 'This page · TypeScript', zh: '本頁 · TypeScript' },
  portNote: {
    en: 'The function this page runs, printed from its own source file. Its first two statements are not in the paper: one checks the arguments, the other answers for an attacker with half the hash power or more, a case the paper sets aside by assuming p > q.',
    zh: '本頁實際執行的函數，直接取自其源碼檔案。開頭兩句並非出自白皮書：一句檢查參數，另一句處理攻擊者掌握一半或以上算力的情況；白皮書假設 p > q，沒有處理這種情況。',
  },
  watch: { en: 'Inside the loop', zh: '迴圈之內' },
  watchHint: {
    en: 'Point at a value to find its line in both listings.',
    zh: '把指標移到某個數值上，兩份程式碼中對應的行便會亮起。',
  },
  pass: { en: 'Pass {n} of {total}: k = {k}', zh: '第 {n}／{total} 輪：k = {k}' },
  prevPass: { en: 'Previous pass', zh: '上一輪' },
  nextPass: { en: 'Next pass', zh: '下一輪' },
  runLoop: { en: 'Run the loop', zh: '執行迴圈' },
  stopLoop: { en: 'Stop', zh: '停止' },
  gloss: {
    p: { en: 'the honest share, 1 − q', zh: '誠實一方的佔比，即 1 − q' },
    ratio: { en: 'chance of ever closing a gap of one block', zh: '最終追回一個區塊差距的概率' },
    lambda: {
      en: 'blocks he is expected to find while z are added',
      zh: '接上 z 個區塊期間，他預期找到的區塊數',
    },
    poisson: { en: 'chance he has found exactly k', zh: '他剛好已找到 k 個的概率' },
    miss: { en: 'chance he then never closes the other z − k', zh: '其後始終追不回餘下 z − k 個的概率' },
    sum: { en: 'what is left of 1 after this pass', zh: '這一輪之後，1 還剩下多少' },
    result: { en: 'returned after the last pass: P', zh: '最後一輪之後傳回的值，即 P' },
  },
  tablesTitle: { en: 'The paper’s tables, computed again here', zh: '白皮書的三張表，在此重新計算' },
  tablesMatch: {
    en: 'All {count} lines come out the same as the paper prints them, character for character.',
    zh: '全部 {count} 行的計算結果，與白皮書所印的逐字相同。',
  },
  tablesDiffer: { en: '{count} lines differ from the paper.', zh: '有 {count} 行與白皮書不符。' },
  tablesNote: {
    en: 'In these tables z is the paper’s z, blocks on top of the payment. The first line of the last table, q = 0.10 with z = 5, is the familiar six confirmations.',
    zh: '表中的 z 是白皮書的 z，即付款之上的區塊數。最後一張表的第一行，q = 0.10、z = 5，就是常說的六個確認。',
  },
  same: { en: 'same as the paper', zh: '與白皮書相同' },
  differs: { en: 'differs from the paper', zh: '與白皮書不符' },

  /* ---------------------------------------------------------------- race */
  raceIntro: {
    en: 'A race begins where the paper’s catch-up probability begins: with the attacker exactly z blocks behind. Each new block is the attacker’s with probability q, otherwise the honest chain’s.',
    zh: '競賽的起點，與白皮書計算追上概率時的起點相同：攻擊者剛好落後 z 個區塊。每個新區塊有 q 的概率由攻擊者找到，否則由誠實鏈找到。',
  },
  honest: { en: 'Honest chain', zh: '誠實鏈' },
  attacker: { en: 'Attacker’s chain', zh: '攻擊者的鏈' },
  gap: { en: 'Gap', zh: '差距' },
  found: { en: 'Blocks found', zh: '已出區塊' },
  seed: { en: 'Seed', zh: '種子' },
  earlier: { en: '{count} earlier', zh: '前面 {count} 個' },
  run: { en: 'Run a race', zh: '跑一場' },
  pause: { en: 'Pause', zh: '暫停' },
  resume: { en: 'Continue', zh: '繼續' },
  next: { en: 'Next block', zh: '下一個區塊' },
  again: { en: 'New race', zh: '再跑一場' },
  walkLevel: { en: 'caught up', zh: '追上' },
  walkQuit: { en: 'gives up', zh: '放棄' },
  walkAlt: {
    en: 'The gap after each block of this race. It starts at {z}, and stands at {gap} after {blocks}.',
    zh: '這場競賽中每個區塊之後的差距：由 {z} 開始，{blocks}之後為 {gap}。',
  },
  raceReady: {
    en: 'The attacker starts {blocks} behind. Run the race, or step through it one block at a time.',
    zh: '攻擊者一開始落後 {blocks}。按「跑一場」，或逐個區塊看下去。',
  },
  raceHonest: {
    en: 'Block {n} went to the honest chain. The gap is {gap}.',
    zh: '第 {n} 個區塊由誠實鏈找到，差距為 {gap}。',
  },
  raceAttacker: {
    en: 'Block {n} went to the attacker. The gap is {gap}.',
    zh: '第 {n} 個區塊由攻擊者找到，差距為 {gap}。',
  },
  raceCaught: {
    en: 'Caught up after {blocks}. This is the event that (q/p)^z measures.',
    zh: '{blocks}之後追上了。(q/p)^z 所量度的，正是這件事發生的概率。',
  },
  raceGaveUp: {
    en: 'After {blocks} the attacker is {gap} behind and gives up: his chance of even getting back to where he started is under 1 in 1,000.',
    zh: '{blocks}之後，攻擊者落後 {gap} 個，決定放棄：單是追回起點的差距，機會已不足千分之一。',
  },
  raceLevel: {
    en: 'With z = 0 the two chains are level before the first block: there is nothing to catch up.',
    zh: 'z = 0 時，兩條鏈在第一個區塊出現之前已經齊頭，毋須追趕。',
  },
  thousand: { en: 'Run 1,000 races', zh: '連跑 1,000 場' },
  thousandMore: { en: 'Run 1,000 more', zh: '再跑 1,000 場' },
  running: { en: 'Racing…', zh: '競賽中…' },
  tallyCaught: { en: 'Races in which he caught up', zh: '攻擊者追上的場數' },
  tallyNone: { en: 'no races run yet', zh: '尚未開跑' },
  tallyOf: { en: '{wins} of {races}', zh: '{races} 場中有 {wins} 場' },
  /* Read out once when a batch of races has been run. */
  tallyDone: { en: '{label}: {share}, {count}.', zh: '{label}：{share}，{count}。' },
  tallyTheory: { en: '`(q/p)^z`, what the races estimate', zh: '`(q/p)^z`：這些競賽所估計的數值' },
  tallyExpected: { en: 'about {n} in 1,000', zh: '每 1,000 場約 {n} 場' },
  tallyExpectedNone: { en: 'fewer than 1 in 1,000', zh: '每 1,000 場不足 1 場' },
  tallyPaper: { en: 'The paper’s P for the same `q` and `z`', zh: '相同的 `q` 和 `z` 之下，白皮書的 P' },
  difference: {
    en: 'Every race here starts with the attacker exactly z blocks behind, whereas the paper’s P also counts the blocks he may already have mined in secret while the merchant waited, which is why the two numbers differ and P is the larger.',
    zh: '這裏的每場競賽，都假定攻擊者起步時剛好落後 z 個區塊，而白皮書的 P 還計入商戶等待期間他可能已暗中挖出的區塊；所以兩個數字並不相同，而且 P 較大。',
  },
} satisfies Record<string, L<unknown> | Record<string, unknown>>;
