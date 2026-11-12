/**
 * One payment taken through every part of the machine with the engine, so
 * that what each part shows the reader is something it really produced: a
 * key and its address, a signed transaction, a Merkle root, a header that was
 * really mined, the reward it pays, and a Merkle branch that really verifies.
 *
 * Everything is fixed, so the run is the same for every reader, and cheap:
 * the proof-of-work asks for ten zero bits, about a thousand hashes.
 */
import { bytesToHex, hexToBytes, utf8 } from '@/lib/bytes';
import { sha256, sha256Hex } from '@/lib/hash';
import { GENESIS_HASH, compactTargetFromZeroBits } from '@/lib/header';
import type { BlockHeader } from '@/lib/header';
import { keyPairFromPrivate, pubkeyToAddress, sign, verify } from '@/lib/keys';
import { merkleProof, merkleRoot, verifyProof } from '@/lib/merkle';
import type { ProofStep } from '@/lib/merkle';
import { mineSync } from '@/lib/miner';
import { blockSubsidy } from '@/lib/subsidy';
import { txid } from '@/lib/tx';
import type { Tx } from '@/lib/tx';

/** Difficulty of the run's one block. */
export const ZERO_BITS = 10;

/** Satoshis each of the three transactions leaves for the miner. */
const FEE = 10_000n;

export interface MachineRun {
  /** Wallet and keys: the payer's address. */
  address: string;
  /** Transaction: the id of the payment. */
  txid: string;
  /** Network of nodes: the outcome of the check every node makes before passing the transaction on. */
  signatureValid: boolean;
  /** Mempool: ids of the transactions waiting, ours among them. */
  mempool: string[];
  /** Block and Merkle root: every transaction in the block, the coinbase first, and their root. */
  blockTxids: string[];
  merkleRoot: string;
  /** Proof-of-work: the header as it was mined, nonce included, and how many hashes that took. */
  header: BlockHeader;
  tried: number;
  /** The chain: the hash of that header. */
  hash: string;
  /** Incentive: what the block creates, and what its transactions leave for the finder. */
  subsidy: bigint;
  fees: bigint;
  /** Light wallet: the Merkle branch for the payment, and whether it checks out against the root. */
  proof: ProofStep[];
  proofValid: boolean;
}

const demoKey = (name: string) => keyPairFromPrivate(bytesToHex(sha256(utf8(`bitcoin-whitepaper-explainer/conclusion/${name}`))));

/** A payment of `value` satoshis from a made-up earlier output, with change, leaving `FEE` unclaimed. */
function payment(from: string, to: string, change: string, value: bigint): Tx {
  return {
    inputs: [{ txid: sha256Hex(`funding/${from}`), vout: 0 }],
    outputs: [
      { value, owner: to },
      { value: 50_000_000n - value - FEE, owner: change },
    ],
  };
}

let memo: MachineRun | null = null;

/** Runs the payment through the machine. Computed once, then remembered. */
export function runOnce(): MachineRun {
  if (memo) return memo;

  const payer = demoKey('payer');
  const address = pubkeyToAddress(payer.pub, 'p2wpkh');
  const payee = pubkeyToAddress(demoKey('payee').pub, 'p2wpkh');

  const id = txid(payment(address, payee, address, 30_000_000n));
  const signature = sign(hexToBytes(id), payer.priv);
  const signatureValid = verify(signature, hexToBytes(id), payer.pub);

  // Two strangers' payments are waiting too.
  const others = ['carol', 'dan'].map((name) => {
    const stranger = pubkeyToAddress(demoKey(name).pub, 'p2wpkh');
    return txid(payment(stranger, payee, stranger, 12_000_000n));
  });
  const mempool = [others[0], id, others[1]];

  // The one block of the run is the first after the genesis block.
  const subsidy = blockSubsidy(1);
  const fees = FEE * BigInt(mempool.length);
  const miner = pubkeyToAddress(demoKey('miner').pub, 'p2wpkh');
  // The block's first transaction creates the reward: no inputs, one output.
  const coinbase = txid({ inputs: [], outputs: [{ value: subsidy + fees, owner: miner }] });
  const blockTxids = [coinbase, ...mempool];
  const root = merkleRoot(blockTxids);

  const { bits, target } = compactTargetFromZeroBits(ZERO_BITS);
  const found = mineSync({ version: 1, prevHash: GENESIS_HASH, merkleRoot: root, time: 1231006505 + 600, bits, nonce: 0 }, target, 5_000_000);
  const header: BlockHeader = { version: 1, prevHash: GENESIS_HASH, merkleRoot: root, time: 1231006505 + 600, bits, nonce: found.nonce };

  const proof = merkleProof(blockTxids, blockTxids.indexOf(id));

  memo = {
    address,
    txid: id,
    signatureValid,
    mempool,
    blockTxids,
    merkleRoot: root,
    header,
    tried: found.tried,
    hash: found.hash,
    subsidy,
    fees,
    proof,
    proofValid: verifyProof(id, proof, root),
  };
  return memo;
}
