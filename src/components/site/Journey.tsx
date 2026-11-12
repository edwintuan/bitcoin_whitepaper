import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { HashText } from '@/components/viz/HashText';
import { ACTORS } from '@/content/actors';
import { JOURNEY } from '@/content/journey';
import type { StationId } from '@/content/journey';
import { SECTION_IDS } from '@/content/types';
import { useSettings, useT } from '@/i18n/settings';
import { merkleParent } from '@/lib/merkle';
import { mineSync } from '@/lib/miner';
import { useInView } from '@/state/useInView';
import { usePageVisible, useReducedMotion } from '@/state/useMediaQuery';
import { useMiner } from '@/state/useMiner';
import { formatBtc, formatCount, shortHex } from '@/text/format';
import { buildStory } from './journey/story';
import { Rich } from './Rich';
import { ActorIcon } from './WhoRuns';

const STATIONS = JOURNEY.list;
const LAST = STATIONS.length - 1;
const MINER = STATIONS.findIndex((station) => station.id === 'miner');
const NETWORK = STATIONS.findIndex((station) => station.id === 'network');
const FULL_CONFIRMATIONS = 6;

/** Hashes per second while the reader watches the miner stop. */
const MINER_RATE = 2600;

const shortAddress = (address: string) => shortHex(address, 10, 6);

interface Solved {
  nonce: number;
  hash: string;
  tried: number;
}

/**
 * The page's overview: one payment followed through the seven kinds of
 * software and hardware that handle it. Every value shown is computed with
 * the same engine as the figures: a real transaction id, a real signature, a
 * header really mined, a Merkle branch really verified.
 */
