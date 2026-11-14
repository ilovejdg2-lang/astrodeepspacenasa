import { BookOpen, ExternalLink, Loader2, Satellite } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { EVA_METABOLIC_BANDS, NASA_SOURCES, OSDR_DEMO_STUDIES } from '../../shared/nasaSources'
import { NASA_RISKS, RISK_CATEGORY_LABEL, type RiskCategory } from '../../shared/risks'
import { fetchOsdrStudy, type OsdrStudyResponse } from '../api/nasa'
import { Empty } from '../components/ui'
import { useLocale } from '../i18n'

const CATEGORIES = Object.keys(RISK_CATEGORY_LABEL) as RiskCategory[]

export function RisksPage() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const [category, setCategory] = useState<RiskCategory | 'all'>('all')
  const [query, setQuery] = useState('')
  const [studyId, setStudyId] = useState<(typeof OSDR_DEMO_STUDIES)[number]>(OSDR_DEMO_STUDIES[0])
  const [osdr, setOsdr] = useState<OsdrStudyResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const rows = useMemo(() => {
    return NASA_RISKS.filter((item) => {
      if (category !== 'all' && item.category !== category) return false
      if (!query.trim()) return true
      const hay = `${item.title} ${item.summary} ${item.sourceTitle}`.toLowerCase()
      return hay.includes(query.trim().toLowerCase())
    })
  }, [category, query])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    void fetchOsdrStudy(studyId, controller.signal)
      .then(setOsdr)
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [studyId])

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="kicker"><BookOpen aria-hidden="true" size={16} strokeWidth={1.75} /> {en ? 'Evidence' : 'Evidencia'}</p>
          <h1>{en ? 'NASA risks · demonstration library' : 'Riesgos NASA · biblioteca de demostración'}</h1>
          <p className="lede">
            {en
              ? 'A selection from the Human Research Roadmap, OCHMO, NTRS (EVA), and OSDR. They ground the preparation. They do not become treatment instructions on their own.'
              : 'Selección del Human Research Roadmap, OCHMO, NTRS (EVA) y OSDR. Sirven de fundamento científico para la preparación. No se convierten automáticamente en instrucciones de tratamiento.'}
          </p>
        </div>
      </header>

      <div className="spread">
        <div className="chips" role="tablist" aria-label="Categoría de riesgo">
          <button type="button" className="chip" aria-pressed={category === 'all'} onClick={() => setCategory('all')}>Todas</button>
          {CATEGORIES.map((id) => (
            <button key={id} type="button" className="chip" aria-pressed={category === id} onClick={() => setCategory(id)}>
              {RISK_CATEGORY_LABEL[id]}
            </button>
          ))}
        </div>
        <label className="field" style={{ marginBottom: 0, minWidth: 220 }}>
          Buscar
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sueño, radiación, EVA…" />
        </label>
      </div>

      {rows.length === 0 ? (
        <Empty title="Sin coincidencias" text="Probá otra categoría o palabra." />
      ) : (
        <div className="stack">
          {rows.map((risk) => (
            <article key={risk.id} className="panel" data-testid={`risk-${risk.id}`}>
              <div className="spread">
                <h2>{risk.title}</h2>
                <span className="badge">{RISK_CATEGORY_LABEL[risk.category]}</span>
              </div>
              <p>{risk.summary}</p>
              <p className="muted">Uso en HELIOS: {risk.useInSystem}</p>
              <p className="callout callout-amber">{risk.limitation}</p>
              <p>
                <a href={risk.sourceUrl} target="_blank" rel="noreferrer">
                  <ExternalLink aria-hidden="true" size={16} strokeWidth={1.75} /> {risk.sourceTitle}
                </a>
                <span className="muted"> · {risk.sourceDate}</span>
              </p>
            </article>
          ))}
        </div>
      )}

      <section className="panel">
        <h2><Satellite aria-hidden="true" size={18} strokeWidth={1.75} /> OSDR · metadatos en vivo</h2>
        <p className="lede">
          Consulta la API pública de OSDR (sin llave) para OSD-288 y OSD-575. Data are courtesy of the NASA Open Science Data Repository.
          HELIOS no interpreta paneles clínicos.
        </p>
        <div className="chips" role="group" aria-label="Estudio OSDR">
          {OSDR_DEMO_STUDIES.map((id) => (
            <button key={id} type="button" className="chip" aria-pressed={studyId === id} onClick={() => setStudyId(id)} data-testid={`osdr-${id}`}>
              {id}
            </button>
          ))}
        </div>
        {loading ? (
          <p className="muted"><Loader2 aria-hidden="true" size={16} strokeWidth={1.75} className="is-busy" /> Consultando OSDR…</p>
        ) : osdr ? (
          <div className="stack" data-testid="osdr-result">
            {osdr.metadata?.title ? <p><strong>{osdr.metadata.title}</strong></p> : null}
            {osdr.metadata?.description ? <p>{osdr.metadata.description}</p> : null}
            {osdr.message ? <p className="callout callout-amber">{osdr.message}</p> : null}
            {osdr.limitation ? <p className="muted">{osdr.limitation}</p> : null}
            <p>
              <a href={osdr.repoUrl} target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden="true" size={16} strokeWidth={1.75} /> Abrir estudio en OSDR
              </a>
              {osdr.fetchedAt ? <span className="muted"> · consultado {osdr.fetchedAt}</span> : null}
            </p>
          </div>
        ) : null}
      </section>

      <section className="panel">
        <h2>Rangos EVA documentados (xEMU)</h2>
        <p className="lede">
          Tasa metabólica de referencia en BTU/hr: baja ≤{EVA_METABOLIC_BANDS.lowMax}, media hasta {EVA_METABOLIC_BANDS.mediumMax},
          diseño histórico hasta ~{EVA_METABOLIC_BANDS.highDesignLimit}. No hay telemetría EMU/xEMU pública en vivo; estos valores solo contextualizan la simulación.
        </p>
      </section>

      <section className="panel">
        <h2>Fuentes consultadas</h2>
        <ul>
          {NASA_SOURCES.map((source) => (
            <li key={source.id}>
              <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
              <span className="muted"> — {source.useInSystem}</span>
            </li>
          ))}
        </ul>
        <p className="muted">
          Declará estas fuentes en la entrega del reto. Quirón Bot las cita; no recalibra umbrales clínicos con ellas.
        </p>
      </section>
    </div>
  )
}
