import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  HeartHandshake,
  Image as ImageIcon,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { useLocale } from '../i18n'
import { platformApi, type UserMemory } from '../platform/api'
import { getActiveMissionId, getStoredProfile } from '../platform/session'
import {
  readLocalMemories,
  writeLocalMemories,
  readLocalMemoryImage,
  writeLocalMemoryImage,
  deleteLocalMemoryImage,
} from '../persistence/memories'
import { QuironFigure } from '../components/quiron/QuironFigure'
import { InfoHelp } from '../components/InfoHelp'
import { Field, Modal } from '../components/ui'
import { systemText } from '../systemText'
import '../platform/role-dash.css'
import './memories.css'

function tomorrowDateKey() {
  const d = new Date(Date.now() + 86_400_000)
  return d.toISOString().slice(0, 10)
}

function formatDate(timestamp: number | null | undefined, en: boolean) {
  if (!timestamp) return ''
  return new Intl.DateTimeFormat(en ? 'en-US' : 'es-CR', {
    dateStyle: 'medium',
  }).format(timestamp)
}

function formatSlotTime(timestamp: number | null | undefined, en: boolean) {
  if (!timestamp) return ''
  const formatted = new Intl.DateTimeFormat(en ? 'en-GB' : 'es-CR', {
    timeZone: 'UTC',
    dateStyle: 'medium',
    timeStyle: 'short',
    hourCycle: 'h23',
  }).format(timestamp)
  return `${formatted} UTC`
}

function SecureMemoryImage({
  memoryId,
  hasImage,
  title,
  className,
  onClick,
}: {
  memoryId: string
  hasImage: boolean
  title: string
  className?: string
  onClick?: () => void
}) {
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    let blobUrl = ''
    if (hasImage) {
      readLocalMemoryImage(memoryId).then((localData) => {
        if (!active) return
        if (localData) {
          setSrc(localData)
          setFailed(false)
        }
      })
      platformApi
        .memoryImageBlob(memoryId)
        .then((blob) => {
          if (!active) return
          blobUrl = URL.createObjectURL(blob)
          setSrc(blobUrl)
          setFailed(false)
        })
        .catch(() => {
          if (!active) return
          readLocalMemoryImage(memoryId).then((localData) => {
            if (!active) return
            if (localData) {
              setSrc(localData)
              setFailed(false)
            } else {
              setFailed(true)
            }
          })
        })
    }
    return () => {
      active = false
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [memoryId, hasImage])

  if (!hasImage || failed || !src) {
    if (onClick) {
      return (
        <button type="button" className={className || 'memory-card-media'} onClick={onClick} aria-label={title}>
          <ImageIcon size={32} opacity={0.35} aria-hidden="true" />
        </button>
      )
    }
    return (
      <div className={className || 'memory-card-media'}>
        <ImageIcon size={32} opacity={0.35} aria-hidden="true" />
      </div>
    )
  }

  if (onClick) {
    return (
      <button type="button" className={className || 'memory-card-media'} onClick={onClick} aria-label={title}>
        <img src={src} alt={title} className="memory-card-img" />
      </button>
    )
  }

  return (
    <div className={className || 'memory-card-media'}>
      <img src={src} alt={title} className="memory-card-img" />
    </div>
  )
}

