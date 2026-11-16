import { useState } from 'react'
import { useLocale } from '../../i18n'
import { INDICATOR_CATALOG, catalogEntry } from '../../domain/healthIndicators'
import {
  platformApi,
  type HealthIndicatorReading,
  type IndicatorKind,
} from '../../platform/api'
import { enqueueOfflineOp, isBrowserOnline } from '../../platform/offlineQueue'

export function HealthIndicatorsPanel({
  missionId,
  onChanged,
  writable = true,
}: {
  missionId: string | null
  onChanged?: () => Promise<void> | void
  writable?: boolean
}) {
  const { lang } = useLocale()
  const en = lang === 'en'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [explainKind, setExplainKind] = useState<IndicatorKind | null>(null)
  const [kind, setKind] = useState<IndicatorKind>('heart_rate')
  const [value, setValue] = useState('72')
  const [valueSecondary, setValueSecondary] = useState('78')
  const [context, setContext] = useState('rest')
  const [quality, setQuality] = useState<HealthIndicatorReading['quality']>('good')
  const [origin, setOrigin] = useState<HealthIndicatorReading['origin']>('manual')
  const [notes, setNotes] = useState('')

  const selectedMeta = catalogEntry(kind)
  const explain = explainKind ? catalogEntry(explainKind) : null

  async function save() {
    if (!missionId) {
      setError(en ? 'No active mission' : 'No hay misión activa')
      return
    }
    setBusy(true)
    setError('')
    setOk('')
    try {
      const primary = Number(value)
      const secondary = selectedMeta?.needsSecondary ? Number(valueSecondary) : null
      if (selectedMeta?.needsSecondary && !Number.isFinite(secondary)) {
        throw new Error(en ? 'Blood pressure needs systolic and diastolic.' : 'La presión arterial necesita sistólica y diastólica.')
      }
      const payload = {
        kind,
        value: primary,
        valueSecondary: secondary,
        origin,
        context,
        quality,
        notes,
        bodyRegion: selectedMeta?.bodyRegion ?? null,
        unit: selectedMeta?.unit,
        measuredAt: Date.now(),
      }
      if (!isBrowserOnline()) {
        enqueueOfflineOp({ type: 'indicator', missionId, payload })
        setOk(en ? 'Saved offline — queued for sync.' : 'Guardado offline — en cola de sync.')
      } else {
        try {
          await platformApi.addIndicator(missionId, payload)
          setOk(en ? 'Indicator saved.' : 'Indicador guardado.')
        } catch (err) {
          enqueueOfflineOp({ type: 'indicator', missionId, payload })
          setOk(en
            ? `Network error — queued locally (${err instanceof Error ? err.message : 'error'}).`
            : `Error de red — encolado local (${err instanceof Error ? err.message : 'error'}).`)
        }
      }
      await onChanged?.()
      try {
        const raw = localStorage.getItem('helios.progress.optout')
        if (raw !== '1') {
          const key = 'helios.progress.records'
          const n = Number(localStorage.getItem(key) || '0') + 1
          localStorage.setItem(key, String(n))
        }
      } catch { /* ignore */ }
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not save' : 'No se pudo guardar'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rd-stack health-indicators">
      {error ? <p className="rd-error" role="alert">{error}</p> : null}
      {ok ? <p className="rd-ok">{ok}</p> : null}

      <section className="rd-card">
        <h2>{writable
          ? (en ? 'Log health indicators' : 'Registrar indicadores')
          : (en ? 'Health indicators' : 'Indicadores de salud')}</h2>
        {!writable ? <p className="rd-muted">{en ? 'New readings can be added only while the mission is in flight.' : 'Las lecturas nuevas solo se agregan con la misión a bordo.'}</p> : null}
        {writable ? <>
        <div className="rd-form-grid">
          <div className="rd-field">
            <label htmlFor="ind-kind">{en ? 'Indicator' : 'Indicador'}</label>
            <select id="ind-kind" value={kind} onChange={(e) => setKind(e.target.value as IndicatorKind)} disabled={busy}>
              {INDICATOR_CATALOG.map((item) => (
                <option key={item.kind} value={item.kind}>{en ? item.name.en : item.name.es}</option>
              ))}
            </select>
          </div>
          {kind === 'mood' ? (
            <div className="rd-field">
              <label htmlFor="ind-mood">{en ? 'Mood self-report' : 'Autorreporte de ánimo'}</label>
              <select id="ind-mood" value={value} onChange={(e) => setValue(e.target.value)} disabled={busy}>
                {(catalogEntry('mood')?.moodScale || []).map((step) => (
                  <option key={step.value} value={step.value}>{en ? step.en : step.es}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="rd-field">
              <label htmlFor="ind-value">
                {selectedMeta?.needsSecondary
                  ? (en ? 'Systolic' : 'Sistólica')
                  : (en ? `Value (${selectedMeta?.unit || ''})` : `Valor (${selectedMeta?.unit || ''})`)}
              </label>
              <input id="ind-value" type="number" step="any" value={value} onChange={(e) => setValue(e.target.value)} disabled={busy} />
            </div>
          )}
          {selectedMeta?.needsSecondary ? (
            <div className="rd-field">
              <label htmlFor="ind-dia">{en ? 'Diastolic' : 'Diastólica'}</label>
              <input id="ind-dia" type="number" step="any" value={valueSecondary} onChange={(e) => setValueSecondary(e.target.value)} disabled={busy} />
            </div>
          ) : null}
          <div className="rd-field">
            <label htmlFor="ind-context">{en ? 'Context' : 'Contexto'}</label>
            <select id="ind-context" value={context} onChange={(e) => setContext(e.target.value)} disabled={busy}>
              <option value="rest">{en ? 'Rest' : 'Reposo'}</option>
              <option value="activity">{en ? 'Activity' : 'Actividad'}</option>
              <option value="post_wake">{en ? 'After wake' : 'Tras despertar'}</option>
              <option value="unspecified">{en ? 'Unspecified' : 'Sin especificar'}</option>
            </select>
          </div>
          <div className="rd-field">
            <label htmlFor="ind-origin">{en ? 'Origin' : 'Origen'}</label>
            <select id="ind-origin" value={origin} onChange={(e) => setOrigin(e.target.value as HealthIndicatorReading['origin'])} disabled={busy}>
              <option value="manual">{en ? 'Manual' : 'Manual'}</option>
              <option value="sensor">{en ? 'Sensor' : 'Sensor'}</option>
              <option value="import">{en ? 'Import' : 'Importación'}</option>
              <option value="simulation">{en ? 'Simulation' : 'Simulación'}</option>
            </select>
          </div>
          <div className="rd-field">
            <label htmlFor="ind-quality">{en ? 'Quality' : 'Calidad'}</label>
            <select id="ind-quality" value={quality} onChange={(e) => setQuality(e.target.value as HealthIndicatorReading['quality'])} disabled={busy}>
              <option value="good">{en ? 'Good' : 'Buena'}</option>
              <option value="fair">{en ? 'Fair' : 'Aceptable'}</option>
              <option value="poor">{en ? 'Poor' : 'Pobre'}</option>
              <option value="unknown">{en ? 'Unknown' : 'Desconocida'}</option>
            </select>
          </div>
          <div className="rd-field" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="ind-notes">{en ? 'Notes (optional)' : 'Observaciones (opcional)'}</label>
            <input id="ind-notes" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={busy} />
          </div>
        </div>
        <div className="rd-actions">
          <button type="button" className="rd-btn" disabled={busy || !missionId} onClick={() => void save()}>
            {en ? 'Save indicator' : 'Guardar indicador'}
          </button>
          <button type="button" className="rd-btn ghost" onClick={() => setExplainKind(kind)}>
            {en ? 'Understand this indicator' : 'Entender este indicador'}
          </button>
        </div>
        </> : (
          <button type="button" className="rd-btn ghost" onClick={() => setExplainKind(kind)}>
            {en ? 'Understand this indicator' : 'Entender este indicador'}
          </button>
        )}
      </section>

      {explain ? (
        <section className="rd-card" role="dialog" aria-label={en ? 'Indicator help' : 'Ayuda del indicador'}>
          <h2>{en ? explain.name.en : explain.name.es}</h2>
          <dl className="health-explain">
            <dt>{en ? 'What it is' : 'Qué representa'}</dt>
            <dd>{en ? explain.explain.what.en : explain.explain.what.es}</dd>
            <dt>{en ? 'Why record it' : 'Para qué registrarlo'}</dt>
            <dd>{en ? explain.explain.why.en : explain.explain.why.es}</dd>
            <dt>{en ? 'What can affect it' : 'Qué puede afectarlo'}</dt>
            <dd>{en ? explain.explain.factors.en : explain.explain.factors.es}</dd>
            <dt>{en ? 'How to record' : 'Cómo registrar'}</dt>
            <dd>{en ? explain.explain.howToRecord.en : explain.explain.howToRecord.es}</dd>
            <dt>{en ? 'When to review' : 'Cuándo revisar'}</dt>
            <dd>{en ? explain.explain.whenToReview.en : explain.explain.whenToReview.es}</dd>
            <dt>{en ? 'Limits' : 'Limitaciones'}</dt>
            <dd>{en ? explain.explain.limits.en : explain.explain.limits.es}</dd>
          </dl>
          <ul className="health-mini-list">
            {explain.explain.sources.map((source) => (
              <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>
            ))}
          </ul>
          <button type="button" className="rd-btn ghost" onClick={() => setExplainKind(null)}>{en ? 'Close' : 'Cerrar'}</button>
        </section>
      ) : null}

    </div>
  )
}
