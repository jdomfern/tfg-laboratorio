const { test, expect } = require('@playwright/test');

test.describe('Contacto', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/contacto');
  });
  test('muestra la vista de contacto', async ({ page }) => {
    await expect(page.locator('h2')).toHaveText(/Contacto/i);
    await expect(page.locator('body')).toContainText(/Información de sedes/i);
  });
  test('muestra la sede central', async ({ page }) => {
    await expect(page.locator('body')).toContainText(/Sede central/i);
    await expect(page.locator('body')).toContainText(/Paseo de la Castellana 142, Madrid/i);
    await expect(page.locator('body')).toContainText(/sede@aqualab.com/i);
  });
  test('tiene botones para abrir Google Maps', async ({ page }) => {
    const botonesMaps = page.getByRole('link', { name: /Abrir en Google Maps/i });
    await expect(botonesMaps.first()).toBeVisible();
  });

});