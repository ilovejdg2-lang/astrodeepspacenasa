// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { platformApi } from '../platform/api'
import { MySpacePage } from './MySpacePage'

vi.mock('../i18n', () => ({
  useLocale: () => ({ lang: 'es' }),
}))

vi.mock('../platform/api', () => ({
  platformApi: { appointments: vi.fn() },
}))

vi.mock('../platform/session', () => ({
  getActiveMissionId: () => 'mission-demo-horizon',
  getStoredProfile: () => ({
    id: 'mateo-ruiz',
    displayName: 'Mateo Ruiz',
    title: 'Crew Member',
    demoRole: 'crew',
  }),
}))

const referenceNow = Date.now()
const appointments = [
  {
    id: 'psych-upcoming',
    requesterId: 'mateo-ruiz',
    professionalId: 'alex-morgan',
    specialty: 'psychological',
    status: 'confirmed',
    scheduledAt: referenceNow + 86_400_000,
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
    scheduledAt: referenceNow + 2 * 86_400_000,
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
    scheduledAt: referenceNow + 3 * 86_400_000,
    reason: 'Solicitud pendiente de respuesta',
  },
  {
    id: 'psych-private-note',
    requesterId: 'mateo-ruiz',
    professionalId: 'alex-morgan',
    specialty: 'psychological',
    status: 'completed',
    scheduledAt: referenceNow - 6 * 86_400_000,
    reason: 'Consulta anterior',
    professionalNotes: 'Nota privada de uso exclusivo del profesional.',
  },
  {
    id: 'other-person',
    requesterId: 'nova-hale',
    professionalId: 'sofia-chen',
    specialty: 'medical',
    status: 'confirmed',
    scheduledAt: referenceNow + 86_400_000,
    reason: 'No debe aparecer en mi lista.',
  },
]

describe('MySpacePage appointments', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.mocked(platformApi.appointments).mockResolvedValue({ items: appointments })
  })

  it('shows only the crew member’s backend appointments and keeps professional notes private', async () => {
    render(<MemoryRouter><MySpacePage /></MemoryRouter>)

    expect(await screen.findByText('Consulta psicológica de seguimiento')).toBeTruthy()
    expect(screen.getByText('Revisión médica de rutina')).toBeTruthy()
    expect(screen.queryByText('No debe aparecer en mi lista.')).toBeNull()
    expect(screen.queryByText('Nota privada de uso exclusivo del profesional.')).toBeNull()
  })

  it('filters appointments by specialty, status, and date period', async () => {
    render(<MemoryRouter><MySpacePage /></MemoryRouter>)

    await screen.findByText('Consulta psicológica de seguimiento')

    fireEvent.change(screen.getByLabelText('Especialidad'), { target: { value: 'psychological' } })
    expect(screen.getByText('Consulta psicológica de seguimiento')).toBeTruthy()
    expect(screen.queryByText('Revisión médica de rutina')).toBeNull()

    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: 'past' } })
    expect(screen.getByText('Consulta anterior')).toBeTruthy()
    expect(screen.queryByText('Consulta psicológica de seguimiento')).toBeNull()

    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'completed' } })
    expect(screen.getByText('Consulta anterior')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'requested' } })
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: 'all' } })
    fireEvent.change(screen.getByLabelText('Especialidad'), { target: { value: 'all' } })
    expect(screen.getByText('Solicitud pendiente de respuesta')).toBeTruthy()
  })
})
