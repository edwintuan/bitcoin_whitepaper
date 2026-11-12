import type { WhitepaperSection } from '../types';

/**
 * The diagram's two sub-captions ("Transactions Hashed in a Merkle Tree",
 * "After Pruning Tx0-2 from the Block") are labels inside the drawing and
 * belong to the figure component, not to the text.
 */
const section: WhitepaperSection = {
  id: 'reclaiming-disk-space',
  number: 7,
  heading: { en: 'Reclaiming Disk Space', zh: '回收磁碟空間' },
  en: [
    {
      type: 'p',
      text: "Once the latest transaction in a coin is buried under enough blocks, the spent transactions before it can be discarded to save disk space. To facilitate this without breaking the block's hash, transactions are hashed in a Merkle Tree [7][2][5], with only the root included in the block's hash. Old blocks can then be compacted by stubbing off branches of the tree. The interior hashes do not need to be stored.",
    },
    { type: 'figure', id: 'merkle-prune' },
    {
      type: 'p',
      text: "A block header with no transactions would be about 80 bytes. If we suppose blocks are generated every 10 minutes, 80 bytes * 6 * 24 * 365 = 4.2MB per year. With computer systems typically selling with 2GB of RAM as of 2008, and Moore's Law predicting current growth of 1.2GB per year, storage should not be a problem even if the block headers must be kept in memory.",
    },
  ],
  zh: [
    {
      type: 'p',
      text: '一旦某枚貨幣的最新交易被埋在足夠多的區塊之下，在它之前的已花費交易便可丟棄，以節省磁碟空間。為了在不破壞區塊哈希值的情況下做到這一點，交易以默克爾樹 [7][2][5] 的形式進行哈希運算，只有默克爾根會納入區塊的哈希值之中。這樣，舊區塊便可透過剪除樹的分支來壓縮。內部的哈希值毋須儲存。',
    },
    { type: 'figure', id: 'merkle-prune' },
    {
      type: 'p',
      text: '不含交易的區塊頭約為 80 位元組。假設每 10 分鐘生成一個區塊，則 80 位元組 * 6 * 24 * 365 = 每年 4.2MB。以 2008 年而言，電腦系統出售時一般配備 2GB RAM，而摩爾定律預測目前每年增長 1.2GB，因此即使區塊頭必須保存在記憶體之中，儲存亦不應成為問題。',
    },
  ],
};

export default section;
