import { Navigate } from 'react-router-dom'
import { useWorkspaceRole } from '../../platform/workspace'
import { MonitorPage } from '../MonitorPage'

/** The commander uses Mission center; crew members see only their own health. */
export function MonitorGate() {
  const role = useWorkspaceRole()
  if (role === 'chief') return <Navigate to="/app/centro" replace />
  if (role === 'crew') return <Navigate to="/app/mi-salud" replace />
  return <MonitorPage />
}
