import { useState } from 'react';
import type { CSSProperties } from 'react';

const group = (value: number) => value.toLocaleString('en-US');

export interface CounterProps {
  value: number;
  format?: (value: number) => string;
  /**
   * `subtle` (default) cross-fades only the digits that changed: for values
   * that update often. `event` pops the whole number in: for a result the
   * reader should notice. Do not use either for values that change every
   * frame, such as a nonce while mining; print those as plain text.
   */
  mode?: 'subtle' | 'event';
  className?: string;
}

/** A number that shows it has changed. */
export function Counter({ value, format = group, mode = 'subtle', className }: CounterProps) {
  const text = format(value);
  const [shown, setShown] = useState({ text, previous: text, value, direction: 1, tick: 0 });

  if (shown.text !== text) {
    setShown({
      text,
      previous: shown.text,
      value,
      direction: value >= shown.value ? 1 : -1,
      tick: shown.tick + 1,
    });
  }

  if (mode === 'event') {
    return (
      <span key={shown.tick} className={`${shown.tick > 0 ? 't-pop ' : ''}mono ${className ?? ''}`}>
        {text}
      </span>
    );
  }

  const sameLength = shown.previous.length === text.length;
  return (
    <span
      key={shown.tick}
      className={`t-subtle-number mono ${shown.tick > 0 ? 'is-animating ' : ''}${className ?? ''}`}
      style={{ '--subtle-dir': shown.direction } as CSSProperties}
    >
      {/* The value once, as text, for readers who do not see the digits move. */}
      <span className="visually-hidden">{text}</span>
      {[...text].map((char, index) =>
        sameLength && shown.previous[index] === char ? (
          <span key={index} aria-hidden="true">
            {char}
          </span>
        ) : (
          <span className="t-subtle-slot" key={index} aria-hidden="true">
            {sameLength ? <span className="t-subtle-old">{shown.previous[index]}</span> : null}
            <span className="t-subtle-new">{char}</span>
          </span>
        ),
      )}
    </span>
  );
}
