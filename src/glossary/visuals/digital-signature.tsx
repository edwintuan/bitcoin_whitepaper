import { useMemo, useState } from 'react';
import { useT } from '@/i18n/settings';
import { bytesToHex, utf8 } from '@/lib/bytes';
import { sha256 } from '@/lib/hash';
import { generateKeyPair, sign, verify } from '@/lib/keys';
import { shortHex } from '@/text/format';
import './visuals.css';

const COPY = {
  message: { en: 'message', zh: '訊息' },
  signature: { en: 'signature', zh: '簽署' },
  check: { en: 'check', zh: '驗證' },
  /** The two messages differ in one character, at the same position. */
  signed: { en: 'Pay Bob 5 coins', zh: '付給鮑勃 5 枚幣' },
  altered: { en: 'Pay Bob 9 coins', zh: '付給鮑勃 9 枚幣' },
  alter: { en: 'Alter the message', zh: '改動訊息' },
  restore: { en: 'Put it back', zh: '還原訊息' },
  fits: { en: 'the signature fits', zh: '簽署相符' },
  fails: { en: 'the signature does not fit', zh: '簽署不符' },
  caption: {
    en: 'A signature is made for one exact message: change a single character and it no longer verifies.',
    zh: '簽署只對應一則一字不差的訊息：哪怕只改一個字，驗證便不再通過。',
  },
};

const LABEL = { width: 62, flex: 'none' } as const;

/** A real ECDSA signature over a short message, checked again after the message is altered. */
export default function DigitalSignatureVisual() {
  const t = useT();
  // A throwaway key, never shown: only its signature and the outcome of the check are.
  const [key] = useState(generateKeyPair);
  const [tampered, setTampered] = useState(false);

  const signed = t(COPY.signed);
  const shown = tampered ? t(COPY.altered) : signed;
  const signature = useMemo(() => sign(sha256(utf8(signed)), key.priv), [signed, key]);
  const fits = useMemo(() => verify(signature, sha256(utf8(shown)), key.pub), [signature, shown, key]);

  return (
    <div className="tv">
      <div className="tv-row">
        <span className="tv-dim" style={LABEL}>
          {t(COPY.message)}
        </span>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5 }}>
          {[...shown].map((char, index) => (
            <span key={index} className={char !== [...signed][index] ? 'tv-hit' : undefined}>
              {char}
            </span>
          ))}
        </span>
      </div>
      <div className="tv-row">
        <span className="tv-dim" style={LABEL}>
          {t(COPY.signature)}
        </span>
        <span>{shortHex(bytesToHex(signature), 14, 6)}</span>
      </div>
      <div className="tv-row" role="status">
        <span className="tv-dim" style={LABEL}>
          {t(COPY.check)}
        </span>
        <span key={String(fits)} className={fits ? 'tv-hit t-swap-soft' : 't-shake'} style={{ display: 'inline-block' }}>
          {fits ? '✓' : '✗'} {t(fits ? COPY.fits : COPY.fails)}
        </span>
      </div>
      <button
        type="button"
        className="tv-btn"
        onClick={() => setTampered((value) => !value)}
        style={{ width: 'auto', marginTop: 8, padding: '0 9px', fontFamily: 'var(--font-sans)', fontSize: 12 }}
      >
        {t(tampered ? COPY.restore : COPY.alter)}
      </button>
      <p className="tv-cap">{t(COPY.caption)}</p>
    </div>
  );
}
