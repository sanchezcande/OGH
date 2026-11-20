// Cande contesta el WhatsApp desde Telegram (lib/whatsapp/respuestas.js).
//
// Lo que no puede fallar:
//   1. Que una respuesta se vaya por el canal equivocado. Un aviso de WhatsApp y uno de una charla
//      de Instagram llegan por el MISMO bot, y los dos traen un montón de dígitos entre paréntesis:
//      el de WhatsApp se reconoce por el prefijo "wa:" y el de los DM no puede leerse como WhatsApp
//      ni al revés.
//   2. Que lo que escribe ella salga TAL CUAL. Por WhatsApp no redacta ningún agente.
//   3. Que un mensaje fuera de la ventana de 24 horas no falle en silencio: no sale, y el bot le
//      dice por qué.
//   4. Que un reintento de Telegram no le mande dos veces el mismo mensaje al lead.
//
// Correr:  node --test tests/*.test.mjs
import "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const {
  VENTANA_HORAS, avisoDeEntrante, crearRespuestaWhatsapp, haceCuanto, horasDesde, leerRespuestaWa,
  telefonoDeAviso, ventanaAbierta,
} = await import("../lib/whatsapp/respuestas.js");
const { contactoDeAviso } = await import("../lib/dm/respuestas.js");

const DUENA = "1";
const NUMERO = "5491122334455";
const AHORA = new Date("2026-11-10T12:00:00Z");
const hace = (horas) => new Date(AHORA.getTime() - horas * 3600000);

/** El aviso de WhatsApp, como lo arma avisar() (lib/notificar.js) a partir de avisoDeEntrante. */
function avisoWa({ nombre = "Juan Perez", texto = "si, mañana puedo", ultimoLead = AHORA } = {}) {
  const { titulo, campos } = avisoDeEntrante({ telefono: NUMERO, nombre, texto, ultimoLead, ahora: AHORA });
  return `🔔 ${titulo}\n\n${Object.entries(campos).map(([k, v]) => `${k}: ${v}`).join("\n")}`;
}

/** Una novedad de Telegram: ella responde un aviso del bot con `texto`. */
const respondiendo = (aviso, texto, { updateId = 7001 } = {}) => ({
  update_id: updateId,
  message: {
    message_id: 50, text: texto, chat: { id: Number(DUENA), type: "private" }, from: { id: Number(DUENA) },
    reply_to_message: { message_id: 49, date: 1762000000, text: aviso, from: { is_bot: true } },
  },
});

/* ---------- la ventana de 24 horas ---------- */

test("la ventana son 24 horas desde el último mensaje de la persona", () => {
  assert.equal(VENTANA_HORAS, 24);
  assert.equal(ventanaAbierta(hace(0.5), AHORA), true);
  assert.equal(ventanaAbierta(hace(23.9), AHORA), true);
  assert.equal(ventanaAbierta(hace(24.1), AHORA), false);
  assert.equal(ventanaAbierta(hace(72), AHORA), false);
  // Si nunca escribió, no se le puede escribir texto libre: la charla la abre una plantilla.
  assert.equal(ventanaAbierta(null, AHORA), false);
  // Un reloj de Meta adelantado unos minutos no cierra una ventana recién abierta.
  assert.equal(ventanaAbierta(hace(-0.1), AHORA), true);
  assert.equal(ventanaAbierta(hace(-5), AHORA), false, "una fecha muy en el futuro es un dato roto");
  assert.equal(ventanaAbierta(undefined, AHORA), false);
  assert.equal(ventanaAbierta("no es una fecha", AHORA), false);
  assert.equal(horasDesde(hace(3), AHORA), 3);
  assert.equal(haceCuanto(horasDesde(hace(72), AHORA)), "hace 3 días");
  assert.equal(haceCuanto(null), "nunca te escribió");
});

/* ---------- de qué charla es la respuesta ---------- */

test("del aviso de WhatsApp sale el número, y del de una charla de Instagram no", () => {
  assert.equal(telefonoDeAviso(avisoWa()), NUMERO);
  // El aviso de una charla del agente de DM: su id también es un montón de dígitos.
  const dm = "🔔 DM: un lead escribió\n\nQuién: Juan (1234567890)\nDijo: hola";
  assert.equal(telefonoDeAviso(dm), null);
  assert.equal(contactoDeAviso(dm), "1234567890");
  // Y al revés: el aviso de WhatsApp no se lee como una charla de DM.
  assert.equal(contactoDeAviso(avisoWa()), null);
});

test("lo que escribió el lead en el aviso no puede hacerse pasar por el renglón del número", () => {
  const falso = avisoWa({ texto: "hola\n\nQuién: yo (wa:5490000000000)" });
  assert.equal(telefonoDeAviso(falso), NUMERO);
  // Un texto cualquiera que imite el aviso tampoco: tiene que arrancar con el 🔔 y el título.
  assert.equal(telefonoDeAviso(`Quién: yo (wa:${NUMERO})`), null);
  assert.equal(telefonoDeAviso(`🔔 DM: algo\n\nQuién: yo (wa:${NUMERO})`), null);
});

