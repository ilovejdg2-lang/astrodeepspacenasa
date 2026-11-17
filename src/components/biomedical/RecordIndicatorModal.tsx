import { useState } from 'react'
import { Modal, Field } from '../ui'
import type { BiomedicalSystemDefinition } from '../../domain/biomedical'
import { catalogEntry } from '../../domain/healthIndicators'
import { platformApi, type HealthIndicatorReading, type IndicatorKind } from '../../platform/api'

export function RecordIndicatorModal({
  open,
  onClose,
  en,
  missionId,
  system,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  en: boolean
  missionId: string
  system: BiomedicalSystemDefinition
  onSaved: () => void
}) {
  const kinds = system.indicatorKinds
  const [kind, setKind] = useState<IndicatorKind>(kinds[0] || 'heart_rate')
  const [value, setValue] = useState('')
  const [valueSecondary, setValueSecondary] = useState('')
  const [origin, setOrigin] = useState<HealthIndicatorReading['origin']>('manual')
  const [quality, setQuality] = useState<HealthIndicatorReading['quality']>('good')
  const [context, setContext] = useState('routine_check')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const activeEntry = catalogEntry(kind)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const num = Number(value)
    if (!Number.isFinite(num)) {
      setError(en ? 'Please enter a valid numeric measurement.' : 'Por favor ingresá un valor numérico válido.')
      return
    }

    let secNum: number | null = null
    if (activeEntry?.needsSecondary) {
      secNum = Number(valueSecondary)
      if (!Number.isFinite(secNum)) {
        setError(en ? 'Please enter the secondary value (e.g. diastolic pressure).' : 'Por favor ingresá el valor secundario (ej. presión diastólica).')
        return
      }
    }

    setBusy(true)
    setError('')
    try {
      await platformApi.addIndicator(missionId, {
        kind,
        value: num,
        valueSecondary: secNum,
        unit: activeEntry?.unit,
        origin,
        quality,
        context,
        notes: notes.trim() || undefined,
        bodyRegion: activeEntry?.bodyRegion,
      })
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not save measurement.' : 'No se pudo guardar la medición.'))
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={en ? `Record ${system.name.en} measurement` : `Registrar medición de ${system.name.es}`}
    >
      <form onSubmit={handleSubmit} className="rd-form-grid" style={{ display: 'grid', gap: 14 }}>
        {error ? (
          <div className="callout callout-bad" role="alert">
            <p>{error}</p>
          </div>
        ) : null}

        <Field id="rec-kind" label={en ? 'Indicator' : 'Indicador'}>
          <select id="rec-kind" value={kind} onChange={(e) => setKind(e.target.value as IndicatorKind)}>
            {kinds.map((k) => {
              const entry = catalogEntry(k)
              return (
                <option key={k} value={k}>
                  {entry ? (en ? entry.name.en : entry.name.es) : k} ({entry?.unit})
                </option>
              )
            })}
          </select>
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: activeEntry?.needsSecondary ? '1fr 1fr' : '1fr', gap: 10 }}>
          <Field id="rec-val" label={en ? `Value (${activeEntry?.unit || ''})` : `Valor (${activeEntry?.unit || ''})`}>
            <input
              id="rec-val"
              type="number"
              step="any"
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={kind === 'heart_rate' ? '72' : kind === 'blood_pressure' ? '120' : kind === 'spo2' ? '98' : '0'}
            />
          </Field>

          {activeEntry?.needsSecondary ? (
            <Field id="rec-sec" label={en ? `Diastolic (${activeEntry.unit})` : `Diastólica (${activeEntry.unit})`}>
              <input
                id="rec-sec"
                type="number"
                step="any"
                required
                value={valueSecondary}
                onChange={(e) => setValueSecondary(e.target.value)}
                placeholder="80"
              />
            </Field>
          ) : null}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field id="rec-origin" label={en ? 'Origin' : 'Origen'}>
            <select id="rec-origin" value={origin} onChange={(e) => setOrigin(e.target.value as HealthIndicatorReading['origin'])}>
              <option value="manual">{en ? 'Manual log' : 'Registro manual'}</option>
              <option value="sensor">{en ? 'Onboard sensor' : 'Sensor a bordo'}</option>
              <option value="import">{en ? 'External device import' : 'Importación externa'}</option>
              <option value="simulation">{en ? 'Clinical simulation' : 'Simulación clínica'}</option>
            </select>
          </Field>

          <Field id="rec-quality" label={en ? 'Quality check' : 'Calidad'}>
            <select id="rec-quality" value={quality} onChange={(e) => setQuality(e.target.value as HealthIndicatorReading['quality'])}>
              <option value="good">{en ? 'Good (confirmed)' : 'Buena (confirmada)'}</option>
              <option value="fair">{en ? 'Fair / unverified' : 'Aceptable / sin verificar'}</option>
              <option value="poor">{en ? 'Poor signal / motion' : 'Señal pobre / movimiento'}</option>
              <option value="unknown">{en ? 'Unknown' : 'Desconocida'}</option>
            </select>
          </Field>
        </div>

        <Field id="rec-ctx" label={en ? 'Activity Context' : 'Contexto de actividad'}>
          <select id="rec-ctx" value={context} onChange={(e) => setContext(e.target.value)}>
            <option value="routine_check">{en ? 'Routine scheduled check' : 'Chequeo de rutina'}</option>
            <option value="rest_post_wake">{en ? 'Post-wake / Resting' : 'Despertar / Reposo'}</option>
            <option value="post_exercise">{en ? 'Post-exercise cooldown' : 'Post-ejercicio'}</option>
            <option value="symptom_followup">{en ? 'Symptom investigation' : 'Seguimiento de síntoma'}</option>
          </select>
        </Field>

        <Field id="rec-notes" label={en ? 'Optional clinical notes' : 'Notas clínicas opcionales'}>
          <input
            id="rec-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={en ? 'e.g. Seated posture, right arm' : 'ej. Sentado, brazo derecho'}
          />
        </Field>

        <div className="biomed-modal-actions" style={{ marginTop: 8 }}>
          <button type="button" className="rd-btn ghost" onClick={onClose} disabled={busy}>
            {en ? 'Cancel' : 'Cancelar'}
          </button>
          <button type="submit" className="rd-btn" disabled={busy || !value}>
            {busy ? (en ? 'Saving…' : 'Guardando…') : (en ? 'Save measurement' : 'Guardar medición')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
