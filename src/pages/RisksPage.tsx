import { systemText } from '../systemText'
import { RadiationPanel, SpaceWeatherPanel } from '../components/NasaEnvironment'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SPACE_HAZARDS } from '../domain/spaceHazards'
import { EVA_METABOLIC_BANDS } from '../../shared/nasaSources'
import { NASA_RISKS, RISK_CATEGORY_LABEL, type RiskCategory } from '../../shared/risks'
import { ScientificInsights } from '../components/ScientificInsights'
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

  return (
    <div className="page risks-brief">
      <header className="risks-brief-head">
        <p className="risks-brief-kicker">
          <AlertTriangle aria-hidden="true" size={12} strokeWidth={2.25} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 6 }} />
          {en ? 'Crew guide' : 'Guía de tripulación'}
        </p>
        <h1>{en ? 'Signs and what to do' : 'Señales y qué hacer'}</h1>
        <p>
          {en
            ? 'Pick a situation. See what you might feel and how to lower the chance. This is a guide, not a diagnosis.'
            : 'Elegí una situación. Mirá qué podés sentir y cómo bajar la chance. Es una guía, no un diagnóstico.'}
        </p>
      </header>

      <div className="risks-brief-tabs" role="tablist" aria-label={en ? 'Risk views' : 'Vistas de riesgo'}>
        {(
          [
            ['brief', en ? 'Guide' : 'Guía'],
            ['live', en ? 'Space weather' : 'Clima espacial'],
            ['library', en ? 'Risk cards' : 'Fichas'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'brief' ? (
        <div className="risks-guide">
          <div className="risks-guide-nav" role="group" aria-label={en ? 'Situations' : 'Situaciones'}>
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
                {en ? item.title.en : item.title.es}
              </button>
            ))}
          </div>

          {hazard ? (
            <section className="risks-guide-detail" data-testid={`hazard-detail-${hazard.id}`}>
              <h2>{en ? hazard.title.en : hazard.title.es}</h2>
              <p className="risks-guide-watch">{en ? hazard.watch.en : hazard.watch.es}</p>
              <div className="risks-guide-pair">
                <article>
                  <h3>{en ? 'You might notice' : 'Podés notar'}</h3>
                  <ul>
                    {hazard.signs.map((item) => (
                      <li key={item.en}>{en ? item.en : item.es}</li>
                    ))}
                  </ul>
                </article>
                <article>
                  <h3>{en ? 'What helps' : 'Qué ayuda'}</h3>
                  <ul>
                    {hazard.avoid.map((item) => (
                      <li key={item.en}>{en ? item.en : item.es}</li>
                    ))}
                  </ul>
                </article>
              </div>
              <p className="risks-brief-meta">
                {en
                  ? 'Tell the medic if it gets worse. HELIOS does not diagnose.'
                  : 'Avisá a la médica si empeora. HELIOS no diagnostica.'}
                {' · '}
                <a href={hazard.sources[0]?.url ?? 'https://www.nasa.gov/hrp/hazards/'} target="_blank" rel="noreferrer">
                  <ExternalLink aria-hidden="true" size={14} strokeWidth={1.75} />
                  {en ? 'NASA source' : 'Fuente NASA'}
                </a>
              </p>
              <div className="risks-guide-actions">
                <Link className="btn btn-primary" to="/app/mi-salud">{en ? 'Log symptoms' : 'Anotar síntomas'}</Link>
                <button type="button" className="btn" onClick={() => setTab('live')}>
                  {en ? 'Space weather' : 'Clima espacial'}
                </button>
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      {tab === 'live' ? (
        <div className="env-stack">
          <p className="env-lead">
            {en
              ? 'NASA space and research data for context — not personal measurements or medical alerts.'
              : 'Datos de NASA sobre el espacio y la investigación: solo contexto, no mediciones personales ni alertas médicas.'}
          </p>
          <SpaceWeatherPanel />
          <RadiationPanel compact />
          <ScientificInsights compact />
          <section className="env-reference" aria-label={en ? 'Spacewalk effort reference' : 'Referencia de esfuerzo en caminata espacial'}>
            <div className="env-reference-head">
              <h2>{en ? 'Spacewalk effort' : 'Esfuerzo en caminata espacial'}</h2>
              <p>{en ? 'Reference ranges · no live suit data' : 'Rangos de referencia · sin datos del traje en vivo'}</p>
            </div>
            <dl className="env-bands">
              <div>
                <dt>{en ? 'Light' : 'Leve'}</dt>
                <dd>≤{EVA_METABOLIC_BANDS.lowMax} <span>BTU/hr</span></dd>
              </div>
              <div>
                <dt>{en ? 'Moderate' : 'Moderado'}</dt>
                <dd>≤{EVA_METABOLIC_BANDS.mediumMax} <span>BTU/hr</span></dd>
              </div>
              <div>
                <dt>{en ? 'Heavy' : 'Intenso'}</dt>
                <dd>~{EVA_METABOLIC_BANDS.highDesignLimit} <span>BTU/hr</span></dd>
              </div>
            </dl>
          </section>
        </div>
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
                {systemText(RISK_CATEGORY_LABEL[id])}
              </button>
            ))}
          </div>
          <ul className="risks-brief-list">
            {NASA_RISKS.filter((r) => category === 'all' || r.category === category).map((risk) => (
              <li key={risk.id} data-testid={`risk-${risk.id}`}>
                <div className="spread">
                  <h3>{systemText(risk.title)}</h3>
                  <span className="badge">{systemText(RISK_CATEGORY_LABEL[risk.category])}</span>
                </div>
                <p>{systemText(risk.summary)}</p>
                <p className="risks-brief-meta">{systemText(risk.useInSystem)}</p>
                <a href={risk.sourceUrl} target="_blank" rel="noreferrer">
                  {risk.sourceTitle} · {systemText(risk.sourceDate)}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
