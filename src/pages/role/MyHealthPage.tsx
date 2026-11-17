import { systemText } from '../../systemText'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ArrowRight } from 'lucide-react'
import { OfflineSyncBar } from '../../components/health/OfflineSyncBar'
import { AppointmentDesk, type VisitRow } from '../../components/mission/AppointmentDesk'
import { DailyCarePanel } from '../../components/role/DailyCarePanel'
import { CrewArt } from '../../components/role/RoleArt'
import { useLocale } from '../../i18n'
import { platformApi } from '../../platform/api'
import { profileDisplayName } from '../../platform/copy'
import { isActiveGrant, type PlatformGrant } from '../../platform/grants'
import '../../platform/role-dash.css'
import { useMissionWorkspace } from './useMissionWorkspace'

type GrantRow = PlatformGrant & { id: string; granteeProfileId: string; categories: string[] }

export function MyHealthPage() {
  const { lang } = useLocale()
  const en = lang === 'en'
  useEffect(() => {
    document.title = en ? 'HELIOS · My Health' : 'HELIOS · Mi salud'
  }, [en])
  const {
    missionId,
    detail,
    profile,
    wakeNote,
    symptoms,
    appointments,
    appointmentsLoading,
    appointmentsError,
    error,
    grants,
    loading,
    refresh,
  } = useMissionWorkspace()

  const [urgentNote, setUrgentNote] = useState('')
  const [grantBusy, setGrantBusy] = useState(false)

  const medicId = detail?.members.find((m) => m.role === 'medic' && m.status === 'active')?.profileId
  const psychId = detail?.members.find((m) => m.role === 'psychologist' && m.status === 'active')?.profileId
  const activeGrants = (grants as GrantRow[]).filter(isActiveGrant)

  return (
    <div className="rd rd-crew">
      <div className="rd-bg" aria-hidden="true"><CrewArt /></div>
      <header className="rd-head">
        <p className="rd-kicker">{en ? 'Personal space' : 'Espacio personal'}</p>
        <h1>{en ? 'My Health' : 'Mi salud'}</h1>
      </header>

      {loading ? <p className="rd-muted">{en ? 'Loading…' : 'Cargando…'}</p> : null}

      <OfflineSyncBar />

      {missionId ? (
        <AppointmentDesk
          missionId={missionId}
          stage={detail?.mission.stage}
          profileId={profile?.id}
          scope="mine"
          members={detail?.members || []}
          appointments={appointments as VisitRow[]}
          appointmentsLoading={appointmentsLoading}
          loadError={appointmentsError || error}
          onChanged={() => refresh({ silent: true })}
        />
      ) : null}

      <section className="rd-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid rgba(255, 77, 106, 0.28)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ maxWidth: 620 }}>
            <p className="rd-kicker" style={{ margin: 0 }}>{en ? 'Biomedical Telemetry & Body Systems' : 'Telemetría biomédica y sistemas corporales'}</p>
            <h2 style={{ margin: '4px 0 6px' }}>{en ? 'Biomedical Insights' : 'Perspectivas biomédicas'}</h2>
            <p className="rd-muted" style={{ margin: 0 }}>
              {en
                ? 'Explore your 3D interactive body map, physiological indicators (cardiovascular, respiratory, sleep, musculoskeletal, metabolism), NASA spaceflight hazard context, and trends in the dedicated module.'
                : 'Explorá tu mapa corporal interactivo 3D, indicadores fisiológicos (cardiovascular, respiratorio, sueño, musculoesquelético, metabolismo), riesgos espaciales de la NASA y tendencias en el módulo dedicado.'}
            </p>
          </div>
          <Link
            to="/app/biomedical"
            className="rd-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', textDecoration: 'none' }}
          >
            <Activity size={16} aria-hidden="true" />
            <span>{en ? 'Open Biomedical Insights' : 'Abrir perspectivas biomédicas'}</span>
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <DailyCarePanel
        missionId={missionId}
        wakeNote={wakeNote}
        symptomCount={symptoms.length}
        stage={detail?.mission.stage}
        onChanged={() => refresh({ silent: true })}
      />

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

    </div>
  )
}
