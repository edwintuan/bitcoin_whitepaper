import type { SectionContent } from '../types';

/*
 * z in this chapter is the paper's z: blocks linked after the block that holds
 * the payment. That block is the first confirmation, so z blocks on top are
 * z + 1 confirmations. Every number below is stated one way or converted.
 */
const section: SectionContent = {
  id: 'calculations',
  number: 11,
  part: 6,
  title: { en: 'Calculations', zh: '計算' },

  tldr: {
    en: 'A payment gets safer with every block added on top of it. The chance that an attacker with less than half the [[hash-rate|computing power]] can still take it back shrinks exponentially, and the paper works out exactly how fast.',
    zh: '付款之上每多接上一個區塊，它就安全一分。只要攻擊者掌握的[[hash-rate|算力]]不足一半，他仍能收回這筆付款的概率便會呈指數下降；白皮書算出了下降得有多快。',
  },

  analogy: {
    en: 'A gambler who starts in debt and plays a game tilted against him, hoping to get back to zero. He may win a few rounds in a row, but the deeper the debt, the less likely he ever climbs out. The debt is the number of blocks the attacker is behind, and each round is the race for the next block.',
    zh: '好比一個負債的賭徒，玩着一個勝算偏向對手的遊戲，只求把欠債打平。他或許能連贏幾局，但欠得愈多，翻身的機會便愈渺茫。欠債的數目，就是攻擊者落後的區塊數；每一局，就是爭奪下一個區塊。',
  },

  body: {
    en: [
      'Suppose an attacker does manage to build a private chain faster than everyone else builds the public one. That still does not let him rewrite the rules. [[node|Nodes]] check every transaction and every block for themselves, so a block that creates coins from nothing, or spends coins without their owner’s [[digital-signature|signature]], is refused however much work stands behind it. The one thing extra work can buy is a different order of events. The attacker can pay a merchant, collect the goods, and then try to replace that payment with one that sends the same coins back to himself. This is [[double-spending]], and it is the only attack this section has to put a price on.',
      'The paper treats the contest as a [[binomial-random-walk|random walk]]. Each new block is found either by the honest network, with probability p, or by the attacker, with probability q = 1 − p, and each time the gap between the two chains moves by one. Catching up from behind is then the classic [[gamblers-ruin|Gambler’s Ruin]] problem. Call r the chance of ever closing a gap of one block. Either the attacker finds the next block and the gap is closed, or the honest side finds it and he now has to close a gap of one twice over, which has chance r × r. So r = q + p × r². Two values satisfy this: 1 and q/p. While honest nodes hold the majority the gap tends to widen, so catching up cannot be certain, and r is q/p. With a tenth of the hash power that is 0.1/0.9, one chance in nine.',
      'A gap of z blocks is a gap of one, closed z times in a row, so the chance is q/p multiplied by itself z times, written (q/p)^z, and it falls exponentially: one in nine for one block, one in 81 for two, about one in 59,000 for five. If the attacker has half the hash power or more, the answer is 1 instead. A [[majority-attack|majority attacker]] always catches up in the end, which is why the whole system rests on honest nodes holding the majority.',
      'But the race does not begin when the merchant stops waiting. In the paper’s scenario the merchant creates a new [[key-pair|key pair]] and hands over the [[public-key|public key]] only at the last moment, so the attacker cannot prepare a chain in advance. From the instant the payment is sent, the attacker mines his alternative chain in secret. The merchant waits until the payment is in a block and z more blocks have been linked after it. The block that holds the payment is itself the first [[confirmation]], so z blocks on top of it make z + 1 confirmations. By then the attacker has blocks of his own. The paper measures his progress against the z blocks on top: he finds q blocks for every p the honest side finds, so on average z × q/p of them. The actual number scatters around that average, and the paper takes it to follow a [[poisson-distribution|Poisson distribution]] with mean λ = z × q/p.',
      'The final figure combines the two. For each number of blocks k the attacker may already have, take the Poisson probability that he has exactly k and multiply it by the chance of catching up from the z − k that remain; if he already has z or more, he has caught up. Adding the cases gives P, the probability the paper tabulates. Whenever there is a gap to close it is larger than the bare (q/p)^z, because the head start counts in the attacker’s favour. At q = 0.1 and z = 5, P is 0.0009137, over fifty times the 0.0000169 of a race begun five blocks behind.',
      'Read the other way round, the same function says how long to wait. To bring P below 0.1%, a merchant facing an attacker with 10% of the hash power waits for 5 blocks on top of the payment, which is 6 confirmations. Against 30% it takes 24 blocks, and against 45% it takes 340. Safety is paid for in time, and the price climbs steeply as the attacker nears one half, where no wait is long enough.',
    ],
    zh: [
      '假設攻擊者真的能夠暗中造出另一條鏈，速度還快過全網合力延長公開的那條鏈。即使如此，他也改不了規則。[[node|節點]]會自行驗證每筆交易、每個區塊：憑空造幣的區塊，或者未經擁有者[[digital-signature|簽署]]便動用其款項的區塊，不管背後堆了多少工作量，一律拒收。額外的工作量只能換來一樣東西：不同的先後次序。攻擊者可以先付款給商戶、取走貨物，然後設法以另一筆把同一枚幣付回給自己的交易，取代原來那筆付款。這就是[[double-spending|雙重支付]]，也是本章唯一需要計算代價的攻擊。',
      '白皮書把這場較量看成一次[[binomial-random-walk|二項隨機漫步]]。每個新區塊，不是由誠實網絡找到（概率為 p），就是由攻擊者找到（概率為 q = 1 − p）；每出一個區塊，兩條鏈的差距便加一或減一。於是，由落後追上來，就是經典的[[gamblers-ruin|賭徒破產問題]]。設 r 為「最終追回一個區塊差距」的概率。下一個區塊若由攻擊者找到，他便追回了；若由誠實一方找到，差距變成兩個，他得把「追回一個區塊」這件事連做兩次，概率是 r × r。所以 r = q + p × r²。滿足這條式子的值有兩個：1 和 q/p。只要誠實節點佔多數，差距平均而言只會愈拉愈大，追上並非必然，所以 r 是 q/p。攻擊者若掌握一成算力，r 就是 0.1/0.9，即九分之一。',
      '落後 z 個區塊，等於要把「追回一個區塊」連續做 z 次，所以概率是 q/p 自乘 z 次，寫作 (q/p)^z，而且呈指數下降：落後一個是九分之一，落後兩個是八十一分之一，落後五個大約是五萬九千分之一。若攻擊者掌握一半或以上的算力，答案則是 1：發動[[majority-attack|多數算力攻擊]]的人遲早一定追上。整個系統之所以建基於「誠實節點佔多數」這個前提，原因就在這裏。',
      '不過，競賽並不是等商戶等夠了才開始的。按白皮書設想的情境，商戶到最後一刻才生成新的[[key-pair|密鑰對]]，把[[public-key|公鑰]]交給付款人，令對方無法預先準備好一條鏈。付款一經發出，攻擊者便開始暗中挖另一條鏈。商戶一直等到這筆付款被收進一個區塊，而且其後再接上 z 個區塊。付款所在的區塊本身已是第一個[[confirmation|確認]]，所以上面有 z 個區塊，就是 z + 1 個確認。這段時間裏，攻擊者也挖到了一些區塊。白皮書以上面那 z 個區塊為準來估算他的進度：誠實一方每找到 p 個，他就找到 q 個，所以平均是 z × q/p 個。實際數目圍繞這個平均值上下浮動；白皮書假定它服從期望值為 λ = z × q/p 的[[poisson-distribution|泊松分佈]]。',
      '最後的數字把兩者合起來。攻擊者手上可能已有 k 個區塊：對每一個可能的 k，先取「他剛好有 k 個」的泊松概率，再乘以他從餘下 z − k 個的差距追上的概率；若他已有 z 個或更多，便算已經追上。把所有情況加起來，就是白皮書列表所載的 P。只要有差距要追，它就一定比單純的 (q/p)^z 大，因為暗中搶跑的那一段對攻擊者有利。q = 0.1、z = 5 時，P 是 0.0009137；而由落後五個區塊起跑的概率只有 0.0000169，前者是後者的五十多倍。',
      '反過來看，同一個函數也回答了「要等多久」。若要把 P 壓到 0.1% 以下，面對掌握 10% 算力的攻擊者，商戶要等付款之上再接上 5 個區塊，也就是 6 個確認；對方若有 30% 算力，要等 24 個區塊；有 45%，則要等 340 個。安全的代價是時間，而且攻擊者愈接近一半算力，代價升得愈陡；到了一半，等多久也不夠。',
    ],
  },

  figure: {
    component: 'AttackCalculator',
    title: { en: 'How long is long enough?', zh: '要等多久才夠？' },
    steps: {
      en: [
        {
          title: 'Choose the attacker’s share',
          text: 'Drag the first slider. q is the attacker’s share of the [[hash-rate|hash power]]; everyone else together is p. Watch the large number: it is the chance he can still take a payment back.',
        },
        {
          title: 'Add blocks on top',
          text: 'Now drag z, the number of blocks added on top of the payment. Each one moves the point down the curve by about the same distance, and on this scale equal distances are equal factors.',
        },
        {
          title: 'Find how long to wait',
          text: 'The orange line marks 0.1%. With 10% of the hash power the curve dips under it at z = 5: five blocks on top, six [[confirmation|confirmations]]. Then try 30% and 45%.',
        },
        {
          title: 'Open the loop',
          text: 'The paper’s C function, and under it the code this page runs. Step through the passes: each one subtracts the chance that the attacker has found exactly k blocks and still never catches up.',
        },
        {
          title: 'Check the paper’s tables',
          text: 'The three tables that end this section of the paper, worked out again in your browser by the same function and compared with the printed values line by line.',
        },
        {
          title: 'Run the race',
          text: 'The [[binomial-random-walk|random walk]], played out block by block: 30% of the hash power, three blocks behind. Run one race, then a thousand. The races measure (q/p)^z, which is smaller than P; the note beneath the totals says why.',
        },
      ],
      zh: [
        {
          title: '選定攻擊者的佔比',
          text: '拖動第一個滑桿。q 是攻擊者所佔的[[hash-rate|算力]]比例，其餘所有人合共是 p。留意那個大數字：它是攻擊者仍能收回一筆付款的概率。',
        },
        {
          title: '在付款之上加區塊',
          text: '再拖動 z，即付款之上再接上的區塊數目。每加一個，圖上的點便沿曲線下移大致相同的距離；在這種刻度上，相同的距離代表相同的倍數。',
        },
        {
          title: '看看要等多久',
          text: '橙色橫線標示 0.1%。攻擊者掌握 10% 算力時，曲線在 z = 5 跌破這條線：付款之上五個區塊，即六個[[confirmation|確認]]。再試試 30% 和 45%。',
        },
        {
          title: '打開迴圈',
          text: '上面是白皮書的 C 函數，下面是本頁實際執行的程式碼。逐輪看下去：每一輪減去的，是「攻擊者剛好找到 k 個區塊，其後卻始終追不上」的概率。',
        },
        {
          title: '核對白皮書的表',
          text: '白皮書這一章最後列出的三張表，由同一個函數在你的瀏覽器裏重新算出，再逐行與印出來的數值比對。',
        },
        {
          title: '跑一場競賽',
          text: '把[[binomial-random-walk|隨機漫步]]逐個區塊走一遍：攻擊者掌握 30% 算力，落後三個區塊。先跑一場，再連跑一千場。這些競賽量度的是 (q/p)^z，比 P 小；原因見統計數字下方的說明。',
        },
      ],
    },
  },

  whoRuns: [
    {
      actor: 'explorer',
      role: {
        en: 'Merchants and exchanges decide for themselves how many [[confirmation|confirmations]] a payment needs before they act on it, weighing the amount at stake against the wait. The software reports the number; choosing the threshold is theirs.',
        zh: '一筆付款要有多少個[[confirmation|確認]]才可以放心處理，由商戶和交易所按涉及的金額與等候的時間自行權衡。軟件只報告確認數，門檻則由他們自己決定。',
      },
      artifact: {
        kind: 'rpc',
        label: 'getreceivedbyaddress',
        detail: {
          en: 'The threshold is an argument, not a rule: `minconf`, 1 by default, counts only payments with at least that many confirmations. A payment in the newest block has 1, so the paper’s z = 5 is `minconf` 6.',
          zh: '門檻是一個參數，而不是一條規則：`minconf` 預設為 1，只計算確認數不少於此的付款。剛被收進最新區塊的付款有 1 個確認，所以白皮書的 z = 5 相當於 `minconf` 6。',
        },
        snippet:
          '$ bitcoin-cli getreceivedbyaddress \\\n    "bc1q…" 6\n0.30000000\n\n$ bitcoin-cli gettransaction <txid>\n{\n  "amount": 0.30000000,\n  "confirmations": 6,\n  ...\n}',
      },
    },
    {
      actor: 'software-wallet',
      role: {
        en: 'Applies a default of its own. Bitcoin Core’s wallet prefers to spend a coin received from someone else only once it has six confirmations, and its window lists a payment as still confirming until then.',
        zh: '錢包有自己的預設做法。Bitcoin Core 的錢包傾向等別人付來的款項有六個確認後才動用，而在此之前，介面會把這筆付款列為仍在確認中。',
      },
      artifact: {
        kind: 'file',
        label: 'src/wallet/spend.cpp',
        detail: {
          en: 'Coin selection first tries `CoinEligibilityFilter(1, 6, 0)`: one confirmation for the wallet’s own change, six for coins from other wallets. Only if that cannot fund the payment does it settle for one. The graphical wallet’s `RecommendedNumConfirmations` is 6 as well.',
          zh: '選幣時首先嘗試 `CoinEligibilityFilter(1, 6, 0)`：錢包自己的找續只需 1 個確認，來自其他錢包的款項則要 6 個。湊不夠數，才退而接受 1 個。圖形介面錢包的 `RecommendedNumConfirmations` 同樣是 6。',
        },
        snippet:
          '// src/wallet/spend.cpp\n{CoinEligibilityFilter(1, 6, 0),\n /*allow_mixed_output_types=*/false},\n{CoinEligibilityFilter(1, 1, 0)},\n\n// src/qt/transactionrecord.h\nstatic constexpr int\n  RecommendedNumConfirmations{6};',
      },
    },
    {
      actor: 'full-node',
      role: {
        en: 'Follows the branch with the most work and switches the moment another branch has more. This is the step an attacker races to trigger, and nobody has to approve it.',
        zh: '節點跟隨工作量最多的分支；另一條分支的工作量一旦超前，便立即改跟那一條。攻擊者拼命想觸發的正是這一步，而它毋須任何人批准。',
      },
      artifact: {
        kind: 'file',
        label: 'src/validation.cpp',
        detail: {
          en: '`ActivateBestChain()` takes the best candidate from `FindMostWorkChain()`, disconnects blocks back to the [[fork]] point and connects the other branch: a [[reorg]]. Transactions of the abandoned blocks are offered to the mempool again; one that conflicts with the new branch no longer passes and is dropped.',
          zh: '`ActivateBestChain()` 向 `FindMostWorkChain()` 取得最佳候選，把區塊逐個撤銷至[[fork|分叉]]點，再接上另一條分支，這就是[[reorg|重組]]。被放棄的區塊所含的交易會重新送交記憶池；與新分支衝突的交易通不過檢查，就此被丟棄。',
        },
        snippet:
          '$ bitcoin-cli getchaintips\n[\n  { "height": 123456,\n    "hash": "0000…",\n    "branchlen": 0,\n    "status": "active" },\n  { "height": 123455,\n    "hash": "0000…",\n    "branchlen": 1,\n    "status": "valid-fork" }\n]',
      },
    },
  ],

  paperVsToday: {
    en: [
      'The paper’s z counts blocks linked after the block that holds the payment. Software counts that block too: in Bitcoin Core `confirmations` is the [[block-height|height]] of the newest block minus the height of the payment’s block, plus one, so a payment in the newest block already has one. The paper’s z = 5 is what wallets call six confirmations.',
      '“Six confirmations” is a convention drawn from numbers like these, not a rule of the network. No rule that decides whether a block or a transaction is valid mentions six. The number lives in wallet code, as a default for which coins to spend and when to show a payment as settled, and every merchant is free to pick another. The only depth the rules fix for everyone concerns newly mined coins, which cannot be spent until 100 blocks later (`COINBASE_MATURITY`).',
      'Chains are compared by accumulated work, not by length. Each block counts for the number of hashes its [[target]] implies, about 2^256 ÷ (target + 1), and a node follows the chain where the total is greatest. That is the paper’s [[longest-chain|longest chain]] only while both branches have the same difficulty.',
      'The formula counts the z blocks on top of the payment’s block and treats drawing level as success. The software is stricter on both counts: the attacker’s branch must also replace the block that holds the payment, and a node offered two branches with equal work stays on the one it had first, as {§5} already says, so drawing level is not enough.',
      'The model keeps q fixed for as long as the race lasts and assumes the honest blocks arrived at exactly their average pace; the paper states the second assumption in its own words. Neither holds exactly on a live network, so the tables are best read as orders of magnitude and not as guarantees. No payment is ever mathematically final. The [[irreversibility]] the paper promises is a practical one: undoing a payment becomes too costly to attempt, not impossible.',
    ],
    zh: [
      '白皮書的 z，數的是付款所在區塊之後再接上的區塊。軟件則連那個區塊也算在內：在 Bitcoin Core 裏，`confirmations` 等於鏈上最新區塊的[[block-height|區塊高度]]減去付款所在區塊的高度，再加一，所以剛被收進最新區塊的付款已有 1 個確認。白皮書的 z = 5，就是錢包所說的六個確認。',
      '「六個確認」是由這類數字引伸出來的慣例，並不是網絡的規則。判定區塊或交易是否有效的規則當中，沒有一條提到六。這個數字只見於錢包的程式碼，作為「動用哪些款項」和「何時把付款顯示為已落實」的預設值；每個商戶都可以另訂標準。規則本身為所有人定死的深度只有一個：新挖出的幣要等 100 個區塊之後才可動用（`COINBASE_MATURITY`）。',
      '比較兩條鏈，看的是累積的工作量，而不是長度。每個區塊按其[[target|目標值]]所代表的哈希次數計算，約為 2^256 ÷（目標值 + 1）；節點跟隨總和最大的那條鏈。只有在兩條分支難度相同時，這才等同於白皮書所說的[[longest-chain|最長鏈]]。',
      '公式只計算付款所在區塊之上的 z 個區塊，並把追平當作成功。實際的軟件在這兩點上都更嚴格：攻擊者的分支還得取代付款所在的那個區塊；而正如 {§5} 所述，兩條分支工作量相同時，節點會留在自己較早取得的那一條，所以追平並不足夠。',
      '這個模型假設 q 在整場競賽中保持不變，又假設誠實區塊剛好按平均速度出現；後一個假設，白皮書自己已有言明。在真實的網絡上，兩者都不會完全成立，所以這些表宜當作數量級來看，而不是保證。沒有一筆付款在數學上是絕對落實的。白皮書所承諾的[[irreversibility|不可逆性]]是實際意義上的：推翻一筆付款的代價高得不值一試，而非不可能。',
    ],
  },
};

export default section;
