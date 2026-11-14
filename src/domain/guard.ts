import { STATE_VERSION, type AppState } from '../../shared/types'

export function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false
  const record = value as Partial<AppState>
  return (
    record.stateVersion === STATE_VERSION &&
    Array.isArray(record.measurements) &&
    Array.isArray(record.resources) &&
    Array.isArray(record.alerts) &&
    Array.isArray(record.symptoms) &&
    Array.isArray(record.communications) &&
    typeof record.scenarioId === 'string' &&
    !!record.clock &&
    typeof record.clock.simulatedAt === 'number'
  )
}
