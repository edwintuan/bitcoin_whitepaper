import { useMemo, useState } from 'react';
import { MiniTree } from '@/components/viz/merkle/MiniTree';
import { useT } from '@/i18n/settings';
import { merkleLevels, merkleProof, verifyProof } from '@/lib/merkle';
import { txid } from '@/lib/tx';
import { fill } from '@/text/format';
import './visuals.css';

const COPY = {
  caption: {
    en: 'To prove one transaction you need only the orange hashes, one for each level below the root; press another transaction to see its branch.',
    zh: '要證明一筆交易，只需橙色的那幾個哈希，根以下每層一個；按下另一筆交易，便可看到它的分支。',
  },
  root: { en: 'root', zh: '根' },
  leaf: { en: 'Show the branch for transaction {n}', zh: '顯示第 {n} 筆交易的分支' },
  result: { en: 'Tx{n} + {count} hashes → root', zh: 'Tx{n} + {count} 個哈希 → 根' },
};

const IDS = [0, 1, 2, 3].map((index) =>
  txid({ inputs: [], outputs: [{ value: BigInt(1000 * (index + 1)), owner: 'payee' }] }),
);
const LEVELS = merkleLevels(IDS);
const ROOT = LEVELS[2][0];

/** The same four-leaf tree, with one transaction's Merkle branch picked out and checked. */
export default function MerkleBranchVisual() {
  const t = useT();
  const [picked, setPicked] = useState(2);

  const proof = useMemo(() => merkleProof(IDS, picked), [picked]);
  const holds = verifyProof(IDS[picked], proof, ROOT);

  return (
    <div className="tv">
      <MiniTree
        levels={LEVELS}
        rootLabel={t(COPY.root)}
        leafName={(index) => `Tx${index}`}
        leafLabel={(index) => fill(t(COPY.leaf), { n: index })}
        pressed={(index) => index === picked}
        onLeaf={setPicked}
        tone={(level, index) => {
          const onPath = picked >> level;
          // The branch is the neighbour of each node on the way up.
          if (level < 2 && index === (onPath ^ 1)) return 'hit';
          return index === onPath ? 'on' : 'dim';
        }}
      />
      <div className="tv-row" style={{ marginTop: 6 }}>
        <span>{fill(t(COPY.result), { n: picked, count: proof.length })}</span>
        <span className="tv-hit">{holds ? '✓' : '✕'}</span>
      </div>
      <p className="tv-cap">{t(COPY.caption)}</p>
    </div>
  );
}
