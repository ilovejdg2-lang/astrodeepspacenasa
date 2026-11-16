import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type RefObject } from 'react'
import type { BufferGeometry, Material, Mesh, MeshStandardMaterial, Texture } from 'three'
import { classifyHit, type BodyHit, type Vec3 } from '../../../domain/painMap'
import { buildMannequin, type MannequinPalette } from './mannequin'

export type ShownMark = {
  id: string
  label: string
  localPosition: Vec3
  normal: Vec3
  surfaceId: string
  series?: 'a' | 'b'
}

export type BodyViewportHandle = {
  view: (name: 'front' | 'back' | 'left' | 'right' | 'reset') => void
  zoom: (direction: 1 | -1) => void
  focusMark: (position: Vec3, normal: Vec3) => void
}

type Props = {
  en: boolean
  marks: ShownMark[]
  selectedId: string | null
  placeEnabled: boolean
  onPlace?: (hit: BodyHit) => void
  onSelect?: (id: string) => void
  onUnavailable: () => void
  loadingLabel: string
}

const TARGET = { x: 0, y: 0.92, z: 0 }
const MIN_DISTANCE = 0.9
const MAX_DISTANCE = 4
type ViewDirection = 'front' | 'back' | 'left' | 'right'

function directionName(azimuth: number): ViewDirection {
  const angle = (azimuth + Math.PI * 2) % (Math.PI * 2)
  if (angle < Math.PI / 4 || angle >= Math.PI * 7 / 4) return 'front'
  if (angle < Math.PI * 3 / 4) return 'left'
  if (angle < Math.PI * 5 / 4) return 'back'
  return 'right'
}

function palette(dark: boolean): MannequinPalette & { bg: number; ground: number } {
  return dark
    ? { bg: 0x24141c, ground: 0x3a2430, body: 0xe4d0c0, cloth: 0x6d8fa3, hair: 0x3a312c, joint: 0xc4ad9c, eye: 0x2a2422 }
    : { bg: 0xfff1f6, ground: 0xf6d5e2, body: 0xe7d4c5, cloth: 0x8eabbd, hair: 0x4a403a, joint: 0xd2bba8, eye: 0x2c2624 }
}

function round(value: number) {
  return Math.round(value * 10000) / 10000
}

