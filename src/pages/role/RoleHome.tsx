import { Navigate } from 'react-router-dom'
import { getStoredProfile } from '../../platform/session'
import { resolveAuthorizedRole, useWorkspaceRole } from '../../platform/workspace'
import { ChiefHome } from './ChiefHome'
import { MedicHome } from './MedicHome'
import { PsychHome } from './PsychHome'

export function RoleHome() {
  const stored = useWorkspaceRole()
  const profile = getStoredProfile()
  const resolved = stored || resolveAuthorizedRole(profile?.demoRole || '', profile?.demoRole)

  if (resolved === 'chief') return <ChiefHome />
  if (resolved === 'medic') return <MedicHome />
  if (resolved === 'psychologist') return <PsychHome />
  if (resolved === 'crew') return <Navigate to="/app/mi-salud" replace />

  return <Navigate to="/entrar" replace />
}
