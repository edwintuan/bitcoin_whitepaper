import { useMemo, useState } from 'react';
import type { SectionSources, SourceExcerpt } from '@/content/types';
import { UI } from '@/content/ui';
import { useT } from '@/i18n/settings';
import { tokenizeCpp } from '@/text/cppHighlight';
import { Rich } from './Rich';

/** "In the source": real code from the repository, with our numbered notes beside it. */
export function SourceGlance({ sources }: { sources: SectionSources }) {
  const t = useT();
  return (
    <div className="sources">
      <p className="sources-note ui">{t(UI.sourceNote)}</p>
      {sources.excerpts.map((excerpt) => (
        <Excerpt key={excerpt.id} excerpt={excerpt} />
      ))}
    </div>
  );
}

function Excerpt({ excerpt }: { excerpt: SourceExcerpt }) {
  const t = useT();
  const lines = useMemo(() => tokenizeCpp(excerpt.code), [excerpt.code]);
  const [active, setActive] = useState<number | null>(null);

  const endLine = excerpt.startLine + lines.length - 1;
  const url = `https://github.com/${excerpt.repo}/blob/${excerpt.tag}/${excerpt.path}#L${excerpt.startLine}-L${endLine}`;
  const noteAt = (lineNo: number) =>
    excerpt.annotations.findIndex((note) => lineNo >= note.lines[0] && lineNo <= note.lines[1]);

  return (
    <article className="excerpt">
      <header className="excerpt-head">
        <h4 className="excerpt-title poster">{t(excerpt.title)}</h4>
        <p className="excerpt-meta label">
          <span>{excerpt.path}</span>
          <span>{excerpt.tag}</span>
          <span>
            {t(UI.sourceLines)} {excerpt.startLine}–{endLine}
          </span>
          <a href={url} target="_blank" rel="noreferrer noopener">
            {t(UI.sourceOpen)} <span aria-hidden="true">↗</span>
          </a>
        </p>
      </header>

      <div className="excerpt-code on-ink" lang="en" tabIndex={0} role="group" aria-label={`${excerpt.path} ${excerpt.tag}`}>
        {lines.map((tokens, index) => {
          const lineNo = excerpt.startLine + index;
          const note = noteAt(lineNo);
          const firstOfNote = note >= 0 && excerpt.annotations[note].lines[0] === lineNo;
          return (
            <div className="code-line" key={lineNo} data-noted={note >= 0} data-active={note >= 0 && note === active}>
              <span className="code-no" aria-hidden="true">
                {lineNo}
              </span>
              <span className="code-mark" aria-hidden="true">
                {firstOfNote ? note + 1 : ''}
              </span>
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

      {excerpt.annotations.length > 0 ? (
        <ol className="excerpt-notes" aria-label={t(UI.sourceNotes)}>
          {excerpt.annotations.map((note, index) => (
            <li
              key={note.lines.join('-')}
              className="excerpt-note"
              data-active={index === active}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
            >
              <span className="note-mark mono" aria-hidden="true">
                {index + 1}
              </span>
              <div>
                <span className="note-lines label">
                  L{note.lines[0]}
                  {note.lines[1] !== note.lines[0] ? `–${note.lines[1]}` : ''}
                </span>
                <p className="ui">
                  <Rich text={t(note.note)} />
                </p>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </article>
  );
}
