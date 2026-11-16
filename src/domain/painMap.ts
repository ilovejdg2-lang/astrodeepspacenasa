/**
 * HELIOS mannequin v1.
 * Original procedural diagram for HELIOS. No third-party body mesh.
 * Proportions are a stylized adult figure so regions can be told apart.
 * There is no intimate detail and no organ geometry.
 *
 * Model space, meters, right-handed, Y-up:
 *   +Y superior, +Z anterior (the figure faces +Z), +X the person's left.
 * Left and right are the person's left and right, never the side of the screen.
 * Marks store localPosition in this frame, plus normal, surfaceId, regionId,
 * model id and version. Screen pixels are not stored, so a mark stays put when
 * the viewport resizes, the camera orbits, or another device opens the report.
 *
 * Torso height bands (model Y): below 0.96 pelvis, below 1.14 abdomen/lower back,
 * otherwise chest/upper back. The mannequin mesh uses the same bands.
 * If the mesh changes, bump PAIN_MODEL.version and keep regionId strings.
 * The textual region remains available when the 3D view cannot load.
 */
export const PAIN_MODEL = { id: 'helios-mannequin', version: '1' } as const

export const TORSO_BANDS = { pelvisBelow: 0.96, abdomenBelow: 1.14, faceBelow: 1.66 } as const

export type Vec3 = { x: number; y: number; z: number }
export type PainLaterality = 'left' | 'right' | 'midline'
export type PainAspect = 'anterior' | 'posterior' | 'lateral' | 'unspecified'
export type PainPattern = 'constant' | 'intermittent'
export type PainFollowUp = 'open' | 'monitoring' | 'resolved'

export type BodyRegion = { id: string; en: string; es: string; limb: boolean }

export const BODY_REGIONS: BodyRegion[] = [
  { id: 'head', en: 'Head', es: 'Cabeza', limb: false },
  { id: 'face', en: 'Face', es: 'Rostro', limb: false },
  { id: 'neck', en: 'Neck', es: 'Cuello', limb: false },
  { id: 'shoulder', en: 'Shoulder', es: 'Hombro', limb: true },
  { id: 'chest', en: 'Chest', es: 'Pecho', limb: false },
  { id: 'upper_back', en: 'Upper back', es: 'Espalda alta', limb: false },
  { id: 'abdomen', en: 'Abdomen', es: 'Abdomen', limb: false },
  { id: 'lower_back', en: 'Lower back', es: 'Espalda baja', limb: false },
  { id: 'pelvis', en: 'Pelvis', es: 'Pelvis', limb: false },
  { id: 'upper_arm', en: 'Upper arm', es: 'Brazo', limb: true },
  { id: 'elbow', en: 'Elbow', es: 'Codo', limb: true },
  { id: 'forearm', en: 'Forearm', es: 'Antebrazo', limb: true },
  { id: 'hand', en: 'Hand', es: 'Mano', limb: true },
  { id: 'hip', en: 'Hip', es: 'Cadera', limb: true },
  { id: 'thigh', en: 'Thigh', es: 'Muslo', limb: true },
  { id: 'knee', en: 'Knee', es: 'Rodilla', limb: true },
  { id: 'lower_leg', en: 'Lower leg', es: 'Pierna', limb: true },
  { id: 'foot', en: 'Foot', es: 'Pie', limb: true },
]

export type LimbPart = {
  surfaceId: string
  regionId: string
  laterality: 'left' | 'right'
  position: Vec3
  radius: number
  length: number
  shape: 'capsule' | 'sphere'
}

function limb(surfaceId: string, regionId: string, laterality: 'left' | 'right', position: Vec3, radius: number, length: number, shape: LimbPart['shape'] = 'capsule'): LimbPart {
  const sign = laterality === 'left' ? 1 : -1
  return { surfaceId, regionId, laterality, position: { x: sign * position.x, y: position.y, z: position.z }, radius, length, shape }
}

