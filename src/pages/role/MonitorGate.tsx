import { Navigate, useLocation } from 'react-router-dom'
import { useWorkspaceRole } from '../../platform/workspace'
import { useApp } from '../../state/store'
import { MonitorPage } from '../MonitorPage'

/** Keep legacy monitoring links pointing to the individual crew record. */
export function MonitorGate() {
  const role = useWorkspaceRole()
  const { pathname } = useLocation()
  const { state } = useApp()
  if (pathname.startsWith('/app/monitor')) return <Navigate to={`/app/tripulacion/${state.selectedCrewId}`} replace />
  if (role === 'chief') return <Navigate to="/app/centro" replace />
  return <MonitorPage />
}
