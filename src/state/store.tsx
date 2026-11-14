import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { AppState } from '../../shared/types'
import { createInitialState } from '../domain/scenarios'
import { reduce, type Action } from '../domain/reduce'
import { clearPrivate } from '../persistence/private'
import { loadState, saveState } from '../persistence/db'

interface StoreValue {
  state: AppState
  persistenceError: string | null
  saving: boolean
  dispatch: (action: Action) => void
  restoreDemo: () => Promise<void>
}

const StoreContext = createContext<StoreValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null)
  const [persistenceError, setPersistenceError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const ready = useRef(false)
  const signature = useRef('')
  const saveGeneration = useRef(0)

  useEffect(() => {
    let active = true
    loadState()
      .then((saved) => {
        if (!active) return
        setState(saved ?? createInitialState('gradual-fatigue'))
        ready.current = true
      })
      .catch(() => {
        if (!active) return
        setState(createInitialState('gradual-fatigue'))
        setPersistenceError('La persistencia local no está disponible. Los cambios de esta sesión se perderán al recargar.')
        ready.current = true
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!state || !ready.current || persistenceError) return
    const nextSignature = [state.symptoms.length, state.alerts.length, state.communications.length, state.movements.length, state.analyses.length, state.chats.length, state.notice?.text ?? ''].join('|')
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
      setState((current) => (current ? reduce(current, { type: 'tick', realDeltaMs: delta }) : current))
    }, 1000)
    return () => window.clearInterval(id)
  }, [state?.clock.running])

  const value = useMemo<StoreValue | null>(() => {
    if (!state) return null
    return {
      state,
      persistenceError,
      saving,
      dispatch: (action) => setState((current) => (current ? reduce(current, action) : current)),
      restoreDemo: async () => {
        await clearPrivate().catch(() => undefined)
        setState(reduce(createInitialState('baseline'), { type: 'restoreDemo' }))
      },
    }
  }, [state, persistenceError, saving])

  if (!value) {
    return (
      <div className="boot">
        <p className="sim-pill">Simulación · datos ficticios</p>
        <h1>VITALINK</h1>
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
