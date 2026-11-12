// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { bytesToHex, hexToBytes } from '../bytes';
import { sha256d } from '../hash';
import {
  MAINNET_MAGIC, annotateMessage, encodeInv, encodeMessage, encodeVersion,
} from './messages';
import type { Segment } from './messages';

const TX = 'f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16';
const TX_WIRE = '169e1e83e930853391bc6f35f605c6754cfead57cf8387639d3b4096c54f18f4';
const BLOCK = '00000000d1145790a8694403d4063f323d499e655c83426834d4ce2f8dd4a2ee';
const BLOCK_WIRE = 'eea2d48d2fced4346842835c659e493d323f06d4034469a8905714d100000000';

const VERSION_OPTIONS = {
  version: 70017,
  services: 0xc09n,
  timestamp: 1231006505n,
  nonce: 0x1234567890abcdefn,
  userAgent: '/Satoshi:32.1.0/',
  startHeight: 170,
  relay: true,
};

// The same payload produced by a separate script that shares no code with this
// project, following the field order Bitcoin Core v32.1 sends.
const VERSION_PAYLOAD = [
  '81110100', // protocol version 70017
  '090c000000000000', // services 0xc09
  '29ab5f4900000000', // timestamp 1231006505
  '0000000000000000' + '00'.repeat(16) + '0000', // recipient: services, address, port
  '090c000000000000' + '00'.repeat(16) + '0000', // sender: services, address, port
  'efcdab9078563412', // nonce
  '10' + '2f5361746f7368693a33322e312e302f', // length 16, "/Satoshi:32.1.0/"
  'aa000000', // start height 170
  '01', // relay
].join('');

// A version message captured from a 0.7.2 client, as hex-dumped in the Bitcoin
// wiki's protocol documentation. It predates the relay flag.
const CAPTURED_HEADER = 'f9beb4d9' + '76657273696f6e0000000000' + '64000000' + '358d4932';
const CAPTURED_PAYLOAD = [
  '62ea0000', // protocol version 60002
  '0100000000000000', // services: NODE_NETWORK
  '11b2d05000000000', // timestamp 1355854353
  '0100000000000000' + '00000000000000000000ffff00000000' + '0000',
  '0000000000000000' + '00000000000000000000ffff00000000' + '0000',
  '3b2eb35d8ce61765', // nonce
  '0f' + '2f5361746f7368693a302e372e322f', // length 15, "/Satoshi:0.7.2/"
  'c03e0300', // start height 212672
].join('');

function expectContiguous(segments: Segment[], totalBytes: number): void {
  expect(segments[0].start).toBe(0);
  segments.forEach((segment, i) => {
    expect(segment.end).toBeGreaterThan(segment.start);
    if (i > 0) expect(segment.start).toBe(segments[i - 1].end);
  });
  expect(segments[segments.length - 1].end).toBe(totalBytes);
}

