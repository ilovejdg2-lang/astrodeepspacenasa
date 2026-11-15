import { useEffect, useRef } from 'react'
import { densityForWidth, MOTION, readThemeDark, SPACE } from '../../../motion/tokens'
import { useSceneLifecycle } from '../../../hooks/useSceneLifecycle'

type Props = { playing: boolean; reduced: boolean }

type OrbitDot = { speed: number; phase: number; color: string; trail: number; rx: number; ry: number; rot: number }
type Star = { x: number; y: number; r: number; tw: number; z: number }

/** Mapa equirectangular procedural (océano + continentes). No usa imagery NASA. */
function buildWorldMap(w = 720, h = 360) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const ocean = ctx.createLinearGradient(0, 0, 0, h)
  ocean.addColorStop(0, '#1a4a6e')
  ocean.addColorStop(0.45, '#1f6a88')
  ocean.addColorStop(1, '#143a58')
  ctx.fillStyle = ocean
  ctx.fillRect(0, 0, w, h)

  const land = (points: Array<[number, number]>, color: string) => {
    ctx.beginPath()
    points.forEach(([lon, lat], i) => {
      const x = ((lon + 180) / 360) * w
      const y = ((90 - lat) / 180) * h
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
  }

  const g = '#3f946e'
  const g2 = '#4eab7f'
  land([[-130, 70], [-60, 72], [-55, 50], [-80, 25], [-105, 20], [-120, 35], [-130, 55]], g)
  land([[-85, 15], [-70, 10], [-75, -5], [-80, -20], [-70, -40], [-55, -55], [-75, -50], [-90, -20], [-95, 5]], g2)
  land([[-10, 60], [40, 65], [45, 45], [10, 35], [-10, 40]], g)
  land([[-15, 35], [40, 35], [50, 10], [40, -30], [20, -35], [10, 5], [-10, 15]], '#4c9a6a')
  land([[45, 70], [140, 70], [150, 45], [120, 20], [80, 25], [50, 40]], g)
  land([[115, -15], [150, -15], [155, -35], [130, -40], [115, -30]], g2)
  land([[-50, 80], [-20, 82], [-15, 70], [-45, 68]], '#dfe9f2')
  land([[-180, -72], [180, -72], [180, -90], [-180, -90]], '#e8f0f7')

  ctx.fillStyle = 'rgba(255,255,255,0.14)'
  for (let i = 0; i < 36; i += 1) {
    ctx.beginPath()
    ctx.ellipse(Math.random() * w, Math.random() * h * 0.65, 20 + Math.random() * 48, 7 + Math.random() * 12, Math.random(), 0, Math.PI * 2)
    ctx.fill()
  }
  return canvas
}

/**
 * Globo rotatorio con atmósfera, órbitas y partículas.
 * Implementación propia HELIOS (Canvas 2D). No importa componentes de 21st.dev.
 */
export function PlanetGlobe({ playing, reduced }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { ref: hostRef, node: host, running } = useSceneLifecycle(playing && !reduced)
  const pointer = useRef({ x: 0.5, y: 0.5 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !host || reduced) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const map = buildWorldMap()
    let raf = 0
    let w = 0
    let h = 0
    let spinPx = 0
    let ambient = 0
    let last = performance.now()
    const orbits: OrbitDot[] = [
      { speed: 0.85, phase: 0.2, color: SPACE.accent, trail: 12, rx: 1.38, ry: 0.42, rot: -0.35 },
      { speed: 0.5, phase: 1.5, color: SPACE.turquoise, trail: 16, rx: 1.62, ry: 0.5, rot: 0.28 },
      { speed: 0.32, phase: 2.8, color: SPACE.softLilac, trail: 18, rx: 1.9, ry: 0.58, rot: -0.55 },
    ]
    const stars: Star[] = []

    const resize = () => {
      const rect = host.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, MOTION.dprCap)
      w = Math.max(1, Math.floor(rect.width))
      h = Math.max(1, Math.floor(rect.height))
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      stars.length = 0
      const count = Math.floor(100 * densityForWidth(w))
      for (let i = 0; i < count; i += 1) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.4 + Math.random() * 1.5,
          tw: Math.random() * Math.PI * 2,
          z: 0.25 + Math.random() * 0.75,
        })
      }
    }

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      const rect = host.getBoundingClientRect()
      pointer.current.x = (event.clientX - rect.left) / Math.max(rect.width, 1)
      pointer.current.y = (event.clientY - rect.top) / Math.max(rect.height, 1)
    }
    const onLeave = () => {
      pointer.current.x = 0.5
      pointer.current.y = 0.5
    }

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const dark = readThemeDark()
      const animate = playing && running
      if (animate) {
        spinPx = (spinPx + map.width * MOTION.planetSpin * dt * 0.12) % map.width
        ambient += MOTION.ambientDrift * dt
      }

      ctx.clearRect(0, 0, w, h)

      const g1 = ctx.createRadialGradient(w * 0.28, h * 0.22, 0, w * 0.28, h * 0.22, w * 0.55)
      g1.addColorStop(0, dark ? 'rgba(221,212,243,0.22)' : 'rgba(221,212,243,0.38)')
      g1.addColorStop(1, 'transparent')
      ctx.fillStyle = g1
      ctx.fillRect(0, 0, w, h)
      const g2 = ctx.createRadialGradient(w * 0.78, h * 0.72, 0, w * 0.78, h * 0.72, w * 0.48)
      g2.addColorStop(0, dark ? 'rgba(247,220,230,0.16)' : 'rgba(247,220,230,0.32)')
      g2.addColorStop(1, 'transparent')
      ctx.fillStyle = g2
      ctx.fillRect(0, 0, w, h)

      const parallaxX = (pointer.current.x - 0.5) * 20
      const parallaxY = (pointer.current.y - 0.5) * 14
      for (const star of stars) {
        if (animate) star.tw += 0.03 * star.z
        const a = 0.22 + Math.abs(Math.sin(star.tw)) * 0.55
        ctx.fillStyle = `rgba(255,255,255,${a})`
        ctx.beginPath()
        ctx.arc(star.x + parallaxX * star.z, star.y + parallaxY * star.z, star.r * star.z, 0, Math.PI * 2)
        ctx.fill()
      }

      const tiltX = (pointer.current.y - 0.5) * MOTION.tiltMax
      const tiltY = (pointer.current.x - 0.5) * MOTION.tiltMax
      const cx = w * 0.52 + tiltY * 1.2
      const cy = h * 0.48 + tiltX * 1.0
      const radius = Math.min(w, h) * 0.3

      // Atmósfera
      const atm = ctx.createRadialGradient(cx, cy, radius * 0.7, cx, cy, radius * 1.32)
      atm.addColorStop(0, 'transparent')
      atm.addColorStop(0.62, dark ? 'rgba(126,214,195,0.14)' : 'rgba(205,235,221,0.28)')
      atm.addColorStop(0.85, dark ? 'rgba(184,166,232,0.22)' : 'rgba(183,166,232,0.3)')
      atm.addColorStop(1, 'transparent')
      ctx.fillStyle = atm
      ctx.beginPath()
      ctx.arc(cx, cy, radius * 1.32, 0, Math.PI * 2)
      ctx.fill()

      // Globo: mapa enrollado + clip circular
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.clip()
      const destW = radius * 2 * Math.PI * 0.55
      const destH = radius * 2
      const sx = -spinPx
      ctx.drawImage(map, sx, 0, map.width, map.height, cx - destW / 2, cy - destH / 2, destW, destH)
      ctx.drawImage(map, sx + map.width, 0, map.width, map.height, cx - destW / 2, cy - destH / 2, destW, destH)

      const shade = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy)
      shade.addColorStop(0, 'rgba(8,12,24,0.55)')
      shade.addColorStop(0.42, 'rgba(8,12,24,0.05)')
      shade.addColorStop(0.7, 'rgba(255,255,255,0.08)')
      shade.addColorStop(1, 'rgba(8,12,24,0.45)')
      ctx.fillStyle = shade
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)

      const gloss = ctx.createRadialGradient(cx - radius * 0.35, cy - radius * 0.4, 0, cx, cy, radius)
      gloss.addColorStop(0, 'rgba(255,255,255,0.32)')
      gloss.addColorStop(0.35, 'rgba(255,255,255,0.08)')
      gloss.addColorStop(1, 'transparent')
      ctx.fillStyle = gloss
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)
      ctx.restore()

      // Borde suave
      ctx.strokeStyle = dark ? 'rgba(205,235,221,0.35)' : 'rgba(255,255,255,0.45)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.stroke()

      // Órbitas + estelas
      for (const orbit of orbits) {
        if (animate) orbit.phase += orbit.speed * dt
        const rx = radius * orbit.rx
        const ry = radius * orbit.ry
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(orbit.rot + tiltY * 0.008)
        ctx.strokeStyle = dark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.3)'
        ctx.lineWidth = 1.15
        ctx.beginPath()
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
        ctx.stroke()

        for (let k = orbit.trail; k >= 0; k -= 1) {
          const t = orbit.phase - k * 0.07
          const px = Math.cos(t) * rx
          const py = Math.sin(t) * ry
          const alpha = Math.max(0.08, 1 - k / (orbit.trail + 1))
          ctx.globalAlpha = alpha
          ctx.fillStyle = orbit.color
          ctx.beginPath()
          ctx.arc(px, py, k === 0 ? 3.6 : 2.1, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1
        ctx.restore()
      }

      // Lectura ficticia
      ctx.fillStyle = 'rgba(255,255,255,0.62)'
      ctx.font = '600 11px Outfit, Segoe UI, sans-serif'
      ctx.fillText('Telemetría simulada · escena conceptual', cx - radius * 0.7, cy + radius * 1.48)

      const pulse = 0.5 + Math.sin(ambient) * 0.5
      ctx.fillStyle = dark ? `rgba(126,214,195,${0.04 + pulse * 0.05})` : `rgba(245,0,79,${0.03 + pulse * 0.04})`
      ctx.beginPath()
      ctx.arc(cx, cy, radius * (1.5 + pulse * 0.06), 0, Math.PI * 2)
      ctx.fill()

      raf = requestAnimationFrame(draw)
    }

    resize()
    raf = requestAnimationFrame(draw)
    const ro = new ResizeObserver(resize)
    ro.observe(host)
    host.addEventListener('pointermove', onMove)
    host.addEventListener('pointerleave', onLeave)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerleave', onLeave)
    }
  }, [host, playing, reduced, running])

  return (
    <div className="planet-host" ref={hostRef}>
      {reduced ? (
        <div className="planet-static" aria-hidden="true">
          <div className="planet-static-orb" />
          <div className="planet-static-ring" />
        </div>
      ) : (
        <canvas ref={canvasRef} className="planet-canvas" aria-hidden="true" />
      )}
    </div>
  )
}
