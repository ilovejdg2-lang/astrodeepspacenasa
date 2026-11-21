/** Fondo de Mi Espacio (cabina privada de descanso): bóveda estelar, candado orbital y geometría en índigo cósmico. */
export function SpaceBackdrop() {
  return (
    <div className="space-symbol" aria-hidden="true">
      <svg className="space-mark" viewBox="0 0 860 680" fill="none">
        <g transform="rotate(-5 430 340)" strokeLinecap="round" strokeLinejoin="round">
          {/* Bóveda y escudo de privacidad orbital */}
          <path
            d="M 230 460 C 230 240 630 240 630 460"
            stroke="#6366f1"
            strokeWidth="18"
            opacity="0.8"
          />
          <path
            d="M 180 500 C 180 180 680 180 680 500"
            stroke="#818cf8"
            strokeWidth="10"
            strokeDasharray="20 14"
            opacity="0.55"
          />

          {/* Iconografía de cabina privada / santuario */}
          <rect x="370" y="300" width="120" height="100" rx="18" stroke="#4f46e5" strokeWidth="16" fill="#e0e7ff" fillOpacity="0.3" />
          <path d="M 395 300 V 260 C 395 235 465 235 465 260 V 300" stroke="#4f46e5" strokeWidth="14" />
          <circle cx="430" cy="350" r="12" fill="#4338ca" />

          {/* Constelaciones de descanso */}
          <circle cx="260" cy="240" r="10" fill="#a5b4fc" />
          <circle cx="320" cy="180" r="14" fill="#818cf8" />
          <circle cx="560" cy="190" r="12" fill="#818cf8" />
          <circle cx="620" cy="250" r="10" fill="#a5b4fc" />
          <line x1="260" y1="240" x2="320" y2="180" stroke="#c7d2fe" strokeWidth="6" opacity="0.6" />
          <line x1="560" y1="190" x2="620" y2="250" stroke="#c7d2fe" strokeWidth="6" opacity="0.6" />
        </g>
      </svg>
    </div>
  )
}
