import { anchorFor, aspectLabel, diagramX, regionName, sideLabel, type BodyHit, type PainAspect, type PainLaterality } from '../../../domain/painMap'

type Spot = {
  regionId: string
  laterality: PainLaterality
  aspect: 'anterior' | 'posterior'
  cx: number
  cy: number
  rx: number
  ry: number
}

function spot(facing: 'anterior' | 'posterior', regionId: string, laterality: PainLaterality, cy: number, rx: number, ry: number, offset = 0): Spot {
  return { regionId, laterality, aspect: facing, cx: diagramX(facing, laterality, offset), cy, rx, ry }
}

function figure(facing: 'anterior' | 'posterior'): Spot[] {
  const torso = facing === 'anterior'
    ? ['face', 'chest', 'abdomen']
    : ['head', 'upper_back', 'lower_back']
  return [
    spot(facing, 'head', 'midline', 48, 28, 32),
    ...(facing === 'anterior' ? [spot(facing, 'face', 'midline', 54, 14, 16)] : []),
    spot(facing, 'neck', 'midline', 92, 11, 12),
    spot(facing, torso[0] === 'face' ? 'chest' : torso[1] || 'upper_back', 'midline', 138, 40, 30),
    spot(facing, facing === 'anterior' ? 'abdomen' : 'lower_back', 'midline', 196, 32, 24),
    spot(facing, 'pelvis', 'midline', 238, 34, 18),
    spot(facing, 'shoulder', 'left', 118, 16, 13, 58),
    spot(facing, 'shoulder', 'right', 118, 16, 13, 58),
    spot(facing, 'upper_arm', 'left', 162, 13, 26, 66),
    spot(facing, 'upper_arm', 'right', 162, 13, 26, 66),
    spot(facing, 'elbow', 'left', 196, 11, 11, 70),
    spot(facing, 'elbow', 'right', 196, 11, 11, 70),
    spot(facing, 'forearm', 'left', 228, 11, 22, 74),
    spot(facing, 'forearm', 'right', 228, 11, 22, 74),
    spot(facing, 'hand', 'left', 262, 11, 12, 78),
    spot(facing, 'hand', 'right', 262, 11, 12, 78),
    spot(facing, 'hip', 'left', 252, 14, 12, 28),
    spot(facing, 'hip', 'right', 252, 14, 12, 28),
    spot(facing, 'thigh', 'left', 308, 16, 34, 30),
    spot(facing, 'thigh', 'right', 308, 16, 34, 30),
    spot(facing, 'knee', 'left', 352, 12, 12, 30),
    spot(facing, 'knee', 'right', 352, 12, 12, 30),
    spot(facing, 'lower_leg', 'left', 398, 12, 30, 28),
    spot(facing, 'lower_leg', 'right', 398, 12, 30, 28),
    spot(facing, 'foot', 'left', 440, 16, 9, 34),
    spot(facing, 'foot', 'right', 440, 16, 9, 34),
  ]
}

type MarkDot = { id: string; label: string; regionId: string; laterality: PainLaterality; aspect: PainAspect; series?: 'a' | 'b' }

export function BodyMap2D({
  marks,
  selectedId,
  placeEnabled,
  onPlace,
  onSelect,
  en,
}: {
  marks: MarkDot[]
  selectedId: string | null
  placeEnabled: boolean
  onPlace?: (hit: BodyHit) => void
  onSelect?: (id: string) => void
  en: boolean
}) {
  function choose(item: Spot) {
    const anchor = anchorFor(item.regionId, item.laterality, item.aspect)
    if (!placeEnabled) {
      const found = marks.find((mark) => mark.regionId === item.regionId && mark.laterality === item.laterality && (mark.aspect === item.aspect || mark.aspect === 'unspecified'))
      if (found) onSelect?.(found.id)
      return
    }
    onPlace?.({
      kind: 'region',
      regionId: item.regionId,
      laterality: item.laterality,
      aspect: item.aspect,
      ...anchor,
    })
  }

  return (
    <div className="pain-flat" data-testid="pain-2d">
      {(['anterior', 'posterior'] as const).map((facing) => (
        <figure key={facing}>
          <figcaption>{facing === 'anterior' ? (en ? 'Front' : 'Frente') : (en ? 'Back' : 'Espalda')}</figcaption>
          <svg viewBox="0 0 220 470" role="group" aria-label={facing === 'anterior' ? (en ? 'Front body diagram' : 'Diagrama frontal') : (en ? 'Back body diagram' : 'Diagrama posterior')}>
            {figure(facing).map((item) => {
              const active = marks.some((mark) => mark.id === selectedId && mark.regionId === item.regionId && mark.laterality === item.laterality && (mark.aspect === item.aspect || mark.aspect === 'unspecified'))
              const label = `${regionName(item.regionId, en)}, ${sideLabel(item.laterality, en)}, ${aspectLabel(item.aspect, en)}`
              return (
                <ellipse
                  key={`${item.regionId}-${item.laterality}-${item.aspect}`}
                  className={active ? 'is-on' : undefined}
                  cx={item.cx}
                  cy={item.cy}
                  rx={item.rx}
                  ry={item.ry}
                  role="button"
                  tabIndex={0}
                  aria-label={label}
                  aria-pressed={active}
                  onClick={() => choose(item)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      choose(item)
                    }
                  }}
                />
              )
            })}
            {marks.map((mark) => {
              const match = figure(facing).find((item) => item.regionId === mark.regionId && item.laterality === mark.laterality && (item.aspect === mark.aspect || mark.aspect === 'unspecified' || (facing === 'anterior' && mark.aspect === 'lateral')))
              if (!match || (mark.aspect === 'posterior' && facing === 'anterior') || (mark.aspect === 'anterior' && facing === 'posterior')) return null
              return (
                <text key={mark.id} x={match.cx} y={match.cy + 4} textAnchor="middle" className={mark.series === 'b' ? 'series-b' : undefined}>
                  {mark.label}
                </text>
              )
            })}
          </svg>
        </figure>
      ))}
    </div>
  )
}
