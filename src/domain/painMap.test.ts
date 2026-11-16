import { describe, expect, it } from 'vitest'
import { anchorFor, aspectFromNormal, classifyHit, diagramX, sideFromX } from './painMap'

describe('pain map coordinates', () => {
  it('treats +X as the person’s left, independent of the screen', () => {
    expect(sideFromX(0.2)).toBe('left')
    expect(sideFromX(-0.2)).toBe('right')
    expect(sideFromX(0.01)).toBe('midline')
    const front = classifyHit('torso', { x: 0.08, y: 1.25, z: 0.1 }, { x: 0, y: 0, z: 1 })
    expect(front).toMatchObject({ regionId: 'chest', laterality: 'left', aspect: 'anterior' })
    const back = classifyHit('torso', { x: -0.08, y: 1.25, z: -0.1 }, { x: 0, y: 0, z: -1 })
    expect(back).toMatchObject({ regionId: 'upper_back', laterality: 'right', aspect: 'posterior' })
  })

  it('keeps a limb side even when the surface normal points inward', () => {
    expect(classifyHit('upper-arm-l', { x: 0.32, y: 1.16, z: 0 }, { x: -1, y: 0, z: 0 }).laterality).toBe('left')
    expect(classifyHit('knee-r', { x: -0.11, y: 0.46, z: 0 }, { x: 0, y: 0, z: 1 })).toMatchObject({
      regionId: 'knee',
      laterality: 'right',
      aspect: 'anterior',
    })
  })

  it('anchors a region in model space, not in pixels', () => {
    const spot = anchorFor('chest', 'midline', 'anterior')
    expect(spot.localPosition.z).toBeGreaterThan(0)
    expect(spot.surfaceId).toBe('torso')
    expect(anchorFor('upper_back', 'midline', 'posterior').localPosition.z).toBeLessThan(0)
    expect(anchorFor('hand', 'left', 'anterior').localPosition.x).toBeGreaterThan(0)
    expect(anchorFor('hand', 'right', 'anterior').localPosition.x).toBeLessThan(0)
    expect(aspectFromNormal({ x: 0, y: 1, z: 0 })).toBe('unspecified')
    expect(diagramX('anterior', 'left', 40)).toBeGreaterThan(110)
    expect(diagramX('posterior', 'left', 40)).toBeLessThan(110)
  })
})
