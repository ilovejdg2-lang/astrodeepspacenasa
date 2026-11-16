import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { readStored } from '../../locale'
import { getActiveMissionId, getSessionToken } from '../../platform/session'

/** Care lives in the dashboard at /app/mi-salud. */
export function CarePage() {
  useEffect(() => {
    document.title = readStored() === 'es' ? 'HELIOS · Mi salud' : 'HELIOS · My Health'
  }, [])

  if (!getSessionToken()) return <Navigate to="/entrar" replace />
  if (!getActiveMissionId()) return <Navigate to="/misiones" replace />
  return <Navigate to="/app/mi-salud" replace />
}