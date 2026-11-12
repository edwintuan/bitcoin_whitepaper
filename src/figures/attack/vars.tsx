import type { ReactNode } from 'react';

/**
 * Labels are set in capitals, and in this figure a capital changes the
 * meaning: p is the honest share, P the attacker's chance. Copy marks the
 * names of variables with backticks; this keeps them in their own case.
 */
export function withVars(text: string): ReactNode {
  return text.split('`').map((part, index) =>
    index % 2 === 1 ? (
      <span key={index} className="atk-var">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

/** The same copy as plain text, for accessible names. */
export function plainVars(text: string): string {
  return text.replaceAll('`', '');
}
