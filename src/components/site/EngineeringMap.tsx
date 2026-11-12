import { ACTORS, ACTOR_ORDER } from '@/content/actors';
import { UI } from '@/content/ui';
import { useT } from '@/i18n/settings';
import { ActorIcon } from './WhoRuns';

/** Appendix A: every actor, what it does, and what it speaks, in one table. */
export function EngineeringMap() {
  const t = useT();
  const a = UI.appendix;

  return (
    <section id="engineering-map" className="appendix" aria-labelledby="engineering-map-title">
      <div className="wrap">
        <header className="appendix-head">
          <p className="label appendix-kicker">{t(a.aKicker)}</p>
          <h2 id="engineering-map-title" className="appendix-title poster">
            <span className="poster-scale">{t(a.aTitle)}</span>
          </h2>
          <p className="appendix-lede">{t(a.aLede)}</p>
        </header>

        <div className="actor-table-wrap">
          <table className="actor-table">
            <thead>
              <tr className="label">
                <th scope="col">{t(a.colActor)}</th>
                <th scope="col">{t(a.colWhat)}</th>
                <th scope="col">{t(a.colCovers)}</th>
                <th scope="col">{t(a.colExamples)}</th>
                <th scope="col">{t(a.colInterfaces)}</th>
              </tr>
            </thead>
            <tbody>
              {ACTOR_ORDER.map((id) => {
                const actor = ACTORS[id];
                return (
                  <tr key={id}>
                    <th scope="row">
                      <span className="actor-cell">
                        <ActorIcon id={id} size={26} />
                        <span className="poster actor-name">{t(actor.name)}</span>
                      </span>
                    </th>
                    <td data-label={t(a.colWhat)}>{t(actor.what)}</td>
                    <td data-label={t(a.colCovers)}>{t(actor.covers)}</td>
                    <td data-label={t(a.colExamples)}>{t(actor.examples)}</td>
                    <td data-label={t(a.colInterfaces)}>
                      <ul className="actor-speaks mono">
                        {actor.interfaces.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
