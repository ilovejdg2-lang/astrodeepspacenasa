import { Navigate } from 'react-router-dom'

/** Mission Command Hub was removed per user request. Chief now redirects directly to Crew Monitor. */
export function ChiefHome() {
  return <Navigate to="/app/monitor" replace />
}