export function Journey() {
  const t = useT();
  const { lang } = useSettings();
  const ref = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLOListElement>(null);
  const onScreen = useInView(ref);
  const pageVisible = usePageVisible();
  const reducedMotion = useReducedMotion();

  const story = useMemo(buildStory, []);
  const [active, setActive] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [solved, setSolved] = useState<Solved | null>(null);
  const [confirmations, setConfirmations] = useState(0);

  const live = onScreen && pageVisible;
  // With reduced motion the reader steps through by hand; nothing advances by itself.
  const running = playing && live && !reducedMotion;
  const { view, start, reset: resetMiner } = useMiner({ active: live, maxRate: MINER_RATE, calm: reducedMotion });

  // The miner stop: search for real until the header meets its target.
  useEffect(() => {
    if (active !== MINER || solved) return;
    start(story.header, story.target, (found) =>
      setSolved({ nonce: found.nonce, hash: found.hash, tried: found.tried }),
    );
    return resetMiner;
  }, [active, solved, story, start, resetMiner]);

  // Jumping straight to a later stop still needs the mined block.
  useEffect(() => {
    if (active > MINER && !solved) {
      const found = mineSync(story.header, story.target, 5_000_000);
      setSolved({ nonce: found.nonce, hash: found.hash, tried: found.tried });
    }
  }, [active, solved, story]);

  // The network stop: blocks pile up on top, one confirmation each.
  useEffect(() => {
    if (active < NETWORK) {
      setConfirmations(0);
      return;
    }
    if (active > NETWORK || reducedMotion) {
      setConfirmations(FULL_CONFIRMATIONS);
      return;
    }
    setConfirmations(1);
    const timer = window.setInterval(
      () => setConfirmations((n) => (n >= FULL_CONFIRMATIONS ? n : n + 1)),
      450,
    );
    return () => window.clearInterval(timer);
  }, [active, reducedMotion]);

  // Move on once the current stop has shown what it has to show.
  useEffect(() => {
    if (!running || active < 0) return;
    if (active === MINER && !solved) return;
    if (active === NETWORK && confirmations < FULL_CONFIRMATIONS) return;
    if (active === LAST) {
      setPlaying(false);
      return;
    }
    const dwell = active === MINER ? 1800 : active === NETWORK ? 1400 : 3800;
    const timer = window.setTimeout(() => setActive((index) => index + 1), dwell);
    return () => window.clearTimeout(timer);
  }, [running, active, solved, confirmations]);

  // On narrow screens the track scrolls sideways: keep the current stop in view.
  useEffect(() => {
    if (active < 0 || !onScreen) return;
    const track = trackRef.current;
    const item = track?.children[active] as HTMLElement | undefined;
    if (!track || !item || track.scrollWidth <= track.clientWidth) return;
    track.scrollTo({ left: item.offsetLeft - (track.clientWidth - item.offsetWidth) / 2 });
  }, [active, onScreen]);

  const send = () => {
    setSolved(null);
    setActive(0);
    setPlaying(true);
  };
  const pick = (index: number) => {
    setPlaying(false);
    setActive(index);
  };

  const station = active >= 0 ? STATIONS[active] : null;
  const l = JOURNEY.labels;

  const artifacts: Record<StationId, () => ReactNode> = {
    wallet: () => (
      <>
        <p className="ja-head">
          <span className="tag tag-line">{t(l.unsigned)}</span>
        </p>
        {story.inputs.map((coin) => (
          <p className="ja-row" key={`${coin.txid}:${coin.vout}`}>
            <span className="ja-key">{t(l.in)}</span>
            <span>
              {formatBtc(coin.value)} BTC <span className="ja-dim">{shortHex(coin.txid, 10, 0)}:{coin.vout}</span>
            </span>
          </p>
        ))}
        <p className="ja-row ja-hit">
          <span className="ja-key">{t(l.out)}</span>
          <span>
            {formatBtc(story.amount)} BTC → {t(l.toBob)} <span className="ja-dim">{shortAddress(story.bob.address)}</span>
          </span>
        </p>
        <p className="ja-row">
          <span className="ja-key">{t(l.out)}</span>
          <span>
            {formatBtc(story.change)} BTC → {t(l.change)}
          </span>
        </p>
        <p className="ja-row ja-rule">
          <span className="ja-key">{t(l.fee)}</span>
          <span>{formatBtc(story.fee)} BTC</span>
        </p>
      </>
    ),
    signer: () => (
      <>
        <p className="ja-head">
          <span className="tag tag-orange">{t(l.signed)}</span>
        </p>
        <p className="ja-stack">
          <span className="ja-key">{t(l.txid)}</span>
          <span className="ja-break">{story.txid}</span>
        </p>
        <p className="ja-stack">
          <span className="ja-key">{t(l.signature)}</span>
          <span className="ja-break">{story.signature}</span>
        </p>
        <p className="ja-check ja-rule">{t(l.verified)}</p>
      </>
    ),
    node: () => (
      <div>
        {[l.coinsExist, l.unspent, l.sigValid, l.inMempool].map((line, index) => (
          <p className="ja-check t-rise" key={line.en} style={{ '--i': index * 7 } as CSSProperties}>
            {t(line)}
          </p>
        ))}
        <p className="ja-rule ja-dim">$ bitcoin-cli sendrawtransaction &lt;hex&gt;</p>
        <p className="ja-break">{story.txid}</p>
      </div>
    ),
    pool: () => (
      <>
        <p className="ja-head">
          <span className="tag tag-line">{t(l.template)}</span>
        </p>
        {story.blockTxids.map((id, index) => (
          <p className={`ja-row ${index === story.txIndex ? 'ja-hit' : ''}`} key={id}>
            <span className="ja-key">tx {index}</span>
            <span>
              {shortHex(id, 10, 4)}{' '}
              <span className="ja-dim">
                {index === 0 ? t(l.coinbase) : index === story.txIndex ? t(l.ours) : t(l.stranger)}
              </span>
            </span>
          </p>
        ))}
        <p className="ja-stack ja-rule">
          <span className="ja-key">{t(l.merkleRoot)}</span>
          <span className="ja-break">{story.merkleRoot}</span>
        </p>
      </>
    ),
    miner: () => {
      const nonce = solved ? solved.nonce : view.nonce;
      const hash = solved ? solved.hash : view.hash;
      const tried = solved ? solved.tried : view.tried;
      return (
        <>
          <p className="ja-head">
            <span className={`tag ${solved ? 'tag-orange' : 'tag-line'}`}>{solved ? t(l.found) : t(l.searching)}</span>
            <span className="ja-dim">
              {story.zeroBits} zero bits · {formatCount(tried)} {t(l.tries)}
            </span>
          </p>
          <p className="ja-row">
            <span className="ja-key">{t(l.nonce)}</span>
            <span>{formatCount(nonce)}</span>
          </p>
          <p className="ja-stack">
            <span className="ja-key">{t(l.hash)}</span>
            <span className={solved ? 'ja-break ja-hit t-pop' : 'ja-break'}>{hash ? <HashText hash={hash} full /> : '…'}</span>
          </p>
        </>
      );
    },
    network: () => (
      <>
        <p className="ja-blocks" aria-hidden="true">
          {Array.from({ length: FULL_CONFIRMATIONS }, (_, index) => (
            <i key={index} data-on={index < confirmations} data-first={index === 0} className={index < confirmations ? 't-slam' : undefined} />
          ))}
        </p>
        <p className="ja-big">
          {confirmations} <span>{t(l.confirmations)}</span>
        </p>
        <p className="ja-dim ja-note">{t(l.confirmNote)}</p>
      </>
    ),
    light: () => {
      let running = story.txid;
      return (
        <>
          <p className="ja-head">
            <span className="tag tag-line">{t(l.branch)}</span>
            <span className="ja-dim">
              {story.proof.length} {t(l.proofSize)}
            </span>
          </p>
          <p className="ja-row ja-hit">
            <span className="ja-key">tx</span>
            <span>{shortHex(story.txid, 14, 6)}</span>
          </p>
          {story.proof.map((step, index) => {
            running = step.position === 'left' ? merkleParent(step.hash, running) : merkleParent(running, step.hash);
            return (
              <p className="ja-row" key={index}>
                <span className="ja-key">
                  + {t(l.sibling)}
                </span>
                <span>
                  {shortHex(step.hash, 10, 0)} <span className="ja-dim">→</span> {shortHex(running, 14, 6)}
                </span>
              </p>
            );
          })}
          <p className="ja-check ja-rule">{t(l.matches)}</p>
        </>
      );
    },
  };

  return (
    <section id="journey" ref={ref} className="journey on-ink" aria-labelledby="journey-title">
      <div className="wrap">
        <header className="journey-head">
          <div>
            <p className="label journey-kicker">{t(JOURNEY.kicker)}</p>
            <h2 id="journey-title" className="journey-title poster">
              <span className="poster-scale">{t(JOURNEY.title)}</span>
            </h2>
            <p className="journey-lede">{t(JOURNEY.lede)}</p>
          </div>
          <div className="journey-controls">
            <button type="button" className="btn" onClick={send}>
              {active >= 0 ? t(JOURNEY.again) : t(JOURNEY.send)}
            </button>
            {active >= 0 && active < LAST && !reducedMotion ? (
              <button type="button" className="btn btn-line btn-sm" onClick={() => setPlaying((value) => !value)}>
                {playing ? t(JOURNEY.pause) : t(JOURNEY.resume)}
              </button>
            ) : null}
            {active >= 0 && active < LAST ? (
              <button type="button" className="btn btn-line btn-sm" onClick={() => pick(active + 1)}>
                {t(JOURNEY.next)}
              </button>
            ) : null}
          </div>
        </header>

        <div className="journey-rail" data-started={active >= 0} style={{ '--i': Math.max(active, 0) } as CSSProperties}>
          <ol className="journey-track" ref={trackRef} aria-label={t(JOURNEY.stations)}>
            {STATIONS.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="station"
                  data-state={index === active ? 'active' : index < active ? 'done' : 'todo'}
                  aria-current={index === active ? 'step' : undefined}
                  onClick={() => pick(index)}
                >
                  <span className="station-top">
                    <span className="station-no mono">{String(index + 1).padStart(2, '0')}</span>
                    <ActorIcon id={item.actor} size={24} />
                  </span>
                  <span className="station-name poster">{t(item.name ?? ACTORS[item.actor].name)}</span>
                  <span className="station-verb ui">{t(item.verb)}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="journey-token" aria-hidden="true" />
        </div>

        <div className="journey-panel">
          {station ? (
            <div key={`${station.id}-${lang}`} className="journey-detail t-reveal">
              <div>
                <p className="label journey-step">
                  {lang === 'en'
                    ? `${t(JOURNEY.stop)} ${active + 1} / ${STATIONS.length}`
                    : `${t(JOURNEY.stop)} ${active + 1} ${t(JOURNEY.stopSuffix)}（共 ${STATIONS.length} 站）`}
                  <span className="journey-speaks">{station.speaks}</span>
                </p>
                <h3 className="journey-detail-title poster">
                  <span className="poster-scale">{t(station.title)}</span>
                </h3>
                <p className="journey-detail-text">
                  <Rich text={t(station.text)} />
                </p>
                <p className="label journey-links">
                  <span>{t(JOURNEY.explainedIn)}</span>
                  {station.sections.map((number) => (
                    <a key={number} href={`#${SECTION_IDS[number]}`}>
                      §{number}
                    </a>
                  ))}
                </p>
              </div>
              <div className="journey-artifact mono">{artifacts[station.id]()}</div>
            </div>
          ) : (
            <p className="journey-idle ui">{t(JOURNEY.idle)}</p>
          )}
        </div>
      </div>
    </section>
  );
}
