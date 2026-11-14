import { ArrowDown, ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { HeroStage } from '../../components/public/HeroStage'
import { Reveal } from '../../components/public/Reveal'
import { TeamPhoto } from '../../components/public/TeamPhoto'
import { DASHBOARD_PATH, HERO_MEDIA, STAGES, TEAM } from '../../content/landing'

type Ctx = { reduced: boolean }

export function HomePage() {
  const { reduced } = useOutletContext<Ctx>()

  useEffect(() => {
    document.title = 'HELIOS · Cuidado humano más allá de la Tierra'
  }, [])

  return (
    <>
      <section className="home-hero" aria-labelledby="home-title">
        <div>
          <p className="home-badge">HELIOS · Prototipo de salud espacial</p>
          <h1 id="home-title">
            <motion.span
              className="line-1"
              initial={reduced ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
            >
              El cuidado humano
            </motion.span>
            <motion.span
              className="line-2"
              initial={reduced ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18 }}
            >
              más allá de la Tierra.
            </motion.span>
          </h1>
          <motion.p
            className="home-copy"
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28 }}
          >
            HELIOS conecta preparación, salud y seguimiento para acompañar a la tripulación en cada etapa de su misión.
          </motion.p>
          <motion.div
            className="home-actions"
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.36 }}
          >
            <Link className="pub-btn" to="/proyecto">Explorar el proyecto</Link>
            <Link className="pub-btn-ghost" to={DASHBOARD_PATH}>Acceder al sistema</Link>
          </motion.div>
          <p className="pub-muted" style={{ margin: 0, fontSize: '0.86rem' }}>{HERO_MEDIA.credit}</p>
          <p className="home-scroll">
            <span className="home-scroll-dot" aria-hidden="true" />
            Continuar explorando
            <ArrowDown size={16} aria-hidden="true" />
          </p>
        </div>
        <HeroStage reduced={reduced} />
      </section>

      <Reveal as="section" className="home-section" aria-labelledby="stages-title">
        <p className="pub-kicker">Trayectoria</p>
        <h2 id="stages-title">Una misión, tres etapas</h2>
        <p className="pub-lead">Preparación, acompañamiento a bordo y continuidad después del regreso.</p>
        <div className="orbit-stages">
          {STAGES.map((stage, index) => (
            <article key={stage.id} className="orbit-stage">
              <div className="orbit-index" aria-hidden="true">{index + 1}</div>
              <h3>{stage.title}</h3>
              <p>{stage.lead}</p>
              <Link className="pub-btn-ghost" to="/como-funciona">Cómo funciona <ArrowRight size={16} aria-hidden="true" /></Link>
            </article>
          ))}
        </div>
      </Reveal>

      <Reveal as="section" className="home-section" aria-labelledby="tech-title">
        <div className="split-tech">
          <div className="split-visual" aria-hidden="true">
            <div className="split-visual-inner">
              <strong>Quirón Bot</strong>
              <span>Monitoreo con contexto · Continuidad del seguimiento</span>
            </div>
          </div>
          <div>
            <p className="pub-kicker">Tecnología</p>
            <h2 id="tech-title">Tecnología al servicio de la tripulación</h2>
            <p className="pub-lead">
              HELIOS organiza indicadores, inventario y apoyo especializado en un ciclo continuo, con consentimiento y calidad de datos visibles.
            </p>
            <Link className="pub-btn" to="/proyecto">El proyecto <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="home-section" aria-labelledby="team-home-title">
        <p className="pub-kicker">Equipo</p>
        <h2 id="team-home-title">Conocé al equipo</h2>
        <p className="pub-lead">Cinco perfiles con protagonismo propio. Las biografías completas viven en páginas individuales.</p>
        <div className="team-preview">
          {TEAM.map((member) => (
            <figure key={member.id}>
              <TeamPhoto member={member} />
            </figure>
          ))}
        </div>
        <Link className="pub-btn-ghost" to="/nosotros">Acerca de nosotros <ArrowRight size={16} aria-hidden="true" /></Link>
      </Reveal>

      <Reveal as="section" className="home-section" aria-labelledby="explore-title">
        <p className="pub-kicker">Exploración</p>
        <h2 id="explore-title">Explorá HELIOS</h2>
        <div className="explore-grid">
          <Link className="explore-card video" to="/video">
            <h3>Video</h3>
            <p>Presentación audiovisual del prototipo.</p>
          </Link>
          <Link className="explore-card docs" to="/documentos">
            <h3>Documentos</h3>
            <p>Biblioteca de materiales y referencias.</p>
          </Link>
          <Link className="explore-card data" to="/datos">
            <h3>Datos</h3>
            <p>Fuentes, simulación y límites claros.</p>
          </Link>
        </div>
      </Reveal>
    </>
  )
}
