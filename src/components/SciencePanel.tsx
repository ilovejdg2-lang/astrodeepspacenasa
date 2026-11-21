import type { ScienceBrief } from '../domain/scienceBrief'
import { useLocale } from '../i18n'

export function SciencePanel({ brief }: { brief: ScienceBrief }) {
  const { lang } = useLocale()
  const en = lang === 'en'

  return (
    <section className="panel science-panel" data-testid="science-panel">
      <div className="science-head">
        <h3>{en ? 'Physiological telemetry' : 'Telemetría fisiológica'}</h3>
        <span className="science-badge">{en ? 'Sensor readings' : 'Lecturas de sensores'}</span>
      </div>

      {brief.signals.length > 0 ? (
        <div className="science-signals-grid">
          {brief.signals.map((signal) => (
            <div key={signal.label} className="science-signal-card">
              <span className="science-signal-name">{signal.label}</span>
              <span className="science-signal-val">{signal.value}</span>
              <span className="science-signal-age">{signal.age}</span>
            </div>
          ))}
        </div>
      ) : null}

      {brief.sources.length > 0 ? (
        <details className="science-nasa-details">
          <summary className="science-nasa-summary">
            <span>{en ? 'NASA Clinical & Research References' : 'Referencias de investigación NASA'} ({brief.sources.length})</span>
          </summary>
          <ul className="science-sources-clean">
            {brief.sources.map((source) => (
              <li key={source.url} className="science-source-item">
                <a href={source.url} target="_blank" rel="noreferrer" className="science-source-link">
                  {source.title} ↗
                </a>
                <p className="science-source-use">{source.use}</p>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  )
}
