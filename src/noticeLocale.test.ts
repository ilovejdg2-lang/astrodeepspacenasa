import { describe, expect, it } from 'vitest'
import { noticeText } from './noticeLocale'

describe('server notice display locale', () => {
  it('localizes server notices without requiring a new backend action', () => {
    const spanish = 'Uso de equipo reutilizable. Las unidades no se descuentan.'
    const english = noticeText(spanish, 'en')
    expect(english).toBe('Reusable equipment use. Units are not deducted.')
    expect(noticeText(english, 'es')).toBe(spanish)
    expect(noticeText('Borrador guardado. Todavía no está en cola ni fue enviado.', 'en')).toContain('Draft saved')
    expect(noticeText('El mensaje quedó en cola. Aún no fue enviado.', 'en')).toContain('The message is queued')
  })
  it('keeps unrecognized messages intact', () => {
    expect(noticeText('Nota personal, conservar exactamente.', 'en')).toBe('Nota personal, conservar exactamente.')
  })
  it('localizes a blocked mission-stage transition', () => {
    const spanish = 'No se puede pasar a posmisión mientras haya episodios abiertos. La etapa actual se conserva.'
    const english = 'The mission cannot move to Completed while health episodes are open. The current stage is unchanged.'
    expect(noticeText(spanish, 'en')).toBe(english)
    expect(noticeText(english, 'es')).toBe(spanish)
  })
})
