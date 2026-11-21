import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Rocket, RefreshCw, ExternalLink } from 'lucide-react'
import { useLocale } from '../../i18n'
import { platformApi } from '../../platform/api'
import { stageLabel } from '../../platform/copy'
import { getActiveMissionId, setActiveMissionId } from '../../platform/session'
import '../../platform/role-dash.css'

const STAGES = [
  {
    id: 'draft',
    nameEn: 'Draft',
    nameEs: 'Borrador',
    badgeClass: 'is-draft',
    color: '#3b82f6',
    descEn: 'Mission setup, parameters & astronaut roster',
    descEs: 'Configuración inicial y armado de tripulación',
  },
  {
    id: 'preflight',
    nameEn: 'Preflight',
    nameEs: 'Preembarque',
    badgeClass: 'is-preflight',
    color: '#f59e0b',
    descEn: 'Preparation checklist & medical verification',
    descEs: 'Checklist de preparación y recursos médicos',
  },
  {
    id: 'aboard',
    nameEn: 'In Flight',
    nameEs: 'A bordo (Activa)',
    badgeClass: 'is-aboard',
    color: '#10b981',
    descEn: 'Active flight, live telemetry & consultations',
    descEs: 'Vuelo activo, telemetría y consultas clínicas',
  },
  {
    id: 'postmission',
    nameEn: 'Completed',
    nameEs: 'Posmisión',
    badgeClass: 'is-postmission',
    color: '#a855f7',
    descEn: 'Debriefing & retrospective scientific review',
    descEs: 'Revisión y preservación histórica de datos',
  },
] as const

const FLEET_MISSIONS = [
  {
    id: 'mission-demo-horizon',
    name: 'HELIOS Horizon',
    code: 'HELIOS-HORIZON',
    defaultStage: 'aboard',
    descEn: 'Low Earth orbit operations & crew telemetry',
    descEs: 'Operaciones en órbita terrestre y telemetría',
  },
  {
    id: 'mission-demo-pathfinder',
    name: 'HELIOS Pathfinder',
    code: 'HELIOS-PATHFINDER',
    defaultStage: 'preflight',
    descEn: 'Lunar Gateway readiness & crew drills',
    descEs: 'Preparación Lunar Gateway y simulacros',
  },
  {
    id: 'mission-demo-genesis',
    name: 'HELIOS Genesis',
    code: 'HELIOS-GENESIS',
    defaultStage: 'draft',
    descEn: 'Mars transit setup & concept drafting',
    descEs: 'Planificación de tránsito a Marte (Borrador)',
  },
  {
    id: 'mission-demo-aurora',
    name: 'HELIOS Aurora',
    code: 'HELIOS-AURORA',
    defaultStage: 'postmission',
    descEn: 'Completed deep-space mission history & debrief',
    descEs: 'Misión histórica de espacio profundo completada',
  },
] as const

