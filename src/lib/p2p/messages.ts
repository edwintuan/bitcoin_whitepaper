/**
 * Bitcoin's peer-to-peer wire format for the handful of messages the handshake
 * figure replays. Unlike `tx.ts` this is the real encoding: the bytes produced
 * here are what a mainnet node sends over its original (v1, unencrypted)
 * transport.
 *
 * Layouts were checked against Bitcoin Core v32.1 (paths below are relative to
 * that tag; `reference/v32.1/` holds a local copy):
 *
 * - message header: src/protocol.h:22-54 (fields and sizes; serialized in the
 *   order of line 48), src/protocol.cpp:10-19 (command copied into 12
 *   zero-filled bytes) and 26-43 (command must be printable ASCII);
 * - checksum: src/net.cpp:855-860, the first four bytes of `Hash(payload)`,
 *   which is double SHA-256;
 * - magic bytes: src/kernel/chainparams.cpp:149-152;
 * - `version` payload: field order as sent in src/net_processing.cpp:1675-1688
 *   and widths as read back in 3852-3899; a network address without timestamp
 *   is 8 bytes of services, 16 of IPv6 address and a 2-byte big-endian port
 *   (src/netaddress.h:563-565);
 * - `inv` / `getdata` entries: src/protocol.h:519 (type, then hash) with the
 *   type numbers of lines 490-510;
 * - CompactSize: src/serialize.h:302-324.
 *
 * Core v32.1 prefers the encrypted v2 transport of BIP 324 when both peers
 * support it (src/net.h:105), which frames messages differently. The 24-byte
 * header shown here is the v1 framing every node still accepts.
 */
import {
  bytesToHex, concatBytes, hashToWire, reverseBytes, u32le, u64le, utf8, varInt, wireToHash,
} from '../bytes';
import { sha256d } from '../hash';

/** The four bytes that open every mainnet message: f9 be b4 d9. Treat as read-only. */
export const MAINNET_MAGIC = Uint8Array.of(0xf9, 0xbe, 0xb4, 0xd9);

const HEADER_SIZE = 24;
const COMMAND_SIZE = 12;
/** Peers reject a longer user agent (`MAX_SUBVERSION_LENGTH`, src/net.h:67). */
const MAX_USER_AGENT_BYTES = 256;
/** An unset network address, `CService{}`: the IPv6 address `::` and port 0. */
const EMPTY_ADDRESS = new Uint8Array(16 + 2);

/**
 * Wraps a payload in a message header and returns the whole message:
 *
 * ```
 * magic     4 bytes   f9 be b4 d9 on mainnet
 * command  12 bytes   ASCII name, padded with zero bytes
 * length    4 bytes   payload size, little-endian
 * checksum  4 bytes   first four bytes of sha256d(payload)
 * payload   `length` bytes
 * ```
 *
 * @throws RangeError if `command` is longer than 12 characters or contains
 * anything but printable ASCII.
 */
export function encodeMessage(command: string, payload: Uint8Array): Uint8Array {
  if (!/^[\x20-\x7e]{0,12}$/.test(command)) {
    throw new RangeError(`command must be at most ${COMMAND_SIZE} printable ASCII characters`);
  }
  const name = new Uint8Array(COMMAND_SIZE);
  name.set(utf8(command));
  return concatBytes(MAINNET_MAGIC, name, u32le(payload.length), sha256d(payload).subarray(0, 4), payload);
}

/** Encodes a non-negative integer as the signed 32-bit little-endian field the protocol uses. */
function int32le(n: number, field: string): Uint8Array {
  if (!Number.isInteger(n) || n < 0 || n > 0x7fffffff) {
    throw new RangeError(`${field} must be an integer within 0 … 2^31 − 1, got ${n}`);
  }
  return u32le(n);
}

/**
 * Builds the payload of a `version` message, the first thing each side sends.
 * Field order and widths:
 *
 * ```
 * version         4   protocol version, little-endian (70017 for Core v32.1)
 * services        8   bit field of what this node offers
 * timestamp       8   Unix time in seconds
 * addr_recv      26   the recipient: services (8), IPv6 address (16), port (2, big-endian)
 * addr_from      26   the sender, same layout
 * nonce           8   random, lets a node detect a connection to itself
 * user_agent      n   CompactSize length, then the text, e.g. "/Satoshi:32.1.0/"
 * start_height    4   height of the sender's best block
 * relay           1   1 if the sender wants transactions announced to it
 * ```
 *
 * There are no address parameters. Both addresses are sent as zeros, which is
 * what Bitcoin Core always sends for its own address, and for the recipient's
 * when that address is not routable. The sender's services repeat `services`,
 * as in Core; the recipient's services are sent as 0, meaning unknown.
 *
 * @throws RangeError if a number does not fit its field or the user agent
 * exceeds 256 bytes of UTF-8.
 */
