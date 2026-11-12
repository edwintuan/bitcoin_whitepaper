import { useState } from 'react';
import { Pressable } from 'react-aria-components';
import { Drawer } from '@/components/base/drawer/drawer';
import { Popover, PopoverTrigger } from '@/components/base/popover/popover';
import { TERMS } from '@/glossary';
import { useT } from '@/i18n/settings';
import { useIsNarrow } from '@/state/useMediaQuery';
import { TermCard } from './TermCard';

/**
 * A glossary term in running text: press it to open its card. On wide screens
 * the card floats beside the word; on phones it rises from the bottom so it
 * never covers the sentence being read.
 *
 * The trigger is a span with the button role, not a <button>: a button is laid
 * out as one unbreakable box, so a two-word term could not wrap and a line
 * could break between a term and the comma after it.
 */
export function Term({ id, label }: { id: string; label?: string }) {
  const t = useT();
  const narrow = useIsNarrow();
  const [open, setOpen] = useState(false);
  // The card can step to a related term; closing it returns to this one.
  const [shown, setShown] = useState(id);

  const def = TERMS[id];
  if (!def) return <>{label ?? id}</>;

  const text = label ?? t(def.name);
  const shownName = t((TERMS[shown] ?? def).name);
  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setShown(id);
  };
  const card = <TermCard id={shown} onNavigate={setShown} onClose={() => onOpenChange(false)} />;

  if (narrow) {
    return (
      <>
        <Pressable onPress={() => setOpen(true)}>
          <span role="button" className="kw" aria-haspopup="dialog" aria-expanded={open}>
            {text}
          </span>
        </Pressable>
        <Drawer isOpen={open} onOpenChange={onOpenChange} placement="bottom" aria-label={shownName} className="term-sheet">
          {card}
        </Drawer>
      </>
    );
  }

  return (
    <PopoverTrigger isOpen={open} onOpenChange={onOpenChange}>
      <span role="button" className="kw">
        {text}
      </span>
      <Popover placement="bottom start" offset={6} aria-label={shownName} className="term-pop t-dropdown" dialogClassName="term-dialog">
        {card}
      </Popover>
    </PopoverTrigger>
  );
}
