import { Pause, Play } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useLocale } from '../../i18n'

const PlanetGlobe = lazy(() =>
  import('./scenes/PlanetGlobe').then((m) => ({ default: m.PlanetGlobe })),
)

/** Escena protagonista del hero: planeta + órbitas (lazy). */
export function HeroStage({ reduced }: { reduced: boolean }) {
  const { lang } = useLocale()
  const en = lang === 'en'
  const [playing, setPlaying] = useState(!reduced)

  useEffect(() => {
    setPlaying(!reduced)
  }, [reduced])

  return (
    <div className="hero-stage">
      <div className="hero-stage-glow" />
      <Suspense
        fallback={
          <div className="planet-static" aria-hidden="true">
            <div className="planet-static-orb" />
            <div className="planet-static-ring" />
          </div>
        }
      >
        <PlanetGlobe playing={playing} reduced={reduced} />
      </Suspense>

      <p className="hero-telemetry" aria-hidden="true">
        {en ? 'Simulated telemetry' : 'Telemetría simulada'}
      </p>

      <button
        type="button"
        className="hero-play"
        onClick={() => setPlaying((value) => !value)}
        aria-pressed={playing}
        aria-label={
          playing
            ? en
              ? 'Pause hero motion'
              : 'Pausar movimiento del hero'
            : en
              ? 'Resume hero motion'
              : 'Reanudar movimiento del hero'
        }
      >
        {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        {playing ? (en ? 'Pause' : 'Pausar') : en ? 'Resume' : 'Reanudar'}
      </button>
    </div>
  )
}
