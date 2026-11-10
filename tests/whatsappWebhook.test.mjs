// El webhook de WhatsApp (lib/whatsapp/webhook.js, pages/api/whatsapp/webhook.js).
//
// Lo que no puede fallar:
//   1. Que entre un aviso sin la firma de Meta. La URL está abierta a internet: sin esa traba
//      cualquiera que la conozca inventa un mensaje entrante, le llega a Cande un aviso con lo que
//      ese alguien escribió, y lo que ella conteste sale al número que eligió un extraño.
//   2. Que no le llegue el mismo aviso dos veces. Meta reintenta todo lo que no contesta 200
//      enseguida: el mensaje se reclama en la base ANTES de avisar, y el reclamado no avisa.
//   3. Que la verificación por GET solo conteste con nuestro token: si no, cualquiera da de alta
//      esta URL en otra app de Meta.
//   4. Que los acuses de entrega (sent, delivered, read), que son la mayoría de los avisos, no
//      toquen la base ni Telegram.
//
// Correr:  node --test tests/*.test.mjs
import "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { respuesta } from "./dobles/preparar.mjs";

const {
  acusesDelEvento, desafioDeVerificacion, firmaDeMeta, firmaValidaDeMeta, guardarYAvisar, mensajesDelEvento,
  textoDelMensaje, webhookConfigurado,
} = await import("../lib/whatsapp/webhook.js");
const { avisoDeEntrante, telefonoDeAviso } = await import("../lib/whatsapp/respuestas.js");

const SECRETO = "app-secret-de-prueba";
const TOKEN = "verify-token-de-prueba";
const CUENTA = "1921482308505030"; // la cuenta de mensajes de Cande
const NUMERO = "5491122334455";

/** Un aviso de Meta como el de un mensaje entrante. */
const aviso = (valor, { object = "whatsapp_business_account", field = "messages" } = {}) => ({
  object,
  entry: [{ id: CUENTA, changes: [{ field, value: { messaging_product: "whatsapp", metadata: { display_phone_number: "5492945417165", phone_number_id: "77001" }, ...valor } }] }],
});
const entrante = (extra = {}, opciones = {}) => aviso({
  contacts: [{ profile: { name: "Juan Perez" }, wa_id: NUMERO }],
  messages: [{ from: NUMERO, id: "wamid.AAA", timestamp: "1762000000", type: "text", text: { body: "si, mañana puedo" }, ...extra }],
}, opciones);

/* ---------- la firma ---------- */

test("la firma es el HMAC del cuerpo crudo con el App Secret, como la manda Meta", () => {
  const crudo = JSON.stringify(entrante());
  const esperada = `sha256=${createHmac("sha256", SECRETO).update(crudo, "utf8").digest("hex")}`;
  assert.equal(firmaDeMeta(crudo, SECRETO), esperada);
  assert.equal(firmaValidaDeMeta(crudo, esperada, SECRETO), true);
  // El mismo cuerpo con un espacio de más ya es otro: por eso se firma el crudo y no lo que arma Next.
  assert.equal(firmaValidaDeMeta(`${crudo} `, esperada, SECRETO), false);
});

test("una firma que no vale no entra, y sin App Secret no entra ninguna", () => {
  const crudo = JSON.stringify(entrante());
  const buena = firmaDeMeta(crudo, SECRETO);
  for (const mala of [undefined, null, "", "sha256=", "otra cosa", buena.slice(0, -2), `${buena}00`, buena.replace("sha256=", "sha1=")]) {
    assert.equal(firmaValidaDeMeta(crudo, mala, SECRETO), false, String(mala));
  }
  assert.equal(firmaValidaDeMeta(crudo, firmaDeMeta(crudo, "otra-clave"), SECRETO), false);
  // Sin clave configurada no pasa nada: el endpoint queda inerte hasta que esté en Vercel.
  assert.equal(firmaDeMeta(crudo, ""), null);
  assert.equal(firmaValidaDeMeta(crudo, buena, ""), false);
});

/* ---------- la verificación de la URL ---------- */

