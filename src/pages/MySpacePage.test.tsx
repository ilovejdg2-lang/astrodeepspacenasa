// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MySpacePage } from './MySpacePage'
import { useMissionWorkspace } from './role/useMissionWorkspace'

vi.mock('../i18n', () => ({
  useLocale: () => ({ lang: 'es' }),
}))

vi.mock('./role/useMissionWorkspace', () => ({
  useMissionWorkspace: vi.fn(),
}))

const appointments = [
  {
    id: 'psych-upcoming',
    requesterId: 'mateo-ruiz',
    professionalId: 'alex-morgan',
    specialty: 'psychological',
    status: 'confirmed',
    scheduledAt: Date.UTC(2026, 10, 17, 9),
    durationMin: 30,
    timezone: 'UTC',
    reason: 'Consulta psicológica de seguimiento',
    summary: 'Solicitud de acompañamiento voluntario.',
    shareCategories: ['sleep'],
  },
  {
    id: 'medical-upcoming',
    requesterId: 'mateo-ruiz',
    professionalId: 'sofia-chen',
    specialty: 'medical',
    status: 'confirmed',
    scheduledAt: Date.UTC(2026, 10, 18, 10),
    durationMin: 30,
    timezone: 'UTC',
    reason: 'Revisión médica de rutina',
  },
  {
    id: 'medical-pending',
    requesterId: 'mateo-ruiz',
    professionalId: 'sofia-chen',
    specialty: 'medical',
    status: 'pending_confirm',
    scheduledAt: Date.UTC(2026, 10, 19, 10),
    reason: 'Solicitud pendiente de respuesta',
  },
  {
    id: 'psych-private-note',
    requesterId: 'mateo-ruiz',
    professionalId: 'alex-morgan',
    specialty: 'psychological',
    status: 'completed',
    scheduledAt: Date.UTC(2026, 10, 10, 9),
    reason: 'Consulta anterior',
    professionalNotes: 'Nota privada de uso exclusivo del profesional.',
  },
  {
    id: 'other-person',
    requesterId: 'nova-hale',
    professionalId: 'sofia-chen',
    specialty: 'medical',
    status: 'confirmed',
    scheduledAt: Date.UTC(2026, 10, 17, 10),
    reason: 'No debe aparecer en mi lista.',
  },
]

describe('MySpacePage appointments', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-16T08:00:00.000Z'))
    const workspace = {
      missionId: 'mission-demo-horizon',
      profile: {
        id: 'mateo-ruiz',
        displayName: 'Mateo Ruiz',
        title: 'Crew Member',
        demoRole: 'crew',
      },
      detail: null,
      prep: [],
      percent: 0,
      appointments,
      appointmentsLoading: false,
      appointmentsError: '',
      wakeNote: '',
      symptoms: [],
      grants: [],
      error: '',
      loading: false,
      refresh: vi.fn(),
      role: 'crew',
      mode: 'demo',
      demo: true,
    } satisfies ReturnType<typeof useMissionWorkspace>
    vi.mocked(useMissionWorkspace).mockReturnValue(workspace)
  })

  it('shows only the crew member’s backend appointments and keeps professional notes private', () => {
    render(<MemoryRouter><MySpacePage /></MemoryRouter>)

    expect(screen.getByText('Consulta psicológica de seguimiento')).toBeTruthy()
    expect(screen.getByText('Revisión médica de rutina')).toBeTruthy()
    expect(screen.queryByText('No debe aparecer en mi lista.')).toBeNull()
    expect(screen.queryByText('Nota privada de uso exclusivo del profesional.')).toBeNull()
  })

  it('filters appointments by specialty, status, and date period', () => {
    render(<MemoryRouter><MySpacePage /></MemoryRouter>)

    fireEvent.change(screen.getByLabelText('Especialidad'), { target: { value: 'psychological' } })
    expect(screen.getByText('Consulta psicológica de seguimiento')).toBeTruthy()
    expect(screen.queryByText('Revisión médica de rutina')).toBeNull()

    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: 'past' } })
    expect(screen.getByText('Consulta anterior')).toBeTruthy()
    expect(screen.queryByText('Consulta psicológica de seguimiento')).toBeNull()

    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'completed' } })
    expect(screen.getByText('Consulta anterior')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'requested' } })
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: 'any' } })
    expect(screen.getByText('Solicitud pendiente de respuesta')).toBeTruthy()
  })
})
