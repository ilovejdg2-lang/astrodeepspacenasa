/** Fondo de Mi Salud y Mapa Corporal: pulso de ritmo sinusal y ondas de signos vitales en rosa carmín suave. */
export function HealthBackdrop() {
  return (
    <div className="health-symbol" aria-hidden="true">
      <svg className="health-mark" viewBox="0 0 860 680" fill="none">
        <g transform="rotate(-8 430 340)" strokeLinecap="round" strokeLinejoin="round">
          {/* Línea base y complejo ECG de ritmo cardíaco */}
          <path
            d="M 80 340 L 250 340 L 280 310 L 310 390 L 350 180 L 390 440 L 420 330 L 450 350 L 490 340 L 780 340"
            stroke="#f43f5e"
            strokeWidth="20"
            opacity="0.8"
          />

          {/* Halo de pulso vital */}
          <circle cx="350" cy="180" r="42" stroke="#fb7185" strokeWidth="12" fill="#ffe4e6" fillOpacity="0.4" />
          <circle cx="350" cy="180" r="16" fill="#e11d48" opacity="0.6" />

          {/* Anillos de expansión de latido */}
          <ellipse cx="430" cy="340" rx="280" ry="140" stroke="#fda4af" strokeWidth="8" strokeDasharray="18 14" opacity="0.5" />
          <ellipse cx="430" cy="340" rx="340" ry="180" stroke="#fecdd3" strokeWidth="6" opacity="0.4" />

          {/* Marcadores de telemetría de salud somática */}
          <circle cx="250" cy="340" r="14" fill="#fb7185" />
          <circle cx="490" cy="340" r="14" fill="#fb7185" />
        </g>
      </svg>
    </div>
  )
}