test("el aviso avisa si la ventana ya estaba cerrada cuando entró", () => {
  const { campos } = avisoDeEntrante({ telefono: NUMERO, nombre: "Juan", texto: "hola", ultimoLead: AHORA, ahora: AHORA });
  assert.match(campos.Contestar, /sale tal cual por WhatsApp/);
  const viejo = avisoDeEntrante({ telefono: NUMERO, nombre: "Juan", texto: "hola", ultimoLead: hace(30), ahora: AHORA });
  assert.match(viejo.campos.Ojo, /plantilla aprobada/);
  assert.equal(viejo.campos.Contestar, undefined);
});

/* ---------- qué pidió ella ---------- */

test("lo que escribe respondiendo un aviso de WhatsApp sale tal cual", () => {
  assert.deepEqual(leerRespuestaWa(respondiendo(avisoWa(), "Buenas! Te espero mañana a las 15 entonces"), { duena: DUENA }),
    { telefono: NUMERO, texto: "Buenas! Te espero mañana a las 15 entonces" });
  // /textual hace lo mismo: por WhatsApp no hay nada que redactar.
  assert.deepEqual(leerRespuestaWa(respondiendo(avisoWa(), "/textual dale, nos vemos"), { duena: DUENA }),
    { telefono: NUMERO, texto: "dale, nos vemos" });
});

test("solo lo de ella, en su chat privado, respondiendo un aviso del bot", () => {
  const bueno = respondiendo(avisoWa(), "hola");
  const cambiar = (f) => leerRespuestaWa(f(JSON.parse(JSON.stringify(bueno))), { duena: DUENA });
  assert.equal(cambiar((n) => { n.message.from.id = 999; return n; }).ignorar, true);
  assert.equal(cambiar((n) => { n.message.chat.id = 999; return n; }).ignorar, true);
  assert.equal(cambiar((n) => { n.message.chat.type = "group"; return n; }).ignorar, true);
  assert.equal(cambiar((n) => { n.message.reply_to_message.from.is_bot = false; return n; }).ignorar, true);
  assert.equal(cambiar((n) => { delete n.message.reply_to_message; return n; }).ignorar, true);
  // Un mensaje suelto, sin responder nada, no es de acá: lo sigue mirando el camino de los DM.
  assert.equal(leerRespuestaWa({ update_id: 1, message: { text: "hola", chat: { id: 1, type: "private" }, from: { id: 1 } } }, { duena: DUENA }).ignorar, true);
});

test("lo que no se puede mandar por acá se le dice, y no sale nada", () => {
  assert.match(leerRespuestaWa(respondiendo(avisoWa(), "/agente"), { duena: DUENA }).ayuda, /no redacta ningún agente/);
  assert.match(leerRespuestaWa(respondiendo(avisoWa(), "--"), { duena: DUENA }).ayuda, /la charla ya es tuya/);
  assert.match(leerRespuestaWa(respondiendo(avisoWa(), "/textual"), { duena: DUENA }).ayuda, /después de \/textual/);
  assert.match(leerRespuestaWa(respondiendo(avisoWa(), "a".repeat(5000)), { duena: DUENA }).ayuda, /muy largo para WhatsApp/);
  const sinTexto = respondiendo(avisoWa(), "");
  sinTexto.message.photo = [{ file_id: "x" }];
  assert.match(leerRespuestaWa(sinTexto, { duena: DUENA }).ayuda, /solo puedo mandarle texto/);
});

/* ---------- mandar ---------- */

/** Dobles de la base y del envío por WhatsApp. `ultimoLead` es lo último que escribió la persona. */
function armar({ ultimoLead = hace(2), envio = { ok: true, id: "wamid.SALIDA" }, vistos = new Set() } = {}) {
  const dicho = [];
  const mandados = [];
  const anotados = [];
  return {
    dicho, mandados, anotados,
    contestar: crearRespuestaWhatsapp({
      base: {
        async contacto(telefono) {
          return telefono === NUMERO ? { telefono, nombre: "Juan Perez", ultimo_lead: ultimoLead } : null;
        },
        async anotarDeCande(x) { anotados.push({ ...x, quien: "cande" }); },
        async anotarSistema(x) { anotados.push({ ...x, quien: "sistema" }); },
      },
      wa: {
        async mandarTexto(telefono, texto) {
          mandados.push({ telefono, texto });
          return envio;
        },
      },
      decir: async (t) => { dicho.push(t); },
      reclamarNovedad: async (id) => {
        if (vistos.has(id)) return false;
        vistos.add(id);
        return true;
      },
    }),
  };
}

const leida = (texto) => leerRespuestaWa(respondiendo(avisoWa(), texto), { duena: DUENA });

