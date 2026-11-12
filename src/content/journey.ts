import type { ActorId, L } from './types';

export type StationId = 'wallet' | 'signer' | 'node' | 'pool' | 'miner' | 'network' | 'light';

export interface JourneyStation {
  id: StationId;
  actor: ActorId;
  /** Overrides the actor's name where the station is a crowd of them. */
  name?: L<string>;
  /** What happens here, in two or three words. */
  verb: L<string>;
  title: L<string>;
  /** Rich text. */
  text: L<string>;
  /** Protocols and interfaces in play. Untranslated identifiers. */
  speaks: string;
  /** Sections of the paper that explain this stop. */
  sections: number[];
}

/** One payment, followed from the wallet that creates it to the phone that trusts it. */
export const JOURNEY = {
  kicker: { en: 'The whole machine', zh: '全景' },
  title: { en: 'The journey of one payment', zh: '一筆付款的旅程' },
  lede: {
    en: 'Alice pays Bob 0.5 BTC. Before Bob can rely on it, the payment passes through seven stops, each run by different software or hardware. The rest of this page takes them one section at a time.',
    zh: '愛麗絲向鮑勃支付 0.5 BTC。在鮑勃可以放心收下之前，這筆付款要經過七站，每一站都由不同的軟件或硬件負責。本頁其餘部分，會逐章把它們講清楚。',
  },
  send: { en: 'Send 0.5 BTC', zh: '發送 0.5 BTC' },
  again: { en: 'Send again', zh: '再發一次' },
  pause: { en: 'Pause', zh: '暫停' },
  resume: { en: 'Continue', zh: '繼續' },
  next: { en: 'Next stop', zh: '下一站' },
  stopOf: { en: 'Stop {n} / {total}', zh: '第 {n} 站（共 {total} 站）' },
  stations: { en: 'The seven stops', zh: '七個站' },
  idle: {
    en: 'Press Send to follow the payment, or pick any stop.',
    zh: '按「發送」跟着這筆付款走一趟，或直接選擇任何一站。',
  },
  explainedIn: { en: 'Explained in', zh: '詳見' },

  labels: {
    in: { en: 'in', zh: '輸入' },
    out: { en: 'out', zh: '輸出' },
    fee: { en: 'fee', zh: '手續費' },
    toBob: { en: 'to Bob', zh: '付給鮑勃' },
    change: { en: 'change, back to Alice', zh: '找續，回到愛麗絲' },
    unsigned: { en: 'unsigned', zh: '未簽署' },
    signed: { en: 'signed', zh: '已簽署' },
    txid: { en: 'transaction id', zh: '交易 ID' },
    signature: { en: 'signature', zh: '簽署' },
    verified: { en: 'verifies against Alice’s public key', zh: '以愛麗絲的公鑰驗證通過' },
    coinsExist: { en: 'the coins exist', zh: '這些幣確實存在' },
    unspent: { en: 'they have not been spent', zh: '尚未被花掉' },
    sigValid: { en: 'the signature is valid', zh: '簽署有效' },
    inMempool: { en: 'kept in the mempool and announced to peers', zh: '放進記憶池，並通知相鄰節點' },
    template: { en: 'block template', zh: '區塊模板' },
    coinbase: { en: 'coinbase: pays the miner', zh: 'coinbase：把報酬付給礦工' },
    stranger: { en: 'someone else’s payment', zh: '別人的付款' },
    ours: { en: 'Alice → Bob', zh: '愛麗絲 → 鮑勃' },
    merkleRoot: { en: 'Merkle root', zh: '默克爾根' },
    nonce: { en: 'nonce', zh: '隨機數' },
    hash: { en: 'hash', zh: '哈希' },
    zeroBits: { en: 'zero bits', zh: '個零位元' },
    tries: { en: 'tries', zh: '次嘗試' },
    searching: { en: 'searching…', zh: '搜尋中…' },
    found: { en: 'found', zh: '找到了' },
    confirmations: { en: 'confirmations', zh: '個確認' },
    confirmNote: {
      en: 'Each one makes the payment harder to undo.',
      zh: '每多一個，這筆付款就更難被推翻。',
    },
    branch: { en: 'Merkle branch', zh: '默克爾分支' },
    sibling: { en: 'with', zh: '併入' },
    matches: { en: 'equals the Merkle root in the block header', zh: '與區塊頭內的默克爾根相同' },
    proofSize: { en: 'hashes checked, not a whole block', zh: '個哈希即可核實，毋須整個區塊' },
  },

  list: [
    {
      id: 'wallet',
      actor: 'software-wallet',
      verb: { en: 'builds the payment', zh: '組出付款' },
      title: { en: 'Alice’s wallet builds the payment', zh: '愛麗絲的錢包組出這筆付款' },
      text: {
        en: 'It picks coins she already holds that add up to enough and writes a [[transaction]]: those coins go in, 0.5 BTC comes out for Bob, and the remainder returns to her as [[change]]. Nothing is signed yet.',
        zh: '錢包從她持有的幣中挑出總額足夠的幾枚，寫成一筆[[transaction|交易]]：這些幣是輸入，0.5 BTC 輸出給鮑勃，餘額以[[change|找續]]的形式回到她手上。此刻尚未簽署。',
      },
      speaks: 'PSBT · BIP 174',
      sections: [2, 9],
    },
    {
      id: 'signer',
      actor: 'hardware-wallet',
      verb: { en: 'signs', zh: '簽署' },
      title: { en: 'Her signing device approves it', zh: '她的簽署裝置確認並簽署' },
      text: {
        en: 'The unsigned transaction is passed to a device that holds her [[private-key|private key]]. It shows the amount and the destination on its own screen. She confirms, and it hands back a [[digital-signature|signature]]. The key never leaves the device.',
        zh: '未簽署的交易被送到保管她[[private-key|私鑰]]的裝置。裝置在自己的螢幕上顯示金額和收款地址；她確認之後，裝置交回一個[[digital-signature|數碼簽署]]。私鑰自始至終沒有離開過裝置。',
      },
      speaks: 'USB · QR · microSD',
      sections: [2],
    },
    {
      id: 'node',
      actor: 'full-node',
      verb: { en: 'checks and relays', zh: '驗證並轉發' },
      title: { en: 'A node checks it and tells its neighbours', zh: '節點檢查交易，並告知鄰居' },
      text: {
        en: 'Her wallet hands the signed transaction to a [[full-node|full node]]. The node checks that the coins exist, have not been spent and are properly signed, keeps the transaction in its [[mempool]], and announces it to its peers, who do the same.',
        zh: '錢包把已簽署的交易交給一個[[full-node|全節點]]。節點檢查這些幣是否存在、是否未被花掉、簽署是否正確，然後把交易放進自己的[[mempool|記憶池]]，並通知相鄰的節點；它們亦會照樣處理。',
      },
      speaks: 'RPC sendrawtransaction · P2P inv / getdata / tx',
      sections: [5],
    },
    {
      id: 'pool',
      actor: 'mining-pool',
      verb: { en: 'packs a block', zh: '組出區塊' },
      title: { en: 'A pool packs it into a block', zh: '礦池把它收進區塊' },
      text: {
        en: 'A [[mining-pool|mining pool]] asks its node for a block template: a batch of waiting transactions, usually the ones paying the highest [[fee|fees]], plus a [[coinbase|coinbase transaction]] that pays the miner. All of them are folded into a single [[merkle-root|Merkle root]].',
        zh: '[[mining-pool|礦池]]向自己的節點索取區塊模板：一批等候中的交易（通常是[[fee|手續費]]最高的那些），再加上一筆把報酬付給礦工的 [[coinbase|coinbase 交易]]。全部交易最後歸納成一個[[merkle-root|默克爾根]]。',
      },
      speaks: 'getblocktemplate · Stratum',
      sections: [5, 6, 7],
    },
    {
      id: 'miner',
      actor: 'asic-miner',
      verb: { en: 'finds the proof', zh: '找出工作量證明' },
      title: { en: 'Machines search for the proof-of-work', zh: '礦機尋找工作量證明' },
      text: {
        en: 'The pool’s machines hash the block header over and over, changing the [[nonce]] each time, until one hash comes out at or below the [[target]]. That is happening for real on this page, at a difficulty your browser can manage.',
        zh: '礦池旗下的礦機反覆對區塊頭計算哈希，每次更換[[nonce|隨機數]]，直到有一個哈希不大於[[target|目標值]]。這個過程此刻正在本頁真實地進行，只是難度調低到瀏覽器應付得來的水平。',
      },
      speaks: 'SHA-256 × 2',
      sections: [4],
    },
    {
      id: 'network',
      actor: 'full-node',
      name: { en: 'Every node', zh: '全網節點' },
      verb: { en: 'accept and confirm', zh: '接受並確認' },
      title: { en: 'Every node accepts the block', zh: '所有節點接受這個區塊' },
      text: {
        en: 'The winning block spreads across the network. Each node checks it for itself and starts building on it. Every block added after it is one more [[confirmation]], and one more block an attacker would have to redo.',
        zh: '勝出的區塊傳遍整個網絡。每個節點各自驗證，然後在它之上繼續挖。其後每多一個區塊，就多一個[[confirmation|確認]]，也是攻擊者要多重做的一個區塊。',
      },
      speaks: 'P2P headers / block',
      sections: [5, 11],
    },
    {
      id: 'light',
      actor: 'light-client',
      verb: { en: 'verifies', zh: '核實' },
      title: { en: 'Bob’s phone verifies the payment', zh: '鮑勃的手機核實這筆付款' },
      text: {
        en: 'Bob’s wallet does not store the chain. It keeps [[block-header|block headers]] and asks a node for the [[merkle-branch|Merkle branch]] that ties his payment to one of them: a few hashes instead of a whole block.',
        zh: '鮑勃的錢包不會儲存整條鏈。它只保存[[block-header|區塊頭]]，再向節點索取把這筆付款連到某個區塊頭的[[merkle-branch|默克爾分支]]：只需幾個哈希，而不是整個區塊。',
      },
      speaks: 'SPV · Electrum protocol / BIP 37',
      sections: [8, 11],
    },
  ] satisfies JourneyStation[] as JourneyStation[],
};
