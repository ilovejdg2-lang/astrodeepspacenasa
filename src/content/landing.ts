/** Contenido editable de la página pública HELIOS. */

export const LANDING_VIDEO = {
  /** URL de YouTube/Vimeo o ruta local. Vacío = estado “próximamente”. */
  src: '',
  kind: 'none' as 'none' | 'youtube' | 'vimeo' | 'file',
  title: 'Video del proyecto HELIOS',
}

export const DASHBOARD_PATH = '/entrar'

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
  credit: 'Escena ilustrativa con datos de ejemplo',
}

export const DIFFERENTIATORS = [
  {
    title: 'Acompañamiento durante la misión',
    text: 'Reúne la preparación, el seguimiento durante el viaje y las tareas pendientes al regresar.',
  },
  {
    title: 'Preparación de la misión',
    text: 'Ayuda a revisar qué hace falta y qué recursos ya están listos.',
  },
  {
    title: 'Mediciones fáciles de entender',
    text: 'Cada medición indica cuándo se tomó y si parece confiable.',
  },
  {
    title: 'Bienestar y consentimiento',
    text: 'Un espacio privado para hablar sobre cómo te sientes y decidir qué quieres compartir.',
  },
  {
    title: 'También cuando no hay conexión',
    text: 'Algunas funciones siguen disponibles sin conexión y se actualizan cuando vuelve el servicio.',
  },
  {
    title: 'Seguimiento después del regreso',
    text: 'Ayuda a recordar qué temas y revisiones quedan pendientes.',
  },
] as const

export const STAGES = [
  {
    id: 'preembarque',
    title: 'Antes del viaje',
    lead: 'Organizar la información y los recursos que harán falta.',
    items: [
      'Anotar los detalles del viaje.',
      'Revisar las necesidades de cada persona.',
      'Ver qué recursos están listos y cuáles faltan.',
      'Dejar los temas importantes para que el equipo los revise.',
    ],
  },
  {
    id: 'a-bordo',
    title: 'A bordo',
    lead: 'Acompañar el seguimiento durante la misión.',
    items: [
      'Revisar las mediciones y sus cambios.',
      'Ver cuándo se tomaron y si parecen confiables.',
      'Anotar síntomas y consultar información útil.',
      'Pedir ayuda especializada cuando haga falta.',
    ],
  },
  {
    id: 'posmision',
    title: 'Después del regreso',
    lead: 'Dar seguimiento a lo que queda pendiente.',
    items: [
      'Revisar cómo han cambiado las cosas.',
      'Retomar temas y revisiones pendientes.',
      'Recordar qué recursos se utilizaron.',
      'Organizar la atención que haga falta.',
    ],
  },
] as const

export const QUIRON_QUESTIONS = [
  '¿Qué debo preparar antes del viaje?',
  '¿Qué recursos todavía hacen falta?',
  '¿Qué ha cambiado desde mis mediciones anteriores?',
  '¿Qué información debería revisar?',
  '¿Qué temas tengo pendientes después del regreso?',
] as const

