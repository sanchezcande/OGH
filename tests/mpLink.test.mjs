// El link de pago en pesos. Lo único que no puede fallar: que la preferencia lleve adentro la
// dirección del webhook (sin eso el código nunca sale solo, que es todo el punto) y que nadie se
// quede sin dónde pagar si MercadoPago no contesta.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../pages/api/pagar-pesos.js", import.meta.url), "utf8");

test("la preferencia lleva la URL del webhook adentro", () => {
  assert.match(src, /notification_url: `\$\{SITIO\}\/api\/mp-webhook`/,
    "sin notification_url, MercadoPago no avisa y el codigo no sale solo");
});

test("el webhook apunta a www: el dominio sin www contesta 308 y MercadoPago no sigue redirecciones", () => {
  assert.match(src, /const SITIO = "https:\/\/www\.opengatehub\.com"/);
});

test("cobra en pesos", () => {
  assert.match(src, /currency_id: "ARS"/);
  assert.match(src, /unit_price: PRECIO/);
});

test("si MercadoPago falla, manda al checkout en dolares y no a un error", () => {
  const caidas = src.match(/res\.redirect\(302, DOLARES\)/g) || [];
  assert.ok(caidas.length >= 3, "falta la salida en dolares en alguna de las fallas");
  assert.equal(/res\.status\(500\)/.test(src), false, "una pantalla de error pierde la venta");
});

test("el que paga cae en el link con el codigo puesto", () => {
  assert.match(src, /back_urls: \{ success: CODIGO_URL/);
  assert.match(src, /auto_return: "approved"/);
});
