import type { PainMapReport } from '../domain/painMap'
import { systemText } from '../systemText'
import { uiLang } from '../locale'
import { apiUrl } from '../api/baseUrl'

export const DEFAULT_DEMO_PROFILES: Profile[] = [
  { id: 'elena-torres', displayName: 'Elena Torres', title: 'Jefa de misión (demo)', demoRole: 'chief', avatarKey: 'elena' },
  { id: 'mateo-ruiz', displayName: 'Mateo Ruiz', title: 'Tripulante (demo)', demoRole: 'crew', avatarKey: 'mateo' },
  { id: 'sofia-chen', displayName: 'Sofía Chen', title: 'Médica simulada (demo)', demoRole: 'medic', avatarKey: 'sofia' },
  { id: 'alex-morgan', displayName: 'Alex Morgan', title: 'Psicólogo simulado (demo)', demoRole: 'psychologist', avatarKey: 'alex' },
]

export function getCachedProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem('helios-cached-profiles')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_DEMO_PROFILES
}

export function saveCachedProfiles(profiles: Profile[]) {
  try {
    if (Array.isArray(profiles) && profiles.length > 0) {
      localStorage.setItem('helios-cached-profiles', JSON.stringify(profiles))
    }
  } catch {
    /* ignore */
  }
}

export const DEFAULT_DEMO_MISSIONS: MissionRow[] = [
  {
    mission: {
      id: 'mission-demo-horizon',
      code: 'HELIOS-HORIZON',
      name: 'HELIOS Horizon — In Flight',
      demoKey: 'horizon',
      stage: 'aboard',
      destination: 'Low Earth orbit (simulated)',
      durationDays: 14,
      plannedCrewCount: 6,
      timezone: 'UTC',
      activities: ['Daily operations', 'Exercise', 'Science'],
      commsNotes: '',
      storageNotes: '',
      prepPercent: 100,
      plannedStart: '2026-11-10',
      actualStart: '2026-11-10T00:00:00.000Z',
      createdBy: 'elena-torres',
    },
    membership: { id: 'm-horizon', role: 'crew', status: 'active' },
  },
  {
    mission: {
      id: 'mission-demo-pathfinder',
      code: 'HELIOS-PATHFINDER',
      name: 'HELIOS Pathfinder — Preflight',
      demoKey: 'pathfinder',
      stage: 'preflight',
      destination: 'Low Earth orbit (simulated)',
      durationDays: 21,
      plannedCrewCount: 6,
      timezone: 'UTC',
      activities: ['Habitat setup', 'Checklist drills'],
      commsNotes: '',
      storageNotes: '',
      prepPercent: 65,
      plannedStart: '2026-12-01',
      actualStart: null,
      createdBy: 'elena-torres',
    },
    membership: { id: 'm-pathfinder', role: 'chief', status: 'active' },
  },
  {
    mission: {
      id: 'mission-demo-genesis',
      code: 'HELIOS-GENESIS',
      name: 'HELIOS Genesis — Draft',
      demoKey: 'genesis',
      stage: 'draft',
      destination: '',
      durationDays: 30,
      plannedCrewCount: 4,
      timezone: 'UTC',
      activities: [],
      commsNotes: '',
      storageNotes: '',
      prepPercent: 0,
      plannedStart: null,
      actualStart: null,
      createdBy: 'elena-torres',
    },
    membership: { id: 'm-genesis', role: 'chief', status: 'active' },
  },
  {
    mission: {
      id: 'mission-demo-aurora',
      code: 'HELIOS-AURORA',
      name: 'HELIOS Aurora — Completed Mission',
      demoKey: 'aurora',
      stage: 'postmission',
      destination: 'Low Earth orbit (simulated)',
      durationDays: 12,
      plannedCrewCount: 6,
      timezone: 'UTC',
      activities: ['Transit', 'Science', 'Return'],
      commsNotes: '',
      storageNotes: '',
      prepPercent: 100,
      plannedStart: '2026-10-15',
      actualStart: '2026-10-15T00:00:00.000Z',
      closedAt: 1731196800000,
      createdBy: 'elena-torres',
    },
    membership: { id: 'm-aurora', role: 'crew', status: 'active' },
  },
]

