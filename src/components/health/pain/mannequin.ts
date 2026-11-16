import { LIMB_PARTS } from '../../../domain/painMap'
import type * as THREE from 'three'

export type MannequinPalette = {
  body: number
  cloth: number
  hair: number
  joint: number
  eye: number
}

/**
 * Procedural HELIOS mannequin v1. Geometry is original project code.
 * Torso spans model Y 0.78–1.42 so painMap TORSO_BANDS land on this mesh.
 */
export function buildMannequin(THREE: typeof import('three'), palette: MannequinPalette) {
  const group = new THREE.Group()
  group.name = 'helios-mannequin'
  const geometries = new Set<THREE.BufferGeometry>()
  const materials: THREE.Material[] = []

  function mat(color: number, roughness = 0.64) {
    const material = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 })
    materials.push(material)
    return material
  }

  function add(mesh: THREE.Mesh, surfaceId: string, decorative = false) {
    geometries.add(mesh.geometry)
    mesh.userData = { surfaceId, decorative }
    if (decorative) mesh.raycast = () => undefined
    group.add(mesh)
    return mesh
  }

  const profile = [
    new THREE.Vector2(0.11, 0),
    new THREE.Vector2(0.155, 0.08),
    new THREE.Vector2(0.14, 0.2),
    new THREE.Vector2(0.125, 0.3),
    new THREE.Vector2(0.15, 0.42),
    new THREE.Vector2(0.168, 0.52),
    new THREE.Vector2(0.12, 0.6),
    new THREE.Vector2(0.07, 0.64),
  ]
  const torsoGeo = new THREE.LatheGeometry(profile, 28)
  torsoGeo.scale(1, 1, 0.78)
  torsoGeo.computeVertexNormals()
  const torso = new THREE.Mesh(torsoGeo, mat(palette.body))
  torso.position.y = 0.78
  add(torso, 'torso')

  const shorts = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 16), mat(palette.cloth, 0.78))
  shorts.scale.set(1.25, 0.55, 0.9)
  shorts.position.set(0, 0.86, 0)
  add(shorts, 'pelvis-cover')

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.115, 28, 20), mat(palette.body, 0.58))
  head.scale.set(1, 1.08, 1)
  head.position.set(0, 1.62, 0)
  add(head, 'head')

  const neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.07, 4, 12), mat(palette.body))
  neck.position.set(0, 1.47, 0)
  add(neck, 'neck')

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.118, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(palette.hair, 0.8))
  hair.position.set(0, 1.66, -0.01)
  add(hair, 'hair', true)

  const eyeGeo = new THREE.SphereGeometry(0.012, 10, 8)
  const leftEye = new THREE.Mesh(eyeGeo, mat(palette.eye, 0.4))
  leftEye.position.set(0.038, 1.64, 0.1)
  add(leftEye, 'eye', true)
  const rightEye = new THREE.Mesh(eyeGeo, mat(palette.eye, 0.4))
  rightEye.position.set(-0.038, 1.64, 0.1)
  add(rightEye, 'eye', true)
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), mat(palette.body, 0.5))
  nose.scale.set(0.8, 0.9, 1.2)
  nose.position.set(0, 1.59, 0.11)
  add(nose, 'nose', true)

  const spine = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.28, 3, 8), mat(palette.joint, 0.7))
  spine.position.set(0, 1.16, -0.1)
  add(spine, 'spine', true)

  for (const part of LIMB_PARTS) {
    const geometry = part.shape === 'sphere'
      ? new THREE.SphereGeometry(part.radius, 18, 14)
      : new THREE.CapsuleGeometry(part.radius, part.length, 4, 12)
    const mesh = new THREE.Mesh(geometry, mat(part.surfaceId.startsWith('hip') ? palette.cloth : palette.body))
    mesh.position.set(part.position.x, part.position.y, part.position.z)
    if (part.surfaceId.startsWith('foot')) mesh.rotation.x = Math.PI / 2
    add(mesh, part.surfaceId)
  }

  return {
    group,
    dispose() {
      geometries.forEach((geometry) => geometry.dispose())
      materials.forEach((material) => material.dispose())
    },
  }
}
