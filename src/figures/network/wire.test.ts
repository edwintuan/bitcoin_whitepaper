// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { bytesToHex, concatBytes, hexToBytes, u32le, varInt, wireToHash } from '@/lib/bytes';
import { sha256d } from '@/lib/hash';
import { headerHash } from '@/lib/header';
import { verify } from '@/lib/keys';
import { merkleRoot } from '@/lib/merkle';
import { MAINNET_MAGIC, annotateMessage, encodeInv, encodeMessage } from '@/lib/p2p/messages';
import type { Segment } from '@/lib/p2p/messages';
import { COPY } from './copy';
import {
  EXAMPLE,
  HEADER_SIZE,
  PAYMENT_RAW,
  PAYMENT_TXID,
  conversation,
  damage,
  fieldOf,
  payloadHash,
  showValue,
  spaced,
  verifyChecksum,
} from './wire';

function expectContiguous(segments: Segment[], from: number, to: number): void {
  expect(segments[0].start).toBe(from);
  segments.forEach((segment, i) => {
    expect(segment.end).toBeGreaterThan(segment.start);
    if (i > 0) expect(segment.start).toBe(segments[i - 1].end);
  });
  expect(segments[segments.length - 1].end).toBe(to);
}

const valueOf = (segments: Segment[], name: string) => segments.find((segment) => segment.name === name)?.value;

describe('the transaction the scene carries', () => {
  it('is real: its 275 bytes hash to the id of a transaction on the main chain', () => {
    expect(PAYMENT_RAW).toHaveLength(275);
    expect(wireToHash(sha256d(PAYMENT_RAW))).toBe(PAYMENT_TXID);
    expect(PAYMENT_TXID).toBe('f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16');
  });

  it('sits in block 170 of the main chain', () => {
    // The block's two transaction ids give its Merkle root, and the header with that root hashes to the block hash.
    const coinbase = 'b1fea52486ce0c62bb442b530a3f0132b826c74e473d1f2c220bfa78111c5082';
    const header = {
      version: 1,
      prevHash: '000000002a22cfee1f2c846adbd12b3e183d4f97683f85dad08a79780a84bd55',
      merkleRoot: merkleRoot([coinbase, PAYMENT_TXID]),
      time: 1231731025,
      bits: 0x1d00ffff,
      nonce: 1889418792,
    };
    expect(headerHash(header)).toBe('00000000d1145790a8694403d4063f323d499e655c83426834d4ce2f8dd4a2ee');
    // The date the page gives is the one in that header.
    expect(new Date(header.time * 1000).toISOString()).toBe('2009-01-12T03:30:25.000Z');
  });

  it('pays 10 BTC to one key and returns 40 BTC to the key that signed it: a payment and its change', () => {
    // The fields of the `tx` message, as the engine labels them; positions count from the start of the message.
    const tx = conversation()[6];
    const part = (name: string) => {
      const segment = tx.segments.find((candidate) => candidate.name === name);
      if (!segment) throw new Error(`no field ${name}`);
      return { ...segment, bytes: tx.bytes.subarray(segment.start, segment.end) };
    };
    const signatureScript = part('tx_in0_script');
    const payment = part('tx_out0_script');
    const change = part('tx_out1_script');

    // One push of 71 bytes: a DER signature (r and s, 32 bytes each) and the hash type "all".
    expect(bytesToHex(signatureScript.bytes.subarray(0, 5))).toBe('4730440220');
    expect(bytesToHex(signatureScript.bytes.subarray(37, 39))).toBe('0220');
    expect(signatureScript.bytes[71]).toBe(1);
    const signature = concatBytes(signatureScript.bytes.subarray(5, 37), signatureScript.bytes.subarray(39, 71));

    // What was signed: the transaction with the script of the spent output in place of the signature, then the hash type.
    const signed = (spentScript: Uint8Array) =>
      sha256d(
        concatBytes(
          tx.bytes.subarray(HEADER_SIZE, part('tx_in0_script_length').start),
          varInt(spentScript.length),
          spentScript,
          tx.bytes.subarray(signatureScript.end),
          u32le(1),
        ),
      );

    // Both outputs are "<65-byte public key> OP_CHECKSIG".
    const keyOf = (script: Uint8Array) => script.subarray(1, 66);
    for (const script of [payment.bytes, change.bytes]) {
      expect(script).toHaveLength(67);
      expect([script[0], script[66]]).toEqual([0x41, 0xac]);
    }

    // The signature is good if the coin being spent was locked to the key of output 1, and only then.
    expect(verify(signature, signed(change.bytes), keyOf(change.bytes))).toBe(true);
    expect(verify(signature, signed(payment.bytes), keyOf(payment.bytes))).toBe(false);
    expect(verify(signature, signed(change.bytes), keyOf(payment.bytes))).toBe(false);

    // Amounts in satoshis: 10 BTC and 40 BTC.
    expect(valueOf(tx.segments, 'tx_out0_value')).toBe('1000000000');
    expect(valueOf(tx.segments, 'tx_out1_value')).toBe('4000000000');
  });
});

