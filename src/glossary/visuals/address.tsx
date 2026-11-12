import { useState } from 'react';
import { UI } from '@/content/ui';
import { useT } from '@/i18n/settings';
import { bytesToHex } from '@/lib/bytes';
import { addressSteps, generateKeyPair } from '@/lib/keys';
import { shortHex } from '@/text/format';
import './visuals.css';

const COPY = {
  make: { en: 'New key', zh: '換一把新密鑰' },
  publicKey: { en: 'public key', zh: '公鑰' },
  hash: { en: 'HASH160', zh: 'HASH160' },
  address: { en: 'address', zh: '地址' },
  bytes: { en: 'bytes', zh: '位元組' },
  caption: {
    en: 'An address is not the key but a short hash of it, written in a form that is easy to copy.',
    zh: '地址並不是公鑰本身，而是公鑰的一段短哈希，再寫成便於抄寫的形式。',
  },
};

const LABEL = { width: 78, flex: 'none' } as const;

/** One real public key, the 20-byte hash of it, and the address that encodes the hash. */
export default function AddressVisual() {
  const t = useT();
  const [pair, setPair] = useState(generateKeyPair);
  const [made, setMade] = useState(0);
  const steps = addressSteps(pair.pub);

  const rows = [
    { label: t(COPY.publicKey), value: shortHex(bytesToHex(pair.pub), 10, 6), size: 33, hit: false },
    { label: `↓ ${t(COPY.hash)}`, value: shortHex(steps.hash160, 10, 6), size: 20, hit: false },
    { label: `↓ ${t(COPY.address)}`, value: shortHex(steps.p2wpkh, 10, 6), size: null, hit: true },
  ];

  return (
    <div className="tv">
      <div role="status">
        {rows.map((row, index) => (
          <div className="tv-row" key={index}>
            <span className="tv-dim" style={LABEL}>
              {row.label}
            </span>
            {/* Remounted with each new key, so the three lines arrive one after another. */}
            <span key={made} className={`${row.hit ? 'tv-hit ' : ''}${made > 0 ? 't-rise' : ''}`} style={{ display: 'inline-block', ['--i' as string]: index * 3 }}>
              {row.value}
            </span>
            {row.size ? (
              <span className="tv-dim">
                {row.size} {t(COPY.bytes)}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <button
        type="button"
        className="tv-btn"
        onClick={() => {
          setPair(generateKeyPair());
          setMade((count) => count + 1);
        }}
        style={{ width: 'auto', marginTop: 8, padding: '0 9px', fontFamily: 'var(--font-sans)', fontSize: 12 }}
      >
        {t(COPY.make)}
      </button>
      <p className="tv-cap">{t(COPY.caption)}</p>
      {/* At full strength: dimmed, the warning falls short of the contrast a warning needs. */}
      <p className="tv-cap">{t(UI.demoKeysWarning)}</p>
    </div>
  );
}
