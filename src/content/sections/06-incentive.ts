import type { SectionContent } from '../types';

const section: SectionContent = {
  id: 'incentive',
  number: 6,
  part: 4,
  title: { en: 'Incentive', zh: '激勵' },

  tldr: {
    en: 'The first transaction in each block creates new coins for the block’s maker and collects the other transactions’ [[fee|fees]]. That pays for running the network, and gives even the strongest [[miner]] more to gain by following the rules than by breaking them.',
    zh: '每個區塊的第一筆交易為該區塊的創建者造出新幣，並收取其餘交易的[[fee|手續費]]。這筆收入支付了維持網絡運作的開銷；即使是算力最強的[[miner|礦工]]，守規矩也比犯規更有利可圖。',
  },

  analogy: {
    en: 'Gold enters circulation because miners spend effort digging it up, not because an authority hands it out. Bitcoin issues its coins the same way: whoever spends the electricity to add a block is paid in coins that did not exist before. Unlike gold, the amount per block is set by rule and known in advance.',
    zh: '黃金之所以進入流通，是因為礦工花力氣把它掘出來，而不是由某個機構派發。比特幣發行貨幣的方式相同：誰花電力接上一個區塊，誰就得到一批前所未有的新幣。與黃金不同的是，每個區塊發多少，早有規則訂明，事先人人皆知。',
  },

  body: {
    en: [
      'By convention, the first transaction in a block is a special one. It does not spend any earlier coin: its [[input]] points at nothing. It creates a new coin that belongs to whoever made the block. Today it is called the [[coinbase|coinbase transaction]], and the new coins are the [[block-subsidy|block subsidy]]. This is the [[incentive]]: a reason for nodes to keep supporting the network.',
      'It also solves a practical problem. With no central authority there is nobody to issue the coins in the first place, so they enter circulation a block at a time, paid to the [[miner]] who did the work. The paper compares this steady addition of new coins to gold miners spending resources to put gold into circulation. Here the resources are CPU time and electricity.',
      'The incentive can also be funded by [[fee|transaction fees]]. If the [[output|outputs]] of a transaction add up to less than its inputs, the difference is a fee, and it is added to the reward of the block that includes the transaction. Once a predetermined number of coins has entered circulation, the new coins can stop altogether. The incentive then rests on fees alone, and the currency is free of inflation.',
      'The incentive may also help nodes stay honest. Suppose a greedy attacker gathers more [[hash-rate|CPU power]] than all the honest nodes together, a [[majority-attack|majority attack]] in today’s words. He has to choose between two uses for it: defraud people by taking back his own payments, or generate new coins. The rules already favour him with more new coins than everyone else combined. Breaking them would undermine the system, and his own wealth along with it. He ought to find it more profitable to play by the rules.',
    ],
    zh: [
      '按照慣例，區塊裏的第一筆交易是一筆特殊的交易。它不動用任何先前的幣，它的[[input|輸入]]並不指向任何東西；它造出一枚新幣，歸創建這個區塊的人所有。今天這筆交易稱為 [[coinbase|coinbase 交易]]，新造的幣則稱為[[block-subsidy|區塊補貼]]。這就是[[incentive|激勵]]：令節點願意繼續支持網絡的理由。',
      '它同時解決了一個實際問題。既然沒有中央機構，最初便沒有人發行貨幣；於是新幣隨着一個個區塊進入流通，付給出力的[[miner|礦工]]。白皮書把這種穩定增添新幣的做法，比作金礦礦工耗費資源把黃金投入流通。在這裏，耗費的是 CPU 時間和電力。',
      '激勵亦可由[[fee|交易手續費]]支付。若一筆交易的[[output|輸出]]總和少於輸入總和，差額便是手續費，並會加到收錄這筆交易的區塊的獎勵之中。一旦預定數量的貨幣進入流通，新幣便可完全停發，激勵從此只靠手續費維持，貨幣亦不再有通脹。',
      '激勵或許亦有助節點保持誠實。假設有個貪婪的攻擊者集結了比所有誠實節點加起來還多的[[hash-rate|算力]]，也就是今天所說的[[majority-attack|多數算力攻擊]]。這些算力有兩種用法，他只能二擇其一：偷回自己付出的款項來欺詐別人，或是用來生成新幣。按規則行事，他得到的新幣已經比其他所有人加起來還多；破壞規則，卻會動搖整個系統，連他自己的財富也一併動搖。他理應發現，守規矩更有利可圖。',
    ],
  },

  figure: {
    component: 'IncentiveSupply',
    title: { en: 'Where the new coins come from', zh: '新幣從何而來' },
    steps: {
      en: [
        {
          title: 'Slide through the halvings',
          text: 'Drag the [[block-height|block height]], or jump from one [[halving]] to the next. Every 210,000 blocks the new coins per block are cut in half: 50, 25, 12.5 and so on.',
        },
        {
          title: 'Watch the supply level off',
          text: 'Each stretch of 210,000 blocks adds half as much as the one before, so the total closes in on a limit just under 21 million. From block 6,930,000 the subsidy is zero and nothing more is issued.',
        },
        {
          title: 'Add up a block’s pay',
          text: 'Whatever a transaction’s outputs leave unclaimed is its [[fee]]. Change a fee, or add and remove transactions: the coinbase at the top claims the subsidy plus all the fees.',
        },
        {
          title: 'Claim one satoshi more',
          text: 'Make the coinbase claim one [[satoshi-unit|satoshi]] too much. Every node works out the limit for itself, so the whole block is rejected, with the reason `bad-cb-amount`.',
        },
        {
          title: 'Weigh honesty against attack',
          text: 'Give one miner a share of the [[hash-rate|hash power]]. On one side is what the rules pay it on an average day. On the other is what the same power could do by attacking, and what that would cost.',
        },
      ],
      zh: [
        {
          title: '滑過每次減半',
          text: '拖動[[block-height|區塊高度]]，或由一次[[halving|減半]]跳到下一次。每隔 210,000 個區塊，每個區塊新造的幣便減去一半：50、25、12.5，如此類推。',
        },
        {
          title: '看供應量趨於平緩',
          text: '每次減半後新增的幣只有上一期的一半，因此總量不斷逼近一個略低於 2,100 萬的上限。由高度 6,930,000 起，補貼為零，不再有新幣發行。',
        },
        {
          title: '算出一個區塊的收入',
          text: '一筆交易的輸出沒有領走的部分，就是它的[[fee|手續費]]。試試更改手續費，或增刪交易：最上方的 coinbase 交易領取的，是補貼加上全部手續費。',
        },
        {
          title: '多領一聰',
          text: '讓 coinbase 交易多領一[[satoshi-unit|聰]]。每個節點都會自行算出上限，所以整個區塊會被拒絕，理由是 `bad-cb-amount`。',
        },
        {
          title: '誠實與攻擊的比較',
          text: '給一名礦工分配一部分[[hash-rate|算力]]。一邊是規則平均每天付給他多少；另一邊是同樣的算力若用來攻擊，能做到甚麼，又要付出甚麼代價。',
        },
      ],
    },
  },

  whoRuns: [
    {
      actor: 'mining-pool',
      role: {
        en: 'Builds the coinbase transaction that claims the block’s reward, and shares out its earnings among its members according to the work each has shown.',
        zh: '負責構造領取區塊獎勵的 coinbase 交易，並把收入按各成員所證明的工作量攤分。',
      },
      artifact: {
        kind: 'rpc',
        label: 'getblocktemplate → coinbasevalue',
        detail: {
          en: 'The node does the sum for the [[mining-pool|pool]]: the `coinbasevalue` field of [[getblocktemplate]] is the most the coinbase may claim, the subsidy plus the fees of the transactions in the template, in satoshis. The pool writes the coinbase transaction itself and passes it to its machines over [[stratum|Stratum]] in two halves, with a gap between them that each machine fills with a counter of its own.',
          zh: '節點替[[mining-pool|礦池]]把數目算好：[[getblocktemplate]] 回傳的 `coinbasevalue` 欄位，就是 coinbase 交易最多可領取的金額，即補貼加上模板內各筆交易的手續費，以聰計算。coinbase 交易由礦池自行編寫，再透過 [[stratum|Stratum 協定]]分成兩半交給礦機，中間留有空位，由每部礦機填上自己的計數。',
        },
        snippet:
          '$ bitcoin-cli getblocktemplate \'{"rules": ["segwit"]}\'\n{\n  ...\n  "transactions": [\n    { "txid": "...", "fee": ..., "weight": ..., ... },\n    ...\n  ],\n  "coinbasevalue": ...,\n  "height": ...,\n  ...\n}',
      },
    },
    {
      actor: 'full-node',
      role: {
        en: 'Enforces the amount. Every node works out the subsidy for the block’s height, adds up the fees, and rejects a block whose coinbase claims more.',
        zh: '負責把關金額。每個節點都按區塊高度算出補貼，加上全部手續費；coinbase 交易若領取更多，便拒絕整個區塊。',
      },
      artifact: {
        kind: 'file',
        label: 'src/validation.cpp',
        detail: {
          en: '`GetBlockSubsidy()` gives the subsidy for a height, and `ConnectBlock()` rejects a block with the reason `bad-cb-amount` when its coinbase pays out more than subsidy plus fees. A third rule, `COINBASE_MATURITY` in `src/consensus/consensus.h`, keeps new coins from being spent for 100 blocks.',
          zh: '`GetBlockSubsidy()` 按高度算出補貼；coinbase 交易付出的金額若多於補貼加手續費，`ConnectBlock()` 便以 `bad-cb-amount` 為由拒絕該區塊。第三條規則是 `src/consensus/consensus.h` 內的 `COINBASE_MATURITY`：新幣要等 100 個區塊之後才可動用。',
        },
        snippet: '$ bitcoin-cli getblockstats 840000 \'["subsidy"]\'\n{\n  "subsidy": 312500000\n}',
      },
    },
    {
      actor: 'software-wallet',
      role: {
        en: 'Decides what fee to offer: enough for the transaction to be picked for a block within the time its owner is willing to wait.',
        zh: '決定付多少手續費：金額要足以令交易在用戶願意等候的時間內被收進區塊。',
      },
      artifact: {
        kind: 'rpc',
        label: 'estimatesmartfee',
        detail: {
          en: 'Given a target in blocks, a node answers with an estimated fee rate in BTC per 1,000 virtual bytes. The wallet multiplies that rate by the size of the transaction it has built.',
          zh: '給定以區塊數目計的目標，節點便回覆一個估計費率，單位是每 1,000 虛擬位元組多少 BTC。錢包再把費率乘以自己所組交易的大小。',
        },
        snippet: '$ bitcoin-cli estimatesmartfee 6\n{\n  "feerate": ...,\n  "blocks": ...\n}',
      },
    },
  ],

  paperVsToday: {
    en: [
      'The paper gives no numbers. The software set them: 50 BTC per block at first, halved every 210,000 blocks. Each [[halving]] is a shift that drops any fraction of a satoshi, so the subsidies add up to 20,999,999.9769 BTC, the [[supply-cap|supply cap]] of just under 21 million.',
      'New coins cannot be spent at once. A coinbase output may be spent only by a transaction at least 100 blocks later (`COINBASE_MATURITY`).',
      'The paper’s “predetermined number of coins” is reached at a block height, not on a date. The subsidy is down to one satoshi at block 6,720,000 and is zero from block 6,930,000 on, so block 6,929,999 issues the last one. When that block will be found depends on how fast blocks arrive, and cannot be known in advance.',
      'Fees are bid for space, not charged on value. Nodes rank waiting transactions by fee rate, in satoshis per virtual byte, and a block template is filled from the highest rate down. What a transaction must offer depends on its size in bytes, not on the amount it moves.',
      '“By convention” became a rule every node enforces. A block whose first transaction is not a coinbase, or that holds a second one, is invalid (`bad-cb-missing`, `bad-cb-multiple`), and since BIP 34 the coinbase’s input script must begin with the block’s own height.',
    ],
    zh: [
      '白皮書沒有寫明任何數字，數字是軟件定的：最初每個區塊 50 BTC，每 210,000 個區塊減半一次。每次[[halving|減半]]都是一次移位，不足一聰的零頭會被捨去，因此全部補貼加起來是 20,999,999.9769 BTC，也就是略低於 2,100 萬的[[supply-cap|供應上限]]。',
      '新幣不能即時動用。coinbase 交易的輸出，最快要到 100 個區塊之後的交易才可花費（`COINBASE_MATURITY`）。',
      '白皮書所說的「預定數量的貨幣」，是在某個區塊高度達到的，而不是某個日期。到高度 6,720,000，補貼只剩一聰；由高度 6,930,000 起，補貼為零，所以最後一聰由高度 6,929,999 的區塊發行。那個區塊何時出現，取決於出塊的快慢，事前無從得知。',
      '手續費是為了爭取區塊空間而出價，並非按金額抽成。節點按費率（每虛擬位元組多少聰）為等候中的交易排序，區塊模板則由費率最高的開始填起。一筆交易要出多少手續費，取決於它佔多少位元組，而不是它轉移了多少錢。',
      '「按照慣例」已變成每個節點都會執行的規則。區塊的第一筆交易若不是 coinbase 交易，或者區塊內有第二筆 coinbase 交易，區塊即屬無效（`bad-cb-missing`、`bad-cb-multiple`）；而自 BIP 34 起，coinbase 交易的輸入腳本必須以區塊本身的高度開頭。',
    ],
  },
};

export default section;
