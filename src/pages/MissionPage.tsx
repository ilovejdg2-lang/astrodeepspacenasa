import { Rocket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MISSION_STAGE_LABEL } from '../../shared/mission'
import type { MissionStage, PrepStatus } from '../../shared/types'
import { formatMission } from '../domain/format'
import { useLocale } from '../i18n'
import { useApp } from '../state/store'
import { systemText } from '../systemText'
import { Badge } from '../components/ui'
import './mission.css'

const STAGES: MissionStage[] = ['preembarque', 'a_bordo', 'posmision']

const STAGE_HELP: Record<MissionStage, { es: string; en: string }> = {
  preembarque: {
    es: 'Prepará salud, recursos y revisiones antes de abordar.',
    en: 'Prepare health, resources, and reviews before boarding.',
  },
  a_bordo: {
    es: 'Seguí los cambios y el apoyo mientras están a bordo.',
    en: 'Watch changes and support while the crew is aboard.',
  },
  posmision: {
    es: 'Revisá lo que quedó abierto después del regreso.',
    en: 'Review what is still open after the return.',
  },
}

const STAGE_EN: Record<MissionStage, string> = {
  preembarque: 'Pre-flight',
  a_bordo: 'On board',
  posmision: 'Post-mission',
}

export function MissionPage() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { state, dispatch } = useApp()
  const openEpisodes = state.episodes.filter((item) => item.status !== 'closed')
  const canEdit = state.role === 'medical' || state.role === 'ops'
  const counts = Object.fromEntries(
    (['propuesto', 'pendiente_revision', 'aprobado', 'disponible', 'faltante', 'cargado_verificado'] as PrepStatus[]).map((status) => [
      status,
      state.prepItems.filter((item) => item.status === status).length,
    ]),
  ) as Record<PrepStatus, number>
  const stage = state.mission.stage
  const stageName = en ? STAGE_EN[stage] : MISSION_STAGE_LABEL[stage]

  return (
    <div className="page mission-page">
      <header className="page-head">
        <div>
          <p className="kicker"><Rocket aria-hidden="true" size={16} strokeWidth={1.75} /> {en ? 'Mission' : 'Misión'}</p>
          <h1>{systemText(state.mission.name)}</h1>
          <p className="lede">{en ? STAGE_HELP[stage].en : STAGE_HELP[stage].es}</p>
        </div>
        <Badge tone="ok">{stageName}</Badge>
      </header>

      <section className="mission-data" aria-labelledby="mission-data-title">
        <h2 id="mission-data-title">{en ? 'Mission data' : 'Datos de la misión'}</h2>
        <dl className="mission-facts">
          <div>
            <dt>{en ? 'Destination' : 'Destino'}</dt>
            <dd>{systemText(state.mission.destination)}</dd>
          </div>
          <div>
            <dt>{en ? 'Duration' : 'Duración'}</dt>
            <dd>{state.mission.durationDays} {en ? 'days' : 'días'}</dd>
          </div>
          <div>
            <dt>{en ? 'Crew' : 'Tripulación'}</dt>
            <dd>{state.mission.crewCount}</dd>
          </div>
        </dl>
        <ul className="mission-activities">
          {state.mission.activities.map((activity) => (
            <li key={activity}>{systemText(activity)}</li>
          ))}
        </ul>
      </section>

      <section className="mission-stage-block">
        <h2>{en ? 'Mission stage' : 'Etapa de la misión'}</h2>
        <div className="mission-stages" role="group" aria-label={en ? 'Mission stage' : 'Etapa de la misión'}>
          {STAGES.map((item) => {
            const currentIdx = STAGES.indexOf(stage)
            const targetIdx = STAGES.indexOf(item)
            const goingBack = targetIdx < currentIdx
            return (
              <button
                key={item}
                type="button"
                className="mission-stage"
                data-testid={`stage-${item}`}
                aria-pressed={stage === item}
                disabled={!canEdit || goingBack}
                title={goingBack
                  ? (en ? 'Cannot go back to an earlier stage' : 'No se puede volver a una etapa anterior')
                  : undefined}
                onClick={() => dispatch({ type: 'setMissionStage', stage: item })}
              >
                <strong>{en ? STAGE_EN[item] : MISSION_STAGE_LABEL[item]}</strong>
                <span>{en ? STAGE_HELP[item].en : STAGE_HELP[item].es}</span>
              </button>
            )
          })}
        </div>
        <p className="mission-note">
          {canEdit
            ? (en
              ? 'Stages only move forward. History stays, and open health episodes are not closed.'
              : 'Las etapas solo avanzan. El historial se queda y los episodios de salud abiertos no se cierran.')
            : (en
              ? 'You can see the stage. Only the chief or the medic can change it.'
              : 'Podés ver la etapa. Solo la jefa o la médica pueden cambiarla.')}
        </p>
        <p className="mission-note">
          {en ? 'Updated' : 'Actualizada'} {formatMission(state.mission.stageChangedAt)} UTC
          {' · '}
          {en ? 'Open episodes' : 'Episodios abiertos'}: {openEpisodes.length}
        </p>
      </section>

      <section className="mission-prep">
        <div>
          <h2>{en ? 'Mission preparation' : 'Preparación de la misión'}</h2>
          <p>{en ? 'The checklist is what to have ready before boarding.' : 'El checklist es lo que hay que tener listo antes de abordar.'}</p>
        </div>
        <Link className="btn btn-primary" to="/app/recursos?tab=checklist">
          {en ? 'Open checklist in Resources' : 'Abrir checklist en Recursos'}
        </Link>
      </section>

      {stage === 'posmision' ? (
        <section className="mission-review" data-testid="postmission-summary">
          <h2>{en ? 'After the mission' : 'Después de la misión'}</h2>
          <p className="mission-note">
            {en
              ? 'What is still open. Recovery decisions stay with the responsible clinician.'
              : 'Lo que sigue abierto. Las decisiones de recuperación las toma quien atiende.'}
          </p>
          <dl className="quiet-metrics">
            <div className="metric"><dt>{en ? 'Open episodes' : 'Episodios abiertos'}</dt><dd>{openEpisodes.length}</dd></div>
            <div className="metric"><dt>{en ? 'Active alerts' : 'Alertas activas'}</dt><dd>{state.alerts.filter((item) => item.status !== 'closed').length}</dd></div>
            <div className="metric"><dt>{en ? 'Recorded symptoms' : 'Síntomas registrados'}</dt><dd>{state.symptoms.length}</dd></div>
            <div className="metric"><dt>{en ? 'Pending preparation' : 'Preparación pendiente'}</dt><dd>{counts.propuesto + counts.pendiente_revision + counts.faltante}</dd></div>
          </dl>
          {openEpisodes.length > 0 ? (
            <ul>
              {openEpisodes.map((item) => (
                <li key={item.id}>{systemText(item.title)}</li>
              ))}
            </ul>
          ) : (
            <p className="mission-note">{en ? 'No open episodes. The history stays.' : 'No hay episodios abiertos. El historial se conserva.'}</p>
          )}
        </section>
      ) : null}
    </div>
  )
}
