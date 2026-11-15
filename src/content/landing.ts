/** Contenido editable de la página pública HELIOS. */

export const LANDING_VIDEO = {
  /** URL de YouTube/Vimeo o ruta local. Vacío = estado “próximamente”. */
  src: '',
  kind: 'none' as 'none' | 'youtube' | 'vimeo' | 'file',
  title: 'Video del proyecto HELIOS',
}

export const DASHBOARD_PATH = '/app'

export const NAV = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/proyecto', label: 'El proyecto', end: false },
  { to: '/como-funciona', label: 'Cómo funciona', end: false },
  { to: '/nosotros', label: 'Acerca de nosotros', end: false },
  { to: '/video', label: 'Video', end: false },
  { to: '/documentos', label: 'Documentos', end: false },
  { to: '/datos', label: 'Datos', end: false },
] as const

/** Video decorativo del hero (distinto del video de presentación). */
export const HERO_MEDIA = {
  kind: 'animation' as 'animation' | 'video',
  src: '',
  poster: '/brand/helios-ecg-bg.jpg',
  credit: 'Escena animada provisional · telemetría simulada',
}

export const DIFFERENTIATORS = [
  {
    title: 'Ciclo completo de la misión',
    text: 'Acompañamiento desde la preparación hasta el regreso, sin tratar cada etapa como un sistema aislado.',
  },
  {
    title: 'Preparación e inventario',
    text: 'Revisión de necesidades individuales autorizadas y de recursos propuestos, aprobados o faltantes.',
  },
  {
    title: 'Indicadores con contexto',
    text: 'Las mediciones se muestran con antigüedad, calidad e integridad, no solo como un número suelto.',
  },
  {
    title: 'Bienestar y consentimiento',
    text: 'Espacio privado para el bienestar emocional, con resumen editable antes de compartir.',
  },
  {
    title: 'Continuidad ante interrupciones',
    text: 'Funciones esenciales pueden seguir en local y sincronizar cuando el enlace vuelve a estar disponible.',
  },
  {
    title: 'Seguimiento posmisión',
    text: 'Conserva episodios, revisiones pendientes y recursos utilizados después del regreso.',
  },
] as const

export const STAGES = [
  {
    id: 'preembarque',
    title: 'Preembarque',
    lead: 'Preparar la misión con información y recursos organizados.',
    items: [
      'Registrar características de la misión.',
      'Revisar necesidades individuales autorizadas.',
      'Identificar recursos propuestos, aprobados y faltantes.',
      'Preparar revisiones para el equipo responsable.',
    ],
  },
  {
    id: 'a-bordo',
    title: 'A bordo',
    lead: 'Acompañar el seguimiento durante la misión.',
    items: [
      'Consultar indicadores y cambios.',
      'Revisar la antigüedad y calidad de las mediciones.',
      'Registrar síntomas y consultar recursos.',
      'Facilitar apoyo especializado cuando corresponda.',
    ],
  },
  {
    id: 'posmision',
    title: 'Posmisión',
    lead: 'Mantener la continuidad después del regreso.',
    items: [
      'Consultar la evolución.',
      'Conservar episodios y revisiones pendientes.',
      'Revisar recursos utilizados.',
      'Organizar el seguimiento profesional.',
    ],
  },
] as const

export const QUIRON_QUESTIONS = [
  '¿Qué debo revisar antes de abordar?',
  '¿Qué recursos siguen pendientes de aprobación?',
  '¿Qué cambió respecto a mis mediciones anteriores?',
  '¿Qué información falta comprobar?',
  '¿Qué seguimiento tengo pendiente después del regreso?',
] as const

export const QUIRON_PRINCIPLES = [
  {
    title: 'Fuentes visibles',
    text: 'La información se vincula a evidencias y contexto disponibles en el prototipo.',
  },
  {
    title: 'Datos faltantes',
    text: 'El asistente reconoce qué no está comprobado en lugar de inventar certeza.',
  },
  {
    title: 'Autorización humana',
    text: 'Los resúmenes privados requieren revisión y autorización antes de compartirse.',
  },
] as const

export interface TeamMember {
  id: string
  slug: string
  name: string
  firstName: string
  title: string
  summary: string
  bio: string
  tags: string[]
  linkedin: string
  initials: string
  photo: string
  accent: 'mint' | 'lilac' | 'rose' | 'warm'
  highlights?: string[]
}

