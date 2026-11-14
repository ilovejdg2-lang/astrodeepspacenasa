import { motion } from 'motion/react'
import { Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

/** Escena animada del hero (animación, no video real). */
export function HeroStage({ reduced }: { reduced: boolean }) {
  const [playing, setPlaying] = useState(!reduced)
  const stageRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (reduced) setPlaying(false)
  }, [reduced])

  useEffect(() => {
    const node = stageRef.current
    if (!node || reduced) return

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      const rect = node.getBoundingClientRect()
      const px = (event.clientX - rect.left) / Math.max(rect.width, 1)
      const py = (event.clientY - rect.top) / Math.max(rect.height, 1)
      setTilt({
        x: (py - 0.5) * -8,
        y: (px - 0.5) * 10,
      })
    }
    const onLeave = () => setTilt({ x: 0, y: 0 })

    node.addEventListener('pointermove', onMove)
    node.addEventListener('pointerleave', onLeave)
    return () => {
      node.removeEventListener('pointermove', onMove)
      node.removeEventListener('pointerleave', onLeave)
    }
  }, [reduced])

  return (
    <div className="hero-stage" ref={stageRef}>
      <div className="hero-stage-glow" />
      <div className="hero-scan" aria-hidden="true" />
      <motion.div
        className="hero-orbits"
        animate={playing && !reduced ? { rotate: 360 } : { rotate: 0 }}
        transition={playing && !reduced ? { duration: 28, repeat: Infinity, ease: 'linear' } : { duration: 0.3 }}
      >
        <span className="orbit orbit-a" />
        <span className="orbit orbit-b" />
        <span className="orbit-dot" />
      </motion.div>

      <motion.div
        className="hero-sensor"
        animate={
          playing && !reduced
            ? { y: [0, -10, 0], rotateX: tilt.x, rotateY: tilt.y }
            : { y: 0, rotateX: 0, rotateY: 0 }
        }
        transition={
          playing && !reduced
            ? { y: { duration: 6, repeat: Infinity, ease: 'easeInOut' }, rotateX: { duration: 0.2 }, rotateY: { duration: 0.2 } }
            : { duration: 0.2 }
        }
        style={{ transformStyle: 'preserve-3d', perspective: 800 }}
      >
        <svg viewBox="0 0 220 220" className="hero-sensor-svg" aria-hidden="true">
          <defs>
            <linearGradient id="sensorGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#CDEBDD" />
              <stop offset="50%" stopColor="#DDD4F3" />
              <stop offset="100%" stopColor="#F7DCE6" />
            </linearGradient>
          </defs>
          <circle cx="110" cy="110" r="86" fill="url(#sensorGrad)" opacity="0.95" />
          <circle cx="110" cy="110" r="68" fill="#10131E" opacity="0.88" />
          <path
            className={playing && !reduced ? 'hero-ecg-line' : undefined}
            d="M48 112h28l10-28 14 56 12-28h42"
            fill="none"
            stroke="#F5004F"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="110" cy="110" r="92" fill="none" stroke="#F5004F" strokeOpacity="0.35" strokeWidth="2" />
        </svg>
        <p className="hero-telemetry" aria-hidden="true">Telemetría simulada</p>
      </motion.div>

      <button
        type="button"
        className="hero-play"
        onClick={() => setPlaying((value) => !value)}
        aria-pressed={playing}
        aria-label={playing ? 'Pausar movimiento del hero' : 'Reanudar movimiento del hero'}
      >
        {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        {playing ? 'Pausar' : 'Reanudar'}
      </button>
    </div>
  )
}
