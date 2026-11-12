/**
 * The glossary: 94 terms, each in English and Traditional Chinese (Hong Kong
 * usage). Every term in the article opens a card built from one entry here;
 * the same data feeds the glossary index and the search palette.
 *
 * `short` is one plain sentence for a newcomer and follows the 2008 paper's
 * idea. `precise` adds the exact rule as Bitcoin Core implements it today.
 * Both are rich text: `[[term-id]]` or `[[term-id|shown words]]` links another
 * card, and backticks mark code. `name` and `aka` are plain text.
 *
 * `sections` uses the paper's numbering: 0 is the Abstract, 1 to 12 are its
 * numbered sections.
 */
import type { TermCategory, TermDef } from '@/content/types';

/** A card as written below; its category comes from the group it sits in. */
type Entry = Omit<TermDef, 'category'>;

/* ------------------------------------------------------------------- crypto */

const CRYPTO: Entry[] = [
  {
    id: 'hash',
    name: { en: 'hash', zh: '哈希' },
    aka: { en: 'hash value, digest, fingerprint', zh: '又稱雜湊（台灣）、散列' },
    short: {
      en: 'A short, fixed-length fingerprint of any data: change the data even slightly and the fingerprint comes out completely different.',
      zh: '由任何數據算出的一段固定長度「指紋」；數據只要改動一點，指紋便面目全非。',
    },
    precise: {
      en: "Bitcoin's main hash function is [[sha-256]], whose output is always 32 bytes; no practical way is known to recover the input from the output or to find two inputs that give the same output.",
      zh: '比特幣主要採用 [[sha-256]]，輸出固定為 32 位元組；現時未有可行方法由輸出反推輸入，或找出輸出相同的兩份輸入。',
    },
    sections: [2, 3, 4, 7, 8],
    related: ['sha-256', 'double-sha256', 'merkle-tree', 'proof-of-work'],
  },
  {
    id: 'sha-256',
    name: { en: 'SHA-256', zh: 'SHA-256' },
    short: {
      en: 'The [[hash]] function Bitcoin relies on; it turns data of any size into a 256-bit number.',
      zh: '比特幣採用的[[hash|哈希]]函數，可把任意長度的數據變成一個 256 位元的數字。',
    },
    precise: {
      en: 'A member of the SHA-2 family standardised by NIST in FIPS 180; its output is 32 bytes, usually written as 64 hexadecimal digits.',
      zh: '屬於美國 NIST 在 FIPS 180 訂明的 SHA-2 系列；輸出為 32 位元組，通常寫成 64 個十六進制數字。',
    },
    sections: [4],
    related: ['hash', 'double-sha256', 'proof-of-work'],
  },
  {
    id: 'double-sha256',
    name: { en: 'double SHA-256', zh: '雙重 SHA-256' },
    aka: { en: 'SHA-256d, HASH256', zh: '又稱 SHA-256d、HASH256' },
    short: {
      en: 'Running [[sha-256]] on the data and then again on the result; Bitcoin names every [[block]] and transaction by this double hash.',
      zh: '先對數據計算一次 [[sha-256]]，再對結果多算一次；[[block|區塊]]和交易的識別碼都是這樣算出來的。',
    },
    precise: {
      en: '`SHA-256(SHA-256(x))` gives the block hash, the [[txid]] and every node of the [[merkle-tree|Merkle tree]].',
      zh: '區塊哈希、[[txid]]和[[merkle-tree|默克爾樹]]的每個節點，計算方法都是 `SHA-256(SHA-256(x))`。',
    },
    sections: [4, 7],
    related: ['sha-256', 'hash', 'txid', 'block-header'],
  },
  {
    id: 'digital-signature',
    name: { en: 'digital signature', zh: '數碼簽署' },
    aka: { en: 'signature', zh: '又稱數位簽章（台灣）、數字簽名（內地）' },
    short: {
      en: 'Proof, made with a [[private-key|private key]], that its holder approved a message; anyone can check it with the matching [[public-key|public key]].',
      zh: '以[[private-key|私鑰]]為一則訊息產生的憑證，表示持有人認可該訊息；任何人都可用對應的[[public-key|公鑰]]核實。',
    },
    precise: {
      en: 'Bitcoin signs a hash of the transaction, using [[ecdsa]] or, since the Taproot upgrade of 2021, Schnorr signatures (BIP 340), both over the curve secp256k1.',
      zh: '比特幣簽署的是交易的哈希，採用 [[ecdsa]]，或自 2021 年 Taproot 升級起採用 Schnorr 簽署（BIP 340），兩者都建基於曲線 secp256k1。',
    },
    sections: [0, 2, 12],
    related: ['private-key', 'public-key', 'ecdsa', 'electronic-coin'],
  },
  {
    id: 'public-key',
    name: { en: 'public key', zh: '公鑰' },
    aka: { en: 'pubkey', zh: '又稱公開金鑰（台灣）' },
    short: {
      en: 'A number you can share freely; others use it to check your [[digital-signature|signatures]] and to name you as the recipient of a payment.',
      zh: '可以隨意公開的一個數字；別人用它核實你的[[digital-signature|數碼簽署]]，也用它指定你為收款人。',
    },
    precise: {
      en: 'A point on the curve secp256k1 computed from the [[private-key|private key]]; it takes 33 bytes compressed, 65 uncompressed, or 32 in the x-only form used by Taproot.',
      zh: '由[[private-key|私鑰]]算出、位於曲線 secp256k1 的一個點；壓縮格式佔 33 位元組，未壓縮佔 65 位元組，Taproot 採用的純 x 座標格式則佔 32 位元組。',
    },
    sections: [2, 10, 11],
    related: ['private-key', 'key-pair', 'address', 'digital-signature'],
  },
  {
    id: 'private-key',
    name: { en: 'private key', zh: '私鑰' },
    aka: { en: 'secret key', zh: '又稱私密金鑰（台灣）' },
    short: {
      en: 'A secret number that lets its holder sign [[transaction|transactions]]; whoever knows it can spend the coins it controls.',
      zh: '一個必須保密的數字，持有人憑它簽署[[transaction|交易]]；誰知道它，誰就能花掉它所控制的幣。',
    },
    precise: {
      en: 'A 256-bit integer from 1 to just below the order of the curve secp256k1; it is never sent to the network, only the signatures it produces are.',
      zh: '一個 256 位元的整數，取值由 1 至略小於曲線 secp256k1 的階；私鑰從不發送到網絡，發出去的只有它產生的簽署。',
    },
    sections: [2],
    related: ['public-key', 'key-pair', 'digital-signature', 'seed-phrase'],
  },
  {
    id: 'key-pair',
    name: { en: 'key pair', zh: '密鑰對' },
    aka: { en: 'keypair', zh: '又稱金鑰對（台灣）' },
    short: {
      en: 'A [[private-key|private key]] and the [[public-key|public key]] computed from it: one signs, the other lets anyone check the signature.',
      zh: '一把[[private-key|私鑰]]加上由它算出的[[public-key|公鑰]]：前者用來簽署，後者讓任何人核實簽署。',
    },
    precise: {
      en: 'The public key is the private key multiplied by the generator point of secp256k1, a step that cannot feasibly be reversed.',
      zh: '公鑰是私鑰與 secp256k1 生成點相乘的結果，而這一步實際上無法逆向計算。',
    },
    sections: [2, 10, 11],
    related: ['private-key', 'public-key', 'address', 'hd-wallet'],
  },
  {
    id: 'ecdsa',
    name: { en: 'ECDSA', zh: 'ECDSA' },
    aka: {
      en: 'Elliptic Curve Digital Signature Algorithm',
      zh: '全稱橢圓曲線數碼簽署演算法',
    },
    short: {
      en: 'The signature method Bitcoin has used since its first release to prove that the holder of a [[private-key|private key]] approved a [[transaction]].',
      zh: '比特幣自面世以來採用的簽署方法，用來證明[[private-key|私鑰]]持有人認可了一筆[[transaction|交易]]。',
    },
    precise: {
      en: 'Bitcoin runs it over the curve secp256k1 and encodes the signatures in DER; Taproot later added Schnorr signatures (BIP 340) over the same curve.',
      zh: '比特幣以曲線 secp256k1 運行 ECDSA，簽署採用 DER 格式編碼；Taproot 其後加入同樣建基於這條曲線的 Schnorr 簽署（BIP 340）。',
    },
    sections: [2],
    related: ['digital-signature', 'private-key', 'public-key'],
  },
  {
    id: 'address',
    name: { en: 'address', zh: '地址' },
    aka: { en: 'Bitcoin address, receiving address', zh: '又稱收款地址、位址（台灣）' },
    short: {
      en: 'A string of letters and digits you give out to receive payment; it is made from your [[public-key|public key]] and is safe to share.',
      zh: '一串由字母和數字組成的收款代號，由你的[[public-key|公鑰]]推算而成，可以放心交給付款人。',
    },
    precise: {
      en: 'It encodes what a locking [[script|script]] needs, such as the [[hash160]] of a public key: Base58Check for addresses starting with 1 or 3, Bech32 or Bech32m for those starting with bc1.',
      zh: '地址是鎖定[[script|腳本]]所需數據的編碼，例如公鑰的 [[hash160]]：以 1 或 3 開頭的採用 Base58Check，以 bc1 開頭的採用 Bech32 或 Bech32m。',
    },
    sections: [2, 10],
    related: ['public-key', 'hash160', 'address-reuse', 'script'],
  },
  {
    id: 'hash160',
    name: { en: 'HASH160', zh: 'HASH160' },
    short: {
      en: 'A 20-byte fingerprint of a [[public-key|public key]], made by applying two [[hash]] functions in a row, SHA-256 then RIPEMD-160; many addresses carry it instead of the key.',
      zh: '[[public-key|公鑰]]的 20 位元組指紋，由兩種[[hash|哈希]]函數接連計算而成（先 SHA-256，後 RIPEMD-160）；不少地址載的是它，而非公鑰本身。',
    },
    precise: {
      en: '`RIPEMD-160(SHA-256(x))`, the result of the opcode `OP_HASH160`; P2PKH, P2SH and P2WPKH outputs all use it.',
      zh: '即 `RIPEMD-160(SHA-256(x))`，也就是操作碼 `OP_HASH160` 的結果；P2PKH、P2SH 和 P2WPKH 輸出都用到它。',
    },
    sections: [10],
    related: ['address', 'sha-256', 'public-key', 'script'],
  },
];

/* -------------------------------------------------------------------- money */

