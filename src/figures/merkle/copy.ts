import type { L } from '@/content/types';

/** Interface copy for the Merkle tree figure of section 7. */
export const COPY = {
  scenes: { en: 'Scene', zh: '場景' },
  sceneTree: { en: 'Merkle tree', zh: '默克爾樹' },
  sceneStorage: { en: 'Header storage', zh: '區塊頭的大小' },

  /* ---------------------------------------------------------------- tree */
  treeLabel: {
    en: 'The block’s Merkle tree: its transactions along the bottom, the Merkle root on top.',
    zh: '這個區塊的默克爾樹：交易排在底層，默克爾根在頂端。',
  },
  header: { en: 'Block header', zh: '區塊頭' },
  headerBytes: { en: '80 bytes', zh: '80 位元組' },
  root: { en: 'Merkle root', zh: '默克爾根' },
  pending: { en: 'not hashed yet', zh: '尚未算出' },

  txCount: { en: 'Transactions', zh: '交易數目' },
  addTx: { en: 'Add a transaction', zh: '加一筆交易' },
  removeTx: { en: 'Remove the last transaction', zh: '移除最後一筆交易' },
  play: { en: 'Play', zh: '播放' },
  nextLevel: { en: 'Next level', zh: '下一層' },

  spent: { en: 'spent', zh: '已花費' },
  copy: { en: 'copy', zh: '副本' },
  leafUnspent: { en: '{name}, unspent. Press to mark it as spent.', zh: '{name}，未花費。按下可標記為已花費。' },
  leafSpent: { en: '{name}, marked as spent. Press to unmark it.', zh: '{name}，已標記為已花費。按下可取消標記。' },
  leafStub: { en: '{name}: pruned. Only its hash is kept.', zh: '{name}：已修剪，只保留它的哈希。' },
  leafGone: { en: '{name}: pruned away with its branch.', zh: '{name}：已隨所屬分支一併剪走。' },
  nodeCopy: { en: 'A copy of the hash beside it, to pair it with.', zh: '旁邊那個哈希的副本，用來與它配對。' },
  nodeStub: { en: 'A hash kept in place of the branch below it.', zh: '留下來頂替底下整條分支的哈希。' },
  nodeGone: { en: 'Pruned away.', zh: '已剪走。' },

  prune: { en: 'Prune', zh: '修剪' },
  startOver: { en: 'Start over', zh: '重新開始' },

  legend: { en: 'What the boxes mean', zh: '圖例' },
  legendTx: { en: 'transaction on disk', zh: '磁碟上的交易' },
  legendHash: { en: 'hash, recomputed when needed', zh: '哈希，需要時重新計算' },
  legendStub: { en: 'hash kept in place of a pruned branch', zh: '留下來頂替被剪分支的哈希' },
  legendGone: { en: 'pruned away', zh: '已剪走' },

  statKept: { en: 'Transactions on disk', zh: '磁碟上的交易' },
  statStubs: { en: 'Hashes kept in their place', zh: '頂替它們的哈希' },
  statGone: { en: 'Hashes dropped', zh: '丟棄的哈希' },
  oneHash: { en: '1 hash', zh: '1 個哈希' },
  hashes: { en: '{n} hashes', zh: '{n} 個哈希' },

  rootInHeader: { en: 'Root in the block header', zh: '區塊頭內的默克爾根' },
  rootAgain: { en: 'Recomputed from what is left', zh: '以餘下的數據重新計算' },
  identical: { en: 'identical', zh: '完全相同' },

  building: {
    en: 'Level {level} of {levels}: each pair of hashes is joined and hashed with double SHA-256.',
    zh: '第 {level} 層（共 {levels} 層）：每一對哈希相連，再計算雙重 SHA-256。',
  },
  buildingOdd: {
    en: 'Level {level} of {levels}: the last hash has no partner, so it is paired with a copy of itself.',
    zh: '第 {level} 層（共 {levels} 層）：最後一個哈希沒有配對的對象，便與自己的副本配對。',
  },
  buildingLeaves: {
    en: 'Level 1 of {levels}: the hash of each transaction. These are the leaves.',
    zh: '第 1 層（共 {levels} 層）：每筆交易各自的哈希，也就是樹的葉節點。',
  },
  idle: {
    en: 'Press a transaction to mark it as spent. Nothing is removed until you press Prune.',
    zh: '按下任何一筆交易，把它標記為已花費。未按「修剪」之前，甚麼都不會刪除。',
  },
  idleOdd: {
    en: 'An odd count: the last hash is paired with a copy of itself, as Bitcoin does. Press a transaction to mark it as spent.',
    zh: '數目是單數：最後一個哈希與自己的副本配對，比特幣正是這樣做的。按下任何一筆交易，把它標記為已花費。',
  },
  marked: {
    en: '{n} of {total} marked as spent. Press Prune to drop every branch whose transactions are all spent.',
    zh: '{total} 筆交易中，有 {n} 筆已標記為已花費。按「修剪」，把底下交易全部已花費的分支剪走。',
  },
  markedMore: {
    en: '{n} more marked as spent since the last pruning. Press Prune again.',
    zh: '上次修剪之後，再有 {n} 筆交易標記為已花費。請再按一次「修剪」。',
  },
  pruned: {
    en: 'Gone from disk: {dropped} of {total} transactions. Standing in for them: {stubs}, at 32 bytes a hash. The root recomputed from what is left is identical, so the block hash still holds.',
    zh: '{total} 筆交易中，有 {dropped} 筆已從磁碟刪除，由 {stubs}（每個 32 位元組）頂替。以餘下的數據重新計算，默克爾根完全相同，區塊哈希因而依然成立。',
  },
  prunedAll: {
    en: 'Every transaction was spent, so nothing of the block is left but its 80-byte header. Its hash is unchanged, and the chain still links.',
    zh: '所有交易都已花費，整個區塊只剩下 80 位元組的區塊頭。它的哈希沒有改變，鏈依然環環相扣。',
  },
  prunedLocked: {
    en: 'A pruned block cannot take new transactions. Start over to change it.',
    zh: '已修剪的區塊不能再加入交易。如要更改，請先重新開始。',
  },

  /* ------------------------------------------------------------- storage */
  storageIntro: {
    en: 'Whatever else is pruned, the header has to stay. Here is one, byte for byte, and the paper’s arithmetic for a year of them.',
    zh: '無論剪掉甚麼，區塊頭都必須保留。以下是一個區塊頭的全部位元組，以及白皮書為一年的區塊頭所做的算術。',
  },
  oneHeader: { en: 'One block header · 80 bytes', zh: '一個區塊頭 · 80 位元組' },
  fields: {
    version: { en: 'Version', zh: '版本' },
    prevHash: { en: 'Previous block hash', zh: '上一個區塊的哈希' },
    merkleRoot: { en: 'Merkle root', zh: '默克爾根' },
    time: { en: 'Time', zh: '時間' },
    bits: { en: 'Target (nBits)', zh: '目標值（nBits）' },
    nonce: { en: 'Nonce', zh: '隨機數' },
  },
  fieldHint: {
    en: 'Point at a field, tap it, or move to it with Tab. The Merkle root is the only place the transactions appear.',
    zh: '把指標移到欄位上、輕觸欄位，或按 Tab 逐一查看。交易只會以默克爾根的形式在這裏出現。',
  },
  bytes: { en: 'bytes', zh: '位元組' },
  interval: { en: 'Minutes between blocks', zh: '出塊間隔（分鐘）' },
  minutes: { en: 'min', zh: '分鐘' },
  factorBytes: { en: 'bytes a header', zh: '每個區塊頭的位元組' },
  factorHour: { en: 'blocks an hour', zh: '每小時的區塊' },
  factorDay: { en: 'hours a day', zh: '每日的小時' },
  factorYear: { en: 'days a year', zh: '每年的日數' },
  perYear: { en: 'MB a year', zh: 'MB／年' },
  headersYear: { en: 'Headers in a year', zh: '一年的區塊頭數目' },
  bytesYear: { en: 'Bytes in a year', zh: '一年的位元組' },
  tenYears: { en: 'Ten years of headers', zh: '十年的區塊頭' },
  megabytes: { en: 'MB', zh: 'MB' },
  storagePaper: {
    en: 'Ten minutes is the paper’s figure: 80 × 6 × 24 × 365 bytes, about 4.2 MB a year. That is about one block at its largest: the weight limit keeps a block just under 4 MB.',
    zh: '十分鐘正是白皮書採用的數字：80 × 6 × 24 × 365 位元組，每年約 4.2 MB，大約相當於一個最大的區塊：按重量上限計算，一個區塊最大略低於 4 MB。',
  },
  storageOther: {
    en: 'With a block every {minutes} min: {megabytes} MB of headers a year, about {blocks} times the largest block the rules allow.',
    zh: '若每 {minutes} 分鐘出一個區塊：每年的區塊頭共 {megabytes} MB，約為規則容許的最大區塊的 {blocks} 倍。',
  },
} satisfies Record<string, L<unknown> | Record<string, unknown>>;
