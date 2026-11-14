import { Download, FileSpreadsheet, Printer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CREW } from '../domain/crew'
import { exportBundle, filterHistory, historyRows, toCsv, type HistoryRow } from '../domain/exportData'
import { episodeStatusLabel, formatMission } from '../domain/format'
import { useApp } from '../state/store'
import { TrendChart } from '../components/Charts'
import { Empty } from '../components/ui'
import type { CrewId } from '../../shared/types'

export function HistoryPage() {
  const { state } = useApp()
  const [crewId, setCrewId] = useState<CrewId | 'all'>('all')
  const [type, setType] = useState<HistoryRow['type'] | 'all'>('all')
  const [selected, setSelected] = useState<string | null>(state.selectedEpisodeId)
  const rows = useMemo(() => filterHistory(historyRows(state), { crewId, type }), [state, crewId, type])
  const episode = state.episodes.find((item) => item.id === selected) ?? state.episodes[0]
  const days = dailySeries(state.measurements.filter((item) => (crewId === 'all' ? item.crewId === 'elena-torres' : item.crewId === crewId)))

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="kicker">Historial</p>
          <h1>Seguimiento del periodo</h1>
          <p className="lede">El pulso y el descanso van en gráficos separados: no comparten eje porque las unidades no son comparables.</p>
        </div>
        <div className="row no-print">
          <button className="btn" type="button" onClick={() => download('vitalink-historial.json', exportBundle(state, rows), 'application/json')}><Download aria-hidden="true" size={18} strokeWidth={1.75} /> Exportar JSON</button>
          <button className="btn" type="button" onClick={() => download('vitalink-historial.csv', toCsv(rows), 'text/csv')}><FileSpreadsheet aria-hidden="true" size={18} strokeWidth={1.75} /> Exportar CSV</button>
          <button className="btn" type="button" onClick={() => window.print()}><Printer aria-hidden="true" size={18} strokeWidth={1.75} /> Vista imprimible</button>
        </div>
      </header>
      <div className="row filters">
        <label>Persona
          <select aria-label="Filtrar por persona" value={crewId} onChange={(event) => setCrewId(event.target.value as CrewId | 'all')}>
            <option value="all">Toda la tripulación</option>
            {CREW.map((crew) => <option key={crew.id} value={crew.id}>{crew.name}</option>)}
          </select>
        </label>
        <label>Tipo
          <select aria-label="Filtrar por tipo" value={type} onChange={(event) => setType(event.target.value as HistoryRow['type'] | 'all')}>
            <option value="all">Todos</option>
            <option value="measurement">Mediciones</option>
            <option value="symptom">Síntomas</option>
            <option value="alert">Alertas</option>
            <option value="inventory">Inventario</option>
            <option value="communication">Comunicaciones</option>
            <option value="analysis">Análisis</option>
          </select>
        </label>
      </div>
      <div className="layout">
        <section className="panel">
          <h2>Pulso medio por día</h2>
          <TrendChart points={days.hr} unit="lpm" caption="Promedio de las frecuencias cardíacas registradas cada día, en lpm." />
        </section>
        <section className="panel">
          <h2>Descanso por día</h2>
          <TrendChart points={days.sleep} unit="h" caption="Horas de descanso registradas, en horas. No está en el mismo eje que el pulso." />
        </section>
      </div>
      <div className="split">
        <section className="panel">
          <h2>Cronología</h2>
          {rows.length === 0 ? <Empty title="Sin eventos" text="Ese filtro no tiene registros." /> : (
            <ol className="timeline">
              {rows.slice(0, 40).map((row) => (
                <li key={row.id}>
                  <span className="dot" aria-hidden="true" />
                  <button type="button" className="btn btn-ghost" onClick={() => row.type === 'symptom' || row.type === 'alert' ? setSelected(state.episodes.find((item) => item.crewId === row.crewId)?.id ?? selected) : undefined}>
                    <strong>{formatMission(row.at)} · {label(row.type)}</strong>
                    <span className="muted"> {row.detail}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>
        <aside className="detail">
          <h2>Episodio</h2>
          {episode ? (
            <>
              <p>{episode.title}</p>
              <p className="muted">{CREW.find((crew) => crew.id === episode.crewId)?.name} · {episodeStatusLabel(episode.status)} · {formatMission(episode.openedAt)}</p>
              <h3>Síntomas</h3>
              <ul>{state.symptoms.filter((item) => item.episodeId === episode.id).map((item) => <li key={item.id}>{item.symptoms.join(', ')} {item.note}</li>)}</ul>
              <h3>Pendiente</h3>
              <p>La revisión humana sigue siendo necesaria mientras el episodio esté abierto.</p>
            </>
          ) : <p>No hay un episodio seleccionado.</p>}
        </aside>
      </div>
    </div>
  )
}

function label(type: HistoryRow['type']): string {
  const names = { measurement: 'Medición', symptom: 'Síntoma', alert: 'Alerta', inventory: 'Inventario', communication: 'Comunicación', analysis: 'Análisis' }
  return names[type]
}

function dailySeries(measurements: { kind: string; value: number; measuredAt: number }[]) {
  const buckets = new Map<string, { hr: number[]; sleep: number[] }>()
  for (const item of measurements) {
    if (item.kind !== 'heart_rate' && item.kind !== 'sleep_hours') continue
    const key = new Date(item.measuredAt).toISOString().slice(0, 10)
    const bucket = buckets.get(key) ?? { hr: [], sleep: [] }
    if (item.kind === 'heart_rate') bucket.hr.push(item.value)
    else bucket.sleep.push(item.value)
    buckets.set(key, bucket)
  }
  const keys = [...buckets.keys()].sort()
  const avg = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
  return {
    hr: keys.filter((key) => (buckets.get(key)?.hr.length ?? 0) > 0).map((key) => ({ label: key.slice(5), value: Math.round(avg(buckets.get(key)?.hr ?? [])) })),
    sleep: keys.filter((key) => (buckets.get(key)?.sleep.length ?? 0) > 0).map((key) => ({ label: key.slice(5), value: Number(avg(buckets.get(key)?.sleep ?? []).toFixed(1)) })),
  }
}

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