const MONEY: Entry[] = [
  {
    id: 'electronic-coin',
    name: { en: 'electronic coin', zh: '電子幣' },
    aka: { en: 'coin', zh: '又譯電子貨幣、電子硬幣' },
    short: {
      en: "The paper's definition of a coin: a chain of [[digital-signature|digital signatures]], each owner signing it over to the next.",
      zh: '白皮書對「幣」的定義：一串[[digital-signature|數碼簽署]]，每位持有人簽署一次，把幣轉交下一位。',
    },
    precise: {
      en: 'In the software a coin is an [[utxo|unspent output]]; its signatures can be followed back, transaction by transaction, to the [[coinbase|coinbase transactions]] that created the value.',
      zh: '在軟件裏，一枚幣就是一個[[utxo|未花費輸出]]；沿着簽署逐筆交易往回追，最終會到達創造這些價值的 [[coinbase|coinbase 交易]]。',
    },
    sections: [2, 7, 9, 12],
    related: ['digital-signature', 'transaction', 'utxo', 'double-spending'],
  },
  {
    id: 'transaction',
    name: { en: 'transaction', zh: '交易' },
    aka: { en: 'tx', zh: '簡寫 tx' },
    short: {
      en: 'A signed message that moves coins: it names earlier coins as [[input|inputs]] and assigns their value to new owners as [[output|outputs]].',
      zh: '一則經簽署的轉賬訊息：以[[input|輸入]]指明動用哪些舊幣，再以[[output|輸出]]把價值交給新的持有人。',
    },
    precise: {
      en: 'Serialised as a version, a list of inputs, a list of outputs and a lock time, plus witness data since SegWit (BIP 141); its [[txid]] is the double SHA-256 of the serialisation without the witness.',
      zh: '序列化後依次為版本號、輸入列表、輸出列表和鎖定時間，自 SegWit（BIP 141）起另有見證數據；[[txid]]是不含見證數據的序列化結果的雙重 SHA-256。',
    },
    sections: [2, 5, 9],
    related: ['input', 'output', 'txid', 'fee'],
  },
  {
    id: 'input',
    name: { en: 'input', zh: '輸入' },
    aka: { en: 'transaction input, txin', zh: '又稱交易輸入' },
    short: {
      en: 'The part of a [[transaction]] that points to an earlier [[output]] and proves the right to spend it.',
      zh: '[[transaction|交易]]中指向某個先前[[output|輸出]]的部分，並附上有權動用它的證明。',
    },
    precise: {
      en: 'It holds the outpoint (the earlier [[txid]] and an output index), an unlocking script or witness, and a 4-byte sequence number.',
      zh: '內含輸出點（先前交易的 [[txid|txid]] 加輸出序號）、解鎖腳本或見證數據，以及 4 位元組的序列號。',
    },
    sections: [6, 9, 10],
    related: ['output', 'utxo', 'transaction', 'common-input-heuristic'],
  },
  {
    id: 'output',
    name: { en: 'output', zh: '輸出' },
    aka: { en: 'transaction output, txout', zh: '又稱交易輸出' },
    short: {
      en: "The part of a [[transaction]] that sets an amount and the condition for spending it, normally a signature from the new owner's key.",
      zh: '[[transaction|交易]]中列明一筆金額及其動用條件的部分；條件通常是新持有人的簽署。',
    },
    precise: {
      en: 'An 8-byte amount in [[satoshi-unit|satoshis]] followed by a locking [[script|script]], the `scriptPubKey`; each output can be spent only once, and only whole.',
      zh: '由 8 位元組的金額（以[[satoshi-unit|聰]]計）和鎖定[[script|腳本]] `scriptPubKey` 組成；每個輸出只能花一次，而且必須整個花掉。',
    },
    sections: [6, 9],
    related: ['input', 'utxo', 'change', 'script'],
  },
  {
    id: 'utxo',
    name: { en: 'UTXO', zh: '未花費輸出（UTXO）' },
    aka: { en: 'unspent transaction output', zh: '全稱未花費交易輸出；又稱未使用輸出' },
    short: {
      en: 'An [[output]] that no later transaction has spent yet; your balance is the sum of the ones your keys can spend.',
      zh: '尚未被其後交易動用的[[output|輸出]]；你的餘額，就是你的密鑰能動用的所有未花費輸出之和。',
    },
    precise: {
      en: 'Full nodes keep the set of all UTXOs in the `chainstate` database and check every new [[input]] against it, which is how a [[double-spending|double spend]] is caught.',
      zh: '全節點把全部 UTXO 存放在 `chainstate` 數據庫，並逐一核對新交易的[[input|輸入]]，[[double-spending|雙重支付]]就是這樣被發現的。',
    },
    sections: [5, 7, 9],
    related: ['output', 'input', 'coin-selection', 'double-spending'],
  },
  {
    id: 'change',
    name: { en: 'change', zh: '找續' },
    aka: { en: 'change output', zh: '又稱找零（台灣、內地）' },
    short: {
      en: 'The part of a payment that comes back to the sender: an [[output]] must be spent whole, so the surplus goes to an address the sender controls.',
      zh: '付款後退回給付款人的餘額：[[output|輸出]]必須整個花掉，多出的部分便付回付款人自己的地址。',
    },
    precise: {
      en: 'Wallets send change to a fresh address on a separate internal branch of an [[hd-wallet|HD wallet]] (chain 1 in BIP 44), and add it to the [[fee]] instead when the amount would be dust.',
      zh: '錢包會把找續付到 [[hd-wallet|HD 錢包]]內部分支的新地址（BIP 44 的 chain 1）；若金額小至成為「粉塵」，便改為併入[[fee|手續費]]。',
    },
    sections: [9],
    related: ['output', 'coin-selection', 'fee', 'address-reuse'],
  },
  {
    id: 'fee',
    name: { en: 'transaction fee', zh: '交易手續費' },
    aka: { en: 'miner fee, network fee', zh: '又稱礦工費' },
    short: {
      en: 'The difference between what a [[transaction]] spends and what it pays out; it goes to the [[miner]] who records the transaction.',
      zh: '[[transaction|交易]]動用的金額與轉出的金額之差，歸把這筆交易寫入紀錄的[[miner|礦工]]所有。',
    },
    precise: {
      en: 'It is never written in the transaction: it is the sum of the inputs minus the sum of the outputs, and wallets choose it as a rate in satoshis per virtual byte (sat/vB).',
      zh: '手續費不會寫在交易之內，而是輸入總和減去輸出總和；錢包按每虛擬位元組多少聰（sat/vB）的費率來設定。',
    },
    sections: [6, 9],
    related: ['transaction', 'block-subsidy', 'mempool', 'incentive'],
  },
  {
    id: 'coinbase',
    name: { en: 'coinbase transaction', zh: 'coinbase 交易' },
    aka: { en: 'generation transaction', zh: '又稱幣基交易、創幣交易' },
    short: {
      en: "The first [[transaction]] in every [[block]]: it spends no earlier coins and pays the block's creator the new coins and the fees.",
      zh: '每個[[block|區塊]]的第一筆[[transaction|交易]]：它不動用任何舊幣，而是把新發行的幣連同手續費付給該區塊的創建者。',
    },
    precise: {
      en: 'Its single input points at no earlier output, and the script of that input must begin with the [[block-height|block height]] (BIP 34); its outputs cannot be spent until they have 100 [[confirmation|confirmations]].',
      zh: '它唯一的輸入不指向任何先前的輸出，而該輸入的腳本須以[[block-height|區塊高度]]開頭（BIP 34）；其輸出要有 100 個[[confirmation|確認]]才可動用。',
    },
    sections: [6],
    related: ['block-subsidy', 'fee', 'miner', 'halving'],
  },
  {
    id: 'satoshi-unit',
    name: { en: 'satoshi', zh: '聰（satoshi）' },
    aka: { en: 'sat', zh: '簡稱 sat' },
    short: {
      en: 'The smallest unit of bitcoin: one hundred-millionth of a coin, named after the author of the paper.',
      zh: '比特幣的最小單位，即一億分之一個比特幣，以白皮書作者的名字命名。',
    },
    precise: {
      en: '1 BTC = 100,000,000 satoshis; amounts on the chain are whole numbers of satoshis, stored as 64-bit integers.',
      zh: '1 BTC = 100,000,000 聰；鏈上的金額一律是聰的整數倍，以 64 位元整數儲存。',
    },
    sections: [6, 9],
    related: ['output', 'fee', 'supply-cap'],
  },
  {
    id: 'double-spending',
    name: { en: 'double-spending', zh: '雙重支付' },
    aka: { en: 'double spend', zh: '又稱雙花、重複花費' },
    short: {
      en: 'Spending the same coin twice by signing it over to two different people; preventing it without a central authority is the problem the paper solves.',
      zh: '把同一枚幣先後簽給兩個人，一幣兩花；白皮書要解決的，正是如何在沒有中央機構的情況下杜絕這種行為。',
    },
    precise: {
      en: 'Nodes reject any transaction whose [[input]] is not in the [[utxo|UTXO set]], so only one of two conflicting spends can ever be confirmed in the chain.',
      zh: '節點會拒絕[[input|輸入]]不在 [[utxo|UTXO 集]]內的交易，因此互相衝突的兩筆花費最多只有一筆能獲鏈上確認。',
    },
    sections: [0, 1, 2, 11, 12],
    related: ['trusted-third-party', 'mint', 'confirmation', 'utxo'],
  },
  {
    id: 'trusted-third-party',
    name: { en: 'trusted third party', zh: '可信第三方' },
    aka: { en: 'trusted intermediary', zh: '又稱受信任第三方、中介機構' },
    short: {
      en: 'A bank or payment company that both sides of a payment must rely on to keep the record and settle disputes.',
      zh: '付款雙方都必須倚賴的銀行或支付公司，由它負責記賬和調解糾紛。',
    },
    sections: [0, 1, 2, 10],
    related: ['mint', 'double-spending', 'irreversibility', 'peer-to-peer'],
  },
  {
    id: 'mint',
    name: { en: 'mint', zh: '鑄幣廠' },
    short: {
      en: 'In the paper, a central authority that checks every [[transaction]] for [[double-spending]] and reissues each coin; Bitcoin is designed to do without one.',
      zh: '白皮書所指的中央機構：逐筆檢查[[transaction|交易]]有否[[double-spending|雙重支付]]，並重新發行每枚幣；比特幣的設計正是要擺脫它。',
    },
    sections: [2],
    related: ['trusted-third-party', 'double-spending', 'timestamp-server'],
  },
  {
    id: 'script',
    name: { en: 'Script', zh: '腳本（Script）' },
    aka: { en: 'Bitcoin Script', zh: '又稱指令碼（台灣）' },
    short: {
      en: 'A small program attached to each [[output]] that states what must be shown to spend it, usually a [[digital-signature|signature]] matching a given key.',
      zh: '附在每個[[output|輸出]]上的小程式，寫明要出示甚麼才可動用這筆錢，通常是與指定公鑰相符的[[digital-signature|數碼簽署]]。',
    },
    precise: {
      en: 'A stack-based language with no loops; the locking script (`scriptPubKey`) is run against the unlocking data in the spending [[input]], and the spend is valid only if the result is true.',
      zh: '一種以堆疊運作、不設迴圈的語言；節點把鎖定腳本 `scriptPubKey` 與花費它的[[input|輸入]]所帶的解鎖數據一併執行，結果為真才算有效。',
    },
    sections: [2],
    related: ['output', 'input', 'digital-signature', 'address'],
  },
  {
    id: 'txid',
    name: { en: 'txid', zh: '交易 ID（txid）' },
    aka: { en: 'transaction ID, transaction hash', zh: '又稱交易哈希、交易識別碼' },
    short: {
      en: 'The [[hash]] of a [[transaction]], used as its name: it is how wallets look a payment up and how one transaction points to an earlier one.',
      zh: '一筆[[transaction|交易]]的[[hash|哈希]]，也是它的名字：錢包憑它查找付款，新交易也憑它指向先前的交易。',
    },
    precise: {
      en: 'The [[double-sha256|double SHA-256]] of the transaction without witness data, shown byte-reversed as 64 hexadecimal digits; the hash that also covers the witness is the wtxid.',
      zh: '不含見證數據的交易經[[double-sha256|雙重 SHA-256]] 計算所得，顯示時位元組次序倒轉，寫成 64 個十六進制數字；連見證數據一併計算的則稱為 wtxid。',
    },
    sections: [2, 7, 8],
    related: ['transaction', 'double-sha256', 'input', 'merkle-tree'],
  },
  {
    id: 'psbt',
    name: { en: 'PSBT', zh: '部分簽署交易（PSBT）' },
    aka: {
      en: 'Partially Signed Bitcoin Transaction',
      zh: '全稱 Partially Signed Bitcoin Transaction',
    },
    short: {
      en: 'A standard file format for a [[transaction]] that still needs signatures, so one program can build it and another device can sign it.',
      zh: '一種標準檔案格式，用來傳遞尚待簽署的[[transaction|交易]]，讓一個程式負責組裝，另一部裝置負責簽署。',
    },
    precise: {
      en: 'Defined in BIP 174, with version 2 in BIP 370; Bitcoin Core handles it through RPCs such as `walletcreatefundedpsbt`, `walletprocesspsbt` and `finalizepsbt`.',
      zh: '由 BIP 174 定義，第 2 版見 BIP 370；Bitcoin Core 以 `walletcreatefundedpsbt`、`walletprocesspsbt`、`finalizepsbt` 等 RPC 處理。',
    },
    sections: [2, 9],
    related: ['hardware-wallet', 'software-wallet', 'transaction', 'digital-signature'],
  },
  {
    id: 'coin-selection',
    name: { en: 'coin selection', zh: '選幣' },
    aka: { en: 'UTXO selection', zh: '又稱 UTXO 選擇' },
    short: {
      en: 'How a [[wallet]] picks which of your [[utxo|unspent outputs]] to spend so that they cover the payment and the fee.',
      zh: '[[wallet|錢包]]從你的[[utxo|未花費輸出]]中挑選若干個來花的過程，務求總額足以支付款項和手續費。',
    },
    precise: {
      en: 'Bitcoin Core tries several algorithms, among them Branch and Bound, which looks for a combination that needs no [[change]], and keeps the result that wastes the least in fees.',
      zh: 'Bitcoin Core 會嘗試多種演算法，其中 Branch and Bound 專門尋找毋須[[change|找續]]的組合，最後採用手續費浪費最少的結果。',
    },
    sections: [9],
    related: ['utxo', 'change', 'fee', 'wallet'],
  },
  {
    id: 'irreversibility',
    name: { en: 'irreversibility', zh: '不可逆性' },
    aka: { en: 'non-reversible payments, finality', zh: '又稱不可撤銷、終局性' },
    short: {
      en: 'Being impossible to undo: once a payment is in the chain, cancelling it would mean redoing the [[proof-of-work]] of its [[block]] and of every block after it.',
      zh: '付款一經寫入鏈上便無法撤回的特性：要推翻它，就得重做所在[[block|區塊]]及其後所有區塊的[[proof-of-work|工作量證明]]。',
    },
    precise: {
      en: 'Finality is a matter of probability, not a fixed rule: the chance that a payment is replaced falls exponentially with each [[confirmation]], as section 11 of the paper calculates.',
      zh: '終局性並非硬性規則，而是概率問題：每多一個[[confirmation|確認]]，付款被取代的機會便以指數下降，白皮書第 11 節有詳細計算。',
    },
    sections: [1, 4, 11],
    related: ['confirmation', 'escrow', 'trusted-third-party', 'reorg'],
  },
  {
    id: 'escrow',
    name: { en: 'escrow', zh: '託管（escrow）' },
    short: {
      en: "An arrangement that holds a buyer's payment until the goods arrive, protecting the buyer when payments cannot be reversed.",
      zh: '先把買家的款項扣起，待貨物送達才放款的安排；在付款不可撤回的情況下，用來保障買家。',
    },
    precise: {
      en: 'On Bitcoin it is usually built as a 2-of-3 multisignature [[output]]: buyer, seller and an arbiter each hold a key, and any two of them can release the funds.',
      zh: '在比特幣上通常以 2-of-3 多重簽署[[output|輸出]]實現：買家、賣家和仲裁人各持一把密鑰，任何兩方同意即可放款。',
    },
    sections: [1],
    related: ['irreversibility', 'trusted-third-party', 'script'],
  },
];

