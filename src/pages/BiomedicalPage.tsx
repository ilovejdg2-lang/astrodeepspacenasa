import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Heart,
  Wind,
  Moon,
  Bone,
  Apple,
  Smile,
  User,
  ShieldCheck,
  Lock,
} from 'lucide-react'
import { useLocale } from '../i18n'
import { useMissionWorkspace } from './role/useMissionWorkspace'
import { platformApi, type HealthIndicatorReading } from '../platform/api'
import type { PainMapReport } from '../domain/painMap'
import { normalizePainMark } from '../domain/painMap'
import {
  BIOMEDICAL_SYSTEMS,
  type BiomedicalSystemId,
  generateFallbackBiomedicalIndicators,
  getSystemById,
  isSystemAuthorizedForRole,
} from '../domain/biomedical'
import { BiomedicalBodyViewer } from '../components/biomedical/BiomedicalBodyViewer'
import { SystemPanel } from '../components/biomedical/SystemPanel'
import { InfoHelp } from '../components/InfoHelp'
import { IndicatorTrendsChart } from '../components/biomedical/IndicatorTrendsChart'
import { SpaceflightContextBlock } from '../components/biomedical/SpaceflightContextBlock'
import { NasaEvidenceCards } from '../components/biomedical/NasaEvidenceCards'
import { QuironContextModal } from '../components/biomedical/QuironContextModal'
import { RecordIndicatorModal } from '../components/biomedical/RecordIndicatorModal'
import { RecordPainModal } from '../components/biomedical/RecordPainModal'
import { profileDisplayName } from '../platform/copy'
import { grantToSubject, isActiveGrant, type PlatformGrant } from '../platform/grants'
import './biomedical.css'
import '../platform/role-dash.css'

