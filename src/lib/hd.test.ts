// @vitest-environment node
import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { sha512 } from '@noble/hashes/sha2.js';
import { createBase58check } from '@scure/base';
import { describe, expect, it } from 'vitest';
import { bytesToHex, hexToBytes, utf8 } from './bytes';
import { sha256 } from './hash';
import { pubkeyToAddress } from './keys';
import { HARDENED, deriveChild, derivePath, masterFromSeed } from './hd';
import type { HdKey } from './hd';

const base58check = createBase58check(sha256);

/** Chain code and key out of a serialized extended key (BIP 32, "Serialization format"). */
function parseExtended(encoded: string): { chainCode: string; key: string } {
  const raw = base58check.decode(encoded);
  expect(raw).toHaveLength(78);
  return { chainCode: bytesToHex(raw.subarray(13, 45)), key: bytesToHex(raw.subarray(45, 78)) };
}

/* BIP 32, test vectors 1 to 4, copied from the BIP. Each line of a chain goes one step below the line before. */
const SEED_1 = '000102030405060708090a0b0c0d0e0f';
const VECTORS: { name: string; seed: string; chain: { step: number | null; xpub: string; xprv: string }[] }[] = [
  {
    name: 'test vector 1',
    seed: '000102030405060708090a0b0c0d0e0f',
    chain: [
      {
        step: null,
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
        xprv: 'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi',
      },
      {
        step: 0 + HARDENED,
        xpub: 'xpub68Gmy5EdvgibQVfPdqkBBCHxA5htiqg55crXYuXoQRKfDBFA1WEjWgP6LHhwBZeNK1VTsfTFUHCdrfp1bgwQ9xv5ski8PX9rL2dZXvgGDnw',
        xprv: 'xprv9uHRZZhk6KAJC1avXpDAp4MDc3sQKNxDiPvvkX8Br5ngLNv1TxvUxt4cV1rGL5hj6KCesnDYUhd7oWgT11eZG7XnxHrnYeSvkzY7d2bhkJ7',
      },
      {
        step: 1,
        xpub: 'xpub6ASuArnXKPbfEwhqN6e3mwBcDTgzisQN1wXN9BJcM47sSikHjJf3UFHKkNAWbWMiGj7Wf5uMash7SyYq527Hqck2AxYysAA7xmALppuCkwQ',
        xprv: 'xprv9wTYmMFdV23N2TdNG573QoEsfRrWKQgWeibmLntzniatZvR9BmLnvSxqu53Kw1UmYPxLgboyZQaXwTCg8MSY3H2EU4pWcQDnRnrVA1xe8fs',
      },
      {
        step: 2 + HARDENED,
        xpub: 'xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWbmWvVJrZwQY4VUNgqFJPMM3No2dFDFGTsxxpG5uJh7n7epu4trkrX7x7DogT5Uv6fcLW5',
        xprv: 'xprv9z4pot5VBttmtdRTWfWQmoH1taj2axGVzFqSb8C9xaxKymcFzXBDptWmT7FwuEzG3ryjH4ktypQSAewRiNMjANTtpgP4mLTj34bhnZX7UiM',
      },
      {
        step: 2,
        xpub: 'xpub6FHa3pjLCk84BayeJxFW2SP4XRrFd1JYnxeLeU8EqN3vDfZmbqBqaGJAyiLjTAwm6ZLRQUMv1ZACTj37sR62cfN7fe5JnJ7dh8zL4fiyLHV',
        xprv: 'xprvA2JDeKCSNNZky6uBCviVfJSKyQ1mDYahRjijr5idH2WwLsEd4Hsb2Tyh8RfQMuPh7f7RtyzTtdrbdqqsunu5Mm3wDvUAKRHSC34sJ7in334',
      },
      {
        step: 1_000_000_000,
        xpub: 'xpub6H1LXWLaKsWFhvm6RVpEL9P4KfRZSW7abD2ttkWP3SSQvnyA8FSVqNTEcYFgJS2UaFcxupHiYkro49S8yGasTvXEYBVPamhGW6cFJodrTHy',
        xprv: 'xprvA41z7zogVVwxVSgdKUHDy1SKmdb533PjDz7J6N6mV6uS3ze1ai8FHa8kmHScGpWmj4WggLyQjgPie1rFSruoUihUZREPSL39UNdE3BBDu76',
      },
    ],
  },
  {
    name: 'test vector 2',
    seed: 'fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542',
    chain: [
      {
        step: null,
        xpub: 'xpub661MyMwAqRbcFW31YEwpkMuc5THy2PSt5bDMsktWQcFF8syAmRUapSCGu8ED9W6oDMSgv6Zz8idoc4a6mr8BDzTJY47LJhkJ8UB7WEGuduB',
        xprv: 'xprv9s21ZrQH143K31xYSDQpPDxsXRTUcvj2iNHm5NUtrGiGG5e2DtALGdso3pGz6ssrdK4PFmM8NSpSBHNqPqm55Qn3LqFtT2emdEXVYsCzC2U',
      },
      {
        step: 0,
        xpub: 'xpub69H7F5d8KSRgmmdJg2KhpAK8SR3DjMwAdkxj3ZuxV27CprR9LgpeyGmXUbC6wb7ERfvrnKZjXoUmmDznezpbZb7ap6r1D3tgFxHmwMkQTPH',
        xprv: 'xprv9vHkqa6EV4sPZHYqZznhT2NPtPCjKuDKGY38FBWLvgaDx45zo9WQRUT3dKYnjwih2yJD9mkrocEZXo1ex8G81dwSM1fwqWpWkeS3v86pgKt',
      },
      {
        step: 2_147_483_647 + HARDENED,
        xpub: 'xpub6ASAVgeehLbnwdqV6UKMHVzgqAG8Gr6riv3Fxxpj8ksbH9ebxaEyBLZ85ySDhKiLDBrQSARLq1uNRts8RuJiHjaDMBU4Zn9h8LZNnBC5y4a',
        xprv: 'xprv9wSp6B7kry3Vj9m1zSnLvN3xH8RdsPP1Mh7fAaR7aRLcQMKTR2vidYEeEg2mUCTAwCd6vnxVrcjfy2kRgVsFawNzmjuHc2YmYRmagcEPdU9',
      },
      {
        step: 1,
        xpub: 'xpub6DF8uhdarytz3FWdA8TvFSvvAh8dP3283MY7p2V4SeE2wyWmG5mg5EwVvmdMVCQcoNJxGoWaU9DCWh89LojfZ537wTfunKau47EL2dhHKon',
        xprv: 'xprv9zFnWC6h2cLgpmSA46vutJzBcfJ8yaJGg8cX1e5StJh45BBciYTRXSd25UEPVuesF9yog62tGAQtHjXajPPdbRCHuWS6T8XA2ECKADdw4Ef',
      },
      {
        step: 2_147_483_646 + HARDENED,
        xpub: 'xpub6ERApfZwUNrhLCkDtcHTcxd75RbzS1ed54G1LkBUHQVHQKqhMkhgbmJbZRkrgZw4koxb5JaHWkY4ALHY2grBGRjaDMzQLcgJvLJuZZvRcEL',
        xprv: 'xprvA1RpRA33e1JQ7ifknakTFpgNXPmW2YvmhqLQYMmrj4xJXXWYpDPS3xz7iAxn8L39njGVyuoseXzU6rcxFLJ8HFsTjSyQbLYnMpCqE2VbFWc',
      },
      {
        step: 2,
        xpub: 'xpub6FnCn6nSzZAw5Tw7cgR9bi15UV96gLZhjDstkXXxvCLsUXBGXPdSnLFbdpq8p9HmGsApME5hQTZ3emM2rnY5agb9rXpVGyy3bdW6EEgAtqt',
        xprv: 'xprvA2nrNbFZABcdryreWet9Ea4LvTJcGsqrMzxHx98MMrotbir7yrKCEXw7nadnHM8Dq38EGfSh6dqA9QWTyefMLEcBYJUuekgW4BYPJcr9E7j',
      },
    ],
  },
  {
    name: 'test vector 3',
    seed: '4b381541583be4423346c643850da4b320e46a87ae3d2a4e6da11eba819cd4acba45d239319ac14f863b8d5ab5a0d0c64d2e8a1e7d1457df2e5a3c51c73235be',
    chain: [
      {
        step: null,
        xpub: 'xpub661MyMwAqRbcEZVB4dScxMAdx6d4nFc9nvyvH3v4gJL378CSRZiYmhRoP7mBy6gSPSCYk6SzXPTf3ND1cZAceL7SfJ1Z3GC8vBgp2epUt13',
        xprv: 'xprv9s21ZrQH143K25QhxbucbDDuQ4naNntJRi4KUfWT7xo4EKsHt2QJDu7KXp1A3u7Bi1j8ph3EGsZ9Xvz9dGuVrtHHs7pXeTzjuxBrCmmhgC6',
      },
      {
        step: 0 + HARDENED,
        xpub: 'xpub68NZiKmJWnxxS6aaHmn81bvJeTESw724CRDs6HbuccFQN9Ku14VQrADWgqbhhTHBaohPX4CjNLf9fq9MYo6oDaPPLPxSb7gwQN3ih19Zm4Y',
        xprv: 'xprv9uPDJpEQgRQfDcW7BkF7eTya6RPxXeJCqCJGHuCJ4GiRVLzkTXBAJMu2qaMWPrS7AANYqdq6vcBcBUdJCVVFceUvJFjaPdGZ2y9WACViL4L',
      },
    ],
  },
  {
    name: 'test vector 4',
    seed: '3ddd5602285899a946114506157c7997e5444528f3003f6134712147db19b678',
    chain: [
      {
        step: null,
        xpub: 'xpub661MyMwAqRbcGczjuMoRm6dXaLDEhW1u34gKenbeYqAix21mdUKJyuyu5F1rzYGVxyL6tmgBUAEPrEz92mBXjByMRiJdba9wpnN37RLLAXa',
        xprv: 'xprv9s21ZrQH143K48vGoLGRPxgo2JNkJ3J3fqkirQC2zVdk5Dgd5w14S7fRDyHH4dWNHUgkvsvNDCkvAwcSHNAQwhwgNMgZhLtQC63zxwhQmRv',
      },
      {
        step: 0 + HARDENED,
        xpub: 'xpub69AUMk3qDBi3uW1sXgjCmVjJ2G6WQoYSnNHyzkmdCHEhSZ4tBok37xfFEqHd2AddP56Tqp4o56AePAgCjYdvpW2PU2jbUPFKsav5ut6Ch1m',
        xprv: 'xprv9vB7xEWwNp9kh1wQRfCCQMnZUEG21LpbR9NPCNN1dwhiZkjjeGRnaALmPXCX7SgjFTiCTT6bXes17boXtjq3xLpcDjzEuGLQBM5ohqkao9G',
      },
      {
        step: 1 + HARDENED,
        xpub: 'xpub6BJA1jSqiukeaesWfxe6sNK9CCGaujFFSJLomWHprUL9DePQ4JDkM5d88n49sMGJxrhpjazuXYWdMf17C9T5XnxkopaeS7jGk1GyyVziaMt',
        xprv: 'xprv9xJocDuwtYCMNAo3Zw76WENQeAS6WGXQ55RCy7tDJ8oALr4FWkuVoHJeHVAcAqiZLE7Je3vZJHxspZdFHfnBEjHqU5hG1Jaj32dVoS6XLT1',
      },
    ],
  },
];