/* -------------------------------------------------------------------- chain */

const CHAIN: Entry[] = [
  {
    id: 'block',
    name: { en: 'block', zh: '區塊' },
    short: {
      en: 'A batch of [[transaction|transactions]] added to the record at one time, sealed by a [[hash]] that also covers the batch before it.',
      zh: '一批同時寫入紀錄的[[transaction|交易]]，由一個[[hash|哈希]]封存，而這個哈希同時涵蓋上一批交易。',
    },
    precise: {
      en: 'An 80-byte [[block-header|header]] followed by the transactions, the first of which is the [[coinbase]]; the size limit is 4 million weight units (BIP 141).',
      zh: '由 80 位元組的[[block-header|區塊頭]]和其後的交易組成，第一筆必為 [[coinbase|coinbase 交易]]；大小上限為 400 萬重量單位（BIP 141）。',
    },
    sections: [3, 4, 5, 7],
    related: ['block-header', 'blockchain', 'transaction', 'block-height'],
  },
  {
    id: 'block-header',
    name: { en: 'block header', zh: '區塊頭' },
    aka: { en: 'header', zh: '又稱區塊標頭（台灣）' },
    short: {
      en: "A [[block]]'s 80-byte summary: one hash that stands for all its transactions, the hash of the previous block, and the [[nonce|number that miners keep changing]].",
      zh: '[[block|區塊]]開頭的 80 位元組摘要：內有代表全部交易的一個哈希、上一個區塊的哈希，以及礦工不斷更換的[[nonce|隨機數]]。',
    },
    precise: {
      en: 'Six fields: version (4 bytes), previous block hash (32), [[merkle-root|Merkle root]] (32), time (4), `nBits` (4) and [[nonce]] (4).',
      zh: '共六個欄位：版本（4 位元組）、上一區塊哈希（32）、[[merkle-root|默克爾根]]（32）、時間（4）、`nBits`（4）和[[nonce|隨機數]]（4）。',
    },
    sections: [4, 7, 8],
    related: ['block', 'nonce', 'merkle-root', 'bits'],
  },
  {
    id: 'block-height',
    name: { en: 'block height', zh: '區塊高度' },
    short: {
      en: "A [[block]]'s position in the chain, counted from the first block, which is height 0.",
      zh: '[[block|區塊]]在鏈上的位置，由第一個區塊起計，而第一個區塊的高度為 0。',
    },
    precise: {
      en: "The height is not a field of the [[block-header|header]]; since BIP 34 it is written at the start of the [[coinbase|coinbase transaction]]'s input.",
      zh: '高度並不是[[block-header|區塊頭]]的欄位；自 BIP 34 起，它寫在 [[coinbase|coinbase 交易]]輸入的開頭。',
    },
    sections: [6, 11],
    related: ['block', 'genesis-block', 'confirmation', 'halving'],
  },
  {
    id: 'genesis-block',
    name: { en: 'genesis block', zh: '創世區塊' },
    aka: { en: 'block 0', zh: '又稱創世塊、區塊 0' },
    short: {
      en: 'The first [[block]] of the chain, written into the software itself; every other block traces back to it.',
      zh: '鏈上的第一個[[block|區塊]]，直接寫在軟件之內；其後每個區塊都可以一路追溯到它。',
    },
    precise: {
      en: 'Dated 3 January 2009; its [[coinbase|coinbase transaction]] quotes a headline from The Times of that day, and its 50 BTC reward can never be spent.',
      zh: '日期為 2009 年 1 月 3 日；其 [[coinbase|coinbase 交易]]引用了當日《泰晤士報》的頭條標題，而那 50 BTC 獎勵永遠無法動用。',
    },
    sections: [3, 4],
    related: ['block', 'block-height', 'blockchain', 'coinbase'],
  },
  {
    id: 'blockchain',
    name: { en: 'blockchain', zh: '區塊鏈' },
    aka: { en: 'block chain, proof-of-work chain', zh: '白皮書稱之為工作量證明鏈' },
    short: {
      en: 'Blocks in order, each carrying the [[hash]] of the one before, so changing an old [[block]] breaks every link after it.',
      zh: '依次相連的[[block|區塊]]，每個都載有上一個區塊的[[hash|哈希]]；改動任何舊區塊，其後的連結便全部斷開。',
    },
    precise: {
      en: 'Bitcoin Core stores the blocks in `blkNNNNN.dat` files and tracks every known header in a block index; the active chain is the valid one with the most [[chainwork]].',
      zh: 'Bitcoin Core 把區塊存於 `blkNNNNN.dat` 檔案，並以區塊索引記錄所有已知的區塊頭；生效的是[[chainwork|累計工作量]]最多的有效鏈。',
    },
    sections: [3, 4, 5],
    related: ['block', 'timestamp-server', 'longest-chain', 'genesis-block'],
  },
  {
    id: 'timestamp',
    name: { en: 'timestamp', zh: '時間戳' },
    aka: { en: 'time stamp', zh: '又稱時間戳記（台灣）' },
    short: {
      en: 'Proof that some data existed by a certain time, because a [[hash]] published at that time already included it.',
      zh: '證明某份數據在某個時刻已經存在的憑據，因為當時公佈的[[hash|哈希]]已把它計算在內。',
    },
    precise: {
      en: "Each [[block-header|header]] carries a 4-byte Unix time that must be later than the median of the previous 11 blocks and no more than two hours ahead of the node's clock.",
      zh: '每個[[block-header|區塊頭]]載有 4 位元組的 Unix 時間，必須晚於前 11 個區塊的時間中位數，且不得比節點的時鐘快超過兩小時。',
    },
    sections: [0, 3],
    related: ['timestamp-server', 'block-header', 'hash'],
  },
  {
    id: 'timestamp-server',
    name: { en: 'timestamp server', zh: '時間戳伺服器' },
    short: {
      en: 'A service that takes the [[hash]] of a batch of items and publishes it widely, each new hash including the previous one so that they form a chain.',
      zh: '為一批數據計算[[hash|哈希]]並廣泛公佈的服務；每個新哈希都包含上一個哈希，環環相扣成鏈。',
    },
    precise: {
      en: "Bitcoin's version is distributed: the network as a whole plays the server, and [[proof-of-work]] takes the place of publishing in a newspaper or on Usenet.",
      zh: '比特幣的版本是分散式的：由整個網絡充當伺服器，並以[[proof-of-work|工作量證明]]取代登報或在 Usenet 張貼。',
    },
    sections: [1, 3, 4],
    related: ['timestamp', 'blockchain', 'proof-of-work'],
  },
  {
    id: 'proof-of-work',
    name: { en: 'proof-of-work', zh: '工作量證明' },
    aka: { en: 'PoW', zh: '簡稱 PoW' },
    short: {
      en: 'Evidence that computing effort was spent: a [[hash]] so low that finding it took many tries, yet anyone can check it with one.',
      zh: '證明確實花費了運算的憑據：一個數值極小的[[hash|哈希]]，要試很多次才找到，但任何人算一次便能核實。',
    },
    precise: {
      en: 'A block is valid only if the [[double-sha256|double SHA-256]] of its header, read as a 256-bit number, is less than or equal to the [[target]].',
      zh: '區塊頭的[[double-sha256|雙重 SHA-256]] 結果視作一個 256 位元的數字，必須小於或等於[[target|目標值]]，區塊才算有效。',
    },
    sections: [0, 4, 5, 12],
    related: ['nonce', 'difficulty', 'target', 'hashcash'],
  },
  {
    id: 'nonce',
    name: { en: 'nonce', zh: '隨機數（nonce）' },
    aka: { en: 'number used once', zh: '又稱臨時值、一次性數字' },
    short: {
      en: "A number [[miner|miners]] change until the block's [[hash]] is low enough.",
      zh: '[[miner|礦工]]不斷更換的一個數字，直至區塊的[[hash|哈希]]值夠小為止。',
    },
    precise: {
      en: 'A 4-byte field of the [[block-header|header]] with only about 4.3 billion values; when they run out, miners alter the [[coinbase|coinbase transaction]] or the time field and start again.',
      zh: '[[block-header|區塊頭]]內一個 4 位元組的欄位，只有約 43 億個取值；用盡後，礦工會改動 [[coinbase|coinbase 交易]]或時間欄位，然後重新再試。',
    },
    sections: [4],
    related: ['proof-of-work', 'block-header', 'mining', 'target'],
  },
  {
    id: 'hashcash',
    name: { en: 'Hashcash', zh: 'Hashcash' },
    short: {
      en: "Adam Back's earlier scheme that made email senders compute a costly [[hash]] to deter spam; the paper borrows its [[proof-of-work]].",
      zh: 'Adam Back 早年的方案：電郵寄件人須先算出一個費時的[[hash|哈希]]，以遏止垃圾郵件；白皮書的[[proof-of-work|工作量證明]]借鑑於此。',
    },
    precise: {
      en: 'Hashcash used SHA-1 and counted leading zero bits; Bitcoin uses double SHA-256 and compares the hash with a numeric [[target]].',
      zh: 'Hashcash 採用 SHA-1，並以開頭有多少個零位元為準；比特幣則採用雙重 SHA-256，並把哈希與一個以數字表示的[[target|目標值]]比較。',
    },
    sections: [4],
    related: ['proof-of-work', 'zero-bits', 'hash'],
  },
  {
    id: 'difficulty',
    name: { en: 'difficulty', zh: '難度' },
    short: {
      en: 'How hard it is to find a valid [[block]]; the network adjusts it so that blocks keep arriving about every ten minutes.',
      zh: '找出一個有效[[block|區塊]]有多難；網絡會自動調節，使區塊維持大約每十分鐘出現一個。',
    },
    precise: {
      en: 'Defined as the highest allowed [[target]] divided by the current target, so difficulty 1 is the easiest; it changes only at each [[retarget]].',
      zh: '定義為最大允許[[target|目標值]]除以現行目標值，故難度 1 最易；它只在每次[[retarget|難度調整]]時改變。',
    },
    sections: [4],
    related: ['target', 'retarget', 'hash-rate', 'proof-of-work'],
  },
  {
    id: 'target',
    name: { en: 'target', zh: '目標值' },
    short: {
      en: "The threshold a block's [[hash]] must not exceed; the lower the target, the more tries it takes to find a valid block.",
      zh: '區塊[[hash|哈希]]不得超過的門檻；目標值愈低，找到有效區塊所需的嘗試次數愈多。',
    },
    precise: {
      en: 'A 256-bit number stored in the header in a compact 4-byte form, the [[bits]] field; a hash passes when it is less than or equal to the target.',
      zh: '一個 256 位元的數字，以 4 位元組的壓縮格式存於區塊頭的[[bits|難度位]]欄位；哈希小於或等於目標值即屬合格。',
    },
    sections: [4],
    related: ['difficulty', 'bits', 'zero-bits', 'proof-of-work'],
  },
  {
    id: 'bits',
    name: { en: 'bits', zh: '難度位（bits）' },
    aka: { en: 'nBits, compact target', zh: '又稱 nBits、壓縮目標值' },
    short: {
      en: 'The 4-byte field in the [[block-header|block header]] that records the current [[target]] in a compact form.',
      zh: '[[block-header|區塊頭]]內一個 4 位元組的欄位，以壓縮格式記錄現行的[[target|目標值]]。',
    },
    precise: {
      en: "One byte of exponent and three of mantissa, like scientific notation in base 256; the genesis block's `0x1d00ffff` means `0x00ffff` followed by 26 zero bytes.",
      zh: '首個位元組是指數，其餘三個是尾數，相當於 256 進制的科學記數法；創世區塊的 `0x1d00ffff` 即 `0x00ffff` 後接 26 個零位元組。',
    },
    sections: [4],
    related: ['target', 'difficulty', 'block-header', 'retarget'],
  },
  {
    id: 'zero-bits',
    name: { en: 'zero bits', zh: '零位元' },
    aka: { en: 'leading zeros', zh: '又稱前導零' },
    short: {
      en: "The zeros a [[hash]] must begin with in the paper's description of [[proof-of-work]]; each extra zero bit doubles the expected number of tries.",
      zh: '白皮書描述[[proof-of-work|工作量證明]]時，要求[[hash|哈希]]開頭必須出現的零；每多一個零位元，預計嘗試次數便加倍。',
    },
    precise: {
      en: 'The real rule is finer: the hash must not exceed a numeric [[target]], which need not be a power of two, so the difficulty can change by any ratio.',
      zh: '實際規則更精細：哈希不得超過一個以數字表示的[[target|目標值]]，而目標值不必是 2 的次方，故難度可按任意比例調整。',
    },
    sections: [4],
    related: ['target', 'proof-of-work', 'hashcash', 'difficulty'],
  },
  {
    id: 'retarget',
    name: { en: 'difficulty adjustment', zh: '難度調整' },
    aka: { en: 'retarget, retargeting', zh: '又稱難度重定（retarget）' },
    short: {
      en: 'The periodic correction to the [[difficulty]]: [[block|blocks]] become harder to find when they have been coming too fast, and easier when too slow.',
      zh: '定期對[[difficulty|難度]]作出的修正：[[block|區塊]]出現得太快便調高，太慢便調低。',
    },
    precise: {
      en: 'The paper describes a moving average; the code instead recalculates every 2,016 blocks, multiplying the [[target]] by the time those blocks took divided by two weeks, within a factor of 4 either way.',
      zh: '白皮書說的是移動平均；程式實際上每 2,016 個區塊重新計算一次：把[[target|目標值]]乘以這批區塊的實際用時與兩星期之比，每次升跌以 4 倍為限。',
    },
    sections: [4],
    related: ['difficulty', 'target', 'hash-rate', 'bits'],
  },
  {
    id: 'hash-rate',
    name: { en: 'hash rate', zh: '算力' },
    aka: { en: 'hash power, CPU power', zh: '又稱哈希率' },
    short: {
      en: 'How many [[hash|hashes]] a [[miner]], or the whole network, tries each second; the paper calls it CPU power.',
      zh: '一名[[miner|礦工]]或整個網絡每秒嘗試多少次[[hash|哈希]]運算；白皮書稱之為「CPU 算力」。',
    },
    precise: {
      en: 'It cannot be measured directly; it is estimated from the [[difficulty]] and how quickly recent blocks arrived, as the RPC `getnetworkhashps` does.',
      zh: '算力無法直接量度，只能按[[difficulty|難度]]和近期新區塊出現的速度估算，RPC `getnetworkhashps` 便是這樣計算。',
    },
    sections: [0, 4, 6, 11],
    related: ['difficulty', 'miner', 'majority-attack', 'asic'],
  },
  {
    id: 'longest-chain',
    name: { en: 'longest chain', zh: '最長鏈' },
    aka: { en: 'best chain, most-work chain', zh: '又稱最佳鏈、最大工作量鏈' },
    short: {
      en: 'The rule that settles competing histories: every [[node]] treats the longest chain, the one with the most [[proof-of-work]] invested in it, as the correct one.',
      zh: '解決歷史分歧的規則：每個[[node|節點]]都把最長的一條鏈，即投入[[proof-of-work|工作量證明]]最多的那條，視為正確。',
    },
    precise: {
      en: 'Nodes do not count blocks: they follow the valid chain with the most cumulative work, its [[chainwork]], so a shorter chain of harder blocks would win.',
      zh: '節點其實不數區塊，而是跟隨[[chainwork|累計工作量]]最多的有效鏈；因此區塊較少但難度較高的鏈反而會勝出。',
    },
    sections: [0, 4, 5, 8, 11],
    related: ['chainwork', 'fork', 'reorg', 'majority-attack'],
  },
  {
    id: 'chainwork',
    name: { en: 'chainwork', zh: '累計工作量（chainwork）' },
    aka: { en: 'cumulative work, total work', zh: '又稱總工作量' },
    short: {
      en: 'The total [[proof-of-work]] in a chain, from the first block to the latest; it is what [[node|nodes]] compare when they choose between chains.',
      zh: '一條鏈由第一個區塊到最新區塊所累積的[[proof-of-work|工作量證明]]總和；[[node|節點]]選鏈時比較的就是它。',
    },
    precise: {
      en: 'Each block adds about `2^256 / (target + 1)`, the expected number of hashes needed to find it; `getblockchaininfo` reports the sum in its `chainwork` field.',
      zh: '每個區塊貢獻約 `2^256 / (target + 1)`，即找到它預計所需的哈希次數；`getblockchaininfo` 的 `chainwork` 欄位就是這個總和。',
    },
    sections: [4, 5],
    related: ['longest-chain', 'difficulty', 'target', 'reorg'],
  },
  {
    id: 'fork',
    name: { en: 'fork', zh: '分叉' },
    aka: { en: 'chain split', zh: '又稱分岔' },
    short: {
      en: 'A moment when the chain has two competing tips, because two [[block|blocks]] were found on the same parent at nearly the same time.',
      zh: '兩個[[block|區塊]]幾乎同時接在同一個區塊之後，令鏈暫時出現兩個互相競爭的末端。',
    },
    precise: {
      en: 'Nodes keep both branches, work on the one they received first and switch if the other gains more [[chainwork|work]]; a change of the rules (a soft or hard fork) is a different use of the word.',
      zh: '節點會保留兩條分支，先在最早收到的一條上工作，一旦另一條累積了更多[[chainwork|工作量]]便轉過去；至於更改規則的「軟分叉」和「硬分叉」，是這個詞的另一種用法。',
    },
    sections: [5, 11],
    related: ['reorg', 'stale-block', 'longest-chain', 'confirmation'],
  },
  {
    id: 'stale-block',
    name: { en: 'stale block', zh: '過時區塊（stale block）' },
    aka: { en: 'orphan block (loosely)', zh: '俗稱孤塊' },
    short: {
      en: 'A valid [[block]] that lost a [[fork]]: another block at the same height was built on instead, so it is left out of the chain.',
      zh: '在[[fork|分叉]]中落敗的有效[[block|區塊]]：礦工選擇接在同一高度的另一個區塊之後，它因而被排除在鏈外。',
    },
    precise: {
      en: 'Its transactions are not lost: those missing from the winning branch return to the [[mempool]], but its [[block-subsidy|subsidy]] and fees pay no one.',
      zh: '它所載的交易不會消失：未被勝出分支收錄的會回到[[mempool|記憶池]]；但它的[[block-subsidy|區塊補貼]]和手續費則無人能得。',
    },
    sections: [5],
    related: ['fork', 'reorg', 'longest-chain'],
  },
  {
    id: 'reorg',
    name: { en: 'reorg', zh: '重組' },
    aka: { en: 'chain reorganisation', zh: '又稱鏈重組' },
    short: {
      en: 'What a [[node]] does when a competing branch overtakes the one it was following: it undoes its latest blocks and adopts the other branch.',
      zh: '當另一條分支超越了原先跟隨的一條，[[node|節點]]便撤回最近幾個區塊，改為採納那條分支。',
    },
    precise: {
      en: 'Blocks are disconnected back to the common ancestor and the new branch is connected in their place; transactions that the new branch lacks go back to the [[mempool]].',
      zh: '節點會逐個撤銷區塊，直至兩條分支的共同祖先，再接上新分支；新分支沒有收錄的交易則退回[[mempool|記憶池]]。',
    },
    sections: [5, 11],
    related: ['fork', 'stale-block', 'confirmation', 'chainwork'],
  },
  {
    id: 'confirmation',
    name: { en: 'confirmation', zh: '確認' },
    aka: { en: 'confirmations, depth', zh: '又稱確認數' },
    short: {
      en: 'A [[block]] that includes your [[transaction]] gives it one confirmation, and every block added after that gives it one more.',
      zh: '[[transaction|交易]]被收進一個[[block|區塊]]，便得到第一個確認；其後每接上一個新區塊，確認數加一。',
    },
    precise: {
      en: "By the paper's calculation, once 5 blocks have followed a payment an attacker with 10% of the [[hash-rate|hash rate]] has less than a 0.1% chance of reversing it; waiting for six confirmations is a common convention.",
      zh: '按白皮書的計算，付款之後再接上 5 個區塊，掌握一成[[hash-rate|算力]]的攻擊者成功逆轉的概率便低於 0.1%；慣例上會等六個確認。',
    },
    sections: [7, 8, 11],
    related: ['block-height', 'reorg', 'irreversibility', 'majority-attack'],
  },
  {
    id: 'majority-attack',
    name: { en: 'majority attack', zh: '多數算力攻擊' },
    aka: { en: '51% attack', zh: '又稱 51% 攻擊' },
    short: {
      en: 'An attack by someone who controls more than half of the [[hash-rate|hash rate]]: they can outpace the honest chain and take back their own recent payments.',
      zh: '掌握過半[[hash-rate|算力]]者發動的攻擊：他們延長鏈的速度勝過誠實節點，足以收回自己剛付出的款項。',
    },
    precise: {
      en: "Even then the attacker cannot create coins or spend other people's: nodes still reject invalid transactions and blocks, as section 11 of the paper points out.",
      zh: '即使如此，攻擊者仍不能憑空造幣或花掉別人的錢：節點照樣拒絕無效的交易和區塊，白皮書第 11 節已指出這一點。',
    },
    sections: [0, 4, 6, 11],
    related: ['hash-rate', 'longest-chain', 'double-spending', 'gamblers-ruin'],
  },
];

