// Cande, 29/10: "hagamos eso de Telegram, que me llegue con el link que abra wpp". Cada venta del
// curso le avisa con un botón que abre WhatsApp con la oferta del 1 a 1 ya escrita (Hooman, 28/10:
// la oferta va después de que pagó, y a mano). Un número mal armado abre un chat con un extraño,
// y una oferta a quien no pagó o a quien devolvió es un papelón: eso es lo que cuidan estas pruebas.
import { avisos, cuerpos, respuesta } from "./dobles/preparar.mjs";
import { base } from "./dobles/postgres.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { numeroWhatsapp, codigoPais, mensajeOferta, linkOferta, correspondeOferta, primerNombre, DOC_OFERTA, PAGO_EN_PESOS } =
  await import("../lib/ofertaWhatsapp.js");

test("los números del formulario quedan como los pide wa.me", () => {
  const casos = [
    ["+54 11 2348 5638", "Argentina, CABA", "5491123485638"],         // sin el 9, wa.me dice que no existe
    ["+5491123485638", "Argentina", "5491123485638"],
    ["+54 9 11 2348-5638", "", "5491123485638"],
    ["3442 123456", "Concepción del Uruguay, Argentina", "5493442123456"],   // la ciudad no gana al país
    ["3001234567", "Colombia, Medellín", "573001234567"],
    ["573001234567", "Colombia", "573001234567"],                    // ya traía el código sin el +
    ["0991234567", "Ecuador (Ambato)", "593991234567"],
    ["+593 99 123 4567", "Ecuador", "593991234567"],
    ["8095551234", "Cotui, República Dominicana", "18095551234"],
    ["53123456", "Cuba, La Habana", "5353123456"],                    // empieza como el código, pero es local
    ["+1 809 555 1234 / +18095551111", "", "18095551234"],            // dos números: el primero
    ["3001234567", "País: Colombia - Departamento: Atlántico - Ciudad: Soledad", "573001234567"],
    // Lo que encontró la revisión del 29/10: un número local con un "+" de más iba al chat de un extraño.
    ["+3221234567", "Bogotá, Colombia", "573221234567"],             // antes: +32, un fijo de Bruselas
    ["+04121234567", "Caracas, Venezuela", "584121234567"],
    ["+1123485638", "Buenos Aires, Argentina", "5491123485638"],     // un 1 con 10 dígitos no es Estados Unidos
    ["+5351234567", "Bogotá, Colombia", "5351234567"],               // un cubano en Colombia: ya trae su código
    // Argentina con el 15 de adentro del país.
    ["0351 15 1234567", "Córdoba, Argentina", "5493511234567"],
    ["011 15 2348 5638", "Argentina", "5491123485638"],
    ["3442 15 123456", "Entre Ríos, Argentina", "5493442123456"],
    ["+54 351 15 1234567", "", "5493511234567"],
  ];
  for (const [crudo, pais, esperado] of casos) {
    assert.equal(numeroWhatsapp(crudo, pais), esperado, `${crudo} (${pais})`);
  }
});

test("si no se puede saber a quién le escribe, no hay link", () => {
  assert.equal(numeroWhatsapp("+99 N/A", ""), null);
  assert.equal(numeroWhatsapp("", "Argentina"), null);
  assert.equal(numeroWhatsapp(null, null), null);
  assert.equal(numeroWhatsapp("3001234567", ""), null, "local y sin país");
  assert.equal(numeroWhatsapp("3001234567", "Bogotá, Usaquén"), null, "'usa' adentro de una palabra no es Estados Unidos");
  assert.equal(codigoPais("Bogotá, Usaquén"), null);
  assert.equal(numeroWhatsapp("15 2348 5638", "CABA, Argentina"), null, "sin característica: ninguna empieza con 15");
  assert.equal(numeroWhatsapp("+54 11 2348 56", "Argentina"), null, "un argentino que no cierra en diez dígitos");
  assert.equal(numeroWhatsapp("+3221234567", ""), null, "local con + y sin país");
});

test("el mensaje respeta cómo escribe ella", () => {
  const m = mensajeOferta("andres caleb murillo");
  assert.match(m, /^Che Andres, buenas!/);
  assert.match(m, /estoy buscando 5 devs/, "el marco de Hooman: 'busco', nunca 'tomo' (suena a que contrata)");
  assert.match(m, /Vas a ser vos o alguien más\?/);
  assert.ok(m.includes(DOC_OFERTA), "primero el detalle");
  assert.equal(/gumroad/i.test(m), false, "el link de pago va después, cuando dice que sí");
  assert.equal(/[¿¡]/.test(m), false, "sin signos de apertura");
  assert.equal(/[—–]| - /.test(m), false, "sin guiones como puntuación");
  assert.equal(/laburo|nosotros|trabajamos|tomo 5|te consigo|garantiz/i.test(m), false);
  assert.equal((m.match(/!/g) || []).length, 1, "una sola exclamación");
});

