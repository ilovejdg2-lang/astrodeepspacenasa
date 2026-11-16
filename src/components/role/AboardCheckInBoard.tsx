import { useEffect, useState } from 'react'
import { platformApi } from '../../platform/api'

type WakeRow = {
  profileId: string
  displayName: string
  role: string
  status: string
  payload: Record<string, unknown>
}

/** Resumen del día a bordo: cómo amaneció cada integrante. */
export function AboardCheckInBoard({ missionId, en }: { missionId: string; en: boolean }) {
  const [items, setItems] = useState<WakeRow[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    platformApi.wakeCrew(missionId)
      .then((data) => { if (alive) setItems(data.items) })
      .catch((err: Error) => { if (alive) setError(err.message || 'Error') })
    return () => { alive = false }
  }, [missionId])

  return (
    <section className="chief-launch" aria-label={en ? 'Daily Check-in' : 'Chequeo a bordo'}>
      <div className="chief-launch-head">
        <div>
          <h2>{en ? 'Daily Check-in' : 'Chequeo diario'}</h2>
          <p className="muted">
            {en
              ? 'Sleep, physical and emotional state, and whether they reported symptoms today.'
              : 'Sueño, estado físico y emocional, y si reportaron síntomas hoy.'}
          </p>
        </div>
      </div>
      {error ? <p className="field-error">{error}</p> : null}
      {items.length === 0 && !error ? <p className="muted">{en ? 'Loading…' : 'Cargando…'}</p> : null}
      <ul className="chief-launch-list">
        {items.map((row) => {
          const p = row.payload || {}
          const done = row.status === 'completed'
          const physical = String(p.physical || '—')
          const physicalLabel = en
            ? physical
            : ({ good: 'bien', acceptable: 'aceptable', poor: 'bajo' } as Record<string, string>)[physical] || physical
          return (
            <li key={row.profileId}>
              <div className={done ? 'is-on' : undefined} style={{ display: 'grid', gap: 4, padding: '10px 12px' }}>
                <strong>{row.displayName}</strong>
                <span className="muted">
                  {done
                    ? (en
                      ? `Sleep ${String(p.sleepHours ?? '—')} h · quality ${String(p.sleepQuality ?? '—')}/5 · physical ${physicalLabel} · mood ${String(p.mood ?? '—')}/5 · symptoms ${p.symptoms ? 'yes' : 'no'}`
                      : `Sueño ${String(p.sleepHours ?? '—')} h · calidad ${String(p.sleepQuality ?? '—')}/5 · físico ${physicalLabel} · ánimo ${String(p.mood ?? '—')}/5 · síntomas ${p.symptoms ? 'sí' : 'no'}`)
                    : (en ? 'Check-in pending' : 'Chequeo pendiente')}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
