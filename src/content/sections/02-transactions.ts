import type { SectionContent } from '../types';

const section: SectionContent = {
  id: 'transactions',
  number: 2,
  part: 2,
  title: { en: 'Transactions', zh: '交易' },

  tldr: {
    en: 'A coin is a chain of [[digital-signature|digital signatures]]: each owner signs it over to the next. Anyone can check the signatures, but they cannot show that an owner did not sign the same coin away twice.',
    zh: '一枚幣就是一串[[digital-signature|數碼簽署]]：每位擁有者簽署一次，把它轉讓給下一位。任何人都可以驗證這些簽署，但簽署無法證明某位擁有者沒有把同一枚幣簽出去兩次。',
  },

  analogy: {
    en: 'A cheque endorsed from hand to hand: each holder signs the back to pass it on, and anyone can follow the signatures to see how it reached them. What the back of the cheque cannot show is whether one of the holders also signed a photocopy over to somebody else.',
    zh: '就像一張輾轉背書的支票：每位持票人在背面簽名，把它轉讓出去；任何人都可以順着簽名往回查，看它怎樣來到自己手上。但支票背面顯示不了一件事：會不會有某位持票人，把一份影印本也簽了給別人。',
  },

  body: {
    en: [
      'The paper defines an [[electronic-coin|electronic coin]] as a chain of digital signatures. To pass a coin on, its owner takes the previous [[transaction]] and the [[public-key|public key]] of the next owner, [[hash|hashes]] the two together, signs that hash with their own [[private-key|private key]], and adds the result to the end of the coin.',
      'Anyone who is paid with the coin can check it. Each signature must verify against the public key named in the transaction before it, all the way back, and that proves an unbroken chain of ownership. A [[key-pair|key pair]] is all an owner needs: there is no account to open and nobody to ask.',
      'The problem, the paper says, is what the payee cannot check: whether one of the earlier owners signed the same coin over to someone else as well. Both signatures would be perfectly valid. This is [[double-spending]], and signatures alone are blind to it.',
      'The usual answer is a central authority, a [[mint]], that sees every transaction. After each payment the coin goes back to the mint, which issues a fresh one, and only coins straight from the mint are trusted. It works, and it brings back everything {§1} set out to avoid: the fate of the whole money system rests on the company running the mint, exactly as with a bank.',
      'So the paper restates the task. The payee has to know that the previous owners did not sign any earlier transaction, and the only way to be sure something does not exist is to know about everything that does. Without a mint, that means every transaction must be announced publicly, and the participants must agree on one history of the order in which they arrived. The earliest transaction counts; later attempts to spend the same coin are ignored. {§3} begins building that shared history.',
    ],
    zh: [
      '白皮書把一枚[[electronic-coin|電子貨幣]]定義為一條由數碼簽署組成的鏈。擁有者要把幣轉讓出去，便取前一筆[[transaction|交易]]和下一位擁有者的[[public-key|公鑰]]，把兩者合起來計算[[hash|哈希]]，再用自己的[[private-key|私鑰]]簽署這個哈希，然後把結果附加在這枚幣的末端。',
      '收到這枚幣的人，誰都可以親自查核：每一個簽署，都必須與前一筆交易所列的公鑰相符，如此一路往回驗證，便證明了擁有權的鏈條從未中斷。擁有者只需要一個[[key-pair|密鑰對]]，既不必開戶，也不必徵求任何人同意。',
      '白皮書隨即指出問題所在：收款人查核不了的，是先前某位擁有者有沒有把同一枚幣也簽給了別人。兩個簽署都會完全有效。這就是[[double-spending|雙重支付]]，而單憑簽署，根本看不出來。',
      '常見的解決辦法，是設立一個看得見每筆交易的中央機構，即[[mint|鑄幣廠]]。每次付款之後，幣都要交回鑄幣廠換發一枚新幣，只有直接由鑄幣廠發出的幣才值得相信。這個辦法行得通，卻把 {§1} 想擺脫的一切都帶了回來：整個貨幣體系的命運，繫於營運鑄幣廠的那家公司，與銀行無異。',
      '於是白皮書把任務重新表述一遍。收款人必須知道，先前的擁有者並沒有簽署過任何更早的交易；而要確定一樣東西不存在，唯一的方法是知悉所有存在的東西。沒有鑄幣廠，這就意味着每筆交易都必須公開宣佈，而所有參與者必須就交易到達的先後次序，達成同一套說法。以最早的一筆為準，其後再花同一枚幣的企圖一概不理。{§3} 開始建立這份共同的歷史。',
    ],
  },

  figure: {
    component: 'TxSignatures',
    title: { en: 'Sign a coin from owner to owner', zh: '把一枚幣逐手簽下去' },
    steps: {
      en: [
        {
          title: 'Three owners, three keys',
          text: 'Each owner holds a [[key-pair|key pair]] made in your browser a moment ago. The public key is on show; the private key never leaves its owner. Press New keys to make another set.',
        },
        {
          title: 'One transfer, one signature',
          text: 'Each transaction names the next owner’s public key and carries the [[hash]] of the transaction before it. The owner who is paying signs the hash of those two.',
        },
        {
          title: 'Check a signature',
          text: 'Press Verify on any transaction. The page runs real [[ecdsa|ECDSA]] verification, using the public key named in the transaction before it.',
        },
        {
          title: 'Rewrite a transfer',
          text: 'Press Rewrite on transaction 2 to make it pay an attacker instead. Its hash changes, the old signature no longer fits, and transaction 3 now points at a hash that is gone.',
        },
        {
          title: 'Sign it twice',
          text: 'Press Sign it again: Owner 2 signs the same coin over to someone else as well. Both signatures verify, and nothing in either of them says which came first.',
        },
      ],
      zh: [
        {
          title: '三位擁有者，三對密鑰',
          text: '每位擁有者各有一個剛剛在你的瀏覽器裏生成的[[key-pair|密鑰對]]。公鑰公開顯示，私鑰永不離開擁有者。按「換一組密鑰」可重新生成。',
        },
        {
          title: '一次轉讓，一個簽署',
          text: '每筆交易都列明下一位擁有者的公鑰，並帶着前一筆交易的[[hash|哈希]]。付款的擁有者所簽署的，就是這兩者合起來的哈希。',
        },
        {
          title: '驗證一個簽署',
          text: '在任何一筆交易上按「驗證」。頁面會以前一筆交易所列的公鑰，執行真實的 [[ecdsa|ECDSA]] 驗證。',
        },
        {
          title: '改寫一筆轉讓',
          text: '在交易 2 上按「改寫」，把收款人換成攻擊者。它的哈希隨即改變，原有的簽署不再相符，而交易 3 所指向的哈希亦已不復存在。',
        },
        {
          title: '簽兩次',
          text: '按「再簽一次」：擁有者 2 把同一枚幣也簽給另一個人。兩個簽署都通過驗證，而兩者都沒有任何地方顯示哪一個在先。',
        },
      ],
    },
  },

  whoRuns: [
    {
      actor: 'software-wallet',
      role: {
        en: 'Builds the [[transaction]]: chooses which coins to spend, names the recipient and collects the signatures. A [[software-wallet|software wallet]] need not hold the keys itself.',
        zh: '負責組出[[transaction|交易]]：選定要花的幣，列明收款人，再收集簽署。[[software-wallet|軟件錢包]]本身不一定保管密鑰。',
      },
      artifact: {
        kind: 'rpc',
        label: 'createpsbt · walletprocesspsbt · finalizepsbt',
        detail: {
          en: 'The three steps of a [[psbt|PSBT]] in Bitcoin Core. `createpsbt` writes the unsigned transaction, `walletprocesspsbt` adds what the [[wallet]] knows and signs what it can, and `finalizepsbt` turns the fully signed result into a transaction ready to broadcast.',
          zh: '在 Bitcoin Core 處理 [[psbt|PSBT]] 的三個步驟：`createpsbt` 寫出未簽署的交易，`walletprocesspsbt` 補上[[wallet|錢包]]所知的資料並簽署它能簽的部分，`finalizepsbt` 則把簽署齊全的結果變成可以廣播的交易。',
        },
        snippet:
          '$ bitcoin-cli createpsbt \'[{"txid":"<txid>","vout":0}]\' \'[{"<address>":0.01}]\'\ncHNidP8B...\n$ bitcoin-cli walletprocesspsbt "cHNidP8B..."\n{ "psbt": "cHNidP8B...", "complete": true, ... }\n$ bitcoin-cli finalizepsbt "cHNidP8B..."\n{ "hex": "02000000...", "complete": true }',
      },
    },
    {
      actor: 'hardware-wallet',
      role: {
        en: 'Holds the [[private-key|private key]] and does the signing. A [[hardware-wallet|hardware wallet]] takes in an unsigned transaction and gives back signatures, never the key.',
        zh: '保管[[private-key|私鑰]]並負責簽署。[[hardware-wallet|硬件錢包]]收下未簽署的交易，交回的只有簽署，私鑰從不外洩。',
      },
      artifact: {
        kind: 'bip',
        label: 'BIP 174 · Signer',
        detail: {
          en: 'The part a signing device plays in the PSBT standard. Everything it needs in order to check and sign is inside the file it is handed, so it can work with no network connection, and it only ever adds signatures to that file.',
          zh: '簽署裝置在 PSBT 標準中擔當的角色。核對和簽署所需的一切資料，都在交給它的檔案之內，所以它毋須連接網絡也能工作；而它對這個檔案所做的，只限於加上簽署。',
        },
      },
    },
    {
      actor: 'full-node',
      role: {
        en: 'Checks every signature before it accepts a transaction, by running the [[script]] that locks each coin being spent.',
        zh: '接受一筆交易之前，先執行鎖定每枚被花的幣的[[script|腳本]]，藉此驗證每一個簽署。',
      },
      artifact: {
        kind: 'file',
        label: 'src/script/interpreter.cpp',
        detail: {
          en: 'When a script reaches `OP_CHECKSIG`, the interpreter calls `CheckECDSASignature()` or, in a Taproot script, `CheckSchnorrSignature()`. Each works out the digest the signer committed to and checks the signature against it. Unless every script comes out true, the whole transaction is refused. The reason the node gives, in the reply below, is `mempool-script-verify-flag-failed`.',
          zh: '腳本執行到 `OP_CHECKSIG` 時，解譯器會呼叫 `CheckECDSASignature()`；若是 Taproot 腳本，則呼叫 `CheckSchnorrSignature()`。兩者都會先算出簽署人所承諾的摘要，再以此核對簽署。只要有一段腳本的結果不為真，整筆交易便遭拒絕。節點在下面的回覆中給出的理由，是 `mempool-script-verify-flag-failed`。',
        },
        snippet:
          '$ bitcoin-cli testmempoolaccept \'["<hex of a transaction whose signature does not verify>"]\'\n[\n  {\n    "txid": "...",\n    "wtxid": "...",\n    "allowed": false,\n    "reject-reason": "mempool-script-verify-flag-failed (Signature must be zero for failed CHECK(MULTI)SIG operation)",\n    ...\n  }\n]',
      },
    },
  ],

  paperVsToday: {
    en: [
      'The paper’s coin is a single chain of signatures. A Bitcoin transaction can spend several earlier outputs and create several new ones ({§9}), so coins form a web of [[output|outputs]] rather than one line. Each output is locked by a small program in [[script|Script]], and showing a signature is the usual way to unlock it.',
      'The paper’s “hash of the previous transaction” lives on as the [[txid]]. Every input names the transaction that created the coin it spends, and which of that transaction’s outputs it is.',
      'A payment need not name a public key. An [[address]] beginning with 1, 3 or bc1q carries a hash instead, of a key or of a script, and the key is shown only when the coin is spent. Taproot addresses, beginning with bc1p, carry a public key again: a 32-byte key that has been tweaked with a hash, so that it can also commit to a set of scripts (BIP 341). The very first block paid a key directly: its output script is a public key followed by `OP_CHECKSIG`.',
      'The paper names no signature scheme. Bitcoin began with [[ecdsa|ECDSA]] over the curve secp256k1, and the Taproot upgrade (BIP 340 and 341) added Schnorr signatures over the same curve, valid from block 709,632.',
      'What gets signed is not “a hash of the previous transaction and the public key of the next owner” but a digest of the spending transaction itself, by default covering all its inputs and outputs. One extra byte at the end of an ECDSA signature says which parts were covered.',
      'The mint is gone, but what it knew is kept: every full node holds the set of all unspent outputs ([[utxo|UTXO]]) and refuses a transaction that spends anything outside it. And “the earliest transaction is the one that counts” means, in practice, the first one to be written into the chain.',
    ],
    zh: [
      '白皮書裏的幣是單獨一條簽署鏈。比特幣的一筆交易可以動用多個先前的輸出，並產生多個新輸出（{§9}），所以幣與幣之間織成一張[[output|輸出]]的網，而不是一條直線。每個輸出都由一小段[[script|腳本]]鎖定，而出示簽署是最常見的解鎖方式。',
      '白皮書所說「前一筆交易的哈希」，今天叫[[txid|交易 ID]]：每個輸入都列明它要花的幣由哪一筆交易產生，以及是該筆交易的第幾個輸出。',
      '付款不一定要直接寫出公鑰：以 1、3 或 bc1q 開頭的[[address|地址]]，載的是公鑰或腳本的哈希，公鑰要到花費時才公開。以 bc1p 開頭的 Taproot 地址，則再次直接載有公鑰：一把 32 位元組的公鑰，並已用一個哈希調整（tweak）過，使它同時可以對一組腳本作出承諾（BIP 341）。至於第一個區塊，確實是直接付給公鑰的：它的輸出腳本就是一把公鑰加上 `OP_CHECKSIG`。',
      '白皮書沒有指定簽署方案。比特幣面世時採用建基於曲線 secp256k1 的 [[ecdsa|ECDSA]]；Taproot 升級（BIP 340 及 341）再加入同樣建基於這條曲線的 Schnorr 簽署，自第 709,632 個區塊起生效。',
      '被簽署的並非「前一筆交易與下一位擁有者公鑰的哈希值」，而是花費交易本身的摘要，預設涵蓋它的全部輸入和輸出。每個 ECDSA 簽署的末尾另有一個位元組，標明簽署涵蓋了哪些部分。',
      '鑄幣廠沒有了，它掌握的資訊卻保留下來：每個全節點都保存着全部[[utxo|未花費輸出]]的集合，並拒絕任何動用集合以外輸出的交易。至於「以最早的一筆交易為準」，實際上是以最先寫進鏈上的一筆為準。',
    ],
  },
};

export default section;
