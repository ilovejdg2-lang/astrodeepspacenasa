// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppointmentDesk, type VisitRow } from './AppointmentDesk'
import { platformApi } from '../../platform/api'

vi.mock('../../i18n', () => ({
  useLocale: () => ({ lang: 'en' }),
}))

vi.mock('../../platform/api', () => ({
  platformApi: {
    confirmAppointment: vi.fn(),
    rescheduleAppointment: vi.fn(),
    requestPatientReschedule: vi.fn(),
    cancelAppointment: vi.fn(),
    completeAppointment: vi.fn(),
    slots: vi.fn(),
    requestAppointment: vi.fn(),
  },
}))

describe('AppointmentDesk weekly schedule', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-16T08:00:00.000Z'))
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('shows assigned visits in the professional week and can navigate weeks', () => {
    const appointments: VisitRow[] = [{
      id: 'medical-visit',
      requesterId: 'mateo-ruiz',
      professionalId: 'sofia-chen',
      specialty: 'medical',
      status: 'confirmed',
      scheduledAt: Date.UTC(2026, 10, 17, 10),
      durationMin: 30,
    }]

    render(
      <AppointmentDesk
        missionId="mission-1"
        stage="aboard"
        profileId="sofia-chen"
        scope="assigned"
        specialty="medical"
        members={[]}
        appointments={appointments}
        onChanged={vi.fn()}
      />,
    )

    expect(screen.getByText('Weekly schedule')).toBeTruthy()
    const appointmentName = screen.getByText('Mateo Ruiz')
    expect(appointmentName.closest('article')?.getAttribute('style')).toContain('height: 40px')
    expect(screen.getByText(/10:00 · Confirmed/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Next week' }))
    expect(screen.getByText('No appointments this week.')).toBeTruthy()
  })

  it('shows a load error instead of an empty-history state and lets the user retry', () => {
    const onChanged = vi.fn().mockResolvedValue(undefined)
    render(
      <MemoryRouter>
        <AppointmentDesk
          missionId="mission-1"
          stage="aboard"
          profileId="elena-torres"
          scope="mine"
          members={[]}
          appointments={[]}
          loadError="This couldn't load right now. Try again in a moment."
          onChanged={onChanged}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('alert').textContent).toContain("This couldn't load right now.")
    expect(screen.queryByText('No visits in this view')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Retry loading visits' }))
    expect(onChanged).toHaveBeenCalledOnce()
  })

  it('does not show an empty-history state while visits are loading', () => {
    render(
      <MemoryRouter>
        <AppointmentDesk
          missionId="mission-1"
          stage="aboard"
          profileId="elena-torres"
          scope="mine"
          members={[]}
          appointments={[]}
          appointmentsLoading
          onChanged={vi.fn()}
        />
      </MemoryRouter>,
    )

    expect(screen.queryByText('No visits in this view')).toBeNull()
  })

  it('links an empty mission-scoped history to the mission hub', () => {
    render(
      <MemoryRouter>
        <AppointmentDesk
          missionId="mission-1"
          stage="draft"
          profileId="elena-torres"
          scope="mine"
          members={[]}
          appointments={[]}
          onChanged={vi.fn()}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Browse missions with demo visit history' }).getAttribute('href')).toBe('/misiones')
  })

  it('allows doctor to ask patient to reschedule', async () => {
    const onChanged = vi.fn().mockResolvedValue(undefined)
    vi.mocked(platformApi.requestPatientReschedule).mockResolvedValue({ id: 'visit-1' } as any)

    const appointments: VisitRow[] = [{
      id: 'visit-1',
      requesterId: 'mateo-ruiz',
      professionalId: 'sofia-chen',
      specialty: 'medical',
      status: 'confirmed',
      scheduledAt: Date.UTC(2026, 10, 17, 10),
    }]

    render(
      <MemoryRouter>
        <AppointmentDesk
          missionId="mission-1"
          stage="aboard"
          profileId="sofia-chen"
          scope="assigned"
          specialty="medical"
          members={[]}
          appointments={appointments}
          onChanged={onChanged}
        />
      </MemoryRouter>,
    )

    const askRescheduleBtn = screen.getByRole('button', { name: 'Ask patient to reschedule' })
    expect(askRescheduleBtn).toBeTruthy()
    fireEvent.click(askRescheduleBtn)
    expect(platformApi.requestPatientReschedule).toHaveBeenCalledWith('visit-1', expect.any(String))
  })

  it('allows doctor to cancel an active appointment', async () => {
    const onChanged = vi.fn().mockResolvedValue(undefined)
    vi.mocked(platformApi.cancelAppointment).mockResolvedValue({ id: 'visit-1' } as any)

    const appointments: VisitRow[] = [{
      id: 'visit-1',
      requesterId: 'mateo-ruiz',
      professionalId: 'sofia-chen',
      specialty: 'medical',
      status: 'confirmed',
      scheduledAt: Date.UTC(2026, 10, 17, 10),
    }]

    render(
      <MemoryRouter>
        <AppointmentDesk
          missionId="mission-1"
          stage="aboard"
          profileId="sofia-chen"
          scope="assigned"
          specialty="medical"
          members={[]}
          appointments={appointments}
          onChanged={onChanged}
        />
      </MemoryRouter>,
    )

    const cancelBtn = screen.getByRole('button', { name: 'Cancel appointment' })
    expect(cancelBtn).toBeTruthy()
    fireEvent.click(cancelBtn)
    expect(platformApi.cancelAppointment).toHaveBeenCalledWith('visit-1', expect.any(String))
  })

  it('allows patient to view reschedule notice and pick doctor open slot', async () => {
    vi.useRealTimers()
    const onChanged = vi.fn().mockResolvedValue(undefined)
    const slotTime = Date.UTC(2026, 10, 18, 14, 0)
    vi.mocked(platformApi.slots).mockResolvedValue({
      slots: [{ start: slotTime, label: '14:00 UTC' }],
    })
    vi.mocked(platformApi.rescheduleAppointment).mockResolvedValue({ id: 'visit-2' } as any)

    const appointments: VisitRow[] = [{
      id: 'visit-2',
      requesterId: 'elena-torres',
      professionalId: 'sofia-chen',
      specialty: 'medical',
      status: 'rescheduled',
      scheduledAt: Date.UTC(2026, 10, 17, 10),
    }]

    render(
      <MemoryRouter>
        <AppointmentDesk
          missionId="mission-1"
          stage="aboard"
          profileId="elena-torres"
          scope="mine"
          members={[]}
          appointments={appointments}
          onChanged={onChanged}
        />
      </MemoryRouter>,
    )

    // Reschedule banner should be displayed to the patient
    expect(screen.getByText(/Reschedule requested by professional:/i)).toBeTruthy()

    // Patient clicks Choose new day & time
    const openRescheduleBtn = screen.getByRole('button', { name: /Choose new day & time/i })
    fireEvent.click(openRescheduleBtn)

    // Doctor open slot is loaded and clickable
    expect(platformApi.slots).toHaveBeenCalled()
    const slotBtn = await screen.findByRole('button', { name: '14:00 UTC' })
    fireEvent.click(slotBtn)

    // Confirm reschedule
    const confirmBtn = screen.getByRole('button', { name: 'Confirm new appointment time' })
    fireEvent.click(confirmBtn)
    expect(platformApi.rescheduleAppointment).toHaveBeenCalledWith('visit-2', slotTime)
  })

  it('allows patient to cancel an appointment directly', async () => {
    const onChanged = vi.fn().mockResolvedValue(undefined)
    vi.mocked(platformApi.cancelAppointment).mockResolvedValue({ id: 'visit-3' } as any)

    const appointments: VisitRow[] = [{
      id: 'visit-3',
      requesterId: 'elena-torres',
      professionalId: 'sofia-chen',
      specialty: 'medical',
      status: 'requested',
      scheduledAt: Date.UTC(2026, 10, 17, 10),
    }]

    render(
      <MemoryRouter>
        <AppointmentDesk
          missionId="mission-1"
          stage="aboard"
          profileId="elena-torres"
          scope="mine"
          members={[]}
          appointments={appointments}
          onChanged={onChanged}
        />
      </MemoryRouter>,
    )

    const cancelBtn = screen.getByRole('button', { name: 'Cancel appointment' })
    fireEvent.click(cancelBtn)
    expect(platformApi.cancelAppointment).toHaveBeenCalledWith('visit-3', 'Cancelled by patient')
  })
})