describe('conversation', () => {
  const messages = conversation();

  it('is seven messages: both sides introduce themselves and acknowledge, then one transaction is announced, asked for and sent', () => {
    expect(messages.map((message) => [message.from, message.command])).toEqual([
      ['a', 'version'],
      ['b', 'version'],
      ['b', 'verack'],
      ['a', 'verack'],
      ['a', 'inv'],
      ['b', 'getdata'],
      ['a', 'tx'],
    ]);
    expect(new Set(messages.map((message) => message.id)).size).toBe(7);
  });

  it('frames every message the same way, with a checksum that verifies', () => {
    for (const message of messages) {
      const header = annotateMessage(message.bytes).slice(0, 4);
      expect(bytesToHex(message.bytes.subarray(0, 4))).toBe(bytesToHex(MAINNET_MAGIC));
      expect(header[1].value).toBe(message.command);
      expect(header[2].value).toBe(String(message.bytes.length - 24));
      expect(verifyChecksum(message.bytes).ok).toBe(true);
    }
  });

  it('labels every byte of every message, with names that are unique within it', () => {
    for (const message of messages) {
      expectContiguous(message.segments, 0, message.bytes.length);
      const names = message.segments.map((segment) => segment.name);
      expect(new Set(names).size, message.id).toBe(names.length);
      expect(names.slice(0, 4)).toEqual(['magic', 'command', 'length', 'checksum']);
    }
  });

  it('has both nodes report the same software, services and height', () => {
    for (const message of [messages[0], messages[1]]) {
      expect(valueOf(message.segments, 'version')).toBe('70017');
      expect(valueOf(message.segments, 'services')).toBe('0x409');
      expect(valueOf(message.segments, 'user_agent')).toBe('/Satoshi:32.1.0/');
      expect(valueOf(message.segments, 'start_height')).toBe(String(EXAMPLE.height));
      expect(valueOf(message.segments, 'relay')).toBe('true');
      expect(message.bytes).toHaveLength(24 + 102);
    }
    expect(EXAMPLE.height).toBe(966_143);
  });

  it('sets the clocks a minute after the block both nodes report as their best', () => {
    expect(valueOf(messages[0].segments, 'timestamp')).toBe(String(EXAMPLE.blockTime + 60n));
    expect(valueOf(messages[1].segments, 'timestamp')).toBe(String(EXAMPLE.blockTime + 61n));
    expect(EXAMPLE.blockTime).toBe(1_788_925_573n);
  });

  it('gives each side its own nonce, the same on every visit', () => {
    const a = valueOf(messages[0].segments, 'nonce');
    const b = valueOf(messages[1].segments, 'nonce');
    expect(a).toMatch(/^0x[0-9a-f]{9,16}$/);
    expect(a).not.toBe(b);
    expect(valueOf(conversation()[0].segments, 'nonce')).toBe(a);
  });

  it('acknowledges with an empty message: a header and nothing else', () => {
    for (const message of [messages[2], messages[3]]) {
      expect(message.bytes).toHaveLength(24);
      expect(message.segments).toHaveLength(4);
      expect(valueOf(message.segments, 'checksum')).toBe('5df6e0e2');
    }
  });

  it('announces and requests the transaction by the same hash and type', () => {
    const [inv, getdata] = [messages[4], messages[5]];
    for (const message of [inv, getdata]) {
      expect(message.bytes).toHaveLength(24 + 37);
      expect(valueOf(message.segments, 'count')).toBe('1');
      expect(valueOf(message.segments, 'type')).toBe('MSG_WTX');
      expect(valueOf(message.segments, 'hash')).toBe(PAYMENT_TXID);
    }
    expect(bytesToHex(inv.bytes.subarray(24))).toBe(bytesToHex(encodeInv([{ type: 5, hash: PAYMENT_TXID }])));
    expect(bytesToHex(inv.bytes.subarray(24))).toBe(bytesToHex(getdata.bytes.subarray(24)));
  });

  it('delivers the transaction itself: the payload hashes to the hash that was asked for', () => {
    const tx = messages[6];
    expect(tx.bytes).toHaveLength(24 + 275);
    expect(bytesToHex(tx.bytes.subarray(24))).toBe(bytesToHex(PAYMENT_RAW));
    expect(payloadHash(tx.bytes)).toBe(PAYMENT_TXID);
    // After the header, the transaction's own fields, from its version to its lock time.
    const fields = tx.segments.slice(4).map((segment) => segment.name);
    expect(fields).toHaveLength(15);
    expect(fields[0]).toBe('tx_version');
    expect(fields[14]).toBe('tx_lock_time');
    // Both are the double SHA-256 of the same bytes, so the checksum is the id's first four bytes on the wire.
    expect(valueOf(tx.segments, 'checksum')).toBe('169e1e83');
    expect(bytesToHex(hexToBytes(PAYMENT_TXID).reverse().subarray(0, 4))).toBe('169e1e83');
  });

  it('re-encodes node A’s introduction when its user agent is changed', () => {
    const changed = conversation({ userAgent: '/Satoshi:32.1.0(my node)/' });
    expect(valueOf(changed[0].segments, 'user_agent')).toBe('/Satoshi:32.1.0(my node)/');
    expect(valueOf(changed[0].segments, 'user_agent_length')).toBe('25');
    expect(valueOf(changed[0].segments, 'length')).toBe(String(102 + 9));
    expect(valueOf(changed[0].segments, 'checksum')).not.toBe(valueOf(messages[0].segments, 'checksum'));
    expect(verifyChecksum(changed[0].bytes).ok).toBe(true);
    for (let i = 1; i < 7; i++) expect(bytesToHex(changed[i].bytes)).toBe(bytesToHex(messages[i].bytes));
  });

  it('accepts an empty user agent and any script', () => {
    const empty = conversation({ userAgent: '' });
    expect(valueOf(empty[0].segments, 'user_agent_length')).toBe('0');
    expect(valueOf(empty[0].segments, 'user_agent')).toBeUndefined();
    expectContiguous(empty[0].segments, 0, empty[0].bytes.length);
    const chinese = conversation({ userAgent: '節點' });
    expect(valueOf(chinese[0].segments, 'user_agent')).toBe('節點');
    expect(valueOf(chinese[0].segments, 'user_agent_length')).toBe('6');
  });

  it('rejects a user agent longer than peers accept', () => {
    expect(() => conversation({ userAgent: 'a'.repeat(257) })).toThrow(RangeError);
  });
});

