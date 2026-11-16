/** Canadian Space Agency resources used by HELIOS (challenge partner materials). */
export type CsaResource = {
  id: string
  title: { es: string; en: string }
  institution: string
  url: string
  versionNote: { es: string; en: string }
  description: { es: string; en: string }
  useInHelios: { es: string; en: string }
  terms: { es: string; en: string }
  limitations: { es: string; en: string }
  screens: string[]
}

export const CSA_RESOURCES: CsaResource[] = [
  {
    id: 'csa-radiation-health',
    title: {
      es: 'Cómo afecta la radiación al cuerpo humano en el espacio',
      en: 'How radiation affects the human body in space',
    },
    institution: 'Canadian Space Agency (CSA/ASC)',
    url: 'https://www.asc-csa.gc.ca/eng/astronauts/space-medicine/radiation.asp',
    versionNote: { es: 'Página pública CSA · consultada 2026-11-15', en: 'CSA public page · consulted 2026-11-15' },
    description: {
      es: 'Explica los tipos de radiación en el espacio, cómo pueden afectar al cuerpo y algunas formas de reducir la exposición. También presenta límites de referencia para astronautas canadienses.',
      en: 'Explains types of radiation in space, how they can affect the body, and ways to reduce exposure. It also presents reference limits for Canadian astronauts.',
    },
    useInHelios: {
      es: 'Ayuda a explicar la radiación espacial y sus posibles efectos. No muestra la dosis de una persona.',
      en: 'Helps explain space radiation and its possible effects. It does not show a person’s dose.',
    },
    terms: {
      es: 'Información educativa pública de la Agencia Espacial Canadiense.',
      en: 'Public educational information from the Canadian Space Agency.',
    },
    limitations: {
      es: 'Los límites son solo de referencia. HELIOS no calcula la dosis de una persona.',
      en: 'The limits are for reference only. HELIOS does not calculate a person’s dose.',
    },
    screens: ['/app/riesgos', '/datos', '/misiones/evidencia', 'RadiationPanel'],
  },
  {
    id: 'csa-space-science',
    title: {
      es: 'Investigación espacial de Canadá',
      en: 'Canada’s space research',
    },
    institution: 'Canadian Space Agency (CSA/ASC)',
    url: 'https://www.asc-csa.gc.ca/eng/sciences/',
    versionNote: { es: 'Portal CSA Sciences · consultado 2026-11-15', en: 'CSA Sciences portal · consulted 2026-11-15' },
    description: {
      es: 'Información sobre investigaciones de salud, ciencias de la vida y exploración espacial.',
      en: 'Information about research on health, life sciences, and space exploration.',
    },
    useInHelios: {
      es: 'Más información sobre la investigación espacial.',
      en: 'More information about space research.',
    },
    terms: {
      es: 'Enlaces a información pública de la Agencia Espacial Canadiense.',
      en: 'Links to public information from the Canadian Space Agency.',
    },
    limitations: {
      es: 'Sirve como referencia; HELIOS no usa directamente esos datos.',
      en: 'For reference only; HELIOS does not use this information directly.',
    },
    screens: ['/app/riesgos', '/datos', '/misiones/evidencia'],
  },
]
