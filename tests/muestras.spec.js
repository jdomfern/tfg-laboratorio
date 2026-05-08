const { test, expect } = require('@playwright/test');

// Login para autenticarse
async function hacerLogin(page) {
  await page.goto('/login');
  await page.fill('#email', 'test@aqualab.com'); 
  await page.fill('#clave', 'testprueba'); 
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page).toHaveURL('http://localhost:3000/');
}
test.describe('Nueva muestra', () => {
  test.beforeEach(async ({ page }) => {
    await hacerLogin(page);
    await page.goto('/nueva');
  });
  test('muestra la pantalla de nueva muestra', async ({ page }) => {
    await expect(page.locator('h4')).toHaveText(/Nueva muestra/i);
    await expect(page.locator('#proyectoId')).toBeVisible();
    await expect(page.locator('#codigo')).toBeVisible();
    await expect(page.locator('#fecha_hora')).toBeVisible();
    await expect(page.locator('#temperatura_agua')).toBeVisible();
    await expect(page.locator('#pH')).toBeVisible();
    await expect(page.locator('#oxigeno_agua')).toBeVisible();
    await expect(page.locator('#conductividad')).toBeVisible();
    await expect(page.locator('#observaciones')).toBeVisible();
    await expect(page.locator('#foto')).toBeVisible();
    await expect(page.getByRole('button', { name: /guardar/i })).toBeVisible();
  });
  test('deja escribir los campos de una muestra', async ({ page }) => {
    await page.selectOption('#proyectoId', { label: 'Guadalquivir' });
    await page.fill('#codigo', `TEST-${Date.now()}`);
    await page.fill('#fecha_hora', '2026-04-13T12:30');
    await page.fill('#temperatura_agua', '18.5');
    await page.fill('#pH', '7.20');
    await page.fill('#oxigeno_agua', '91.50');
    await page.fill('#conductividad', '450.20');
    await page.fill('#observaciones', 'Muestra caso de prueba');
    await expect(page.locator('#proyectoId')).toHaveValue('1');
    await expect(page.locator('#observaciones')).toHaveValue('Muestra caso de prueba');
  });
  test('permite crear una muestra nueva', async ({ page }) => {
    const codigoUnico = `TEST-${Date.now()}`;
    await page.selectOption('#proyectoId', { label: 'Guadalquivir' });
    await page.fill('#codigo', codigoUnico);
    await page.fill('#fecha_hora', '2026-04-13T12:30');
    await page.fill('#temperatura_agua', '18.5');
    await page.fill('#pH', '7.20');
    await page.fill('#oxigeno_agua', '91.50');
    await page.fill('#conductividad', '450.20');
    await page.fill('#observaciones', 'Alta de muestra de prueba');
    await page.getByRole('button', { name: /guardar/i }).click();
    await expect(page).toHaveURL(/consult\?success=created/i);
    await expect(page.locator('.alert-success')).toContainText(/Muestra creada/i);
  });
  test('tiene botón para volver a consulta', async ({ page }) => {
    await expect(page.getByRole('link', { name: /volver/i })).toHaveAttribute('href', '/consult');
  });

});