describe('verifyChecksum', () => {
  it('recomputes the double hash of the payload and compares its first four bytes with the header', () => {
    const message = conversation()[0].bytes;
    const check = verifyChecksum(message);
    expect(check.digest).toBe(bytesToHex(sha256d(message.subarray(24))));
    expect(check.digest).toHaveLength(64);
    expect(check.computed).toBe(check.digest.slice(0, 8));
    expect(check.declared).toBe(bytesToHex(message.subarray(20, 24)));
    expect(check.ok).toBe(true);
  });

  it('gives an empty payload the checksum of nothing', () => {
    const check = verifyChecksum(encodeMessage('verack', new Uint8Array(0)));
    expect(check.computed).toBe('5df6e0e2');
    expect(check.ok).toBe(true);
  });
});

describe('damage', () => {
  it('flips one bit of the last payload byte and leaves the header alone', () => {
    for (const message of conversation()) {
      const damaged = damage(message.bytes);
      expect(damaged).toHaveLength(message.bytes.length);
      expect(bytesToHex(damaged.subarray(0, 24))).toBe(bytesToHex(message.bytes.subarray(0, 24)));
      if (message.bytes.length === 24) {
        expect(bytesToHex(damaged)).toBe(bytesToHex(message.bytes));
        continue;
      }
      const last = message.bytes.length - 1;
      expect(damaged[last]).toBe(message.bytes[last] ^ 1);
      expect(bytesToHex(damaged.subarray(0, last))).toBe(bytesToHex(message.bytes.subarray(0, last)));
      expect(verifyChecksum(damaged).ok).toBe(false);
    }
  });

  it('does not touch the bytes it was given', () => {
    const message = conversation()[4].bytes;
    const before = bytesToHex(message);
    damage(message);
    expect(bytesToHex(message)).toBe(before);
  });

  it('leaves a damaged transaction with a different id, so it is not what was asked for', () => {
    const tx = conversation()[6];
    expect(payloadHash(damage(tx.bytes))).not.toBe(PAYMENT_TXID);
  });
});

