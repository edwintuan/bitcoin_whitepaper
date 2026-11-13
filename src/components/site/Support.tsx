import { useEffect, useState } from 'react';
import { UI } from '@/content/ui';
import { fill } from '@/text/format';
import { useT } from '@/i18n/settings';

/**
 * Where a reader can send a tip. Addresses are not copy: they are the same in
 * every language and must never pass through translation or conversion.
 */
const ADDRESSES = [
  { network: 'bitcoin', address: 'bc1qfl9phz8p4capyd2ewz0w4u3s0wgu05kwv2cya6' },
  { network: 'evm', address: '0x7E9620a4bAB85aED025b8c8d6277834084b0D261' },
  { network: 'tron', address: 'TYR5uQCUpk2MztNWQgBP9E9BKNUVgdLvFr' },
] as const;

function CopyButton({ name, address }: { name: string; address: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      className="btn btn-line btn-sm support-copy"
      aria-label={fill(t(UI.support.copyLabel), { name })}
      onClick={() => {
        // Without clipboard access (an old browser, a page not served securely) the address can still be selected by hand.
        navigator.clipboard?.writeText(address).then(
          () => setCopied(true),
          () => {},
        );
      }}
    >
      <span aria-live="polite">{copied ? t(UI.support.copied) : t(UI.support.copy)}</span>
    </button>
  );
}

export function Support() {
  const t = useT();
  const s = UI.support;
  return (
    <div className="support">
      <h3 className="about-title poster">
        <span className="poster-scale">{t(s.title)}</span>
      </h3>
      <p>{t(s.note)}</p>
      <ul className="support-list">
        {ADDRESSES.map(({ network, address }) => {
          const name = t(s.networks[network]);
          return (
            <li key={network}>
              <span className="label">{name}</span>
              <code className="mono support-address" lang="en" translate="no">
                {address}
              </code>
              <CopyButton name={name} address={address} />
            </li>
          );
        })}
      </ul>
      <p className="support-check">{t(s.check)}</p>
    </div>
  );
}
