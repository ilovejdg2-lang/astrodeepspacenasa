import type { Alert, AlertType } from '../../shared/types'

export function alertKindLabel(type: AlertType, title: string, en: boolean): string {
  if (type === 'missing') return en ? 'Data not received' : 'Datos no recibidos'
  if (type === 'change') return en ? 'Change in signs' : 'Cambio de signos'
  if (type === 'symptom') return en ? 'Reported symptoms' : 'Síntomas reportados'
  if (type === 'quality') return en ? 'Data quality' : 'Calidad de datos'
  if (type === 'repeated') return en ? 'Repeated readings' : 'Lecturas repetidas'
  if (type === 'altered') return en ? 'Altered packet' : 'Paquete alterado'
  if (type === 'comms') return en ? 'Earth link' : 'Enlace con Tierra'
  return title
}

export function alertReasonLabel(
  alert: Pick<Alert, 'type' | 'reason'>,
  crewName: string | undefined,
  en: boolean,
): string {
  const who = crewName?.trim() || (en ? 'This crew member' : 'Esta persona')
  switch (alert.type) {
    case 'missing':
      return en
        ? `${who} has no recent reliable measurement. Baseline review required.`
        : `${who} no tiene una medición confiable reciente. Se requiere revisión de línea base.`
    case 'change':
      return en
        ? 'Heart rate is above baseline. A resting control measurement is still missing.'
        : 'La frecuencia cardíaca está por encima de su línea base. Falta una medición de control en reposo.'
    case 'symptom':
      return en
        ? 'There is a self-report pending human review.'
        : 'Hay un autorreporte pendiente de revisión humana.'
    case 'quality':
    case 'repeated':
      return en
        ? 'Identical values across 3 consecutive readings. Sensor signal verification is required. Not interpreted as an attack.'
        : 'Valores idénticos en 3 lecturas consecutivas. Se requiere verificación de la señal del sensor. No se interpreta como un ataque.'
    case 'altered':
      return en
        ? 'Data packet anomaly detected. Sensor checksum validation required.'
        : 'Anomalía en paquete de datos. Se requiere validación de suma de verificación del sensor.'
    case 'comms':
      return en
        ? 'The local core remains available. Queued messages have not been delivered.'
        : 'El núcleo local sigue disponible. Los mensajes en cola no se han entregado.'
    default:
      return localizeStoredReason(alert.reason, en)
  }
}

/** Map known Spanish seed strings when UI is English (and the reverse for older English seeds). */
function localizeStoredReason(reason: string, en: boolean): string {
  if (!reason) return ''
  if (
    reason.includes('Valores idénticos') ||
    reason.includes('Identical values') ||
    reason.includes('ataque') ||
    reason.includes('attack') ||
    reason.includes('lecturas consecutivas')
  ) {
    return en
      ? 'Identical values across 3 consecutive readings. Sensor signal verification is required. Not interpreted as an attack.'
      : 'Valores idénticos en 3 lecturas consecutivas. Se requiere verificación de la señal del sensor. No se interpreta como un ataque.'
  }
  const pairs: Array<[string, string]> = [
    [
      'Sofía Chen no tiene una medición confiable reciente. Eso no se lee como un estado estable.',
      'Sofía Chen has no recent reliable measurement. That does not read as a stable state.',
    ],
    [
      'Mateo Ruiz no tiene una medición confiable reciente. Eso no se lee como un estado estable.',
      'Mateo Ruiz has no recent reliable measurement. That does not read as a stable state.',
    ],
    [
      'Elena Torres no tiene una medición confiable reciente. Eso no se lee como un estado estable.',
      'Elena Torres has no recent reliable measurement. That does not read as a stable state.',
    ],
    [
      'Alex Morgan no tiene una medición confiable reciente. Eso no se lee como un estado estable.',
      'Alex Morgan has no recent reliable measurement. That does not read as a stable state.',
    ],
    [
      'La frecuencia cardíaca está por encima de su línea base. Falta una medición de control en reposo.',
      'Heart rate is above baseline. A resting control measurement is still missing.',
    ],
    [
      'No hay lecturas recientes de Elena Torres. La ausencia no se interpreta como normalidad.',
      'There are no recent readings for Elena Torres. Absence is not interpreted as normal.',
    ],
    [
      'El núcleo local sigue disponible. Los mensajes en cola no se han entregado.',
      'The local core remains available. Queued messages have not been delivered.',
    ],
    [
      'Hay un autorreporte pendiente de revisión humana.',
      'There is a self-report pending human review.',
    ],
  ]
  for (const [es, english] of pairs) {
    if (en && reason === es) return english
    if (!en && reason === english) return es
  }
  return reason
}
