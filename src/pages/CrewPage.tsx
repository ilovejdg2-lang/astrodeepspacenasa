import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CREW, crewById } from '../domain/crew'
import { ageLabel, formatMeasurement } from '../domain/format'
import { canReadPrivateWellbeing } from '../domain/access'
import { SIMULATED_PINS, simulatedPinMatches } from '../domain/spaceAccess'
import { latestVisibleRequest } from '../domain/spaceRequests'
import { crewPosture, latestMeasurement } from '../domain/selectors'
import { readPrivate, writePrivate } from '../persistence/private'
import { useApp } from '../state/store'
import { Avatar } from '../components/Avatars'
import { SpaceRequests } from '../components/SpaceRequests'
import { Badge, Field } from '../components/ui'
import type { CrewId } from '../../shared/types'

type Filter = 'all' | 'change' | 'stable' | 'missing'

export function CrewPage() {
  const { state, dispatch, authenticatedCrewId, unlockSpace } = useApp()
  const [filter, setFilter] = useState<Filter>('all')
  const [note, setNote] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const spaceOpen = state.role === 'astronaut' && authenticatedCrewId === state.sessionCrewId
  const pinHint = CREW.map((crew) => `${crew.name.split(' ')[0]} ${SIMULATED_PINS[crew.id]}`).join(' · ')
  const selected = CREW.find((item) => item.id === state.selectedCrewId) ?? CREW[0]
  const sessionCrew = crewById(state.sessionCrewId)
  const allowed = selected ? canReadPrivateWellbeing(state.role, state.sessionCrewId, selected.id) : false

  useEffect(() => {
    if (!selected || !allowed) {
      setNote('')
      setLoaded(false)
      return
    }
    let active = true
    readPrivate(selected.id)
      .then((value) => { if (active) { setNote(value ?? ''); setLoaded(true) } })
      .catch(() => { if (active) setLoaded(true) })
    return () => { active = false }
  }, [selected, allowed])

  const visible = CREW.filter((crew) => {
    const posture = crewPosture(state, crew.id)
    if (filter === 'change') return posture.observed === 'change'
    if (filter === 'stable') return posture.observed === 'stable'
    if (filter === 'missing') return posture.observed === 'no_recent_evaluation'
    return true
  })

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="kicker">Tripulación</p>
          <h1>Cuatro personas, un mismo registro</h1>
          <p className="lede">El estado observado y la calidad de la evidencia se calculan aparte. Falta de datos no significa estabilidad.</p>
        </div>
        <label className="field">
          Rol simulado
          <select aria-label="Rol simulado" data-testid="role-select" value={`${state.role}:${state.sessionCrewId}`} onChange={(event) => {
            const [role, crewId] = event.target.value.split(':')
            if (role === 'medical' || role === 'ops' || role === 'astronaut') {
              setPin('')
              setPinError('')
              dispatch({ type: 'setRole', role, sessionCrewId: (crewId as CrewId) || state.sessionCrewId })
            }
          }}>
            <option value="medical:elena-torres">Equipo médico</option>
            <option value="ops:elena-torres">Operaciones</option>
            {CREW.map((crew) => <option key={crew.id} value={`astronaut:${crew.id}`}>Astronauta · {crew.name}</option>)}
          </select>
        </label>
      </header>
      {state.role === 'astronaut' ? (
        <section className="callout">
          <strong>Acceso simulado a Mi espacio</strong>
          {spaceOpen ? (
            <p>Sesión simulada abierta para {sessionCrew.name}. Al recargar la página hay que repetir el PIN.</p>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                if (!simulatedPinMatches(state.sessionCrewId, pin)) {
                  setPinError('Ese PIN simulado no corresponde a esta persona.')
                  return
                }
                setPinError('')
                unlockSpace(state.sessionCrewId)
              }}
            >
              <p>Este PIN es simulado. Sirve solo para la demostración y no protege los datos. Quien controla el navegador puede leer IndexedDB.</p>
              <p className="muted">Códigos de demostración: {pinHint}.</p>
              <Field id="space-pin" label={`PIN simulado de ${sessionCrew.name}`} error={pinError}>
                <input
                  id="space-pin"
                  data-testid="space-pin"
                  inputMode="numeric"
                  autoComplete="off"
                  value={pin}
                  aria-invalid={Boolean(pinError)}
                  aria-describedby={pinError ? 'space-pin-error' : undefined}
                  onChange={(event) => {
                    setPin(event.target.value)
                    if (pinError) setPinError('')
                  }}
                />
              </Field>
              <button className="btn btn-primary" type="submit" data-testid="space-pin-submit">Abrir sesión simulada</button>
            </form>
          )}
        </section>
      ) : null}
      <div className="chips" role="group" aria-label="Filtrar tripulación">
        {([['all', 'Todas'], ['change', 'Con cambio'], ['stable', 'En línea base'], ['missing', 'Sin datos recientes']] as const).map(([id, label]) => (
          <button key={id} type="button" className="chip" aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>
        ))}
      </div>
      <SpaceRequests />
      <div className="crew-grid cards">
        {visible.map((crew) => {
          const posture = crewPosture(state, crew.id)
          const hr = latestMeasurement(state, crew.id, 'heart_rate')
          const sleep = latestMeasurement(state, crew.id, 'sleep_hours')
          const request = latestVisibleRequest(state, crew.id)
          return (
            <button key={crew.id} type="button" className="person card-pad" aria-pressed={crew.id === selected?.id} onClick={() => dispatch({ type: 'selectCrew', crewId: crew.id })}>
              <Avatar id={crew.id} name={crew.name} />
              <strong>{crew.name}</strong>
              <span className="muted">{crew.duty}</span>
              <span>{crew.location}</span>
              <span>{hr ? formatMeasurement('heart_rate', hr.value, hr.unit) : 'Sin pulso reciente'}</span>
              <span>{sleep ? `Descanso ${formatMeasurement('sleep_hours', sleep.value, sleep.unit)}` : 'Sin registro de descanso'}</span>
              {request ? <span data-testid={`crew-request-${crew.id}`}>Solicitud · {request.line}</span> : null}
              <Badge tone={posture.observed === 'stable' ? 'ok' : 'amber'}>{posture.observed === 'no_recent_evaluation' ? 'Sin evaluación reciente' : posture.observed === 'change' ? 'Requiere revisión' : 'En línea base'}</Badge>
              <span className="muted">Evidencia {posture.evidence}</span>
            </button>
          )
        })}
      </div>
      {visible.length === 0 ? <p className="empty">Nadie coincide con ese filtro.</p> : null}
      {selected ? (
        <section className="detail">
          <div className="spread">
            <h2>{selected.name}</h2>
            <div className="row">
              <Link className="btn btn-primary" to="/">Abrir monitor</Link>
              <Link className="btn" to="/historial">Ver historial</Link>
            </div>
          </div>
          <p>{selected.location} · última actividad del reloj {ageLabel(state.clock.simulatedAt, state.clock.simulatedAt)}</p>
          <p>{crewPosture(state, selected.id).summary}</p>
          <div className="callout">
            <strong>Bienestar privado</strong>
            {allowed && loaded ? (
              <form onSubmit={(event) => { event.preventDefault(); void writePrivate(selected.id, note) }}>
                <Field id="private-note" label="Nota visible solo para esta persona en este navegador">
                  <textarea id="private-note" value={note} maxLength={2000} onChange={(event) => setNote(event.target.value)} />
                </Field>
                <button className="btn" type="submit">Guardar nota privada</button>
                <p className="muted">El equipo médico no carga este almacén. Quien controla el navegador puede leer IndexedDB: no es una frontera de seguridad.</p>
              </form>
            ) : (
              <p>Con el rol simulado actual este módulo no se consulta. Ocultar la tarjeta no sería suficiente, así que la lectura ni siquiera se pide.</p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  )
}