describe('what the scene can show', () => {
  it('still splits a damaged message into the same fields', () => {
    for (const message of conversation()) {
      expect(annotateMessage(damage(message.bytes)).map((segment) => segment.name)).toEqual(
        message.segments.map((segment) => segment.name),
      );
    }
  });

  it('has a name and a note for every field of every message, whatever node A calls itself', () => {
    for (const userAgent of [undefined, '', 'x'.repeat(40), '節點']) {
      for (const message of conversation({ userAgent })) {
        for (const bytes of [message.bytes, damage(message.bytes)]) {
          for (const segment of annotateMessage(bytes)) {
            expect(Object.keys(COPY.fields), `${message.id}: ${segment.name}`).toContain(fieldOf(segment.name));
          }
        }
      }
    }
  });

  it('never has to show a payload it could not split', () => {
    expect(Object.keys(COPY.fields)).not.toContain('payload');
  });
});

describe('the frame', () => {
  it('is 24 bytes long: a message with no payload is nothing else', () => {
    expect(HEADER_SIZE).toBe(24);
    expect(encodeMessage('verack', new Uint8Array(0))).toHaveLength(HEADER_SIZE);
  });

  it('spells hex out byte by byte', () => {
    expect(spaced('f9beb4d9')).toBe('f9 be b4 d9');
    expect(spaced('00')).toBe('00');
    expect(spaced('')).toBe('');
  });
});

describe('fieldOf', () => {
  it('names the kind of field a segment is, whichever input or output it belongs to', () => {
    expect(fieldOf('tx_out1_value')).toBe('tx_out_value');
    expect(fieldOf('tx_out0_script_length')).toBe('tx_out_script_length');
    expect(fieldOf('tx_in0_prev_hash')).toBe('tx_in_prev_hash');
    expect(fieldOf('tx_in12_script')).toBe('tx_in_script');
  });
  it('leaves other names as they are', () => {
    for (const name of ['magic', 'checksum', 'user_agent', 'addr_recv_ip', 'hash', 'tx_in_count', 'tx_lock_time']) {
      expect(fieldOf(name)).toBe(name);
    }
  });
});

describe('showValue', () => {
  const version = conversation()[0].segments;
  const tx = conversation()[6].segments;
  const show = (segments: Segment[], name: string) => showValue(segments.find((segment) => segment.name === name)!);

  it('reads a timestamp as a date', () => {
    expect(show(version, 'timestamp')).toBe('1788925633 = 2026-09-09 03:47:13 UTC');
  });
  it('names the service bits that are set', () => {
    expect(show(version, 'services')).toBe('0x409 = NODE_NETWORK + NODE_WITNESS + NODE_NETWORK_LIMITED');
    expect(show(version, 'addr_recv_services')).toBe('0x0');
  });
  it('gives amounts in satoshis and in bitcoin', () => {
    expect(show(tx, 'tx_out0_value')).toBe('1,000,000,000 sat = 10 BTC');
    expect(show(tx, 'tx_out1_value')).toBe('4,000,000,000 sat = 40 BTC');
  });
  it('quotes text, and spells out the magic bytes and the checksum byte by byte', () => {
    expect(show(version, 'command')).toBe('"version"');
    expect(show(version, 'user_agent')).toBe('"/Satoshi:32.1.0/"');
    expect(show(version, 'magic')).toBe('f9 be b4 d9');
    expect(show(tx, 'checksum')).toBe('16 9e 1e 83');
  });
  it('shortens long runs of bytes but never a hash', () => {
    expect(show(tx, 'tx_in0_script')).toBe('47304402204e45e1…8d1d0901');
    expect(show(version, 'addr_recv_ip')).toBe('00000000000000000000000000000000');
    expect(show(tx, 'tx_in0_prev_hash')).toBe('0437cd7f8525ceed2324359c2d0ba26006d92d856a9c20fa0241106ee5a597c9');
  });
  it('groups large counts and leaves the rest alone', () => {
    expect(show(version, 'start_height')).toBe('966,143');
    expect(show(version, 'version')).toBe('70017');
    expect(show(version, 'relay')).toBe('true');
    expect(show(tx, 'tx_in0_sequence')).toBe('4294967295 = 0xffffffff');
  });
});
