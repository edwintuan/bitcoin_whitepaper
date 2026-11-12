import { Tooltip, TooltipTrigger } from '@/components/base/tooltip/tooltip';
import { SECTIONS } from '@/content/sections';
import { UI } from '@/content/ui';
import { useT } from '@/i18n/settings';
import { useProgress } from '@/state/progress';
import { Focusable } from 'react-aria-components';

/**
 * The table of contents, drawn as the chain it is: thirteen blocks, each
 * linked to the one before. A block fills in once its section has been
 * reached; the current one is orange.
 */
export function ChainNav() {
  const t = useT();
  const { current, visited } = useProgress();

  return (
    <nav className="chain-nav" aria-label={t(UI.sectionsNav)}>
      <ol>
        {SECTIONS.map((section) => {
          const state = section.number === current ? 'current' : visited.has(section.number) ? 'read' : 'unread';
          const title = `${section.number === 0 ? '' : `§${section.number} `}${t(section.title)}`;
          // What the fill shows, said in words as well.
          const name = state === 'unread' ? title : `${title} · ${t(state === 'current' ? UI.current : UI.read)}`;
          return (
            <li key={section.id}>
              <TooltipTrigger delay={80} closeDelay={0}>
                <Focusable>
                  <a
                    href={`#${section.id}`}
                    data-state={state}
                    aria-current={state === 'current' ? 'location' : undefined}
                    aria-label={name}
                  >
                    <i className={state === 'current' ? 't-slam' : undefined} />
                  </a>
                </Focusable>
                <Tooltip placement="bottom" className="chain-tip" showArrow={false} offset={6}>
                  {name}
                </Tooltip>
              </TooltipTrigger>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
