/**
 * What anyone can work out from the public ledger about who owns which
 * address, using only the two links whitepaper section 10 names:
 *
 * - an address used twice is the same owner both times (it is the same key);
 * - the inputs of one transaction were all signed for by one owner.
 *
 * Nothing else is assumed. In particular the outputs of a transaction are not
 * joined to its inputs: these rules cannot tell the change from the payment.
 */

/** A transaction as the public sees it: which addresses it spent from, which it paid to. */
export interface PublicTx {
  id: string;
  /** The address of every output this transaction spends, one per input. */
  inputs: string[];
  /** The address of every output it creates. */
  outputs: string[];
}

/**
 * Groups addresses by owner. Every address in the ledger appears in exactly
 * one group; an address nothing links to another is a group of one. Groups,
 * and the addresses inside them, are in order of first appearance.
 */
export function clusterAddresses(txs: readonly PublicTx[]): string[][] {
  // Union-find over address strings. A reused address is one string, so the
  // first rule holds without any work.
  const parent = new Map<string, string>();
  const find = (address: string): string => {
    let root = address;
    while (parent.get(root) !== root) root = parent.get(root) as string;
    // Point everything on the way straight at the root.
    for (let at = address; at !== root; ) {
      const next = parent.get(at) as string;
      parent.set(at, root);
      at = next;
    }
    return root;
  };
  const seen = (address: string) => {
    if (!parent.has(address)) parent.set(address, address);
  };

  for (const tx of txs) {
    tx.inputs.forEach(seen);
    tx.outputs.forEach(seen);
    // The second rule: co-spent inputs share an owner.
    const first = tx.inputs[0];
    for (const other of tx.inputs.slice(1)) parent.set(find(other), find(first));
  }

  const groups = new Map<string, string[]>();
  for (const address of parent.keys()) {
    const root = find(address);
    const group = groups.get(root);
    if (group) group.push(address);
    else groups.set(root, [address]);
  }
  // Map keeps insertion order, and addresses were inserted as they appeared.
  return [...groups.values()];
}

/** The group that holds `address`. An address the ledger never mentions is a group of one. */
export function ownerCluster(clusters: readonly string[][], address: string): string[] {
  return clusters.find((cluster) => cluster.includes(address)) ?? [address];
}

/** Ids of the transactions that pay to, or spend from, any address in `cluster`, in ledger order. */
export function transactionsTouching(txs: readonly PublicTx[], cluster: readonly string[]): string[] {
  const members = new Set(cluster);
  return txs
    .filter((tx) => tx.inputs.some((address) => members.has(address)) || tx.outputs.some((address) => members.has(address)))
    .map((tx) => tx.id);
}

/** Everything an observer can conclude once it learns who owns one address. */
export interface Observation {
  /** Every group of addresses the two rules join. */
  clusters: string[][];
  /** The addresses now known to belong to the owner of `known`. */
  attributed: string[];
  /** The transactions that can be tied to that owner. */
  tied: string[];
}

/**
 * The paper's risk, computed: "if the owner of a key is revealed, linking
 * could reveal other transactions that belonged to the same owner."
 */
export function observe(txs: readonly PublicTx[], known: string): Observation {
  const clusters = clusterAddresses(txs);
  const attributed = ownerCluster(clusters, known);
  return { clusters, attributed, tied: transactionsTouching(txs, attributed) };
}
