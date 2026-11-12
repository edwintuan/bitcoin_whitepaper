import type { SectionContent } from '../types';

const section: SectionContent = {
  id: 'abstract',
  number: 0,
  part: 1,
  title: { en: 'Abstract', zh: '摘要' },

  tldr: {
    en: 'Electronic cash that goes straight from payer to payee, with no bank in between. A network of computers keeps one shared record of every payment, and rewriting that record would take more [[hash-rate|computing power]] than the rest of the network has.',
    zh: '一種由付款人直接交到收款人手上的電子現金，中間不經任何銀行。整個網絡的電腦共同維護同一份付款記錄；誰想改寫這份記錄，就得擁有比網絡其餘部分加起來還要多的[[hash-rate|算力]]。',
  },

  analogy: {
    en: 'A village with no bank. Every payment is called out in the square, and every household keeps its own copy of the same book. Adding a page takes hours of hard work, so when two copies disagree the village goes with the longer one: honest households working together fill pages faster than any cheat can alone.',
    zh: '一個沒有銀行的村莊。每筆付款都在廣場上當眾宣佈，家家戶戶各自保存一本內容相同的賬簿。要添上新的一頁，得花好幾個小時的苦工；所以當兩本賬簿出現分歧，全村便以較長的一本為準：老實的人家同心協力，添頁的速度總比單打獨鬥的騙子快。',
  },

  body: {
    en: [
      'The abstract opens with the goal: electronic cash that can be sent over the Internet from one person to another, [[peer-to-peer]], without passing through a bank or a payment company. Everything else in the paper serves that one sentence.',
      'It then says how far existing tools get. A [[digital-signature|digital signature]] proves that the owner of a coin approved a payment. It cannot prove that the same owner has not already paid the same coin to somebody else. That is [[double-spending]], and if a [[trusted-third-party|trusted third party]] is still needed to prevent it, the point of the exercise is lost. {§2} works through both halves.',
      'The proposal is to let a network do the checking. Its [[node|nodes]] give every transaction a [[timestamp]] by hashing it into a chain of [[proof-of-work]], so that the record cannot be altered without doing the work again. {§3} builds the chain and {§4} adds the work.',
      'One object then answers two questions. The [[longest-chain|longest chain]] is the agreed order of events, and it is also the evidence that most of the network’s [[hash-rate|computing power]] stands behind that order. As long as the nodes holding the majority of that power are not cooperating in an attack, their chain grows fastest and an attacker falls further behind. The condition matters: a group that held the majority and turned it against the network could mount what is now called a [[majority-attack|majority attack]]. {§11} puts numbers on it.',
      'Last, the network asks very little of its members. Messages are [[broadcast]] on a [[best-effort|best effort]] basis, with no guarantee of delivery. Nodes may leave and come back whenever they like, and on returning they accept the longest chain as the account of what happened while they were away. {§5} describes how.',
    ],
    zh: [
      '摘要開宗明義提出目標：一種可以在互聯網上由一個人直接發送給另一個人的電子現金，以[[peer-to-peer|點對點]]方式進行，毋須經過銀行或支付公司。整篇白皮書其餘的內容，都是為這一句話服務。',
      '接着，摘要交代現有工具能走多遠。[[digital-signature|數碼簽署]]可以證明一枚幣的擁有者認可了某筆付款，卻無法證明同一位擁有者沒有把同一枚幣付給別人。這就是[[double-spending|雙重支付]]；如果仍要靠[[trusted-third-party|可信第三方]]來防止它，整件事便失去意義。{§2} 會把這兩方面逐一講清楚。',
      '白皮書的方案，是把核對的工作交給一個網絡。網絡中的[[node|節點]]為交易加上[[timestamp|時間戳]]：把交易以哈希運算納入一條[[proof-of-work|工作量證明]]鏈，於是不把工作重做一遍，便無法更改記錄。{§3} 先搭起這條鏈，{§4} 再為它加上工作量。',
      '於是，同一樣東西回答了兩個問題。[[longest-chain|最長鏈]]既是眾人公認的事件先後次序，也是一項證據，證明網絡上大部分[[hash-rate|算力]]都站在這個次序背後。只要掌握多數算力的節點沒有聯手發動攻擊，它們的鏈便增長得最快，攻擊者只會愈落愈後。這個條件不可或缺：一旦有人掌握過半算力並用來對付網絡，便是今天所說的[[majority-attack|多數算力攻擊]]。{§11} 會算出具體數字。',
      '最後，這個網絡對成員的要求極低。訊息以[[best-effort|盡力而為]]的方式[[broadcast|廣播]]，並不保證送達。節點可以隨時離開、隨時回來；回來之後，只需接受最長鏈，把它當作自己離開期間所發生事情的記錄。{§5} 會說明具體做法。',
    ],
  },

  // The hero and the journey above stand in for a figure of its own.
  figure: null,

  whoRuns: [
    {
      actor: 'software-wallet',
      role: {
        en: 'Keeps the keys and signs payments with them: the abstract’s “digital signatures”.',
        zh: '保管密鑰，並用它們簽署付款：摘要所說的「數碼簽署」，就由它負責。',
      },
      artifact: {
        kind: 'rpc',
        label: 'sendtoaddress',
        detail: {
          en: 'The Bitcoin Core wallet command that makes a payment. It picks coins to spend, builds and signs the [[transaction]], hands it to the node to broadcast, and answers with the id of the new transaction.',
          zh: 'Bitcoin Core 錢包用來付款的指令：挑選要花的幣，組出並簽署[[transaction|交易]]，交給節點廣播，然後回覆這筆新交易的 ID。',
        },
        snippet: '$ bitcoin-cli sendtoaddress \\\n    "<address>" 0.1\n<id of the new transaction>',
      },
    },
    {
      actor: 'full-node',
      role: {
        en: 'Checks every transaction and block against the rules, passes them on, and follows the chain with the most work: the abstract’s “network”.',
        zh: '按規則核對每筆交易和每個區塊，轉發給其他節點，並跟隨工作量最多的那條鏈：摘要所說的「網絡」，就是由它們組成。',
      },
      artifact: {
        kind: 'rpc',
        label: 'getblockchaininfo',
        detail: {
          en: 'A node’s own summary of the chain it follows: the height of its newest block, that block’s hash, and `chainwork`, the total work in the chain.',
          zh: '節點對自己所跟隨的那條鏈的概覽：最新區塊的高度、該區塊的哈希，以及 `chainwork`，即整條鏈累積的工作量。',
        },
        snippet:
          '$ bitcoin-cli getblockchaininfo\n{\n  "chain": "main",\n  "blocks": ...,\n  "bestblockhash": "...",\n  "chainwork": "...",\n  ...\n}',
      },
    },
    {
      actor: 'asic-miner',
      role: {
        en: 'Supplies the abstract’s “CPU power”: it hashes block headers until one qualifies as [[proof-of-work]].',
        zh: '提供摘要所說的「CPU 算力」：不斷為區塊頭計算哈希，直至有一個符合[[proof-of-work|工作量證明]]的要求。',
      },
      artifact: {
        kind: 'rpc',
        label: 'getnetworkhashps',
        detail: {
          en: 'A node’s estimate of how many hashes a second all miners together are computing, worked out from how quickly recent blocks arrived. It is the nearest thing to a gauge for the abstract’s “pool of CPU power”.',
          zh: '節點對全體礦工每秒合共計算多少次哈希的估算，按近期區塊出現的快慢推算出來。要量度摘要所說的「CPU 算力池」，這是最接近的一把尺。',
        },
        snippet: '$ bitcoin-cli getnetworkhashps',
      },
    },
  ],

  paperVsToday: {
    en: [
      '“Longest” means most work. A node adds up the work behind every block and follows the chain with the greatest total, its [[chainwork]], which need not be the chain with the most blocks. {§4} explains why.',
      'In the paper the nodes are the miners, and “CPU power” is what each node contributes. The first client mined inside the program itself (`BitcoinMiner()` in the 2009 `main.cpp`). Today checking and mining are separate jobs: mining software asks a node for a block to work on through [[getblocktemplate]].',
      'The word “[[blockchain]]” is not in the paper, and “Bitcoin” appears only in its title and its web address. The abstract speaks of “an ongoing chain of hash-based proof-of-work”; the source code calls it the block chain.',
      '“Broadcast” is done in steps. A node announces a transaction by its hash ([[inv]]) and sends it only to a peer that asks for it ([[getdata]]), so that no transaction goes to a peer that already has it. A new block is announced by its header, or sent at once in [[compact-blocks|compact form]]. {§5} follows the messages.',
      'A node that comes back does not take the longest chain on trust. It downloads the block headers and checks the proof-of-work on each, then fetches the blocks and checks them against the rules for itself before following that chain.',
    ],
    zh: [
      '「最長」其實是指工作量最多。節點把每個區塊背後的工作量加起來，跟隨總和最大的那條鏈，即[[chainwork|累計工作量]]最多的一條；它不一定是區塊數目最多的。{§4} 會解釋原因。',
      '在白皮書裏，節點就是礦工，「CPU 算力」由每個節點自行提供。最初的客戶端把挖礦寫在程式之內（2009 年 `main.cpp` 的 `BitcoinMiner()`）。今天驗證和挖礦已是兩項分開的工作：挖礦軟件透過 [[getblocktemplate]] 向節點索取待挖的區塊。',
      '白皮書通篇沒有「[[blockchain|區塊鏈]]」一詞，「Bitcoin」也只見於標題和網址。摘要說的是「一條不斷延伸、基於哈希的工作量證明鏈」；源碼則稱之為 block chain。',
      '「廣播」分幾步進行。節點先以 [[inv]] 公佈交易的哈希，對等節點提出要求（[[getdata]]）才把交易發過去，以免把交易發給早已擁有它的節點。新區塊則以區塊頭通報，或直接以[[compact-blocks|精簡區塊]]的形式發送。{§5} 會跟着這些訊息走一遍。',
      '重新上線的節點不會盲目相信最長鏈。它先下載區塊頭，逐一核對工作量證明，再取得區塊，親自按規則檢查一遍，然後才跟隨這條鏈。',
    ],
  },
};

export default section;
