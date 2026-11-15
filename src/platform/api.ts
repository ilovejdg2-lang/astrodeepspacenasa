import { apiUrl } from '../api/baseUrl'
import { getActiveMissionId, getSessionToken } from './session'

async function platformFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const token = getSessionToken()
  if (token) headers.set('X-Helios-Session', token)
  const missionId = getActiveMissionId()
  if (missionId) headers.set('X-Helios-Mission', missionId)
  const response = await fetch(apiUrl(path), { ...init, headers })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = typeof data?.message === 'string'
      ? data.message
      : Array.isArray(data?.message)
        ? data.message.join(', ')
        : `Error ${response.status}`
    throw new Error(message)
  }
  return data as T
}

export const platformApi = {
  profiles: () => platformFetch<{ profiles: Profile[] }>('/api/platform/profiles'),
  select: (profileId: string) =>
    platformFetch<{ token: string; profile: Profile; expiresAt: number }>('/api/platform/auth/select', {
      method: 'POST',
      body: JSON.stringify({ profileId }),
    }),
  me: () => platformFetch<{ profile: Profile }>('/api/platform/me'),
  missions: () => platformFetch<{ items: MissionRow[] }>('/api/platform/missions'),
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
  grants: (id: string) => platformFetch<{ items: unknown[]; chief: { sharesWithChief: string[]; neverAutoShared: string[]; note: string } }>(`/api/platform/missions/${id}/grants`),
  grant: (id: string, body: Record<string, unknown>) =>
    platformFetch(`/api/platform/missions/${id}/grants`, { method: 'POST', body: JSON.stringify(body) }),
  revokeGrant: (grantId: string) => platformFetch(`/api/platform/grants/${grantId}/revoke`, { method: 'POST', body: '{}' }),
  quironStart: (id: string, mode: 'physical' | 'emotional') =>
    platformFetch(`/api/platform/missions/${id}/quiron`, { method: 'POST', body: JSON.stringify({ mode }) }),
  quironMessage: (conversationId: string, text: string) =>
    platformFetch(`/api/platform/quiron/${conversationId}/message`, { method: 'POST', body: JSON.stringify({ text }) }),
  quironSummary: (conversationId: string, body: string, shareWith: string | null) =>
    platformFetch(`/api/platform/quiron/${conversationId}/summary`, {
      method: 'POST',
      body: JSON.stringify({ body, shareWith }),
    }),
  urgent: (id: string) => platformFetch(`/api/platform/missions/${id}/urgent`, { method: 'POST', body: '{}' }),
  appointments: (id: string) => platformFetch<{ items: unknown[] }>(`/api/platform/missions/${id}/appointments`),
  requestAppointment: (id: string, body: Record<string, unknown>) =>
    platformFetch(`/api/platform/missions/${id}/appointments`, { method: 'POST', body: JSON.stringify(body) }),
  confirmAppointment: (appointmentId: string, accept: boolean) =>
    platformFetch(`/api/platform/appointments/${appointmentId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ accept }),
    }),
  evidence: () => platformFetch<{ items: Evidence[] }>('/api/platform/evidence'),
}

export type Profile = {
  id: string
  displayName: string
  title: string
  demoRole: string
  avatarKey: string | null
}

export type Mission = {
  id: string
  code: string
  name: string
  destination: string
  stage: string
  plannedStart: string | null
  durationDays: number
  plannedCrewCount: number
  timezone: string
  activities: string[]
  commsNotes: string
  storageNotes: string
  prepPercent: number
  rosterLocked?: boolean
  createdBy: string
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
}

export type PrepSuggestion = {
  title: string
  category: string
  reason: string
  source: string
  qty: number | null
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