export function BiomedicalPage() {
  const navigate = useNavigate()
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
    grants,
    appointments,
    loading: workspaceLoading,
    refresh,
  } = useMissionWorkspace()

  const effectiveRole = role || (profile?.demoRole === 'psychologist' || profile?.id === 'alex-morgan' ? 'psychologist' : profile?.demoRole === 'medic' || profile?.id === 'sofia-chen' ? 'medic' : 'crew')
  const isClinicalRole = effectiveRole === 'medic' || effectiveRole === 'psychologist'

  // Patient selector state ('' means My Personal Record)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [selectedPainMarkId, setSelectedPainMarkId] = useState<string | null>(null)
  const isSelf = !selectedSubjectId || selectedSubjectId === profile?.id

  // Target subject ID (self or selected patient for clinical professional)
  const effectiveSubjectId = useMemo(() => {
    if (isClinicalRole && selectedSubjectId && selectedSubjectId !== profile?.id) return selectedSubjectId
    return profile?.id || ''
  }, [isClinicalRole, selectedSubjectId, profile?.id])

  // Active patient-authorized categories:
  // When viewing own record, null (all categories accessible).
  // When evaluating another patient, collects categories authorized via appointments or grants.
  const patientAuthorizedCategories = useMemo(() => {
    if (isSelf) return null
    const categories = new Set<string>()

    const patientAppointments = (appointments as Array<{ requesterId?: string; professionalId?: string; status?: string; shareCategories?: string[] }>).filter(
      (a) => a.requesterId === effectiveSubjectId && a.professionalId === profile?.id && a.status !== 'cancelled'
    )
    patientAppointments.forEach((a) => {
      ;(a.shareCategories || []).forEach((c) => categories.add(c))
    })

    const activeGrant = (grants as PlatformGrant[]).find(
      (g) => isActiveGrant(g) && g.subjectProfileId === effectiveSubjectId && g.granteeProfileId === profile?.id
    )
    if (activeGrant?.categories) {
      activeGrant.categories.forEach((c) => categories.add(c))
    }

    return categories
  }, [isSelf, appointments, effectiveSubjectId, profile?.id, grants])

  // Consent checking: user always has access to self; other members require active consent grant or appointment share
  const isConsentGranted = useMemo(() => {
    if (isSelf) return true
    const hasPlatformGrant = grantToSubject(grants, effectiveSubjectId, profile?.id)
    if (hasPlatformGrant) return true
    return (patientAuthorizedCategories?.size ?? 0) > 0
  }, [isSelf, grants, effectiveSubjectId, profile?.id, patientAuthorizedCategories])

  // Filter systems:
  // When viewing own personal record (isSelf = true), all 6 bodily systems are available to everyone.
  // Only when evaluating a patient (!isSelf) does specialist scope filtering apply:
  // - Medic evaluates physical systems (musculoskeletal, cardiovascular, respiratory, nutrition)
  // - Psychologist evaluates psychological/behavioral systems (sleep, emotional)
  // Furthermore, if patient authorized specific categories, only authorized systems appear!
  const visibleSystems = useMemo(() => {
    if (isSelf) {
      return BIOMEDICAL_SYSTEMS
    }
    if (effectiveRole === 'psychologist') {
      const psychAllowed = BIOMEDICAL_SYSTEMS.filter((sys) => sys.id === 'sleep' || sys.id === 'emotional')
      if (patientAuthorizedCategories && patientAuthorizedCategories.size > 0) {
        const filtered = psychAllowed.filter((sys) => {
          if (sys.id === 'sleep') return patientAuthorizedCategories.has('sleep') || patientAuthorizedCategories.has('cognitive_fatigue')
          if (sys.id === 'emotional') return patientAuthorizedCategories.has('emotional') || patientAuthorizedCategories.has('behavioral')
          return false
        })
        if (filtered.length > 0) return filtered
      }
      return psychAllowed
    }
    if (effectiveRole === 'medic') {
      const medicAllowed = BIOMEDICAL_SYSTEMS.filter(
        (sys) => sys.id === 'musculoskeletal' || sys.id === 'cardiovascular' || sys.id === 'respiratory' || sys.id === 'nutrition'
      )
      if (patientAuthorizedCategories && patientAuthorizedCategories.size > 0) {
        const filtered = medicAllowed.filter((sys) => {
          if (sys.id === 'musculoskeletal') return patientAuthorizedCategories.has('pain_somatic') || patientAuthorizedCategories.has('symptoms')
          if (sys.id === 'cardiovascular') return patientAuthorizedCategories.has('vitals')
          if (sys.id === 'respiratory') return patientAuthorizedCategories.has('respiratory') || patientAuthorizedCategories.has('vitals')
          if (sys.id === 'nutrition') return patientAuthorizedCategories.has('nutrition')
          return false
        })
        if (filtered.length > 0) return filtered
      }
      return medicAllowed
    }
    return BIOMEDICAL_SYSTEMS
  }, [isSelf, effectiveRole, patientAuthorizedCategories])

  // Selected system state (default to Musculoskeletal/Body Pain for full personal view)
  const [activeSystemId, setActiveSystemId] = useState<BiomedicalSystemId>('musculoskeletal')

  // Keep activeSystemId synchronized with visible systems
  useEffect(() => {
    if (!visibleSystems.some((sys) => sys.id === activeSystemId)) {
      const first = visibleSystems[0]
      if (first) {
        setActiveSystemId(first.id)
      }
    }
  }, [visibleSystems, activeSystemId])

  // Active subject profile details
  const targetMember = useMemo(() => {
    if (!detail?.members || !effectiveSubjectId) return null
    return detail.members.find((m) => m.profileId === effectiveSubjectId)
  }, [detail?.members, effectiveSubjectId])

  // Indicators and pain reports
  const [indicators, setIndicators] = useState<HealthIndicatorReading[]>([])
  const [painReports, setPainReports] = useState<PainMapReport[]>([])
  const [dataLoading, setDataLoading] = useState(false)

  // Modals state
  const [recordIndicatorOpen, setRecordIndicatorOpen] = useState(false)
  const [recordPainOpen, setRecordPainOpen] = useState(false)
  const [quironModalOpen, setQuironModalOpen] = useState(false)
  const [quironModalReading, setQuironModalReading] = useState<HealthIndicatorReading | undefined>(undefined)

  // Load telemetry data (only if self or consent is active)
  const loadData = useCallback(async () => {
    if (!missionId) return
    if (!isSelf && !isConsentGranted) {
      setIndicators([])
      setPainReports([])
      setDataLoading(false)
      return
    }

    setDataLoading(true)
    try {
      const [indRes, painRes] = await Promise.all([
        platformApi.listIndicators(missionId, {
          subjectId: role === 'medic' && !isSelf && effectiveSubjectId ? effectiveSubjectId : undefined,
        }).catch(() => ({ items: [] })),
        platformApi.listPainMaps(
          missionId,
          role === 'medic' && !isSelf && effectiveSubjectId ? effectiveSubjectId : undefined,
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
                localPosition: { x: 0, y: 1.04, z: -0.11 },
                normal: { x: 0, y: 0, z: -1 },
                surfaceId: 'torso',
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
      const normalizedPain = finalPain.map((r) => ({
        ...r,
        marks: r.marks.map((m) => normalizePainMark(m)),
      }))
      setPainReports(normalizedPain)
      if (normalizedPain[0]?.marks[0]?.id) {
        setSelectedPainMarkId((curr) => {
          const exists = normalizedPain.some((r) => r.marks.some((m) => m.id === curr))
          return exists ? curr : (normalizedPain[0]?.marks[0]?.id ?? null)
        })
      }
    } finally {
      setDataLoading(false)
    }
  }, [missionId, role, isSelf, isConsentGranted, effectiveSubjectId, profile?.id])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleAddPainObservation = useCallback(async (reportId: string, noteText: string) => {
    if (!missionId) return
    await platformApi.addPainClinicalNote(missionId, reportId, noteText)
    await loadData()
  }, [missionId, loadData])

  const activePainDraft = useMemo(() => {
    if (!painReports[0]?.marks?.length) return null
    return {
      v: 1 as const,
      marks: painReports[0].marks.map((m) => ({
        ...m,
        labelSource: m.labelSource || 'auto',
      })),
      followsReportId: null,
      correctingId: null,
      appointmentId: null,
    }
  }, [painReports])

  const activeSystem = getSystemById(activeSystemId)
  const isAuthorized = isSelf || isSystemAuthorizedForRole(activeSystemId, role)

  // Quick navigation to appointment desk if user requests consultation
  function handleRequestConsultation() {
    navigate('/app/citas')
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
          <h1>
            {en ? 'Biomedical Insights' : 'Perspectivas biomédicas'}
            <InfoHelp
              title="Perspectivas Biomédicas y Fisiología"
              enTitle="Biomedical Insights & Physiology"
              whatIs="Explorador interactivo de los sistemas del cuerpo humano en el espacio (músculos, corazón, pulmones, sueño y descanso) y cómo los impacta la gravedad cero y la radiación."
              enWhatIs="Interactive explorer of the human body in space (musculoskeletal, cardiovascular, respiratory, sleep, and recovery) showing how zero-gravity and radiation affect astronauts."
              steps={[
                'Rotá y hacé clic en el astronauta 3D para inspeccionar cada sistema anatómico.',
                'Cambiá de pestaña para explorar métricas fisiológicas: corazón, pulmones, descanso y nutrición.',
                'En el mapa de dolor, registrá cualquier molestia física marcando la zona exacta y su intensidad.',
                'Revisá la evidencia y protocolos de la NASA asociados a cada riesgo biomédico.',
              ]}
              enSteps={[
                'Rotate and click the 3D astronaut to inspect each anatomical system.',
                'Switch tabs to view physiological telemetry: heart rate, respiration, sleep, and nutrition.',
                'Use the pain map to log physical discomfort by pinpointing the body region and pain level.',
                'Check documented NASA risks, countermeasures, and protocols for each bodily system.',
              ]}
            />
          </h1>
          <p className="rd-muted">
            {en
              ? 'Explore your health indicators, body systems and spaceflight context.'
              : 'Explorá tus indicadores de salud, sistemas corporales y contexto de vuelo espacial.'}
          </p>
        </div>

        {/* Patient Switcher for Clinical Roles (Medic & Psychologist) */}
        {isClinicalRole && detail?.members ? (
          <div className="biomed-patient-select-box">
            <label htmlFor="biomed-patient-select" className="biomed-patient-label">
              <User size={14} aria-hidden="true" />
              <span>{en ? 'Record view:' : 'Vista del registro:'}</span>
            </label>
            <select
              id="biomed-patient-select"
              value={isSelf ? '' : effectiveSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="biomed-patient-dropdown"
            >
              <option value="">
                ★ {en ? 'My Personal Record' : 'Mi registro personal'} ({profileDisplayName(profile?.id || '')})
              </option>
              <optgroup label={en ? 'Crew Clinical Evaluation' : 'Evaluación clínica de tripulación'}>
                {detail.members
                  .filter((m) => m.profileId !== profile?.id)
                  .map((m) => {
                    const hasConsent = grantToSubject(grants, m.profileId, profile?.id) ||
                      (appointments as Array<{ requesterId?: string; professionalId?: string; status?: string; shareCategories?: string[] }>).some(
                        (a) => a.requesterId === m.profileId && a.professionalId === profile?.id && a.status !== 'cancelled' && (a.shareCategories?.length ?? 0) > 0
                      )
                    return (
                      <option key={m.profileId} value={m.profileId}>
                        {profileDisplayName(m.profileId)} ({m.role}) — {hasConsent ? (en ? '✓ Consent Active' : '✓ Con consentimiento') : (en ? '🔒 Consent Required' : '🔒 Requiere consentimiento')}
                      </option>
                    )
                  })}
              </optgroup>
            </select>
            <span className={`biomed-badge ${isSelf ? 'badge-self' : isConsentGranted ? 'badge-observation' : 'badge-restricted'}`}>
              {isSelf
                ? (en ? 'Personal Record (Full Edit)' : 'Registro personal (Edición)')
                : isConsentGranted
                  ? (en ? 'Clinical View (Read-Only)' : 'Vista clínica (Solo lectura)')
                  : (en ? 'Privacy Protected (Locked)' : 'Protegido por privacidad')}
            </span>
          </div>
        ) : null}

        {/* Clinical Scope Badge - ONLY displays when evaluating another patient (!isSelf) */}
        {!isSelf && effectiveRole === 'medic' ? (
          <div className="biomed-psych-badge" style={{ borderColor: 'rgba(56, 189, 248, 0.4)' }}>
            <ShieldCheck size={14} aria-hidden="true" />
            <span>
              {en
                ? `Authorized Scope: Physical Systems (${visibleSystems.map((s) => s.name.en).join(', ')})`
                : `Alcance autorizado: Sistemas físicos (${visibleSystems.map((s) => s.name.es).join(', ')})`}
            </span>
          </div>
        ) : null}

        {!isSelf && effectiveRole === 'psychologist' ? (
          <div className="biomed-psych-badge">
            <ShieldCheck size={14} aria-hidden="true" />
            <span>
              {en
                ? `Authorized Scope: Psychological & Behavioral Systems (${visibleSystems.map((s) => s.name.en).join(', ')})`
                : `Alcance autorizado: Sistemas psicológicos y conductuales (${visibleSystems.map((s) => s.name.es).join(', ')})`}
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
        {visibleSystems.map((sys) => {
          const isSysAuth = isSelf || isSystemAuthorizedForRole(sys.id, role)
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

      {/* Main Content Area: Consent Gated for Other Patients */}
      {!isSelf && !isConsentGranted ? (
        <div className="biomed-consent-locked" role="alert">
          <div className="biomed-locked-card">
            <div className="biomed-locked-icon-wrap" aria-hidden="true">
              <Lock size={34} />
            </div>
            <h3>{en ? 'Patient Consent Required' : 'Se requiere consentimiento del paciente'}</h3>
            <p className="biomed-locked-desc">
              {en
                ? `${profileDisplayName(effectiveSubjectId)} has not authorized medical access to their physiological telemetry and body pain maps. Under mission medical ethics, crew health data remains private and confidential until access is granted by the patient.`
                : `${profileDisplayName(effectiveSubjectId)} no ha autorizado el acceso médico a su telemetría fisiológica ni mapa de dolor. Bajo la ética médica de la misión, los datos de salud permanecen privados y confidenciales hasta que el paciente otorgue su consentimiento.`}
            </p>
            <div className="biomed-locked-actions">
              <button
                type="button"
                className="rd-btn is-primary"
                onClick={() => setSelectedSubjectId('')}
              >
                {en ? 'Return to My Personal Record' : 'Volver a mi registro personal'}
              </button>
            </div>
          </div>
        </div>
      ) : activeSystemId === 'musculoskeletal' ? (
        <div className="biomed-split-layout">
          <aside className="biomed-viewer-column" aria-label={en ? 'Interactive body viewer' : 'Visor corporal interactivo'}>
            <BiomedicalBodyViewer
              en={en}
              activeSystemId={activeSystemId}
              onSelectSystem={setActiveSystemId}
              painReports={painReports}
              selectedMarkId={selectedPainMarkId}
              onSelectMark={setSelectedPainMarkId}
              onOpenModal={() => setRecordPainOpen(true)}
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
              selectedMarkId={selectedPainMarkId}
              onSelectMark={setSelectedPainMarkId}
              onOpenRecordIndicator={() => setRecordIndicatorOpen(true)}
              onOpenRecordPain={() => setRecordPainOpen(true)}
              onOpenQuironModal={handleOpenQuiron}
              onRequestConsultation={handleRequestConsultation}
              isSelf={isSelf}
              targetMemberName={profileDisplayName(effectiveSubjectId)}
              onAddObservation={handleAddPainObservation}
            />
          </main>
        </div>
      ) : (
        <div className="biomed-split-layout is-single-column">
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
              isSelf={isSelf}
              targetMemberName={profileDisplayName(effectiveSubjectId)}
              onAddObservation={handleAddPainObservation}
            />
          </main>
        </div>
      )}

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
          canRecord={isSelf && detail?.mission.stage !== 'postmission' && detail?.mission.stage !== 'archived'}
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
            isSelf={isSelf}
            patientName={targetMember ? profileDisplayName(targetMember.profileId) : profile?.displayName}
            reports={painReports}
            seed={activePainDraft}
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
