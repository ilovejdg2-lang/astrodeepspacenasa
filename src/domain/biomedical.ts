import type { HealthIndicatorReading, IndicatorKind } from '../platform/api'
import type { WorkspaceRole } from '../platform/workspace'

export type BiomedicalSystemId =
  | 'cardiovascular'
  | 'respiratory'
  | 'sleep'
  | 'musculoskeletal'
  | 'nutrition'
  | 'emotional'

export type SpaceflightHazard =
  | 'altered_gravity'
  | 'space_radiation'
  | 'isolation_confinement'
  | 'distance_from_earth'
  | 'closed_environments'

export type EvidenceStudyModel =
  | 'human_flight'
  | 'human_bedrest'
  | 'animal_cellular'
  | 'operational_standard'

export type NasaEvidenceItem = {
  id: string
  title: string
  institution: string
  dateOrVersion: string
  relevance: { en: string; es: string }
  url: string
  limitation: { en: string; es: string }
  studyModel: EvidenceStudyModel
}

export type SpaceflightContextItem = {
  hazard: SpaceflightHazard
  title: { en: string; es: string }
  badge: 'research_risk' | 'individual_observation' | 'environmental_context' | 'insufficient_data'
  badgeLabel: { en: string; es: string }
  content: { en: string; es: string }
  evidenceRef?: {
    title: string
    url: string
    institution: string
  }
}

export type BiomedicalSystemDefinition = {
  id: BiomedicalSystemId
  name: { en: string; es: string }
  tagline: { en: string; es: string }
  description: { en: string; es: string }
  iconName: 'heart' | 'wind' | 'moon' | 'bone' | 'apple' | 'smile'
  bodyRegions: string[]
  indicatorKinds: IndicatorKind[]
  isPhysical: boolean
  whatItTellsYou: { en: string; es: string }
  whatItDoesNotTellYou: { en: string; es: string }
  spaceflightContext: SpaceflightContextItem[]
  evidence: NasaEvidenceItem[]
}

