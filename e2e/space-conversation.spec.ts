import { expect, test, type Page } from '@playwright/test'
async function openSpace(page: Page, person = 'elena-torres', pin = '1001') {
  await page.goto('/app/tripulacion', { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('backend-mode')).toHaveText('NestJS conectado')
  const role = page.locator(`input[name="simulated-role"][value="astronaut:${person}"]`)
  await role.click()
  await expect(role).toBeChecked()
  await page
    .getByRole('link', { name: /^(My space|Mi espacio)$/ })
    .first()
    .click()
  await page.getByTestId('space-page-pin').fill(pin)
  await page.getByRole('button', { name: 'Abrir sesión simulada' }).click()
  await expect(page.getByTestId('space-draft')).toBeVisible()
}
async function mockAccess(page: Page) {
  await page.route('**/api/space/access', (route) =>
    route.fulfill({
      json:
        route.request().method() === 'DELETE'
          ? { revoked: true }
          : {
              token: 'a'.repeat(64),
              expiresAt: Date.now() + 600000,
              simulated: true,
            },
    }),
  )
}
const answer = (text: string) => ({
  source: 'model',
  model: 'fixture',
  result: {
    respuesta: text,
    nivel: 'equipo',
    vistaPrevia: 'Should not replace preview',
    humanReviewRequired: true,
  },
  toolsUsed: [{ name: 'getSupportOptions', status: 'ok' }],
})
test('model consent, short-term memory, levels and local continuity', async ({
  page,
}) => {
  const bodies: Record<string, unknown>[] = []
  await mockAccess(page)
  await page.route('**/api/ai/space', (route) => {
    bodies.push(route.request().postDataJSON() as Record<string, unknown>)
    return route.fulfill({
      json: answer(
        bodies.length === 1
          ? 'I hear your loneliness.'
          : 'You mentioned missing home earlier.',
      ),
    })
  })
  await openSpace(page)
  await page.getByTestId('space-draft').fill('I feel stressed')
  await page.getByRole('button', { name: /^(Talk|Conversar)$/ }).click()
  await expect(
    page.locator('.bubble.user').filter({ hasText: 'I feel stressed' }),
  ).toHaveCount(1)
  expect(bodies).toHaveLength(0)
  await page.getByTestId('space-model-consent').check()
  await page.getByTestId('space-history-consent').check()
  await page.getByRole('button', { name: /^(Only me|Solo yo)$/ }).click()
  await page.getByTestId('space-draft').fill('I miss home and feel lonely')
  await page.getByRole('button', { name: /^(Talk|Conversar)$/ }).click()
  await expect(
    page
      .locator('.bubble.assistant, .bubble:not(.user)')
      .filter({ hasText: 'I hear your loneliness.' }),
  ).toHaveCount(1)
  expect(bodies[0]?.history).toEqual([])
  await expect(
    page.getByRole('button', { name: /^(Only me|Solo yo)$/ }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('space-send')).toBeDisabled()
  await page.getByTestId('space-draft').fill('That is still difficult')
  await page.getByRole('button', { name: /^(Talk|Conversar)$/ }).click()
  await expect(
    page.getByText('You mentioned missing home earlier.', { exact: true }),
  ).toBeVisible()
  expect(bodies[1]?.history).toEqual([
    { role: 'user', content: 'I miss home and feel lonely' },
    { role: 'assistant', content: 'I hear your loneliness.' },
  ])
  expect(bodies[1]?.selectedLevel).toBe('solo_yo')
  await page.getByTestId('space-model-consent').uncheck()
  await page.route('**/api/ai/**', (route) => route.abort())
  await page.getByTestId('space-draft').fill('I would rather not talk')
  await page.getByRole('button', { name: /^(Talk|Conversar)$/ }).click()
  await expect(page.locator('.bubble:not(.user)').last()).toContainText(
    'do not need to explain',
  )
})

test('cancellation discards late replies and preserves the chosen privacy level', async ({
  page,
}) => {
  await mockAccess(page)
  let release!: () => void
  const wait = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/api/ai/space', async (route) => {
    await wait
    await route
      .fulfill({ json: answer('LATE REPLY MUST NOT APPEAR') })
      .catch(() => undefined)
  })
  await openSpace(page)
  await page.getByTestId('space-model-consent').check()
  await page.getByRole('button', { name: /^(Only me|Solo yo)$/ }).click()
  await page.getByTestId('space-draft').fill('I feel lonely')
  await page.getByRole('button', { name: /^(Talk|Conversar)$/ }).click()
  await expect(
    page.getByRole('button', { name: /Cancel response|Cancelar respuesta/ }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: /Cancel response|Cancelar respuesta/ })
    .click()
  release()
  await expect(
    page.getByRole('status').filter({ hasText: /Canceled|Cancelado/ }),
  ).toBeVisible()
  await expect(
    page.getByText('LATE REPLY MUST NOT APPEAR', { exact: true }),
  ).toHaveCount(0)
  await expect(
    page.locator('.bubble.user').filter({ hasText: 'I feel lonely' }),
  ).toHaveCount(1)
  await expect(
    page.getByRole('button', { name: /^(Only me|Solo yo)$/ }),
  ).toHaveAttribute('aria-pressed', 'true')
  await page
    .getByRole('link', { name: /^(Crew|Tripulación)$/ })
    .first()
    .click()
  const mateo = page.locator('input[name="simulated-role"][value="astronaut:mateo-ruiz"]')
  await mateo.click()
  await expect(mateo).toBeChecked()
  await page
    .getByRole('link', { name: /^(My space|Mi espacio)$/ })
    .first()
    .click()
  await page.getByTestId('space-page-pin').fill('1002')
  await page.getByRole('button', { name: 'Abrir sesión simulada' }).click()
  await expect(page.getByTestId('space-draft')).toBeVisible()
  await expect(
    page.locator('.bubble.user').filter({ hasText: 'I feel lonely' }),
  ).toHaveCount(0)
  await expect(page.getByTestId('space-model-consent')).not.toBeChecked()
})
