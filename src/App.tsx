import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from './components/Shell'
import { PublicLayout } from './components/public/PublicLayout'
import { AppProvider } from './state/store'
import { AlertsPage } from './pages/AlertsPage'
import { AnalysisPage } from './pages/AnalysisPage'
import { CrewPage } from './pages/CrewPage'
import { HistoryPage } from './pages/HistoryPage'
import { MedicalPage } from './pages/MedicalPage'
import { MissionPage } from './pages/MissionPage'
import { MonitorPage } from './pages/MonitorPage'
import { MySpacePage } from './pages/MySpacePage'
import { ResourcesPage } from './pages/ResourcesPage'
import { RisksPage } from './pages/RisksPage'
import { ComoFuncionaPage } from './pages/public/ComoFuncionaPage'
import { DatosPage } from './pages/public/DatosPage'
import { DocumentosPage } from './pages/public/DocumentosPage'
import { HomePage } from './pages/public/HomePage'
import { NosotrosPage } from './pages/public/NosotrosPage'
import { PerfilPage } from './pages/public/PerfilPage'
import { ProyectoPage } from './pages/public/ProyectoPage'
import { VideoPage } from './pages/public/VideoPage'

function Dashboard() {
  return (
    <AppProvider>
      <Shell>
        <Routes>
          <Route index element={<MonitorPage />} />
          <Route path="mision" element={<MissionPage />} />
          <Route path="tripulacion" element={<CrewPage />} />
          <Route path="recursos" element={<ResourcesPage />} />
          <Route path="alertas" element={<AlertsPage />} />
          <Route path="historial" element={<HistoryPage />} />
          <Route path="analisis" element={<AnalysisPage />} />
          <Route path="riesgos" element={<RisksPage />} />
          <Route path="medico" element={<MedicalPage />} />
          <Route path="mi-espacio" element={<MySpacePage />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </Shell>
    </AppProvider>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="proyecto" element={<ProyectoPage />} />
          <Route path="como-funciona" element={<ComoFuncionaPage />} />
          <Route path="nosotros" element={<NosotrosPage />} />
          <Route path="nosotros/:slug" element={<PerfilPage />} />
          <Route path="video" element={<VideoPage />} />
          <Route path="documentos" element={<DocumentosPage />} />
          <Route path="datos" element={<DatosPage />} />
        </Route>
        <Route path="/app/*" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