test("sin nombre de verdad, saluda sin nombre", () => {
  assert.equal(primerNombre("alguien@gmail.com"), "");
  assert.match(mensajeOferta(""), /^Che, buenas!/);
  assert.match(mensajeOferta(null), /^Che, buenas!/);
});

test("el link abre WhatsApp con el mensaje escrito", () => {
  const l = linkOferta({ whatsapp: "+54 11 2348 5638", pais: "Argentina", nombre: "Juan Pérez" });
  assert.equal(l.numero, "5491123485638");
  assert.equal(l.url, `https://wa.me/5491123485638?text=${encodeURIComponent(mensajeOferta("Juan"))}`);
  assert.equal(linkOferta({ whatsapp: "N/A", pais: "", nombre: "x" }), null);
  // Gumroad corta el nombre a 120 caracteres y puede partir un emoji: no puede reventar.
  const partido = ("a" + "😀".repeat(70)).slice(0, 120);
  assert.ok(linkOferta({ whatsapp: "+5491123485638", pais: "", nombre: partido }).url.startsWith("https://wa.me/"));
});

test("se ofrece solo a quien pagó el curso en español", () => {
  const curso = "Acelerador de Carrera Tech";
  assert.equal(correspondeOferta({ producto: curso }), true, "pagó en dólares");
  assert.equal(correspondeOferta({ producto: curso, gratis: true, porQue: PAGO_EN_PESOS }), true, "pagó en pesos");
  assert.equal(correspondeOferta({ producto: curso, baja: true }), false, "devolución");
  assert.equal(correspondeOferta({ producto: curso, recurrente: true }), false, "la segunda cuota no es otra compra");
  assert.equal(correspondeOferta({ producto: curso, gratis: true, porQue: "acceso a cambio de un testimonio" }), false);
  assert.equal(correspondeOferta({ producto: curso, gratis: true }), false, "código de 100% regalado");
  assert.equal(correspondeOferta({ producto: "Conseguí trabajo de dev en 4 semanas" }), false, "ya compró el 1 a 1");
  assert.equal(correspondeOferta({ producto: "Tech Career Accelerator" }), false, "el curso en inglés: la oferta es en español");
});

// --- De punta a punta: el ping de Gumroad con una ficha en la red de devs ---

const { default: ping } = await import("../pages/api/gumroad-ping.js");

const FICHA = {
  nombre: "Juan Pérez", pais: "Argentina, Córdoba", rol_principal: "Backend", seniority: "Senior",
  whatsapp: "+54 351 1234567", telegram: null, origen: "instagram", como_llegaste: null, cv_url: null,
  creado: new Date(),
};

/** Un ping de Gumroad contra la base de mentira. `previas`: los productos que ese mail ya compró antes. */
async function venta(cuerpo, { ficha = FICHA, previas = [] } = {}) {
  process.env.POSTGRES_URL = "postgres://prueba";
  base.reiniciar();
  base.otras = async (t) => {
    if (/FROM red_devs WHERE lower\(email\)/.test(t)) return { rows: ficha ? [ficha] : [] };
    if (/^SELECT producto FROM compras/.test(t)) return { rows: previas.map((producto) => ({ producto })) };
    return { rows: [] };
  };
  cuerpos.length = 0;
  avisos.length = 0;
  const res = respuesta();
  await ping({ method: "POST", query: {}, body: { email: "juan@ejemplo.com", full_name: "Juan Pérez", sale_id: `v${cuerpos.length}${Object.keys(cuerpo).join("")}`, ...cuerpo } }, res);
  delete process.env.POSTGRES_URL;
  assert.equal(res.codigo, 200);
  return cuerpos.at(-1);
}

const boton = (c) => c?.reply_markup?.inline_keyboard?.[0]?.[0] || null;

test("una venta del curso trae el botón que abre WhatsApp", async () => {
  const c = await venta({ product_name: "Acelerador de Carrera Tech", price: "2700", currency: "usd" });
  assert.match(c.text, /COMPRA NUEVA/);
  assert.equal(boton(c).url, linkOferta({ whatsapp: FICHA.whatsapp, pais: FICHA.pais, nombre: "Juan Pérez" }).url);
  assert.match(boton(c).url, /^https:\/\/wa\.me\/5493511234567\?text=/);
  assert.match(boton(c).text, /\(\+5493511234567\)$/, "el botón dice a qué número va, para que ella lo vea antes de tocar");
});

test("el saludo usa el nombre de la ficha, no el del titular de la tarjeta", async () => {
  const c = await venta({ product_name: "Acelerador de Carrera Tech", price: "2700", full_name: "MARIA GONZALEZ" });
  assert.match(decodeURIComponent(boton(c).url), /text=Che Juan, buenas!/);
});

test("el que entra con el código de pesos también, el general o el suyo de un solo uso", async () => {
  for (const offer_code of ["PARAVOS", "PESOS123456789"]) {
    const c = await venta({ product_name: "Acelerador de Carrera Tech", price: "0", offer_code });
    assert.match(c.text, /Entró al curso/, offer_code);
    assert.ok(boton(c), `${offer_code}: pagó en pesos, es un comprador`);
  }
});

