import type { Lang } from '../locale'
import {
  DATA_SOURCES,
  DIFFERENTIATORS,
  DOCUMENTS,
  QUIRON_PRINCIPLES,
  QUIRON_QUESTIONS,
  STAGES,
  TEAM,
  type DataSource,
  type DocCard,
  type TeamMember,
} from './landing'

const NAV_EN = ['Home', 'The project', 'How it works', 'About us', 'Video', 'Documents', 'Data'] as const

const STAGES_EN = [
  {
    title: 'Before the trip',
    lead: 'Organize the information and resources the crew will need.',
    items: [
      'Add the trip details.',
      'Review each person’s needs.',
      'See which resources are ready and what is missing.',
      'Leave important items for the team to review.',
    ],
  },
  {
    title: 'In Flight',
    lead: 'Keep track of how everyone is doing during the trip.',
    items: [
      'Review measurements and changes.',
      'See when measurements were taken and whether they seem reliable.',
      'Record symptoms and find helpful information.',
      'Ask for specialized help when needed.',
    ],
  },
  {
    title: 'After the trip',
    lead: 'Follow up on anything that still needs attention.',
    items: [
      'Review how things have changed.',
      'Return to open topics and reviews.',
      'Remember which resources were used.',
      'Arrange any care that is needed.',
    ],
  },
] as const

const DIFFERENTIATORS_EN = [
  { title: 'Support throughout the mission', text: 'Brings together preparation, check-ins during the trip, and follow-up after returning.' },
  { title: 'Getting ready', text: 'Helps check what the crew needs and which supplies are ready or still missing.' },
  { title: 'Measurements made clearer', text: 'Each measurement shows when it was taken and whether it seems reliable.' },
  { title: 'Wellbeing and choice', text: 'A private place to talk about how you feel and choose what to share.' },
  { title: 'When there is no connection', text: 'Some features remain available offline and update when service returns.' },
  { title: 'Follow-up after returning', text: 'Helps keep track of topics and check-ins that still need attention.' },
] as const

const QUESTIONS_EN = [
  'What should I prepare before the trip?',
  'What supplies are still missing?',
  'What has changed since my last measurements?',
  'What information should I review?',
  'What should I follow up on after returning?',
] as const

const PRINCIPLES_EN = [
  { title: 'Information you can check', text: 'You can see where HELIOS gets its information.' },
  { title: 'When information is missing', text: 'The assistant lets you know when it does not have enough information to answer.' },
  { title: 'You choose what to share', text: 'You can review information before sharing it with someone else.' },
] as const

const CAPABILITIES_EN = [
  { title: 'Quirón assistant', text: 'Ask questions and see the sources behind its answers. It will tell you when it does not have enough information.' },
  { title: 'Clearer measurements', text: 'Example measurements show when they were taken and whether they seem reliable.' },
  { title: 'Mission supplies', text: 'See what the crew needs and which supplies are ready or still missing.' },
  { title: 'Extra support', text: 'Makes it easier to ask for help when something needs a closer look.' },
  { title: 'Privacy and choice', text: 'A private place to talk about wellbeing and review a summary before sharing it.' },
  { title: 'When there is no connection', text: 'Some features stay available offline and update when service returns.' },
] as const

const DOCS_EN: Record<string, { title: string; description: string; language: string }> = {
  proposal: { title: 'Project proposal', description: 'Scope, problem, and vision of HELIOS as a support platform.', language: 'Spanish' },
  presentation: { title: 'Presentation', description: 'Support material for demos and talks about the prototype.', language: 'Spanish' },
  costs: { title: 'Costs', description: 'Quote and cost breakdown for the HELIOS project.', language: 'Spanish' },
  technical: { title: 'Technical documentation', description: 'Details for anyone who wants to know how HELIOS was built.', language: 'Spanish' },
  architecture: { title: 'How the app is organized', description: 'An overview of how the different parts of the app fit together.', language: 'Spanish' },
  tests: { title: 'Project tests', description: 'What was tested and how the demonstration works.', language: 'Spanish' },
  references: { title: 'References and sources', description: 'Scientific documents and official portals used as design context.', language: 'Spanish' },
}

