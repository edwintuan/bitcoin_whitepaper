/**
 * Where everything goes in the observer's graph. The ledger always has the
 * same shape (three coins in, three payments out), so the layout is fixed by
 * role: one lane per receipt, transactions always in the same six places.
 * Flipping a switch changes the addresses and the links, not the picture's bones.
 *
 * The graph is laid out in pixels for the width it is shown at, up to 340. A
 * narrower stage gets narrower lanes, never a scaled drawing, so the words
 * set in it stay the size they were written at.
 */
import type { LedgerTx, Scenario } from './scenario';

/** The widest the graph is drawn. */
export const GRAPH_WIDTH = 340;
export const GRAPH_HEIGHT = 214;
/** The narrowest it is laid out for: the stage of a 320 px phone. */
const MIN_WIDTH = 250;

/** The room the scene's words take beside the nodes, set at 11 px, so that the layout can keep it free. */
export const LABEL = {
  /** An ellipsis and the last four characters of an address. */
  width: 34,
  height: 12,
  /** Between a node and the label beneath it. A label beside a node stands three pixels further off. */
  gap: 2,
  /** The tag that names the one address the observer knows, to the left of that address. */
  tagWidth: 42,
  tagGap: 4,
};

const ROW = { payers: 14, receipts: 56, wallet: 102, payments: 150, payees: 198 };
/** Where several inputs are gathered before they enter one transaction. */
const COLLECT_Y = 126;
const TX_SIZE = 22;
const ADDRESS_SIZE = 12;
/** One address used for everything is drawn as a bar across all three lanes, this much taller and wider than a node. */
const BAR = { overhang: 14, height: 14 };

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

/** The three lanes and the reach of a change output for a drawing `width` pixels wide. */
function columns(width: number): { lanes: [number, number, number]; changeDx: number } {
  // The first lane leaves room for the tag at its left.
  const first = ADDRESS_SIZE / 2 + LABEL.tagGap + LABEL.tagWidth;
  // A change address sits to the right of the transaction that created it, with its label beneath.
  const changeDx = Math.round(clamp(width * 0.153, 30, 52));
  const spacing = (width - first - changeDx - 28) / 2;
  return { lanes: [first, Math.round(first + spacing), Math.round(first + 2 * spacing)], changeDx };
}

type Point = [number, number];

export interface TxNode {
  key: string;
  txid: string;
  number: number;
  x: number;
  y: number;
  size: number;
}

export interface AddressNode {
  key: string;
  address: string;
  /** The last four characters: enough to tell addresses apart at a glance. */
  tail: string;
  /** Centre of the node. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Where its label goes. */
  label: 'right' | 'below';
  /** Ground truth for the reader: this address is the owner's. The observer is not told. */
  mine: boolean;
}

export interface GraphEdge {
  key: string;
  from: string;
  to: string;
  /** `spend`: an address funds a transaction. `pay` and `change`: a transaction creates an output. */
  kind: 'spend' | 'pay' | 'change';
  txNumber: number;
  points: Point[];
  /** How many coins travel along it: more than one only when several coins sit at one address. */
  coins: number;
  /** True for inputs from different addresses spent together: the link the paper warns about. */
  joined: boolean;
}

export interface Graph {
  /** The width the graph was laid out for: draw it at exactly this many pixels. */
  width: number;
  txs: TxNode[];
  addresses: AddressNode[];
  edges: GraphEdge[];
}

const addressKey = (address: string) => `address ${address}`;
const txKey = (tx: LedgerTx) => `tx ${tx.number}`;

