import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HeliosLogo } from '../../components/HeliosLogo'
import { LocaleThemeSwitch } from '../../components/LocaleThemeSwitch'
import { MissionProcessStrip } from '../../components/platform/MissionProcessStrip'
import { ColdStartNotice, useColdStartTimer } from '../../components/ColdStartNotice'
import { useLocale } from '../../i18n'
import { getCachedMissions, platformApi, type MissionRow } from '../../platform/api'
import { roleLabel, stageBlurb, stageLabel } from '../../platform/copy'
import { clearSession, getSessionToken, getStoredProfile, setActiveMissionId } from '../../platform/session'
import {
  clearRoleScopedUiState,
  isDemoExplore,
  resolveAuthorizedRole,
  setWorkspaceMode,
  setWorkspaceRole,
} from '../../platform/workspace'
import '../../platform/platform.css'

const STAGE_DISPLAY_ORDER = ['aboard', 'preflight', 'draft', 'postmission'] as const
type StageFilter = 'all' | (typeof STAGE_DISPLAY_ORDER)[number]

/** Una sola misión por etapa: In Flight primero, y solo el admin ve Draft y Preflight. */
function onePerStage(rows: MissionRow[], isChief: boolean): MissionRow[] {
  const allowed = isChief
    ? rows
    : rows.filter((row) => row.mission.stage !== 'draft' && row.mission.stage !== 'preflight')

  const latest = new Map<string, MissionRow>()
  for (const row of allowed) latest.set(row.mission.stage, row)

  const stageList = isChief ? STAGE_DISPLAY_ORDER : (['aboard', 'postmission'] as const)
  return stageList.flatMap((stage) => {
    const row = latest.get(stage)
    return row ? [row] : []
  })
}