test("el pago en pesos que anotó MercadoPago no cuenta como compra anterior: es esta misma", () => {
  const src = readFileSync(new URL("../pages/api/gumroad-ping.js", import.meta.url), "utf8");
  assert.match(src, /venta_id IS DISTINCT FROM \$\{ventaId\}/, "un reintento de Gumroad no se cuenta a sí mismo");
  assert.match(src, /venta_id NOT LIKE 'mp-%'/);
});

test("el código de cada pago en pesos se arma en un solo lugar", () => {
  const mp = readFileSync(new URL("../pages/api/mp-webhook.js", import.meta.url), "utf8");
  assert.match(mp, /const nombre = codigoDePesos\(id\)/, "si el webhook lo arma por su cuenta, el ping deja de reconocerlo");
});

test("devoluciones, regalos, cuotas y el propio 1 a 1 no traen oferta", async () => {
  for (const cuerpo of [
    { product_name: "Acelerador de Carrera Tech", price: "2700", refunded: "true" },
    { product_name: "Acelerador de Carrera Tech", price: "0", offer_code: "TESTIMONIO" },
    { product_name: "Conseguí trabajo de dev en 4 semanas", price: "47300" },
    { product_name: "Acelerador de Carrera Tech", price: "1350", recurrence: "monthly", is_recurring_charge: "true" },
  ]) {
    const c = await venta(cuerpo);
    assert.equal(boton(c), null, JSON.stringify(cuerpo));
    assert.equal(/Ofrecele el 1 a 1/.test(c.text), false);
  }
});

test("al que ya tiene el 1 a 1 no se le ofrece, y al que ya había entrado se avisa en vez del botón", async () => {
  let c = await venta({ product_name: "Acelerador de Carrera Tech", price: "0", offer_code: "PARAVOS" },
    { previas: ["Conseguí trabajo de dev en 4 semanas"] });
  assert.equal(boton(c), null);
  assert.equal(/Ofrecele el 1 a 1/.test(c.text), false);
  c = await venta({ product_name: "Acelerador de Carrera Tech", price: "0", offer_code: "PARAVOS" },
    { previas: ["Acelerador de Carrera Tech"] });
  assert.equal(boton(c), null, "el código general se puede canjear dos veces: no se le ofrece dos veces");
  assert.match(c.text, /ya había entrado al curso antes/);
});

test("sin un WhatsApp que sirva, el mensaje viene en el aviso para mandarlo a mano", async () => {
  let c = await venta({ product_name: "Acelerador de Carrera Tech", price: "2700" }, { ficha: null });
  assert.equal(boton(c), null);
  assert.match(c.text, /Ofrecele el 1 a 1:<\/b> no tengo su WhatsApp, mandale esto a mano/);
  assert.match(c.text, /estoy buscando 5 devs/);
  c = await venta({ product_name: "Acelerador de Carrera Tech", price: "2700" }, { ficha: { ...FICHA, whatsapp: "15 2348 5638" } });
  assert.equal(boton(c), null);
  assert.match(c.text, /no pude armar el link de WhatsApp con su número/);
});

/** Cambia el Telegram de mentira por uno que contesta como se le diga, y anota cada pedido. */
async function conTelegram(responder, fn) {
  const fetchDeVerdad = globalThis.fetch;
  const pedidos = [];
  globalThis.fetch = async (url, o) => { const b = JSON.parse(o.body); pedidos.push(b); return responder(b); };
  try { return { valor: await fn(), pedidos }; } finally { globalThis.fetch = fetchDeVerdad; }
}

test("si Telegram se cae o tarda, no se reintenta: el aviso pudo haber llegado y saldría dos veces", async () => {
  const { avisar } = await import("../lib/notificar.js");
  for (const responder of [
    () => { throw new Error("This operation was aborted"); },
    () => ({ ok: false, status: 502, text: async () => "Bad Gateway" }),
  ]) {
    const { valor, pedidos } = await conTelegram(responder, () =>
      avisar("COMPRA NUEVA", { Quién: "x" }, { boton: { texto: "WhatsApp", url: "https://wa.me/1" } }));
    assert.equal(valor, false);
    assert.equal(pedidos.length, 1);
  }
});

test("si Telegram rechaza el botón, el aviso sale igual sin él", async () => {
  const { avisar } = await import("../lib/notificar.js");
  const { valor, pedidos } = await conTelegram(
    (b) => (b.reply_markup
      ? { ok: false, status: 400, text: async () => "Bad Request: wrong HTTP URL" }
      : { ok: true, status: 200, text: async () => "" }),
    () => avisar("COMPRA NUEVA", { Quién: "x" }, { boton: { texto: "WhatsApp", url: "https://wa.me/1" } }));
  assert.equal(valor, true);
  assert.equal(pedidos.length, 2);
  assert.equal(pedidos[1].reply_markup, undefined);
});
