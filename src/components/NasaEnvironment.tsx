import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  fetchEnvironmental,
  radiationSchema,
  weatherSchema,
  type RadiationResponse,
  type WeatherResponse,
} from '../api/environment'
import { useLocale } from '../i18n'

function Dates({
  start,
  end,
  setStart,
  setEnd,
  en,
}: {
  start: string
  end: string
  setStart: (v: string) => void
  setEnd: (v: string) => void
  en: boolean
}) {
  return (
    <>
      <label className="field">
        {en ? 'From (UTC)' : 'Desde (UTC)'}
        <input
          type="date"
          required
          value={start}
          max={end}
          onChange={(e) => setStart(e.target.value)}
        />
      </label>
      <label className="field">
        {en ? 'Through (UTC)' : 'Hasta (UTC)'}
        <input
          type="date"
          required
          value={end}
          min={start}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setEnd(e.target.value)}
        />
      </label>
    </>
  )
}
function Source({
  source,
  cached,
  fetchedAt,
  en,
  example,
}: {
  source: string
  cached: boolean
  fetchedAt: string
  en: boolean
  example?: boolean
}) {
  return (
    <p className="muted">
      {source} ·{' '}
      {example
        ? en
          ? 'Verified local historical example (retrieval date)'
          : 'Ejemplo histórico local verificado (fecha de consulta)'
        : cached
          ? en
            ? 'Cached'
            : 'En caché'
          : en
            ? 'Retrieved from NASA'
            : 'Consultado en NASA'}{' '}
      · {en ? 'Retrieved' : 'Consulta'}: {fetchedAt} ·{' '}
      {en
        ? 'Real historical records · UTC'
        : 'Registros históricos reales · UTC'}
    </p>
  )
}
function shortUtc(value: string, en: boolean) {
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return value.replace(/\.\d+Z$/, 'Z')
  const label = new Intl.DateTimeFormat(en ? 'en-GB' : 'es-CR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    hourCycle: 'h23',
  }).format(parsed)
  return `${label} UTC`
}

function utcDateOffset(days: number) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

const DONKI_RECENT_LIMIT = 5

