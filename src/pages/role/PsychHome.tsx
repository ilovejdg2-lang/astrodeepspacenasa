import { useMemo, useState } from 'react'
import { SharedCareSummaries } from '../../components/quiron/SharedCareSummaries'
import { Link } from 'react-router-dom'
import { useLocale } from '../../i18n'
import { profileDisplayName } from '../../platform/copy'
import { grantToSubject } from '../../platform/grants'
import { PsychArt } from '../../components/role/RoleArt'
import { AppointmentDesk, type VisitRow } from '../../components/mission/AppointmentDesk'
import { AboardCheckInBoard } from '../../components/role/AboardCheckInBoard'
import { RoleContextBar } from './RoleContextBar'
import { useMissionWorkspace } from './useMissionWorkspace'
import '../../platform/role-dash.css'

export function PsychHome() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { profile, detail, appointments, grants, loading, error, role, mode, missionId, refresh } = useMissionWorkspace()
  const [selected, setSelected] = useState<string | null>(() => sessionStorage.getItem('helios-psych-case'))

  const people = useMemo(() => {
    const members = detail?.members.filter((m) => m.status === 'active' && m.profileId !== profile?.id) ?? []
    return members.map((m) => {
      // Active Nest grants use revokedAt (not status). Crew shares symptoms/sleep with psych.
      const granted = grantToSubject(grants, m.profileId, profile?.id)
      return { id: m.profileId, label: profileDisplayName(m.profileId), granted }
    })
  }, [detail?.members, grants, profile?.id])

  const active = people.find((p) => p.id === selected) || null

  function pick(id: string) {
    setSelected(id)
    sessionStorage.setItem('helios-psych-case', id)
  }

  return (
    <div className="rd rd-psych">
      <div className="rd-bg" aria-hidden="true"><PsychArt /></div>
      <header className="rd-head">
        <p className="rd-kicker">{en ? 'Wellbeing & support' : 'Bienestar y acompañamiento'}</p>
        <h1>{en ? 'Wellbeing and support' : 'Bienestar y acompañamiento'}</h1>
        <RoleContextBar
          missionName={detail?.mission.name}
          stage={detail?.mission.stage}
          role={role}
          mode={mode}
          subject={active?.label}
        />
        <p className="rd-muted">
          {en
            ? 'This is not the medical dashboard with swapped labels. Focus on agenda, voluntary summaries, and authorized emotional follow-up.'
            : 'Esto no es el dashboard médico con etiquetas cambiadas. Priorizá agenda, resúmenes voluntarios y seguimiento emocional autorizado.'}
        </p>
      </header>

      {missionId && detail?.mission.stage === 'aboard' ? (
        <AboardCheckInBoard missionId={missionId} en={en} />
      ) : null}

      {error ? <p className="plat-error">{error}</p> : null}
      {loading ? <p className="rd-muted">{en ? 'Loading…' : 'Cargando…'}</p> : null}

      {missionId ? (
        <AppointmentDesk
          missionId={missionId}
          stage={detail?.mission.stage}
          profileId={profile?.id}
          scope="assigned"
          specialty="psychological"
          members={detail?.members || []}
          appointments={appointments as VisitRow[]}
          onChanged={() => refresh({ silent: true })}
        />
      ) : null}
      <div className="rd-actions" style={{ marginBottom: 12 }}>
        <Link className="rd-btn ghost" to="/app/mi-salud">{en ? 'My Health' : 'Mi salud'}</Link>
      </div>

      <div className="rd-layout">
        <section className="rd-card">
          <h2>{en ? 'Authorized follow-ups' : 'Seguimientos autorizados'}</h2>
          {people.length === 0 ? (
            <div className="rd-empty">
              <strong>{en ? 'No people listed' : 'Sin personas listadas'}</strong>
              <span className="rd-muted">{en ? 'No information' : 'Sin información'}</span>
            </div>
          ) : (
            <ul className="rd-list">
              {people.map((person) => (
                <li key={person.id}>
                  <button
                    type="button"
                    className={`rd-row${selected === person.id ? ' is-on' : ''}`}
                    style={{ width: '100%', border: 0, cursor: 'pointer', textAlign: 'left' }}
                    onClick={() => pick(person.id)}
                  >
                    <div>
                      <strong>{person.label}</strong>
                      <span>
                        {person.granted
                          ? (en ? 'Voluntary / granted summary' : 'Resumen voluntario / concedido')
                          : (en ? 'No information' : 'Sin información')}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <SharedCareSummaries />
      <section className="rd-card">
        <h2>{en ? 'Shared summaries panel' : 'Panel de resúmenes compartidos'}</h2>
        {!active || !active.granted ? (
          <div className="rd-empty">
            <strong>{en ? 'No information' : 'Sin información'}</strong>
            <span className="rd-muted">
              {en
                ? 'Missing records must never look like confirmed wellbeing. Full private chats stay hidden.'
                : 'La falta de registros nunca debe parecer bienestar confirmado. Los chats privados completos permanecen ocultos.'}
            </span>
          </div>
        ) : (
          <p className="rd-muted">
            {en
              ? `Authorized view for ${active.label}. Register a private follow-up without inventing emotional classifications.`
              : `Vista autorizada de ${active.label}. Registrá un seguimiento privado sin inventar clasificaciones emocionales.`}
          </p>
        )}
        <div className="rd-actions">
          <Link className="rd-btn" to="/app/mi-salud">{en ? 'Review in my health' : 'Revisar en mi salud'}</Link>
          <Link className="rd-btn ghost" to="/app/mi-salud">{en ? 'Request access' : 'Solicitar acceso'}</Link>
        </div>
      </section>
    </div>
  )
}
