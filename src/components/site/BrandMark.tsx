/**
 * The site's mark: a block inside a block, as in the page's icon. Drawn, not
 * typed: the Bitcoin sign is a character few fonts hold, and a mark that
 * depends on the reader's system fonts is a mark that sometimes is a box.
 */
export function BrandMark({ size = 13 }: { size?: number }) {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <rect width="32" height="32" fill="var(--color-orange)" />
      <rect x="7" y="7" width="18" height="18" fill="var(--color-ink)" />
      <rect x="11.5" y="11.5" width="9" height="9" fill="var(--color-orange)" />
    </svg>
  );
}
