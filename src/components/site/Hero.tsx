import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { BlockTile, ChainRow } from '@/components/viz/BlockTile';
import { HashText } from '@/components/viz/HashText';
import { UI } from '@/content/ui';
import { useSettings, useT } from '@/i18n/settings';
import { fill, formatCount } from '@/text/format';
import { useInView } from '@/state/useInView';
import { usePageVisible, useReducedMotion } from '@/state/useMediaQuery';
import { useMiner } from '@/state/useMiner';
import { HERO_RATE, HERO_SEED, HERO_TARGET, HERO_ZERO_BITS, heroHeader } from './hero/chain';
import type { HeroBlock } from './hero/chain';

const SHIFT = { '--shift-from': 'calc(100% + 22px)' } as CSSProperties;

/**
 * The opening screen. The chain under the title is not an animation of
 * mining: each block is a real 80-byte header, searched nonce by nonce with
 * double SHA-256 until its hash meets the target.
 */
export function Hero() {
  const t = useT();
  const { lang } = useSettings();
  const ref = useRef<HTMLElement>(null);
  const onScreen = useInView(ref);
  const pageVisible = usePageVisible();
  const reducedMotion = useReducedMotion();

  const [paused, setPaused] = useState(false);
  const [chain, setChain] = useState<readonly HeroBlock[]>(HERO_SEED);
  const [found, setFound] = useState<HeroBlock | null>(null);
  const [advances, setAdvances] = useState(0);

  const { view, start } = useMiner({
    active: onScreen && pageVisible && !paused,
    maxRate: HERO_RATE,
    calm: reducedMotion,
  });

  const tip = chain[chain.length - 1];
  const height = tip.height + 1;

  // A new block starts with nothing timed yet: until it has been, the speed shown is the last one measured.
  const [speed, setSpeed] = useState(HERO_RATE);
  useEffect(() => {
    if (view.rate > 0) setSpeed(view.rate);
  }, [view.rate]);

  // Search for the next block as soon as there is a new tip.
  useEffect(() => {
    start(heroHeader(tip.height + 1, tip.hash, 0), HERO_TARGET, (result) => {
      setFound({ height: tip.height + 1, prev: tip.hash, nonce: result.nonce, hash: result.hash });
    });
  }, [tip, start]);

  // Let a found block stand for a moment, then make it the new tip.
  useEffect(() => {
    if (!found) return;
    const timer = window.setTimeout(() => {
      setChain((blocks) => [...blocks.slice(-3), found]);
      setFound(null);
      setAdvances((n) => n + 1);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [found]);

  const [before, emphasis, after] = t(UI.hero.title);
  const other = lang === 'en' ? UI.hero.title.zh.join('') : UI.hero.title.en.join('');
  const moved = advances > 0;

  const status = found
    ? fill(t(UI.hero.found), { height: found.height, tried: formatCount(found.nonce + 1) })
    : paused
      ? t(UI.hero.pausedNote)
      : fill(t(UI.hero.mining), {
          height,
          bits: HERO_ZERO_BITS,
          tried: formatCount(view.tried),
          rate: formatCount(Math.round(speed)),
        });

  return (
    <section ref={ref} className="hero" aria-labelledby="hero-title">
      <div className="wrap">
        <p className="hero-kicker label">
          <span>{t(UI.hero.kickerLeft)}</span>
          <span>{t(UI.hero.kickerRight)}</span>
        </p>

        <h1 id="hero-title" className="hero-title poster" aria-label={`${before}${emphasis}${after}`}>
          <span aria-hidden="true" className="poster-scale">
            {before}
            <span className="hero-em">{emphasis}</span>
            {after}
          </span>
        </h1>
        <p className="hero-alt" lang={lang === 'en' ? 'zh-Hant-HK' : 'en'}>
          {other}
        </p>
        <p key={lang} className="hero-lede t-swap-soft">
          {t(UI.hero.lede)}
        </p>

        <div className="hero-live" role="img" aria-label={t(UI.hero.chainLabel)}>
          <ChainRow className="hero-chain">
            {chain.map((block) => (
              <BlockTile
                key={`${block.height}-${advances}`}
                className={moved ? 't-shift' : undefined}
                style={SHIFT}
                title={`${t(UI.block)} ${block.height}`}
                status={`${tip.height - block.height + 1} ${t(UI.hero.conf)}`}
                rows={[
                  { label: 'prev', value: <HashText hash={block.prev} lead={10} tail={0} /> },
                  { label: 'nonce', value: formatCount(block.nonce) },
                  { label: 'hash', value: <HashText hash={block.hash} lead={10} tail={0} /> },
                ]}
              />
            ))}
            <BlockTile
              key={`next-${height}`}
              className={moved && !found ? 't-shift-new' : undefined}
              style={SHIFT}
              title={`${t(UI.block)} ${height}`}
              status={found ? t(UI.hero.foundShort) : t(UI.hero.miningShort)}
              state={found ? 'found' : 'candidate'}
              rows={[
                { label: 'prev', value: <HashText hash={tip.hash} lead={10} tail={0} /> },
                { label: 'nonce', value: formatCount(found ? found.nonce : view.nonce) },
                {
                  label: 'hash',
                  value: found ? (
                    <HashText hash={found.hash} lead={10} tail={0} />
                  ) : view.hash ? (
                    <HashText hash={view.hash} lead={10} tail={0} />
                  ) : (
                    '…'
                  ),
                },
              ]}
            />
          </ChainRow>
        </div>
        <p className="hero-status mono" aria-hidden="true">
          {status}
        </p>

        <div className="hero-actions">
          <a className="btn btn-dark" href="#journey">
            {t(UI.hero.start)}
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M8 2v11M3 8.5l5 5 5-5" />
            </svg>
          </a>
          {/* The label says what a press will do; a pressed state on top of that would say it twice, and wrongly. */}
          <button type="button" className="btn btn-line btn-sm" onClick={() => setPaused((value) => !value)}>
            {paused ? t(UI.hero.resume) : t(UI.hero.pause)}
          </button>
          <span className="label hero-credit">{t(UI.credit)}</span>
        </div>
      </div>
    </section>
  );
}
