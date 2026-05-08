const { test, expect } = require('@playwright/test');

// Login para autenticarse
async function hacerLogin(page) {
  await page.goto('/login');
  await page.fill('#email', 'test@aqualab.com');
  await page.fill('#clave', 'testprueba');
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page).toHaveURL('http://localhost:3000/');
}

test.describe('Chat sin login', () => {
    test('redirige al login si intentas entrar al chat sin autenticarte', async ({ page }) => {
      await page.goto('/chat');
      await expect(page).toHaveURL(/login/i);
    });
  });
test.describe('Chat con login', () => {
  test.beforeEach(async ({ page }) => {
    await hacerLogin(page);
    await page.goto('/chat');
  });
  test('muestra la vista del chat', async ({ page }) => {
    await expect(page.locator('h3')).toHaveText(/Chat de empleados/i);
    await expect(page.locator('#zonaMensajes')).toBeVisible();
    await expect(page.locator('#campoMensaje')).toBeVisible();
    await expect(page.locator('#botonEnviar')).toBeVisible();
  });
  test('permite escribir en el campo de mensaje', async ({ page }) => {
    await page.fill('#campoMensaje', 'Mensaje de prueba');
    await expect(page.locator('#campoMensaje')).toHaveValue('Mensaje de prueba');
  });
  test('permite enviar un mensaje y verlo en el chat', async ({ page }) => {
    const mensajePrueba = `Mensaje TEST ${Date.now()}`;
    await page.fill('#campoMensaje', mensajePrueba);
    await page.click('#botonEnviar');
    await expect(page.locator('#zonaMensajes')).toContainText(mensajePrueba);
  });
  test('muestra el número de conectados', async ({ page }) => {
    await expect(page.locator('#numClientes')).toBeVisible();
  });

});