/* BIP 84, test vectors: the seed is BIP 39's, from this mnemonic with no passphrase. */
const MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const BIP84: { path: string; pub: string; address: string }[] = [
  {
    path: "m/84'/0'/0'/0/0",
    pub: '0330d54fd0dd420a6e5f8d3624f5f3482cae350f79d5f0753bf5beef9c2d91af3c',
    address: 'bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu',
  },
  {
    path: "m/84'/0'/0'/0/1",
    pub: '03e775fd51f0dfb8cd865d9ff1cca2a158cf651fe997fdc9fee9c1d3b5e995ea77',
    address: 'bc1qnjg0jd8228aq7egyzacy8cys3knf9xvrerkf9g',
  },
  {
    path: "m/84'/0'/0'/1/0",
    pub: '03025324888e429ab8e3dbaf1f7802648b9cd01e9b418485c5fa4c1b9b5700e1a6',
    address: 'bc1q8c6fshw2dlwun7ekn9qwf37cu2rn755upcp6el',
  },
];

describe('BIP 32 key derivation', () => {
  // The BIP added vectors 3 and 4 for keys that begin with zero bytes. Vector 4 is the one that fails here if a
  // child key loses its leading zero on the way from a number back to 32 bytes.
  for (const { name, seed, chain } of VECTORS) {
    it(`reproduces ${name} of the BIP, private and public, at every level`, () => {
      let node = masterFromSeed(hexToBytes(seed));
      for (const { step, xpub, xprv } of chain) {
        if (step !== null) node = deriveChild(node, step);
        const priv = parseExtended(xprv);
        const pub = parseExtended(xpub);
        expect(bytesToHex(node.chainCode)).toBe(priv.chainCode);
        expect(`00${bytesToHex(node.priv)}`).toBe(priv.key);
        expect(bytesToHex(node.pub)).toBe(pub.key);
        expect(pub.chainCode).toBe(priv.chainCode);
      }
    });
  }

  it('walks a written path the same way as step-by-step derivation', () => {
    const master = masterFromSeed(hexToBytes(SEED_1));
    const byHand = deriveChild(deriveChild(deriveChild(master, HARDENED), 1), 2 + HARDENED);
    for (const path of ["m/0'/1/2'", 'm/0h/1/2h', 'm/0H/1/2H']) {
      const walked = derivePath(master, path);
      expect(bytesToHex(walked.priv)).toBe(bytesToHex(byHand.priv));
      expect(bytesToHex(walked.chainCode)).toBe(bytesToHex(byHand.chainCode));
    }
    expect(bytesToHex(derivePath(master, 'm').priv)).toBe(bytesToHex(master.priv));
  });

  it('gives the addresses of the BIP 84 test vectors', () => {
    const seed = pbkdf2(sha512, utf8(MNEMONIC), utf8('mnemonic'), { c: 2048, dkLen: 64 });
    const master = masterFromSeed(seed);
    for (const { path, pub, address } of BIP84) {
      const key = derivePath(master, path);
      expect(bytesToHex(key.pub)).toBe(pub);
      expect(pubkeyToAddress(key.pub, 'p2wpkh')).toBe(address);
    }
  });

  it('is deterministic, and every child differs from its siblings and its parent', () => {
    const master = masterFromSeed(hexToBytes(SEED_1));
    const again = masterFromSeed(hexToBytes(SEED_1));
    expect(bytesToHex(again.priv)).toBe(bytesToHex(master.priv));
    const keys = [master, ...[0, 1, 2, HARDENED, HARDENED + 1].map((index) => deriveChild(master, index))];
    expect(new Set(keys.map((key) => bytesToHex(key.pub))).size).toBe(keys.length);
  });

  it('rejects seeds of the wrong size, bad indices and bad paths', () => {
    expect(() => masterFromSeed(new Uint8Array(15))).toThrow(RangeError);
    expect(() => masterFromSeed(new Uint8Array(65))).toThrow(RangeError);
    const master = masterFromSeed(hexToBytes(SEED_1));
    expect(() => deriveChild(master, -1)).toThrow(RangeError);
    expect(() => deriveChild(master, 2 ** 32)).toThrow(RangeError);
    expect(() => deriveChild(master, 1.5)).toThrow(RangeError);
    for (const path of ['', '84/0', 'm/', 'm/x', "m/84''", `m/${2 ** 31}`]) {
      expect(() => derivePath(master, path), path).toThrow(RangeError);
    }
  });

  it('refuses a parent that is not a well-formed extended key', () => {
    const master = masterFromSeed(hexToBytes(SEED_1));
    const sibling = deriveChild(master, 0);
    const malformed: [what: string, parent: HdKey][] = [
      ['a 31-byte private key', { ...master, priv: master.priv.slice(1) }],
      ['a 33-byte private key', { ...master, priv: Uint8Array.of(0, ...master.priv) }],
      ['a private key of zero', { ...master, priv: new Uint8Array(32) }],
      ['a 31-byte chain code', { ...master, chainCode: master.chainCode.slice(1) }],
      ['a 33-byte chain code', { ...master, chainCode: Uint8Array.of(0, ...master.chainCode) }],
      ['the public key of another private key', { ...master, pub: sibling.pub }],
    ];
    for (const [what, parent] of malformed) {
      // A normal child is derived from the public key, a hardened one from the private key: both must refuse.
      expect(() => deriveChild(parent, 0), what).toThrow(RangeError);
      expect(() => deriveChild(parent, HARDENED), what).toThrow(RangeError);
      expect(() => derivePath(parent, 'm/0'), what).toThrow(RangeError);
      // Even the path that takes no step hands back only a key that is sound.
      expect(() => derivePath(parent, 'm'), what).toThrow(RangeError);
    }
  });
});
