import type { WhitepaperSection } from '../types';

const section: WhitepaperSection = {
  id: 'timestamp-server',
  number: 3,
  heading: { en: 'Timestamp Server', zh: '時間戳伺服器' },
  en: [
    {
      type: 'p',
      text: 'The solution we propose begins with a timestamp server. A timestamp server works by taking a hash of a block of items to be timestamped and widely publishing the hash, such as in a newspaper or Usenet post [2-5]. The timestamp proves that the data must have existed at the time, obviously, in order to get into the hash. Each timestamp includes the previous timestamp in its hash, forming a chain, with each additional timestamp reinforcing the ones before it.',
    },
    { type: 'figure', id: 'timestamp-chain' },
  ],
  zh: [
    {
      type: 'p',
      text: '我們提出的方案由時間戳伺服器開始。時間戳伺服器的運作方式，是對一個由待加時間戳的項目組成的區塊計算哈希值，並把該哈希值廣泛發佈，例如刊於報章或 Usenet 帖子 [2-5]。時間戳證明有關數據在當時必然已經存在，否則顯然無法納入哈希值之中。每個時間戳都把前一個時間戳納入其哈希值之中，由此形成一條鏈，而每增添一個時間戳，都會強化在它之前的各個時間戳。',
    },
    { type: 'figure', id: 'timestamp-chain' },
  ],
};

export default section;
