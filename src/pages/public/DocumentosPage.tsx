import { Download, Eye } from 'lucide-react'
import { useEffect } from 'react'
import { Reveal } from '../../components/public/Reveal'
import { DOCUMENTS } from '../../content/landing'

export function DocumentosPage() {
  useEffect(() => {
    document.title = 'Documentos · HELIOS'
  }, [])

  return (
    <>
      <header className="pub-page-hero">
        <p className="pub-kicker">Documentos</p>
        <h1>Biblioteca del prototipo</h1>
        <p className="pub-lead">
          Materiales organizados por título, descripción, formato y estado. Solo se ofrecen acciones de ver o descargar cuando existe un archivo real.
        </p>
      </header>

      <div className="docs-grid">
        {DOCUMENTS.map((doc, index) => (
          <Reveal key={doc.id} as="article" className="doc-card" delay={index * 0.04}>
            <div className="doc-meta">
              <span className="pill">{doc.format}</span>
              <span className="pill lilac">{doc.language}</span>
              {doc.status === 'soon' ? <span className="pill warn">Próximamente</span> : <span className="pill rose">Disponible</span>}
            </div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{doc.title}</h2>
            <p className="pub-muted" style={{ margin: 0 }}>{doc.description}</p>
            {doc.href ? (
              <div className="team-actions">
                <a className="pub-btn-ghost" href={doc.href} target="_blank" rel="noreferrer">
                  <Eye size={16} aria-hidden="true" /> Ver
                </a>
                <a className="pub-btn-ghost" href={doc.href} download>
                  <Download size={16} aria-hidden="true" /> Descargar
                </a>
              </div>
            ) : (
              <p className="pub-muted" style={{ margin: 0, fontSize: '0.9rem' }}>Archivo pendiente de publicación.</p>
            )}
          </Reveal>
        ))}
      </div>
    </>
  )
}
