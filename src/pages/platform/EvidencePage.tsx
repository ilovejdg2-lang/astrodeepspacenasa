import { systemText } from '../../systemText'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HeliosLogo } from '../../components/HeliosLogo'
import { LocaleThemeSwitch } from '../../components/LocaleThemeSwitch'
import { useLocale } from '../../i18n'
import { CSA_RESOURCES } from '../../domain/csaResources'
import { DEMO_REVIEW_PROTOCOL } from '../../domain/demoReviewProtocol'
import { NASA_PROOF } from '../../content/judgeDefense'
import { platformApi, type Evidence } from '../../platform/api'
import '../../platform/platform.css'

const NASA_SOURCE_SUMMARIES = {
  osdr: {
    es: 'Estudios de ejemplo sobre salud y vuelos espaciales.',
    en: 'Example studies about health and spaceflight.',
  },
  donki: {
    es: 'Información sobre actividad solar y clima espacial.',
    en: 'Information about solar activity and space weather.',
  },
  radlab: {
    es: 'Estudios sobre radiación en el espacio.',
    en: 'Studies about radiation in space.',
  },
} as const

const NASA_SOURCE_NAMES = {
  osdr: { es: 'Estudios sobre salud espacial', en: 'Space health studies' },
  donki: { es: 'Actividad del Sol', en: 'Solar activity' },
  radlab: { es: 'Radiación en el espacio', en: 'Radiation in space' },
} as const

const EVIDENCE_SOURCE_COPY: Record<string, {
  title: { es: string; en: string }
  institution: { es: string; en: string }
  notes: { es: string; en: string }
}> = {
  'hrp-evidence': {
    title: { es: 'Estudios sobre salud espacial', en: 'Space health research' },
    institution: { es: 'NASA', en: 'NASA' },
    notes: { es: 'Información de NASA sobre riesgos para la salud en el espacio. No ofrece diagnósticos.', en: 'NASA information about health risks in space. It does not provide diagnoses.' },
  },
  'med-ops': {
    title: { es: 'Atención médica durante las misiones', en: 'Medical care during missions' },
    institution: { es: 'NASA', en: 'NASA' },
    notes: { es: 'Información general sobre la atención médica de las tripulaciones.', en: 'General information about medical care for crews.' },
  },
  'ochmo-briefs': {
    title: { es: 'Guías de salud espacial', en: 'Space health guides' },
    institution: { es: 'NASA', en: 'NASA' },
    notes: { es: 'Documentos de NASA sobre salud y atención médica en el espacio.', en: 'NASA documents about health and medical care in space.' },
  },
  osdr: {
    title: { es: 'Estudios de biología y salud en el espacio', en: 'Studies on life and health in space' },
    institution: { es: 'NASA', en: 'NASA' },
    notes: { es: 'Estudios sobre la vida y la salud en el espacio. Algunos no incluyen personas.', en: 'Studies about life and health in space. Some do not involve people.' },
  },
  'csa-radiation': {
    title: { es: 'Radiación en el espacio', en: 'Radiation in space' },
    institution: { es: 'Agencia Espacial Canadiense', en: 'Canadian Space Agency' },
    notes: { es: 'Explica los tipos de radiación espacial y sus efectos. No indica la dosis de una persona.', en: 'Explains types of space radiation and their effects. It does not show a person’s dose.' },
  },
  'csa-sciences': {
    title: { es: 'Investigación espacial', en: 'Space research' },
    institution: { es: 'Agencia Espacial Canadiense', en: 'Canadian Space Agency' },
    notes: { es: 'Información sobre investigaciones de salud y exploración espacial.', en: 'Information about research on health and space exploration.' },
  },
}