const SOURCES_EN: Record<string, Pick<DataSource, 'name' | 'type' | 'description' | 'useInHelios' | 'versionNote' | 'terms' | 'limitations'>> = {
  'hrp-hazards': {
    name: 'NASA · Spaceflight risks',
    type: 'Research and information',
    description: 'The five hazards of human spaceflight: radiation, isolation, distance, gravity, and closed environment.',
    useInHelios: 'Helps explain the spaceflight risks shown in HELIOS.',
    versionNote: 'Consulted · 15 Nov 2026',
    terms: 'Public NASA page.',
    limitations: 'Educational frame. Not personal dose or a diagnosis.',
  },
  'hrp-risks': {
    name: 'NASA · Space health risks',
    type: 'Research and information',
    description: 'Human research risks tied to those hazards, including behavioral health.',
    useInHelios: 'Helps explain health risks during spaceflight.',
    versionNote: 'Consulted · 15 Nov 2026',
    terms: 'Public NASA page.',
    limitations: 'General information, not a personal medical assessment.',
  },
  'hrr-evidence': {
    name: 'NASA · Space health research',
    type: 'Research and information',
    description: 'Evidence linked to human health risks in space.',
    useInHelios: 'A reference for information about health risks.',
    versionNote: 'Consulted · 15 Nov 2026',
    terms: 'Public Human Research Roadmap content.',
    limitations: 'Explains risks; it does not diagnose a crew member.',
  },
  'hrr-sleep': {
    name: 'NASA · Sleep during spaceflight',
    type: 'Research and information',
    description: 'Risk of sleep loss, circadian desynchrony, and work overload.',
    useInHelios: 'Helps explain why sleep matters during a mission.',
    versionNote: 'Consulted · 15 Nov 2026',
    terms: 'Public Human Research Roadmap content.',
    limitations: 'It is general information, not a personal medical assessment.',
  },
  'med-ops': {
    name: 'NASA · Medical care during missions',
    type: 'Medical care',
    description: 'Reference for crew medical operations.',
    useInHelios: 'Provides information about medical care for crews.',
    versionNote: 'Consulted · 15 Nov 2026',
    terms: 'Public NASA page.',
    limitations: 'General information; it does not replace care from health professionals.',
  },
  ochmo: {
    name: 'NASA · Space health guides',
    type: 'Guides and information',
    description: 'Technical briefs on space health and medical care.',
    useInHelios: 'Offers more information about health and medical care in space.',
    versionNote: 'Consulted · 15 Nov 2026',
    terms: 'Public NASA OCHMO catalog.',
    limitations: 'For details, open the individual documents in the catalog.',
  },
  osdr: {
    name: 'NASA · Space biology studies (OSDR)',
    type: 'Public studies',
    description: 'Portal for spaceflight biological and physical data, including OSDR.',
    useInHelios: 'Lets you explore studies about living things and spaceflight.',
    versionNote: 'Consulted · 15 Nov 2026',
    terms: 'Public NASA Science portal.',
    limitations: 'Some studies are not about people or health. They are not measurements from the HELIOS crew.',
  },
  'osdr-api': {
    name: 'NASA · Health and spaceflight studies (OSDR)',
    type: 'Public NASA data',
    description: 'NASA website with studies about health and spaceflight.',
    useInHelios: 'Shows a few example studies related to spaceflight.',
    versionNote: 'Consulted · 15 Nov 2026',
    terms: 'Public NASA information.',
    limitations: 'An example study is not a real astronaut’s medical record.',
  },
  donki: {
    name: 'NASA · Solar activity (DONKI)',
    type: 'Public NASA data',
    description: 'Information about solar activity and other space-weather events.',
    useInHelios: 'Helps explain space conditions during a mission.',
    versionNote: 'Consulted · 15 Nov 2026',
    terms: 'Public NASA CCMC data.',
    limitations: 'Shows solar activity, not how much radiation a person receives.',
  },
  radlab: {
    name: 'NASA · Radiation studies (RadLab)',
    type: 'Public NASA data',
    description: 'Measurements from studies about radiation in space.',
    useInHelios: 'Provides general information about space radiation.',
    versionNote: 'Consulted · 15 Nov 2026',
    terms: 'Public NASA information.',
    limitations: 'Does not show a person’s radiation dose in this demonstration.',
  },
  'ntrs-eva': {
    name: 'NASA · Physical effort during spacewalks',
    type: 'NASA report',
    description: 'Information about the physical effort involved in spacewalks.',
    useInHelios: 'Helps explain the physical effort involved in spacewalks.',
    versionNote: 'Consulted · 15 Nov 2026',
    terms: 'Public NTRS report.',
    limitations: 'General information, not live data from a spacesuit.',
  },
  'csa-radiation': {
    name: 'How radiation affects the human body in space',
    type: 'Canadian Space Agency resource',
    description: 'Types of space radiation, their effects, and ways to reduce exposure.',
    useInHelios: 'Explains types of space radiation and how they affect the body.',
    versionNote: 'Consulted · 15 Nov 2026',
    terms: 'Public CSA education page. Images are not copied.',
    limitations: 'The source’s limits do not represent a person’s dose in this demonstration.',
  },
  'csa-sciences': {
    name: 'Space science research',
    type: 'Canadian Space Agency resource',
    description: 'CSA science research portal.',
    useInHelios: 'Offers information about scientific research in space.',
    versionNote: 'Consulted · 15 Nov 2026',
    terms: 'Public CSA portal.',
    limitations: 'For reference only; HELIOS does not use this information directly.',
  },
}

