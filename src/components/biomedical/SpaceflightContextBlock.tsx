import { Compass, AlertTriangle } from 'lucide-react'
import type { BiomedicalSystemDefinition } from '../../domain/biomedical'

export function SpaceflightContextBlock({
  en,
  system,
}: {
  en: boolean
  system: BiomedicalSystemDefinition
}) {
  const items = system.spaceflightContext

  return (
    <section className="biomed-space-context-card" aria-labelledby="biomed-space-heading">
      <div className="biomed-space-head">
        <div>
          <p className="rd-kicker">
            <Compass size={13} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 4 }} />
            {en ? 'Operational Environment' : 'Entorno operacional'}
          </p>
          <h3 id="biomed-space-heading" className="biomed-section-title">
            {en ? 'Spaceflight context' : 'Contexto del vuelo espacial'}
          </h3>
        </div>
      </div>

      <div className="biomed-space-grid">
        {items.map((item, idx) => {
          const badgeClass =
            item.badge === 'research_risk'
              ? 'badge-risk'
              : item.badge === 'individual_observation'
                ? 'badge-observation'
                : item.badge === 'environmental_context'
                  ? 'badge-environment'
                  : 'badge-hypothesis'

          return (
            <article key={idx} className="biomed-space-item">
              <header className="biomed-space-item-head">
                <span className={`biomed-badge ${badgeClass}`}>
                  {en ? item.badgeLabel.en : item.badgeLabel.es}
                </span>
                <span className="biomed-hazard-tag">
                  {item.hazard === 'altered_gravity'
                    ? (en ? 'Altered Gravity' : 'Gravedad alterada')
                    : item.hazard === 'space_radiation'
                      ? (en ? 'Radiation' : 'Radiación')
                      : item.hazard === 'isolation_confinement'
                        ? (en ? 'Isolation & Confinement' : 'Aislamiento y confinamiento')
                        : item.hazard === 'distance_from_earth'
                          ? (en ? 'Distance from Earth' : 'Distancia de la Tierra')
                          : (en ? 'Closed Environment' : 'Ambiente cerrado')}
                </span>
              </header>
              <h4 className="biomed-space-item-title">{en ? item.title.en : item.title.es}</h4>
              <p className="biomed-space-item-text">{en ? item.content.en : item.content.es}</p>
              {item.evidenceRef ? (
                <footer className="biomed-space-item-ref">
                  <span className="rd-muted">{item.evidenceRef.institution} · </span>
                  <a href={item.evidenceRef.url} target="_blank" rel="noopener noreferrer" className="biomed-link">
                    {item.evidenceRef.title}
                  </a>
                </footer>
              ) : null}
            </article>
          )
        })}
      </div>

      <div className="biomed-space-disclaimer" role="note">
        <AlertTriangle size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
        <p>
          {en
            ? 'A solar weather event (DONKI) does not demonstrate individual radiation exposure. Historical telemetry from prior space missions does not describe the real-time conditions of this crew member.'
            : 'Un evento solar de DONKI no demuestra exposición individual a la radiación. La telemetría histórica de otra misión no describe las condiciones actuales de este tripulante.'}
        </p>
      </div>
    </section>
  )
}
