/** Fondo de Biomédico: silueta bio-anatómica y sensores fisiológicos en verde agua / turquesa. */
export function BiomedicalBackdrop() {
  return (
    <div className="biomed-symbol" aria-hidden="true">
      <svg className="biomed-mark" viewBox="0 0 860 780" fill="none">
        <g transform="rotate(12 430 380)" strokeLinecap="round" strokeLinejoin="round">
          {/* Doble hélice / circuito fisiológico */}
          <path
            d="M320 80c40 50 120 70 120 120s-80 70-80 120 120 70 120 120-80 70-80 120 120 70 120 120"
            stroke="#2dd4bf"
            strokeWidth="16"
            opacity="0.85"
          />
          <path
            d="M440 80c-40 50-120 70-120 120s80 70 80 120-120 70-120 120 80 70 80 120-120 70-120 120"
            stroke="#14b8a6"
            strokeWidth="16"
            opacity="0.7"
          />
          {/* Conexiones de nodos de biomarcadores */}
          <line x1="335" y1="140" x2="425" y2="140" stroke="#5eead4" strokeWidth="10" />
          <line x1="350" y1="260" x2="410" y2="260" stroke="#5eead4" strokeWidth="10" />
          <line x1="335" y1="380" x2="425" y2="380" stroke="#5eead4" strokeWidth="10" />
          <line x1="350" y1="500" x2="410" y2="500" stroke="#5eead4" strokeWidth="10" />
          <line x1="335" y1="620" x2="425" y2="620" stroke="#5eead4" strokeWidth="10" />

          {/* Sensores circulares de telemetría corporal */}
          <circle cx="380" cy="110" r="32" stroke="#0d9488" strokeWidth="14" fill="#ccfbf1" fillOpacity="0.3" />
          <circle cx="380" cy="350" r="48" stroke="#0d9488" strokeWidth="14" fill="#ccfbf1" fillOpacity="0.25" />
          <circle cx="380" cy="590" r="36" stroke="#0d9488" strokeWidth="14" fill="#ccfbf1" fillOpacity="0.3" />
          
          {/* Anillos de pulsación */}
          <circle cx="580" cy="280" r="72" stroke="#5eead4" strokeWidth="12" strokeDasharray="16 12" />
          <circle cx="580" cy="280" r="28" fill="#14b8a6" fillOpacity="0.4" />
          <path d="M520 280h120" stroke="#0d9488" strokeWidth="12" />
        </g>
      </svg>
    </div>
  )
}