describe('encodeMessage', () => {
  it('uses the mainnet magic bytes', () => {
    expect(bytesToHex(MAINNET_MAGIC)).toBe('f9beb4d9');
  });
  it('encodes verack: a header and nothing else', () => {
    expect(bytesToHex(encodeMessage('verack', new Uint8Array(0)))).toBe(
      'f9beb4d9' + '76657261636b000000000000' + '00000000' + '5df6e0e2',
    );
  });
  it('reproduces the header of a captured version message, length and checksum included', () => {
    const message = encodeMessage('version', hexToBytes(CAPTURED_PAYLOAD));
    expect(bytesToHex(message)).toBe(CAPTURED_HEADER + CAPTURED_PAYLOAD);
  });
  it('takes the checksum from the first four bytes of the double hash of the payload', () => {
    const payload = new Uint8Array(8);
    const message = encodeMessage('ping', payload);
    expect(bytesToHex(message.subarray(20, 24))).toBe('7ef0ca62');
    expect(bytesToHex(message.subarray(20, 24))).toBe(bytesToHex(sha256d(payload).subarray(0, 4)));
    expect(bytesToHex(message.subarray(16, 20))).toBe('08000000');
    expect(message).toHaveLength(24 + 8);
  });
  it('pads the command with zero bytes to exactly twelve', () => {
    expect(bytesToHex(encodeMessage('tx', new Uint8Array(0)).subarray(4, 16))).toBe('7478' + '00'.repeat(10));
    expect(bytesToHex(encodeMessage('abcdefghijkl', new Uint8Array(0)).subarray(4, 16))).toBe('6162636465666768696a6b6c');
  });
  it('rejects a command longer than twelve bytes', () => {
    expect(() => encodeMessage('abcdefghijklm', new Uint8Array(0))).toThrow(RangeError);
  });
  it('rejects a command with characters outside printable ASCII', () => {
    expect(() => encodeMessage('vérack', new Uint8Array(0))).toThrow(RangeError);
    expect(() => encodeMessage('ver\u0000ack', new Uint8Array(0))).toThrow(RangeError);
    expect(() => encodeMessage('ver\nack', new Uint8Array(0))).toThrow(RangeError);
  });
  it('does not alias the payload it was given', () => {
    const payload = hexToBytes('0102030405060708');
    const message = encodeMessage('ping', payload);
    payload[0] = 0xff;
    expect(bytesToHex(message.subarray(24))).toBe('0102030405060708');
  });
});

describe('encodeVersion', () => {
  const payload = encodeVersion(VERSION_OPTIONS);

  it('matches an independently built payload byte for byte', () => {
    expect(bytesToHex(payload)).toBe(VERSION_PAYLOAD);
    expect(payload).toHaveLength(102);
  });
  it('starts with the protocol version as a little-endian 32-bit integer', () => {
    expect(bytesToHex(payload.subarray(0, 4))).toBe('81110100');
    expect(new DataView(payload.buffer, payload.byteOffset).getUint32(0, true)).toBe(70017);
  });
  it('puts the CompactSize length of the user agent right before it', () => {
    expect(payload[80]).toBe(16);
    expect(new TextDecoder().decode(payload.subarray(81, 97))).toBe('/Satoshi:32.1.0/');
  });
  it('sends both network addresses as zeros and repeats its services for the sender', () => {
    expect(bytesToHex(payload.subarray(20, 46))).toBe('00'.repeat(26));
    expect(bytesToHex(payload.subarray(46, 54))).toBe('090c000000000000');
    expect(bytesToHex(payload.subarray(54, 72))).toBe('00'.repeat(18));
  });
  it('ends with the start height and the relay flag', () => {
    expect(bytesToHex(payload.subarray(97))).toBe('aa000000' + '01');
    const quiet = encodeVersion({ ...VERSION_OPTIONS, relay: false, startHeight: 0 });
    expect(bytesToHex(quiet.subarray(97))).toBe('00000000' + '00');
  });
  it('accepts an empty user agent', () => {
    const bare = encodeVersion({ ...VERSION_OPTIONS, userAgent: '' });
    expect(bare).toHaveLength(86);
    expect(bare[80]).toBe(0);
  });
  it('switches to a three-byte CompactSize for a user agent of 253 bytes or more', () => {
    const long = encodeVersion({ ...VERSION_OPTIONS, userAgent: 'a'.repeat(256) });
    expect(bytesToHex(long.subarray(80, 83))).toBe('fd0001');
    expect(long).toHaveLength(85 + 3 + 256);
  });
  it('rejects a user agent over the 256-byte limit peers enforce', () => {
    expect(() => encodeVersion({ ...VERSION_OPTIONS, userAgent: 'a'.repeat(257) })).toThrow(RangeError);
    expect(() => encodeVersion({ ...VERSION_OPTIONS, userAgent: '幣'.repeat(86) })).toThrow(RangeError);
  });
  it('rejects fields that do not fit their width', () => {
    expect(() => encodeVersion({ ...VERSION_OPTIONS, version: -1 })).toThrow(RangeError);
    expect(() => encodeVersion({ ...VERSION_OPTIONS, version: 2 ** 31 })).toThrow(RangeError);
    expect(() => encodeVersion({ ...VERSION_OPTIONS, startHeight: 1.5 })).toThrow(RangeError);
    expect(() => encodeVersion({ ...VERSION_OPTIONS, startHeight: 2 ** 31 })).toThrow(RangeError);
    expect(() => encodeVersion({ ...VERSION_OPTIONS, services: -1n })).toThrow(RangeError);
    expect(() => encodeVersion({ ...VERSION_OPTIONS, nonce: 1n << 64n })).toThrow(RangeError);
    expect(() => encodeVersion({ ...VERSION_OPTIONS, timestamp: -1n })).toThrow(RangeError);
    expect(() => encodeVersion({ ...VERSION_OPTIONS, timestamp: 1n << 63n })).toThrow(RangeError);
  });
});