/* ------------------------------------------------------------------ network */

const NETWORK: Entry[] = [
  {
    id: 'peer-to-peer',
    name: { en: 'peer-to-peer', zh: '點對點' },
    aka: { en: 'P2P', zh: '簡稱 P2P；又稱對等網絡' },
    short: {
      en: 'A network with no central server: every computer connects to a few others as an equal and passes messages along.',
      zh: '沒有中央伺服器的網絡：每部電腦以平等身份與另外幾部相連，互相轉發訊息。',
    },
    precise: {
      en: 'Nodes talk over TCP, on port 8333 by default; in the original transport each message starts with a 24-byte header, and BIP 324 adds an encrypted alternative.',
      zh: '節點之間以 TCP 通訊，預設連接埠為 8333；在原有的傳輸格式中，每則訊息以 24 位元組的訊息頭開始，BIP 324 則另外提供加密的傳輸方式。',
    },
    sections: [0, 1, 5, 12],
    related: ['node', 'broadcast', 'version-handshake', 'best-effort'],
  },
  {
    id: 'node',
    name: { en: 'node', zh: '節點' },
    short: {
      en: 'A computer running Bitcoin software that connects to others, relays [[transaction|transactions]] and [[block|blocks]], and checks them against the rules.',
      zh: '運行比特幣軟件的電腦：與其他節點相連，轉發[[transaction|交易]]和[[block|區塊]]，並按規則逐一檢查。',
    },
    precise: {
      en: 'In the paper every node also mines; today most nodes only validate and relay, while mining is left to specialised [[miner|miners]].',
      zh: '在白皮書中，每個節點同時負責挖礦；現時大多數節點只做驗證和轉發，挖礦則交由專門的[[miner|礦工]]負責。',
    },
    sections: [0, 5, 8, 12],
    related: ['full-node', 'light-client', 'peer-to-peer', 'miner'],
  },
  {
    id: 'full-node',
    name: { en: 'full node', zh: '全節點' },
    aka: { en: 'fully validating node', zh: '又稱完整節點' },
    short: {
      en: "A [[node]] that downloads every [[block]] and checks every rule for itself, trusting nobody else's word about what is valid.",
      zh: '下載每個[[block|區塊]]並親自核對每條規則的[[node|節點]]，不必聽信任何人對交易是否有效的說法。',
    },
    precise: {
      en: 'It must verify the whole chain once, but may then delete old block files ([[pruning|pruned mode]]) and still validate fully from its [[utxo|UTXO set]].',
      zh: '它必須把整條鏈驗證一遍，之後可以刪去舊的區塊檔案（[[pruning|修剪模式]]），憑 [[utxo|UTXO 集]]照樣完整驗證。',
    },
    sections: [5, 8],
    related: ['node', 'light-client', 'bitcoin-core', 'pruning'],
  },
  {
    id: 'light-client',
    name: { en: 'light client', zh: '輕錢包' },
    aka: { en: 'SPV client, lightweight wallet', zh: '又稱輕節點、輕量級客戶端' },
    short: {
      en: 'A [[wallet]] that stores only a short summary of each block and asks [[full-node|full nodes]] for proof that its payments were included.',
      zh: '只儲存每個區塊簡短摘要的[[wallet|錢包]]，並向[[full-node|全節點]]索取證明，以確認自己的付款已被收錄。',
    },
    precise: {
      en: "It verifies the [[proof-of-work]] on the headers and a [[merkle-branch|Merkle branch]] for each payment, but cannot check that the block's other transactions are valid.",
      zh: '它會核實區塊頭的[[proof-of-work|工作量證明]]和每筆付款的[[merkle-branch|默克爾分支]]，卻無法檢查區塊內其他交易是否有效。',
    },
    sections: [8],
    related: ['spv', 'full-node', 'merkle-branch', 'compact-block-filters'],
  },
  {
    id: 'broadcast',
    name: { en: 'broadcast', zh: '廣播' },
    short: {
      en: 'Sending a new [[transaction]] or [[block]] to the peers you are connected to, who pass it on until the whole network has it.',
      zh: '把新的[[transaction|交易]]或[[block|區塊]]發給相連的節點，再由它們逐一轉發，直至傳遍整個網絡。',
    },
    precise: {
      en: 'A transaction is not pushed outright: a node announces its hash with [[inv]], and peers that lack it request it with [[getdata]].',
      zh: '節點不會直接推送交易，而是先以 [[inv]] 公佈其哈希，未有該交易的對等節點再以 [[getdata]] 索取。',
    },
    sections: [0, 5],
    related: ['inv', 'getdata', 'compact-blocks', 'best-effort'],
  },
  {
    id: 'mempool',
    name: { en: 'mempool', zh: '記憶池' },
    aka: { en: 'memory pool', zh: '又稱內存池（內地）、交易池' },
    short: {
      en: "A [[node]]'s waiting room for valid [[transaction|transactions]] that have been broadcast but are not yet in a block.",
      zh: '[[node|節點]]存放待處理[[transaction|交易]]的地方：這些交易已經廣播並通過檢查，但尚未被收進區塊。',
    },
    precise: {
      en: 'Every node keeps its own in memory, so there is no single shared mempool; when it is full, the transactions paying the lowest fee rate are dropped first.',
      zh: '每個節點各自在記憶體內維持一個記憶池，並無全網統一的版本；滿載時，費率最低的交易最先被剔除。',
    },
    sections: [5],
    related: ['transaction', 'fee', 'broadcast', 'getblocktemplate'],
  },
  {
    id: 'inv',
    name: { en: 'inv', zh: 'inv' },
    aka: { en: 'inventory message', zh: '即 inventory（清單）訊息' },
    short: {
      en: 'The network message a [[node]] sends to announce new transactions or blocks: a list of their [[hash|hashes]], without the data itself.',
      zh: '[[node|節點]]用來宣佈手上有新交易或新區塊的網絡訊息：只列出它們的[[hash|哈希]]，不附數據本身。',
    },
    precise: {
      en: 'Each entry is a 4-byte type and a 32-byte hash, and one message carries at most 50,000 entries.',
      zh: '每個項目由 4 位元組的類型和 32 位元組的哈希組成，一則訊息最多可載 50,000 個項目。',
    },
    sections: [5],
    related: ['getdata', 'broadcast', 'peer-to-peer'],
  },
  {
    id: 'getdata',
    name: { en: 'getdata', zh: 'getdata' },
    short: {
      en: 'The network message a [[node]] sends to ask a peer for the full transaction or block behind a hash it saw in an [[inv]].',
      zh: '[[node|節點]]在 [[inv]] 中看到陌生的哈希後，用來向對方索取完整交易或區塊的網絡訊息。',
    },
    precise: {
      en: 'It has the same format as `inv`; the peer answers with `tx` or `block` messages, or with `notfound` when it no longer has the data.',
      zh: '格式與 `inv` 相同；對方以 `tx` 或 `block` 訊息回覆，若已沒有該數據，則回覆 `notfound`。',
    },
    sections: [5],
    related: ['inv', 'broadcast', 'peer-to-peer'],
  },
  {
    id: 'version-handshake',
    name: { en: 'version handshake', zh: '版本握手' },
    aka: { en: 'version/verack exchange', zh: '即 version / verack 交換' },
    short: {
      en: 'The greeting two [[node|nodes]] exchange when they connect, telling each other which protocol version and features they support.',
      zh: '兩個[[node|節點]]連接時互相交換的問候訊息，告知對方自己支援的協定版本和功能。',
    },
    precise: {
      en: 'Each side sends `version` (protocol version, services, time, its best [[block-height|block height]]) and answers with `verack`; normal traffic begins only after that.',
      zh: '雙方各自發出 `version`（協定版本、服務、時間、最新[[block-height|區塊高度]]），再以 `verack` 回應，之後才開始正常通訊。',
    },
    sections: [5],
    related: ['peer-to-peer', 'node', 'inv'],
  },
  {
    id: 'best-effort',
    name: { en: 'best effort', zh: '盡力而為' },
    aka: { en: 'best-effort delivery', zh: '又稱盡力傳遞' },
    short: {
      en: 'Delivery without guarantees: messages are passed on as well as the network manages, and the system still works when some are lost.',
      zh: '不設保證的傳遞方式：訊息能送到多少算多少，即使部分遺失，系統依然運作如常。',
    },
    precise: {
      en: 'A transaction only has to reach enough nodes to get into a block, and a node that misses a block requests it once it sees a later one, as section 5 of the paper explains.',
      zh: '交易只要傳到足夠多的節點，便能被收進區塊；節點若漏收某個區塊，會在收到下一個區塊時發現並補取，白皮書第 5 節有說明。',
    },
    sections: [0, 5, 12],
    related: ['broadcast', 'peer-to-peer', 'node'],
  },
  {
    id: 'compact-blocks',
    name: { en: 'compact blocks', zh: '精簡區塊（compact blocks）' },
    aka: { en: 'compact block relay', zh: '又稱緊湊區塊、緻密區塊' },
    short: {
      en: 'A way to announce a new [[block]] with short identifiers instead of full transactions, since peers already hold most of them in the [[mempool]].',
      zh: '公佈新[[block|區塊]]時只發送交易的短識別碼而非完整交易，因為對方的[[mempool|記憶池]]多半已有這些交易。',
    },
    precise: {
      en: 'BIP 152: the `cmpctblock` message carries the header and 6-byte short IDs, and the receiver requests anything it lacks with `getblocktxn`.',
      zh: '見 BIP 152：`cmpctblock` 訊息載有區塊頭和 6 位元組的短識別碼，接收方再以 `getblocktxn` 索取缺少的交易。',
    },
    sections: [5],
    related: ['block', 'mempool', 'broadcast', 'inv'],
  },
];

