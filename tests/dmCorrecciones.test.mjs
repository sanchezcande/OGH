// Correcciones del agente por Telegram (09/11): qué cuenta como corrección, cómo se baja la captura y qué vuelve al
// cerebro. Textos e ids inventados: el repo es público.
import "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const { leerCorreccion, bajarFoto, cortarParaTelegram, MARCA_RESPUESTA, TOPE_TELEGRAM } = await import("../lib/dm/correcciones.js");
const { leerRespuesta } = await import("../lib/dm/respuestas.js");

const DUENA = "111";
const AVISO = "🔔 DM: entró alguien nuevo al agente\n\nQuién: Lead de prueba (987654)";
const novedad = (m, update_id = 5000) => ({
  update_id, message: { message_id: 70, chat: { id: 111, type: "private" }, from: { id: 111 }, ...m },
});
const delBot = (text) => ({ from: { is_bot: true }, text });
const FOTO = [{ file_id: "chica", file_size: 100, width: 90, height: 160 }, { file_id: "grande", file_size: 90000, width: 1080, height: 1920 }];

test("una captura es siempre una corrección (con la foto más grande), suelta o respondiendo un aviso", () => {
  const suelta = leerCorreccion(novedad({ photo: FOTO, caption: "wtf esto" }), { duena: DUENA });
  assert.deepEqual(suelta.fotos, ["grande"]);
  assert.equal(suelta.texto, "wtf esto");
  assert.equal(suelta.contacto, null);
  const conAviso = leerCorreccion(novedad({ photo: FOTO, reply_to_message: delBot(AVISO) }), { duena: DUENA });
  assert.equal(conAviso.contacto, "987654", "respondiendo un aviso ya se sabe de qué charla es");
  const archivo = leerCorreccion(novedad({ document: { file_id: "doc", mime_type: "image/png" } }), { duena: DUENA });
  assert.deepEqual(archivo.fotos, ["doc"]);
  const album = leerCorreccion(novedad({ photo: FOTO, media_group_id: "999" }), { duena: DUENA });
  assert.equal(album.grupo, "999");
});

test("un texto es corrección solo si arranca como queja; una indicación para el lead sigue su camino aunque diga wtf en el medio", () => {
  for (const t of ["wtf le volvió a mandar el link", "WTFFF", "/corregir no le preguntes eso", "corregí"]) {
    assert.ok(leerCorreccion(novedad({ text: t }), { duena: DUENA }), t);
  }
  // Revisión del 09/11: estos iban al corrector y no le llegaban al lead (o disparaban una corrida por un "ok").
  for (const t of ["decile que sí, que el lunes arrancamos", "ok", "gracias!", "--", "corregí lo del precio, decile que son 27"]) {
    assert.equal(leerCorreccion(novedad({ text: t }), { duena: DUENA }), null, t);
  }
  for (const t of ["decile que el lunes lo llamo", "jaja wtf, decile que no pasa nada y que lo espero el lunes", "decile que wtf, que ya le pasé el link"]) {
    assert.equal(leerCorreccion(novedad({ text: t, reply_to_message: delBot(AVISO) }), { duena: DUENA }), null, t);
    assert.equal(leerRespuesta(novedad({ text: t, reply_to_message: delBot(AVISO) }), { duena: DUENA }).accion, "indicacion", t);
  }
  for (const queja of ["wtf", "WTFFF esto", "/corregir no le preguntes eso"]) {
    assert.equal(leerCorreccion(novedad({ text: queja, reply_to_message: delBot(AVISO) }), { duena: DUENA })?.contacto, "987654", queja);
  }
});

