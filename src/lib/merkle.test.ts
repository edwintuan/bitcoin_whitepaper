// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  merkleLevels, merkleParent, merkleProof, merkleRoot, prunableNodes, verifyProof,
} from './merkle';
import { sha256Hex } from './hash';
import { headerHash } from './header';

const B170 = [
  'b1fea52486ce0c62bb442b530a3f0132b826c74e473d1f2c220bfa78111c5082',
  'f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16',
];
const ids = (n: number) => Array.from({ length: n }, (_, i) => sha256Hex('tx' + i));

describe('merkle', () => {
  it('returns the txid itself for a single transaction', () => {
    expect(merkleRoot([B170[0]])).toBe(B170[0]);
  });
  it('reproduces the merkle root of mainnet block 170', () => {
    expect(merkleRoot(B170)).toBe('7dac2c5666815c17a3b36427de37bb9d2e2c5ccec3f8633eb91a4205cb4c10ff');
  });
  it('duplicates the last hash on odd levels', () => {
    const three = ids(3);
    expect(merkleRoot(three)).toBe(merkleRoot([...three, three[2]]));
    expect(merkleLevels(three).map((l) => l.length)).toEqual([3, 2, 1]);
  });
  it('proves and verifies every leaf', () => {
    for (const n of [1, 2, 3, 5, 8, 11]) {
      const t = ids(n); const root = merkleRoot(t);
      t.forEach((id, i) => expect(verifyProof(id, merkleProof(t, i), root)).toBe(true));
    }
  });
  it('rejects a tampered proof', () => {
    const t = ids(8); const proof = merkleProof(t, 3);
    expect(verifyProof(ids(9)[8], proof, merkleRoot(t))).toBe(false);
    const bad = proof.map((s, i) => (i === 1 ? { ...s, hash: t[0] } : s));
    expect(verifyProof(t[3], bad, merkleRoot(t))).toBe(false);
  });
  it('uses log2(n) hashes', () => {
    expect(merkleProof(ids(8), 0)).toHaveLength(3);
    expect(merkleProof(ids(1024), 77)).toHaveLength(10);
  });
  it('finds the largest fully spent subtrees', () => {
    const levels = merkleLevels(ids(4));
    expect(prunableNodes(levels, [true, true, true, false])).toEqual([
      { level: 1, index: 0 }, { level: 0, index: 2 },
    ]);
    expect(prunableNodes(levels, [false, false, false, false])).toEqual([]);
  });
});

