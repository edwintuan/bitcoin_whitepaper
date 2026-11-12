import type { WhitepaperSection } from '../types';

const section: WhitepaperSection = {
  id: 'conclusion',
  number: 12,
  heading: { en: 'Conclusion', zh: '結論' },
  en: [
    {
      type: 'p',
      text: 'We have proposed a system for electronic transactions without relying on trust. We started with the usual framework of coins made from digital signatures, which provides strong control of ownership, but is incomplete without a way to prevent double-spending. To solve this, we proposed a peer-to-peer network using proof-of-work to record a public history of transactions that quickly becomes computationally impractical for an attacker to change if honest nodes control a majority of CPU power. The network is robust in its unstructured simplicity. Nodes work all at once with little coordination. They do not need to be identified, since messages are not routed to any particular place and only need to be delivered on a best effort basis. Nodes can leave and rejoin the network at will, accepting the proof-of-work chain as proof of what happened while they were gone. They vote with their CPU power, expressing their acceptance of valid blocks by working on extending them and rejecting invalid blocks by refusing to work on them. Any needed rules and incentives can be enforced with this consensus mechanism.',
    },
  ],
  zh: [
    {
      type: 'p',
      text: '我們提出了一個毋須依賴信任的電子交易系統。我們從以數碼簽署製成貨幣的常見框架出發，這個框架對擁有權提供了強而有力的控制，但若沒有防止雙重支付的方法，便不完整。為了解決這個問題，我們提出了一個點對點網絡，利用工作量證明記錄一段公開的交易歷史；只要誠實節點控制大多數 CPU 算力，攻擊者要更改這段歷史，在運算上很快便變得不切實際。這個網絡的穩健，正在於其無結構的簡潔。節點同時各自工作，彼此幾乎毋須協調。節點的身份毋須識別，因為訊息不會路由至任何特定的地方，只需以盡力而為的方式傳遞。節點可隨意離開和重新加入網絡，並接受工作量證明鏈，作為它們離開期間所發生事情的證明。它們以 CPU 算力投票，透過致力接續有效的區塊來表示接受，並透過拒絕接續無效的區塊來否決它們。任何所需的規則和激勵都可藉這個共識機制來執行。',
    },
  ],
};

export default section;
