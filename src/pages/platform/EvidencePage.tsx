import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HeliosLogo } from '../../components/HeliosLogo'
import { useLocale } from '../../i18n'
import { platformApi, type Evidence } from '../../platform/api'
import '../../platform/platform.css'

export function EvidencePage() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const [items, setItems] = useState<Evidence[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = en ? 'HELIOS · Evidence' : 'HELIOS · Evidencia'
    let alive = true
    setLoading(true)
    platformApi.evidence()
      .then((data) => {
        if (alive) setItems(data.items)
      })
      .catch(() => {
        if (alive) setItems([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => { alive = false }
  }, [en])

  return (
    <div className="plat">
      {loading ? (
        <div className="plat-loader" role="status" aria-live="polite">
          <span className="plat-spinner" aria-hidden="true" />
          <p>{en ? 'Loading sources…' : 'Cargando fuentes…'}</p>
        </div>
      ) : null}
      <div className="plat-shell">
        <div className="plat-top">
          <HeliosLogo variant="wordmark" />
          <Link className="plat-btn ghost" to="/misiones">Hub</Link>
        </div>
        <p className="plat-kicker">{en ? 'Curated library' : 'Biblioteca curada'}</p>
        <h1>{en ? 'Official sources' : 'Fuentes oficiales'}</h1>
        <p className="plat-lead">
          {en
            ? 'Evidence to explain risks and support reviews. Not a diagnostics API. Keep scientific evidence, simulation rules, and user data separate.'
            : 'Evidencia para explicar riesgos y fundamentar revisiones. No es API de diagnósticos. Separá evidencia científica, regla de simulación y dato del usuario.'}
        </p>
        {!loading && items.length === 0 ? (
          <p>{en ? 'No sources available.' : 'No hay fuentes disponibles.'}</p>
        ) : null}
        <div className="plat-list">
          {items.map((item) => (
            <article className="plat-panel" key={item.id}>
              <h2>{item.title}</h2>
              <p>{item.institution} · {item.kind}</p>
              <p>{item.notes}</p>
              <a className="plat-btn ghost" href={item.url} target="_blank" rel="noreferrer">
                {en ? 'Open source' : 'Abrir fuente'}
              </a>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}