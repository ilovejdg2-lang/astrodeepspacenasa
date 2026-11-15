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
  const [filtersOpen, setFiltersOpen] = useState(false)
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

  return (
    <section
      className={`panel nasa-panel space-weather-brief${open ? ' is-open' : ''}`}
      aria-label={title}
    >
      <header className="space-weather-brief-head">
        <div>
          <p className="badge">NASA · DONKI</p>
          <h2>{title}</h2>
          <p className="muted space-weather-brief-meta">
            {en ? 'Today + yesterday (default)' : 'Hoy + ayer (por defecto)'}
            {' · '}
            {status === 'loading'
              ? (en ? 'Loading…' : 'Cargando…')
              : status === 'error'
                ? (en ? 'Unavailable' : 'No disponible')
                : (en
                  ? `${sortedEvents.length} event${sortedEvents.length === 1 ? '' : 's'}`
                  : `${sortedEvents.length} evento${sortedEvents.length === 1 ? '' : 's'}`)}
            {' · '}
            {rangeLabel}
          </p>
        </div>
        <button
          type="button"
          className="chip"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (en ? 'Collapse' : 'Plegar') : (en ? 'Expand' : 'Desplegar')}
        </button>
      </header>

      {open ? (
        <div className="space-weather-brief-body">
          <p className="muted space-weather-brief-note">
            {en
              ? 'DONKI context only — not personal exposure or medical alerts.'
              : 'Solo contexto DONKI — no exposición personal ni alertas médicas.'}
          </p>

          <button
            type="button"
            className="chip"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((v) => !v)}
          >
            {filtersOpen
              ? (en ? 'Hide range filters' : 'Ocultar filtros')
              : (en ? 'Change range / type' : 'Cambiar rango / tipo')}
          </button>

          {filtersOpen ? (
            <form
              className="nasa-filters"
              onSubmit={(e) => {
                e.preventDefault()
                setQuery({
                  startDate: start,
                  endDate: end,
                  ...(type ? { type } : {}),
                })
              }}
            >
              <Dates
                start={start}
                end={end}
                setStart={setStart}
                setEnd={setEnd}
                en={en}
              />
              <label className="field">
                {en ? 'Event' : 'Evento'}
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="">{en ? 'All' : 'Todos'}</option>
                  {['SEP', 'FLR', 'CME'].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <button className="chip" type="submit">
                {en ? 'Query' : 'Consultar'}
              </button>
              <button
                className="chip"
                type="button"
                onClick={() => {
                  const s = utcDateOffset(-1)
                  const e = utcDateOffset(0)
                  setStart(s)
                  setEnd(e)
                  setType('')
                  setQuery({ startDate: s, endDate: e })
                }}
              >
                {en ? 'Reset to today+yesterday' : 'Volver a hoy+ayer'}
              </button>
            </form>
          ) : null}

          <div aria-live="polite" aria-busy={status === 'loading'}>
            {status === 'loading' && (
              <p>{en ? 'Loading NASA events…' : 'Consultando eventos NASA…'}</p>
            )}
            {status === 'error' && (
              <p role="alert">
                {en
                  ? 'NASA unavailable or invalid query. Retry. No events generated.'
                  : 'NASA no disponible o consulta inválida. Reintentá. No se generaron eventos.'}
              </p>
            )}
            {data && (
              <>
                {data.sources.slice(0, 1).map((s) => (
                  <Source key={s.sourceUrl} {...s} en={en} />
                ))}
                {!sortedEvents.length && (
                  <p>
                    {en
                      ? 'No events in this interval.'
                      : 'Sin eventos en este intervalo.'}
                  </p>
                )}
                <div className="nasa-events space-weather-brief-list">
                  {visibleEvents.map((event) => {
                    const desc =
                      event.description ||
                      (en
                        ? 'No description supplied by NASA.'
                        : 'NASA no proporcionó descripción.')
                    const short =
                      desc.length > 140 ? `${desc.slice(0, 137).trim()}…` : desc
                    return (
                      <article
                        key={`${event.type}-${event.id}`}
                        className="nasa-event"
                      >
                        <div className="spread" style={{ alignItems: 'baseline', gap: 8 }}>
                          <h3>
                            {event.type}
                            {event.classification ? ` · ${event.classification}` : ''}
                          </h3>
                          <time dateTime={event.timestamp} className="muted">
                            {event.timestamp.replace(/\.\d+Z$/, 'Z')}
                          </time>
                        </div>
                        <p>{short}</p>
                        {event.sourceUrl && (
                          <a href={event.sourceUrl} target="_blank" rel="noreferrer">
                            {en ? 'NASA record' : 'Registro NASA'}
                          </a>
                        )}
                      </article>
                    )
                  })}
                </div>
                {hiddenCount > 0 ? (
                  <button
                    type="button"
                    className="chip"
                    onClick={() => setShowAll((v) => !v)}
                  >
                    {showAll
                      ? (en ? 'Show recent only' : 'Ver solo recientes')
                      : (en
                        ? `Show ${hiddenCount} more`
                        : `Ver ${hiddenCount} más`)}
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>
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
  const chartKeys = (compact
    ? (['doseEquivalentRate'] as const)
    : (['absorbedDoseRate', 'doseEquivalentRate'] as const))
  return (
    <section className={`panel nasa-panel${compact ? ' is-compact' : ''}`}>
      <h2>{en ? 'RadLab · radiation' : 'RadLab · radiación'}</h2>
      <p className={compact ? 'muted' : 'callout callout-amber'}>
        {compact
          ? (en
            ? 'Historical environment · not personal dose · µGy/h ≠ µSv/h'
            : 'Ambiente histórico · no dosis personal · µGy/h ≠ µSv/h')
          : (en
            ? 'Historical environmental measurements, not current personal astronaut doses. Absorbed dose rate (µGy/h) and dose equivalent rate (µSv/h) are separate quantities. No accumulated doses or medical safety limits are calculated.'
            : 'Mediciones ambientales históricas, no dosis personales actuales. La tasa absorbida (µGy/h) y la tasa equivalente (µSv/h) son magnitudes distintas. No se calculan dosis acumuladas ni límites médicos.')}
      </p>
      <form
        className="nasa-filters"
        onSubmit={(e) => {
          e.preventDefault()
          setQuery({ startDate: start, endDate: end, instrument })
        }}
      >
        <Dates
          start={start}
          end={end}
          setStart={setStart}
          setEnd={setEnd}
          en={en}
        />
        <label className="field">
          {en ? 'Instrument' : 'Instrumento'}
          <select
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
          >
            {['REM-Lid', 'DosTel1', 'DosTel2'].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <button className="chip" type="submit">
          {en ? (compact ? 'Query' : 'Query (max. 2 calendar days)') : (compact ? 'Consultar' : 'Consultar (máx. 2 días calendario)')}
        </button>
      </form>
      <button
        type="button"
        className="chip"
        onClick={() => setQuery({ example: 'true' })}
      >
        {en
          ? (compact ? 'Verified example' : 'Load verified local example: REM-Lid · 2023-05-16 00:00–01:00 UTC')
          : (compact ? 'Ejemplo verificado' : 'Cargar ejemplo local verificado: REM-Lid · 2023-05-16 00:00–01:00 UTC')}
      </button>
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
          <p className="badge" data-testid="radlab-provenance">
            RadLab
            {data.cached ? (en ? ' · cached' : ' · caché') : (en ? ' · live' : ' · vivo')}
            {data.fetchedAt ? ` · ${data.fetchedAt}` : ''}
          </p>
          {!compact ? (
            <p>{en ? 'Environmental historical measurements; they do not establish individual astronaut exposure or diagnoses. Units are supplied by NASA (µGy/h and µSv/h); values are not relabeled as daily rates. All record times are UTC.' : 'Mediciones ambientales históricas; no establecen exposición individual ni diagnósticos. Las unidades son las suministradas por NASA (µGy/h y µSv/h); no se presentan como tasas diarias. Todas las fechas del registro son UTC.'}</p>
          ) : null}
          <Source {...data} en={en} />
          <a href={data.sourceUrl} target="_blank" rel="noreferrer">
            {en ? 'NASA source' : 'Fuente NASA'}
          </a>
          {!compact ? (
            <p>
              {en ? 'Detector / spacecraft: ' : 'Detector / nave: '}
              {[
                ...new Set(
                  data.measurements.map(
                    (m) => `${m.instrument} · ${m.spacecraft ?? '—'}`,
                  ),
                ),
              ].join('; ')}
            </p>
          ) : null}
          {!data.measurements.length ? (
            <p>
              {en
                ? 'No measurements in this interval.'
                : 'Sin mediciones en este intervalo.'}
            </p>
          ) : (
            <>
              {chartKeys.map((key) => (
                <div key={key}>
                  <h3>
                    {key === 'absorbedDoseRate'
                      ? en
                        ? 'Absorbed dose rate'
                        : 'Tasa de dosis absorbida'
                      : en
                        ? 'Dose equivalent rate'
                        : 'Tasa de dosis equivalente'}{' '}
                    ({data.units[key]})
                  </h3>
                  {data.measurements.some((row) => row[key] !== null) ? (
                    <div style={{ width: '100%', height: compact ? 180 : 260 }}>
                      <ResponsiveContainer>
                        <LineChart data={data.measurements}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="timestamp"
                            tickFormatter={(v) => String(v).slice(11, 16)}
                          />
                          <YAxis width={65} />
                          <Tooltip />
                          {!compact ? <Legend /> : null}
                          <Line
                            dataKey={key}
                            name={data.units[key]}
                            stroke={
                              key === 'absorbedDoseRate'
                                ? '#e4a44c'
                                : '#56acbc'
                            }
                            dot={false}
                            connectNulls={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p>
                      {en
                        ? 'NASA did not supply this quantity.'
                        : 'NASA no suministró esta magnitud.'}
                    </p>
                  )}
                </div>
              ))}
            </>
          )}
        </>
      )}
    </section>
  )
}
