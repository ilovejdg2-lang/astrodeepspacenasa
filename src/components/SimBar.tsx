import { Pause, Play, RotateCcw, Unplug, Wifi } from 'lucide-react'
import { useState } from 'react'
import { SCENARIO_IDS, type ScenarioId, type Speed } from '../../shared/types'
import { formatMission } from '../domain/format'
import { useApp } from '../state/store'
import { Modal } from './ui'

const NAMES: Record<ScenarioId, string> = {
  baseline: '1. Seguimiento estable',
  'gradual-fatigue': '2. Cambio y cansancio',
  'frozen-sensor': '3. Sensor congelado',
  'missing-data': '4. Mediciones ausentes',
  'repeated-message': '5. Mensaje repetido',
  'altered-message': '6. Mensaje alterado',
  'link-down': '7. Sin enlace',
  'stale-normal': '8. Síntomas con datos antiguos',
  'unwell-normal': '9. Se siente mal con datos normales',
  'pulse-escalation': '10. Escalada de pulso',
}

export function SimBar() {
  const { state, dispatch, restoreDemo } = useApp()
  const [confirm, setConfirm] = useState<null | 'reset' | 'scenario' | 'demo'>(null)
  const [nextScenario, setNextScenario] = useState<ScenarioId>(state.scenarioId)

  return (
    <div className="simdock no-print">
      <strong>Simulación</strong>
      <button className="btn" type="button" data-testid="sim-play" onClick={() => dispatch({ type: 'setRunning', running: true })} disabled={state.clock.running}>
        <Play aria-hidden="true" size={18} strokeWidth={1.75} /> Iniciar
      </button>
      <button className="btn" type="button" data-testid="sim-pause" onClick={() => dispatch({ type: 'setRunning', running: false })} disabled={!state.clock.running}>
        <Pause aria-hidden="true" size={18} strokeWidth={1.75} /> Pausar
      </button>
      <label>
        <span className="sr-only">Velocidad</span>
        <select value={state.clock.speed} aria-label="Velocidad del reloj" onChange={(event) => dispatch({ type: 'setSpeed', speed: Number(event.target.value) as Speed })}>
          {[1, 2, 5, 10].map((speed) => <option key={speed} value={speed}>{speed}×</option>)}
        </select>
      </label>
      <label>
        <span className="sr-only">Escenario</span>
        <select
          data-testid="scenario-select"
          value={state.scenarioId}
          aria-label="Escenario"
          onChange={(event) => {
            const scenarioId = event.target.value as ScenarioId
            setNextScenario(scenarioId)
            setConfirm('scenario')
          }}
        >
          {SCENARIO_IDS.map((id) => <option key={id} value={id}>{NAMES[id]}</option>)}
        </select>
      </label>
      <button className="btn" type="button" data-testid="sim-reset" onClick={() => setConfirm('reset')}>
        <RotateCcw aria-hidden="true" size={18} strokeWidth={1.75} /> Reiniciar
      </button>
      <button className="btn" type="button" data-testid="link-toggle" onClick={() => dispatch({ type: 'setLink', link: state.link === 'down' ? 'up' : 'down' })}>
        {state.link === 'down' ? <Wifi aria-hidden="true" size={18} strokeWidth={1.75} /> : <Unplug aria-hidden="true" size={18} strokeWidth={1.75} />}
        {state.link === 'down' ? 'Restaurar enlace' : 'Interrumpir enlace'}
      </button>
      <button className="btn btn-ghost" type="button" onClick={() => setConfirm('demo')}>Restaurar demo</button>
      <span className="muted">{formatMission(state.clock.simulatedAt)} UTC · {state.clock.running ? 'en marcha' : 'en pausa'}</span>
      <Modal
        open={confirm !== null}
        title={confirm === 'demo' ? 'Restaurar datos de demostración' : 'Reiniciar simulación'}
        description="Esta acción reemplaza síntomas, mediciones y mensajes añadidos en el escenario actual. No borra otros sitios ni archivos del equipo."
        onClose={() => setConfirm(null)}
      >
        <div className="row">
          <button
            className="btn btn-primary"
            type="button"
            data-testid="confirm-reset"
            onClick={() => {
              if (confirm === 'demo') void restoreDemo()
              else if (confirm === 'scenario') dispatch({ type: 'setScenario', scenarioId: nextScenario })
              else dispatch({ type: 'resetSimulation' })
              setConfirm(null)
            }}
          >
            Confirmar
          </button>
          <button className="btn" type="button" onClick={() => setConfirm(null)}>Cancelar</button>
        </div>
      </Modal>
    </div>
  )
}
