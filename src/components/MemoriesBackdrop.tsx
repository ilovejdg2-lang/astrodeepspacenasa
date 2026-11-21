/** Fondo de Recuerdos: horizonte orbital en atardecer, estrellas y apertura fotográfica en tonos melocotón y coral. */
export function MemoriesBackdrop() {
  return (
    <div className="memories-symbol" aria-hidden="true">
      <svg className="memories-mark" viewBox="0 0 860 680" fill="none">
        <g transform="rotate(-6 430 340)" strokeLinecap="round" strokeLinejoin="round">
          {/* Curva del horizonte planetario */}
          <path
            d="M 60 480 Q 430 320 800 480"
            stroke="#fb923c"
            strokeWidth="18"
            opacity="0.8"
          />
          <path
            d="M 120 530 Q 430 390 740 530"
            stroke="#f472b6"
            strokeWidth="10"
            opacity="0.6"
          />

          {/* Sol orbital naciente / halo */}
          <circle cx="430" cy="300" r="54" stroke="#f97316" strokeWidth="16" fill="#ffedd5" fillOpacity="0.4" />
          <circle cx="430" cy="300" r="86" stroke="#fb7185" strokeWidth="6" strokeDasharray="14 10" opacity="0.6" />

          {/* Marco de fotografía / visor de cámara */}
          <rect x="230" y="140" width="400" height="280" rx="20" stroke="#f43f5e" strokeWidth="12" opacity="0.45" />
          <circle cx="430" cy="280" r="72" stroke="#ea580c" strokeWidth="10" opacity="0.5" />
          
          {/* Estrellas y destellos de recuerdos */}
          <path d="M 280 200 L 280 224 M 268 212 L 292 212" stroke="#f59e0b" strokeWidth="8" />
          <path d="M 580 190 L 580 214 M 568 202 L 592 202" stroke="#f59e0b" strokeWidth="8" />
          <circle cx="200" cy="360" r="12" fill="#fb7185" opacity="0.5" />
          <circle cx="670" cy="340" r="16" fill="#fb923c" opacity="0.5" />
        </g>
      </svg>
    </div>
  )
}