/* ------------------------------------------------------------------- mining */

const MINING: Entry[] = [
  {
    id: 'incentive',
    name: { en: 'incentive', zh: '激勵' },
    short: {
      en: 'The reward that makes it worth running the network honestly: new coins and [[fee|fees]] go to whoever adds the next [[block]].',
      zh: '令人願意誠實維持網絡的回報：誰接上下一個[[block|區塊]]，誰就得到新發行的幣和[[fee|手續費]]。',
    },
    precise: {
      en: 'The block reward is the [[block-subsidy|subsidy]] plus all the fees in the block; a block whose [[coinbase]] claims more than that is invalid.',
      zh: '區塊獎勵等於[[block-subsidy|區塊補貼]]加上區塊內全部手續費；[[coinbase|coinbase 交易]]領取的金額若超出此數，區塊即屬無效。',
    },
    sections: [6, 12],
    related: ['block-subsidy', 'fee', 'miner', 'coinbase'],
  },
  {
    id: 'block-subsidy',
    name: { en: 'block subsidy', zh: '區塊補貼' },
    aka: {
      en: 'block reward (strictly, the subsidy plus fees)',
      zh: '常稱區塊獎勵（嚴格而言，區塊獎勵還包括手續費）',
    },
    short: {
      en: 'The new coins created in each [[block]] and paid to its creator; this is the only way bitcoins come into existence.',
      zh: '每個[[block|區塊]]新造出來、付給其創建者的幣；這是比特幣誕生的唯一途徑。',
    },
    precise: {
      en: 'It began at 50 BTC and is cut in half every 210,000 blocks (the [[halving]]); the code computes it by shifting 50 BTC right by the number of halvings.',
      zh: '最初為 50 BTC，每 210,000 個區塊[[halving|減半]]一次；程式的計算方法是把 50 BTC 按減半次數向右移位。',
    },
    sections: [6],
    related: ['halving', 'coinbase', 'supply-cap', 'fee'],
  },
  {
    id: 'halving',
    name: { en: 'halving', zh: '減半' },
    aka: { en: 'halvening', zh: '又稱區塊獎勵減半' },
    short: {
      en: 'The scheduled cut that halves the number of new coins per [[block]] about every four years.',
      zh: '按既定時間表把每個[[block|區塊]]新發行的幣減去一半，大約每四年一次。',
    },
    precise: {
      en: 'It happens every 210,000 blocks; at the 33rd halving the [[block-subsidy|subsidy]] rounds down to zero, which fixes the total supply.',
      zh: '每 210,000 個區塊發生一次；到第 33 次減半，[[block-subsidy|區塊補貼]]便向下取整為零，總供應量因而固定。',
    },
    sections: [6],
    related: ['block-subsidy', 'supply-cap', 'block-height', 'incentive'],
  },
  {
    id: 'supply-cap',
    name: { en: 'supply cap', zh: '供應上限' },
    aka: { en: '21 million limit', zh: '又稱 2,100 萬枚上限' },
    short: {
      en: 'The limit on how many bitcoins can ever exist, just under 21 million, reached because the new coins per [[block]] keep [[halving]].',
      zh: '比特幣總量的上限，略低於 2,100 萬枚；由於每個[[block|區塊]]新發行的幣不斷[[halving|減半]]，總量最終止於此數。',
    },
    precise: {
      en: 'The paper speaks only of "a predetermined number of coins"; the figure of 21 million comes from the code, where the [[block-subsidy|subsidies]] add up to 20,999,999.9769 BTC.',
      zh: '白皮書只說「預定數量的幣」；2,100 萬這個數字出自源碼，全部[[block-subsidy|區塊補貼]]相加為 20,999,999.9769 BTC。',
    },
    sections: [6],
    related: ['halving', 'block-subsidy', 'satoshi-unit'],
  },
  {
    id: 'miner',
    name: { en: 'miner', zh: '礦工' },
    short: {
      en: 'Someone who spends computing power and electricity trying to add the next [[block]], and earns the [[incentive|block reward]] when they succeed.',
      zh: '投入運算能力和電力、爭取接上下一個[[block|區塊]]的人，成功便可獲得[[incentive|區塊獎勵]]。',
    },
    precise: {
      en: 'The paper has every [[node]] mine with its CPU; mining now runs on [[asic|ASICs]], usually pointed at a pool.',
      zh: '白皮書設想每個[[node|節點]]都以 CPU 挖礦；現時挖礦靠 [[asic|ASIC 礦機]]，且多數接入礦池。',
    },
    sections: [4, 5, 6],
    related: ['mining', 'mining-pool', 'asic', 'incentive'],
  },
  {
    id: 'mining',
    name: { en: 'mining', zh: '挖礦' },
    short: {
      en: 'Repeatedly hashing a candidate [[block]] with different [[nonce|nonces]] until its hash is low enough, which earns the right to add it to the chain.',
      zh: '不斷更換[[nonce|隨機數]]為候選[[block|區塊]]計算哈希，直至結果夠小，便有權把區塊接到鏈上。',
    },
    precise: {
      en: 'The work has no shortcut: each [[double-sha256|double SHA-256]] of the 80-byte header is an independent try whose chance of success is about `target / 2^256`.',
      zh: '這項工作並無捷徑：對 80 位元組的區塊頭每計算一次[[double-sha256|雙重 SHA-256]]，都是一次獨立的嘗試，成功機會約為 `target / 2^256`。',
    },
    sections: [4, 5, 6],
    related: ['miner', 'proof-of-work', 'nonce', 'hash-rate'],
  },
  {
    id: 'mining-pool',
    name: { en: 'mining pool', zh: '礦池' },
    short: {
      en: 'A group of [[miner|miners]] who work on the same candidate blocks and share the reward in proportion to the work each contributed.',
      zh: '一群[[miner|礦工]]合力為同一批候選區塊運算，再按各人貢獻的工作量攤分獎勵。',
    },
    precise: {
      en: 'The pool builds the block template and hands out work over [[stratum]]; miners prove their effort with shares, which are hashes that meet an easier target.',
      zh: '礦池負責組裝區塊模板，並透過 [[stratum]]分派工作；礦工提交符合較寬鬆目標值的哈希（稱為 share），以證明自己的工作量。',
    },
    sections: [4, 6],
    related: ['miner', 'stratum', 'getblocktemplate', 'asic'],
  },
  {
    id: 'asic',
    name: { en: 'ASIC', zh: 'ASIC 礦機' },
    aka: {
      en: 'application-specific integrated circuit, mining machine',
      zh: '全稱特殊應用集成電路；俗稱礦機',
    },
    short: {
      en: 'A chip built to do one thing only, here computing [[sha-256]] for [[mining]], far faster and with less power than a general-purpose processor.',
      zh: '只為單一用途而設計的晶片，在這裏專門計算 [[sha-256]] 來[[mining|挖礦]]，速度和能源效益遠勝一般處理器。',
    },
    precise: {
      en: 'The paper speaks of one-CPU-one-vote; an ASIC performs the same double SHA-256 on the 80-byte header, so the rules did not have to change.',
      zh: '白皮書說的是「一 CPU 一票」；ASIC 對 80 位元組的區塊頭所做的仍是同一種雙重 SHA-256 運算，因此規則毋須改動。',
    },
    sections: [4],
    related: ['miner', 'mining-pool', 'hash-rate', 'sha-256'],
  },
  {
    id: 'stratum',
    name: { en: 'Stratum', zh: 'Stratum 協定' },
    aka: { en: 'Stratum mining protocol', zh: '又稱 Stratum 挖礦協定' },
    short: {
      en: "The protocol a [[mining-pool|mining pool]] uses to send work to its [[miner|miners]]' machines and collect their results.",
      zh: '[[mining-pool|礦池]]用來向[[miner|礦工]]的機器分派工作並收回結果的通訊協定。',
    },
    precise: {
      en: 'Version 1 sends JSON over TCP with methods such as `mining.notify` and `mining.submit`; Stratum V2 is a binary, encrypted successor that can let miners choose the transactions.',
      zh: '第 1 版以 TCP 傳送 JSON，方法包括 `mining.notify` 和 `mining.submit`；Stratum V2 是其後繼版本，採用二進制格式並加密，還可讓礦工自行挑選交易。',
    },
    sections: [4, 6],
    related: ['mining-pool', 'getblocktemplate', 'asic', 'miner'],
  },
  {
    id: 'getblocktemplate',
    name: { en: 'getblocktemplate', zh: 'getblocktemplate' },
    aka: { en: 'GBT', zh: '簡稱 GBT' },
    short: {
      en: 'The request a [[mining-pool|pool]] or miner sends to a [[full-node|full node]] to get a draft of the next block, ready to be mined.',
      zh: '[[mining-pool|礦池]]或礦工向[[full-node|全節點]]發出的請求，以取得下一個區塊的草稿，然後着手挖礦。',
    },
    precise: {
      en: 'A Bitcoin Core [[rpc|RPC]] defined in BIP 22 and BIP 23; it returns the previous block hash, `bits`, the allowed coinbase value and the transactions chosen from the [[mempool]].',
      zh: 'Bitcoin Core 的 [[rpc|RPC]]，由 BIP 22 和 BIP 23 定義；回傳上一區塊的哈希、`bits`、coinbase 可領取的金額，以及從[[mempool|記憶池]]選出的交易。',
    },
    sections: [5, 6],
    related: ['mining-pool', 'stratum', 'mempool', 'rpc'],
  },
];

