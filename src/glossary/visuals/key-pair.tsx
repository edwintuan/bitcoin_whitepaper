import { useState } from 'react';
import { UI } from '@/content/ui';
import { useT } from '@/i18n/settings';
import { bytesToHex } from '@/lib/bytes';
import { generateKeyPair, pubkeyToAddress } from '@/lib/keys';
import { shortHex } from '@/text/format';
import './visuals.css';

const COPY = {
  make: { en: 'New key pair', zh: '生成新密鑰對' },
  privateKey: { en: 'private key', zh: '私鑰' },
  publicKey: { en: 'public key', zh: '公鑰' },
  address: { en: 'address', zh: '地址' },
  caption: {
    en: 'Each line is worked out from the one above it, and none can be worked back.',
    zh: '每一行都由上一行推算而來，卻無法反過來推算。',
  },
};

const LABEL = { width: 96, flex: 'none' } as const;

/** A real secp256k1 key pair and the address derived from it, made afresh on request. */
export default function KeyPairVisual() {
  const t = useT();
  const [pair, setPair] = useState(generateKeyPair);
  const [made, setMade] = useState(0);

  const rows = [
    { label: t(COPY.privateKey), value: shortHex(bytesToHex(pair.priv), 10, 6), arrow: false },
    { label: t(COPY.publicKey), value: shortHex(bytesToHex(pair.pub), 10, 6), arrow: true },
    { label: t(COPY.address), value: shortHex(pubkeyToAddress(pair.pub, 'p2wpkh'), 10, 6), arrow: true },
  ];

  return (
    <div className="tv">
      <button
        type="button"
        className="tv-btn"
        onClick={() => {
          setPair(generateKeyPair());
          setMade((count) => count + 1);
        }}
        style={{ width: 'auto', marginBottom: 8, padding: '0 9px', fontFamily: 'var(--font-sans)', fontSize: 12 }}
      >
        {t(COPY.make)}
      </button>
      <div role="status">
        {rows.map((row, index) => (
          <div className="tv-row" key={row.label}>
            <span className="tv-dim" style={LABEL}>
              {row.arrow ? '↓ ' : ''}
              {row.label}
            </span>
            {/* Remounted with each new pair, so the three lines arrive one after another. */}
            <span key={made} className={made > 0 ? 't-rise' : undefined} style={{ display: 'inline-block', ['--i' as string]: index * 3 }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
      <p className="tv-cap">{t(COPY.caption)}</p>
      <p className="tv-cap">{t(UI.demoKeysWarning)}</p>
    </div>
  );
}
