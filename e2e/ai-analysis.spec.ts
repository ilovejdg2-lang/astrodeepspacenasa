import { expect, test, type Page } from '@playwright/test'
import type { AnalysisContextInput } from '../shared/aiSchema'

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL as 'chrome' | undefined })

async function openAnalysis(page: Page) {
  await page.route('**/api/nasa/**', (route) => route.fulfill({ status: 503, json: { message: 'Unavailable' } }))
  await page.goto('/entrar')
  await page.getByRole('button', { name: 'EN', exact: true }).click()
  await page.getByRole('button', { name: 'Explore as Mission Commander', exact: true }).click()
  await page.getByRole('button', { name: 'Enter dashboard', exact: true }).first().click()
  await page.goto('/app/analisis')
  await expect(page.getByTestId('run-ai-analysis')).toBeVisible()
}

function answer(context: AnalysisContextInput, refId = context.measurements[0]!.id) {
  return { model: 'fixture-model', result: {
    summary: 'Quirón reviewed the available measurements and symptoms. Human follow-up is required.',
    evidence: [{ statement: 'A recent heart-rate reading is available.', refType: 'measurement', refId }],
    missing: ['A new resting control is needed.'], questions: ['When did symptoms begin?'],
    checks: [{ title: 'Confirm symptoms', protocolId: context.protocols[0]!.id, why: 'Check the person’s report.' }],
    resources: [], humanReviewRequired: true,
    limitations: ['This is not a diagnosis.'], sources: ['NASA HRP Evidence'],
  } }
}

test('analysis runs only on click, uses current data, persists and becomes stale after a new reading', async ({ page }) => {
  const requests: AnalysisContextInput[] = []
  await page.route('**/api/ai/analyze', async (route) => {
    const context = route.request().postDataJSON() as AnalysisContextInput
    requests.push(context)
    await route.fulfill({ json: answer(context) })
  })
  await openAnalysis(page)
  await expect(page.getByTestId('analysis-result')).toHaveCount(0)
  await expect(page.getByTestId('analysis-local')).toHaveCount(0)
  expect(requests).toHaveLength(0)
  await page.getByTestId('run-ai-analysis').click()
  const result = page.getByTestId('analysis-result')
  await expect(result).toContainText('Quirón reviewed the available measurements')
  await expect(page.getByTestId('run-ai-analysis')).toBeEnabled()
  expect(requests).toHaveLength(1)
  expect(requests[0]).toMatchObject({ crewId: 'elena-torres', locale: 'en' })
  expect(requests[0]!.measurements.length).toBeGreaterThan(0)
  expect(requests[0]!.symptoms.length).toBeGreaterThan(0)
  await page.screenshot({ path: 'test-results/ai-analysis-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.locator('.an-page').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/ai-analysis-mobile.png', fullPage: true })
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.reload()
  await expect(page.getByTestId('analysis-result')).toContainText('Quirón reviewed the available measurements')
  expect(requests).toHaveLength(1)
  await page.goto('/app/tripulacion/elena-torres')
  await page.getByTestId('open-repeat').click()
  await page.getByTestId('rest-check').check()
  const recorded = page.waitForResponse((response) => response.request().method() === 'POST' && response.url().endsWith('/api/simulation/actions') && response.request().postDataJSON()?.action?.type === 'repeatMeasurement')
  await page.getByTestId('save-repeat').click()
  expect((await recorded).ok()).toBe(true)
  await page.goto('/app/analisis')
  await expect(page.getByTestId('analysis-result')).toContainText('The data changed after this analysis')
})

test('invalid AI references are rejected and the user can retry', async ({ page }) => {
  let calls = 0
  await page.route('**/api/ai/analyze', async (route) => {
    calls += 1
    const context = route.request().postDataJSON() as AnalysisContextInput
    await route.fulfill({ json: answer(context, calls === 1 ? 'invented-measurement' : context.measurements[0]!.id) })
  })
  await openAnalysis(page)
  await page.getByTestId('run-ai-analysis').click()
  await expect(page.getByRole('alert')).toContainText('could not be validated')
  await expect(page.getByTestId('analysis-result')).toHaveCount(0)
  await page.getByTestId('run-ai-analysis').click()
  await expect(page.getByTestId('analysis-result')).toBeVisible()
  expect(calls).toBe(2)
})

test('cancelled responses are not displayed or recorded', async ({ page }) => {
  let release!: () => void
  const gate = new Promise<void>((resolve) => { release = resolve })
  await page.route('**/api/ai/analyze', async (route) => {
    const context = route.request().postDataJSON() as AnalysisContextInput
    await gate
    await route.fulfill({ json: answer(context) }).catch(() => undefined)
  })
  await openAnalysis(page)
  const started = page.waitForRequest('**/api/ai/analyze')
  await page.getByTestId('run-ai-analysis').click()
  await started
  await expect(page.getByTestId('run-ai-analysis')).toBeDisabled()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  release()
  await expect(page.getByRole('alert')).toContainText('Analysis cancelled')
  await expect(page.getByTestId('analysis-result')).toHaveCount(0)
  await expect(page.getByTestId('run-ai-analysis')).toBeEnabled()
})
