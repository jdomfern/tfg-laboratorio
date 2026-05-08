const { test, expect } = require('@playwright/test');

test.describe('Reset de contraseña', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/reset');
  });
  test('muestra la pantalla de cambiar contraseña', async ({ page }) => {
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="token"]')).toBeVisible();
    await expect(page.locator('input[name="new_password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /cambiar contraseña/i })).toBeVisible();
  });
  test('deja escribir email, token y nueva contraseña', async ({ page }) => {
    await page.locator('input[name="email"]').fill('test@aqualab.com');
    await page.locator('input[name="token"]').fill('abc123');
    await page.locator('input[name="new_password"]').fill('testprueba1');
    await expect(page.locator('input[name="email"]')).toHaveValue('test@aqualab.com');
    await expect(page.locator('input[name="token"]')).toHaveValue('abc123');
    await expect(page.locator('input[name="new_password"]')).toHaveValue('testprueba1');
  });
  test('muestra error si el token es inválido', async ({ page }) => {
    await page.locator('input[name="email"]').fill('test@aqualab.com');
    await page.locator('input[name="token"]').fill('tokenfalso');
    await page.locator('input[name="new_password"]').fill('testprueba1');
    await page.getByRole('button', { name: /cambiar contraseña/i }).click();
    await expect(page.locator('.alert-danger')).toBeVisible();
    await expect(page.locator('.alert-danger')).toContainText(/token inválido/i);
  });
});