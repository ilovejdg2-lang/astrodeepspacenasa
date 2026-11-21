import { useEffect, useMemo, useRef, useState } from 'react'
import type * as THREE from 'three'
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Layers,
  List,
  Box as CubeIcon,
  Info,
  MapPin,
  Maximize2,
} from 'lucide-react'
import type { BiomedicalSystemId } from '../../domain/biomedical'
import { BIOMEDICAL_SYSTEMS, getSystemById } from '../../domain/biomedical'
import { buildMannequin, type MannequinPalette } from '../health/pain/mannequin'
import { normalizePainMark, type PainMapReport, type PainMark } from '../../domain/painMap'

type ViewMode = '3d' | '2d' | 'list'
type CameraDirection = 'front' | 'back' | 'left' | 'right' | 'reset'

function palette(dark: boolean): MannequinPalette & { bg: number; ground: number } {
  return dark
    ? { bg: 0x18101a, ground: 0x281822, body: 0xddc8b8, cloth: 0x5d7f93, hair: 0x3a312c, joint: 0xb49d8c, eye: 0x2a2422 }
    : { bg: 0xfff3f7, ground: 0xf5d9e5, body: 0xe7d4c5, cloth: 0x8eabbd, hair: 0x4a403a, joint: 0xd2bba8, eye: 0x2c2624 }
}

const SYSTEM_COLORS: Record<BiomedicalSystemId, number> = {
  cardiovascular: 0xe63946, // Crimson
  respiratory: 0x2a9d8f,    // Teal
  sleep: 0x7b2cbf,          // Purple
  musculoskeletal: 0xf77f00,// Amber/Orange
  nutrition: 0x43aa8b,      // Green
  emotional: 0xf15bb5,      // Rose pink
}

function intensityColor(intensity: number) {
  if (intensity <= 3) return 0x22c55e
  if (intensity <= 6) return 0xf59e0b
  return 0xef4444
}

function intensityHex(intensity: number) {
  if (intensity <= 3) return '#22c55e'
  if (intensity <= 6) return '#f59e0b'
  return '#ef4444'
}

function intensityClass(val: number) {
  if (val <= 3) return 'mild'
  if (val <= 6) return 'moderate'
  return 'severe'
}

function intensityLabel(val: number, en: boolean) {
  if (val <= 3) return en ? 'Mild' : 'Leve'
  if (val <= 6) return en ? 'Moderate' : 'Moderado'
  return en ? 'Severe' : 'Severo'
}

