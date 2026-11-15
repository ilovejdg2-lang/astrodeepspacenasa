export function roleLabel(role: string, en: boolean): string {
  const map: Record<string, [string, string]> = {
    chief: ['Chief', 'Jefe'],
    crew: ['Crew member', 'Tripulante'],
    medic: ['Medic (simulated)', 'Médico (simulado)'],
    psychologist: ['Psychologist (simulated)', 'Psicólogo (simulado)'],
    ops: ['Operations', 'Operaciones'],
  }
  const pair = map[role]
  if (!pair) return role
  return en ? pair[0] : pair[1]
}

const PROFILE_NAMES: Record<string, string> = {
  'elena-torres': 'Elena Torres',
  'mateo-ruiz': 'Mateo Ruiz',
  'sofia-chen': 'Sofía Chen',
  'alex-morgan': 'Alex Morgan',
  'ops-desk': 'Mesa Ops',
}

export function profileDisplayName(profileId: string): string {
  return PROFILE_NAMES[profileId] || profileId
}

export function profileTitle(profile: { id: string; title: string }, en: boolean): string {
  const byId: Record<string, [string, string]> = {
    'elena-torres': ['Mission chief (demo)', 'Jefa de misión (demo)'],
    'mateo-ruiz': ['Crew member (demo)', 'Tripulante (demo)'],
    'sofia-chen': ['Simulated medic (demo)', 'Médica simulada (demo)'],
    'alex-morgan': ['Simulated psychologist (demo)', 'Psicólogo simulado (demo)'],
    'ops-desk': ['Operations / prep (demo)', 'Operaciones / preparación (demo)'],
  }
  const pair = byId[profile.id]
  if (pair) return en ? pair[0] : pair[1]
  return profile.title
}

export function stageLabel(stage: string, en: boolean): string {
  const map: Record<string, [string, string]> = {
    draft: ['Draft', 'Borrador'],
    preflight: ['Pre-flight', 'Preembarque'],
    aboard: ['Aboard', 'A bordo'],
    postmission: ['Post-mission', 'Posmisión'],
    archived: ['Archived', 'Archivada'],
    cancelled: ['Cancelled', 'Cancelada'],
  }
  const pair = map[stage]
  if (!pair) return stage
  return en ? pair[0] : pair[1]
}