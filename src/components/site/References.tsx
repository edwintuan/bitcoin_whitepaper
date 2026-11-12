import { REFERENCES, WHITEPAPER_META } from '@/content/references';
import { UI } from '@/content/ui';
import { useT } from '@/i18n/settings';

/** The Bitcoin Core release every source excerpt on the page is taken from. */
const CORE_TAG = 'v32.1';

/** The paper's own reference list, then where this page's facts come from. */
export function References() {
  const t = useT();
  const a = UI.appendix;

  return (
    <section id="references" className="appendix" aria-labelledby="references-title">
      <div className="wrap references">
        <div>
          <header className="appendix-head">
            <p className="label appendix-kicker">{t(a.refKicker)}</p>
            <h2 id="references-title" className="appendix-title poster">
              <span className="poster-scale">{t(a.refTitle)}</span>
            </h2>
            <p className="appendix-lede">{t(a.refNote)}</p>
          </header>
          <ol className="ref-list" lang="en">
            {REFERENCES.map((reference) => (
              <li key={reference.n} id={`ref-${reference.n}`}>
                <span className="mono ref-n">[{reference.n}]</span>
                <span>{reference.text}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="about">
          <h3 className="about-title poster">
            <span className="poster-scale">{t(a.aboutTitle)}</span>
          </h3>
          <p>{t(a.aboutPaper)}</p>
          <p className="about-sum">
            <span className="label">{t(a.aboutChecksum)}</span>
            <code className="mono">{WHITEPAPER_META.sha256}</code>
          </p>
          <p>{t(a.aboutCode).replace('{tag}', CORE_TAG)}</p>
          <p>{t(a.aboutCompute)}</p>
          <p>{t(a.aboutAdvice)}</p>
          <p>
            <a className="btn btn-line btn-sm" href={WHITEPAPER_META.url} target="_blank" rel="noreferrer noopener">
              {t(a.paperLink)} ↗
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const t = useT();
  return (
    <footer className="footer on-ink">
      <div className="wrap footer-in">
        <p className="label">
          <b aria-hidden="true">₿</b> {t(UI.brand)}
        </p>
        <p className="label footer-credit">{t(UI.credit)}</p>
        <a className="label footer-top" href="#top">
          {t(UI.backToTop)} ↑
        </a>
      </div>
    </footer>
  );
}
