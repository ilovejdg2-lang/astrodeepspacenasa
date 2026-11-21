import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Activity, BookOpen, ChevronRight, ShieldCheck, ShieldAlert, ArrowRight } from 'lucide-react'
import { SharedCareSummaries } from '../../components/quiron/SharedCareSummaries'
import { InfoHelp } from '../../components/InfoHelp'
import { useLocale } from '../../i18n'
import { profileDisplayName } from '../../platform/copy'
import { grantToSubject } from '../../platform/grants'
import { PsychArt } from '../../components/role/RoleArt'
import { AboardCheckInBoard } from '../../components/role/AboardCheckInBoard'
import { useApp } from '../../state/store'
import { filterSymptomsByRole } from '../../domain/symptoms'
import { CREW } from '../../domain/crew'
import { RoleContextBar } from './RoleContextBar'
import { useMissionWorkspace } from './useMissionWorkspace'
import '../../platform/role-dash.css'

type PersonRow = {
  id: string
  label: string
  granted: boolean
}

export function PsychHome() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { state } = useApp()
  const { profile, detail, grants, loading, error, role, mode, missionId } = useMissionWorkspace()

  const mentalSymptoms = useMemo(() => {
    return filterSymptomsByRole(state.symptoms, 'psychologist')
  }, [state.symptoms])

  const people: PersonRow[] = useMemo(() => {
    const members = detail?.members.filter((m) => m.status === 'active' && m.profileId !== profile?.id) ?? []
    return members.map((m) => {
      const granted = grantToSubject(grants, m.profileId, profile?.id)
      return {
        id: m.profileId,
        label: profileDisplayName(m.profileId),
        granted,
      }
    })
  }, [detail?.members, grants, profile?.id])

  return (
    <div className="rd rd-psych">
      <div className="rd-bg" aria-hidden="true"><PsychArt /></div>
      <header className="rd-head">
        <p className="rd-kicker">{en ? 'Crew wellbeing' : 'Bienestar de la tripulación'}</p>
        <h1>
          {en ? 'Psychological consultations' : 'Consultas psicológicas'}
          <InfoHelp
            title="Panel de Psicología y Bienestar"
            enTitle="Psychology & Wellbeing Desk"
            whatIs="Puesto de supervisión psicológica de la misión. Centraliza el acceso rápido a consultas de salud mental, telemetría de sueño y fatiga cognitiva de la tripulación autorizada."
            enWhatIs="Psychological supervision workstation for the mission. Centralizes quick access to mental health consultations, sleep telemetry, and cognitive fatigue monitoring."
            steps={[
              'Navegá a "Consultas y Agenda" para gestionar horarios y turnos de acompañamiento.',
              'Ingresá a "Perspectivas biomédicas" para revisar métricas de sueño, recuperación y descanso.',
              'Ejecutá "Análisis con Quirón" para evaluaciones asistidas por IA de fatiga y estrés.',
              'Consultá "Directrices de conducta NASA" para protocolos de soporte psicológico en aislamiento extremo.',
            ]}
            enSteps={[
              'Navigate to "Consultations & Schedule" to manage slots and appointment requests.',
              'Open "Biomedical Insights" to review sleep cycles, recovery telemetry, and cognitive rest.',
              'Launch "Quirón AI Analysis" for fatigue, mood, and stress assessments.',
              'Check "NASA Behavioral Guidelines" for operational psychological support in extreme ICE habitats.',
            ]}
          />
        </h1>
        <RoleContextBar
          missionName={detail?.mission.name}
          stage={detail?.mission.stage}
          role={role}
          mode={mode}
          subject={people[0]?.label}
        />
        <p className="rd-muted">
          {en
            ? 'Personal wellbeing check-ins live under “My Health”. Crew psychological evaluation requires active behavioral consent.'
            : 'Tus chequeos personales están en “Mi salud”. La evaluación de la tripulación requiere consentimiento conductual activo.'}
        </p>

        {/* 4 Psychological Quick Action Hub Cards */}
        <div className="rd-actions-grid" role="navigation" aria-label={en ? 'Psychology workstation actions' : 'Acciones del puesto de psicología'}>
          <Link to="/app/citas" className="rd-action-card">
            <div className="rd-action-card-head">
              <CalendarDays size={20} style={{ color: 'var(--rd-accent, #ec4899)' }} aria-hidden="true" />
              <strong>{en ? 'Consultations & Schedule' : 'Consultas y Agenda'}</strong>
            </div>
            <p>
              {en
                ? 'Review assigned psychological consultations, accept requests, confirm open slots, and manage follow-ups.'
                : 'Revisá consultas asignadas, aceptá solicitudes, confirmá turnos y gestioná seguimientos.'}
            </p>
            <span className="rd-action-card-arrow">
              {en ? 'Open schedule' : 'Abrir agenda'} <ArrowRight size={14} aria-hidden="true" />
            </span>
          </Link>

          <Link to="/app/biomedical" className="rd-action-card">
            <div className="rd-action-card-head">
              <Activity size={20} style={{ color: 'var(--rd-accent, #ec4899)' }} aria-hidden="true" />
              <strong>{en ? 'Biomedical Insights (Sleep & Recovery)' : 'Perspectivas biomédicas (Sueño y Descanso)'}</strong>
            </div>
            <p>
              {en
                ? 'Monitor circadian rhythms, sleep debt, recovery indicators, and emotional wellbeing telemetries.'
                : 'Monitoreá ciclos circadianos, deuda de sueño, recuperación y bienestar emocional.'}
            </p>
            <span className="rd-action-card-arrow">
              {en ? 'Open sleep telemetry' : 'Ver telemetría de sueño'} <ArrowRight size={14} aria-hidden="true" />
            </span>
          </Link>

          <Link to="/app/riesgos" className="rd-action-card">
            <div className="rd-action-card-head">
              <BookOpen size={20} style={{ color: 'var(--rd-accent, #ec4899)' }} aria-hidden="true" />
              <strong>{en ? 'NASA Behavioral Guidelines' : 'Directrices de Conducta NASA'}</strong>
            </div>
            <p>
              {en
                ? 'NASA HRP Behavioral Health & Performance evidence, ICE habitat guidelines, and OCHMO standards.'
                : 'Evidencia NASA HRP en salud conductual, guías para hábitats extremos y estándares OCHMO.'}
            </p>
            <span className="rd-action-card-arrow">
              {en ? 'Review guidelines' : 'Ver directrices'} <ArrowRight size={14} aria-hidden="true" />
            </span>
          </Link>
        </div>
      </header>

      {missionId && detail?.mission.stage === 'aboard' ? (
        <AboardCheckInBoard missionId={missionId} en={en} role="psychologist" />
      ) : null}

      {error ? <p className="plat-error">{error}</p> : null}
      {loading ? <p className="rd-muted">{en ? 'Loading…' : 'Cargando…'}</p> : null}

      <div className="rd-layout">
        <section className="rd-card">
          <h2>
            {en ? 'Authorized patients' : 'Pacientes autorizados'}
            <InfoHelp
              title="Pacientes Autorizados en Psicología"
              enTitle="Authorized Psychology Patients"
              whatIs="Lista de astronautas con consentimiento activo para consulta y seguimiento de bienestar emocional y descanso con el psicólogo de la misión."
              enWhatIs="Crew members with active consent for confidential psychological follow-up, emotional wellness, and sleep telemetry."
              steps={[
                'Verificá el estado de consentimiento conductual de cada astronauta.',
                'Para pacientes autorizados, hacé clic en "Evaluar sueño" para inspeccionar métricas en Perspectivas biomédicas.',
                'Hacé clic en "Análisis conductual" para ejecutar evaluaciones cognitivas en Quirón.',
              ]}
              enSteps={[
                'Check behavioral consent status for each crew member.',
                'For authorized patients, click "Evaluate sleep" to view telemetry in Biomedical Insights.',
                'Click "Behavioral analysis" to launch cognitive assessments in Quirón Analysis.',
              ]}
            />
          </h2>
          <p className="rd-muted" style={{ fontSize: '0.88rem' }}>
            {en
              ? 'Crew members with active behavioral consent for psychology consultation and symptom review.'
              : 'Tripulantes con consentimiento activo para consulta y revisión de síntomas en psicología.'}
          </p>
          {people.length === 0 ? (
            <div className="rd-empty">
              <strong>{en ? 'No people listed' : 'Sin personas listadas'}</strong>
              <span className="rd-muted">{en ? 'No information' : 'Sin información'}</span>
            </div>
          ) : (
            <ul className="rd-list">
              {people.map((person) => (
                <li key={person.id}>
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
                      <strong style={{ fontSize: '0.95rem' }}>{person.label}</strong>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: '0.84rem',
                          marginTop: 3,
                          color: person.granted ? '#4ade80' : '#f59e0b',
                        }}
                      >
                        {person.granted ? (
                          <>
                            <ShieldCheck size={14} aria-hidden="true" />
                            {en ? 'Consent granted (Behavioral scope)' : 'Consentimiento concedido (Alcance psicológico)'}
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
                      {person.granted ? (
                        <Link
                          to="/app/biomedical"
                          className="rd-btn"
                          style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                        >
                          {en ? 'Evaluate sleep' : 'Evaluar descanso'}
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
            {en ? 'Shared mental health symptoms' : 'Síntomas de bienestar compartidos'}
            <InfoHelp
              title="Síntomas de Bienestar Compartidos"
              enTitle="Shared Wellbeing Symptoms"
              whatIs="Reportes voluntarios de fatiga mental, estrés y descanso compartidos de forma estrictamente confidencial con psicología."
              enWhatIs="Voluntary check-ins covering stress, mental fatigue, and sleep shared strictly in confidence with psychology."
              steps={[
                'Revisá los reportes compartidos por la tripulación para detectar fatiga o sobrecarga.',
                'Utilizá "Análisis conductual" para correlacionar con cargas de trabajo de la misión.',
              ]}
              enSteps={[
                'Review crew check-ins to monitor fatigue and emotional strain.',
                'Use "Behavioral analysis" to correlate findings with mission workload.',
              ]}
            />
          </h2>
          <p className="rd-muted" style={{ fontSize: '0.88rem' }}>
            {en
              ? 'Fatigue, cognitive strain, and emotional check-ins shared by crew members.'
              : 'Chequeos de fatiga, tensión cognitiva y descanso compartidos por los tripulantes.'}
          </p>
          {mentalSymptoms.length === 0 ? (
            <div className="rd-empty">
              <strong>{en ? 'No mental health symptoms reported' : 'Sin síntomas de bienestar reportados'}</strong>
              <span className="rd-muted">{en ? 'Crew members can share sleep, fatigue, and mood check-ins from My space.' : 'Los tripulantes pueden compartir chequeos de sueño, fatiga y ánimo desde Mi espacio.'}</span>
            </div>
          ) : (
            <ul className="rd-list">
              {mentalSymptoms.map((sym) => {
                const crewName = CREW.find((c) => c.id === sym.crewId)?.name || profileDisplayName(sym.crewId)
                return (
                  <li key={sym.id} className="rd-row" style={{ display: 'grid', gap: 6, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{crewName}</strong>
                      <span className="rd-muted" style={{ fontSize: '0.8rem' }}>{new Date(sym.reportedAt).toLocaleDateString()}</span>
                    </div>
                    <span style={{ color: 'var(--accent, #7c3aed)', fontWeight: 650, fontSize: '0.9rem' }}>
                      {sym.symptoms.map((s) => s.replace('_', ' ')).join(', ')}
                    </span>
                    {sym.note ? <p style={{ margin: 0, fontSize: '0.86rem', opacity: 0.9 }}>{sym.note}</p> : null}
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
