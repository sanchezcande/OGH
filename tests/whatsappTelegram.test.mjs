// El puente de punta a punta: entra por el MISMO webhook del bot de Telegram que los DM
// (pages/api/dm/telegram.js) y sale por WhatsApp.
//
// Lo que no puede fallar:
//   1. Que una respuesta a un aviso de WhatsApp salga por WhatsApp y no por Instagram.
//   2. Que una respuesta al aviso de una charla de Instagram siga yendo por donde iba. Este webhook
//      es el que Cande usa todos los días: si el camino de WhatsApp se le pone adelante, le rompe
//      el agente de DM.
//
// Correr:  node --test tests/*.test.mjs
import "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { base } from "./dobles/postgres.mjs";
import { respuesta } from "./dobles/preparar.mjs";

const { avisoDeEntrante } = await import("../lib/whatsapp/respuestas.js");

const SECRETO = "secreto-del-webhook";
const NUMERO = "5491122334455";

/** Los pedidos que salieron (Telegram y el Graph de WhatsApp): acá no hay red de verdad. */
const pedidos = [];
const deGraph = () => pedidos.filter((p) => p.url.includes("graph.facebook.com"));
const deTelegram = () => pedidos.filter((p) => p.url.includes("api.telegram.org"));

let fetchPrevio = null;

function prepararEntorno() {
  fetchPrevio = globalThis.fetch;
  process.env.POSTGRES_URL = "postgres://de-prueba";
  process.env.TELEGRAM_DM_BOT_TOKEN = "token-del-bot-dm";
  process.env.WHATSAPP_TOKEN = "token-de-whatsapp";
  process.env.WHATSAPP_PHONE_NUMBER_ID = "77001";
  pedidos.length = 0;
  globalThis.fetch = async (url, opciones) => {
    const u = String(url);
    pedidos.push({ url: u, cuerpo: opciones?.body ? JSON.parse(opciones.body) : null });
    if (u.includes("graph.facebook.com")) {
      return { ok: true, status: 200, json: async () => ({ messages: [{ id: "wamid.SALIDA" }] }) };
    }
    if (u.includes("api.telegram.org")) {
      return { ok: true, status: 200, text: async () => "", json: async () => ({ ok: true, result: { message_id: 9 } }) };
    }
    throw new Error(`las pruebas no usan la red: ${u}`);
  };
  // El doble de Postgres solo conoce las consultas del goteo: acá se atienden las de este camino.
  // Ojo: el doble junta los parámetros como "?", no como "$1" (ver tests/dobles/postgres.mjs).
  base.reiniciar({});
  base.otras = async (t, params) => {
    if (/^(CREATE|ALTER|UPDATE|INSERT INTO wa_mensajes|INSERT INTO dm_mensajes)/.test(t)) return { rows: [], rowCount: 1 };
    if (/^SELECT valor FROM dm_config WHERE clave = \?$/.test(t)) {
      return { rows: params[0] === "telegram_respuestas" ? [{ valor: { secreto: SECRETO } }] : [] };
    }
    if (/^INSERT INTO dm_telegram_vistos/.test(t)) return { rows: [{ update_id: params[0] }] };
    if (/^SELECT \* FROM wa_contactos WHERE telefono = \?$/.test(t)) {
      // Escribió hace un rato: la ventana de 24 horas está abierta.
      return { rows: [{ telefono: params[0], nombre: "Juan Perez", ultimo_lead: new Date(Date.now() - 3600000) }] };
    }
    // Esa charla de Instagram no está en la base del agente: alcanza para ver que fue por ese camino.
    if (/^SELECT \* FROM dm_contactos WHERE id = \?$/.test(t)) return { rows: [] };
    return undefined;
  };
}

function limpiarEntorno() {
  for (const k of ["POSTGRES_URL", "TELEGRAM_DM_BOT_TOKEN", "WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"]) delete process.env[k];
  base.otras = null;
  if (fetchPrevio) globalThis.fetch = fetchPrevio;
}

/** Espera a que `cumple` dé true: lo que sale después del 200 va con waitUntil. */
async function esperar(cumple, intentos = 200) {
  for (let i = 0; i < intentos; i++) {
    if (cumple()) return true;
    await new Promise((r) => setTimeout(r, 5));
  }
  return false;
}

/** El aviso de WhatsApp, como lo arma avisar() (lib/notificar.js). */
function avisoWa() {
  const { titulo, campos } = avisoDeEntrante({ telefono: NUMERO, nombre: "Juan Perez", texto: "si, mañana puedo", ultimoLead: new Date() });
  return `🔔 ${titulo}\n\n${Object.entries(campos).map(([k, v]) => `${k}: ${v}`).join("\n")}`;
}

const novedad = (aviso, texto, updateId) => ({
  update_id: updateId,
  message: {
    message_id: 50, text: texto, chat: { id: 1, type: "private" }, from: { id: 1 },
    reply_to_message: { message_id: 49, date: 1762000000, text: aviso, from: { is_bot: true } },
  },
});

const pedido = (cuerpo) => ({ method: "POST", headers: { "x-telegram-bot-api-secret-token": SECRETO }, body: cuerpo, query: {} });

test("responder un aviso de WhatsApp en Telegram manda el texto tal cual por WhatsApp", async () => {
  prepararEntorno();
  try {
    const { default: handler } = await import("../pages/api/dm/telegram.js");
    const res = respuesta();
    await handler(pedido(novedad(avisoWa(), "Buenas! Mañana a las 15 te llamo", 8001)), res);
    assert.equal(res.codigo, 200);
    assert.ok(await esperar(() => deGraph().length > 0), "no salió el pedido a WhatsApp");
    const [salida] = deGraph();
    assert.equal(salida.url, "https://graph.facebook.com/v23.0/77001/messages");
    assert.equal(salida.cuerpo.to, NUMERO);
    assert.equal(salida.cuerpo.text.body, "Buenas! Mañana a las 15 te llamo");
    assert.ok(await esperar(() => deTelegram().some((p) => /Mandado a Juan Perez por WhatsApp/.test(p.cuerpo?.text || ""))),
      "no le contestó por Telegram que salió");
  } finally {
    limpiarEntorno();
  }
});

test("responder el aviso de una charla de Instagram no toca WhatsApp", async () => {
  prepararEntorno();
  try {
    const { default: handler } = await import("../pages/api/dm/telegram.js");
    const dm = "🔔 DM: un lead escribió\n\nQuién: Juan (1234567890)\nDijo: hola";
    const res = respuesta();
    await handler(pedido(novedad(dm, "decile que le mando el link", 8002)), res);
    assert.equal(res.codigo, 200);
    // Fue por el camino de los DM: esa charla no está en la base del agente y se lo dice.
    assert.ok(await esperar(() => deTelegram().some((p) => /no encuentro esa charla/.test(p.cuerpo?.text || ""))),
      "no siguió por el camino del agente de DM");
    assert.deepEqual(deGraph(), [], "una charla de Instagram no sale por WhatsApp");
  } finally {
    limpiarEntorno();
  }
});

test("el secreto del webhook sigue siendo la puerta: sin él no entra ni un WhatsApp", async () => {
  prepararEntorno();
  try {
    const { default: handler } = await import("../pages/api/dm/telegram.js");
    const res = respuesta();
    const req = { ...pedido(novedad(avisoWa(), "hola", 8003)), headers: { "x-telegram-bot-api-secret-token": "otro" } };
    await handler(req, res);
    assert.equal(res.codigo, 401);
    assert.deepEqual(deGraph(), []);
  } finally {
    limpiarEntorno();
  }
});
