import { systemText } from '../../systemText'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HeliosLogo } from '../../components/HeliosLogo'
import { useLocale } from '../../i18n'
import { platformApi, type MissionEnvironment } from '../../platform/api'
import { getSessionToken, getStoredProfile, setActiveMissionId } from '../../platform/session'
import '../../platform/platform.css'

export function MissionWizardPage() {
  const navigate = useNavigate()
  const { lang } = useLocale()
  const en = lang === 'en'
  const profile = getStoredProfile()
  const [step, setStep] = useState(1)
  const [missionId, setMissionId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState(en ? 'HELIOS Mission' : 'Misión HELIOS')
  const [destination, setDestination] = useState(en ? 'Orbital habitat (simulation)' : 'Hábitat orbital (simulación)')
  const [environment, setEnvironment] = useState<MissionEnvironment>('space_station')
  const [durationDays, setDurationDays] = useState(30)
  /** Default = 4 personas del monitor (Elena, Mateo, Sofía, Alex). */
  const [plannedCrewCount, setPlannedCrewCount] = useState(4)
  const [activities, setActivities] = useState(en ? 'Operations, exercise, demo EVA' : 'Operaciones, ejercicio, EVA demo')
  const steps = useMemo(
    () => (en ? ['Data', 'Crew'] : ['Datos', 'Tripulación']),
    [en],
  )

  const quironTip = en
    ? 'Quirón recommends including medical and psychological coverage in the plan. This is a HELIOS suggestion, not a NASA requirement.'
    : 'Quirón recomienda incluir cobertura médica y psicológica en la planificación. Es una sugerencia HELIOS, no una obligación NASA.'

  useEffect(() => {
    document.title = en ? 'HELIOS · New mission' : 'HELIOS · Nueva misión'
    if (!getSessionToken()) {
      navigate('/entrar', { replace: true })
      return
    }
    if (profile?.demoRole !== 'chief') {
      navigate('/misiones', { replace: true })
    }
  }, [navigate, en, profile?.demoRole])

  async function createAndContinue() {
    setError('')
    setBusy(true)
    try {
      const created = await platformApi.createMission({
        name,
        destination,
        environment,
        durationDays,
        plannedCrewCount,
        activities: activities.split(',').map((item) => item.trim()).filter(Boolean),
        timezone: 'UTC',
      })
      setMissionId(created.mission.id)
      setActiveMissionId(created.mission.id)
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not create mission' : 'No se pudo crear'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="plat">
      {busy ? (
        <div className="plat-loader" role="status" aria-live="polite">
          <span className="plat-spinner" aria-hidden="true" />
          <p>{en ? 'Working…' : 'Procesando…'}</p>
        </div>
      ) : null}
      <div className="plat-shell">
        <div className="plat-top">
          <HeliosLogo variant="wordmark" />
          <Link className="plat-btn ghost" to="/misiones">{en ? 'Back to hub' : 'Volver al hub'}</Link>
        </div>
        <p className="plat-kicker">{en ? 'Creation assistant' : 'Asistente de creación'}</p>
        <h1>{en ? 'New mission with Quirón' : 'Nueva misión con Quirón'}</h1>
        <p className="plat-lead">{quironTip}</p>
        <div className="plat-steps">
          {steps.map((label, index) => (
            <button
              key={label}
              type="button"
              className={`plat-step${step === index + 1 ? ' is-on' : ''}`}
              onClick={() => (missionId || index === 0 ? setStep(index + 1) : undefined)}
            >
              {index + 1}. {label}
            </button>
          ))}
        </div>
        {error ? <p className="plat-error">{systemText(error)}</p> : null}

        {step === 1 ? (
          <section className="plat-panel">
            <h2>{en ? 'Step 1 · General data' : 'Paso 1 · Datos generales'}</h2>
            <div className="plat-field">
              <label>{en ? 'Name' : 'Nombre'}</label>
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="plat-field">
              <label>{en ? 'Destination / scenario' : 'Destino / escenario'}</label>
              <input value={destination} onChange={(event) => setDestination(event.target.value)} />
            </div>
            <div className="plat-field">
              <label>{en ? 'Mission environment' : 'Entorno de misión'}</label>
              <select value={environment} onChange={(event) => setEnvironment(event.target.value as MissionEnvironment)}>
                <option value="spacecraft">{en ? 'Spacecraft' : 'Nave espacial'}</option>
                <option value="space_station">{en ? 'Space station' : 'Estación espacial'}</option>
                <option value="rover">{en ? 'Rover' : 'Rover'}</option>
                <option value="surface_base">{en ? 'Lunar / planetary base' : 'Base lunar o planetaria'}</option>
                <option value="training">{en ? 'Training scenario' : 'Escenario de entrenamiento'}</option>
              </select>
              <p className="plat-muted">
                {en
                  ? 'Adapts copy and prep context only. Does not invent different medical thresholds.'
                  : 'Adapta textos y contexto de preparación. No inventa umbrales médicos distintos.'}
              </p>
            </div>
            <div className="plat-field">
              <label>{en ? 'Estimated duration (days)' : 'Duración estimada (días)'}</label>
              <input type="number" value={durationDays} onChange={(event) => setDurationDays(Number(event.target.value))} />
            </div>
            <div className="plat-field">
              <label>{en ? 'Planned people (chief also counts)' : 'Personas previstas (el jefe también cuenta)'}</label>
              <input type="number" value={plannedCrewCount} onChange={(event) => setPlannedCrewCount(Number(event.target.value))} />
            </div>
            <div className="plat-field">
              <label>{en ? 'Activities (comma-separated)' : 'Actividades (separadas por coma)'}</label>
              <textarea value={activities} onChange={(event) => setActivities(event.target.value)} />
            </div>
            <button type="button" className="plat-btn" disabled={busy} onClick={() => void createAndContinue()}>
              {en ? 'Save and continue' : 'Guardar y continuar'}
            </button>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="plat-panel">
            <h2>{en ? 'Step 2 · Crew' : 'Paso 2 · Tripulación'}</h2>
            <p>
              {en
                ? 'You are chief of this mission. Invite others with the mission code from the hub. Each person uses their own profile button; there are no shared passwords.'
                : 'Quedaste como jefe de esta misión. Podés invitar con el código de la misión desde el hub. Cada persona activa su propia cuenta (botón de perfil); no hay contraseñas compartidas.'}
            </p>
            <p className="plat-ok">
              {en
                ? 'Code is available in the hub after creation. Fictional participants must be marked as demo.'
                : 'Código disponible en el hub tras crear. Participantes ficticios deben marcarse como demo.'}
            </p>
            <div className="plat-actions">
              <Link className="plat-btn" to="/app/recursos?tab=checklist">
                {en ? 'Open checklist in Resources' : 'Abrir checklist en Recursos'}
              </Link>
            </div>
          </section>
        ) : null}

      </div>
    </div>
  )
}