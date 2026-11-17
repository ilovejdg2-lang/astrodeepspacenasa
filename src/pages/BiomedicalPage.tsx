import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Heart,
  Wind,
  Moon,
  Bone,
  Apple,
  Smile,
  User,
  ShieldCheck,
} from 'lucide-react'
import { useLocale } from '../i18n'
import { useMissionWorkspace } from './role/useMissionWorkspace'
import { platformApi, type HealthIndicatorReading } from '../platform/api'
import type { PainMapReport } from '../domain/painMap'
import {
  BIOMEDICAL_SYSTEMS,
  type BiomedicalSystemId,
  generateFallbackBiomedicalIndicators,
  getSystemById,
  isSystemAuthorizedForRole,
} from '../domain/biomedical'
import { BiomedicalBodyViewer } from '../components/biomedical/BiomedicalBodyViewer'
import { SystemPanel } from '../components/biomedical/SystemPanel'
import { IndicatorTrendsChart } from '../components/biomedical/IndicatorTrendsChart'
import { SpaceflightContextBlock } from '../components/biomedical/SpaceflightContextBlock'
import { NasaEvidenceCards } from '../components/biomedical/NasaEvidenceCards'
import { QuironContextModal } from '../components/biomedical/QuironContextModal'
import { RecordIndicatorModal } from '../components/biomedical/RecordIndicatorModal'
import { RecordPainModal } from '../components/biomedical/RecordPainModal'
import { profileDisplayName } from '../platform/copy'
import './biomedical.css'
import '../platform/role-dash.css'

