// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { pubkeyToAddress } from '@/lib/keys';
import { derivePath, masterFromSeed } from '@/lib/hd';
import { observe } from './linkage';
import { OWNER_SEED, PARTIES, buildScenario, examplePayment, toPublic } from './scenario';
import type { Scenario, ScenarioOptions } from './scenario';

const MODES: ScenarioOptions[] = [
  { reuse: false, combine: false },
  { reuse: false, combine: true },
  { reuse: true, combine: false },
  { reuse: true, combine: true },
];

const sum = (values: bigint[]) => values.reduce((a, b) => a + b, 0n);
const tiedNumbers = (scenario: Scenario) => {
  const { tied } = observe(toPublic(scenario.txs), scenario.known);
  return scenario.txs.filter((tx) => tied.includes(tx.txid)).map((tx) => tx.number);
};

describe('the six payments', () => {
  it('are three receipts followed by three payments, whatever the switches say', () => {
    for (const mode of MODES) {
      const { txs } = buildScenario(mode);
      expect(txs.map((tx) => tx.number)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(txs.map((tx) => tx.kind)).toEqual(['receive', 'receive', 'receive', 'pay', 'pay', 'pay']);
      expect(txs.map((tx) => tx.party)).toEqual([...PARTIES]);
    }
  });

  it('are real transactions: ids from the engine, and inputs that cover outputs plus a fee', () => {
    for (const mode of MODES) {
      const { txs } = buildScenario(mode);
      expect(new Set(txs.map((tx) => tx.txid)).size).toBe(6);
      for (const tx of txs) {
        expect(tx.txid).toMatch(/^[0-9a-f]{64}$/);
        expect(tx.fee).toBeGreaterThan(0n);
        expect(sum(tx.inputs.map((input) => input.value))).toBe(sum(tx.outputs.map((output) => output.value)) + tx.fee);
      }
    }
  });

  it('spend only coins that an earlier transaction of the six created, once the owner is paying', () => {
    for (const mode of MODES) {
      const { txs, wallet } = buildScenario(mode);
      const mine = new Set(wallet.map((entry) => entry.address));
      for (const tx of txs.filter((entry) => entry.kind === 'pay')) {
        for (const input of tx.inputs) expect(mine.has(input.address)).toBe(true);
        expect(tx.outputs.map((output) => output.role)).toEqual(['payment', 'change']);
        expect(mine.has(tx.outputs[0].address)).toBe(false);
        expect(mine.has(tx.outputs[1].address)).toBe(true);
      }
    }
  });

  it('are the same every time they are built', () => {
    for (const mode of MODES) expect(buildScenario(mode)).toEqual(buildScenario(mode));
  });
});

describe('the owner’s addresses', () => {
  it('are fresh BIP 84 derivations from one seed: three for receiving, three for change', () => {
    const { wallet, txs } = buildScenario({ reuse: false, combine: false });
    expect(wallet.map((entry) => entry.path)).toEqual([
      "m/84'/0'/0'/0/0",
      "m/84'/0'/0'/0/1",
      "m/84'/0'/0'/0/2",
      "m/84'/0'/0'/1/0",
      "m/84'/0'/0'/1/1",
      "m/84'/0'/0'/1/2",
    ]);
    const master = masterFromSeed(OWNER_SEED);
    for (const { address, path } of wallet) {
      expect(address).toBe(pubkeyToAddress(derivePath(master, path).pub, 'p2wpkh'));
      expect(address).toMatch(/^bc1q[0-9a-z]{38}$/);
    }
    expect(new Set(wallet.map((entry) => entry.address)).size).toBe(6);
    // Receipts land on the receiving chain in order; change on the change chain.
    expect(txs.slice(0, 3).map((tx) => tx.outputs[0].address)).toEqual(wallet.slice(0, 3).map((entry) => entry.address));
    expect(txs.slice(3).map((tx) => tx.outputs[1].address)).toEqual(wallet.slice(3).map((entry) => entry.address));
  });

  it('collapse into the first receiving address when it is reused', () => {
    for (const combine of [false, true]) {
      const { wallet, txs } = buildScenario({ reuse: true, combine });
      expect(wallet).toHaveLength(1);
      expect(wallet[0].path).toBe("m/84'/0'/0'/0/0");
      for (const tx of txs.slice(0, 3)) expect(tx.outputs[0].address).toBe(wallet[0].address);
      for (const tx of txs.slice(3)) expect(tx.outputs[1].address).toBe(wallet[0].address);
    }
  });

  it('never coincide with anyone else’s', () => {
    const { txs, wallet } = buildScenario({ reuse: false, combine: false });
    const mine = new Set(wallet.map((entry) => entry.address));
    const others = [...txs.slice(0, 3).map((tx) => tx.inputs[0].address), ...txs.slice(3).map((tx) => tx.outputs[0].address)];
    expect(new Set(others).size).toBe(6);
    for (const address of others) expect(mine.has(address)).toBe(false);
  });

  it('include the one the observer knows: where the first payment arrived', () => {
    for (const mode of MODES) {
      const scenario = buildScenario(mode);
      expect(scenario.known).toBe(scenario.txs[0].outputs[0].address);
    }
  });
});

describe('how the coins are spent', () => {
  it('uses one coin per payment while each bill fits a single coin', () => {
    for (const reuse of [false, true]) {
      const { txs } = buildScenario({ reuse, combine: false });
      expect(txs.map((tx) => tx.inputs.length)).toEqual([1, 1, 1, 1, 1, 1]);
    }
  });

  it('has to spend three coins together once the first bill is larger than any of them', () => {
    for (const reuse of [false, true]) {
      const { txs } = buildScenario({ reuse, combine: true });
      expect(txs.map((tx) => tx.inputs.length)).toEqual([1, 1, 1, 3, 1, 1]);
      const largestCoin = txs.slice(0, 3).reduce((max, tx) => (tx.outputs[0].value > max ? tx.outputs[0].value : max), 0n);
      expect(txs[3].outputs[0].value).toBeGreaterThan(largestCoin);
    }
    const fresh = buildScenario({ reuse: false, combine: true });
    expect(new Set(fresh.txs[3].inputs.map((input) => input.address)).size).toBe(3);
  });
});

describe('what the observer can tie to the owner', () => {
  it('is only the known coin, coming and going, with fresh addresses and single inputs', () => {
    expect(tiedNumbers(buildScenario({ reuse: false, combine: false }))).toEqual([1, 4]);
  });
  it('grows to every receipt once three addresses are spent together', () => {
    const scenario = buildScenario({ reuse: false, combine: true });
    expect(tiedNumbers(scenario)).toEqual([1, 2, 3, 4]);
    expect(observe(toPublic(scenario.txs), scenario.known).attributed).toHaveLength(3);
  });
  it('is everything when one address is reused', () => {
    expect(tiedNumbers(buildScenario({ reuse: true, combine: false }))).toEqual([1, 2, 3, 4, 5, 6]);
    expect(tiedNumbers(buildScenario({ reuse: true, combine: true }))).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('the payment shown under the two privacy models', () => {
  const example = examplePayment();
  const { txs, known } = buildScenario({ reuse: false, combine: false });

  it('is one from the ledger: her first coin, spent at the shop', () => {
    expect(example.from).toBe(known);
    expect(example.from).toBe(txs[3].inputs[0].address);
    expect(example.to).toBe(txs[3].outputs[0].address);
    expect(txs[3].party).toBe('shop');
    expect(txs[3].inputs).toHaveLength(1);
  });

  it('shows the amount that transaction really pays', () => {
    expect(example.amount).toBe(txs[3].outputs[0].value);
    expect(example.amount).toBe(45_000_000n);
  });
});
