// El link en pesos del 1 a 1 (09/11): cuotas financiadas por MercadoPago, el webhook adentro, y que el
// pago no dispare el código del curso de 27.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../pages/api/pagar-1a1.js", import.meta.url), "utf8");
const hook = readFileSync(new URL("../pages/api/mp-webhook.js", import.meta.url), "utf8");

test("cobra en pesos, con cuotas, y avisa al webhook en www", () => {
  assert.match(src, /currency_id: "ARS"/);
  assert.match(src, /payment_methods: \{ installments: CUOTAS \}/);
  assert.match(src, /const CUOTAS = 12;/);
  assert.match(src, /notification_url: `\$\{SITIO\}\/api\/mp-webhook`/);
  assert.match(src, /const SITIO = "https:\/\/www\.opengatehub\.com"/);
});

test("el pago se reconoce como 1 a 1 por su external_reference", () => {
  assert.match(src, /external_reference: `1a1-pesos-/);
  assert.match(hook, /startsWith\("1a1-"\)/);
});

test("si MercadoPago falla, manda al checkout en dólares y no a un error", () => {
  assert.ok((src.match(/res\.redirect\(302, DOLARES\)/g) || []).length >= 3);
  assert.equal(/res\.status\(500\)/.test(src), false);
});

test("el 1 a 1 sale del webhook antes del código del curso, y después del candado", () => {
  const candado = hook.indexOf("if (!primera) return");
  const rama = hook.indexOf("if (uno) {");
  const codigo = hook.indexOf("await codigoUnico(id)");
  assert.ok(candado > 0 && candado < rama && rama < codigo);
  assert.match(hook, /return res\.status\(200\)\.json\(\{ ok: true, unoAUno: true/);
});
