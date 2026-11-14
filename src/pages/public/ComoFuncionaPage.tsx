import { useEffect } from 'react'
import { Reveal } from '../../components/public/Reveal'
import { QUIRON_PRINCIPLES, QUIRON_QUESTIONS, STAGES } from '../../content/landing'

const CAPABILITIES = [
  {
    title: 'Quirón Bot',
    text: 'Asistente de consulta orientado a evidencias disponibles en el prototipo. Responde con fuentes visibles, reconoce datos faltantes y no inventa certeza clínica.',
    tone: 'lilac' as const,
  },
  {
    title: 'Calidad de datos',
    text: 'Las mediciones de demostración se acompañan de antigüedad, integridad y contexto para evitar leer un número aislado como verdad absoluta.',
    tone: 'mint' as const,
  },
  {
    title: 'Inventario y recursos',
    text: 'Seguimiento de recursos propuestos, aprobados o faltantes vinculados a la preparación de la misión.',
    tone: 'rose' as const,
  },
  {
    title: 'Apoyo especializado',
    text: 'Flujos para facilitar revisión humana cuando el contexto lo sugiere, sin sustituir criterio profesional.',
    tone: 'warm' as const,
  },
  {
    title: 'Privacidad y consentimiento',
    text: 'Espacio privado para bienestar emocional con resumen editable antes de cualquier compartición autorizada.',
    tone: 'lilac' as const,
  },
  {
    title: 'Continuidad local y sincronización',
    text: 'Funciones esenciales pueden continuar en local y sincronizar cuando el enlace vuelve a estar disponible.',
    tone: 'mint' as const,
  },
]

export function ComoFuncionaPage() {
  useEffect(() => {
    document.title = 'Cómo funciona · HELIOS'
  }, [])

  return (
    <>
      <header className="pub-page-hero">
        <p className="pub-kicker">Cómo funciona</p>
        <h1>Un ciclo continuo de acompañamiento</h1>
        <p className="pub-lead">
          De la preparación al regreso: cada etapa tiene su escena, sus ejemplos y su vínculo con el resto de la misión.
        </p>
      </header>

      <div className="stage-rail" aria-label="Etapas de la misión">
        {STAGES.map((stage, index) => (
          <Reveal key={stage.id} as="article" className="stage-card" delay={index * 0.06}>
            <p className="pub-kicker">Etapa {index + 1}</p>
            <h2>{stage.title}</h2>
            <p className="pub-muted">{stage.lead}</p>
            <ul>
              {stage.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>

      <Reveal className="editorial-block space">
        <h2>Quirón Bot · preguntas de ejemplo</h2>
        <ul className="feature-list">
          {QUIRON_QUESTIONS.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
        <div className="highlight-grid" style={{ marginTop: 18 }}>
          {QUIRON_PRINCIPLES.map((item) => (
            <div key={item.title} className="highlight-item" style={{ background: 'rgba(255,255,255,0.06)', color: '#f4f2f8' }}>
              <strong>{item.title}</strong>
              <p style={{ margin: '6px 0 0', fontWeight: 500 }}>{item.text}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {CAPABILITIES.map((item, index) => (
        <Reveal key={item.title} className={`editorial-block ${item.tone}`} delay={index * 0.04}>
          <h2>{item.title}</h2>
          <p>{item.text}</p>
        </Reveal>
      ))}
    </>
  )
}
