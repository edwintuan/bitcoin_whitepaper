/**
 * A way to ask for a term's card from anywhere: the search palette asks, the
 * glossary answers, since that is where every term has an entry to open from.
 */
type Listener = (termId: string) => void;

let listener: Listener | null = null;

/** The glossary registers here. Returns the function that unregisters it. */
export function onTermRequested(next: Listener): () => void {
  listener = next;
  return () => {
    if (listener === next) listener = null;
  };
}

/** Shows the glossary entry of this term and opens its card. */
export function requestTerm(termId: string): void {
  listener?.(termId);
}
