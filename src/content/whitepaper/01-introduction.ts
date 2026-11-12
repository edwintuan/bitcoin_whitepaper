import type { WhitepaperSection } from '../types';

const section: WhitepaperSection = {
  id: 'introduction',
  number: 1,
  heading: { en: 'Introduction', zh: '引言' },
  en: [
    {
      type: 'p',
      text: 'Commerce on the Internet has come to rely almost exclusively on financial institutions serving as trusted third parties to process electronic payments. While the system works well enough for most transactions, it still suffers from the inherent weaknesses of the trust based model. Completely non-reversible transactions are not really possible, since financial institutions cannot avoid mediating disputes. The cost of mediation increases transaction costs, limiting the minimum practical transaction size and cutting off the possibility for small casual transactions, and there is a broader cost in the loss of ability to make non-reversible payments for non-reversible services. With the possibility of reversal, the need for trust spreads. Merchants must be wary of their customers, hassling them for more information than they would otherwise need. A certain percentage of fraud is accepted as unavoidable. These costs and payment uncertainties can be avoided in person by using physical currency, but no mechanism exists to make payments over a communications channel without a trusted party.',
    },
    {
      type: 'p',
      text: 'What is needed is an electronic payment system based on cryptographic proof instead of trust, allowing any two willing parties to transact directly with each other without the need for a trusted third party. Transactions that are computationally impractical to reverse would protect sellers from fraud, and routine escrow mechanisms could easily be implemented to protect buyers. In this paper, we propose a solution to the double-spending problem using a peer-to-peer distributed timestamp server to generate computational proof of the chronological order of transactions. The system is secure as long as honest nodes collectively control more CPU power than any cooperating group of attacker nodes.',
    },
  ],
  zh: [
    {
      type: 'p',
      text: '互聯網上的商貿已變得幾乎完全依賴金融機構作為可信第三方來處理電子付款。雖然這套系統對大多數交易而言運作尚算良好，但仍受制於基於信任的模式所固有的弱點。由於金融機構無法避免調解爭議，完全不可逆轉的交易實際上並不可能。調解的成本增加了交易成本，限制了切實可行的最小交易金額，並斷絕了小額零星交易的可能；此外還有更廣泛的代價，即喪失了為不可逆轉的服務作出不可逆轉付款的能力。既然存在逆轉的可能，對信任的需求便隨之蔓延。商戶必須提防自己的顧客，為索取多於原本所需的資訊而煩擾他們。一定比例的欺詐被視為無可避免而予以接受。若當面使用實體貨幣，便可避免這些成本和付款上的不確定性；但並不存在任何機制，可在沒有可信方的情況下透過通訊渠道付款。',
    },
    {
      type: 'p',
      text: '我們需要的，是一套基於密碼學證明而非信任的電子付款系統，讓任何自願的雙方可直接互相交易，而毋須藉助可信第三方。在運算上實際無法逆轉的交易可保障賣方免受欺詐，而常規的託管機制亦可輕易實現，以保障買方。在本文中，我們提出一個解決雙重支付問題的方案，利用點對點的分佈式時間戳伺服器，為交易的時間先後次序生成運算證明。只要誠實節點合共控制的 CPU 算力多於任何一組聯手的攻擊者節點所控制的算力，這個系統便是安全的。',
    },
  ],
};

export default section;
