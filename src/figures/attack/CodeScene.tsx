import { useEffect, useMemo, useState } from 'react';
import { useFigure } from '@/components/site/FigureFrame';
import paper from '@/content/whitepaper/11-calculations';
import { useT } from '@/i18n/settings';
import attackSource from '@/lib/attack.ts?raw';
import { fill } from '@/text/format';
import { cx } from '@/utils/cx';
import { COPY } from './copy';
import { markOf, tokenizeListing } from './listing';
import type { Mark } from './listing';
import { paperListings, recomputeTables } from './tables';
import type { RecomputedTable } from './tables';
import { formatValue as value, portSource, traceAttack } from './trace';

const LISTINGS = paperListings(paper);
const PORT = portSource(attackSource);

// Worked out in the reader's browser the first time the scene opens, then kept:
// the search behind the last table takes a few milliseconds.
let recomputed: RecomputedTable[] | null = null;
const paperTables = (): RecomputedTable[] => (recomputed ??= recomputeTables(LISTINGS.tables));

/** A listing printed as the site prints source. `startLine` numbers the lines; the paper's code has none. */
function Listing({ code, startLine, active, label }: { code: string; startLine?: number; active: Mark | null; label: string }) {
  const lines = useMemo(() => tokenizeListing(code), [code]);
  const texts = useMemo(() => code.split('\n'), [code]);
  return (
    <div className="excerpt-code on-ink atk-listing" data-plain={startLine === undefined} tabIndex={0} role="group" aria-label={label}>
      {lines.map((tokens, index) => {
        const mark = markOf(texts[index]);
        return (
          <div className="code-line" key={index} data-noted={mark !== null} data-active={mark !== null && mark === active}>
            {startLine === undefined ? null : (
              <span className="code-no" aria-hidden="true">
                {startLine + index}
              </span>
            )}
            <code>
              {tokens.length === 0
                ? ' '
                : tokens.map((token, i) => (
                    <span key={i} data-k={token.kind}>
                      {token.text}
                    </span>
                  ))}
            </code>
          </div>
        );
      })}
    </div>
  );
}

interface CodeSceneProps {
  percent: number;
  z: number;
  /** The part the walkthrough is talking about, if it is one of these. */
  pointed?: 'watch' | 'tables' | null;
}

/**
 * The paper's function beside the one this page runs, with the loop's values
 * for the current q and z, and the paper's tables worked out again.
 */
