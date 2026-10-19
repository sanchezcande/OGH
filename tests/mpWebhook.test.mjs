// El checkout en pesos no puede regalar el curso. Estas pruebas cuidan lo único que importa:
// que el código salga SOLO cuando MercadoPago confirma que el pago está aprobado.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../pages/api/mp-webhook.js", import.meta.url), "utf8");

test("nunca le cree al POST: siempre le pregunta a MercadoPago por el pago", () => {
  assert.match(src, /api\.mercadopago\.com\/v1\/payments/, "tiene que consultar el pago");
  assert.match(src, /Bearer \$\{token\}/, "la consulta va firmada con el token");
});

test("el codigo sale solo si el pago esta approved", () => {
  assert.match(src, /pago\.status !== "approved"/, "sin ese corte, un pago pendiente ya daria el curso");
  const corte = src.indexOf('pago.status !== "approved"');
  const envio = src.indexOf("mandarMail(new Resend");   // el call, no el import de arriba
  assert.ok(corte > 0 && envio > corte, "el mail tiene que mandarse DESPUES de chequear el estado");
});

test("contesta 200 siempre, para que MercadoPago no reintente y mande dos mails", () => {
  assert.equal(/res\.status\(500\)/.test(src), false, "un 500 hace que MercadoPago reintente");
  assert.match(src, /catch \(e\)[\s\S]*res\.status\(200\)/, "hasta el error contesta 200");
});

test("si falta el token no inventa: avisa y no manda nada", () => {
  const sinToken = src.indexOf("if (!token)");
  const envio = src.indexOf("mandarMail(new Resend");   // el call, no el import de arriba
  assert.ok(sinToken > 0 && sinToken < envio, "el chequeo del token va antes del mail");
});

test("el aviso a Telegram sale aunque el mail falle", () => {
  assert.match(src, /mailOk \?/, "el aviso dice si el mail salio o no");
  const envio = src.indexOf("mandarMail(new Resend");
  const aviso = src.lastIndexOf('avisar("Pagó en pesos');
  assert.ok(aviso > envio, "el aviso va despues de intentar el mail, con su resultado");
});