export function SpaceWeatherPanel({ notices = false }: { notices?: boolean }) {
  const { lang } = useLocale()
  const en = lang === 'en'
  const defaultStart = utcDateOffset(-1)
  const defaultEnd = utcDateOffset(0)
  const [start, setStart] = useState(defaultStart)
  const [end, setEnd] = useState(defaultEnd)
  const [type, setType] = useState('')
  const [query, setQuery] = useState<Record<string, string>>(() => ({
    startDate: defaultStart,
    endDate: defaultEnd,
  }))
  const [data, setData] = useState<WeatherResponse | null>(null)
  const [status, setStatus] = useState('loading')
  const [open, setOpen] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setData(null)
    setStatus('loading')
    setShowAll(false)
    void fetchEnvironmental(
      'donki/events',
      query,
      weatherSchema,
      controller.signal,
    )
      .then((value) => {
        if (!controller.signal.aborted) {
          setData(value)
          setStatus('ready')
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('error')
      })
    return () => controller.abort()
  }, [query])

  const sortedEvents = useMemo(() => {
    const events = data?.events ?? []
    return [...events].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
  }, [data])
  const visibleEvents = showAll ? sortedEvents : sortedEvents.slice(0, DONKI_RECENT_LIMIT)
  const hiddenCount = Math.max(0, sortedEvents.length - DONKI_RECENT_LIMIT)
  const rangeLabel = `${query.startDate || defaultStart} → ${query.endDate || defaultEnd} UTC`
  const title = notices
    ? en
      ? 'Environmental notices'
      : 'Avisos ambientales'
    : en
      ? 'Space weather'
      : 'Clima espacial'

  const countLabel = status === 'ready'
    ? (en
      ? `${sortedEvents.length} event${sortedEvents.length === 1 ? '' : 's'}`
      : `${sortedEvents.length} evento${sortedEvents.length === 1 ? '' : 's'}`)
    : ''

  return (
    <section className="panel nasa-panel env-card" aria-label={title}>
      <header className="env-head">
        <div>
          <p className="env-kicker">NASA DONKI</p>
          <h2>{title}</h2>
          <p className="env-purpose">
            {en
              ? 'NASA reports of solar activity. They do not measure your personal exposure.'
              : 'Reportes de actividad solar de NASA. No miden tu exposición personal.'}
          </p>
        </div>
        <button type="button" className="chip" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          {open ? (en ? 'Hide' : 'Ocultar') : (en ? 'Show' : 'Mostrar')}
        </button>
      </header>

      {open ? (
        <>
          <div aria-live="polite" aria-busy={status === 'loading'}>
            {status === 'loading' ? <p>{en ? 'Loading NASA events…' : 'Consultando eventos NASA…'}</p> : null}
            {status === 'ready' ? (
              <p className="env-meta env-summary">{countLabel} · {rangeLabel}</p>
            ) : null}
            {status === 'error' ? (
              <p role="alert">
                {en
                  ? 'NASA unavailable or invalid query. Retry. No events generated.'
                  : 'NASA no disponible o consulta inválida. Reintentá. No se generaron eventos.'}
              </p>
            ) : null}
            {data && !sortedEvents.length ? (
              <p>{en ? 'No events in this interval.' : 'Sin eventos en este intervalo.'}</p>
            ) : null}
            {data && sortedEvents.length ? (
              <div className="env-list">
                {visibleEvents.map((event) => {
                  const desc = event.description || (en ? 'No description supplied by NASA.' : 'NASA no proporcionó descripción.')
                  return (
                    <article key={`${event.type}-${event.id}`} className="env-event">
                      <div className="env-event-top">
                        <span className="env-kind">{event.type}{event.classification ? ` ${event.classification}` : ''}</span>
                        <time dateTime={event.timestamp}>{shortUtc(event.timestamp, en)}</time>
                        {event.sourceUrl ? (
                          <a href={event.sourceUrl} target="_blank" rel="noreferrer">{en ? 'NASA record' : 'Registro NASA'}</a>
                        ) : null}
                      </div>
                      <details className="env-event-description">
                        <summary>{en ? 'Event details' : 'Detalles del evento'}</summary>
                        <p>{desc}</p>
                      </details>
                    </article>
                  )
                })}
              </div>
            ) : null}
          </div>
          {hiddenCount > 0 ? (
            <button type="button" className="chip" onClick={() => setShowAll((value) => !value)}>
              {showAll
                ? (en ? 'Show recent only' : 'Ver solo recientes')
                : (en ? `Show ${hiddenCount} more` : `Ver ${hiddenCount} más`)}
            </button>
          ) : null}
          <details>
            <summary>{en ? 'Change range or type' : 'Cambiar rango o tipo'}</summary>
            <form
              className="nasa-filters"
              onSubmit={(event) => {
                event.preventDefault()
                setQuery({ startDate: start, endDate: end, ...(type ? { type } : {}) })
              }}
            >
              <Dates start={start} end={end} setStart={setStart} setEnd={setEnd} en={en} />
              <label className="field">
                {en ? 'Event' : 'Evento'}
                <select value={type} onChange={(event) => setType(event.target.value)}>
                  <option value="">{en ? 'All' : 'Todos'}</option>
                  {['SEP', 'FLR', 'CME'].map((value) => <option key={value}>{value}</option>)}
                </select>
              </label>
              <button className="chip" type="submit">{en ? 'Query' : 'Consultar'}</button>
              <button
                className="chip"
                type="button"
                onClick={() => {
                  const nextStart = utcDateOffset(-1)
                  const nextEnd = utcDateOffset(0)
                  setStart(nextStart)
                  setEnd(nextEnd)
                  setType('')
                  setQuery({ startDate: nextStart, endDate: nextEnd })
                }}
              >
                {en ? 'Last two days' : 'Últimos dos días'}
              </button>
            </form>
            <p className="env-meta">{rangeLabel}</p>
          </details>
          {data?.sources[0] ? (
            <details>
              <summary>{en ? 'Source and time' : 'Fuente y hora'}</summary>
              <Source {...data.sources[0]} en={en} />
            </details>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
export function RadiationPanel({ compact = false }: { compact?: boolean }) {
  const { lang } = useLocale()
  const en = lang === 'en'
  const [start, setStart] = useState('2023-05-16')
  const [end, setEnd] = useState('2023-05-16')
  const [instrument, setInstrument] = useState('REM-Lid')
  const [query, setQuery] = useState<Record<string, string>>({
    example: 'true',
    startDate: '2023-05-16',
    endDate: '2023-05-16',
    instrument: 'REM-Lid',
  })
  const [data, setData] = useState<RadiationResponse | null>(null)
  const [status, setStatus] = useState('loading')
  useEffect(() => {
    const controller = new AbortController()
    setData(null)
    setStatus('loading')
    void fetchEnvironmental(
      query.example ? 'radlab/example' : 'radlab/measurements',
      query.example ? {} : query,
      radiationSchema,
      controller.signal,
    )
      .then((value) => {
        if (!controller.signal.aborted) {
          setData(value)
          setStatus('ready')
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('error')
      })
    return () => controller.abort()
  }, [query])
  const chartKeys = (['absorbedDoseRate', 'doseEquivalentRate'] as const)
  const detectors = data
    ? [...new Set(data.measurements.map((row) => `${row.instrument} · ${row.spacecraft ?? '—'}`))].join('; ')
    : ''
  return (
    <section className={`panel nasa-panel env-card${compact ? ' is-compact' : ''}`}>
      <div>
        <p className="env-kicker">NASA RadLab</p>
        <h2>{en ? 'Radiation readings' : 'Lecturas de radiación'}</h2>
        <p className={compact ? 'env-purpose' : 'callout callout-amber'}>
          {compact
            ? (en
              ? 'Historical station readings, not your personal dose. µGy/h and µSv/h are different units.'
              : 'Lecturas históricas de la estación, no tu dosis personal. µGy/h y µSv/h son unidades distintas.')
            : (en
              ? 'Historical environmental measurements, not current personal astronaut doses. Absorbed dose rate (µGy/h) and dose equivalent rate (µSv/h) are separate quantities. No accumulated doses or medical safety limits are calculated.'
              : 'Mediciones ambientales históricas, no dosis personales actuales. La tasa absorbida (µGy/h) y la tasa equivalente (µSv/h) son magnitudes distintas. No se calculan dosis acumuladas ni límites médicos.')}
        </p>
      </div>
      <div className="env-tools">
        <button type="button" className="chip" onClick={() => setQuery({ example: 'true' })}>
          {en ? 'Verified example' : 'Ejemplo verificado'}
        </button>
      </div>
      <details>
        <summary>{en ? 'Change dates' : 'Cambiar fechas'}</summary>
        <form
          className="nasa-filters"
          onSubmit={(event) => {
            event.preventDefault()
            setQuery({ startDate: start, endDate: end, instrument })
          }}
        >
          <Dates start={start} end={end} setStart={setStart} setEnd={setEnd} en={en} />
          <label className="field">
            {en ? 'Instrument' : 'Instrumento'}
            <select value={instrument} onChange={(event) => setInstrument(event.target.value)}>
              {['REM-Lid', 'DosTel1', 'DosTel2'].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <button className="chip" type="submit">
            {en ? 'Query (max. 2 days)' : 'Consultar (máx. 2 días)'}
          </button>
        </form>
      </details>
      <div aria-live="polite" aria-busy={status === 'loading'}>
        {status === 'loading' && (
          <p>{en ? 'Loading RadLab…' : 'Consultando RadLab…'}</p>
        )}
        {status === 'error' && (
          <p role="alert">
            {en
              ? 'RadLab unavailable or invalid query. Retry. No substitute measurements.'
              : 'RadLab no disponible o consulta inválida. Reintentá. No se sustituyeron mediciones.'}
          </p>
        )}
      </div>
      {data && (
        <>
          {detectors ? <p className="env-meta">{detectors}</p> : null}
          <details>
            <summary>{en ? 'Source and time' : 'Fuente y hora'}</summary>
            <p className="badge" data-testid="radlab-provenance">
              RadLab
              {data.cached ? (en ? ' · cached' : ' · caché') : (en ? ' · live' : ' · vivo')}
              {data.fetchedAt ? ` · ${data.fetchedAt}` : ''}
            </p>
            <Source {...data} en={en} />
            <a href={data.sourceUrl} target="_blank" rel="noreferrer">{en ? 'NASA source' : 'Fuente NASA'}</a>
          </details>
          {!data.measurements.length ? (
            <p>{en ? 'No measurements in this interval.' : 'Sin mediciones en este intervalo.'}</p>
          ) : (
            chartKeys.map((key) => {
              const label = key === 'absorbedDoseRate'
                ? (en ? 'Absorbed dose rate' : 'Tasa de dosis absorbida')
                : (en ? 'Dose equivalent rate' : 'Tasa de dosis equivalente')
              const hasValues = data.measurements.some((row) => row[key] !== null)
              if (!hasValues) {
                return (
                  <p key={key}>
                    {label} ({data.units[key]}): {en ? 'NASA did not supply this quantity.' : 'NASA no suministró esta magnitud.'}
                  </p>
                )
              }
              return (
                <div key={key} className="env-chart">
                  <h3>{label} ({data.units[key]})</h3>
                  <div style={{ width: '100%', height: compact ? 160 : 240 }}>
                  <ResponsiveContainer>
                    <LineChart data={data.measurements}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tickFormatter={(value) => String(value).slice(11, 16)} />
                      <YAxis width={56} />
                      <Tooltip />
                      {!compact ? <Legend /> : null}
                      <Line
                        dataKey={key}
                        name={data.units[key]}
                        stroke={key === 'absorbedDoseRate' ? '#e60049' : '#8a5a00'}
                        dot={false}
                        connectNulls={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  </div>
                </div>
              )
            })
          )}
        </>
      )}
    </section>
  )
}
