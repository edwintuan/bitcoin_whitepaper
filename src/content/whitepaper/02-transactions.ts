import type { WhitepaperSection } from '../types';

const section: WhitepaperSection = {
  id: 'transactions',
  number: 2,
  heading: { en: 'Transactions', zh: '交易' },
  en: [
    {
      type: 'p',
      text: 'We define an electronic coin as a chain of digital signatures. Each owner transfers the coin to the next by digitally signing a hash of the previous transaction and the public key of the next owner and adding these to the end of the coin. A payee can verify the signatures to verify the chain of ownership.',
    },
    { type: 'figure', id: 'tx-chain' },
    {
      type: 'p',
      text: "The problem of course is the payee can't verify that one of the owners did not double-spend the coin. A common solution is to introduce a trusted central authority, or mint, that checks every transaction for double spending. After each transaction, the coin must be returned to the mint to issue a new coin, and only coins issued directly from the mint are trusted not to be double-spent. The problem with this solution is that the fate of the entire money system depends on the company running the mint, with every transaction having to go through them, just like a bank.",
    },
    {
      type: 'p',
      text: "We need a way for the payee to know that the previous owners did not sign any earlier transactions. For our purposes, the earliest transaction is the one that counts, so we don't care about later attempts to double-spend. The only way to confirm the absence of a transaction is to be aware of all transactions. In the mint based model, the mint was aware of all transactions and decided which arrived first. To accomplish this without a trusted party, transactions must be publicly announced [1], and we need a system for participants to agree on a single history of the order in which they were received. The payee needs proof that at the time of each transaction, the majority of nodes agreed it was the first received.",
    },
  ],
  zh: [
    {
      type: 'p',
      text: '我們把一枚電子貨幣定義為一條由數碼簽署組成的鏈。每位擁有者對前一筆交易與下一位擁有者公鑰的哈希值進行數碼簽署，並將之附加於貨幣的末端，藉此把貨幣轉讓給下一位擁有者。收款人可驗證這些簽署，從而驗證擁有權的鏈條。',
    },
    { type: 'figure', id: 'tx-chain' },
    {
      type: 'p',
      text: '問題當然在於，收款人無法驗證其中某位擁有者並未把該貨幣雙重支付。常見的解決方案是引入一個可信的中央機構，即鑄幣廠，由它檢查每筆交易有否雙重支付。每次交易之後，貨幣必須交回鑄幣廠，以發行一枚新貨幣，而只有直接由鑄幣廠發行的貨幣，才可相信其未被雙重支付。這個方案的問題在於，整個貨幣體系的命運取決於營運鑄幣廠的公司，每筆交易都必須經過該公司，就像銀行一樣。',
    },
    {
      type: 'p',
      text: '我們需要一種方法，讓收款人知道先前的擁有者並未簽署任何更早的交易。就我們的目的而言，以最早的一筆交易為準，因此我們並不理會其後的雙重支付企圖。要確認某筆交易不存在，唯一的方法是知悉所有交易。在基於鑄幣廠的模式中，鑄幣廠知悉所有交易，並決定哪一筆最先到達。若要在沒有可信方的情況下做到這一點，交易必須公開宣佈 [1]，而我們需要一套系統，讓參與者就交易接收次序的單一歷史達成共識。收款人需要有證明顯示，在每筆交易進行之時，大多數節點都認同該交易是最先收到的。',
    },
  ],
};

export default section;
