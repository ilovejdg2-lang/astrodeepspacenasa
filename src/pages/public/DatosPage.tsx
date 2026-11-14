import { ExternalLink } from 'lucide-react'
import { useEffect } from 'react'
import { Reveal } from '../../components/public/Reveal'
import { DATA_SOURCES } from '../../content/landing'

const STATUS_LABEL = {
  utilizado: 'Utilizado',
  consultado: 'Consultado',
  propuesto: 'Propuesto',
} as const

export function DatosPage() {
  useEffect(() => {
    document.title = 'Datos y fuentes · HELIOS'
  }, [])

  return (
    <>
      <header className="pub-page-hero">
        <p className="pub-kicker">Datos y fuentes</p>
        <h1>Simulación, consulta y propuestas</h1>
        <p className="pub-lead">
          Diferenciamos datos simulados, documentación consultada, conjuntos realmente usados e integraciones propuestas. HELIOS no inventa acceso a información médica de astronautas ni conexiones oficiales con NASA.
        </p>
      </header>

      <Reveal className="editorial-block space">
        <h2>Nota científica</h2>
        <p>
          Las cifras decorativas del sitio público y del hero se marcan como telemetría simulada. El dashboard usa escenarios ficticios para demostración.
        </p>
      </Reveal>

      <div className="data-grid">
        {DATA_SOURCES.map((source, index) => (
          <Reveal key={source.id} as="article" className="data-card" delay={index * 0.04}>
            <div className="data-meta">
              <span className="pill">{STATUS_LABEL[source.status]}</span>
              <span className="pill lilac">{source.type}</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{source.name}</h2>
            <p className="pub-muted" style={{ margin: 0 }}><strong>{source.institution}</strong> · {source.versionNote}</p>
            <p style={{ margin: 0 }}>{source.description}</p>
            <p style={{ margin: 0 }}><strong>Uso en HELIOS:</strong> {source.useInHelios}</p>
            <p className="pub-muted" style={{ margin: 0 }}><strong>Términos:</strong> {source.terms}</p>
            <p className="pub-muted" style={{ margin: 0 }}><strong>Limitaciones:</strong> {source.limitations}</p>
            <a className="pub-btn-ghost" href={source.href} target="_blank" rel="noreferrer">
              Abrir fuente <ExternalLink size={16} aria-hidden="true" />
            </a>
          </Reveal>
        ))}
      </div>
    </>
  )
}