const TEAM_EN: Record<string, Pick<TeamMember, 'title' | 'summary' | 'bio' | 'tags'> & { highlights?: string[] }> = {
  maria: {
    title: 'Systems Engineering student | Leadership and tutoring',
    summary: 'She enjoys creating apps, teaching, and working with a team.',
    tags: ['App development', 'Leadership', 'Tutoring', 'Space exploration'],
    highlights: [
      'Highest program GPA in 2024 and 2025',
      'Student Role Model 2025',
      'Participation in international projects',
      'Team leadership and organization',
      'App development',
      'Academic tutoring',
      'Interest in NASA and space since childhood',
    ],
    bio: `María is a third-year Systems Engineering student at the Universidad Nacional de Costa Rica, Chorotega Regional Campus, and has a diploma in programming. She received the program’s highest GPA award in 2024 and 2025 and was named Student Role Model in 2025. She has also taken part in international projects.

She enjoys creating apps, organizing teams, and helping others learn. She also tutors Calculus, Algebra, and programming courses.

She has been curious about the universe and space exploration since childhood. HELIOS brings that interest together with her wish to create useful technology.`,
  },
  david: {
    title: 'Graphic design and art direction',
    summary: 'More than 15 years creating clear, consistent images and brands.',
    tags: ['Art direction', 'Visual identity', 'Brand strategy', 'Graphic design'],
    bio: `David has more than 15 years of experience in design. He helps turn complex ideas into images and messages that are easy to understand.

He specializes in creating visual identities for brands and organizations, making sure colors, type, and images work well together.`,
  },
  daniel: {
    title: 'Software developer',
    summary: 'He builds apps and wants them to be safe and easy to use.',
    tags: ['App development', 'Digital safety', 'Problem solving'],
    bio: `Daniel is a software developer with experience creating apps and organizing the information they use. He wants to build tools that are safe, reliable, and easy to update.

He enjoys solving problems and learning new things. He is also interested in digital safety.`,
  },
  nohelia: {
    title: 'Floorplan specialist | Cybersecurity student',
    summary: 'She combines organization and attention to detail with an interest in digital safety.',
    tags: ['Organization', 'Attention to detail', 'Digital safety'],
    bio: `Nohelia has a background in executive assistance and computer networks. She works organizing floorplans for a software company, where she has developed strong attention to detail and problem-solving skills.

She is also studying cybersecurity and wants to learn more about protecting information.`,
  },
  elian: {
    title: 'Systems Engineering student | App developer',
    summary: 'He builds websites, tutors students, and helps with campus activities.',
    tags: ['Web apps', 'Tutoring', 'Student activities', 'Digital safety'],
    bio: `Elián studies Systems Engineering and builds web apps. For his graduation project, he is creating a platform to help organize Parroquia San Blas de Nicoya.

He also tutors Calculus and Algebra and helps organize student activities. In 2026, he received university recognition for his participation and academic performance.

He earned a scholarship to study English and, in 2024, placed fourth nationally among Bridge for English students on the TOEIC.

He is interested in technology, data, and digital safety.`,
  },
}

const NAV_ES = ['Inicio', 'El proyecto', 'Cómo funciona', 'Acerca de nosotros', 'Video', 'Documentos', 'Datos'] as const

export function publicNav(lang: Lang) {
  return [
    { to: '/', end: true },
    { to: '/proyecto', end: false },
    { to: '/como-funciona', end: false },
    { to: '/nosotros', end: false },
    { to: '/video', end: false },
    { to: '/documentos', end: false },
    { to: '/datos', end: false },
  ].map((item, index) => ({
    ...item,
    label: lang === 'es' ? NAV_ES[index] : NAV_EN[index],
  }))
}

