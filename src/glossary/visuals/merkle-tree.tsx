import { useMemo, useState } from 'react';
import { MiniTree } from '@/components/viz/merkle/MiniTree';
import { useT } from '@/i18n/settings';
import { merkleLevels } from '@/lib/merkle';
import { txid } from '@/lib/tx';
import { fill } from '@/text/format';
import './visuals.css';

const COPY = {
  caption: {
    en: 'Press a transaction to alter it: its hash changes, and so does every hash above it, all the way to the root.',
    zh: '按下任何一筆交易把它改動：它的哈希隨即改變，其上每一個哈希亦然，一直到根。',
  },
  root: { en: 'root', zh: '根' },
  leaf: { en: 'Alter transaction {n}', zh: '改動第 {n} 筆交易' },
};

/** A transaction and its altered twin: the amount differs by one satoshi, so the id differs entirely. */
const idOf = (index: number, altered: boolean) =>
  txid({ inputs: [], outputs: [{ value: BigInt(1000 * (index + 1) + (altered ? 1 : 0)), owner: 'payee' }] });

/** Four real transaction ids hashed into a root; altering one recomputes the path above it. */
export default function MerkleTreeVisual() {
  const t = useT();
  const [altered, setAltered] = useState([false, false, false, false]);
  const [last, setLast] = useState<number | null>(null);

  const levels = useMemo(() => merkleLevels(altered.map((flag, i) => idOf(i, flag))), [altered]);

  return (
    <div className="tv">
      <MiniTree
        levels={levels}
        rootLabel={t(COPY.root)}
        leafName={(index) => `Tx${index}`}
        leafLabel={(index) => fill(t(COPY.leaf), { n: index })}
        pressed={(index) => altered[index]}
        onLeaf={(index) => {
          setAltered((flags) => flags.map((flag, i) => (i === index ? !flag : flag)));
          setLast(index);
        }}
        // The altered leaf and everything hashed from it.
        tone={(level, index) => (last !== null && index === last >> level ? 'hit' : 'on')}
      />
      <p className="tv-cap">{t(COPY.caption)}</p>
    </div>
  );
}
