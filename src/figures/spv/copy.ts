import type { L } from '@/content/types';

/** Interface copy for the payment verification figure of section 8. */
export const COPY = {
  scenes: { en: 'Scene', zh: '場景' },
  sceneProof: { en: 'Check a payment', zh: '核實付款' },
  sceneSize: { en: 'Size of a proof', zh: '證明的大小' },

  /* --------------------------------------------------------------- proof */
  walletHolds: {
    en: 'All your wallet holds: three block headers, 240 bytes. Your payment is said to be in block 2.',
    zh: '你的錢包只持有這些：三個區塊頭，合共 240 位元組。據稱你的付款就在第 2 號區塊內。',
  },
  block: { en: 'Block', zh: '區塊' },
  chainLabel: {
    en: 'The headers your wallet keeps. Each carries the hash of the one before and the Merkle root of its transactions.',
    zh: '錢包保存的區塊頭。每個都帶着上一個區塊頭的哈希，以及自身交易的默克爾根。',
  },
  treeLabel: {
    en: 'The Merkle tree of block 2. Your wallet holds none of it apart from what a proof supplies.',
    zh: '第 2 號區塊的默克爾樹。除了證明所提供的部分，錢包一概沒有。',
  },
  treeCaption: {
    en: 'Block 2’s transactions · held by full nodes, not by you',
    zh: '第 2 號區塊的交易 · 由全節點持有，你並沒有',
  },
  computedRoot: { en: 'Your result', zh: '你的結果' },

  pick: { en: '{name}: press to make this the payment you are checking.', zh: '{name}：按下，把它設為你要核實的付款。' },
  picked: { en: '{name}: the payment you are checking.', zh: '{name}：你要核實的付款。' },
  unknownNode: { en: 'A hash your wallet never sees.', zh: '錢包從未見過的哈希。' },
  givenNode: { en: 'A sibling hash sent by the full node.', zh: '全節點送來的兄弟哈希。' },
  pathPending: { en: 'To be computed by your wallet.', zh: '有待錢包自行算出。' },
  pathDone: { en: 'Computed by your wallet.', zh: '由錢包自行算出。' },

  legend: { en: 'What the boxes mean', zh: '圖例' },
  legendMine: { en: 'yours: the payment and what you compute from it', zh: '你的：付款本身，以及由它算出的哈希' },
  legendGiven: { en: 'sent by the full node', zh: '全節點送來的' },
  legendUnknown: { en: 'never seen by your wallet', zh: '錢包從未見過的' },

  checking: { en: 'Checking', zh: '正在核實' },
  pays: { en: 'pays {amount} BTC', zh: '支付 {amount} BTC' },
  txid: { en: 'id', zh: '交易 ID' },
  altered: { en: 'altered', zh: '已改動' },

  ask: { en: 'Ask a full node for proof', zh: '向全節點索取證明' },
  next: { en: 'Next hash', zh: '下一個哈希' },
  again: { en: 'Start again', zh: '重新開始' },

  tamper: { en: 'Tamper with', zh: '篡改' },
  tamperNone: { en: 'Nothing', zh: '不改動' },
  tamperTx: { en: 'The transaction', zh: '改動交易' },
  tamperSibling: { en: 'The proof', zh: '改動節點送來的哈希' },

  foldsLabel: { en: 'The wallet’s working, one hash at a time', zh: '錢包的運算過程，逐個哈希列出' },
  foldsHead: { en: 'left ‖ right → SHA-256, twice', zh: '左 ‖ 右 → SHA-256，做兩次' },
  ours: { en: 'yours', zh: '你的' },
  theirs: { en: 'from the node', zh: '節點送來' },
  headerRoot: { en: 'Merkle root in the header of block 2', zh: '第 2 號區塊頭內的默克爾根' },
  equal: { en: 'Equal', zh: '相等' },
  notEqual: { en: 'Not equal', zh: '不相等' },
  equalLead: { en: 'Equal.', zh: '相等。' },
  notEqualLead: { en: 'Not equal.', zh: '不相等。' },

  statusPick: {
    en: 'Press a transaction to pick the payment you are waiting for. Then ask a full node to prove it is in block 2.',
    zh: '按下任何一筆交易，選出你正在等候的付款，然後要求全節點證明它確實在第 2 號區塊內。',
  },
  statusAsked: {
    en: 'The node sent {n} hashes, {bytes} bytes in all: one for each level below the top. The rest of the tree stays out of sight.',
    zh: '節點送來 {n} 個哈希，合共 {bytes} 位元組：頂端以下每層一個。樹的其餘部分，你始終看不到。',
  },
  statusFoldLeft: {
    en: 'Step {k} of {n}: your hash goes on the left, the sibling on the right, and the pair is hashed.',
    zh: '第 {k} 步（共 {n} 步）：你的哈希放左邊，兄弟哈希放右邊，然後一併計算哈希。',
  },
  statusFoldRight: {
    en: 'Step {k} of {n}: the sibling goes on the left, your hash on the right, and the pair is hashed.',
    zh: '第 {k} 步（共 {n} 步）：兄弟哈希放左邊，你的哈希放右邊，然後一併計算哈希。',
  },
  statusEqual: {
    en: 'What you computed is the Merkle root in the header, so the transaction is in block 2, and block 3 has been built on top of it. You never saw the other seven transactions.',
    zh: '你算出的結果正是區塊頭內的默克爾根，可見這筆交易確實在第 2 號區塊內，而第 3 號區塊已接在它之上。其餘七筆交易，你自始至終沒有見過。',
  },
  statusForged: {
    en: 'A payment of a different amount is a different transaction with a different id. No branch of block 2 leads from it to the root, so the wallet rejects it.',
    zh: '金額不同，就是另一筆交易，交易 ID 也不同。第 2 號區塊內沒有任何分支能由它通往默克爾根，錢包因此拒絕接受。',
  },
  statusCorrupt: {
    en: 'One altered hash changes every hash above it. The result is not the root in the header, so the wallet rejects the proof. It can ask another node.',
    zh: '只要改動一個哈希，它上面的每一個哈希都隨之改變。結果與區塊頭內的默克爾根不符，錢包便拒絕這份證明，並可改向另一個節點索取。',
  },

  /* ---------------------------------------------------------------- size */
  sizeIntro: {
    en: 'A branch needs one hash for each level below the top of the tree, and a tree gains one level each time the block doubles. These trees are built for real as you drag.',
    zh: '分支在樹頂以下的每一層只需一個哈希，而區塊每大一倍，樹才多一層。拖動滑桿時，這些樹都是即場真實算出來的。',
  },
  blockSize: { en: 'Transactions in the block', zh: '區塊內的交易數目' },
  sizeThumb: { en: 'Block size, as a power of two', zh: '區塊大小（2 的次方）' },
  inBranch: { en: 'Hashes in the branch', zh: '分支內的哈希' },
  branchBytes: { en: 'Bytes in the branch', zh: '分支的位元組' },
  idBytes: { en: 'Bytes of ids alone in the block', zh: '單是全部交易 ID 的位元組' },
  ladderLabel: {
    en: 'The branch for Tx{index}, from the bottom of the tree up',
    zh: 'Tx{index} 的分支，由樹底往上列出',
  },
  left: { en: 'left', zh: '左' },
  right: { en: 'right', zh: '右' },
  verified: { en: 'folds to the root', zh: '合併後得出默克爾根' },
  sizeStatus: {
    en: '{count} transactions, {hashes} hashes. Double the block and the branch grows by one hash: 32 bytes. The block itself is far larger than its ids: every transaction is at least 60 bytes.',
    zh: '{count} 筆交易，{hashes} 個哈希。區塊再大一倍，分支只多一個哈希，即 32 位元組。區塊本身比這些交易 ID 大得多：每筆交易最少也有 60 位元組。',
  },
} satisfies Record<string, L<unknown> | Record<string, unknown>>;
