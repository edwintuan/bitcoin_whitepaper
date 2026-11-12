import type { L } from '@/content/types';
import type { MessageId } from './wire';

/** A field of a message: what to call it, and one sentence on what it is for. */
interface FieldCopy {
  name: L<string>;
  note: L<string>;
}

/**
 * Fields of the messages in the wire scene, by the kind of field
 * (`fieldOf` in wire.ts). Each fact was checked against Bitcoin Core v32.1:
 * the handshake in src/net_processing.cpp (1655-1688 for what is sent,
 * 3852-3917 for how it is read), the header in src/protocol.h and src/net.cpp.
 */
const FIELDS = {
  /* ------------------------------------------------------------ header */
  magic: {
    name: { en: 'Start bytes', zh: '起始位元組' },
    note: {
      en: 'Marks where a message begins and which network it belongs to. These four bytes mean the main network, and have done since 2009.',
      zh: '標示訊息的開端及其所屬網絡。這四個位元組代表主網，自 2009 年起沿用至今。',
    },
  },
  command: {
    name: { en: 'Message type', zh: '訊息類型' },
    note: {
      en: 'The name of the message in ASCII, padded with zero bytes to twelve.',
      zh: '訊息的 ASCII 名稱，不足十二個位元組的部分以零補足。',
    },
  },
  length: {
    name: { en: 'Payload length', zh: '載荷長度' },
    note: {
      en: 'How many bytes follow the header, lowest byte first.',
      zh: '訊息頭之後還有多少個位元組，低位元組在前。',
    },
  },
  checksum: {
    name: { en: 'Checksum', zh: '校驗碼' },
    note: {
      en: 'The first four bytes of the payload’s double SHA-256. It catches damage in transit. It is not a signature: anyone can compute it.',
      zh: '載荷經雙重 SHA-256 計算後的首四個位元組，用來發現傳送途中的損壞。它並非簽署，任何人都算得出來。',
    },
  },

  /* ----------------------------------------------------------- version */
  version: {
    name: { en: 'Protocol version', zh: '協定版本' },
    note: {
      en: 'The newest version of the protocol the sender speaks. 70017 is what Bitcoin Core 32.1 announces.',
      zh: '發送方所能使用的最新協定版本。Bitcoin Core 32.1 報上的是 70017。',
    },
  },
  services: {
    name: { en: 'Services', zh: '服務' },
    note: {
      en: 'One bit per thing the sender can do for its peers. Here: serve the whole block chain (bit 0), serve witness data (bit 3), and serve at least the last 288 blocks (bit 10). Bit 11, the encrypted transport, is not set because both nodes run with -v2transport=0; on default settings the value is 0xc09.',
      zh: '每個位元代表發送方能為對等節點提供的一項服務。這裏有三項：提供整條區塊鏈（第 0 位）、提供見證數據（第 3 位），以及至少提供最近 288 個區塊（第 10 位）。第 11 位代表加密傳輸，這裏沒有設定，因為兩個節點都以 -v2transport=0 運行；按預設設定，數值會是 0xc09。',
    },
  },
  timestamp: {
    name: { en: 'Time', zh: '時間' },
    note: {
      en: 'The sender’s clock, in seconds since 1970. A node compares its peers’ clocks with its own and warns its operator when its own looks wrong.',
      zh: '發送方的時鐘，以 1970 年起計的秒數表示。節點把各對等節點的時鐘與自己的比較，若自己的時鐘看來走錯了，便向營運者發出警告。',
    },
  },
  addr_recv_services: {
    name: { en: 'Receiver: services', zh: '接收方：服務' },
    note: {
      en: 'What the sender believes the receiver offers. Zero here; the receiver skips this field in any case.',
      zh: '發送方認為接收方提供的服務。這裏是零；接收方反正會略過這個欄位。',
    },
  },
  addr_recv_ip: {
    name: { en: 'Receiver: address', zh: '接收方：地址' },
    note: {
      en: 'The receiver’s network address as the sender sees it, in 16 bytes. Bitcoin Core sends zeros when that address cannot be reached from the Internet at large, as here.',
      zh: '發送方眼中接收方的網絡地址，佔 16 個位元組。若該地址無法從互聯網公開連上，Bitcoin Core 便發送零，這裏正是如此。',
    },
  },
  addr_recv_port: {
    name: { en: 'Receiver: port', zh: '接收方：連接埠' },
    note: {
      en: 'Its port number, the one field here written highest byte first. Zero, along with the empty address.',
      zh: '接收方的連接埠號碼，是這裏唯一高位元組在前的欄位。地址既然留空，它也是零。',
    },
  },
  addr_from_services: {
    name: { en: 'Sender: services', zh: '發送方：服務' },
    note: {
      en: 'The sender’s own service bits once more, in the slot that used to hold its address.',
      zh: '發送方自己的服務位元再寫一次，放在昔日用來填寫自身地址的位置。',
    },
  },
  addr_from_ip: {
    name: { en: 'Sender: address', zh: '發送方：地址' },
    note: {
      en: 'Once the sender’s own address. Bitcoin Core now always sends zeros here, and receivers skip the field.',
      zh: '昔日用來填寫發送方自己的地址。現在 Bitcoin Core 一律在此發送零，接收方亦會略過這個欄位。',
    },
  },
  addr_from_port: {
    name: { en: 'Sender: port', zh: '發送方：連接埠' },
    note: {
      en: 'Zero, for the same reason.',
      zh: '同樣是零，理由相同。',
    },
  },
  nonce: {
    name: { en: 'Nonce', zh: '隨機數' },
    note: {
      en: 'A random number chosen for this connection. A node that receives its own nonce has connected to itself, and hangs up.',
      zh: '為這次連線隨機選取的數字。節點若收到自己發出的隨機數，就知道連上了自己，隨即掛斷。',
    },
  },
  user_agent_length: {
    name: { en: 'Length of the user agent', zh: '軟件名稱的長度' },
    note: {
      en: 'How many bytes of text follow. Bitcoin writes lengths in a compact form: a single byte for anything below 253.',
      zh: '其後的文字佔多少個位元組。比特幣以精簡格式表示長度：小於 253 的數值只用一個位元組。',
    },
  },
  user_agent: {
    name: { en: 'User agent', zh: '軟件名稱（user agent）' },
    note: {
      en: 'The name and version of the software, as text.',
      zh: '軟件的名稱與版本，以文字表示。',
    },
  },
  start_height: {
    name: { en: 'Best block height', zh: '最佳區塊高度' },
    note: {
      en: 'The height of the sender’s best block at the moment it connected.',
      zh: '發送方連線一刻，其最佳區塊的高度。',
    },
  },
  relay: {
    name: { en: 'Relay flag', zh: '轉發標誌' },
    note: {
      en: '1 means: announce transactions to me. A connection meant for blocks only sends 0.',
      zh: '1 表示：請向我公告交易。只用來傳送區塊的連線則發送 0。',
    },
  },

  /* ------------------------------------------------------ inv / getdata */
  count: {
    name: { en: 'Number of entries', zh: '項目數目' },
    note: {
      en: 'How many entries follow: one. A single message may carry up to 50,000.',
      zh: '其後有多少個項目：這裏是一個。一則訊息最多可載 50,000 個項目。',
    },
  },
  type: {
    name: { en: 'Type', zh: '類型' },
    note: {
      en: 'What the hash names. 5 is a transaction, named by a hash that covers its witness data too. This transaction has none, so the hash is its ordinary id. A block would be 2.',
      zh: '哈希所指的是甚麼。5 代表交易，而且所用的哈希連見證數據一併計算；這筆交易沒有見證數據，所以這個哈希就是它平常的交易 ID。若是區塊，類型便是 2。',
    },
  },
  hash: {
    name: { en: 'Hash', zh: '哈希' },
    note: {
      en: 'Thirty-two bytes that name the transaction. On the wire they run back to front compared with the id printed everywhere else.',
      zh: '標識這筆交易的三十二個位元組。線路上的次序與其他地方印出來的交易 ID 剛好相反。',
    },
  },

  /* ---------------------------------------------------------------- tx */
  tx_version: {
    name: { en: 'Transaction version', zh: '交易版本' },
    note: {
      en: 'Which set of transaction rules applies. This one, from 2009, says 1.',
      zh: '這筆交易依從哪一版規則。它來自 2009 年，寫的是 1。',
    },
  },
  tx_in_count: {
    name: { en: 'Number of inputs', zh: '輸入數目' },
    note: {
      en: 'How many earlier coins this transaction spends: one.',
      zh: '這筆交易動用多少枚先前的幣：一枚。',
    },
  },
  tx_in_prev_hash: {
    name: { en: 'Spends: transaction', zh: '動用：交易' },
    note: {
      en: 'The id of the earlier transaction that created the coin being spent, back to front as always on the wire.',
      zh: '造出這枚幣的先前交易的 ID；與線路上的其他哈希一樣，次序前後倒轉。',
    },
  },
  tx_in_prev_index: {
    name: { en: 'Spends: output number', zh: '動用：輸出編號' },
    note: {
      en: 'Which output of that transaction. Counting starts at 0, so this is its first.',
      zh: '該筆交易的第幾個輸出。編號由 0 起計，所以這是第一個。',
    },
  },
  tx_in_script_length: {
    name: { en: 'Length of the signature script', zh: '簽署腳本的長度' },
    note: {
      en: 'How many bytes of script follow.',
      zh: '其後的腳本佔多少個位元組。',
    },
  },
  tx_in_script: {
    name: { en: 'Signature script', zh: '簽署腳本' },
    note: {
      en: 'The proof that the spender may spend this coin: here a single signature, made with the key the coin was locked to. It is the subject of section 2.',
      zh: '證明花費者有權動用這枚幣：這裏只有一個簽署，由鎖定這枚幣的那把密鑰簽出。第 2 節講的就是這回事。',
    },
  },
  tx_in_sequence: {
    name: { en: 'Sequence', zh: '序列號' },
    note: {
      en: 'Meant at first for replacing a transaction before it was confirmed. All ones, as here, marks the input as final.',
      zh: '最初用來在交易獲確認之前把它替換掉。像這裏全部位元為 1，表示這個輸入已是定稿。',
    },
  },
  tx_out_count: {
    name: { en: 'Number of outputs', zh: '輸出數目' },
    note: {
      en: 'How many new coins this transaction creates: two, the payment and the change.',
      zh: '這筆交易造出多少枚新幣：兩枚，一枚是付款，一枚是找續。',
    },
  },
  tx_out_value: {
    name: { en: 'Amount', zh: '金額' },
    note: {
      en: 'The value of this output in satoshis, as a 64-bit number, lowest byte first.',
      zh: '這個輸出的金額，以聰計算，是一個 64 位元的數字，低位元組在前。',
    },
  },
  tx_out_script_length: {
    name: { en: 'Length of the locking script', zh: '鎖定腳本的長度' },
    note: {
      en: 'How many bytes of script follow.',
      zh: '其後的腳本佔多少個位元組。',
    },
  },
  tx_out_script: {
    name: { en: 'Locking script', zh: '鎖定腳本' },
    note: {
      en: 'The condition for spending this output: here a public key, followed by the instruction to check a signature against it.',
      zh: '動用這個輸出的條件：這裏是一把公鑰，後接一條指令，要求以它核對簽署。',
    },
  },
  tx_lock_time: {
    name: { en: 'Lock time', zh: '鎖定時間' },
    note: {
      en: 'A block height or time the chain must have passed before the transaction may enter it. Zero means no wait.',
      zh: '鏈必須先越過這個區塊高度或時間，這筆交易才可進入鏈上。零表示毋須等候。',
    },
  },
} satisfies Record<string, FieldCopy>;

