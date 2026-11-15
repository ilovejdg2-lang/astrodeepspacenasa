import { Navigate } from 'react-router-dom'
import { useWorkspaceRole } from '../../platform/workspace'
import { MonitorPage } from '../MonitorPage'

/** Chief uses Mission center instead of the leaner Monitor module. */
export function MonitorGate() {
  const role = useWorkspaceRole()
  if (role === 'chief') return <Navigate to="/app/centro" replace />
  return <MonitorPage />
}
