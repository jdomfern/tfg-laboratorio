const { test, expect } = require('@playwright/test');

test.describe('Recuperar contraseña', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot');
  });
  test('muestra la pantalla de recuperar contraseña', async ({ page }) => {
    await expect(page.locator('text=Recuperar contraseña')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enviar' })).toBeVisible();
  });
  test('permite escribir un email en el formulario', async ({ page }) => {
    const campoEmail = page.locator('input[name="email"]');
    await campoEmail.fill('usuario@aqualab.com');
    await expect(campoEmail).toHaveValue('usuario@aqualab.com');
  });
  test('muestra error si el email no existe', async ({ page }) => {
    await page.locator('input[name="email"]').fill('noexiste@aqualab.com');
    await page.getByRole('button', { name: 'Enviar' }).click();
    await expect(page.locator('.alert-danger')).toBeVisible();
    await expect(page.locator('.alert-danger')).toContainText('Ese email no existe');
  });
  test('muestra mensaje correcto si el email existe', async ({ page }) => {
    await page.locator('input[name="email"]').fill('test@aqualab.com');
    await page.getByRole('button', { name: 'Enviar' }).click();
    await expect(page.locator('.alert-success')).toBeVisible();
    await expect(page.locator('.alert-success')).toContainText('Contraseña de un único uso');
    await expect(page.locator('.alert-success a')).toHaveAttribute('href', '/reset');
  });
  test('el enlace para cambiar contraseña apunta a /reset', async ({ page }) => {
    await page.locator('input[name="email"]').fill('test@aqualab.com');
    await page.getByRole('button', { name: 'Enviar' }).click();
    const enlaceReset = page.locator('.alert-success a');
    await expect(enlaceReset).toBeVisible();
    await expect(enlaceReset).toHaveAttribute('href', '/reset');
  });
});