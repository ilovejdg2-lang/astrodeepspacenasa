import { ArrowDown, ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { HeroStage } from '../../components/public/HeroStage'
import { MagneticButton } from '../../components/public/MagneticButton'
import { Reveal } from '../../components/public/Reveal'
import { TeamPhoto } from '../../components/public/TeamPhoto'
import { DASHBOARD_PATH, HERO_MEDIA } from '../../content/landing'
import { publicStages, publicTeam } from '../../content/publicCopy'
import { useLocale } from '../../i18n'

type Ctx = { reduced: boolean }

export function HomePage() {
  const { reduced } = useOutletContext<Ctx>()
  const { lang } = useLocale()
  const en = lang === 'en'
  const stages = publicStages(lang)
  const team = publicTeam(lang)

  useEffect(() => {
    document.title = en ? 'HELIOS · Human care beyond Earth' : 'HELIOS · Cuidado humano más allá de la Tierra'
  }, [en])

  return (
    <>
      <section className="home-hero" aria-labelledby="home-title">
        <div>
          <p className="home-badge">{en ? 'HELIOS · Space-health prototype' : 'HELIOS · Prototipo de salud espacial'}</p>
          <h1 id="home-title">
            <motion.span
              className="line-1"
              initial={reduced ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
            >
              {en ? 'Human care' : 'El cuidado humano'}
            </motion.span>
            <motion.span
              className="line-2"
              initial={reduced ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18 }}
            >
              {en ? 'beyond Earth.' : 'más allá de la Tierra.'}
            </motion.span>
          </h1>
          <motion.p
            className="home-copy"
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28 }}
          >
            {en ? 'HELIOS connects preparation, health, and follow-up to support the crew at every stage of the mission.' : 'HELIOS conecta preparación, salud y seguimiento para acompañar a la tripulación en cada etapa de su misión.'}
          </motion.p>
          <motion.div
            className="home-actions"
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.36 }}
          >
            <MagneticButton className="pub-btn" to="/proyecto" reduced={reduced}>
              {en ? 'Explore the project' : 'Explorar el proyecto'}
            </MagneticButton>
            <MagneticButton className="pub-btn-ghost" to={DASHBOARD_PATH} reduced={reduced}>
              {en ? 'Enter the system' : 'Acceder al sistema'}
            </MagneticButton>
          </motion.div>
          <p className="pub-muted" style={{ margin: 0, fontSize: '0.86rem' }}>{en ? 'Provisional animated scene · simulated telemetry' : HERO_MEDIA.credit}</p>
          <p className="home-scroll">
            <span className="home-scroll-dot" aria-hidden="true" />
            {en ? 'Keep exploring' : 'Continuar explorando'}
            <ArrowDown size={16} aria-hidden="true" />
          </p>
        </div>
        <HeroStage reduced={reduced} />
      </section>

      <Reveal as="section" className="home-section" aria-labelledby="stages-title">
        <p className="pub-kicker">{en ? 'Path' : 'Trayectoria'}</p>
        <h2 id="stages-title">{en ? 'One mission, three stages' : 'Una misión, tres etapas'}</h2>
        <p className="pub-lead">{en ? 'Preparation, support on board, and continuity after return.' : 'Preparación, acompañamiento a bordo y continuidad después del regreso.'}</p>
        <div className="orbit-stages">
          {stages.map((stage, index) => (
            <article key={stage.id} className="orbit-stage">
              <div className="orbit-index" aria-hidden="true">{index + 1}</div>
              <h3>{stage.title}</h3>
              <p>{stage.lead}</p>
              <Link className="pub-btn-ghost" to="/como-funciona">{en ? 'How it works' : 'Cómo funciona'} <ArrowRight size={16} aria-hidden="true" /></Link>
            </article>
          ))}
        </div>
      </Reveal>

      <Reveal as="section" className="home-section" aria-labelledby="tech-title">
        <div className="split-tech">
          <div className="split-visual" aria-hidden="true">
            <div className="split-visual-inner">
              <strong>Quirón Bot</strong>
              <span>{en ? 'Monitoring with context · Follow-up that continues' : 'Monitoreo con contexto · Continuidad del seguimiento'}</span>
            </div>
          </div>
          <div>
            <p className="pub-kicker">{en ? 'Technology' : 'Tecnología'}</p>
            <h2 id="tech-title">{en ? 'Technology in service of the crew' : 'Tecnología al servicio de la tripulación'}</h2>
            <p className="pub-lead">
              {en ? 'HELIOS organizes indicators, inventory, and specialized support in a continuous cycle, with consent and data quality in view.' : 'HELIOS organiza indicadores, inventario y apoyo especializado en un ciclo continuo, con consentimiento y calidad de datos visibles.'}
            </p>
            <Link className="pub-btn" to="/proyecto">{en ? 'The project' : 'El proyecto'} <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="home-section" aria-labelledby="team-home-title">
        <p className="pub-kicker">{en ? 'Team' : 'Equipo'}</p>
        <h2 id="team-home-title">{en ? 'Meet the team' : 'Conocé al equipo'}</h2>
        <p className="pub-lead">{en ? 'Five profiles, each with their own place. Full biographies live on individual pages.' : 'Cinco perfiles con protagonismo propio. Las biografías completas viven en páginas individuales.'}</p>
        <div className="team-preview">
          {team.map((member) => (
            <figure key={member.id}>
              <TeamPhoto member={member} />
            </figure>
          ))}
        </div>
        <Link className="pub-btn-ghost" to="/nosotros">{en ? 'About us' : 'Acerca de nosotros'} <ArrowRight size={16} aria-hidden="true" /></Link>
      </Reveal>

      <Reveal as="section" className="home-section" aria-labelledby="explore-title">
        <p className="pub-kicker">{en ? 'Explore' : 'Exploración'}</p>
        <h2 id="explore-title">{en ? 'Explore HELIOS' : 'Explorá HELIOS'}</h2>
        <div className="explore-grid">
          <Link className="explore-card video" to="/video">
            <h3>Video</h3>
            <p>{en ? 'Audiovisual presentation of the prototype.' : 'Presentación audiovisual del prototipo.'}</p>
          </Link>
          <Link className="explore-card docs" to="/documentos">
            <h3>{en ? 'Documents' : 'Documentos'}</h3>
            <p>{en ? 'Library of materials and references.' : 'Biblioteca de materiales y referencias.'}</p>
          </Link>
          <Link className="explore-card data" to="/datos">
            <h3>{en ? 'Data' : 'Datos'}</h3>
            <p>{en ? 'Sources, simulation, and clear limits.' : 'Fuentes, simulación y límites claros.'}</p>
          </Link>
        </div>
      </Reveal>
    </>
  )
}