export function encodeVersion(o: {
  version: number;
  services: bigint;
  timestamp: bigint;
  nonce: bigint;
  userAgent: string;
  startHeight: number;
  relay: boolean;
}): Uint8Array {
  const userAgent = utf8(o.userAgent);
  if (userAgent.length > MAX_USER_AGENT_BYTES) {
    throw new RangeError(`user agent must be at most ${MAX_USER_AGENT_BYTES} bytes, got ${userAgent.length}`);
  }
  if (o.timestamp < 0n || o.timestamp > 0x7fffffffffffffffn) {
    throw new RangeError('timestamp must be within 0 … 2^63 − 1');
  }
  return concatBytes(
    int32le(o.version, 'version'),
    u64le(o.services),
    u64le(o.timestamp),
    u64le(0n), EMPTY_ADDRESS,
    u64le(o.services), EMPTY_ADDRESS,
    u64le(o.nonce),
    varInt(userAgent.length), userAgent,
    int32le(o.startHeight, 'startHeight'),
    Uint8Array.of(o.relay ? 1 : 0),
  );
}

/**
 * Builds the payload shared by `inv` ("I have these") and `getdata` ("send me
 * these"): a CompactSize count, then per entry a 4-byte little-endian type and
 * a 32-byte hash.
 *
 * Byte order: `hash` is given in display order, like every hash in this app,
 * and written to the payload reversed, as the wire carries it.
 *
 * @param items `type` 1 is MSG_TX (a transaction id), 2 is MSG_BLOCK (a block hash)
 * @throws RangeError if a hash is not 64 hex characters or a type is not an
 * unsigned 32-bit integer.
 */
export function encodeInv(items: { type: number; hash: string }[]): Uint8Array {
  return concatBytes(
    varInt(items.length),
    ...items.flatMap((item) => [u32le(item.type), hashToWire(item.hash)]),
  );
}

/**
 * One labelled stretch of a message, for colouring a hex view: the bytes
 * `start` (inclusive) to `end` (exclusive), and their decoded `value` as text.
 */
export interface Segment {
  name: string;
  start: number;
  end: number;
  value: string;
}

/** Names of the inventory types (src/protocol.h:497-510). */
const INVENTORY_TYPES = new Map<number, string>([
  [1, 'MSG_TX'],
  [2, 'MSG_BLOCK'],
  [3, 'MSG_FILTERED_BLOCK'],
  [4, 'MSG_CMPCT_BLOCK'],
  [5, 'MSG_WTX'],
  [0x40000001, 'MSG_WITNESS_TX'],
  [0x40000002, 'MSG_WITNESS_BLOCK'],
]);

/** Raised by a payload layout when the bytes run out before the fields do. */
class Truncated extends Error {}

const littleEndian = (field: Uint8Array): bigint => BigInt(`0x${bytesToHex(reverseBytes(field))}`);
const decimal = (field: Uint8Array): string => littleEndian(field).toString();
const bitField = (field: Uint8Array): string => `0x${littleEndian(field).toString(16)}`;
const text = (field: Uint8Array): string => new TextDecoder().decode(field);
/** The command name: the bytes before the first zero (`GetMessageType`, src/protocol.cpp:21-24). */
const commandName = (field: Uint8Array): string => {
  const end = field.indexOf(0);
  return text(end < 0 ? field : field.subarray(0, end));
};

/** Reads fields one after another from `bytes`, recording a segment for each. */
function createReader(bytes: Uint8Array, start: number) {
  const segments: Segment[] = [];
  let at = start;

  /** Consumes `size` bytes as one field. A field of zero bytes leaves no segment. */
  const take = (name: string, size: number, show: (field: Uint8Array) => string): Uint8Array => {
    if (at + size > bytes.length) throw new Truncated();
    const field = bytes.subarray(at, at + size);
    if (size > 0) segments.push({ name, start: at, end: at + size, value: show(field) });
    at += size;
    return field;
  };

  /** Consumes a CompactSize: one byte, or a marker byte and 2, 4 or 8 more. */
  const takeCompactSize = (name: string): number => {
    const marker = bytes[at];
    const width = marker === 0xfd ? 3 : marker === 0xfe ? 5 : marker === 0xff ? 9 : 1;
    const value = (field: Uint8Array): bigint => littleEndian(width === 1 ? field : field.subarray(1));
    return Number(value(take(name, width, (field) => value(field).toString())));
  };

  return { segments, take, takeCompactSize, atEnd: () => at === bytes.length };
}

