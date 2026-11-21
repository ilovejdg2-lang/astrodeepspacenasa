import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/outfit/300.css'
import '@fontsource/outfit/400.css'
import '@fontsource/outfit/500.css'
import '@fontsource/outfit/600.css'
import '@fontsource/outfit/700.css'
import '@fontsource/outfit/800.css'
import { App } from './App'
import { LocaleProvider } from './i18n'
import './index.css'
import { hardenDomAgainstExternalMutations } from './domHarden'

// Auto-reload and recover when a new deployment invalidates old hashed chunks
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  const last = Number(sessionStorage.getItem('helios_chunk_reload') || '0')
  if (Date.now() - last > 5000) {
    sessionStorage.setItem('helios_chunk_reload', String(Date.now()))
    window.location.reload()
  }
})

window.addEventListener('error', (event) => {
  const msg = String(event?.message || '')
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Expected a JavaScript-or-Wasm module script') ||
    msg.includes('error loading dynamically imported module')
  ) {
    const last = Number(sessionStorage.getItem('helios_chunk_reload') || '0')
    if (Date.now() - last > 5000) {
      sessionStorage.setItem('helios_chunk_reload', String(Date.now()))
      window.location.reload()
    }
  }
})

hardenDomAgainstExternalMutations()

const root = document.getElementById('root')
if (!root) throw new Error('No se encontró #root')
createRoot(root).render(
  <StrictMode>
    <LocaleProvider>
      <App />
    </LocaleProvider>
  </StrictMode>,
)

if (import.meta.env.PROD) {
  void import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }))
}

void import('./platform/offlineQueue').then(({ startOfflineQueueListener }) => {
  startOfflineQueueListener()
})