// Real mainnet blocks whose transaction counts exercise the "duplicate the
// last hash" rule at different levels: 3 (odd leaves), 5 (odd leaves, then an
// odd level of 3), 6 (even leaves, odd level of 3) and 13 (13, 7, 4, 2, 1).
// Txids and roots were read from two independent explorers.
const REAL_BLOCKS = [
  {
    height: 100027,
    root: '7099d100635a0e5f62ef12a8420c99426a408951078f191a0f63ddedc4dcd198',
    txids: [
      '1a02db5db5a24c5edc5b653051d8aaaddec3f9abc30354f7df358c49fe40f735',
      'd3f3eb471e368a27f5320ff7a961bed748519139435cf8348e84ebd6225d7150',
      '7cbcf6b5378e3e43b39734baa578efa501d02abf90289547f0e6621ee959f0e3',
    ],
  },
  {
    height: 100018,
    root: '5766798857e436d6243b46b5c1e0af5b6806aa9c2320b3ffd4ecff7b31fd4647',
    txids: [
      'a335b243f5e343049fccac2cf4d70578ad705831940d3eef48360b0ea3829ed4',
      'd5fd11cb1fabd91c75733f4cf8ff2f91e4c0d7afa4fd132f792eacb3ef56a46c',
      '0441cb66ef0cbf78c9ecb3d5a7d0acf878bfdefae8a77541b3519a54df51e7fd',
      '1a8a27d690889b28d6cb4dacec41e354c62f40d85a7f4b2d7a54ffc736c6ff35',
      '1d543d550676f82bf8bf5b0cc410b16fc6fc353b2a4fd9a0d6a2312ed7338701',
    ],
  },
  {
    height: 100004,
    root: 'a5c67f0b44c1a342dec9135a566fd93f0c728452d1dbf850f4f9a47af82aed77',
    txids: [
      'ab7ed423933fe5413dc51b1041a58fd8af0cd70491b1ce607cb41dddce74a92b',
      'c763e59a79c9f1e626ddf1c3e9f20f234959c457ff82918f7b24e9d18a12db99',
      '80ea3e647aeef92973f5414e0caa1721c7b42345b99ed161dd505acc41f5516b',
      '1b72eefd70ce0a362ec0cb48e2213274df3c55f9dabd5806cdc087a335498cd3',
      '23e13370f6d59e2d7c7a9ca604b872312de34a387bd7deca2c8f4486f7e66173',
      '149a098d6261b7f9359a572d797c4a41b62378836a14093912618b15644ba402',
    ],
  },
  {
    height: 100022,
    root: 'e05048a9b8e622bda048691a47fd9de332dc1d4b6b9d289d4e12c6722076c4e7',
    txids: [
      'ef329db8380f3b58fa324da9d3e3667c5315cbc1bae4dc16a484df128a0fe6ff',
      'c49bd4ce9e7f6c625b5b325eb43256593fda79ef0ade4954e53f7370b7251202',
      '1d763cad8bd1550dc60b295f990b90c38fb5aad5fa96fde2dcdd915c0c7d0120',
      'bc2cf68de4bf0ce04dc52354fd7237873ce19e4c023405d4fca0ad362995dfa1',
      '55ae900227201042a7eea912c4ea040df7d2927aed39d7b73221a51c7113f159',
      '25409490e6f67acbd0577728361a17b67d8d8c732b3e0e2df63332db0ac0bac0',
      '77fc1964dd111e3f9819f3ef86339ac15ca9db1d8eb9a838ac7f3fde7f5154ac',
      '546b7ea459ff93cf035b32de40dc4de86bfc9a5f8cd5d66a2e2e1f027526201b',
      'f466b268ffef14b5b2678ae095d91130c9753c0d4437e729286f869cfa7b6a5e',
      'd818d5263b390efe36a4c243ae2a3a3b6beaaae55095116ae0a2ad4ea16533fc',
      'd7ea060386a3adf15563f86ca03d6f0b003adb0e4c592c7223536eba98dfdc09',
      '1e380e99d8813602a129ad6482bb266cba3fbb38659459337721ae5c3b0debc8',
      '6415756ca81bddab50654f98e1130efb668ba66f453285c2724e0dcbf104b538',
    ],
  },
];

describe('merkle roots of real blocks', () => {
  it.each(REAL_BLOCKS)('reproduces the root of block $height', ({ root, txids }) => {
    expect(merkleRoot(txids)).toBe(root);
  });
  it.each(REAL_BLOCKS)('proves every transaction of block $height against its root', ({ root, txids }) => {
    txids.forEach((id, i) => expect(verifyProof(id, merkleProof(txids, i), root)).toBe(true));
  });
  it('halves each level, rounding up', () => {
    const lengths = REAL_BLOCKS.map((b) => merkleLevels(b.txids).map((l) => l.length));
    expect(lengths).toEqual([[3, 2, 1], [5, 3, 2, 1], [6, 3, 2, 1], [13, 7, 4, 2, 1]]);
  });
  it('yields the root that makes the header of block 170 hash to its block hash', () => {
    const header = {
      version: 1,
      prevHash: '000000002a22cfee1f2c846adbd12b3e183d4f97683f85dad08a79780a84bd55',
      merkleRoot: merkleRoot(B170),
      time: 1231731025,
      bits: 0x1d00ffff,
      nonce: 1889418792,
    };
    expect(headerHash(header)).toBe('00000000d1145790a8694403d4063f323d499e655c83426834d4ce2f8dd4a2ee');
  });
});