export function getCachedMissions(): MissionRow[] {
  try {
    const raw = localStorage.getItem('helios-cached-missions')
    if (raw) {
      const parsed = JSON.parse(raw) as MissionRow[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_DEMO_MISSIONS
}

function connectionMessage() {
  return uiLang() === 'en'
    ? "This couldn't load right now. Try again in a moment."
    : 'No se pudo cargar ahora. Probá de nuevo en un momento.'
}

function errorMessage(status: number, data: unknown) {
  const record = data && typeof data === 'object' ? data as { message?: unknown } : {}
  const raw = typeof record.message === 'string'
    ? record.message
    : Array.isArray(record.message)
      ? record.message.filter((item): item is string => typeof item === 'string').join(', ')
      : ''
  if (status >= 500 || /^error\s+\d+$/i.test(raw) || /bad gateway|service unavailable/i.test(raw)) {
    return connectionMessage()
  }
  return systemText(raw || connectionMessage())
}
import { getActiveMissionId, getSessionToken } from './session'
import { careConversationSchema, careDraftSchema, type CareAiOptions } from '../../shared/careSchema'

async function platformFetch<T>(path: string, init?: RequestInit, retries = 2): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')
  headers.set('Accept-Language', uiLang())
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const token = getSessionToken()
  if (token) headers.set('X-Helios-Session', token)
  const missionId = getActiveMissionId()
  if (missionId) headers.set('X-Helios-Mission', missionId)

  for (let attempt = 0; attempt <= retries; attempt++) {
    let response: Response
    try {
      response = await fetch(apiUrl(path), { ...init, headers })
    } catch {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 2000))
        continue
      }
      throw new Error(connectionMessage())
    }

    if (!response.ok) {
      // When Render is waking up from cold-start, reverse proxies return 502/503/504
      if ((response.status === 502 || response.status === 503 || response.status === 504) && attempt < retries) {
        await new Promise((r) => setTimeout(r, 2000))
        continue
      }
      const data = await response.json().catch(() => ({}))
      throw new Error(errorMessage(response.status, data))
    }

    const data = await response.json().catch(() => ({}))
    return data as T
  }
  throw new Error(connectionMessage())
}