export function BiomedicalBodyViewer({
  en,
  activeSystemId,
  onSelectSystem,
  painReports = [],
  selectedMarkId = null,
  onSelectMark,
  onOpenModal,
}: {
  en: boolean
  activeSystemId: BiomedicalSystemId
  onSelectSystem: (id: BiomedicalSystemId) => void
  painReports?: PainMapReport[]
  selectedMarkId?: string | null
  onSelectMark?: (markId: string) => void
  onOpenModal?: () => void
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
    focusMark?: (mark: PainMark) => void
  } | null>(null)

  // Internal Three.js persistent references
  const threeRef = useRef<{
    THREE: typeof import('three')
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    controls: any
    mannequin: ReturnType<typeof buildMannequin>
    markerGroup: THREE.Group
    beaconRings: Array<{ mesh: THREE.Mesh; isSelected: boolean }>
    animateCameraTo: (destCam: THREE.Vector3, destTarget: THREE.Vector3, duration?: number) => void
    focusMark: (mark: PainMark) => void
  } | null>(null)

  const activeSystem = getSystemById(activeSystemId)

  // Normalize all marks to prevent invalid coordinates
  const allPainMarks = useMemo(() => {
    const list: Array<{ mark: PainMark; index: number }> = []
    painReports.forEach((report) => {
      report.marks.forEach((rawMark) => {
        const mark = normalizePainMark(rawMark)
        list.push({ mark, index: list.length })
      })
    })
    return list
  }, [painReports])

  // Track initial auto-focus on first mark
  const initialFocusDone = useRef(false)

  // 1. Mount 3D Scene and Renderer ONCE when viewMode === '3d'
  useEffect(() => {
    if (viewMode !== '3d' || webglError) {
      if (threeRef.current) {
        try {
          threeRef.current.renderer.dispose()
          threeRef.current.renderer.forceContextLoss()
          const dom = threeRef.current.renderer.domElement
          if (dom?.parentNode) dom.parentNode.removeChild(dom)
        } catch { }
        threeRef.current.mannequin.dispose()
        threeRef.current = null
        apiRef.current = null
      }
      return
    }

    const container = rootRef.current
    if (!container) return

    let disposed = false
    let reqId = 0
    let cleanup = () => { }

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
        const height = container.clientHeight || 440
        const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 20)
        camera.position.set(0, 1.15, 2.8)

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        container.innerHTML = ''
        container.appendChild(renderer.domElement)

        // WebGL Context loss listeners
        const handleContextLost = (e: Event) => {
          e.preventDefault()
          setWebglError(true)
        }
        renderer.domElement.addEventListener('webglcontextlost', handleContextLost)

        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, dark ? 0.95 : 1.15)
        scene.add(ambient)

        const dirLight = new THREE.DirectionalLight(0xffffff, dark ? 1.1 : 1.35)
        dirLight.position.set(1.5, 3.5, 2.5)
        scene.add(dirLight)

        const fillLight = new THREE.DirectionalLight(0xd46a8e, dark ? 0.55 : 0.45)
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

        // Group for pain markers
        const markerGroup = new THREE.Group()
        scene.add(markerGroup)

        const beaconRings: Array<{ mesh: THREE.Mesh; isSelected: boolean }> = []

        // OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.08
        controls.target.set(0, 0.95, 0)
        controls.minDistance = 0.8
        controls.maxDistance = 4.2
        controls.maxPolarAngle = Math.PI * 0.88
        controls.minPolarAngle = Math.PI * 0.12

        // Smooth camera transition state
        let transition: {
          startCamera: THREE.Vector3
          endCamera: THREE.Vector3
          startTarget: THREE.Vector3
          endTarget: THREE.Vector3
          startTime: number
          duration: number
        } | null = null

        const animateCameraTo = (destCam: THREE.Vector3, destTarget: THREE.Vector3, duration = 480) => {
          transition = {
            startCamera: camera.position.clone(),
            endCamera: destCam,
            startTarget: controls.target.clone(),
            endTarget: destTarget,
            startTime: performance.now(),
            duration,
          }
        }

        const focusMark = (mark: PainMark) => {
          const target = new THREE.Vector3(mark.localPosition.x, mark.localPosition.y, mark.localPosition.z)
          const normal = mark.normal || { x: 0, y: 0, z: -1 }
          const outward = new THREE.Vector3(normal.x, normal.y, normal.z)
          if (outward.lengthSq() < 0.0001) {
            outward.set(mark.localPosition.x, 0, mark.localPosition.z)
            if (outward.lengthSq() < 0.0001) outward.set(0, 0, -1)
          }
          outward.normalize()

          // Position camera at 1.85 units along outward normal, slightly elevated for full torso framing
          const destination = target.clone().addScaledVector(outward, 1.85)
          destination.y += 0.08
          animateCameraTo(destination, target, 480)
        }

        // Store three state in ref
        threeRef.current = {
          THREE,
          scene,
          camera,
          renderer,
          controls,
          mannequin,
          markerGroup,
          beaconRings,
          animateCameraTo,
          focusMark,
        }

        // Camera control API
        apiRef.current = {
          setDirection: (dir) => {
            const dist = 2.8
            let destCam = new THREE.Vector3(0, 1.15, dist)
            if (dir === 'front') destCam = new THREE.Vector3(0, 1.15, dist)
            if (dir === 'back') destCam = new THREE.Vector3(0, 1.15, -dist)
            if (dir === 'left') destCam = new THREE.Vector3(dist, 1.15, 0)
            if (dir === 'right') destCam = new THREE.Vector3(-dist, 1.15, 0)
            if (dir === 'reset') destCam = new THREE.Vector3(0, 1.15, dist)
            animateCameraTo(destCam, new THREE.Vector3(0, 0.95, 0), 380)
          },
          zoom: (delta) => {
            const dir = camera.position.clone().sub(controls.target).normalize()
            const newPos = camera.position.clone().addScaledVector(dir, delta * 0.35)
            if (newPos.distanceTo(controls.target) >= 0.8 && newPos.distanceTo(controls.target) <= 4.2) {
              camera.position.copy(newPos)
              controls.update()
            }
          },
          focusMark,
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

        // Raycasting for clicking body parts or markers
        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2()
        let pointerDownTime = 0

        const handlePointerDown = () => {
          pointerDownTime = Date.now()
        }

        const handlePointerUp = (event: MouseEvent) => {
          if (Date.now() - pointerDownTime > 250) return

          const rect = renderer.domElement.getBoundingClientRect()
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
          raycaster.setFromCamera(mouse, camera)

          // First check pain markers
          const pinIntersects = raycaster.intersectObjects(markerGroup.children, true)
          if (pinIntersects.length > 0) {
            const hitPin = pinIntersects[0]
            const markerId = hitPin?.object.userData?.markerId as string | undefined
            const mark = hitPin?.object.userData?.mark as PainMark | undefined
            if (markerId && mark) {
              onSelectMark?.(markerId)
              focusMark(mark)
              return
            }
          }

          // Then check body parts
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
        const animate = () => {
          reqId = requestAnimationFrame(animate)

          if (transition) {
            const elapsed = performance.now() - transition.startTime
            const t = Math.min(1, elapsed / transition.duration)
            const ease = 1 - Math.pow(1 - t, 3)
            camera.position.lerpVectors(transition.startCamera, transition.endCamera, ease)
            controls.target.lerpVectors(transition.startTarget, transition.endTarget, ease)
            controls.update()
            if (t >= 1) transition = null
          } else {
            controls.update()
          }

          // Pulse beacon rings
          const pulse = 1.0 + Math.sin(performance.now() * 0.0055) * 0.16
          beaconRings.forEach(({ mesh, isSelected }) => {
            mesh.scale.set(isSelected ? pulse * 1.25 : pulse, isSelected ? pulse * 1.25 : pulse, 1)
          })

          renderer.render(scene, camera)
        }
        animate()

        // Resize handler
        const handleResize = () => {
          if (!container) return
          const w = container.clientWidth || 320
          const h = container.clientHeight || 440
          camera.aspect = w / h
          camera.updateProjectionMatrix()
          renderer.setSize(w, h)
        }
        window.addEventListener('resize', handleResize)

        cleanup = () => {
          cancelAnimationFrame(reqId)
          window.removeEventListener('resize', handleResize)
          renderer.domElement.removeEventListener('webglcontextlost', handleContextLost)
          controls.removeEventListener('change', updateOrientation)
          renderer.domElement.removeEventListener('mousedown', handlePointerDown)
          renderer.domElement.removeEventListener('mouseup', handlePointerUp)
          mannequin.dispose()
          floorGeo.dispose()
          floorMat.dispose()
          renderer.dispose()
          renderer.forceContextLoss()
          if (container && renderer.domElement.parentNode === container) {
            container.removeChild(renderer.domElement)
          }
          threeRef.current = null
        }
      } catch (err) {
        console.warn('WebGL init error:', err)
        setWebglError(true)
        setViewMode('2d')
      }
    }

    void mount()

    return () => {
      disposed = true
      cleanup()
    }
  }, [viewMode, webglError, onSelectSystem, onSelectMark])

  // 2. Update mannequin emissive highlights whenever activeSystemId changes (without recreating scene)
  useEffect(() => {
    const inst = threeRef.current
    if (!inst) return
    const highlightColor = SYSTEM_COLORS[activeSystemId]
    inst.mannequin.group.traverse((child) => {
      if (child instanceof inst.THREE.Mesh && child.userData?.surfaceId) {
        const surf = String(child.userData.surfaceId)
        const isMatch =
          (activeSystemId === 'cardiovascular' && (surf === 'torso' || surf === 'upper-arm-l')) ||
          (activeSystemId === 'respiratory' && (surf === 'torso' || surf === 'neck')) ||
          ((activeSystemId === 'sleep' || activeSystemId === 'emotional') && (surf === 'head')) ||
          (activeSystemId === 'nutrition' && (surf === 'torso' || surf === 'pelvis-cover')) ||
          (activeSystemId === 'musculoskeletal')

        if (isMatch && child.material instanceof inst.THREE.MeshStandardMaterial) {
          child.material.emissive = new inst.THREE.Color(highlightColor)
          child.material.emissiveIntensity = activeSystemId === 'musculoskeletal' ? 0.18 : 0.4
        } else if (child.material instanceof inst.THREE.MeshStandardMaterial) {
          child.material.emissive = new inst.THREE.Color(0x000000)
          child.material.emissiveIntensity = 0
        }
      }
    })
  }, [activeSystemId])

  // 3. Update Markers & Badges whenever allPainMarks or selectedMarkId updates
  useEffect(() => {
    const inst = threeRef.current
    if (!inst) return

    const { THREE, markerGroup, beaconRings, focusMark } = inst

    // Clean up existing markers
    while (markerGroup.children.length > 0) {
      const child = markerGroup.children[0]
      if (!child) break
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose())
        else child.material.dispose()
      } else if (child instanceof THREE.Sprite) {
        child.material.map?.dispose()
        child.material.dispose()
      }
      markerGroup.remove(child)
    }
    beaconRings.length = 0

    if (activeSystemId === 'musculoskeletal') {
      allPainMarks.forEach(({ mark, index }) => {
        const isSelected = mark.id === selectedMarkId
        const color = intensityColor(mark.intensity)
        const hex = intensityHex(mark.intensity)

        const normal = mark.normal || { x: 0, y: 0, z: -1 }
        const normLen = Math.hypot(normal.x, normal.y, normal.z) || 1
        const nx = normal.x / normLen
        const ny = normal.y / normLen
        const nz = normal.z / normLen

        const pinPos = new THREE.Vector3(
          mark.localPosition.x + nx * 0.024,
          mark.localPosition.y + ny * 0.024,
          mark.localPosition.z + nz * 0.024,
        )

        // Sphere pin
        const sphereGeo = new THREE.SphereGeometry(isSelected ? 0.042 : 0.032, 24, 18)
        const sphereMat = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.25,
          metalness: 0.35,
          emissive: isSelected ? new THREE.Color(0xffffff) : new THREE.Color(color),
          emissiveIntensity: isSelected ? 0.65 : 0.3,
        })
        const pinMesh = new THREE.Mesh(sphereGeo, sphereMat)
        pinMesh.position.copy(pinPos)
        pinMesh.userData = { markerId: mark.id, mark }
        markerGroup.add(pinMesh)

        // Halo ring
        const ringGeo = new THREE.RingGeometry(0.046, 0.062, 32)
        const ringMat = new THREE.MeshBasicMaterial({
          color: isSelected ? 0xff0055 : color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: isSelected ? 0.95 : 0.6,
        })
        const ringMesh = new THREE.Mesh(ringGeo, ringMat)
        ringMesh.position.copy(pinPos)
        ringMesh.lookAt(pinPos.clone().add(new THREE.Vector3(nx, ny, nz)))
        ringMesh.userData = { markerId: mark.id, mark }
        markerGroup.add(ringMesh)
        beaconRings.push({ mesh: ringMesh, isSelected })

        // Badge sprite
        const canvas = document.createElement('canvas')
        canvas.width = 256
        canvas.height = 72
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.beginPath()
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(4, 4, 248, 64, 32)
          } else {
            ctx.rect(4, 4, 248, 64)
          }
          ctx.fillStyle = isSelected ? '#ec4899' : '#1e131d'
          ctx.fill()
          ctx.lineWidth = 4
          ctx.strokeStyle = isSelected ? '#ffffff' : hex
          ctx.stroke()
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          const label = `#${index + 1} · ${intensityLabel(mark.intensity, en)} (${mark.intensity}/10)`
          ctx.fillText(label, 128, 37)
        }
        const spriteTex = new THREE.CanvasTexture(canvas)
        spriteTex.colorSpace = THREE.SRGBColorSpace
        const spriteMat = new THREE.SpriteMaterial({ map: spriteTex, depthTest: false })
        const sprite = new THREE.Sprite(spriteMat)
        sprite.scale.set(isSelected ? 0.24 : 0.19, isSelected ? 0.068 : 0.054, 1)
        sprite.position.copy(pinPos)
        sprite.position.y += 0.06
        sprite.userData = { markerId: mark.id, mark }
        markerGroup.add(sprite)
      })
    }

    // Initial camera auto-focus or when selected mark changes
    if (!initialFocusDone.current && allPainMarks.length > 0) {
      initialFocusDone.current = true
      const targetMark = selectedMarkId
        ? allPainMarks.find((item) => item.mark.id === selectedMarkId)?.mark
        : allPainMarks[0]?.mark
      if (targetMark) {
        setTimeout(() => focusMark(targetMark), 80)
      }
    } else if (selectedMarkId) {
      const targetMark = allPainMarks.find((item) => item.mark.id === selectedMarkId)?.mark
      if (targetMark) {
        focusMark(targetMark)
      }
    }
  }, [allPainMarks, selectedMarkId, activeSystemId, en])

  return (
    <div className="biomed-viewer-card">
      <div className="biomed-viewer-toolbar">
        <div className="biomed-mode-pills" role="tablist" aria-label={en ? 'Viewer display modes' : 'Modos del visor'}>
          <button
            type="button"
            className={`rd-btn-xs${viewMode === '3d' ? ' is-active' : ' ghost'}`}
            onClick={() => {
              setWebglError(false)
              setViewMode('3d')
            }}
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
            {onOpenModal ? (
              <button
                type="button"
                className="rd-btn-icon icon-only"
                title={en ? 'Open full-screen 3D Body Map' : 'Abrir visor 3D en pantalla completa'}
                onClick={onOpenModal}
              >
                <Maximize2 size={15} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Main View Port */}
      <div className="biomed-viewport-area">
        {viewMode === '3d' && !webglError ? (
          <>
            <div ref={rootRef} className="biomed-three-canvas" />

            {/* 3D Mannequin Compass Pill */}
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

            {/* Quick Pain Pin Selector Strip over 3D Canvas */}
            {activeSystemId === 'musculoskeletal' && allPainMarks.length > 0 ? (
              <div className="biomed-pain-pins-bar" role="toolbar" aria-label={en ? 'Reported pain spots' : 'Puntos de dolor reportados'}>
                <span className="biomed-pins-label">
                  <MapPin size={12} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 3 }} />
                  {en ? 'Patient spots:' : 'Puntos del paciente:'}
                </span>
                {allPainMarks.map(({ mark, index }) => (
                  <button
                    key={mark.id || index}
                    type="button"
                    className={`biomed-pin-chip ${selectedMarkId === mark.id ? 'is-active' : ''}`}
                    onClick={() => {
                      onSelectMark?.(mark.id)
                      apiRef.current?.focusMark?.(mark)
                    }}
                    title={en ? `Focus #${index + 1} ${mark.regionLabel || mark.regionId}` : `Enfocar #${index + 1} ${mark.regionLabel || mark.regionId}`}
                  >
                    <span className={`biomed-pin-chip-dot ${intensityClass(mark.intensity)}`} />
                    <span>#{index + 1} {mark.regionLabel || mark.regionId}</span>
                    <span className="biomed-pin-chip-intensity">({mark.intensity}/10)</span>
                  </button>
                ))}
              </div>
            ) : null}
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

              {/* Pain markers on 2D figure */}
              {activeSystemId === 'musculoskeletal' && allPainMarks.map(({ mark, index }) => {
                const isSelected = mark.id === selectedMarkId
                let pinX = 140
                let pinY = 190
                if (mark.regionId === 'head' || mark.regionId === 'face') { pinX = 140; pinY = 44 }
                else if (mark.regionId === 'neck') { pinX = 140; pinY = 85 }
                else if (mark.regionId === 'chest' || mark.regionId === 'upper_back') { pinX = 140; pinY = 130 }
                else if (mark.regionId === 'abdomen' || mark.regionId === 'lower_back') { pinX = 140; pinY = 190 }
                else if (mark.regionId === 'pelvis') { pinX = 140; pinY = 234 }
                else if (mark.regionId === 'upper_arm' || mark.regionId === 'elbow' || mark.regionId === 'forearm' || mark.regionId === 'hand') {
                  pinX = mark.laterality === 'left' ? 192 : 88
                  pinY = mark.regionId === 'upper_arm' ? 140 : mark.regionId === 'elbow' ? 180 : mark.regionId === 'forearm' ? 210 : 250
                } else if (mark.regionId === 'thigh' || mark.regionId === 'knee' || mark.regionId === 'lower_leg' || mark.regionId === 'foot') {
                  pinX = mark.laterality === 'left' ? 160 : 120
                  pinY = mark.regionId === 'thigh' ? 280 : mark.regionId === 'knee' ? 330 : mark.regionId === 'lower_leg' ? 370 : 410
                }
                return (
                  <g
                    key={mark.id || index}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectMark?.(mark.id)
                    }}
                  >
                    <circle cx={pinX} cy={pinY} r={isSelected ? 18 : 14} fill={isSelected ? '#ec4899' : '#f5004f'} stroke="#ffffff" strokeWidth="3" />
                    <text x={pinX} y={pinY + 4} textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">
                      {index + 1}
                    </text>
                  </g>
                )
              })}
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

      <div className="biomed-viewer-caption" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <p className="rd-muted" style={{ margin: 0 }}>
          <Info size={13} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 4 }} />
          {en
            ? `Active focus: ${activeSystem.name.en} · Drag to rotate, tap body pins to inspect exact reported spots.`
            : `Foco activo: ${activeSystem.name.es} · Arrastrá para rotar, tocá los puntos corporales para inspeccionar zonas reportadas.`}
        </p>
        {onOpenModal ? (
          <button
            type="button"
            className="rd-btn-xs"
            onClick={onOpenModal}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px' }}
          >
            <Maximize2 size={12} aria-hidden="true" />
            <span>{en ? 'Open 3D Model' : 'Abrir en 3D'}</span>
          </button>
        ) : null}
      </div>
    </div>
  )
}