/** Lays the ledger out for a stage `available` pixels wide: at that width if it is between 250 and 340. */
export function layoutGraph(scenario: Scenario, available: number = GRAPH_WIDTH): Graph {
  const width = clamp(Math.round(available), MIN_WIDTH, GRAPH_WIDTH);
  const { lanes: LANES, changeDx: CHANGE_DX } = columns(width);
  const mine = new Set(scenario.wallet.map((entry) => entry.address));
  const oneAddress = scenario.wallet.length === 1;
  const half = TX_SIZE / 2;

  const txs: TxNode[] = scenario.txs.map((tx, index) => ({
    key: txKey(tx),
    txid: tx.txid,
    number: tx.number,
    x: LANES[index % 3],
    y: index < 3 ? ROW.receipts : ROW.payments,
    size: TX_SIZE,
  }));

  const addresses = new Map<string, AddressNode>();
  const place = (address: string, x: number, y: number, label: AddressNode['label'] = 'right') => {
    if (!addresses.has(address)) {
      addresses.set(address, {
        key: addressKey(address),
        address,
        tail: address.slice(-4),
        x,
        y,
        w: ADDRESS_SIZE,
        h: ADDRESS_SIZE,
        label,
        mine: mine.has(address),
      });
    }
  };
  if (oneAddress) {
    const address = scenario.wallet[0].address;
    addresses.set(address, {
      key: addressKey(address),
      address,
      tail: address.slice(-4),
      x: LANES[1],
      y: ROW.wallet,
      w: LANES[2] - LANES[0] + 2 * BAR.overhang,
      h: BAR.height,
      label: 'right',
      mine: true,
    });
  }

  const edges: GraphEdge[] = [];
  const edge = (tx: LedgerTx, kind: GraphEdge['kind'], address: string, points: Point[], coins = 1, joined = false) => {
    const node = addressKey(address);
    edges.push({
      key: `${kind} ${tx.number} ${edges.length}`,
      from: kind === 'spend' ? node : txKey(tx),
      to: kind === 'spend' ? txKey(tx) : node,
      kind,
      txNumber: tx.number,
      points,
      coins,
      joined,
    });
  };

  scenario.txs.forEach((tx, index) => {
    const x = LANES[index % 3];
    const walletEdge = ROW.wallet + (oneAddress ? BAR.height : ADDRESS_SIZE) / 2;

    if (tx.kind === 'receive') {
      const payer = tx.inputs[0].address;
      const hers = tx.outputs[0].address;
      place(payer, x, ROW.payers);
      place(hers, x, ROW.wallet);
      edge(tx, 'spend', payer, [
        [x, ROW.payers + ADDRESS_SIZE / 2],
        [x, ROW.receipts - half],
      ]);
      edge(tx, 'pay', hers, [
        [x, ROW.receipts + half],
        [x, 2 * ROW.wallet - walletEdge],
      ]);
      return;
    }

    const [payment, change] = tx.outputs;
    place(payment.address, x, ROW.payees);
    edge(tx, 'pay', payment.address, [
      [x, ROW.payments + half],
      [x, ROW.payees - ADDRESS_SIZE / 2],
    ]);

    if (oneAddress) {
      // Coins leave the bar on the left of the lane; the change climbs back on the right.
      edge(
        tx,
        'spend',
        tx.inputs[0].address,
        [
          [x - 6, walletEdge],
          [x - 6, ROW.payments - half],
        ],
        tx.inputs.length,
      );
      edge(tx, 'change', change.address, [
        [x + 6, ROW.payments - half],
        [x + 6, walletEdge],
      ]);
      return;
    }

    place(change.address, x + CHANGE_DX, ROW.payments, 'below');
    edge(tx, 'change', change.address, [
      [x + half, ROW.payments],
      [x + CHANGE_DX - ADDRESS_SIZE / 2, ROW.payments],
    ]);

    const together = new Set(tx.inputs.map((input) => input.address)).size > 1;
    for (const input of tx.inputs) {
      const from = addresses.get(input.address);
      if (!from) throw new Error('graph: a payment spends from an address that was never paid');
      if (from.y === ROW.payments) {
        // Change from the payment before, one step to the left.
        edge(tx, 'spend', input.address, [
          [from.x + ADDRESS_SIZE / 2, ROW.payments],
          [x - half, ROW.payments],
        ]);
      } else if (from.x === x && !together) {
        edge(tx, 'spend', input.address, [
          [x, walletEdge],
          [x, ROW.payments - half],
        ]);
      } else {
        edge(
          tx,
          'spend',
          input.address,
          [
            [from.x, walletEdge],
            [from.x, COLLECT_Y],
            [x, COLLECT_Y],
            [x, ROW.payments - half],
          ],
          1,
          together,
        );
      }
    }
  });

  return { width, txs, addresses: [...addresses.values()], edges };
}
