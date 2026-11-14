import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Reveal } from '../../components/public/Reveal'
import { DASHBOARD_PATH, LANDING_VIDEO } from '../../content/landing'

export function VideoPage() {
  useEffect(() => {
    document.title = 'Video · HELIOS'
  }, [])

  const hasVideo = LANDING_VIDEO.kind !== 'none' && Boolean(LANDING_VIDEO.src)

  return (
    <>
      <header className="pub-page-hero">
        <p className="pub-kicker">Video</p>
        <h1>{LANDING_VIDEO.title}</h1>
        <p className="pub-lead">
          Presentación audiovisual del prototipo. Este recurso es distinto de la escena animada del hero de inicio.
        </p>
      </header>

      <Reveal className="video-frame" aria-label="Reproductor del video del proyecto">
        {hasVideo && LANDING_VIDEO.kind === 'youtube' ? (
          <iframe
            title={LANDING_VIDEO.title}
            src={LANDING_VIDEO.src}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : hasVideo && LANDING_VIDEO.kind === 'file' ? (
          <video controls playsInline preload="metadata" src={LANDING_VIDEO.src}>
            <track kind="captions" />
          </video>
        ) : (
          <div>
            <p className="pub-kicker" style={{ color: '#ff6b9a' }}>Próximamente</p>
            <h2 style={{ margin: '8px 0 10px', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)' }}>Video de presentación en preparación</h2>
            <p style={{ margin: 0, maxWidth: '42ch', opacity: 0.8 }}>
              Cuando exista un archivo autorizado, este espacio lo mostrará a tamaño completo con controles accesibles.
            </p>
          </div>
        )}
      </Reveal>

      <Reveal className="team-actions" style={{ marginTop: 24 }}>
        <Link className="pub-btn" to="/proyecto">Explorar el proyecto</Link>
        <Link className="pub-btn-ghost" to={DASHBOARD_PATH}>Acceder al sistema</Link>
      </Reveal>
    </>
  )
}
