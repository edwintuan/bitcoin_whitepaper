import { ACTORS } from '@/content/actors';
import type { ActorId, WhoRunsItem } from '@/content/types';
import { UI } from '@/content/ui';
import { useSettings, useT } from '@/i18n/settings';
import { Rich } from './Rich';

/** Square, heavy-stroke pictograms, one per actor. Drawn on a 28 × 28 grid. */
export function ActorIcon({ id, size = 28 }: { id: ActorId; size?: number }) {
  return (
    <svg
      className="actor-icon"
      viewBox="0 0 28 28"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="square"
      aria-hidden="true"
    >
      {ICONS[id]}
    </svg>
  );
}

const ICONS: Record<ActorId, React.ReactNode> = {
  'software-wallet': (
    <>
      <rect x="3" y="7" width="22" height="16" />
      <path d="M3 12h22" />
      <rect x="17" y="15" width="5" height="4" fill="currentColor" stroke="none" />
    </>
  ),
  'hardware-wallet': (
    <>
      <rect x="8" y="3" width="12" height="22" />
      <rect x="11" y="6" width="6" height="7" />
      <path d="M12 20h4" />
    </>
  ),
  'full-node': (
    <>
      <rect x="4" y="4" width="20" height="8" />
      <rect x="4" y="16" width="20" height="8" />
      <path d="M8 8h2M8 20h2" />
    </>
  ),
  'mining-pool': (
    <>
      <rect x="3" y="3" width="6" height="6" />
      <rect x="11" y="3" width="6" height="6" />
      <rect x="19" y="3" width="6" height="6" />
      <path d="M6 9v5h16V9M14 9v9" />
      <rect x="9" y="18" width="10" height="7" fill="currentColor" stroke="none" />
    </>
  ),
  'asic-miner': (
    <>
      <rect x="7" y="7" width="14" height="14" />
      <path d="M11 3v4M17 3v4M11 21v4M17 21v4M3 11h4M3 17h4M21 11h4M21 17h4" />
      <rect x="11" y="11" width="6" height="6" fill="currentColor" stroke="none" />
    </>
  ),
  'light-client': (
    <>
      <rect x="8" y="3" width="12" height="22" />
      <path d="M11 8h6M11 12h6M11 16h3M12.5 21h3" />
    </>
  ),
  explorer: (
    <>
      <rect x="4" y="4" width="13" height="13" />
      <path d="M17 17l7 7" />
    </>
  ),
};

/**
 * "Who runs this in the real world": for one step of the paper, the actors
 * that carry it out, each with one concrete thing to hold on to.
 */
export function WhoRuns({ items }: { items: WhoRunsItem[] }) {
  const t = useT();
  const { depth } = useSettings();

  return (
    <ul className="who">
      {items.map((item) => {
        const actor = ACTORS[item.actor];
        return (
          <li className="who-item" key={`${item.actor}-${item.artifact.label}`}>
            <p className="who-head">
              <ActorIcon id={item.actor} />
              <span className="who-name poster">{t(actor.name)}</span>
            </p>
            <p className="who-role ui">
              <Rich text={t(item.role)} />
            </p>
            <p className="who-artifact-head">
              <span className="tag">{t(UI.artifact[item.artifact.kind])}</span>
              <code className="who-label">{item.artifact.label}</code>
            </p>
            <p className="who-detail ui">
              <Rich text={t(item.artifact.detail)} />
            </p>
            {item.artifact.snippet && depth === 'developer' ? (
              <pre className="who-snippet on-ink" tabIndex={0}>
                {item.artifact.snippet}
              </pre>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