export function publicStages(lang: Lang) {
  return STAGES.map((stage, index) => {
    const english = STAGES_EN[index]
    if (!english) {
      return {
        id: stage.id,
        title: stage.title,
        lead: stage.lead,
        items: [...stage.items],
      }
    }
    const enStage = {
      id: stage.id,
      title: english.title,
      lead: english.lead,
      items: [...english.items],
    }
    if (lang !== 'es') return enStage
    return {
      id: stage.id,
      title: stage.title || english.title,
      lead: stage.lead || english.lead,
      items: stage.items.length ? [...stage.items] : [...english.items],
    }
  })
}

export function publicDifferentiators(lang: Lang) {
  if (lang !== 'es') return DIFFERENTIATORS_EN
  return DIFFERENTIATORS_EN.map((item, index) => ({
    title: DIFFERENTIATORS[index]?.title || item.title,
    text: DIFFERENTIATORS[index]?.text || item.text,
  }))
}

const CAPABILITIES_ES = [
  { title: 'Asistente Quirón', text: 'Puedes hacer preguntas y consultar de dónde vienen sus respuestas. Si le falta información, te lo dirá.' },
  { title: 'Mediciones más claras', text: 'Las mediciones de ejemplo indican cuándo se tomaron y si parecen confiables.' },
  { title: 'Recursos para la misión', text: 'Consulta qué necesita la tripulación y qué recursos están listos o todavía faltan.' },
  { title: 'Apoyo adicional', text: 'Facilita pedir ayuda cuando algo necesita revisarse con más atención.' },
  { title: 'Privacidad y decisión', text: 'Un espacio privado para hablar sobre bienestar y revisar un resumen antes de compartirlo.' },
  { title: 'Cuando no hay conexión', text: 'Algunas funciones siguen disponibles y se actualizan cuando vuelve el servicio.' },
] as const

export function publicQuestions(lang: Lang) {
  if (lang !== 'es') return QUESTIONS_EN
  return QUESTIONS_EN.map((item, index) => QUIRON_QUESTIONS[index] || item)
}

export function publicPrinciples(lang: Lang) {
  if (lang !== 'es') return PRINCIPLES_EN
  return PRINCIPLES_EN.map((item, index) => QUIRON_PRINCIPLES[index] ?? item)
}

export function publicCapabilities(lang: Lang) {
  const tones = ['lilac', 'mint', 'rose', 'warm', 'lilac', 'mint'] as const
  return CAPABILITIES_EN.map((item, index) => {
    const spanish = CAPABILITIES_ES[index]
    const copy = lang === 'es' && spanish ? spanish : item
    return { title: copy.title, text: copy.text, tone: tones[index] ?? 'mint' }
  })
}

export function publicTeam(lang: Lang): TeamMember[] {
  return TEAM.map((member) => publicMember(lang, member))
}

export function publicMember(lang: Lang, member: TeamMember): TeamMember {
  const english = TEAM_EN[member.id]
  const enMember: TeamMember = english
    ? {
        ...member,
        title: english.title,
        summary: english.summary,
        bio: english.bio,
        tags: [...english.tags],
        highlights: english.highlights ? [...english.highlights] : member.highlights,
      }
    : member
  if (lang !== 'es') return enMember
  return {
    ...enMember,
    title: member.title || enMember.title,
    summary: member.summary || enMember.summary,
    bio: member.bio || enMember.bio,
    tags: member.tags.length ? [...member.tags] : enMember.tags,
    highlights: member.highlights?.length ? [...member.highlights] : enMember.highlights,
  }
}

export function publicDocs(lang: Lang): DocCard[] {
  return DOCUMENTS.map((doc) => {
    const english = DOCS_EN[doc.id]
    const enDoc: DocCard = english
      ? { ...doc, title: english.title, description: english.description, language: english.language }
      : doc
    if (lang !== 'es') return enDoc
    return { ...enDoc, title: doc.title || enDoc.title, description: doc.description || enDoc.description, language: doc.language || enDoc.language }
  })
}

export function publicSources(lang: Lang): DataSource[] {
  return DATA_SOURCES.map((source) => {
    const english = SOURCES_EN[source.id]
    const enSource: DataSource = english ? { ...source, ...english } : source
    if (lang !== 'es') return enSource
    return { ...enSource, ...source, id: source.id, href: source.href, status: source.status, institution: source.institution, citation: source.citation }
  })
}

export function sourceStatus(lang: Lang, status: DataSource['status']) {
  const english = { utilizado: 'Used', consultado: 'Consulted', propuesto: 'Proposed' }[status]
  if (lang !== 'es') return english
  return { utilizado: 'Utilizado', consultado: 'Consultado', propuesto: 'Propuesto' }[status] || english
}
