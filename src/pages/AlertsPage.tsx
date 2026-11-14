import { Activity, ArrowRight, Bell, Check, Radio, ShieldAlert, Stethoscope, Unplug, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CREW } from '../domain/crew'
import { alertTypeLabel, auditActionLabel, formatMission, integrityLabel, rejectLabel } from '../domain/format'
import { isSensorAlert } from '../domain/access'
import { useApp } from '../state/store'
import { Badge, Empty } from '../components/ui'
import type { AlertStatus, AlertType } from '../../shared/types'

function AlertIcon({ type }: { type: AlertType }) {
  const Icon = type === 'missing' ? Radio : type === 'altered' || type === 'repeated' ? ShieldAlert : type === 'comms' ? Unplug : type === 'symptom' ? Bell : type === 'quality' ? Radio : Activity
  const tone = type === 'altered' || type === 'missing' ? 'tone-security' : type === 'comms' ? 'tone-comms' : type === 'quality' || type === 'repeated' ? 'tone-sensor' : 'tone-health'
  return <Icon aria-hidden="true" size={18} strokeWidth={1.75} className={tone} />
}

export function AlertsPage() {
  const { state, dispatch } = useApp()
  const [tab, setTab] = useState<AlertStatus>('active')
  const rows = state.alerts.filter((item) => item.status === tab)
  const [selectedId, setSelectedId] = useState(rows.find((item) => item.episodeId)?.id ?? rows[0]?.id ?? state.alerts[0]?.id ?? '')
  const selected = state.alerts.find((item) => item.id === selectedId) ?? rows[0]
  const counts = { active: 0, following: 0, closed: 0 }
  for (const alert of state.alerts) counts[alert.status] += 1

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="kicker">Alertas</p>
          <h1>Centro de alertas</h1>
          <p className="lede">Un aviso de sensor no cierra un episodio de salud. Dos lecturas iguales no se presentan como un ataque.</p>
        </div>
      </header>
      <div className="chips" role="tablist">
        {(['active', 'following', 'closed'] as const).map((status) => (
          <button key={status} type="button" className="chip" aria-pressed={tab === status} onClick={() => setTab(status)}>
            {status === 'active' ? 'Activas' : status === 'following' ? 'En seguimiento' : 'Cerradas'} ({counts[status]})
          </button>
        ))}
      </div>
      {rows.length === 0 ? <Empty title="No hay alertas en esta bandeja" text="Cuando el escenario o una acción cree una, va a aparecer aquí." /> : (
        <div className="split">
          <div className="stack">
            {rows.map((alert) => (
              <button key={alert.id} type="button" className="person card-pad" data-testid={`alert-${alert.id}`} aria-pressed={alert.id === selected?.id} onClick={() => setSelectedId(alert.id)}>
                <strong><AlertIcon type={alert.type} /> {alert.title}</strong>
                <span>{alert.crewId ? CREW.find((crew) => crew.id === alert.crewId)?.name : 'Sistema'}</span>
                <span className="muted">{formatMission(alert.openedAt)}</span>
                <Badge tone={alert.type === 'altered' || alert.type === 'missing' ? 'bad' : 'amber'}>{alertTypeLabel(alert.type)}</Badge>
              </button>
            ))}
          </div>
          {selected ? (
            <article className="detail">
              <h2>{selected.title}</h2>
              <p>{selected.reason}</p>
              <p className="muted">Abierta {formatMission(selected.openedAt)} · actualizada {formatMission(selected.updatedAt)} · {selected.astronautAck ? 'aviso confirmado' : 'aviso sin confirmar'}</p>
              <div className="row">
                <button className="btn" type="button" onClick={() => dispatch({ type: 'ackAlert', alertId: selected.id })}><Check aria-hidden="true" size={18} strokeWidth={1.75} /> Confirmar aviso</button>
                {selected.status === 'active' ? <button className="btn" type="button" onClick={() => dispatch({ type: 'setAlertStatus', alertId: selected.id, status: 'following' })}><ArrowRight aria-hidden="true" size={18} strokeWidth={1.75} /> Pasar a seguimiento</button> : null}
                {isSensorAlert(selected.type) ? <button className="btn" type="button" onClick={() => dispatch({ type: 'resolveSensorAlert', alertId: selected.id })}><Radio aria-hidden="true" size={18} strokeWidth={1.75} className="tone-sensor" /> Resolver sensor</button> : (
                  <button className="btn btn-danger" type="button" onClick={() => dispatch({ type: 'setAlertStatus', alertId: selected.id, status: 'closed' })}><X aria-hidden="true" size={18} strokeWidth={1.75} /> Cerrar alerta</button>
                )}
                {selected.episodeId ? <Link className="btn btn-primary" to="/analisis"><Stethoscope aria-hidden="true" size={18} strokeWidth={1.75} /> Abrir análisis</Link> : null}
              </div>
              <h3>Línea de tiempo</h3>
              <ol className="timeline">
                {state.audit.filter((item) => item.entityId === selected.id || item.entityId === selected.episodeId).map((item) => (
                  <li key={item.id}><span className="dot" aria-hidden="true" /><span><strong>{auditActionLabel(item.action)}</strong> · {formatMission(item.at)} · {item.detail}</span></li>
                ))}
                {state.audit.filter((item) => item.entityId === selected.id || item.entityId === selected.episodeId).length === 0 ? <li><span className="dot" /><span>Generada por el escenario, sin acciones posteriores.</span></li> : null}
              </ol>
            </article>
          ) : null}
        </div>
      )}
      <section className="panel">
        <h2>Integridad reciente</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Hora</th><th>Origen</th><th>Dato</th><th>Integridad</th><th>Detalle</th></tr></thead>
            <tbody>
              {state.measurements.slice(-6).reverse().map((item) => (
                <tr key={item.id}><td>{formatMission(item.measuredAt)}</td><td>{item.sensorId}</td><td>{item.value} {item.unit}</td><td>{integrityLabel(item.integrity)}</td><td>{item.origin === 'local' ? 'Registro local' : item.macValid ? 'MAC de demostración válido' : 'Sin MAC'}</td></tr>
              ))}
              {state.rejected.slice(-4).reverse().map((item) => (
                <tr key={item.id}><td>{formatMission(item.at)}</td><td>{item.sensorId}</td><td>{item.claimedValue ?? '—'}</td><td>{rejectLabel(item.reason)}</td><td>{item.detail}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
