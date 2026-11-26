const { test, expect } = require("@playwright/test");
const path = require("path");
const { pathToFileURL } = require("url");

// Página local servida desde el sistema de archivos (sin red), igual que el resto de la suite.
const url = pathToFileURL(path.resolve(__dirname, "../index.html")).href;

// Curso ficticio CUR-01 (datos de demostración).
const CUR01 = { "Código": "CUR-01", "Inicio": "07/12/2026", "Fin": "18/12/2026", "Modalidad": "Virtual" };

// Lee un <dl> como mapa etiqueta -> valor.
async function leerDl(locator) {
  return locator.evaluate((dl) => {
    const dt = Array.from(dl.querySelectorAll("dt")).map((x) => x.textContent.trim());
    const dd = Array.from(dl.querySelectorAll("dd")).map((x) => x.textContent.trim());
    const o = {};
    dt.forEach((k, i) => { o[k] = dd[i] != null ? dd[i] : null; });
    return o;
  });
}

test("CIAP-TC-21 · ficha de CUR-01 desde el calendario y vuelta (código, fechas, modalidad)", async ({ page }, testInfo) => {
  await page.goto(url);
  const selector = page.locator("#selector-curso");
  const filaCur01 = page.locator('article[data-curso="cur-01"]');
  await expect(selector).toHaveValue("alfa");
  await expect(filaCur01).toBeHidden();
  const ficha = await test.step("Abrir la ficha del curso desde el calendario", async () => {
    await selector.selectOption("cur-01");
    await expect(filaCur01).toBeVisible();
    await expect(page.locator("article.evento:visible")).toHaveCount(1);
    const filaCalendario = await leerDl(filaCur01.locator("dl"));
    expect(filaCalendario).toEqual(CUR01);
    await filaCur01.getByRole("button", { name: "Ver detalle" }).click();
    await expect(page.locator("#calendario")).toBeHidden();
    await expect(page.locator("#detalle-datos")).toBeVisible();
    const datos = await leerDl(page.locator("#detalle-datos"));
    await testInfo.attach("Paso 1 · Datos leídos en la ficha", {
      body: JSON.stringify(datos, null, 2), contentType: "application/json"
    });
    expect(datos).toEqual(filaCalendario);
    return datos;
  });
  await test.step("Volver al calendario mediante el enlace de la ficha", async () => {
    await page.getByRole("button", { name: "Volver al calendario" }).click();
    await expect(selector).toHaveValue("cur-01");
    await expect(filaCur01).toBeVisible();
    await expect(page.locator("article.evento:visible")).toHaveCount(1);
    const filaVuelta = await leerDl(filaCur01.locator("dl"));
    await testInfo.attach("Paso 2 · Datos leídos al volver al calendario", {
      body: JSON.stringify(filaVuelta, null, 2), contentType: "application/json"
    });
    expect(filaVuelta).toEqual(ficha);
  });
});
