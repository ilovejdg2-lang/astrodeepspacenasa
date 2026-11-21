import { systemText } from '../../systemText'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ArrowRight, CalendarDays, ShieldCheck } from 'lucide-react'
import { InfoHelp } from '../../components/InfoHelp'
import { OfflineSyncBar } from '../../components/health/OfflineSyncBar'
import { PainMapSection } from '../../components/health/pain/PainMapSection'
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
    grants,
    loading,
    refresh,
  } = useMissionWorkspace()

  const [urgentNote, setUrgentNote] = useState('')
  const [grantBusy, setGrantBusy] = useState(false)

  const medicId = detail?.members.find((m) => m.role === 'medic' && m.status === 'active')?.profileId
  const psychId = detail?.members.find((m) => m.role === 'psychologist' && m.status === 'active')?.profileId
  const activeGrants = (grants as GrantRow[]).filter(isActiveGrant)
  const upcomingCount = (appointments as Array<{ scheduledAt?: number; status?: string }> || [])
    .filter((a) => a.scheduledAt && a.status !== 'cancelled' && a.status !== 'completed').length

  const userDisplayName = profile?.displayName || profileDisplayName(profile?.id || 'crew')

  return (
    <div className="rd rd-crew">
      <div className="rd-bg" aria-hidden="true"><CrewArt /></div>
      <header className="rd-head">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <p className="rd-kicker" style={{ margin: 0 }}>{en ? 'Confidential personal space' : 'Espacio personal confidencial'}</p>
          <span className="badge" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', border: '1px solid rgba(236, 72, 153, 0.35)', padding: '4px 10px', borderRadius: 999 }}>
            {userDisplayName}
          </span>
        </div>
        <h1>
          {en ? 'My Health & Body Map' : 'Mi salud y mapa corporal'}
          <InfoHelp
            title="Mi Salud Confidencial"
            enTitle="Personal Health Space"
            whatIs="Tu espacio médico y clínico personal como tripulante. Aquí gestionás tus citas médicas y de psicología, reportás dolores físicos en el mapa corporal y decidís qué datos compartís con los profesionales de la salud."
            enWhatIs="Your personal medical and clinical dashboard as a crew member. Book visits with doctors and psychologists, report pain points on your body map, and control what data you share."
            steps={[
              'Hacé clic en "Ir a Citas" para solicitar una consulta médica o psicológica en los horarios disponibles.',
              'En "Registrar dolor", marcá en el mapa 3D las zonas del cuerpo donde sentís molestias y su intensidad para revisión del médico.',
              'Completá tu chequeo diario de descanso y estado anímico en "Chequeo del día".',
              'En "Privacidad de datos y consentimiento", autorizá o revocá qué profesionales pueden acceder a tu información.',
            ]}
            enSteps={[
              'Click "Go to Appointments" to book a medical or psychological consultation in open time slots.',
              'Under "Record pain", mark anatomical pain points on the 3D body editor for your flight surgeon.',
              'Submit your daily rest and wellbeing log in "Daily Check-in".',
              'Under "Data Privacy & Clinical Consent", manage and revoke which clinicians can access your records.',
            ]}
          />
        </h1>
        <p className="rd-muted">
          {en
            ? 'Private clinical records, body pain editor, and secure access permissions for your spaceflight mission.'
            : 'Registro clínico privado, editor de dolor corporal y control de permisos de acceso para tu misión espacial.'}
        </p>
      </header>

      {loading ? <p className="rd-muted">{en ? 'Loading…' : 'Cargando…'}</p> : null}

      <OfflineSyncBar />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <section
          className="rd-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 12,
            border: '1px solid color-mix(in srgb, #2563eb 25%, var(--line))',
            background: 'var(--surface)',
            borderRadius: 16,
            padding: 20,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <CalendarDays size={20} strokeWidth={2} style={{ color: '#2563eb' }} aria-hidden="true" />
              <p className="rd-kicker" style={{ margin: 0, color: '#2563eb' }}>
                {en ? 'Medical & Psychological Care' : 'Atención médica y psicológica'}
              </p>
            </div>
            <h2 style={{ margin: '4px 0 6px' }}>{en ? 'Appointments & Consultations' : 'Citas y Consultas'}</h2>
            <p className="rd-muted" style={{ margin: 0, fontSize: '0.9rem' }}>
              {en
                ? 'Check available open UTC slots, book visits with the flight surgeon or mission psychologist, or review your schedule.'
                : 'Revisá los horarios UTC libres, agendá consultas con el médico de vuelo o psicólogo y consultá tu agenda programada.'}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            <Link
              to="/app/citas"
              className="rd-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 18px',
                textDecoration: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 650,
                borderRadius: 10,
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              }}
            >
              <CalendarDays size={16} aria-hidden="true" />
              <span>{en ? 'Go to Appointments' : 'Ir a Citas'}</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
            {upcomingCount > 0 ? (
              <span style={{ fontSize: '0.82rem', color: '#2563eb', textAlign: 'center', fontWeight: 600 }}>
                {en ? `● ${upcomingCount} upcoming appointment(s)` : `● ${upcomingCount} cita(s) próxima(s) agendada(s)`}
              </span>
            ) : null}
          </div>
        </section>

        <section
          className="rd-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 12,
            border: '1px solid color-mix(in srgb, #0d9488 25%, var(--line))',
            background: 'var(--surface)',
            borderRadius: 16,
            padding: 20,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Activity size={20} strokeWidth={2} style={{ color: '#0d9488' }} aria-hidden="true" />
              <p className="rd-kicker" style={{ margin: 0, color: '#0d9488' }}>{en ? 'Physiological Telemetry' : 'Telemetría fisiológica'}</p>
            </div>
            <h2 style={{ margin: '4px 0 6px' }}>{en ? 'Biomedical Insights' : 'Perspectivas biomédicas'}</h2>
            <p className="rd-muted" style={{ margin: 0, fontSize: '0.9rem' }}>
              {en
                ? 'Explore your 3D interactive anatomical systems, heart rate, sleep quality, respiration, and NASA spaceflight hazards.'
                : 'Explorá tus sistemas anatómicos interactivos 3D, pulso cardíaco, calidad del descanso, respiración y riesgos de la NASA.'}
            </p>
          </div>
          <div style={{ marginTop: 8 }}>
            <Link
              to="/app/biomedical"
              className="rd-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 18px',
                textDecoration: 'none',
                width: '100%',
                borderRadius: 10,
                background: '#0d9488',
                color: '#ffffff',
                fontWeight: 650,
                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)',
              }}
            >
              <Activity size={16} aria-hidden="true" />
              <span>{en ? 'Open Biomedical Insights' : 'Abrir perspectivas biomédicas'}</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>

      <PainMapSection
        en={en}
        missionId={missionId || 'mission-primary'}
        profileId={profile?.id || 'mateo-ruiz'}
        stage={detail?.mission.stage}
        appointments={appointments as any}
        onChanged={() => refresh({ silent: true })}
      />

      <DailyCarePanel
        missionId={missionId}
        wakeNote={wakeNote}
        symptomCount={symptoms.length}
        stage={detail?.mission.stage}
        onChanged={() => refresh({ silent: true })}
      />

      <section className="rd-card" data-testid="consent-demo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <ShieldCheck size={22} style={{ color: '#38bdf8' }} aria-hidden="true" />
          <h2 style={{ margin: 0 }}>{en ? 'Data Privacy & Clinical Consent' : 'Privacidad de datos y consentimiento clínico'}</h2>
        </div>
        <p className="rd-muted">
          {en
            ? `Your biomedical telemetry, pain logs, and mental wellbeing check-ins are protected under strict aerospace medical ethics. Flight surgeons and psychologists can only review information you explicitly authorize. Active consents: ${activeGrants.length}.`
            : `Tus signos biomédicos, registros de dolor y chequeos de bienestar están protegidos bajo estricto secreto médico espacial. Los médicos y psicólogos solo pueden acceder a la información que autorices explícitamente. Consentimientos activos: ${activeGrants.length}.`}
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
