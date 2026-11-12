import type { ActorId, L } from './types';

export interface ActorDef {
  id: ActorId;
  name: L<string>;
  /** What it does, in one sentence. */
  what: L<string>;
  /** Which parts of the paper it carries out. */
  covers: L<string>;
  /** Well-known examples. Named for illustration only, never as advice. */
  examples: L<string>;
  /** Protocols and interfaces it speaks. Untranslated identifiers. */
  interfaces: string[];
  /** Section numbers where it shows up. */
  sections: number[];
}

/**
 * The people and machines that carry out the paper in practice.
 * Order follows a payment: from the wallet that creates it to the services
 * that watch it confirm.
 */
export const ACTORS: Record<ActorId, ActorDef> = {
  'software-wallet': {
    id: 'software-wallet',
    name: { en: 'Software wallet', zh: '軟件錢包' },
    what: {
      en: 'Tracks which coins are yours, builds transactions and hands them to a signer.',
      zh: '記錄哪些幣屬於你，組出交易，再交給簽署裝置簽署。',
    },
    covers: {
      en: '§2 Transactions, §9 Combining and Splitting Value, §10 Privacy',
      zh: '§2 交易、§9 價值的合併與分割、§10 私隱',
    },
    examples: { en: 'Bitcoin Core wallet, Electrum, Sparrow', zh: 'Bitcoin Core 錢包、Electrum、Sparrow' },
    interfaces: ['PSBT (BIP 174)', 'HD keys (BIP 32 / 39)', 'Output descriptors'],
    sections: [2, 9, 10],
  },
  'hardware-wallet': {
    id: 'hardware-wallet',
    name: { en: 'Hardware wallet', zh: '硬件錢包' },
    what: {
      en: 'A small device that holds the private keys and signs. The keys never leave it.',
      zh: '保管私鑰並負責簽署的小型裝置，私鑰永不離開裝置。',
    },
    covers: { en: '§2 Digital signatures, by keeping the private key', zh: '§2 數碼簽署（保管私鑰）' },
    examples: { en: 'Trezor, Ledger, Coldcard', zh: 'Trezor、Ledger、Coldcard' },
    interfaces: ['USB', 'QR codes', 'microSD', 'HWI'],
    sections: [2, 10],
  },
  'full-node': {
    id: 'full-node',
    name: { en: 'Full node', zh: '全節點' },
    what: {
      en: 'Checks every block and transaction against the rules, passes them on, and stores the chain.',
      zh: '按規則核對每個區塊和每筆交易，轉發給其他節點，並儲存整條鏈。',
    },
    covers: {
      en: '§3 to §5 checking and relaying, §6 the rules of issuance, §7 storage',
      zh: '§3 至 §5 驗證與傳播、§6 發行規則、§7 儲存',
    },
    examples: { en: 'Bitcoin Core (bitcoind), btcd', zh: 'Bitcoin Core（bitcoind）、btcd' },
    interfaces: ['P2P · TCP 8333', 'JSON-RPC · 8332', 'REST', 'ZMQ'],
    sections: [3, 4, 5, 6, 7, 8, 11],
  },
  'mining-pool': {
    id: 'mining-pool',
    name: { en: 'Mining pool', zh: '礦池' },
    what: {
      en: 'Assembles the block to be mined, shares the hashing among many machines and splits the reward.',
      zh: '組出待挖的區塊，把哈希運算分派給大量礦機，再按貢獻分配獎勵。',
    },
    covers: { en: '§5 collecting transactions into a block, §6 the coinbase and its reward', zh: '§5 把交易收進區塊、§6 Coinbase 交易與獎勵' },
    examples: { en: 'Public pools; CKPool is open source', zh: '各大公開礦池；CKPool 為開源實現' },
    interfaces: ['getblocktemplate', 'Stratum v1 / v2'],
    sections: [5, 6],
  },
  'asic-miner': {
    id: 'asic-miner',
    name: { en: 'ASIC miner', zh: 'ASIC 礦機' },
    what: {
      en: 'Hardware built for one job: double SHA-256 on block headers, as fast as it can.',
      zh: '只做一件事的專用硬件：以最快速度對區塊頭做雙重 SHA-256。',
    },
    covers: { en: '§4 Proof-of-Work', zh: '§4 工作量證明' },
    examples: { en: 'SHA-256 ASIC machines and their firmware', zh: 'SHA-256 專用礦機及其固件' },
    interfaces: ['Stratum client'],
    sections: [4],
  },
  'light-client': {
    id: 'light-client',
    name: { en: 'Light wallet', zh: '輕錢包' },
    what: {
      en: 'Keeps only block headers and asks full nodes to prove a payment is in a block.',
      zh: '只保存區塊頭，並要求全節點證明某筆付款確實在某個區塊之內。',
    },
    covers: { en: '§8 Simplified Payment Verification', zh: '§8 簡易支付驗證' },
    examples: { en: 'Phone wallets, Electrum, Neutrino', zh: '手機錢包、Electrum、Neutrino' },
    interfaces: ['Merkle proofs', 'BIP 157 / 158', 'Electrum protocol'],
    sections: [8],
  },
  explorer: {
    id: 'explorer',
    name: { en: 'Explorers and exchanges', zh: '區塊瀏覽器與交易所' },
    what: {
      en: 'Index the chain so anyone can look things up, and decide how many confirmations to wait for.',
      zh: '為整條鏈建立索引供人查閱，並自行決定要等多少個確認。',
    },
    covers: { en: '§11 how many confirmations count as final', zh: '§11 多少個確認才算數' },
    examples: { en: 'mempool.space, Esplora', zh: 'mempool.space、Esplora' },
    interfaces: ['REST', 'Electrum protocol'],
    sections: [3, 11],
  },
};

export const ACTOR_ORDER: readonly ActorId[] = [
  'software-wallet',
  'hardware-wallet',
  'full-node',
  'mining-pool',
  'asic-miner',
  'light-client',
  'explorer',
];
