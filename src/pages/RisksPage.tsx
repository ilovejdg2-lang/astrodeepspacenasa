import { RadiationPanel } from '../components/NasaEnvironment'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SPACE_HAZARDS } from '../domain/spaceHazards'
import { EVA_METABOLIC_BANDS } from '../../shared/nasaSources'
import { NASA_RISKS, RISK_CATEGORY_LABEL, type RiskCategory } from '../../shared/risks'
import { ScientificInsights } from '../components/ScientificInsights'
import { Empty } from '../components/ui'
import { useLocale } from '../i18n'
import './risks-brief.css'

type Tab = 'brief' | 'live' | 'library'

const CATEGORIES = Object.keys(RISK_CATEGORY_LABEL) as RiskCategory[]

const HAZARD_TO_CATEGORY: Partial<Record<string, RiskCategory | 'all'>> = {
  radiation: 'proteccion',
  isolation: 'entrenamiento',
  distance: 'planificacion',
  gravity: 'equipo',
  closed_hostile: 'habitat',
}

export function RisksPage() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const [tab, setTab] = useState<Tab>('brief')
  const [hazardId, setHazardId] = useState(SPACE_HAZARDS[0]?.id ?? 'radiation')
  const [category, setCategory] = useState<RiskCategory | 'all'>('all')

  const hazard = SPACE_HAZARDS.find((h) => h.id === hazardId) ?? SPACE_HAZARDS[0]

  const priorityRisks = useMemo(() => {
    const mapped = HAZARD_TO_CATEGORY[hazardId]
    const pool = NASA_RISKS.filter((item) => {
      if (category !== 'all' && item.category !== category) return false
      if (mapped && mapped !== 'all' && category === 'all') return item.category === mapped
      return true
    })
    return pool.slice(0, 5)
  }, [category, hazardId])

  return (
    <div className="page risks-brief">
      <header className="risks-brief-head">
        <p className="risks-brief-kicker">
          <AlertTriangle aria-hidden="true" size={12} strokeWidth={2.25} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 6 }} />
          {en ? 'Mission brief · NASA' : 'Briefing de misión · NASA'}
        </p>
        <h1>{en ? 'What matters now' : 'Qué importa ahora'}</h1>
        <p>
          {en
            ? 'Scan the hazard. Act. Open live NASA only if you need numbers.'
            : 'Mirás el peligro. Actuás. Abrís NASA en vivo solo si necesitás números.'}
          {' · '}
          <Link to="/misiones/evidencia">{en ? 'Sources' : 'Fuentes'}</Link>
        </p>
      </header>

      <div className="risks-brief-tabs" role="tablist" aria-label={en ? 'Risk views' : 'Vistas de riesgo'}>
        {(
          [
            ['brief', en ? 'Brief' : 'Brief'],
            ['live', en ? 'Live NASA' : 'NASA en vivo'],
            ['library', en ? 'Risk cards' : 'Fichas'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} aria-pressed={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'brief' ? (
        <>
          <section className="risks-brief-panel" aria-label={en ? 'Five hazards' : 'Cinco peligros'}>
            <div className="spread" style={{ alignItems: 'baseline' }}>
              <h2>{en ? '5 hazards' : '5 peligros'}</h2>
              <a href="https://www.nasa.gov/hrp/hazards/" target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden="true" size={14} strokeWidth={1.75} /> HRP
              </a>
            </div>
            <div className="risks-brief-grid">
              {SPACE_HAZARDS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`risks-brief-hazard${hazardId === item.id ? ' is-on' : ''}`}
                  data-testid={`hazard-${item.id}`}
                  aria-pressed={hazardId === item.id}
                  onClick={() => {
                    setHazardId(item.id)
                    const mapped = HAZARD_TO_CATEGORY[item.id]
                    if (mapped) setCategory(mapped === 'all' ? 'all' : mapped)
                  }}
                >
                  <strong>{en ? item.title.en : item.title.es}</strong>
                  <span>{en ? item.prepFollowUp.en : item.prepFollowUp.es}</span>
                </button>
              ))}
            </div>
          </section>

          {hazard ? (
            <section className="risks-brief-panel" data-testid={`hazard-detail-${hazard.id}`}>
              <h2>{en ? hazard.title.en : hazard.title.es}</h2>
              <p>{en ? hazard.summary.en : hazard.summary.es}</p>
              <p className="risks-brief-meta">
                <strong>{en ? 'Do now' : 'Hacer ahora'}:</strong>{' '}
                {en ? hazard.prepFollowUp.en : hazard.prepFollowUp.es}
              </p>
              <p className="risks-brief-meta">
                <strong>HELIOS:</strong> {en ? hazard.heliosContext.en : hazard.heliosContext.es}
              </p>
              <div className="risks-brief-chiprow">
                <Link className="chip" to="/app/mi-salud">{en ? 'My health' : 'Mi salud'}</Link>
                <button type="button" className="chip" onClick={() => setTab('live')}>
                  {en ? 'Live NASA' : 'NASA en vivo'}
                </button>
              </div>
            </section>
          ) : null}

          <section className="risks-brief-panel">
            <h2>{en ? 'Priority risk cards' : 'Fichas prioritarias'}</h2>
            <p className="risks-brief-meta">
              {en ? 'Top matches for this hazard. Full library under Risk cards.' : 'Principales para este peligro. Biblioteca completa en Fichas.'}
            </p>
            {priorityRisks.length === 0 ? (
              <Empty title={en ? 'No matches' : 'Sin coincidencias'} text={en ? 'Open Risk cards.' : 'Abrí Fichas.'} />
            ) : (
              <ul className="risks-brief-list">
                {priorityRisks.map((risk) => (
                  <li key={risk.id} data-testid={`risk-${risk.id}`}>
                    <div className="spread">
                      <h3>{risk.title}</h3>
                      <span className="badge">{RISK_CATEGORY_LABEL[risk.category]}</span>
                    </div>
                    <p>{risk.summary}</p>
                    <a href={risk.sourceUrl} target="_blank" rel="noreferrer">
                      {risk.sourceTitle}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}

      {tab === 'live' ? (
        <>
          <p className="risks-brief-meta">
            {en
              ? 'Environment context only · not personal dose · UTC stamps on every fetch.'
              : 'Solo contexto ambiental · no dosis personal · marcas UTC en cada consulta.'}
          </p>
          <RadiationPanel compact />
          <ScientificInsights compact />
          <p className="risks-brief-meta">
            {en
              ? `EVA metabolic bands (xEMU ref.): ≤${EVA_METABOLIC_BANDS.lowMax} / ${EVA_METABOLIC_BANDS.mediumMax} / ~${EVA_METABOLIC_BANDS.highDesignLimit} BTU/hr · no live EMU feed.`
              : `Bandas metabólicas EVA (ref. xEMU): ≤${EVA_METABOLIC_BANDS.lowMax} / ${EVA_METABOLIC_BANDS.mediumMax} / ~${EVA_METABOLIC_BANDS.highDesignLimit} BTU/hr · sin feed EMU en vivo.`}
          </p>
        </>
      ) : null}

      {tab === 'library' ? (
        <section className="risks-brief-panel">
          <h2>{en ? 'Risk library' : 'Biblioteca de riesgos'}</h2>
          <div className="risks-brief-chiprow" role="group" aria-label={en ? 'Category' : 'Categoría'}>
            <button type="button" aria-pressed={category === 'all'} onClick={() => setCategory('all')}>
              {en ? 'All' : 'Todas'}
            </button>
            {CATEGORIES.map((id) => (
              <button key={id} type="button" aria-pressed={category === id} onClick={() => setCategory(id)}>
                {RISK_CATEGORY_LABEL[id]}
              </button>
            ))}
          </div>
          <ul className="risks-brief-list">
            {NASA_RISKS.filter((r) => category === 'all' || r.category === category).map((risk) => (
              <li key={risk.id} data-testid={`risk-${risk.id}`}>
                <div className="spread">
                  <h3>{risk.title}</h3>
                  <span className="badge">{RISK_CATEGORY_LABEL[risk.category]}</span>
                </div>
                <p>{risk.summary}</p>
                <p className="risks-brief-meta">{risk.useInSystem}</p>
                <a href={risk.sourceUrl} target="_blank" rel="noreferrer">
                  {risk.sourceTitle} · {risk.sourceDate}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