export const BodyViewport = forwardRef<BodyViewportHandle, Props>(function BodyViewport({
  en,
  marks,
  selectedId,
  placeEnabled,
  onPlace,
  onSelect,
  onUnavailable,
  loadingLabel,
}, ref) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [orientation, setOrientation] = useState({ direction: 'front' as ViewDirection, heading: 0, tilt: 0 })
  const initialFocusDone = useRef(false)
  const live = useRef({ marks, selectedId, placeEnabled, onPlace, onSelect })
  live.current = { marks, selectedId, placeEnabled, onPlace, onSelect }
  const unavailableRef = useRef(onUnavailable)
  unavailableRef.current = onUnavailable
  const syncRef = useRef<() => void>(() => undefined)
  const api = useRef<BodyViewportHandle>({
    view: () => undefined,
    zoom: () => undefined,
    focusMark: () => undefined,
  })
  useImperativeHandle(ref, () => api.current, [])

  useEffect(() => { syncRef.current() }, [marks, placeEnabled, selectedId])
  useEffect(() => {
    if (!loaded || initialFocusDone.current) return
    initialFocusDone.current = true
    const initialMark = marks.find((mark) => mark.id === selectedId)
    if (initialMark) api.current.focusMark(initialMark.localPosition, initialMark.normal)
  }, [loaded, marks, selectedId])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let disposed = false
    let cleanup = () => undefined
    const mount = async () => {
      try {
        const THREE = await import('three')
        const { OrbitControls } = await import('three/addons/controls/OrbitControls.js')
        if (disposed || !rootRef.current) return
        const dark = document.documentElement.dataset.theme === 'dark'
        const colors = palette(dark)
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(colors.bg)
        const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 20)
        camera.position.set(0, 0.98, 2.45)
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
        renderer.setClearColor(colors.bg, 1)
        const canvas = renderer.domElement
        canvas.className = 'pain-canvas'
        canvas.setAttribute('aria-hidden', 'true')
        root.appendChild(canvas)

        scene.add(new THREE.HemisphereLight(0xfff7f9, 0xd9c4cf, 0.9))
        const key = new THREE.DirectionalLight(0xffffff, 1.15)
        key.position.set(2.2, 3.4, 2.6)
        scene.add(key)
        const fill = new THREE.DirectionalLight(0xffe4ee, 0.35)
        fill.position.set(-2.2, 1.4, -1.6)
        scene.add(fill)

        const figure = buildMannequin(THREE, colors)
        scene.add(figure.group)
        const ground = new THREE.Mesh(
          new THREE.CircleGeometry(0.72, 40),
          new THREE.MeshStandardMaterial({ color: colors.ground, roughness: 1, metalness: 0 }),
        )
        ground.rotation.x = -Math.PI / 2
        ground.position.y = 0.001
        ground.userData = { decorative: true }
        ground.raycast = () => undefined
        scene.add(ground)
        const markerRoot = new THREE.Group()
        figure.group.add(markerRoot)
        const markerGeometry = new THREE.SphereGeometry(0.028, 16, 12)
        const held: { geometry?: BufferGeometry; material?: Material; texture?: Texture }[] = []

        const controls = new OrbitControls(camera, canvas)
        controls.target.set(TARGET.x, TARGET.y, TARGET.z)
        controls.enableDamping = false
        controls.autoRotate = false
        controls.enablePan = false
        controls.minDistance = MIN_DISTANCE
        controls.maxDistance = MAX_DISTANCE
        controls.minPolarAngle = 0.12
        controls.maxPolarAngle = Math.PI - 0.12
        controls.update()

        let transitionFrame = 0
        const stopTransition = () => {
          if (transitionFrame) cancelAnimationFrame(transitionFrame)
          transitionFrame = 0
        }
        const animateCamera = (endPosition: InstanceType<typeof THREE.Vector3>, endTarget: InstanceType<typeof THREE.Vector3>) => {
          stopTransition()
          const startPosition = camera.position.clone()
          const startTarget = controls.target.clone()
          const startOffset = startPosition.clone().sub(startTarget)
          const endOffset = endPosition.clone().sub(endTarget)
          const startRadius = Math.max(startOffset.length(), MIN_DISTANCE)
          const endRadius = THREE.MathUtils.clamp(endOffset.length(), MIN_DISTANCE, MAX_DISTANCE)
          const startTheta = Math.atan2(startOffset.x, startOffset.z)
          const endTheta = Math.atan2(endOffset.x, endOffset.z)
          const thetaDelta = Math.atan2(Math.sin(endTheta - startTheta), Math.cos(endTheta - startTheta))
          const startPhi = Math.acos(THREE.MathUtils.clamp(startOffset.y / startRadius, -1, 1))
          const endPhi = THREE.MathUtils.clamp(
            Math.acos(THREE.MathUtils.clamp(endOffset.y / endRadius, -1, 1)),
            controls.minPolarAngle,
            controls.maxPolarAngle,
          )
          const startedAt = performance.now()
          const duration = 460
          const step = (now: number) => {
            const progress = Math.min(1, (now - startedAt) / duration)
            const eased = 1 - (1 - progress) ** 3
            controls.target.copy(startTarget).lerp(endTarget, eased)
            const spherical = new THREE.Spherical(
              startRadius + (endRadius - startRadius) * eased,
              startPhi + (endPhi - startPhi) * eased,
              startTheta + thetaDelta * eased,
            )
            camera.position.setFromSpherical(spherical).add(controls.target)
            controls.update()
            render()
            if (progress < 1) transitionFrame = requestAnimationFrame(step)
            else {
              transitionFrame = 0
              controls.target.copy(endTarget)
              camera.position.copy(endPosition)
              controls.update()
              render()
            }
          }
          transitionFrame = requestAnimationFrame(step)
        }

        let onScreen = true
        const render = () => {
          if (!onScreen || document.visibilityState === 'hidden') return
          renderer.render(scene, camera)
        }
        const updateOrientation = () => {
          const azimuth = controls.getAzimuthalAngle()
          const polar = controls.getPolarAngle()
          const heading = Math.round((((azimuth + Math.PI * 2) % (Math.PI * 2)) * 180 / Math.PI) / 15) * 15 % 360
          const next = {
            direction: directionName(azimuth),
            heading,
            tilt: Math.round(((Math.PI / 2 - polar) * 180 / Math.PI) / 10) * 10,
          }
          setOrientation((current) => current.direction === next.direction && current.heading === next.heading && current.tilt === next.tilt ? current : next)
        }
        const paint = () => {
          const next = palette(document.documentElement.dataset.theme === 'dark')
          renderer.setClearColor(next.bg, 1)
          if (scene.background instanceof THREE.Color) scene.background.setHex(next.bg)
          ;(ground.material as MeshStandardMaterial).color.setHex(next.ground)
          figure.group.traverse((obj) => {
            const mesh = obj as Mesh
            if (mesh.userData.markerId || !mesh.userData.surfaceId) return
            const material = mesh.material as MeshStandardMaterial | undefined
            if (!material?.color || !material.emissive) return
            const id = String(mesh.userData.surfaceId)
            const color = id === 'hair' ? next.hair
              : id === 'eye' ? next.eye
                : id === 'spine' ? next.joint
                  : id === 'pelvis-cover' || id.startsWith('hip') ? next.cloth
                    : next.body
            material.color.setHex(color)
            const selected = live.current.marks.find((item) => item.id === live.current.selectedId)
            const hot = Boolean(selected && selected.surfaceId === id)
            material.emissive.setHex(hot ? 0xf5004f : 0x000000)
            material.emissiveIntensity = hot ? 0.22 : 0
          })
        }
        const clearMarkers = () => {
          while (markerRoot.children.length) {
            const child = markerRoot.children[0]
            if (child) markerRoot.remove(child)
          }
          held.splice(0).forEach((item) => {
            item.texture?.dispose()
            item.material?.dispose()
          })
        }
        const badge = (label: string, color: string) => {
          const board = document.createElement('canvas')
          board.width = 128
          board.height = 128
          const ctx = board.getContext('2d')
          if (!ctx) return null
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.arc(64, 64, 54, 0, Math.PI * 2)
          ctx.fill()
          ctx.lineWidth = 10
          ctx.strokeStyle = '#ffffff'
          ctx.stroke()
          ctx.fillStyle = '#ffffff'
          ctx.font = '700 58px Outfit, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(label, 64, 68)
          const texture = new THREE.CanvasTexture(board)
          texture.colorSpace = THREE.SRGBColorSpace
          const material = new THREE.SpriteMaterial({ map: texture, depthTest: true })
          held.push({ texture, material })
          const sprite = new THREE.Sprite(material)
          sprite.scale.set(0.09, 0.09, 1)
          return sprite
        }
        const sync = () => {
          clearMarkers()
          paint()
          live.current.marks.forEach((mark) => {
            const color = mark.series === 'b' ? '#0f6e75' : '#f5004f'
            const material = new THREE.MeshStandardMaterial({ color, roughness: 0.35, emissive: 0xffffff, emissiveIntensity: mark.id === live.current.selectedId ? 0.25 : 0 })
            held.push({ material })
            const dot = new THREE.Mesh(markerGeometry, material)
            const normal = mark.normal
            const length = Math.hypot(normal.x, normal.y, normal.z) || 1
            dot.position.set(
              mark.localPosition.x + (normal.x / length) * 0.03,
              mark.localPosition.y + (normal.y / length) * 0.03,
              mark.localPosition.z + (normal.z / length) * 0.03,
            )
            if (mark.id === live.current.selectedId) dot.scale.setScalar(1.35)
            dot.userData = { markerId: mark.id }
            markerRoot.add(dot)
            const sprite = badge(mark.label, color)
            if (sprite) {
              sprite.position.copy(dot.position)
              sprite.position.y += 0.07
              sprite.userData = { markerId: mark.id }
              markerRoot.add(sprite)
            }
          })
          render()
        }
        syncRef.current = sync

        const raycaster = new THREE.Raycaster()
        const pointer = new THREE.Vector2()
        const activePointers = new Set<number>()
        let down: { x: number; y: number; az: number; pol: number; dist: number; id: number } | null = null
        const placeAt = (event: PointerEvent) => {
          const rect = canvas.getBoundingClientRect()
          if (rect.width < 2 || rect.height < 2) return
          pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
          pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
          raycaster.setFromCamera(pointer, camera)
          const hits = raycaster.intersectObjects(figure.group.children, true)
            .filter((hit) => !hit.object.userData.decorative && hit.face)
          const hit = hits[0]
          if (!hit?.face) return
          const markerId = hit.object.userData.markerId
          if (typeof markerId === 'string') {
            live.current.onSelect?.(markerId)
            return
          }
          if (!live.current.placeEnabled || !hit.object.userData.surfaceId) return
          const local = figure.group.worldToLocal(hit.point.clone())
          const worldNormal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
          const localNormal = worldNormal.clone().transformDirection(new THREE.Matrix4().copy(figure.group.matrixWorld).invert())
          const point = { x: round(local.x), y: round(local.y), z: round(local.z) }
          const normal = { x: round(localNormal.x), y: round(localNormal.y), z: round(localNormal.z) }
          const surfaceId = String(hit.object.userData.surfaceId)
          const classified = classifyHit(surfaceId, point, normal)
          live.current.onPlace?.({ kind: 'point', ...classified, localPosition: point, normal, surfaceId })
        }
        const onDown = (event: PointerEvent) => {
          activePointers.add(event.pointerId)
          if (event.button !== 0 || !event.isPrimary || activePointers.size > 1) {
            down = null
            return
          }
          down = {
            x: event.clientX,
            y: event.clientY,
            az: controls.getAzimuthalAngle(),
            pol: controls.getPolarAngle(),
            dist: camera.position.distanceTo(controls.target),
            id: event.pointerId,
          }
        }
        const onUp = (event: PointerEvent) => {
          activePointers.delete(event.pointerId)
          if (!down || down.id !== event.pointerId) return
          const moved = Math.hypot(event.clientX - down.x, event.clientY - down.y)
          const spun = Math.abs(controls.getAzimuthalAngle() - down.az) > 0.02 || Math.abs(controls.getPolarAngle() - down.pol) > 0.02
          const zoomed = Math.abs(camera.position.distanceTo(controls.target) - down.dist) > 0.04
          down = null
          if (moved > 10 || spun || zoomed) return
          placeAt(event)
        }
        const onCancel = (event: PointerEvent) => {
          activePointers.delete(event.pointerId)
          if (down?.id === event.pointerId) down = null
        }
        canvas.addEventListener('pointerdown', onDown)
        canvas.addEventListener('pointerup', onUp)
        canvas.addEventListener('pointercancel', onCancel)
        canvas.addEventListener('contextmenu', (event) => event.preventDefault())
        controls.addEventListener('change', render)

        const resize = () => {
          const width = root.clientWidth
          const height = root.clientHeight
          if (width < 2 || height < 2) return
          camera.aspect = width / height
          camera.updateProjectionMatrix()
          renderer.setSize(width, height, false)
          render()
        }
        const observer = new ResizeObserver(resize)
        observer.observe(root)
        const visibility = new IntersectionObserver(([entry]) => {
          onScreen = Boolean(entry?.isIntersecting)
          if (onScreen) render()
        })
        visibility.observe(root)
        const onHide = () => { if (document.visibilityState === 'visible') render() }
        document.addEventListener('visibilitychange', onHide)
        const theme = new MutationObserver(() => { paint(); render() })
        theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

        const frame = (x: number, y: number, z: number) => {
          animateCamera(new THREE.Vector3(x, y, z), new THREE.Vector3(TARGET.x, TARGET.y, TARGET.z))
        }
        api.current.view = (name) => {
          if (name === 'back') frame(0, 0.98, -2.45)
          else if (name === 'left') frame(2.45, 0.98, 0)
          else if (name === 'right') frame(-2.45, 0.98, 0)
          else frame(0, 0.98, 2.45)
        }
        api.current.zoom = (direction) => {
          stopTransition()
          const offset = camera.position.clone().sub(controls.target)
          const next = THREE.MathUtils.clamp(offset.length() * (direction > 0 ? 0.84 : 1.18), MIN_DISTANCE, MAX_DISTANCE)
          offset.setLength(next)
          camera.position.copy(controls.target).add(offset)
          controls.update()
          render()
        }
        api.current.focusMark = (position, normal) => {
          const point = new THREE.Vector3(position.x, position.y, position.z)
          const outward = new THREE.Vector3(normal.x, normal.y, normal.z)
          if (outward.lengthSq() < 0.0001) outward.set(0, 0, 1)
          outward.normalize()
          const currentDistance = THREE.MathUtils.clamp(camera.position.distanceTo(controls.target), 1.7, MAX_DISTANCE)
          const target = point.clone()
          const destination = point.clone().addScaledVector(outward, currentDistance)
          animateCamera(destination, target)
        }
        controls.addEventListener('start', stopTransition)
        controls.addEventListener('change', updateOrientation)
        resize()
        sync()
        updateOrientation()
        if (!disposed) setLoaded(true)

        cleanup = () => {
          stopTransition()
          syncRef.current = () => undefined
          api.current.view = () => undefined
          api.current.zoom = () => undefined
          api.current.focusMark = () => undefined
          observer.disconnect()
          visibility.disconnect()
          theme.disconnect()
          document.removeEventListener('visibilitychange', onHide)
          canvas.removeEventListener('pointerdown', onDown)
          canvas.removeEventListener('pointerup', onUp)
          canvas.removeEventListener('pointercancel', onCancel)
          controls.removeEventListener('start', stopTransition)
          controls.removeEventListener('change', updateOrientation)
          controls.removeEventListener('change', render)
          controls.dispose()
          clearMarkers()
          markerGeometry.dispose()
          ground.geometry.dispose()
          ;(ground.material as Material).dispose()
          figure.dispose()
          renderer.dispose()
          renderer.forceContextLoss()
          canvas.remove()
        }
      } catch {
        if (!disposed) unavailableRef.current()
      }
    }
    void mount()
    return () => {
      disposed = true
      cleanup()
    }
  }, [])

  return (
    <div ref={rootRef} className="pain-viewer" data-testid="pain-viewer">
      {loaded ? null : <p className="pain-loading">{loadingLabel}</p>}
      {loaded ? (
        <div className="pain-orientation" data-testid="pain-orientation" aria-live="polite">
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
      ) : null}
    </div>
  )
})

