/**
 * The seven messages of the "On the wire" scene: two nodes connect, then one
 * passes a transaction to the other. Every message is built by the encoders in
 * `src/lib/p2p/messages.ts`, so the bytes are the ones a node puts on its
 * original (v1, unencrypted) transport.
 *
 * What is and is not real here:
 *
 * - The framing and every field layout are real (see the header comment of
 *   `messages.ts` for where each was checked in Bitcoin Core v32.1).
 * - The order follows `PeerManagerImpl::ProcessMessage` (v32.1,
 *   src/net_processing.cpp:3913-3917 and 4003): the side that opened the
 *   connection sends `version` first; the other answers with its own `version`
 *   and a `verack`. Everything else two real nodes say here is left out:
 *   `wtxidrelay` and `sendaddrv2` between `version` and `verack`, and after
 *   `verack` `sendcmpct`, `sendheaders`, `feefilter`, `ping` and the first
 *   requests for headers and addresses.
 * - Both nodes run with the encrypted transport switched off (-v2transport=0):
 *   that is why they speak this framing to each other at all, and why their
 *   service bits are 0x409 and not the default 0xc09 (see {@link EXAMPLE}).
 * - Because both nodes would have sent `wtxidrelay`, the transaction is
 *   announced and requested with inventory type MSG_WTX (BIP 339;
 *   src/net_processing.cpp:6365 and 6553). The transaction has no witness, so
 *   its wtxid is its txid (BIP 141).
 * - The field values are an example. Height and clock come from a block that
 *   v32.1 itself records (see {@link EXAMPLE}).
 * - The transaction is real, not an example: see {@link PAYMENT_RAW}.
 */
import { bytesToHex, hexToBytes, wireToHash } from '@/lib/bytes';
import { sha256d } from '@/lib/hash';
import { annotateMessage, encodeInv, encodeMessage, encodeVersion } from '@/lib/p2p/messages';
import type { Segment } from '@/lib/p2p/messages';
import { mulberry32 } from '@/lib/rng';
import { formatBtc, formatCount, shortHex } from '@/text/format';

/** The size of the header every message starts with: a message with no payload is nothing else. */
export const HEADER_SIZE = encodeMessage('verack', new Uint8Array(0)).length;

/** Inventory type for a transaction named by its wtxid (v32.1, src/protocol.h:501). */
const MSG_WTX = 5;

/**
 * A real payment: 10 BTC to one key and 40 BTC of change back to the key that
 * signed, in block 170 of the main chain (12 January 2009 by the block's own
 * clock). These are the transaction's own 275 bytes; the tests check that
 * they hash to {@link PAYMENT_TXID}, that this id belongs to block 170, and
 * that the signature is by the key the change returns to.
 *
 * It is widely described as the first payment from one person to another,
 * from Satoshi Nakamoto to Hal Finney. Nothing in this repository can check
 * who held the keys, so the page does not say so.
 */
export const PAYMENT_RAW: Uint8Array = hexToBytes(
  '0100000001c997a5e56e104102fa209c6a852dd90660a20b2d9c352423edce25857fcd3704000000004847304402204e45e16932b8af5149' +
    '61a1d3a1a25fdf3f4f7732e9d624c6c61548ab5fb8cd410220181522ec8eca07de4860a4acdd12909d831cc56cbbac4622082221a8768d1d' +
    '0901ffffffff0200ca9a3b00000000434104ae1a62fe09c5f51b13905f07f06b99a2f7159b2225f374cd378d71302fa28414e7aab37397f5' +
    '54a7df5f142c21c1b7303b8a0626f1baded5c72a704f7e6cd84cac00286bee0000000043410411db93e1dcdb8a016b49840f8c53bc1eb68a' +
    '382e97b1482ecad7b148a6909a5cb2e0eaddfb84ccf9744464f82e160bfa9b8b64f9d4c03f999b8643f656b412a3ac00000000',
);

/** The id of {@link PAYMENT_RAW}, display order. */
export const PAYMENT_TXID = 'f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16';

/**
 * What both example nodes say about themselves.
 *
 * `height` and `blockTime` are one real block: v32.1 names block 966,143 as
 * its default assume-valid block and records that block's time
 * (src/kernel/chainparams.cpp:142 and 223-224).
 */
export const EXAMPLE = {
  /** `PROTOCOL_VERSION` (src/node/protocol_version.h:12). */
  version: 70017,
  /**
   * NODE_NETWORK | NODE_WITNESS | NODE_NETWORK_LIMITED (src/protocol.h:327-339):
   * what a v32.1 node offers when started with -v2transport=0; the default
   * adds NODE_P2P_V2 (0xc09) (src/init.cpp:893, 1017-1019 and 2026; src/net.h:105).
   */
  services: 0x409n,
  /** `/Satoshi:32.1.0/` (src/clientversion.cpp:22 and 65-70). */
  userAgent: '/Satoshi:32.1.0/',
  height: 966_143,
  blockTime: 1_788_925_573n,
};

/** Seed for the two connection nonces, so every reader sees the same bytes. */
const NONCE_SEED = 324;

export type Side = 'a' | 'b';
export type Command = 'version' | 'verack' | 'inv' | 'getdata' | 'tx';
/** The seven messages, in the order they are sent. */
export type MessageId = 'version-a' | 'version-b' | 'verack-b' | 'verack-a' | 'inv' | 'getdata' | 'tx';

export interface WireMessage {
  id: MessageId;
  /** Who sends it. Node A opened the connection and holds the transaction. */
  from: Side;
  command: Command;
  /** The whole message as sent: the 24-byte header, then the payload. */
  bytes: Uint8Array;
  /** Its fields in order, covering every byte, each with a name of its own. */
  segments: Segment[];
}

