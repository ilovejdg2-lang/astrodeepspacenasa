import { useState } from 'react'
import { BarChart3, Clock } from 'lucide-react'
import type { HealthIndicatorReading } from '../../platform/api'
import {
  catalogEntry,
  formatIndicatorValue,
} from '../../domain/healthIndicators'
import {
  computeBaseline,
  filterReadingsByRange,
  type BiomedicalSystemId,
  getSystemById,
} from '../../domain/biomedical'

export type TrendRange = '24h' | '7d' | 'mission'

function formatChartDate(ms: number, range: TrendRange, en: boolean) {
  const d = new Date(ms)
  if (range === '24h') {
    return d.toLocaleTimeString(en ? 'en-US' : 'es-CR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }
  return d.toLocaleDateString(en ? 'en-US' : 'es-CR', {
    month: 'short',
    day: 'numeric',
  })
}

export function IndicatorTrendsChart({
  en,
  systemId,
  readings,
  missionStart,
  onRecordNew,
  canRecord = true,
}: {
  en: boolean
  systemId: BiomedicalSystemId
  readings: HealthIndicatorReading[]
  missionStart?: number | null
  onRecordNew?: () => void
  canRecord?: boolean
}) {
  const [range, setRange] = useState<TrendRange>('7d')
  const system = getSystemById(systemId)
  const systemKinds = system.indicatorKinds

  const now = Date.now()
  const filteredAll = filterReadingsByRange(readings, range, now, missionStart)

  return (
    <section className="biomed-trends-section" aria-labelledby="biomed-trends-heading">
      <div className="biomed-trends-head">
        <div>
          <h3 id="biomed-trends-heading" className="biomed-section-title">
            <BarChart3 size={18} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 6 }} />
            {en ? 'Changes over time' : 'Evolución temporal'}
          </h3>
          <p className="rd-muted">
            {en
              ? `Historical trends for ${system.name.en} indicators. Measurements are kept on separate independent scales.`
              : `Tendencias históricas para indicadores de ${system.name.es}. Cada variable mantiene su escala independiente.`}
          </p>
        </div>

        <div className="biomed-range-toggle" role="tablist" aria-label={en ? 'Time range' : 'Periodo de tiempo'}>
          <button
            type="button"
            className={`rd-btn-xs${range === '24h' ? ' is-active' : ' ghost'}`}
            onClick={() => setRange('24h')}
          >
            {en ? '24 hours' : '24 horas'}
          </button>
          <button
            type="button"
            className={`rd-btn-xs${range === '7d' ? ' is-active' : ' ghost'}`}
            onClick={() => setRange('7d')}
          >
            {en ? '7 days' : '7 días'}
          </button>
          <button
            type="button"
            className={`rd-btn-xs${range === 'mission' ? ' is-active' : ' ghost'}`}
            onClick={() => setRange('mission')}
          >
            {en ? 'Mission period' : 'Periodo de misión'}
          </button>
        </div>
      </div>

      {systemKinds.length === 0 ? (
        <div className="biomed-empty-state">
          <p className="rd-muted">
            {en
              ? 'This system uses somatic reporting, clinical questionnaires, or pain mapping rather than continuous scalar telemetry.'
              : 'Este sistema utiliza reportes somáticos, cuestionarios clínicos o mapas de dolor en lugar de telemetría continua.'}
          </p>
        </div>
      ) : (
        <div className="biomed-charts-grid">
          {systemKinds.map((kind) => {
            const entry = catalogEntry(kind)
            const kindReadings = filteredAll
              .filter((r) => r.kind === kind && Number.isFinite(r.value))
              .sort((a, b) => a.measuredAt - b.measuredAt)

            const allKindReadings = readings.filter((r) => r.kind === kind)
            const baseline = computeBaseline(allKindReadings, en)

            if (kindReadings.length === 0) {
              return (
                <div key={kind} className="biomed-chart-card">
                  <div className="biomed-chart-card-head">
                    <h4>{entry ? (en ? entry.name.en : entry.name.es) : kind}</h4>
                    <span className="rd-tag">{entry?.unit}</span>
                  </div>
                  <div className="biomed-empty-chart">
                    <Clock size={20} aria-hidden="true" className="rd-muted" />
                    <p className="rd-muted">
                      {en
                        ? `No measurements recorded in the selected period (${range === '24h' ? '24 hours' : range === '7d' ? '7 days' : 'mission'}).`
                        : `No hay mediciones registradas en el periodo seleccionado (${range === '24h' ? '24 horas' : range === '7d' ? '7 días' : 'misión'}).`}
                    </p>
                    {canRecord && onRecordNew ? (
                      <button type="button" className="rd-btn-xs ghost" onClick={onRecordNew}>
                        {en ? 'Log a measurement' : 'Registrar medición'}
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            }

            // Simple SVG Line Chart calculation
            const values = kindReadings.map((r) => r.value)
            const minVal = Math.min(...values)
            const maxVal = Math.max(...values)
            const padding = Math.max(1, (maxVal - minVal) * 0.2)
            const yMin = Math.floor(minVal - padding)
            const yMax = Math.ceil(maxVal + padding)
            const yRange = yMax - yMin || 1

            const chartW = 380
            const chartH = 140
            const marginL = 36
            const marginR = 16
            const marginT = 16
            const marginB = 26
            const plotW = chartW - marginL - marginR
            const plotH = chartH - marginT - marginB

            const points = kindReadings.map((r, i) => {
              const x =
                kindReadings.length === 1
                  ? marginL + plotW / 2
                  : marginL + (i / (kindReadings.length - 1)) * plotW
              const y = marginT + plotH - ((r.value - yMin) / yRange) * plotH
              return { x, y, reading: r }
            })

            const pathD = points.reduce((acc, p, i) => {
              return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`
            }, '')

            // Baseline y line if exists
            let baselineY: number | null = null
            if (baseline.isEstablished && baseline.mean != null && baseline.mean >= yMin && baseline.mean <= yMax) {
              baselineY = marginT + plotH - ((baseline.mean - yMin) / yRange) * plotH
            }

            return (
              <div key={kind} className="biomed-chart-card">
                <div className="biomed-chart-card-head">
                  <div>
                    <h4>{entry ? (en ? entry.name.en : entry.name.es) : kind}</h4>
                    <span className="biomed-chart-baseline-text">
                      {baseline.isEstablished ? (
                        <>
                          <span className="biomed-baseline-dot" />
                          {en ? `Baseline: ${baseline.mean} ${entry?.unit}` : `Base: ${baseline.mean} ${entry?.unit}`}
                        </>
                      ) : (
                        <span className="rd-muted">{en ? 'Not enough data for baseline' : 'Sin datos suficientes para base'}</span>
                      )}
                    </span>
                  </div>
                  <div className="biomed-chart-stat-pill">
                    <span className="rd-muted">{en ? 'Latest:' : 'Último:'}</span>{' '}
                    <strong>{kindReadings[kindReadings.length - 1] ? formatIndicatorValue(kindReadings[kindReadings.length - 1]!, en) : '--'}</strong>
                  </div>
                </div>

                <div className="biomed-chart-svg-wrap">
                  <svg viewBox={`0 0 ${chartW} ${chartH}`} className="biomed-chart-svg">
                    {/* Y Grid lines */}
                    <line x1={marginL} y1={marginT} x2={chartW - marginR} y2={marginT} className="biomed-grid-line" />
                    <line x1={marginL} y1={marginT + plotH / 2} x2={chartW - marginR} y2={marginT + plotH / 2} className="biomed-grid-line" />
                    <line x1={marginL} y1={marginT + plotH} x2={chartW - marginR} y2={marginT + plotH} className="biomed-grid-line" />

                    {/* Y Axis labels */}
                    <text x={marginL - 6} y={marginT + 4} textAnchor="end" className="biomed-axis-label">{yMax}</text>
                    <text x={marginL - 6} y={marginT + plotH / 2 + 4} textAnchor="end" className="biomed-axis-label">{Math.round((yMax + yMin) / 2)}</text>
                    <text x={marginL - 6} y={marginT + plotH + 4} textAnchor="end" className="biomed-axis-label">{yMin}</text>

                    {/* Baseline indicator line */}
                    {baselineY != null ? (
                      <g>
                        <line
                          x1={marginL}
                          y1={baselineY}
                          x2={chartW - marginR}
                          y2={baselineY}
                          className="biomed-baseline-line"
                        />
                        <text x={chartW - marginR - 2} y={baselineY - 4} textAnchor="end" className="biomed-baseline-label">
                          {en ? 'Baseline' : 'Línea base'}
                        </text>
                      </g>
                    ) : null}

                    {/* Data line */}
                    <path d={pathD} className="biomed-chart-path" />

                    {/* Data points */}
                    {points.map((p, idx) => (
                      <g key={idx} className="biomed-chart-node">
                        <circle cx={p.x} cy={p.y} r="4.5" className="biomed-chart-dot" />
                        <text x={p.x} y={marginT + plotH + 18} textAnchor="middle" className="biomed-axis-label">
                          {idx === 0 || idx === points.length - 1 || idx === Math.floor(points.length / 2)
                            ? formatChartDate(p.reading.measuredAt, range, en)
                            : ''}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>

                <div className="biomed-chart-foot">
                  <span>
                    {en ? `Samples: ${kindReadings.length}` : `Muestras: ${kindReadings.length}`} · {en ? `Min: ${minVal}` : `Mín: ${minVal}`} · {en ? `Max: ${maxVal}` : `Máx: ${maxVal}`} {entry?.unit}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