export const QUIRON_PRINCIPLES = [
  {
    title: 'Información con fuentes',
    text: 'Puedes consultar de dónde viene la información que muestra HELIOS.',
  },
  {
    title: 'Cuando falta información',
    text: 'El asistente te avisa si no tiene datos suficientes para responder.',
  },
  {
    title: 'Tú decides qué compartir',
    text: 'Puedes revisar la información antes de compartirla con alguien más.',
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
    title: 'Estudiante de Ingeniería en Sistemas | Liderazgo y tutoría',
    summary: 'Le gusta crear aplicaciones, enseñar y trabajar en equipo.',
    bio: `María cursa el tercer año de Ingeniería en Sistemas en la Universidad Nacional de Costa Rica, Sede Regional Chorotega, y tiene un diplomado en programación. Ha recibido el reconocimiento al mejor promedio de la carrera en 2024 y 2025, y fue nombrada Modelo Estudiantil en 2025. También ha participado en proyectos internacionales.

Le gusta crear aplicaciones, organizar equipos y ayudar a otras personas a aprender. También es tutora de Cálculo, Álgebra y cursos de programación.

Desde niña le interesan el universo y la exploración espacial. En HELIOS, une esa pasión con su deseo de crear tecnología útil.`,
    tags: ['Aplicaciones', 'Liderazgo', 'Tutoría', 'Exploración espacial'],
    linkedin: 'https://www.linkedin.com/in/maria-del-mar-d%C3%ADaz-ruiz-336369410/',
    initials: 'MD',
    photo: '/brand/team/maria-del-mar.png',
    accent: 'rose',
    highlights: [
      'Mejor promedio de carrera en 2024 y 2025',
      'Modelo Estudiantil 2025',
      'Participación en proyectos internacionales',
      'Liderazgo y organización de equipos',
      'Desarrollo de aplicaciones',
      'Tutorías académicas',
      'Interés por NASA y el espacio desde la infancia',
    ],
  },
  {
    id: 'david',
    slug: 'david-rojas-montero',
    name: 'David Rojas Montero',
    firstName: 'David',
    title: 'Diseño gráfico y dirección de arte',
    summary: 'Más de 15 años creando imágenes y marcas claras y coherentes.',
    bio: `David tiene más de 15 años de experiencia en diseño. Ayuda a convertir ideas complejas en imágenes y mensajes fáciles de entender.

Se especializa en crear la imagen de marcas y organizaciones, cuidando que los colores, las letras y las imágenes funcionen bien en conjunto.`,
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
    title: 'Desarrollador de software',
    summary: 'Crea aplicaciones y busca que sean seguras y fáciles de usar.',
    bio: `Daniel es desarrollador de software y tiene experiencia creando aplicaciones y organizando la información que utilizan. Le interesa que las herramientas sean seguras, confiables y fáciles de actualizar.

Disfruta resolver problemas y aprender cosas nuevas. También tiene interés en la seguridad digital.`,
    tags: ['Desarrollo de aplicaciones', 'Seguridad digital', 'Resolución de problemas'],
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
    title: 'Especialista en organización de planos | Estudiante de ciberseguridad',
    summary: 'Combina organización y atención al detalle con interés por la seguridad digital.',
    bio: `Nohelia tiene formación en Secretariado Ejecutivo y redes de computadoras. Actualmente trabaja en la organización de planos para una empresa de software, donde fortalece su atención al detalle y su capacidad para resolver problemas.

También estudia ciberseguridad y busca aprender más sobre cómo proteger la información.`,
    tags: ['Organización', 'Atención al detalle', 'Seguridad digital'],
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
    title: 'Estudiante de Ingeniería en Sistemas | Desarrollador de aplicaciones',
    summary: 'Crea aplicaciones web, ofrece tutorías y apoya actividades estudiantiles.',
    bio: `Elián estudia Ingeniería en Sistemas y crea aplicaciones web. Como proyecto de graduación, desarrolla una plataforma para ayudar a organizar la Parroquia San Blas de Nicoya.

También es tutor de Cálculo y Álgebra y apoya la organización de actividades estudiantiles. En 2026 recibió un reconocimiento universitario por su participación y desempeño académico.

Por su desempeño académico, recibió una beca para estudiar inglés y en 2024 obtuvo el cuarto lugar nacional entre estudiantes del programa Bridge for English en el TOEIC.

Le interesan la tecnología, los datos y la seguridad digital.`,
    tags: ['Aplicaciones web', 'Tutoría', 'Actividades estudiantiles', 'Seguridad digital'],
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
    description: 'Material para conocer el proyecto y ver cómo funciona la demostración.',
    format: 'PDF',
    language: 'Español',
    href: '/docs/presentacion-helios.pdf',
    status: 'available',
  },
  {
    id: 'costs',
    title: 'Costos',
    description: 'Cotización y desglose de costos del proyecto HELIOS.',
    format: 'DOCX',
    language: 'Español',
    href: '/docs/cotizacion.docx',
    status: 'available',
  },
  {
    id: 'technical',
    title: 'Documentación técnica',
    description: 'Detalles para quienes quieran saber cómo se construyó HELIOS.',
    format: 'Markdown',
    language: 'Español',
    href: null,
    status: 'soon',
  },
  {
    id: 'architecture',
    title: 'Arquitectura del sistema',
    description: 'Explica cómo se organizan las distintas partes de la aplicación.',
    format: 'Markdown',
    language: 'Español',
    href: null,
    status: 'soon',
  },
  {
    id: 'tests',
    title: 'Pruebas del proyecto',
    description: 'Qué se probó y cómo funciona la demostración.',
    format: 'Markdown',
    language: 'Español',
    href: null,
    status: 'soon',
  },
  {
    id: 'references',
    title: 'Referencias y fuentes',
    description: 'Documentos científicos y portales oficiales usados como contexto de diseño.',
    format: 'DOCX',
    language: 'Español',
    href: '/docs/fuentes-dashboard.docx',
    status: 'available',
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
  citation: string
}

export const DATA_SOURCES: DataSource[] = [
  {
    id: 'hrp-hazards',
    name: 'NASA · Riesgos del vuelo espacial',
    institution: 'NASA Human Research Program',
    type: 'Investigación e información',
    description: 'Los cinco peligros del vuelo espacial humano: radiación, aislamiento, distancia, gravedad y ambiente cerrado.',
    useInHelios: 'Ayuda a explicar los riesgos del espacio que aparecen en HELIOS.',
    status: 'consultado',
    href: 'https://www.nasa.gov/hrp/hazards/',
    versionNote: 'Consultado · 15 nov 2026',
    terms: 'Página pública de NASA.',
    limitations: 'Marco educativo. No es dosis personal ni diagnóstico.',
    citation: 'National Aeronautics and Space Administration. (s. f.). Hazards. https://www.nasa.gov/hrp/hazards/',
  },
  {
    id: 'hrp-risks',
    name: 'NASA · Riesgos para la salud en el espacio',
    institution: 'NASA Human Research Program',
    type: 'Investigación e información',
    description: 'Riesgos de investigación humana asociados a esos peligros, incluido el bienestar conductual.',
    useInHelios: 'Ayuda a explicar los riesgos para la salud durante los viajes espaciales.',
    status: 'consultado',
    href: 'https://www.nasa.gov/hrp/risks/',
    versionNote: 'Consultado · 15 nov 2026',
    terms: 'Página pública de NASA.',
    limitations: 'Es una referencia general, no una evaluación médica personal.',
    citation: 'National Aeronautics and Space Administration. (s. f.). Risks. https://www.nasa.gov/hrp/risks/',
  },
  {
    id: 'hrr-evidence',
    name: 'NASA · Estudios sobre salud en el espacio',
    institution: 'NASA Human Research Program',
    type: 'Investigación e información',
    description: 'Evidencia asociada a riesgos de salud humana en el espacio.',
    useInHelios: 'Sirve como referencia para la información sobre riesgos de salud.',
    status: 'consultado',
    href: 'https://humanresearchroadmap.nasa.gov/Evidence/',
    versionNote: 'Consultado · 15 nov 2026',
    terms: 'Contenido público del Human Research Roadmap.',
    limitations: 'Explica riesgos; no diagnostica a un tripulante.',
    citation: 'National Aeronautics and Space Administration. (s. f.). Evidence. Human Research Roadmap. https://humanresearchroadmap.nasa.gov/Evidence/',
  },
  {
    id: 'hrr-sleep',
    name: 'NASA · Sueño durante viajes espaciales',
    institution: 'NASA Human Research Program',
    type: 'Investigación e información',
    description: 'Cómo pueden afectar el sueño los horarios y las exigencias de un viaje espacial.',
    useInHelios: 'Ayuda a explicar por qué el descanso es importante durante una misión.',
    status: 'consultado',
    href: 'https://humanresearchroadmap.nasa.gov/Risks/risk.aspx?i=100',
    versionNote: 'Consultado · 15 nov 2026',
    terms: 'Contenido público del Human Research Roadmap.',
    limitations: 'Es información de referencia, no una evaluación médica personal.',
    citation: 'National Aeronautics and Space Administration. (s. f.). Sleep risk. Human Research Roadmap. https://humanresearchroadmap.nasa.gov/Risks/risk.aspx?i=100',
  },
  {
    id: 'med-ops',
    name: 'NASA · Atención médica durante misiones',
    institution: 'NASA',
    type: 'Atención médica',
    description: 'Referencia de operaciones médicas para tripulaciones.',
    useInHelios: 'Aporta información sobre la atención médica de las tripulaciones.',
    status: 'consultado',
    href: 'https://www.nasa.gov/reference/6-0-medical-operations/',
    versionNote: 'Consultado · 15 nov 2026',
    terms: 'Página pública de NASA.',
    limitations: 'Es una referencia general y no sustituye la atención de profesionales de salud.',
    citation: 'National Aeronautics and Space Administration. (s. f.). 6.0 Medical operations. https://www.nasa.gov/reference/6-0-medical-operations/',
  },
  {
    id: 'ochmo',
    name: 'NASA · Guías de salud espacial',
    institution: 'NASA OCHMO',
    type: 'Guías e información',
    description: 'Resúmenes técnicos de salud y atención médica espacial.',
    useInHelios: 'Ofrece más información sobre salud y atención médica en el espacio.',
    status: 'consultado',
    href: 'https://www.nasa.gov/ochmo/hsa-standards/ochmo-technical-briefs/',
    versionNote: 'Consultado · 15 nov 2026',
    terms: 'Catálogo público de NASA OCHMO.',
    limitations: 'Para más detalle, consulta cada documento del catálogo.',
    citation: 'National Aeronautics and Space Administration. (s. f.). OCHMO technical briefs. https://www.nasa.gov/ochmo/hsa-standards/ochmo-technical-briefs/',
  },
  {
    id: 'osdr',
    name: 'NASA · Estudios sobre biología espacial (OSDR)',
    institution: 'NASA',
    type: 'Estudios públicos',
    description: 'Portal de datos biológicos y físicos del vuelo espacial, incluido OSDR.',
    useInHelios: 'Permite consultar estudios sobre seres vivos y el espacio.',
    status: 'consultado',
    href: 'https://science.nasa.gov/biological-physical/data/',
    versionNote: 'Consultado · 15 nov 2026',
    terms: 'Portal público de NASA Science.',
    limitations: 'Algunos estudios no tratan sobre personas o salud. No son mediciones de la tripulación de HELIOS.',
    citation: 'National Aeronautics and Space Administration. (s. f.). Biological & physical sciences data. https://science.nasa.gov/biological-physical/data/',
  },
  {
    id: 'osdr-api',
    name: 'NASA · Estudios de salud y vuelos espaciales (OSDR)',
    institution: 'NASA',
    type: 'Datos públicos de NASA',
    description: 'Sitio de NASA con estudios sobre salud y vuelos espaciales.',
    useInHelios: 'Muestra algunos estudios de ejemplo relacionados con los viajes espaciales.',
    status: 'utilizado',
    href: 'https://visualization.osdr.nasa.gov/biodata/api/',
    versionNote: 'Consultado · 15 nov 2026',
    terms: 'Información pública de NASA.',
    limitations: 'Un estudio de ejemplo no es el expediente de un astronauta.',
    citation: 'National Aeronautics and Space Administration. (s. f.). OSDR BioData API. https://visualization.osdr.nasa.gov/biodata/api/',
  },
  {
    id: 'donki',
    name: 'NASA · Actividad solar (DONKI)',
    institution: 'NASA CCMC',
    type: 'Datos públicos de NASA',
    description: 'Información sobre actividad solar y otros eventos del clima espacial.',
    useInHelios: 'Ayuda a entender las condiciones del espacio durante una misión.',
    status: 'utilizado',
    href: 'https://ccmc.gsfc.nasa.gov/tools/DONKI/',
    versionNote: 'Consultado · 15 nov 2026',
    terms: 'Datos públicos de NASA CCMC.',
    limitations: 'Muestra actividad solar, no la radiación que recibe una persona.',
    citation: 'NASA Community Coordinated Modeling Center. (s. f.). Space Weather Database of Notifications, Knowledge, Information (DONKI). https://ccmc.gsfc.nasa.gov/tools/DONKI/',
  },
  {
    id: 'radlab',
    name: 'NASA · Estudios sobre radiación (RadLab)',
    institution: 'NASA',
    type: 'Datos públicos de NASA',
    description: 'Mediciones de estudios sobre radiación en el espacio.',
    useInHelios: 'Aporta información general sobre la radiación espacial.',
    status: 'utilizado',
    href: 'https://visualization.osdr.nasa.gov/radlab/gui/data-api/',
    versionNote: 'Consultado · 15 nov 2026',
    terms: 'Información pública de NASA.',
    limitations: 'No muestra la dosis de radiación de una persona en esta demostración.',
    citation: 'National Aeronautics and Space Administration. (s. f.). RadLab data API. https://visualization.osdr.nasa.gov/radlab/gui/data-api/',
  },
  {
    id: 'ntrs-eva',
    name: 'NASA · Esfuerzo durante caminatas espaciales',
    institution: 'NASA NTRS',
    type: 'Informe de NASA',
    description: 'Información sobre el esfuerzo físico durante las caminatas espaciales.',
    useInHelios: 'Ayuda a explicar el esfuerzo físico durante las caminatas espaciales.',
    status: 'consultado',
    href: 'https://ntrs.nasa.gov/citations/20220009964',
    versionNote: 'Consultado · 15 nov 2026',
    terms: 'Informe público en NTRS.',
    limitations: 'Es información de referencia, no datos en vivo de un traje espacial.',
    citation: 'National Aeronautics and Space Administration. (s. f.). NTRS 20220009964. https://ntrs.nasa.gov/citations/20220009964',
  },
  {
    id: 'csa-radiation',
    name: 'Radiación y el cuerpo humano en el espacio',
    institution: 'Agencia Espacial Canadiense',
    type: 'Recurso de la Agencia Espacial Canadiense',
    description: 'Tipos de radiación espacial, sus efectos y formas de reducir la exposición.',
    useInHelios: 'Explica los tipos de radiación espacial y cómo afectan al cuerpo.',
    status: 'consultado',
    href: 'https://www.asc-csa.gc.ca/eng/astronauts/space-medicine/radiation.asp',
    versionNote: 'Consultado · 15 nov 2026',
    terms: 'Contenido educativo público de la CSA. No se copian imágenes.',
    limitations: 'Los límites de la fuente no representan la dosis de una persona en esta demostración.',
    citation: 'Canadian Space Agency. (s. f.). How radiation affects the human body in space. https://www.asc-csa.gc.ca/eng/astronauts/space-medicine/radiation.asp',
  },
  {
    id: 'csa-sciences',
    name: 'Investigación en ciencias espaciales',
    institution: 'Agencia Espacial Canadiense',
    type: 'Recurso de la Agencia Espacial Canadiense',
    description: 'Portal de investigación científica de la CSA.',
    useInHelios: 'Ofrece información sobre la investigación científica en el espacio.',
    status: 'consultado',
    href: 'https://www.asc-csa.gc.ca/eng/sciences/',
    versionNote: 'Consultado · 15 nov 2026',
    terms: 'Portal público de la CSA.',
    limitations: 'Es una referencia; HELIOS no utiliza directamente esos datos.',
    citation: 'Canadian Space Agency. (s. f.). Space science research. https://www.asc-csa.gc.ca/eng/sciences/',
  },
]