export const BIOMEDICAL_SYSTEMS: BiomedicalSystemDefinition[] = [
  {
    id: 'musculoskeletal',
    name: { en: 'Body Pain', es: 'Dolores de cuerpo' },
    tagline: {
      en: 'Pain mapping, body aches, spinal unloading, and comfort',
      es: 'Mapa de dolor, molestias corporales y descarga espinal',
    },
    description: {
      en: 'Integrates self-reported somatic pain locations, body aches, discomfort intensity, back symptoms, and physical countermeasure activities.',
      es: 'Integra ubicaciones de dolor somático reportado, molestias corporales, intensidad del malestar, síntomas lumbares y actividad física.',
    },
    iconName: 'bone',
    bodyRegions: ['head', 'face', 'neck', 'shoulder', 'chest', 'upper_back', 'abdomen', 'lower_back', 'pelvis', 'upper_arm', 'elbow', 'forearm', 'hand', 'hip', 'thigh', 'knee', 'lower_leg', 'foot'],
    indicatorKinds: [],
    isPhysical: true,
    whatItTellsYou: {
      en: 'Locates exact anatomical regions of discomfort (e.g. space back pain, joint stiffness), patterns (constant vs intermittent), and timeline of reported pain.',
      es: 'Ubica regiones anatómicas exactas de malestar (dolor lumbar espacial, rigidez articular), patrones e historial temporal.',
    },
    whatItDoesNotTellYou: {
      en: 'Does not quantify bone mineral density loss (DXA g/cm²), muscular atrophy percentages, or detect spinal disc herniation.',
      es: 'No cuantifica pérdida de densidad mineral ósea (DXA g/cm²), porcentaje de atrofia muscular ni hernia discal.',
    },
    spaceflightContext: [
      {
        hazard: 'altered_gravity',
        title: { en: 'Spinal Elongation & Low Back Pain in Microgravity', es: 'Elongación de la columna y dolor lumbar en microgravedad' },
        badge: 'research_risk',
        badgeLabel: { en: 'Research Risk', es: 'Riesgo de investigación' },
        content: {
          en: 'Absence of axial gravity causes intervertebral discs to expand with fluid, elongating the spine by ~5–7 cm. Over 70% of astronauts report mild to moderate back pain during the first week of flight.',
          es: 'La falta de gravedad axial expande los discos intervertebrales con líquido, elongando la columna ~5–7 cm. Más del 70% reporta dolor lumbar durante la primera semana.',
        },
        evidenceRef: {
          title: 'NASA HRP Risk of Early Onset Osteoporosis and Spinal Damage',
          url: 'https://www.nasa.gov/hrp/risks/',
          institution: 'NASA HRP',
        },
      },
      {
        hazard: 'altered_gravity',
        title: { en: 'Weightbearing Skeletal Muscle and Bone Mineral Density Atrophy', es: 'Atrofia musculoesquelética en huesos de carga' },
        badge: 'research_risk',
        badgeLabel: { en: 'Research Risk', es: 'Riesgo de investigación' },
        content: {
          en: 'Calf muscles and lumbar/pelvic bones lose density at ~1–1.5% per month without resistive exercise countermeasures (ARED) and diet.',
          es: 'Los músculos posturales y huesos lumbares/pélvicos pierden densidad (~1–1.5% al mes) sin contramedidas de ejercicio resistivo (ARED).',
        },
      },
    ],
    evidence: [
      {
        id: 'hrp-spine-risk',
        title: 'Evidence Report: Risk of Intervertebral Disc Damage and Post-Flight Lumbar Pain',
        institution: 'NASA Human Research Program (HRP)',
        dateOrVersion: 'HRP Evidence Document 2023',
        relevance: {
          en: 'Documents the mechanisms of spinal unloading, disc hydration swelling, and back pain prevalence during space missions.',
          es: 'Documenta los mecanismos de descarga espinal, hidratación discal y prevalencia de dolor lumbar en misiones espaciales.',
        },
        url: 'https://humanresearchroadmap.nasa.gov/Evidence/',
        limitation: {
          en: 'Focuses on lumbar and cervical regions; individual spine adaptations depend on pre-flight core conditioning.',
          es: 'Centrado en columna lumbar y cervical; la adaptación depende de la condición física previa al vuelo.',
        },
        studyModel: 'human_flight',
      },
      {
        id: 'nasa-osdr-muscle',
        title: 'NASA OSDR: Multi-Omics Analysis of Microgravity Skeletal Muscle Unloading (OSD-379 & OSD-564)',
        institution: 'NASA Open Science Data Repository (OSDR)',
        dateOrVersion: 'OSDR Release 2024',
        relevance: {
          en: 'Transcriptomic and proteomic signatures of muscle atrophy and mitochondrial metabolic shifts in spaceflight.',
          es: 'Firmas transcriptómicas y proteómicas de atrofia muscular y cambios metabólicos mitocondriales en vuelo.',
        },
        url: 'https://osdr.nasa.gov/bio/repo/',
        limitation: {
          en: 'Includes rodent and cellular spaceflight payloads alongside human tissue biopsies; direct clinical extrapolation requires caution.',
          es: 'Incluye cargas espaciales de roedores y cultivos celulares además de biopsias humanas; requiere cautela clínica.',
        },
        studyModel: 'animal_cellular',
      },
    ],
  },
  {
    id: 'cardiovascular',
    name: { en: 'Cardiovascular', es: 'Cardiovascular' },
    tagline: {
      en: 'Heart rate, blood pressure, and cephalad fluid shifts',
      es: 'Frecuencia cardíaca, presión arterial y redistribución de fluidos',
    },
    description: {
      en: 'Tracks hemodynamic adaptations to microgravity, including headward fluid shifts and changes in resting heart rate and arterial pressure.',
      es: 'Sigue las adaptaciones hemodinámicas a la microgravedad, incluyendo la redistribución cefálica de fluidos y variaciones en pulso y presión arterial.',
    },
    iconName: 'heart',
    bodyRegions: ['chest', 'upper_arm', 'neck'],
    indicatorKinds: ['heart_rate', 'blood_pressure'],
    isPhysical: true,
    whatItTellsYou: {
      en: 'Reflects current pulse rate and systolic/diastolic arterial pressures at rest and post-exercise. Tracks hemodynamic trends across mission stages.',
      es: 'Refleja la frecuencia de pulso y presiones sistólica/diastólica en reposo y tras actividad. Muestra tendencias hemodinámicas a lo largo de la misión.',
    },
    whatItDoesNotTellYou: {
      en: 'Does not measure stroke volume, cardiac output, structural remodeling, or electrical arrhythmias. A normal pulse does not rule out orthostatic intolerance upon re-entry.',
      es: 'No mide volumen sistólico, gasto cardíaco, remodelado estructural ni arritmias eléctricas. Un pulso normal no descarta intolerancia ortostática al reingreso.',
    },
    spaceflightContext: [
      {
        hazard: 'altered_gravity',
        title: { en: 'Cephalad Fluid Shift & Cardiovascular Deconditioning', es: 'Redistribución cefálica de fluidos y desacondicionamiento' },
        badge: 'research_risk',
        badgeLabel: { en: 'Research Risk', es: 'Riesgo de investigación' },
        content: {
          en: 'Microgravity eliminates hydrostatic hydrostatic pressure gradients, shifting ~1.5–2.0 L of vascular fluids toward the head, altering central venous pressure and baroreceptor setpoints.',
          es: 'La microgravedad elimina el gradiente de presión hidrostática, desplazando ~1.5–2.0 L de fluidos hacia la cabeza y alterando el punto de ajuste de los barorreceptores.',
        },
        evidenceRef: {
          title: 'NASA HRP Risk of Cardiovascular Adaptations',
          url: 'https://www.nasa.gov/hrp/risks/',
          institution: 'NASA HRP',
        },
      },
      {
        hazard: 'altered_gravity',
        title: { en: 'Orthostatic Intolerance Post-Flight', es: 'Intolerancia ortostática postvuelo' },
        badge: 'environmental_context',
        badgeLabel: { en: 'Environmental Context', es: 'Contexto ambiental' },
        content: {
          en: 'Decrease in blood plasma volume (~10–15%) during flight impairs cerebral perfusion when returning to gravity. Countermeasures include fluid loading and compression garments.',
          es: 'La disminución de volumen plasmático (~10–15%) durante el vuelo compromete la perfusión cerebral al volver a la gravedad. Requiere rehidratación y prendas compresivas.',
        },
        evidenceRef: {
          title: 'OCHMO Technical Brief: Cardiovascular Health in Spaceflight',
          url: 'https://www.nasa.gov/ochmo/hsa-standards/ochmo-technical-briefs/',
          institution: 'NASA OCHMO',
        },
      },
    ],
    evidence: [
      {
        id: 'hrp-cardio-risk',
        title: 'Risk of Cardiovascular Disease and Other Degenerative Tissue Effects from Space Radiation and Microgravity',
        institution: 'NASA Human Research Program (HRP)',
        dateOrVersion: 'Evidence Report Rev. 2024',
        relevance: {
          en: 'Synthesizes clinical telemetry and inflight echocardiographic studies from ISS crew members.',
          es: 'Sintetiza telemetría clínica y estudios ecocardiográficos en tripulantes de la Estación Espacial Internacional.',
        },
        url: 'https://humanresearchroadmap.nasa.gov/Evidence/',
        limitation: {
          en: 'Human flight data from low Earth orbit (ISS); deep space radiation synergies remain subject to active research.',
          es: 'Datos humanos en órbita baja terrestre (ISS); las sinergias con radiación de espacio profundo siguen en investigación activa.',
        },
        studyModel: 'human_flight',
      },
      {
        id: 'ochmo-cardio-brief',
        title: 'NASA Technical Brief: Spaceflight-Induced Cardiovascular Adaptations and Aerobic Countermeasures',
        institution: 'NASA Office of the Chief Health & Medical Officer (OCHMO)',
        dateOrVersion: 'OCHMO-TB-018 v2.1',
        relevance: {
          en: 'Provides clinical monitoring guidelines and aerobic threshold protocols for long-duration exploration missions.',
          es: 'Establece pautas de monitoreo clínico y protocolos de umbral aeróbico para misiones de exploración prolongadas.',
        },
        url: 'https://www.nasa.gov/ochmo/hsa-standards/ochmo-technical-briefs/',
        limitation: {
          en: 'Operational standard developed for healthy astronaut cohorts; not a diagnostic criteria tool for terrestrial patients.',
          es: 'Estándar operacional para cohortes de astronautas sanos; no constituye un criterio diagnóstico para pacientes terrestres.',
        },
        studyModel: 'operational_standard',
      },
    ],
  },
  {
    id: 'respiratory',
    name: { en: 'Respiratory', es: 'Respiratorio' },
    tagline: {
      en: 'Respiratory rate, SpO₂, and habitat atmosphere exchange',
      es: 'Frecuencia respiratoria, SpO₂ y ventilación de hábitat',
    },
    description: {
      en: 'Monitors minute breathing rates and peripheral pulse oxygen saturation under spacecraft habitat atmospheric conditions.',
      es: 'Monitorea la frecuencia ventilatoria y la saturación periférica de oxígeno bajo las condiciones atmosféricas del hábitat.',
    },
    iconName: 'wind',
    bodyRegions: ['chest', 'neck', 'hand'],
    indicatorKinds: ['respiratory_rate', 'spo2'],
    isPhysical: true,
    whatItTellsYou: {
      en: 'Tracks respiratory cadence (breaths/min) and estimated microvascular oxygen saturation (% SpO₂) at rest or during mission tasks.',
      es: 'Muestra la cadencia respiratoria (rpm) y la saturación microvascular estimada de oxígeno (% SpO₂) en reposo o actividad.',
    },
    whatItDoesNotTellYou: {
      en: 'Does not measure arterial partial pressures (PaO₂, PaCO₂), spirometric forced vital capacity, or alveolar ventilation uniformity.',
      es: 'No mide presiones parciales arteriales (PaO₂, PaCO₂), capacidad vital forzada espirométrica ni uniformidad de ventilación alveolar.',
    },
    spaceflightContext: [
      {
        hazard: 'closed_environments',
        title: { en: 'Closed Cabin Atmosphere & Localized CO₂ Pockets', es: 'Atmósfera cerrada y acumulación localizada de CO₂' },
        badge: 'environmental_context',
        badgeLabel: { en: 'Environmental Context', es: 'Contexto ambiental' },
        content: {
          en: 'Without natural air buoyancy in microgravity, exhaled CO₂ can pool around a sleeping or stationary crew member if cabin air fans are restricted.',
          es: 'Sin convección natural por gravedad, el CO₂ exhalado puede acumularse alrededor del tripulante inmóvil si la ventilación forzada se reduce.',
        },
        evidenceRef: {
          title: 'NASA HRP Hazards: Closed Environments',
          url: 'https://www.nasa.gov/hrp/hazards/',
          institution: 'NASA HRP',
        },
      },
      {
        hazard: 'altered_gravity',
        title: { en: 'Ventilation-Perfusion Matching in Weightlessness', es: 'Relación ventilación-perfusión en ingravidez' },
        badge: 'research_risk',
        badgeLabel: { en: 'Research Risk', es: 'Riesgo de investigación' },
        content: {
          en: 'Gravity-dependent ventilation and perfusion gradients disappear in microgravity, resulting in more uniform overall distribution but mild decreases in functional residual capacity.',
          es: 'Los gradientes gravitacionales de ventilación y perfusión se nivelan en ingravidez, con una leve reducción de la capacidad residual funcional.',
        },
      },
    ],
    evidence: [
      {
        id: 'hrp-hypoxia-hypercapnia',
        title: 'Evidence Report: Risk of Adverse Health Effects Due to Altered Atmosphere and Hypobaric Decompression',
        institution: 'NASA Human Research Program (HRP)',
        dateOrVersion: 'NASA-TP-2023-5014',
        relevance: {
          en: 'Details operational SpO₂ thresholds, normobaric hypoxia protocols, and CO₂ sensitivity in space habitats.',
          es: 'Detalla umbrales operacionales de SpO₂, protocolos de hipoxia normobárica y sensibilidad a CO₂ en hábitats.',
        },
        url: 'https://humanresearchroadmap.nasa.gov/Evidence/',
        limitation: {
          en: 'Based on controlled hypobaric chamber simulations and ISS telemetry; individual physiological sensitivity varies.',
          es: 'Basado en cámaras hipobáricas y telemetría de ISS; la sensibilidad fisiológica individual varía.',
        },
        studyModel: 'human_flight',
      },
      {
        id: 'ochmo-air-standards',
        title: 'OCHMO Technical Brief: Spacecraft Internal Atmosphere Quality Standards and Monitoring',
        institution: 'NASA OCHMO',
        dateOrVersion: 'OCHMO-TB-024 v1.3',
        relevance: {
          en: 'Defines acceptable limits for partial oxygen pressure (pO₂) and carbon dioxide scrubbers.',
          es: 'Define los límites aceptables de presión parcial de oxígeno (pO₂) y depuración de dióxido de carbono.',
        },
        url: 'https://www.nasa.gov/ochmo/hsa-standards/ochmo-technical-briefs/',
        limitation: {
          en: 'Engineering and environmental health benchmark, not an individual clinical prognosis.',
          es: 'Parámetro de ingeniería y salud ambiental, no un pronóstico clínico individual.',
        },
        studyModel: 'operational_standard',
      },
    ],
  },
  {
    id: 'sleep',
    name: { en: 'Sleep & Recovery', es: 'Sueño y recuperación' },
    tagline: {
      en: 'Sleep duration, circadian rhythms, and rest hygiene',
      es: 'Duración del sueño, ritmos circadianos e higiene del descanso',
    },
    description: {
      en: 'Tracks self-reported and device-recorded rest duration, sleep episode quality, and circadian schedule adherence.',
      es: 'Monitorea la duración del descanso autorreportado y por sensores, la calidad de los episodios de sueño y el horario circadiano.',
    },
    iconName: 'moon',
    bodyRegions: ['head'],
    indicatorKinds: ['sleep_hours'],
    isPhysical: false,
    whatItTellsYou: {
      en: 'Summarizes total sleep hours per 24-hour cycle, sleep debt accumulation, and scheduled rest periods.',
      es: 'Resume las horas totales de sueño por ciclo de 24 horas, la acumulación de deuda de sueño y los descansos programados.',
    },
    whatItDoesNotTellYou: {
      en: 'Does not record polysomnographic electroencephalography (EEG) sleep architecture, REM stage percentage, or micro-arousals.',
      es: 'No registra electroencefalografía (EEG) polisomnográfica, porcentaje de fase REM ni microdespertares.',
    },
    spaceflightContext: [
      {
        hazard: 'isolation_confinement',
        title: { en: 'Circadian Desynchronization & 90-Minute Day-Night Cycles', es: 'Desincronización circadiana y ciclos de 90 minutos' },
        badge: 'research_risk',
        badgeLabel: { en: 'Research Risk', es: 'Riesgo de investigación' },
        content: {
          en: 'Astronauts in low Earth orbit witness 16 sunrises every 24 hours. Without natural sunlight cues, endogenous melatonin rhythms shift, often reducing sleep duration by 1–2 hours per night.',
          es: 'En órbita baja se experimentan 16 amaneceres al día. Sin luz solar natural, los ritmos de melatonina se desfasan, reduciendo el descanso en 1–2 horas por noche.',
        },
        evidenceRef: {
          title: 'NASA HRP Behavioral Health & Performance (BHP)',
          url: 'https://www.nasa.gov/hrp/risks/',
          institution: 'NASA HRP',
        },
      },
      {
        hazard: 'closed_environments',
        title: { en: 'Acoustic Background & Sleeping Berth Lighting', es: 'Ruido acústico y luz en camarotes' },
        badge: 'environmental_context',
        badgeLabel: { en: 'Environmental Context', es: 'Contexto ambiental' },
        content: {
          en: 'Life support pumps and avionics fans generate continuous noise (~55–65 dBA). Solid-state LED circadian lighting is used to enhance wakefulness and facilitate sleep onset.',
          es: 'Bombas de soporte vital y ventiladores generan ruido continuo (~55–65 dBA). Se utiliza iluminación circadiana LED para favorecer la vigilia y la conciliación del sueño.',
        },
      },
    ],
    evidence: [
      {
        id: 'hrp-sleep-evidence',
        title: 'Risk of Adverse Cognitive or Behavioral Conditions and Psychiatric Disorders from Sleep Loss and Workload',
        institution: 'NASA Human Research Program (HRP)',
        dateOrVersion: 'HRR Evidence Paper 2024',
        relevance: {
          en: 'Analyzes actigraphy and sleep logs across dozens of space missions, demonstrating common inflight sleep restriction.',
          es: 'Analiza actigrafía y registros de sueño en múltiples misiones, documentando la restricción habitual de sueño en vuelo.',
        },
        url: 'https://humanresearchroadmap.nasa.gov/Evidence/',
        limitation: {
          en: 'Data relies heavily on actigraphy and self-report logs; in-depth EEG sleep architecture in flight is limited.',
          es: 'Los datos provienen principalmente de actigrafía y autorreportes; la polisomnografía completa en vuelo es limitada.',
        },
        studyModel: 'human_flight',
      },
      {
        id: 'ochmo-fatigue-management',
        title: 'OCHMO Technical Brief: Fatigue Management and Sleep Countermeasures for Exploration Missions',
        institution: 'NASA OCHMO',
        dateOrVersion: 'OCHMO-TB-011 v3.0',
        relevance: {
          en: 'Sets crew work-rest cycles, sleep deprivation limits, and safe operational pharmacological countermeasure guidelines.',
          es: 'Establece ciclos de trabajo-descanso, límites de fatiga y pautas para el uso seguro de contramedidas.',
        },
        url: 'https://www.nasa.gov/ochmo/hsa-standards/ochmo-technical-briefs/',
        limitation: {
          en: 'Clinical guidance intended for mission planning and flight surgeons; individual responses to sleep countermeasures vary.',
          es: 'Guía para planificación de misión y cirujanos de vuelo; la respuesta individual a contramedidas varía.',
        },
        studyModel: 'operational_standard',
      },
    ],
  },
  {
    id: 'nutrition',
    name: { en: 'Nutrition & Metabolism', es: 'Nutrición y metabolismo' },
    tagline: {
      en: 'Blood glucose, core temperature, and metabolic energy balance',
      es: 'Glucosa, temperatura corporal y balance metabólico',
    },
    description: {
      en: 'Monitors spot metabolic indicators including blood glucose, core temperature regulation, and dietary protocol compliance.',
      es: 'Monitorea indicadores metabólicos puntuales como glucosa en sangre, termorregulación y adherencia nutricional.',
    },
    iconName: 'apple',
    bodyRegions: ['abdomen'],
    indicatorKinds: ['glucose', 'temperature'],
    isPhysical: true,
    whatItTellsYou: {
      en: 'Presents reported capillary or sensor blood glucose (mg/dL) and core body temperature (°C) trends under closed-habitat dietary rations.',
      es: 'Presenta la glucosa capilar o por sensor (mg/dL) y la temperatura corporal (°C) con raciones de hábitat cerrado.',
    },
    whatItDoesNotTellYou: {
      en: 'Does not compute complete micronutrient status (e.g. Vitamin D, ferritin), daily caloric expenditure, or diagnose diabetes mellitus.',
      es: 'No calcula el perfil completo de micronutrientes (vitamina D, ferritina), gasto calórico diario ni diagnostica diabetes.',
    },
    spaceflightContext: [
      {
        hazard: 'altered_gravity',
        title: { en: 'Spaceflight-Associated Core Body Temperature Elevation', es: 'Elevación de temperatura corporal asociada al vuelo' },
        badge: 'research_risk',
        badgeLabel: { en: 'Research Risk', es: 'Riesgo de investigación' },
        content: {
          en: 'Astronauts experience a sustained ~1.0 °C increase in core body temperature at rest and during exercise ("space fever"), driven by impaired convective cooling and low-grade systemic inflammation.',
          es: 'Los astronautas experimentan un incremento persistente de ~1.0 °C en reposo y ejercicio ("fiebre espacial"), por menor disipación térmica.',
        },
      },
      {
        hazard: 'closed_environments',
        title: { en: 'Nutritional Stability and Shelf-Life in Deep Space', es: 'Estabilidad nutricional y vida útil en espacio profundo' },
        badge: 'environmental_context',
        badgeLabel: { en: 'Environmental Context', es: 'Contexto ambiental' },
        content: {
          en: 'Radiation and storage degrade critical vitamins (thiamine, folate, vitamins A and C) over multi-year exploration transit timelines.',
          es: 'La radiación y el almacenamiento degradan vitaminas esenciales (tiamina, folato, vitaminas A y C) en misiones de varios años.',
        },
        evidenceRef: {
          title: 'NASA HRP Risk of Inadequate Nutrition',
          url: 'https://www.nasa.gov/hrp/risks/',
          institution: 'NASA HRP',
        },
      },
    ],
    evidence: [
      {
        id: 'hrp-nutrition-evidence',
        title: 'Evidence Report: Risk of Performance Decrement and Pathologies Due to Inadequate Food and Nutrition',
        institution: 'NASA Human Research Program (HRP)',
        dateOrVersion: 'HRP Evidence Document 2024',
        relevance: {
          en: 'Compiles metabolic rates, insulin sensitivity alterations, and dietary countermeasure efficacy across long-duration missions.',
          es: 'Compila tasas metabólicas, cambios en sensibilidad a la insulina y contramedidas nutricionales en misiones largas.',
        },
        url: 'https://humanresearchroadmap.nasa.gov/Evidence/',
        limitation: {
          en: 'Evaluated under packaged space rations; does not reflect bioregenerative fresh crop production.',
          es: 'Evaluado con raciones espaciales envasadas; no refleja cultivos bioregenerativos frescos.',
        },
        studyModel: 'human_flight',
      },
      {
        id: 'ochmo-nutrition-standards',
        title: 'OCHMO Technical Brief: Crew Nutritional Requirements and Metabolic Standards for Exploration',
        institution: 'NASA OCHMO',
        dateOrVersion: 'OCHMO-TB-007 v2.0',
        relevance: {
          en: 'Specifies daily caloric targets, sodium restrictions (to preserve bone calcium), and hydration benchmarks.',
          es: 'Especifica requerimientos calóricos diarios, restricción de sodio (para preservar calcio) e hidratación.',
        },
        url: 'https://www.nasa.gov/ochmo/hsa-standards/ochmo-technical-briefs/',
        limitation: {
          en: 'Operational requirements document; requires flight surgeon adaptation for individualized crew metabolism.',
          es: 'Documento operacional; requiere adaptación por el cirujano de vuelo según el metabolismo individual.',
        },
        studyModel: 'operational_standard',
      },
    ],
  },
  {
    id: 'emotional',
    name: { en: 'Emotional Well-being', es: 'Bienestar emocional' },
    tagline: {
      en: 'Mood tracking, psychological resilience, and confinement adaptation',
      es: 'Estado de ánimo, resiliencia psicológica y adaptación al aislamiento',
    },
    description: {
      en: 'Captures voluntary emotional self-reports on a validated 1–5 scale to notice shifts in morale, stress, and team dynamics during confinement.',
      es: 'Registra autorreportes emocionales voluntarios (escala 1–5) para notar variaciones de ánimo, estrés y dinámica en confinamiento.',
    },
    iconName: 'smile',
    bodyRegions: ['head', 'face'],
    indicatorKinds: ['mood'],
    isPhysical: false,
    whatItTellsYou: {
      en: 'Provides subjective self-reported mood state (1: Very Low to 5: Very Good) over time. Helps initiate timely psychological support or Quirón conversations.',
      es: 'Muestra la percepción subjetiva del estado de ánimo (1: Muy bajo a 5: Muy bien). Facilita buscar apoyo oportuno o conversar con Quirón.',
    },
    whatItDoesNotTellYou: {
      en: 'Is not a psychiatric diagnostic assessment. A low rating does not equate to clinical depression, nor does a high rating guarantee team operational readiness.',
      es: 'No es una evaluación diagnóstica psiquiátrica. Una puntuación baja no equivale a depresión clínica ni una alta garantiza rendimiento.',
    },
    spaceflightContext: [
      {
        hazard: 'isolation_confinement',
        title: { en: 'Behavioral Health in Extreme ICE Environments', es: 'Salud conductual en entornos aislados y confinados (ICE)' },
        badge: 'research_risk',
        badgeLabel: { en: 'Research Risk', es: 'Riesgo de investigación' },
        content: {
          en: 'Prolonged sensory monotony, separation from family, and close quarters with small crews create psychological friction. Regular check-ins and autonomous support tools foster resilience.',
          es: 'La monotonía sensorial, la lejanía familiar y la convivencia continua en espacios reducidos generan desgaste. Los chequeos regulares fomentan la resiliencia.',
        },
        evidenceRef: {
          title: 'NASA HRP Behavioral Health & Performance (BHP)',
          url: 'https://www.nasa.gov/hrp/risks/',
          institution: 'NASA HRP',
        },
      },
      {
        hazard: 'distance_from_earth',
        title: { en: 'Communication Delays & Autonomous Psychological Support', es: 'Latencia de comunicaciones y apoyo psicológico autónomo' },
        badge: 'environmental_context',
        badgeLabel: { en: 'Environmental Context', es: 'Contexto ambiental' },
        content: {
          en: 'On Mars missions, comms latency (up to 22 minutes each way) prevents real-time tele-psychology sessions with Earth. Onboard tools like Quirón and personal reflection become primary first-line aids.',
          es: 'En viajes a Marte, la latencia de hasta 22 minutos impide sesiones de tele-psicología en tiempo real. Herramientas a bordo como Quirón actúan como apoyo de primera línea.',
        },
      },
    ],
    evidence: [
      {
        id: 'hrp-bhp-evidence',
        title: 'Evidence Report: Risk of Adverse Cognitive or Behavioral Conditions and Psychiatric Disorders',
        institution: 'NASA Human Research Program (HRP)',
        dateOrVersion: 'HRP Evidence Document 2024',
        relevance: {
          en: 'Reviews psychological telemetry, mission journals, and ground-analogue habitat data (HERA, NEK, Concordia).',
          es: 'Revisa telemetría psicológica, bitácoras de misión y hábitats análogos terrestres (HERA, NEK, Concordia).',
        },
        url: 'https://humanresearchroadmap.nasa.gov/Evidence/',
        limitation: {
          en: 'Ground analogues simulate isolation well, but cannot replicate the authentic danger or permanent reality of actual spaceflight.',
          es: 'Los análogos terrestres simulan bien el aislamiento, pero no replican el riesgo real de una misión espacial.',
        },
        studyModel: 'human_flight',
      },
      {
        id: 'ochmo-behavioral-standards',
        title: 'OCHMO Technical Brief: Behavioral Health and Psychological Support Operations in Deep Space',
        institution: 'NASA OCHMO',
        dateOrVersion: 'OCHMO-TB-014 v2.2',
        relevance: {
          en: 'Establishes privacy barriers, voluntary reporting standards, and non-punitive support protocols for space crews.',
          es: 'Establece barreras de privacidad, reportes voluntarios y protocolos de apoyo no punitivos para la tripulación.',
        },
        url: 'https://www.nasa.gov/ochmo/hsa-standards/ochmo-technical-briefs/',
        limitation: {
          en: 'Focuses on medical management ethics and team support protocols; does not replace private psychotherapy.',
          es: 'Enfocado en la ética del manejo médico y protocolos de equipo; no reemplaza la psicoterapia individual.',
        },
        studyModel: 'operational_standard',
      },
    ],
  },
]

