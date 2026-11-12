import { bytesToHex, concatBytes, hexToBytes } from '@/lib/bytes';
import { sha256, sha256Hex } from '@/lib/hash';
import { sign, verify } from '@/lib/keys';
import type { KeyPair } from '@/lib/keys';

/**
 * The coin of section 2, exactly as the paper draws it: a chain of transfers,
 * each one naming the next owner's public key and signed by the owner before.
 * Bitcoin's real transactions are richer (see the chapter's "paper vs. today").
 */
export interface Transfer {
  /** Public key of the owner this transfer pays: 33 bytes compressed, as hex. */
  to: string;
  /** Hash of the transaction before, as this transfer carries it. */
  prev: string;
  /** Signature of the owner before over this transfer's hash: 64 bytes (r, then s), as hex. */
  sig: string;
}

/**
 * Stands in for the transaction that paid the coin to the first signer. It is
 * off the left edge of the figure, as it is in the paper's diagram.
 */
export const EARLIER_TX = sha256Hex('Fig. 2.1: the transaction before the first one shown');

/**
 * What an owner signs: SHA-256 of the previous transaction's hash (32 bytes)
 * followed by the next owner's public key (33 bytes). Hex in the digest's own
 * byte order.
 */
export function transferHash(transfer: Pick<Transfer, 'prev' | 'to'>): string {
  return bytesToHex(sha256(concatBytes(hexToBytes(transfer.prev), hexToBytes(transfer.to))));
}

/** The current owner signs the coin over: a real ECDSA signature over the transfer's hash. */
export function signTransfer(prev: string, to: Uint8Array, signer: KeyPair): Transfer {
  const unsigned = { prev, to: bytesToHex(to) };
  const sig = sign(hexToBytes(transferHash(unsigned)), signer.priv);
  return { ...unsigned, sig: bytesToHex(sig) };
}

/**
 * Passes one coin along a line of owners. `owners[0]` signs it over to
 * `owners[1]`, who signs it over to `owners[2]`, and so on: one transfer for
 * each change of hands. The first transfer spends {@link EARLIER_TX}.
 */
export function buildCoin(owners: readonly KeyPair[]): Transfer[] {
  const coin: Transfer[] = [];
  let prev = EARLIER_TX;
  for (let i = 1; i < owners.length; i++) {
    const transfer = signTransfer(prev, owners[i].pub, owners[i - 1]);
    coin.push(transfer);
    prev = transferHash(transfer);
  }
  return coin;
}

const bytesOrNull = (hex: string): Uint8Array | null => {
  try {
    return hexToBytes(hex);
  } catch {
    return null;
  }
};

/**
 * Whether the signature on a transfer was made with the private key behind
 * `signer` over the transfer as it stands now. False, never an error, for
 * anything that does not verify.
 */
export function signatureHolds(transfer: Transfer, signer: string): boolean {
  const sig = bytesOrNull(transfer.sig);
  const pub = bytesOrNull(signer);
  if (!sig || !pub) return false;
  return verify(sig, hexToBytes(transferHash(transfer)), pub);
}

/**
 * - `signature`: the signature does not verify under the key of the owner who had to sign.
 * - `link`: the transfer carries a previous hash that is not the hash of the
 *   transfer before it, or it stands on a transfer that failed.
 */
export type TransferProblem = 'signature' | 'link' | null;

/**
 * What a payee can check from the coin alone. Each transfer has to be signed
 * by the owner the transfer before it paid; the first has to be signed by
 * `firstSigner`, whose key the payee knows from the transaction before.
 */
export function coinProblems(coin: readonly Transfer[], firstSigner: string, origin: string = EARLIER_TX): TransferProblem[] {
  const found: TransferProblem[] = [];
  coin.forEach((transfer, index) => {
    const before = index === 0 ? null : coin[index - 1];
    const expectedPrev = before ? transferHash(before) : origin;
    const signer = before ? before.to : firstSigner;
    if (transfer.prev !== expectedPrev) found.push('link');
    else if (!signatureHolds(transfer, signer)) found.push('signature');
    // A transfer is only as good as what it stands on.
    else if (index > 0 && found[index - 1] !== null) found.push('link');
    else found.push(null);
  });
  return found;
}

/**
 * The same check for a single transfer, run when a payee asks about it: the
 * transfer itself and the whole chain behind it, but nothing that comes after.
 */
export function checkTransfer(coin: readonly Transfer[], index: number, firstSigner: string, origin: string = EARLIER_TX): TransferProblem {
  return coinProblems(coin.slice(0, index + 1), firstSigner, origin)[index] ?? null;
}

/** Rewrites who one transfer pays. Its signature and every other transfer stay as they were. */
export function redirect(coin: readonly Transfer[], index: number, to: Uint8Array): Transfer[] {
  return coin.map((transfer, i) => (i === index ? { ...transfer, to: bytesToHex(to) } : transfer));
}