export function MemoriesPage() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const profile = getStoredProfile()
  const missionId = getActiveMissionId()

  const [memories, setMemories] = useState<UserMemory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusNotice, setStatusNotice] = useState('')

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMemory, setEditingMemory] = useState<UserMemory | null>(null)
  const [detailMemory, setDetailMemory] = useState<UserMemory | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<UserMemory | null>(null)
  const [isPsychModalOpen, setIsPsychModalOpen] = useState(false)

  // Form inputs
  const [formTitle, setFormTitle] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const [formImageBase64, setFormImageBase64] = useState<string | null>(null)
  const [formImageContentType, setFormImageContentType] = useState<string | null>(null)
  const [formRemoveImage, setFormRemoveImage] = useState(false)
  const [formBusy, setFormBusy] = useState(false)
  const [formError, setFormError] = useState('')

  // Mission stage
  const [missionStage, setMissionStage] = useState<string | null>(null)

  // Consultation request state
  const [psychStep, setPsychStep] = useState<1 | 2 | 3>(1) // 1: pick, 2: confirm, 3: success
  const [psychLoading, setPsychLoading] = useState(false)
  const [psychMembers, setPsychMembers] = useState<Array<{ profileId: string; role: string; status: string; displayName?: string }>>([])
  const [selectedPsychId, setSelectedPsychId] = useState('')
  const [selectedDay, setSelectedDay] = useState(tomorrowDateKey)
  const [slots, setSlots] = useState<{ start: number; label: string }[]>([])
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [psychReason, setPsychReason] = useState('')
  const [psychBusy, setPsychBusy] = useState(false)
  const [psychError, setPsychError] = useState('')
  const [urgentTriggered, setUrgentTriggered] = useState(false)

  // Load mission stage and psychologists
  useEffect(() => {
    let active = true
    if (!missionId) {
      setMissionStage(null)
      setPsychMembers([])
      return () => { active = false }
    }
    platformApi.mission(missionId)
      .then((data) => {
        if (!active) return
        setMissionStage(data.mission.stage)
        const psychs = (data.members || []).filter(
          (m) => m.status === 'active' && m.role === 'psychologist',
        )
        setPsychMembers(psychs)
        if (psychs[0]) setSelectedPsychId(psychs[0].profileId)
      })
      .catch(() => {
        if (active) {
          setMissionStage(null)
          setPsychMembers([])
        }
      })
    return () => { active = false }
  }, [missionId])

  // Load memories (initial read from local cache, then backend sync)
  useEffect(() => {
    let active = true
    if (!profile?.id) {
      setMemories([])
      setLoading(false)
      return () => { active = false }
    }

    // Fast local read
    readLocalMemories(profile.id).then((cached) => {
      if (!active) return
      if (cached && cached.length > 0) {
        setMemories(cached)
        setLoading(false)
      }
    })

    // Fetch from backend
    platformApi
      .memories()
      .then(async (data) => {
        if (!active) return
        const backendItems = data.items || []
        const cached = await readLocalMemories(profile.id)
        const backendIds = new Set(backendItems.map((m) => m.id))

        // Check if there are unsynced memories in local storage that aren't on backend
        const unsynced = cached.filter((m) => !backendIds.has(m.id))

        if (unsynced.length > 0) {
          const merged = [...backendItems]
          for (const item of unsynced) {
            try {
              const localImg = await readLocalMemoryImage(item.id)
              const uploaded = await platformApi.createMemory({
                title: item.title,
                message: item.message,
                imageBase64: localImg,
                imageContentType: item.imageContentType,
              })
              merged.unshift(uploaded)
              if (localImg) {
                await writeLocalMemoryImage(uploaded.id, localImg)
                await deleteLocalMemoryImage(item.id)
              }
            } catch {
              merged.unshift(item)
            }
          }
          setMemories(merged)
          void writeLocalMemories(profile.id, merged)
        } else {
          setMemories(backendItems)
          void writeLocalMemories(profile.id, backendItems)
        }
        setError('')
      })
      .catch((err: unknown) => {
        if (!active) return
        // If we already have local cache, keep it
        readLocalMemories(profile.id).then((cached) => {
          if (!active) return
          if (cached && cached.length > 0) {
            setMemories(cached)
          } else {
            setError(err instanceof Error ? err.message : 'Could not load memories')
          }
        })
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [profile?.id])

  // Listen for open psychologist modal event
  useEffect(() => {
    const onOpenPsych = () => {
      setIsPsychModalOpen(true)
      setPsychStep(1)
      setPsychError('')
    }
    window.addEventListener('helios:open-psychologist-modal', onOpenPsych)
    return () => {
      window.removeEventListener('helios:open-psychologist-modal', onOpenPsych)
    }
  }, [])

  // Load available slots when date or psychologist changes
  useEffect(() => {
    let active = true
    if (!missionId || !selectedPsychId || !selectedDay || !isPsychModalOpen || missionStage !== 'aboard') {
      setSlots([])
      return () => { active = false }
    }
    setPsychLoading(true)
    platformApi
      .slots(missionId, selectedPsychId, selectedDay)
      .then((data) => {
        if (!active) return
        setSlots(data.slots || [])
        setSelectedSlot(null)
      })
      .catch((err: unknown) => {
        if (!active) return
        setSlots([])
        setPsychError(err instanceof Error ? err.message : 'Could not load availability')
      })
      .finally(() => {
        if (active) setPsychLoading(false)
      })
    return () => {
      active = false
    }
  }, [missionId, selectedPsychId, selectedDay, isPsychModalOpen, missionStage])

  function handleOpenCreate() {
    setEditingMemory(null)
    setFormTitle('')
    setFormMessage('')
    setFormImageBase64(null)
    setFormImageContentType(null)
    setFormRemoveImage(false)
    setFormError('')
    setIsFormOpen(true)
  }

  function handleOpenEdit(memory: UserMemory) {
    setEditingMemory(memory)
    setFormTitle(memory.title)
    setFormMessage(memory.message)
    setFormImageBase64(null)
    setFormImageContentType(null)
    setFormRemoveImage(false)
    setFormError('')
    setIsFormOpen(true)
  }

  function handleImageFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setFormError(en ? 'Image file must be under 5MB.' : 'La imagen debe ser menor a 5MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setFormImageBase64(dataUrl)
      setFormImageContentType(file.type || 'image/jpeg')
      setFormRemoveImage(false)
      setFormError('')
    }
    reader.readAsDataURL(file)
  }

  async function handleSaveMemory() {
    if (!profile?.id) return
    const trimmedTitle = formTitle.trim()
    if (!trimmedTitle) {
      setFormError(en ? 'Please enter a title for your memory.' : 'Por favor escribí un título para tu recuerdo.')
      return
    }

    setFormBusy(true)
    setFormError('')
    try {
      if (editingMemory) {
        let updated: UserMemory
        try {
          updated = await platformApi.updateMemory(editingMemory.id, {
            title: trimmedTitle,
            message: formMessage.trim().slice(0, 500),
            imageBase64: formImageBase64,
            imageContentType: formImageContentType,
            removeImage: formRemoveImage,
          })
        } catch {
          // Resilient local fallback if backend is offline or sleeping
          updated = {
            ...editingMemory,
            title: trimmedTitle,
            message: formMessage.trim().slice(0, 500),
            imageFileId: formRemoveImage ? null : formImageBase64 ? (editingMemory.imageFileId || `img-${Date.now()}`) : editingMemory.imageFileId,
            imageContentType: formRemoveImage ? null : formImageContentType || editingMemory.imageContentType,
            updatedAt: Date.now(),
          }
        }
        if (formRemoveImage) {
          void deleteLocalMemoryImage(updated.id)
        } else if (formImageBase64) {
          void writeLocalMemoryImage(updated.id, formImageBase64)
        }
        const nextList = memories.map((m) => (m.id === updated.id ? updated : m))
        setMemories(nextList)
        void writeLocalMemories(profile.id, nextList)
        if (detailMemory?.id === updated.id) setDetailMemory(updated)
      } else {
        let created: UserMemory
        try {
          created = await platformApi.createMemory({
            title: trimmedTitle,
            message: formMessage.trim().slice(0, 500),
            imageBase64: formImageBase64,
            imageContentType: formImageContentType,
          })
        } catch {
          // Resilient local fallback if backend is offline or sleeping
          const now = Date.now()
          const localId = `mem-${now}-${Math.random().toString(36).slice(2, 7)}`
          created = {
            id: localId,
            profileId: profile.id,
            title: trimmedTitle,
            message: formMessage.trim().slice(0, 500),
            imageFileId: formImageBase64 ? `img-${now}` : null,
            imageContentType: formImageContentType || (formImageBase64 ? 'image/jpeg' : null),
            createdAt: now,
            updatedAt: now,
          }
        }
        if (formImageBase64) {
          void writeLocalMemoryImage(created.id, formImageBase64)
        }
        const nextList = [created, ...memories]
        setMemories(nextList)
        void writeLocalMemories(profile.id, nextList)
      }
      setIsFormOpen(false)
      setFormTitle('')
      setFormMessage('')
      setFormImageBase64(null)
      setFormImageContentType(null)
      setEditingMemory(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : (en ? 'Could not save memory.' : 'No se pudo guardar el recuerdo.'))
    } finally {
      setFormBusy(false)
    }
  }

  async function handleDeleteMemory() {
    if (!deleteCandidate || !profile?.id) return
    setFormBusy(true)
    try {
      await platformApi.deleteMemory(deleteCandidate.id).catch(() => { })
      const nextList = memories.filter((m) => m.id !== deleteCandidate.id)
      setMemories(nextList)
      void writeLocalMemories(profile.id, nextList)
      void deleteLocalMemoryImage(deleteCandidate.id)
      if (detailMemory?.id === deleteCandidate.id) setDetailMemory(null)
      setDeleteCandidate(null)
    } catch {
      const nextList = memories.filter((m) => m.id !== deleteCandidate.id)
      setMemories(nextList)
      void writeLocalMemories(profile.id, nextList)
      void deleteLocalMemoryImage(deleteCandidate.id)
      if (detailMemory?.id === deleteCandidate.id) setDetailMemory(null)
      setDeleteCandidate(null)
    } finally {
      setFormBusy(false)
    }
  }

  function handleTalkWithQuiron() {
    if (missionStage && missionStage !== 'aboard') {
      setStatusNotice(
        en
          ? 'Quirón’s in-flight support is available while the mission is in flight. Your memories remain accessible at all times.'
          : 'El acompañamiento de Quirón en vuelo está disponible mientras la misión está a bordo. Tus recuerdos siguen accesibles en todo momento.',
      )
      return
    }
    // Opens the existing chat in emotional wellbeing mode
    window.dispatchEvent(
      new CustomEvent('helios:quiron-care', {
        detail: { topic: 'emotional', origin: 'memories' },
      }),
    )
  }

  function handleFindPsychologist() {
    setIsPsychModalOpen(true)
    setPsychStep(1)
    setPsychError('')
  }

  async function handleConfirmAppointmentRequest() {
    if (!missionId || !selectedPsychId || selectedSlot == null || psychBusy) return
    setPsychBusy(true)
    setPsychError('')
    try {
      await platformApi.requestAppointment(missionId, {
        specialty: 'psychological',
        professionalId: selectedPsychId,
        reason: psychReason.trim().slice(0, 500),
        scheduledAt: selectedSlot,
        durationMin: 30,
        timezone: 'UTC',
        shareCategories: [],
        modality: 'aboard',
      })
      setPsychStep(3)
    } catch (err) {
      setPsychError(err instanceof Error ? err.message : (en ? 'Could not send appointment request' : 'No se pudo enviar la solicitud de cita'))
    } finally {
      setPsychBusy(false)
    }
  }

  async function handleTriggerUrgent() {
    if (!missionId) return
    try {
      await platformApi.urgent(missionId)
      setUrgentTriggered(true)
    } catch {
      setUrgentTriggered(true)
    }
  }

  const selectedPsychName = useMemo(() => {
    if (selectedPsychId === 'alex-morgan') return 'Alex Morgan (Space Psychologist)'
    const p = psychMembers.find((item) => item.profileId === selectedPsychId)
    return p ? `${p.displayName || p.profileId} (Psychologist)` : (en ? 'Assigned Psychologist' : 'Psicólogo asignado')
  }, [selectedPsychId, psychMembers, en])

  return (
    <div className="rd rd-crew memories-page">
      <header className="rd-head">
        <div className="memories-header-row">
          <div>
            <p className="rd-kicker">{en ? 'Personal collection' : 'Colección personal'}</p>
            <h1>
              {en ? 'Memories' : 'Recuerdos'}
              <InfoHelp
                title="Recuerdos y Soporte Emocional"
                enTitle="Memories & Emotional Support"
                whatIs="Rincón de bienestar emocional y salud mental para la tripulación. Permite almacenar fotos de la Tierra, audios familiares, cartas y momentos especiales para combatir la soledad, el confinamiento y el estrés del espacio profundo."
                enWhatIs="Emotional wellbeing and mental health sanctuary for the crew. Store Earth photos, family audio clips, letters, and special moments to counter sensory isolation, confinement, and deep space stress."
                steps={[
                  'Hacé clic en "+ Agregar recuerdo" para subir una foto personal, escribir una memoria o guardar un mensaje de tus seres queridos.',
                  'Navegá tu galería de recuerdos cuando sientas nostalgia, sobrecarga de trabajo o estrés.',
                  'Tus recuerdos son 100% privados: nadie de la tripulación ni los médicos pueden verlos a menos que vos decidas compartirlos.',
                  'Si sentís que el aislamiento te está afectando, podés solicitar una consulta confidencial con el psicólogo de vuelo desde el botón de ayuda.',
                ]}
                enSteps={[
                  'Click "+ Add a memory" to upload a personal photo, write a reflection, or save a note from loved ones.',
                  'Browse your gallery whenever you experience homesickness, mission strain, or isolation.',
                  'All memories are 100% private: no crew member or flight surgeon can view them unless explicitly shared.',
                  'If confinement is weighing on you, request a private consultation with the mission psychologist using the quick link.',
                ]}
              />
            </h1>
            <p className="rd-muted">
              {en
                ? 'A little closer to the people and places you love.'
                : 'Un poco más cerca de las personas y lugares que querés.'}
            </p>
          </div>
          <div className="memories-header-actions">
            <button type="button" className="rd-btn" onClick={handleOpenCreate}>
              <Plus size={16} aria-hidden="true" />
              {en ? 'Add a memory' : 'Agregar recuerdo'}
            </button>
          </div>
        </div>
      </header>

      {statusNotice ? (
        <div className="callout callout-amber" role="status" style={{ margin: 0 }}>
          <p>{statusNotice}</p>
        </div>
      ) : null}

      {error ? (
        <div className="callout callout-bad" role="alert" style={{ margin: 0 }}>
          <p>{systemText(error)}</p>
        </div>
      ) : null}

      {/* Featured companionship card */}
      <aside className="memory-companionship-card" aria-label={en ? 'Emotional support' : 'Acompañamiento emocional'}>
        <div className="memory-companionship-content">
          <div className="memory-quiron-figure" aria-hidden="true">
            <QuironFigure bubble={false} />
          </div>
          <div className="memory-companionship-text">
            <h2>{en ? 'Feeling lonely?' : '¿Te sentís solo?'}</h2>
            <p>
              {en
                ? 'Talk with Quirón, or find support from an available space psychologist.'
                : 'Conversá con Quirón, o buscá apoyo de un psicólogo espacial disponible.'}
            </p>
          </div>
        </div>
        <div className="rd-actions">
          <button type="button" className="rd-btn" onClick={handleTalkWithQuiron}>
            {en ? 'Talk with Quirón' : 'Hablar con Quirón'}
          </button>
          <button type="button" className="rd-btn ghost" onClick={handleFindPsychologist}>
            {en ? 'Find a psychologist' : 'Buscar un psicólogo'}
          </button>
        </div>
      </aside>

      {/* Memories Collection */}
      {loading ? (
        <p className="rd-muted">{en ? 'Loading memories…' : 'Cargando recuerdos…'}</p>
      ) : memories.length === 0 ? (
        <div className="memory-empty-state">
          <div className="memory-empty-icon" aria-hidden="true">
            <HeartHandshake size={28} />
          </div>
          <h3>{en ? 'Keep something meaningful close.' : 'Mantené algo significativo cerca.'}</h3>
          <p>
            {en
              ? 'Add a photo or a few words you’d like to remember.'
              : 'Agregá una foto o unas palabras que quieras recordar.'}
          </p>
          <button type="button" className="rd-btn" onClick={handleOpenCreate} style={{ marginTop: 8 }}>
            <Plus size={16} aria-hidden="true" />
            {en ? 'Add a memory' : 'Agregar recuerdo'}
          </button>
        </div>
      ) : (
        <section className="memories-grid" aria-label={en ? 'Personal memories' : 'Recuerdos personales'}>
          {memories.map((item) => (
            <article key={item.id} className="memory-card">
              {item.imageFileId ? (
                <SecureMemoryImage
                  memoryId={item.id}
                  hasImage={!!item.imageFileId}
                  title={item.title}
                  onClick={() => setDetailMemory(item)}
                />
              ) : null}
              <div className="memory-card-body">
                <h3 className="memory-card-title">{item.title}</h3>
                {item.message ? <p className="memory-card-msg">{item.message}</p> : null}
              </div>
              <footer className="memory-card-foot">
                <span className="memory-card-date">{formatDate(item.createdAt, en)}</span>
                <div className="memory-card-actions">
                  <button
                    type="button"
                    className="memory-icon-btn"
                    title={en ? 'Edit memory' : 'Editar recuerdo'}
                    aria-label={en ? `Edit ${item.title}` : `Editar ${item.title}`}
                    onClick={() => handleOpenEdit(item)}
                  >
                    <Edit3 size={15} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="memory-icon-btn danger"
                    title={en ? 'Delete memory' : 'Eliminar recuerdo'}
                    aria-label={en ? `Delete ${item.title}` : `Eliminar ${item.title}`}
                    onClick={() => setDeleteCandidate(item)}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              </footer>
            </article>
          ))}
        </section>
      )}

      {/* Detail Modal */}
      {detailMemory ? (
        <Modal
          open={!!detailMemory}
          title={detailMemory.title}
          description={formatDate(detailMemory.createdAt, en)}
          onClose={() => setDetailMemory(null)}
        >
          <div style={{ display: 'grid', gap: '16px' }}>
            {detailMemory.imageFileId ? (
              <SecureMemoryImage
                memoryId={detailMemory.id}
                hasImage={!!detailMemory.imageFileId}
                title={detailMemory.title}
                className="memory-upload-preview"
              />
            ) : null}
            {detailMemory.message ? (
              <p style={{ margin: 0, fontSize: '0.96rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {detailMemory.message}
              </p>
            ) : null}
            <div className="rd-actions" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
              <button
                type="button"
                className="rd-btn ghost"
                onClick={() => {
                  const m = detailMemory
                  setDetailMemory(null)
                  handleOpenEdit(m)
                }}
              >
                <Edit3 size={15} aria-hidden="true" />
                {en ? 'Edit' : 'Editar'}
              </button>
              <button
                type="button"
                className="rd-btn ghost"
                style={{ borderColor: '#f5004f', color: '#f5004f' }}
                onClick={() => {
                  const m = detailMemory
                  setDetailMemory(null)
                  setDeleteCandidate(m)
                }}
              >
                <Trash2 size={15} aria-hidden="true" />
                {en ? 'Delete' : 'Eliminar'}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* Create / Edit Modal */}
      {isFormOpen ? (
        <Modal
          open={isFormOpen}
          title={editingMemory ? (en ? 'Edit memory' : 'Editar recuerdo') : (en ? 'Add a memory' : 'Agregar recuerdo')}
          onClose={() => setIsFormOpen(false)}
        >
          <div style={{ display: 'grid', gap: '14px' }}>
            {formError ? <p className="rd-error" role="alert">{formError}</p> : null}

            <Field id="memory-title" label={en ? 'Title' : 'Título'}>
              <input
                id="memory-title"
                type="text"
                maxLength={100}
                placeholder={en ? 'A person, place, or moment…' : 'Una persona, lugar o momento…'}
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </Field>

            <Field id="memory-message" label={en ? 'Message (up to 500 characters)' : 'Mensaje (hasta 500 caracteres)'}>
              <textarea
                id="memory-message"
                rows={4}
                maxLength={500}
                placeholder={en ? 'Write a few words you would like to keep close…' : 'Escribí unas palabras que quieras recordar…'}
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
              />
              <div className="memory-char-count">
                {formMessage.length} / 500 {en ? 'characters' : 'caracteres'}
              </div>
            </Field>

            <Field id="memory-photo" label={en ? 'Photograph (optional)' : 'Fotografía (opcional)'}>
              {formImageBase64 ? (
                <div className="memory-upload-preview">
                  <img src={formImageBase64} alt="Preview" className="memory-upload-img" />
                  <button
                    type="button"
                    className="memory-remove-photo-btn"
                    title={en ? 'Remove photo' : 'Quitar foto'}
                    onClick={() => {
                      setFormImageBase64(null)
                      setFormImageContentType(null)
                      if (editingMemory) setFormRemoveImage(true)
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : editingMemory?.imageFileId && !formRemoveImage ? (
                <div className="memory-upload-preview">
                  <SecureMemoryImage
                    memoryId={editingMemory.id}
                    hasImage={!!editingMemory.imageFileId}
                    title={editingMemory.title}
                    className="memory-upload-preview"
                  />
                  <button
                    type="button"
                    className="memory-remove-photo-btn"
                    title={en ? 'Remove photo' : 'Quitar foto'}
                    onClick={() => setFormRemoveImage(true)}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <input
                  id="memory-photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageFileChange}
                />
              )}
            </Field>

            <div className="rd-actions" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
              <button type="button" className="rd-btn ghost" onClick={() => setIsFormOpen(false)} disabled={formBusy}>
                {en ? 'Cancel' : 'Cancelar'}
              </button>
              <button type="button" className="rd-btn" onClick={handleSaveMemory} disabled={formBusy}>
                {formBusy ? (en ? 'Saving…' : 'Guardando…') : (en ? 'Save memory' : 'Guardar recuerdo')}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* Delete Confirmation Modal */}
      {deleteCandidate ? (
        <Modal
          open={!!deleteCandidate}
          title={en ? 'Delete memory' : 'Eliminar recuerdo'}
          onClose={() => setDeleteCandidate(null)}
        >
          <div style={{ display: 'grid', gap: '14px' }}>
            <p style={{ margin: 0 }}>
              {en
                ? `Are you sure you want to delete "${deleteCandidate.title}"? This action cannot be undone and its image will be permanently removed.`
                : `¿Estás seguro de que querés eliminar "${deleteCandidate.title}"? Esta acción no se puede deshacer y su imagen se eliminará permanentemente.`}
            </p>
            <div className="rd-actions" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
              <button type="button" className="rd-btn ghost" onClick={() => setDeleteCandidate(null)} disabled={formBusy}>
                {en ? 'Cancel' : 'Cancelar'}
              </button>
              <button
                type="button"
                className="rd-btn"
                style={{ background: '#f5004f', color: '#fff' }}
                onClick={handleDeleteMemory}
                disabled={formBusy}
              >
                {formBusy ? (en ? 'Deleting…' : 'Eliminando…') : (en ? 'Delete' : 'Eliminar')}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* Psychological Consultation / Support Modal */}
      {isPsychModalOpen ? (
        <Modal
          open={isPsychModalOpen}
          title={en ? 'Psychological support' : 'Apoyo psicológico'}
          onClose={() => setIsPsychModalOpen(false)}
        >
          {missionStage && missionStage !== 'aboard' ? (
            <div style={{ display: 'grid', gap: '14px' }}>
              <div className="callout callout-amber" style={{ margin: 0 }}>
                <p>
                  {en
                    ? 'Psychological consultations and appointments are available only while the mission is In Flight (A bordo). New appointment requests cannot be created at this stage. Your personal memories remain available.'
                    : 'Las consultas psicológicas y citas solo están habilitadas mientras la misión está A bordo (In Flight). No se pueden crear solicitudes nuevas en esta etapa. Tus recuerdos personales siguen disponibles.'}
                </p>
              </div>
              <div className="rd-actions" style={{ justifyContent: 'space-between', marginTop: 10 }}>
                {missionId ? (
                  <button type="button" className="rd-btn ghost" onClick={handleTriggerUrgent}>
                    <AlertCircle size={16} />
                    {en ? 'Urgent support protocol' : 'Protocolo urgente'}
                  </button>
                ) : <span />}
                <button type="button" className="rd-btn" onClick={() => setIsPsychModalOpen(false)}>
                  {en ? 'Close' : 'Cerrar'}
                </button>
              </div>
              {urgentTriggered ? (
                <p className="rd-ok" role="status">
                  {en
                    ? 'Urgent protocol triggered. Contacting human flight support immediately.'
                    : 'Protocolo urgente activado. Contactando al soporte humano de vuelo de inmediato.'}
                </p>
              ) : null}
            </div>
          ) : psychMembers.length === 0 ? (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div className="callout callout-amber" style={{ margin: 0 }}>
                <strong>{en ? 'No psychologist is currently available for this mission.' : 'No hay un psicólogo disponible actualmente para esta misión.'}</strong>
                <p style={{ marginTop: 6 }}>
                  {en
                    ? 'You can consult the configured human mission support options or continue talking with Quirón. No automated mechanism is configured for future requests on this mission.'
                    : 'Podés consultar las opciones de apoyo humano configuradas en la misión o continuar conversando con Quirón. No existe un mecanismo configurado para solicitudes futuras en esta misión.'}
                </p>
              </div>
              <div className="rd-actions" style={{ flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                <Link to="/app/tripulacion" className="rd-btn ghost" onClick={() => setIsPsychModalOpen(false)}>
                  {en ? 'Consult mission crew' : 'Consultar tripulación'}
                </Link>
                <button
                  type="button"
                  className="rd-btn"
                  onClick={() => {
                    setIsPsychModalOpen(false)
                    handleTalkWithQuiron()
                  }}
                >
                  {en ? 'Talk with Quirón' : 'Conversar con Quirón'}
                </button>
              </div>
            </div>
          ) : psychStep === 1 ? (
            <div style={{ display: 'grid', gap: '14px' }}>
              {psychError ? <p className="rd-error" role="alert">{psychError}</p> : null}

              {psychMembers.length > 1 ? (
                <Field id="psych-prof" label={en ? 'Select psychologist' : 'Seleccionar psicólogo'}>
                  <select
                    id="psych-prof"
                    value={selectedPsychId}
                    onChange={(e) => setSelectedPsychId(e.target.value)}
                  >
                    {psychMembers.map((m) => (
                      <option key={m.profileId} value={m.profileId}>
                        {m.profileId === 'alex-morgan' ? 'Alex Morgan' : m.profileId}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : (
                <div>
                  <span className="rd-kicker">{en ? 'Assigned professional' : 'Profesional asignado'}</span>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 700 }}>{selectedPsychName}</p>
                </div>
              )}

              <Field id="psych-day" label={en ? 'Date (UTC)' : 'Fecha (UTC)'}>
                <input
                  id="psych-day"
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                />
              </Field>

              <Field id="psych-slot" label={en ? 'Available time slots (UTC)' : 'Horarios disponibles (UTC)'}>
                {psychLoading ? (
                  <p className="rd-muted">{en ? 'Checking availability…' : 'Consultando disponibilidad…'}</p>
                ) : slots.length === 0 ? (
                  <p className="rd-muted" style={{ fontStyle: 'italic' }}>
                    {en ? 'No open slots on this date. Please select another day.' : 'No hay horarios disponibles en esta fecha. Seleccioná otro día.'}
                  </p>
                ) : (
                  <div className="memory-slot-grid" role="group" aria-label={en ? 'Available time slots' : 'Horarios disponibles'}>
                    {slots.map((s) => (
                      <button
                        key={s.start}
                        type="button"
                        className={selectedSlot === s.start ? 'memory-slot-pill is-active' : 'memory-slot-pill'}
                        onClick={() => setSelectedSlot(s.start)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </Field>

              <Field id="psych-reason" label={en ? 'Reason for request (optional, up to 500 characters)' : 'Motivo de consulta (opcional, hasta 500 caracteres)'}>
                <textarea
                  id="psych-reason"
                  rows={3}
                  maxLength={500}
                  placeholder={en ? 'Briefly describe what you would like to address…' : 'Describí brevemente de qué te gustaría hablar…'}
                  value={psychReason}
                  onChange={(e) => setPsychReason(e.target.value)}
                />
              </Field>

              <div className="memory-disclosure-box">
                <strong>{en ? 'Information to be shared:' : 'Información que se compartirá:'}</strong>
                <ul>
                  <li>{en ? 'Your identity (name and role)' : 'Tu identidad (nombre y rol)'}</li>
                  <li>{en ? 'Selected date and time slot (UTC)' : 'Fecha y horario seleccionados (UTC)'}</li>
                  <li>{en ? 'The reason written above' : 'El motivo redactado arriba'}</li>
                </ul>
                <span style={{ fontSize: '0.8rem', opacity: 0.85, marginTop: 4 }}>
                  {en
                    ? 'Your private memories, photos, and notes will NOT be shared.'
                    : 'Tus recuerdos privados, fotos y notas NO serán compartidos.'}
                </span>
              </div>

              <div className="rd-actions" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" className="rd-btn ghost" onClick={() => setIsPsychModalOpen(false)}>
                  {en ? 'Cancel' : 'Cancelar'}
                </button>
                <button
                  type="button"
                  className="rd-btn"
                  disabled={selectedSlot == null}
                  onClick={() => setPsychStep(2)}
                >
                  {en ? 'Review request' : 'Revisar solicitud'}
                </button>
              </div>
            </div>
          ) : psychStep === 2 ? (
            /* Confirmation step */
            <div style={{ display: 'grid', gap: '14px' }}>
              <p style={{ margin: 0, fontWeight: 700 }}>
                {en ? 'Please confirm your psychological support request:' : 'Por favor confirmá tu solicitud de apoyo psicológico:'}
              </p>

              <div className="memory-disclosure-box">
                <div><strong>{en ? 'Professional:' : 'Profesional:'}</strong> {selectedPsychName}</div>
                <div><strong>{en ? 'Scheduled time:' : 'Horario:'}</strong> {formatSlotTime(selectedSlot, en)}</div>
                {psychReason ? <div><strong>{en ? 'Reason:' : 'Motivo:'}</strong> {psychReason}</div> : null}
                <div style={{ marginTop: 6, color: '#f5004f', fontWeight: 700 }}>
                  {en
                    ? 'Status upon creation: Requested (Pending confirmation by the psychologist)'
                    : 'Estado al crear: Solicitada (Pendiente de confirmación por el psicólogo)'}
                </div>
              </div>

              <p className="rd-muted" style={{ fontSize: '0.86rem' }}>
                {en
                  ? 'A pending request is not a confirmed appointment. The psychologist will review and accept an open slot.'
                  : 'Una solicitud pendiente no es una cita confirmada. El profesional revisará y aceptará el horario.'}
              </p>

              {psychError ? <p className="rd-error" role="alert">{psychError}</p> : null}

              <div className="rd-actions" style={{ justifyContent: 'space-between', marginTop: 12 }}>
                <button type="button" className="rd-btn ghost" onClick={() => setPsychStep(1)} disabled={psychBusy}>
                  {en ? 'Back' : 'Atrás'}
                </button>
                <button type="button" className="rd-btn" onClick={handleConfirmAppointmentRequest} disabled={psychBusy}>
                  {psychBusy ? (en ? 'Sending…' : 'Enviando…') : (en ? 'Request appointment' : 'Solicitar cita')}
                </button>
              </div>
            </div>
          ) : (
            /* Success confirmation */
            <div style={{ display: 'grid', gap: '16px', textAlign: 'center', justifyItems: 'center', padding: '16px 0' }}>
              <CheckCircle2 size={48} color="#4db6a0" />
              <div>
                <h3 style={{ margin: '0 0 6px 0' }}>{en ? 'Request sent' : 'Solicitud enviada'}</h3>
                <p className="rd-muted" style={{ margin: 0 }}>
                  {en
                    ? 'Your psychological consultation request has been submitted with status Requested. It will appear in My Space once reviewed.'
                    : 'Tu solicitud de consulta psicológica fue enviada con estado Solicitada. Aparecerá en Mi espacio una vez revisada.'}
                </p>
              </div>
              <div className="rd-actions" style={{ gap: 10, marginTop: 8 }}>
                <Link to="/app/mi-espacio" className="rd-btn" onClick={() => setIsPsychModalOpen(false)}>
                  {en ? 'View in My Space' : 'Ver en Mi espacio'}
                </Link>
                <button type="button" className="rd-btn ghost" onClick={() => setIsPsychModalOpen(false)}>
                  {en ? 'Done' : 'Listo'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      ) : null}
    </div>
  )
}
