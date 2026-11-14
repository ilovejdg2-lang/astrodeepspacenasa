import { ExternalLink } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Reveal } from '../../components/public/Reveal'
import { TeamPhoto } from '../../components/public/TeamPhoto'
import { TEAM } from '../../content/landing'

export function NosotrosPage() {
  useEffect(() => {
    document.title = 'Acerca de nosotros · HELIOS'
  }, [])

  return (
    <>
      <header className="pub-page-hero">
        <p className="pub-kicker">Acerca de nosotros</p>
        <h1>El equipo detrás de HELIOS</h1>
        <p className="pub-lead">
          Perfiles con protagonismo real: cada integrante tiene espacio propio, fotografía amplia y una página individual.
        </p>
      </header>

      <div className="team-roster">
        {TEAM.map((member, index) => (
          <Reveal
            key={member.id}
            as="article"
            className={`team-row${index % 2 === 1 ? ' reverse' : ''}`}
            delay={index * 0.05}
          >
            <figure className="team-photo">
              <TeamPhoto member={member} />
            </figure>
            <div className="team-copy">
              <p className="pub-kicker">Integrante</p>
              <h2>{member.name}</h2>
              <p className="role">{member.title}</p>
              <p>{member.summary}</p>
              <div className="team-actions">
                <Link className="pub-btn" to={`/nosotros/${member.slug}`}>
                  Conocer a {member.firstName}
                </Link>
                <a className="pub-btn-ghost" href={member.linkedin} target="_blank" rel="noreferrer">
                  LinkedIn <ExternalLink size={16} aria-hidden="true" />
                </a>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </>
  )
}
