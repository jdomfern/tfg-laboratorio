const { test, expect } = require('@playwright/test');
// Login para autenticarse
async function hacerLogin(page) {
  await page.goto('/login');
  await page.fill('#email', 'test@aqualab.com'); 
  await page.fill('#password', 'testprueba'); 
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page).toHaveURL('http://localhost:3000/');
}
test.describe('Consulta de muestras', () => {
  test.beforeEach(async ({ page }) => {
    await hacerLogin(page);
    await page.goto('/consult');
  });
  test('muestra la pantalla de consulta', async ({ page }) => {
    await expect(page.locator('h2')).toHaveText(/Consulta/i);
    await expect(page.getByRole('button', { name: /mostrar todas/i })).toBeVisible();
    await expect(page.locator('input[name="codigo"]')).toBeVisible();
    await expect(page.locator('#busquedaRapida')).toBeVisible();
  });
  test('permite mostrar todas las muestras', async ({ page }) => {
    await page.getByRole('button', { name: /mostrar todas/i }).click();
    await expect(page).toHaveURL(/mostrar_todas=1/i);
  });
  test('permite buscar por código', async ({ page }) => {
    await page.fill('input[name="codigo"]', 'TEST'); 
    await page.getByRole('button', { name: /buscar/i }).click();
    await expect(page).toHaveURL(/codigo=/i);
  });
  test('muestra la tabla de resultados', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('thead')).toContainText(/Proyecto/i);
    await expect(page.locator('thead')).toContainText(/Código/i);
  });

});