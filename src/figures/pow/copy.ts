import type { L } from '@/content/types';

/** Interface copy for the proof-of-work figure. */
export const COPY = {
  scenes: { en: 'Scene', zh: '場景' },
  // Four of these share a row 294 px wide on a small phone: one word each.
  sceneMine: { en: 'Mine', zh: '挖礦' },
  sceneTamper: { en: 'Tamper', zh: '篡改' },
  sceneGenesis: { en: 'Genesis', zh: '創世區塊' },
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
      name: { en: 'Previous block hash', zh: '上一區塊哈希' },
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
        en: 'When the miner says the block was made, stored as seconds since 1970.',
        zh: '礦工聲稱的出塊時間，以 1970 年起計的秒數儲存。',
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
    en: 'Point at a field, tap it, or move to it with Tab.',
    zh: '把指標移到欄位上、輕觸欄位，或按 Tab 逐一查看。',
  },
  realBlock: {
    en: 'Block 1’s header, with the target replaced by the one you set and the nonce counting again from 0. Bitcoin asked for 32 zero bits there.',
    zh: '這是第 1 號區塊的區塊頭，只是目標值換成由你設定，隨機數亦由 0 重新數起。當年比特幣要求 32 個零位元。',
  },
  doubleSha: { en: 'SHA-256, twice', zh: 'SHA-256，做兩次' },
  blockHash: { en: 'Block hash', zh: '區塊哈希' },
  noHashYet: { en: 'not mined yet', zh: '尚未開挖' },

  /* --------------------------------------------------------------- mine */
  zeroBits: { en: 'Required zero bits', zh: '所需零位元' },
  zeroTag: { en: '{zeros} zero bits · {needed} needed', zh: '{zeros} 個零位元 · 需要 {needed} 個' },
  hexNote: {
    en: 'One hex digit is four bits, so a hash with {bits} zero bits starts {zeros}.',
    zh: '一個十六進制數字是四個位元，所以有 {bits} 個零位元的哈希以 {zeros} 開頭。',
  },
  hexNoteMore: {
    en: 'One hex digit is four bits, so a hash with {bits} zero bits starts {zeros}, then a digit no higher than {max}.',
    zh: '一個十六進制數字是四個位元，所以有 {bits} 個零位元的哈希以 {zeros} 開頭，而且下一個數字不大於 {max}。',
  },
  target: { en: 'Target', zh: '目標值' },
  expected: { en: 'Expected tries', zh: '預期嘗試次數' },
  tries: { en: 'Tries', zh: '已嘗試' },
  rate: { en: 'Hashes per second', zh: '每秒哈希數' },
  wait: { en: 'Average wait at this speed', zh: '以此速度平均需時' },
  seconds: { en: 's', zh: '秒' },
  hours: { en: 'h', zh: '小時' },
  under: { en: 'under {wait}', zh: '不足 {wait}' },
  mine: { en: 'Mine', zh: '挖礦' },
  mineAgain: { en: 'Mine again', zh: '再挖一次' },
  stop: { en: 'Stop', zh: '停止' },
  idle: {
    en: 'Press Mine. The nonce counts up from 0 until the hash is at or below the target.',
    zh: '按「挖礦」。隨機數會由 0 開始遞增，直到哈希不大於目標值。',
  },
  mining: { en: 'Mining…', zh: '正在挖礦…' },
  found: { en: 'Found.', zh: '找到了。' },
  foundTries: {
    en: 'It took {tried} tries; the average is {expected}.',
    zh: '這次試了 {tried} 次，平均需要 {expected} 次。',
  },
  lucky: { en: 'Luckier than average.', zh: '運氣比平均好。' },
  unlucky: { en: 'Unluckier than average.', zh: '運氣比平均差。' },
  foundCheck: {
    en: 'Anyone can now check this block with a single hash.',
    zh: '現在任何人只需算一次哈希，便能驗證這個區塊。',
  },
  againNote: {
    en: 'Each new run moves the time forward by one second. That changes the header, so the search starts fresh, as miners do in practice.',
    zh: '每次重挖都把時間推後一秒。區塊頭因此改變，搜尋便重新開始；現實中的礦工也是這樣做的。',
  },

  /* -------------------------------------------------------------- tamper */
  tamperIntro: {
    en: 'Three blocks, each carrying the hash of the one before. Change what one of them says.',
    zh: '三個區塊，每個都帶着前一個區塊的哈希。試試改動其中一個的內容。',
  },
  blockN: { en: 'Block', zh: '區塊' },
  dataLabel: { en: 'Data recorded in block', zh: '記錄在此區塊的內容' },
  valid: { en: 'valid', zh: '有效' },
  // Shown in a tile about 150 px wide: three short words at most. Core's own word for it is `high-hash`.
  badHash: { en: 'hash too high', zh: '哈希過高' },
  badLink: { en: 'cut off', zh: '已脫節' },
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
    en: '{count} blocks are broken. An edited block no longer meets its target, and every block after it is built on a hash that no longer exists.',
    zh: '{count} 個區塊失效：被改的區塊不再達標，而其後每個區塊，都建立在一個已不存在的哈希之上。',
  },
  tamperAlone: {
    en: 'One block is broken: the edited one no longer meets its target. No block comes after it, so the damage stops there.',
    zh: '一個區塊失效：被改的那個不再達標。其後再無其他區塊，損壞到此為止。',
  },
  tamperLucky: {
    en: 'By chance the edited block still meets its target: about one edit in {odds} does. Its hash has changed all the same, so what was built on the old one is cut off.',
    zh: '被改的區塊碰巧仍然達標，大約每 {odds} 次改動才有一次。但它的哈希已經不同，建立在舊哈希之上的區塊照樣脫節。',
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
  hashAgain: { en: 'Hash it again', zh: '再算一次' },
  bumpNonce: { en: 'Add 1 to the nonce', zh: '把隨機數加 1' },
  restore: { en: 'Restore', zh: '還原' },
  nonceNow: { en: 'Nonce', zh: '隨機數' },
  serialized: { en: 'The 80 bytes that get hashed', zh: '用來計算哈希的 80 個位元組' },
  genesisPending: {
    en: 'Nothing has been computed yet. Press “Hash it” to run SHA-256 twice over these bytes, here in your browser.',
    zh: '尚未開始計算。按「計算哈希」，便會在你的瀏覽器裏對這些位元組連做兩次 SHA-256。',
  },
  genesisMatch: {
    en: 'Identical to the hash every Bitcoin node has stored since 2009, with {zeros} leading zero bits. Bitcoin prints a hash with its bytes reversed, which is why the zeros come first.',
    zh: '與所有比特幣節點自 2009 年起儲存的哈希完全一致，前導零位元共 {zeros} 個。比特幣顯示哈希時會把位元組次序倒轉，所以零排在最前。',
  },
  genesisBroken: {
    en: 'One step of the nonce and the hash is unrecognisable: it does not begin with a single zero bit. A node would reject this block at once.',
    zh: '隨機數只動了一格，哈希已面目全非，開頭連一個零位元也沒有。節點會立即拒絕這個區塊。',
  },
  known: { en: 'Known genesis hash', zh: '公認的創世區塊哈希' },
  computed: { en: 'Computed here', zh: '此處算得' },

  /* ------------------------------------------------------------ retarget */
  retargetIntro: {
    en: 'Every 2,016 blocks the network looks at how long they took and resets the difficulty so the next 2,016 take about two weeks, ten minutes a block.',
    zh: '每隔 2,016 個區塊，網絡便檢視這批區塊花了多久，然後重設難度，令接下來的 2,016 個大約需時兩星期，即每個區塊十分鐘。',
  },
  power: { en: 'Hash power, against the level the difficulty expects', zh: '全網算力，相對於目前難度所預設的水平' },
  powerValue: { en: '{times} times', zh: '{times} 倍' },
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
    en: 'Hash power is {times} times what the difficulty expects. One adjustment may not exceed a factor of four, so this takes more than one period to settle.',
    zh: '算力是難度所預設的 {times} 倍。單次調整不得超過四倍，所以要多於一個週期才能回到正軌。',
  },
  settled: {
    en: 'Hash power is {times} times what the difficulty expects. A single adjustment brings blocks back to ten minutes apart.',
    zh: '算力是難度所預設的 {times} 倍。調整一次，出塊間隔便回到十分鐘。',
  },
  steady: { en: 'Hash power matches the difficulty: nothing to adjust.', zh: '算力與難度相稱，無須調整。' },
} satisfies Record<string, L<unknown> | Record<string, unknown>>;
