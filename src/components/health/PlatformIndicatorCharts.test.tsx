// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { platformApi } from '../../platform/api'
import { PlatformIndicatorCharts } from './PlatformIndicatorCharts'

const locale = vi.hoisted(() => ({ lang: 'en' as 'en' | 'es' }))

vi.mock('../../i18n', () => ({
  useLocale: () => ({ lang: locale.lang }),
}))

vi.mock('../../platform/api', () => ({
  platformApi: {
    listIndicators: vi.fn(),
  },
}))

const listIndicators = vi.mocked(platformApi.listIndicators)

describe('PlatformIndicatorCharts', () => {
  beforeEach(() => {
    locale.lang = 'en'
    listIndicators.mockReset()
  })

  it('shows a localized error instead of an empty-data message when loading fails', async () => {
    listIndicators.mockRejectedValue(new Error('No se pudo cargar ahora. Probá de nuevo en un momento.'))

    render(<PlatformIndicatorCharts missionId="mission-1" />)

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Platform indicators could not be loaded. Check your connection and try again.')
    expect(screen.queryByText('No platform indicators to chart yet.')).toBeNull()
  })

  it('retries the request and shows the empty state only after a successful response', async () => {
    listIndicators
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce({ items: [] })

    render(<PlatformIndicatorCharts missionId="mission-1" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('No platform indicators to chart yet.')).toBeTruthy()
    await waitFor(() => expect(listIndicators).toHaveBeenCalledTimes(2))
  })
})