export function BiomedicalPage() {
  const { lang } = useLocale()
  const en = lang === 'en'

  useEffect(() => {
    document.title = en ? 'HELIOS · Biomedical Insights' : 'HELIOS · Perspectivas biomédicas'
  }, [en])

  const {
    missionId,
    detail,
    profile,
    role,
    loading: workspaceLoading,
    refresh,
  } = useMissionWorkspace()

  // Selected system state (Body Pain by default)
  const [activeSystemId, setActiveSystemId] = useState<BiomedicalSystemId>('musculoskeletal')

  // Patient selector state for Medic role
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')

  // Indicators and pain reports
  const [indicators, setIndicators] = useState<HealthIndicatorReading[]>([])
  const [painReports, setPainReports] = useState<PainMapReport[]>([])
  const [dataLoading, setDataLoading] = useState(false)

  // Modals state
  const [recordIndicatorOpen, setRecordIndicatorOpen] = useState(false)
  const [recordPainOpen, setRecordPainOpen] = useState(false)
  const [quironModalOpen, setQuironModalOpen] = useState(false)
  const [quironModalReading, setQuironModalReading] = useState<HealthIndicatorReading | undefined>(undefined)

  // Target subject ID (self or selected patient for medic)
  const effectiveSubjectId = useMemo(() => {
    if (role === 'medic' && selectedSubjectId) return selectedSubjectId
    return profile?.id || ''
  }, [role, selectedSubjectId, profile?.id])

  // Active subject profile details
  const targetMember = useMemo(() => {
    if (!detail?.members || !effectiveSubjectId) return null
    return detail.members.find((m) => m.profileId === effectiveSubjectId)
  }, [detail?.members, effectiveSubjectId])

  // Load telemetry data
  const loadData = useCallback(async () => {
    if (!missionId) return
    setDataLoading(true)
    try {
      const [indRes, painRes] = await Promise.all([
        platformApi.listIndicators(missionId, {
          subjectId: role === 'medic' && effectiveSubjectId ? effectiveSubjectId : undefined,
        }).catch(() => ({ items: [] })),
        platformApi.listPainMaps(
          missionId,
          role === 'medic' && effectiveSubjectId ? effectiveSubjectId : undefined,
        ).catch(() => ({ items: [] })),
      ])
      const rawIndicators = indRes.items || []
      const finalIndicators = rawIndicators.length > 0
        ? rawIndicators
        : generateFallbackBiomedicalIndicators(effectiveSubjectId || profile?.id || 'mateo-ruiz', missionId)
      setIndicators(finalIndicators)

      const rawPain = painRes.items || []
      const finalPain = rawPain.length > 0
        ? rawPain
        : [
            {
              id: `${missionId}-pain-default`,
              missionId,
              profileId: effectiveSubjectId || profile?.id || 'mateo-ruiz',
              symptomReportId: null,
              appointmentId: null,
              modelId: 'mannequin-v1',
              modelVersion: '1.0.0',
              origin: 'self_report' as const,
              status: 'open' as const,
              marks: [
                {
                  id: 'mark-default-1',
                  kind: 'point' as const,
                  regionId: 'lower_back',
                  detectedRegionId: 'lower_back',
                  regionLabel: 'Lower back (lumbar)',
                  labelSource: 'auto' as const,
                  laterality: 'midline' as const,
                  aspect: 'posterior' as const,
                  localPosition: { x: 0, y: -0.05, z: -0.1 },
                  normal: { x: 0, y: 0, z: -1 },
                  surfaceId: 'trunk_post',
                  intensity: 3,
                  startedAt: Date.now() - 3600000,
                  pattern: 'intermittent' as const,
                  description: 'Spaceflight adaptation lumbar stiffness from microgravity spinal elongation',
                  activity: 'Post-exercise routine',
                  additionalSymptoms: 'stiffness',
                  notes: 'Self-reported space back ache.',
                },
              ],
              revisions: [],
              clinicalNotes: [],
              followsReportId: null,
              createdAt: Date.now() - 3600000,
              updatedAt: Date.now() - 3600000,
            },
          ]
      setPainReports(finalPain)
    } finally {
      setDataLoading(false)
    }
  }, [missionId, role, effectiveSubjectId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const activeSystem = getSystemById(activeSystemId)
  const isAuthorized = isSystemAuthorizedForRole(activeSystemId, role)

  // Quick navigation to appointment desk if user requests consultation
  function handleRequestConsultation() {
    window.location.hash = '#consultation'
    window.location.href = '/app/mi-salud'
  }

  function handleOpenQuiron(reading?: HealthIndicatorReading) {
    setQuironModalReading(reading)
    setQuironModalOpen(true)
  }

  // System Icon helper
  function getSystemIcon(id: BiomedicalSystemId) {
    switch (id) {
      case 'cardiovascular': return <Heart size={16} aria-hidden="true" />
      case 'respiratory': return <Wind size={16} aria-hidden="true" />
      case 'sleep': return <Moon size={16} aria-hidden="true" />
      case 'musculoskeletal': return <Bone size={16} aria-hidden="true" />
      case 'nutrition': return <Apple size={16} aria-hidden="true" />
      case 'emotional': return <Smile size={16} aria-hidden="true" />
    }
  }

  return (
    <div className="rd rd-crew biomedical-page">
      {/* Page Header */}
      <header className="rd-head biomed-main-header">
        <div className="biomed-header-title-block">
          <p className="rd-kicker">{en ? 'Physiological Telemetry & Space Health' : 'Telemetría fisiológica y salud espacial'}</p>
          <h1>{en ? 'Biomedical Insights' : 'Perspectivas biomédicas'}</h1>
          <p className="rd-muted">
            {en
              ? 'Explore your health indicators, body systems and spaceflight context.'
              : 'Explorá tus indicadores de salud, sistemas corporales y contexto de vuelo espacial.'}
          </p>
        </div>

        {/* Patient Switcher for Medic Role */}
        {role === 'medic' && detail?.members ? (
          <div className="biomed-patient-select-box">
            <label htmlFor="biomed-patient-select" className="biomed-patient-label">
              <User size={14} aria-hidden="true" />
              <span>{en ? 'Clinical evaluation patient:' : 'Paciente en evaluación:'}</span>
            </label>
            <select
              id="biomed-patient-select"
              value={effectiveSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="biomed-patient-dropdown"
            >
              {detail.members.map((m) => (
                <option key={m.profileId} value={m.profileId}>
                  {profileDisplayName(m.profileId)} ({m.role})
                </option>
              ))}
            </select>
            <span className="biomed-badge badge-observation">
              {en ? 'Authorized Clinical Scope' : 'Alcance clínico autorizado'}
            </span>
          </div>
        ) : null}

        {/* Psychologist Scope Badge */}
        {role === 'psychologist' ? (
          <div className="biomed-psych-badge">
            <ShieldCheck size={14} aria-hidden="true" />
            <span>
              {en
                ? 'Authorized Scope: Behavioral Health & Sleep/Circadian categories'
                : 'Alcance autorizado: Categorías de salud conductual y sueño/recuperación'}
            </span>
          </div>
        ) : null}
      </header>

      {workspaceLoading || dataLoading ? (
        <p className="rd-muted">{en ? 'Loading biomedical telemetry…' : 'Cargando telemetría biomédica…'}</p>
      ) : null}

      {/* Mission Stage Banners */}
      {detail?.mission.stage === 'draft' || detail?.mission.stage === 'preflight' ? (
        <div className="callout callout-amber" role="status">
          <p>
            {en
              ? 'Preflight preparation mode. Baseline physiological monitoring, spaceflight hazards, and clinical readiness standards are active. You can record baseline measurements and somatic symptoms.'
              : 'Modo de preparación prevuelo. Monitoreo fisiológico de línea base, riesgos espaciales y preparación clínica activos. Puede registrar mediciones de línea base y síntomas somáticos.'}
          </p>
        </div>
      ) : detail?.mission.stage === 'postmission' || detail?.mission.stage === 'archived' ? (
        <div className="callout" role="status">
          <p>
            {en
              ? 'Post-mission retrospective analysis. Historic mission physiological telemetry is preserved as read-only for post-flight science and mission review.'
              : 'Análisis retrospectivo postmisión. La telemetría fisiológica histórica se conserva en modo solo lectura para revisión científica.'}
          </p>
        </div>
      ) : null}

      {/* Systems Navigation Bar */}
      <nav className="biomed-systems-bar" aria-label={en ? 'Body systems' : 'Sistemas corporales'}>
        {BIOMEDICAL_SYSTEMS.map((sys) => {
          const isSysAuth = isSystemAuthorizedForRole(sys.id, role)
          const isActive = sys.id === activeSystemId
          const sysReadings = indicators.filter((r) => sys.indicatorKinds.includes(r.kind))

          return (
            <button
              key={sys.id}
              type="button"
              className={`biomed-system-tab ${isActive ? 'is-active' : ''} ${!isSysAuth ? 'is-restricted' : ''}`}
              onClick={() => setActiveSystemId(sys.id)}
              aria-selected={isActive}
              role="tab"
            >
              <span className="biomed-tab-icon">{getSystemIcon(sys.id)}</span>
              <span className="biomed-tab-text">{en ? sys.name.en : sys.name.es}</span>
              {sys.id === 'musculoskeletal' ? (
                <span className="biomed-tab-pill">{painReports.length}</span>
              ) : sys.indicatorKinds.length > 0 ? (
                <span className="biomed-tab-pill">{sysReadings.length}</span>
              ) : null}
            </button>
          )
        })}
      </nav>

      {/* Two-Column Desktop Section: Body Viewer (Left) & System Panel (Right) */}
      <div className="biomed-split-layout">
        <aside className="biomed-viewer-column" aria-label={en ? 'Interactive body viewer' : 'Visor corporal interactivo'}>
          <BiomedicalBodyViewer
            en={en}
            activeSystemId={activeSystemId}
            onSelectSystem={setActiveSystemId}
            painReports={painReports}
          />
        </aside>

        <main className="biomed-panel-column" aria-label={en ? 'System telemetry and details' : 'Telemetría y detalles del sistema'}>
          <SystemPanel
            en={en}
            system={activeSystem}
            readings={indicators}
            role={role}
            stage={detail?.mission.stage}
            painReports={painReports}
            onOpenRecordIndicator={() => setRecordIndicatorOpen(true)}
            onOpenRecordPain={() => setRecordPainOpen(true)}
            onOpenQuironModal={handleOpenQuiron}
            onRequestConsultation={handleRequestConsultation}
          />
        </main>
      </div>

      {/* Bottom Section: Indicator Trends / Changes Over Time */}
      {isAuthorized ? (
        <IndicatorTrendsChart
          en={en}
          systemId={activeSystemId}
          readings={indicators}
          missionStart={
            detail?.mission.plannedStart
              ? new Date(detail.mission.plannedStart).getTime()
              : null
          }
          onRecordNew={() => setRecordIndicatorOpen(true)}
          canRecord={detail?.mission.stage !== 'postmission' && detail?.mission.stage !== 'archived'}
        />
      ) : null}

      {/* Bottom Section: Spaceflight Context Block */}
      {isAuthorized ? (
        <SpaceflightContextBlock en={en} system={activeSystem} />
      ) : null}

      {/* Bottom Section: Integrated NASA Evidence */}
      <NasaEvidenceCards en={en} system={activeSystem} />

      {/* Modals */}
      {missionId ? (
        <>
          <RecordIndicatorModal
            open={recordIndicatorOpen}
            onClose={() => setRecordIndicatorOpen(false)}
            en={en}
            missionId={missionId}
            system={activeSystem}
            onSaved={() => {
              void loadData()
              refresh({ silent: true })
            }}
          />

          <RecordPainModal
            open={recordPainOpen}
            onClose={() => setRecordPainOpen(false)}
            en={en}
            missionId={missionId}
            profileId={effectiveSubjectId}
            stage={detail?.mission.stage}
            onSaved={() => {
              void loadData()
              refresh({ silent: true })
            }}
          />

          <QuironContextModal
            open={quironModalOpen}
            onClose={() => setQuironModalOpen(false)}
            en={en}
            system={activeSystem}
            latestReading={quironModalReading}
            crewMemberName={targetMember ? profileDisplayName(targetMember.profileId) : profile?.displayName}
          />
        </>
      ) : null}
    </div>
  )
}
