import { useState } from 'react';
import { Drawer } from '@/components/base/drawer/drawer';
import { Popover, PopoverTrigger } from '@/components/base/popover/popover';
import { TERMS } from '@/glossary';
import { useT } from '@/i18n/settings';
import { useIsNarrow } from '@/state/useMediaQuery';
import { TermCard } from './TermCard';

/**
 * A glossary term in running text: a button that opens its card. On wide
 * screens the card floats beside the word; on phones it rises from the bottom
 * so it never covers the sentence being read.
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
        <button type="button" className="kw" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
          {text}
        </button>
        <Drawer isOpen={open} onOpenChange={onOpenChange} placement="bottom" aria-label={shownName} className="term-sheet">
          {card}
        </Drawer>
      </>
    );
  }

  return (
    <PopoverTrigger isOpen={open} onOpenChange={onOpenChange}>
      <button type="button" className="kw">
        {text}
      </button>
      <Popover placement="bottom start" offset={6} aria-label={shownName} className="term-pop t-dropdown" dialogClassName="term-dialog">
        {card}
      </Popover>
    </PopoverTrigger>
  );
}