const LEFT_LIMBS: Array<[string, string, Vec3, number, number, LimbPart['shape']]> = [
  ['shoulder', 'shoulder', { x: 0.23, y: 1.36, z: 0 }, 0.06, 0.02, 'sphere'],
  ['upper-arm', 'upper_arm', { x: 0.32, y: 1.16, z: 0.01 }, 0.045, 0.22, 'capsule'],
  ['elbow', 'elbow', { x: 0.34, y: 1.0, z: 0.02 }, 0.048, 0.02, 'sphere'],
  ['forearm', 'forearm', { x: 0.36, y: 0.86, z: 0.03 }, 0.038, 0.2, 'capsule'],
  ['hand', 'hand', { x: 0.38, y: 0.7, z: 0.04 }, 0.04, 0.06, 'sphere'],
  ['hip', 'hip', { x: 0.11, y: 0.86, z: 0 }, 0.07, 0.04, 'sphere'],
  ['thigh', 'thigh', { x: 0.11, y: 0.64, z: 0.01 }, 0.06, 0.28, 'capsule'],
  ['knee', 'knee', { x: 0.11, y: 0.46, z: 0.02 }, 0.05, 0.02, 'sphere'],
  ['lower-leg', 'lower_leg', { x: 0.11, y: 0.28, z: 0.01 }, 0.045, 0.26, 'capsule'],
  ['foot', 'foot', { x: 0.12, y: 0.05, z: 0.06 }, 0.04, 0.12, 'capsule'],
]

export const LIMB_PARTS: LimbPart[] = LEFT_LIMBS.flatMap(([surface, region, position, radius, length, shape]) => [
  limb(`${surface}-l`, region, 'left', position, radius, length, shape),
  limb(`${surface}-r`, region, 'right', position, radius, length, shape),
])

const LIMB_BY_SURFACE = new Map(LIMB_PARTS.map((part) => [part.surfaceId, part]))

export type PainMark = {
  id: string
  kind: 'point' | 'region'
  regionId: string
  detectedRegionId: string
  regionLabel: string
  labelSource: 'auto' | 'user'
  laterality: PainLaterality
  aspect: PainAspect
  localPosition: Vec3
  normal: Vec3
  surfaceId: string
  intensity: number
  startedAt: number | null
  pattern: PainPattern
  description: string
  activity: string
  additionalSymptoms: string
  notes: string
}

export type PainRevision = {
  at: number
  actorProfileId: string
  action: 'created' | 'corrected' | 'status' | 'linked'
  note: string
  marks: PainMark[]
}

export type ClinicalPainNote = {
  id: string
  authorProfileId: string
  appointmentId: string | null
  body: string
  createdAt: number
}

export type PainMapReport = {
  id: string
  missionId: string
  profileId: string
  symptomReportId: string | null
  appointmentId: string | null
  modelId: string
  modelVersion: string
  origin: 'self_report'
  status: PainFollowUp
  marks: PainMark[]
  revisions: PainRevision[]
  clinicalNotes: ClinicalPainNote[]
  followsReportId: string | null
  createdAt: number
  updatedAt: number
}

export type PainDraftMark = Omit<PainMark, 'intensity' | 'pattern'> & {
  intensity: number | null
  pattern: PainPattern | ''
}

export type BodyHit = {
  kind: 'point' | 'region'
  regionId: string
  laterality: PainLaterality
  aspect: PainAspect
  localPosition: Vec3
  normal: Vec3
  surfaceId: string
}

export function regionById(id: string): BodyRegion | undefined {
  return BODY_REGIONS.find((item) => item.id === id)
}

export function regionName(id: string, en: boolean): string {
  const region = regionById(id)
  if (!region) return id
  return en ? region.en : region.es
}

export function sidesFor(regionId: string): PainLaterality[] {
  return regionById(regionId)?.limb ? ['left', 'right'] : ['left', 'right', 'midline']
}

/**
 * Drawing helper only. Stored marks never use this value.
 * On the front diagram the person's left is on the right of the picture.
 * On the back diagram the person's left is on the left of the picture.
 */
export function diagramX(facing: 'anterior' | 'posterior', side: PainLaterality, offset: number, center = 110): number {
  if (side === 'midline') return center
  const screenRight = facing === 'anterior' ? side === 'left' : side === 'right'
  return center + (screenRight ? offset : -offset)
}

/** +X is the person's left. Screen position is not an input. */
export function sideFromX(x: number, midline = 0.045): PainLaterality {
  if (Math.abs(x) < midline) return 'midline'
  return x > 0 ? 'left' : 'right'
}

