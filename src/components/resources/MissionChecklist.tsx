import { Link } from 'react-router-dom'
import { useLocale } from '../../i18n'
import { useMissionWorkspace } from '../../pages/role/useMissionWorkspace'
import { systemText } from '../../systemText'
import { MissionChecklistPanel } from './MissionChecklistPanel'

/** The single home for mission preparation and its post-deployment snapshot. */
export function MissionChecklist() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { detail, missionId, prep, percent, role, loading, error, refresh } = useMissionWorkspace()
  if (!missionId) return <section className="panel"><p>{en ? 'Select a mission to view its checklist.' : 'Seleccioná una misión para ver su checklist.'}</p><Link className="btn" to="/misiones">{en ? 'Mission hub' : 'Hub de misiones'}</Link></section>
  if (!detail) return <section className="panel" aria-live="polite">
    <p>{error ? systemText(error) : (en ? 'Loading checklist…' : 'Cargando checklist…')}</p>
    {error ? <button className="btn" type="button" onClick={() => void refresh()}>{en ? 'Retry' : 'Reintentar'}</button> : null}
  </section>

  const stage = detail.mission.stage
  const canManage = role === 'chief'
  const teamSize = detail.members.filter((member) => member.status === 'active' && member.role !== 'ops').length
  return (
    <section id="mission-checklist" aria-labelledby="mission-checklist-title" data-testid="mission-checklist">
      <div className="spread resources-checklist-head">
        <div>
          <h2 id="mission-checklist-title">{en ? 'Mission checklist' : 'Checklist de misión'}</h2>
          <p className="muted">{systemText(detail.mission.name)}</p>
        </div>
        <Link className="btn" to="/app/monitor">{en ? 'Mission monitor' : 'Monitor de misión'}</Link>
      </div>
      {error ? <p className="field-error" role="alert">{systemText(error)}</p> : null}
      {loading ? <p role="status">{en ? 'Updating checklist…' : 'Actualizando checklist…'}</p> : null}
      {canManage ? <MissionChecklistPanel
        missionId={missionId} stage={stage}
        plannedCrewCount={detail.mission.plannedCrewCount} teamSize={teamSize || 4}
        durationDays={detail.mission.durationDays} prep={prep} percent={percent}
        analysisStale={detail.mission.analysisStale}
        onChanged={() => refresh({ silent: true })}
      /> : <p className="callout">{en ? 'Read-only checklist. The mission chief manages preparation.' : 'Checklist de solo lectura. El jefe de misión gestiona la preparación.'} {percent}%</p>}
      {!canManage ? <ul className="chief-launch-done">
        {prep.map((item) => {
          const done = item.status === 'cargado_verificado'
          return (
            <li key={item.id} className={done ? 'is-done' : 'is-open'}>
              <span className="chief-launch-pill">{done ? (en ? 'Complete' : 'Completo') : (en ? 'Open' : 'Pendiente')}</span>
              <div>
                <strong>{systemText(item.title)}</strong>
                {item.qtyRequired != null ? <span>{(item.qtyAvailable ?? 0)} {en ? 'of' : 'de'} {item.qtyRequired}</span> : null}
              </div>
            </li>
          )
        })}
        {!prep.length ? <li>{en ? 'No checklist items yet.' : 'Todavía no hay elementos en el checklist.'}</li> : null}
      </ul> : null}
    </section>
  )
}