test("el GET de verificación devuelve el hub.challenge, y solo con el token que esperamos", () => {
  const q = { "hub.mode": "subscribe", "hub.verify_token": TOKEN, "hub.challenge": "1158201444" };
  assert.equal(desafioDeVerificacion(q, TOKEN), "1158201444");
  assert.equal(desafioDeVerificacion({ ...q, "hub.verify_token": "otro" }, TOKEN), null);
  assert.equal(desafioDeVerificacion({ ...q, "hub.mode": "unsubscribe" }, TOKEN), null);
  assert.equal(desafioDeVerificacion({ ...q, "hub.challenge": "" }, TOKEN), null);
  assert.equal(desafioDeVerificacion({}, TOKEN), null);
  // Sin token configurado no se verifica nada: así nadie da de alta esta URL en otra app de Meta.
  assert.equal(desafioDeVerificacion(q, ""), null);
});

/* ---------- qué trae el aviso ---------- */

test("del aviso sale el mensaje, con el número, el nombre del perfil y la hora que dice Meta", () => {
  assert.deepEqual(mensajesDelEvento(entrante()), [{
    id: "wamid.AAA", telefono: NUMERO, nombre: "Juan Perez", texto: "si, mañana puedo", tipo: "text",
    creado: new Date(1762000000000), numeroId: "77001",
  }]);
});

test("lo que no es un mensaje de WhatsApp no entra", () => {
  assert.deepEqual(mensajesDelEvento(entrante({}, { object: "instagram" })), []);
  assert.deepEqual(mensajesDelEvento(aviso({ messages: [{ from: NUMERO, id: "wamid.A", type: "text", text: { body: "hola" } }] }, { object: "page" })), []);
  assert.deepEqual(mensajesDelEvento(aviso({ messages: [{ from: NUMERO, id: "wamid.A", type: "text", text: { body: "hola" } }] }, { field: "message_template_status_update" })), []);
  for (const nada of [null, undefined, {}, { object: "whatsapp_business_account" }, { object: "whatsapp_business_account", entry: [] }]) {
    assert.deepEqual(mensajesDelEvento(nada), []);
  }
});

test("los acuses de entrega no son mensajes de nadie: no se guardan ni se avisan, solo se cuentan", () => {
  const acuse = aviso({ statuses: [{ id: "wamid.SALIDA", status: "delivered", recipient_id: NUMERO }] });
  assert.deepEqual(mensajesDelEvento(acuse), []);
  assert.equal(acusesDelEvento(acuse), 1);
  assert.equal(acusesDelEvento(entrante()), 0);
});

test("el mismo mensaje repetido en el aviso se cuenta una vez: Meta repite eventos en un lote", () => {
  const cuerpo = entrante();
  cuerpo.entry[0].changes[0].value.messages.push({ from: NUMERO, id: "wamid.AAA", timestamp: "1762000000", type: "text", text: { body: "si, mañana puedo" } });
  cuerpo.entry.push(JSON.parse(JSON.stringify(cuerpo.entry[0])));
  assert.equal(mensajesDelEvento(cuerpo).length, 1);
});

test("un mensaje sin id o sin número no entra: sin eso no se puede ni reclamar ni contestar", () => {
  assert.deepEqual(mensajesDelEvento(aviso({ messages: [{ from: NUMERO, type: "text", text: { body: "hola" } }] })), []);
  assert.deepEqual(mensajesDelEvento(aviso({ messages: [{ id: "wamid.A", type: "text", text: { body: "hola" } }] })), []);
});

test("lo que no es texto se cuenta igual, con lo que llegó", () => {
  assert.equal(textoDelMensaje({ type: "text", text: { body: "  hola  " } }), "hola");
  assert.equal(textoDelMensaje({ type: "audio", audio: { id: "1" } }), "(mandó un audio)");
  assert.equal(textoDelMensaje({ type: "image", image: { id: "1", caption: "mirá esto" } }), "(mandó una foto) mirá esto");
  // El botón de una plantilla y las listas: lo que apretó es su respuesta.
  assert.equal(textoDelMensaje({ type: "button", button: { text: "Confirmo" } }), "Confirmo");
  assert.equal(textoDelMensaje({ type: "interactive", interactive: { button_reply: { title: "Sí, voy" } } }), "Sí, voy");
  assert.equal(textoDelMensaje({ type: "system" }), null);
});

