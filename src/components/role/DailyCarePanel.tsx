import { systemText } from '../../systemText'
import { useEffect, useState } from 'react'
import { useLocale } from '../../i18n'
import { platformApi } from '../../platform/api'
import { enqueueOfflineOp, isBrowserOnline } from '../../platform/offlineQueue'
import { Modal } from '../ui'

function nowTimeValue() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function timeToTodayMs(value: string) {
  const [h, m] = value.split(':').map(Number)
  const d = new Date()
  d.setHours(h || 0, m || 0, 0, 0)
  return d.getTime()
}

type ModalKind = 'checkin' | 'update' | null

export function DailyCarePanel({
  missionId,
  wakeNote,
  symptomCount,
  onChanged,
  stage,
}: {
  missionId: string | null
  wakeNote: string
  symptomCount: number
  onChanged: () => Promise<void> | void
  stage?: string
}) {
  const { lang } = useLocale()
  const en = lang === 'en'
  const [modal, setModal] = useState<ModalKind>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [wakeTime, setWakeTime] = useState(nowTimeValue)
  const [sleepTime, setSleepTime] = useState('23:00')
  const [rest, setRest] = useState(3)
  const [physical, setPhysical] = useState(en ? 'acceptable' : 'aceptable')
  const [emotional, setEmotional] = useState(en ? 'stable' : 'estable')
  const [hasSymptoms, setHasSymptoms] = useState(false)
  const [symptom, setSymptom] = useState('')
  const [sleepHours, setSleepHours] = useState('7')
  const [mood, setMood] = useState(3)
  const [comments, setComments] = useState('')
  const [wantPsych, setWantPsych] = useState(false)
  const [wantMedic, setWantMedic] = useState(false)
  const [shareConsent, setShareConsent] = useState(false)
  const wantsSupport = wantPsych || wantMedic
  const writable = stage !== 'postmission' && stage !== 'archived' && stage !== 'cancelled'

  const dayStatus = systemText(wakeNote) || (en ? 'Incomplete' : 'Sin completar')

  useEffect(() => {
    setOk('')
  }, [wakeNote, symptomCount])

  function openQuiron(topic?: 'physical' | 'emotional') {
    window.dispatchEvent(new CustomEvent('helios:quiron-care', { detail: { topic: topic || null } }))
  }

  async function run(fn: () => Promise<void>, success?: string) {
    if (!missionId) {
      setError(en ? 'No active mission' : 'No hay misión activa')
      return
    }
    setBusy(true)
    setError('')
    setOk('')
    try {
      await fn()
      await onChanged()
      if (success) setOk(success)
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not save' : 'No se pudo guardar'))
    } finally {
      setBusy(false)
    }
  }

  async function saveCheckIn() {
    if (wantsSupport && !shareConsent) {
      setError(
        en
          ? 'To request a psychologist or doctor, you must authorize sharing this check-in.'
          : 'Para pedir psicología o médico, debés autorizar compartir este chequeo.',
      )
      return
    }
    if (hasSymptoms && !symptom.trim()) {
      setError(en ? 'Describe today’s symptoms, or uncheck that option.' : 'Describí los síntomas de hoy, o desmarcá esa opción.')
      return
    }
    await run(async () => {
      await platformApi.wake(missionId!, true)
      const wakeAt = timeToTodayMs(wakeTime)
      let sleepAt = timeToTodayMs(sleepTime)
      if (sleepAt >= wakeAt) sleepAt -= 24 * 60 * 60 * 1000
      await platformApi.addSleep(missionId!, {
        startAt: sleepAt,
        endAt: wakeAt,
        quality: rest,
        kind: 'night',
      })
      await platformApi.completeWake(missionId!, {
        wokeAt: wakeTime,
        sleptAt: sleepTime,
        sleepHours: Number(sleepHours),
        sleepQuality: rest,
        physical,
        mood,
        moodNote: emotional,
        symptoms: hasSymptoms ? symptom.trim() : '',
        comments,
        supportRequested: wantsSupport && shareConsent,
        supportKinds: wantsSupport && shareConsent
          ? [wantPsych ? 'psychologist' : null, wantMedic ? 'medic' : null].filter(Boolean)
          : [],
        shareConsent: wantsSupport ? shareConsent : false,
        recordedAt: new Date().toISOString(),
      })
      setModal(null)
      setWantPsych(false)
      setWantMedic(false)
      setShareConsent(false)
    }, en ? `Day saved · woke at ${wakeTime}` : `Día guardado · te levantaste a las ${wakeTime}`)
  }

  async function saveSymptom() {
    const text = symptom.trim()
    if (!text) return
    await run(async () => {
      const payload = {
        description: text,
        intensity: 3,
        context: 'self',
        source: 'self_report',
        bodyRegion: null as string | null,
      }
      if (!isBrowserOnline()) {
        enqueueOfflineOp({ type: 'symptom', missionId: missionId!, payload })
      } else {
        try {
          await platformApi.addSymptom(missionId!, payload)
        } catch {
          enqueueOfflineOp({ type: 'symptom', missionId: missionId!, payload })
        }
      }
      setSymptom('')
      setModal(null)
    }, en ? 'Note saved' : 'Nota guardada')
  }

  async function saveNap() {
    await run(async () => {
      const end = Date.now()
      await platformApi.addSleep(missionId!, {
        startAt: end - 40 * 60 * 1000,
        endAt: end,
        quality: 3,
        kind: 'nap',
      })
      setModal(null)
    }, en ? 'Nap logged' : 'Siesta registrada')
  }

  const checkInForm = (
    <div className="rd-form-grid">
      <div className="rd-field">
        <label htmlFor="sleep-time">{en ? 'Went to sleep' : 'Hora en que te acostaste'}</label>
        <input id="sleep-time" type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} disabled={busy} />
      </div>
      <div className="rd-field">
        <label htmlFor="wake-time">{en ? 'Woke up' : 'Hora en que te levantaste'}</label>
        <input id="wake-time" type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} disabled={busy} />
      </div>
      <div className="rd-field">
        <label htmlFor="sleep-hours">{en ? 'Sleep duration (hours)' : 'Duración del sueño (horas)'}</label>
        <input id="sleep-hours" type="number" min={0} max={24} step={0.5} value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} disabled={busy} />
      </div>
      <div className="rd-field">
        <label htmlFor="rest-score">{en ? 'Sleep quality (1–5)' : 'Calidad del sueño (1–5)'}</label>
        <input id="rest-score" type="number" min={1} max={5} value={rest} onChange={(e) => setRest(Number(e.target.value) || 1)} disabled={busy} />
      </div>
      <div className="rd-field">
        <label htmlFor="physical">{en ? 'Physical well-being' : 'Bienestar físico'}</label>
        <select id="physical" value={physical} onChange={(e) => setPhysical(e.target.value)} disabled={busy}>
          <option value={en ? 'good' : 'bien'}>{en ? 'Good' : 'Bien'}</option>
          <option value={en ? 'acceptable' : 'aceptable'}>{en ? 'Acceptable' : 'Aceptable'}</option>
          <option value={en ? 'tired' : 'cansado'}>{en ? 'Tired' : 'Cansado/a'}</option>
          <option value={en ? 'unwell' : 'mal'}>{en ? 'Unwell' : 'Mal'}</option>
        </select>
      </div>
      <div className="rd-field">
        <label htmlFor="mood-score">{en ? 'Mood (1–5)' : 'Ánimo (1–5)'}</label>
        <input id="mood-score" type="number" min={1} max={5} value={mood} onChange={(e) => setMood(Number(e.target.value) || 1)} disabled={busy} />
      </div>
      <div className="rd-field">
        <label htmlFor="emotional">{en ? 'Mood note' : 'Nota de ánimo'}</label>
        <select id="emotional" value={emotional} onChange={(e) => setEmotional(e.target.value)} disabled={busy}>
          <option value={en ? 'stable' : 'estable'}>{en ? 'Stable' : 'Estable'}</option>
          <option value={en ? 'anxious' : 'ansioso'}>{en ? 'Anxious' : 'Ansioso/a'}</option>
          <option value={en ? 'low' : 'bajo'}>{en ? 'Low mood' : 'Ánimo bajo'}</option>
          <option value={en ? 'stressed' : 'estresado'}>{en ? 'Stressed' : 'Estresado/a'}</option>
        </select>
      </div>
      <div className="rd-field" style={{ gridColumn: '1 / -1' }}>
        <label htmlFor="checkin-symptoms">{en ? 'Symptoms' : 'Síntomas'}</label>
        <input id="checkin-symptoms" value={symptom} onChange={(e) => setSymptom(e.target.value)} disabled={busy} placeholder={en ? 'Optional' : 'Opcional'} />
      </div>
      <div className="rd-field" style={{ gridColumn: '1 / -1' }}>
        <label htmlFor="checkin-comments">{en ? 'Additional comments' : 'Comentarios adicionales'}</label>
        <input id="checkin-comments" value={comments} onChange={(e) => setComments(e.target.value)} disabled={busy} />
      </div>
      <label className="rd-check" htmlFor="has-symptoms">
        <input id="has-symptoms" type="checkbox" checked={hasSymptoms} onChange={(e) => setHasSymptoms(e.target.checked)} disabled={busy} />
        <span>{en ? 'I have symptoms today' : 'Hoy tengo síntomas'}</span>
      </label>
      <fieldset className="rd-support-block" style={{ gridColumn: '1 / -1' }}>
        <legend>{en ? 'Professional support' : 'Apoyo profesional'}</legend>
        <p className="rd-muted">
          {en
            ? 'Optional. If you ask for a psychologist or doctor, you must give permission to share this check-in.'
            : 'Opcional. Si pedís psicología o médico, debés dar permiso para compartir este chequeo.'}
        </p>
        <label className="rd-check" htmlFor="want-psych">
          <input
            id="want-psych"
            type="checkbox"
            checked={wantPsych}
            onChange={(e) => {
              setWantPsych(e.target.checked)
              if (!e.target.checked && !wantMedic) setShareConsent(false)
            }}
            disabled={busy}
          />
          <span>{en ? 'I want psychological support' : 'Quiero atención psicológica'}</span>
        </label>
        <label className="rd-check" htmlFor="want-medic">
          <input
            id="want-medic"
            type="checkbox"
            checked={wantMedic}
            onChange={(e) => {
              setWantMedic(e.target.checked)
              if (!e.target.checked && !wantPsych) setShareConsent(false)
            }}
            disabled={busy}
          />
          <span>{en ? 'I want medical support' : 'Quiero atención médica'}</span>
        </label>
        {wantsSupport ? (
          <label className="rd-check rd-check-consent" htmlFor="share-consent">
            <input
              id="share-consent"
              type="checkbox"
              checked={shareConsent}
              onChange={(e) => setShareConsent(e.target.checked)}
              disabled={busy}
              required
            />
            <span>
              {en
                ? 'I authorize sharing this check-in with the selected professional(s). Private chat stays private until I allow it.'
                : 'Autorizo compartir este chequeo con el/los profesional(es) seleccionado(s). Lo privado sigue privado hasta que yo lo permita.'}
            </span>
          </label>
        ) : null}
      </fieldset>
      <div className="rd-actions" style={{ gridColumn: '1 / -1' }}>
        <button
          type="button"
          className="rd-btn"
          disabled={busy || !missionId || !wakeTime || (wantsSupport && !shareConsent)}
          onClick={() => void saveCheckIn()}
        >
          {en ? 'Save the day' : 'Guardar el día'}
        </button>
      </div>
    </div>
  )

  const updateForm = (
    <div className="care-feel">
      <p className="care-feel-kicker">{en ? 'Mood' : 'Ánimo'}</p>
      <div className="rd-field">
        <label htmlFor="symptom-now">{en ? 'What is weighing on you?' : '¿Qué te está pesando?'}</label>
        <textarea
          id="symptom-now"
          rows={4}
          value={symptom}
          onChange={(e) => setSymptom(e.target.value)}
          placeholder={en ? 'e.g. I feel low because the day ran long' : 'p. ej. me siento mal porque el día fue largo'}
          disabled={busy}
        />
      </div>
      <div className="rd-actions">
        <button type="button" className="rd-btn" disabled={busy || !symptom.trim() || !missionId} onClick={() => void saveSymptom()}>
          {en ? 'Save how I feel' : 'Guardar cómo me siento'}
        </button>
        <button type="button" className="rd-btn ghost" disabled={busy || !missionId} onClick={() => void saveNap()}>
          {en ? 'Log a nap' : 'Anotar una siesta'}
        </button>
      </div>
      <p className="rd-muted">{en ? `Notes saved: ${symptomCount}` : `Notas guardadas: ${symptomCount}`}</p>
    </div>
  )

  const feedback = (
    <>
      {error ? <p className="rd-error" role="alert">{systemText(error)}</p> : null}
      {ok ? <p className="rd-ok">{ok}</p> : null}
      {busy ? <p className="rd-muted" aria-live="polite">{en ? 'Saving…' : 'Guardando…'}</p> : null}
    </>
  )

  return (
    <div className="rd-stack">
      {feedback}

      <section className="rd-card">
        <h2>{en ? 'Daily Check-in' : 'Chequeo diario'}</h2>
        <p className="rd-muted">
          {en ? 'Status:' : 'Estado:'}{' '}
          <strong>{dayStatus}</strong>
        </p>
        <p className="rd-muted">
          {en
            ? 'Open the form when you are ready — it does not stay open on the page.'
            : 'Abrí el formulario cuando estés listo — no queda abierto en la página.'}
        </p>
        <div className="rd-actions">
          <button type="button" className="rd-btn" disabled={!missionId || !writable} onClick={() => setModal('checkin')}>
            {en ? 'Register daily check-in' : 'Registrar chequeo del día'}
          </button>
        </div>
      </section>

      <section className="rd-card">
        <h2>{en ? 'How you feel' : 'Cómo te sentís'}</h2>
        <p className="rd-muted">
          {en
            ? 'Write what is bothering you. Body pain is marked on the 3D body.'
            : 'Escribí qué te molesta. El dolor del cuerpo se marca en el cuerpo 3D.'}
        </p>
        <p className="rd-muted">{en ? `Notes saved: ${symptomCount}` : `Notas guardadas: ${symptomCount}`}</p>
        <div className="rd-actions">
          <button type="button" className="rd-btn" disabled={!missionId || !writable} onClick={() => setModal('update')}>
            {en ? 'Write how you feel' : 'Escribir cómo me siento'}
          </button>
        </div>
      </section>

      <section className="rd-card">
        <h2>{en ? 'Talk with Quirón' : 'Hablar con Quirón'}</h2>
        <p className="rd-muted">
          {en
            ? 'Open Quirón and choose physical health or emotional wellbeing inside the chat.'
            : 'Abrí Quirón y elegí salud física o bienestar emocional dentro del chat.'}
        </p>
        <div className="rd-actions">
          <button type="button" className="rd-btn" disabled={!missionId || stage === 'postmission' || stage === 'archived' || stage === 'cancelled'} onClick={() => openQuiron('physical')}>
            {en ? 'Physical health' : 'Salud física'}
          </button>
          <button type="button" className="rd-btn ghost" disabled={!missionId || !writable} onClick={() => openQuiron('emotional')}>
            {en ? 'Emotional wellbeing' : 'Bienestar emocional'}
          </button>
        </div>
      </section>

      <Modal
        open={modal === 'checkin'}
        title={en ? 'Daily Check-in' : 'Chequeo diario'}
        description={en ? 'Log rest and how you feel today.' : 'Registrá descanso y cómo te sentís hoy.'}
        onClose={() => setModal(null)}
      >
        {feedback}
        {checkInForm}
      </Modal>
      <Modal
        open={modal === 'update'}
        className="care-feel-modal"
        title={en ? 'How you feel' : 'Cómo te sentís'}
        description={en ? 'A note about your mood. Aches and pain go on the 3D body map, not here.' : 'Una nota de ánimo. El dolor del cuerpo va en el mapa 3D, no acá.'}
        onClose={() => setModal(null)}
      >
        {feedback}
        {updateForm}
      </Modal>
    </div>
  )
}
