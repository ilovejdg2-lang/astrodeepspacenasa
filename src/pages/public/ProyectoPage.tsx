import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Reveal } from '../../components/public/Reveal'
import { DASHBOARD_PATH, DIFFERENTIATORS } from '../../content/landing'

export function ProyectoPage() {
  useEffect(() => {
    document.title = 'El proyecto · HELIOS'
  }, [])

  return (
    <>
      <header className="pub-page-hero">
        <p className="pub-kicker">El proyecto</p>
        <h1>Cuidado continuo para una misión humana</h1>
        <p className="pub-lead">
          HELIOS propone conectar preparación, monitoreo y seguimiento posmisión en una experiencia coherente de acompañamiento en salud espacial.
        </p>
      </header>

      <Reveal className="editorial-block rose">
        <h2>El reto</h2>
        <p>
          El cuidado de la salud en el espacio comienza antes del lanzamiento y continúa después del regreso. La información de salud, los recursos disponibles y las comunicaciones pueden quedar dispersos, dificultando un seguimiento continuo entre etapas.
        </p>
      </Reveal>

      <Reveal className="editorial-block mint" delay={0.05}>
        <h2>Qué propone HELIOS</h2>
        <p>
          Una plataforma de acompañamiento que organiza indicadores, inventario, consentimiento y apoyo especializado a lo largo de Preembarque, A bordo y Posmisión — con transparencia sobre la calidad de los datos y el alcance del prototipo.
        </p>
      </Reveal>

      <Reveal className="editorial-block lilac" delay={0.08}>
        <h2>Qué problema busca resolver</h2>
        <p>
          La fragmentación entre preparación, telemetría de demostración, bienestar emocional y seguimiento posterior. HELIOS busca que la tripulación y el equipo responsable consulten un mismo hilo narrativo de misión, sin presentar lecturas inventadas como datos clínicos en vivo.
        </p>
      </Reveal>

      <Reveal className="editorial-block warm" delay={0.1}>
        <h2>Qué lo hace diferente</h2>
        <ul className="feature-list">
          {DIFFERENTIATORS.map((item) => (
            <li key={item.title}>
              <strong>{item.title}.</strong> {item.text}
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal className="editorial-block space" delay={0.12}>
        <h2>Impacto potencial</h2>
        <p>
          Mejor continuidad entre etapas, decisiones mejor contextualizadas y un lenguaje común entre tripulación y apoyo especializado — siempre dentro de un marco de prototipo y simulación.
        </p>
      </Reveal>

      <Reveal className="editorial-block mint" delay={0.14}>
        <h2>Alcance del prototipo y próximos pasos</h2>
        <p>
          Lo implementado hoy incluye monitor de demostración, escenarios simulados, inventario, alertas, historial y un asistente con principios de fuentes visibles. Capacidades como validación clínica, integración masiva de datasets NASA o telemetría real de astronautas requieren investigación y autorización adicionales; no forman parte del MVP actual.
        </p>
        <div className="team-actions" style={{ marginTop: 12 }}>
          <Link className="pub-btn" to="/como-funciona">Cómo funciona</Link>
          <Link className="pub-btn-ghost" to={DASHBOARD_PATH}>Acceder al sistema</Link>
        </div>
      </Reveal>
    </>
  )
}
