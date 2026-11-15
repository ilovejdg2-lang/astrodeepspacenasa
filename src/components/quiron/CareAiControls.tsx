import { useEffect, useRef, useState } from 'react'
import type { AppState } from '../../../shared/types'
import type { CareAiOptions, CareDraft } from '../../../shared/careSchema'
import { authorizeSpaceModel, revokeSpaceModel } from '../../ai/client'
import { platformApi } from '../../platform/api'
import { getActiveMissionId, getStoredProfile } from '../../platform/session'
import { Link } from 'react-router-dom'

export const LOCAL_CARE: CareAiOptions = { modelConsent: false, historyConsent: false, dataConsent: false }

export function CareAiControls({ conversationId, messageCount, locale, state, disabled, onChange, onCancel }: {
  conversationId: string; messageCount: number; locale: 'es' | 'en'; state: AppState | null; disabled: boolean
  onChange: (options: CareAiOptions) => void; onCancel: () => void
}) {
  const en = locale === 'en'
  const [options, setOptions] = useState<CareAiOptions>(LOCAL_CARE)
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState<CareDraft | null>(null)
  const [summary, setSummary] = useState('')
  const [recipient, setRecipient] = useState('')
  const [recipients, setRecipients] = useState<Array<{ id: string; role: string }>>([])
  const [notice, setNotice] = useState('')
  const request = useRef<AbortController | null>(null)
  const grant = useRef<CareAiOptions['monitoring']>(undefined)

  useEffect(() => {
    onChange(LOCAL_CARE)
    return () => {
      request.current?.abort()
      if (grant.current) void revokeSpaceModel(grant.current)
      onChange(LOCAL_CARE)
    }
  }, [onChange])

  function update(next: CareAiOptions) {
    onCancel()
    request.current?.abort()
    if (grant.current) void revokeSpaceModel(grant.current)
    grant.current = undefined
    next = { ...next, monitoring: undefined }
    setOptions(next); onChange(next); setDraft(null); setError(''); setNotice(''); setBusy(false)
  }

  async function linkMonitoring() {
    const profile = getStoredProfile()
    if (!state || state.role !== 'astronaut' || state.sessionCrewId !== profile?.id) {
      setError(en ? 'Select your own astronaut session in Crew before linking monitoring. No other profile can be used.'
        : 'Selecciona tu propia sesión de astronauta en Tripulación antes de vincular el monitoreo. No se puede usar el perfil de otra persona.')
      return
    }
    const sessionId = sessionStorage.getItem('vitalink-simulation-id')
    if (!sessionId) return
    const controller = new AbortController(); request.current = controller
    setBusy(true); setError('')
    try {
      const result = await authorizeSpaceModel(sessionId, state.sessionCrewId, pin,
        { pulse: true, sleep: true, symptoms: true, mission: true }, false, controller.signal)
      if (controller.signal.aborted) return
      const monitoring = { sessionId, token: result.token }
      grant.current = monitoring
      const next = { ...options, monitoring }; setOptions(next); onChange(next); setPin('')
    } catch {
      if (!controller.signal.aborted) setError(en ? 'Monitoring was not authorized. Check your session and PIN.' : 'No se autorizó el monitoreo. Revisa tu sesión y PIN.')
    } finally { if (!controller.signal.aborted) setBusy(false) }
  }

  async function generateDraft() {
    const controller = new AbortController(); request.current = controller
    setBusy(true); setError(''); setNotice(''); setDraft(null)
    try {
      const result = await platformApi.quironDraft(conversationId, locale, options, controller.signal)
      const missionId = getActiveMissionId()
      const mission = missionId ? await platformApi.mission(missionId) : null
      if (controller.signal.aborted) return
      setDraft(result); setSummary(result.text); setRecipient('')
      setRecipients((mission?.members ?? []).filter(m => m.status === 'active' && ['medic', 'psychologist'].includes(m.role))
        .map(m => ({ id: m.profileId, role: m.role })))
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Could not generate draft')
    } finally { if (!controller.signal.aborted) setBusy(false) }
  }

  async function approve() {
    if (!draft || !recipient || draft.expectedMessages !== messageCount || !summary.trim()) return
    setBusy(true); setError('')
    try {
      await platformApi.quironSummary(conversationId, summary.trim(), recipient, draft.expectedMessages)
      setDraft(null); setSummary('')
      setNotice(en ? 'Summary approved for the selected professional. No notification was sent.' : 'Resumen aprobado para el profesional seleccionado. No se envió ninguna notificación.')
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not approve summary') }
    finally { setBusy(false) }
  }

  return <div className="quiron-care-controls">
    <fieldset className="quiron-consent">
      <legend>{en ? 'AI for this private conversation' : 'IA para esta conversación privada'}</legend>
      <label><input type="checkbox" checked={options.modelConsent} onChange={e => update(e.target.checked
        ? { ...options, modelConsent: true } : LOCAL_CARE)} />{en ? 'Use Gemini: send messages from this module' : 'Usar Gemini: enviar mensajes de este módulo'}</label>
      {options.modelConsent ? <>
        <label><input type="checkbox" checked={options.historyConsent} onChange={e => update({ ...options, historyConsent: e.target.checked })} />{en ? 'Include recent messages from this conversation only' : 'Incluir mensajes recientes solo de esta conversación'}</label>
        {!options.historyConsent ? <small>{en ? 'History is off. Short replies may need clarification.' : 'El historial está apagado. Las respuestas breves pueden necesitar aclaración.'}</small> : null}
        <label><input type="checkbox" checked={options.dataConsent} onChange={e => update({ ...options, dataConsent: e.target.checked })} />{en ? 'Include my sleep, symptom records and mission context' : 'Incluir mis registros de descanso, síntomas y contexto de misión'}</label>
        {options.dataConsent ? <div>
          <Link to="/app/tripulacion">{en ? 'Review my astronaut session' : 'Revisar mi sesión de astronauta'}</Link>
          {options.monitoring ? <div><p>{en ? 'Own monitoring linked for this conversation. Authorization expires after 15 minutes.' : 'Monitoreo propio vinculado para esta conversación. La autorización vence a los 15 minutos.'}</p>
            <button type="button" onClick={() => update(options)}>{en ? 'Unlink monitoring' : 'Desvincular monitoreo'}</button>
          </div> : <>
            <label>{en ? 'Simulated PIN for my monitoring' : 'PIN simulado para mi monitoreo'}<input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={e => setPin(e.target.value)} autoComplete="off" /></label>
            <button type="button" disabled={busy || disabled || !pin} onClick={() => void linkMonitoring()}>{en ? 'Authorize my monitoring' : 'Autorizar mi monitoreo'}</button>
          </>}
        </div> : null}
        <small>{en ? 'No other module or role history is included. Monitoring needs your own astronaut session and PIN. Sharing a summary is separate.' : 'No se incluye historial de otro módulo o rol. El monitoreo requiere tu propia sesión de astronauta y PIN. Compartir un resumen es una acción separada.'}</small>
      </> : <small>{en ? 'Local engine active. No messages go to Gemini.' : 'Motor local activo. No se envían mensajes a Gemini.'}</small>}
    </fieldset>
    <button type="button" disabled={disabled || busy || messageCount < 3} onClick={() => void generateDraft()}>{en ? 'Prepare a summary for review' : 'Preparar resumen para revisión'}</button>
    {draft ? <div>
      <p>{en ? 'Draft only — not shared. Review and edit before approving.' : 'Solo borrador: no se ha compartido. Revísalo y edítalo antes de aprobar.'} {draft.source === 'model' ? draft.model : (en ? 'Local engine' : 'Motor local')}</p>
      <label>{en ? 'Summary to review' : 'Resumen para revisar'}<textarea value={summary} maxLength={2000} onChange={e => setSummary(e.target.value)} /></label>
      <label>{en ? 'Professional recipient' : 'Profesional destinatario'}<select value={recipient} onChange={e => setRecipient(e.target.value)}>
        <option value="">{en ? 'Choose a professional' : 'Elige un profesional'}</option>
        {recipients.map(r => <option key={r.id} value={r.id}>{r.id} · {r.role}</option>)}
      </select></label>
      {draft.expectedMessages !== messageCount ? <p>{en ? 'The conversation changed. Generate a new draft.' : 'La conversación cambió. Genera un borrador nuevo.'}</p> : null}
      <button type="button" disabled={disabled || busy || !recipient || !summary.trim() || draft.expectedMessages !== messageCount} onClick={() => void approve()}>{en ? 'Approve and share this summary' : 'Aprobar y compartir este resumen'}</button>
      <button type="button" onClick={() => setDraft(null)}>{en ? 'Discard draft' : 'Descartar borrador'}</button>
      {draft.notice ? <p>{draft.notice}</p> : null}
    </div> : null}
    {error ? <p role="alert">{error}</p> : null}
    {notice ? <p role="status">{notice}</p> : null}
  </div>
}
