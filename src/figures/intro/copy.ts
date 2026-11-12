import type { L } from '@/content/types';

/** The serial number printed on the one coin of the second scene. Every copy carries it. */
export const COIN_SERIAL = '0042';

/** Interface copy for the trust figure. */
export const COPY = {
  scenes: { en: 'Scene', zh: '場景' },
  sceneBank: { en: 'With a bank', zh: '經銀行付款' },
  sceneCopy: { en: 'Spend it twice', zh: '一幣兩花' },

  /* ------------------------------------------------------- with a bank */
  bankIntro: {
    en: 'One purchase, paid for in two ways: through a bank, and in cash.',
    zh: '同一宗買賣，兩種付款方法：經銀行轉賬，以及用現金。',
  },
  routeBank: { en: 'Through a bank', zh: '經銀行轉賬' },
  routeDirect: { en: 'Hand to hand', zh: '親手交收' },
  customer: { en: 'Customer', zh: '顧客' },
  bank: { en: 'Bank', zh: '銀行' },
  bankFee: { en: 'fee', zh: '收費' },
  merchant: { en: 'Merchant', zh: '商戶' },
  goodsKept: { en: 'goods in stock', zh: '貨物未交' },
  goodsSent: { en: 'goods sent', zh: '貨已交出' },
  ledger: { en: 'The bank’s ledger', zh: '銀行的賬簿' },
  ledgerEmpty: { en: 'Nothing recorded yet.', zh: '尚無記錄。' },
  noLedger: { en: 'No ledger', zh: '沒有賬簿' },
  noLedgerNote: {
    en: 'Nobody writes anything down, and nobody stands between the two.',
    zh: '沒有人記賬，兩人之間也沒有任何人。',
  },
  entry: {
    payment: { en: 'Customer pays merchant', zh: '顧客付款給商戶' },
    fee: { en: 'Fee kept by the bank', zh: '銀行收取手續費' },
    reversal: { en: 'Reversed after a dispute', zh: '因爭議而撤銷' },
  },
  pay: { en: 'Pay {amount}', zh: '付款 {amount}' },
  dispute: { en: 'Dispute', zh: '提出爭議' },
  startOver: { en: 'Start over', zh: '重新開始' },
  bankStatus: {
    idle: {
      en: 'Press Pay. The bank will move the money from one account to the other.',
      zh: '按「付款」。銀行會把錢由一個戶口轉到另一個戶口。',
    },
    paid: {
      en: 'Paid. The bank recorded it and kept {fee} for standing in the middle. The merchant sends the goods.',
      zh: '已付款。銀行記了賬，並因居中處理而收取 {fee}。商戶把貨物交出。',
    },
    reversed: {
      en: 'Reversed. The bank sided with the customer and struck out its own entries. The goods are gone and the merchant holds nothing.',
      zh: '付款已被撤銷。銀行站在顧客一方，把自己記下的賬目一筆勾銷。貨物已經交出，商戶兩手空空。',
    },
  },
  directStatus: {
    idle: { en: 'Press Pay. The banknote changes hands.', zh: '按「付款」。鈔票隨即易手。' },
    paid: {
      en: 'Paid in full, with no fee and no record. Now try to dispute it.',
      zh: '全數付清，分文不扣，也沒有留下記錄。現在試試提出爭議。',
    },
    refused: {
      en: 'There is nobody to appeal to. The banknote has changed hands and stays where it is.',
      zh: '沒有人可以受理。鈔票已經易手，不會回頭。',
    },
  },
  bankOutro: {
    en: 'Cash settles at once and needs nobody in the middle, but only face to face. The paper wants the same thing over a network.',
    zh: '現金即時兩清，毋須任何人居中，卻只限當面交收。白皮書要的，是在網絡上做到同一件事。',
  },

  /* ----------------------------------------------------- spend it twice */
  copyIntro: {
    en: 'Online there is no banknote to hand over. A digital coin is a file, and sending a file does not use it up.',
    zh: '在網上，沒有鈔票可以遞過去。電子貨幣是一個檔案，而檔案發了出去，自己手上依然還有。',
  },
  payer: { en: 'Alice · payer', zh: '愛麗絲 · 付款人' },
  payee: {
    first: { en: 'Bob · payee', zh: '鮑勃 · 收款人' },
    second: { en: 'Carol · payee', zh: '卡蘿 · 收款人' },
  },
  name: {
    first: { en: 'Bob', zh: '鮑勃' },
    second: { en: 'Carol', zh: '卡蘿' },
  },
  coin: { en: 'Coin', zh: '幣' },
  keeps: { en: 'Still has the file after every send.', zh: '每次發出之後，檔案仍在她手上。' },
  sendTo: { en: 'Send to {name}', zh: '發給{name}' },
  result: {
    none: { en: 'no coin yet', zh: '尚未收到' },
    accepted: { en: 'accepted', zh: '已收下' },
    refused: { en: 'refused', zh: '被拒絕' },
  },
  mintSwitch: { en: 'Add a mint that checks every coin', zh: '加入鑄幣廠，逐一檢查每枚幣' },
  mint: { en: 'Mint', zh: '鑄幣廠' },
  mintTask: { en: 'checks every coin against its list', zh: '按名單檢查每一枚幣' },
  mintEmpty: { en: 'No coin spent yet.', zh: '尚未有幣被花掉。' },
  mintSpent: { en: 'Coin {serial}: spent, paid to {name}.', zh: '第 {serial} 號幣：已花，付給了{name}。' },
  mintAsked: { en: 'Payments that had to ask the mint: {count}', zh: '須經鑄幣廠查核的付款：{count} 筆' },
  coinStatus: {
    ready: {
      en: 'Alice holds one coin. Send it to Bob, then send it to Carol as well.',
      zh: '愛麗絲有一枚幣。先把它發給鮑勃，再發給卡蘿。',
    },
    once: {
      en: '{name} has the coin. So does Alice: she sent a copy and kept the file.',
      zh: '{name}收到了這枚幣。愛麗絲手上也還有：她發出的只是副本，檔案仍然留着。',
    },
    twice: {
      en: 'Both payees hold a perfect copy of the same coin. Neither can tell, and nothing stopped it. This is double-spending.',
      zh: '兩位收款人各自拿着同一枚幣的完美副本。誰也看不出問題，也沒有任何東西加以阻止。這就是雙重支付。',
    },
    mintReady: {
      en: 'The mint is on. No payee accepts a coin until the mint has checked it. Send the coin to both payees.',
      zh: '鑄幣廠已啟用。未經鑄幣廠檢查，收款人不會收下任何幣。把這枚幣發給兩位收款人。',
    },
    mintOnce: {
      en: 'The mint had not seen this coin before, so {name} is paid, and the mint writes the coin down as spent.',
      zh: '鑄幣廠之前沒有見過這枚幣，所以{name}順利收款，鑄幣廠同時把這枚幣記為已花。',
    },
    mintRefused: {
      en: 'Refused: the mint has this coin down as spent. The double spend is stopped, but every payment now has to pass through one mint, and the whole system stands or falls with it.',
      zh: '被拒絕：在鑄幣廠的名單上，這枚幣已經花掉。雙重支付被攔下了，但從此每筆付款都要經過同一家鑄幣廠，整個體系的存亡也繫於它一身。',
    },
  },
  copyOutro: {
    en: 'What the paper asks next is whether payees can be just as sure with no mint at all.',
    zh: '白皮書接下來要問的，是沒有了鑄幣廠，收款人能否同樣放心。',
  },
} satisfies Record<string, L<unknown> | Record<string, unknown>>;
