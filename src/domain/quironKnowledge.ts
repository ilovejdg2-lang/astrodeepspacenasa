/** General explanations contain no session records and require no data permission. */
export function generalQuironExplanation(question: string, en: boolean): string | undefined {
  const q = question.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
  // Requests for actual records must keep going through the authorized context.
  if (/\b(mi|mis|my|our|nuestro|actual|actuales|current|latest|ultima|ultimo|elena|marco|sofia)\b/.test(q)) return undefined
  const explanatory = /que (es|son|significa|mide)|como (funciona|se)|por que|what (is|are|does)|how (does|do)|why|explica|explain|diferencia|difference/.test(q)
  if (!explanatory) return undefined
  if (/alert/.test(q)) return en
    ? 'An alert flags something worth reviewing; it is not a diagnosis. In HELIOS, the deterministic engine evaluates simulated data. Review the reading, its time and sensor quality before interpreting a change.'
    : 'Una alerta señala algo que conviene revisar; no es un diagnóstico. En HELIOS el motor determinista evalúa datos simulados. Para entender un cambio, se revisan la medición, su antigüedad y la calidad del sensor.'
  if (/sensor|calidad|quality|integridad|integrity/.test(q)) return en
    ? 'Sensor quality describes how usable a signal is. Age tells you when it was measured, while integrity concerns message validation. A recent reading can still have poor quality; these checks answer different questions.'
    : 'La calidad del sensor describe qué tan aprovechable es la señal. La antigüedad indica cuándo se midió y la integridad se refiere a la validación del mensaje. Una lectura reciente puede tener mala calidad: son comprobaciones distintas.'
  if (/linea base|baseline/.test(q)) return en
    ? 'A baseline is an individual reference for comparison. A change from it deserves context: when the reading was taken, how reliable it is and whether other observations support it. A difference alone does not explain its cause.'
    : 'La línea base es una referencia individual para comparar mediciones. Un cambio necesita contexto: cuándo se midió, qué tan confiable es la lectura y si hay otras observaciones que lo acompañen. La diferencia por sí sola no explica la causa.'
  if (/pulso|frecuencia cardiaca|heart rate|pulse/.test(q)) return en
    ? 'Heart rate is the number of heartbeats per minute. HELIOS compares simulated readings with an individual baseline and checks their quality and age. One value alone does not explain why it changed.'
    : 'La frecuencia cardíaca es el número de latidos por minuto. HELIOS compara las lecturas simuladas con una referencia individual y revisa su calidad y antigüedad. Un valor aislado no explica por qué cambió.'
  if (/medici|measurement|indicador|indicator/.test(q)) return en
    ? 'An indicator summarizes an observation, such as heart rate or hours of sleep. In HELIOS these are simulated readings: their time, quality and context matter as much as the number. Explaining an indicator does not require access to personal records.'
    : 'Un indicador resume una observación, como el pulso o las horas de sueño. En HELIOS las mediciones son simuladas: su momento, calidad y contexto importan tanto como el número. Explicar un indicador no requiere abrir registros personales.'
  if (/body pain|pain|dolor|musculoesquelet|musculoskelet|lumbar|espalda|spine|columna|back/.test(q)) return en
    ? 'In microgravity, intervertebral spinal discs expand due to the absence of axial loading, elongating the spine by ~5–7 cm. Over 70% of astronauts report mild-to-moderate low back stiffness and ache during early flight. For a clinical check-in, prepare: 1) exact anatomical site and onset time, 2) correlation with exercise/countermeasures, 3) pain rating (1–10) and whether it radiates, and 4) any neurological red flags (numbness, weakness).'
    : 'En microgravedad, los discos intervertebrales se expanden por la falta de carga axial, elongando la columna entre 5 y 7 cm. Más del 70% de los astronautas reportan rigidez y dolor lumbar durante las primeras fases de adaptación. Para preparar una consulta clínica, conviene tener listo: 1) ubicación anatómica exacta e inicio, 2) relación con ejercicio o contramedidas, 3) escala de intensidad (1 al 10) y si se irradia, y 4) señales de alerta (adormecimiento o debilidad).'
  if (/check-in|consulta|appointment|cita|prepar.*pregunt|questions.*prepar/.test(q)) return en
    ? 'When preparing for a spaceflight clinical check-in: clarify whether the need is medical (physical systems) or psychological (emotional wellbeing/sleep), record timeline and onset factors, gather relevant indicator readings, and prepare questions about workload or countermeasure adjustments.'
    : 'Al preparar una consulta clínica espacial: clarificar si corresponde a medicina (sistemas físicos) o psicología (bienestar/sueño), registrar el momento de inicio y factores desencadenantes, revisar lecturas de indicadores y formular dudas sobre adaptación operativa.'
  return undefined
}
