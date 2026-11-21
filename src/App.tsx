import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useWorkspaceRole } from './platform/workspace'
import { RouteFallback } from './components/RouteFallback'
import { Shell } from './components/Shell'
import { AppProvider } from './state/store'
import { MissionGate } from './pages/platform/MissionGate'

const EnterPage = lazy(() => import('./pages/platform/EnterPage').then((m) => ({ default: m.EnterPage })))
const MissionsHubPage = lazy(() =>
  import('./pages/platform/MissionsHubPage').then((m) => ({ default: m.MissionsHubPage })),
)
const MissionWizardPage = lazy(() =>
  import('./pages/platform/MissionWizardPage').then((m) => ({ default: m.MissionWizardPage })),
)
const CarePage = lazy(() => import('./pages/platform/CarePage').then((m) => ({ default: m.CarePage })))
const EvidencePage = lazy(() =>
  import('./pages/platform/EvidencePage').then((m) => ({ default: m.EvidencePage })),
)

const RoleHome = lazy(() => import('./pages/role/RoleHome').then((m) => ({ default: m.RoleHome })))
const MyHealthPage = lazy(() => import('./pages/role/MyHealthPage').then((m) => ({ default: m.MyHealthPage })))
const MonitorGate = lazy(() => import('./pages/role/MonitorGate').then((m) => ({ default: m.MonitorGate })))
const MonitorPage = lazy(() => import('./pages/MonitorPage').then((m) => ({ default: m.MonitorPage })))
const MissionPage = lazy(() => import('./pages/MissionPage').then((m) => ({ default: m.MissionPage })))
const CrewPage = lazy(() => import('./pages/CrewPage').then((m) => ({ default: m.CrewPage })))
const ResourcesPage = lazy(() => import('./pages/ResourcesPage').then((m) => ({ default: m.ResourcesPage })))
const AlertsPage = lazy(() => import('./pages/AlertsPage').then((m) => ({ default: m.AlertsPage })))
const HistoryPage = lazy(() => import('./pages/HistoryPage').then((m) => ({ default: m.HistoryPage })))
const AnalysisPage = lazy(() => import('./pages/AnalysisPage').then((m) => ({ default: m.AnalysisPage })))
const RisksPage = lazy(() => import('./pages/RisksPage').then((m) => ({ default: m.RisksPage })))
const MedicalPage = lazy(() => import('./pages/MedicalPage').then((m) => ({ default: m.MedicalPage })))
const MySpacePage = lazy(() => import('./pages/MySpacePage').then((m) => ({ default: m.MySpacePage })))
const MemoriesPage = lazy(() => import('./pages/MemoriesPage').then((m) => ({ default: m.MemoriesPage })))
const BiomedicalPage = lazy(() =>
  import('./pages/BiomedicalPage').then((m) => ({ default: m.BiomedicalPage })),
)

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>
}

/** A crew member sees only their own health. Clinicians and psychologists have role-restricted spaces. */
function NotForCrew({ children }: { children: ReactNode }) {
  const role = useWorkspaceRole()
  if (role === 'crew') return <Navigate to="/app/mi-salud" replace />
  if (role === 'psychologist') return <Navigate to="/app" replace />
  return children
}

function NotForPsych({ children }: { children: ReactNode }) {
  const role = useWorkspaceRole()
  if (role === 'psychologist') return <Navigate to="/app" replace />
  return children
}

function Dashboard() {
  return (
    <MissionGate>
      <AppProvider>
        <Shell>
          <LazyPage>
            <Routes>
              <Route index element={<RoleHome />} />
              <Route path="centro" element={<Navigate to="/app" replace />} />
              <Route path="monitor" element={<NotForCrew><MonitorPage /></NotForCrew>} />
              <Route path="mi-salud" element={<MyHealthPage />} />
              <Route path="mision" element={<NotForPsych><MissionPage /></NotForPsych>} />
              <Route path="tripulacion" element={<NotForCrew><CrewPage /></NotForCrew>} />
              <Route path="tripulacion/:crewId" element={<NotForCrew><MonitorGate /></NotForCrew>} />
              <Route path="recursos" element={<ResourcesPage />} />
              <Route path="alertas" element={<NotForCrew><AlertsPage /></NotForCrew>} />
              <Route path="historial" element={<NotForCrew><HistoryPage /></NotForCrew>} />
              <Route path="analisis" element={<NotForCrew><AnalysisPage /></NotForCrew>} />
              <Route path="riesgos" element={<RisksPage />} />
              <Route path="medico" element={<MedicalPage />} />
              <Route path="citas" element={<MedicalPage />} />
              <Route path="mi-espacio" element={<MySpacePage />} />
              <Route path="biomedical" element={<BiomedicalPage />} />
              <Route path="biomedical-insights" element={<BiomedicalPage />} />
              <Route path="memories" element={<MemoriesPage />} />
              <Route path="recuerdos" element={<MemoriesPage />} />
              <Route path="*" element={<Navigate to="/app" replace />} />
            </Routes>
          </LazyPage>
        </Shell>
      </AppProvider>
    </MissionGate>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <LazyPage>
              <EnterPage />
            </LazyPage>
          }
        />
        <Route path="/entrar" element={<Navigate to="/" replace />} />
        <Route
          path="/misiones"
          element={
            <LazyPage>
              <MissionsHubPage />
            </LazyPage>
          }
        />
        <Route
          path="/misiones/nueva"
          element={
            <LazyPage>
              <MissionWizardPage />
            </LazyPage>
          }
        />
        <Route
          path="/misiones/cuidado"
          element={
            <LazyPage>
              <CarePage />
            </LazyPage>
          }
        />
        <Route
          path="/misiones/evidencia"
          element={
            <LazyPage>
              <EvidencePage />
            </LazyPage>
          }
        />
        <Route path="/app/*" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
