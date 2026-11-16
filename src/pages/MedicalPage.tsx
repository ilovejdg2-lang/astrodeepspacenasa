import { Brain, CalendarDays, Stethoscope } from 'lucide-react'
import { Link } from 'react-router-dom'
import { answerLocal } from '../domain/analysis'
import { CREW } from '../domain/crew'
import { formatMission } from '../domain/format'
import { useLocale } from '../i18n'
import { useApp } from '../state/store'
import { AppointmentDesk, type VisitRow } from '../components/mission/AppointmentDesk'
import { SharedCareSummaries } from '../components/quiron/SharedCareSummaries'
import { systemText } from '../systemText'
import { useMissionWorkspace } from './role/useMissionWorkspace'
import '../platform/role-dash.css'

export function MedicalPage() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { state, dispatch } = useApp()
  const { missionId, profile, detail, appointments, appointmentsLoading, appointmentsError, loading, error, refresh, role } = useMissionWorkspace()
  const crew = CREW.find((item) => item.id === state.selectedCrewId)
  const openEpisodes = state.episodes.filter((item) => item.status !== 'closed')
  const episode =
    state.episodes.find((item) => item.id === state.selectedEpisodeId && item.crewId === state.selectedCrewId)
    ?? openEpisodes.find((item) => item.crewId === state.selectedCrewId)
    ?? openEpisodes[0]
    ?? null
  const summary = episode ? answerLocal(state, episode.id, en ? 'Summary for the specialist.' : 'Resumen para el especialista.') : null
  const recentAnalyses = [...state.analyses]
    .filter((item) => !episode || item.episodeId === episode.id)
    .reverse()
    .slice(0, 3)

  return (
    <div className="med-page">
      <header className="med-head">
        <p className="kicker">{en ? 'Medical team' : 'Equipo médico'}</p>
        <h1>{en ? 'Analysis and medical appointments' : 'Análisis y citas médicas'}</h1>
        <p className="lede">
          {en
            ? 'Review open cases with Quirón, then schedule or complete visits with mission doctors. This is not the Earth-link message queue.'
            : 'Revisá casos abiertos con Quirón y agendá o completá visitas con los médicos de la misión. Esto no es la cola de mensajes con Tierra.'}
        </p>
      </header>

      <section className="med-panel" aria-labelledby="med-cases">
        <div className="spread" style={{ alignItems: 'flex-start', gap: 16, marginBottom: 12 }}>
          <div>
            <h2 id="med-cases" style={{ margin: 0 }}>
              <Stethoscope size={28} strokeWidth={1.75} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 10 }} />
              {en ? 'Case analysis' : 'Análisis del caso'}
            </h2>
            <p className="muted" style={{ margin: '10px 0 0' }}>
              {en
                ? 'Pick a person and open episode, read the local summary, then run a full Quirón analysis when you need more depth.'
                : 'Elegí persona y episodio abierto, leé el resumen local y corré un análisis completo con Quirón cuando haga falta más profundidad.'}
            </p>
          </div>
          <Link className="med-save" to="/app/analisis" data-testid="open-analysis">
            <Brain size={18} strokeWidth={1.75} aria-hidden="true" />
            {en ? 'Open Quirón analysis' : 'Abrir análisis Quirón'}
          </Link>
        </div>

        <label className="field" htmlFor="med-case">
          {en ? 'Person and case' : 'Persona y caso'}
          <select
            id="med-case"
            data-testid="med-case"
            value={episode?.id ?? ''}
            onChange={(event) => {
              const next = state.episodes.find((item) => item.id === event.target.value)
              if (!next) return
              dispatch({ type: 'selectCrew', crewId: next.crewId })
              dispatch({ type: 'selectEpisode', episodeId: next.id })
            }}
          >
            {!episode ? <option value="">{en ? 'No open case' : 'Sin caso abierto'}</option> : null}
            {state.episodes.map((item) => (
              <option key={item.id} value={item.id}>
                {CREW.find((person) => person.id === item.crewId)?.name} · {systemText(item.title, lang)}
              </option>
            ))}
          </select>
        </label>

        {episode && crew ? (
          <div className="med-case-card" data-testid="med-case-card">
            <p className="med-case-name">{crew.name}</p>
            <p>{systemText(episode.title, lang)}</p>
            <p className="muted">
              {en ? 'Opened' : 'Abierto'} · {formatMission(episode.openedAt)} · {episode.status}
            </p>
            {summary ? (
              <div className="med-summary" data-testid="med-local-summary">
                <strong>{en ? 'Local summary for the doctor' : 'Resumen local para el médico'}</strong>
                <p>{systemText(summary.summary, lang)}</p>
              </div>
            ) : (
              <p className="muted">{en ? 'No local summary for this case yet.' : 'Todavía no hay resumen local para este caso.'}</p>
            )}
            {recentAnalyses.length ? (
              <ul className="med-analysis-list">
                {recentAnalyses.map((item) => (
                  <li key={item.id}>
                    {formatMission(item.createdAt)} · {item.source === 'model' ? (en ? 'Quirón AI' : 'IA Quirón') : (en ? 'Local engine' : 'Motor local')}
                    {item.result?.summary ? ` — ${systemText(item.result.summary, lang).slice(0, 140)}` : ''}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="med-actions">
              <Link className="med-copy" to="/app/analisis" state={{ alertId: undefined }}>
                <Brain size={18} strokeWidth={1.75} aria-hidden="true" />
                {en ? 'Analyze this case' : 'Analizar este caso'}
              </Link>
              <Link className="med-copy" to="/app/historial">
                {en ? 'Open history' : 'Ver historial'}
              </Link>
            </div>
          </div>
        ) : (
          <p className="muted" data-testid="med-no-case">
            {en ? 'There is no health episode selected. Open Analysis after an alert or symptom creates a case.' : 'No hay un episodio de salud seleccionado. Abrí Análisis después de que una alerta o síntoma cree un caso.'}
          </p>
        )}
      </section>

      <section className="med-panel med-appointments" aria-labelledby="med-appts">
        <h2 id="med-appts">
          <CalendarDays size={28} strokeWidth={1.75} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 10 }} />
          {en ? 'Doctor appointments' : 'Citas con médicos'}
        </h2>
        <p className="muted">
          {en
            ? 'Request, confirm, reschedule, or complete medical visits with authorized mission physicians. Sharing still needs the person’s permission.'
            : 'Pedí, confirmá, reprogramá o completá visitas médicas con médicos autorizados de la misión. Compartir sigue necesitando permiso de la persona.'}
        </p>
        {error ? (
          <div className="callout callout-amber" role="alert">
            <p>{systemText(error, lang)}</p>
            <button type="button" className="rd-btn ghost" disabled={loading} onClick={() => void refresh()}>
              {en ? 'Retry loading medical workspace' : 'Reintentar carga médica'}
            </button>
          </div>
        ) : null}
        {loading ? <p className="muted">{en ? 'Loading appointments…' : 'Cargando citas…'}</p> : null}
        {missionId && !error ? (
          <AppointmentDesk
            missionId={missionId}
            stage={detail?.mission.stage}
            profileId={profile?.id}
            scope={role === 'medic' ? 'assigned' : 'mine'}
            specialty="medical"
            members={detail?.members || []}
            appointments={appointments as VisitRow[]}
            appointmentsLoading={appointmentsLoading}
            loadError={appointmentsError}
            onChanged={() => refresh({ silent: true })}
          />
        ) : !missionId ? (
          <p className="muted" data-testid="med-no-mission">
            {en
              ? 'Enter an active mission to schedule doctor appointments. Demo explore still shows case analysis above.'
              : 'Entrá a una misión activa para agendar citas médicas. En demo exploratoria igual podés analizar el caso arriba.'}
          </p>
        ) : null}
      </section>

      <div className="med-rest">
        <SharedCareSummaries />
      </div>
    </div>
  )
}
