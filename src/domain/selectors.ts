import type { Alert, AppState, CrewId, Episode, Measurement, MeasurementKind } from '../../shared/types'
import { FRESH_MS, SLEEP_FRESH_MS, STALE_GAP_MS } from './constants'
import { crewById } from './crew'

export type ObservedKind = 'stable' | 'change' | 'no_recent_evaluation'
export type EvidenceKind = 'actualizada' | 'incompleta' | 'pendiente' | 'no_confiable'

export interface CrewPosture {
  observed: ObservedKind
  evidence: EvidenceKind
  summary: string
  evidenceDetail: string
}

export function isReliable(measurement: Measurement, now: number): boolean {
  if (measurement.integrity !== 'valid') return false
  if (measurement.measuredAt > now || measurement.receivedAt > now || measurement.signalQuality === 0) return false
  if (measurement.origin === 'link' && measurement.macValid !== true) return false
  if (measurement.receivedAt - measurement.measuredAt > STALE_GAP_MS) return false
  const window = measurement.kind === 'sleep_hours' ? SLEEP_FRESH_MS : FRESH_MS
  return now - measurement.measuredAt <= window
}

export function measurementsFor(state: AppState, crewId: CrewId, kind?: MeasurementKind): Measurement[] {
  return state.measurements
    .filter((item) => item.crewId === crewId && (kind === undefined || item.kind === kind))
    .slice()
    .sort((a, b) => a.measuredAt - b.measuredAt || a.sequence - b.sequence)
}

export function latestMeasurement(state: AppState, crewId: CrewId, kind: MeasurementKind): Measurement | undefined {
  return measurementsFor(state, crewId, kind).at(-1)
}

export function latestReliable(state: AppState, crewId: CrewId, kind: MeasurementKind): Measurement | undefined {
  return measurementsFor(state, crewId, kind)
    .filter((item) => isReliable(item, state.clock.simulatedAt))
    .at(-1)
}

export function openEpisode(state: AppState, crewId: CrewId): Episode | undefined {
  return state.episodes.find((episode) => episode.crewId === crewId && episode.status !== 'closed')
}

export function crewPosture(state: AppState, crewId: CrewId): CrewPosture {
  const profile = crewById(crewId)
  const reliable = latestReliable(state, crewId, 'heart_rate')
  const latest = latestMeasurement(state, crewId, 'heart_rate')
  const symptoms = state.symptoms.filter((item) => item.crewId === crewId)
  const unreliable =
    state.alerts.some(
      (alert) =>
        alert.crewId === crewId &&
        alert.status !== 'closed' &&
        (alert.type === 'quality' || alert.type === 'repeated' || alert.type === 'altered'),
    ) ||
    latest?.integrity === 'pending' ||
    latest?.integrity === 'stale' ||
    state.rejected.some((item) => item.sensorId === latest?.sensorId && item.reason === 'altered')

  if (!reliable) {
    return {
      observed: 'no_recent_evaluation',
      evidence: unreliable ? 'no_confiable' : 'pendiente',
      summary: 'No hay una medición confiable reciente. Esto no indica un estado estable.',
      evidenceDetail: latest
        ? `La última lectura de frecuencia cardíaca es de ${latest.value} ${latest.unit} y no se usa como evaluación actual (${latest.integrity === 'stale' ? 'dato antiguo' : 'integridad no válida'}).`
        : 'No llegó una lectura reciente de frecuencia cardíaca.',
    }
  }

  const above = reliable.value > profile.baseline.hrMax
  const hasRestControl = measurementsFor(state, crewId, 'heart_rate').some(
    (item) => item.context === 'rest-control' && item.measuredAt >= reliable.measuredAt && isReliable(item, state.clock.simulatedAt),
  )
  if (above || symptoms.length > 0) {
    return {
      observed: 'change',
      evidence: hasRestControl && !unreliable ? 'actualizada' : unreliable ? 'no_confiable' : 'incompleta',
      summary: above
        ? `La frecuencia cardíaca (${Math.round(reliable.value)} lpm) está por encima de su línea base (${profile.baseline.hrMin}–${profile.baseline.hrMax} lpm).`
        : 'Hay síntomas reportados. Las cifras por sí solas no cierran la evaluación.',
      evidenceDetail: hasRestControl
        ? 'Hay una repetición marcada en reposo. Sigue haciendo falta revisión humana.'
        : 'Falta una medición de control en reposo o hay un problema de integridad. La calidad de señal no es una certeza clínica.',
    }
  }

  return {
    observed: 'stable',
    evidence: unreliable ? 'no_confiable' : 'actualizada',
    summary: `La última frecuencia cardíaca confiable (${Math.round(reliable.value)} lpm) está dentro de su línea base.`,
    evidenceDetail: unreliable
      ? 'Hay un aviso de integridad abierto. La cifra confiable no anula ese aviso.'
      : 'La evidencia reciente está disponible y no muestra un cambio respecto a su línea base.',
  }
}

export function activeAlerts(state: AppState, status?: Alert['status']): Alert[] {
  return state.alerts.filter((alert) => (status ? alert.status === status : alert.status !== 'closed'))
}