export const TEAM: TeamMember[] = [
  {
    id: 'maria',
    slug: 'maria-del-mar-diaz-ruiz',
    name: 'María del Mar Díaz Ruiz',
    firstName: 'María del Mar',
    title: 'Estudiante de Ingeniería en Sistemas | Desarrollo Full Stack | Liderazgo y tutoría académica',
    summary: 'Liderazgo académico, desarrollo full stack e interés por tecnología con propósito en exploración espacial.',
    bio: `Estudiante de tercer año de Ingeniería en Sistemas en la Universidad Nacional de Costa Rica, Sede Regional Chorotega, con formación de diplomado en el área de programación. Su trayectoria combina excelencia académica, liderazgo y participación en proyectos internacionales.

Obtuvo el reconocimiento al mejor promedio de la carrera en 2024 y 2025 y fue reconocida como Modelo Estudiantil en 2025. Además, ha participado en proyectos internacionales destacados que han recibido premios y reconocimientos.

Cuenta con conocimientos de desarrollo frontend y backend, bases de datos y herramientas de colaboración. Trabaja con JavaScript, TypeScript, C#, C++, HTML, CSS, Node.js, .NET, React, Next.js y NestJS, además de SQL, MySQL y PostgreSQL. Utiliza Git, GitHub, Docker y autenticación mediante JWT, y cuenta con certificaciones en Scrum y desarrollo Full Stack.

Se distingue por su capacidad para liderar y organizar equipos, resolver problemas e incorporar herramientas de inteligencia artificial en sus procesos de trabajo. También se desempeña como tutora de Cálculo, Álgebra, Programación I y Fundamentos de Programación.

Su interés por NASA nace de una curiosidad por el universo y la exploración espacial que la acompaña desde niña. En HELIOS, esa motivación se conecta con su interés por desarrollar tecnología con propósito.`,
    tags: ['Full Stack', 'Liderazgo', 'Scrum', 'IA', 'Tutoría académica'],
    linkedin: 'https://www.linkedin.com/in/maria-del-mar-d%C3%ADaz-ruiz-336369410/',
    initials: 'MD',
    photo: '/brand/team/maria-del-mar.png',
    accent: 'rose',
    highlights: [
      'Mejor promedio de carrera en 2024 y 2025',
      'Modelo Estudiantil 2025',
      'Participación en proyectos internacionales',
      'Liderazgo y organización de equipos',
      'Desarrollo Full Stack',
      'Tutorías académicas',
      'Interés por NASA y el espacio desde la infancia',
    ],
  },
  {
    id: 'david',
    slug: 'david-rojas-montero',
    name: 'David Rojas Montero',
    firstName: 'David',
    title: 'Director de Arte | Estratega Visual | Diseñador Gráfico Senior',
    summary: 'Más de 15 años transformando objetivos de negocio en identidades visuales coherentes y de alto impacto.',
    bio: `Con más de 15 años de experiencia en la industria creativa, David transforma objetivos de negocio complejos en narrativas visuales de alto impacto. Su enfoque integra dirección de arte, pensamiento estratégico y ejecución técnica para desarrollar identidades que comuniquen los valores de una organización y respondan a sus desafíos de comunicación.

Se especializa en sistemas de identidad visual donde cada color, tipografía y composición cumple una función dentro del ecosistema de marca. Concibe el diseño como una herramienta estratégica para fortalecer la presencia de las organizaciones mediante propuestas coherentes, innovadoras y orientadas a resultados.`,
    tags: ['Dirección de arte', 'Identidad visual', 'Estrategia de marca', 'Diseño gráfico'],
    linkedin: 'https://www.linkedin.com/in/david-rojas-montero-50b556192/',
    initials: 'DR',
    photo: '/brand/team/david-rojas.png',
    accent: 'lilac',
  },
  {
    id: 'daniel',
    slug: 'daniel-elizondo-gutierrez',
    name: 'Daniel Emilio Elizondo Gutiérrez',
    firstName: 'Daniel',
    title: 'Desarrollador Full Stack Junior | Ingeniería de Software',
    summary: 'Bases sólidas en frontend, backend, APIs REST y arquitectura mantenible.',
    bio: `Desarrollador Full Stack Junior con bases en desarrollo frontend y backend, gestión de bases de datos y arquitectura de software. Cuenta con conocimientos de JavaScript, TypeScript, Node.js, NestJS, .NET, HTML, CSS, SQL y PostgreSQL, y experiencia en la construcción de APIs REST y aplicaciones mantenibles.

Trabaja con Git, GitHub, Docker y Scrum, y posee conocimientos fundamentales de DevOps, integración y entrega continuas, ciberseguridad y hacking ético.

Su motivación combina la resolución de problemas, el aprendizaje continuo y la creación de soluciones eficientes, seguras y confiables. Tiene especial interés en ingeniería backend, sistemas distribuidos y arquitectura de software moderna.`,
    tags: ['Full Stack', 'Backend', 'APIs REST', 'Docker', 'Arquitectura'],
    linkedin: 'https://www.linkedin.com/in/daniel-elizondo-b48072407/',
    initials: 'DE',
    photo: '/brand/team/daniel-elizondo.png',
    accent: 'mint',
  },
  {
    id: 'nohelia',
    slug: 'nohelia-blanco-baltodano',
    name: 'Nohelia Blanco Baltodano',
    firstName: 'Nohelia',
    title: 'Especialista en Servicios de Planos | Técnica en Redes | Estudiante de Ciberseguridad',
    summary: 'Organización, redes y formación continua hacia la seguridad de la información.',
    bio: `Con formación en Secretariado Ejecutivo y preparación técnica en Redes de Computadoras, Nohelia combina habilidades organizativas, conocimientos técnicos y un interés creciente por la tecnología.

Actualmente trabaja como Floorplan Services Specialist en la industria del software, donde fortalece su atención al detalle, adaptabilidad y capacidad para resolver problemas.

Impulsada por la curiosidad y el aprendizaje continuo, continúa su formación en Ciberseguridad con el objetivo de ampliar sus conocimientos en seguridad de la información y explorar nuevas oportunidades en el sector tecnológico.`,
    tags: ['Redes', 'Ciberseguridad', 'Organización', 'Atención al detalle'],
    linkedin: 'https://www.linkedin.com/in/nohelia-b-5a1a59271/',
    initials: 'NB',
    photo: '/brand/team/nohelia-blanco.jpg',
    accent: 'mint',
  },
  {
    id: 'elian',
    slug: 'elian-fajardo-gutierrez',
    name: 'Elián Camilo Fajardo Gutiérrez',
    firstName: 'Elián',
    title: 'Estudiante de Ingeniería en Sistemas | Desarrollador Full Stack en formación',
    summary: 'Aplicaciones web con React, NestJS y PostgreSQL, más tutoría académica y formación Scrum.',
    bio: `Estudiante de Ingeniería en Sistemas y desarrollador Full Stack en formación, con experiencia práctica construyendo aplicaciones web que conectan frontend, backend y bases de datos relacionales mediante APIs REST. Actualmente desarrolla una plataforma de gestión para la Parroquia San Blas de Nicoya como proyecto universitario de graduación.

Trabaja con JavaScript, TypeScript, React, Vite, Node.js, NestJS, SQL y PostgreSQL, y utiliza Git, GitHub y prácticas ágiles. Cuenta con una certificación en Scrum Fundamentals y un Diplomado en Programación de Aplicaciones Informáticas de la Universidad Nacional de Costa Rica.

Además, se desempeña como tutor de Cálculo y Álgebra y como asistente de Vida Estudiantil, apoyando la organización de actividades y la mejora de procesos administrativos. En 2026 recibió un reconocimiento universitario por su participación y excelencia académica.

Obtuvo una beca para estudiar inglés en el Centro Cultural Costarricense Norteamericano por su desempeño académico y, en 2024, alcanzó el cuarto lugar nacional entre estudiantes del programa Bridge for English en el TOEIC.

Le interesan la ingeniería de software, los datos y la ciberseguridad. Busca una oportunidad de práctica profesional en tecnologías de información o desarrollo de software.`,
    tags: ['React', 'TypeScript', 'NestJS', 'PostgreSQL', 'Tutoría académica'],
    linkedin: 'https://www.linkedin.com/in/eli%C3%A1n-fajardo-guti%C3%A9rrez-9606aa317/',
    initials: 'EF',
    photo: '/brand/team/elian-fajardo.jpg',
    accent: 'warm',
  },
]

