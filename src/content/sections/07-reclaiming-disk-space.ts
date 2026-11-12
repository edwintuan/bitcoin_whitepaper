import type { SectionContent } from '../types';

const section: SectionContent = {
  id: 'reclaiming-disk-space',
  number: 7,
  part: 5,
  title: { en: 'Reclaiming Disk Space', zh: '回收磁碟空間' },

  tldr: {
    en: 'A block’s transactions are hashed in pairs, level by level, into a single [[merkle-root|root]], and only that root goes into the [[block-header|header]]. Old transactions can then be thrown away without changing the block’s [[hash]].',
    zh: '區塊內的交易兩兩合併計算哈希，逐層歸結為一個[[merkle-root|默克爾根]]，寫進[[block-header|區塊頭]]的就只有它。於是舊交易可以丟棄，區塊的[[hash|哈希]]卻絲毫不變。',
  },

  analogy: {
    en: 'A long bill added up in pairs: every two lines get a subtotal, every two subtotals get one of their own, up to a single grand total. Once a group of lines is settled you can throw those lines away and keep only their subtotal, and the grand total still checks. A hash is stricter than a sum: no other set of lines would give the same subtotal.',
    zh: '一張很長的賬單，逐對相加：每兩行有一個小計，每兩個小計再有一個小計，直到最上面只剩一個總數。某一組賬目結清之後，可以把那幾行丟掉，只留下它們的小計，總數依然對得上。哈希比加法嚴格：換了任何別的賬目，都算不出同一個小計。',
  },

  body: {
    en: [
      'Every [[node]] stores every transaction ever made, and the record only grows. Most of it is history. Once the latest transaction of a [[electronic-coin|coin]] is [[confirmation|buried under enough blocks]], the earlier, spent transactions of that coin will never be needed to check a new payment, and the paper would like to discard them.',
      'The obstacle is the block’s [[hash]]. If the hash covered every transaction directly, removing one would change it and break the link to the next [[block]]. So the transactions are hashed in a [[merkle-tree|Merkle tree]] instead. Each one is hashed by itself; neighbouring hashes are joined in pairs and hashed again; the results are paired and hashed again, until one hash is left. That last hash, the [[merkle-root|Merkle root]], is the only trace of the transactions in what gets hashed for the proof-of-work.',
      'Old blocks can then be compacted. Where both transactions under a hash are spent, they are dropped and the hash is kept in their place. Where both halves of a larger branch are spent, the whole branch shrinks to the one hash at its top. The paper’s text calls this stubbing off branches of the tree; its diagram already uses the word that has stuck, [[pruning]]. Nothing inside a removed branch needs to be stored.',
      'The block’s hash is untouched by any of this. The root can still be recomputed from the transactions that remain and the hashes left in place of the rest, so the header is the same, its proof-of-work still stands, and the block after it still points at it.',
      'What can never be dropped is the header itself, and it is small. Without transactions a [[block-header|block header]] is about 80 bytes. At one block every ten minutes that makes 80 bytes × 6 × 24 × 365, about 4.2 MB a year. A computer of 2008 was typically sold with 2 GB of memory, so the paper concludes that storage should not be a problem even if every header had to be kept in memory. {§8} builds on exactly this.',
    ],
    zh: [
      '每個[[node|節點]]都儲存着有史以來的每一筆交易，紀錄只會愈來愈長，但其中大部分已成歷史。一旦某枚[[electronic-coin|貨幣]]的最新交易被[[confirmation|埋在足夠多的區塊之下]]，這枚貨幣之前那些已花費的交易，便再也不會用來核對新的付款；白皮書希望能把它們丟棄。',
      '障礙在於區塊的[[hash|哈希]]。假如哈希直接涵蓋每一筆交易，拿走任何一筆都會令它改變，與下一個[[block|區塊]]的連結隨之斷開。所以交易改以[[merkle-tree|默克爾樹]]的方式計算哈希：先各自算出哈希，相鄰的兩個相連後再算一次，所得結果又兩兩相連再算，直到只剩一個。這最後一個哈希稱為[[merkle-root|默克爾根]]；拿去做工作量證明的數據之中，與交易有關的就只有它。',
      '這樣，舊區塊便可以壓縮。某個哈希底下的兩筆交易若都已花費，便可丟掉它們，只留下這個哈希頂替；一條較大的分支若左右兩半都已花費，整條分支便收成頂端的一個哈希。白皮書正文稱之為剪除樹的分支，圖中則已用上今天通行的說法：[[pruning|修剪]]。被剪走的分支之內，甚麼也毋須儲存。',
      '區塊的哈希完全不受影響。憑餘下的交易，加上頂替其餘部分的那幾個哈希，仍然可以重新算出同一個默克爾根；區塊頭因此不變，它的工作量證明依然成立，下一個區塊也照舊指向它。',
      '唯一不能丟的是區塊頭，而它很小。不含交易的[[block-header|區塊頭]]約為 80 位元組；每十分鐘一個區塊，即 80 位元組 × 6 × 24 × 365，每年約 4.2 MB。2008 年的電腦一般配備 2 GB 記憶體，白皮書因而認為，即使所有區塊頭都要放在記憶體內，儲存也不成問題。{§8} 正是建基於此。',
    ],
  },

  figure: {
    component: 'MerklePrune',
    title: { en: 'Build a Merkle tree, then prune it', zh: '搭一棵默克爾樹，再修剪它' },
    steps: {
      en: [
        {
          title: 'Hash in pairs',
          text: 'Four transactions sit at the bottom. Each pair of hashes is joined and hashed into the one above, until a single [[merkle-root|Merkle root]] lands in the block header; press Play to watch it again.',
        },
        {
          title: 'Add an odd one',
          text: 'Now there are five. The last hash has no partner, so Bitcoin pairs it with a copy of itself. The same thing happens one level up, where three hashes are left.',
        },
        {
          title: 'Mark what is spent',
          text: 'Back to four. Press Tx0, Tx1 and Tx2 to mark them as spent, as in the paper’s own diagram. Nothing is removed yet.',
        },
        {
          title: 'Prune',
          text: 'Press Prune. Every branch whose transactions are all spent collapses into one hash. The root, recomputed from what is left, is identical, so the block’s hash still holds.',
        },
        {
          title: 'Count the headers',
          text: 'Take all the transactions away and a block is an 80-byte header. Move the slider to change how often blocks arrive, and see what a year of headers weighs.',
        },
      ],
      zh: [
        {
          title: '兩兩計算哈希',
          text: '底部有四筆交易。每一對哈希相連後再算一次哈希，成為上一層的哈希，直到只剩一個[[merkle-root|默克爾根]]，落在區塊頭內；按「播放」可以再看一次。',
        },
        {
          title: '多出來的一個',
          text: '現在有五筆交易。最後一個哈希沒有配對的對象，比特幣便讓它與自己的副本配對。上一層剩下三個哈希，同樣的事情再發生一次。',
        },
        {
          title: '標記已花費的交易',
          text: '回到四筆交易。按下 Tx0、Tx1 和 Tx2，把它們標記為已花費，正如白皮書原圖所示。這時還未刪除任何東西。',
        },
        {
          title: '修剪',
          text: '按「修剪」。凡是底下交易全部已花費的分支，都收成一個哈希。用餘下的數據重新計算，默克爾根分毫不差，區塊的哈希因而依然成立。',
        },
        {
          title: '數數區塊頭',
          text: '拿走所有交易，區塊只剩一個 80 位元組的區塊頭。拖動滑桿，改變出塊的間隔，看看一年的區塊頭有多大。',
        },
      ],
    },
  },

  whoRuns: [
    {
      actor: 'full-node',
      role: {
        en: 'Stores the chain and decides how much of it to keep. Whole blocks go into numbered files; the coins that are still unspent live in a separate database, and that is what new transactions are checked against.',
        zh: '負責儲存整條鏈，並決定保留多少。完整的區塊寫進按編號排列的檔案；尚未花費的幣則另存於一個數據庫，新交易就是拿它來核對的。',
      },
      artifact: {
        kind: 'cli',
        label: 'bitcoind -prune=<MiB>',
        detail: {
          en: 'Blocks are in `blocks/blkNNNNN.dat`, up to 128 MiB a file, and the [[utxo|unspent outputs]] in `chainstate/`. With `-prune` the node deletes its oldest block files to stay under the size given, which may not be less than 550 MiB, and always keeps the latest 288 blocks.',
          zh: '區塊存於 `blocks/blkNNNNN.dat`，每個檔案最大 128 MiB；[[utxo|未花費輸出]]則存於 `chainstate/`。加上 `-prune` 後，節點會刪除最舊的區塊檔案，把佔用空間維持在指定數值之內（不得少於 550 MiB），而最新的 288 個區塊一定保留。',
        },
        snippet:
          '$ bitcoind -prune=550\n$ bitcoin-cli getblockchaininfo\n{\n  ...\n  "size_on_disk": ...,\n  "pruned": true,\n  "pruneheight": ...,\n  "automatic_pruning": true,\n  "prune_target_size": 576716800,\n  ...\n}',
      },
    },
    {
      actor: 'mining-pool',
      role: {
        en: 'Builds the Merkle tree in the first place. The block template a pool takes from its node has neither a [[coinbase|coinbase transaction]] nor a Merkle root. The pool writes the coinbase and hands its machines the [[merkle-branch|Merkle branch]] that joins it to the root, and each machine works the root out again whenever it alters the coinbase ({§4}).',
        zh: '最先搭出默克爾樹的一方。礦池從自己的節點取得的區塊模板，既沒有 [[coinbase|coinbase 交易]]，也沒有默克爾根。礦池自行寫出 coinbase 交易，再把連接它與默克爾根的[[merkle-branch|默克爾分支]]交給礦機；礦機每改動一次 coinbase 交易，便重新算出默克爾根（見 {§4}）。',
      },
      artifact: {
        kind: 'rpc',
        label: 'getblocktemplate',
        detail: {
          en: 'The template lists the transactions with their ids but holds no Merkle root: the caller still has to supply the coinbase. Every node that later receives the block recomputes the root with `BlockMerkleRoot()` and rejects the block if it differs from the one in the header (`bad-txnmrklroot`).',
          zh: '模板列出各筆交易及其 ID，但不含默克爾根，因為 coinbase 交易仍須由呼叫方自行補上。其後每個收到這個區塊的節點，都會以 `BlockMerkleRoot()` 重新計算默克爾根；若與區塊頭所載的不符，便拒絕該區塊（`bad-txnmrklroot`）。',
        },
        snippet:
          '$ bitcoin-cli getblocktemplate \'{"rules": ["segwit"]}\'\n{\n  "previousblockhash": "...",\n  "transactions": [\n    { "data": "...", "txid": "...", "hash": "...", ... },\n    ...\n  ],\n  "coinbasevalue": ...,\n  "bits": "...",\n  "height": ...,\n  ...\n}',
      },
    },
  ],

  paperVsToday: {
    en: [
      'The paper prunes inside a block: spent transactions are cut out of its [[merkle-tree|Merkle tree]] and a hash is left in their place. Bitcoin Core does not do this, and neither did the 2009 client. Blocks are stored whole, in files of up to 128 MiB named `blkNNNNN.dat`.',
      'What a node needs in order to check a new transaction is not old blocks but the set of [[utxo|unspent outputs]]. Bitcoin Core keeps that set in a database of its own, `chainstate/`: an output enters it when a block creates it and leaves it when a block spends it. That is where spent coins drop out of sight; the block files themselves are left alone.',
      'With `-prune` a node does delete old data, but by the file, not by the transaction: the oldest block files go first, and the latest 288 blocks always stay. Such a node still holds the header of every block and the full set of unspent outputs, so it checks new blocks exactly as before. It can serve only those latest blocks to other nodes, and `gettxoutproof` fails for a block it has deleted.',
      'Where a level of the tree has an odd number of hashes, Bitcoin pairs the last one with itself. The 2009 client wrote this as `min(i+1, nSize-1)`; today `ComputeMerkleRoot()` appends a copy of the last hash. One consequence is that a list of transactions, and the same list with its tail repeated, can share a root (CVE-2012-2459), so a block that arrives with the repeat already written into it is rejected.',
      'Since SegWit (BIP 141) a block whose transactions carry witness data has a second Merkle tree, built from hashes that cover that data as well. Its root does not go into the header. A hash of it is placed in an output of the [[coinbase|coinbase transaction]], and so it reaches the header through the first tree.',
      'The header is still 80 bytes in six fields, and the paper’s arithmetic still holds: about 4.2 MB of headers a year. Being able to follow the whole chain’s proof-of-work with headers alone is what makes the light verification of {§8} possible.',
    ],
    zh: [
      '白皮書的修剪發生在區塊之內：把已花費的交易從[[merkle-tree|默克爾樹]]中剪走，原處留下一個哈希。Bitcoin Core 並沒有這樣做，2009 年的客戶端也沒有。區塊一律完整儲存，放在名為 `blkNNNNN.dat` 的檔案內，每個最大 128 MiB。',
      '節點核對新交易時需要的不是舊區塊，而是[[utxo|未花費輸出]]的集合。Bitcoin Core 把這個集合另存於 `chainstate/` 數據庫：區塊創造一個輸出，它便加入集合；區塊把它花掉，它便從集合中移除。已花掉的幣就是在這裏消失的；區塊檔案本身則原封不動。',
      '加上 `-prune` 後，節點確實會刪除舊數據，但刪除的單位是檔案而不是交易：最舊的區塊檔案最先刪除，最新的 288 個區塊則一定保留。這樣的節點仍然持有每個區塊的區塊頭和完整的未花費輸出集合，核對新區塊的方式與之前無異。不過它只能向其他節點提供最新的那批區塊，而對已刪除的區塊，`gettxoutproof` 亦無法作答。',
      '樹的某一層若有單數個哈希，比特幣會讓最後一個與自己配對。2009 年的客戶端寫作 `min(i+1, nSize-1)`；今天的 `ComputeMerkleRoot()` 則在列表末端多加一個相同的哈希。這帶來一個後果：一份交易列表，與把末段重複一次的同一份列表，可以算出相同的默克爾根（CVE-2012-2459）。因此，區塊的交易列表若真的帶着這樣重複的一段，節點便會拒絕該區塊。',
      '自 SegWit（BIP 141）起，交易帶有見證數據的區塊多了第二棵默克爾樹，由同時涵蓋見證數據的哈希計算而成。這棵樹的根不會寫進區塊頭；由它再算出的一個哈希，記在 [[coinbase|coinbase 交易]]的一個輸出之內，再經第一棵樹間接納入區塊頭。',
      '區塊頭至今仍是 80 位元組、六個欄位，白皮書的算式依然成立：每年約 4.2 MB 的區塊頭。單憑區塊頭便能追蹤整條鏈的工作量證明，{§8} 的輕量驗證正是靠這一點才得以實現。',
    ],
  },
};

export default section;
