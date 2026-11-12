import type { SectionContent } from '../types';

const section: SectionContent = {
  id: 'network',
  number: 5,
  part: 4,
  title: { en: 'Network', zh: '網絡' },

  tldr: {
    en: 'Every [[node]] checks new transactions and blocks, passes them to its neighbours, and builds on the [[longest-chain|longest chain]] it knows. When two blocks appear at once, the next block decides which one stays.',
    zh: '每個[[node|節點]]都會檢查新的交易和區塊，再轉告相鄰的節點，並在自己所知的[[longest-chain|最長鏈]]上繼續建造。若同時出現兩個區塊，下一個區塊便決定哪一個留下。',
  },

  analogy: {
    en: 'News in a village with no newspaper. Whoever hears something tells the neighbours, who check it and tell theirs, and soon the whole village knows. If two versions of the latest news set out from opposite ends, each villager carries on from the one heard first, until one version has more added to it and everyone takes up that one.',
    zh: '就像一個沒有報紙的村莊裏的消息。誰聽到了新消息，便告訴左鄰右里；鄰居查證過後再告訴他們的鄰居，很快全村都知道了。假如最新消息有兩個版本，分別從村子兩頭傳開，每個村民都先按自己最早聽到的版本接着說下去，直到其中一個版本有了下文，大家便一律改用那個版本。',
  },

  body: {
    en: [
      'The paper runs the network in six steps, and none of them needs anyone in charge. First, a new [[transaction]] is [[broadcast]]: the [[node]] that hears of it passes it to the nodes it is connected to, and they pass it on in turn. That is all [[peer-to-peer]] means here. Second, each node gathers the transactions it has heard of into a candidate [[block]]; the place where they wait is known today as the [[mempool]].',
      'Third, every node works on finding a [[proof-of-work]] for its own block, as in {§4}. In the paper each node is a [[miner]], and all of them are searching at once. Fourth, the node that finds one first broadcasts its block to all the others.',
      'Fifth, a node accepts the block only if every transaction in it is valid and none of them spends a coin that was already spent. Sixth, there is no vote and no reply. A node shows that it accepts the block by starting work on the next one, with the accepted block’s [[hash]] as the previous hash. From then on its own work counts towards the [[blockchain|chain]] that block is in.',
      'Nodes always treat the [[longest-chain|longest chain]] as the correct one and keep working to extend it. Sometimes two nodes broadcast different blocks at nearly the same moment, and the chain briefly has two tips: a [[fork]]. Each node works on the block it received first and keeps the other in case that branch grows longer. The tie is broken when the next proof-of-work is found. One branch is now longer, and the nodes that were on the other switch to it, a move known today as a [[reorg]]. The block they leave behind is a [[stale-block|stale block]].',
      'None of this needs perfect delivery; [[best-effort|best effort]] is enough. A transaction does not have to reach every node: if it reaches many, it will be in a block before long. Blocks can go missing too. A node that did not receive a block finds out when the next one arrives, sees that it is missing the one before, and asks for it.',
    ],
    zh: [
      '白皮書把網絡的運作歸納為六個步驟，沒有一步需要有人主持。第一步，新的[[transaction|交易]]向全網[[broadcast|廣播]]：最先收到的[[node|節點]]把它轉告與自己相連的節點，後者再往下傳。這裏所說的[[peer-to-peer|點對點]]，就是這個意思。第二步，每個節點把聽到的交易收集到一個候選[[block|區塊]]之中；這些交易等候的地方，今天稱為[[mempool|記憶池]]。',
      '第三步，每個節點為自己的區塊尋找[[proof-of-work|工作量證明]]，做法見 {§4}。在白皮書的設想中，每個節點都是[[miner|礦工]]，全部同時在找。第四步，誰先找到，誰就把自己的區塊廣播給所有其他節點。',
      '第五步，節點只在區塊內每筆交易均屬有效、而且沒有任何一筆動用已被花掉的幣時，才接受這個區塊。第六步既沒有投票，也沒有回覆：節點着手建造下一個區塊，並以剛接受的區塊的[[hash|哈希]]作為「前一個哈希」，這就是它表示接受的方式。自此，它付出的工作量都算在這個區塊所在的[[blockchain|鏈]]上。',
      '節點始終把[[longest-chain|最長鏈]]視為正確的一條，並不斷設法把它延長。有時兩個節點幾乎同時廣播出不同的區塊，鏈便暫時有了兩個末端，這就是[[fork|分叉]]。每個節點都在自己最先收到的那個區塊上繼續工作，同時保留另一個，以防那條分支變得更長。等到下一個工作量證明出現，僵局便告打破：其中一條分支變長了，原本在另一條分支上的節點隨即轉過來，今天稱之為[[reorg|重組]]。被它們拋下的那個區塊，就是[[stale-block|過時區塊]]。',
      '這一切都不要求訊息萬無一失，[[best-effort|盡力而為]]便已足夠。一筆交易毋須傳到每一個節點：只要傳到夠多的節點，不久便會被收進區塊。區塊同樣可能漏收。節點若沒有收到某個區塊，等下一個區塊到來時便會發現自己缺了前面的一個，然後主動索取。',
    ],
  },

  figure: {
    component: 'NetworkSim',
    title: { en: 'Run a ten-node network', zh: '運行一個十節點的網絡' },
    steps: {
      en: [
        {
          title: 'Broadcast a transaction',
          text: 'Press **Send a transaction**. Its node announces it with [[inv]]; a neighbour that lacks it answers [[getdata]] and receives the `tx`, then announces it in turn. A small mark on a node means the transaction is waiting in its [[mempool]].',
        },
        {
          title: 'Find a block',
          text: 'Press **Find a block**. One node, chosen at random in proportion to its hash power, finds the proof-of-work for a block holding the waiting transactions and announces it to its neighbours.',
        },
        {
          title: 'Accept and build on it',
          text: 'Every node has made the block its tip and dropped the transaction from its mempool. The panel shows one node from the inside: its next block will name this one as its parent, and that is how it says yes.',
        },
        {
          title: 'Two blocks at once',
          text: 'Press **Make a fork**: two distant nodes find a block at almost the same moment, and each part of the network builds on the one it heard first. Then press **Find a block**. One branch is now longer, and the nodes on the other switch to it: a [[reorg]].',
        },
        {
          title: 'Miss a block, catch up',
          text: 'Take the selected node offline, find a block or two, then bring it back. It hears of the newest block, sees that it lacks the one before, and asks for each missing block in turn.',
        },
        {
          title: 'Read the bytes',
          text: 'The same conversation as it crosses the wire. Step through the seven messages, starting with the [[version-handshake|version handshake]], and point at any field to see what it holds. The checksum is computed here, from the payload.',
        },
      ],
      zh: [
        {
          title: '廣播一筆交易',
          text: '按「發送一筆交易」。交易所在的節點先以 [[inv]] 公告；相鄰節點若沒有這筆交易，便以 [[getdata]] 索取，收到 `tx` 後再向自己的鄰居公告。節點上出現小方塊，表示這筆交易正在它的[[mempool|記憶池]]裏等候。',
        },
        {
          title: '找出一個區塊',
          text: '按「找出一個區塊」。頁面會按算力比例隨機選出一個節點，由它為載有待處理交易的區塊找到工作量證明，並向相鄰節點公告。',
        },
        {
          title: '接受並接着建造',
          text: '每個節點都已把這個區塊當作自己鏈的末端，並把那筆交易移出記憶池。面板顯示其中一個節點內部的情況：它的下一個區塊會以這個區塊為父區塊，這就是它表示接受的方式。',
        },
        {
          title: '同時出現兩個區塊',
          text: '按「製造分叉」：兩個相距甚遠的節點幾乎同時找到區塊，網絡各部分分別在自己先收到的那個區塊上建造。然後按「找出一個區塊」。其中一條分支變長了，另一條分支上的節點隨即轉過來，這就是[[reorg|重組]]。',
        },
        {
          title: '漏收區塊，然後補上',
          text: '讓選定的節點離線，找出一兩個區塊，然後讓它重新上線。它得知最新的區塊後，發現自己缺了前面的一個，便逐一索取漏收的區塊。',
        },
        {
          title: '細看位元組',
          text: '同一番對話，在線路上是這個樣子。逐則看完七則訊息，由[[version-handshake|版本握手]]開始；把指標移到任何欄位上，看看它載着甚麼。校驗碼是在這裏根據載荷即場算出來的。',
        },
      ],
    },
  },

  whoRuns: [
    {
      actor: 'full-node',
      role: {
        en: 'Does everything in this section. A [[full-node|full node]] keeps connections to a few peers, announces what it has, asks for what it lacks, and checks every transaction and block it is given.',
        zh: '本節所講的一切都由它執行。[[full-node|全節點]]與若干對等節點保持連線，公告自己手上有甚麼，索取自己缺少的，並檢查收到的每筆交易和每個區塊。',
      },
      artifact: {
        kind: 'file',
        label: 'src/net_processing.cpp',
        detail: {
          en: 'In [[bitcoin-core|Bitcoin Core]], `src/net.cpp` handles the connections and `src/net_processing.cpp` decides what to do with each message; the message names are listed in `src/protocol.h`. An operator can look at both layers by asking [[bitcoind]] over its [[rpc|RPC]] interface, for instance with [[bitcoin-cli]]: `getpeerinfo` lists the peers, `getrawmempool` the transactions waiting.',
          zh: '在 [[bitcoin-core|Bitcoin Core]] 中，`src/net.cpp` 負責處理連線，`src/net_processing.cpp` 決定每則訊息如何處理，訊息名稱則列於 `src/protocol.h`。營運者可透過 [[bitcoind]] 的 [[rpc|RPC 介面]]觀察這兩層，例如使用 [[bitcoin-cli]]：`getpeerinfo` 列出各個對等節點，`getrawmempool` 列出正在等候的交易。',
        },
        snippet:
          '$ bitcoin-cli getpeerinfo\n[\n  {\n    "id": 0,\n    "addr": "...",\n    "version": 70017,\n    "subver": "/Satoshi:32.1.0/",\n    "inbound": false,\n    "bytesrecv_per_msg": { "headers": ..., "inv": ..., "tx": ..., ... },\n    "transport_protocol_type": "v2",\n    ...\n  },\n  ...\n]\n\n$ bitcoin-cli getrawmempool\n[\n  "<txid>",\n  "<txid>",\n  ...\n]',
      },
    },
    {
      actor: 'mining-pool',
      role: {
        en: 'Collects transactions into a block for its machines to work on, and hands the block to the network when one of them finds the proof-of-work.',
        zh: '把交易收集成區塊，交給旗下的礦機運算；一旦有礦機找到工作量證明，便把區塊交給網絡。',
      },
      artifact: {
        kind: 'rpc',
        label: 'getblocktemplate · submitblock',
        detail: {
          en: '[[getblocktemplate]] asks a node for the next block in draft: the previous block hash, the target, and the transactions the node has chosen from its mempool. `submitblock` hands the solved block back to the node, which checks it and announces it to its peers.',
          zh: '[[getblocktemplate]] 向節點索取下一個區塊的草稿：上一個區塊的哈希、目標值，以及節點從記憶池挑出的交易。`submitblock` 則把算好的區塊交回節點，由節點檢查後向對等節點公告。',
        },
        snippet:
          '$ bitcoin-cli getblocktemplate \'{"rules": ["segwit"]}\'\n{\n  "previousblockhash": "...",\n  "transactions": [\n    { "data": "...", "txid": "...", "fee": ..., "weight": ... },\n    ...\n  ],\n  "coinbasevalue": ...,\n  "target": "...",\n  "bits": "...",\n  "height": ...,\n  ...\n}\n\n$ bitcoin-cli submitblock "<block as hex>"',
      },
    },
    {
      actor: 'software-wallet',
      role: {
        en: 'Starts step one. A wallet hands a signed transaction to a node, its owner’s own or one it relies on, and that node announces it to its peers.',
        zh: '啟動第一步。錢包把簽署好的交易交給一個節點（用戶自己運行的，或是它所倚賴的），再由該節點向對等節點公告。',
      },
      artifact: {
        kind: 'rpc',
        label: 'sendrawtransaction',
        detail: {
          en: 'Takes the signed transaction as hex. By default the node checks it, adds it to its own mempool and announces it to the peers it is connected to. The reply is the transaction’s hash.',
          zh: '以十六進制接收簽署好的交易。在預設情況下，節點檢查後把它放進自己的記憶池，並向相連的對等節點公告；回覆的是這筆交易的哈希。',
        },
        snippet: '$ bitcoin-cli sendrawtransaction "<signed transaction as hex>"\n<txid>',
      },
    },
  ],

  paperVsToday: {
    en: [
      '“Broadcast to all nodes” is gossip in practice. A node talks only to its own peers: by default eight outgoing connections that carry everything and two that carry blocks only, plus the incoming ones it accepts. It does not push a transaction at them either. It announces the hash with [[inv]], and a peer that lacks the transaction asks for it with [[getdata]].',
      'Blocks now travel differently from transactions. A new block is announced by its [[block-header|header]] instead of an `inv` (BIP 130), and can be sent as a [[compact-blocks|compact block]] (BIP 152): the header, a six-byte short id in place of each transaction the peer is expected to hold in its mempool already, and in full the few it cannot have, the coinbase among them. A header whose parent a node does not know makes it ask for the headers in between, which is today’s way of noticing a missed block.',
      '“The longest chain” is the chain with the most accumulated work, its [[chainwork]], not the one with the most blocks. Between two tips with equal work a node stays on the one it had first, as the paper says.',
      'In the paper every node mines, and the 2009 client had the miner built in. Today [[mining]] and checking are done by different parties: a node hands out block templates and verifies finished blocks, while the hashing is done by pools and their machines ({§4}).',
      'Bitcoin Core now prefers an encrypted transport when both peers support it (BIP 324): to an eavesdropper the stream looks like random bytes, with no message names to be seen. From peers that do not support it, Bitcoin Core still accepts the original framing shown in the figure, with its 24-byte header in clear.',
      'To check that nothing in a block was already spent, a node does not search the whole chain. It keeps a record of every output not yet spent, the [[utxo|UTXO set]], and looks each input up there.',
    ],
    zh: [
      '「向所有節點廣播」實際上是口耳相傳。節點只與自己的對等節點通訊：預設有八條對外連線轉發所有內容，另有兩條只轉發區塊，再加上它所接受的對內連線。節點也不會直接把交易推送出去，而是先以 [[inv]] 公告哈希，沒有該交易的對等節點再以 [[getdata]] 索取。',
      '今天區塊的傳播方式與交易不同。新區塊以[[block-header|區塊頭]]而非 `inv` 公告（BIP 130），並可以[[compact-blocks|精簡區塊]]的形式發送（BIP 152）：內含區塊頭；預期對方記憶池裏已有的交易，各以一個六位元組的短識別碼代替；對方不可能有的少數幾筆，包括 coinbase 交易，則完整附上。節點若收到一個區塊頭，卻不認得它的父區塊，便會索取中間缺少的區塊頭；這就是今天發現漏收區塊的方式。',
      '「最長鏈」其實是[[chainwork|累計工作量]]最多的鏈，而非區塊數目最多的鏈。若兩個末端的工作量相同，節點會留在自己先得到的那一個上，與白皮書所說的一致。',
      '在白皮書中每個節點都挖礦，2009 年的客戶端亦內置了挖礦程式。今天[[mining|挖礦]]與驗證由不同的人負責：節點派發區塊模板、核對算好的區塊，哈希運算則交給礦池及其礦機（見 {§4}）。',
      'Bitcoin Core 現時在雙方都支援的情況下，會優先採用加密的傳輸方式（BIP 324）：在竊聽者眼中，線路上只是一串看似隨機的位元組，連訊息名稱也看不到。對於不支援的對等節點，它仍然接受圖中所示的原有格式，即以明文發送的 24 位元組訊息頭。',
      '要核實區塊內沒有任何交易動用已花掉的幣，節點毋須翻查整條鏈。它備有一份所有尚未花費的輸出的紀錄，即 [[utxo|UTXO 集]]，每個輸入都拿去對照一次。',
    ],
  },
};

export default section;
