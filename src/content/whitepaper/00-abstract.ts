import type { WhitepaperSection } from '../types';

/** The paper sets "Abstract." as a bold run-in heading; here it is the section heading. */
const section: WhitepaperSection = {
  id: 'abstract',
  number: 0,
  heading: { en: 'Abstract', zh: '摘要' },
  en: [
    {
      type: 'p',
      text: "A purely peer-to-peer version of electronic cash would allow online payments to be sent directly from one party to another without going through a financial institution. Digital signatures provide part of the solution, but the main benefits are lost if a trusted third party is still required to prevent double-spending. We propose a solution to the double-spending problem using a peer-to-peer network. The network timestamps transactions by hashing them into an ongoing chain of hash-based proof-of-work, forming a record that cannot be changed without redoing the proof-of-work. The longest chain not only serves as proof of the sequence of events witnessed, but proof that it came from the largest pool of CPU power. As long as a majority of CPU power is controlled by nodes that are not cooperating to attack the network, they'll generate the longest chain and outpace attackers. The network itself requires minimal structure. Messages are broadcast on a best effort basis, and nodes can leave and rejoin the network at will, accepting the longest proof-of-work chain as proof of what happened while they were gone.",
    },
  ],
  zh: [
    {
      type: 'p',
      text: '一種純粹點對點版本的電子現金，將可讓一方直接向另一方作出網上付款，而毋須經過金融機構。數碼簽署提供了部分解決方案，但若仍需要可信第三方來防止雙重支付，主要的好處便會喪失。我們提出一個利用點對點網絡解決雙重支付問題的方案。該網絡為交易加上時間戳，方法是把交易以哈希運算納入一條不斷延伸、基於哈希的工作量證明鏈，從而形成一份若不重做工作量證明便無法更改的記錄。最長鏈不僅可作為所見證事件先後次序的證明，亦證明它來自最大的 CPU 算力池。只要大多數 CPU 算力由並非聯手攻擊網絡的節點控制，這些節點便會生成最長鏈，並拋離攻擊者。網絡本身只需最低限度的結構。訊息以盡力而為的方式廣播，節點可隨意離開和重新加入網絡，並接受最長的工作量證明鏈，作為它們離開期間所發生事情的證明。',
    },
  ],
};

export default section;
