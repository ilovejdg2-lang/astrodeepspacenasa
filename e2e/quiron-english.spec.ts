import { expect, test, type Page } from '@playwright/test'

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL as 'chrome' | undefined })

async function spanishInterface(page: Page) {
  await page.goto('/entrar')
  await page.getByRole('button', { name: 'EN', exact: true }).click()
  await page.getByRole('button', { name: 'Explore as chief', exact: true }).click()
  await page.getByRole('button', { name: 'Enter dashboard', exact: true }).first().click()
  await page.goto('/app/centro')
  await page.getByRole('button', { name: 'ES', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  await page.getByRole('button', { name: 'Open chat with Quirón', exact: true }).click()
}

test('Quirón questions and local answers stay in English with a Spanish interface', async ({ page }) => {
  await spanishInterface(page)
  const chat = page.getByRole('dialog', { name: 'Quirón', exact: true })
  await expect(chat.getByRole('button', { name: 'What information is missing?', exact: true })).toBeVisible()
  await expect(chat.locator('.quiron-suggestions')).not.toContainText(/Qué|información|disponibles/)
  await chat.getByRole('button', { name: 'What resources are available?', exact: true }).click()
  await expect(chat.locator('.quiron-msg.is-bot .quiron-bubble').last()).toContainText('Oximeter')
  await expect(chat.locator('.quiron-msg.is-bot .quiron-bubble').last()).not.toContainText(/Módulo médico|Gabinete|Oxímetro/)
})

test('free-text and care requests explicitly ask the backend for English', async ({ page }) => {
  let locale = ''
  await page.route('**/api/ai/dialogue', async (route) => {
    locale = route.request().postDataJSON().locale
    await route.fulfill({ json: { source: 'model', model: 'fixture', result: { text: 'Hello. How can I help you today?', sources: [] } } })
  })
  await spanishInterface(page)
  const chat = page.getByRole('dialog', { name: 'Quirón', exact: true })
  await chat.getByRole('textbox', { name: 'Message for Quirón' }).fill('hola, quiero conversar')
  await chat.getByRole('button', { name: 'Send message', exact: true }).click()
  await expect(chat.locator('.quiron-msg.is-bot .quiron-bubble').last()).toContainText('Hello.')
  expect(locale).toBe('en')
  await expect(chat.locator('.quiron-msg.is-user .quiron-bubble')).toContainText('hola, quiero conversar')
  await page.reload()
  await page.getByRole('button', { name: 'Open chat with Quirón', exact: true }).click()
  const started = page.waitForRequest((request) => request.method() === 'POST' && /\/missions\/[^/]+\/quiron$/.test(request.url()))
  await page.getByRole('button', { name: 'Physical health', exact: true }).click()
  expect((await started).postDataJSON().locale).toBe('en')
  await expect(page.locator('.quiron-msg.is-bot .quiron-bubble').last()).toContainText('What would you like to talk about')
})
