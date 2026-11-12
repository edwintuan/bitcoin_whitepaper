import type { L } from '@/content/types';

/** Interface copy for the wallet figure of section 9. */
export const COPY = {
  /* -------------------------------------------------------------- wallet */
  wallet: { en: 'Your wallet', zh: '你的錢包' },
  coins: { en: '{n} coins', zh: '{n} 枚幣' },
  oneCoin: { en: '1 coin', zh: '1 枚幣' },
  balance: { en: 'You can spend', zh: '可動用的總額' },
  walletLabel: {
    en: 'The coins in your wallet. Press one to choose it as an input, or to leave it out.',
    zh: '你錢包內的幣。按下任何一枚，可把它選為輸入，或從輸入中剔除。',
  },
  coin: { en: 'A coin of {value} BTC', zh: '一枚 {value} BTC 的幣' },
  coinNew: { en: 'A coin of {value} BTC, just received as change', zh: '一枚 {value} BTC 的幣，剛作為找續收到' },
  newCoin: { en: 'change', zh: '找續' },
  empty: {
    en: 'Every coin has been spent. Reset the wallet to start again.',
    zh: '所有幣都已花掉。請重設錢包，重新開始。',
  },
  theirs: { en: 'Bob now holds', zh: '鮑勃現時持有' },
  chooser: { en: 'Coins chosen by', zh: '負責選幣的是' },
  chooserWallet: { en: 'the wallet', zh: '錢包' },
  chooserYou: { en: 'you', zh: '你自己' },
  letWallet: { en: 'Let the wallet choose', zh: '交回錢包挑選' },

  /* ----------------------------------------------------------------- pay */
  amount: { en: 'Amount to pay Bob, in BTC', zh: '付給鮑勃的金額（BTC）' },
  unit: { en: 'BTC', zh: 'BTC' },
  quick: { en: 'Try', zh: '試試' },
  special: { en: 'Special cases', zh: '特殊情況' },
  exact: { en: 'No change', zh: '剛好不用找續' },
  dust: { en: 'Change too small', zh: '找續太少' },
  tooMuch: { en: 'More than you hold', zh: '超出所持' },
  badAmount: {
    en: 'Enter an amount in BTC, such as 0.15, with at most eight decimal places.',
    zh: '請輸入以 BTC 計的金額，例如 0.15，小數點後最多八位。',
  },

  /* --------------------------------------------------------- transaction */
  tx: { en: 'Transaction', zh: '交易' },
  txLabel: {
    en: 'The transaction your wallet would build: inputs on the left, outputs on the right.',
    zh: '錢包將會組出的交易：左邊是輸入，右邊是輸出。',
  },
  txId: { en: 'id', zh: 'ID' },
  inputs: { en: 'In', zh: '輸入' },
  outputs: { en: 'Out', zh: '輸出' },
  fromCoin: { en: 'your coin', zh: '你的幣' },
  toBob: { en: 'to Bob', zh: '付給鮑勃' },
  toYou: { en: 'back to you', zh: '回到你手上' },
  payment: { en: 'payment', zh: '付款' },
  change: { en: 'change', zh: '找續' },
  noChange: { en: 'no change output', zh: '沒有找續輸出' },
  totalIn: { en: 'Inputs', zh: '輸入總額' },
  totalOut: { en: 'Outputs', zh: '輸出總額' },
  fee: { en: 'Fee', zh: '手續費' },
  feeTo: { en: 'left for the miner', zh: '留給礦工' },
  barIn: { en: 'Inputs, combined', zh: '輸入，合併' },
  barOut: { en: 'Outputs, split', zh: '輸出，分割' },
  barsLabel: {
    en: 'The same value drawn twice, to scale: as the coins that go in, and as the outputs it is cut into. The sliver at the end of the second bar is the fee, drawn wider than it is so that it can be seen.',
    zh: '同一筆價值按比例畫了兩次：上面是放進去的幣，下面是切分出來的輸出。第二條末端那一小截就是手續費，為了看得見，畫得比實際寬。',
  },
  placeholder: {
    en: 'Type an amount and the wallet will build the transaction here.',
    zh: '輸入金額，錢包便會在這裏組出交易。',
  },
  shortTitle: { en: 'Not enough to build a transaction', zh: '金額不足，無法組成交易' },
  have: { en: 'On offer', zh: '可動用' },
  need: { en: 'Needed with the fee', zh: '連手續費共需' },
  missing: { en: 'Short by', zh: '尚欠' },
  feeRule: {
    en: 'In this figure the fee is {base} BTC plus {each} BTC for each coin spent. A real wallet pays by the size of the transaction, which grows with every input.',
    zh: '在這個圖中，手續費定為 {base} BTC，每花一枚幣再加 {each} BTC。真實的錢包按交易的大小付費，而每多一個輸入，交易就大一些。',
  },

  send: { en: 'Send', zh: '發送' },
  reset: { en: 'Reset the wallet', zh: '重設錢包' },

  /* -------------------------------------------------------------- status */
  statusIdle: {
    en: 'Type an amount, or press one of the amounts on offer. Nothing is sent until you press Send.',
    zh: '輸入金額，或按下其中一個現成的金額。未按「發送」之前，甚麼都不會送出。',
  },
  statusSplit: {
    en: 'One coin is enough. The wallet takes the smallest that covers the payment and the fee, {coin} BTC, and splits it: {amount} to Bob, {change} back to you.',
    zh: '一枚幣已經足夠。錢包挑了足以支付款項和手續費的最小一枚（{coin} BTC），把它拆開：{amount} 付給鮑勃，{change} 回到你手上。',
  },
  statusCombine: {
    en: 'No single coin covers it, so the wallet combines {n}, worth {total} BTC together. {change} comes back as change.',
    zh: '沒有一枚幣足以單獨支付，錢包於是合併 {n}，合共 {total} BTC；其中 {change} 以找續的形式退回。',
  },
  statusManual: {
    en: 'Your choice: {n}, worth {total} BTC. Whatever exceeds the payment and the fee comes back as change: {change}.',
    zh: '由你挑選：{n}，合共 {total} BTC。超出付款和手續費的部分以找續退回：{change}。',
  },
  statusExact: {
    en: 'An exact fit. The inputs equal the payment plus the fee, so there is nothing to return and the transaction has a single output.',
    zh: '剛好相符。輸入總額等於付款加手續費，沒有餘額可退，這筆交易因此只有一個輸出。',
  },
  statusDust: {
    en: 'The change would be {dust} BTC, below the dust limit of {limit} BTC: spending it later would cost more than it holds. So no change output is made, and the remainder is left to the fee.',
    zh: '找續本應是 {dust} BTC，低於 {limit} BTC 的粉塵界線：日後花掉它所需的手續費，比它本身的金額還多。所以錢包不設找續輸出，餘額一併留作手續費。',
  },
  statusShort: {
    en: 'Not enough funds. All your coins together hold {total} BTC, but paying {amount} takes {need} with the fee: {missing} more than you have.',
    zh: '資金不足。你所有的幣加起來是 {total} BTC，但支付 {amount} 連手續費共需 {need}，尚欠 {missing}。',
  },
  statusShortManual: {
    en: 'The coins you picked hold {total} BTC, {missing} short of the payment and its fee. Pick another coin, or let the wallet choose.',
    zh: '你挑的幣合共 {total} BTC，距離付款連手續費還差 {missing}。請多挑一枚，或交回錢包挑選。',
  },
  statusPickOne: {
    en: 'No coin is selected. Press a coin to spend it, or let the wallet choose.',
    zh: '還未選中任何一枚幣。按下要花的幣，或交回錢包挑選。',
  },
  statusPicked: {
    en: 'You picked {n}, worth {total} BTC. Now type the amount to pay.',
    zh: '你挑了 {n}，合共 {total} BTC。現在請輸入要付的金額。',
  },
  statusSent: {
    en: 'Sent. What you spent, {n}, no longer exists, and a new coin of {change} BTC came back as change. Bob holds his {amount} BTC as a coin of his own.',
    zh: '已發送。你花掉的 {n}從此不再存在，另有一枚 {change} BTC 的新幣作為找續回到錢包。鮑勃收到的 {amount} BTC，則成為他自己的一枚幣。',
  },
  statusSentNoChange: {
    en: 'Sent. What you spent, {n}, no longer exists, and nothing came back: there was no change. Bob holds his {amount} BTC as a coin of his own.',
    zh: '已發送。你花掉的 {n}從此不再存在，而且沒有任何東西退回：這筆交易沒有找續。鮑勃收到的 {amount} BTC，則成為他自己的一枚幣。',
  },
} satisfies Record<string, L<unknown> | Record<string, unknown>>;
