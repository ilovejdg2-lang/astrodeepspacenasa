// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { platformApi } from '../platform/api'
import { MemoriesPage } from './MemoriesPage'

let mockLang = 'en'
let mockProfile = {
  id: 'mateo-ruiz',
  displayName: 'Mateo Ruiz',
  title: 'Crew Member',
  demoRole: 'crew',
}
let mockMissionId: string | null = 'mission-demo-horizon'

vi.mock('../i18n', () => ({
  useLocale: () => ({ lang: mockLang }),
}))

vi.mock('../platform/session', () => ({
  getActiveMissionId: () => mockMissionId,
  getStoredProfile: () => mockProfile,
}))

vi.mock('../platform/api', () => ({
  platformApi: {
    memories: vi.fn(),
    createMemory: vi.fn(),
    updateMemory: vi.fn(),
    deleteMemory: vi.fn(),
    memoryImageBlob: vi.fn(),
    mission: vi.fn(),
    slots: vi.fn(),
    requestAppointment: vi.fn(),
    urgent: vi.fn(),
  },
}))

vi.mock('../persistence/memories', () => ({
  readLocalMemories: vi.fn().mockResolvedValue([]),
  writeLocalMemories: vi.fn().mockResolvedValue(undefined),
  clearLocalMemories: vi.fn().mockResolvedValue(undefined),
  readLocalMemoryImage: vi.fn().mockResolvedValue(null),
  writeLocalMemoryImage: vi.fn().mockResolvedValue(undefined),
  deleteLocalMemoryImage: vi.fn().mockResolvedValue(undefined),
}))

const sampleMemories = [
  {
    id: 'mem-1',
    profileId: 'mateo-ruiz',
    title: 'Earth from orbit',
    message: 'Looking down at the blue sphere. Beautiful and peaceful.',
    imageFileId: 'file-1.jpg',
    imageContentType: 'image/jpeg',
    createdAt: Date.now() - 100000,
    updatedAt: Date.now() - 100000,
  },
  {
    id: 'mem-2',
    profileId: 'mateo-ruiz',
    title: 'Family gathering',
    message: 'Remembering our farewell dinner before preflight quarantine.',
    imageFileId: null,
    imageContentType: null,
    createdAt: Date.now() - 50000,
    updatedAt: Date.now() - 50000,
  },
]

