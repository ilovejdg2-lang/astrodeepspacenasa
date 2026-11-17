import { useEffect, useRef, useState } from 'react'
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Layers,
  List,
  Box as CubeIcon,
  Info,
} from 'lucide-react'
import type { BiomedicalSystemId } from '../../domain/biomedical'
import { BIOMEDICAL_SYSTEMS, getSystemById } from '../../domain/biomedical'
import { buildMannequin, type MannequinPalette } from '../health/pain/mannequin'
import type { PainMapReport } from '../../domain/painMap'

type ViewMode = '3d' | '2d' | 'list'
type CameraDirection = 'front' | 'back' | 'left' | 'right' | 'reset'

function palette(dark: boolean): MannequinPalette & { bg: number; ground: number } {
  return dark
    ? { bg: 0x18101a, ground: 0x281822, body: 0xddc8b8, cloth: 0x5d7f93, hair: 0x3a312c, joint: 0xb49d8c, eye: 0x2a2422 }
    : { bg: 0xfff3f7, ground: 0xf5d9e5, body: 0xe7d4c5, cloth: 0x8eabbd, hair: 0x4a403a, joint: 0xd2bba8, eye: 0x2c2624 }
}

const SYSTEM_COLORS: Record<BiomedicalSystemId, number> = {
  cardiovascular: 0xe63946, // Vibrant crimson
  respiratory: 0x2a9d8f,    // Soft teal
  sleep: 0x7b2cbf,          // Deep purple
  musculoskeletal: 0xf77f00,// Amber/Orange
  nutrition: 0x43aa8b,      // Fresh green
  emotional: 0xf15bb5,      // Rose pink
}

