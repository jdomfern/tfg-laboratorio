const { test, expect } = require('@playwright/test');
const emailUnico = `test${Date.now()}@aqualab.com`;// para no repetir email en cada test

test.describe('Registro', () => {

  test('muestra la pantalla de registro', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('h2')).toHaveText(/Crear cuenta/i);
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /crear cuenta/i })).toBeVisible();
  });
  test('deja escribir nombre, email y contraseña', async ({ page }) => {
    await page.goto('/register');
    await page.fill('#name', 'Usuario Prueba');
    await page.fill('#email', emailUnico);
    await page.fill('#password', '12345678');
    await expect(page.locator('#name')).toHaveValue('Usuario Prueba');
    await expect(page.locator('#email')).toHaveValue(emailUnico);
    await expect(page.locator('#password')).toHaveValue('12345678');
  });
  test('tiene enlace para volver a login', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('link', { name: /inicia sesión/i }).click();
    await expect(page).toHaveURL(/login/i);
  });
  test('no deja enviar el formulario si el email no es corporativo', async ({ page }) => {
    await page.goto('/register');
    await page.fill('#name', 'usuarioFake');
    await page.fill('#email', 'usuario@gmail.com');
    await page.fill('#password', '12345678');
    await page.getByRole('button', { name: /crear cuenta/i }).click();
    await expect(page).toHaveURL(/register/i); // al tener el input pattern sigue en la misma página
    await expect(page.locator('#email')).toHaveValue('usuario@gmail.com');
  });
  test('permite registrar un usuario nuevo válido', async ({ page }) => {
    await page.goto('/register');
    await page.fill('#name', 'Usuario Test');
    await page.fill('#email', emailUnico);
    await page.fill('#password', '12345678');
    await page.getByRole('button', { name: /crear cuenta/i }).click();
    await expect(page).toHaveURL(/\/\?registro=tecnico/);
    await expect(page.locator('.nombre-usuario').first()).toHaveText(/Usuario Test/i);
  });

});