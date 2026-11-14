import type { AlertType, EpisodeStatus, Integrity, LinkStatus, MeasurementKind, MovementType, SharedRequestLevel } from '../../shared/types'
import { KIND_LABEL } from '../../shared/types'

const mission = new Intl.DateTimeFormat('es', {
  timeZone: 'UTC',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

const clockOnly = new Intl.DateTimeFormat('es', {
  timeZone: 'UTC',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatMission(ms: number): string {
  return mission.format(ms).replace('.', '')
}

export function formatClock(ms: number): string {
  return clockOnly.format(ms)
}

export function formatValue(kind: MeasurementKind, value: number): string {
  if (kind === 'temperature' || kind === 'sleep_hours') return value.toFixed(1)
  return String(Math.round(value))
}

export function formatMeasurement(kind: MeasurementKind, value: number, unit: string): string {
  return `${formatValue(kind, value)} ${unit}`
}

export function kindLabel(kind: MeasurementKind): string {
  return KIND_LABEL[kind]
}

export function ageLabel(now: number, then: number): string {
  const delta = Math.max(0, now - then)
  const minutes = Math.round(delta / 60000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 36) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  return `hace ${days} días`
}

const ALERT_TYPE: Record<AlertType, string> = {
  change: 'Cambio observado',
  symptom: 'Síntomas',
  missing: 'Sin datos recientes',
  quality: 'Calidad pendiente',
  repeated: 'Mensaje repetido',
  altered: 'Mensaje alterado',
  comms: 'Comunicación pendiente',
}

const INTEGRITY: Record<Integrity, string> = {
  valid: 'Válida',
  pending: 'Integridad pendiente',
  stale: 'Antigua',
}

const EPISODE: Record<EpisodeStatus, string> = {
  open: 'Abierto',
  following: 'En seguimiento',
  closed: 'Cerrado',
}

const MOVEMENT: Record<MovementType, string> = {
  use: 'Uso',
  restock: 'Reposición',
  adjust: 'Ajuste',
  create: 'Alta',
  edit: 'Edición',
}

const REJECT: Record<string, string> = {
  duplicate: 'Repetido',
  altered: 'Alterado',
  out_of_order: 'Fuera de orden',
}

export function alertTypeLabel(type: AlertType): string {
  return ALERT_TYPE[type]
}

export function integrityLabel(value: Integrity): string {
  return INTEGRITY[value]
}

export function episodeStatusLabel(status: EpisodeStatus): string {
  return EPISODE[status]
}

export function movementLabel(type: MovementType): string {
  return MOVEMENT[type]
}

export function rejectLabel(reason: string): string {
  return REJECT[reason] ?? reason
}

const AUDIT: Record<string, string> = {
  'set-link': 'Enlace',
  'ack-alert': 'Aviso confirmado',
  'set-alert-status': 'Estado de alerta',
  'resolve-sensor': 'Sensor resuelto',
  'use-resource': 'Uso de recurso',
  'adjust-resource': 'Ajuste de inventario',
  'create-resource': 'Alta de recurso',
  'edit-resource': 'Edición de recurso',
  'draft-communication': 'Borrador',
  'comm-queued': 'En cola',
  'comm-sent': 'Enviado',
  'comm-received': 'Recibido',
  'record-analysis': 'Análisis',
  'register-symptom': 'Síntomas',
  'raise-space-alert': 'Contacto desde Mi espacio',
  'send-space-request': 'Solicitud desde Mi espacio',
  'repeat-measurement': 'Medición repetida',
  'reject-duplicate': 'Mensaje repetido',
  'reject-altered': 'Mensaje alterado',
  'reject-out_of_order': 'Mensaje fuera de orden',
}

const ROLE: Record<string, string> = {
  medical: 'Equipo médico',
  astronaut: 'Astronauta',
  ops: 'Operaciones',
}

export function auditActionLabel(action: string): string {
  return AUDIT[action] ?? action
}

const SHARE: Record<SharedRequestLevel, string> = {
  generica: 'Genérica',
  medico: 'Médico de vuelo',
  equipo: 'Equipo',
}

export function shareLevelLabel(level: SharedRequestLevel): string {
  return SHARE[level]
}

export function roleLabel(role: string): string {
  return ROLE[role] ?? role
}

export function linkLabel(link: LinkStatus, delayMin: number): string {
  if (link === 'down') return 'Enlace Tierra: sin conexión'
  if (link === 'delayed') return `Enlace Tierra: con demora · ~${delayMin} min`
  return 'Enlace Tierra: en línea'
}
