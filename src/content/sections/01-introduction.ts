import type { SectionContent } from '../types';

const section: SectionContent = {
  id: 'introduction',
  number: 1,
  part: 1,
  title: { en: 'Introduction', zh: '引言' },

  tldr: {
    en: 'Paying online means [[trusted-third-party|trusting a bank]] to keep the record, and a bank can always reverse a payment. The paper wants payments that rest on cryptographic proof instead, so that any two people can pay each other directly.',
    zh: '在網上付款，就得[[trusted-third-party|信賴銀行]]代為記賬，而銀行隨時可以撤銷一筆付款。白皮書想要的，是以密碼學證明取代信任的付款方式，讓任何兩個人都可以直接向對方付款。',
  },

  analogy: {
    en: 'Paying by card is asking a referee to move the money for you: the referee can be appealed to afterwards, charges for the service, and wants to know who you are. Paying with a banknote is handing it over: nobody is asked, nothing is charged, and nothing can be taken back. The paper wants the banknote, sent down a wire.',
    zh: '刷卡付款，等於請一位裁判替你把錢轉過去：事後可以向裁判申訴，裁判要收費，還要知道你是誰。用鈔票付款，則是親手把錢遞過去：不必問准任何人，沒有收費，也無法反悔。白皮書想要的，是一張能沿着線路傳送的鈔票。',
  },

  body: {
    en: [
      'Commerce on the Internet runs almost entirely through financial institutions that act as [[trusted-third-party|trusted third parties]]. The paper grants that this works well enough for most payments, then lists what the trust costs.',
      'A bank cannot refuse to settle disputes, so no payment through it is ever fully final. Settling disputes costs money, which pushes up the cost of every payment and makes small, casual ones impractical. And where a service cannot be taken back once it is given, there is no way to pay for it that cannot be taken back as well.',
      'Once payments can be reversed, the need for trust spreads. Merchants have to be wary of their customers and ask for more information than the sale itself requires, and a certain share of fraud is accepted as unavoidable. Cash handed over in person avoids all of this, but there was no way to hand cash down a wire without a trusted party in the middle.',
      'What the paper asks for instead is a payment system based on cryptographic proof, so that any two willing parties can deal with each other directly. Payments that are computationally impractical to reverse would protect sellers from fraud, which is the property now called [[irreversibility]], and buyers could still be protected by routine [[escrow]] arrangements.',
      'The last two sentences state the plan and its condition. The plan: solve [[double-spending]] with a [[peer-to-peer]] distributed [[timestamp-server|timestamp server]] that produces computational proof of the order in which transactions happened. The condition: honest nodes must together control more CPU power than any cooperating group of attackers.',
    ],
    zh: [
      '互聯網上的商貿，幾乎全靠金融機構充當[[trusted-third-party|可信第三方]]來處理付款。白皮書承認，這套安排應付大多數付款已經夠用，然後逐一列出信任的代價。',
      '銀行無法拒絕調解爭議，所以經它處理的付款，永遠算不上完全不可逆轉。調解需要成本，這筆成本攤進每一筆付款，令隨意的小額付款變得不切實際。此外，有些服務一經提供便無法收回，卻沒有一種同樣無法收回的付款方式可以用來支付。',
      '付款既然可以撤銷，對信任的需求便隨之蔓延。商戶不得不提防顧客，索取多於買賣本身所需的資訊，並把一定比例的欺詐視為無可避免。當面交收現金，可以免去這一切；但要隔着通訊線路把現金遞過去，一直都少不了居中的可信第三方。',
      '白皮書要的，是一套以密碼學證明為基礎的付款系統，讓任何自願的雙方都可以直接交易。付款在運算上實際無法逆轉，賣方便不怕被欺詐，這個特性今天稱為[[irreversibility|不可逆性]]；至於買方，則可用常規的[[escrow|託管]]安排來保障。',
      '引言最後兩句，交代了方案及其前提。方案：以[[peer-to-peer|點對點]]的分佈式[[timestamp-server|時間戳伺服器]]，為交易的先後次序生成運算上的證明，從而解決[[double-spending|雙重支付]]。前提：誠實節點合共掌握的 CPU 算力，必須多於任何一組聯手的攻擊者。',
    ],
  },

  figure: {
    component: 'IntroTrust',
    title: { en: 'What trust costs', zh: '信任的代價' },
    steps: {
      en: [
        {
          title: 'Pay through a bank',
          text: 'Press Pay under “Through a bank”. The bank moves the money in its own ledger and keeps a fee for standing in the middle.',
        },
        {
          title: 'Dispute the payment',
          text: 'Press Dispute. The bank takes the money back. The merchant has already handed over the goods and is left with nothing.',
        },
        {
          title: 'Pay hand to hand',
          text: 'Now press Pay under “Hand to hand”, then try Dispute. Cash changes hands in full, and there is nobody who could undo it.',
        },
        {
          title: 'Copy a digital coin',
          text: 'Online, a coin is a file. Send the same coin to Bob and then to Carol. Both receive a perfect copy and neither can tell: that is [[double-spending]].',
        },
        {
          title: 'Add a mint',
          text: 'Switch on the [[mint]] and send the coin to both again. The second payment is refused, but now every payment depends on that one mint.',
        },
      ],
      zh: [
        {
          title: '經銀行付款',
          text: '在「經銀行轉賬」一欄按「付款」。銀行在自己的賬簿上把錢轉過去，並因居中處理而收取一筆費用。',
        },
        {
          title: '對付款提出爭議',
          text: '按「提出爭議」。銀行把錢收回；商戶早已交出貨物，結果兩手空空。',
        },
        {
          title: '親手交錢',
          text: '現在到「親手交收」一欄按「付款」，再試試「提出爭議」。現金全數易手，沒有任何人能夠把它追回。',
        },
        {
          title: '複製一枚電子貨幣',
          text: '在網上，一枚幣就是一個檔案。把同一枚幣先後發給鮑勃和卡蘿：兩人都收到一份完美的副本，誰也看不出問題。這就是[[double-spending|雙重支付]]。',
        },
        {
          title: '加入鑄幣廠',
          text: '開啟[[mint|鑄幣廠]]，再把這枚幣發給兩人。第二筆付款被拒絕了；但從此每一筆付款，都得依賴這一家鑄幣廠。',
        },
      ],
    },
  },

  whoRuns: [
    {
      actor: 'full-node',
      role: {
        en: 'Does the job a bank’s ledger used to do: it refuses any payment that spends coins which do not exist or have already been spent. Every node does this for itself.',
        zh: '負責銀行賬簿原本擔當的工作：凡是動用不存在或已經花掉的幣的付款，一律拒絕。每個節點都親自做這項檢查。',
      },
      artifact: {
        kind: 'file',
        label: 'src/consensus/tx_verify.cpp',
        detail: {
          en: '`CheckTxInputs()` looks up every coin a transaction spends among the unspent ones, and rejects the transaction as `bad-txns-inputs-missingorspent` if any is absent. The RPC `gettxout` asks the same question about one coin, and returns nothing once it has been spent.',
          zh: '`CheckTxInputs()` 在未花費的幣當中逐一查找交易要動用的幣；只要缺了一枚，便以 `bad-txns-inputs-missingorspent` 為由拒絕整筆交易。RPC `gettxout` 可就單獨一枚幣提出同一個問題；該幣一旦花掉，便不再有任何回覆。',
        },
        snippet:
          '$ bitcoin-cli gettxout "<txid>" 0\n{\n  "bestblock": "...",\n  "confirmations": ...,\n  "value": ...,\n  "scriptPubKey": { ... },\n  "coinbase": false\n}',
      },
    },
    {
      actor: 'software-wallet',
      role: {
        en: 'Builds the “routine escrow” the paper promises buyers: a coin that needs two signatures out of three, with buyer, seller and an arbiter holding one key each.',
        zh: '負責實現白皮書向買方承諾的「常規託管」：一枚要有三個簽署中的兩個才能動用的幣，買方、賣方和仲裁人各持一把密鑰。',
      },
      artifact: {
        kind: 'bip',
        label: 'BIP 11 · BIP 16',
        detail: {
          en: 'BIP 11 is the standard script for an output that needs M of N signatures, and its own example is three-party [[escrow]]. The command below wraps that script in a pay-to-script-hash address (BIP 16), which begins with 3: the payer needs only the address, and the script is shown when the coin is spent.',
          zh: 'BIP 11 為「N 個簽署中須有 M 個」的輸出訂立標準腳本，它自己舉的例子就是三方[[escrow|託管]]。下面的指令再把這段腳本包進一個以 3 開頭的 P2SH 地址（BIP 16）：付款人只需要知道地址，腳本要到花費時才公開。',
        },
        snippet:
          '$ bitcoin-cli createmultisig 2 \'["<buyer key>","<seller key>","<arbiter key>"]\'\n{\n  "address": "...",\n  "redeemScript": "...",\n  "descriptor": "..."\n}',
      },
    },
    {
      actor: 'explorer',
      role: {
        en: 'A shop or an exchange decides for itself when a payment counts as final. No bank tells it; it counts the blocks built on top of the payment.',
        zh: '商戶或交易所要自行決定一筆付款何時才算數。沒有銀行替它們拿主意；它們數的是這筆付款之上疊了多少個區塊。',
      },
      artifact: {
        kind: 'rpc',
        label: 'gettransaction',
        detail: {
          en: 'What a wallet reports about a payment it has received, including `confirmations`: 1 when the payment is in the newest block, and one more for each block after that. {§11} works out how many are worth waiting for.',
          zh: '錢包就一筆收到的付款所報告的資料，其中包括 `confirmations`：付款位於最新的區塊時為 1，其後每多一個區塊便加 1。{§11} 會計算值得等多少個。',
        },
        snippet: '$ bitcoin-cli gettransaction "<txid>"\n{\n  "amount": ...,\n  "confirmations": ...,\n  "blockhash": "...",\n  ...\n}',
      },
    },
  ],

  paperVsToday: {
    en: [
      '“Completely non-reversible” holds only with depth. A payment gets harder to undo with every block built on it, and {§11} gives the odds, but nothing in the software ever declares it final. That is why the receiving side counts [[confirmation|confirmations]].',
      'Before its first confirmation a payment is easier to displace than the paper suggests. A node holding an unconfirmed transaction will replace it with a conflicting one that pays sufficiently higher fees (the rules began as BIP 125), so a careful merchant waits for a block.',
      'The “routine escrow mechanisms” exist as scripts. An output can require two signatures out of three (BIP 11), so that buyer and seller settle between themselves and an arbiter steps in only when they disagree. The arbiter alone can never move the money.',
      'Small casual payments did not become as cheap as the paper hoped. What a payment costs depends on its size, counted in virtual bytes, not on the amount sent, because block space is limited and miners fill it with the transactions that pay the most for their size ([[fee]]). Sending a very small amount can cost more than the amount itself.',
    ],
    zh: [
      '「完全不可逆轉」要靠深度來保證。一筆付款之上每多一個區塊，便更難推翻，{§11} 會算出概率；但軟件從不會宣佈某筆付款已成定局。這就是收款一方要數[[confirmation|確認]]的原因。',
      '在取得第一個確認之前，付款比白皮書所暗示的更容易被擠掉。節點手上若有一筆未確認的交易，遇到與之衝突、而手續費高出足夠幅度的另一筆，便會以後者取而代之（這套規則源自 BIP 125）；因此謹慎的商戶會等到交易進了區塊才作準。',
      '「常規的託管機制」如今以腳本實現。輸出可以設定為三個簽署中須有兩個（BIP 11）：買賣雙方意見一致時自行了結，有分歧才需要仲裁人介入；而仲裁人單憑自己，永遠動不了這筆錢。',
      '隨意的小額付款，並沒有如白皮書所期望的那樣變得便宜。一筆付款的費用取決於它的大小（以虛擬位元組計），而非付款金額，因為區塊空間有限，礦工會優先收錄按大小計出價最高的交易（[[fee|交易手續費]]）。金額極小的付款，手續費可能比款項本身還要高。',
    ],
  },
};

export default section;