export function MissionsHubPage() {
  const navigate = useNavigate()
  const { lang } = useLocale()
  const en = lang === 'en'
  const profile = getStoredProfile()
  const isChief = profile?.demoRole === 'chief'
  const [items, setItems] = useState<MissionRow[]>(() => getCachedMissions())
  const [stageFilter, setStageFilter] = useState<StageFilter>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { showNotice, elapsed } = useColdStartTimer(loading && items.length === 0, 2200)

  const availableStages = useMemo(() => (
    isChief
      ? STAGE_DISPLAY_ORDER
      : (['aboard', 'postmission'] as const)
  ), [isChief])

  const visible = useMemo(() => {
    const picked = onePerStage(items, Boolean(isChief))
    return stageFilter === 'all' ? picked : picked.filter((row) => row.mission.stage === stageFilter)
  }, [items, isChief, stageFilter])

  useEffect(() => {
    document.title = en ? 'HELIOS · Missions' : 'HELIOS · Misiones'
    if (!getSessionToken()) {
      navigate('/entrar', { replace: true })
      return
    }
    void refresh()
  }, [navigate, en])

  async function refresh() {
    setLoading(true)
    setError('')
    try {
      const data = await platformApi.missions()
      setItems(data.items.filter(Boolean) as MissionRow[])
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not load missions' : 'Error al cargar misiones'))
    } finally {
      setLoading(false)
    }
  }

  function enter(missionId: string, membershipRole: string) {
    clearRoleScopedUiState()
    setActiveMissionId(missionId)
    const resolved = resolveAuthorizedRole(membershipRole, profile?.demoRole)
    if (resolved) {
      setWorkspaceRole(resolved)
      setWorkspaceMode(isDemoExplore() ? 'demo' : 'authorized')
    }
    navigate('/app')
  }

  function nextAction(stage: string, prepPercent: number) {
    if (stage === 'draft') return en ? 'Set up your mission' : 'Configurá la misión'
    if (stage === 'preflight') {
      return prepPercent >= 80
        ? (en ? 'Ready to start' : 'Lista para empezar')
        : (en ? 'Complete the Preparation Checklist (80%+)' : 'Completá el checklist (80%+)')
    }
    if (stage === 'aboard') return en ? 'Active In Flight' : 'Activa en vuelo'
    if (stage === 'postmission') return en ? 'Mission Review' : 'Revisión de misión'
    return stageLabel(stage, en)
  }

  return (
    <div className="plat">
      {showNotice ? (
        <ColdStartNotice en={en} elapsed={elapsed} variant="overlay" />
      ) : (loading && items.length === 0) ? (
        <div className="plat-loader" role="status" aria-live="polite">
          <span className="plat-spinner" aria-hidden="true" />
          <p>{en ? 'Loading missions…' : 'Cargando misiones…'}</p>
        </div>
      ) : null}
      <div className="plat-shell">
        <div className="plat-top">
          <HeliosLogo variant="wordmark" />
          <div className="plat-top-tools">
            <LocaleThemeSwitch />
            <div className="plat-actions">
              <span className="plat-chip">{profile?.displayName}</span>
              <button
                type="button"
                className="plat-btn ghost"
                onClick={() => {
                  clearSession()
                  navigate('/entrar')
                }}
              >
                {en ? 'Switch profile' : 'Cambiar perfil'}
              </button>
            </div>
          </div>
        </div>
        <p className="plat-kicker">{en ? 'Mission hub' : 'Hub de misiones'}</p>
        <h1>{en ? 'Your mission space' : 'Tu espacio de misión'}</h1>
        <p className="plat-lead">
          {isChief
            ? (en
              ? 'Create a mission or continue one. Each card shows which process step you are in.'
              : 'Creá una misión o continuá una. Cada tarjeta muestra en qué proceso estás.')
            : (en
              ? 'Continue a mission you already belong to and see its current process step.'
              : 'Continuá una misión a la que ya pertenecés y mirá en qué proceso está.')}
        </p>
        {isChief ? (
          <div className="plat-actions" style={{ marginBottom: 20 }}>
            <Link className="plat-btn" to="/misiones/nueva">{en ? 'Create mission' : 'Crear misión'}</Link>
          </div>
        ) : null}

        <section className="plat-panel">
          <h2>{en ? 'Continue one of my missions' : 'Continuar una de mis misiones'}</h2>
          <div className="mission-hub-filters" role="group" aria-label={en ? 'Filter by stage' : 'Filtrar por etapa'}>
            <button type="button" aria-pressed={stageFilter === 'all'} onClick={() => setStageFilter('all')}>
              {en ? 'All' : 'Todas'}
            </button>
            {availableStages.map((stage) => (
              <button
                key={stage}
                type="button"
                aria-pressed={stageFilter === stage}
                onClick={() => setStageFilter(stage)}
              >
                {stageLabel(stage, en)}
              </button>
            ))}
          </div>
          {!loading && visible.length === 0 ? (
            <p>
              {items.length === 0
                ? (en ? 'You have no active missions yet.' : 'Todavía no tenés misiones activas.')
                : (en ? 'No mission in this stage.' : 'No hay una misión en esta etapa.')}
            </p>
          ) : null}
          {error ? <p className="plat-error">{error}</p> : null}
          <div className="plat-list mission-hub-list">
            {visible.map((row) => {
              const pct = Number(row.mission.prepPercent) || 0
              return (
                <article className="mission-hub-card" key={row.mission.id}>
                  <div className="mission-hub-main">
                    <div className="mission-hub-title">
                      <strong>{row.mission.name}</strong>
                      <span className="plat-chip">{row.mission.code}</span>
                    </div>
                    <p className="mission-hub-blurb">{stageBlurb(row.mission.stage, en)}</p>
                    <MissionProcessStrip stage={row.mission.stage} en={en} compact />
                    <div className="mission-hub-meta">
                      <span className="mission-hub-stage">{stageLabel(row.mission.stage, en)}</span>
                      <span>{roleLabel(row.membership.role, en)}</span>
                      <span>{nextAction(row.mission.stage, pct)}</span>
                    </div>
                    {row.mission.stage === 'aboard' ? (
                      <div className="mission-hub-flight-live" style={{ margin: '8px 0' }}>
                        <span className="plat-chip" style={{ background: 'color-mix(in srgb, #f5004f 22%, transparent)', color: '#ff4d79', fontWeight: 800 }}>
                          ● {en ? 'Active Mission In Flight' : 'Misión activa en vuelo'}
                        </span>
                      </div>
                    ) : row.mission.stage === 'draft' ? (
                      <p className="mission-hub-blurb">{en ? 'Preparation Checklist has not been created.' : 'El checklist de preparación todavía no existe.'}</p>
                    ) : (
                    <div className="mission-hub-prep">
                      <div className="mission-hub-prep-top">
                        <span>{en ? 'Preparation Checklist' : 'Checklist de preparación'}</span>
                        <strong className={pct >= 80 ? 'is-ok' : undefined}>{pct}%</strong>
                      </div>
                      <div className="mission-hub-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                        <span style={{ width: `${Math.min(100, pct)}%` }} />
                        <i style={{ left: '80%' }} title="80%" />
                      </div>
                    </div>
                    )}
                  </div>
                  <button type="button" className="plat-btn" onClick={() => enter(row.mission.id, row.membership.role)}>
                    {row.mission.stage === 'aboard'
                      ? (en ? 'Enter in-flight mission' : 'Ingresar a misión en vuelo')
                      : (en ? 'Enter dashboard' : 'Entrar al tablero')}
                  </button>
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
