import { ExternalLink } from 'lucide-react'
import { lazy, Suspense, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Reveal } from '../../components/public/Reveal'
import { TiltCard } from '../../components/public/TiltCard'
import { publicSources, sourceStatus } from '../../content/publicCopy'
import { useLocale } from '../../i18n'

const DataNetwork = lazy(() =>
  import('../../components/public/scenes/DataNetwork').then((m) => ({ default: m.DataNetwork })),
)

type Ctx = { reduced: boolean }

export function DatosPage() {
  const { reduced } = useOutletContext<Ctx>()
  const { lang } = useLocale()
  const en = lang === 'en'
  const sources = publicSources(lang)
  useEffect(() => {
    document.title = en ? 'Data and sources · HELIOS' : 'Datos y fuentes · HELIOS'
  }, [en])

  return (
    <>
      <header className="pub-page-hero">
        <p className="pub-kicker">{en ? 'Data and sources' : 'Datos y fuentes'}</p>
        <h1>{en ? 'Simulation, lookup, and proposals' : 'Simulación, consulta y propuestas'}</h1>
        <p className="pub-lead">
          {en
            ? 'We separate simulated data, consulted documentation, datasets actually used, and proposed integrations. HELIOS does not invent access to astronaut medical information or official NASA connections.'
            : 'Diferenciamos datos simulados, documentación consultada, conjuntos realmente usados e integraciones propuestas. HELIOS no inventa acceso a información médica de astronautas ni conexiones oficiales con NASA.'}
        </p>
      </header>

      <Suspense fallback={<figure className="data-network"><div className="data-network-static" aria-hidden="true" /><figcaption>{en ? 'Conceptual decoration · not real medical centers or data links' : 'Decoración conceptual · no representa centros médicos ni enlaces de datos reales'}</figcaption></figure>}>
        <DataNetwork
          reduced={reduced}
          label={
            en
              ? 'Conceptual decoration · not real medical centers or data links'
              : 'Decoración conceptual · no representa centros médicos ni enlaces de datos reales'
          }
        />
      </Suspense>

      <Reveal className="editorial-block space">
        <h2>{en ? 'Scientific note' : 'Nota científica'}</h2>
        <p>
          {en
            ? 'Decorative figures on the public site and the hero are marked as simulated telemetry. The dashboard uses fictional scenarios for demonstration.'
            : 'Las cifras decorativas del sitio público y del hero se marcan como telemetría simulada. El dashboard usa escenarios ficticios para demostración.'}
        </p>
      </Reveal>

      <div className="data-grid">
        {sources.map((source, index) => (
          <TiltCard key={source.id} as="article" className="data-card" reduced={reduced} style={{ animationDelay: `${index * 40}ms` }}>
            <div className="data-meta">
              <span className="pill">{sourceStatus(lang, source.status)}</span>
              <span className="pill lilac">{source.type}</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{source.name}</h2>
            <p className="pub-muted" style={{ margin: 0 }}><strong>{source.institution}</strong> · {source.versionNote}</p>
            <p style={{ margin: 0 }}>{source.description}</p>
            <p style={{ margin: 0 }}><strong>{en ? 'Use in HELIOS:' : 'Uso en HELIOS:'}</strong> {source.useInHelios}</p>
            <p className="pub-muted" style={{ margin: 0 }}><strong>{en ? 'Terms:' : 'Términos:'}</strong> {source.terms}</p>
            <p className="pub-muted" style={{ margin: 0 }}><strong>{en ? 'Limitations:' : 'Limitaciones:'}</strong> {source.limitations}</p>
            <a className="pub-btn-ghost" href={source.href} target="_blank" rel="noreferrer">
              {en ? 'Open source' : 'Abrir fuente'} <ExternalLink size={16} aria-hidden="true" />
            </a>
          </TiltCard>
        ))}
      </div>
    </>
  )
}
