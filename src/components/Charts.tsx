import { useEffect, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatClock } from '../domain/format'

interface Point { label: string; value: number }

function useColor(name: string): string {
  const [color, setColor] = useState('#0f6e84')
  useEffect(() => {
    const read = () => {
      const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
      if (value) setColor(value)
    }
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [name])
  return color
}

export function TrendChart({ points, unit, caption }: { points: Point[]; unit: string; caption: string }) {
  const accent = useColor('--accent')
  const muted = useColor('--muted')
  const line = useColor('--line')
  const surface = useColor('--surface')
  const ink = useColor('--ink')
  if (points.length === 0) {
    return <p className="empty">No hay una serie confiable para graficar. La ausencia no se dibuja como una línea normal.</p>
  }
  return (
    <figure>
      <div className="chart" role="img" aria-label={caption}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={line} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: muted, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: muted, fontSize: 12 }} axisLine={false} tickLine={false} width={40} unit="" />
            <Tooltip
              contentStyle={{ background: surface, border: `1px solid ${line}`, borderRadius: 12, color: ink }}
              formatter={(value) => [`${value ?? ''} ${unit}`, 'Valor']}
            />
            <Line type="monotone" dataKey="value" stroke={accent} strokeWidth={2.4} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="muted">{caption}</figcaption>
    </figure>
  )
}

export function timeLabel(at: number): string {
  return formatClock(at)
}
