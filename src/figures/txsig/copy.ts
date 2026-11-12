import type { L } from '@/content/types';

/** Interface copy for the chain-of-signatures figure. */
export const COPY = {
  scenes: { en: 'Scene', zh: '場景' },
  sceneChain: { en: 'The chain', zh: '簽署鏈' },
  sceneGap: { en: 'The gap', zh: '漏洞' },

  /* ------------------------------------------------------------ the chain */
  chainIntro: {
    en: 'One coin, as the paper draws it: three transactions, each signed by the owner before. Every key, hash and signature here is real and was computed in this page.',
    zh: '一枚幣，一如白皮書所畫：三筆交易，每一筆都由前一位擁有者簽署。這裏每一把密鑰、每一個哈希和每一個簽署都是真的，全部在本頁即場算出。',
  },
  transaction: { en: 'Transaction {n}', zh: '交易 {n}' },
  owner: { en: 'Owner {n}', zh: '擁有者 {n}' },
  ownerKey: { en: 'Owner {n}’s public key', zh: '擁有者 {n} 的公鑰' },
  attackerKey: { en: 'Attacker’s public key', zh: '攻擊者的公鑰' },
  ownerSignature: { en: 'Owner {n}’s signature', zh: '擁有者 {n} 的簽署' },
  fieldPrev: { en: 'Previous hash', zh: '上一筆交易的哈希' },
  fieldHash: { en: 'Hash of the two above', zh: '以上兩項的哈希' },
  prevEarlier: { en: 'of an earlier transaction', zh: '來自更早的一筆交易' },
  prevOf: { en: 'of transaction {n}', zh: '即交易 {n} 的哈希' },
  prevStale: { en: 'the old hash of transaction {n}', zh: '交易 {n} 的舊哈希' },

  publicKey: { en: 'public', zh: '公鑰' },
  privateKey: { en: 'private', zh: '私鑰' },
  secret: { en: 'secret', zh: '保密' },
  signed: { en: 'signed transaction {n} with the private key', zh: '以私鑰簽署了交易 {n}' },
  holds: { en: 'holds the coin', zh: '持有這枚幣' },

  tag: {
    unchecked: { en: 'not checked', zh: '未驗證' },
    valid: { en: 'valid', zh: '有效' },
    signature: { en: 'bad signature', zh: '簽署不符' },
    link: { en: 'cut off', zh: '已脫節' },
  },

  verify: { en: 'Verify', zh: '驗證' },
  verifyLabel: { en: 'Verify transaction {n}', zh: '驗證交易 {n}' },
  rewrite: { en: 'Rewrite', zh: '改寫' },
  restore: { en: 'Put back', zh: '還原' },
  rewriteLabel: {
    en: 'Rewrite transaction {n} to pay an attacker',
    zh: '改寫交易 {n}，把收款人換成攻擊者',
  },
  restoreLabel: { en: 'Put transaction {n} back as it was', zh: '把交易 {n} 還原' },
  newKeys: { en: 'New keys', zh: '換一組密鑰' },

  checking: { en: 'Checking transaction {n}', zh: '驗證交易 {n}' },
  checkSignature: { en: 'signature', zh: '簽署' },
  checkSignatureNote: { en: 'as transaction {n} carries it', zh: '取自交易 {n}' },
  checkHash: { en: 'hash', zh: '哈希' },
  checkHashNote: {
    en: 'worked out again from transaction {n} as it stands',
    zh: '按交易 {n} 現時的內容重新算出',
  },
  checkKey: { en: 'public key', zh: '公鑰' },
  checkKeyNote: { en: 'Owner {signer}’s, as named in transaction {before}', zh: '擁有者 {signer} 的，載於交易 {before}' },
  checkKeyFirst: {
    en: 'Owner 0’s, as named in the transaction before this one',
    zh: '擁有者 0 的，載於更早的一筆交易',
  },
  checkKeyAttacker: {
    en: 'the attacker’s, which transaction {before} now names',
    zh: '攻擊者的，即交易 {before} 現在所列的那一把',
  },

  idle: {
    en: 'Press Verify on any transaction to check its signature.',
    zh: '在任何一筆交易上按「驗證」，檢查它的簽署。',
  },
  fresh: {
    en: 'New keys. Every public key, hash and signature above has just been worked out again.',
    zh: '已換上新密鑰。上面每一把公鑰、每一個哈希和每一個簽署，都剛剛重新算過。',
  },
  valid: {
    en: 'The signature on transaction {n} fits its hash under Owner {signer}’s public key. Owner {signer} signed this transfer, and nobody else could have.',
    zh: '以擁有者 {signer} 的公鑰來看，交易 {n} 的簽署與它的哈希相符。這次轉讓確實由擁有者 {signer} 簽署，旁人無從冒簽。',
  },
  badSignature: {
    en: 'Transaction {n} now pays the attacker, so its hash has changed. Owner {signer} signed the old hash, and that signature does not fit the new one. Only Owner {signer}’s private key could make one that does.',
    zh: '交易 {n} 現在付給了攻擊者，哈希隨之改變。擁有者 {signer} 簽署的是舊哈希，這個簽署與新哈希並不相符；要簽出相符的簽署，非擁有者 {signer} 的私鑰不可。',
  },
  badLink: {
    en: 'Transaction {n} still carries the old hash of transaction {before}, which has been rewritten since. It no longer follows from the coin’s history.',
    zh: '交易 {n} 所帶的，仍是交易 {before} 被改寫之前的舊哈希。它與這枚幣的來歷再也接不上。',
  },
  badParent: {
    en: 'Transaction {n} follows from transaction {before}, and transaction {before} no longer follows from anything. A transfer is only as good as the chain behind it.',
    zh: '交易 {n} 接在交易 {before} 之後，而交易 {before} 本身已經接不上。一次轉讓是否可信，全看它背後的整條鏈。',
  },
  /** Added to the status line when a rewrite has undone an earlier one. */
  restoredNote: {
    en: 'Transaction {n} has been put back as it was: one transfer is rewritten at a time.',
    zh: '交易 {n} 已還原為原狀：這裏每次只改寫一筆交易。',
  },

  /* -------------------------------------------------------------- the gap */
  gapIntro: {
    en: 'After transaction 2 the coin is Owner 2’s to sign over. Nothing in a signature limits how many times that can be done.',
    zh: '交易 2 之後，這枚幣便由擁有者 2 簽署轉讓。簽署本身，並不限制可以簽多少次。',
  },
  parent: { en: 'pays Owner 2', zh: '付給擁有者 2' },
  paysOwner: { en: 'Pays Owner {n}', zh: '付給擁有者 {n}' },
  paysSomeone: { en: 'Pays someone else', zh: '付給另一個人' },
  someoneKey: { en: 'Someone else’s public key', zh: '另一個人的公鑰' },
  same: { en: 'of transaction 2, the same in both', zh: '即交易 2 的哈希，兩者相同' },
  notYet: {
    en: 'So far Owner 2 has signed this coin over once.',
    zh: '到目前為止，擁有者 2 只把這枚幣簽出去一次。',
  },
  signAgain: { en: 'Sign it again', zh: '再簽一次' },
  undo: { en: 'Undo', zh: '復原' },
  gapBefore: {
    en: 'Owner 2 has signed the coin over to Owner 3, and the signature verifies. Now press Sign it again.',
    zh: '擁有者 2 已把這枚幣簽給擁有者 3，簽署亦通過驗證。現在按「再簽一次」。',
  },
  gapAfter: {
    en: 'Two transfers of the same coin. Both carry a real signature by Owner 2 and both verify. Nothing in either says which came first, so a payee who looks only at signatures cannot tell. This is the double-spending problem, and section 3 starts on the answer.',
    zh: '同一枚幣，兩次轉讓。兩者都帶有擁有者 2 的真實簽署，也都通過驗證。兩者都沒有任何地方顯示誰先誰後；只看簽署的收款人，根本無從分辨。這就是雙重支付問題，第 3 章會着手解決。',
  },
} satisfies Record<string, L<unknown> | Record<string, unknown>>;
