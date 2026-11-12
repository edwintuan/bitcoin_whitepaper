import type { L } from '@/content/types';

/** Interface copy for the privacy figure. */
export const COPY = {
  scenes: { en: 'Scene', zh: '場景' },
  sceneModels: { en: 'The two models', zh: '兩種模式' },
  sceneObserver: { en: 'What an observer can link', zh: '觀察者能關聯甚麼' },

  /* -------------------------------------------------------------- models */
  modelLabel: { en: 'Privacy model', zh: '私隱模式' },
  traditional: { en: 'Traditional model', zh: '傳統模式' },
  modern: { en: 'New model', zh: '新模式' },
  boxes: {
    identities: { en: 'Identities', zh: '身份' },
    transactions: { en: 'Transactions', zh: '交易' },
    // Broken where the paper breaks it.
    thirdParty: { en: 'Trusted\nthird party', zh: '可信第三方' },
    counterparty: { en: 'Counterparty', zh: '交易對手' },
    public: { en: 'Public', zh: '公眾' },
  },
  wall: { en: 'wall', zh: '屏障' },
  flowTraditional: {
    en: 'Traditional model: identities, transactions, the trusted third party and the counterparty are all behind a wall. The public is on the other side and sees none of them.',
    zh: '傳統模式：身份、交易、可信第三方和交易對手全在屏障之後；公眾在屏障的另一邊，甚麼都看不到。',
  },
  flowModern: {
    en: 'New model: the wall stands between identities and transactions. Transactions flow to the public; identities stay behind.',
    zh: '新模式：屏障設在身份與交易之間。交易流向公眾，身份則留在屏障之後。',
  },
  onePayment: { en: 'One payment, as each side of the wall sees it', zh: '同一筆付款，在屏障兩邊各自看到的樣子' },
  behind: { en: 'Kept behind the wall', zh: '留在屏障之後' },
  inPublic: { en: 'What the public can read', zh: '公眾讀得到的' },
  bankRecord: { en: 'Alice pays Bob {amount} at {time}', zh: '愛麗絲在 {time} 向鮑勃支付 {amount}' },
  bankNote: {
    en: 'Names, amount and time: known to Alice, to Bob and to the bank.',
    zh: '姓名、金額、時間：只有愛麗絲、鮑勃和銀行知道。',
  },
  publicNothing: { en: 'nothing', zh: '甚麼也沒有' },
  publicNothingNote: { en: 'No payment is shown to the public at all.', zh: '公眾完全看不到這筆付款。' },
  ownerRecord: { en: '{address} is Alice’s', zh: '{address} 屬於愛麗絲' },
  ownerNote: {
    en: 'The only thing kept back is which person holds which key.',
    zh: '藏起來的只有一件事：哪把密鑰在哪個人手上。',
  },
  tapeNote: {
    en: 'Announced to everyone, like the tape of a stock exchange: time and size, no names.',
    zh: '向所有人公佈，一如證券交易所的行情紙帶：有時間和數額，沒有姓名。',
  },
  statusTraditional: {
    en: 'The wall stands in front of the public. Identities and transactions both stay with the parties and the bank.',
    zh: '屏障設在公眾面前。身份和交易都留在交易雙方與銀行那一邊。',
  },
  statusModern: {
    en: 'The wall has moved between identities and transactions. The payment is public; who made it is not.',
    zh: '屏障移到了身份與交易之間。付款是公開的，付款的是誰卻不是。',
  },

  /* ------------------------------------------------------------ observer */
  observerIntro: {
    en: 'Alice’s six transactions as the public ledger shows them. An observer has learned one thing: the address tagged with her name is hers.',
    zh: '公開賬本上所見的愛麗絲六筆交易。觀察者只掌握一件事：標着她名字的那個地址屬於她。',
  },
  reuse: { en: 'Reuse one address', zh: '重用同一個地址' },
  reuseNote: {
    en: 'When on, every coin, change included, is received at the same address.',
    zh: '開啟後，每一枚幣，包括找續，都由同一個地址收取。',
  },
  combine: { en: 'Combine coins in one payment', zh: '在一筆付款中合併多枚幣' },
  combineNote: {
    en: 'When on, her first bill is larger than any coin she holds, so her wallet has to spend three together.',
    zh: '開啟後，她的第一張賬單比手上任何一枚幣都大，錢包只好把三枚幣一併花掉。',
  },
  tied: { en: 'Transactions the observer can tie to Alice', zh: '觀察者能歸到愛麗絲名下的交易' },
  ofSix: { en: 'of 6', zh: '／6' },
  hers: { en: 'Addresses known to be hers', zh: '已知屬於她的地址' },
  ofTotal: { en: '{n} of {total}', zh: '{total} 個中的 {n} 個' },
  known: { en: 'Alice', zh: '愛麗絲' },
  legend: {
    tx: { en: 'transaction', zh: '交易' },
    address: { en: 'address, by its last characters', zh: '地址（只顯示末尾幾個字元）' },
    tied: { en: 'tied to Alice', zh: '已歸到愛麗絲名下' },
    joined: { en: 'spent together', zh: '一併花掉' },
  },
  ledger: { en: 'The six, as Alice knows them', zh: '愛麗絲自己所知的這六筆交易' },
  parties: {
    employer: { en: 'from her employer', zh: '僱主付來' },
    client: { en: 'from a client', zh: '客戶付來' },
    friend: { en: 'from a friend', zh: '朋友付來' },
    shop: { en: 'to a shop', zh: '付給商店' },
    landlord: { en: 'to her landlord', zh: '付給房東' },
    cafe: { en: 'to a café', zh: '付給咖啡店' },
  },
  isTied: { en: 'tied to her', zh: '已歸到她名下' },
  notTied: { en: 'not tied to her', zh: '未歸到她名下' },
  coins: { en: '{count} coins', zh: '{count} 枚幣' },
  graphAlt: {
    en: 'The public ledger drawn as a graph: six transactions and the addresses they spend from and pay to. The observer can tie {count} of the six to Alice: {list}.',
    zh: '把公開賬本畫成圖：六筆交易，以及它們所動用和付往的地址。觀察者能把其中 {count} 筆歸到愛麗絲名下：{list}。',
  },
  txNumber: { en: 'transaction {n}', zh: '第 {n} 筆' },
  status: {
    fresh: {
      en: 'With a new address for every coin, knowing one address exposes that coin alone: where it came from and where it went. Nothing ties the other four transactions to her.',
      zh: '每枚幣都用新地址時，知道其中一個地址，只會暴露那一枚幣的來歷和去向。其餘四筆交易，沒有任何東西能把它們和她連上。',
    },
    combine: {
      en: 'Transaction 4 spends from three addresses at once, so all three must have one owner. The observer now knows that transactions 1, 2 and 3 were paid to her.',
      zh: '第 4 筆交易同時動用三個地址上的幣，可見三個地址同屬一人。觀察者由此知道，第 1、2、3 筆交易都是付給她的。',
    },
    reuse: {
      en: 'One address appears in all six transactions. Whoever knows it is hers knows everything she received and everything she paid.',
      zh: '同一個地址出現在全部六筆交易之中。誰知道它屬於她，誰就知道她收過甚麼、付過甚麼。',
    },
    both: {
      en: 'Reuse has already joined everything. Spending three coins together tells the observer nothing new.',
      zh: '重用地址已經把一切連在一起；一併花掉三枚幣，並沒有讓觀察者多知道甚麼。',
    },
  },

  /* ------------------------------------------------------- address panel */
  panel: { en: 'From public key to address', zh: '由公鑰到地址' },
  newKey: { en: 'New key', zh: '換一把新密鑰' },
  nextStep: { en: 'Next step', zh: '下一步' },
  pending: { en: 'not computed yet', zh: '尚未計算' },
  rows: {
    pub: {
      name: { en: 'Public key', zh: '公鑰' },
      note: { en: '33 bytes: a point on the curve, compressed', zh: '33 位元組：橢圓曲線的一個點，壓縮格式' },
    },
    sha: {
      name: { en: 'SHA-256 of the key', zh: '公鑰的 SHA-256' },
      note: { en: '32 bytes', zh: '32 位元組' },
    },
    ripemd: {
      name: { en: 'RIPEMD-160 of that', zh: '再計 RIPEMD-160' },
      note: { en: '20 bytes: the HASH160 of the key', zh: '20 位元組，即公鑰的 HASH160' },
    },
    address: {
      name: { en: 'Address', zh: '地址' },
      note: { en: 'those 20 bytes in Bech32, a form made for copying', zh: '把這 20 個位元組寫成 Bech32，方便抄寫' },
    },
  },
  legacy: { en: 'The same 20 bytes in the older Base58Check form', zh: '同樣的 20 個位元組，寫成較舊的 Base58Check 形式' },
  panelDone: {
    en: 'A different key gives a different address, and nothing in either address says who holds the key.',
    zh: '密鑰不同，地址便不同；而地址本身並沒有透露密鑰在誰手上。',
  },
} satisfies Record<string, L<unknown> | Record<string, unknown>>;