describe('encodeInv', () => {
  it('encodes one transaction as a count, a type and the hash back to front: 37 bytes', () => {
    const payload = encodeInv([{ type: 1, hash: TX }]);
    expect(bytesToHex(payload)).toBe('01' + '01000000' + TX_WIRE);
    expect(payload).toHaveLength(37);
  });
  it('keeps entries in order and marks a block with type 2', () => {
    const payload = encodeInv([{ type: 1, hash: TX }, { type: 2, hash: BLOCK }]);
    expect(bytesToHex(payload)).toBe('02' + '01000000' + TX_WIRE + '02000000' + BLOCK_WIRE);
  });
  it('encodes an empty inventory as a zero count', () => {
    expect(bytesToHex(encodeInv([]))).toBe('00');
  });
  it('switches to a three-byte count from 253 entries', () => {
    const payload = encodeInv(Array.from({ length: 253 }, () => ({ type: 1, hash: TX })));
    expect(bytesToHex(payload.subarray(0, 3))).toBe('fdfd00');
    expect(payload).toHaveLength(3 + 253 * 36);
  });
  it('accepts the witness flag in the type', () => {
    expect(bytesToHex(encodeInv([{ type: 0x40000001, hash: TX }]).subarray(1, 5))).toBe('01000040');
  });
  it('rejects a hash that is not 32 bytes and a type that is not an unsigned 32-bit integer', () => {
    expect(() => encodeInv([{ type: 1, hash: 'abcd' }])).toThrow(RangeError);
    expect(() => encodeInv([{ type: -1, hash: TX }])).toThrow(RangeError);
    expect(() => encodeInv([{ type: 2 ** 32, hash: TX }])).toThrow(RangeError);
  });
});

