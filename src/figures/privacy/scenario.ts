/**
 * One person's six payments, built as real transactions with the engine: three
 * coins received, three bills paid. The two switches of the figure change how
 * her wallet behaves, never what the observer is allowed to assume.
 *
 * - `reuse`: every coin, change included, is received at one address. Without
 *   it, each receipt and each change output gets a fresh address derived from
 *   her seed on the BIP 84 paths (m/84'/0'/0'/0/i to receive, …/1/i for change).
 * - `combine`: her first bill is larger than any coin she holds, so coin
 *   selection has no choice but to spend three coins in one transaction. The
 *   multi-input payment is not staged: it is what `selectCoins` returns.
 */
import { utf8 } from '@/lib/bytes';
import { sha256, sha256Hex } from '@/lib/hash';
import { pubkeyToAddress } from '@/lib/keys';
import { applyTx, buildPayment, fee, selectCoins, txid } from '@/lib/tx';
import type { Tx, Utxo } from '@/lib/tx';
import { derivePath, masterFromSeed } from '@/lib/hd';
import type { HdKey } from '@/lib/hd';
import type { PublicTx } from './linkage';

export interface ScenarioOptions {
  reuse: boolean;
  combine: boolean;
}

/** The people on the other side of each transaction, in ledger order: three who pay her, three she pays. */
export const PARTIES = ['employer', 'client', 'friend', 'shop', 'landlord', 'cafe'] as const;
export type PartyId = (typeof PARTIES)[number];

export interface LedgerInput {
  address: string;
  value: bigint;
}

export interface LedgerOutput {
  address: string;
  value: bigint;
  role: 'payment' | 'change';
}

export interface LedgerTx {
  /** 1 to 6, in the order they happened. */
  number: number;
  /** The id the engine computes: double SHA-256 of the serialized transaction. */
  txid: string;
  kind: 'receive' | 'pay';
  /** Who paid her, or whom she paid. Known to the reader, not to the observer. */
  party: PartyId;
  inputs: LedgerInput[];
  outputs: LedgerOutput[];
  fee: bigint;
}

export interface Scenario {
  txs: LedgerTx[];
  /** Her addresses in order of first use, with the path each was derived on. The observer has none of this. */
  wallet: { address: string; path: string }[];
  /** The one address whose owner the observer has learned: where her first payment arrived. */
  known: string;
}

/* Amounts in satoshis. */
const RECEIPTS = [50_000_000n, 30_000_000n, 20_000_000n];
/** Each of these fits in one of her coins. */
const SMALL_BILLS = [45_000_000n, 25_000_000n, 15_000_000n];
/** The first is more than her largest coin; the rest are paid from what comes back. */
const LARGE_BILLS = [90_000_000n, 5_000_000n, 2_000_000n];
const BASE_FEE = 5_000n;
const FEE_PER_INPUT = 5_000n;
const DUST = 546n;

const RECEIVE_PATH = "m/84'/0'/0'/0";
const CHANGE_PATH = "m/84'/0'/0'/1";

const seedFor = (name: string): Uint8Array => sha256(utf8(`bitcoin-whitepaper-explainer/demo-wallet/${name}`));

/** The seed of her wallet. Public, like every key on the page. */
export const OWNER_SEED = seedFor('alice');

const masters = new Map<string, HdKey>();
const addresses = new Map<string, string>();

/** The P2WPKH address at `path` in the wallet named `name`. Derived once, then remembered. */
function addressAt(name: string, path: string): string {
  const key = `${name} ${path}`;
  let address = addresses.get(key);
  if (!address) {
    let master = masters.get(name);
    if (!master) {
      master = masterFromSeed(seedFor(name));
      masters.set(name, master);
    }
    address = pubkeyToAddress(derivePath(master, path).pub, 'p2wpkh');
    addresses.set(key, address);
  }
  return address;
}

const built = new Map<string, Scenario>();

