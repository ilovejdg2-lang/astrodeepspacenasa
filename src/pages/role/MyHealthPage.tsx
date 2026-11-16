import { systemText } from '../../systemText'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { HealthIndicatorsPanel } from '../../components/health/HealthIndicatorsPanel'
import { OfflineSyncBar } from '../../components/health/OfflineSyncBar'
import { PlatformIndicatorCharts } from '../../components/health/PlatformIndicatorCharts'
import { AppointmentDesk, type VisitRow } from '../../components/mission/AppointmentDesk'
import { PainMapSection } from '../../components/health/pain/PainMapSection'
import { DailyCarePanel } from '../../components/role/DailyCarePanel'
import { CrewArt } from '../../components/role/RoleArt'
import { useLocale } from '../../i18n'
import { platformApi, type HealthIndicatorReading } from '../../platform/api'
import { profileDisplayName, roleLabel } from '../../platform/copy'
import { isActiveGrant, type PlatformGrant } from '../../platform/grants'
import '../../platform/role-dash.css'
import { RoleContextBar } from './RoleContextBar'
import { useMissionWorkspace } from './useMissionWorkspace'

type GrantRow = PlatformGrant & { id: string; granteeProfileId: string; categories: string[] }
type ApptRow = VisitRow

export function MyHealthPage() {
  const { lang } = useLocale()
  const en = lang === 'en'
  useEffect(() => {
    document.title = en ? 'HELIOS · My Health' : 'HELIOS · Mi salud'
  }, [en])
  const {
    missionId,
    detail,
    role,
    mode,
    profile,
    wakeNote,
    symptoms,
    appointments,
    grants,
    loading,
    refresh,
  } = useMissionWorkspace()

  const [indicators, setIndicators] = useState<HealthIndicatorReading[]>([])
  const [urgentNote, setUrgentNote] = useState('')
  const [grantBusy, setGrantBusy] = useState(false)
  const [progressOptOut, setProgressOptOut] = useState(() => {
    try { return localStorage.getItem('helios.progress.optout') === '1' } catch { return false }
  })
  const [recordCount, setRecordCount] = useState(() => {
    try { return Number(localStorage.getItem('helios.progress.records') || '0') } catch { return 0 }
  })

  const reloadIndicators = useCallback(async () => {
    if (!missionId) return
    const data = await platformApi.listIndicators(missionId)
    setIndicators(data.items)
    try { setRecordCount(Number(localStorage.getItem('helios.progress.records') || '0')) } catch { /* ignore */ }
  }, [missionId])

  useEffect(() => {
    void reloadIndicators().catch(() => undefined)
  }, [reloadIndicators])

  const routine = useMemo(() => {
    const items: { id: string; label: string; status: 'pending' | 'done' | 'overdue' }[] = []
    const wakeDone = Boolean(wakeNote && !/incomplete|sin completar|pending/i.test(wakeNote))
    items.push({
      id: 'wake',
      label: en ? 'Post-wake check-in' : 'Chequeo después del despertar',
      status: wakeDone ? 'done' : 'pending',
    })
    items.push({
      id: 'sleep',
      label: en ? 'Rest / sleep log' : 'Descanso / sueño',
      status: indicators.some((i) => i.kind === 'sleep_hours') ? 'done' : 'pending',
    })
    const openAppts = (appointments as ApptRow[]).filter((a) => a.status === 'requested' || a.status === 'pending_confirm')
    items.push({
      id: 'appts',
      label: en ? 'Pending appointments' : 'Citas pendientes',
      status: openAppts.length ? 'overdue' : 'done',
    })
    items.push({
      id: 'follow',
      label: en ? 'Professional follow-ups / shared summaries' : 'Seguimientos / resúmenes compartidos',
      status: 'pending',
    })
    return items
  }, [wakeNote, indicators, appointments, en])

  const medicId = detail?.members.find((m) => m.role === 'medic' && m.status === 'active')?.profileId
  const psychId = detail?.members.find((m) => m.role === 'psychologist' && m.status === 'active')?.profileId
  const env = detail?.mission.environment || 'space_station'
  const activeGrants = (grants as GrantRow[]).filter(isActiveGrant)

  return (
    <div className="rd rd-crew">
      <div className="rd-bg" aria-hidden="true"><CrewArt /></div>
      <header className="rd-head">
        <p className="rd-kicker">{en ? 'Personal space' : 'Espacio personal'}</p>
        <h1>{en ? 'My Health' : 'Mi salud'}</h1>
        <RoleContextBar
          missionName={detail?.mission.name}
          stage={detail?.mission.stage}
          role={role}
          mode={mode}
          subject={profile?.displayName}
        />
        <p className="rd-muted">
          {en
            ? `Mission environment: ${env.replace('_', ' ')} · Professional workspace (${role ? roleLabel(role, true) : '—'}) stays separate from these personal records.`
            : `Entorno de misión: ${env.replace('_', ' ')} · El espacio profesional (${role ? roleLabel(role, false) : '—'}) permanece separado de estos registros personales.`}
        </p>
        <div className="rd-actions">
          <Link className="rd-btn ghost" to="/app">{en ? 'Back to workspace' : 'Volver al espacio'}</Link>
          <Link className="rd-btn ghost" to="/app/riesgos">{en ? '5 hazards & risks' : '5 peligros y riesgos'}</Link>
          <Link className="rd-btn ghost" to="/misiones/evidencia">{en ? 'Evidence' : 'Evidencia'}</Link>
        </div>
      </header>

      {loading ? <p className="rd-muted">{en ? 'Loading…' : 'Cargando…'}</p> : null}

      <OfflineSyncBar />

      <section className="rd-card">
        <h2>{en ? 'Mission routine' : 'Rutina de misión'}</h2>
        <ul className="health-mini-list">
          {routine.map((item) => (
            <li key={item.id}>
              <strong>{item.label}</strong>
              {' · '}
              {item.status === 'done' ? (en ? 'Done' : 'Hecho') : item.status === 'overdue' ? (en ? 'Pending / overdue' : 'Pendiente / vencido') : (en ? 'Pending' : 'Pendiente')}
            </li>
          ))}
        </ul>
      </section>

      {missionId && profile?.id ? (
        <PainMapSection
          en={en}
          missionId={missionId}
          profileId={profile.id}
          stage={detail?.mission.stage}
          appointments={appointments as VisitRow[]}
          onChanged={() => refresh({ silent: true })}
        />
      ) : null}

      <DailyCarePanel
        variant="hub"
        missionId={missionId}
        wakeNote={wakeNote}
        symptomCount={symptoms.length}
        appointmentCount={appointments.length}
        stage={detail?.mission.stage}
        onChanged={() => refresh({ silent: true })}
      />

      <HealthIndicatorsPanel
        missionId={missionId}
        writable={detail?.mission.stage === 'aboard'}
        onChanged={async () => {
          await reloadIndicators()
          await refresh({ silent: true })
        }}
      />

      <PlatformIndicatorCharts missionId={missionId} />

      {missionId ? (
        <AppointmentDesk
          missionId={missionId}
          stage={detail?.mission.stage}
          profileId={profile?.id}
          scope="mine"
          members={detail?.members || []}
          appointments={appointments as VisitRow[]}
          onChanged={() => refresh({ silent: true })}
        />
      ) : null}

      <section className="rd-card" data-testid="consent-demo">
        <h2>{en ? 'Act: appointments, grants & urgent help' : 'Actuar: citas, permisos y ayuda urgente'}</h2>
        <p className="rd-muted">
          {en
            ? `Judge path: Share vitals with medic → switch to Sofía (medic) → Revoke here → medic sees “Ask access”. Appointments: ${appointments.length} · Active grants: ${activeGrants.length}.`
            : `Ruta jurado: Compartir vitales con médica → cambiar a Sofía (médica) → Revocar aquí → médica ve “Pedir acceso”. Citas: ${appointments.length} · Permisos activos: ${activeGrants.length}.`}
        </p>
        <div className="rd-actions">
          <button
            type="button"
            className="rd-btn"
            disabled={!missionId || !medicId || grantBusy || detail?.mission.stage !== 'aboard'}
            onClick={() => void (async () => {
              if (!missionId || !medicId) return
              setGrantBusy(true)
              try {
                await platformApi.grant(missionId, {
                  granteeProfileId: medicId,
                  categories: ['vitals', 'symptoms', 'sleep'],
                  scopeNote: en ? 'Crew-authorized share for mission medic' : 'Compartido por el tripulante con médica de misión',
                })
                await refresh({ silent: true })
              } finally {
                setGrantBusy(false)
              }
            })()}
          >
            {en ? 'Share vitals with medic' : 'Compartir vitales con médica'}
          </button>
          <button
            type="button"
            className="rd-btn ghost"
            disabled={!missionId || !psychId || grantBusy || detail?.mission.stage !== 'aboard'}
            onClick={() => void (async () => {
              if (!missionId || !psychId) return
              setGrantBusy(true)
              try {
                await platformApi.grant(missionId, {
                  granteeProfileId: psychId,
                  categories: ['symptoms', 'sleep'],
                  scopeNote: en ? 'Crew-authorized share for psychologist' : 'Compartido por el tripulante con psicología',
                })
                await refresh({ silent: true })
              } finally {
                setGrantBusy(false)
              }
            })()}
          >
            {en ? 'Share with psychologist' : 'Compartir con psicología'}
          </button>
          <button
            type="button"
            className="rd-btn"
            style={{ background: '#b3003a', color: '#fff' }}
            disabled={!missionId || detail?.mission.stage !== 'aboard'}
            onClick={() => void (async () => {
              if (!missionId) return
              const result = await platformApi.urgent(missionId) as { limitation?: string; requested?: boolean }
              setUrgentNote(result.limitation || (en
                ? 'Urgent flow opened. Follow the versioned protocol and human contact — do not wait for a future slot alone.'
                : 'Flujo urgente abierto. Seguí el protocolo versionado y el contacto humano — no esperes solo una cita futura.'))
              window.dispatchEvent(new CustomEvent('helios:quiron-care', { detail: { topic: 'physical' } }))
              await refresh({ silent: true })
            })()}
          >
            {en ? 'Urgent help now' : 'Ayuda urgente ahora'}
          </button>
        </div>
        {urgentNote ? <p className="rd-ok" role="status">{systemText(urgentNote)}</p> : null}

        <h3 style={{ margin: '14px 0 8px', fontSize: '0.95rem' }}>
          {en ? 'Active consents (you can revoke anytime)' : 'Consentimientos activos (podés revocar cuando quieras)'}
        </h3>
        <ul className="health-mini-list">
          {activeGrants.slice(0, 8).map((g) => (
            <li key={g.id}>
              <strong>{profileDisplayName(g.granteeProfileId)}</strong>
              {' · '}
              {(g.categories || []).join(', ') || (en ? 'categories n/a' : 'sin categorías')}
              {g.scopeNote ? <span className="rd-muted"> — {g.scopeNote}</span> : null}
              <button
                type="button"
                className="rd-btn ghost"
                style={{ marginLeft: 8 }}
                data-testid={`revoke-grant-${g.id}`}
                onClick={() => void platformApi.revokeGrant(g.id).then(() => refresh({ silent: true }))}
              >
                {en ? 'Revoke now' : 'Revocar ahora'}
              </button>
            </li>
          ))}
          {activeGrants.length === 0 ? (
            <li className="rd-muted">
              {en
                ? 'No active shares. Medic and psychologist cannot read your indicators until you grant.'
                : 'Sin compartidos activos. Médica y psicología no pueden leer tus indicadores hasta que concedás.'}
            </li>
          ) : null}
        </ul>
      </section>

      <section className="rd-card">
        <h2>{en ? 'Responsible progress (optional)' : 'Progreso responsable (opcional)'}</h2>
        <label className="rd-field" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={progressOptOut}
            onChange={(e) => {
              const next = e.target.checked
              setProgressOptOut(next)
              try { localStorage.setItem('helios.progress.optout', next ? '1' : '0') } catch { /* ignore */ }
            }}
          />
          {en ? 'Disable progress cues' : 'Desactivar señales de progreso'}
        </label>
        {!progressOptOut ? (
          <p>{en ? `Indicators logged (local cue): ${recordCount}` : `Indicadores registrados (señal local): ${recordCount}`}</p>
        ) : null}
      </section>
    </div>
  )
}
