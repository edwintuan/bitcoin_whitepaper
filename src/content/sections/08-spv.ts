import type { SectionContent } from '../types';

const section: SectionContent = {
  id: 'spv',
  number: 8,
  part: 5,
  title: { en: 'Simplified Payment Verification', zh: '簡易支付驗證' },

  tldr: {
    en: 'A wallet can check that a payment is in the chain without storing the chain. It keeps only the [[block-header|block headers]] and asks a [[full-node|full node]] for the few [[hash|hashes]] that tie its transaction to one of them.',
    zh: '錢包毋須儲存整條鏈，也能核實一筆付款確實在鏈上。它只保存[[block-header|區塊頭]]，再向[[full-node|全節點]]索取寥寥幾個[[hash|哈希]]，把自己的交易連到其中一個區塊頭。',
  },

  analogy: {
    en: 'Checking one line of a long bill when all you hold is its grand total. Someone gives you the line and the handful of subtotals that sit beside it on the way up; you do the sums yourself and see whether you arrive at the total you already have. That shows your line is on the bill. It does not show that the line, or any other, is honest.',
    zh: '手上只有一張長賬單的總數，卻要查證其中一行。別人把那一行，連同往上逐層相鄰的幾個小計交給你；你自己動手算一遍，看看能否得出你早已持有的總數。這足以證明那一行確實在賬單上，卻不能證明它或其餘各行沒有問題。',
  },

  body: {
    en: [
      'Running a [[full-node|full node]] means storing and checking everything. The paper points out that a user who only wants to know whether a payment has arrived can do with far less: a copy of the [[block-header|block headers]] of the [[longest-chain|longest proof-of-work chain]], obtained by asking network [[node|nodes]] until the user is convinced that no longer chain exists.',
      'To check a payment, the user then obtains the [[merkle-branch|Merkle branch]] linking the transaction to the block it is timestamped in. The branch is the hash beside the transaction in the [[merkle-tree|Merkle tree]], then the hash beside their parent, and so on upward: one hash for each level below the top. Hashing upward with these must end at the [[merkle-root|Merkle root]] in a header the user already holds. For a block of a thousand transactions that takes ten hashes.',
      'This does not let the user check the transaction itself. A branch cannot show whether the coins being spent existed, or had been spent before. What it shows is that the transaction has a place in the chain, so a network node accepted it, and every block added after it is a further [[confirmation]] that the network has accepted it. The paper calls this [[spv|simplified payment verification]]; a wallet that works this way is a [[light-client|light client]].',
      'The paper is frank about the weakness. The method is reliable as long as honest nodes control the network. If an attacker overpowers the network, fabricated transactions can be put into the attacker’s own blocks: full nodes would refuse them, but a user who looks only at headers and branches can be fooled for as long as the attacker stays ahead.',
      'As one defence, the paper suggests that nodes send out alerts when they detect an invalid block, prompting the user’s software to download the full block and the transactions in question and confirm the inconsistency. It also expects businesses that receive frequent payments to run their own nodes anyway, for more independent security and quicker verification.',
    ],
    zh: [
      '運行[[full-node|全節點]]，意味着儲存一切、核對一切。白皮書指出，用戶若只想知道一筆付款有沒有到賬，需要的遠沒有那麼多：一份[[longest-chain|最長工作量證明鏈]]的[[block-header|區塊頭]]副本便已足夠。取得的方法，是不斷查詢網絡上的[[node|節點]]，直至用戶確信再沒有更長的鏈為止。',
      '要核實一筆付款，用戶再取得把這筆交易連到所屬區塊的[[merkle-branch|默克爾分支]]。分支就是[[merkle-tree|默克爾樹]]上緊貼這筆交易的那個哈希，然後是緊貼兩者父節點的那個哈希，如此類推，一路往上：頂端以下每層一個。拿着這些哈希逐層往上計算，最後必須得出用戶早已持有的某個區塊頭內的[[merkle-root|默克爾根]]。區塊若有一千筆交易，只需十個哈希。',
      '這並不足以讓用戶親自檢查那筆交易：它花的幣是否存在，之前有沒有被花過，單憑分支無從得知。分支能顯示的，是這筆交易在鏈上佔有一個位置，可見已有網絡節點接受了它；其後每多接上一個區塊，就多一個[[confirmation|確認]]，表示整個網絡都接受了它。白皮書把這種做法稱為[[spv|簡易支付驗證]]；以這種方式運作的錢包，就是[[light-client|輕錢包]]。',
      '白皮書毫不諱言當中的弱點。只要誠實節點控制着網絡，這種驗證便可靠。可是一旦攻擊者的算力壓倒網絡，偽造的交易便可以放進攻擊者自己挖出的區塊：全節點會拒絕這些區塊，但只看區塊頭和分支的用戶卻會受騙，而且攻擊者領先多久，用戶就被騙多久。',
      '作為其中一種防範，白皮書建議節點在偵測到無效區塊時發出警報，促使用戶的軟件下載完整的區塊和警報所指的交易，自行確認當中的不一致。白皮書亦預期，經常收款的企業始終會運行自己的節點，以獲得更獨立的安全保障和更快的驗證。',
    ],
  },

  figure: {
    component: 'SpvProof',
    title: { en: 'Verify a payment with headers alone', zh: '只憑區塊頭核實一筆付款' },
    steps: {
      en: [
        {
          title: 'Hold only the headers',
          text: 'Your wallet keeps three [[block-header|block headers]] and not one transaction. The tree under the middle block is greyed out: only full nodes hold it. Pick the payment you are waiting for.',
        },
        {
          title: 'Ask for the branch',
          text: 'Press “Ask a full node for proof”. It answers with one hash for each level below the top of the tree: the ones beside your path, and nothing else.',
        },
        {
          title: 'Fold it up',
          text: 'Each step joins your running hash with the next sibling, on the side the tree dictates, and hashes the pair. Watch it climb, or press “Next hash” yourself. The last result has to equal the [[merkle-root|Merkle root]] in the header.',
        },
        {
          title: 'Try a forgery',
          text: 'Tamper with the transaction, or with the proof the node sent. Either way the result at the top comes out different, and the wallet rejects it.',
        },
        {
          title: 'Count the saving',
          text: 'Grow the block from 8 transactions to 4,096. Each time it doubles, the branch gains a single hash.',
        },
      ],
      zh: [
        {
          title: '只保存區塊頭',
          text: '你的錢包保存了三個[[block-header|區塊頭]]，一筆交易也沒有。中間那個區塊底下的樹呈灰色：只有全節點才持有它。先選出你正在等候的那筆付款。',
        },
        {
          title: '索取分支',
          text: '按「向全節點索取證明」。對方的回覆，是樹頂以下每一層各一個哈希：就是緊貼你那條路徑的那些，此外甚麼也沒有。',
        },
        {
          title: '逐層合併',
          text: '每一步都把你手上的哈希與下一個兄弟哈希相連，左右位置由樹的結構決定，然後計算哈希。可以看着它逐層往上，也可以自己按「下一個哈希」。最後的結果必須等於區塊頭內的[[merkle-root|默克爾根]]。',
        },
        {
          title: '試試偽造',
          text: '改動交易，或者改動節點送來的其中一個哈希。頂端算出的結果隨即不同，錢包便拒絕這份證明。',
        },
        {
          title: '算算省了多少',
          text: '把區塊由 8 筆交易增至 4,096 筆。區塊每大一倍，分支只多一個哈希。',
        },
      ],
    },
  },

  whoRuns: [
    {
      actor: 'light-client',
      role: {
        en: 'Keeps every block header, 80 bytes each, checks the proof-of-work on them, and asks full nodes for whatever ties its own payments to a header.',
        zh: '保存每一個區塊頭（各 80 位元組），核對它們的工作量證明，再向全節點索取能把自己的付款連到某個區塊頭的數據。',
      },
      artifact: {
        kind: 'bip',
        label: 'BIP 157 · BIP 158',
        detail: {
          en: '[[compact-block-filters|Compact block filters]]: the node serves a small filter for each block, and the wallet tests it against its own scripts and fetches the block when it matches. They were written as an alternative to BIP 37, in which the wallet gave the node a [[bloom-filter|Bloom filter]] of what it was watching and got back `merkleblock` messages: a header with the Merkle branches of the transactions that matched.',
          zh: '[[compact-block-filters|區塊過濾器]]：節點為每個區塊提供一個小型過濾器，錢包拿它與自己的腳本比對，相符才下載該區塊。它們是作為 BIP 37 以外的另一選擇而寫的；在 BIP 37 之下，錢包把一個概括自己關注項目的[[bloom-filter|布隆過濾器]]交給節點，換回 `merkleblock` 訊息，即區塊頭連同相符交易的默克爾分支。',
        },
        snippet:
          '# headers first, 2,000 a message\ngetheaders   -> headers\n# then one small filter per block\ngetcfheaders -> cfheaders\ngetcfilters  -> cfilter\n# a whole block only on a match\ngetdata      -> block',
      },
    },
    {
      actor: 'full-node',
      role: {
        en: 'Has the whole block, so it can cut out the branch for any transaction in it and hand that over together with the header.',
        zh: '持有完整的區塊，因此能為區塊內任何一筆交易取出所需的分支，連同區塊頭一併交出。',
      },
      artifact: {
        kind: 'rpc',
        label: 'gettxoutproof · verifytxoutproof',
        detail: {
          en: '`gettxoutproof` returns, as hex, a block header followed by a partial Merkle tree (`CPartialMerkleTree` in `src/merkleblock.cpp`). `verifytxoutproof` rebuilds the root from it and lists the [[txid|transaction ids]] it proves. One proof can cover several transactions of the same block.',
          zh: '`gettxoutproof` 以十六進制回傳一個區塊頭，其後是一棵局部默克爾樹（`src/merkleblock.cpp` 的 `CPartialMerkleTree`）。`verifytxoutproof` 據此重算默克爾根，並列出它所證明的[[txid|交易 ID]]。一份證明可以同時涵蓋同一區塊內的多筆交易。',
        },
        snippet:
          '$ bitcoin-cli gettxoutproof \'["<txid>"]\' "<blockhash>"\n<hex: 80-byte header, transaction count, hashes, flag bits>\n$ bitcoin-cli verifytxoutproof "<hex>"\n[\n  "<txid>"\n]',
      },
    },
  ],

  paperVsToday: {
    en: [
      'The alerts the paper describes were never built. The list of network messages in Bitcoin Core (`src/protocol.h`) has none by which a node reports an invalid block to light clients, and the 2009 client had none either. What protects a light client is the cost of the proof-of-work on the headers it follows.',
      'Headers can be fetched without their blocks using `getheaders`, answered by `headers` messages of up to 2,000 headers each. The 2009 client had no such message: it could only ask for whole blocks.',
      'The first standard way to ask for a Merkle branch was BIP 37 (2012). The wallet loads a [[bloom-filter|Bloom filter]] of its keys and addresses into a node with `filterload`, and the node answers with `merkleblock` messages: a header plus a partial Merkle tree for the transactions that match. The filter reveals a great deal about what the wallet owns, and Bitcoin Core has kept the service switched off by default since version 0.19 (`-peerbloomfilters`).',
      'BIP 157 and BIP 158 (2017) turn the exchange round. The node offers one [[compact-block-filters|compact filter]] per block, the same for everybody; the wallet tests each filter on its own device and downloads, whole, any block that matches. It asks for blocks, not branches, and can fetch them from any peer, so no single node gets the whole picture of what it is looking for. Bitcoin Core has been able to serve these filters since version 0.21 (`-blockfilterindex` with `-peerblockfilters`), also off by default.',
      'Wallets built on the Electrum protocol do not use the peer-to-peer network at all: they ask a server. Its call `blockchain.transaction.get_merkle` returns what the paper describes, the list of hashes to pair with and the position of the transaction in its block. The server, however, is told which scripts the wallet is watching.',
      'The paper has the user query nodes “until he’s convinced he has the longest chain”. In practice that means talking to several unrelated peers, because one honest peer is enough to reveal a chain with more work. BIP 157 rests its filters on the same footing: a light client with at least one honest peer can identify the correct ones.',
    ],
    zh: [
      '白皮書所說的警報從未實現。Bitcoin Core 的網絡訊息列表（`src/protocol.h`）之中，沒有任何一種是讓節點向輕錢包通報無效區塊的；2009 年的客戶端同樣沒有。輕錢包所倚仗的，是它所跟隨的區塊頭背後那份工作量證明的成本。',
      '區塊頭可以用 `getheaders` 單獨索取，毋須連區塊一併下載；對方以 `headers` 訊息回覆，每則最多 2,000 個區塊頭。2009 年的客戶端並沒有這種訊息，只能索取完整的區塊。',
      '索取默克爾分支的第一種標準方式是 BIP 37（2012 年）。錢包以 `filterload` 把一個概括自己密鑰和地址的[[bloom-filter|布隆過濾器]]載入節點，節點則以 `merkleblock` 訊息回覆：區塊頭，加上一棵涵蓋相符交易的局部默克爾樹。這個過濾器會洩露大量線索，讓人推知錢包擁有甚麼，因此 Bitcoin Core 自 0.19 版起預設關閉這項服務（`-peerbloomfilters`）。',
      'BIP 157 和 BIP 158（2017 年）把雙方的角色對調。節點為每個區塊提供一個[[compact-block-filters|區塊過濾器]]，人人拿到的都一樣；錢包在自己的裝置上逐一比對，凡是相符的區塊便整個下載。它索取的是區塊而不是分支，而且可以向任何節點下載，因此沒有哪一個節點能掌握它在找甚麼的全貌。Bitcoin Core 自 0.21 版起可以提供這些過濾器（`-blockfilterindex` 配合 `-peerblockfilters`），同樣預設關閉。',
      '以 Electrum 協定為基礎的錢包完全不經點對點網絡，而是向一部伺服器查詢。該協定的 `blockchain.transaction.get_merkle` 回傳的，正是白皮書所描述的東西：一串用來逐層配對的哈希，以及交易在區塊中的位置。不過，錢包關注哪些腳本，伺服器是知道的。',
      '白皮書說用戶要不斷查詢節點，「直至他確信自己擁有最長鏈為止」。實際做法是同時連接多個互不相干的節點，因為只要其中一個誠實，便足以揭示工作量更多的那條鏈。BIP 157 的過濾器也建基於同一道理：輕錢包只要連上至少一個誠實節點，就能辨認出正確的過濾器。',
    ],
  },
};

export default section;
