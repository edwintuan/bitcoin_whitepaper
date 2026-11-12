import type { WhitepaperSection } from '../types';

/** "a constant of amount of new coins" and "favour" are the paper's own wording and spelling. */
const section: WhitepaperSection = {
  id: 'incentive',
  number: 6,
  heading: { en: 'Incentive', zh: '激勵' },
  en: [
    {
      type: 'p',
      text: 'By convention, the first transaction in a block is a special transaction that starts a new coin owned by the creator of the block. This adds an incentive for nodes to support the network, and provides a way to initially distribute coins into circulation, since there is no central authority to issue them. The steady addition of a constant of amount of new coins is analogous to gold miners expending resources to add gold to circulation. In our case, it is CPU time and electricity that is expended.',
    },
    {
      type: 'p',
      text: 'The incentive can also be funded with transaction fees. If the output value of a transaction is less than its input value, the difference is a transaction fee that is added to the incentive value of the block containing the transaction. Once a predetermined number of coins have entered circulation, the incentive can transition entirely to transaction fees and be completely inflation free.',
    },
    {
      type: 'p',
      text: 'The incentive may help encourage nodes to stay honest. If a greedy attacker is able to assemble more CPU power than all the honest nodes, he would have to choose between using it to defraud people by stealing back his payments, or using it to generate new coins. He ought to find it more profitable to play by the rules, such rules that favour him with more new coins than everyone else combined, than to undermine the system and the validity of his own wealth.',
    },
  ],
  zh: [
    {
      type: 'p',
      text: '按照慣例，區塊中的第一筆交易是一筆特殊交易，它產生一枚由該區塊創建者擁有的新貨幣。這為節點支持網絡增添了激勵，亦提供了一種最初把貨幣分發並投入流通的方法，因為並沒有中央機構來發行貨幣。穩定地增添固定數量的新貨幣，類似於金礦礦工耗費資源，把黃金投入流通。就我們的情況而言，所耗費的是 CPU 時間和電力。',
    },
    {
      type: 'p',
      text: '激勵的資金亦可來自交易手續費。若某筆交易的輸出值少於其輸入值，差額便是交易手續費，會加到包含該筆交易的區塊的激勵值之中。一旦預定數量的貨幣進入流通，激勵便可完全過渡至交易手續費，並且完全免於通脹。',
    },
    {
      type: 'p',
      text: '激勵或有助鼓勵節點保持誠實。若一名貪婪的攻擊者能夠集結比所有誠實節點更多的 CPU 算力，他便須作出抉擇：是利用這些算力偷回自己已付出的款項以欺詐他人，還是用來生成新貨幣。他理應發現，按規則行事——這些規則令他獲得的新貨幣比其他所有人加起來還要多——比破壞這個系統以及他自身財富的有效性更有利可圖。',
    },
  ],
};

export default section;
