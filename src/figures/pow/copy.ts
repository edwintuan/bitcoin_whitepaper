import type { L } from '@/content/types';

/** Interface copy for the proof-of-work figure. */
export const COPY = {
  scenes: { en: 'Scene', zh: '場景' },
  sceneMine: { en: 'Mine', zh: '挖礦' },
  sceneTamper: { en: 'Tamper', zh: '篡改' },
  sceneGenesis: { en: 'Genesis block', zh: '創世區塊' },
  sceneRetarget: { en: 'Difficulty', zh: '難度調整' },

  /* ------------------------------------------------------------- header */
  headerCaption: { en: 'Block header · 80 bytes', zh: '區塊頭 · 80 位元組' },
  bytes: { en: 'bytes', zh: '位元組' },
  fields: {
    version: {
      name: { en: 'Version', zh: '版本' },
      note: { en: 'Which set of rules this block follows.', zh: '這個區塊依從哪一版規則。' },
    },
    prevHash: {
      name: { en: 'Previous block hash', zh: '上一個區塊的哈希' },
      note: {
        en: 'The link that makes this a chain: the hash of the block before.',
        zh: '把區塊連成鏈的那一環：上一個區塊的哈希。',
      },
    },
    merkleRoot: {
      name: { en: 'Merkle root', zh: '默克爾根' },
      note: {
        en: 'One hash that stands for every transaction in the block.',
        zh: '一個代表區塊內所有交易的哈希。',
      },
    },
    time: {
      name: { en: 'Time', zh: '時間' },
      note: {
        en: 'When the miner says the block was made, in seconds since 1970.',
        zh: '礦工聲稱的出塊時間，以 1970 年起計的秒數表示。',
      },
    },
    bits: {
      name: { en: 'Target (nBits)', zh: '目標值（nBits）' },
      note: {
        en: 'The target this block claims to meet, packed into four bytes.',
        zh: '這個區塊聲稱達到的目標值，壓縮成四個位元組。',
      },
    },
    nonce: {
      name: { en: 'Nonce', zh: '隨機數' },
      note: {
        en: 'The field a miner is free to change. Four bytes: about 4.3 billion values.',
        zh: '礦工可以隨意更改的欄位。四個位元組，約有 43 億個可能的值。',
      },
    },
  },
  fieldHint: {
    en: 'Point at a field, or move to it with Tab.',
    zh: '把指標移到欄位上，或按 Tab 逐一查看。',
  },
  realBlock: {
    en: 'This is the real header of block 1. Bitcoin asked for 32 zero bits there. Here you decide.',
    zh: '這是真實的第 1 號區塊的區塊頭。當年比特幣要求 32 個零位元；在這裏由你決定。',
  },
  doubleSha: { en: 'SHA-256, twice', zh: 'SHA-256，做兩次' },
  blockHash: { en: 'Block hash', zh: '區塊哈希' },
  noHashYet: { en: 'not mined yet', zh: '尚未開挖' },

  /* --------------------------------------------------------------- mine */
  zeroBits: { en: 'Required zero bits', zh: '所需零位元' },
  zeroBitsShort: { en: 'zero bits', zh: '個零位元' },
  target: { en: 'Target', zh: '目標值' },
  expected: { en: 'Expected tries', zh: '預期嘗試次數' },
  tries: { en: 'Tries', zh: '已嘗試' },
  rate: { en: 'Hashes per second', zh: '每秒哈希數' },
  mine: { en: 'Mine', zh: '挖礦' },
  mineAgain: { en: 'Mine again', zh: '再挖一次' },
  stop: { en: 'Stop', zh: '停止' },
  idle: {
    en: 'Press Mine. The nonce counts up from 0 until the hash is at or below the target.',
    zh: '按「挖礦」。隨機數會由 0 開始遞增，直到哈希不大於目標值。',
  },
  mining: { en: 'Mining…', zh: '正在挖礦…' },
  found: { en: 'Found.', zh: '找到了。' },
  foundDetail: {
    en: 'It took {tried} tries; the average is {expected}. Anyone can now check this block with a single hash.',
    zh: '這次試了 {tried} 次，平均需要 {expected} 次。現在任何人只需算一次哈希，便能驗證這個區塊。',
  },
  againNote: {
    en: 'Each new run moves the time forward by one second. That changes the header, so the search starts fresh, as miners do in practice.',
    zh: '每次重挖都把時間推後一秒。區塊頭因此改變，搜尋便重新開始；現實中的礦工也是這樣做的。',
  },
  lucky: { en: 'Luckier than average.', zh: '運氣比平均好。' },
  unlucky: { en: 'Unluckier than average.', zh: '運氣比平均差。' },

  /* -------------------------------------------------------------- tamper */
  tamperIntro: {
    en: 'Three blocks, each carrying the hash of the one before. Change what one of them says.',
    zh: '三個區塊，每個都帶着前一個區塊的哈希。試試改動其中一個的內容。',
  },
  blockN: { en: 'Block', zh: '區塊' },
  data: { en: 'data', zh: '內容' },
  dataLabel: { en: 'Data recorded in block', zh: '記錄在此區塊的內容' },
  valid: { en: 'valid', zh: '有效' },
  badHash: { en: 'hash above target', zh: '哈希高於目標值' },
  badLink: { en: 'cut off from the chain', zh: '已與鏈脫節' },
  remining: { en: 'redoing…', zh: '重挖中…' },
  repair: { en: 'Repair the chain', zh: '修復這條鏈' },
  startOver: { en: 'Start over', zh: '重新開始' },
  repairCost: { en: 'Hashes spent on repair', zh: '修復所耗的哈希次數' },
  blocksRedone: { en: 'Blocks redone', zh: '已重挖的區塊' },
  tamperUntouched: {
    en: 'All three blocks are valid. Edit the first one to see what a single change does.',
    zh: '三個區塊全部有效。改動第一個，看看一處改動會帶來甚麼後果。',
  },
  tamperBroken: {
    en: 'One edit broke {count} blocks. The edited one no longer meets its target, and every block after it is built on a hash that no longer exists.',
    zh: '一處改動令 {count} 個區塊失效：被改的那個不再達標，而其後每個區塊，都建立在一個已不存在的哈希之上。',
  },
  tamperRepaired: {
    en: 'Repaired, at the cost of redoing every block from the edit onward. On the real network everyone else kept adding blocks while you worked.',
    zh: '修好了，代價是把改動處及其後的每個區塊全部重挖。在真實網絡上，你忙着重挖的時候，其他人仍在不斷加上新區塊。',
  },
  samples: {
    en: ['Alice pays Bob 5', 'Bob pays Carol 2', 'Carol pays Dan 1'],
    zh: ['愛麗絲付給鮑勃 5', '鮑勃付給卡蘿 2', '卡蘿付給丹 1'],
  },

  /* ------------------------------------------------------------- genesis */
  genesisIntro: {
    en: 'The first block of the real chain, as every node stores it. Its one transaction carries a newspaper headline, “The Times 03/Jan/2009 Chancellor on brink of second bailout for banks”, which shows the block cannot have been made before that day.',
    zh: '真實鏈上的第一個區塊，每個節點儲存的就是這份數據。它唯一的一筆交易裏刻着一條報章標題：「The Times 03/Jan/2009 Chancellor on brink of second bailout for banks」，足以說明這個區塊不可能早於該日製造。',
  },
  hashIt: { en: 'Hash it', zh: '計算哈希' },
  bumpNonce: { en: 'Add 1 to the nonce', zh: '把隨機數加 1' },
  restore: { en: 'Restore', zh: '還原' },
  serialized: { en: 'The 80 bytes that get hashed', zh: '被計算哈希的 80 個位元組' },
  genesisPending: {
    en: 'Nothing has been computed yet. Press “Hash it” to run SHA-256 twice over these bytes, here in your browser.',
    zh: '尚未開始計算。按「計算哈希」，便會在你的瀏覽器裏對這些位元組連做兩次 SHA-256。',
  },
  genesisMatch: {
    en: 'Identical to the hash every Bitcoin node has stored since 2009, with {zeros} leading zero bits.',
    zh: '與所有比特幣節點自 2009 年起儲存的哈希完全一致，前導零位元共 {zeros} 個。',
  },
  genesisBroken: {
    en: 'One step of the nonce and the hash is unrecognisable, with only {zeros} leading zero bits. A node would reject this block at once.',
    zh: '隨機數只動了一格，哈希已面目全非，前導零位元只剩 {zeros} 個。節點會立即拒絕這個區塊。',
  },
  known: { en: 'Known genesis hash', zh: '公認的創世區塊哈希' },
  computed: { en: 'Computed here', zh: '此處算得' },

  /* ------------------------------------------------------------ retarget */
  retargetIntro: {
    en: 'Every 2,016 blocks the network looks at how long they took and resets the target so the next 2,016 take about two weeks.',
    zh: '每隔 2,016 個區塊，網絡便檢視這批區塊花了多久，然後重設目標值，令接下來的 2,016 個大約需時兩星期。',
  },
  power: { en: 'Hash power, against the level the difficulty expects', zh: '全網算力，相對於目前難度所預設的水平' },
  tooFast: { en: 'too fast', zh: '太快' },
  tooSlow: { en: 'too slow', zh: '太慢' },
  period: { en: 'Period', zh: '週期' },
  interval: { en: 'Time per block', zh: '平均出塊時間' },
  took: { en: '2,016 blocks took', zh: '2,016 個區塊耗時' },
  change: { en: 'Difficulty then changes by', zh: '難度隨後調整為' },
  minutes: { en: 'min', zh: '分鐘' },
  days: { en: 'days', zh: '日' },
  goal: { en: 'the 10-minute goal', zh: '10 分鐘的目標' },
  clamped: {
    en: 'One adjustment may not exceed a factor of four, so this takes more than one period to settle.',
    zh: '單次調整不得超過四倍，所以要多於一個週期才能回到正軌。',
  },
  settled: {
    en: 'A single adjustment brings blocks back to ten minutes apart.',
    zh: '調整一次，出塊間隔便回到十分鐘。',
  },
  steady: { en: 'Hash power matches the difficulty: nothing to adjust.', zh: '算力與難度相稱，無須調整。' },
} satisfies Record<string, L<unknown> | Record<string, unknown>>;