/* ---------------------------------------------------------------- messages */

/**
 * Builds the conversation. Node A opens the connection and later passes the
 * transaction on; node B listens.
 *
 * @param options.userAgent what node A calls itself; the default is Bitcoin
 * Core's own string for v32.1
 * @throws RangeError if the user agent is longer than the 256 bytes peers accept.
 */
export function conversation(options: { userAgent?: string } = {}): WireMessage[] {
  const random = mulberry32(NONCE_SEED);
  const word = (): bigint => BigInt(Math.floor(random() * 2 ** 32));
  const nonce = (): bigint => (word() << 32n) | word();

  const introduce = (userAgent: string, clock: bigint): Uint8Array =>
    encodeVersion({
      version: EXAMPLE.version,
      services: EXAMPLE.services,
      timestamp: clock,
      nonce: nonce(),
      userAgent,
      startHeight: EXAMPLE.height,
      relay: true,
    });

  const inventory = encodeInv([{ type: MSG_WTX, hash: PAYMENT_TXID }]);
  const nothing = new Uint8Array(0);

  const script: [id: MessageId, from: Side, command: Command, payload: Uint8Array][] = [
    ['version-a', 'a', 'version', introduce(options.userAgent ?? EXAMPLE.userAgent, EXAMPLE.blockTime + 60n)],
    ['version-b', 'b', 'version', introduce(EXAMPLE.userAgent, EXAMPLE.blockTime + 61n)],
    ['verack-b', 'b', 'verack', nothing],
    ['verack-a', 'a', 'verack', nothing],
    ['inv', 'a', 'inv', inventory],
    ['getdata', 'b', 'getdata', inventory],
    ['tx', 'a', 'tx', PAYMENT_RAW],
  ];

  return script.map(([id, from, command, payload]) => {
    const bytes = encodeMessage(command, payload);
    return { id, from, command, bytes, segments: annotateMessage(bytes) };
  });
}

/**
 * What a receiver does with the header's checksum (v32.1, src/net.cpp:824-836):
 * hash the payload twice and compare the first four bytes.
 */
export function verifyChecksum(bytes: Uint8Array): {
  /** Double SHA-256 of the payload, 64 hex characters, in the digest's own byte order. */
  digest: string;
  /** Its first four bytes. */
  computed: string;
  /** The four bytes the header carries. */
  declared: string;
  ok: boolean;
} {
  const digest = bytesToHex(sha256d(bytes.subarray(HEADER_SIZE)));
  const computed = digest.slice(0, 8);
  const declared = bytesToHex(bytes.subarray(20, HEADER_SIZE));
  return { digest, computed, declared, ok: computed === declared };
}

/** Double SHA-256 of the payload in display order: for a `tx` message without witness data, the txid. */
export function payloadHash(bytes: Uint8Array): string {
  return wireToHash(sha256d(bytes.subarray(HEADER_SIZE)));
}

/** A copy with one bit of the last payload byte flipped, as line noise might. A message without payload comes back unchanged. */
export function damage(bytes: Uint8Array): Uint8Array {
  const copy = Uint8Array.from(bytes);
  if (copy.length > HEADER_SIZE) copy[copy.length - 1] ^= 1;
  return copy;
}

/* ------------------------------------------------------------------ display */

/** The kind of field a segment is: its name without the number of the input or output it belongs to. */
export function fieldOf(segmentName: string): string {
  return segmentName.replace(/^tx_(in|out)\d+_/, 'tx_$1_');
}

/** Service bits Bitcoin Core v32.1 defines (src/protocol.h:327-342). */
const SERVICE_BITS: [bit: number, name: string][] = [
  [0, 'NODE_NETWORK'],
  [2, 'NODE_BLOOM'],
  [3, 'NODE_WITNESS'],
  [6, 'NODE_COMPACT_FILTERS'],
  [10, 'NODE_NETWORK_LIMITED'],
  [11, 'NODE_P2P_V2'],
];

/** Hex spelled out byte by byte: `f9beb4d9` becomes `f9 be b4 d9`. */
export const spaced = (hex: string): string => hex.match(/../g)?.join(' ') ?? '';
const utc = (seconds: number): string => `${new Date(seconds * 1000).toISOString().replace('T', ' ').slice(0, 19)} UTC`;

/** A field's decoded value as a reader would want it: dates, amounts and flags spelled out. Language-neutral. */
export function showValue(segment: Segment): string {
  const { value } = segment;
  switch (fieldOf(segment.name)) {
    case 'magic':
    case 'checksum':
      return spaced(value);
    case 'command':
    case 'user_agent':
      return `"${value}"`;
    case 'timestamp':
      return `${value} = ${utc(Number(value))}`;
    case 'services':
    case 'addr_recv_services':
    case 'addr_from_services': {
      const bits = BigInt(value);
      const names = SERVICE_BITS.filter(([bit]) => (bits >> BigInt(bit)) & 1n).map(([, name]) => name);
      return names.length > 0 ? `${value} = ${names.join(' + ')}` : value;
    }
    case 'start_height':
      return formatCount(Number(value));
    case 'tx_out_value':
      return `${formatCount(Number(value))} sat = ${formatBtc(BigInt(value))} BTC`;
    case 'tx_in_sequence':
      return `${value} = 0x${Number(value).toString(16)}`;
    case 'tx_in_script':
    case 'tx_out_script':
      return shortHex(value, 16, 8);
    default:
      return value;
  }
}
