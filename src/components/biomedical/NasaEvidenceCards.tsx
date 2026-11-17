import { ExternalLink, BookOpen, Building2 } from 'lucide-react'
import type { BiomedicalSystemDefinition } from '../../domain/biomedical'

export function NasaEvidenceCards({
  en,
  system,
}: {
  en: boolean
  system: BiomedicalSystemDefinition
}) {
  const items = system.evidence

  return (
    <section className="biomed-evidence-section" aria-labelledby="biomed-evidence-heading">
      <div className="biomed-evidence-head">
        <div>
          <p className="rd-kicker">
            <BookOpen size={13} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 4 }} />
            {en ? 'Scientific Literature & Guidelines' : 'Literatura científica y guías'}
          </p>
          <h3 id="biomed-evidence-heading" className="biomed-section-title">
            {en ? 'NASA & Partner Evidence' : 'Evidencia de NASA y agencias asociadas'}
          </h3>
          <p className="rd-muted">
            {en
              ? 'Reviewed research reports and operational clinical standards related to this physiological system.'
              : 'Reportes de investigación revisados y estándares clínicos operacionales relacionados con este sistema fisiológico.'}
          </p>
        </div>
      </div>

      <div className="biomed-evidence-grid">
        {items.map((item) => {
          const modelBadge =
            item.studyModel === 'human_flight'
              ? { text: en ? 'Human (Inflight)' : 'Humano (en vuelo)', class: 'model-flight' }
              : item.studyModel === 'human_bedrest'
                ? { text: en ? 'Human (Bed-Rest Analogue)' : 'Humano (reposo en cama)', class: 'model-analogue' }
                : item.studyModel === 'animal_cellular'
                  ? { text: en ? 'Animal / Cellular Payload' : 'Modelo animal / celular', class: 'model-lab' }
                  : { text: en ? 'Operational Standard' : 'Estándar operacional', class: 'model-standard' }

          return (
            <article key={item.id} className="biomed-evidence-card">
              <header className="biomed-evidence-card-head">
                <span className={`biomed-model-tag ${modelBadge.class}`}>
                  {modelBadge.text}
                </span>
                <span className="biomed-evidence-version">{item.dateOrVersion}</span>
              </header>

              <h4 className="biomed-evidence-title">{item.title}</h4>

              <div className="biomed-evidence-inst">
                <Building2 size={13} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 4 }} />
                <span>{item.institution}</span>
              </div>

              <p className="biomed-evidence-rel">
                <strong>{en ? 'Relevance:' : 'Relación:'} </strong>
                {en ? item.relevance.en : item.relevance.es}
              </p>

              <div className="biomed-evidence-limit">
                <p>
                  <strong>{en ? 'Scope limitation:' : 'Límite de alcance:'} </strong>
                  {en ? item.limitation.en : item.limitation.es}
                </p>
              </div>

              <footer className="biomed-evidence-foot">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rd-btn-xs ghost biomed-source-link"
                >
                  <ExternalLink size={13} aria-hidden="true" />
                  {en ? 'View official source' : 'Ver fuente oficial'}
                </a>
              </footer>
            </article>
          )
        })}
      </div>
    </section>
  )
}