export function aspectFromNormal(normal: Vec3): PainAspect {
  const ax = Math.abs(normal.x)
  const ay = Math.abs(normal.y)
  const az = Math.abs(normal.z)
  if (ay > ax && ay > az && ay > 0.65) return 'unspecified'
  if (ax > az && ax > 0.45) return 'lateral'
  if (az >= 0.25) return normal.z >= 0 ? 'anterior' : 'posterior'
  if (ax >= 0.25) return 'lateral'
  return 'unspecified'
}

export function classifyHit(surfaceId: string, point: Vec3, normal: Vec3): Pick<BodyHit, 'regionId' | 'laterality' | 'aspect'> {
  const aspect = aspectFromNormal(normal)
  const limbPart = LIMB_BY_SURFACE.get(surfaceId)
  if (limbPart) return { regionId: limbPart.regionId, laterality: limbPart.laterality, aspect }
  if (surfaceId === 'head') {
    const regionId = normal.z > 0.35 && point.y < TORSO_BANDS.faceBelow ? 'face' : 'head'
    return { regionId, laterality: sideFromX(point.x, 0.04), aspect }
  }
  if (surfaceId === 'neck') return { regionId: 'neck', laterality: sideFromX(point.x, 0.03), aspect }
  if (surfaceId === 'pelvis-cover' || point.y < TORSO_BANDS.pelvisBelow) {
    return { regionId: 'pelvis', laterality: sideFromX(point.x, 0.05), aspect }
  }
  if (point.y < TORSO_BANDS.abdomenBelow) {
    return {
      regionId: aspect === 'posterior' ? 'lower_back' : 'abdomen',
      laterality: sideFromX(point.x),
      aspect,
    }
  }
  return {
    regionId: aspect === 'posterior' ? 'upper_back' : 'chest',
    laterality: sideFromX(point.x),
    aspect,
  }
}

function torsoAnchor(regionId: string, laterality: PainLaterality, aspect: PainAspect): { localPosition: Vec3; normal: Vec3; surfaceId: string } {
  const x = laterality === 'left' ? 0.08 : laterality === 'right' ? -0.08 : 0
  const table: Record<string, { y: number; surfaceId: string }> = {
    head: { y: 1.66, surfaceId: 'head' },
    face: { y: 1.58, surfaceId: 'head' },
    neck: { y: 1.47, surfaceId: 'neck' },
    chest: { y: 1.24, surfaceId: 'torso' },
    upper_back: { y: 1.24, surfaceId: 'torso' },
    abdomen: { y: 1.04, surfaceId: 'torso' },
    lower_back: { y: 1.04, surfaceId: 'torso' },
    pelvis: { y: 0.86, surfaceId: 'pelvis-cover' },
  }
  const row = table[regionId] ?? { y: 1.24, surfaceId: 'torso' }
  const posterior = regionId === 'upper_back' || regionId === 'lower_back' || aspect === 'posterior'
  const normal: Vec3 = aspect === 'lateral'
    ? { x: x >= 0 ? 1 : -1, y: 0, z: 0 }
    : posterior
      ? { x: 0, y: 0, z: -1 }
      : { x: 0, y: 0, z: 1 }
  const z = posterior ? -0.11 : 0.12
  return {
    surfaceId: row.surfaceId,
    normal,
    localPosition: { x: regionId === 'head' || regionId === 'face' || regionId === 'neck' ? x * 0.4 : x, y: row.y, z: regionId === 'face' ? 0.1 : z },
  }
}

export function anchorFor(regionId: string, laterality: PainLaterality, aspect: PainAspect): { localPosition: Vec3; normal: Vec3; surfaceId: string } {
  const side = laterality === 'right' ? 'right' : 'left'
  const limbPart = LIMB_PARTS.find((part) => part.regionId === regionId && part.laterality === side)
  if (limbPart && laterality !== 'midline') {
    const normal: Vec3 = aspect === 'posterior'
      ? { x: 0, y: 0, z: -1 }
      : aspect === 'lateral'
        ? { x: limbPart.laterality === 'left' ? 1 : -1, y: 0, z: 0 }
        : { x: 0, y: 0, z: 1 }
    return {
      surfaceId: limbPart.surfaceId,
      normal,
      localPosition: {
        x: limbPart.position.x + normal.x * limbPart.radius,
        y: limbPart.position.y,
        z: limbPart.position.z + normal.z * limbPart.radius,
      },
    }
  }
  return torsoAnchor(regionId, laterality, aspect === 'unspecified' ? 'anterior' : aspect)
}

