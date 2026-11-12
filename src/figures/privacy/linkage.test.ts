// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { clusterAddresses, observe, ownerCluster, transactionsTouching } from './linkage';
import type { PublicTx } from './linkage';

const tx = (id: string, inputs: string[], outputs: string[]): PublicTx => ({ id, inputs, outputs });

describe('clusterAddresses', () => {
  it('leaves every address on its own when no transaction spends two together', () => {
    const txs = [tx('t1', ['p1'], ['a1']), tx('t2', ['p2'], ['a2']), tx('t3', ['a1'], ['s1', 'c1'])];
    expect(clusterAddresses(txs)).toEqual([['p1'], ['a1'], ['p2'], ['a2'], ['s1'], ['c1']]);
  });

  it('joins the inputs of one transaction: they were signed for by one owner', () => {
    const txs = [tx('t1', ['p1'], ['a1']), tx('t2', ['p2'], ['a2']), tx('t3', ['a1', 'a2'], ['s1', 'c1'])];
    expect(clusterAddresses(txs)).toEqual([['p1'], ['a1', 'a2'], ['p2'], ['s1'], ['c1']]);
  });

  it('never joins outputs, with each other or with the inputs', () => {
    const clusters = clusterAddresses([tx('t1', ['a'], ['b', 'c'])]);
    expect(clusters).toEqual([['a'], ['b'], ['c']]);
  });

  it('chains joins across transactions', () => {
    const txs = [tx('t1', ['a', 'b'], ['x']), tx('t2', ['c', 'd'], ['y']), tx('t3', ['b', 'c'], ['z'])];
    expect(clusterAddresses(txs)).toEqual([['a', 'b', 'c', 'd'], ['x'], ['y'], ['z']]);
  });

  it('treats a reused address as the one address it is', () => {
    const txs = [tx('t1', ['p1'], ['a']), tx('t2', ['p2'], ['a']), tx('t3', ['a', 'a'], ['s', 'a'])];
    expect(clusterAddresses(txs)).toEqual([['p1'], ['a'], ['p2'], ['s']]);
  });

  it('does not depend on the order of the transactions for who ends up together', () => {
    const txs = [tx('t1', ['a', 'b'], ['x']), tx('t2', ['c', 'd'], ['y']), tx('t3', ['b', 'c'], ['z'])];
    const sets = (list: PublicTx[]) =>
      clusterAddresses(list)
        .map((cluster) => [...cluster].sort().join())
        .sort();
    expect(sets([...txs].reverse())).toEqual(sets(txs));
  });

  it('handles an empty ledger', () => {
    expect(clusterAddresses([])).toEqual([]);
  });
});

describe('ownerCluster', () => {
  const clusters = [['a', 'b'], ['c']];
  it('finds the group an address belongs to', () => {
    expect(ownerCluster(clusters, 'b')).toEqual(['a', 'b']);
    expect(ownerCluster(clusters, 'c')).toEqual(['c']);
  });
  it('gives an unseen address a group of its own', () => {
    expect(ownerCluster(clusters, 'q')).toEqual(['q']);
  });
});

describe('transactionsTouching', () => {
  const txs = [tx('t1', ['p1'], ['a1']), tx('t2', ['p2'], ['a2']), tx('t3', ['a1'], ['s1', 'c1']), tx('t4', ['c1'], ['s2'])];
  it('lists transactions that pay to the group or spend from it, in ledger order', () => {
    expect(transactionsTouching(txs, ['a1'])).toEqual(['t1', 't3']);
    expect(transactionsTouching(txs, ['a1', 'c1'])).toEqual(['t1', 't3', 't4']);
    expect(transactionsTouching(txs, ['nobody'])).toEqual([]);
  });
});

describe('observe', () => {
  // One person: paid at a1, a2, a3, then spends.
  const receipts = [tx('t1', ['p1'], ['a1']), tx('t2', ['p2'], ['a2']), tx('t3', ['p3'], ['a3'])];

  it('ties only the known coin to its owner when nothing else links', () => {
    const txs = [...receipts, tx('t4', ['a1'], ['s1', 'c4']), tx('t5', ['a2'], ['s2', 'c5']), tx('t6', ['a3'], ['s3', 'c6'])];
    const seen = observe(txs, 'a1');
    expect(seen.attributed).toEqual(['a1']);
    expect(seen.tied).toEqual(['t1', 't4']);
  });

  it('follows a payment with several inputs to every address it spent from', () => {
    const txs = [...receipts, tx('t4', ['a1', 'a2', 'a3'], ['s1', 'c4']), tx('t5', ['c4'], ['s2', 'c5'])];
    const seen = observe(txs, 'a1');
    expect(seen.attributed).toEqual(['a1', 'a2', 'a3']);
    expect(seen.tied).toEqual(['t1', 't2', 't3', 't4']);
  });

  it('does not treat the change as the same owner: the two rules cannot tell change from payment', () => {
    const txs = [...receipts, tx('t4', ['a1'], ['s1', 'c4']), tx('t5', ['c4'], ['s2', 'c5'])];
    expect(observe(txs, 'a1').tied).toEqual(['t1', 't4']);
  });

  it('ties everything when one address is used throughout', () => {
    const txs = [
      tx('t1', ['p1'], ['a']),
      tx('t2', ['p2'], ['a']),
      tx('t3', ['p3'], ['a']),
      tx('t4', ['a'], ['s1', 'a']),
      tx('t5', ['a'], ['s2', 'a']),
      tx('t6', ['a'], ['s3', 'a']),
    ];
    const seen = observe(txs, 'a');
    expect(seen.attributed).toEqual(['a']);
    expect(seen.tied).toEqual(['t1', 't2', 't3', 't4', 't5', 't6']);
  });

  it('reports the groups it found', () => {
    const txs = [...receipts, tx('t4', ['a2', 'a3'], ['s1', 'c4'])];
    expect(observe(txs, 'a1').clusters).toContainEqual(['a2', 'a3']);
  });
});
