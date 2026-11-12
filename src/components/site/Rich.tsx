import { createContext, useContext, useMemo } from 'react';
import { Pressable } from 'react-aria-components';
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
            // A link to a place on this page stays in this tab.
            return token.href.startsWith('#') ? (
              <a key={index} className="link" href={token.href}>
                {token.text}
              </a>
            ) : (
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
              // A span, for the same reason as in Term: it must wrap and punctuate like the text around it.
              return (
                <Pressable key={index} onPress={() => navigate(token.id)}>
                  <span role="button" tabIndex={0} className="kw-in">
                    {token.label ?? t(def.name)}
                  </span>
                </Pressable>
              );
            }
            return <Term key={index} id={token.id} label={token.label} />;
          }
        }
      })}
    </>
  );
}
