import { createContext, useContext, useMemo } from 'react';
import { SECTION_IDS } from '@/content/types';
import { UI } from '@/content/ui';
import { TERMS } from '@/glossary';
import { useT } from '@/i18n/settings';
import { parseRich } from '@/text/richtext';
import { Term } from './Term';

/**
 * Inside a term card, a linked term swaps the card's content instead of
 * opening a second card on top of the first.
 */
export const CardNavigation = createContext<((termId: string) => void) | null>(null);

/** Renders a string of the site's inline markup. See src/text/richtext.ts. */
export function Rich({ text }: { text: string }) {
  const t = useT();
  const navigate = useContext(CardNavigation);
  const tokens = useMemo(() => parseRich(text), [text]);

  return (
    <>
      {tokens.map((token, index) => {
        switch (token.type) {
          case 'text':
            return token.text;
          case 'strong':
            return <strong key={index}>{token.text}</strong>;
          case 'em':
            return <em key={index}>{token.text}</em>;
          case 'code':
            return (
              <code key={index} className="inline-code">
                {token.text}
              </code>
            );
          case 'link':
            return (
              <a key={index} className="link" href={token.href} target="_blank" rel="noreferrer noopener">
                {token.text}
              </a>
            );
          case 'section':
            return (
              <a key={index} className="link sec-ref" href={`#${SECTION_IDS[token.number]}`}>
                {token.label ?? (token.number === 0 ? t(UI.abstract) : `§${token.number}`)}
              </a>
            );
          case 'term': {
            const def = TERMS[token.id];
            if (navigate && def) {
              return (
                <button key={index} type="button" className="kw-in" onClick={() => navigate(token.id)}>
                  {token.label ?? t(def.name)}
                </button>
              );
            }
            return <Term key={index} id={token.id} label={token.label} />;
          }
        }
      })}
    </>
  );
}
