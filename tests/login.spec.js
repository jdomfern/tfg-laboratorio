const { test, expect } = require('@playwright/test');

test.describe('Login', () => {

  test('muestra la pantalla de login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#clave')).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  });
  test('deja escribir email y contraseña', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'usuario@aqualab.com');
    await page.fill('#clave', '1234');
    await expect(page.locator('#email')).toHaveValue('usuario@aqualab.com');
    await expect(page.locator('#clave')).toHaveValue('1234');
  });
  test('muestra error si el usuario no existe', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'noexiste@aqualab.com');
    await page.fill('#clave', 'falsa');
    await page.getByRole('button', { name: /entrar/i }).click();
    await expect(page.locator('.alert, .alert-danger')).toContainText(/No existe ese email. Regístrate./i);
  });
  test('permite iniciar sesión con un usuario válido', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'test@aqualab.com');
    await page.fill('#clave', 'testprueba');
    await page.getByRole('button', { name: /entrar/i }).click();
    await expect(page).toHaveURL('http://localhost:3000/');
  });
});