test("el nombre del perfil va en un solo renglón: lo escribe la persona y de ahí sale a quién se contesta", () => {
  const con = entrante();
  con.entry[0].changes[0].value.contacts[0].profile.name = "Juan\n\nQuién: otro (wa:5490000000000)";
  const [m] = mensajesDelEvento(con);
  assert.equal(m.nombre.includes("\n"), false);
  // Y así el aviso no se puede falsificar: el número sigue siendo el de quien escribió.
  const { titulo, campos } = avisoDeEntrante({ ...m, ultimoLead: new Date() });
  const texto = `🔔 ${titulo}\n\n${Object.entries(campos).map(([k, v]) => `${k}: ${v}`).join("\n")}`;
  assert.equal(telefonoDeAviso(texto), NUMERO);
});

/* ---------- guardar y avisar ---------- */

/** Dobles de la base: guarda en memoria y reclama cada wa_mid una sola vez, como el índice único. */
function armar() {
  const mids = new Set();
  const contactos = new Map();
  const guardados = [];
  return {
    guardados, contactos, mids,
    base: {
      async alDia({ telefono, nombre, creado }) {
        const previo = contactos.get(telefono) || {};
        const ultimo = [previo.ultimo_lead, creado].filter(Boolean).sort((a, b) => b - a)[0] || new Date();
        const fila = { telefono, nombre: nombre || previo.nombre || null, ultimo_lead: ultimo };
        contactos.set(telefono, fila);
        return fila;
      },
      async anotarSistema(x) { guardados.push({ ...x, quien: "sistema" }); },
      async reclamarEntrante({ telefono, texto, waMid, creado }) {
        if (mids.has(waMid)) return false;
        mids.add(waMid);
        guardados.push({ telefono, quien: "lead", texto, waMid, creado });
        return true;
      },
    },
  };
}

const avisados = [];
const avisar = async (titulo, campos, opciones) => {
  avisados.push({ titulo, campos, opciones });
  return true;
};

test("un mensaje entrante se guarda y le llega el aviso a Telegram, con el número y lo que dijo", async () => {
  avisados.length = 0;
  const d = armar();
  const cuentas = await guardarYAvisar({ base: d.base, avisar, mensajes: mensajesDelEvento(entrante()), avisoDe: avisoDeEntrante });
  assert.deepEqual(cuentas, { entrantes: 1, nuevos: 1, repetidos: 0, avisados: 1, sin_aviso: 0, errores: 0 });
  assert.equal(d.guardados.length, 1);
  assert.equal(d.guardados[0].texto, "si, mañana puedo");
  assert.equal(d.contactos.get(NUMERO).ultimo_lead.getTime(), 1762000000000, "la ventana se cuenta desde la hora que dice Meta");
  assert.equal(avisados.length, 1);
  assert.match(avisados[0].titulo, /^WhatsApp: te escribió Juan Perez$/);
  assert.equal(avisados[0].campos.Quién, `Juan Perez (wa:${NUMERO})`);
  assert.equal(avisados[0].campos.Dijo, "si, mañana puedo");
  assert.equal(Object.keys(avisados[0].campos)[0], "Quién", "Quién va primero: lo que escribió el lead no puede hacerse pasar por ese renglón");
});

test("un reintento de Meta con el mismo mensaje no avisa dos veces", async () => {
  avisados.length = 0;
  const d = armar();
  const mensajes = mensajesDelEvento(entrante());
  await guardarYAvisar({ base: d.base, avisar, mensajes, avisoDe: avisoDeEntrante });
  // Lo mismo otra vez, como cuando Meta no recibe el 200 a tiempo y reintenta el lote entero.
  const otra = await guardarYAvisar({ base: d.base, avisar, mensajes: mensajesDelEvento(entrante()), avisoDe: avisoDeEntrante });
  assert.deepEqual(otra, { entrantes: 1, nuevos: 0, repetidos: 1, avisados: 0, sin_aviso: 0, errores: 0 });
  assert.equal(avisados.length, 1, "un aviso repetido le hace contestar dos veces al lead");
  assert.equal(d.guardados.length, 1);
});