describe('annotateMessage', () => {
  it('splits verack into the four header fields', () => {
    expect(annotateMessage(encodeMessage('verack', new Uint8Array(0)))).toEqual([
      { name: 'magic', start: 0, end: 4, value: 'f9beb4d9' },
      { name: 'command', start: 4, end: 16, value: 'verack' },
      { name: 'length', start: 16, end: 20, value: '0' },
      { name: 'checksum', start: 20, end: 24, value: '5df6e0e2' },
    ]);
  });
  it('labels every field of a version message', () => {
    const message = encodeMessage('version', encodeVersion(VERSION_OPTIONS));
    const segments = annotateMessage(message);
    expect(segments).toEqual([
      { name: 'magic', start: 0, end: 4, value: 'f9beb4d9' },
      { name: 'command', start: 4, end: 16, value: 'version' },
      { name: 'length', start: 16, end: 20, value: '102' },
      { name: 'checksum', start: 20, end: 24, value: '39c172e4' },
      { name: 'version', start: 24, end: 28, value: '70017' },
      { name: 'services', start: 28, end: 36, value: '0xc09' },
      { name: 'timestamp', start: 36, end: 44, value: '1231006505' },
      { name: 'addr_recv_services', start: 44, end: 52, value: '0x0' },
      { name: 'addr_recv_ip', start: 52, end: 68, value: '00'.repeat(16) },
      { name: 'addr_recv_port', start: 68, end: 70, value: '0' },
      { name: 'addr_from_services', start: 70, end: 78, value: '0xc09' },
      { name: 'addr_from_ip', start: 78, end: 94, value: '00'.repeat(16) },
      { name: 'addr_from_port', start: 94, end: 96, value: '0' },
      { name: 'nonce', start: 96, end: 104, value: '0x1234567890abcdef' },
      { name: 'user_agent_length', start: 104, end: 105, value: '16' },
      { name: 'user_agent', start: 105, end: 121, value: '/Satoshi:32.1.0/' },
      { name: 'start_height', start: 121, end: 125, value: '170' },
      { name: 'relay', start: 125, end: 126, value: 'true' },
    ]);
    expectContiguous(segments, message.length);
  });
  it('reads the port as big-endian and the relay flag as a boolean', () => {
    const payload = encodeVersion({ ...VERSION_OPTIONS, relay: false });
    payload.set(hexToBytes('208d'), 44); // recipient port 8333
    const segments = annotateMessage(encodeMessage('version', payload));
    expect(segments.find((s) => s.name === 'addr_recv_port')?.value).toBe('8333');
    expect(segments.find((s) => s.name === 'relay')?.value).toBe('false');
  });
  it('covers a multi-byte CompactSize with a single segment', () => {
    const message = encodeMessage('version', encodeVersion({ ...VERSION_OPTIONS, userAgent: 'a'.repeat(253) }));
    const segments = annotateMessage(message);
    expect(segments.find((s) => s.name === 'user_agent_length')).toEqual(
      { name: 'user_agent_length', start: 104, end: 107, value: '253' },
    );
    expect(segments.find((s) => s.name === 'user_agent')).toEqual(
      { name: 'user_agent', start: 107, end: 360, value: 'a'.repeat(253) },
    );
    expectContiguous(segments, message.length);
  });
  it('emits no zero-width segment for an empty user agent', () => {
    const message = encodeMessage('version', encodeVersion({ ...VERSION_OPTIONS, userAgent: '' }));
    const segments = annotateMessage(message);
    expect(segments.map((s) => s.name).slice(13)).toEqual(['nonce', 'user_agent_length', 'start_height', 'relay']);
    expect(segments.find((s) => s.name === 'user_agent_length')?.value).toBe('0');
    expectContiguous(segments, message.length);
  });
  it('labels every entry of an inv message and shows hashes in display order', () => {
    const message = encodeMessage('inv', encodeInv([{ type: 1, hash: TX }, { type: 2, hash: BLOCK }]));
    const segments = annotateMessage(message);
    expect(segments.slice(1, 4)).toEqual([
      { name: 'command', start: 4, end: 16, value: 'inv' },
      { name: 'length', start: 16, end: 20, value: '73' },
      { name: 'checksum', start: 20, end: 24, value: '41bb6371' },
    ]);
    expect(segments.slice(4)).toEqual([
      { name: 'count', start: 24, end: 25, value: '2' },
      { name: 'type', start: 25, end: 29, value: 'MSG_TX' },
      { name: 'hash', start: 29, end: 61, value: TX },
      { name: 'type', start: 61, end: 65, value: 'MSG_BLOCK' },
      { name: 'hash', start: 65, end: 97, value: BLOCK },
    ]);
    expectContiguous(segments, message.length);
  });
  it('reads getdata the same way as inv', () => {
    const segments = annotateMessage(encodeMessage('getdata', encodeInv([{ type: 0x40000001, hash: TX }])));
    expect(segments.slice(4).map((s) => [s.name, s.value])).toEqual([
      ['count', '1'], ['type', 'MSG_WITNESS_TX'], ['hash', TX],
    ]);
  });
  it('shows an inventory type it has no name for as a number', () => {
    const segments = annotateMessage(encodeMessage('inv', encodeInv([{ type: 99, hash: TX }])));
    expect(segments[5]).toEqual({ name: 'type', start: 25, end: 29, value: '99' });
  });
  it('keeps the payload of other messages as one segment', () => {
    const message = encodeMessage('ping', hexToBytes('0102030405060708'));
    const segments = annotateMessage(message);
    expect(segments).toHaveLength(5);
    expect(segments[4]).toEqual({ name: 'payload', start: 24, end: 32, value: '0102030405060708' });
    expectContiguous(segments, message.length);
  });
  it('keeps a version payload in an older layout as one segment', () => {
    const message = hexToBytes(CAPTURED_HEADER + CAPTURED_PAYLOAD);
    const segments = annotateMessage(message);
    expect(segments.slice(0, 4).map((s) => s.value)).toEqual(['f9beb4d9', 'version', '100', '358d4932']);
    expect(segments[4]).toEqual({ name: 'payload', start: 24, end: 124, value: CAPTURED_PAYLOAD });
    expectContiguous(segments, message.length);
  });
  it('falls back to one payload segment when a known payload is cut short or has bytes left over', () => {
    const inv = encodeInv([{ type: 1, hash: TX }]);
    for (const payload of [inv.subarray(0, 30), hexToBytes(bytesToHex(inv) + '00'), hexToBytes('05')]) {
      const message = encodeMessage('inv', payload);
      const segments = annotateMessage(message);
      expect(segments).toHaveLength(5);
      expect(segments[4]).toEqual({ name: 'payload', start: 24, end: message.length, value: bytesToHex(payload) });
      expectContiguous(segments, message.length);
    }
  });
  it('treats an empty inv as a count of zero', () => {
    const segments = annotateMessage(encodeMessage('inv', encodeInv([])));
    expect(segments.slice(4)).toEqual([{ name: 'count', start: 24, end: 25, value: '0' }]);
  });
  it('still covers every byte when the payload is not as long as the header says', () => {
    const message = encodeMessage('ping', hexToBytes('0102030405060708')).subarray(0, 28);
    const segments = annotateMessage(message);
    expect(segments[2].value).toBe('8');
    expect(segments[4]).toEqual({ name: 'payload', start: 24, end: 28, value: '01020304' });
    expectContiguous(segments, message.length);
  });
  it('names the first four segments magic, command, length and checksum for any message', () => {
    for (const message of [
      encodeMessage('verack', new Uint8Array(0)),
      encodeMessage('version', encodeVersion(VERSION_OPTIONS)),
      encodeMessage('inv', encodeInv([{ type: 1, hash: TX }])),
      encodeMessage('tx', hexToBytes('00'.repeat(60))),
    ]) {
      const segments = annotateMessage(message);
      expect(segments.slice(0, 4).map((s) => s.name)).toEqual(['magic', 'command', 'length', 'checksum']);
      expectContiguous(segments, message.length);
    }
  });
  it('reads the command up to its first zero byte, as Bitcoin Core does', () => {
    const message = encodeMessage('abcdef', new Uint8Array(0));
    message.set([0x61, 0x62, 0x00, 0x64, 0x65, 0x66], 4); // "ab", a zero byte, then "def"
    expect(annotateMessage(message)[1]).toEqual({ name: 'command', start: 4, end: 16, value: 'ab' });
  });
  it('rejects input shorter than a header', () => {
    expect(() => annotateMessage(new Uint8Array(23))).toThrow(RangeError);
    expect(() => annotateMessage(new Uint8Array(0))).toThrow(RangeError);
  });
});

describe('inventory type names', () => {
  it.each([
    [1, 'MSG_TX'],
    [2, 'MSG_BLOCK'],
    [3, 'MSG_FILTERED_BLOCK'],
    [4, 'MSG_CMPCT_BLOCK'],
    [5, 'MSG_WTX'],
    [0x40000001, 'MSG_WITNESS_TX'],
    [0x40000002, 'MSG_WITNESS_BLOCK'],
    [6, '6'],
    [0x80000002, '2147483650'],
  ])('shows type %i as %s', (type, name) => {
    expect(annotateMessage(encodeMessage('getdata', encodeInv([{ type, hash: TX }])))[5].value).toBe(name);
  });
});
