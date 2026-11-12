import { useId, useMemo } from 'react';
import { Switch } from '@/components/base/switch/switch';
import { useSettings, useT } from '@/i18n/settings';
import { useWidth } from '@/state/useWidth';
import { fill, formatBtc } from '@/text/format';
import { cx } from '@/utils/cx';
import { COPY } from './copy';
import { GRAPH_HEIGHT, GRAPH_WIDTH, LABEL, layoutGraph } from './graph';
import type { AddressNode } from './graph';
import { observe } from './linkage';
import { buildScenario, toPublic } from './scenario';

interface LinkageSceneProps {
  reuse: boolean;
  combine: boolean;
  onReuse(value: boolean): void;
  onCombine(value: boolean): void;
  /** The part the walkthrough is talking about, if it is one of these. */
  pointed?: 'count' | 'reuse' | 'combine' | null;
}

const points = (list: [number, number][]) => list.map(([x, y]) => `${x},${y}`).join(' ');

/**
 * The public ledger as an observer sees it, and what two habits of a wallet
 * let that observer conclude. The grouping is done by `observe`: same address,
 * or inputs of one transaction, are one owner. Nothing else is assumed.
 */
export function LinkageScene({ reuse, combine, onReuse, onCombine, pointed = null }: LinkageSceneProps) {
  const t = useT();
  const { lang } = useSettings();
  const arrow = useId();
  // The graph is laid out for the width it has, so the words in it are never scaled.
  const [frame, available] = useWidth<HTMLDivElement>(GRAPH_WIDTH);

  const scenario = useMemo(() => buildScenario({ reuse, combine }), [reuse, combine]);
  const graph = useMemo(() => layoutGraph(scenario, available), [scenario, available]);
  const seen = useMemo(() => observe(toPublic(scenario.txs), scenario.known), [scenario]);

  const tied = new Set(seen.tied);
  const attributed = new Set(seen.attributed);
  const tiedNumbers = scenario.txs.filter((tx) => tied.has(tx.txid)).map((tx) => tx.number);
  const tiedByNumber = new Set(tiedNumbers);
  const mode = reuse ? (combine ? 'both' : 'reuse') : combine ? 'combine' : 'fresh';

  const label = (node: AddressNode) =>
    node.label === 'below' ? (
      <text className="prv-tail" x={node.x} y={node.y + node.h / 2 + LABEL.gap + 10} textAnchor="middle">
        …{node.tail}
      </text>
    ) : (
      <text className="prv-tail" x={node.x + node.w / 2 + LABEL.gap + 3} y={node.y + 4}>
        …{node.tail}
      </text>
    );

  return (
    <div className="prv-observer fig-stack">
      <p className="fig-note">{t(COPY.observerIntro)}</p>

      <div className="prv-observer-grid">
        <div className="prv-switches">
          <div className={cx('prv-switch', pointed === 'reuse' && 'fig-pointed')}>
            <Switch shape="rectangle" isSelected={reuse} onChange={onReuse}>
              {t(COPY.reuse)}
            </Switch>
            <p className="fig-note">{t(COPY.reuseNote)}</p>
          </div>
          <div className={cx('prv-switch', pointed === 'combine' && 'fig-pointed')}>
            <Switch shape="rectangle" isSelected={combine} onChange={onCombine}>
              {t(COPY.combine)}
            </Switch>
            <p className="fig-note">{t(COPY.combineNote)}</p>
          </div>
        </div>

        <div ref={frame} className="prv-graph">
          <svg
            key={mode}
            className="t-swap-soft"
            width={graph.width}
            height={GRAPH_HEIGHT}
            viewBox={`0 0 ${graph.width} ${GRAPH_HEIGHT}`}
            role="img"
            aria-label={fill(t(COPY.graphAlt), {
              count: tiedNumbers.length,
              list: tiedNumbers.map((n) => fill(t(COPY.txNumber), { n })).join(lang === 'en' ? ', ' : '、'),
            })}
          >
            <defs>
              {(['on', 'off'] as const).map((tone) => (
                <marker key={tone} id={`${arrow}-${tone}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
                  <path className="prv-arrowhead" data-tone={tone} d="M0 0.5L7.5 4L0 7.5Z" />
                </marker>
              ))}
            </defs>

            {graph.edges.map((edge) => (
              <g key={edge.key}>
                <polyline
                  className={edge.joined ? 'prv-join t-draw' : 'prv-edge'}
                  style={edge.joined ? { ['--len' as string]: 400 } : undefined}
                  data-tied={tiedByNumber.has(edge.txNumber)}
                  points={points(edge.points)}
                  markerEnd={edge.joined ? undefined : `url(#${arrow}-${tiedByNumber.has(edge.txNumber) ? 'on' : 'off'})`}
                />
                {edge.coins > 1 ? (
                  <text className="prv-coins" x={edge.points[0][0] - 5} y={(edge.points[0][1] + edge.points[1][1]) / 2 + 4} textAnchor="end">
                    ×{edge.coins}
                  </text>
                ) : null}
              </g>
            ))}

            {/* An address and a transaction are solid shapes: grey or black until tied to her, orange once they are. */}
            {graph.addresses.map((node) => {
              const isKnown = node.address === scenario.known;
              const bar = node.w > 20;
              const left = node.x - node.w / 2;
              return (
                <g key={node.key}>
                  <rect className="prv-address-node" data-hers={attributed.has(node.address)} x={left} y={node.y - node.h / 2} width={node.w} height={node.h} />
                  {label(node)}
                  {isKnown && bar ? (
                    <text className="prv-known-in" x={left + 7} y={node.y + 4}>
                      {t(COPY.known)}
                    </text>
                  ) : null}
                  {isKnown && !bar ? (
                    <>
                      <rect className="prv-known" x={left - LABEL.tagGap - LABEL.tagWidth} y={node.y - 9} width={LABEL.tagWidth} height="18" />
                      <text className="prv-known-text" x={left - LABEL.tagGap - LABEL.tagWidth / 2} y={node.y + 4} textAnchor="middle">
                        {t(COPY.known)}
                      </text>
                    </>
                  ) : null}
                </g>
              );
            })}

            {graph.txs.map((node) => (
              <g key={node.key}>
                <rect
                  className="prv-tx-node"
                  data-tied={tied.has(node.txid)}
                  x={node.x - node.size / 2}
                  y={node.y - node.size / 2}
                  width={node.size}
                  height={node.size}
                />
                <text className="prv-tx-number" data-tied={tied.has(node.txid)} x={node.x} y={node.y + 4} textAnchor="middle">
                  {node.number}
                </text>
              </g>
            ))}
          </svg>

          <ul className="prv-legend" aria-hidden="true">
            <li>
              <i data-kind="tx" />
              {t(COPY.legend.tx)}
            </li>
            <li>
              <i data-kind="address" />
              {t(COPY.legend.address)}
            </li>
            <li>
              <i data-kind="tied" />
              {t(COPY.legend.tied)}
            </li>
            {mode === 'combine' ? (
              <li>
                <i data-kind="joined" />
                {t(COPY.legend.joined)}
              </li>
            ) : null}
          </ul>
        </div>

        <div className={cx('prv-readout', pointed === 'count' && 'fig-pointed')}>
          <p className="label prv-readout-cap">{t(COPY.tied)}</p>
          <p className="prv-count">
            <span key={tiedNumbers.length} className="stat-value t-pop">
              {tiedNumbers.length}
            </span>
            <span className="mono">{t(COPY.ofSix)}</span>
          </p>
          <p className="label prv-readout-cap">{t(COPY.hers)}</p>
          <p className="mono prv-hers">{fill(t(COPY.ofTotal), { n: seen.attributed.length, total: scenario.wallet.length })}</p>
        </div>
      </div>

      <p className="fig-status" role="status">
        {t(COPY.status[mode])}
      </p>

      <p className="label prv-cap">{t(COPY.ledger)}</p>
      <ol className="prv-ledger">
        {scenario.txs.map((tx) => {
          const isTied = tied.has(tx.txid);
          return (
            <li key={tx.txid} data-tied={isTied}>
              <span className="prv-ledger-no mono" aria-hidden="true">
                {tx.number}
              </span>
              <span className="visually-hidden">{fill(t(COPY.txNumber), { n: tx.number })}: </span>
              <span>
                {t(COPY.parties[tx.party])}
                {tx.inputs.length > 1 ? ` · ${fill(t(COPY.coins), { count: tx.inputs.length })}` : ''}
              </span>
              <span className="mono prv-ledger-amount">{formatBtc(tx.outputs[0].value)} BTC</span>
              <span className="visually-hidden">, {t(isTied ? COPY.isTied : COPY.notTied)}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
