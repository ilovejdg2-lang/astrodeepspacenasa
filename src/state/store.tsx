import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react'
import type { AppState, CrewId, AnalysisResult } from '../../shared/types'
import { ApiError, SimulationClient } from '../api/simulation'
import { createInitialState } from '../domain/scenarios'
import { answerLocal } from '../domain/analysis'
import { reduce, type Action } from '../domain/reduce'
import { clearPrivate } from '../persistence/private'
import { clearSpace } from '../persistence/space'
import { HeliosLogo } from '../components/HeliosLogo'
import { loadState, saveState } from '../persistence/db'

interface StoreValue {
  state: AppState
  backendMode: 'connected' | 'local_simulator'
  backendError: string | null
  persistenceError: string | null
  saving: boolean
  authenticatedCrewId: CrewId | null
  dispatch: (action: Action) => void
  analyzeEpisode: (episodeId: string, question?: string) => Promise<AnalysisResult>
  unlockSpace: (crewId: CrewId) => void
  restoreDemo: () => Promise<void>
}

const StoreContext = createContext<StoreValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null)
  const [persistenceError, setPersistenceError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [authenticatedCrewId, setAuthenticatedCrewId] = useState<CrewId | null>(null)
  const stateRef = useRef<AppState | null>(null)
  stateRef.current = state
  const [backendMode, setBackendMode] = useState<'connected' | 'local_simulator'>('local_simulator')
  const [backendError, setBackendError] = useState<string | null>(null)
  const client = useRef<SimulationClient | null>(null)
  const connected = useRef(false)
  const queue = useRef<Promise<void>>(Promise.resolve())
  const tickPending = useRef(false)
  const ready = useRef(false)

  const apply = useCallback((next: AppState) => {
    stateRef.current = next
    setState(next)
  }, [])

  const detach = useCallback(() => {
    connected.current = false
    setBackendMode('local_simulator')
    // La copia local continúa en una sesión nueva para conservar ambas ramas de datos.
    try {
      sessionStorage.setItem('vitalink-simulation-id', crypto.randomUUID())
    } catch {
      /* Sesión en memoria. */
    }
    /* Sin banner visual: el modo local se indica solo en data-testid backend-mode. */
    setBackendError(null)
  }, [])

  const dispatch = useCallback(
    (action: Action) => {
      if (action.type === 'setRole') setAuthenticatedCrewId(null)
      if (action.type === 'tick' && tickPending.current) return
      if (action.type === 'tick') tickPending.current = true
      queue.current = queue.current
        .then(async () => {
          const current = stateRef.current
          if (!current) return
          if (!connected.current || !client.current) {
            apply(reduce(current, action))
            return
          }
          try {
            apply((await client.current.dispatch(action)).state)
            setBackendError(null)
          } catch (error) {
            if (error instanceof ApiError && error.status < 500) {
              if (error.status === 409) {
                try {
                  apply((await client.current.refresh()).state)
                } catch {
                  detach()
                }
              }
              setBackendError(`La operación no se confirmó. ${error.message}`)
              return
            }
            detach()
            apply(reduce(current, action))
          }
        })
        .catch(() => setBackendError('No se pudo aplicar la operación.'))
        .finally(() => {
          if (action.type === 'tick') tickPending.current = false
        })
    },
    [apply, detach],
  )
  const signature = useRef('')
  const saveGeneration = useRef(0)

  useEffect(() => {
    let active = true
    async function initialize() {
      let initial: AppState
      try {
        initial = (await loadState()) ?? createInitialState('gradual-fatigue')
      } catch {
        initial = createInitialState('gradual-fatigue')
        /* Sin banner visual: se continúa con demo sin interrumpir la maqueta HELIOS. */
        if (active) setPersistenceError(null)
      }
      if (!active) return
      let sessionId: string = crypto.randomUUID()
      try {
        sessionId = sessionStorage.getItem('vitalink-simulation-id') ?? sessionId
        sessionStorage.setItem('vitalink-simulation-id', sessionId)
      } catch {
        /* El backend mantiene la sesión durante esta carga. */
      }
      const api = new SimulationClient(sessionId)
      client.current = api
      try {
        const snapshot = await api.initialize(initial)
        if (!active) return
        connected.current = true
        setBackendMode('connected')
        apply(snapshot.state)
      } catch {
        if (!active) return
        detach()
        apply(initial)
      }
      ready.current = true
    }
    void initialize()
    return () => {
      active = false
    }
  }, [apply, detach])

  useEffect(() => {
    if (!state || !ready.current || persistenceError) return
    const nextSignature = [
      state.symptoms.length,
      state.alerts.length,
      state.communications.length,
      state.movements.length,
      state.analyses.length,
      state.chats.length,
      state.notice?.text ?? '',
    ].join('|')
    const userWrite = signature.current !== '' && signature.current !== nextSignature
    signature.current = nextSignature
    const mine = saveGeneration.current + 1
    saveGeneration.current = mine
    if (userWrite) setSaving(true)
    const handle = window.setTimeout(() => {
      saveState(state)
        .catch(() => {
          setPersistenceError('No se pudo guardar en este navegador. Los cambios pueden perderse al recargar.')
        })
        .finally(() => {
          if (saveGeneration.current === mine) setSaving(false)
        })
    }, 350)
    return () => window.clearTimeout(handle)
  }, [state, persistenceError])

  useEffect(() => {
    if (!state?.clock.running) return
    let last = performance.now()
    const id = window.setInterval(() => {
      const now = performance.now()
      const delta = now - last
      last = now
      dispatch({ type: 'tick', realDeltaMs: Math.min(delta, 300000) })
    }, 1000)
    return () => window.clearInterval(id)
  }, [state?.clock.running, dispatch])

  const analyzeEpisode = useCallback(async (episodeId: string, question = 'resumen'): Promise<AnalysisResult> => {
    await queue.current
    if (connected.current && client.current) return client.current.analysis(episodeId, question)
    const current = stateRef.current
    const result = current ? answerLocal(current, episodeId, question) : null
    if (!result) throw new Error('Episodio no disponible')
    return result
  }, [])

  const value = useMemo<StoreValue | null>(() => {
    if (!state) return null
    return {
      state,
      backendMode,
      backendError,
      persistenceError,
      saving,
      authenticatedCrewId,
      dispatch,
      analyzeEpisode,
      unlockSpace: (crewId) => {
        const current = stateRef.current
        if (!current || current.role !== 'astronaut' || current.sessionCrewId !== crewId) return
        setAuthenticatedCrewId(crewId)
      },
      restoreDemo: async () => {
        setAuthenticatedCrewId(null)
        await clearPrivate().catch(() => undefined)
        await clearSpace().catch(() => undefined)
        dispatch({ type: 'restoreDemo' })
        await queue.current
      },
    }
  }, [state, persistenceError, saving, authenticatedCrewId, backendMode, backendError, dispatch, analyzeEpisode])

  if (!value) {
    return (
      <div className="boot">
        <p className="sim-pill">Simulación · datos ficticios</p>
        <h1 className="sr-only">HELIOS</h1>
        <HeliosLogo variant="wordmark" />
        <p className="tagline">Health evaluation &amp; Life indicators observation system</p>
        <p>Cargando registros locales…</p>
        <div className="skeleton-grid" aria-hidden="true">
          <span className="skeleton" style={{ height: 72 }} />
          <span className="skeleton" />
          <span className="skeleton" />
        </div>
      </div>
    )
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useApp(): StoreValue {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useApp fuera del proveedor')
  return value
}