export function BiomedicalBodyViewer({
  en,
  activeSystemId,
  onSelectSystem,
  painReports = [],
}: {
  en: boolean
  activeSystemId: BiomedicalSystemId
  onSelectSystem: (id: BiomedicalSystemId) => void
  painReports?: PainMapReport[]
}) {
  const [viewMode, setViewMode] = useState<ViewMode>('3d')
  const [webglError, setWebglError] = useState(false)
  const [orientation, setOrientation] = useState({
    direction: 'front' as 'front' | 'back' | 'left' | 'right',
    heading: 0,
    tilt: 0,
  })
  const rootRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<{
    setDirection: (dir: CameraDirection) => void
    zoom: (delta: number) => void
  } | null>(null)

  const activeSystem = getSystemById(activeSystemId)

  // 3D Canvas setup
  useEffect(() => {
    if (viewMode !== '3d' || webglError) return
    const container = rootRef.current
    if (!container) return

    let disposed = false
    let cleanup = () => {}

    const mount = async () => {
      try {
        const THREE = await import('three')
        const { OrbitControls } = await import('three/addons/controls/OrbitControls.js')
        if (disposed || !rootRef.current) return

        const dark = document.documentElement.dataset.theme === 'dark'
        const pal = palette(dark)

        const scene = new THREE.Scene()
        scene.background = new THREE.Color(pal.bg)

        const width = container.clientWidth || 320
        const height = container.clientHeight || 420
        const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 20)
        camera.position.set(0, 1.15, 2.8)

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        container.innerHTML = ''
        container.appendChild(renderer.domElement)

        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, dark ? 0.9 : 1.1)
        scene.add(ambient)

        const dirLight = new THREE.DirectionalLight(0xffffff, dark ? 1.0 : 1.3)
        dirLight.position.set(1.5, 3.5, 2.5)
        scene.add(dirLight)

        const fillLight = new THREE.DirectionalLight(0xd46a8e, dark ? 0.5 : 0.4)
        fillLight.position.set(-1.5, 1.2, -1.8)
        scene.add(fillLight)

        // Floor shadow disc
        const floorGeo = new THREE.CircleGeometry(0.55, 32)
        const floorMat = new THREE.MeshBasicMaterial({ color: pal.ground, transparent: true, opacity: 0.35 })
        const floor = new THREE.Mesh(floorGeo, floorMat)
        floor.rotation.x = -Math.PI / 2
        floor.position.y = 0.01
        scene.add(floor)

        // Mannequin
        const mannequin = buildMannequin(THREE, pal)
        scene.add(mannequin.group)

        // Highlight active system surfaces
        const highlightColor = SYSTEM_COLORS[activeSystemId]
        mannequin.group.traverse((child) => {
          if (child instanceof THREE.Mesh && child.userData?.surfaceId) {
            const surf = String(child.userData.surfaceId)
            const isMatch =
              (activeSystemId === 'cardiovascular' && (surf === 'torso' || surf === 'upper-arm-l')) ||
              (activeSystemId === 'respiratory' && (surf === 'torso' || surf === 'neck')) ||
              ((activeSystemId === 'sleep' || activeSystemId === 'emotional') && (surf === 'head')) ||
              (activeSystemId === 'nutrition' && (surf === 'torso' || surf === 'pelvis-cover')) ||
              (activeSystemId === 'musculoskeletal')

            if (isMatch && child.material instanceof THREE.MeshStandardMaterial) {
              child.material.emissive = new THREE.Color(highlightColor)
              child.material.emissiveIntensity = activeSystemId === 'musculoskeletal' ? 0.22 : 0.42
            }
          }
        })

        // Add pain markers if musculoskeletal
        if (activeSystemId === 'musculoskeletal') {
          painReports.forEach((report) => {
            report.marks.forEach((mark) => {
              const markerGeo = new THREE.SphereGeometry(0.024, 16, 12)
              const markerMat = new THREE.MeshStandardMaterial({
                color: 0xf5004f,
                emissive: 0xff0040,
                emissiveIntensity: 0.8,
              })
              const pin = new THREE.Mesh(markerGeo, markerMat)
              pin.position.set(mark.localPosition.x, mark.localPosition.y, mark.localPosition.z)
              scene.add(pin)
            })
          })
        }

        // OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.08
        controls.target.set(0, 0.95, 0)
        controls.minDistance = 1.0
        controls.maxDistance = 4.2
        controls.maxPolarAngle = Math.PI * 0.85
        controls.minPolarAngle = Math.PI * 0.15

        // Camera control API
        apiRef.current = {
          setDirection: (dir) => {
            const dist = 2.8
            if (dir === 'front') camera.position.set(0, 1.15, dist)
            if (dir === 'back') camera.position.set(0, 1.15, -dist)
            if (dir === 'left') camera.position.set(dist, 1.15, 0)
            if (dir === 'right') camera.position.set(-dist, 1.15, 0)
            if (dir === 'reset') camera.position.set(0, 1.15, dist)
            controls.target.set(0, 0.95, 0)
            controls.update()
          },
          zoom: (delta) => {
            const dir = camera.position.clone().sub(controls.target).normalize()
            const newPos = camera.position.clone().addScaledVector(dir, delta * 0.35)
            if (newPos.distanceTo(controls.target) >= 1.0 && newPos.distanceTo(controls.target) <= 4.2) {
              camera.position.copy(newPos)
              controls.update()
            }
          },
        }

        const updateOrientation = () => {
          const offset = camera.position.clone().sub(controls.target)
          const angle = Math.atan2(offset.x, offset.z)
          const degrees = ((angle * 180) / Math.PI + 360) % 360
          const polar = controls.getPolarAngle()
          const next = {
            direction: (degrees >= 315 || degrees < 45 ? 'front' : degrees < 135 ? 'left' : degrees < 225 ? 'back' : 'right') as 'front' | 'back' | 'left' | 'right',
            heading: Math.round(degrees),
            tilt: Math.round((((Math.PI / 2 - polar) * 180) / Math.PI) / 10) * 10,
          }
          setOrientation(next)
        }
        controls.addEventListener('change', updateOrientation)
        updateOrientation()

        // Raycasting for clicking body parts
        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2()
        let pointerDownTime = 0

        const handlePointerDown = () => {
          pointerDownTime = Date.now()
        }

        const handlePointerUp = (event: MouseEvent) => {
          // Only trigger on a quick click, not a drag orbit
          if (Date.now() - pointerDownTime > 250) return

          const rect = renderer.domElement.getBoundingClientRect()
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
          raycaster.setFromCamera(mouse, camera)

          const intersects = raycaster.intersectObjects(mannequin.group.children, true)
          const hit = intersects[0]
          if (hit && hit.object instanceof THREE.Mesh) {
            const surfaceId = hit.object.userData?.surfaceId as string | undefined
            if (surfaceId === 'head') onSelectSystem('sleep')
            else if (surfaceId === 'torso') onSelectSystem('cardiovascular')
            else if (surfaceId === 'pelvis-cover') onSelectSystem('nutrition')
            else if (surfaceId?.includes('arm') || surfaceId?.includes('leg') || surfaceId?.includes('shoulder')) {
              onSelectSystem('musculoskeletal')
            }
          }
        }

        renderer.domElement.addEventListener('mousedown', handlePointerDown)
        renderer.domElement.addEventListener('mouseup', handlePointerUp)

        // Render loop
        let reqId = 0
        const animate = () => {
          reqId = requestAnimationFrame(animate)
          controls.update()
          renderer.render(scene, camera)
        }
        animate()

        // Resize handler
        const handleResize = () => {
          if (!container) return
          const w = container.clientWidth || 320
          const h = container.clientHeight || 420
          camera.aspect = w / h
          camera.updateProjectionMatrix()
          renderer.setSize(w, h)
        }
        window.addEventListener('resize', handleResize)

        cleanup = () => {
          cancelAnimationFrame(reqId)
          window.removeEventListener('resize', handleResize)
          controls.removeEventListener('change', updateOrientation)
          renderer.domElement.removeEventListener('mousedown', handlePointerDown)
          renderer.domElement.removeEventListener('mouseup', handlePointerUp)
          mannequin.dispose()
          renderer.dispose()
          if (container && renderer.domElement.parentNode === container) {
            container.removeChild(renderer.domElement)
          }
        }
      } catch {
        setWebglError(true)
        setViewMode('2d')
      }
    }

    void mount()

    return () => {
      disposed = true
      cleanup()
    }
  }, [viewMode, webglError, activeSystemId, painReports, onSelectSystem])

  return (
    <div className="biomed-viewer-card">
      <div className="biomed-viewer-toolbar">
        <div className="biomed-mode-pills" role="tablist" aria-label={en ? 'Viewer display modes' : 'Modos del visor'}>
          <button
            type="button"
            className={`rd-btn-xs${viewMode === '3d' ? ' is-active' : ' ghost'}`}
            onClick={() => setViewMode('3d')}
            disabled={webglError}
            title={en ? 'Interactive 3D model' : 'Modelo interactivo 3D'}
          >
            <CubeIcon size={14} aria-hidden="true" />
            {en ? '3D Body' : 'Cuerpo 3D'}
          </button>
          <button
            type="button"
            className={`rd-btn-xs${viewMode === '2d' ? ' is-active' : ' ghost'}`}
            onClick={() => setViewMode('2d')}
            title={en ? 'Flat anatomical diagram' : 'Diagrama anatómico plano'}
          >
            <Layers size={14} aria-hidden="true" />
            {en ? '2D Map' : 'Mapa 2D'}
          </button>
          <button
            type="button"
            className={`rd-btn-xs${viewMode === 'list' ? ' is-active' : ' ghost'}`}
            onClick={() => setViewMode('list')}
            title={en ? 'Accessible systems list' : 'Lista accesible de sistemas'}
          >
            <List size={14} aria-hidden="true" />
            {en ? 'Systems' : 'Sistemas'}
          </button>
        </div>

        {viewMode === '3d' ? (
          <div className="biomed-cam-actions" aria-label={en ? 'Camera presets' : 'Vistas de cámara'}>
            <button
              type="button"
              className="rd-btn-icon"
              title={en ? 'Front view' : 'Vista frontal'}
              onClick={() => apiRef.current?.setDirection('front')}
            >
              {en ? 'Front' : 'Frente'}
            </button>
            <button
              type="button"
              className="rd-btn-icon"
              title={en ? 'Back view' : 'Vista posterior'}
              onClick={() => apiRef.current?.setDirection('back')}
            >
              {en ? 'Back' : 'Espalda'}
            </button>
            <button
              type="button"
              className="rd-btn-icon"
              title={en ? 'Lateral view' : 'Vista lateral'}
              onClick={() => apiRef.current?.setDirection('left')}
            >
              {en ? 'Side' : 'Lateral'}
            </button>
            <button
              type="button"
              className="rd-btn-icon icon-only"
              title={en ? 'Zoom in' : 'Acercar'}
              onClick={() => apiRef.current?.zoom(-1)}
            >
              <ZoomIn size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="rd-btn-icon icon-only"
              title={en ? 'Zoom out' : 'Alejar'}
              onClick={() => apiRef.current?.zoom(1)}
            >
              <ZoomOut size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="rd-btn-icon icon-only"
              title={en ? 'Reset orientation' : 'Restablecer'}
              onClick={() => apiRef.current?.setDirection('reset')}
            >
              <RotateCcw size={15} aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>

      {/* Main View Port */}
      <div className="biomed-viewport-area">
        {viewMode === '3d' && !webglError ? (
          <>
            <div ref={rootRef} className="biomed-three-canvas" />
            <div className="pain-orientation" aria-live="polite">
              <span className="pain-orientation-compass" aria-hidden="true">
                <span className="north">{en ? 'F' : 'F'}</span>
                <span className="east">{en ? 'L' : 'D'}</span>
                <span className="south">{en ? 'B' : 'E'}</span>
                <span className="west">{en ? 'R' : 'I'}</span>
                <i style={{ transform: `rotate(${orientation.heading}deg)` }} />
              </span>
              <span>
                {en ? `Facing ${orientation.direction}` : `Vista ${orientation.direction === 'front' ? 'frontal' : orientation.direction === 'back' ? 'posterior' : orientation.direction === 'left' ? 'izquierda' : 'derecha'}`}
                {orientation.tilt ? ` · ${en ? 'Tilt' : 'Inclinación'} ${orientation.tilt}°` : ''}
              </span>
            </div>
          </>
        ) : viewMode === '2d' || webglError ? (
          <div className="biomed-2d-canvas">
            <svg viewBox="0 0 280 440" className="biomed-svg-figure" aria-label={en ? 'Anatomical diagram' : 'Diagrama anatómico'}>
              {/* Head */}
              <ellipse
                cx="140"
                cy="44"
                rx="28"
                ry="34"
                className={`biomed-svg-part ${activeSystemId === 'sleep' || activeSystemId === 'emotional' ? 'is-active' : ''}`}
                onClick={() => onSelectSystem('sleep')}
              />
              {/* Neck */}
              <rect
                x="132"
                y="76"
                width="16"
                height="18"
                rx="4"
                className={`biomed-svg-part ${activeSystemId === 'respiratory' ? 'is-active' : ''}`}
                onClick={() => onSelectSystem('respiratory')}
              />
              {/* Chest / Torso Upper */}
              <path
                d="M 108 94 Q 140 90 172 94 L 176 160 Q 140 168 104 160 Z"
                className={`biomed-svg-part ${activeSystemId === 'cardiovascular' || activeSystemId === 'respiratory' ? 'is-active' : ''}`}
                onClick={() => onSelectSystem('cardiovascular')}
              />
              {/* Abdomen / Torso Lower */}
              <path
                d="M 106 164 Q 140 170 174 164 L 170 216 Q 140 224 110 216 Z"
                className={`biomed-svg-part ${activeSystemId === 'nutrition' ? 'is-active' : ''}`}
                onClick={() => onSelectSystem('nutrition')}
              />
              {/* Pelvis */}
              <ellipse
                cx="140"
                cy="234"
                rx="34"
                ry="20"
                className={`biomed-svg-part ${activeSystemId === 'musculoskeletal' ? 'is-active' : ''}`}
                onClick={() => onSelectSystem('musculoskeletal')}
              />
              {/* Arms */}
              <rect
                x="76"
                y="102"
                width="24"
                height="80"
                rx="10"
                className={`biomed-svg-part ${activeSystemId === 'musculoskeletal' || activeSystemId === 'cardiovascular' ? 'is-active' : ''}`}
                onClick={() => onSelectSystem('musculoskeletal')}
              />
              <rect
                x="180"
                y="102"
                width="24"
                height="80"
                rx="10"
                className={`biomed-svg-part ${activeSystemId === 'musculoskeletal' ? 'is-active' : ''}`}
                onClick={() => onSelectSystem('musculoskeletal')}
              />
              {/* Legs */}
              <rect
                x="108"
                y="250"
                width="26"
                height="160"
                rx="12"
                className={`biomed-svg-part ${activeSystemId === 'musculoskeletal' ? 'is-active' : ''}`}
                onClick={() => onSelectSystem('musculoskeletal')}
              />
              <rect
                x="146"
                y="250"
                width="26"
                height="160"
                rx="12"
                className={`biomed-svg-part ${activeSystemId === 'musculoskeletal' ? 'is-active' : ''}`}
                onClick={() => onSelectSystem('musculoskeletal')}
              />

              {/* Heart pinpoint icon */}
              {activeSystemId === 'cardiovascular' ? (
                <circle cx="150" cy="126" r="6" fill="#e63946" stroke="#fff" strokeWidth="2" />
              ) : null}

              {/* Lungs pinpoint icon */}
              {activeSystemId === 'respiratory' ? (
                <g>
                  <circle cx="128" cy="128" r="5" fill="#2a9d8f" stroke="#fff" strokeWidth="1.5" />
                  <circle cx="152" cy="128" r="5" fill="#2a9d8f" stroke="#fff" strokeWidth="1.5" />
                </g>
              ) : null}
            </svg>
          </div>
        ) : (
          <div className="biomed-list-canvas">
            <p className="rd-muted">
              {en
                ? 'Select a body system to highlight its anatomical focus and indicators:'
                : 'Seleccioná un sistema corporal para ver su enfoque anatómico e indicadores:'}
            </p>
            <ul className="biomed-systems-list">
              {BIOMEDICAL_SYSTEMS.map((system) => (
                <li key={system.id}>
                  <button
                    type="button"
                    className={`biomed-system-btn ${system.id === activeSystemId ? 'is-active' : ''}`}
                    onClick={() => onSelectSystem(system.id)}
                  >
                    <strong>{en ? system.name.en : system.name.es}</strong>
                    <span>{en ? system.tagline.en : system.tagline.es}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="biomed-viewer-caption">
        <p className="rd-muted">
          <Info size={13} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 4 }} />
          {en
            ? `Active focus: ${activeSystem.name.en} · Drag to rotate, tap parts to explore systems.`
            : `Foco activo: ${activeSystem.name.es} · Arrastrá para girar, tocá partes para explorar sistemas.`}
        </p>
      </div>
    </div>
  )
}
