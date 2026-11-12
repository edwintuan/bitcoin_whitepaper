import { useMemo, useState } from 'react';
import { Slider } from '@/components/base/slider/slider';
import { HashText } from '@/components/viz/HashText';
import { useSettings, useT } from '@/i18n/settings';
import { verifyProof } from '@/lib/merkle';
import { fill, formatCount } from '@/text/format';
import { cx } from '@/utils/cx';
import { COPY } from './copy';
import { MAX_DOUBLINGS, MIN_DOUBLINGS, bigBlock } from './model';
import { HASH_BYTES, sizeStatus } from './sentences';

/**
 * How a proof grows with the block: a real tree of up to 4,096 transaction
 * ids is built for each position of the slider, and the branch for one of
 * them is listed hash by hash.
 */
export function SizeScene({ visible, highlight }: { visible: boolean; highlight: 'size' | null }) {
  const t = useT();
  const { lang } = useSettings();
  const [doublings, setDoublings] = useState(MIN_DOUBLINGS);

  const block = useMemo(() => bigBlock(doublings), [doublings]);
  const holds = useMemo(() => verifyProof(block.txid, block.proof, block.root), [block]);

  return (
    <div className="fig-stack" hidden={!visible}>
      <p className="fig-note">{t(COPY.sizeIntro)}</p>

      <div className={cx('spv-size', highlight === 'size' && 'fig-pointed')}>
        <p className="label spv-size-cap">{t(COPY.blockSize)}</p>
        {/* The slider steps through powers of two, and is named for that: the count beside it is what it gives. */}
        <Slider
          thumbLabel={t(COPY.sizeThumb)}
          minValue={MIN_DOUBLINGS}
          maxValue={MAX_DOUBLINGS}
          step={1}
          value={doublings}
          onChange={setDoublings}
        />
        <span className="stat-value" aria-live="polite">
          {formatCount(block.count)}
        </span>
      </div>

      <dl className="spv-facts fig-group">
        <div data-accent="true">
          <dt className="label">{t(COPY.inBranch)}</dt>
          <dd className="stat-value">{block.proof.length}</dd>
        </div>
        <div data-accent="true">
          <dt className="label">{t(COPY.branchBytes)}</dt>
          <dd className="stat-value">{formatCount(block.proof.length * HASH_BYTES)}</dd>
        </div>
        <div>
          <dt className="label">{t(COPY.idBytes)}</dt>
          <dd className="stat-value">{formatCount(block.count * HASH_BYTES)}</dd>
        </div>
      </dl>

      <div className="fig-group">
        <p className="label spv-ladder-cap">
          <span>{fill(t(COPY.ladderLabel), { index: block.index })}</span>
          <span className={`tag ${holds ? 'tag-valid' : 'tag-invalid'}`}>
            {holds ? '✓' : '✕'} {t(COPY.verified)}
          </span>
        </p>
        <ol className="spv-ladder mono">
          {block.proof.map((entry, level) => (
            <li className="spv-rung t-rise" key={level}>
              <span className="spv-rung-no">{level + 1}</span>
              <span className="spv-rung-side">{t(entry.position === 'left' ? COPY.left : COPY.right)}</span>
              <HashText hash={entry.hash} lead={20} tail={0} zeros={false} />
            </li>
          ))}
        </ol>
      </div>

      <p className="fig-status" role="status">
        {sizeStatus(lang, block.count, block.proof.length)}
      </p>
    </div>
  );
}