export function sideLabel(side: PainLaterality, en: boolean): string {
  if (side === 'left') return en ? "Person's left" : 'Lado izquierdo de la persona'
  if (side === 'right') return en ? "Person's right" : 'Lado derecho de la persona'
  return en ? 'Midline' : 'Línea media'
}

export function aspectLabel(aspect: PainAspect, en: boolean): string {
  const copy = {
    anterior: en ? 'Front' : 'Frente',
    posterior: en ? 'Back' : 'Espalda',
    lateral: en ? 'Side' : 'Lateral',
    unspecified: en ? 'Not specified' : 'Sin especificar',
  }
  return copy[aspect]
}

export function displayRegion(mark: { regionId: string; regionLabel: string; labelSource: 'auto' | 'user' }, en: boolean): string {
  if (mark.labelSource === 'user' && mark.regionLabel.trim()) return mark.regionLabel.trim()
  return regionName(mark.regionId, en)
}

export function newDraftMark(hit: BodyHit): PainDraftMark {
  return {
    id: crypto.randomUUID(),
    kind: hit.kind,
    regionId: hit.regionId,
    detectedRegionId: hit.regionId,
    regionLabel: regionName(hit.regionId, true),
    labelSource: 'auto',
    laterality: hit.laterality,
    aspect: hit.aspect,
    localPosition: hit.localPosition,
    normal: hit.normal,
    surfaceId: hit.surfaceId,
    intensity: null,
    startedAt: null,
    pattern: '',
    description: '',
    activity: '',
    additionalSymptoms: '',
    notes: '',
  }
}

export function draftComplete(mark: PainDraftMark): mark is PainDraftMark & { intensity: number; pattern: PainPattern } {
  return mark.intensity != null && mark.intensity >= 0 && mark.intensity <= 10 && (mark.pattern === 'constant' || mark.pattern === 'intermittent') && mark.description.trim().length > 0 && Boolean(regionById(mark.regionId))
}

export function toPainMark(mark: PainDraftMark): PainMark | null {
  if (!draftComplete(mark)) return null
  return {
    ...mark,
    intensity: mark.intensity,
    pattern: mark.pattern,
    description: mark.description.trim(),
    regionLabel: mark.labelSource === 'user' ? mark.regionLabel.trim() : regionName(mark.regionId, true),
  }
}

export type PainDraft = {
  v: 1
  marks: PainDraftMark[]
  followsReportId: string | null
  correctingId: string | null
  appointmentId: string | null
}

export function draftStorageKey(missionId: string, profileId: string): string {
  return `helios.pain.draft.${missionId}.${profileId}`
}

export function readPainDraft(missionId: string, profileId: string): PainDraft | null {
  try {
    const raw = sessionStorage.getItem(draftStorageKey(missionId, profileId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as PainDraft
    if (parsed?.v !== 1 || !Array.isArray(parsed.marks)) return null
    return parsed
  } catch {
    return null
  }
}

export function writePainDraft(missionId: string, profileId: string, draft: PainDraft): void {
  try { sessionStorage.setItem(draftStorageKey(missionId, profileId), JSON.stringify(draft)) } catch { /* ignore quota */ }
}

export function clearPainDraft(missionId: string, profileId: string): void {
  try { sessionStorage.removeItem(draftStorageKey(missionId, profileId)) } catch { /* ignore */ }
}

export function webglAvailable(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export const VIEW_PREF_KEY = 'helios.pain.view'

export function painHelp(en: boolean): string {
  return en
    ? 'Select where you feel pain. You can rotate the body to mark the front, back, or sides.'
    : 'Marcá dónde sentís el dolor. Podés girar el cuerpo para indicar el frente, la espalda o los costados.'
}

export function painDisclaimer(en: boolean): string {
  return en
    ? 'You are marking an approximate place on a body diagram. It is not a validated anatomical location, and it does not identify an organ.'
    : 'Estás marcando un lugar aproximado en un diagrama del cuerpo. No es una localización anatómica validada y no identifica un órgano.'
}

export function intensityNote(en: boolean): string {
  return en
    ? 'Self-reported intensity from 0 to 10. The number alone is not a diagnosis or an urgency level.'
    : 'Intensidad autorreportada de 0 a 10. El número por sí solo no es un diagnóstico ni un nivel de urgencia.'
}
