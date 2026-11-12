import type { L } from '@/content/types';

/** Interface copy for the incentive figure. */
export const COPY = {
  scenes: { en: 'Scene', zh: '場景' },
  sceneSupply: { en: 'Supply', zh: '供應量' },
  sceneBlock: { en: 'A block’s pay', zh: '區塊的收入' },
  sceneHonest: { en: 'Why play fair', zh: '為何守規矩' },

  /* -------------------------------------------------------------- height */
  height: { en: 'Block height', zh: '區塊高度' },
  block: { en: 'Block', zh: '區塊' },
  prevHalving: { en: 'Previous halving', zh: '上一次減半' },
  nextHalving: { en: 'Next halving', zh: '下一次減半' },
  oneBack: { en: 'One block back', zh: '後退一個區塊' },
  oneOn: { en: 'One block on', zh: '前進一個區塊' },
  subsidyHere: { en: 'subsidy {subsidy} BTC', zh: '補貼 {subsidy} BTC' },

  /* ------------------------------------------------------------- readouts */
  subsidy: { en: 'New coins in this block', zh: '這個區塊新造的幣' },
  halvings: { en: 'Halvings so far', zh: '已減半次數' },
  ofHalvings: { en: 'of {total}', zh: '／ {total} 次' },
  issued: { en: 'Issued so far', zh: '至今已發行' },
  share: { en: 'Of all there will ever be', zh: '佔最終總量' },
  /** One satoshi, and any other number of them. */
  sat: { en: ['satoshi', 'satoshis'], zh: ['聰', '聰'] },
  /** The unit after a fee, where there is no room for the whole word. */
  satShort: { en: 'sat', zh: '聰' },
  eraRange: {
    en: 'Blocks {from} to {to} create {subsidy} BTC each.',
    zh: '由高度 {from} 至 {to}，每個區塊新造 {subsidy} BTC。',
  },
  eraFinal: {
    en: 'From block {from} on, no block creates new coins.',
    zh: '由高度 {from} 起，再沒有區塊新造任何幣。',
  },

  /* --------------------------------------------------------------- charts */
  chartSubsidy: { en: 'New coins per block · BTC', zh: '每個區塊新造的幣 · BTC' },
  chartSupply: { en: 'Total issued · million BTC', zh: '累計發行量 · 百萬 BTC' },
  axisHeight: { en: 'block height', zh: '區塊高度' },
  million: { en: 'M', zh: '百萬' },
  limit: { en: 'limit', zh: '上限' },
  limitNote: {
    en: 'The limit is {btc} BTC, or {sats} satoshis: {short} BTC short of 21 million, because each halving drops any fraction of a satoshi. Block {last} issues the last satoshi. The real total can be lower, never higher: a block may claim less than it is allowed, and what it leaves is never created.',
    zh: '上限為 {btc} BTC，即 {sats} 聰，比 2,100 萬少 {short} BTC，因為每次減半都會捨去不足一聰的零頭。最後一聰由高度 {last} 的區塊發行。實際總量只會少、不會多：區塊可以少領，沒有領取的部分永遠不會被造出來。',
  },
  subsidyAlt: {
    en: 'Chart of the new coins per block against block height: 50 BTC for blocks 0 to 209,999, halved every 210,000 blocks, and nothing from block {end}. At block {height} it is {subsidy} BTC.',
    zh: '每個區塊新造的幣隨區塊高度變化的圖表：高度 0 至 209,999 為 50 BTC，其後每 210,000 個區塊減半，由高度 {end} 起為零。在高度 {height}，數額為 {subsidy} BTC。',
  },
  supplyAlt: {
    en: 'Chart of the total issued against block height. It rises fast at first, bends at every halving and levels off just under 21 million BTC. Once block {height} is mined, {supply} BTC have been issued, {share}% of the limit.',
    zh: '累計發行量隨區塊高度變化的圖表：起初上升得很快，每次減半便轉緩，最後在略低於 2,100 萬 BTC 處持平。高度 {height} 的區塊挖出後，累計已發行 {supply} BTC，佔上限的 {share}%。',
  },

  /* ---------------------------------------------------------------- block */
  blockIntro: {
    en: 'A block being put together. No transaction states its fee: the fee is whatever its outputs leave unclaimed.',
    zh: '一個正在組裝的區塊。沒有任何交易會寫明手續費：輸出沒有領走的部分，就是手續費。',
  },
  coinbase: { en: 'Coinbase', zh: 'coinbase 交易' },
  /** A coinbase has one input, and it points at no coin: what comes in is nothing. */
  nothingIn: { en: 'nothing', zh: '無' },
  toMaker: { en: 'to the block’s maker', zh: '付給區塊創建者' },
  pays: { en: '{from} pays {to}', zh: '{from}付給{to}' },
  names: {
    alice: { en: 'Alice', zh: '愛麗絲' },
    bob: { en: 'Bob', zh: '鮑勃' },
    carol: { en: 'Carol', zh: '卡蘿' },
    dan: { en: 'Dan', zh: '丹' },
    erin: { en: 'Erin', zh: '艾琳' },
    frank: { en: 'Frank', zh: '法蘭克' },
  },
  txIn: { en: 'in', zh: '輸入' },
  txOut: { en: 'out', zh: '輸出' },
  txFee: { en: 'fee', zh: '手續費' },
  feeLess: { en: 'Lower the fee of the payment from {from}', zh: '調低{from}這筆付款的手續費' },
  feeMore: { en: 'Raise the fee of the payment from {from}', zh: '調高{from}這筆付款的手續費' },
  remove: { en: 'Take the payment from {from} out of the block', zh: '把{from}這筆付款移出區塊' },
  add: { en: 'Add a transaction', zh: '加入一筆交易' },
  sumSubsidy: { en: 'Subsidy at block {height}', zh: '高度 {height} 的補貼' },
  sumFees: {
    en: ['Fees of the transactions: none', 'Fee of the 1 transaction', 'Fees of the {count} transactions'],
    zh: ['交易手續費：沒有交易', '1 筆交易的手續費', '{count} 筆交易的手續費'],
  },
  sumLimit: { en: 'The coinbase may claim', zh: 'coinbase 交易最多可領' },
  sumClaim: { en: 'The coinbase claims', zh: 'coinbase 交易實際領取' },
  claimLabel: { en: 'Set what the coinbase claims', zh: '設定領取的金額' },
  claimUnder: { en: '1 satoshi less', zh: '少領 1 聰' },
  claimExact: { en: 'All of it', zh: '剛好領足' },
  claimOver: { en: '1 satoshi more', zh: '多領 1 聰' },
  valid: { en: 'valid', zh: '有效' },
  rejected: { en: 'rejected', zh: '被拒絕' },
  verdictExact: {
    en: 'Valid. The coinbase claims {claimed} BTC: exactly the subsidy plus the fees. Every node that checks the block does the same sum and gets the same answer.',
    zh: '有效。coinbase 交易領取 {claimed} BTC，剛好等於補貼加手續費。每個檢查這個區塊的節點都會算同一條數，得出同一個答案。',
  },
  verdictUnder: {
    en: 'Still valid. The coinbase claims {claimed} BTC, one satoshi less than it may. The rule only forbids claiming more. The satoshi left unclaimed is never created.',
    zh: '仍然有效。coinbase 交易領取 {claimed} BTC，比上限少一聰。規則只禁止多領；沒有領取的那一聰，永遠不會被造出來。',
  },
  verdictOver: {
    en: 'Rejected, for one satoshi. Every node refuses the whole block, proof-of-work and all, and its maker is paid nothing. The node’s own words:',
    zh: '只因多領一聰，整個區塊被拒絕。每個節點都不接受它，所花的工作量亦告白費，創建者分文不得。節點的原話是：',
  },
  noSubsidy: {
    en: 'At this height the subsidy is zero: fees are all a block pays.',
    zh: '在這個高度，補貼為零：區塊的收入只有手續費。',
  },

  /* --------------------------------------------------------------- honest */
  shareLabel: { en: 'This miner’s share of the hash power', zh: '這名礦工佔全網算力的比例' },
  rulesTitle: { en: 'Follow the rules', zh: '按規則行事' },
  attackTitle: { en: 'Attack instead', zh: '改為發動攻擊' },
  blocksPerDay: { en: 'Blocks found on an average day', zh: '平均每天找到的區塊' },
  blocksNote: { en: '144 a day × {share}%', zh: '每天 144 個 × {share}%' },
  coinsPerDay: { en: 'New coins on an average day', zh: '平均每天得到的新幣' },
  coinsNote: {
    en: '× {subsidy} BTC, the subsidy at block {height}. Fees come on top.',
    zh: '× {subsidy} BTC，即高度 {height} 的補貼。手續費另計。',
  },
  splitLabel: {
    en: 'New coins on an average day: this miner {mine} BTC, everyone else together {others} BTC.',
    zh: '平均每天的新幣：這名礦工 {mine} BTC，其餘所有人合共 {others} BTC。',
  },
  splitMine: { en: 'this miner', zh: '這名礦工' },
  splitOthers: { en: 'everyone else together', zh: '其餘所有人合共' },
  majority: {
    en: 'With more than half the power, the rules already give this miner more new coins than everyone else combined.',
    zh: '既然掌握過半算力，單憑規則，這名礦工得到的新幣已經比其他所有人加起來還多。',
  },
  minority: {
    en: 'Whatever the share, the rules pay it block after block, for as long as the miner keeps to them.',
    zh: '不論佔多少，只要這名礦工一直守規矩，規則便會一個區塊接一個區塊地付給他。',
  },
  noCoins: {
    en: 'At this height no new coins are created. The miner’s pay is its share of the fees.',
    zh: '在這個高度，再沒有新幣產生。這名礦工的收入，就是他應佔的手續費。',
  },
  attackCan: {
    en: '**What the same power can do.** Build a rival chain in secret and, once it is the longer one, replace the latest blocks with it. That takes back a payment the attacker himself made ({§11}).',
    zh: '**同樣的算力能做甚麼。**暗中另建一條鏈，待它變得更長，便用它取代最新的幾個區塊，藉此收回攻擊者自己付出的一筆款項（{§11}）。',
  },
  attackCannot: {
    en: '**What it cannot do.** Create coins out of nothing, or take coins that were never his. Every node still checks every block, and refuses one that breaks the rules.',
    zh: '**它做不到甚麼。**憑空造幣，或拿走從來不屬於他的幣。每個節點照樣檢查每個區塊，凡是違反規則的一概拒收。',
  },
  attackCost: {
    en: '**What it costs.** An attempt that fails leaves his secret blocks out of the chain, and they pay him nothing. One that succeeds undermines the system itself, and his own wealth along with it.',
    zh: '**要付出甚麼代價。**若攻擊失敗，他暗中挖出的區塊進不了鏈，分文不得；若攻擊得手，被動搖的是整個系統，連同他自己的財富。',
  },
  attackOddsMinor: {
    en: 'With less than half the power the attack can still succeed, but less and less often the more blocks it has to replace.',
    zh: '算力不足一半時，攻擊仍有可能得手，但要取代的區塊愈多，成功的機會便愈低。',
  },
  attackOddsMajor: {
    en: 'With half the power or more, his chain catches up with the honest one sooner or later, however far behind it starts. The paper’s point is that he gains more by not trying.',
    zh: '算力達到一半或以上時，不論起步落後多少，他的鏈遲早會追上誠實的鏈。白皮書的論點是：不這樣做，他得到的反而更多。',
  },
  noPrices: {
    en: 'No price and no profit figure is given for the attack, on purpose: the paper’s argument is about what the rules reward, not about a market.',
    zh: '攻擊的一方刻意不列出任何價格或利潤數字：白皮書的論點在於規則獎勵甚麼，而不在於市場。',
  },
} satisfies Record<string, L<unknown> | Record<string, unknown>>;
