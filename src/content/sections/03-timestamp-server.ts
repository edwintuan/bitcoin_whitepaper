import type { SectionContent } from '../types';

const section: SectionContent = {
  id: 'timestamp-server',
  number: 3,
  part: 3,
  title: { en: 'Timestamp Server', zh: '時間戳伺服器' },

  tldr: {
    en: '[[hash|Hash]] a batch of items and publish the hash, and you have proof the items existed by then. Put each hash inside the next batch, and the proofs form a chain in which every new link backs up all the ones before it.',
    zh: '把一批項目算出[[hash|哈希]]並公開發佈，就證明了這些項目在當時已經存在。再把每個哈希放進下一批項目之中，這些證明便連成一條鏈，每添一環，都為之前的所有環節多加一重保證。',
  },

  analogy: {
    en: 'An account book in which every page ends with a running total, and the next page begins by carrying that total forward. Change one old figure and that page’s total changes, so the next page no longer starts from the right number, and putting it right means redoing every total to the end of the book. The totals are read out at every meeting, so everyone knows what they were.',
    zh: '就像一本賬簿：每頁末尾結出累計總數，下一頁開首先承接這個總數。改動舊頁上任何一個數字，該頁的總數便跟着改變，下一頁的開首隨即對不上；要補救，就得把其後每一頁的總數逐一重算，直到簿末。而且每次開會都會當眾宣讀總數，所以人人都知道原來的數字。',
  },

  body: {
    en: [
      '{§2} ended on a need: one agreed history of the order in which transactions arrived. The paper’s solution starts from an older idea, the [[timestamp-server|timestamp server]].',
      'A timestamp server takes a batch of items, a [[block]], computes its [[hash]], and publishes the hash where many people will see it and nobody can quietly change it. The paper’s examples are a newspaper and a Usenet post. The items themselves need not be shown to anyone.',
      'The published hash is a [[timestamp]]. It proves that every item in the block existed by the time of publication, for a plain reason: the items had to exist in order to be hashed. Change a single character afterwards and the block no longer produces the hash that was printed.',
      'Then comes the step that matters for everything after it. Each timestamp includes the previous timestamp in what it hashes. The hashes form a chain, and each new one vouches again for all those before it: to alter an old block you would need a new hash for it and for every block since. This is the idea the word [[blockchain]] now names.',
      'This much fixes the order of events and makes any change visible. It does not yet say who may run the server, and it does not stop whoever runs it from recomputing the whole chain, which costs next to nothing. {§4} deals with both.',
    ],
    zh: [
      '{§2} 結尾提出了一個需要：所有人對交易到達的先後次序，要有同一套說法。白皮書的方案，由一個早已有之的構想開始：[[timestamp-server|時間戳伺服器]]。',
      '時間戳伺服器把一批項目組成一個[[block|區塊]]，算出它的[[hash|哈希]]，再把哈希發佈到人人看得見、誰也無法暗中改動的地方。白皮書舉的例子是報章和 Usenet 帖子。項目本身，毋須向任何人公開。',
      '發佈出來的哈希，就是一個[[timestamp|時間戳]]。它證明區塊裏的每個項目在發佈之時已經存在，道理很簡單：項目要先存在，才能被拿去計算哈希。事後哪怕只改動一個字，這個區塊便再也算不出當日刊登的那個哈希。',
      '接下來的一步，對往後的一切至關重要：每個時間戳都把前一個時間戳納入自己的哈希之中。哈希於是連成一條鏈，每多一個，便為之前的全部再作一次擔保。要改動舊區塊，就得為它以及其後的每個區塊重新算出哈希。今天所說的[[blockchain|區塊鏈]]，指的就是這個構想。',
      '做到這一步，事件的先後次序便確定下來，任何改動亦無所遁形。但它還沒有回答由誰來營運這部伺服器，也阻止不了營運者把整條鏈重新算一遍，而這樣做幾乎不費分毫。這兩個問題，留待 {§4} 解決。',
    ],
  },

  figure: {
    component: 'TimestampChain',
    title: { en: 'Chain four timestamps, then rewrite one', zh: '串起四個時間戳，再改寫其中一個' },
    steps: {
      en: [
        {
          title: 'Four timestamps in a row',
          text: 'Each block holds two items and the hash of the block before it. Its own hash is the SHA-256 of both, computed in your browser.',
        },
        {
          title: 'Follow one link',
          text: 'Look at the two marked lines. The hash that block 2 carries is, digit for digit, the hash of block 1. That is all a link in the chain is.',
        },
        {
          title: 'Change the past',
          text: 'Edit an item in block 2. Its hash changes at once, and blocks 3 and 4, which were published on top of the old hash, no longer follow.',
        },
        {
          title: 'Publish it again',
          text: 'Press Publish again. Each later block takes the new hash and is hashed once more, and the chain is whole. Look at how little that cost.',
        },
      ],
      zh: [
        {
          title: '一排四個時間戳',
          text: '每個區塊裝着兩個項目，以及前一個區塊的哈希。它自己的哈希，就是把兩者一併以 SHA-256 計算的結果，由你的瀏覽器即場算出。',
        },
        {
          title: '看清其中一環',
          text: '看看標示出來的兩行：區塊 2 所帶的哈希，與區塊 1 的哈希一字不差。所謂鏈上的一環，不過如此。',
        },
        {
          title: '改動過去',
          text: '改動區塊 2 的一個項目。它的哈希立即改變；區塊 3 和區塊 4 當初建基於舊哈希，如今再也接不上。',
        },
        {
          title: '重新發佈',
          text: '按「重新發佈」。其後每個區塊換上新的哈希，各自重算一次，整條鏈便又接上了。看看這只花了多少工夫。',
        },
      ],
    },
  },

  whoRuns: [
    {
      actor: 'full-node',
      role: {
        en: 'Keeps the paper’s chain of timestamps as two fields in every block header: the hash of the block before, and the time the block claims. It refuses a block whose time is out of bounds.',
        zh: '以每個區塊頭裏的兩個欄位，保存白皮書所說的時間戳鏈：上一個區塊的哈希，以及區塊自稱的時間。時間超出容許範圍的區塊，它一概拒絕。',
      },
      artifact: {
        kind: 'file',
        label: 'src/primitives/block.h',
        detail: {
          en: '`hashPrevBlock` is the previous timestamp and `nTime` is the time, in seconds since 1970. A block is rejected if its time is not later than the median of the eleven blocks before it, or is more than two hours ahead of the node’s own clock.',
          zh: '`hashPrevBlock` 就是前一個時間戳，`nTime` 則是時間，以 1970 年起計的秒數表示。區塊的時間若不晚於前 11 個區塊的時間中位數，或比節點自己的時鐘快超過兩小時，便會被拒絕。',
        },
        snippet:
          '$ bitcoin-cli getblockheader \\\n    00000000839a8e6886ab5951d76f411475428afc90947ee320161bbf18eb6048\n{\n  "height": 1,\n  "time": 1231469665,\n  "mediantime": 1231469665,\n  "previousblockhash": "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",\n  ...\n}',
      },
    },
    {
      actor: 'explorer',
      role: {
        en: 'Shows anyone which block a transaction is buried in and the time that block carries, without the reader having to run a node.',
        zh: '讓任何人毋須自行運行節點，也能查到一筆交易埋在哪個區塊，以及該區塊所載的時間。',
      },
      artifact: {
        kind: 'rpc',
        label: 'getrawtransaction',
        detail: {
          en: 'What an explorer looks up for you. Asked for details, a node that indexes transactions (`-txindex`) answers with the `blockhash` of the block holding the transaction, that block’s `blocktime`, and the number of `confirmations` since.',
          zh: '區塊瀏覽器替你查的就是這個。向一個為交易建立了索引（`-txindex`）的節點查詢詳情，它會回覆交易所在區塊的 `blockhash`、該區塊的 `blocktime`，以及至今累積的 `confirmations`。',
        },
        snippet:
          '$ bitcoin-cli getrawtransaction "<txid>" 1\n{\n  "txid": "...",\n  ...\n  "blockhash": "...",\n  "confirmations": ...,\n  "blocktime": ...\n}',
      },
    },
  ],

  paperVsToday: {
    en: [
      'Nothing is printed in a newspaper. A block’s hash is published by sending the block to every [[node]], and what makes it hard to replace is the [[proof-of-work]] of {§4}, not the reach of a publisher. The first block turns the newspaper idea around: the [[genesis-block|genesis block]] carries a headline from The Times of 3 January 2009, which shows it was not made before that day.',
      'The “block of items” is a block of transactions, and the hash is not taken over all of them directly. It is taken over an 80-byte [[block-header|header]] that sums the transactions up in one [[merkle-root|Merkle root]] ({§7}) and carries the previous header’s hash in its `hashPrevBlock` field.',
      'A block’s time is the miner’s own claim, held within loose bounds: later than the median of the previous eleven blocks, and no more than two hours ahead of the clock of the node checking it. A block can therefore carry an earlier time than the block before it. The order of events comes from the chain, not from the clock.',
      'The time field still has work to do. Every 2,016 blocks the [[difficulty]] is reset from the times those blocks carry ({§4}), and a transaction can be locked until a given time, measured against the median of the last eleven blocks (BIP 113).',
      'The paper describes one timestamp server here and only distributes it in {§4}. In Bitcoin the next timestamp is published by whichever [[miner]] finds the next proof-of-work, and that can be a different one every block.',
    ],
    zh: [
      '今天沒有甚麼會登在報章上。區塊的哈希是靠把區塊發送給每個[[node|節點]]來發佈的；令它難以被替換的，是 {§4} 的[[proof-of-work|工作量證明]]，而不是出版者的發行量。第一個區塊倒是把登報的做法反過來用：[[genesis-block|創世區塊]]載有 2009 年 1 月 3 日《泰晤士報》的一則標題，足以說明它不可能在該日之前造出。',
      '「一個由項目組成的區塊」，如今是一個裝着交易的區塊，而哈希並非直接對全部交易計算，而是對 80 位元組的[[block-header|區塊頭]]計算：區塊頭以一個[[merkle-root|默克爾根]]概括全部交易（{§7}），並在 `hashPrevBlock` 欄位載有上一個區塊頭的哈希。',
      '區塊的時間由礦工自行填報，只受寬鬆的限制：必須晚於前 11 個區塊的時間中位數，又不得比負責驗證的節點的時鐘快超過兩小時。因此，一個區塊所報的時間可以比上一個區塊還要早。事件的先後取決於鏈，而不是時鐘。',
      '時間欄位仍有實際用途。每隔 2,016 個區塊，[[difficulty|難度]]便按這批區塊所報的時間重新設定（{§4}）；交易亦可以鎖定至某個時間才生效，並以最近 11 個區塊的時間中位數為準（BIP 113）。',
      '白皮書在這一節描述的是單獨一部時間戳伺服器，到 {§4} 才把它分散開來。在比特幣裏，下一個時間戳由找到下一個工作量證明的[[miner|礦工]]發佈，每個區塊都可能換人。',
    ],
  },
};

export default section;