/* ------------------------------------------------------------------ storage */

const STORAGE: Entry[] = [
  {
    id: 'merkle-tree',
    name: { en: 'Merkle tree', zh: '默克爾樹' },
    aka: { en: 'hash tree', zh: '又稱梅克爾樹（台灣）、哈希樹' },
    short: {
      en: 'A way to sum up many [[transaction|transactions]] in one [[hash]]: hash them in pairs, then hash the results in pairs, until one hash remains.',
      zh: '把大量[[transaction|交易]]歸納為一個[[hash|哈希]]的方法：兩兩合併計算哈希，再把結果兩兩合併，直至只剩一個。',
    },
    precise: {
      en: 'Leaves are [[txid|txids]] and each parent is the [[double-sha256|double SHA-256]] of its two children joined together; a level with an odd count pairs its last hash with itself.',
      zh: '葉節點是[[txid|交易 ID]]，每個父節點是兩個子節點相連後的[[double-sha256|雙重 SHA-256]]；某一層的數目若為單數，最後一個哈希便與自己配對。',
    },
    sections: [7, 8],
    related: ['merkle-root', 'merkle-branch', 'pruning', 'txid'],
  },
  {
    id: 'merkle-root',
    name: { en: 'Merkle root', zh: '默克爾根' },
    aka: { en: 'root hash', zh: '又稱根哈希、梅克爾根（台灣）' },
    short: {
      en: 'The single [[hash]] at the top of a [[merkle-tree|Merkle tree]]; it stands for every transaction in the block, so changing any of them changes it.',
      zh: '[[merkle-tree|默克爾樹]]頂端的那一個[[hash|哈希]]，代表區塊內的全部交易；任何一筆有改動，它都會跟着改變。',
    },
    precise: {
      en: 'A 32-byte field of the [[block-header|header]], `hashMerkleRoot`; it is how proof-of-work done on 80 bytes covers the whole block.',
      zh: '即[[block-header|區塊頭]]內 32 位元組的 `hashMerkleRoot` 欄位；正因如此，針對 80 位元組所做的工作量證明才能涵蓋整個區塊。',
    },
    sections: [7, 8],
    related: ['merkle-tree', 'merkle-branch', 'block-header'],
  },
  {
    id: 'merkle-branch',
    name: { en: 'Merkle branch', zh: '默克爾分支' },
    aka: { en: 'Merkle proof, Merkle path', zh: '又稱默克爾證明、默克爾路徑' },
    short: {
      en: 'The few [[hash|hashes]] needed to show that one transaction belongs to a block: combine them step by step and you arrive at the [[merkle-root|Merkle root]].',
      zh: '證明某筆交易屬於某個區塊所需的幾個[[hash|哈希]]：逐步與它們合併計算，最後便得出[[merkle-root|默克爾根]]。',
    },
    precise: {
      en: 'One sibling hash per level, about log2(n) hashes for a block of n transactions; Bitcoin Core produces one with `gettxoutproof` and checks it with `verifytxoutproof`.',
      zh: '每層只需一個兄弟哈希，載有 n 筆交易的區塊約需 log2(n) 個；Bitcoin Core 以 `gettxoutproof` 產生，以 `verifytxoutproof` 核對。',
    },
    sections: [7, 8],
    related: ['merkle-tree', 'merkle-root', 'spv', 'light-client'],
  },
  {
    id: 'pruning',
    name: { en: 'pruning', zh: '修剪' },
    short: {
      en: 'Discarding old data a [[node]] no longer needs in order to save disk space, without weakening what it can verify.',
      zh: '刪去[[node|節點]]不再需要的舊數據以節省磁碟空間，同時不削弱它的驗證能力。',
    },
    precise: {
      en: "The paper prunes spent transactions inside a block's [[merkle-tree|Merkle tree]]; Bitcoin Core's `-prune` option instead deletes whole old block files and keeps the [[utxo|UTXO set]].",
      zh: '白皮書的做法是在區塊的[[merkle-tree|默克爾樹]]內剪去已花費的交易；Bitcoin Core 的 `-prune` 選項則刪除整個舊區塊檔案，只保留 [[utxo|UTXO 集]]。',
    },
    sections: [7],
    related: ['merkle-tree', 'full-node', 'utxo', 'block'],
  },
  {
    id: 'spv',
    name: { en: 'SPV', zh: '簡易支付驗證（SPV）' },
    aka: {
      en: 'Simplified Payment Verification',
      zh: '全稱 Simplified Payment Verification；又稱簡化支付驗證',
    },
    short: {
      en: 'Checking that a payment is in the chain without downloading whole blocks, using only [[block-header|block headers]] and a [[merkle-branch|Merkle branch]].',
      zh: '毋須下載完整區塊，只憑[[block-header|區塊頭]]和[[merkle-branch|默克爾分支]]，便可核實一筆付款已在鏈上。',
    },
    precise: {
      en: 'It proves that a transaction sits in a block with proof-of-work on top, not that the transaction is valid; the alerts from full nodes that the paper suggests were never implemented.',
      zh: '它能證明交易位於一個有工作量證明支持的區塊之內，卻不能證明交易本身有效；白皮書建議由全節點發出的警報，至今未有實現。',
    },
    sections: [8],
    related: ['light-client', 'merkle-branch', 'block-header', 'bloom-filter'],
  },
  {
    id: 'bloom-filter',
    name: { en: 'Bloom filter', zh: '布隆過濾器' },
    aka: { en: 'BIP 37 filter', zh: '又稱布隆篩選器' },
    short: {
      en: 'A compact, deliberately fuzzy list of what a [[light-client|light client]] is watching, sent to a [[full-node|full node]] so it forwards only matching transactions.',
      zh: '[[light-client|輕錢包]]交給[[full-node|全節點]]的一份刻意模糊的精簡名單，列出它關注的項目，讓對方只轉發相符的交易。',
    },
    precise: {
      en: 'BIP 37 (`filterload`, `merkleblock`); it leaks which addresses the client owns, so Bitcoin Core no longer serves it by default and [[compact-block-filters|compact block filters]] replace it.',
      zh: '見 BIP 37（`filterload`、`merkleblock`）；它會洩露輕錢包擁有哪些地址，因此 Bitcoin Core 預設已不再提供，改由[[compact-block-filters|精簡區塊過濾器]]取代。',
    },
    sections: [8],
    related: ['light-client', 'spv', 'compact-block-filters'],
  },
  {
    id: 'compact-block-filters',
    name: { en: 'compact block filters', zh: '精簡區塊過濾器' },
    aka: { en: 'BIP 157/158 filters, Neutrino', zh: '又稱緊湊區塊過濾器、Neutrino' },
    short: {
      en: 'A small summary of each [[block]] that a [[light-client|light client]] downloads and checks on its own device to see whether the block concerns it.',
      zh: '每個[[block|區塊]]的一份小型摘要，[[light-client|輕錢包]]下載後在自己的裝置上比對，判斷該區塊是否與自己有關。',
    },
    precise: {
      en: 'BIP 158 defines the filter, a Golomb-coded set of the scripts a block touches, and BIP 157 the messages that serve it; the client never tells the node which addresses it watches.',
      zh: 'BIP 158 定義過濾器，即以 Golomb 編碼集合概括區塊涉及的腳本，BIP 157 則定義傳送它的訊息；輕錢包從不向節點透露自己關注哪些地址。',
    },
    sections: [8],
    related: ['bloom-filter', 'light-client', 'spv'],
  },
];

