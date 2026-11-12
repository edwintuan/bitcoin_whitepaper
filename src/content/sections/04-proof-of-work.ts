import type { SectionContent } from '../types';

const section: SectionContent = {
  id: 'proof-of-work',
  number: 4,
  part: 3,
  title: { en: 'Proof-of-Work', zh: '工作量證明' },

  tldr: {
    en: 'To add a [[block]], a computer must find a number that makes the block’s [[hash]] begin with a run of zeros. Finding it takes a vast number of guesses. Checking it takes one.',
    zh: '要加上一個[[block|區塊]]，電腦必須找出一個數字，令該區塊的[[hash|哈希值]]以一連串零開頭。找到它要猜無數次，驗證卻只需算一次。',
  },

  analogy: {
    en: 'Throwing a handful of dice until every one shows a six. Anyone can see the result at a glance, and there is no way to get there except to keep throwing. Each block is sealed with such a throw, and every block added on top is one more throw a forger would have to repeat.',
    zh: '就像擲一把骰子，要全部擲出六點才算數。結果一眼就看得出來，但除了不停地擲，別無捷徑。每個區塊都靠這樣的一擲來封存；其後每多一個區塊，偽造者就要多重擲一次。',
  },

  body: {
    en: [
      'A [[timestamp-server|timestamp server]] run by one company would bring back the trusted party the paper set out to remove. So instead of publishing each hash in a newspaper, the paper asks for something anyone can produce and anyone can check: [[proof-of-work]], an idea borrowed from Adam Back’s [[hashcash|Hashcash]].',
      'The rule is short. Run the block through [[sha-256|SHA-256]]; the result must begin with a required number of [[zero-bits|zero bits]]. A hash cannot be steered, so the only way to get one that qualifies is to change a spare field in the block, the [[nonce]], and try again. Each extra zero bit doubles the number of tries you should expect. Checking someone else’s answer is a single hash.',
      'Once that effort has been spent on a block, the block cannot be changed without spending it again. And because every block carries the hash of the block before it, as in {§3}, changing an old block means redoing its work and the work of every block that came after.',
      'Proof-of-work also settles who decides. Counting one vote per IP address would hand the result to whoever can collect the most addresses. Counting work means one CPU, one vote. The [[longest-chain|longest chain]] is the one with the most work in it, so while honest machines hold most of the [[hash-rate|computing power]], their chain grows fastest and anyone rewriting history falls further behind with every block. {§11} puts numbers on how fast.',
      'Hardware gets quicker and [[miner|miners]] come and go, so the number of zeros is not fixed. The [[difficulty]] follows a moving average that aims for a steady number of blocks per hour: if blocks arrive too fast, it goes up.',
    ],
    zh: [
      '若[[timestamp-server|時間戳伺服器]]由一家公司營運，白皮書一心要擺脫的可信第三方又回來了。因此白皮書不再要求把每個哈希「登報」，而是改用一種人人都能做、人人都能驗的憑據：[[proof-of-work|工作量證明]]。這個構想借自 Adam Back 的 [[hashcash|Hashcash]]。',
      '規則很短：把區塊送進 [[sha-256|SHA-256]]，結果必須以指定數量的[[zero-bits|零位元]]開頭。哈希無法被引導，要得到合格的結果，只能改動區塊裏一個閒置欄位，也就是[[nonce|隨機數]]，然後再試。每多要求一個零位元，預期的嘗試次數便加倍；而驗證別人的答案，只需算一次哈希。',
      '一旦為某個區塊付出了這番工夫，要改動它就得重新再付一次。而且正如 {§3} 所述，每個區塊都帶着前一個區塊的哈希，所以改動舊區塊，就要重做它本身以及其後每一個區塊的工作。',
      '工作量證明同時解決了「由誰說了算」的問題。若按 IP 地址一址一票，誰能弄到最多地址，誰就贏。按工作量計算，則是一個 CPU 一票。[[longest-chain|最長鏈]]就是累積了最多工作量的那條鏈；只要誠實的機器掌握大部分[[hash-rate|算力]]，它們的鏈就增長得最快，想改寫歷史的人每過一個區塊便落後得更遠。{§11} 會算出落後得有多快。',
      '硬件愈來愈快，[[miner|礦工]]來來去去，所以零的數量不是固定的。[[difficulty|難度]]按移動平均值調整，目標是每小時產出穩定數量的區塊：出塊太快，難度便上調。',
    ],
  },

  figure: {
    component: 'PowMiner',
    title: { en: 'Mine a block yourself', zh: '親手挖一個區塊' },
    steps: {
      en: [
        {
          title: 'Meet the block header',
          text: 'These six fields, 80 bytes in all, are what gets hashed. Point at a field to see what it holds.',
        },
        {
          title: 'Set the difficulty',
          text: 'Drag the slider. Every extra zero bit doubles the work: 12 bits is about 4,096 tries, 20 bits is about a million.',
        },
        {
          title: 'Mine',
          text: 'Press Mine. The [[nonce]] counts up and the [[hash]] changes completely each time, until one lands at or below the [[target]].',
        },
        {
          title: 'Try to cheat',
          text: 'Change what the first block says. Its hash no longer qualifies, and every block after it now points at a hash that does not exist. Repair the chain and watch what it costs.',
        },
        {
          title: 'Check the real thing',
          text: 'This is the header of the [[genesis-block|genesis block]], Bitcoin’s first, mined in January 2009. Hash it in your browser and compare the result with the one every node knows.',
        },
      ],
      zh: [
        {
          title: '認識區塊頭',
          text: '這六個欄位合共 80 位元組，被拿去計算哈希的就是它們。把指標移到欄位上，看看各自存放甚麼。',
        },
        {
          title: '設定難度',
          text: '拖動滑桿。每多一個零位元，工作量加倍：12 位元大約要試 4,096 次，20 位元大約要試一百萬次。',
        },
        {
          title: '挖礦',
          text: '按「挖礦」。[[nonce|隨機數]]逐一遞增，[[hash|哈希值]]每次都面目全非，直到有一個不大於[[target|目標值]]為止。',
        },
        {
          title: '試試作弊',
          text: '改動第一個區塊的內容。它的哈希不再達標，其後每個區塊所指向的哈希亦隨之失效。修復這條鏈，看看要付出多少代價。',
        },
        {
          title: '驗證真實數據',
          text: '這是比特幣第一個區塊，即[[genesis-block|創世區塊]]的區塊頭，挖於 2009 年 1 月。在你的瀏覽器裏算一次哈希，再與所有節點都認得的那個結果比對。',
        },
      ],
    },
  },

  whoRuns: [
    {
      actor: 'asic-miner',
      role: {
        en: 'Does the guessing. A mining machine computes double SHA-256 on block headers and nothing else.',
        zh: '負責不停地猜。礦機只做一件事：對區塊頭計算雙重 SHA-256。',
      },
      artifact: {
        kind: 'hardware',
        label: 'SHA-256d ASIC',
        detail: {
          en: 'The [[nonce]] is only four bytes, which such a machine runs through almost at once. It then needs a new header to search, usually made by altering the [[coinbase|coinbase transaction]] so that the [[merkle-root|Merkle root]] changes.',
          zh: '[[nonce|隨機數]]只有四個位元組，礦機轉眼就試完。之後它需要一個新的區塊頭來繼續搜尋，通常是改動 [[coinbase|coinbase 交易]]，令[[merkle-root|默克爾根]]隨之改變。',
        },
      },
    },
    {
      actor: 'mining-pool',
      role: {
        en: 'Hands out the work and collects the answers, so thousands of machines can search without repeating one another.',
        zh: '負責分派工作、收集答案，讓成千上萬部礦機各自搜尋而不重複。',
      },
      artifact: {
        kind: 'protocol',
        label: 'Stratum · mining.notify',
        detail: {
          en: 'The job message a [[mining-pool|pool]] sends over the [[stratum|Stratum]] protocol. It carries everything a miner needs to build headers by itself: the previous block hash, the coinbase transaction in two halves, the Merkle branch, the version, the [[bits|compact target]] and the time.',
          zh: '[[mining-pool|礦池]]透過 [[stratum]] 發出的任務訊息，內含礦機自行組出區塊頭所需的一切：上一個區塊的哈希、分成兩半的 coinbase 交易、默克爾分支、版本、[[bits|壓縮形式的目標值]]，以及時間。',
        },
        snippet:
          '{"id": null, "method": "mining.notify",\n "params": ["job_id", "prevhash", "coinb1", "coinb2",\n            ["merkle_branch", "..."],\n            "version", "nbits", "ntime", clean_jobs]}',
      },
    },
    {
      actor: 'full-node',
      role: {
        en: 'Checks the answer. Every node hashes the header once and compares the result with the target the header itself declares.',
        zh: '負責驗證答案。每個節點把區塊頭算一次哈希，再與區塊頭自行聲明的目標值比較。',
      },
      artifact: {
        kind: 'file',
        label: 'src/pow.cpp',
        detail: {
          en: '`CheckProofOfWork()` expands the header’s compact target and rejects the block if its hash is larger. The same file works out the next difficulty.',
          zh: '`CheckProofOfWork()` 把區塊頭內的壓縮目標值展開；若區塊的哈希比它大，便拒絕該區塊。下一期的難度亦由同一個檔案計算。',
        },
        snippet:
          '$ bitcoin-cli getblockheader \\\n    000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f\n{\n  "height": 0,\n  "merkleroot": "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",\n  "time": 1231006505,\n  "nonce": 2083236893,\n  "bits": "1d00ffff",\n  "difficulty": 1,\n  ...\n}',
      },
    },
  ],

  paperVsToday: {
    en: [
      'The paper counts zero bits. Bitcoin compares numbers: a block is valid when its hash, read as a 256-bit integer, is not greater than a [[target]]. That lets the difficulty move in fine steps instead of doubling.',
      'What gets hashed is the 80-byte [[block-header]], with SHA-256 applied twice ([[double-sha256]]), not the whole block. The transactions are bound in through the [[merkle-root|Merkle root]] the header contains, the subject of {§7}.',
      '“A moving average” became a fixed rule, the [[retarget|difficulty adjustment]]. Every 2,016 blocks, about two weeks, the target is scaled by how long those blocks actually took, and a single adjustment may not exceed a factor of four in either direction.',
      '“Longest chain” is implemented as most work. A node adds up the expected work behind every block ([[chainwork]]) and follows the chain where that total is greatest, which need not be the one with the most blocks.',
      'One CPU, one vote did not last. [[mining|Mining]] moved to graphics cards and then to purpose-built chips ([[asic|ASICs]]); the vote is by hash rate, whoever supplies it.',
      'A 32-bit [[nonce]] is far too small for modern hardware. Miners also vary the coinbase transaction, the timestamp and spare bits of the version field to keep finding fresh headers to try.',
    ],
    zh: [
      '白皮書數的是零位元的個數；比特幣實際比較的是數值：把哈希視為一個 256 位元的整數，只要不大於[[target|目標值]]，區塊即屬有效。這樣難度便可以細緻調整，而不是每次翻倍。',
      '被計算哈希的是 80 位元組的[[block-header|區塊頭]]，而且 SHA-256 要連做兩次（[[double-sha256|雙重 SHA-256]]），並非整個區塊。交易則透過區塊頭內的[[merkle-root|默克爾根]]與之綁定，詳見 {§7}。',
      '「移動平均值」落實成一條固定規則，即[[retarget|難度調整]]：每 2,016 個區塊（約兩星期），按這批區塊實際花費的時間等比例調整目標值，而且單次調整幅度不得超過四倍，上調下調皆然。',
      '「最長鏈」實際上是「工作量最多的鏈」。節點把每個區塊背後的預期工作量累加起來（[[chainwork|累計工作量]]），跟隨總和最大的那條鏈，而它不一定是區塊數目最多的一條。',
      '「一個 CPU 一票」沒有維持多久。[[mining|挖礦]]先轉到顯示卡，再轉到專用晶片（[[asic|ASIC]]）；如今投票憑的是算力，不問算力來自何處。',
      '32 位元的[[nonce|隨機數]]對現代硬件而言遠遠不夠用。礦工還會改動 coinbase 交易、時間戳，以及版本欄位裏的閒置位元，藉此不斷得到新的區塊頭來嘗試。',
    ],
  },
};

export default section;
