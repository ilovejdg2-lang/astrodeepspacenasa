/** Fondo de Misión: trayectoria orbital elíptica, vectores de vuelo y telemetría espacial en esmeralda. */
export function MissionBackdrop() {
  return (
    <div className="mission-symbol" aria-hidden="true">
      <svg className="mission-mark" viewBox="0 0 860 680" fill="none">
        <g transform="rotate(-12 430 340)" strokeLinecap="round" strokeLinejoin="round">
          {/* Órbita elíptica mayor */}
          <ellipse cx="430" cy="340" rx="360" ry="180" stroke="#10b981" strokeWidth="18" opacity="0.75" />
          
          {/* Órbita elíptica secundaria con trazo segmentado */}
          <ellipse cx="410" cy="330" rx="260" ry="120" stroke="#34d399" strokeWidth="12" strokeDasharray="24 16" opacity="0.6" />
          
          {/* Trayectoria de eyección / inyección orbital */}
          <path d="M 120 480 Q 280 200 680 160" stroke="#059669" strokeWidth="22" opacity="0.85" />
          
          {/* Planeta / centro de masa orbital */}
          <circle cx="360" cy="340" r="58" stroke="#047857" strokeWidth="14" fill="#d1fae5" fillOpacity="0.35" />
          <circle cx="360" cy="340" r="24" fill="#10b981" opacity="0.4" />

          {/* Vehículo espacial / waypoints de inserción */}
          <polygon points="680,160 660,190 700,180" fill="#059669" />
          <circle cx="280" cy="270" r="14" fill="#34d399" />
          <circle cx="480" cy="205" r="14" fill="#34d399" />
          <circle cx="680" cy="160" r="18" stroke="#059669" strokeWidth="8" fill="#ecfdf5" />
        </g>
      </svg>
    </div>
  )
}
