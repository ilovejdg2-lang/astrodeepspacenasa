import { Modal } from '../ui'
import { PainEditor } from '../health/pain/PainEditor'

export function RecordPainModal({
  open,
  onClose,
  en,
  missionId,
  profileId,
  stage,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  en: boolean
  missionId: string
  profileId: string
  stage?: string
  onSaved: () => void
}) {
  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="modal-wide modal-pain-editor"
      title={en ? 'Record pain · Body map' : 'Registrar dolor · Mapa corporal'}
    >
      <div className="pain-modal-scroll">
        <PainEditor
          en={en}
          missionId={missionId}
          profileId={profileId}
          stage={stage}
          appointments={[]}
          seed={null}
          onClose={onClose}
          onSaved={() => {
            onSaved()
            onClose()
          }}
        />
      </div>
    </Modal>
  )
}
