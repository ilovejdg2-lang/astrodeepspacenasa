import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Activity, Brain, BookOpen, ChevronRight, ShieldCheck, ShieldAlert, ArrowRight } from 'lucide-react'
import { SharedCareSummaries } from '../../components/quiron/SharedCareSummaries'
import { InfoHelp } from '../../components/InfoHelp'
import { useLocale } from '../../i18n'
import { profileDisplayName } from '../../platform/copy'
import { grantToSubject } from '../../platform/grants'
import { MedicArt } from '../../components/role/RoleArt'
import { AboardCheckInBoard } from '../../components/role/AboardCheckInBoard'
import { useApp } from '../../state/store'
import { filterSymptomsByRole } from '../../domain/symptoms'
import { CREW } from '../../domain/crew'
import { RoleContextBar } from './RoleContextBar'
import { useMissionWorkspace } from './useMissionWorkspace'
import '../../platform/role-dash.css'

type CaseRow = {
  id: string
  label: string
  reason: string
  granted: boolean
}

export function MedicHome() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { state } = useApp()
  const { profile, detail, grants, loading, error, role, mode, missionId } = useMissionWorkspace()

  const physicalSymptoms = useMemo(() => {
    return filterSymptomsByRole(state.symptoms, 'medic')
  }, [state.symptoms])

  const cases: CaseRow[] = useMemo(() => {
    const members = detail?.members.filter((m) => m.status === 'active' && m.profileId !== profile?.id) ?? []
    return members.map((m) => {
      const granted = grantToSubject(grants, m.profileId, profile?.id)
      return {
        id: m.profileId,
        label: profileDisplayName(m.profileId),
        reason: granted
          ? (en ? 'Authorized physical follow-up' : 'Seguimiento físico autorizado')
          : (en ? 'No grant yet' : 'Sin permiso aún'),
        granted,
      }
    })
  }, [detail?.members, grants, profile?.id, en])

  return (
    <div className="rd rd-medic">
      <div className="rd-bg" aria-hidden="true"><MedicArt /></div>
      <header className="rd-head">
        <p className="rd-kicker">{en ? 'Care & follow-up' : 'Atención y seguimiento'}</p>
        <h1>
          {en ? 'Medical care' : 'Atención médica'}
          <InfoHelp
            title="Panel del Médico de Vuelo"
            enTitle="Flight Surgeon Desk"
            whatIs="Puesto de mando clínico del médico de la misión. Centraliza el acceso rápido a consultas médicas, los expedientes con consentimiento activo y el seguimiento de síntomas físicos."
            enWhatIs="Clinical workstation for the mission flight surgeon. Centralizes quick access to medical appointments, crew records under active consent, and physical symptom tracking."
            steps={[
              'Navegá a "Citas y Consultas" para gestionar horarios y solicitudes de la tripulación.',
              'Ingresá a "Perspectivas biomédicas" para examinar el modelo 3D corporal, telemetría y agregar observaciones clínicas.',
              'Revisá los casos de la tripulación para verificar qué astronautas otorgaron consentimiento médico.',
              'Consultá "Riesgos NASA" para protocolos operacionales de mitigación en vuelo.',
            ]}
            enSteps={[
              'Navigate to "Appointments & Consultations" to manage schedules and crew requests.',
              'Open "Biomedical Insights" to examine the 3D body model, telemetry, and add clinical observations.',
              'Review crew patient cases to verify active medical consent status.',
              'Check "NASA Risks" for in-flight operational mitigation standards.',
            ]}
          />
        </h1>
        <RoleContextBar
          missionName={detail?.mission.name}
          stage={detail?.mission.stage}
          role={role}
          mode={mode}
          subject={cases[0]?.label}
        />
        <p className="rd-muted">
          {en
            ? 'Your personal health telemetry lives under “My Health”. Patient evaluation requires active medical consent.'
            : 'Tu telemetría de salud personal está en “Mi salud”. La evaluación de pacientes requiere consentimiento médico activo.'}
        </p>

        {/* 4 Clinical Quick Action Hub Cards */}
        <div className="rd-actions-grid" role="navigation" aria-label={en ? 'Medical workstation actions' : 'Acciones del puesto médico'}>
          <Link to="/app/citas" className="rd-action-card">
            <div className="rd-action-card-head">
              <CalendarDays size={20} style={{ color: 'var(--rd-accent, #ec4899)' }} aria-hidden="true" />
              <strong>{en ? 'Appointments & Consultations' : 'Citas y Consultas'}</strong>
            </div>
            <p>
              {en
                ? 'Review assigned clinical consultations, accept requests, confirm open slots, and schedule follow-ups.'
                : 'Revisá consultas asignadas, aceptá solicitudes, confirmá horarios y programá seguimientos.'}
            </p>
            <span className="rd-action-card-arrow">
              {en ? 'Open appointments' : 'Abrir citas'} <ArrowRight size={14} aria-hidden="true" />
            </span>
          </Link>

          <Link to="/app/biomedical" className="rd-action-card">
            <div className="rd-action-card-head">
              <Activity size={20} style={{ color: 'var(--rd-accent, #ec4899)' }} aria-hidden="true" />
              <strong>{en ? 'Biomedical Insights (3D Model)' : 'Perspectivas biomédicas (Modelo 3D)'}</strong>
            </div>
            <p>
              {en
                ? 'Inspect interactive 3D body pain maps, physiological telemetry, and append clinical observations.'
                : 'Inspeccioná el mapa corporal 3D interactivo, telemetría y agregá observaciones médicas.'}
            </p>
            <span className="rd-action-card-arrow">
              {en ? 'Open 3D insights' : 'Abrir modelo 3D'} <ArrowRight size={14} aria-hidden="true" />
            </span>
          </Link>

          <Link to="/app/analisis" className="rd-action-card">
            <div className="rd-action-card-head">
              <Brain size={20} style={{ color: 'var(--rd-accent, #ec4899)' }} aria-hidden="true" />
              <strong>{en ? 'Quirón AI Analysis' : 'Análisis con Quirón IA'}</strong>
            </div>
            <p>
              {en
                ? 'Comprehensive AI diagnostic assistance, trend correlation, and flight medicine evaluation.'
                : 'Asistencia diagnóstica con IA, correlación de tendencias y evaluación clínica aeroespacial.'}
            </p>
            <span className="rd-action-card-arrow">
              {en ? 'Open analysis' : 'Abrir análisis'} <ArrowRight size={14} aria-hidden="true" />
            </span>
          </Link>

          <Link to="/app/riesgos" className="rd-action-card">
            <div className="rd-action-card-head">
              <BookOpen size={20} style={{ color: 'var(--rd-accent, #ec4899)' }} aria-hidden="true" />
              <strong>{en ? 'NASA Risks & Protocols' : 'Riesgos y Protocolos NASA'}</strong>
            </div>
            <p>
              {en
                ? 'OCHMO clinical standards, space adaptation hazards, and evidence-based clinical guidelines.'
                : 'Estándares clínicos OCHMO, riesgos de microgravedad y guías de evidencia médica.'}
            </p>
            <span className="rd-action-card-arrow">
              {en ? 'Review guidelines' : 'Ver directrices'} <ArrowRight size={14} aria-hidden="true" />
            </span>
          </Link>
        </div>
      </header>

      {missionId && detail?.mission.stage === 'aboard' ? (
        <AboardCheckInBoard missionId={missionId} en={en} role="medic" />
      ) : null}

      {error ? <p className="plat-error">{error}</p> : null}
      {loading ? <p className="rd-muted">{en ? 'Loading…' : 'Cargando…'}</p> : null}

      <div className="rd-layout">
        <section className="rd-card">
          <h2>
            {en ? 'Assigned crew patients' : 'Pacientes asignados'}
            <InfoHelp
              title="Casos Clínicos y Consentimiento"
              enTitle="Clinical Cases & Consent"
              whatIs="Lista de astronautas asignados a tu supervisión médica. Muestra quién ha otorgado acceso a su telemetría y antecedentes de salud, respetando las normas éticas de privacidad de la misión."
              enWhatIs="List of astronauts assigned to your medical supervision. Indicates active consent for physiological telemetry and health follow-up under mission ethics."
              steps={[
                'Revisá el estado de consentimiento médico de cada astronauta.',
                'Para pacientes con consentimiento concedido, hacé clic en "Evaluar en Perspectivas biomédicas" para abrir su modelo 3D y telemetría.',
                'Si un astronauta aún no dio permiso, su expediente permanecerá restringido.',
              ]}
              enSteps={[
                'Check the medical consent status of each assigned crew member.',
                'For patients with active consent, click "Evaluate in Biomedical Insights" to open their 3D body model and vitals.',
                'If a crew member has not granted access, their clinical record remains private and restricted.',
              ]}
            />
          </h2>
          <p className="rd-muted" style={{ fontSize: '0.88rem' }}>
            {en
              ? 'Crew members under flight surgeon supervision. Click to evaluate consented patients in Biomedical Insights.'
              : 'Tripulantes bajo supervisión del médico de vuelo. Hacé clic para evaluar a los pacientes autorizados en Perspectivas biomédicas.'}
          </p>
          {cases.length === 0 ? (
            <div className="rd-empty">
              <strong>{en ? 'No crew members listed' : 'Sin tripulantes listados'}</strong>
              <span className="rd-muted">{en ? 'No information' : 'Sin información'}</span>
            </div>
          ) : (
            <ul className="rd-list">
              {cases.map((c) => (
                <li key={c.id}>
                  <div
                    className="rd-row"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                      flexWrap: 'wrap',
                      padding: '12px 14px',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.95rem' }}>{c.label}</strong>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: '0.84rem',
                          marginTop: 3,
                          color: c.granted ? '#4ade80' : '#f59e0b',
                        }}
                      >
                        {c.granted ? (
                          <>
                            <ShieldCheck size={14} aria-hidden="true" />
                            {en ? 'Consent granted (Physical scope)' : 'Consentimiento concedido (Alcance físico)'}
                          </>
                        ) : (
                          <>
                            <ShieldAlert size={14} aria-hidden="true" />
                            {en ? 'Access not granted (Private)' : 'Sin consentimiento (Privado)'}
                          </>
                        )}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {c.granted ? (
                        <Link
                          to="/app/biomedical"
                          className="rd-btn"
                          style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                        >
                          {en ? 'Evaluate in Biomedical Insights' : 'Evaluar en Perspectivas biomédicas'}
                          <ChevronRight size={14} aria-hidden="true" />
                        </Link>
                      ) : (
                        <Link
                          to="/app/mi-salud"
                          className="rd-btn ghost"
                          style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                        >
                          {en ? 'Request consent' : 'Solicitar consentimiento'}
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rd-card">
          <h2>
            {en ? 'Reported physical symptoms' : 'Síntomas físicos reportados'}
            <InfoHelp
              title="Síntomas Físicos Reportados"
              enTitle="Reported Physical Symptoms"
              whatIs="Registro de dolores corporales, molestias musculoesqueléticas o síntomas físicos enviados por la tripulación desde su mapa de dolor."
              enWhatIs="Log of bodily pain, musculoskeletal discomfort, and physical symptoms submitted by the crew via their body pain map."
              steps={[
                'Revisá los síntomas reportados por la tripulación con su fecha y descripción.',
                'Hacé clic en "Abrir en Perspectivas biomédicas" para visualizar la zona anatómica exacta en el modelo 3D.',
              ]}
              enSteps={[
                'Review symptoms reported by the crew with date and notes.',
                'Click "Open in Biomedical Insights" to view the exact anatomical spot on the 3D model.',
              ]}
            />
          </h2>
          <p className="rd-muted" style={{ fontSize: '0.88rem' }}>
            {en
              ? 'Physical discomfort and symptoms reported by crew members for clinical examination.'
              : 'Molestias corporales y síntomas físicos reportados por la tripulación para revisión clínica.'}
          </p>
          {physicalSymptoms.length === 0 ? (
            <div className="rd-empty">
              <strong>{en ? 'No physical symptoms reported' : 'Sin síntomas físicos reportados'}</strong>
              <span className="rd-muted">{en ? 'Crew members report physical symptoms and pain locations from My Health.' : 'Los tripulantes reportan síntomas físicos y puntos de dolor desde Mi salud.'}</span>
            </div>
          ) : (
            <ul className="rd-list">
              {physicalSymptoms.map((sym) => {
                const crewName = CREW.find((c) => c.id === sym.crewId)?.name || profileDisplayName(sym.crewId)
                return (
                  <li key={sym.id} className="rd-row" style={{ display: 'grid', gap: 6, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{crewName}</strong>
                      <span className="rd-muted" style={{ fontSize: '0.8rem' }}>{new Date(sym.reportedAt).toLocaleDateString()}</span>
                    </div>
                    <span style={{ color: '#ff7b72', fontWeight: 650, fontSize: '0.9rem' }}>
                      {sym.symptoms.map((s) => s.replace('_', ' ')).join(', ')}
                    </span>
                    {sym.note ? <p style={{ margin: 0, fontSize: '0.86rem', opacity: 0.9 }}>{sym.note}</p> : null}
                    <div style={{ marginTop: 4 }}>
                      <Link
                        to="/app/biomedical"
                        className="rd-btn ghost"
                        style={{ fontSize: '0.82rem', padding: '5px 10px', width: 'fit-content' }}
                      >
                        {en ? 'Open in Biomedical Insights (3D)' : 'Abrir en Perspectivas biomédicas (3D)'}
                      </Link>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <SharedCareSummaries />
    </div>
  )
}
