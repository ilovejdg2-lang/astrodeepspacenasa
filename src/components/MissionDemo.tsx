import { useState } from 'react'
import { Modal } from './ui'
import { useLocale } from '../i18n'

export function MissionDemoButton() {
  const { copy } = useLocale()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className="helios-pill demo-pill" data-testid="start-mission-demo" onClick={() => setOpen(true)}>
        Start Mission Demo
      </button>
      <Modal open={open} title={copy.demoTitle} description={copy.demoLead} onClose={() => setOpen(false)}>
        <ol className="demo-steps">
          {copy.demoSteps.map((step) => <li key={step}>{step}</li>)}
        </ol>
        <button type="button" className="btn" onClick={() => setOpen(false)}>{copy.close}</button>
      </Modal>
    </>
  )
}