export function CodeScene({ percent, z, pointed = null }: CodeSceneProps) {
  const t = useT();
  const { active, reducedMotion } = useFigure();
  const q = percent / 100;

  const trace = useMemo(() => traceAttack(q, z), [q, z]);
  const tables = paperTables();
  // The pass of the loop on show. It starts on the last one, where `sum` is the answer.
  const [pass, setPass] = useState(z);
  const [running, setRunning] = useState(false);
  const [mark, setMark] = useState<Mark | null>(null);

  useEffect(() => {
    if (!running || !active) return;
    const timer = window.setInterval(() => setPass((k) => Math.min(z, k + 1)), Math.max(60, Math.min(420, 3600 / (z + 1))));
    return () => window.clearInterval(timer);
  }, [running, active, z]);

  useEffect(() => {
    if (running && pass >= z) setRunning(false);
  }, [running, pass, z]);

  const k = Math.min(pass, z);
  const row = trace.rows[k];
  const canGoBack = k > 0 && !running;
  const canGoOn = k < z && !running;
  const lines = tables.reduce((count, table) => count + table.rows.length, 0);
  const differing = tables.reduce((count, table) => count + table.rows.filter((entry) => !entry.matches).length, 0);

  const watched: { mark: Mark; name: string; text: string; gloss: string }[] = [
    { mark: 'p', name: 'p', text: value(trace.p), gloss: t(COPY.gloss.p) },
    { mark: 'sum', name: 'q / p', text: value(trace.ratio), gloss: t(COPY.gloss.ratio) },
    { mark: 'lambda', name: 'lambda', text: value(trace.lambda), gloss: t(COPY.gloss.lambda) },
  ];
  const looped: { mark: Mark; name: string; text: string; gloss: string }[] = [
    { mark: 'poisson', name: 'poisson', text: value(row.poisson), gloss: t(COPY.gloss.poisson) },
    { mark: 'sum', name: '1 − (q/p)^(z−k)', text: value(1 - row.catchUp), gloss: t(COPY.gloss.miss) },
    { mark: 'sum', name: 'sum', text: value(row.sum), gloss: t(COPY.gloss.sum) },
  ];

  const watchRow = (entry: (typeof watched)[number], index: number) => (
    <div
      key={`${entry.name}-${index}`}
      className="atk-watch-row"
      data-on={mark === entry.mark}
      tabIndex={0}
      onMouseEnter={() => setMark(entry.mark)}
      onMouseLeave={() => setMark(null)}
      onFocus={() => setMark(entry.mark)}
      onBlur={() => setMark(null)}
    >
      <dt className="mono">{entry.name}</dt>
      <dd className="mono">{entry.text}</dd>
      <dd className="atk-gloss">{entry.gloss}</dd>
    </div>
  );

  return (
    <div className="atk-code fig-stack">
      <div className="atk-code-top">
        <div className="atk-code-paper">
          <p className="label atk-cap">{t(COPY.paperCode)}</p>
          <Listing code={LISTINGS.code} active={mark} label={t(COPY.paperCode)} />
        </div>

        <div className={cx('atk-watch', pointed === 'watch' && 'fig-pointed')}>
          <p className="label atk-cap">
            <span>{t(COPY.watch)}</span>
            <span className="atk-echo mono">
              q = {q.toFixed(2)} · z = {z}
            </span>
          </p>
          <dl className="atk-watch-list">{watched.map(watchRow)}</dl>

          <div className="atk-pass on-ink">
            <p className="mono atk-pass-now" aria-live={running ? 'off' : 'polite'}>
              {fill(t(COPY.pass), { n: k + 1, total: z + 1, k })}
            </p>
            <div className="atk-pass-buttons">
              {/* aria-disabled, not disabled: a button that reaches the end of its range when pressed would lose the focus. */}
              <button
                type="button"
                className="btn btn-sm btn-line"
                aria-label={t(COPY.prevPass)}
                aria-disabled={!canGoBack}
                onClick={() => {
                  if (canGoBack) setPass(k - 1);
                }}
              >
                −
              </button>
              <button
                type="button"
                className="btn btn-sm btn-line"
                aria-label={t(COPY.nextPass)}
                aria-disabled={!canGoOn}
                onClick={() => {
                  if (canGoOn) setPass(k + 1);
                }}
              >
                +
              </button>
              {reducedMotion || z === 0 ? null : running ? (
                <button type="button" className="btn btn-sm btn-dark" onClick={() => setRunning(false)}>
                  {t(COPY.stopLoop)}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => {
                    setPass(0);
                    setRunning(true);
                  }}
                >
                  {t(COPY.runLoop)}
                </button>
              )}
            </div>
          </div>

          <dl className="atk-watch-list">{looped.map(watchRow)}</dl>
          <dl className="atk-watch-list atk-watch-result">
            <div
              className="atk-watch-row"
              data-on={mark === 'return'}
              tabIndex={0}
              onMouseEnter={() => setMark('return')}
              onMouseLeave={() => setMark(null)}
              onFocus={() => setMark('return')}
              onBlur={() => setMark(null)}
            >
              <dt className="mono">return sum</dt>
              <dd className="mono">{value(trace.result)}</dd>
              <dd className="atk-gloss">{t(COPY.gloss.result)}</dd>
            </div>
          </dl>
          <p className="fig-note atk-watch-hint">{t(COPY.watchHint)}</p>
        </div>
      </div>

      <div className="atk-code-port">
        <p className="label atk-cap">
          <span>{t(COPY.portCode)}</span>
          <span className="atk-path mono">src/lib/attack.ts</span>
        </p>
        <Listing code={PORT.code} startLine={PORT.startLine} active={mark} label={t(COPY.portCode)} />
        <p className="fig-note">{t(COPY.portNote)}</p>
      </div>

      <div className={cx('atk-tables', pointed === 'tables' && 'fig-pointed')}>
        <p className="label atk-cap">
          <span>{t(COPY.tablesTitle)}</span>
          <span className={`tag ${differing === 0 ? 'tag-valid' : 'tag-invalid'}`}>
            {lines - differing} / {lines} {differing === 0 ? '=' : '≠'}
          </span>
        </p>
        <div className="atk-table-grid">
          {tables.map((table) => (
            <div className="atk-table" key={table.heading}>
              <p className="mono atk-table-head">{table.heading}</p>
              <ol>
                {table.rows.map((entry) => (
                  <li key={entry.printed} className="mono" data-ok={entry.matches}>
                    <span className="atk-table-line">{entry.computed}</span>
                    <span className="atk-table-mark" aria-hidden="true">
                      {entry.matches ? '=' : '≠'}
                    </span>
                    <span className="visually-hidden">{t(entry.matches ? COPY.same : COPY.differs)}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
        <p className="fig-status" role="status">
          {differing === 0 ? fill(t(COPY.tablesMatch), { count: lines }) : fill(t(COPY.tablesDiffer), { count: differing })}
        </p>
        <p className="fig-note">{t(COPY.tablesNote)}</p>
      </div>
    </div>
  );
}
