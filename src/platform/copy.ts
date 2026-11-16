import { uiLang } from '../locale'
export function roleLabel(role: string, en: boolean): string {
  const map: Record<string, [string, string]> = {
    chief: ['Mission Commander', 'Comandante de misión'],
    crew: ['Crew Member', 'Tripulante'],
    medic: ['Physician', 'Médico'],
    psychologist: ['Psychologist', 'Psicólogo'],
    ops: ['Operations', 'Operaciones'],
  }
  const pair = map[role]
  if (!pair) return role
  return en ? pair[0] : pair[1]
}

const PROFILE_NAMES: Record<string, string> = {
  'elena-torres': 'Elena Torres',
  'mateo-ruiz': 'Mateo Ruiz',
  'nova-hale': 'Nova Hale',
  'kenji-oka': 'Kenji Oka',
  'sofia-chen': 'Sofía Chen',
  'alex-morgan': 'Alex Morgan',
  'ops-desk': 'Mesa Ops',
}

export function profileDisplayName(profileId: string): string {
  return profileId === 'ops-desk' && uiLang() === 'en' ? 'Operations desk' : PROFILE_NAMES[profileId] || profileId
}

export function profileTitle(profile: { id: string; title: string }, en: boolean): string {
  const byId: Record<string, [string, string]> = {
    'elena-torres': ['Mission Commander (simulated)', 'Comandante de misión (simulado)'],
    'mateo-ruiz': ['Crew Member (simulated)', 'Tripulante (simulado)'],
    'nova-hale': ['Crew Member (simulated)', 'Tripulante (simulado)'],
    'kenji-oka': ['Crew Member (simulated)', 'Tripulante (simulado)'],
    'sofia-chen': ['Physician (simulated)', 'Médico'],
    'alex-morgan': ['Psychologist', 'Psicólogo'],
    'ops-desk': ['Operations / prep (demo)', 'Operaciones / preparación (demo)'],
  }
  const pair = byId[profile.id]
  if (pair) return en ? pair[0] : pair[1]
  return profile.title
}

export function stageLabel(stage: string, en: boolean): string {
  const map: Record<string, [string, string]> = {
    draft: ['Draft', 'Borrador'],
    preflight: ['Preflight', 'Preembarque'],
    aboard: ['In Flight', 'A bordo'],
    postmission: ['Completed', 'Finalizada'],
    archived: ['Archived', 'Archivada'],
    cancelled: ['Cancelled', 'Cancelada'],
  }
  const pair = map[stage]
  if (!pair) return stage
  return en ? pair[0] : pair[1]
}

export const MISSION_PROCESS_STEPS = ['draft', 'preflight', 'aboard', 'postmission'] as const

export function stageBlurb(stage: string, en: boolean): string {
  const map: Record<string, [string, string]> = {
    draft: ['Set up the mission before preparation starts.', 'Configurá la misión antes de empezar la preparación.'],
    preflight: ['Preparation checklist before flight.', 'Checklist de preparación antes del vuelo.'],
    aboard: ['In flight: health, visits, and Quirón support.', 'A bordo: salud, citas y acompañamiento de Quirón.'],
    postmission: ['Completed: history, analysis, and recommendations.', 'Finalizada: historial, análisis y recomendaciones.'],
    archived: ['Archived mission.', 'Misión archivada.'],
    cancelled: ['Cancelled mission.', 'Misión cancelada.'],
  }
  const pair = map[stage]
  if (!pair) return stage
  return en ? pair[0] : pair[1]
}

/** Mini hint under each process step in Centro / hub. */
export function stageHint(stage: string, en: boolean): string {
  const map: Record<string, [string, string]> = {
    draft: ['Set up your mission', 'Configurá la misión'],
    preflight: ['Preparation checklist', 'Checklist de preparación'],
    aboard: ['In flight', 'A bordo'],
    postmission: ['Mission Review', 'Revisión de misión'],
  }
  const pair = map[stage]
  if (!pair) return ''
  return en ? pair[0] : pair[1]
}

export function stageStepIndex(stage: string): number {
  const idx = MISSION_PROCESS_STEPS.indexOf(stage as (typeof MISSION_PROCESS_STEPS)[number])
  return idx >= 0 ? idx : 0
}