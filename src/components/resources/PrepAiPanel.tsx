import { useEffect, useState } from 'react'
import { useLocale } from '../../i18n'
import { platformApi, type PrepSuggestion } from '../../platform/api'
import { getActiveMissionId } from '../../platform/session'
import { getWorkspaceRole } from '../../platform/workspace'

/** Análisis IA de checklist antes del despliegue — al guardar bloquea tripulación. */
export function PrepAiPanel({
  stage,
  rosterLocked,
  onLocked,
}: {
  stage?: string
  rosterLocked?: boolean
  onLocked?: () => void
}) {
  const { lang } = useLocale()
  const en = lang === 'en'
  const role = getWorkspaceRole()
  const missionId = getActiveMissionId()
  const canEdit = role === 'chief'
  const beforeDeploy = stage === 'draft' || stage === 'preflight'
  const [suggestions, setSuggestions] = useState<PrepSuggestion[]>([])
  const [picked, setPicked] = useState<string[]>([])
  const [warning, setWarning] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!missionId || !canEdit || !beforeDeploy || rosterLocked) return
    let alive = true
    setBusy(true)
    platformApi.suggestPrep(missionId)
      .then((data) => {
        if (!alive) return
        setSuggestions(data.suggestions)
        setPicked(data.suggestions.map((item) => item.title))
        setWarning(data.warning || '')
        setNote(data.note || '')
        setLoaded(true)
      })
      .catch((err: Error) => {
        if (alive) setError(err.message || (en ? 'Could not run AI analysis' : 'No se pudo analizar con IA'))
      })
      .finally(() => {
        if (alive) setBusy(false)
      })
    return () => { alive = false }
  }, [missionId, canEdit, beforeDeploy, rosterLocked, en])

  if (!canEdit || !missionId) return null

  if (rosterLocked) {
    return (
      <section className="inv-ai" aria-label={en ? 'AI checklist' : 'Checklist IA'}>
        <h2>{en ? 'AI prep checklist' : 'Checklist de IA'}</h2>
        <p className="inv-ai-warn">
          {en
            ? 'Checklist saved. Crew is locked: you cannot change members or add new people.'
            : 'Checklist guardado. La tripulación está bloqueada: no podés cambiar tripulantes ni agregar nuevos.'}
        </p>
      </section>
    )
  }

  if (!beforeDeploy) {
    return (
      <section className="inv-ai" aria-label={en ? 'AI checklist' : 'Checklist IA'}>
        <h2>{en ? 'AI prep checklist' : 'Checklist de IA'}</h2>
        <p>
          {en
            ? 'AI analysis is only available while boarding (draft / pre-flight), before deployment.'
            : 'El análisis de IA solo está disponible mientras abordás (borrador / preembarque), antes del despliegue.'}
        </p>
      </section>
    )
  }

  async function runAgain() {
    if (!missionId || busy) return
    setBusy(true)
    setError('')
    try {
      const data = await platformApi.suggestPrep(missionId)
      setSuggestions(data.suggestions)
      setPicked(data.suggestions.map((item) => item.title))
      setWarning(data.warning || '')
      setNote(data.note || '')
      setLoaded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not run AI analysis' : 'No se pudo analizar con IA'))
    } finally {
      setBusy(false)
    }
  }

  async function saveAndLock() {
    if (!missionId || busy || picked.length === 0) return
    setBusy(true)
    setError('')
    try {
      await platformApi.commitAiPrep(missionId, picked)
      onLocked?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not save checklist' : 'No se pudo guardar el checklist'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="inv-ai" aria-label={en ? 'AI checklist' : 'Checklist IA'}>
      <div className="inv-ai-top">
        <div>
          <h2>{en ? 'AI prep checklist' : 'Checklist de IA'}</h2>
          <p>
            {en
              ? 'Before deployment, Quirón can propose a resource checklist from the current plan.'
              : 'Antes del despliegue, Quirón puede proponer un checklist de recursos según el plan actual.'}
          </p>
        </div>
        <button type="button" className="inv-btn is-sky" disabled={busy} onClick={() => void runAgain()}>
          {busy ? (en ? 'Analyzing…' : 'Analizando…') : loaded ? (en ? 'Re-run AI' : 'Volver a analizar') : (en ? 'Run AI analysis' : 'Analizar con IA')}
        </button>
      </div>
      {warning ? <p className="inv-ai-warn" role="status">{warning}</p> : null}
      {note ? <p className="muted">{note}</p> : null}
      {error ? <p className="field-error" role="alert">{error}</p> : null}
      {suggestions.length > 0 ? (
        <ul className="inv-ai-list">
          {suggestions.map((item) => {
            const on = picked.includes(item.title)
            return (
              <li key={item.title}>
                <label className={`inv-ai-item${on ? ' is-on' : ''}`}>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => setPicked((current) => (
                      on ? current.filter((title) => title !== item.title) : [...current, item.title]
                    ))}
                  />
                  <span>
                    <strong>{item.title}</strong>
                    <span>{item.reason}</span>
                    <span className="muted">{item.source}{item.qty != null ? ` · qty ${item.qty}` : ''}</span>
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      ) : null}
      {suggestions.length > 0 ? (
        <button
          type="button"
          className="inv-btn is-pink"
          disabled={busy || picked.length === 0}
          onClick={() => void saveAndLock()}
        >
          {en ? 'Save checklist and lock crew' : 'Guardar checklist y bloquear tripulación'}
        </button>
      ) : null}
    </section>
  )
}