export function EvidencePage() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const [items, setItems] = useState<Evidence[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = en ? 'HELIOS · NASA sources' : 'HELIOS · Fuentes de NASA'
    let alive = true
    setLoading(true)
    platformApi.evidence()
      .then((data) => {
        if (alive) setItems(data.items)
      })
      .catch(() => {
        if (alive) setItems([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => { alive = false }
  }, [en])

  return (
    <div className="plat">
      {loading ? (
        <div className="plat-loader" role="status" aria-live="polite">
          <span className="plat-spinner" aria-hidden="true" />
          <p>{en ? 'Loading sources…' : 'Cargando fuentes…'}</p>
        </div>
      ) : null}
      <div className="plat-shell">
        <div className="plat-top">
          <HeliosLogo variant="wordmark" />
          <div className="plat-top-tools">
            <LocaleThemeSwitch />
            <div className="plat-actions">
              <Link className="plat-btn ghost" to="/entrar">{en ? 'Roles' : 'Roles'}</Link>
              <Link className="plat-btn ghost" to="/app">{en ? 'Open app' : 'Abrir app'}</Link>
              <Link className="plat-btn ghost" to="/misiones">Hub</Link>
            </div>
          </div>
        </div>
        <p className="plat-kicker">{en ? 'Space Apps · Sources' : 'Space Apps · Fuentes'}</p>
        <h1>{en ? 'NASA sources and studies' : 'Fuentes y estudios de NASA'}</h1>
        <p className="plat-lead">
          {en
            ? 'NASA information and sources used in HELIOS. They offer general context, not a person’s health status or radiation dose.'
            : 'Información y fuentes de NASA que usamos en HELIOS. Sirven como referencia general, no muestran la salud ni la dosis de radiación de una persona.'}
        </p>

        <article className="plat-panel">
          <h2>{en ? 'NASA sources used in HELIOS' : 'Fuentes de NASA que usa HELIOS'}</h2>
          <p className="plat-muted">
            {en
              ? 'The app shows when this information was last checked. It is not a personal medical assessment.'
              : 'La app indica cuándo se consultó esta información. No es una evaluación médica personal.'}
          </p>
          <ul className="plat-list" style={{ listStyle: 'none', padding: 0 }}>
            {NASA_PROOF.map((item) => (
              <li key={item.id} className="plat-panel" style={{ marginBottom: 10 }}>
                <strong>{NASA_SOURCE_NAMES[item.id][en ? 'en' : 'es']}</strong>
                <p className="plat-muted">{NASA_SOURCE_SUMMARIES[item.id][en ? 'en' : 'es']}</p>
                <div className="plat-actions">
                  <a className="plat-btn ghost" href={item.docs} target="_blank" rel="noreferrer">
                    {en ? 'Official docs' : 'Docs oficiales'}
                  </a>
                  <Link className="plat-btn ghost" to={item.ui.split(' · ')[0] ?? '/app/riesgos'}>
                    {en ? 'Open in HELIOS' : 'Abrir en HELIOS'}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </article>

        {!loading && items.length === 0 ? (
          <p>{en ? 'There are no additional sources to show right now. The official NASA links above are still available.' : 'Por ahora no hay más fuentes para mostrar. Los enlaces oficiales de NASA siguen disponibles.'}</p>
        ) : null}
        <article className="plat-panel">
          <h2>{en ? DEMO_REVIEW_PROTOCOL.title.en : DEMO_REVIEW_PROTOCOL.title.es}</h2>
          <p>{en ? DEMO_REVIEW_PROTOCOL.disclaimer.en : DEMO_REVIEW_PROTOCOL.disclaimer.es}</p>
        </article>
        {CSA_RESOURCES.map((item) => (
          <article className="plat-panel" key={item.id}>
            <h2>{en ? item.title.en : item.title.es}</h2>
            <p>{en ? 'Canadian Space Agency (CSA)' : 'Agencia Espacial Canadiense (CSA)'}</p>
            <p>{en ? item.useInHelios.en : item.useInHelios.es}</p>
            <p className="plat-muted">{en ? item.limitations.en : item.limitations.es}</p>
            <a className="plat-btn ghost" href={item.url} target="_blank" rel="noreferrer">
              {en ? 'Open CSA source' : 'Abrir fuente CSA'}
            </a>
          </article>
        ))}
        <div className="plat-list">
          {items.map((item) => (
            <article className="plat-panel" key={item.id}>
              <h2>{EVIDENCE_SOURCE_COPY[item.id]?.title[en ? 'en' : 'es'] ?? systemText(item.title)}</h2>
              <p>{EVIDENCE_SOURCE_COPY[item.id]?.institution[en ? 'en' : 'es'] ?? item.institution}</p>
              <p>{EVIDENCE_SOURCE_COPY[item.id]?.notes[en ? 'en' : 'es'] ?? systemText(item.notes)}</p>
              <a className="plat-btn ghost" href={item.url} target="_blank" rel="noreferrer">
                {en ? 'Open source' : 'Abrir fuente'}
              </a>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}