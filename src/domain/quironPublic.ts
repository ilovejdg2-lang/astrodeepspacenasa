/** Respuestas locales del sitio público — sin datos privados del dashboard. */

export type QuironPublicLocale = 'en' | 'es'

export interface QuironPublicAnswer {
  text: string
  sources: string[]
  demo: true
}

function match(q: string, ...keys: string[]) {
  return keys.some((key) => q.includes(key))
}

export function answerPublicLocal(question: string, locale: QuironPublicLocale): QuironPublicAnswer {
  const q = question.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
  const en = locale === 'en'

  if (match(q, 'que puedo', 'what can', 'funciones', 'features', 'hacer en helios', 'do in helios')) {
    return {
      demo: true,
      sources: ['HELIOS · sitio público'],
      text: en
        ? 'In HELIOS you can explore the mission cycle (pre-flight, aboard, post-mission), see how indicators and inventory are presented, review documents, and enter the demonstration dashboard. Quirón on the public site explains the prototype — it does not open private crew records.'
        : 'En HELIOS podés explorar el ciclo de misión (preembarque, a bordo, posmisión), ver cómo se presentan indicadores e inventario, revisar documentos y entrar al panel de demostración. En el sitio público Quirón explica el prototipo; no abre registros privados de tripulación.',
    }
  }

  if (match(q, 'abord', 'board', 'preembar', 'antes de', 'before', 'prepar')) {
    return {
      demo: true,
      sources: ['HELIOS · etapas de misión'],
      text: en
        ? 'Before boarding, HELIOS focuses on preparation: proposed resources, pending reviews, and checks that authorized staff still need to close. The public pages describe the stage; personal prep lists live only inside the dashboard after you sign in to a demo case.'
        : 'Antes de abordar, HELIOS se centra en la preparación: recursos propuestos, revisiones pendientes y comprobaciones que el personal autorizado aún debe cerrar. Las páginas públicas describen la etapa; las listas personales viven solo en el panel, al abrir un caso de demostración.',
    }
  }

  if (match(q, 'registro', 'record', 'historial', 'history', 'medicion', 'measurement', 'alerta', 'alert')) {
    return {
      demo: true,
      sources: ['HELIOS · límite del sitio público'],
      text: en
        ? 'I cannot see personal measurements, alerts, or private wellbeing notes from the public site. Enter the HELIOS system to work with the authorized demo case. Prototype analysis is not a clinical diagnosis.'
        : 'Desde el sitio público no puedo ver mediciones personales, alertas ni notas privadas de bienestar. Entrá al sistema HELIOS para trabajar con el caso de demostración autorizado. El análisis del prototipo no es un diagnóstico clínico.',
    }
  }

  if (match(q, 'recurso', 'resource', 'inventario', 'inventory', 'equipo', 'equipment', 'documento', 'document')) {
    return {
      demo: true,
      sources: ['HELIOS · Documentos / Datos'],
      text: en
        ? 'Public resources include project pages, how-it-works, team, video, documents, and the data story. Inventory quantities and locations appear in the dashboard Resources view — not as live private stock from this chat.'
        : 'Los recursos públicos incluyen las páginas del proyecto, cómo funciona, el equipo, video, documentos y la historia de datos. Cantidades y ubicaciones del inventario aparecen en Recursos del panel — no como existencias privadas en vivo desde este chat.',
    }
  }

  if (match(q, 'helios', 'que es', 'what is', 'proyecto', 'project', 'mision', 'mission')) {
    return {
      demo: true,
      sources: ['HELIOS · El proyecto'],
      text: en
        ? 'HELIOS (Health Evaluation & Life Indicators Observation System) is an independent prototype for space-health support across the mission cycle. It is not an official NASA product. Indicators show age, quality, and integrity; Quirón cites available evidence and never closes alerts or changes inventory by itself.'
        : 'HELIOS (Health Evaluation & Life Indicators Observation System) es un prototipo independiente de acompañamiento en salud espacial a lo largo del ciclo de misión. No es un producto oficial de NASA. Los indicadores muestran antigüedad, calidad e integridad; Quirón cita evidencia disponible y nunca cierra alertas ni cambia inventario por sí solo.',
    }
  }

  if (match(q, 'naveg', 'pagina', 'page', 'donde', 'where', 'menu')) {
    return {
      demo: true,
      sources: ['HELIOS · navegación'],
      text: en
        ? 'Use the top navigation for Home, Project, How it works, About us, Video, Documents, and Data. “Enter the system” opens the demonstration dashboard.'
        : 'Usá la navegación superior para Inicio, El proyecto, Cómo funciona, Acerca de nosotros, Video, Documentos y Datos. “Acceder al sistema” abre el panel de demostración.',
    }
  }

  return {
    demo: true,
    sources: ['Quirón · modo demostración (sitio público)'],
    text: en
      ? 'I can help you explore what HELIOS is, the mission stages, public documentation, and site navigation. I do not access private dashboard data from here. Try a suggestion below, or ask about HELIOS features or stages.'
      : 'Puedo ayudarte a explorar qué es HELIOS, las etapas de misión, la documentación pública y la navegación del sitio. Desde aquí no accedo a datos privados del panel. Probá una sugerencia o preguntá por funciones o etapas de HELIOS.',
  }
}

export function publicSuggestions(locale: QuironPublicLocale): string[] {
  return locale === 'en'
    ? [
        'What can I do in HELIOS?',
        'What should I review before boarding?',
        'Help me understand my records.',
        'What resources are available?',
      ]
    : [
        '¿Qué puedo hacer en HELIOS?',
        '¿Qué debo revisar antes de abordar?',
        'Ayudame a entender mis registros.',
        '¿Qué recursos están disponibles?',
      ]
}

export function dashboardSuggestions(locale: QuironPublicLocale): string[] {
  return locale === 'en'
    ? [
        'What can I do in HELIOS?',
        'What should I review before boarding?',
        'What information is missing?',
        'What resources are available?',
      ]
    : [
        '¿Qué puedo hacer en HELIOS?',
        '¿Qué debo revisar antes de abordar?',
        '¿Qué información falta?',
        '¿Qué recursos están disponibles?',
      ]
}