export const platformApi = {
  profiles: async () => {
    try {
      const res = await platformFetch<{ profiles: Profile[] }>('/api/platform/profiles')
      if (res?.profiles?.length) saveCachedProfiles(res.profiles)
      return res
    } catch (err) {
      const cached = getCachedProfiles()
      if (cached.length) return { profiles: cached }
      throw err
    }
  },
  select: async (profileId: string) => {
    try {
      return await platformFetch<{ token: string; profile: Profile; expiresAt: number }>(
        '/api/platform/auth/select',
        {
          method: 'POST',
          body: JSON.stringify({ profileId }),
        },
        3,
      )
    } catch (err) {
      const cached = getCachedProfiles()
      const fallback = cached.find((p) => p.id === profileId) || DEFAULT_DEMO_PROFILES.find((p) => p.id === profileId)
      if (fallback) {
        return {
          token: `demo-session-${profileId}-${Date.now()}`,
          profile: fallback,
          expiresAt: Date.now() + 86400000,
        }
      }
      throw err
    }
  },
  me: () => platformFetch<{ profile: Profile }>('/api/platform/me'),
  missions: async () => {
    try {
      const res = await platformFetch<{ items: MissionRow[] }>('/api/platform/missions')
      if (res?.items) {
        const stageWeight = (stage: string) => {
          if (stage === 'aboard') return 0
          if (stage === 'preflight') return 1
          if (stage === 'draft') return 2
          if (stage === 'postmission') return 3
          return 4
        }
        res.items.sort((a, b) => stageWeight(a.mission.stage) - stageWeight(b.mission.stage))
        try {
          localStorage.setItem('helios-cached-missions', JSON.stringify(res.items))
        } catch {
          /* ignore */
        }
      }
      return res
    } catch (err) {
      const cached = getCachedMissions()
      if (cached.length) return { items: cached }
      throw err
    }
  },
  mission: (id: string) => platformFetch<MissionDetail>(`/api/platform/missions/${id}`),
  createMission: (body: Record<string, unknown>) =>
    platformFetch<MissionDetail>('/api/platform/missions', { method: 'POST', body: JSON.stringify(body) }),
  join: (code: string, role?: string) =>
    platformFetch<{ missionId: string; membershipId?: string; status: string; note?: string }>('/api/platform/missions/join', {
      method: 'POST',
      body: JSON.stringify({ code, role }),
    }),
  decideJoin: (missionId: string, membershipId: string, accept: boolean) =>
    platformFetch<MissionDetail>(`/api/platform/missions/${missionId}/join-decide`, {
      method: 'POST',
      body: JSON.stringify({ membershipId, accept }),
    }),
  startMission: (missionId: string, confirm = true) =>
    platformFetch<MissionDetail & { evaluation?: unknown }>(`/api/platform/missions/${missionId}/start`, {
      method: 'POST',
      body: JSON.stringify({ confirm }),
    }),
  startCheck: (missionId: string) =>
    platformFetch<{
      ok: boolean
      percent: number
      analysisStale?: boolean
      blockers: string[]
      criticalPending: string[]
      activeMembers: number
      plannedCrewCount: number
      disclaimer: string
    }>(`/api/platform/missions/${missionId}/start-check`),
  updateDraft: (id: string, body: Record<string, unknown>) =>
    platformFetch<MissionDetail>(`/api/platform/missions/${id}/draft`, { method: 'POST', body: JSON.stringify(body) }),
  prep: (id: string) => platformFetch<{ items: PrepItem[]; percent: number; canStart: boolean }>(`/api/platform/missions/${id}/prep`),
  upsertPrep: (id: string, body: Record<string, unknown>) =>
    platformFetch<{ items: PrepItem[]; percent: number }>(`/api/platform/missions/${id}/prep`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  suggestPrep: (id: string) =>
    platformFetch<{
      suggestions: PrepSuggestion[]
      note: string
      warning?: string
      rosterLocked?: boolean
      stage?: string
    }>(`/api/platform/missions/${id}/prep/suggest`, { method: 'POST', body: '{}' }),
  commitAiPrep: (id: string, titles?: string[]) =>
    platformFetch<{
      items: PrepItem[]
      percent: number
      canStart: boolean
      mission: Mission
      note: string
      warning: string
      locked: boolean
    }>(`/api/platform/missions/${id}/prep/commit-ai`, {
      method: 'POST',
      body: JSON.stringify({ titles }),
    }),
  start: (id: string) =>
    platformFetch<MissionDetail & { evaluation: StartCheck }>(`/api/platform/missions/${id}/start`, {
      method: 'POST',
      body: JSON.stringify({ confirm: true }),
    }),
  setStage: (id: string, stage: string) =>
    platformFetch<MissionDetail>(`/api/platform/missions/${id}/stage`, { method: 'POST', body: JSON.stringify({ stage }) }),
  wake: (id: string, justWoke?: boolean) =>
    platformFetch<{ check: WakeCheck; note: string }>(`/api/platform/missions/${id}/wake${justWoke ? '?justWoke=1' : ''}`),
  completeWake: (id: string, payload: Record<string, unknown>) =>
    platformFetch(`/api/platform/missions/${id}/wake`, { method: 'POST', body: JSON.stringify(payload) }),
  wakeCrew: (id: string) =>
    platformFetch<{
      periodKey: string
      items: Array<{
        profileId: string
        displayName: string
        role: string
        status: string
        payload: Record<string, unknown>
        updatedAt: number | null
      }>
    }>(`/api/platform/missions/${id}/wake/crew`),
  addSleep: (id: string, body: { startAt: number; endAt: number; quality?: number; kind?: string }) =>
    platformFetch(`/api/platform/missions/${id}/sleep`, { method: 'POST', body: JSON.stringify(body) }),
  listSleep: (id: string, subjectId?: string) =>
    platformFetch<{ items: unknown[] }>(
      `/api/platform/missions/${id}/sleep${subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : ''}`,
    ),
  addSymptom: (id: string, body: Record<string, unknown>) =>
    platformFetch(`/api/platform/missions/${id}/symptoms`, { method: 'POST', body: JSON.stringify(body) }),
  listSymptoms: (id: string, subjectId?: string) =>
    platformFetch<{ items: unknown[] }>(
      `/api/platform/missions/${id}/symptoms${subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : ''}`,
    ),
  listPainMaps: (id: string, subjectId?: string) =>
    platformFetch<{ items: PainMapReport[] }>(
      `/api/platform/missions/${id}/pain-maps${subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : ''}`,
    ),
  createPainMap: (id: string, body: Record<string, unknown>) =>
    platformFetch<PainMapReport>(`/api/platform/missions/${id}/pain-maps`, { method: 'POST', body: JSON.stringify(body) }),
  correctPainMap: (id: string, reportId: string, body: Record<string, unknown>) =>
    platformFetch<PainMapReport>(`/api/platform/missions/${id}/pain-maps/${encodeURIComponent(reportId)}/corrections`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  setPainStatus: (id: string, reportId: string, status: string) =>
    platformFetch<PainMapReport>(`/api/platform/missions/${id}/pain-maps/${encodeURIComponent(reportId)}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),
  addPainClinicalNote: (id: string, reportId: string, body: string, appointmentId?: string | null) =>
    platformFetch<PainMapReport>(`/api/platform/missions/${id}/pain-maps/${encodeURIComponent(reportId)}/clinical-notes`, {
      method: 'POST',
      body: JSON.stringify({ body, appointmentId: appointmentId ?? null }),
    }),
  listIndicators: (id: string, opts?: { subjectId?: string; kind?: string }) => {
    const params = new URLSearchParams()
    if (opts?.subjectId) params.set('subjectId', opts.subjectId)
    if (opts?.kind) params.set('kind', opts.kind)
    const q = params.toString()
    return platformFetch<{ items: HealthIndicatorReading[] }>(
      `/api/platform/missions/${id}/indicators${q ? `?${q}` : ''}`,
    )
  },
  addIndicator: (
    id: string,
    body: {
      kind: IndicatorKind
      value: number
      valueSecondary?: number | null
      measuredAt?: number
      unit?: string
      origin?: HealthIndicatorReading['origin']
      context?: string
      quality?: HealthIndicatorReading['quality']
      notes?: string
      bodyRegion?: string | null
    },
  ) =>
    platformFetch<HealthIndicatorReading>(`/api/platform/missions/${id}/indicators`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  grants: (id: string) => platformFetch<{ items: unknown[]; chief: { sharesWithChief: string[]; neverAutoShared: string[]; note: string } }>(`/api/platform/missions/${id}/grants`),
  grant: (id: string, body: Record<string, unknown>) =>
    platformFetch(`/api/platform/missions/${id}/grants`, { method: 'POST', body: JSON.stringify(body) }),
  revokeGrant: (grantId: string) => platformFetch(`/api/platform/grants/${grantId}/revoke`, { method: 'POST', body: '{}' }),
  quironStart: (id: string, mode: 'physical' | 'emotional', locale: 'es' | 'en' = 'en') =>
    platformFetch(`/api/platform/missions/${id}/quiron`, { method: 'POST', body: JSON.stringify({ mode, locale }) }),
  quironMessage: async (conversationId: string, text: string, locale: 'es' | 'en' = 'en', ai?: CareAiOptions, signal?: AbortSignal) =>
    careConversationSchema.parse(await platformFetch(`/api/platform/quiron/${conversationId}/message`, {
      method: 'POST', body: JSON.stringify({ text, locale, ai }), signal,
    })),
  quironDraft: async (conversationId: string, locale: 'es' | 'en', ai: CareAiOptions, signal?: AbortSignal) =>
    careDraftSchema.parse(await platformFetch(`/api/platform/quiron/${conversationId}/summary/draft`, {
      method: 'POST', body: JSON.stringify({ locale, ai }), signal,
    })),
  quironSummary: (conversationId: string, body: string, shareWith: string | null, expectedMessages?: number) =>
    platformFetch(`/api/platform/quiron/${conversationId}/summary`, {
      method: 'POST',
      body: JSON.stringify({ body, shareWith, expectedMessages }),
    }),
  urgent: (id: string) => platformFetch(`/api/platform/missions/${id}/urgent`, { method: 'POST', body: '{}' }),
  quironSummaries: (missionId: string) => platformFetch<{ items: Array<{ id: string; body: string; profileId: string; mode: string; createdAt: number }> }>(`/api/platform/missions/${missionId}/quiron-summaries`),
  appointments: (id: string) => platformFetch<{ items: unknown[] }>(`/api/platform/missions/${id}/appointments`),
  requestAppointment: (id: string, body: Record<string, unknown>) =>
    platformFetch(`/api/platform/missions/${id}/appointments`, { method: 'POST', body: JSON.stringify(body) }),
  confirmAppointment: (appointmentId: string, accept: boolean) =>
    platformFetch(`/api/platform/appointments/${appointmentId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ accept }),
    }),
  rescheduleAppointment: (appointmentId: string, scheduledAt: number) =>
    platformFetch(`/api/platform/appointments/${appointmentId}/reschedule`, {
      method: 'POST',
      body: JSON.stringify({ scheduledAt }),
    }),
  requestPatientReschedule: (appointmentId: string, note?: string) =>
    platformFetch(`/api/platform/appointments/${appointmentId}/request-reschedule`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }),
  cancelAppointment: (appointmentId: string, reason: string) =>
    platformFetch(`/api/platform/appointments/${appointmentId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  completeAppointment: (appointmentId: string, outcome: string, professionalNotes: string) =>
    platformFetch(`/api/platform/appointments/${appointmentId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ outcome, professionalNotes }),
    }),
  slots: (id: string, professionalId: string, day: string) =>
    platformFetch<{ slots: { start: number; label: string }[] }>(
      `/api/platform/missions/${id}/slots?professionalId=${encodeURIComponent(professionalId)}&day=${encodeURIComponent(day)}`,
    ),
  review: (id: string) => platformFetch<{ review: MissionReview; versions: { id: string; version: number; createdAt: number }[] }>(`/api/platform/missions/${id}/review`),
  saveReview: (id: string) => platformFetch<{ id: string; version: number }>(`/api/platform/missions/${id}/review`, { method: 'POST', body: '{}' }),
  inventory: (id: string) => platformFetch<{ items: { name: string; kind: string; qtyOnHand: number; qtyPlanned: number }[]; movements: unknown[] }>(`/api/platform/missions/${id}/inventory`),
  evidence: () => platformFetch<{ items: Evidence[] }>('/api/platform/evidence'),
  storageStatus: () =>
    platformFetch<{
      driver: 'json' | 'supabase'
      revision: number
      remoteError: string | null
      recovery: { at: number; file: string; reason: string } | null
      damaged: string[]
    }>('/api/platform/storage'),
  restoreStorage: (file: string) =>
    platformFetch<{ damaged: string[] }>('/api/platform/storage/restore', {
      method: 'POST',
      body: JSON.stringify({ file }),
    }),
  memories: () => platformFetch<{ items: UserMemory[] }>('/api/platform/memories'),
  createMemory: (body: { title: string; message: string; imageBase64?: string | null; imageContentType?: string | null }) =>
    platformFetch<UserMemory>('/api/platform/memories', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getMemory: (id: string) => platformFetch<UserMemory>(`/api/platform/memories/${encodeURIComponent(id)}`),
  updateMemory: (
    id: string,
    body: { title?: string; message?: string; imageBase64?: string | null; imageContentType?: string | null; removeImage?: boolean },
  ) =>
    platformFetch<UserMemory>(`/api/platform/memories/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteMemory: (id: string) =>
    platformFetch<{ ok: boolean }>(`/api/platform/memories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  memoryImageBlob: async (id: string): Promise<Blob> => {
    const token = getSessionToken()
    const headers = new Headers()
    if (token) headers.set('X-Helios-Session', token)
    const res = await fetch(apiUrl(`/api/platform/memories/${encodeURIComponent(id)}/image`), { headers })
    if (!res.ok) throw new Error('Could not load memory image')
    return res.blob()
  },
}

export type Profile = {
  id: string
  displayName: string
  title: string
  demoRole: string
  avatarKey: string | null
}

export type MissionEnvironment = 'spacecraft' | 'space_station' | 'rover' | 'surface_base' | 'training'

export type Mission = {
  id: string
  code: string
  name: string
  destination: string
  environment?: MissionEnvironment
  stage: string
  plannedStart: string | null
  durationDays: number
  plannedCrewCount: number
  timezone: string
  wakeHourUtc?: number
  actualStart?: string | null
  actualReturn?: string | null
  closedAt?: number | null
  closedBy?: string | null
  demoKey?: string | null
  simulated?: boolean
  activities: string[]
  commsNotes: string
  storageNotes: string
  prepPercent: number
  rosterLocked?: boolean
  analysisStale?: boolean
  createdBy: string
}

export type IndicatorKind =
  | 'heart_rate'
  | 'blood_pressure'
  | 'spo2'
  | 'glucose'
  | 'temperature'
  | 'respiratory_rate'
  | 'sleep_hours'
  | 'mood'

export type HealthIndicatorReading = {
  id: string
  missionId: string
  profileId: string
  kind: IndicatorKind
  measuredAt: number
  value: number
  valueSecondary: number | null
  unit: string
  origin: 'manual' | 'sensor' | 'import' | 'simulation'
  context: string
  quality: 'good' | 'fair' | 'poor' | 'unknown'
  staleAfterMs: number
  notes: string
  bodyRegion: string | null
  createdAt: number
}

export type MissionRow = {
  mission: Mission
  membership: { id: string; role: string; status: string }
}

export type MissionDetail = {
  mission: Mission
  members: { id: string; profileId: string; role: string; status: string }[]
  prepItems: PrepItem[]
  prepPercent: number
}

export type PrepItem = {
  id: string
  category: string
  title: string
  description: string
  source: string
  critical: boolean
  status: string
  applies: boolean
  qtyRequired: number | null
  qtyAvailable: number | null
  evidence: string
  ownerProfileId?: string | null
}

export type MissionReview = {
  simulated: true
  stage: string
  disclaimer: { en: string; es: string }
  flight: {
    name: string
    destination: string
    timezone: string
    actualStart: string | null
    actualReturn: string | null
    closedAt: number | null
    closedBy: string | null
    durationDays: number
    crewCount: number
    prepPercent: number
  }
  indicators: { kind: string; count: number; staleCount: number }[]
  rest: { profileId: string; sleepEpisodes: number; checkInsCompleted: number; checkInsPending: number }[]
  episodes: { open: number; monitoring: number; resolved: number }
  alerts: { id: string; title: string; status: string; subjectProfileId: string | null }[]
  resources: { name: string; kind: string; qtyOnHand: number; qtyPlanned: number; movements: number; note: string }[]
  care: {
    visibleDetail: boolean
    byStatus: Record<string, number>
    pendingAtClose: { id: string; status: string; specialty: string; label: string }[]
  }
  lessons: { kind: 'observation' | 'proposal'; text: { en: string; es: string }; basis: { en: string; es: string } }[]
  recommendations: { kind: 'observation' | 'proposal'; text: { en: string; es: string }; basis: { en: string; es: string } }[]
}

export type PrepSuggestion = {
  key?: string
  title: string
  category: string
  reason: string
  source: string
  qty: number | null
  qtyLabel?: string | null
  critical?: boolean
  assumptions: string
}

export type StartCheck = {
  ok: boolean
  percent: number
  blockers: string[]
  disclaimer: string
}

export type WakeCheck = {
  id: string
  status: string
  periodKey: string
  payload: Record<string, unknown>
}

export type Evidence = {
  id: string
  title: string
  institution: string
  url: string
  kind: string
  notes: string
}

export type UserMemory = {
  id: string
  profileId: string
  title: string
  message: string
  imageFileId: string | null
  imageContentType: string | null
  imageBase64?: string | null
  createdAt: number
  updatedAt: number
}
