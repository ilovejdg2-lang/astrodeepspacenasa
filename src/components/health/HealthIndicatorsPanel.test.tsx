// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HealthIndicatorsPanel } from './HealthIndicatorsPanel'

const locale = vi.hoisted(() => ({ lang: 'es' as 'en' | 'es' }))

vi.mock('../../i18n', () => ({
  useLocale: () => ({ lang: locale.lang }),
}))

describe('HealthIndicatorsPanel', () => {
  afterEach(cleanup)

  beforeEach(() => {
    cleanup()
    locale.lang = 'es'
  })

  it('keeps indicator logging while hiding status cards and reading history', () => {
    render(<HealthIndicatorsPanel missionId="mission-1" />)

    expect(screen.getByRole('heading', { name: 'Registrar indicadores' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Tarjetas de estado' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Lecturas recientes' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Cargar datos demo de alerta' })).toBeNull()
  })
})