export function teamBySlug(slug: string): TeamMember | undefined {
  return TEAM.find((member) => member.slug === slug)
}

export interface DocCard {
  id: string
  title: string
  description: string
  format: string
  language: string
  href: string | null
  status: 'available' | 'soon'
}

export const DOCUMENTS: DocCard[] = [
  {
    id: 'proposal',
    title: 'Propuesta del proyecto',
    description: 'Alcance, problema y visión de HELIOS como plataforma de acompañamiento.',
    format: 'PDF',
    language: 'Español',
    href: null,
    status: 'soon',
  },
  {
    id: 'presentation',
    title: 'Presentación',
    description: 'Material de apoyo para demos y espacios de divulgación del prototipo.',
    format: 'PDF / slides',
    language: 'Español',
    href: null,
    status: 'soon',
  },
  {
    id: 'technical',
    title: 'Documentación técnica',
    description: 'Contratos, comandos, variables y decisiones de implementación del prototipo.',
    format: 'Markdown',
    language: 'Español',
    href: null,
    status: 'soon',
  },
  {
    id: 'architecture',
    title: 'Arquitectura del sistema',
    description: 'Límites del frontend, backend NestJS, persistencia local y simulador.',
    format: 'Markdown',
    language: 'Español',
    href: null,
    status: 'soon',
  },
  {
    id: 'tests',
    title: 'Pruebas y validación del prototipo',
    description: 'Plan y evidencia de pruebas del simulador y de la experiencia de demostración.',
    format: 'Markdown',
    language: 'Español',
    href: null,
    status: 'soon',
  },
  {
    id: 'references',
    title: 'Referencias y fuentes',
    description: 'Documentos científicos y portales oficiales usados como contexto de diseño.',
    format: 'Markdown',
    language: 'Español',
    href: null,
    status: 'soon',
  },
]