type Reader = ReturnType<typeof createReader>;

function readVersion(reader: Reader): void {
  reader.take('version', 4, decimal);
  reader.take('services', 8, bitField);
  reader.take('timestamp', 8, decimal);
  for (const peer of ['addr_recv', 'addr_from']) {
    reader.take(`${peer}_services`, 8, bitField);
    reader.take(`${peer}_ip`, 16, bytesToHex);
    reader.take(`${peer}_port`, 2, (field) => String((field[0] << 8) | field[1]));
  }
  reader.take('nonce', 8, bitField);
  reader.take('user_agent', reader.takeCompactSize('user_agent_length'), text);
  reader.take('start_height', 4, decimal);
  reader.take('relay', 1, (field) => String(field[0] !== 0));
}

function readInventory(reader: Reader): void {
  const count = reader.takeCompactSize('count');
  for (let i = 0; i < count; i++) {
    reader.take('type', 4, (field) => INVENTORY_TYPES.get(Number(littleEndian(field))) ?? decimal(field));
    reader.take('hash', 32, wireToHash);
  }
}

/** Payloads whose fields `annotateMessage` can label, by command. */
const PAYLOAD_LAYOUTS = new Map<string, (reader: Reader) => void>([
  ['version', readVersion],
  ['inv', readInventory],
  ['getdata', readInventory],
]);

/**
 * Splits a message into labelled segments that follow one another without
 * gaps and together cover every byte, so a hex view can colour each field.
 *
 * The first four segments are always the header: `magic` (hex), `command`
 * (the name), `length` (the declared payload size, decimal) and `checksum`
 * (hex). What follows depends on the command:
 *
 * - `version`: `version`, `services`, `timestamp`, `addr_recv_services`,
 *   `addr_recv_ip`, `addr_recv_port`, `addr_from_services`, `addr_from_ip`,
 *   `addr_from_port`, `nonce`, `user_agent_length`, `user_agent`,
 *   `start_height`, `relay`;
 * - `inv` and `getdata`: `count`, then a `type` and a `hash` per entry;
 * - an empty payload: nothing more;
 * - anything else, and any payload above that does not parse exactly (an older
 *   `version` without the relay flag, a truncated message): one `payload`
 *   segment holding the bytes as hex.
 *
 * Values are text for display: counts, heights and times in decimal, service
 * bits and the nonce as `0x…`, addresses as hex, ports in decimal, `relay` as
 * `true` or `false`, inventory types by name (`MSG_TX`, `MSG_BLOCK`, …).
 *
 * Byte order: a `hash` value is in display order, the reverse of the bytes it
 * labels, so it can be compared with the txid or block hash shown elsewhere.
 *
 * @throws RangeError if `bytes` is shorter than the 24-byte header.
 */
export function annotateMessage(bytes: Uint8Array): Segment[] {
  if (bytes.length < HEADER_SIZE) {
    throw new RangeError(`a message starts with a ${HEADER_SIZE}-byte header, got ${bytes.length} bytes`);
  }
  const header = createReader(bytes, 0);
  header.take('magic', 4, bytesToHex);
  const command = commandName(header.take('command', COMMAND_SIZE, commandName));
  header.take('length', 4, decimal);
  header.take('checksum', 4, bytesToHex);
  if (bytes.length === HEADER_SIZE) return header.segments;

  const layout = PAYLOAD_LAYOUTS.get(command);
  if (layout) {
    const payload = createReader(bytes, HEADER_SIZE);
    try {
      layout(payload);
      if (payload.atEnd()) return [...header.segments, ...payload.segments];
    } catch (error) {
      if (!(error instanceof Truncated)) throw error;
    }
  }
  return [
    ...header.segments,
    { name: 'payload', start: HEADER_SIZE, end: bytes.length, value: bytesToHex(bytes.subarray(HEADER_SIZE)) },
  ];
}
