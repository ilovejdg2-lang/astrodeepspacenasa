import { Navigate } from 'react-router-dom'
import { useWorkspaceRole } from '../../platform/workspace'
import { MonitorPage } from '../MonitorPage'

/** Crew members see only their own health; other roles see mission/crew monitoring. */
export function MonitorGate() {
  const role = useWorkspaceRole()
  if (role === 'crew') return <Navigate to="/app/mi-salud" replace />
  return <MonitorPage />
}