test("'deshacé' (el mensaje entero) vuelve atrás y nunca va al lead; responder lo que contestó el bot sigue esa corrección", () => {
  for (const t of ["deshacé", "Deshacelo!", "/deshacer", "volvé atrás"]) assert.equal(leerCorreccion(novedad({ text: t }), { duena: DUENA })?.deshacer, true, t);
  const aviso = leerCorreccion(novedad({ text: "deshacé", reply_to_message: delBot(AVISO) }), { duena: DUENA });
  assert.equal(aviso?.deshacer, true, "respondiendo un aviso tampoco sale como indicación");
  assert.equal(aviso.contacto, null);
  assert.equal(leerCorreccion(novedad({ text: "volvé atrás con lo de Juan y decile que sí" }), { duena: DUENA }), null);
  const sigue = leerCorreccion(novedad({ text: "no, era otra cosa", reply_to_message: { ...delBot(`${MARCA_RESPUESTA} Entendí: algo de prueba`), message_id: 321 } }), { duena: DUENA });
  assert.match(sigue.respondiendo, /Entendí: algo de prueba/);
  assert.equal(sigue.respondeA, 321, "para sumarle la corrección que siguió");
  assert.equal(leerCorreccion(novedad({ text: "/agente" }), { duena: DUENA }), null);
  assert.equal(leerCorreccion(novedad({ text: "wtf" }, 5001), { duena: "222" }), null, "solo Cande, en su chat privado");
  assert.equal(leerCorreccion({ update_id: 5002, message: { chat: { id: 111, type: "group" }, from: { id: 111 }, text: "wtf" } }, { duena: DUENA }), null);
  assert.equal(leerCorreccion(novedad({ text: "" }), { duena: DUENA }), null);
});

test("la tanda: van juntas solo las seguidas y de una misma charla, y un deshacer va solo", async () => {
  const { tanda } = await import("../lib/dm/correccionesBase.js");
  const t0 = Date.parse("2026-11-09T10:00:00Z");
  const fila = (id, seg, extra = {}) => ({ id, creado: new Date(t0 + seg * 1000).toISOString(), contacto: null, deshacer: false, ...extra });
  assert.deepEqual(tanda([fila(1, 0), fila(2, 10), fila(3, 40), fila(4, 200)]).map((f) => f.id), [1, 2, 3], "el hueco de 160 s corta");
  assert.deepEqual(tanda([fila(1, 0, { contacto: "a" }), fila(2, 5, { contacto: "b" })]).map((f) => f.id), [1], "otra charla corta");
  assert.deepEqual(tanda([fila(1, 0), fila(2, 5, { contacto: "a" }), fila(3, 6)]).map((f) => f.id), [1, 2, 3]);
  assert.deepEqual(tanda([fila(1, 0, { deshacer: true }), fila(2, 5)]).map((f) => f.id), [1], "el deshacer va solo");
  assert.deepEqual(tanda([fila(1, 0), fila(2, 5, { deshacer: true })]).map((f) => f.id), [1]);
  assert.deepEqual(tanda([]), []);
});

test("la captura se baja en el sitio (el link de Telegram lleva el token) y vuelve en base64; si falla o es enorme, null", async () => {
  const pedidos = [];
  const pedir = async (url) => {
    pedidos.push(url);
    if (url.includes("/getFile")) return { json: async () => ({ ok: true, result: { file_path: "photos/x.png", file_size: 4 } }) };
    return { ok: true, arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]).buffer };
  };
  assert.deepEqual(await bajarFoto("TOKEN", "grande", { pedir }), { tipo: "image/png", datos: "AQIDBA==" });
  assert.equal(pedidos.length, 2);
  const enorme = async () => ({ json: async () => ({ ok: true, result: { file_path: "a.jpg", file_size: 50 * 1024 * 1024 } }) });
  assert.equal(await bajarFoto("TOKEN", "x", { pedir: enorme }), null);
  assert.equal(await bajarFoto("TOKEN", "x", { pedir: async () => { throw new Error("red"); } }), null);
  assert.equal(await bajarFoto(null, "x", { pedir }), null);
});

test("lo que se le contesta a Cande entra en un mensaje de Telegram", () => {
  assert.equal(cortarParaTelegram("hola"), "hola");
  assert.equal(cortarParaTelegram("x".repeat(9000)).length, TOPE_TELEGRAM);
});