/* ------------------------------------------------------------------ privacy */

const PRIVACY: Entry[] = [
  {
    id: 'pseudonymity',
    name: { en: 'pseudonymity', zh: '假名性' },
    aka: { en: 'pseudonymous, not anonymous', zh: '又稱化名性、偽匿名' },
    short: {
      en: 'Acting under a key instead of a name: everyone can see what each [[public-key|public key]] does, but not who is behind it.',
      zh: '以密鑰代替真實姓名行事：人人都看得見每把[[public-key|公鑰]]做過甚麼，卻不知道背後是誰。',
    },
    precise: {
      en: "The protection ends once a key is tied to a person, for example by an exchange's identity checks: analysis can then follow the links between transactions, a risk that section 10 of the paper notes.",
      zh: '一旦某把密鑰與真人身份扯上關係（例如經交易所的身份核實），這層保護便告失效，分析者可順着交易之間的關連追查下去；白皮書第 10 節已提到這個風險。',
    },
    sections: [10],
    related: ['address-reuse', 'common-input-heuristic', 'public-key', 'hd-wallet'],
  },
  {
    id: 'address-reuse',
    name: { en: 'address reuse', zh: '地址重用' },
    aka: { en: 'key reuse', zh: '又稱重複使用地址' },
    short: {
      en: 'Receiving more than one payment at the same [[address]], which lets anyone see that those payments belong to one owner.',
      zh: '以同一個[[address|地址]]收取多於一筆款項，令任何人都看得出這些款項同屬一人。',
    },
    precise: {
      en: "The paper's advice is a new [[key-pair|key pair]] for each transaction; wallets follow it by deriving a fresh address for every payment they receive.",
      zh: '白皮書建議每筆交易都使用新的[[key-pair|密鑰對]]；錢包的做法是每次收款都推導出一個新地址。',
    },
    sections: [10],
    related: ['address', 'pseudonymity', 'hd-wallet', 'common-input-heuristic'],
  },
  {
    id: 'common-input-heuristic',
    name: { en: 'common-input-ownership heuristic', zh: '共同輸入推斷法' },
    aka: { en: 'multi-input heuristic', zh: '又稱共同輸入所有權啟發式、多輸入啟發式' },
    short: {
      en: 'The assumption that all [[input|inputs]] of one [[transaction]] belong to the same owner, which chain analysts use to group addresses together.',
      zh: '假定同一筆[[transaction|交易]]的所有[[input|輸入]]同屬一人；鏈上分析者據此把多個地址歸為同一持有人。',
    },
    precise: {
      en: 'Section 10 of the paper concedes this leak for multi-input transactions; transactions built jointly by several parties, such as CoinJoin, deliberately break the assumption.',
      zh: '白皮書第 10 節已承認多輸入交易會洩露這種關連；由多方合力組成的交易（例如 CoinJoin）則刻意打破這個假定。',
    },
    sections: [10],
    related: ['input', 'pseudonymity', 'address-reuse', 'coin-selection'],
  },
  {
    id: 'hd-wallet',
    name: { en: 'HD wallet', zh: 'HD 錢包' },
    aka: { en: 'hierarchical deterministic wallet', zh: '全稱分層確定性錢包' },
    short: {
      en: 'A [[wallet]] that derives all its keys from one master secret, so a single backup covers every [[address]] it will ever use.',
      zh: '所有密鑰都由同一個主秘密推導出來的[[wallet|錢包]]，只需備份一次，便涵蓋日後用到的每個[[address|地址]]。',
    },
    precise: {
      en: "BIP 32 defines the derivation: keys form a tree addressed by paths such as `m/84'/0'/0'/0/5`, and an extended public key can derive addresses without being able to spend.",
      zh: "推導方法見 BIP 32：密鑰組成一棵樹，以 `m/84'/0'/0'/0/5` 這類路徑定位；擴展公鑰可以推導地址，卻不能動用資金。",
    },
    sections: [10],
    related: ['seed-phrase', 'key-pair', 'address-reuse', 'wallet'],
  },
  {
    id: 'seed-phrase',
    name: { en: 'seed phrase', zh: '助記詞' },
    aka: { en: 'recovery phrase, mnemonic', zh: '又稱種子短語、恢復短語' },
    short: {
      en: "A list of 12 to 24 ordinary words that encodes a [[wallet]]'s master secret; anyone who has the words can spend the coins.",
      zh: '12 至 24 個普通詞語，記錄了[[wallet|錢包]]的主秘密；誰拿到這組詞語，誰就能花掉裏面的幣。',
    },
    precise: {
      en: 'BIP 39: the words come from a list of 2,048, each carrying 11 bits, with a checksum built in; PBKDF2 turns them into the seed of a [[hd-wallet|BIP 32 wallet]].',
      zh: '見 BIP 39：詞語取自一份 2,048 個詞的詞表，每個詞代表 11 位元，並內含校驗碼；再經 PBKDF2 轉換成 [[hd-wallet|HD 錢包]]的種子。',
    },
    sections: [10],
    related: ['hd-wallet', 'private-key', 'hardware-wallet', 'wallet'],
  },
];