export interface DataSource {
  id: string
  name: string
  institution: string
  type: string
  description: string
  useInHelios: string
  status: 'utilizado' | 'consultado' | 'propuesto'
  href: string
  versionNote: string
  terms: string
  limitations: string
}

export const DATA_SOURCES: DataSource[] = [
  {
    id: 'simulation',
    name: 'Escenarios y perfiles de simulación HELIOS',
    institution: 'Equipo Astro Deep Space',
    type: 'Datos de simulación',
    description: 'Mediciones, perfiles y semillas ficticias creadas para demostrar el prototipo.',
    useInHelios: 'Alimentan el monitor, alertas, inventarios y escenarios reproducibles del dashboard.',
    status: 'utilizado',
    href: DASHBOARD_PATH,
    versionNote: 'Prototipo local · 2026',
    terms: 'Uso interno de demostración. No son datos clínicos.',
    limitations: 'No representan astronautas reales ni telemetría en vivo.',
  },
  {
    id: 'hrr-sleep',
    name: 'Human Research Roadmap · Sleep Risk',
    institution: 'NASA Human Research Program',
    type: 'Documentación científica',
    description: 'Riesgo de pérdida de sueño, desincronización circadiana y sobrecarga de trabajo.',
    useInHelios: 'Contexto científico para fatiga, sueño y autorreportes en la biblioteca de riesgos de demostración.',
    status: 'consultado',
    href: 'https://humanresearchroadmap.nasa.gov/Risks/risk.aspx?i=100',
    versionNote: 'Consulta documentada · nov 2026',
    terms: 'Contenido público del Human Research Roadmap.',
    limitations: 'No calibra umbrales clínicos ni entrena modelos en HELIOS.',
  },
  {
    id: 'osdr',
    name: 'Open Science Data Repository (OSDR)',
    institution: 'NASA',
    type: 'Conjunto de datos / portal',
    description: 'Repositorio de estudios biológicos relacionados con el vuelo espacial.',
    useInHelios: 'Referencia y consulta de estudios de demostración; no hay ingestión masiva de datasets.',
    status: 'consultado',
    href: 'https://science.nasa.gov/biological-physical/data/osdr/',
    versionNote: 'Consulta documentada · nov 2026',
    terms: 'Portal público de NASA Science.',
    limitations: 'El MVP no descarga ni valida datasets OSDR como fuente biométrica del simulador.',
  },
  {
    id: 'hrr-library',
    name: 'Human Research Roadmap · biblioteca de riesgos',
    institution: 'NASA Human Research Program',
    type: 'Documentación científica',
    description: 'Marco previsto para ampliar la biblioteca de riesgos del prototipo.',
    useInHelios: 'Fuente propuesta para enriquecer evidencias mostradas en preparación y riesgos.',
    status: 'propuesto',
    href: 'https://humanresearchroadmap.nasa.gov/',
    versionNote: 'Integración pendiente',
    terms: 'Contenido público del HRR.',
    limitations: 'No implica respaldo oficial de NASA ni acceso a sistemas internos.',
  },
]