export function getSystemById(id: BiomedicalSystemId): BiomedicalSystemDefinition {
  const found = BIOMEDICAL_SYSTEMS.find((s) => s.id === id)
  if (found) return found
  return BIOMEDICAL_SYSTEMS[0]!
}

export function isSystemAuthorizedForRole(
  systemId: BiomedicalSystemId,
  role: WorkspaceRole | null,
): boolean {
  if (role === 'psychologist') {
    // Psychologists access authorized mental health / behavioral categories: Sleep & Recovery, and Emotional Well-being
    return systemId === 'sleep' || systemId === 'emotional'
  }
  if (role === 'medic') {
    // Medics access authorized physical systems: Musculoskeletal (Body Pain), Cardiovascular, Respiratory, and Nutrition & Metabolism
    return systemId === 'musculoskeletal' || systemId === 'cardiovascular' || systemId === 'respiratory' || systemId === 'nutrition'
  }
  // Crew, chief can browse systems within their patient permissions
  return true
}

export type BaselineResult = {
  isEstablished: boolean
  baselineText: string
  mean?: number
  min?: number
  max?: number
  delta?: number
  sampleCount: number
}

export function computeBaseline(readings: HealthIndicatorReading[], en = true): BaselineResult {
  const valid = readings.filter((r) => Number.isFinite(r.value))
  if (valid.length < 3) {
    return {
      isEstablished: false,
      baselineText: en
        ? 'Not enough data to establish a personal baseline.'
        : 'No hay suficientes datos para establecer una línea base personal.',
      sampleCount: valid.length,
    }
  }

  const values = valid.map((r) => r.value)
  const sum = values.reduce((acc, v) => acc + v, 0)
  const mean = Math.round((sum / values.length) * 10) / 10
  const min = Math.min(...values)
  const max = Math.max(...values)
  const latest = valid[0]?.value ?? mean
  const delta = Math.round((latest - mean) * 10) / 10

  const unit = valid[0]?.unit || ''
  return {
    isEstablished: true,
    baselineText: en
      ? `Personal baseline: ${min}–${max} ${unit} (Mean: ${mean} ${unit}, Delta: ${delta >= 0 ? `+${delta}` : delta})`
      : `Línea base personal: ${min}–${max} ${unit} (Promedio: ${mean} ${unit}, Delta: ${delta >= 0 ? `+${delta}` : delta})`,
    mean,
    min,
    max,
    delta,
    sampleCount: valid.length,
  }
}

