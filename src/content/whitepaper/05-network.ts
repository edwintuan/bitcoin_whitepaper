import type { WhitepaperSection } from '../types';

const section: WhitepaperSection = {
  id: 'network',
  number: 5,
  heading: { en: 'Network', zh: '網絡' },
  en: [
    { type: 'p', text: 'The steps to run the network are as follows:' },
    {
      type: 'list',
      ordered: true,
      items: [
        'New transactions are broadcast to all nodes.',
        'Each node collects new transactions into a block.',
        'Each node works on finding a difficult proof-of-work for its block.',
        'When a node finds a proof-of-work, it broadcasts the block to all nodes.',
        'Nodes accept the block only if all transactions in it are valid and not already spent.',
        'Nodes express their acceptance of the block by working on creating the next block in the chain, using the hash of the accepted block as the previous hash.',
      ],
    },
    {
      type: 'p',
      text: 'Nodes always consider the longest chain to be the correct one and will keep working on extending it. If two nodes broadcast different versions of the next block simultaneously, some nodes may receive one or the other first. In that case, they work on the first one they received, but save the other branch in case it becomes longer. The tie will be broken when the next proof-of-work is found and one branch becomes longer; the nodes that were working on the other branch will then switch to the longer one.',
    },
    {
      type: 'p',
      text: 'New transaction broadcasts do not necessarily need to reach all nodes. As long as they reach many nodes, they will get into a block before long. Block broadcasts are also tolerant of dropped messages. If a node does not receive a block, it will request it when it receives the next block and realizes it missed one.',
    },
  ],
  zh: [
    { type: 'p', text: '運行網絡的步驟如下：' },
    {
      type: 'list',
      ordered: true,
      items: [
        '新交易會向所有節點廣播。',
        '每個節點把新交易收集到一個區塊之中。',
        '每個節點致力為自己的區塊尋找一個有難度的工作量證明。',
        '節點找到工作量證明後，便向所有節點廣播該區塊。',
        '只有當區塊內所有交易均屬有效且尚未被花費，節點才會接受該區塊。',
        '節點着手創建鏈上的下一個區塊，並以獲接受區塊的哈希值作為前一個哈希值，藉此表示接受該區塊。',
      ],
    },
    {
      type: 'p',
      text: '節點始終視最長鏈為正確的鏈，並會繼續致力延長它。若兩個節點同時廣播下一個區塊的不同版本，部分節點可能先收到其中一個，另一些則先收到另一個。在這種情況下，節點會以最先收到的區塊為基礎進行工作，但會保留另一個分支，以防它變得更長。當找到下一個工作量證明，其中一個分支變得更長時，僵局便會打破；原本致力延長另一個分支的節點，屆時便會轉到較長的分支。',
    },
    {
      type: 'p',
      text: '新交易的廣播不一定需要到達所有節點。只要到達眾多節點，這些交易不久便會被納入區塊。區塊的廣播亦能容忍訊息遺失。若某個節點沒有收到某個區塊，當它收到下一個區塊並發現自己遺漏了一個時，便會請求取得該區塊。',
    },
  ],
};

export default section;
