import { expect, test, type Page } from '@playwright/test'

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL as 'chrome' | undefined })

async function enter(page: Page, role = 'chief') {
  await page.goto('/entrar')
  await page.getByRole('button', { name: 'EN', exact: true }).click()
  await page.getByRole('button', { name: `Explore as ${role}`, exact: true }).click()
  await page.getByRole('button', { name: 'Enter dashboard', exact: true }).first().click()
  await page.goto('/app/centro')
}

test('mission center links to the only checklist and preserves the locked post-takeoff view', async ({ page }) => {
  await enter(page)
  await expect(page.locator('.chief-launch-list')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Mission status', exact: true })).toHaveCount(0)
  await page.getByTestId('open-mission-checklist').click()
  await expect(page).toHaveURL(/recursos\?tab=checklist$/)
  await expect(page.getByRole('tab', { name: 'Checklist', exact: true })).toHaveAttribute('aria-selected', 'true')
  const checklist = page.getByTestId('mission-checklist')
  await expect(checklist).toContainText('permanently closed after takeoff')
  await expect(checklist.locator('.resources-checklist-snapshot')).toContainText('Hygiene supplies')
  await expect(checklist.getByRole('checkbox')).toHaveCount(0)
  await page.reload()
  await expect(page.getByTestId('mission-checklist')).toBeVisible()
  await page.getByRole('tab', { name: 'Equipment', exact: true }).click()
  await expect(page.getByTestId('mission-checklist')).toHaveCount(0)
  await expect(page.locator('.inv-table')).toBeVisible()
  await page.goBack()
  await expect(page.getByTestId('mission-checklist')).toBeVisible()
  await page.goto('/app/mision')
  await expect(page.locator('[id^="prep-status-"]')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Open checklist in Resources' })).toHaveAttribute('href', '/app/recursos?tab=checklist')
})

test('a crew member sees the checklist without chief controls', async ({ page }) => {
  await enter(page, 'crew')
  await page.goto('/app/recursos?tab=checklist')
  const checklist = page.getByTestId('mission-checklist')
  await expect(checklist).toContainText('Read-only checklist')
  await expect(checklist.getByRole('button', { name: /take off|End mission|Save plan/i })).toHaveCount(0)
  await expect(checklist.locator('.resources-checklist-snapshot')).toBeVisible()
})
