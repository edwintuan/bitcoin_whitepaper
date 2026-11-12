import { Fragment, Suspense, lazy } from 'react';
import type { ComponentType, LazyExoticComponent, ReactNode } from 'react';
import type { OriginalBlock, PaperFigureId, WhitepaperSection } from '@/content/types';
import { UI } from '@/content/ui';
import { useSettings, useT } from '@/i18n/settings';

// Static redraws of the paper's seven diagrams: paper-figures/<id>.tsx.
const figureLoaders = import.meta.glob<{ default: ComponentType }>('./paper-figures/*.tsx');
const figures = new Map<string, LazyExoticComponent<ComponentType>>();

function PaperFigure({ id }: { id: PaperFigureId }) {
  const loader = figureLoaders[`./paper-figures/${id}.tsx`];
  if (!loader) return null;
  let Figure = figures.get(id);
  if (!Figure) {
    Figure = lazy(loader);
    figures.set(id, Figure);
  }
  return (
    <div className="original-figure">
      <Suspense fallback={null}>
        <Figure />
      </Suspense>
    </div>
  );
}

/**
 * The paper's prose is held as plain text, which cannot carry the one
 * subscript the paper prints outside its formulas: q with a subscript z,
 * spelled "qz" in the data. This sets it as printed.
 */
function paperText(text: string): ReactNode {
  const parts = text.split(/\bqz\b/);
  if (parts.length === 1) return text;
  return parts.map((part, index) => (
    <Fragment key={index}>
      {index > 0 ? (
        <>
          q<sub>z</sub>
        </>
      ) : null}
      {part}
    </Fragment>
  ));
}

function Block({ block }: { block: OriginalBlock }) {
  switch (block.type) {
    case 'p':
      return <p>{paperText(block.text)}</p>;
    case 'list': {
      const List = block.ordered ? 'ol' : 'ul';
      return (
        <List className={block.ordered ? 'original-ol' : 'original-ul'}>
          {block.items.map((item, index) => (
            <li key={index}>{paperText(item)}</li>
          ))}
        </List>
      );
    }
    case 'figure':
      return <PaperFigure id={block.id} />;
    case 'math':
      // MathML written by us in src/content/whitepaper: static and trusted.
      return <div className="original-math" dangerouslySetInnerHTML={{ __html: block.mathml }} />;
    case 'code':
      return (
        <pre className="original-code" tabIndex={0}>
          {block.code}
        </pre>
      );
    case 'table':
      return (
        <table className="original-table">
          {block.caption ? <caption>{block.caption}</caption> : null}
          <tbody>
            {block.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
  }
}

const isProse = (block: OriginalBlock) => block.type === 'p' || block.type === 'list';

/**
 * The paper's own words for one section. In English it is the verbatim text.
 * In Chinese, our translation sits beside the English it was made from,
 * paragraph against paragraph; diagrams, formulas and code appear once.
 */
export function OriginalText({ section }: { section: WhitepaperSection }) {
  const { lang } = useSettings();
  const t = useT();

  if (lang === 'en') {
    return (
      <div className="original original-en" lang="en">
        {section.en.map((block, index) => (
          <Block key={index} block={block} />
        ))}
      </div>
    );
  }

  return (
    <div className="original original-zh">
      <p className="original-note ui">{t(UI.originalNote)}</p>
      {section.zh.map((block, index) =>
        isProse(block) ? (
          <div className="original-pair" key={index}>
            <div className="original-side" lang="zh-Hant-HK">
              <Block block={block} />
            </div>
            <div className="original-side original-source" lang="en">
              <Block block={section.en[index]} />
            </div>
          </div>
        ) : (
          <div className="original-shared" key={index} lang="en">
            <Block block={block} />
          </div>
        ),
      )}
    </div>
  );
}
