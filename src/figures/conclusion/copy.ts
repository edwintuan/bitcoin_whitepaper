import type { L } from '@/content/types';
import type { FlowId, PartId } from './machine';

interface PartCopy {
  name: L<string>;
  /** One sentence on what the part does. Rich text: `{§n}` links to the section. */
  text: L<string>;
  /** What the specimen beside it is. */
  specimen: L<string>;
}

interface FlowCopy {
  /** A word for the arrow. */
  label: L<string>;
  /** The hand-off as a sentence about the part that gives, shown when that part is selected. */
  given: L<string>;
  /** The same hand-off as a sentence about the part that receives. */
  taken: L<string>;
}

/** Interface copy for the conclusion figure. */
export const COPY = {
  diagram: {
    en: 'The parts of the system. Press one to read what it does and what it hands to the others.',
    zh: '系統的各個零件。按其中一個，看看它負責甚麼，又把甚麼交給其他零件。',
  },
  parts: {
    wallet: {
      name: { en: 'Wallet and keys', zh: '錢包與密鑰' },
      text: {
        en: 'A wallet holds the private keys: a signature made with one is the only way to spend a coin ({§2}), and a fresh key for every payment keeps its owner private ({§10}).',
        zh: '錢包保管私鑰：要花掉一枚幣，唯一的方法是用私鑰簽署（{§2}）；每次收款都換一把新密鑰，則可保護擁有者的私隱（{§10}）。',
      },
      specimen: { en: 'An address made from a key', zh: '由密鑰推算出的地址' },
    },
    transaction: {
      name: { en: 'Transaction', zh: '交易' },
      text: {
        en: 'A transaction spends earlier outputs and creates new ones, signed over to the next owner ({§2}); several inputs can be combined, and the change comes back ({§9}).',
        zh: '交易花掉先前的輸出、產生新的輸出，並簽署轉讓給下一位擁有者（{§2}）；多個輸入可以合併，餘額則以找續退回（{§9}）。',
      },
      specimen: { en: 'The id of the signed transaction', zh: '已簽署交易的 ID' },
    },
    nodes: {
      name: { en: 'Network of nodes', zh: '節點網絡' },
      text: {
        en: 'Every node checks each transaction and each block for itself, passes it on and builds on the longest chain, with nobody in charge ({§5}).',
        zh: '每個節點都親自驗證每筆交易、每個區塊，再轉發出去，並在最長的鏈上繼續挖，沒有誰在發號施令（{§5}）。',
      },
      specimen: { en: 'A node’s check of the signature', zh: '節點對簽署的檢查' },
    },
    mempool: {
      name: { en: 'Mempool', zh: '記憶池' },
      text: {
        en: 'Each node keeps the valid transactions it has heard of but not yet seen in a block, ready to be collected into the next one ({§5}).',
        zh: '每個節點都把已收到、驗證有效但尚未被收進區塊的交易暫存起來，等候被收進下一個區塊（{§5}）。',
      },
      specimen: { en: 'Waiting for a block', zh: '等候進入區塊' },
    },
    block: {
      name: { en: 'Block and Merkle root', zh: '區塊與默克爾根' },
      text: {
        en: 'A block gathers transactions and folds them into one Merkle root in its header, so that 80 bytes commit to all of them ({§7}).',
        zh: '區塊把交易收集起來，再歸納成區塊頭內的一個默克爾根；80 個位元組，便足以代表區塊內的全部交易（{§7}）。',
      },
      specimen: { en: 'The Merkle root of {count} transactions', zh: '{count} 筆交易的默克爾根' },
    },
    pow: {
      name: { en: 'Proof-of-work', zh: '工作量證明' },
      text: {
        en: 'A block counts only once a nonce is found that puts its hash under the target: costly to find, and checked with a single hash ({§4}).',
        zh: '必須找到一個令哈希低於目標值的隨機數，區塊才算數：找起來代價高昂，驗證卻只需算一次哈希（{§4}）。',
      },
      specimen: { en: 'The nonce found here, for ten zero bits', zh: '此處找到的隨機數（要求十個零位元）' },
    },
    chain: {
      name: { en: 'The chain', zh: '鏈' },
      text: {
        en: 'Each block carries the hash of the one before, so the chain fixes the order of events ({§3}), and every block added makes the ones beneath it harder to undo ({§11}).',
        zh: '每個區塊都帶着上一個區塊的哈希，整條鏈因而定下了事件的先後次序（{§3}）；每多接上一個區塊，下面的區塊就更難推翻（{§11}）。',
      },
      specimen: { en: 'The hash of the new block', zh: '新區塊的哈希' },
    },
    incentive: {
      name: { en: 'Incentive', zh: '激勵' },
      text: {
        en: 'Whoever finds a block is paid in new coins and in the fees of its transactions, which is what makes honest work the better business ({§6}).',
        zh: '找到區塊的人可獲得新發行的幣，以及區塊內各筆交易的手續費；誠實工作因此成為較划算的生意（{§6}）。',
      },
      specimen: { en: 'What this block pays its finder', zh: '這個區塊付給發現者的報酬' },
    },
    light: {
      name: { en: 'Light wallet', zh: '輕錢包' },
      text: {
        en: 'A light wallet keeps only block headers and asks for the Merkle branch that ties its payment to one of them ({§8}).',
        zh: '輕錢包只保存區塊頭，再索取把自己那筆付款連到某個區塊頭的默克爾分支（{§8}）。',
      },
      specimen: { en: 'The Merkle branch for this payment', zh: '這筆付款的默克爾分支' },
    },
  } satisfies Record<PartId, PartCopy>,
  flows: {
    sign: {
      label: { en: 'signs', zh: '簽署' },
      given: { en: 'Signs each transaction with a private key.', zh: '把一個簽署交給「交易」。' },
      taken: { en: 'Carries a signature made by the wallet’s key.', zh: '從「錢包與密鑰」取得一個簽署。' },
    },
    broadcast: {
      label: { en: 'sent', zh: '廣播' },
      given: { en: 'Is sent to the network of nodes.', zh: '把已簽署的交易交給「節點網絡」。' },
      taken: { en: 'Receive each signed transaction.', zh: '從「交易」取得已簽署的交易。' },
    },
    hold: {
      label: { en: 'kept', zh: '暫存' },
      given: { en: 'Keep the transactions that pass their checks in the mempool.', zh: '把通過檢查的交易交給「記憶池」。' },
      taken: { en: 'Holds the transactions the nodes have checked.', zh: '從「節點網絡」取得通過檢查的交易。' },
    },
    gather: {
      label: { en: 'packed', zh: '打包' },
      given: { en: 'Supplies the next block with a batch of waiting transactions.', zh: '把一批等候中的交易交給「區塊與默克爾根」。' },
      taken: { en: 'Takes a batch of waiting transactions from the mempool.', zh: '從「記憶池」取得一批等候中的交易。' },
    },
    hash: {
      label: { en: 'hashed', zh: '求解' },
      given: { en: 'Hands its header to the proof-of-work to be hashed.', zh: '把有待計算哈希的區塊頭交給「工作量證明」。' },
      taken: { en: 'Hashes the block’s header until the result meets the target.', zh: '從「區塊與默克爾根」取得有待計算哈希的區塊頭。' },
    },
    extend: {
      label: { en: 'added', zh: '接上' },
      given: { en: 'Adds the finished block to the chain.', zh: '把附有有效工作量證明的區塊交給「鏈」。' },
      taken: { en: 'Grows by each block that carries valid proof-of-work.', zh: '從「工作量證明」取得附有有效工作量證明的區塊。' },
    },
    accept: {
      label: { en: 'built on', zh: '接力' },
      given: { en: 'Shows every node which block to build on next.', zh: '把下一個區塊要接在其後的那個區塊交給「節點網絡」。' },
      taken: { en: 'Build on the newest block of the chain.', zh: '從「鏈」取得下一個區塊要接在其後的那個區塊。' },
    },
    prove: {
      label: { en: 'proves', zh: '證明' },
      given: { en: 'Gives light wallets block headers and Merkle branches.', zh: '把區塊頭與默克爾分支交給「輕錢包」。' },
      taken: { en: 'Checks its payment against the chain’s headers and a Merkle branch.', zh: '從「鏈」取得區塊頭與默克爾分支。' },
    },
    reward: {
      label: { en: 'pays', zh: '獎勵' },
      given: { en: 'Pays for the work that goes into each block.', zh: '把支付這份工夫的報酬交給「工作量證明」。' },
      taken: { en: 'Is paid for by the block’s reward.', zh: '從「激勵」取得支付這份工夫的報酬。' },
    },
  } satisfies Record<FlowId, FlowCopy>,
  specimenTitle: { en: 'Worked out on this page', zh: '本頁實際算出' },
  valid: { en: 'valid', zh: '有效' },
  invalid: { en: 'not valid', zh: '無效' },
  verified: { en: 'verified', zh: '已核實' },
  unverified: { en: 'does not verify', zh: '未能核實' },
  waiting: { en: '{count} transactions', zh: '{count} 筆交易' },
  tries: { en: 'after {count} tries', zh: '試了 {count} 次' },
  feesSuffix: { en: 'in fees', zh: '手續費' },
  hashes: { en: '{count} hashes', zh: '{count} 個哈希' },
  notYet: { en: 'not yet in place', zh: '尚未裝上' },
  whole: {
    en: 'Nine parts, nine hand-offs, and nobody in charge. Press any part to see what it receives and what it hands on.',
    zh: '九個零件，九次交接，沒有誰在主持。按任何一個零件，看看它收到甚麼、又交出甚麼。',
  },
  knowTitle: { en: 'What you now know', zh: '你現在知道了' },
  know: [
    {
      en: 'Paying a stranger used to need a trusted middleman. The paper sets out to replace that trust with proof.',
      zh: '向陌生人付款，以往總要靠一個可信的中間人。白皮書要做的，是以證明取代信任。',
    },
    {
      en: 'A coin is a chain of signatures: each owner signs it over to the next, and only the holder of the key can.',
      zh: '一枚幣就是一串簽署：每位擁有者簽署一次，把它轉給下一位，而且只有持有私鑰的人才做得到。',
    },
    {
      en: 'Hashing each batch of transactions together with the hash before it fixes their order for all to see.',
      zh: '把每批交易連同上一個哈希一起計算哈希，它們的先後次序便公開地固定下來。',
    },
    {
      en: 'Proof-of-work makes that record costly to write and cheap to check, and gives the vote to computing power.',
      zh: '工作量證明令這份紀錄寫起來代價高昂、驗起來毫不費力，並把投票權交給算力。',
    },
    {
      en: 'Nodes need no coordinator: they broadcast, check, and build on the longest chain.',
      zh: '節點毋須協調者：它們廣播、驗證，然後在最長的鏈上繼續挖。',
    },
    {
      en: 'New coins and fees pay whoever adds a block, so keeping the rules earns more than breaking them.',
      zh: '新發行的幣和手續費，付給接上區塊的人；所以守規矩比破壞規矩賺得更多。',
    },
    {
      en: 'A Merkle tree lets spent transactions be thrown away while the block’s hash stays the same.',
      zh: '有了默克爾樹，已花掉的交易可以丟棄，而區塊的哈希保持不變。',
    },
    {
      en: 'A wallet can check a payment with block headers and one Merkle branch, without the whole chain.',
      zh: '錢包只憑區塊頭和一條默克爾分支，便能核實一筆付款，毋須整條鏈。',
    },
    {
      en: 'A transaction can combine several inputs and usually pays two outputs: the payment, and the change.',
      zh: '一筆交易可以合併多個輸入，通常付出兩個輸出：付款，以及找續。',
    },
    {
      en: 'Keys are not names. Privacy lasts as long as no key is tied to its owner.',
      zh: '密鑰不是姓名。只要沒有密鑰被連到擁有者身上，私隱便得以保持。',
    },
    {
      en: 'Each block on top of a payment makes reversing it exponentially less likely.',
      zh: '付款之上每多一個區塊，它被逆轉的機會便以指數下降。',
    },
  ] satisfies L<string>[],
} satisfies Record<string, L<unknown> | Record<string, unknown> | unknown[]>;
