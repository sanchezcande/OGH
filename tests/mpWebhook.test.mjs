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
  // El ternario quedó partido en dos líneas al unificar el formato (22/10): lo que importa es
  // que el aviso siga diciendo si el mail salió, no en qué línea está el signo de pregunta.
  assert.match(src, /mailOk[\s\S]{0,30}\?/, "el aviso dice si el mail salio o no");
  const envio = src.indexOf("mandarMail(new Resend");
  const aviso = src.lastIndexOf('avisar("Pagó en pesos');
  assert.ok(aviso > envio, "el aviso va despues de intentar el mail, con su resultado");
});

test("un aviso repetido de MercadoPago no manda el codigo dos veces", () => {
  // 20/10: por el mismo pago llegaron dos avisos en el mismo minuto (payment.created y
  // payment.updated) y los dos mandaron mail.
  assert.match(src, /const primera = await anotarVenta\(pago, id\)/);
  const candado = src.indexOf("if (!primera) return");
  const envio = src.indexOf("mandarMail(new Resend");
  assert.ok(candado > 0 && candado < envio, "el candado va antes del mail");
  assert.match(src, /ON CONFLICT \(venta_id\) WHERE venta_id IS NOT NULL DO NOTHING/);
});

test("si la base falla el codigo sale igual", () => {
  // Un mail repetido molesta; quedarse sin el curso despues de pagar, no.
  assert.match(src, /no pude anotar la venta[\s\S]{0,80}return true/);
});

test("el pago en pesos tambien queda en la tabla de compras", () => {
  assert.match(src, /INSERT INTO compras/);
  assert.match(src, /'mercadopago'/);
});

test("cada pago en pesos recibe un codigo propio de un solo uso", () => {
  // 22/10: con un código igual para todos nada ata el pago con la entrada, y encima se puede reusar.
  assert.match(src, /max_purchase_count: "1"/);
  assert.match(src, /amount_off: "100"/);
  assert.match(src, /offer_type: "percent"/);
});

test("si el codigo propio no sale, igual recibe el general", () => {
  // Un código repetido es un problema chico; pagar y quedarse sin curso, no.
  assert.match(src, /no pude crear el código único[\s\S]{0,60}return null/);
  assert.match(src, /const link = propio \? `\$\{BASE_LINK\}\/\$\{propio\}` : CODIGO_URL/);
});

test("el codigo se crea DESPUES del candado, no antes", () => {
  // Si se creara antes, cada aviso repetido de MercadoPago crearia un codigo nuevo.
  const candado = src.indexOf("const primera = await anotarVenta");
  const crea = src.indexOf("const propio = await codigoUnico");
  assert.ok(candado > 0 && crea > candado, "el candado va primero");
});