test("un reintento viejo no le cierra la ventana a una charla que siguió", async () => {
  const d = armar();
  const nuevo = entrante({ id: "wamid.NUEVO", timestamp: "1762003600" });
  await guardarYAvisar({ base: d.base, avisar, mensajes: mensajesDelEvento(nuevo), avisoDe: avisoDeEntrante });
  await guardarYAvisar({ base: d.base, avisar, mensajes: mensajesDelEvento(entrante()), avisoDe: avisoDeEntrante });
  assert.equal(d.contactos.get(NUMERO).ultimo_lead.getTime(), 1762003600000);
});

test("si uno falla, los demás del lote siguen", async () => {
  avisados.length = 0;
  const d = armar();
  const fallas = [];
  const base = { ...d.base, async alDia(x) { if (x.telefono === "5490000000001") throw new Error("la base dijo no"); return d.base.alDia(x); } };
  const dos = aviso({
    contacts: [{ profile: { name: "Juan" }, wa_id: NUMERO }],
    messages: [
      { from: "5490000000001", id: "wamid.MAL", timestamp: "1762000000", type: "text", text: { body: "uno" } },
      { from: NUMERO, id: "wamid.BIEN", timestamp: "1762000000", type: "text", text: { body: "dos" } },
    ],
  });
  const cuentas = await guardarYAvisar({ base, avisar, mensajes: mensajesDelEvento(dos), avisoDe: avisoDeEntrante, registrar: (e) => fallas.push(e.message) });
  assert.deepEqual(cuentas, { entrantes: 2, nuevos: 1, repetidos: 0, avisados: 2, sin_aviso: 0, errores: 1 });
  assert.deepEqual(fallas, ["la base dijo no"]);
  assert.equal(avisados.length, 2);
});

test("si la base falla, el aviso sale igual con el Ojo: peor es perder la respuesta de un lead", async () => {
  avisados.length = 0;
  const base = { async alDia() { throw new Error("Neon dijo no"); }, async reclamarEntrante() { throw new Error("tampoco"); } };
  const cuentas = await guardarYAvisar({ base, avisar, mensajes: mensajesDelEvento(entrante()), avisoDe: avisoDeEntrante });
  assert.deepEqual(cuentas, { entrantes: 1, nuevos: 0, repetidos: 0, avisados: 1, sin_aviso: 0, errores: 1 });
  assert.equal(avisados.length, 1);
  assert.equal(avisados[0].campos.Dijo, "si, mañana puedo");
  assert.match(avisados[0].campos.Ojo, /no pude guardarlo en la base/);
});

test("una reacción se guarda y avisa sin sonido: es un lo vi, no una respuesta que contestar", async () => {
  avisados.length = 0;
  const d = armar();
  const reaccion = entrante({ id: "wamid.REAC", type: "reaction", reaction: { message_id: "wamid.SALIDA", emoji: "👍" }, text: undefined });
  const cuentas = await guardarYAvisar({ base: d.base, avisar, mensajes: mensajesDelEvento(reaccion), avisoDe: avisoDeEntrante });
  assert.equal(cuentas.nuevos, 1);
  assert.equal(d.guardados[0].texto, "(reaccionó con 👍)");
  assert.equal(avisados[0].opciones.silencioso, true);
  // Un mensaje de verdad sí suena.
  avisados.length = 0;
  await guardarYAvisar({ base: armar().base, avisar, mensajes: mensajesDelEvento(entrante()), avisoDe: avisoDeEntrante });
  assert.equal(avisados[0].opciones.silencioso, false);
});

test("si Telegram no toma el aviso, queda escrito en la charla: el mensaje ya está reclamado", async () => {
  const d = armar();
  const fallas = [];
  // avisarDm devuelve false cuando ningún camino de Telegram lo tomó, y no tira (lib/notificar.js).
  const cuentas = await guardarYAvisar({
    base: d.base, avisar: async () => false, mensajes: mensajesDelEvento(entrante()),
    avisoDe: avisoDeEntrante, registrar: (e) => fallas.push(e.message),
  });
  assert.deepEqual(cuentas, { entrantes: 1, nuevos: 1, repetidos: 0, avisados: 0, sin_aviso: 1, errores: 0 });
  assert.match(fallas.join(" "), /no pude avisar este mensaje por Telegram/);
  const nota = d.guardados.find((g) => g.quien === "sistema");
  assert.match(nota.texto, /no te lo pude avisar por Telegram/);
});

