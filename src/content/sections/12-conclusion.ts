import type { SectionContent } from '../types';

const section: SectionContent = {
  id: 'conclusion',
  number: 12,
  part: 6,
  title: { en: 'Conclusion', zh: '結論' },

  tldr: {
    en: 'Signatures settle who owns a coin. A [[peer-to-peer]] network that records every transaction in a chain of [[proof-of-work]] makes that history too costly to rewrite while honest [[node|nodes]] hold most of the computing power. Nobody has to be trusted.',
    zh: '簽署解決了一枚幣屬於誰的問題。一個[[peer-to-peer|點對點]]網絡，以[[proof-of-work|工作量證明]]把每筆交易記進一條鏈；只要誠實[[node|節點]]掌握大部分算力，這段歷史便難以改寫。自始至終，毋須信任任何人。',
  },

  analogy: {
    en: 'A ledger that nobody keeps and everybody checks. Adding a page takes real work, each page is stamped with the one before, and the only way to rewrite an old page is to redo all the work since, faster than everyone else combined.',
    zh: '想像一本沒有人專責保管、卻人人都在核對的賬簿。每添一頁都要付出實實在在的工夫，每一頁都蓋着上一頁的印記；要改寫舊的一頁，就得把其後的工夫全部重做，而且要比其餘所有人加起來還要快。',
  },

  body: {
    en: [
      'The paper closes by retracing its own steps. It began with an [[electronic-coin|electronic coin]] made of [[digital-signature|digital signatures]] ({§2}): each owner signs the coin over to the next, and nobody can spend what is not theirs. That settles ownership and leaves one hole. A signature cannot show that the same coin was not also signed over to someone else. Without an answer to [[double-spending]], the only remedy is a trusted party that checks every payment, and removing that party was the aim set out in {§1}.',
      'The answer is to make the history public and expensive. Every transaction is announced to a [[peer-to-peer]] network ({§5}) and gathered into blocks; each block is sealed with [[proof-of-work]] and chained to the one before ({§3}, {§4}). Of two conflicting payments, the one that entered the chain first is the one that counts. Changing the record means redoing the work of every block since, and {§11} showed that for an attacker with less than half the computing power the chance of ever catching up shrinks exponentially with each block he is behind.',
      'The paper then points at what is absent. There is no membership list, no leader and no schedule. [[node|Nodes]] work all at once and hardly coordinate. They need no identity, because a message is not addressed to anyone in particular: it is passed to whoever is listening, on a [[best-effort|best effort]] basis, and a block that goes missing is asked for again when the next one arrives. The network is robust because there is so little structure to break.',
      'For the same reason a node can leave and come back whenever it likes. On its return it does not ask anyone what happened. It takes the chain with the most proof-of-work as the account of what happened while it was away, and checks that chain for itself. A brand-new node joins the same way: the chain is its own evidence.',
      'Finally the paper names the mechanism that holds all of this together. Nodes vote with their CPU power. Building on a block is a vote to accept it; refusing to build on an invalid block is a vote to reject it. Because {§6} pays miners only through blocks that the others accept, the vote stays honest for as long as honesty is the better business. Any rule the system needs, and any [[incentive]], can be enforced the same way. The figure for this chapter puts the parts back together.',
    ],
    zh: [
      '白皮書的結尾，把自己走過的路重溫了一遍。起點是以[[digital-signature|數碼簽署]]製成的[[electronic-coin|電子貨幣]]（{§2}）：每位擁有者簽署一次，把它轉讓給下一位，誰也花不了不屬於自己的錢。擁有權的問題就此解決，卻留下一個缺口：簽署無法證明同一枚幣沒有同時簽給另一個人。若找不到對付[[double-spending|雙重支付]]的方法，唯一的出路就是請一個可信的機構逐筆核對；而 {§1} 開宗明義要擺脫的，正是這個機構。',
      '答案是：把歷史公開，並且令它改起來代價高昂。每筆交易都向一個[[peer-to-peer|點對點]]網絡宣佈（{§5}），再被收進區塊；每個區塊都以[[proof-of-work|工作量證明]]封存，並與前一個區塊相連（{§3}、{§4}）。兩筆互相衝突的付款，以先進入這條鏈的一筆為準。要改動紀錄，就得把其後每個區塊的工作量重做一遍；而 {§11} 已經算過，算力不足一半的攻擊者每多落後一個區塊，追上的概率便呈指數下降。',
      '接着，白皮書指出這個系統「沒有」甚麼：沒有成員名冊，沒有領袖，也沒有時間表。[[node|節點]]同時各自工作，彼此幾乎毋須協調。它們也毋須表明身份，因為訊息並不是發給某個特定的對象：誰在聽，就傳給誰，[[best-effort|盡力而為]]即可；漏收了的區塊，等下一個區塊到來時再補取便是。這個網絡之所以穩健，正因為它幾乎沒有甚麼結構可以被破壞。',
      '基於同樣的道理，節點可以隨時離開、隨時回來。回來的時候，它不必向任何人打聽發生過甚麼事，只須把工作量證明最多的那條鏈，當作它離開期間所發生一切的紀錄，再親自把這條鏈驗證一遍。全新的節點加入網絡，靠的也是同一個方法：這條鏈本身就是證據。',
      '最後，白皮書點出把這一切維繫起來的機制：節點以 CPU 算力投票。在某個區塊之上繼續挖，就是投票接受它；拒絕在無效的區塊之上工作，就是投票否決它。而按 {§6} 的設計，礦工只能從獲其他節點接受的區塊中得到報酬，所以只要誠實仍是較划算的生意，這一票就會是誠實的一票。系統需要的任何規則、任何[[incentive|激勵]]，都可以用同一個方式來執行。本章的圖，把這些零件重新裝嵌在一起。',
    ],
  },

  figure: {
    component: 'ConclusionMachine',
    title: { en: 'The whole machine', zh: '整部機器' },
    steps: {
      en: [
        {
          title: 'Coins made of signatures',
          text: 'Start where the paper starts, in {§2}. A wallet holds the keys, and a transaction is a signed order to pass a coin on. Press each of the two parts now in place.',
        },
        {
          title: 'A history that costs work',
          text: '{§3} chains blocks so that their order is fixed, and {§4} makes every link expensive to forge. Two more parts join the machine.',
        },
        {
          title: 'Nobody in charge',
          text: '{§5}: every node checks each transaction, holds it in its mempool and builds on the longest chain. Follow the arrow from the chain back to the nodes. That loop is the consensus.',
        },
        {
          title: 'Paid to play fair',
          text: '{§6} gives the reason anyone spends the electricity: a block pays its finder in new coins and fees.',
        },
        {
          title: 'Light enough to carry',
          text: '{§7} folds a block’s transactions into one Merkle root, and {§8} lets a phone check a payment with nothing but headers and a short branch.',
        },
        {
          title: 'The whole machine',
          text: 'Every part is in place. Press any of them to see what it receives and what it hands on. The list beneath also covers the three sections on how the machine behaves: {§9}, {§10} and {§11}.',
        },
      ],
      zh: [
        {
          title: '以簽署製成的貨幣',
          text: '由白皮書的起點 {§2} 開始。錢包保管密鑰；交易則是一張已簽署的指示，把一枚幣轉交給下一位。按一按已裝上的這兩個零件。',
        },
        {
          title: '要付出工作量的歷史',
          text: '{§3} 把區塊串連起來，定下先後次序；{§4} 則令每一環都難以偽造。機器又多了兩個零件。',
        },
        {
          title: '無人發號施令',
          text: '{§5}：每個節點都會檢查每筆交易，把它放進自己的記憶池，並在最長的鏈上繼續挖。沿着箭頭由「鏈」回到「節點網絡」，這個循環就是共識。',
        },
        {
          title: '誠實有價',
          text: '{§6} 解釋了為何有人願意付這筆電費：找到區塊的人，可獲得新發行的幣和手續費。',
        },
        {
          title: '輕得可以隨身帶',
          text: '{§7} 把一個區塊的全部交易歸納成一個默克爾根；{§8} 則讓手機只憑區塊頭和一條短短的分支，就能核實一筆付款。',
        },
        {
          title: '整部機器',
          text: '所有零件都已裝上。按任何一個，看看它收到甚麼、又交出甚麼。下方的清單還包括另外三章，講的是這部機器的表現：{§9}、{§10} 和 {§11}。',
        },
      ],
    },
  },

  whoRuns: [
    {
      actor: 'software-wallet',
      role: {
        en: 'Wallets, in software and in hardware, are where the paper’s first idea lives: a coin is a chain of [[digital-signature|signatures]], and whoever holds the key controls it ({§2}, {§9}, {§10}).',
        zh: '白皮書的第一個構想，就落在軟件和硬件錢包之中：一枚幣是一串[[digital-signature|數碼簽署]]，誰持有密鑰，誰就控制它（{§2}、{§9}、{§10}）。',
      },
      artifact: {
        kind: 'bip',
        label: 'BIP 174 · PSBT',
        detail: {
          en: 'The format in which a wallet hands an unsigned transaction to a signer and collects the signatures. It carries everything the signer needs, so the signer can be offline, and building a payment and holding the key can be the work of two machines.',
          zh: '錢包把未簽署的交易交給簽署裝置、再收回簽署時所用的格式。簽署所需的資料全部隨交易附上，簽署裝置因而可以離線；組出付款與保管密鑰，亦可以由兩部機器分擔。',
        },
      },
    },
    {
      actor: 'full-node',
      role: {
        en: 'Full nodes keep the public history and enforce every rule on it. Each one checks every block for itself and follows the valid chain with the most work ({§3}, {§4}, {§5}, {§7}, {§11}).',
        zh: '全節點保存這段公開的歷史，並對它執行每一條規則。每個全節點都親自驗證每個區塊，跟隨工作量最多的有效鏈（{§3}、{§4}、{§5}、{§7}、{§11}）。',
      },
      artifact: {
        kind: 'p2p',
        label: 'getheaders · headers',
        detail: {
          en: 'How a node that has been away finds out what happened: it asks a peer for the block headers that follow a point in the chain it already knows, and the proof-of-work in the answer tells it which branch to fetch.',
          zh: '離開過的節點就是這樣得知發生了甚麼事：它向對等節點索取自己已知的某一點之後的區塊頭，再憑當中的工作量證明，決定下載哪一條分支。',
        },
      },
    },
    {
      actor: 'mining-pool',
      role: {
        en: 'Pools and the machines behind them cast the votes. Choosing which block to build on is the vote, and the reward of {§6} is the reason to cast it for a block the others will accept ({§4}, {§6}).',
        zh: '投票的是礦池及其背後的礦機。選擇在哪個區塊之上繼續挖，就是那一票；而 {§6} 的報酬，令它們有理由把票投給其他節點會接受的區塊（{§4}、{§6}）。',
      },
      artifact: {
        kind: 'rpc',
        label: 'getblocktemplate',
        detail: {
          en: 'The template names the block to build on in `previousblockhash`. A miner that starts from it is, in the paper’s words, expressing its acceptance of that block by working on extending it.',
          zh: '模板以 `previousblockhash` 指明要接在哪個區塊之後。礦工據此開挖，正是白皮書所說的「透過致力接續有效的區塊來表示接受」。',
        },
        snippet:
          '$ bitcoin-cli getblocktemplate \\\n    \'{"rules": ["segwit"]}\'\n{\n  "previousblockhash": "0000…",\n  "transactions": [ ... ],\n  "coinbasevalue": ...,\n  "bits": "...",\n  "height": ...,\n  ...\n}',
      },
    },
    {
      actor: 'light-client',
      role: {
        en: 'Light wallets rely on the same chain without storing it. Block headers and a [[merkle-branch|Merkle branch]] are enough to check that a payment is in a block ({§8}), and the blocks on top of it say how settled it is ({§11}). [Appendix A](#engineering-map) sets all seven roles side by side.',
        zh: '輕錢包依靠同一條鏈，卻毋須把它儲存下來。只憑區塊頭和一條[[merkle-branch|默克爾分支]]，便足以核實某筆付款確在某個區塊之內（{§8}）；而壓在它上面的區塊有多少，則說明這筆付款有多穩妥（{§11}）。[附錄 A](#engineering-map) 把全部七個角色並列對照。',
      },
      artifact: {
        kind: 'rpc',
        label: 'gettxoutproof · verifytxoutproof',
        detail: {
          en: 'A full node produces the proof that a transaction was included in a block. Checking it needs only the proof and the headers, and it fails if the block is not in the best chain.',
          zh: '全節點可以產生「某筆交易已被收進某個區塊」的證明。核對時只需要這份證明和區塊頭；若該區塊不在最佳鏈上，核對便會失敗。',
        },
        snippet:
          '$ bitcoin-cli gettxoutproof \\\n    \'["<txid>"]\'\n<hex proof>\n\n$ bitcoin-cli verifytxoutproof \\\n    <hex proof>\n[ "<txid>" ]',
      },
    },
  ],

  paperVsToday: {
    en: [
      'The paper has nodes vote with CPU power: they accept a block by building on it and reject one by refusing to. In practice the two jobs have come apart: miners extend the chain, while every [[full-node|full node]], mining or not, refuses an invalid block however much work it carries. `FindMostWorkChain()` drops any candidate with a failed block among its ancestors.',
      '“Any needed rules” was not an idle remark. Rules have been added since, each enforced by nodes from a set block height onward. The main-network parameters list them, for example `SegwitHeight = 481824`.',
      'A node that comes back, or starts for the first time, still takes the chain with the most work as its history, with a guard the paper did not need. The software ships with a floor on total work (`nMinimumChainWork`), and a node does not process unrequested blocks from a chain below it: protection, in the words of the source, against “low-work blocks on a fake chain”.',
      'The network has no structure, but a new node needs a first contact. The software carries a list of DNS seeds (`vSeeds`) from which it learns the addresses of its first peers; from then on, nodes pass one another’s addresses along in `addr` messages.',
    ],
    zh: [
      '白皮書說節點以 CPU 算力投票：在區塊之上繼續挖是接受，拒絕這樣做是否決。現實中，這兩項工作已經分家：延長這條鏈的是礦工；而每個[[full-node|全節點]]，不論有沒有挖礦，都會拒絕無效的區塊，不管它帶着多少工作量。`FindMostWorkChain()` 會剔除祖先當中含有無效區塊的候選鏈。',
      '「任何所需的規則」並非隨口一說。自那時起確實加入過新規則，每一條都由節點從某個指定的區塊高度起執行。主網參數把它們逐一列出，例如 `SegwitHeight = 481824`。',
      '重新上線或首次啟動的節點，依然以工作量最多的鏈為歷史，但多了一道白皮書當年用不着的防線。軟件附有一個總工作量的下限（`nMinimumChainWork`）；來自低於此數的鏈、而且並非自己索取的區塊，節點不會處理。用源碼的話說，這是為了防範「假鏈上的低工作量區塊」。',
      '網絡沒有結構，但新節點總得有第一個聯絡對象。軟件內附一份 DNS 種子名單（`vSeeds`），新節點由此得知最初幾個對等節點的地址；此後，節點之間便以 `addr` 訊息互相轉告其他節點的地址。',
    ],
  },
};

export default section;
