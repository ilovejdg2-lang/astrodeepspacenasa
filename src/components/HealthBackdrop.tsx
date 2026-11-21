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
            strokeWidth="10"
            opacity="0.35"
          />

          {/* Halo de pulso vital */}
          <circle cx="350" cy="180" r="38" stroke="#fb7185" strokeWidth="6" fill="#ffe4e6" fillOpacity="0.25" />
          <circle cx="350" cy="180" r="12" fill="#e11d48" opacity="0.35" />

          {/* Anillos de expansión de latido */}
          <ellipse cx="430" cy="340" rx="280" ry="140" stroke="#fda4af" strokeWidth="4" strokeDasharray="18 14" opacity="0.25" />
          <ellipse cx="430" cy="340" rx="340" ry="180" stroke="#fecdd3" strokeWidth="3" opacity="0.2" />

          {/* Marcadores de telemetría de salud somática */}
          <circle cx="250" cy="340" r="8" fill="#fb7185" opacity="0.4" />
          <circle cx="490" cy="340" r="8" fill="#fb7185" opacity="0.4" />
        </g>
      </svg>
    </div>
  )
}