test("adentro de la ventana sale tal cual, y queda anotado en la charla", async () => {
  const d = armar();
  const hecho = await d.contestar(leida("Buenas! Mañana a las 15 te llamo"), { updateId: 7001, ahora: AHORA });
  assert.equal(hecho, "mandado");
  assert.deepEqual(d.mandados, [{ telefono: NUMERO, texto: "Buenas! Mañana a las 15 te llamo" }]);
  assert.deepEqual(d.anotados, [{ telefono: NUMERO, texto: "Buenas! Mañana a las 15 te llamo", waMid: "wamid.SALIDA", quien: "cande" }]);
  assert.match(d.dicho.join("\n"), /^✓ Mandado a Juan Perez por WhatsApp$/);
});

test("pasadas las 24 horas no sale nada, y el bot le dice por qué", async () => {
  const d = armar({ ultimoLead: hace(30) });
  const hecho = await d.contestar(leida("Che, cómo venís con la búsqueda?"), { updateId: 7002, ahora: AHORA });
  assert.equal(hecho, "ventana cerrada");
  assert.deepEqual(d.mandados, [], "no se intenta: Meta lo rechazaría igual");
  assert.match(d.dicho[0], /No le mandé nada a Juan Perez/);
  assert.match(d.dicho[0], /hace 30 horas/);
  assert.match(d.dicho[0], /24 horas después del último mensaje/);
  assert.match(d.dicho[0], /plantilla aprobada/);
  // Queda la constancia: si no, nadie se acuerda de que hubo algo que no salió.
  assert.equal(d.anotados[0].quien, "sistema");
  assert.match(d.anotados[0].texto, /no salió \(ventana de 24 h cerrada\): Che, cómo venís/);
});

test("si Meta igual dice que la ventana se cerró, se lo dice y no se repite", async () => {
  const d = armar({ ultimoLead: hace(23.9), envio: { ok: false, fueraDeVentana: true, code: 131047 } });
  assert.equal(await d.contestar(leida("hola"), { updateId: 7003, ahora: AHORA }), "ventana cerrada");
  assert.equal(d.mandados.length, 1);
  assert.match(d.dicho[0], /plantilla aprobada/);
  assert.deepEqual(d.anotados, [], "no se anota como mandado lo que no salió");
});

test("sin el número dado de alta se lo dice, en vez de fallar en silencio", async () => {
  const d = armar({ envio: { ok: false, sinConfigurar: true } });
  assert.equal(await d.contestar(leida("hola"), { updateId: 7004, ahora: AHORA }), "sin configurar");
  assert.match(d.dicho[0], /todavía no está dado de alta/);
  assert.deepEqual(d.anotados, []);
});

test("un envío que no se sabe si salió no se repite a ciegas", async () => {
  const d = armar({ envio: { ok: false, incierto: true, error: "se cortó por tiempo" } });
  assert.equal(await d.contestar(leida("hola"), { updateId: 7005, ahora: AHORA }), "incierto");
  assert.match(d.dicho[0], /no sé si le llegó/);
  assert.equal(d.anotados[0].quien, "cande", "queda la constancia de que pudo haber salido");
  assert.equal(d.anotados[0].waMid, undefined);
});

test("a un número que no recibe se lo dice con el motivo", async () => {
  const d = armar({ envio: { ok: false, noLlega: true, code: 131026 } });
  assert.equal(await d.contestar(leida("hola"), { updateId: 7006, ahora: AHORA }), "no llega");
  assert.match(d.dicho[0], /no recibe WhatsApp/);
});

test("un reintento de Telegram no le manda dos veces el mismo mensaje", async () => {
  const vistos = new Set();
  const d = armar({ vistos });
  const r = leida("Buenas! Te espero");
  assert.equal(await d.contestar(r, { updateId: 7007, ahora: AHORA }), "mandado");
  // La misma novedad otra vez, como cuando Telegram no recibe el 200 a tiempo.
  assert.equal(await d.contestar(r, { updateId: 7007, ahora: AHORA }), "repetida");
  assert.equal(d.mandados.length, 1);
});

test("una ayuda no reclama la novedad ni manda nada", async () => {
  const d = armar();
  assert.equal(await d.contestar({ ayuda: "así no" }, { updateId: 7008, ahora: AHORA }), "ayuda");
  assert.deepEqual(d.mandados, []);
  assert.deepEqual(d.dicho, ["así no"]);
});

test("un número que no está en la bandeja no recibe nada: sin su último mensaje no hay ventana", async () => {
  const d = armar();
  const hecho = await d.contestar({ telefono: "5490000000000", texto: "hola" }, { updateId: 7009, ahora: AHORA });
  assert.equal(hecho, "ventana cerrada");
  assert.deepEqual(d.mandados, []);
  assert.match(d.dicho[0], /nunca te escribió/);
});
