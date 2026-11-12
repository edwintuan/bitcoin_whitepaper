import { useState } from 'react';
import { Drawer } from '@/components/base/drawer/drawer';
import { SegmentedControl, SegmentedControlItem } from '@/components/base/segmented-control/segmented-control';
import { Tooltip, TooltipTrigger } from '@/components/base/tooltip/tooltip';
import { SECTIONS } from '@/content/sections';
import { DEPTHS, SECTION_IDS } from '@/content/types';
import type { Depth, Lang } from '@/content/types';
import { UI } from '@/content/ui';
import { useSettings, useT } from '@/i18n/settings';
import { useProgress } from '@/state/progress';
import { captureAnchor } from '@/state/scrollAnchor';
import { ChainNav } from './ChainNav';

function LanguageSwitch() {
  const t = useT();
  const { lang, setLang } = useSettings();
  return (
    <SegmentedControl
      aria-label={t(UI.language)}
      selectedKeys={new Set([lang])}
      onSelectionChange={(keys) => {
        const next = [...keys][0] as Lang | undefined;
        if (!next || next === lang) return;
        captureAnchor();
        setLang(next);
      }}
    >
      <SegmentedControlItem id="en" aria-label="English">
        <span lang="en">EN</span>
      </SegmentedControlItem>
      <SegmentedControlItem id="zh" aria-label="繁體中文">
        <span lang="zh-Hant-HK">繁</span>
      </SegmentedControlItem>
    </SegmentedControl>
  );
}

function DepthSwitch({ hints = true }: { hints?: boolean }) {
  const t = useT();
  const { depth, setDepth } = useSettings();
  return (
    <SegmentedControl
      aria-label={t(UI.depthLabel)}
      selectedKeys={new Set([depth])}
      onSelectionChange={(keys) => {
        const next = [...keys][0] as Depth | undefined;
        if (!next || next === depth) return;
        captureAnchor();
        setDepth(next);
      }}
    >
      {DEPTHS.map((value) =>
        hints ? (
          <TooltipTrigger key={value} delay={80} closeDelay={0}>
            <SegmentedControlItem id={value}>{t(UI.depth[value])}</SegmentedControlItem>
            <Tooltip placement="bottom" className="chain-tip" showArrow={false} offset={8}>
              {t(UI.depthHint[value])}
            </Tooltip>
          </TooltipTrigger>
        ) : (
          <SegmentedControlItem key={value} id={value}>
            {t(UI.depth[value])}
          </SegmentedControlItem>
        ),
      )}
    </SegmentedControl>
  );
}

export function TopBar({ onSearch }: { onSearch?: () => void }) {
  const t = useT();
  const { depth } = useSettings();
  const { current, visited } = useProgress();
  const [menuOpen, setMenuOpen] = useState(false);
  const progress = current < 0 ? 0 : (current + 1) / SECTION_IDS.length;

  return (
    <header className="topbar on-ink">
      <a className="skip-link" href="#abstract">
        {t(UI.skipToContent)}
      </a>
      <div className="wrap topbar-in">
        <a className="brand label" href="#top">
          <b aria-hidden="true">₿</b>
          <span>{t(UI.brand)}</span>
          <span className="brand-by">Animus Laboratories</span>
        </a>

        <div className="topbar-chain">
          <ChainNav />
        </div>

        <div className="topbar-tools">
          <LanguageSwitch />
          <div className="topbar-wide">
            <DepthSwitch />
          </div>
          {onSearch ? (
            <button type="button" className="topbar-icon topbar-wide" onClick={onSearch} aria-label={t(UI.search)}>
              <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <rect x="2" y="2" width="8" height="8" />
                <path d="M10 10l4.5 4.5" />
              </svg>
            </button>
          ) : null}
          <button
            type="button"
            className="topbar-icon topbar-narrow"
            aria-label={t(UI.menu)}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M1 3h14M1 8h14M1 13h14" />
            </svg>
          </button>
        </div>
      </div>
      <div className="topbar-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />

      <Drawer isOpen={menuOpen} onOpenChange={setMenuOpen} placement="end" size="sm" aria-label={t(UI.menu)} className="menu-sheet">
        <div className="menu on-ink">
          <div className="menu-head">
            <span className="label">{t(UI.depthLabel)}</span>
            <button type="button" className="topbar-icon" aria-label={t(UI.close)} onClick={() => setMenuOpen(false)}>
              <svg viewBox="0 0 14 14" width="14" height="14" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M2 2l10 10M12 2L2 12" />
              </svg>
            </button>
          </div>
          <DepthSwitch hints={false} />
          <p className="menu-hint ui">{t(UI.depthHint[depth])}</p>
          {onSearch ? (
            <button
              type="button"
              className="btn btn-line btn-sm menu-search"
              onClick={() => {
                setMenuOpen(false);
                onSearch();
              }}
            >
              {t(UI.searchPlaceholder)}
            </button>
          ) : null}
          <p className="label menu-title">{t(UI.sectionsNav)}</p>
          <ol className="menu-list">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  onClick={() => setMenuOpen(false)}
                  data-state={section.number === current ? 'current' : visited.has(section.number) ? 'read' : 'unread'}
                  aria-current={section.number === current ? 'location' : undefined}
                >
                  <span className="mono">{String(section.number).padStart(2, '0')}</span>
                  <span>{t(section.title)}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </Drawer>
    </header>
  );
}
