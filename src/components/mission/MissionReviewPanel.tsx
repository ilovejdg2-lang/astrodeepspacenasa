import { useEffect, useState } from 'react'
import { platformApi, type MissionReview } from '../../platform/api'
import { profileDisplayName } from '../../platform/copy'
import { systemText } from '../../systemText'

function stamp(value: string | number | null, en: boolean) {
  if (value == null || value === '') return '—'
  const ms = typeof value === 'number' ? value : Date.parse(value)
  if (!Number.isFinite(ms)) return String(value)
  return `${new Intl.DateTimeFormat(en ? 'en-GB' : 'es-CR', {
    timeZone: 'UTC',
    dateStyle: 'medium',
    timeStyle: 'short',
    hourCycle: 'h23',
  }).format(ms)} UTC`
}

export function MissionReviewPanel({
  missionId,
  en,
  canSave,
}: {
  missionId: string
  en: boolean
  canSave: boolean
}) {
  const [review, setReview] = useState<MissionReview | null>(null)
  const [versions, setVersions] = useState<{ version: number; createdAt: number }[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    platformApi.review(missionId)
      .then((data) => {
        if (!alive) return
        setReview(data.review)
        setVersions(data.versions)
      })
      .catch((err: unknown) => {
        if (alive) setError(err instanceof Error ? err.message : 'Error')
      })
    return () => { alive = false }
  }, [missionId])

  async function saveVersion() {
    setBusy(true)
    setError('')
    try {
      await platformApi.saveReview(missionId)
      const data = await platformApi.review(missionId)
      setReview(data.review)
      setVersions(data.versions)
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not save the report' : 'No se pudo guardar el informe'))
    } finally {
      setBusy(false)
    }
  }

  function download() {
    if (!review) return
    const blob = new Blob([JSON.stringify(review, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'helios-mission-review.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  if (!review) return <p className="rd-muted">{error ? systemText(error) : (en ? 'Loading Mission Review…' : 'Cargando revisión…')}</p>

  const text = (pair: { en: string; es: string }) => (en ? pair.en : pair.es)

  return (
    <section className="rd-card" data-testid="mission-review">
      <h2>{en ? 'Mission Review' : 'Revisión de misión'}</h2>
      <p className="rd-muted">{text(review.disclaimer)}</p>
      <h3>{en ? 'Flight summary' : 'Resumen del vuelo'}</h3>
      <ul className="health-mini-list">
        <li>{review.flight.name} · {review.flight.destination || (en ? 'Destination not set' : 'Sin destino')}</li>
        <li>{en ? 'Start' : 'Inicio'}: {stamp(review.flight.actualStart, en)} · {en ? 'Return' : 'Regreso'}: {stamp(review.flight.actualReturn, en)}</li>
        <li>{en ? 'Closed by' : 'Cierre'}: {review.flight.closedBy ? profileDisplayName(review.flight.closedBy) : '—'} · {stamp(review.flight.closedAt, en)}</li>
        <li>{en ? 'Preparation at deploy' : 'Preparación al despegar'}: {review.flight.prepPercent}% · {en ? 'Crew' : 'Tripulación'}: {review.flight.crewCount}</li>
      </ul>
      <h3>{en ? 'Indicators' : 'Indicadores'}</h3>
      <ul className="health-mini-list">
        {review.indicators.map((item) => (
          <li key={item.kind}>{en ? (item.kind === 'heart_rate' ? 'Heart rate' : item.kind === 'spo2' ? 'Oxygen saturation' : item.kind === 'temperature' ? 'Temperature' : item.kind.replaceAll('_', ' ')) : item.kind.replaceAll('_', ' ')}: {item.count} · {en ? 'older than the freshness window' : 'más antiguas que la ventana'}: {item.staleCount}</li>
        ))}
      </ul>
      <h3>{en ? 'Rest and check-ins' : 'Descanso y chequeos'}</h3>
      <ul className="health-mini-list">
        {review.rest.map((item) => (
          <li key={item.profileId}>{profileDisplayName(item.profileId)} · {en ? 'sleep records' : 'registros de sueño'} {item.sleepEpisodes} · {en ? 'check-ins' : 'chequeos'} {item.checkInsCompleted}/{item.checkInsCompleted + item.checkInsPending}</li>
        ))}
      </ul>
      <h3>{en ? 'Episodes' : 'Episodios'}</h3>
      <p>{en ? 'Open' : 'Abiertos'} {review.episodes.open} · {en ? 'Monitoring' : 'En seguimiento'} {review.episodes.monitoring} · {en ? 'Resolved' : 'Resueltos'} {review.episodes.resolved}</p>
      <h3>{en ? 'Alerts' : 'Alertas'}</h3>
      <ul className="health-mini-list">
        {review.alerts.map((item) => <li key={item.id}>{systemText(item.title)} · {item.status}</li>)}
      </ul>
      <h3>{en ? 'Resources' : 'Recursos'}</h3>
      <ul className="health-mini-list">
        {review.resources.map((item) => (
          <li key={item.name}>{item.name} · {item.kind} · {item.qtyOnHand}/{item.qtyPlanned} · {item.note} · {en ? 'movements' : 'movimientos'} {item.movements}</li>
        ))}
      </ul>
      <h3>{en ? 'Care inside your permissions' : 'Atención dentro de tus permisos'}</h3>
      <p>{Object.entries(review.care.byStatus).map(([status, count]) => `${status} ${count}`).join(' · ') || (en ? 'No visits' : 'Sin citas')}</p>
      <h3>{en ? 'Still open at close' : 'Pendientes al cierre'}</h3>
      {review.care.pendingAtClose.length === 0 ? <p className="rd-muted">{en ? 'No visit was left in an open status.' : 'Ninguna cita quedó en un estado abierto.'}</p> : (
        <ul className="health-mini-list">
          {review.care.pendingAtClose.map((item) => <li key={item.id}>{item.specialty} · {item.status} · {item.label}</li>)}
        </ul>
      )}
      <h3>{en ? 'Lessons' : 'Lecciones'}</h3>
      <ul className="health-mini-list">
        {review.lessons.map((item) => (
          <li key={item.text.en}><strong>{item.kind === 'observation' ? (en ? 'Observation' : 'Observación') : (en ? 'Proposal' : 'Propuesta')}</strong> — {text(item.text)} <span className="rd-muted">({text(item.basis)})</span></li>
        ))}
      </ul>
      <h3>{en ? 'Preparation ideas for another flight' : 'Ideas de preparación para otro vuelo'}</h3>
      <ul className="health-mini-list">
        {review.recommendations.map((item) => (
          <li key={item.text.en}><strong>{en ? 'Proposal' : 'Propuesta'}</strong> — {text(item.text)} <span className="rd-muted">({text(item.basis)})</span></li>
        ))}
      </ul>
      <p className="rd-muted">{en ? `Saved report versions: ${versions.map((item) => `v${item.version}`).join(', ') || 'none yet'}` : `Versiones guardadas: ${versions.map((item) => `v${item.version}`).join(', ') || 'ninguna'}`}</p>
      {error ? <p className="rd-error" role="alert">{systemText(error)}</p> : null}
      <div className="rd-actions">
        {canSave ? <button type="button" className="rd-btn" disabled={busy} onClick={() => void saveVersion()}>{en ? 'Save a new report version' : 'Guardar una versión nueva'}</button> : null}
        <button type="button" className="rd-btn ghost" onClick={download}>{en ? 'Export this view' : 'Exportar esta vista'}</button>
      </div>
    </section>
  )
}
