import { lazy, Suspense, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Reveal } from '../../components/public/Reveal'
import { publicCapabilities, publicPrinciples, publicQuestions, publicStages } from '../../content/publicCopy'
import { useLocale } from '../../i18n'

const OrbitalMission = lazy(() =>
  import('../../components/public/scenes/OrbitalMission').then((m) => ({ default: m.OrbitalMission })),
)

const CAPABILITIES = [
  {
    title: 'Asistente Quirón',
    text: 'Puedes hacer preguntas y consultar de dónde vienen sus respuestas. Si le falta información, te lo dirá.',
    tone: 'lilac' as const,
  },
  {
    title: 'Mediciones más claras',
    text: 'Las mediciones de ejemplo indican cuándo se tomaron y si parecen confiables.',
    tone: 'mint' as const,
  },
  {
    title: 'Recursos para la misión',
    text: 'Consulta qué necesita la tripulación y qué recursos están listos o todavía faltan.',
    tone: 'rose' as const,
  },
  {
    title: 'Apoyo adicional',
    text: 'Facilita pedir ayuda cuando algo necesita revisarse con más atención.',
    tone: 'warm' as const,
  },
  {
    title: 'Privacidad y decisión',
    text: 'Un espacio privado para hablar sobre bienestar y revisar un resumen antes de compartirlo.',
    tone: 'lilac' as const,
  },
  {
    title: 'Cuando no hay conexión',
    text: 'Algunas funciones siguen disponibles y se actualizan cuando vuelve el servicio.',
    tone: 'mint' as const,
  },
]

type Ctx = { reduced: boolean }

export function ComoFuncionaPage() {
  const { reduced } = useOutletContext<Ctx>()
  const { lang } = useLocale()
  const en = lang === 'en'
  const stages = publicStages(lang)
  const questions = publicQuestions(lang)
  const principles = publicPrinciples(lang)
  const capabilities = en ? publicCapabilities(lang) : CAPABILITIES
  useEffect(() => {
    document.title = en ? 'How it works · HELIOS' : 'Cómo funciona · HELIOS'
  }, [en])

  return (
    <>
      <header className="pub-page-hero">
        <p className="pub-kicker">{en ? 'How it works' : 'Cómo funciona'}</p>
        <h1>{en ? 'A continuous cycle of support' : 'Un ciclo continuo de acompañamiento'}</h1>
        <p className="pub-lead">
          {en
            ? 'From preparation to return: each stage has its own scene, examples, and link to the rest of the mission.'
            : 'De la preparación al regreso: cada etapa tiene su escena, sus ejemplos y su vínculo con el resto de la misión.'}
        </p>
      </header>

      <Suspense fallback={<div className="orbital-static scene-block" aria-hidden="true" />}>
        <OrbitalMission stages={stages} reduced={reduced} lang={lang} />
      </Suspense>

      <Reveal className="editorial-block space">
        <h2>{en ? 'Questions for Quirón' : 'Preguntas para Quirón'}</h2>
        <ul className="feature-list">
          {questions.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
        <div className="highlight-grid" style={{ marginTop: 18 }}>
          {principles.map((item) => (
            <div key={item.title} className="highlight-item" style={{ background: 'rgba(255,255,255,0.06)', color: '#f4f2f8' }}>
              <strong>{item.title}</strong>
              <p style={{ margin: '6px 0 0', fontWeight: 500 }}>{item.text}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {capabilities.map((item, index) => (
        <Reveal key={item.title} className={`editorial-block ${item.tone}`} delay={index * 0.04}>
          <h2>{item.title}</h2>
          <p>{item.text}</p>
        </Reveal>
      ))}
    </>
  )
}