/* --------------------------------------------------------------------- math */

const MATH: Entry[] = [
  {
    id: 'poisson-distribution',
    name: { en: 'Poisson distribution', zh: '泊松分佈' },
    aka: { en: 'Poisson law', zh: '又稱卜瓦松分佈（台灣）、帕松分佈' },
    short: {
      en: 'A formula for how many times a random event is likely to happen in a fixed period when it occurs at a steady average rate.',
      zh: '一條公式：某件隨機事件若以穩定的平均速率發生，它算出在一段固定時間內發生若干次的概率。',
    },
    precise: {
      en: 'The paper uses it for how many blocks an attacker has found while the honest chain added z; the expected value is `λ = z × q / p`.',
      zh: '白皮書用它描述誠實鏈增加 z 個區塊期間攻擊者找到多少個區塊，其期望值為 `λ = z × q / p`。',
    },
    sections: [11],
    related: ['binomial-random-walk', 'gamblers-ruin', 'confirmation'],
  },
  {
    id: 'binomial-random-walk',
    name: { en: 'binomial random walk', zh: '二項隨機漫步' },
    aka: { en: 'simple random walk', zh: '又稱二項式隨機遊走' },
    short: {
      en: 'A path made of repeated steps, each one forward or one back at fixed odds; the paper uses it to model the race between two chains.',
      zh: '由一連串步伐組成的路徑，每步按固定概率向前或向後一格；白皮書以此模擬兩條鏈之間的競賽。',
    },
    precise: {
      en: 'Each block found by the honest chain moves its lead by +1 (probability p), and each found by the attacker by −1 (probability q = 1 − p).',
      zh: '誠實鏈每找到一個區塊，領先幅度加 1（概率為 p）；攻擊者每找到一個，則減 1（概率為 q = 1 − p）。',
    },
    sections: [11],
    related: ['gamblers-ruin', 'poisson-distribution', 'majority-attack'],
  },
  {
    id: 'gamblers-ruin',
    name: { en: "Gambler's Ruin", zh: '賭徒破產問題' },
    aka: { en: "gambler's ruin problem", zh: '又稱賭徒輸光問題' },
    short: {
      en: "A classic probability problem about a gambler who starts behind and keeps playing; the paper uses it to find an attacker's chance of ever catching up.",
      zh: '一道經典的概率問題，講述落後的賭徒不斷下注；白皮書藉此計算攻擊者最終追上誠實鏈的機會。',
    },
    precise: {
      en: 'An attacker who is z blocks behind ever catches up with probability `(q / p)^z` when p > q, and with certainty when q is at least p.',
      zh: '落後 z 個區塊的攻擊者，在 p > q 時最終追上的概率為 `(q / p)^z`；若 q 不小於 p，則必定追上。',
    },
    sections: [11],
    related: ['binomial-random-walk', 'poisson-distribution', 'majority-attack', 'confirmation'],
  },
];

/* -------------------------------------------------------------- engineering */

const ENGINEERING: Entry[] = [
  {
    id: 'wallet',
    name: { en: 'wallet', zh: '錢包' },
    short: {
      en: 'Software or a device that keeps your [[private-key|private keys]], tracks the coins they control, and signs [[transaction|transactions]] when you pay.',
      zh: '替你保管[[private-key|私鑰]]、記錄這些私鑰所控制的幣，並在付款時簽署[[transaction|交易]]的軟件或裝置。',
    },
    precise: {
      en: 'A wallet holds keys, not coins: the coins are [[utxo|unspent outputs]] recorded on the chain, and the wallet finds the ones its keys can spend.',
      zh: '錢包存放的是密鑰而非幣：幣是記錄在鏈上的[[utxo|未花費輸出]]，錢包只是找出自己的密鑰能動用的那些。',
    },
    sections: [2, 9, 10],
    related: ['software-wallet', 'hardware-wallet', 'hd-wallet', 'private-key'],
  },
  {
    id: 'software-wallet',
    name: { en: 'software wallet', zh: '軟件錢包' },
    aka: { en: 'hot wallet (when online)', zh: '連網時又稱熱錢包' },
    short: {
      en: 'A [[wallet]] that runs as an app on a phone or computer: it builds payments, picks the coins to spend and talks to the network.',
      zh: '以手機或電腦應用程式形式運作的[[wallet|錢包]]：負責組裝付款、挑選要花的幣，並與網絡通訊。',
    },
    precise: {
      en: 'It can sign with keys held on the same device, or prepare a [[psbt|PSBT]] for a [[hardware-wallet|hardware wallet]] to sign.',
      zh: '它可以用存於同一裝置的密鑰簽署，也可以準備好 [[psbt|PSBT]]，交給[[hardware-wallet|硬件錢包]]簽署。',
    },
    sections: [2, 9],
    related: ['wallet', 'hardware-wallet', 'psbt', 'coin-selection'],
  },
  {
    id: 'hardware-wallet',
    name: { en: 'hardware wallet', zh: '硬件錢包' },
    aka: { en: 'signing device, cold wallet', zh: '又稱簽署裝置、冷錢包' },
    short: {
      en: 'A small dedicated device that keeps [[private-key|private keys]] off your computer and signs [[transaction|transactions]] only after you confirm them on its own screen.',
      zh: '一部專用的小型裝置，令[[private-key|私鑰]]不必存於電腦，並在你於它的螢幕上確認後才簽署[[transaction|交易]]。',
    },
    precise: {
      en: 'It receives an unsigned [[psbt|PSBT]] over USB, QR code or memory card and returns the signatures; the keys never leave the device.',
      zh: '它經 USB、二維碼或記憶卡接收未簽署的 [[psbt|PSBT]]，然後交回簽署；密鑰始終不會離開裝置。',
    },
    sections: [2, 10],
    related: ['wallet', 'software-wallet', 'psbt', 'seed-phrase'],
  },
  {
    id: 'rpc',
    name: { en: 'RPC', zh: 'RPC 介面' },
    aka: {
      en: 'remote procedure call, JSON-RPC',
      zh: '全稱遠端程序呼叫（remote procedure call）',
    },
    short: {
      en: 'The interface through which other programs give commands to a running [[bitcoind|Bitcoin node]] and read its data.',
      zh: '其他程式向運行中的[[bitcoind|比特幣節點]]下達指令、讀取數據所用的介面。',
    },
    precise: {
      en: 'JSON-RPC over HTTP, on port 8332 by default and reachable only from the same machine unless configured otherwise; `getblockchaininfo` and `sendrawtransaction` are typical calls.',
      zh: '以 HTTP 傳送 JSON-RPC，預設連接埠為 8332，除非另行設定，否則只接受本機連線；`getblockchaininfo` 和 `sendrawtransaction` 是常見的呼叫。',
    },
    sections: [5],
    related: ['bitcoin-cli', 'bitcoind', 'bitcoin-core', 'getblocktemplate'],
  },
  {
    id: 'bitcoin-core',
    name: { en: 'Bitcoin Core', zh: 'Bitcoin Core' },
    aka: { en: 'the reference implementation', zh: '又稱參考實作' },
    short: {
      en: "The open-source program descended from Satoshi Nakamoto's original release, and the most widely used software for running a [[full-node|full node]].",
      zh: '由中本聰最初發佈的程式一脈相承而來的開源軟件，也是運行[[full-node|全節點]]最常用的軟件。',
    },
    precise: {
      en: 'Written in C++ and released under the MIT licence; it ships the daemon [[bitcoind]], the command-line client [[bitcoin-cli]] and a graphical wallet, `bitcoin-qt`.',
      zh: '以 C++ 編寫，按 MIT 授權條款發佈；內含常駐程式 [[bitcoind]]、命令列工具 [[bitcoin-cli]] 和圖形介面錢包 `bitcoin-qt`。',
    },
    sections: [5],
    related: ['bitcoind', 'bitcoin-cli', 'full-node', 'rpc'],
  },
  {
    id: 'bitcoind',
    name: { en: 'bitcoind', zh: 'bitcoind' },
    aka: { en: 'Bitcoin daemon', zh: '即 Bitcoin Core 的常駐程式' },
    short: {
      en: 'The [[bitcoin-core|Bitcoin Core]] program that runs in the background as a [[full-node|full node]], with no window of its own.',
      zh: '[[bitcoin-core|Bitcoin Core]] 中在背景運行的程式，本身沒有視窗，作用是充當[[full-node|全節點]]。',
    },
    precise: {
      en: 'It listens for peers on port 8333 and for [[rpc|RPC]] calls on port 8332, and keeps its blocks and `chainstate` in the data directory.',
      zh: '它在 8333 連接埠接受其他節點連線，在 8332 連接埠接受 [[rpc|RPC]] 呼叫，並把區塊和 `chainstate` 存放在數據目錄內。',
    },
    sections: [5],
    related: ['bitcoin-core', 'bitcoin-cli', 'rpc', 'full-node'],
  },
  {
    id: 'bitcoin-cli',
    name: { en: 'bitcoin-cli', zh: 'bitcoin-cli' },
    short: {
      en: 'The command-line tool that sends one [[rpc|RPC]] request to a running [[bitcoind]] and prints the answer.',
      zh: '命令列工具，每次向運行中的 [[bitcoind]] 發出一個 [[rpc|RPC]] 請求，並把回覆顯示出來。',
    },
    precise: {
      en: 'For example, `bitcoin-cli getblockhash 0` prints the hash of the genesis block, and `bitcoin-cli help` lists every command.',
      zh: '例如 `bitcoin-cli getblockhash 0` 會顯示創世區塊的哈希，`bitcoin-cli help` 則列出所有指令。',
    },
    sections: [5],
    related: ['rpc', 'bitcoind', 'bitcoin-core'],
  },
];

/* ------------------------------------------------------------------ exports */

/** Categories in display order, each with its terms in display order. */
const GROUPS: readonly (readonly [TermCategory, readonly Entry[]])[] = [
  ['crypto', CRYPTO],
  ['money', MONEY],
  ['chain', CHAIN],
  ['network', NETWORK],
  ['mining', MINING],
  ['storage', STORAGE],
  ['privacy', PRIVACY],
  ['math', MATH],
  ['engineering', ENGINEERING],
];

const ALL_TERMS: readonly TermDef[] = GROUPS.flatMap(([category, entries]) =>
  entries.map((entry) => ({ ...entry, category })),
);

/** Every term, keyed by id. */
export const TERMS: Record<string, TermDef> = Object.fromEntries(
  ALL_TERMS.map((term) => [term.id, term]),
);

/** Term ids in display order: by category, then as listed within it. */
export const TERM_IDS: readonly string[] = ALL_TERMS.map((term) => term.id);

/** Terms whose card shows a live visual, loaded from `./visuals/<id>.tsx`. */
export const TERMS_WITH_VISUALS: readonly string[] = [
  'hash',
  'digital-signature',
  'key-pair',
  'address',
  'transaction',
  'utxo',
  'change',
  'fee',
  'coinbase',
  'double-spending',
  'block',
  'block-header',
  'timestamp-server',
  'proof-of-work',
  'nonce',
  'difficulty',
  'longest-chain',
  'fork',
  'confirmation',
  'peer-to-peer',
  'mempool',
  'halving',
  'mining-pool',
  'merkle-tree',
  'merkle-branch',
  'spv',
  'hd-wallet',
  'poisson-distribution',
  'gamblers-ruin',
];
