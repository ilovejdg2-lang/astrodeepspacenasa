import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from './components/Shell'
import { AppProvider } from './state/store'
import { AlertsPage } from './pages/AlertsPage'
import { AnalysisPage } from './pages/AnalysisPage'
import { CrewPage } from './pages/CrewPage'
import { HistoryPage } from './pages/HistoryPage'
import { MedicalPage } from './pages/MedicalPage'
import { MonitorPage } from './pages/MonitorPage'
import { MySpacePage } from './pages/MySpacePage'
import { ResourcesPage } from './pages/ResourcesPage'

export function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Shell>
          <Routes>
            <Route path="/" element={<MonitorPage />} />
            <Route path="/tripulacion" element={<CrewPage />} />
            <Route path="/recursos" element={<ResourcesPage />} />
            <Route path="/alertas" element={<AlertsPage />} />
            <Route path="/historial" element={<HistoryPage />} />
            <Route path="/analisis" element={<AnalysisPage />} />
            <Route path="/medico" element={<MedicalPage />} />
            <Route path="/mi-espacio" element={<MySpacePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Shell>
      </BrowserRouter>
    </AppProvider>
  )
}
