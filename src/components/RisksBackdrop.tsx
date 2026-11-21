/** Fondo de Riesgos NASA: escudo de blindaje contra radiación, celdas hexagonales y ondas solares en ámbar dorado. */
export function RisksBackdrop() {
  return (
    <div className="risks-symbol" aria-hidden="true">
      <svg className="risks-mark" viewBox="0 0 860 680" fill="none">
        <g transform="rotate(10 430 340)" strokeLinecap="round" strokeLinejoin="round">
          {/* Matriz hexagonal de protección biológica / radiación */}
          <polygon points="430,120 520,172 520,276 430,328 340,276 340,172" stroke="#d97706" strokeWidth="18" fill="#fef3c7" fillOpacity="0.25" />
          <polygon points="530,285 620,337 620,441 530,493 440,441 440,337" stroke="#f59e0b" strokeWidth="14" fill="#fef3c7" fillOpacity="0.15" />
          <polygon points="330,285 420,337 420,441 330,493 240,441 240,337" stroke="#f59e0b" strokeWidth="14" fill="#fef3c7" fillOpacity="0.15" />

          {/* Ondas de choque / radiación cósmica */}
          <path d="M 220 180 Q 430 90 640 180" stroke="#b45309" strokeWidth="16" opacity="0.75" />
          <path d="M 180 230 Q 430 140 680 230" stroke="#f59e0b" strokeWidth="12" strokeDasharray="18 14" opacity="0.6" />

          {/* Símbolo central de advertencia y mitigación */}
          <circle cx="430" cy="224" r="32" stroke="#b45309" strokeWidth="12" fill="#fde68a" fillOpacity="0.5" />
          <circle cx="430" cy="224" r="12" fill="#b45309" />
        </g>
      </svg>
    </div>
  )
}
