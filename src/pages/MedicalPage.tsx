import { CalendarDays } from 'lucide-react'
import { InfoHelp } from '../components/InfoHelp'
import { useLocale } from '../i18n'
import { AppointmentDesk, type VisitRow } from '../components/mission/AppointmentDesk'
import { SharedCareSummaries } from '../components/quiron/SharedCareSummaries'
import { systemText } from '../systemText'
import { useApp } from '../state/store'
import { useWorkspaceRole } from '../platform/workspace'
import { useMissionWorkspace } from './role/useMissionWorkspace'
import '../platform/role-dash.css'

export function MedicalPage() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { state } = useApp()
  const wsRole = useWorkspaceRole()
  const { missionId, profile, detail, appointments, appointmentsLoading, appointmentsError, loading, error, refresh, role } = useMissionWorkspace()
  const effectiveRole = wsRole || (state.role === 'medical' ? 'medic' : role)
  const isPsych = effectiveRole === 'psychologist'
  const isMedic = effectiveRole === 'medic'

  const psychMemberId = detail?.members.find((m) => m.role === 'psychologist' && m.status === 'active')?.profileId
  const medicMemberId = detail?.members.find((m) => m.role === 'medic' && m.status === 'active')?.profileId
  const activeProfileId = profile?.id || (isPsych ? psychMemberId : isMedic ? medicMemberId : undefined)

  return (
    <div className="med-page">
      <header className="med-head">
        <p className="kicker">
          {isPsych
            ? (en ? 'Psychology Consultations' : 'Consultas Psicológicas')
            : isMedic
              ? (en ? 'Medical Appointments' : 'Citas Médicas')
              : (en ? 'Appointments & Schedule' : 'Citas y Horarios')}
        </p>
        <h1>
          {isPsych
            ? (en ? 'Psychological Consultations & Agenda' : 'Consultas Psicológicas y Agenda')
            : isMedic
              ? (en ? 'Medical Appointments & Care' : 'Citas Médicas y Atención')
              : (en ? 'Appointments & Consultations' : 'Citas y Consultas')}
          <InfoHelp
            title={isPsych ? 'Agenda Psicológica' : isMedic ? 'Citas Médicas y Atención' : 'Citas y Horarios'}
            enTitle={isPsych ? 'Psychology Agenda' : isMedic ? 'Medical Appointments & Care' : 'Appointments & Schedule'}
            whatIs={isPsych
              ? 'Centro de consultas psicológicas confidenciales para acompañar el bienestar mental y emocional de la tripulación en la misión.'
              : isMedic
                ? 'Centro de atención médica y clínica de la misión. Permite coordinar consultas con el médico de vuelo, gestionar visitas y dar seguimiento de salud a la tripulación.'
                : 'Centro de citas médicas y consultas de salud mental de la tripulación con el médico de vuelo y psicólogo clínico.'}
            enWhatIs={isPsych
              ? 'Confidential psychological consultation space to support the mental and emotional wellbeing of the crew during the mission.'
              : isMedic
                ? 'Mission clinical health hub to coordinate consultations with flight surgeons, manage visits, and follow up on crew care.'
                : 'Mission scheduling hub where crew members request visits with flight surgeons and psychologists and manage their care agenda.'}
            steps={isPsych || isMedic ? [
              'Revisá tus consultas asignadas en el horario semanal y en la lista de citas.',
              'Aceptá o rechazá solicitudes que estén pendientes de respuesta.',
              'Si no podés en ese horario, hacé clic en "Pedir que paciente elija nuevo horario" para que el paciente elija un turno libre.',
              'Cancelá citas activas si es necesario, o registrá el resultado clínico al concluir.',
            ] : [
              'Ve a "Pedir una cita" abajo y elegí Médico/a de vuelo o Psicólogo/a.',
              'Seleccioná la fecha: verás únicamente los horarios reales que el profesional tiene libres.',
              'Escribí el motivo de consulta (mín. 3 caracteres) y enviá la solicitud.',
              'Tu cita quedará programada. Si el profesional pide reprogramar, podés elegir un nuevo horario libre o cancelarla.',
            ]}
            enSteps={isPsych || isMedic ? [
              'Review assigned appointments in the weekly schedule and visit list.',
              'Accept or decline pending consultation requests.',
              'If unavailable at that time, click "Ask patient to reschedule" so the patient can pick an open slot.',
              'Cancel active appointments if needed, or record outcome notes upon completion.',
            ] : [
              'Go to "Request an appointment" below and choose Physician or Psychologist.',
              'Select a date: only open time slots where the professional is available are displayed.',
              'Enter the consultation reason (min. 3 characters) and submit your request.',
              'Your appointment will be scheduled. If the doctor asks to reschedule, pick another open slot or cancel directly.',
            ]}
          />
        </h1>
        <p className="lede">
          {isPsych
            ? (en
              ? 'Review assigned psychological consultations, confirm slots, and follow up on crew wellbeing.'
              : 'Revisá tus consultas psicológicas asignadas, confirmá horarios y acompañá el bienestar de la tripulación.')
            : isMedic
              ? (en
                ? 'Manage assigned medical visits, coordinate slots, and review crew clinical cases.'
                : 'Gestioná las citas médicas de la tripulación, coordiná horarios y revisá los casos clínicos.')
              : (en
                ? 'Request an appointment with mission health professionals and check your scheduled times and visit history.'
                : 'Pedí una cita con los profesionales de la misión y consultá en qué horario tenés tu cita programada e historial.')}
        </p>
      </header>

      <section className="med-panel med-appointments" aria-labelledby="med-appts">
        <h2 id="med-appts">
          <CalendarDays size={28} strokeWidth={1.75} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 10 }} />
          {isPsych
            ? (en ? 'Psychology schedule' : 'Agenda de psicología')
            : isMedic
              ? (en ? 'Medical appointments schedule' : 'Horario de citas médicas')
              : (en ? 'Appointments & Schedule' : 'Citas y Horarios')}
        </h2>
        <p className="muted">
          {isPsych
            ? (en
              ? 'Weekly consultations assigned to you by crew members.'
              : 'Consultas psicológicas semanales asignadas a vos por la tripulación.')
            : isMedic
              ? (en
                ? 'Weekly medical visits assigned to you by crew members.'
                : 'Citas médicas semanales asignadas a vos por la tripulación.')
              : (en
                ? 'Request a visit, choose an open time slot, or check when your upcoming appointment is scheduled.'
                : 'Pedí una cita, elegí tu horario o revisá en qué horario tenés tu cita programada.')}
        </p>
        {error ? (
          <div className="callout callout-amber" role="alert">
            <p>{systemText(error, lang)}</p>
            <button type="button" className="rd-btn ghost" disabled={loading} onClick={() => void refresh()}>
              {en ? 'Retry loading appointments' : 'Reintentar carga de citas'}
            </button>
          </div>
        ) : null}
        {loading ? <p className="muted">{en ? 'Loading appointments…' : 'Cargando citas…'}</p> : null}
        {missionId && !error ? (
          <AppointmentDesk
            missionId={missionId}
            stage={detail?.mission.stage}
            profileId={activeProfileId}
            scope={isMedic || isPsych ? 'assigned' : 'mine'}
            specialty={isMedic ? 'medical' : isPsych ? 'psychological' : undefined}
            members={detail?.members || []}
            appointments={appointments as VisitRow[]}
            appointmentsLoading={appointmentsLoading}
            loadError={appointmentsError}
            onChanged={() => refresh({ silent: true })}
          />
        ) : !missionId ? (
          <p className="muted" data-testid="med-no-mission">
            {en
              ? 'Enter an active mission to schedule appointments.'
              : 'Entrá a una misión activa para agendar citas.'}
          </p>
        ) : null}
      </section>

      <div className="med-rest">
        <SharedCareSummaries />
      </div>
    </div>
  )
}
