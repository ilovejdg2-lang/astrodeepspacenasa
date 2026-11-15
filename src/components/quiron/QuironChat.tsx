import { MoreHorizontal, SendHorizontal, Square, X } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import {
  askQuiron,
  formatServiceStatus,
  probeQuironHealth,
  quironContextLabel,
  type QuironMessage,
  type QuironMode,
} from '../../ai/quironAsk'
import type { AiHealth } from '../../ai/client'
import type { AppState } from '../../../shared/types'
import { dashboardSuggestions, publicSuggestions } from '../../domain/quironPublic'
import { useLocale } from '../../i18n'
import { formatQuironReply } from './formatReply'
import './quiron.css'

const GREET_KEY = 'quiron-greet-dismissed'
const SESSION_KEY_PUBLIC = 'quiron-public-thread'
const ASSETS = {
  /** Official Quirón PNG (fondo negro removido por flood-fill; contornos conservados). */
  character: '/brand/quiron/quiron-character.png?v=2',
  mark: '/brand/quiron/quiron-mark.svg',
} as const

export function QuironChat({ mode, state = null }: { mode: QuironMode; state?: AppState | null }) {
  const { lang } = useLocale()
  const en = lang === 'en'
  const location = useLocation()
  const dialogId = useId()
  const titleId = useId()
  const fabRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const flightRef = useRef('')
  const stickBottom = useRef(true)
  const composing = useRef(false)
  const contextKeyRef = useRef('')

  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [health, setHealth] = useState<AiHealth | null>(null)
  const [probing, setProbing] = useState(true)
  const [announce, setAnnounce] = useState('')
  const [showJump, setShowJump] = useState(false)
  const [showTip, setShowTip] = useState(false)
  const [messages, setMessages] = useState<QuironMessage[]>([])

  useEffect(() => {
    if (mode !== 'dashboard') return
    const openDemo = (event: Event) => {
      const detail: unknown = (event as CustomEvent).detail
      if (!detail || typeof detail !== 'object' || !('question' in detail) || typeof detail.question !== 'string') return
      setOpen(true)
      setDraft(detail.question.slice(0, 1000))
      setShowTip(false)
    }
    window.addEventListener('helios:quiron-demo', openDemo)
    return () => window.removeEventListener('helios:quiron-demo', openDemo)
  }, [mode])

  const suggestions = mode === 'public' ? publicSuggestions(lang) : dashboardSuggestions(lang)
  const status = formatServiceStatus(health, lang, probing)
  const contextLabel = mode === 'dashboard' ? quironContextLabel(state, lang) : undefined

  useEffect(() => {
    try {
      if (!sessionStorage.getItem(GREET_KEY) && !localStorage.getItem(GREET_KEY)) {
        setShowTip(true)
        const timer = window.setTimeout(() => setShowTip(false), 6500)
        return () => window.clearTimeout(timer)
      }
    } catch {
      setShowTip(true)
    }
  }, [])

  useEffect(() => {
    if (mode !== 'public') return
    try {
      const raw = sessionStorage.getItem(SESSION_KEY_PUBLIC)
      if (!raw) return
      const parsed = JSON.parse(raw) as QuironMessage[]
      if (Array.isArray(parsed)) setMessages(parsed.filter((m) => m && (m.role === 'user' || m.role === 'assistant')))
    } catch {
      /* ignore */
    }
  }, [mode])

  useEffect(() => {
    if (mode !== 'public') return
    try {
      sessionStorage.setItem(SESSION_KEY_PUBLIC, JSON.stringify(messages.slice(-40)))
    } catch {
      /* ignore */
    }
  }, [messages, mode])

  useEffect(() => {
    const controller = new AbortController()
    setProbing(true)
    void probeQuironHealth(controller.signal).then((value) => {
      if (!controller.signal.aborted) {
        setHealth(value)
        setProbing(false)
      }
    })
    return () => controller.abort()
  }, [open])

  useEffect(() => {
    if (mode !== 'dashboard' || !state) return
    const episodeId = state.selectedEpisodeId ?? ''
    const crewId = state.episodes.find((e) => e.id === episodeId)?.crewId ?? ''
    const key = `${state.mission.stage}:${crewId}:${episodeId}`
    if (!contextKeyRef.current) {
      contextKeyRef.current = key
      return
    }
    if (contextKeyRef.current !== key) {
      contextKeyRef.current = key
      setMessages([])
      setError('')
    }
  }, [state, mode])

  const closePanel = useCallback(() => {
    setOpen(false)
    setMenuOpen(false)
    window.setTimeout(() => fabRef.current?.focus(), 30)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (menuOpen) setMenuOpen(false)
        else closePanel()
      }
    }
    window.addEventListener('keydown', onKey)
    const t = window.setTimeout(() => closeRef.current?.focus(), 40)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
    }
  }, [open, menuOpen, closePanel])

  const dismissTip = () => {
    setShowTip(false)
    try {
      localStorage.setItem(GREET_KEY, '1')
    } catch {
      /* */
    }
  }

  const openPanel = () => {
    dismissTip()
    setOpen(true)
  }

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight
    stickBottom.current = dist < 64
    setShowJump(dist >= 96)
  }

  const scrollToEnd = (force = false) => {
    const el = scrollRef.current
    if (!el) return
    if (!force && !stickBottom.current) {
      setShowJump(true)
      return
    }
    el.scrollTop = el.scrollHeight
    setShowJump(false)
  }

  useEffect(() => {
    if (!open) return
    scrollToEnd()
  }, [messages, pending, open])

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || pending) return
    const key = `${mode}-${trimmed}-${messages.length}`
    if (flightRef.current === key) return
    flightRef.current = key

    const userMsg: QuironMessage = {
      id: `${key}-u`,
      role: 'user',
      text: trimmed,
      at: Date.now(),
      channel: 'local',
    }
    setMessages((prev) => [...prev, userMsg])
    setDraft('')
    setError('')
    setPending(true)
    stickBottom.current = true

    const preferModel = mode === 'dashboard' && Boolean(health?.configured && health.reachable)
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const result = await askQuiron({
        mode,
        question: trimmed,
        locale: lang,
        state: mode === 'dashboard' ? state : null,
        signal: controller.signal,
        preferModel,
      })
      if (result.errorCode === 'aborted') {
        setPending(false)
        flightRef.current = ''
        return
      }
      const bot: QuironMessage = {
        id: `${key}-a`,
        role: 'assistant',
        text: result.text,
        at: Date.now(),
        sources: result.sources,
        channel: result.channel,
        contextLabel: result.contextLabel,
      }
      setMessages((prev) => [...prev, bot])
      setAnnounce(result.text)
      if (result.channel === 'error') setError(result.text)
    } catch {
      setError(en ? 'Could not reach Quirón. Your text is still in the box.' : 'No se pudo contactar a Quirón. Tu texto sigue en el campo.')
      setDraft(trimmed)
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id))
    } finally {
      setPending(false)
      flightRef.current = ''
      abortRef.current = null
      window.setTimeout(() => inputRef.current?.focus(), 20)
    }
  }

  const stop = () => {
    abortRef.current?.abort()
    setPending(false)
  }

  const newConversation = () => {
    setMenuOpen(false)
    setMessages([])
    setError('')
    setAnnounce(en ? 'New conversation started.' : 'Nueva conversación iniciada.')
    if (mode === 'public') {
      try {
        sessionStorage.removeItem(SESSION_KEY_PUBLIC)
      } catch {
        /* */
      }
    }
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    void send(draft)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (composing.current) return
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void send(draft)
    }
  }

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [draft])

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setAnnounce(en ? 'Answer copied.' : 'Respuesta copiada.')
    } catch {
      setAnnounce(en ? 'Could not copy.' : 'No se pudo copiar.')
    }
  }

  const channelLabel = (channel: QuironMessage['channel']) => {
    if (channel === 'model') return en ? 'Model' : 'Modelo'
    if (channel === 'local') return en ? 'Local engine' : 'Motor local'
    if (channel === 'demo') return en ? 'Demo mode' : 'Modo demostración'
    return en ? 'Error' : 'Error'
  }

  const ui = (
    <div
      className={`quiron-root${open ? ' is-open' : ''}${mode === 'dashboard' ? ' is-dashboard' : ''}`}
      data-page={location.pathname}
      data-mode={mode}
    >
      <div className="quiron-fab-wrap">
        {showTip && !open ? (
          <div className="quiron-tip" role="status">
            <img className="quiron-tip-art" src={ASSETS.character} alt="" width={48} height={48} decoding="async" />
            <span>{en ? 'Hi, I’m Quirón. How can I help?' : 'Hola, soy Quirón. ¿En qué te ayudo?'}</span>
            <button type="button" aria-label={en ? 'Dismiss greeting' : 'Descartar saludo'} onClick={dismissTip}>
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        ) : null}

        <button
          ref={fabRef}
          type="button"
          className={`quiron-fab${open ? ' is-open' : ''}${pending ? ' is-busy' : ''}`}
          aria-label={en ? 'Open chat with Quirón' : 'Abrir chat con Quirón'}
          aria-expanded={open}
          aria-controls={dialogId}
          onClick={() => (open ? closePanel() : openPanel())}
        >
          <span className="quiron-fab-float" aria-hidden="true">
            <img src={ASSETS.character} alt="" width={56} height={56} decoding="async" />
          </span>
        </button>
      </div>

      {open ? (
        <div
          id={dialogId}
          className="quiron-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <header className="quiron-head">
            <div className="quiron-head-avatar" aria-hidden="true">
              <img src={ASSETS.character} alt="" width={44} height={44} decoding="async" />
            </div>
            <div>
              <h2 id={titleId}>Quirón</h2>
              <p>{en ? 'HELIOS assistant' : 'Asistente de HELIOS'}</p>
              <div className="quiron-status">
                <span className={`quiron-status-dot${status.ok && health?.configured ? ' is-ok' : ''}`} aria-hidden="true" />
                <span>{status.label}</span>
              </div>
            </div>
            <div className="quiron-head-actions">
              <button
                type="button"
                className="quiron-icon-btn"
                aria-label={en ? 'More options' : 'Más opciones'}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <MoreHorizontal size={18} aria-hidden="true" />
              </button>
              <button
                ref={closeRef}
                type="button"
                className="quiron-icon-btn"
                aria-label={en ? 'Close Quirón chat' : 'Cerrar chat de Quirón'}
                onClick={closePanel}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            {menuOpen ? (
              <div className="quiron-menu" role="menu">
                <button type="button" role="menuitem" onClick={newConversation}>
                  {en ? 'Start new conversation' : 'Iniciar nueva conversación'}
                </button>
              </div>
            ) : null}
          </header>

          <div className="quiron-body">
            <div ref={scrollRef} className="quiron-scroll" onScroll={onScroll}>
              {contextLabel && messages.length > 0 ? <p className="quiron-context">{contextLabel}</p> : null}

              {messages.length === 0 ? (
                <div className="quiron-welcome">
                  <div className="quiron-welcome-art" aria-hidden="true">
                    <img src={ASSETS.character} alt="" width={220} height={220} decoding="async" />
                  </div>
                  <img src={ASSETS.mark} alt="" height={28} style={{ height: 28, width: 'auto' }} />
                  <h3>{en ? 'Hi, I’m Quirón 👋' : 'Hola, soy Quirón 👋'}</h3>
                  <p>
                    {en
                      ? 'I can help you explore HELIOS, understand the information available, and organize your questions across mission stages.'
                      : 'Puedo ayudarte a explorar HELIOS, comprender la información disponible y organizar tus consultas durante las distintas etapas de una misión.'}
                  </p>
                  {mode === 'public' ? (
                    <p className="quiron-context">
                      {en ? 'Public site · no private dashboard data' : 'Sitio público · sin datos privados del panel'}
                    </p>
                  ) : contextLabel ? (
                    <p className="quiron-context">{contextLabel}</p>
                  ) : null}
                  <div className="quiron-suggestions">
                    {suggestions.map((item) => (
                      <button key={item} type="button" className="quiron-chip" onClick={() => void send(item)}>
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) =>
                  msg.role === 'user' ? (
                    <article key={msg.id} className="quiron-msg is-user">
                      <div className="quiron-bubble">{msg.text}</div>
                    </article>
                  ) : (
                    <article key={msg.id} className="quiron-msg is-bot">
                      <div className="quiron-msg-avatar" aria-hidden="true">
                        <img src={ASSETS.character} alt="" width={34} height={34} decoding="async" />
                      </div>
                      <div>
                        <div className="quiron-bubble">{formatQuironReply(msg.text)}</div>
                        <div className="quiron-meta">
                          <span>{channelLabel(msg.channel)}</span>
                          {msg.sources && msg.sources.length > 0 ? <span>· {msg.sources.slice(0, 2).join(' · ')}</span> : null}
                          <button type="button" className="quiron-copy" onClick={() => void copyText(msg.text)}>
                            {en ? 'Copy' : 'Copiar'}
                          </button>
                        </div>
                      </div>
                    </article>
                  ),
                )
              )}

              {pending ? (
                <div className="quiron-msg is-bot" aria-hidden="true">
                  <div className="quiron-msg-avatar">
                    <img src={ASSETS.character} alt="" width={34} height={34} decoding="async" />
                  </div>
                  <div className="quiron-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              ) : null}
            </div>

            {showJump ? (
              <button type="button" className="quiron-jump" onClick={() => scrollToEnd(true)}>
                {en ? 'Jump to latest' : 'Ir al último mensaje'}
              </button>
            ) : null}
          </div>

          <form className="quiron-composer" onSubmit={onSubmit}>
            <label className="sr-only" htmlFor={`${dialogId}-input`}>
              {en ? 'Message for Quirón' : 'Mensaje para Quirón'}
            </label>
            <textarea
              ref={inputRef}
              id={`${dialogId}-input`}
              rows={1}
              placeholder={en ? 'Write to Quirón…' : 'Escribile a Quirón…'}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              onCompositionStart={() => {
                composing.current = true
              }}
              onCompositionEnd={() => {
                composing.current = false
              }}
            />
            {pending ? (
              <button type="button" className="quiron-send is-busy" aria-label={en ? 'Stop response' : 'Detener respuesta'} onClick={stop}>
                <Square size={16} aria-hidden="true" fill="currentColor" />
              </button>
            ) : (
              <button
                type="submit"
                className="quiron-send"
                disabled={!draft.trim()}
                aria-label={en ? 'Send message' : 'Enviar mensaje'}
              >
                <SendHorizontal size={18} aria-hidden="true" />
              </button>
            )}
            {error ? (
              <p className="quiron-error" role="alert">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => {
                    const retry = draft || messages.filter((m) => m.role === 'user').at(-1)?.text || ''
                    setError('')
                    void send(retry)
                  }}
                >
                  {en ? 'Retry' : 'Reintentar'}
                </button>
              </p>
            ) : null}
          </form>

          <div className="quiron-sr-live" aria-live="polite">
            {announce}
          </div>
        </div>
      ) : null}
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(ui, document.body)
}
