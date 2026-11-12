import type { SectionContent } from '../types';

const section: SectionContent = {
  id: 'combining-splitting-value',
  number: 9,
  part: 5,
  title: { en: 'Combining and Splitting Value', zh: '價值的合併與分割' },

  tldr: {
    en: 'A [[transaction]] can take several coins in and pay several out. That lets a [[wallet]] gather small amounts into one payment, or break a large coin into the payment and the [[change]].',
    zh: '一筆[[transaction|交易]]可以同時動用多枚幣，也可以同時付出多筆款項。[[wallet|錢包]]因而可以把幾筆小額湊成一次付款，或者把一枚大額的幣拆成付款和[[change|找續]]。',
  },

  analogy: {
    en: 'Paying with banknotes. For a bill of 70 you can hand over a 50 and a 20, or a single 100 and take 30 back. The difference is that these notes come in no fixed sizes: every payment destroys the notes handed over and prints new ones in exactly the amounts needed.',
    zh: '就像用紙幣付款。賬單是 70 元，你可以遞上一張 50 元和一張 20 元，也可以遞上一張 100 元，再收回 30 元找續。不同之處，是這些「紙幣」沒有固定面額：每次付款都把交出的紙幣作廢，再按所需金額印出新的。',
  },

  body: {
    en: [
      'In {§2} a [[electronic-coin|coin]] is handed on whole from one owner to the next. If that were all, paying an odd amount would need a separate [[transaction]] for every cent in the transfer, which the paper calls unwieldy.',
      'So a transaction is allowed several [[input|inputs]] and several [[output|outputs]]. Each input refers to value received in an earlier transaction; each output assigns an amount to a new owner. Putting several inputs in combines value. Paying several outputs out splits it.',
      'The paper expects two ordinary shapes on the input side: a single input from a larger earlier transaction, or several inputs that combine smaller amounts. On the output side it expects at most two: one for the payment, and one that returns the [[change]], if there is any, to the sender.',
      'What the inputs bring in and the outputs do not hand out is not lost. As {§6} explained, that difference is the [[fee|transaction fee]], collected by whoever puts the transaction into a block.',
      'One worry remains, and the paper dismisses it. A transaction depends on several earlier ones, and those depend on many more: a fan-out of history behind every payment. This is not a problem, because nobody ever needs to extract a complete, standalone copy of a transaction’s history. It is enough to know that the outputs being spent exist and are [[utxo|still unspent]].',
    ],
    zh: [
      '在 {§2}，一枚[[electronic-coin|貨幣]]是整枚由一位擁有者轉交下一位的。若僅此而已，要支付一個零碎的金額，便得為轉賬中的每一分錢另立一筆[[transaction|交易]]；白皮書形容這樣做十分累贅。',
      '因此，一筆交易可以有多個[[input|輸入]]和多個[[output|輸出]]。每個輸入指向先前某筆交易中收到的價值，每個輸出則把一筆金額交給新的擁有者。放進多個輸入，價值便合併；付出多個輸出，價值便分割。',
      '白皮書預期輸入一方通常只有兩種情形：要麼是單一輸入，來自先前一筆較大額的交易；要麼是多個輸入，把較小的金額合併起來。輸出一方則預期最多兩個：一個用於付款，另一個把[[change|找續]]（如有）退回付款人。',
      '輸入帶進來、輸出卻沒有分出去的部分，並不會消失。正如 {§6} 所述，這個差額就是[[fee|交易手續費]]，歸把交易收進區塊的一方所有。',
      '剩下一個疑慮，白皮書認為不成問題。一筆交易依賴先前的若干筆交易，而這些交易又依賴更多交易：每筆付款背後，都是一片不斷扇出的歷史。這並不礙事，因為任何時候都毋須提取某筆交易歷史的完整獨立副本；只要知道被花費的輸出確實存在，而且[[utxo|尚未花費]]，便已足夠。',
    ],
  },

  figure: {
    component: 'UtxoCombineSplit',
    title: { en: 'Pay from a wallet of coins', zh: '用錢包裏的幣付款' },
    steps: {
      en: [
        {
          title: 'Meet your coins',
          text: 'Your wallet holds five coins of different sizes. No balance is stored anywhere: what you can spend is the sum of these [[utxo|unspent outputs]].',
        },
        {
          title: 'Split one coin',
          text: 'Pay 0.15 BTC. The wallet picks the 0.2 coin, pays Bob, and sends the rest back to you as [[change]]: one coin in, two out.',
        },
        {
          title: 'Combine several coins',
          text: 'Now pay 0.6 BTC. No single coin is large enough, so the wallet puts two in. Every extra input makes the transaction larger, and the fee with it.',
        },
        {
          title: 'Find the fee',
          text: 'No field of a transaction says what the [[fee]] is. Compare the two totals: what the inputs bring in and no output claims is left for the miner. Then try the special cases: an amount that leaves no change, and one that leaves too little to keep.',
        },
        {
          title: 'Send, then pay again',
          text: 'Press Send. The coins you spent are gone for good, and the change is a new coin in your wallet. For the next payment, press the coins to choose them yourself.',
        },
      ],
      zh: [
        {
          title: '認識你的幣',
          text: '你的錢包裏有五枚大小不一的幣。世上沒有任何地方記着你的「餘額」：你能花多少，就是這些[[utxo|未花費輸出]]的總和。',
        },
        {
          title: '拆開一枚幣',
          text: '支付 0.15 BTC。錢包選了 0.2 的那一枚，付款給鮑勃，餘下的以[[change|找續]]的形式回到你手上：一枚進，兩枚出。',
        },
        {
          title: '合併幾枚幣',
          text: '再試支付 0.6 BTC。沒有一枚幣夠大，錢包便放進兩枚。每多一個輸入，交易便大一點，手續費也隨之增加。',
        },
        {
          title: '找出手續費',
          text: '交易之內沒有任何欄位寫明[[fee|手續費]]。比較兩邊的總數：輸入帶進來、卻沒有輸出領走的部分，便留給礦工。然後試試「特殊情況」那幾個金額：有的剛好不用找續，有的找續少得不值得保留。',
        },
        {
          title: '發送，然後再付一次',
          text: '按「發送」。花掉的幣從此消失，找續則成為你錢包裏的一枚新幣。下一次付款，不妨按下幣塊，自己挑選要花哪幾枚。',
        },
      ],
    },
  },

  whoRuns: [
    {
      actor: 'software-wallet',
      role: {
        en: 'Tracks which [[utxo|unspent outputs]] belong to you and, for every payment, decides which of them to spend. That decision is [[coin-selection|coin selection]].',
        zh: '記錄哪些[[utxo|未花費輸出]]屬於你，並在每次付款時決定動用其中哪幾個。這個決定稱為[[coin-selection|選幣]]。',
      },
      artifact: {
        kind: 'rpc',
        label: 'listunspent · fundrawtransaction',
        detail: {
          en: '`listunspent` lists the wallet’s coins, each named by a `txid` and a `vout`. `fundrawtransaction` takes a transaction that has outputs but no inputs, selects coins to cover it and adds at most one change output. A [[software-wallet|software wallet]] that hands the result to a separate signer wraps it as a [[psbt|PSBT]] (`walletcreatefundedpsbt`).',
          zh: '`listunspent` 列出錢包內的幣，每一枚以 `txid` 和 `vout` 識別。`fundrawtransaction` 接收一筆只有輸出、沒有輸入的交易，替它選出足夠的幣，並最多加上一個找續輸出。[[software-wallet|軟件錢包]]若要把結果交給另一部裝置簽署，便會把它包裝成 [[psbt|PSBT]]（`walletcreatefundedpsbt`）。',
        },
        snippet:
          '$ bitcoin-cli listunspent\n[\n  {\n    "txid": "...",\n    "vout": 1,\n    "amount": 0.20000000,\n    "confirmations": ...,\n    ...\n  },\n  ...\n]\n$ bitcoin-cli fundrawtransaction "<hex with outputs only>"\n{\n  "hex": "...",\n  "fee": ...,\n  "changepos": 1\n}',
      },
    },
    {
      actor: 'hardware-wallet',
      role: {
        en: 'Shows the outputs on its own screen before it signs. An output that claims to be change need not be taken on the computer’s word: the device can derive the key itself and check that the output pays it.',
        zh: '簽署之前，先在自己的螢幕上顯示各個輸出。對於聲稱是找續的輸出，裝置毋須聽信電腦的說法：它可以自行推導密鑰，核實該輸出確實付給自己。',
      },
      artifact: {
        kind: 'bip',
        label: 'BIP 174 · PSBT_OUT_BIP32_DERIVATION',
        detail: {
          en: 'A field of the [[psbt|PSBT]] that gives, for an output, the fingerprint of a master key and the derivation path of the key being paid. BIP 174 describes the check: a signer that finds its own fingerprint there can derive the key at that path and compare it with the one in the output, and treat the output as change only if the two match.',
          zh: '[[psbt|PSBT]] 內的一個欄位，為某個輸出列明主密鑰的指紋，以及收款密鑰的推導路徑。BIP 174 說明了核對的方法：簽署裝置若在其中認出自己的指紋，便可按這條路徑推導出密鑰，再與輸出內的密鑰比對；兩者一致，才把這個輸出視為找續。',
        },
        snippet:
          '$ bitcoin-cli decodepsbt "<base64>"\n{\n  ...\n  "outputs": [\n    { },\n    {\n      "bip32_derivs": [\n        { "pubkey": "...", "master_fingerprint": "...", "path": "..." }\n      ]\n    }\n  ],\n  ...\n}',
      },
    },
    {
      actor: 'full-node',
      role: {
        en: 'Holds the set of all unspent outputs and checks every input of every transaction against it: the output must be there, and the new outputs may not be worth more than the inputs.',
        zh: '持有全部未花費輸出的集合，並以它核對每筆交易的每個輸入：所指的輸出必須在集合之內，而新輸出的總值不得超過輸入的總值。',
      },
      artifact: {
        kind: 'rpc',
        label: 'gettxout',
        detail: {
          en: 'Looks one output up in the set. If it has been spent, or never existed, nothing comes back. `Consensus::CheckTxInputs()` in `src/consensus/tx_verify.cpp` makes the same lookup for each input and computes the [[fee]] as inputs minus outputs.',
          zh: '在集合內查找一個輸出。若它已被花掉，或者從未存在，便沒有任何回覆。`src/consensus/tx_verify.cpp` 的 `Consensus::CheckTxInputs()` 對每個輸入都做同樣的查找，並以輸入減輸出算出[[fee|手續費]]。',
        },
        snippet:
          '$ bitcoin-cli gettxout "<txid>" 0\n{\n  "bestblock": "...",\n  "confirmations": ...,\n  "value": 0.20000000,\n  "scriptPubKey": { ... },\n  "coinbase": false\n}\n$ bitcoin-cli gettxout "<txid of a spent output>" 0\n(no result: that output is not in the set)',
      },
    },
  ],

  paperVsToday: {
    en: [
      '“At most two outputs” describes a habit, not a rule. A transaction may have as many outputs as its size allows, and Bitcoin Core’s own `sendmany` pays several recipients in one. What `fundrawtransaction` promises is narrower: it adds at most one change output.',
      'An [[input]] cannot be spent in part. It uses up the whole [[output]] it points at, which then leaves the set of unspent outputs for good. That is why [[change]] exists: whatever you do not mean to pay away has to be paid back to yourself in a new output.',
      'No field of a transaction states the [[fee]]. A node works it out as the value of the inputs minus the value of the outputs, and refuses the transaction if the outputs are worth more (`bad-txns-in-belowout`). Leave out the change output by mistake, and the whole remainder goes to the miner.',
      'Outputs too small to be worth spending are called dust. By default Bitcoin Core treats an output as dust when spending it would cost more in fees than it holds, reckoned at 3,000 [[satoshi-unit|satoshis]] per 1,000 bytes: under 546 satoshis for a typical non-SegWit output, under 294 for a typical SegWit one (P2WPKH). This is a rule about what nodes relay, not about what a block may contain. The wallet makes no change output below its own threshold; the remainder is left to the fee.',
      'Choosing the coins has become a subject of its own. For each payment Bitcoin Core’s wallet runs several algorithms (Branch and Bound, Knapsack, Single Random Draw, and CoinGrinder when the fee rate is high) and keeps the result with the least waste: roughly, what it costs to spend these inputs now and not later, plus the cost of a change output or, without one, whatever is given up to fees.',
      'The fan-out the paper sets aside is handled by the set of [[utxo|unspent outputs]]. To check a transaction a node looks its inputs up there and goes no further back: every earlier transaction was checked when it entered the chain. A [[electronic-coin|coin]] in the paper’s sense, a chain of signatures, is never walked from end to end.',
    ],
    zh: [
      '「最多兩個輸出」只是慣常做法，並非規則。只要交易的大小容許，輸出的數目並無限制；Bitcoin Core 本身的 `sendmany` 就是在一筆交易內付款給多個收款人。`fundrawtransaction` 所保證的範圍較窄：它最多只會加上一個找續輸出。',
      '[[input|輸入]]不能只花一部分。它會用盡所指向的整個[[output|輸出]]，該輸出隨即永久離開未花費輸出的集合。[[change|找續]]正是由此而來：不打算付出去的部分，必須以一個新輸出付回給自己。',
      '交易之內沒有任何欄位寫明[[fee|手續費]]。節點的算法是輸入的總值減去輸出的總值；若輸出的總值較大，便拒絕這筆交易（`bad-txns-in-belowout`）。萬一漏掉找續輸出，餘下的金額便全數歸礦工所有。',
      '小得不值得花的輸出稱為「粉塵」。按 Bitcoin Core 的預設，以每 1,000 位元組 3,000 [[satoshi-unit|聰]]計算，若花掉一個輸出所需的手續費比它本身的金額還多，它便屬於粉塵：典型的非 SegWit 輸出以 546 聰為界，典型的 SegWit 輸出（P2WPKH）則以 294 聰為界。這是節點轉發交易時的準則，而不是區塊有效與否的規則。錢包不會造出低於自身門檻的找續輸出，餘額一律留作手續費。',
      '選幣本身已成為一門學問。每次付款，Bitcoin Core 的錢包都會執行幾種演算法（Branch and Bound、Knapsack、Single Random Draw，費率偏高時還有 CoinGrinder），然後採用「浪費」最少的結果。所謂浪費，大致是現在而非日後花掉這些輸入的額外成本，再加上找續輸出的成本；若不設找續，則加上白白歸入手續費的金額。',
      '白皮書一筆帶過的「扇出」問題，實際上由[[utxo|未花費輸出]]的集合解決。節點核對一筆交易時，只在這個集合內查找它的輸入，不會再往前追溯，因為更早的每筆交易在上鏈時都已核對過。白皮書所說的[[electronic-coin|電子貨幣]]是一條簽署鏈，但沒有人需要把它從頭到尾走一遍。',
    ],
  },
};

export default section;
