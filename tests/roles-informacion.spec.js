const { test, expect } = require('@playwright/test');

test('Prueba admin en proyectos y técnico en información adicional', async ({ page }) => {

  //Rol administrador
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"]', 'administrador@aqualab.com');
  await page.fill('input[name="password"]', 'administrador');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/localhost:3000/);
  await page.click('text=Proyectos');// Entrar en vista de proyectos
  await expect(page).toHaveURL(/.*proyectos.*/);
  await page.click('text=Información adicional');// Entrar en la vista información adicional
  await expect(page).toHaveURL(/.*informacion.*/);
  await page.click('text=salir');//Cerrar sesión
  //Rol de técnico 
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"]', 'test@aqualab.com');
  await page.fill('input[name="password"]', 'testprueba');
  await page.click('button[type="submit"]');
  await page.click('text=Información adicional'); //Entrar en vista Información adicional técnico
  await expect(page).toHaveURL(/.*informacion.*/);
  await page.fill('input[name="municipio"]', 'Sevilla');
  await expect(page).toHaveURL(/.*informacion.*/);
});