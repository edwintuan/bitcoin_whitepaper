import type { WhitepaperSection } from '../types';

const section: WhitepaperSection = {
  id: 'proof-of-work',
  number: 4,
  heading: { en: 'Proof-of-Work', zh: '工作量證明' },
  en: [
    {
      type: 'p',
      text: "To implement a distributed timestamp server on a peer-to-peer basis, we will need to use a proof-of-work system similar to Adam Back's Hashcash [6], rather than newspaper or Usenet posts. The proof-of-work involves scanning for a value that when hashed, such as with SHA-256, the hash begins with a number of zero bits. The average work required is exponential in the number of zero bits required and can be verified by executing a single hash.",
    },
    {
      type: 'p',
      text: "For our timestamp network, we implement the proof-of-work by incrementing a nonce in the block until a value is found that gives the block's hash the required zero bits. Once the CPU effort has been expended to make it satisfy the proof-of-work, the block cannot be changed without redoing the work. As later blocks are chained after it, the work to change the block would include redoing all the blocks after it.",
    },
    { type: 'figure', id: 'pow-blocks' },
    {
      type: 'p',
      text: 'The proof-of-work also solves the problem of determining representation in majority decision making. If the majority were based on one-IP-address-one-vote, it could be subverted by anyone able to allocate many IPs. Proof-of-work is essentially one-CPU-one-vote. The majority decision is represented by the longest chain, which has the greatest proof-of-work effort invested in it. If a majority of CPU power is controlled by honest nodes, the honest chain will grow the fastest and outpace any competing chains. To modify a past block, an attacker would have to redo the proof-of-work of the block and all blocks after it and then catch up with and surpass the work of the honest nodes. We will show later that the probability of a slower attacker catching up diminishes exponentially as subsequent blocks are added.',
    },
    {
      type: 'p',
      text: "To compensate for increasing hardware speed and varying interest in running nodes over time, the proof-of-work difficulty is determined by a moving average targeting an average number of blocks per hour. If they're generated too fast, the difficulty increases.",
    },
  ],
  zh: [
    {
      type: 'p',
      text: '要以點對點的方式實現分佈式時間戳伺服器，我們需要採用類似 Adam Back 的 Hashcash [6] 的工作量證明系統，而非報章或 Usenet 帖子。工作量證明的做法，是搜尋一個數值，使該數值經過例如 SHA-256 的哈希運算後，所得哈希值以若干個零位元開頭。所需的平均工作量隨所要求的零位元數目呈指數增長，而驗證則只需執行一次哈希運算。',
    },
    {
      type: 'p',
      text: '在我們的時間戳網絡中，我們實現工作量證明的方法，是不斷遞增區塊內的隨機數（nonce），直至找到一個令該區塊的哈希值具有所需零位元的數值為止。一旦耗費了 CPU 運算量使區塊滿足工作量證明，除非重做這些工作，否則該區塊便無法更改。由於其後的區塊會鏈接在它之後，要更改該區塊，所需的工作便包括重做其後的所有區塊。',
    },
    { type: 'figure', id: 'pow-blocks' },
    {
      type: 'p',
      text: '工作量證明亦解決了在多數決中如何確定代表權的問題。假如多數是以「一個 IP 地址一票」為基礎，任何能夠分配大量 IP 的人都可以顛覆它。工作量證明本質上是「一個 CPU 一票」。多數的決定由最長鏈代表，而最長鏈亦是投入工作量證明最多的鏈。若大多數 CPU 算力由誠實節點控制，誠實鏈便會增長得最快，並拋離任何與之競爭的鏈。要修改過去的某個區塊，攻擊者必須重做該區塊及其後所有區塊的工作量證明，然後追上並超越誠實節點的工作量。我們稍後將會證明，隨着後續區塊不斷加入，速度較慢的攻擊者追上的概率會呈指數下降。',
    },
    {
      type: 'p',
      text: '為了抵銷硬件速度的不斷提升，以及運行節點的興趣隨時間出現的變化，工作量證明的難度由一個移動平均值決定，該平均值以每小時的平均區塊數目為目標。若區塊生成得太快，難度便會提高。',
    },
  ],
};

export default section;
