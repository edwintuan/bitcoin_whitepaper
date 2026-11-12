import { useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { sectionByNumber } from '@/content/sections';
import { SOURCES } from '@/content/sources';
import type { SectionContent } from '@/content/types';
import { UI } from '@/content/ui';
import { WHITEPAPER } from '@/content/whitepaper';
import { useSettings, useT } from '@/i18n/settings';
import { useProgress } from '@/state/progress';
import { sectionBlocks } from '@/state/sectionChain';
import { useInView } from '@/state/useInView';
import { cx } from '@/utils/cx';
import { HashText } from '@/components/viz/HashText';
import { Collapsible } from './Collapsible';
import { FigureFrame } from './FigureFrame';
import { OriginalText } from './OriginalText';
import { Rich } from './Rich';
import { SourceGlance } from './SourceGlance';
import { WhoRuns } from './WhoRuns';

function LeadBlock({ label, className, children }: { label: string; className: string; children: ReactNode }) {
  const { lang } = useSettings();
  return (
    <div className={`lead-block ${className}`}>
      <p className="label lead-label">{label}</p>
      {/* Keyed by language: on a switch the new text fades in softly instead of snapping. */}
      <p key={lang} className="lead-text t-swap-soft">
        {children}
      </p>
    </div>
  );
}

/** The place of a line in a staggered reveal. */
const line = (index: number) => ({ '--i': index }) as CSSProperties;

/**
 * One section of the paper. Every section has the same anatomy, so a reader
 * learns it once: the claim in one line, a comparison, the figure, then the
 * explanation, the paper's own words, who runs it, and the code.
 */
export function SectionShell({ section }: { section: SectionContent }) {
  const t = useT();
  const { lang } = useSettings();
  const { visited } = useProgress();
  // The heading rises in, line after line, the first time the section comes into view.
  const head = useRef<HTMLElement>(null);
  const entered = useInView(head, { once: true, rootMargin: '0px 0px -10% 0px' });

  const block = sectionBlocks()[section.number];
  const mined = visited.has(section.number);
  const whitepaper = WHITEPAPER[section.id];
  const sources = SOURCES[section.id];
  const next = sectionByNumber(section.number + 1);
  const titleId = `${section.id}-title`;

  // The paper's own words: under the figure's column when the section has no figure, across the page when it has.
  const original = (className?: string) =>
    whitepaper ? (
      <Collapsible className={className} title={t(UI.blocks.original)} minDepth="curious" aside={t(UI.depth.curious)}>
        <OriginalText section={whitepaper} />
      </Collapsible>
    ) : null;

  return (
    <section id={section.id} className="section" aria-labelledby={titleId}>
      <div className="wrap">
        <header ref={head} className={cx('section-head t-stagger', entered && 'is-shown')}>
          <span className="section-no poster t-stagger-line" style={line(0)} aria-hidden="true">
            {String(section.number).padStart(2, '0')}
          </span>
          <h2 id={titleId} className="section-title poster t-stagger-line" style={line(1)}>
            <span key={lang} className="poster-scale t-swap-soft">
              {t(section.title)}
            </span>
          </h2>
          <p className="block-strip label t-stagger-line" style={line(2)} data-mined={mined}>
            <span>
              {t(UI.block)} #{section.number}
            </span>
            {/* The section's own block is for the eye: thirteen pairs of 64-digit hashes read aloud would help no one. */}
            <span aria-hidden="true">
              prev <HashText hash={block.prev} lead={6} tail={0} zeros={false} />
            </span>
            <span aria-hidden="true">nonce {mined ? block.nonce : '·'}</span>
            <span aria-hidden="true">
              hash {mined ? <HashText className="t-pop" hash={block.hash} lead={8} tail={4} /> : '········'}
            </span>
          </p>
        </header>

        <div className="section-cols" data-has-figure={section.figure !== null}>
          <div className="section-col">
            <div className="section-lead">
              <LeadBlock label={t(UI.blocks.tldr)} className="tldr">
                <Rich text={t(section.tldr)} />
              </LeadBlock>
              <LeadBlock label={t(UI.blocks.analogy)} className="analogy">
                <Rich text={t(section.analogy)} />
              </LeadBlock>
            </div>

            <div className="section-body">
              <Collapsible title={t(UI.blocks.body)} minDepth="curious" aside={t(UI.depth.curious)}>
                <div className="prose">
                  {t(section.body).map((paragraph, index) => (
                    <p key={index}>
                      <Rich text={paragraph} />
                    </p>
                  ))}
                </div>
              </Collapsible>
              {t(section.paperVsToday).length > 0 ? (
                <Collapsible title={t(UI.blocks.paperVsToday)} minDepth="developer" aside={t(UI.depth.developer)}>
                  <ul className="pvt">
                    {t(section.paperVsToday).map((item, index) => (
                      <li key={index}>
                        <Rich text={item} />
                      </li>
                    ))}
                  </ul>
                </Collapsible>
              ) : null}
            </div>
          </div>

          <div className="section-col">
            {section.figure ? (
              <div className="section-figure">
                <FigureFrame section={section} />
              </div>
            ) : null}

            <div className="section-eng">
              {/* Without a figure of its own, the section shows the paper's words here instead. */}
              {section.figure ? null : original()}
              {section.whoRuns.length > 0 ? (
                <Collapsible title={t(UI.blocks.who)} minDepth="curious" aside={t(UI.depth.curious)}>
                  <WhoRuns items={section.whoRuns} />
                </Collapsible>
              ) : null}
              {sources && sources.excerpts.length > 0 ? (
                <Collapsible title={t(UI.blocks.source)} minDepth="developer" aside={t(UI.depth.developer)}>
                  <SourceGlance sources={sources} />
                </Collapsible>
              ) : null}
            </div>
          </div>
        </div>

        {section.figure ? original('section-original') : null}

        {next ? (
          <a className="section-next" href={`#${next.id}`}>
            <span className="label">{t(UI.nextSection)}</span>
            <span className="section-next-title poster">
              <span className="section-next-no">{String(next.number).padStart(2, '0')}</span>
              <span className="poster-scale">{t(next.title)}</span>
            </span>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
              <path d="M12 4v15M5 13l7 7 7-7" />
            </svg>
          </a>
        ) : null}
      </div>
    </section>
  );
}