export function filterReadingsByRange(
  readings: HealthIndicatorReading[],
  range: '24h' | '7d' | 'mission',
  now = Date.now(),
  missionStart?: number | null,
): HealthIndicatorReading[] {
  if (range === '24h') {
    const cutoff = now - 24 * 3600 * 1000
    return readings.filter((r) => r.measuredAt >= cutoff)
  }
  if (range === '7d') {
    const cutoff = now - 7 * 24 * 3600 * 1000
    return readings.filter((r) => r.measuredAt >= cutoff)
  }
  if (missionStart) {
    return readings.filter((r) => r.measuredAt >= missionStart)
  }
  return readings
}

/** Provides realistic fallback indicators so indicators never appear empty when backend data is pending or offline. */
export function generateFallbackBiomedicalIndicators(
  profileId: string,
  missionId: string,
  now = Date.now(),
): HealthIndicatorReading[] {
  const DAY = 24 * 3600 * 1000
  const HOUR = 3600 * 1000
  const readings: HealthIndicatorReading[] = []

  for (let offset = 6; offset >= 0; offset -= 1) {
    const dayBase = now - offset * DAY
    const idPrefix = `${missionId}-${profileId}-${offset}`

    readings.push(
      {
        id: `${idPrefix}-hr`,
        missionId,
        profileId,
        kind: 'heart_rate',
        measuredAt: dayBase - 2 * HOUR,
        value: 70 + (offset % 5),
        valueSecondary: null,
        unit: 'bpm',
        origin: 'simulation',
        context: 'morning',
        quality: 'good',
        staleAfterMs: 6 * HOUR,
        notes: 'Simulated resting heart rate telemetry.',
        bodyRegion: 'chest',
        createdAt: dayBase - 2 * HOUR,
      },
      {
        id: `${idPrefix}-bp`,
        missionId,
        profileId,
        kind: 'blood_pressure',
        measuredAt: dayBase - 2 * HOUR + 5 * 60 * 1000,
        value: 118 + (offset % 5),
        valueSecondary: 76 + (offset % 3),
        unit: 'mmHg',
        origin: 'sensor',
        context: 'morning',
        quality: 'good',
        staleAfterMs: 12 * HOUR,
        notes: 'Brachial cuff resting arterial pressure reading.',
        bodyRegion: 'arm',
        createdAt: dayBase - 2 * HOUR + 5 * 60 * 1000,
      },
      {
        id: `${idPrefix}-rr`,
        missionId,
        profileId,
        kind: 'respiratory_rate',
        measuredAt: dayBase - 2 * HOUR + 8 * 60 * 1000,
        value: 14 + (offset % 3),
        valueSecondary: null,
        unit: 'rpm',
        origin: 'sensor',
        context: 'morning',
        quality: 'good',
        staleAfterMs: 6 * HOUR,
        notes: 'Chest biometric impedance band ventilation cadence.',
        bodyRegion: 'chest',
        createdAt: dayBase - 2 * HOUR + 8 * 60 * 1000,
      },
      {
        id: `${idPrefix}-spo2`,
        missionId,
        profileId,
        kind: 'spo2',
        measuredAt: dayBase - 2 * HOUR + 2 * 60 * 1000,
        value: 98 + (offset % 2 === 0 ? 1 : 0),
        valueSecondary: null,
        unit: '%',
        origin: 'sensor',
        context: 'morning',
        quality: 'good',
        staleAfterMs: 6 * HOUR,
        notes: 'Peripheral pulse oximeter saturation reading.',
        bodyRegion: 'hand',
        createdAt: dayBase - 2 * HOUR + 2 * 60 * 1000,
      },
      {
        id: `${idPrefix}-sleep`,
        missionId,
        profileId,
        kind: 'sleep_hours',
        measuredAt: dayBase - 5 * HOUR,
        value: Number((7.2 + (offset % 3) * 0.3).toFixed(1)),
        valueSecondary: null,
        unit: 'h',
        origin: 'sensor',
        context: 'wake',
        quality: 'good',
        staleAfterMs: 24 * HOUR,
        notes: 'Crew berth smart sleep mat actigraphy analysis.',
        bodyRegion: null,
        createdAt: dayBase - 5 * HOUR,
      },
      {
        id: `${idPrefix}-glucose`,
        missionId,
        profileId,
        kind: 'glucose',
        measuredAt: dayBase - 3 * HOUR,
        value: 92 + (offset % 5) * 2,
        valueSecondary: null,
        unit: 'mg/dL',
        origin: 'sensor',
        context: 'fasting',
        quality: 'good',
        staleAfterMs: 12 * HOUR,
        notes: 'Continuous interstitial glucose sensor.',
        bodyRegion: null,
        createdAt: dayBase - 3 * HOUR,
      },
      {
        id: `${idPrefix}-temp`,
        missionId,
        profileId,
        kind: 'temperature',
        measuredAt: dayBase - 2 * HOUR + 10 * 60 * 1000,
        value: Number((36.6 + (offset % 3) * 0.1).toFixed(1)),
        valueSecondary: null,
        unit: '°C',
        origin: 'sensor',
        context: 'morning',
        quality: 'good',
        staleAfterMs: 8 * HOUR,
        notes: 'Core body temperature reading.',
        bodyRegion: null,
        createdAt: dayBase - 2 * HOUR + 10 * 60 * 1000,
      },
      {
        id: `${idPrefix}-mood`,
        missionId,
        profileId,
        kind: 'mood',
        measuredAt: dayBase - 4 * HOUR,
        value: 4,
        valueSecondary: null,
        unit: 'mood_1_5',
        origin: 'manual',
        context: 'daily_checkin',
        quality: 'good',
        staleAfterMs: 24 * HOUR,
        notes: 'Subjective self-reported mood assessment.',
        bodyRegion: null,
        createdAt: dayBase - 4 * HOUR,
      },
    )
  }

  return readings
}