export function PainCameraControls({
  en,
  viewRef,
}: {
  en: boolean
  viewRef: RefObject<BodyViewportHandle | null>
}) {
  return (
    <div className="pain-toolbar" aria-label={en ? 'Body view controls' : 'Controles de vista corporal'}>
      <button type="button" className="rd-btn ghost" onClick={() => viewRef.current?.view('reset')}>{en ? 'Reset view' : 'Restablecer vista'}</button>
      <button type="button" className="rd-btn ghost" onClick={() => viewRef.current?.view('front')}>{en ? 'Front' : 'Frente'}</button>
      <button type="button" className="rd-btn ghost" onClick={() => viewRef.current?.view('back')}>{en ? 'Back' : 'Espalda'}</button>
      <button type="button" className="rd-btn ghost" onClick={() => viewRef.current?.view('left')}>{en ? 'Left' : 'Izquierda'}</button>
      <button type="button" className="rd-btn ghost" onClick={() => viewRef.current?.view('right')}>{en ? 'Right' : 'Derecha'}</button>
      <button type="button" className="rd-btn ghost" onClick={() => viewRef.current?.zoom(1)} aria-label={en ? 'Zoom in' : 'Acercar'}>+</button>
      <button type="button" className="rd-btn ghost" onClick={() => viewRef.current?.zoom(-1)} aria-label={en ? 'Zoom out' : 'Alejar'}>−</button>
    </div>
  )
}
