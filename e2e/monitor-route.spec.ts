import { expect, test } from '@playwright/test'

test('commander can open the shared monitor from its navigation link', async ({ page }) => {
  await page.route('**/api/nasa/**', (route) => route.fulfill({ status: 503, json: { message: 'Unavailable' } }))
  await page.goto('/entrar')
  await page.getByRole('button', { name: 'ES', exact: true }).click()
  await page.getByRole('button', { name: 'Explorar como comandante', exact: true }).click()
  await page.getByRole('button', { name: 'Entrar al tablero', exact: true }).first().click()
  await expect(page).toHaveURL(/\/app$/)
  await page.getByRole('link', { name: 'Monitor', exact: true }).click()
  await expect(page).toHaveURL(/\/app\/monitor$/)
  await expect(page.locator('.monitor-card')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: 'Elena Torres' })).toBeVisible()
})
