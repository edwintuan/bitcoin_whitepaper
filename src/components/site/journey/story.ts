import { toyTarget } from '@/figures/pow/blocks';
import { bytesToHex, hexToBytes } from '@/lib/bytes';
import { sha256Hex } from '@/lib/hash';
import type { BlockHeader } from '@/lib/header';
import { keyPairFromPrivate, pubkeyToAddress, sign } from '@/lib/keys';
import { merkleProof, merkleRoot } from '@/lib/merkle';
import type { ProofStep } from '@/lib/merkle';
import { buildPayment, selectCoins, txid } from '@/lib/tx';
import type { Tx, Utxo } from '@/lib/tx';
import { HERO_SEED } from '../hero/chain';

export interface Party {
  /** 33-byte compressed public key. */
  pub: Uint8Array;
  /** Its native SegWit address, as a wallet would show it. */
  address: string;
}

/** Everything the journey shows, computed once with the real engine. */
export interface Story {
  alice: Party;
  bob: Party;
  /** What Alice pays Bob, in satoshis. */
  amount: bigint;
  /** Alice's coins that the wallet chose to spend. */
  inputs: Utxo[];
  tx: Tx;
  fee: bigint;
  change: bigint;
  txid: string;
  /** Alice's signature over the transaction id, 64 bytes as hex. */
  signature: string;
  /** Transaction ids of the block the payment lands in, coinbase first. */
  blockTxids: string[];
  /** Position of the payment in `blockTxids`. */
  txIndex: number;
  merkleRoot: string;
  /** The Merkle branch a light wallet needs for the payment. */
  proof: ProofStep[];
  /** The block header a miner has to solve, nonce at 0. */
  header: BlockHeader;
  target: bigint;
  zeroBits: number;
}

const ZERO_BITS = 12;
const DUST = 546n;

/**
 * Demonstration keys derived from fixed, public text, so the page shows the
 * same payment every time. Anyone can derive them: they must never hold funds.
 */
const demoKey = (who: string) => keyPairFromPrivate(sha256Hex(`Bitcoin, explained: ${who}. Demonstration key, never fund.`));

let cached: Story | null = null;

export function buildStory(): Story {
  if (cached) return cached;

  const aliceKey = demoKey('Alice');
  const bobKey = demoKey('Bob');
  const alice: Party = { pub: aliceKey.pub, address: pubkeyToAddress(aliceKey.pub, 'p2wpkh') };
  const bob: Party = { pub: bobKey.pub, address: pubkeyToAddress(bobKey.pub, 'p2wpkh') };

  // Two coins Alice received earlier. Neither covers the payment alone.
  const coins: Utxo[] = [
    { txid: sha256Hex('journey: an earlier payment to Alice'), vout: 0, value: 30_000_000n, owner: alice.address },
    { txid: sha256Hex('journey: another earlier payment to Alice'), vout: 1, value: 25_000_000n, owner: alice.address },
  ];

  const amount = 50_000_000n;
  const selection = selectCoins(coins, amount, 2_500n, 5_000n);
  if (!selection) throw new Error('journey: the demonstration wallet cannot fund its own payment');
  const tx = buildPayment(selection, bob.address, amount, alice.address, DUST);
  const id = txid(tx);
  const signature = bytesToHex(sign(hexToBytes(id), aliceKey.priv));

  // The block it lands in: a coinbase, two strangers' payments, and ours.
  const blockTxids = [
    sha256Hex('journey: coinbase'),
    sha256Hex('journey: a stranger pays another stranger'),
    id,
    sha256Hex('journey: one more payment'),
  ];
  const txIndex = blockTxids.indexOf(id);
  const root = merkleRoot(blockTxids);

  const { bits, target } = toyTarget(ZERO_BITS);
  const tip = HERO_SEED[HERO_SEED.length - 1];
  const header: BlockHeader = {
    version: 1,
    prevHash: tip.hash,
    merkleRoot: root,
    time: 1231006505 + (tip.height + 1) * 600,
    bits,
    nonce: 0,
  };

  cached = {
    alice,
    bob,
    amount,
    inputs: selection.inputs,
    tx,
    fee: selection.fee,
    change: selection.change,
    txid: id,
    signature,
    blockTxids,
    txIndex,
    merkleRoot: root,
    proof: merkleProof(blockTxids, txIndex),
    header,
    target,
    zeroBits: ZERO_BITS,
  };
  return cached;
}

/** Satoshis as bitcoin, without trailing zeros: 4990000n → "0.0499". */
export function formatBtc(sats: bigint): string {
  const whole = sats / 100_000_000n;
  const fraction = (sats % 100_000_000n).toString().padStart(8, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : `${whole}`;
}
