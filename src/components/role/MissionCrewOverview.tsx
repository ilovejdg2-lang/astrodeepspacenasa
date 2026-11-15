import { Link } from 'react-router-dom'
import { ArrowUpRight, Users, AlertTriangle } from 'lucide-react'
import { CREW, crewDuty } from '../../domain/crew'
import { crewPosture } from '../../domain/selectors'
import { useApp } from '../../state/store'
import { useLocale } from '../../i18n'
import { Badge } from '../ui'

export function MissionCrewOverview() {
  const { state } = useApp()
  const { lang } = useLocale()
  const en = lang === 'en'
  const pending = state.alerts.filter((alert) => alert.status !== 'closed')
  const review = CREW.filter((crew) => crewPosture(state, crew.id).observed === 'change').length
  return (
    <section className="mission-crew-overview" aria-labelledby="mission-crew-title">
      <div className="spread">
        <div>
          <h2 id="mission-crew-title">{en ? 'Crew overview' : 'Resumen de la tripulación'}</h2>
          <p className="muted">{en ? 'Choose a person to see their readings, symptoms and follow-up.' : 'Elegí una persona para ver sus lecturas, síntomas y seguimiento.'}</p>
        </div>
        <Link className="btn" to="/app/tripulacion"><Users size={18} aria-hidden="true" />{en ? 'View crew' : 'Ver tripulación'}</Link>
      </div>
      <div className="mission-overview-stats">
        <p><strong>{review}</strong> {en ? 'people requiring review' : 'personas requieren revisión'}</p>
        <Link to="/app/alertas"><AlertTriangle size={18} aria-hidden="true" /><strong>{pending.length}</strong> {en ? 'open alerts' : 'alertas abiertas'}</Link>
      </div>
      <div className="mission-crew-grid">
        {CREW.map((crew) => {
          const posture = crewPosture(state, crew.id)
          const alerts = pending.filter((alert) => alert.crewId === crew.id).length
          const label = posture.observed === 'change'
            ? (en ? 'Needs review' : 'Requiere revisión')
            : posture.observed === 'stable'
              ? (en ? 'Within baseline' : 'Dentro de línea base')
              : (en ? 'No recent evaluation' : 'Sin evaluación reciente')
          return (
            <article className="mission-crew-card" key={crew.id}>
              <div className="spread"><h3>{crew.name}</h3><Badge tone={posture.observed === 'change' ? 'amber' : posture.observed === 'stable' ? 'ok' : 'bad'}>{label}</Badge></div>
              <p className="muted">{crewDuty(crew, lang)}</p>
              <p>{en ? `${alerts} open alert(s)` : `${alerts} alerta(s) abierta(s)`}</p>
              <Link className="btn" to={`/app/tripulacion/${crew.id}`} data-testid={`view-monitoring-${crew.id}`}>
                {en ? 'View monitoring' : 'Ver monitoreo'}<ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            </article>
          )
        })}
      </div>
    </section>
  )
}