export function MissionSwitcher() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const activeId = getActiveMissionId() || 'mission-demo-horizon'
  const [currentStage, setCurrentStage] = useState<string>('aboard')
  const [missionName, setMissionName] = useState<string>('HELIOS Horizon')

  useEffect(() => {
    let alive = true
    platformApi.mission(activeId)
      .then((data) => {
        if (alive && data.mission) {
          setCurrentStage(data.mission.stage)
          if (data.mission.name) setMissionName(data.mission.name)
        }
      })
      .catch(() => {
        const found = FLEET_MISSIONS.find((m) => m.id === activeId)
        if (found) {
          setCurrentStage(found.defaultStage)
          setMissionName(found.name)
        }
      })
    return () => { alive = false }
  }, [activeId, open])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  async function handleSetStage(targetStage: string) {
    if (targetStage === currentStage) return
    setBusy(true)
    setError('')
    setNote('')
    try {
      await platformApi.setStage(activeId, targetStage)
      setCurrentStage(targetStage)
      setNote(
        en
          ? `Mission state changed to ${stageLabel(targetStage, true)}`
          : `Estado de misión cambiado a ${stageLabel(targetStage, false)}`
      )
      window.dispatchEvent(new Event('helios-workspace-changed'))
      window.setTimeout(() => {
        window.location.reload()
      }, 400)
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not update mission stage' : 'No se pudo cambiar el estado de la misión'))
    } finally {
      setBusy(false)
    }
  }

  function handleSwitchMission(targetMissionId: string) {
    if (targetMissionId === activeId) {
      setOpen(false)
      return
    }
    setBusy(true)
    setError('')
    try {
      setActiveMissionId(targetMissionId)
      window.dispatchEvent(new Event('helios-workspace-changed'))
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not switch mission' : 'No se pudo cambiar de misión'))
    } finally {
      setBusy(false)
    }
  }

  const stageInfo = STAGES.find((s) => s.id === currentStage) || STAGES[2]

  const dialog =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div className="role-switch-layer" role="presentation">
            <button
              type="button"
              className="role-switch-scrim"
              aria-label={en ? 'Close mission menu' : 'Cerrar menú de misión'}
              onClick={() => setOpen(false)}
            />
            <div
              id="mission-switch-panel"
              className="role-switch-panel mission-switch-panel"
              role="dialog"
              aria-modal="true"
              aria-label={en ? 'Mission and Stage Control' : 'Control de Misión y Estado'}
              style={{ width: 'min(640px, 100%)', maxHeight: 'min(88dvh, 740px)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid color-mix(in srgb, currentColor 12%, transparent)', paddingBottom: 10 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Rocket size={18} style={{ color: '#38bdf8' }} />
                    {en ? 'Mission & Stage Control' : 'Control de Misión y Estado'}
                  </h3>
                  <p className="role-switch-lead" style={{ marginTop: 4 }}>
                    {en ? 'Active Mission:' : 'Misión activa:'} <strong>{missionName.replace(/ — .+$/, '')}</strong> ({stageLabel(currentStage, en)})
                  </p>
                </div>
                <span className={`mission-stage-dot ${stageInfo.badgeClass}`} style={{ width: 12, height: 12 }} />
              </div>

              {/* Section 1: Change Mission Stage */}
              <div style={{ marginTop: 8 }}>
                <strong style={{ fontSize: '0.92rem', color: 'inherit', display: 'block', marginBottom: 4 }}>
                  {en ? '1. Change Mission Stage / Operational State' : '1. Cambiar estado / etapa de la misión'}
                </strong>
                <p className="role-switch-lead" style={{ marginBottom: 10 }}>
                  {en
                    ? 'Switch between mission phases to test preflight checklists, active flight telemetry, or retrospective debriefing:'
                    : 'Cambiá entre fases para probar checklist de preparación, telemetría activa en vuelo o revisión histórica:'}
                </p>
                <div className="role-switch-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                  {STAGES.map((s) => {
                    const isCurrent = currentStage === s.id
                    return (
                      <button
                        key={s.id}
                        type="button"
                        className={`role-switch-card${isCurrent ? ' is-on' : ''}`}
                        disabled={busy}
                        onClick={() => void handleSetStage(s.id)}
                        style={isCurrent ? { borderColor: s.color, background: `color-mix(in srgb, ${s.color} 14%, transparent)`, boxShadow: `0 0 0 1px ${s.color}` } : {}}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ color: isCurrent ? s.color : 'var(--rd-text, #0f172a)', fontSize: '0.94rem' }}>
                            {en ? s.nameEn : s.nameEs}
                          </strong>
                          {isCurrent ? (
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: s.color, color: '#fff' }}>
                              ✓ {en ? 'Active' : 'Actual'}
                            </span>
                          ) : null}
                        </div>
                        <span className="mission-card-desc" style={{ fontSize: '0.8rem', color: 'var(--rd-muted, #475569)', lineHeight: 1.35, fontWeight: 500 }}>
                          {en ? s.descEn : s.descEs}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Section 2: Switch Mission */}
              <div style={{ marginTop: 14, borderTop: '1px solid color-mix(in srgb, currentColor 12%, transparent)', paddingTop: 12 }}>
                <strong style={{ fontSize: '0.92rem', color: 'inherit', display: 'block', marginBottom: 4 }}>
                  {en ? '2. Switch Active Mission' : '2. Cambiar de misión'}
                </strong>
                <p className="role-switch-lead" style={{ marginBottom: 10 }}>
                  {en
                    ? 'Select another mission from the fleet:'
                    : 'Seleccioná otra misión de la flota espacial:'}
                </p>
                <div style={{ display: 'grid', gap: 8 }}>
                  {FLEET_MISSIONS.map((m) => {
                    const isActive = activeId === m.id
                    const mStage = STAGES.find((s) => s.id === m.defaultStage)
                    return (
                      <button
                        key={m.id}
                        type="button"
                        className={`role-switch-card${isActive ? ' is-on' : ''}`}
                        disabled={busy}
                        onClick={() => handleSwitchMission(m.id)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' }}
                      >
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.92rem', color: 'var(--rd-text, #0f172a)' }}>{m.name}</strong>
                          <span className="mission-card-desc" style={{ fontSize: '0.8rem', color: 'var(--rd-muted, #475569)', lineHeight: 1.35, fontWeight: 500 }}>
                            {en ? m.descEn : m.descEs}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 650,
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: `color-mix(in srgb, ${mStage?.color || '#38bdf8'} 14%, transparent)`,
                              color: mStage?.color || 'inherit',
                              border: `1px solid color-mix(in srgb, ${mStage?.color || '#38bdf8'} 40%, transparent)`,
                            }}
                          >
                            {stageLabel(m.defaultStage, en)}
                          </span>
                          {isActive ? (
                            <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.85rem' }}>✓</span>
                          ) : null}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {note ? (
                <p style={{ margin: '8px 0 0', color: '#10b981', fontSize: '0.88rem', fontWeight: 600 }}>
                  ✓ {note}
                </p>
              ) : null}

              {error ? (
                <p className="rd-error" role="alert" style={{ margin: '8px 0 0' }}>
                  {error}
                </p>
              ) : null}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                <a
                  href="/misiones"
                  className="rd-btn ghost"
                  style={{ fontSize: '0.82rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  onClick={() => setOpen(false)}
                >
                  <ExternalLink size={14} />
                  {en ? 'Open Missions Hub' : 'Abrir Hub de Misiones'}
                </a>
                <button type="button" className="rd-btn ghost" onClick={() => setOpen(false)}>
                  {en ? 'Close' : 'Cerrar'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null

  const dotClass =
    currentStage === 'aboard'
      ? 'is-aboard'
      : currentStage === 'preflight'
        ? 'is-preflight'
        : currentStage === 'draft'
          ? 'is-draft'
          : 'is-postmission'

  return (
    <div className={`mission-switch${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="mission-switch-trigger"
        aria-expanded={open}
        aria-controls="mission-switch-panel"
        disabled={busy}
        onClick={() => setOpen((value) => !value)}
        title={en ? 'Change active mission or stage' : 'Cambiar misión activa o estado'}
      >
        {busy ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={13} className="spin" />
            {en ? 'Updating…' : 'Actualizando…'}
          </span>
        ) : (
          <>
            <span className={`mission-stage-dot ${dotClass}`} aria-hidden="true" />
            <Rocket size={14} aria-hidden="true" />
            <span className="mission-switch-long">
              {en ? 'Mission: ' : 'Misión: '}
              <strong>{missionName.replace('HELIOS ', '')}</strong>
              {' · '}
              {stageLabel(currentStage, en)}
            </span>
            <span className="mission-switch-short">
              {missionName.replace('HELIOS ', '')}
            </span>
          </>
        )}
      </button>
      {dialog}
    </div>
  )
}