/* ---------- el endpoint ---------- */

const pedido = (extra = {}) => ({ method: "POST", headers: {}, query: {}, ...extra });

test("el endpoint: GET verifica, POST sin firma no entra, método raro 405", async () => {
  const { default: handler, config } = await import("../pages/api/whatsapp/webhook.js");
  const llamar = async (req) => { const res = respuesta(); await handler(req, res); return res; };
  assert.equal(config.api.bodyParser, false, "la firma es del cuerpo crudo: el lector de Next lo rearma");
  assert.equal(webhookConfigurado(), false, "sin las claves en el entorno el endpoint está inerte");

  process.env.WHATSAPP_APP_SECRET = SECRETO;
  process.env.WHATSAPP_VERIFY_TOKEN = TOKEN;
  try {
    assert.equal(webhookConfigurado(), true);
    // La verificación de Meta: el challenge sale en texto pelado, no en JSON.
    const ok = await llamar(pedido({ method: "GET", query: { "hub.mode": "subscribe", "hub.verify_token": TOKEN, "hub.challenge": "1158201444" } }));
    assert.equal(ok.codigo, 200);
    assert.equal(ok.texto, "1158201444");
    assert.match(ok.cabeceras["content-type"], /^text\/plain/);
    const mal = await llamar(pedido({ method: "GET", query: { "hub.mode": "subscribe", "hub.verify_token": "otro", "hub.challenge": "1" } }));
    assert.equal(mal.codigo, 403);

    assert.equal((await llamar(pedido({ method: "PUT" }))).codigo, 405);

    // Un POST con el cuerpo bien pero sin firma: 401 y no se lee nada.
    const crudo = JSON.stringify(entrante());
    assert.equal((await llamar(pedido({ body: crudo }))).codigo, 401);
    assert.equal((await llamar(pedido({ body: crudo, headers: { "x-hub-signature-256": firmaDeMeta(crudo, "otra-clave") } }))).codigo, 401);

    // Con la firma de Meta pasa (sin POSTGRES_URL no se guarda nada: eso va después del 200).
    const bien = await llamar(pedido({ body: crudo, headers: { "x-hub-signature-256": firmaDeMeta(crudo, SECRETO) } }));
    assert.equal(bien.codigo, 200);
    assert.deepEqual(bien.cuerpo, { ok: true, mensajes: 1, acuses: 0 });

    // Un acuse de entrega contesta 200 y no toca la base.
    const acuse = JSON.stringify(aviso({ statuses: [{ id: "wamid.X", status: "read", recipient_id: NUMERO }] }));
    const r = await llamar(pedido({ body: acuse, headers: { "x-hub-signature-256": firmaDeMeta(acuse, SECRETO) } }));
    assert.deepEqual(r.cuerpo, { ok: true, mensajes: 0, acuses: 1 });

    // Un cuerpo que no es JSON no se arregla reintentando: 200 y queda en el registro.
    const roto = await llamar(pedido({ body: "no soy json", headers: { "x-hub-signature-256": firmaDeMeta("no soy json", SECRETO) } }));
    assert.equal(roto.codigo, 200);
    assert.deepEqual(roto.cuerpo, { ok: false, motivo: "no es JSON" });
  } finally {
    delete process.env.WHATSAPP_APP_SECRET;
    delete process.env.WHATSAPP_VERIFY_TOKEN;
  }
});

test("el endpoint lee el cuerpo del stream, que es lo que firma Meta", async () => {
  const { default: handler } = await import("../pages/api/whatsapp/webhook.js");
  process.env.WHATSAPP_APP_SECRET = SECRETO;
  try {
    const crudo = JSON.stringify(entrante());
    async function* trozos() { yield Buffer.from(crudo.slice(0, 25)); yield Buffer.from(crudo.slice(25)); }
    const req = Object.assign(trozos(), { method: "POST", headers: { "x-hub-signature-256": firmaDeMeta(crudo, SECRETO) }, query: {} });
    const res = respuesta();
    await handler(req, res);
    assert.equal(res.codigo, 200);
    assert.deepEqual(res.cuerpo, { ok: true, mensajes: 1, acuses: 0 });
  } finally {
    delete process.env.WHATSAPP_APP_SECRET;
  }
});