describe('MemoriesPage', () => {
  beforeEach(() => {
    mockLang = 'en'
    mockProfile = {
      id: 'mateo-ruiz',
      displayName: 'Mateo Ruiz',
      title: 'Crew Member',
      demoRole: 'crew',
    }
    mockMissionId = 'mission-demo-horizon'

    vi.mocked(platformApi.memories).mockResolvedValue({ items: sampleMemories })
    vi.mocked(platformApi.mission).mockResolvedValue({
      mission: {
        id: 'mission-demo-horizon',
        code: 'HZ-1',
        name: 'Horizon Deep Space',
        destination: 'Moon Orbit',
        stage: 'aboard',
        plannedStart: null,
        durationDays: 30,
        plannedCrewCount: 4,
        timezone: 'UTC',
        activities: [],
        commsNotes: '',
        storageNotes: '',
        prepPercent: 100,
        createdBy: 'elena-torres',
      },
      members: [
        { id: 'm-1', profileId: 'mateo-ruiz', role: 'crew', status: 'active' },
        { id: 'm-2', profileId: 'alex-morgan', role: 'psychologist', status: 'active' },
      ],
      prepItems: [],
      prepPercent: 100,
    })
    vi.mocked(platformApi.slots).mockResolvedValue({
      slots: [
        { start: Date.now() + 86400000, label: '09:00 UTC' },
        { start: Date.now() + 86400000 + 3600000, label: '10:00 UTC' },
      ],
    })
    vi.mocked(platformApi.memoryImageBlob).mockResolvedValue(new Blob(['image-bytes'], { type: 'image/jpeg' }))
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders header, description, and memories collection', async () => {
    render(<MemoryRouter><MemoriesPage /></MemoryRouter>)

    expect(await screen.findByText('Earth from orbit')).toBeTruthy()
    expect(screen.getByText('Family gathering')).toBeTruthy()
    expect(screen.getByText('A little closer to the people and places you love.')).toBeTruthy()
    expect(screen.getByText('Add a memory')).toBeTruthy()
  })

  it('renders companionship card with Quirón and correct texts without false promises', async () => {
    render(<MemoryRouter><MemoriesPage /></MemoryRouter>)

    expect(await screen.findByText('Feeling lonely?')).toBeTruthy()
    expect(screen.getByText('Talk with Quirón, or find support from an available space psychologist.')).toBeTruthy()
    expect(screen.getByText('Talk with Quirón')).toBeTruthy()
    expect(screen.getByText('Find a psychologist')).toBeTruthy()
  })

  it('shows empty state when no memories exist', async () => {
    vi.mocked(platformApi.memories).mockResolvedValue({ items: [] })
    render(<MemoryRouter><MemoriesPage /></MemoryRouter>)

    expect(await screen.findByText('Keep something meaningful close.')).toBeTruthy()
    expect(screen.getByText('Add a photo or a few words you’d like to remember.')).toBeTruthy()
  })

  it('allows creating a memory with title, message, and optional photo', async () => {
    const createdMemory = {
      id: 'mem-new',
      profileId: 'mateo-ruiz',
      title: 'Our home garden',
      message: 'Fresh flowers blooming in spring.',
      imageFileId: null,
      imageContentType: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    vi.mocked(platformApi.createMemory).mockResolvedValue(createdMemory)

    render(<MemoryRouter><MemoriesPage /></MemoryRouter>)

    await screen.findByText('Earth from orbit')

    // Click Add a memory
    fireEvent.click(screen.getByRole('button', { name: /Add a memory/i }))

    // Fill form
    const titleInput = screen.getByLabelText(/Title/i)
    fireEvent.change(titleInput, { target: { value: 'Our home garden' } })

    const msgInput = screen.getByLabelText(/Message/i)
    fireEvent.change(msgInput, { target: { value: 'Fresh flowers blooming in spring.' } })

    // Save
    fireEvent.click(screen.getByRole('button', { name: /Save memory/i }))

    await waitFor(() => {
      expect(platformApi.createMemory).toHaveBeenCalledWith({
        title: 'Our home garden',
        message: 'Fresh flowers blooming in spring.',
        imageBase64: null,
        imageContentType: null,
      })
    })
  })

  it('allows viewing memory detail and deleting memory with confirmation', async () => {
    vi.mocked(platformApi.deleteMemory).mockResolvedValue({ ok: true })

    render(<MemoryRouter><MemoriesPage /></MemoryRouter>)

    await screen.findByText('Earth from orbit')

    // Click delete on first memory
    const deleteBtn = screen.getByRole('button', { name: /Delete Earth from orbit/i })
    fireEvent.click(deleteBtn)

    // Confirmation dialog should be open
    expect(screen.getByText(/Are you sure you want to delete "Earth from orbit"?/i)).toBeTruthy()

    // Confirm deletion
    const confirmDeleteBtn = screen.getByRole('button', { name: /^Delete$/i })
    fireEvent.click(confirmDeleteBtn)

    await waitFor(() => {
      expect(platformApi.deleteMemory).toHaveBeenCalledWith('mem-1')
    })
  })

  it('dispatches emotional care event when clicking Talk with Quirón', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    render(<MemoryRouter><MemoriesPage /></MemoryRouter>)

    await screen.findByText('Feeling lonely?')

    fireEvent.click(screen.getByRole('button', { name: /Talk with Quirón/i }))

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'helios:quiron-care',
        detail: expect.objectContaining({ topic: 'emotional', origin: 'memories' }),
      }),
    )
  })

  it('finds available psychologist, picks slot, and requests appointment with confirmation', async () => {
    vi.mocked(platformApi.requestAppointment).mockResolvedValue({ id: 'appt-new', status: 'requested' })

    render(<MemoryRouter><MemoriesPage /></MemoryRouter>)

    await screen.findByText('Feeling lonely?')

    // Click Find a psychologist
    fireEvent.click(screen.getByRole('button', { name: /Find a psychologist/i }))

    // Modal opens
    expect(await screen.findByText('Alex Morgan (Space Psychologist)')).toBeTruthy()

    // Available slots should be displayed
    const slotBtn = await screen.findByRole('button', { name: '09:00 UTC' })
    fireEvent.click(slotBtn)

    // Review request button
    const reviewBtn = screen.getByRole('button', { name: /Review request/i })
    fireEvent.click(reviewBtn)

    // Confirmation step
    expect(await screen.findByText(/Please confirm your psychological support request/i)).toBeTruthy()
    expect(screen.getByText(/Status upon creation: Requested/i)).toBeTruthy()

    // Submit appointment request
    const requestBtn = screen.getByRole('button', { name: /Request appointment/i })
    fireEvent.click(requestBtn)

    await waitFor(() => {
      expect(platformApi.requestAppointment).toHaveBeenCalledWith('mission-demo-horizon', expect.objectContaining({
        specialty: 'psychological',
        professionalId: 'alex-morgan',
        modality: 'aboard',
      }))
    })

    // Success screen
    expect(await screen.findByText('Request sent')).toBeTruthy()
  })

  it('handles absence of psychologist with exact requirement message', async () => {
    vi.mocked(platformApi.mission).mockResolvedValue({
      mission: {
        id: 'mission-demo-horizon',
        code: 'HZ-1',
        name: 'Horizon Deep Space',
        destination: 'Moon Orbit',
        stage: 'aboard',
        plannedStart: null,
        durationDays: 30,
        plannedCrewCount: 4,
        timezone: 'UTC',
        activities: [],
        commsNotes: '',
        storageNotes: '',
        prepPercent: 100,
        createdBy: 'elena-torres',
      },
      members: [
        { id: 'm-1', profileId: 'mateo-ruiz', role: 'crew', status: 'active' },
      ],
      prepItems: [],
      prepPercent: 100,
    })

    render(<MemoryRouter><MemoriesPage /></MemoryRouter>)

    await screen.findByText('Feeling lonely?')

    fireEvent.click(screen.getByRole('button', { name: /Find a psychologist/i }))

    expect(await screen.findByText('No psychologist is currently available for this mission.')).toBeTruthy()
    expect(screen.getByText(/You can consult the configured human mission support options/i)).toBeTruthy()
  })

  it('respects stage restrictions when mission is not in flight', async () => {
    vi.mocked(platformApi.mission).mockResolvedValue({
      mission: {
        id: 'mission-demo-preflight',
        code: 'PF-1',
        name: 'Preflight Mission',
        destination: 'Mars',
        stage: 'preflight',
        plannedStart: null,
        durationDays: 30,
        plannedCrewCount: 4,
        timezone: 'UTC',
        activities: [],
        commsNotes: '',
        storageNotes: '',
        prepPercent: 70,
        createdBy: 'elena-torres',
      },
      members: [
        { id: 'm-1', profileId: 'mateo-ruiz', role: 'crew', status: 'active' },
        { id: 'm-2', profileId: 'alex-morgan', role: 'psychologist', status: 'active' },
      ],
      prepItems: [],
      prepPercent: 70,
    })

    render(<MemoryRouter><MemoriesPage /></MemoryRouter>)

    await screen.findByText('Earth from orbit')

    // Click Find a psychologist
    fireEvent.click(screen.getByRole('button', { name: /Find a psychologist/i }))

    expect(await screen.findByText(/Psychological consultations and appointments are available only while the mission is In Flight/i)).toBeTruthy()
  })

  it('translates UI to Spanish accurately', async () => {
    mockLang = 'es'
    render(<MemoryRouter><MemoriesPage /></MemoryRouter>)

    expect(await screen.findByText('Recuerdos')).toBeTruthy()
    expect(screen.getByText('Un poco más cerca de las personas y lugares que querés.')).toBeTruthy()
    expect(screen.getByText('¿Te sentís solo?')).toBeTruthy()
    expect(screen.getByText('Conversá con Quirón, o buscá apoyo de un psicólogo espacial disponible.')).toBeTruthy()
    expect(screen.getByText('Hablar con Quirón')).toBeTruthy()
    expect(screen.getByText('Buscar un psicólogo')).toBeTruthy()
  })
})