describe('merkleParent', () => {
  it('hashes two display-order children into their display-order parent', () => {
    expect(merkleParent(B170[0], B170[1])).toBe('7dac2c5666815c17a3b36427de37bb9d2e2c5ccec3f8633eb91a4205cb4c10ff');
  });
  it('depends on the order of the children', () => {
    expect(merkleParent(B170[1], B170[0])).not.toBe(merkleParent(B170[0], B170[1]));
  });
  it('rejects children that are not 32-byte hashes', () => {
    expect(() => merkleParent('abcd', B170[1])).toThrow(RangeError);
    expect(() => merkleParent(B170[0], 'not hex')).toThrow(RangeError);
  });
});

describe('merkleLevels', () => {
  it('starts with the leaves and ends with the root alone', () => {
    const t = ids(5);
    const levels = merkleLevels(t);
    expect(levels[0]).toEqual(t);
    expect(levels[levels.length - 1]).toEqual([merkleRoot(t)]);
  });
  it('builds each node from the two below it, pairing a lone last node with itself', () => {
    const [a, b, c] = ids(3);
    const levels = merkleLevels([a, b, c]);
    expect(levels[1]).toEqual([merkleParent(a, b), merkleParent(c, c)]);
    expect(levels[2]).toEqual([merkleParent(levels[1][0], levels[1][1])]);
  });
  it('is a single level for a single transaction', () => {
    expect(merkleLevels([B170[0]])).toEqual([[B170[0]]]);
  });
  it('copies the leaves instead of keeping the caller\'s array', () => {
    const t = ids(2);
    const levels = merkleLevels(t);
    expect(levels[0]).toEqual(t);
    expect(levels[0]).not.toBe(t);
  });
  it('normalizes txids to lower case', () => {
    const t = ids(2);
    const shouted = [t[0].toUpperCase(), t[1]];
    expect(merkleLevels(shouted)[0]).toEqual(t);
    expect(merkleRoot(shouted)).toBe(merkleRoot(t));
    expect(merkleRoot([t[0].toUpperCase()])).toBe(t[0]);
  });
  it('rejects an empty list, since a block always has a coinbase transaction', () => {
    expect(() => merkleLevels([])).toThrow(RangeError);
    expect(() => merkleRoot([])).toThrow(RangeError);
  });
  it('rejects a txid that is not a 32-byte hash, even when it is the only one', () => {
    expect(() => merkleRoot(['abcd'])).toThrow(RangeError);
    expect(() => merkleRoot([B170[0], 'zz'.repeat(32)])).toThrow(RangeError);
  });
});

describe('merkleProof', () => {
  it('lists each sibling with the side it sits on, from the leaf up', () => {
    const t = ids(4);
    expect(merkleProof(t, 2)).toEqual([
      { hash: t[3], position: 'right' },
      { hash: merkleParent(t[0], t[1]), position: 'left' },
    ]);
    expect(merkleProof(t, 1)).toEqual([
      { hash: t[0], position: 'left' },
      { hash: merkleParent(t[2], t[3]), position: 'right' },
    ]);
  });
  it('pairs a lone last node with its own hash, on the right', () => {
    const t = ids(3);
    expect(merkleProof(t, 2)).toEqual([
      { hash: t[2], position: 'right' },
      { hash: merkleParent(t[0], t[1]), position: 'left' },
    ]);
  });
  it('is empty for a block with one transaction', () => {
    expect(merkleProof([B170[0]], 0)).toEqual([]);
    expect(verifyProof(B170[0], [], B170[0])).toBe(true);
    expect(verifyProof(B170[0], [], B170[1])).toBe(false);
  });
  it('rejects an index outside the list', () => {
    const t = ids(4);
    expect(() => merkleProof(t, -1)).toThrow(RangeError);
    expect(() => merkleProof(t, 4)).toThrow(RangeError);
    expect(() => merkleProof(t, 1.5)).toThrow(RangeError);
  });
});

