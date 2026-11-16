import { expect, test } from '@playwright/test'

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL as 'chrome' | undefined })

test('English covers dashboard, seeded checklist, risk library and dialogs', async ({ page }) => {
  test.setTimeout(150000)
  await page.route('**/api/nasa/**', (route) => route.fulfill({ status: 503, json: { message: 'Unavailable' } }))
  // Show preparation using the existing Spanish seed, without changing mission state.
  await page.route('**/api/platform/missions/mission-helios-demo', async (route) => {
    const response = await route.fetch()
    const data = await response.json()
    data.mission.stage = 'preflight'
    await route.fulfill({ response, json: data })
  })
  await page.goto('/entrar')
  await page.getByRole('button', { name: 'EN', exact: true }).click()
  await page.getByRole('button', { name: 'Explore as Mission Commander', exact: true }).click()
  await page.getByRole('button', { name: 'Enter dashboard', exact: true }).first().click()
  const spanish = /Hábitat orbital|Sin completar|Pendiente de revisión|Cargado y verificado|Protección de la nave|Gabinete [AB]|Módulo médico|Estado de |Autorreporte incluido|Repetir medición|Preparación HELIOS/
  for (const path of ['/app/centro', '/app/tripulacion', '/app/tripulacion/mateo-ruiz', '/app/alertas', '/app/recursos', '/app/recursos?tab=checklist', '/app/historial', '/app/analisis', '/app/medico', '/app/mision', '/app/riesgos', '/app/mi-salud', '/misiones', '/misiones/evidencia']) {
    await page.goto(path)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.locator('main, .plat').first()).toBeVisible()
    await expect(page.locator('body')).not.toContainText(spanish)
    if (path === '/app/centro') {
      await expect(page.getByRole('heading', { name: 'Prepare & take off' })).toHaveCount(0)
      await expect(page.getByTestId('open-mission-checklist')).toHaveAttribute('href', '/app/recursos?tab=checklist')
    }
    if (path === '/app/recursos?tab=checklist') {
      await expect(page.getByRole('heading', { name: 'Prepare & take off' })).toBeVisible()
      await expect(page.locator('.chief-launch-list')).toContainText('Hygiene supplies')
      await expect(page.locator('.chief-launch-list')).not.toContainText(/higiene|evaluación|Consumibles/)
    }
    if (path === '/app/recursos') {
      await expect(page.getByRole('tab', { name: 'Protocols', exact: true })).toHaveCount(0)
      await expect(page.getByRole('tab', { name: 'Equipment', exact: true })).toBeVisible()
    }
    if (path === '/app/riesgos') {
      await page.getByRole('tab', { name: 'Risk cards', exact: true }).click()
      await expect(page.locator('.risks-brief-list')).toContainText('Kidney stones')
      await expect(page.locator('.risks-brief-list')).not.toContainText(/La microgravedad|Exposición|La nutrición/)
    }
  }
  await page.goto('/app/mision')
  await page.getByRole('button', { name: 'ES', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Datos de la misión' })).toBeVisible()
  await page.getByRole('button', { name: 'EN', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Mission data' })).toBeVisible()
  await expect(page.locator('body')).not.toContainText(spanish)
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})

const ROLE_ENTER = {
  crew: 'Explore as Crew Member',
  medic: 'Explore as Physician',
  psychologist: 'Explore as Psychologist',
} as const

for (const role of ['crew', 'medic', 'psychologist'] as const) {
  test(`English is used in the ${role} workspace and personal health forms`, async ({ page }) => {
    await page.goto('/entrar')
    await page.getByRole('button', { name: 'EN', exact: true }).click()
    await page.getByRole('button', { name: ROLE_ENTER[role], exact: true }).click()
    await page.getByRole('button', { name: 'Enter dashboard', exact: true }).first().click()
    await page.goto('/app/centro')
    await expect(page.locator('main')).toBeVisible()
    if (role === 'crew') {
      await expect(page).toHaveURL(/\/app\/mi-salud$/)
      await expect(page.getByRole('navigation', { name: 'Sections', exact: true })).toContainText('My Health')
      await expect(page.getByRole('navigation', { name: 'Sections', exact: true })).not.toContainText('My day')
    }
    await expect(page.locator('main')).not.toContainText(/Hábitat orbital|Sin completar|Sin permiso|Chequeo pendiente|Mesa Ops/)
    await page.goto('/app/mi-salud')
    await expect(page.locator('main')).toContainText('My Health')
    await expect(page.locator('main')).not.toContainText(/Sin completar|Pendiente|Misión demo/)
  })
}
