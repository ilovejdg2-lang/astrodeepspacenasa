// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppointmentDesk, type VisitRow } from './AppointmentDesk'

vi.mock('../../i18n', () => ({
  useLocale: () => ({ lang: 'en' }),
}))

describe('AppointmentDesk weekly schedule', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-16T08:00:00.000Z'))
  })

  afterEach(() => {
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
    const appointmentName = screen.getAllByText('Mateo Ruiz')[0]
    expect(appointmentName).toBeTruthy()
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
})