describe('verifyProof', () => {
  const t = ids(8);
  const root = merkleRoot(t);
  const proof = merkleProof(t, 5);

  it('fails when any single sibling hash is replaced', () => {
    proof.forEach((_, i) => {
      const bad = proof.map((s, j) => (j === i ? { ...s, hash: sha256Hex('forged') } : s));
      expect(verifyProof(t[5], bad, root)).toBe(false);
    });
  });
  it('fails when a sibling is put on the wrong side', () => {
    proof.forEach((_, i) => {
      const flip = (p: 'left' | 'right') => (p === 'left' ? 'right' as const : 'left' as const);
      const bad = proof.map((s, j) => (j === i ? { ...s, position: flip(s.position) } : s));
      expect(verifyProof(t[5], bad, root)).toBe(false);
    });
  });
  it('fails for a truncated proof, another leaf, or another root', () => {
    expect(verifyProof(t[5], proof.slice(0, -1), root)).toBe(false);
    expect(verifyProof(t[4], proof, root)).toBe(false);
    expect(verifyProof(t[5], proof, merkleRoot(ids(7)))).toBe(false);
  });
  it('accepts hex in either case', () => {
    expect(verifyProof(t[5].toUpperCase(), proof, root.toUpperCase())).toBe(true);
  });
  it('answers false, rather than throwing, for input that is not a hash', () => {
    expect(verifyProof('not a txid', proof, root)).toBe(false);
    expect(verifyProof(t[5], [{ hash: 'abcd', position: 'left' }], root)).toBe(false);
    expect(verifyProof(t[5], proof, '')).toBe(false);
  });
});

describe('prunableNodes', () => {
  it('collapses the whole tree into its root when everything is spent', () => {
    expect(prunableNodes(merkleLevels(ids(4)), [true, true, true, true])).toEqual([{ level: 2, index: 0 }]);
    expect(prunableNodes(merkleLevels(ids(1)), [true])).toEqual([{ level: 0, index: 0 }]);
    expect(prunableNodes(merkleLevels(ids(1)), [false])).toEqual([]);
  });
  it('reports nodes left to right across a larger tree', () => {
    const levels = merkleLevels(ids(8));
    const spent = [true, true, true, true, false, true, true, true];
    expect(prunableNodes(levels, spent)).toEqual([
      { level: 2, index: 0 }, // leaves 0-3
      { level: 0, index: 5 },
      { level: 1, index: 3 }, // leaves 6-7
    ]);
  });
  it('treats a lone last node as spent when its one real leaf is', () => {
    const levels = merkleLevels(ids(3));
    expect(prunableNodes(levels, [false, false, true])).toEqual([{ level: 1, index: 1 }]);
    expect(prunableNodes(levels, [true, true, false])).toEqual([{ level: 1, index: 0 }]);
    expect(prunableNodes(levels, [true, true, true])).toEqual([{ level: 2, index: 0 }]);
    expect(prunableNodes(levels, [true, false, true])).toEqual([{ level: 0, index: 0 }, { level: 1, index: 1 }]);
  });
  it('handles odd levels above the leaves', () => {
    // 5 leaves: levels of 5, 3, 2, 1. Leaf 4 is alone under (1,2), which is alone under (2,1).
    const levels = merkleLevels(ids(5));
    expect(prunableNodes(levels, [false, false, false, false, true])).toEqual([{ level: 2, index: 1 }]);
    expect(prunableNodes(levels, [true, true, true, true, false])).toEqual([{ level: 2, index: 0 }]);
  });
  it('keeps the root computable from what is left after pruning', () => {
    // Whitepaper section 7: with Tx0-2 spent, Hash01 and Hash2 stand in for them.
    const t = ids(4);
    const levels = merkleLevels(t);
    const [hash01, hash2] = prunableNodes(levels, [true, true, true, false]).map((n) => levels[n.level][n.index]);
    expect(merkleParent(hash01, merkleParent(hash2, t[3]))).toBe(merkleRoot(t));
  });
  it('rejects a spent list that does not match the leaves', () => {
    const levels = merkleLevels(ids(4));
    expect(() => prunableNodes(levels, [true, true])).toThrow(RangeError);
    expect(() => prunableNodes(levels, [true, true, true, true, true])).toThrow(RangeError);
    expect(() => prunableNodes([], [])).toThrow(RangeError);
  });
});
