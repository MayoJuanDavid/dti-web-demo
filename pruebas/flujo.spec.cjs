const { test, expect } = require("@playwright/test");
const path = require("path");
const { pathToFileURL } = require("url");

// Página local servida desde el sistema de archivos (sin red).
const url = pathToFileURL(path.resolve(__dirname, "../index.html")).href;

test("al cambiar de curso cambia el evento visible", async ({ page }) => {
  await page.goto(url);

  const tituloAlfa = page.locator('article[data-curso="alfa"] .titulo-evento');
  const tituloBeta = page.locator('article[data-curso="beta"] .titulo-evento');

  // Estado inicial: se muestra el evento del Curso Alfa.
  await expect(tituloAlfa).toBeVisible();
  await expect(tituloAlfa).toHaveText("Sesión de introducción");
  await expect(tituloBeta).toBeHidden();

  // Al seleccionar el Curso Beta cambia el evento visible.
  await page.selectOption("#selector-curso", "beta");

  await expect(tituloBeta).toBeVisible();
  await expect(tituloBeta).toHaveText("Taller práctico");
});

test("el otro curso ya no aparece tras seleccionar uno nuevo", async ({ page }) => {
  await page.goto(url);

  const cursoAlfa = page.locator('article[data-curso="alfa"]');
  const cursoBeta = page.locator('article[data-curso="beta"]');

  // Inicialmente aparece el Curso Alfa y no el Curso Beta.
  await expect(cursoAlfa).toBeVisible();
  await expect(cursoBeta).toBeHidden();

  // Tras cambiar al Curso Beta, el Curso Alfa ya no aparece.
  await page.selectOption("#selector-curso", "beta");

  await expect(cursoBeta).toBeVisible();
  await expect(cursoAlfa).toBeHidden();
});

test("al volver desde el detalle se conserva el curso seleccionado", async ({ page }) => {
  await page.goto(url);

  // Seleccionamos el Curso Beta en el calendario.
  await page.selectOption("#selector-curso", "beta");
  await expect(page.locator('article[data-curso="beta"]')).toBeVisible();

  // Abrimos el detalle del Curso Beta desde su propio evento.
  await page.locator('.ver-detalle[data-curso="beta"]').click();

  // Aparece la vista de detalle y el calendario queda oculto.
  await expect(page.locator("#detalle")).toBeVisible();
  await expect(page.locator("#detalle-titulo")).toHaveText("Curso Beta — Práctica");
  await expect(page.locator("#calendario")).toBeHidden();

  // Volvemos al calendario desde el detalle.
  await page.locator("#volver-calendario").click();

  // Se conserva el filtro Beta...
  await expect(page.locator("#selector-curso")).toHaveValue("beta");

  // ...y el evento del Curso Beta sigue siendo el visible.
  await expect(page.locator('article[data-curso="beta"]')).toBeVisible();
  await expect(page.locator('article[data-curso="beta"] .titulo-evento')).toHaveText("Taller práctico");
  await expect(page.locator('article[data-curso="alfa"]')).toBeHidden();
});
