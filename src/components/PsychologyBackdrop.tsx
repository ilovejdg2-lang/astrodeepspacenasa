/** Fondo de Psicología: ondas armónicas zen, círculos de equilibrio y bienestar cognitivo en lavanda y violeta. */
export function PsychologyBackdrop() {
  return (
    <div className="psych-symbol" aria-hidden="true">
      <svg className="psych-mark" viewBox="0 0 860 680" fill="none">
        <g transform="rotate(8 430 340)" strokeLinecap="round" strokeLinejoin="round">
          {/* Ondas armónicas de resonancia cognitiva */}
          <path
            d="M 120 340 Q 275 220 430 340 T 740 340"
            stroke="#8b5cf6"
            strokeWidth="18"
            opacity="0.8"
          />
          <path
            d="M 120 340 Q 275 460 430 340 T 740 340"
            stroke="#a855f7"
            strokeWidth="16"
            opacity="0.7"
          />

          {/* Círculos concéntricos de equilibrio y enfoque */}
          <circle cx="430" cy="340" r="110" stroke="#c084fc" strokeWidth="12" strokeDasharray="16 12" opacity="0.6" />
          <circle cx="430" cy="340" r="64" stroke="#7c3aed" strokeWidth="14" fill="#ede9fe" fillOpacity="0.35" />
          <circle cx="430" cy="340" r="24" fill="#6d28d9" opacity="0.5" />

          {/* Nodos de serenidad */}
          <circle cx="275" cy="280" r="14" fill="#a855f7" />
          <circle cx="585" cy="400" r="14" fill="#a855f7" />
          <line x1="275" y1="280" x2="430" y2="340" stroke="#ddd6fe" strokeWidth="8" strokeDasharray="8 8" />
          <line x1="430" y1="340" x2="585" y2="400" stroke="#ddd6fe" strokeWidth="8" strokeDasharray="8 8" />
        </g>
      </svg>
    </div>
  )
}