/** Interface copy for the network figure. */
export const COPY = {
  scenes: { en: 'Scene', zh: '場景' },
  sceneNetwork: { en: 'The network', zh: '網絡' },
  sceneWire: { en: 'On the wire', zh: '線路上' },

  /* --------------------------------------------------------------- graph */
  graphLabel: {
    en: 'A network of ten nodes. Each node is a button: press one to see what it knows.',
    zh: '由十個節點組成的網絡。每個節點都是按鈕，按下便可看到它所知道的一切。',
  },
  node: { en: 'Node', zh: '節點' },
  nodeAria: {
    en: 'Node {id}, {state}. Its tip is {tip}, height {height}. Transactions waiting: {waiting}.',
    zh: '節點 {id}，{state}。鏈末端為 {tip}，高度 {height}。等候中的交易：{waiting}。',
  },
  online: { en: 'online', zh: '在線' },
  offline: { en: 'offline', zh: '離線' },
  offShort: { en: 'off', zh: '離線' },

  legend: { en: 'Key', zh: '圖例' },
  kinds: {
    inv: { en: '“I have this”', zh: '「我有這個」' },
    getdata: { en: '“send it to me”', zh: '「請發給我」' },
    tx: { en: 'a transaction', zh: '一筆交易' },
    block: { en: 'a block', zh: '一個區塊' },
  },
  looks: {
    main: { en: 'on the longest chain (in a tie, the one found first)', zh: '在最長鏈上（等長時以先出現的為準）' },
    side: { en: 'on another branch', zh: '在另一條分支上' },
    behind: { en: 'not yet on the newest block', zh: '尚未接上最新區塊' },
    offline: { en: 'offline', zh: '離線' },
    waiting: { en: 'transactions waiting', zh: '等候中的交易' },
    reorg: { en: 'has just switched branch', zh: '剛剛轉換了分支' },
  },

  /* ------------------------------------------------------------ controls */
  send: { en: 'Send a transaction', zh: '發送一筆交易' },
  findBlock: { en: 'Find a block', zh: '找出一個區塊' },
  makeFork: { en: 'Make a fork', zh: '製造分叉' },
  forkWait: {
    en: 'A fork needs two connected nodes on the newest block.',
    zh: '要製造分叉，須有兩個互相連通的節點同在最新區塊上。',
  },
  play: { en: 'Play', zh: '播放' },
  pause: { en: 'Pause', zh: '暫停' },
  step: { en: 'Step', zh: '逐步' },
  speed: { en: 'Speed', zh: '速度' },
  mining: { en: 'Mine continuously', zh: '持續挖礦' },
  reset: { en: 'Reset', zh: '重設' },
  reducedNote: {
    en: 'Motion is reduced: each message is drawn just after it has left, and Step delivers everything in flight.',
    zh: '已減少動態效果：每則訊息只畫在剛出發的位置，按「逐步」便會送達所有途中的訊息。',
  },
  honest: {
    en: 'Left out on purpose: every transaction and block here is taken as valid, and every block counts the same, so height stands in for work. Checking signatures is the subject of {§2}, proof-of-work of {§4}.',
    zh: '刻意省略的部分：這裏每筆交易和每個區塊都假定有效，而且每個區塊份量相同，所以用高度代替工作量。簽署的驗證見 {§2}，工作量證明見 {§4}。',
  },
  clock: { en: 'simulated time', zh: '模擬時間' },
  seconds: { en: 's', zh: '秒' },

  /* -------------------------------------------------------------- status */
  status: {
    dark: {
      en: 'Every node is offline. Bring one back to carry on.',
      zh: '所有節點均已離線。讓其中一個重新上線，才可繼續。',
    },
    rest: {
      en: 'At rest. Every node that is online builds on {tip}, height {height}.',
      zh: '網絡靜止。所有在線節點都在 {tip}（高度 {height}）之上建造。',
    },
    /** Said after the news, whatever it is: what online nodes agree on says nothing about these. */
    offline: {
      en: ['Node {nodes} is offline.', 'Nodes {nodes} are offline.'],
      zh: ['節點 {nodes} 已離線。', '節點 {nodes} 已離線。'],
    },
    waiting: {
      en: ['One transaction is waiting for a block.', '{count} transactions are waiting for a block.'],
      zh: ['有一筆交易正等候被收進區塊。', '有 {count} 筆交易正等候被收進區塊。'],
    },
    txSpreading: {
      en: '{tx} is on its way from node to node.',
      zh: '{tx} 正由一個節點傳到另一個節點。',
    },
    txReach: { en: 'in {have} of {online} mempools', zh: '已到達 {online} 個記憶池中的 {have} 個' },
    blockSpreading: {
      en: 'Block {block}, height {height}, is on its way from node to node.',
      zh: '區塊 {block}（高度 {height}）正由一個節點傳到另一個節點。',
    },
    blockReach: { en: '{have} of {online} nodes build on it', zh: '{online} 個節點中已有 {have} 個在它之上建造' },
    fork: {
      en: 'Fork at height {height}: {a} and {b} are both tips. The next block decides.',
      zh: '高度 {height} 出現分叉：{a} 和 {b} 同為鏈末端，由下一個區塊定勝負。',
    },
    forkReach: { en: '{a}: {na} · {b}: {nb}', zh: '{a}：{na} · {b}：{nb}' },
    busy: {
      en: 'Nodes are comparing what they have.',
      zh: '節點正在互相核對手上的區塊。',
    },
    /** Added to `busy` only when no other news follows it. */
    busyNothing: { en: 'Nothing new so far.', zh: '暫時沒有新消息。' },
    cutOff: {
      en: 'Some nodes cannot hear the news: every path to them runs through a node that is offline.',
      zh: '部分節點收不到消息：通往它們的每條路徑都要經過離線的節點。',
    },
    cutOffNodes: { en: 'behind: {nodes}', zh: '落後：{nodes}' },
    renewed: {
      en: 'After {blocks} blocks the simulation was started afresh, to keep it quick. Your settings were kept.',
      zh: '模擬累積了 {blocks} 個區塊後已重新開始，以保持流暢；你的設定維持不變。',
    },
    reorg: {
      en: [
        'Node {nodes} left its branch and switched to {block}: a reorg.',
        'Nodes {nodes} left their branch and switched to {block}: a reorg.',
      ],
      zh: [
        '節點 {nodes} 放棄了原有分支，改接 {block}：這就是重組。',
        '節點 {nodes} 放棄了原有分支，改接 {block}：這就是重組。',
      ],
    },
  },

  /* --------------------------------------------------------------- panel */
  panelHint: {
    en: 'Press a node to see the network through its eyes: its tip, its mempool, the blocks it knows, and what it has just done.',
    zh: '按任何一個節點，便可從它的角度看網絡：它的鏈末端、記憶池、所知的區塊，以及剛剛做過甚麼。',
  },
  takeOffline: { en: 'Take offline', zh: '使其離線' },
  bringOnline: { en: 'Bring back online', zh: '重新上線' },
  close: { en: 'Close', zh: '關閉' },
  tip: { en: 'Tip', zh: '鏈末端' },
  height: { en: 'height', zh: '高度' },
  mempool: { en: 'Mempool', zh: '記憶池' },
  empty: { en: 'empty', zh: '空' },
  hashPower: { en: 'Hash power', zh: '算力' },
  peers: { en: 'Peers', zh: '對等節點' },
  chain: { en: 'Its chain', zh: '它的鏈' },
  earlier: { en: '{count} earlier', zh: '之前還有 {count} 個' },
  kept: { en: 'Kept aside', zh: '另行保留' },
  keptNote: {
    en: 'From the other branch of a fork, saved in case that branch grows longer.',
    zh: '來自分叉的另一條分支，先保留下來，以防那條分支變得更長。',
  },
  tipTag: { en: 'tip', zh: '末端' },
  genesis: { en: 'first block', zh: '首個區塊' },
  none: { en: 'none', zh: '無' },
  events: { en: 'What it did, newest first', zh: '最近動態（由新至舊）' },
  noEvents: { en: 'Nothing yet.', zh: '暫時未有動靜。' },
  eventTypes: {
    'tx-seen': { en: 'put {ref} in its mempool', zh: '把 {ref} 放進記憶池' },
    'block-mined': { en: 'found block {ref}', zh: '找到區塊 {ref}' },
    'block-accepted': { en: 'accepted {ref} as its tip', zh: '接受 {ref} 為鏈末端' },
    reorg: { en: 'left its old branch for {ref}: a reorg', zh: '放棄原有分支，改接 {ref}：重組' },
    offline: { en: 'went offline at {ref}', zh: '離線，當時在 {ref}' },
    online: { en: 'came back online at {ref}', zh: '重新上線，當時在 {ref}' },
  },

  /* ---------------------------------------------------------------- wire */
  wireIntro: {
    en: 'Two nodes running Bitcoin Core 32.1 connect over the original, unencrypted transport, as they do when the encrypted one is switched off, then one passes a transaction to the other. Every byte is built here in your browser, by the rules a node follows.',
    zh: '兩個運行 Bitcoin Core 32.1 的節點關閉了加密傳輸，改以原有的、未加密的傳輸方式連線，然後其中一個把一筆交易傳給另一個。每個位元組都是在你的瀏覽器裏按節點所依從的規則砌出來的。',
  },
  wireReal: {
    en: 'The field values are an example. The transaction is not: these are the bytes of a real payment of 10 BTC, confirmed in block 170 in January 2009, standing in here for a new one.',
    zh: '各欄位的數值只是示例，交易卻是真的：這些位元組來自一筆真實的 10 BTC 付款，於 2009 年 1 月在第 170 號區塊獲得確認，在這裏充當一筆新交易。',
  },
  wireLeftOut: {
    en: 'Left out: everything else two real nodes say here. Between `version` and `verack` each also sends `wtxidrelay`, which is why the announcement uses type 5, and `sendaddrv2`. After `verack` come `sendcmpct`, `sendheaders`, `feefilter`, `ping` and the first requests for headers and addresses.',
    zh: '省略了的部分：兩個真實節點此時還會說的其他話。在 `version` 與 `verack` 之間，雙方還會各自發送 `wtxidrelay`（公告因此採用類型 5）和 `sendaddrv2`；`verack` 之後則有 `sendcmpct`、`sendheaders`、`feefilter`、`ping`，以及最初索取區塊頭和地址的請求。',
  },
  sequenceLabel: { en: 'Messages between node A and node B, in order', zh: '節點 A 與節點 B 之間的訊息，按先後排列' },
  nodeA: { en: 'Node A', zh: '節點 A' },
  nodeARole: { en: 'opens the connection', zh: '發起連線' },
  nodeB: { en: 'Node B', zh: '節點 B' },
  nodeBRole: { en: 'accepts it', zh: '接受連線' },
  prevMessage: { en: 'Previous', zh: '上一則' },
  nextMessage: { en: 'Next message', zh: '下一則訊息' },
  messageOf: { en: 'Message {n} of {total}', zh: '第 {n} 則，共 {total} 則' },
  /** One byte, and any other number of them. */
  bytes: { en: ['byte', 'bytes'], zh: ['位元組', '位元組'] },
  toRight: { en: 'A to B', zh: 'A 至 B' },
  toLeft: { en: 'B to A', zh: 'B 至 A' },
  says: {
    'version-a': {
      en: 'A introduces itself: its protocol version, what it offers, its clock and the height of its best block.',
      zh: 'A 自我介紹：協定版本、所提供的服務、自己的時鐘，以及最佳區塊的高度。',
    },
    'version-b': {
      en: 'B answers with the same introduction about itself.',
      zh: 'B 以同樣的方式介紹自己。',
    },
    'verack-b': {
      en: 'B acknowledges A’s introduction. The message is a header and nothing else.',
      zh: 'B 確認收到 A 的介紹。這則訊息只有訊息頭，別無其他。',
    },
    'verack-a': {
      en: 'A acknowledges in turn. From here on either side may send anything.',
      zh: 'A 亦作確認。自此，雙方可以發送任何訊息。',
    },
    inv: {
      en: 'A has a new transaction. It announces only the hash: 37 bytes of payload instead of 275.',
      zh: 'A 有一筆新交易，但只公告它的哈希：載荷只有 37 個位元組，而非 275 個。',
    },
    getdata: {
      en: 'B does not have that transaction, so it sends the same entry back as a request.',
      zh: 'B 沒有這筆交易，於是把同一個項目原樣發回，作為索取的請求。',
    },
    tx: {
      en: 'A sends the transaction itself. B hashes what arrived and finds the hash it asked for.',
      zh: 'A 發送交易本身。B 把收到的內容算一次哈希，得出的正是它所索取的那個。',
    },
  } satisfies Record<MessageId, L<string>>,
  bytesTitle: { en: 'The message, byte by byte', zh: '逐個位元組看這則訊息' },
  headerPart: { en: 'header', zh: '訊息頭' },
  payloadPart: { en: 'payload', zh: '載荷（payload）' },
  noPayload: { en: 'no payload', zh: '沒有載荷' },
  fieldHint: {
    en: 'Point at a field, or move to it with Tab.',
    zh: '把指標移到欄位上，或按 Tab 逐一查看。',
  },
  input: { en: 'Input {n}', zh: '輸入 {n}' },
  output: { en: 'Output {n}', zh: '輸出 {n}' },
  fields: FIELDS,

  checkDigest: { en: 'SHA-256, twice, of the {n} payload bytes', zh: '對 {n} 個載荷位元組做兩次 SHA-256' },
  checkDigestEmpty: { en: 'SHA-256, twice, of an empty payload', zh: '對空載荷做兩次 SHA-256' },
  checkDeclared: { en: 'Checksum in the header', zh: '訊息頭內的校驗碼' },
  checkTxid: { en: 'The same hash, back to front', zh: '同一個哈希，前後倒轉' },
  checkAsked: { en: 'The hash B asked for', zh: 'B 所索取的哈希' },
  checkOk: {
    en: 'The first four bytes of the hash are the checksum. The receiver takes the message.',
    zh: '哈希的首四個位元組與校驗碼相符，接收方收下這則訊息。',
  },
  checkBad: {
    en: 'The first four bytes of the hash are not the checksum. The receiver notes a wrong checksum and skips the message.',
    zh: '哈希的首四個位元組與校驗碼不符。接收方判定校驗碼有誤，並略過這則訊息。',
  },
  checkTxOk: {
    en: 'Read back to front, the whole hash is the one B asked for. So the checksum of this message is also the first four bytes of the transaction’s id as the wire carries it.',
    zh: '前後倒轉來讀，整個哈希正是 B 所索取的那一個。換言之，這則訊息的校驗碼同時是這筆交易的 ID 在線路上的首四個位元組。',
  },
  damage: { en: 'Flip one bit on the way', zh: '在途中翻轉一個位元' },
  restore: { en: 'Restore', zh: '還原' },
  userAgentLabel: { en: 'What node A calls itself', zh: '節點 A 的自稱' },
  userAgentHint: {
    en: 'Change it, and the length and the checksum follow.',
    zh: '改一改，長度和校驗碼都會跟着改變。',
  },
} satisfies Record<string, L<unknown> | Record<string, unknown>>;

export type FieldKey = keyof typeof FIELDS;