/** Builds the ledger for one setting of the switches. Deterministic; each setting is built once. */
export function buildScenario({ reuse, combine }: ScenarioOptions): Scenario {
  const cacheKey = `${reuse}/${combine}`;
  const cached = built.get(cacheKey);
  if (cached) return cached;

  const wallet: Scenario['wallet'] = [];
  const hers = (path: string): string => {
    const address = addressAt('alice', path);
    if (!wallet.some((entry) => entry.path === path)) wallet.push({ address, path });
    return address;
  };
  const receiveAt = (index: number) => hers(`${RECEIVE_PATH}/${reuse ? 0 : index}`);
  const changeAt = (index: number) => hers(reuse ? `${RECEIVE_PATH}/0` : `${CHANGE_PATH}/${index}`);
  const theirs = (party: PartyId) => addressAt(party, `${RECEIVE_PATH}/0`);

  // Each payer starts with one coin, just large enough for the payment and its fee.
  let utxos: Utxo[] = RECEIPTS.map((amount, index) => ({
    txid: sha256Hex(`funding/${PARTIES[index]}`),
    vout: 0,
    value: amount + BASE_FEE + FEE_PER_INPUT,
    owner: theirs(PARTIES[index]),
  }));

  const txs: LedgerTx[] = [];
  const record = (tx: Tx, kind: LedgerTx['kind'], party: PartyId, roles: LedgerOutput['role'][]) => {
    const spent = tx.inputs.map((input) => {
      const coin = utxos.find((utxo) => utxo.txid === input.txid && utxo.vout === input.vout);
      if (!coin) throw new Error('scenario spends a coin that does not exist');
      return { address: coin.owner, value: coin.value };
    });
    const paid = fee(tx, utxos);
    // applyTx rejects anything invalid, so a ledger that builds is a ledger that checks out.
    utxos = applyTx(utxos, tx);
    txs.push({
      number: txs.length + 1,
      txid: txid(tx),
      kind,
      party,
      inputs: spent,
      outputs: tx.outputs.map((output, index) => ({ address: output.owner, value: output.value, role: roles[index] })),
      fee: paid,
    });
  };

  RECEIPTS.forEach((amount, index) => {
    const coin = utxos[0];
    record(
      { inputs: [{ txid: coin.txid, vout: coin.vout }], outputs: [{ value: amount, owner: receiveAt(index) }] },
      'receive',
      PARTIES[index],
      ['payment'],
    );
  });

  (combine ? LARGE_BILLS : SMALL_BILLS).forEach((amount, index) => {
    const mine = new Set(wallet.map((entry) => entry.address));
    const selection = selectCoins(
      utxos.filter((utxo) => mine.has(utxo.owner)),
      amount,
      FEE_PER_INPUT,
      BASE_FEE,
    );
    if (!selection) throw new Error('scenario cannot fund a payment');
    const party = PARTIES[3 + index];
    record(buildPayment(selection, theirs(party), amount, changeAt(index), DUST), 'pay', party, ['payment', 'change']);
  });

  const scenario: Scenario = { txs, wallet, known: txs[0].outputs[0].address };
  built.set(cacheKey, scenario);
  return scenario;
}

/**
 * The payment the two-models scene quotes on both sides of the wall: the
 * first thing she buys when every coin has its own address, her first coin
 * spent at the shop. Taken from the ledger so that the line the public reads
 * there is a line of the ledger the next scene draws.
 */
export function examplePayment(): { from: string; to: string; amount: bigint } {
  const tx = buildScenario({ reuse: false, combine: false }).txs[3];
  return { from: tx.inputs[0].address, to: tx.outputs[0].address, amount: tx.outputs[0].value };
}

/** The ledger with everything private stripped away: what the observer works from. */
export function toPublic(txs: readonly LedgerTx[]): PublicTx[] {
  return txs.map((tx) => ({
    id: tx.txid,
    inputs: tx.inputs.map((input) => input.address),
    outputs: tx.outputs.map((output) => output.address),
  }));
}
