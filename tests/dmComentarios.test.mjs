// "Comentá CV y te mando la lista" sin ManyChat (lib/dm/comentarios.js).
//
// Lo que no puede fallar:
//   1. Que a nadie le llegue el mismo DM dos veces. El comentario queda tomado en la base ANTES de
//      mandar, y si ya estaba tomado no se manda nada.
//   2. Que la palabra no se dispare adentro de una frase. El automático viejo de ManyChat era
//      "contiene CV" y se metía en charlas reales: hubo que apagarlo el 08/10.
//   3. Que si el DM queda en una solicitud sin aceptar (2534037) Cande se entere: eso solo lo
//      destraba ella desde la app.
//
// Los comentarios de las pruebas son los de verdad: los 113 que tenía la cuenta el 30/10.
//
// Desde el 02/11 el mismo cron contesta "DEV" (founders, la llamada) con otro texto y las mismas
// trabas: al final de este archivo.
//
// Correr:  node --test tests/*.test.mjs
import "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { respuesta } from "./dobles/preparar.mjs";

const {
  RESPUESTAS_PUBLICAS, respuestaPublica, responderEnPublico,
  AUTOMATICO_CV_MANYCHAT, AUTOMATICO_DEV_MANYCHAT, FRESCO_MINUTOS, MENSAJES_HONDOS, MENSAJES_POR_HILO, TEXTO_CV, TEXTO_DEV, VENTANA_DIAS,
  comentariosParaContestar, contestadoDesde, contestarComentarios, enVentana, esDmDeCV, esDmDeDev, esPalabraCV, esPalabraDEV, mediosParaLeer, motivoDelError,
  tipoDelComentario, TEXTO_FORMULARIO, LINK_FORMULARIO, PALABRA_FORMULARIO, esPalabraFormulario, esDmDeFormulario,
} = await import("../lib/dm/comentarios.js");
const { esAutomatico, claveTexto } = await import("../lib/dm/instagram.js");

const CUENTA = { user_id: "17841401753799786", username: "candelariasanchez" };
const ahora = new Date("2026-10-30T06:00:00Z");

test("pide la lista: la palabra sola, o con un saludo, un gracias o emojis", () => {
  // Todos salieron de los comentarios reales del 29 y 30/10.
  const piden = [
    "Cv", "CV", "cv", "  CV  ", "CV.", "CV 🙌🏼", "Cv 🙌🏻🇦🇷",
    "CV holaaaaaa😂", "Holaaa! Cv. 🙌🏻", "CV, thanks", "cv porfa", "Hola, CV please", "cv gracias!!",
  ];
  for (const t of piden) assert.equal(esPalabraCV(t), true, `tendría que disparar con ${JSON.stringify(t)}`);
});

test("adentro de una frase NO dispara", () => {
  const no = [
    "Si... tiene buen cvlo",       // real, 29/10: por esto "contiene CV" no sirve
    "CV rico 😋",                  // real, 29/10: no está pidiendo la lista
    "mandé muchos cv y nada",
    "ya te mandé el cv",
    "te paso mi cv por mail?",
    "cvs", "cvv", "curriculum",
    "Le tengo envidia a tu exnovio",
    "Mas videitos en la playa, 🙏",
    "", "   ", null, undefined, "🙌🏼",
  ];
  for (const t of no) assert.equal(esPalabraCV(t), false, `no tendría que disparar con ${JSON.stringify(t)}`);
});

test("la ventana de la private reply: 7 días, con margen", () => {
  assert.equal(VENTANA_DIAS, 7);
  assert.equal(FRESCO_MINUTOS, 0);
  assert.equal(enVentana("2026-10-29T17:32:15+0000", ahora), true, "de ayer sí");
  assert.equal(enVentana("2026-10-24T03:47:12+0000", ahora), true, "de hace 6 días todavía");
  // Un comentario de 6 días y 23 horas se puede vencer entre que se lo lee y que sale el DM.
  assert.equal(enVentana("2026-10-23T07:00:00+0000", ahora), false, "a punto de vencerse, no se toma");
  assert.equal(enVentana("2026-10-20T14:48:26+0000", ahora), false, "de hace 10 días no");
  assert.equal(enVentana("2026-10-31T00:00:00+0000", ahora), false, "del futuro tampoco");
  // Recién hecho: la espera existía por ManyChat, que a los contactos que ya tenía les contestaba a
  // los segundos. Con ManyChat dado de baja (05/11) no hay a quién esperar, y el que comenta está
  // mirando el reel justo ahí: se contesta en la misma vuelta en que se lo lee.
  assert.equal(enVentana("2026-10-30T05:59:30+0000", ahora), true, "de hace medio minuto también");
  assert.equal(enVentana("2026-10-30T06:00:00+0000", ahora), true, "el de este mismo segundo sale igual");
  assert.equal(enVentana("cualquier cosa", ahora), false);
});

test("de los comentarios de un post salen los que piden la lista, los más nuevos primero", () => {
  const cs = [
    { id: "1", text: "Cv", timestamp: "2026-10-29T10:00:00+0000", username: "uno" },
    { id: "2", text: "Le tengo envidia a tu exnovio", timestamp: "2026-10-29T11:00:00+0000", username: "dos" },
    { id: "3", text: "CV 🙌🏼", timestamp: "2026-10-29T12:00:00+0000", username: "tres" },
    { id: "4", text: "CV", timestamp: "2026-10-01T12:00:00+0000", username: "cuatro" },
    { id: "5", text: "cv", timestamp: "2026-10-29T13:00:00+0000", username: CUENTA.username },
    { id: "6", text: "cv", timestamp: "2026-10-29T14:00:00+0000", username: "SEIS", from: { id: CUENTA.user_id } },
  ];
  const salen = comentariosParaContestar(cs, CUENTA, ahora);
  assert.deepEqual(salen.map((c) => c.id), ["3", "1"], "el de ella misma, el viejo y el que no pide no salen");
});

test("el texto es uno solo, lleva el link y la red de la bandeja lo reconoce como automático", () => {
  assert.equal(typeof TEXTO_CV, "string");
  assert.match(TEXTO_CV, /opengatehub\.com\/devs/, "el link del formulario va adentro: Instagram deja un solo mensaje");
  assert.ok(!/\?ig=|\?de=|utm_/.test(TEXTO_CV), "el link va limpio: todavía no hay charla a la que atarlo");
  assert.ok(TEXTO_CV.length <= 1000, "Instagram corta a los 1.000 caracteres");
  // Si la bandeja no lo reconoce, lo que salió de la cuenta pasa por algo que Cande escribió a mano
  // y el agente se sale de esa charla antes de decir una palabra (lib/dm/bandeja.js).
  assert.equal(esAutomatico(TEXTO_CV, [claveTexto(AUTOMATICO_CV_MANYCHAT)]), true);
});

test("sin guion largo ni signos de apertura", () => {
  assert.ok(!TEXTO_CV.includes("—"), TEXTO_CV);
  assert.ok(!/[¿¡]/.test(TEXTO_CV), TEXTO_CV);
});

test("los motivos de los errores de Instagram", () => {
  assert.equal(motivoDelError({ code: -1, subcode: 2534024 }), "vencido");
  assert.equal(motivoDelError({ code: -1, message: "el comentario es demasiado antiguo para recibir una respuesta" }), "vencido");
  assert.equal(motivoDelError({ code: 100, subcode: 2534025 }), "ya_contestado");
  assert.equal(motivoDelError({ code: 100, subcode: 2534014 }), "ya_contestado");
  assert.equal(motivoDelError({ code: 100, subcode: 2534037 }), "sin_aceptar");
  assert.equal(motivoDelError({ code: 100, message: "La página no es propietaria del hilo" }), "sin_aceptar");
  assert.equal(motivoDelError({ code: 190 }), "otro");
});

// ---- la vuelta completa, con dobles ----

/**
 * Un cliente de Instagram y una base de mentira. `fallas` dice con qué error contesta cada
 * comentario; `bandeja` son las charlas que ya existen (para la traba del automático de ManyChat).
 */
function armar({ comentarios, fallas = {}, fallasPublicas = {}, tomados = new Set(), bandeja = null, hondas = {}, conDm = null, conDmForm = null } = {}) {
  const base = { filas: new Map(), tomados };
  // Sin bandeja: una sola charla vieja, de alguien que no comentó. Así nadie queda tapado por la
  // traba y la bandeja cubre desde antes de todos los comentarios.
  const hilos = bandeja || [{ otro: { usuario: "otracualquiera" }, actualizado: new Date("2026-10-20T00:00:00Z"), mensajes: [] }];
  const ig = {
    pedidos: [],
    cuenta: async () => CUENTA,
    medios: async () => [{ id: "m1", timestamp: "2026-10-29T15:15:32+0000", comments_count: comentarios.length, permalink: "https://instagram.com/p/x" }],
    comentarios: async () => comentarios,
    // Como la API: de cada charla, solo los `mensajes` más nuevos que se pidieron.
    pagina: async ({ mensajes = 5 } = {}) => ({ lista: hilos.map((h) => ({ ...h, mensajes: h.mensajes.slice(0, mensajes) })), despues: null }),
    // La charla sola, más atrás (para cuando la bandeja no llega a ver hasta el comentario).
    hondas: [],
    hiloDe: async (igsid, n) => {
      ig.hondas.push({ igsid, n });
      const h = hondas[igsid];
      return h ? { ...h, mensajes: h.mensajes.slice(0, n) } : null;
    },
    responderComentario: async (id, texto) => {
      ig.pedidos.push({ id, texto });
      if (fallas[id]) throw fallas[id];
      return { recipient_id: `ig-${id}`, message_id: `m-${id}` };
    },
    // La respuesta pública de abajo del comentario. `fallasPublicas` dice con qué error contesta cada uno.
    publicas: [],
    responderPublico: async (id, texto) => {
      ig.publicas.push({ id, texto });
      if (fallasPublicas[id]) throw fallasPublicas[id];
      return { id: `r-${id}` };
    },
  };
  const avisos = [];
  const dobleBase = {
    tomarComentario: async (id, datos) => {
      // Un "sin_aceptar" al que ya le toca otro intento se puede volver a tomar: es el único estado
      // que vuelve, porque lo que lo frenaba (la solicitud) lo destraba Cande sin tocar el código.
      const vuelve = base.sinAceptarVencidos?.has(id) && base.filas.get(id)?.estado === "sin_aceptar";
      if (base.tomados.has(id) && !vuelve) return false;
      base.tomados.add(id);
      base.filas.set(id, { ...base.filas.get(id), ...datos, estado: "enviando" });
      return true;
    },
    anotarComentario: async (id, estado, extra = {}) => base.filas.set(id, { ...base.filas.get(id), estado, ...extra }),
    // Como la base: la toma una sola vez y solo un comentario cuyo DM salió.
    tomarPublica: async (id) => {
      const f = base.filas.get(id);
      if (f?.estado !== "enviada" || f.publica) return false;
      base.filas.set(id, { ...f, publica: true });
      return true;
    },
    // `dudasVencidas`: las dudas que ya pasaron DUDA_HORAS y vuelven a mirarse.
    // `sinAceptarVencidos`: los que cayeron en una solicitud sin aceptar y ya les toca otro intento.
    comentariosEnLaBase: async (ids) => ids.filter((id) =>
      base.tomados.has(id) && !(base.dudasVencidas?.has(id)) && !(base.sinAceptarVencidos?.has(id))),
    comentariosParaReintentar: async (ids) => ids.filter((id) => base.sinAceptarVencidos?.has(id)),
    soltarDuda: async (id) => {
      if (base.filas.get(id)?.estado !== "en_duda") return;
      base.filas.delete(id);
      base.tomados.delete(id);
    },
    anotarEnDuda: async (id, datos) => {
      if (base.tomados.has(id) && base.filas.get(id)?.estado !== "en_duda") return;
      base.tomados.add(id);
      base.filas.set(id, { ...datos, estado: "en_duda" });
    },
    anotarYaContestado: async (id, datos) => {
      if (base.tomados.has(id)) return;
      base.tomados.add(id);
      base.filas.set(id, { ...datos, estado: "ya_tenia" });
    },
    // Como la base: con "formulario", los que ya tienen el del formulario; sin tipo, los de CV y DEV.
    ...(conDm || conDmForm ? { usuariosConDm: async (tipo = null) => (tipo === "formulario" ? conDmForm : conDm) || [] } : {}),
    soltarComentario: async (id) => {
      if (base.filas.get(id)?.estado === "enviando") {
        base.filas.delete(id);
        base.tomados.delete(id);
      }
    },
  };
  return { ig, base, dobleBase, avisos, avisar: async (titulo, campos) => avisos.push({ titulo, campos }) };
}

const CS = [
  { id: "c1", text: "Cv", timestamp: "2026-10-29T17:32:15+0000", username: "juliovasquez" },
  { id: "c2", text: "CV holaaaaaa😂", timestamp: "2026-10-29T17:23:49+0000", username: "elralphv" },
  { id: "c3", text: "CV rico 😋", timestamp: "2026-10-29T07:06:24+0000", username: "gezulupo17" },
  { id: "c4", text: "Holaaa! Cv. 🙌🏻", timestamp: "2026-10-29T17:14:38+0000", username: "valensquadrone" },
];

test("manda un DM por comentario que pide la lista, y ninguno al que no", async () => {
  const d = armar({ comentarios: CS });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.deepEqual(d.ig.pedidos.map((p) => p.id), ["c1", "c2", "c4"], "el más nuevo primero, y 'CV rico' afuera");
  assert.equal(d.ig.pedidos[0].texto, TEXTO_CV);
  assert.equal(r.enviadas, 3);
  assert.equal(d.base.filas.get("c1").estado, "enviada");
  assert.equal(d.base.filas.get("c1").igId, "ig-c1", "queda el id de la persona, que recién ahora se sabe");
  assert.equal(d.base.filas.has("c3"), false, "el que no pide la lista no se toca");
});

test("un comentario ya tomado no recibe nada: ni se intenta", async () => {
  const d = armar({ comentarios: CS, tomados: new Set(["c1", "c2"]) });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.deepEqual(d.ig.pedidos.map((p) => p.id), ["c4"]);
  assert.equal(r.enviadas, 1);
});

test("queda tomado ANTES de mandar: si se corta justo después, nadie lo repite", async () => {
  // El doble revienta DESPUÉS de mandar, como si la función se muriera al anotar el resultado.
  const d = armar({ comentarios: [CS[0]] });
  d.dobleBase.anotarComentario = async () => { throw new Error("se cortó la función"); };
  await assert.rejects(() => contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora }));
  assert.equal(d.base.tomados.has("c1"), true, "sigue tomado");
  // La vuelta siguiente, con la misma base, no lo intenta otra vez.
  const d2 = armar({ comentarios: [CS[0]], tomados: d.base.tomados });
  await contestarComentarios({ ig: d2.ig, base: d2.dobleBase, avisar: d2.avisar, ahora: () => ahora });
  assert.deepEqual(d2.ig.pedidos, [], "no se le manda el mismo DM dos veces");
});

test("el que ManyChat ya contestó queda anotado y no se reintenta", async () => {
  const fallas = { c1: Object.assign(new Error("The comment is invalid for a private reply"), { code: 100, subcode: 2534025 }) };
  const d = armar({ comentarios: CS, fallas });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(r.ya_contestado, 1);
  assert.equal(r.enviadas, 2, "los otros dos salen igual");
  assert.equal(d.base.filas.get("c1").estado, "ya_contestado");
  assert.deepEqual(d.avisos, [], "eso no es para molestarla: es la traba funcionando");
});

test("si el DM queda en una solicitud sin aceptar, le avisa a Cande", async () => {
  const fallas = { c1: Object.assign(new Error("La página no es propietaria del hilo"), { code: 100, subcode: 2534037 }) };
  const d = armar({ comentarios: CS, fallas });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(r.sin_aceptar, 1);
  assert.equal(d.avisos.length, 1);
  assert.match(d.avisos[0].campos.Quién, /juliovasquez/);
  assert.match(d.avisos[0].campos.Hacé, /acept/i, "le dice qué tiene que hacer ella");
  assert.equal(r.enviadas, 2, "los demás no se frenan por eso");
});

test("un pedido que se cortó por tiempo no se reintenta: pudo haber salido", async () => {
  const fallas = { c1: Object.assign(new Error("Instagram tardó más de 12 segundos"), { demora: true }) };
  const d = armar({ comentarios: CS, fallas });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(d.base.filas.get("c1").estado, "enviando", "sigue tomado, nadie lo vuelve a agarrar");
  assert.match(d.base.filas.get("c1").detalle, /incierta/);
  assert.equal(r.enviadas, 0, "la vuelta corta ahí: si Instagram no contesta, no se le sigue pidiendo");
});

test("si Instagram pide despacio, el comentario se suelta para la vuelta siguiente", async () => {
  const fallas = { c1: Object.assign(new Error("calmate"), { code: 32 }) };
  const d = armar({ comentarios: CS, fallas });
  await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(d.base.tomados.has("c1"), false, "nada salió, así que se puede volver a intentar");
  // Y en la vuelta siguiente, sin la falla, sale.
  const d2 = armar({ comentarios: CS, tomados: d.base.tomados });
  await contestarComentarios({ ig: d2.ig, base: d2.dobleBase, avisar: d2.avisar, ahora: () => ahora });
  assert.ok(d2.ig.pedidos.some((p) => p.id === "c1"));
});

// ---- la traba contra el automático de ManyChat ----
//
// El 30/10 se descubrió, mandando uno de verdad, que el automático de CV de ManyChat seguía vivo y
// contestaba los comentarios a los 7 segundos: @juliovasquez_m.a recibió el mismo link dos veces.
// Desde entonces, a quien ya recibió algo de la cuenta desde que comentó no se le manda nada.

const DE_LA_CUENTA = { id: CUENTA.user_id, usuario: CUENTA.username };

/**
 * Una charla de la bandeja: `suya` dice si el último mensaje es de la cuenta, y `cuando` es cuándo
 * escribió la cuenta (si no se dice, a la hora `actualizado`).
 */
const hilo = (usuario, actualizado, suya, cuando = actualizado) => ({
  otro: { usuario, id: `ig-${usuario}` },
  actualizado: new Date(actualizado),
  mensajes: [suya
    ? { de: DE_LA_CUENTA, texto: "", creado: new Date(cuando) }
    : { de: { id: "otro", usuario }, texto: "hola", creado: new Date(actualizado) }],
});

/** Una charla con sus mensajes tal cual, los más nuevos primero: [quién ("cuenta" o "lead"), hora, texto]. */
const charla = (usuario, mensajes) => ({
  otro: { usuario, id: `ig-${usuario}` },
  actualizado: new Date(mensajes[0][1]),
  mensajes: mensajes.map(([quien, hora, texto = ""]) => ({
    de: quien === "cuenta" ? DE_LA_CUENTA : { id: `ig-${usuario}`, usuario }, texto, creado: new Date(hora),
  })),
});

/** `n` mensajes del lead seguidos, uno por minuto desde `desde`, los más nuevos primero. */
const delLead = (n, desde) => Array.from({ length: n }, (_, i) => ["lead", new Date(Date.parse(desde) + i * 60000).toISOString()]).reverse();

test("a quien ManyChat ya le contestó no se le manda nada", async () => {
  // ManyChat le contestó a c1 y a c2 a los segundos; a c4 no le contestó nadie.
  const bandeja = [
    hilo("juliovasquez", "2026-10-29T17:32:26Z", true),
    hilo("elralphv", "2026-10-29T17:23:56Z", true),
    hilo("valensquadrone", "2026-10-29T17:14:38Z", false),
    hilo("otracualquiera", "2026-10-29T06:00:00Z", true),
  ];
  const d = armar({ comentarios: CS, bandeja });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.deepEqual(d.ig.pedidos.map((p) => p.id), ["c4"], "solo el que quedó sin contestar");
  assert.equal(r.ya_tenia, 2);
  assert.equal(d.base.filas.has("c1"), false, "ni se toma: no hay nada que anotar");
});

test("un mensaje de la cuenta ANTERIOR al comentario no frena nada", async () => {
  // El que charló con Cande hace semanas y hoy vuelve a comentar CV tiene que recibir la lista.
  // Hasta el 31/10 quedaba salteado para siempre: alcanzaba con que la cuenta le hubiera escrito
  // alguna vez.
  const bandeja = [hilo("juliovasquez", "2026-10-29T17:32:26Z", true, "2026-10-09T12:00:00Z")];
  const d = armar({ comentarios: [CS[0]], bandeja });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.deepEqual(d.ig.pedidos.map((p) => p.id), ["c1"], "le tiene que llegar la lista");
  assert.equal(r.ya_tenia, 0);
});

test("y uno POSTERIOR sí: eso es que ya le contestaron este comentario", async () => {
  const bandeja = [hilo("juliovasquez", "2026-10-29T17:32:26Z", true, "2026-10-29T17:32:26Z")];
  const d = armar({ comentarios: [CS[0]], bandeja });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.deepEqual(d.ig.pedidos, [], "ya lo contestó ManyChat: mandarlo otra vez es el link dos veces");
  assert.equal(r.ya_tenia, 1);
});

test("una charla donde la cuenta no escribió no frena nada", async () => {
  const bandeja = [hilo("juliovasquez", "2026-10-29T17:32:15Z", false), hilo("otracualquiera", "2026-10-29T06:00:00Z", true)];
  const d = armar({ comentarios: [CS[0]], bandeja });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(r.enviadas, 1, "escribió él y nadie le contestó: es justo el lead que se pierde");
});

// ---- lo que cuenta es lo que la cuenta mandó DESPUÉS del comentario ----
//
// El 31/10 ManyChat dejó de contestarles a los contactos nuevos (la cuenta llegó al tope del plan) y
// este respaldo quedó solo. Una charla vieja con la cuenta no puede tapar un comentario nuevo: el
// 30/10 un dev comentó CV y su charla anterior con la cuenta era del 09/10.

test("contestadoDesde: cuenta lo que salió de la cuenta a partir del comentario, y el DM de CV cuando sea", () => {
  const t = Date.parse("2026-10-29T17:32:15Z");
  const m = (deLaCuenta, hora, texto = "") => ({ deLaCuenta, creado: hora ? new Date(hora) : null, texto });
  const una = (...mensajes) => [{ igsid: "x", pedidos: MENSAJES_POR_HILO, mensajes }];
  assert.equal(contestadoDesde(undefined, t), "no", "sin charla nadie le escribió");
  assert.equal(contestadoDesde(una(m(true, "2026-10-29T17:32:22Z")), t), "si", "ManyChat a los 7 segundos");
  assert.equal(contestadoDesde(una(m(true, "2026-10-29T17:32:15Z")), t), "si", "en el mismo segundo también");
  assert.equal(contestadoDesde(una(m(true, "2026-10-09T12:00:00Z")), t), "no", "la charla de hace semanas no tapa");
  assert.equal(contestadoDesde(una(m(false, "2026-10-29T17:40:00Z"), m(true, "2026-10-09T12:00:00Z")), t), "no", "escribió él después y nadie le contestó");
  assert.equal(contestadoDesde(una(m(true, "2026-10-20T12:00:00Z", AUTOMATICO_CV_MANYCHAT)), t), "si", "ya recibió el DM de CV de ManyChat por otro comentario");
  assert.equal(contestadoDesde(una(m(true, "2026-10-20T12:00:00Z", TEXTO_CV)), t), "si", "ya recibió el nuestro");
  assert.equal(contestadoDesde(una(m(true, null)), t), "si", "un mensaje de la cuenta sin fecha: la duda va del lado de no mandar");
  const muchos = Array.from({ length: MENSAJES_POR_HILO }, (_, i) => m(false, `2026-10-29T18:0${i}:00Z`));
  assert.equal(contestadoDesde(una(...muchos), t), "no_se", "no se llegó a ver hasta el comentario");
  assert.equal(contestadoDesde(una(...muchos.slice(1), m(false, "2026-10-29T17:00:00Z")), t), "no", "se ve uno de antes: lo del medio está todo");
  // Dos charlas de la misma persona se miran cada una por su lado: una cortada no se completa con la otra.
  assert.equal(contestadoDesde([...una(...muchos), ...una(m(false, "2026-10-28T10:00:00Z"))], t), "no_se");
});

test("esDmDeCV reconoce el DM de CV (el de ManyChat, el nuestro o lo que lleve el link) y nada más", () => {
  assert.equal(esDmDeCV(AUTOMATICO_CV_MANYCHAT), true);
  assert.equal(esDmDeCV(TEXTO_CV), true);
  assert.equal(esDmDeCV("anotate acá: https://www.opengatehub.com/devs"), true);
  assert.equal(esDmDeCV("Holii! Pudiste anotarte o te quedó para después?"), false);
  assert.equal(esDmDeCV("Holii! Gracias por escribir"), false);
  assert.equal(esDmDeCV(""), false);
  assert.equal(esDmDeCV(null), false);
});

test("una charla vieja con la cuenta no tapa un comentario nuevo", async () => {
  const bandeja = [
    // Comentó a las 17:32:15, después escribió por DM y nadie le contestó; Cande le había escrito el 09/10.
    charla("juliovasquez", [["lead", "2026-10-29T17:40:00Z"], ["cuenta", "2026-10-09T12:00:00Z"]]),
    // Cande le escribió el día anterior y recién después comentó.
    charla("valensquadrone", [["cuenta", "2026-10-28T20:00:00Z"]]),
  ];
  const d = armar({ comentarios: [CS[0], CS[3]], bandeja });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.deepEqual(d.ig.pedidos.map((p) => p.id), ["c1", "c4"]);
  assert.equal(r.ya_tenia, 0);
});

test("el flujo de ManyChat se reconoce aunque el lead haya contestado varias veces después", async () => {
  // ManyChat contestó a los 7 segundos y le pasó el link; después el lead escribió cuatro veces.
  const flujo = charla("juliovasquez", [
    ...delLead(4, "2026-10-29T17:40:00Z"),
    ["cuenta", "2026-10-29T17:32:22Z", AUTOMATICO_CV_MANYCHAT],
  ]);
  const d = armar({ comentarios: [CS[0]], bandeja: [flujo] });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(d.ig.pedidos.length, 0, "con 2 mensajes por charla no se veía la respuesta de ManyChat");
  assert.equal(r.ya_tenia, 1);
});

test("el que ya recibió el DM de CV y vuelve a comentar en otro reel no lo recibe de nuevo (si el DM está entre lo que se lee de su charla)", async () => {
  // Le llegó la lista el 20/10 por otro comentario; después charló y hoy vuelve a comentar CV.
  const d = armar({ comentarios: [CS[0]], bandeja: [charla("juliovasquez", [
    ["lead", "2026-10-21T10:00:00Z"], ["cuenta", "2026-10-21T09:00:00Z"], ["cuenta", "2026-10-20T12:00:07Z", TEXTO_CV],
  ])] });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(d.ig.pedidos.length, 0);
  assert.equal(r.ya_tenia, 1);
});

test("si la base dice que ya le salió el DM por otro comentario, no sale otro", async () => {
  const d = armar({ comentarios: [CS[0], CS[3]], conDm: ["juliovasquez"] });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.deepEqual(d.ig.pedidos.map((p) => p.id), ["c4"]);
  assert.equal(r.ya_tenia, 1);
});

test("dos comentarios con CV de la misma persona en la misma vuelta: le sale uno solo, por el más nuevo", async () => {
  const otro = { id: "c9", text: "CV", timestamp: "2026-10-29T17:20:00+0000", username: "JulioVasquez" };
  const d = armar({ comentarios: [CS[0], otro] });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.deepEqual(d.ig.pedidos.map((p) => p.id), ["c1"]);
  assert.equal(r.ya_tenia, 1);
});

test("si la bandeja no llega a ver hasta el comentario, se lee esa charla sola más atrás", async () => {
  // Cinco mensajes del lead encima: la respuesta de ManyChat, si la hubo, quedó más abajo.
  const encima = delLead(MENSAJES_POR_HILO, "2026-10-29T17:40:00Z");
  const contestada = charla("juliovasquez", [...encima, ["lead", "2026-10-29T17:33:00Z"], ["cuenta", "2026-10-29T17:32:22Z"]]);
  const sola = charla("valensquadrone", [...delLead(MENSAJES_POR_HILO, "2026-10-29T17:20:00Z"), ["cuenta", "2026-10-20T10:00:00Z"]]);
  const d = armar({
    comentarios: [CS[0], CS[3]],
    bandeja: [contestada, sola],
    hondas: { "ig-juliovasquez": contestada, "ig-valensquadrone": sola },
  });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.deepEqual(d.ig.hondas, [{ igsid: "ig-juliovasquez", n: MENSAJES_HONDOS }, { igsid: "ig-valensquadrone", n: MENSAJES_HONDOS }]);
  assert.deepEqual(d.ig.pedidos.map((p) => p.id), ["c4"], "a uno le había contestado ManyChat; el otro escribió cinco veces y nadie le contestó");
  assert.equal(r.ya_tenia, 1);
});

test("si ni leyendo la charla sola se llega al comentario, no se manda", async () => {
  const larga = charla("juliovasquez", delLead(MENSAJES_HONDOS + 2, "2026-10-29T17:40:00Z"));
  const d = armar({ comentarios: [CS[0]], bandeja: [larga], hondas: { "ig-juliovasquez": larga } });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(d.ig.pedidos.length, 0, "lo que vino antes de esos mensajes pudo ser la respuesta de ManyChat");
  assert.equal(r.sin_mirar, 1);
});

test("si Instagram falla al leer la charla sola, queda la duda y no se manda", async () => {
  const d = armar({ comentarios: [CS[0]], bandeja: [charla("juliovasquez", delLead(MENSAJES_POR_HILO, "2026-10-29T17:40:00Z"))] });
  d.ig.hiloDe = async () => { throw Object.assign(new Error("límite"), { code: 4 }); };
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(d.ig.pedidos.length, 0);
  assert.equal(r.sin_mirar, 1);
  assert.equal(d.base.filas.get("c1")?.estado, "en_duda", "se anota para buscarlo de nuevo en unas horas");
});

test("los que siguen en duda no le sacan la búsqueda a los más viejos en cada vuelta", async () => {
  // Cinco comentarios nuevos de gente que escribió más de 10 veces sin respuesta (siguen en duda aun
  // buscando su charla) y uno viejo de alguien sin charla: el que de verdad nunca recibió nada.
  const enDuda = Array.from({ length: 5 }, (_, i) => ({ id: `n${i}`, text: "CV", timestamp: `2026-10-29T17:1${i}:00+0000`, username: `dev${i}` }));
  const largas = enDuda.map((c) => charla(c.username, delLead(MENSAJES_HONDOS + 2, "2026-10-29T17:40:00Z")));
  const d = armar({
    comentarios: [...enDuda, viejoCon("cx", "devsincharla")],
    hondas: Object.fromEntries(largas.map((h) => [h.otro.id, h])),
  });
  d.ig.pagina = async ({ mensajes }) => ({ lista: largas.map((h) => ({ ...h, mensajes: h.mensajes.slice(0, mensajes) })), despues: "hay-mas" });
  const r1 = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(r1.buscadas, 5);
  assert.equal(d.ig.pedidos.length, 0, "la primera vuelta se gasta en los cinco nuevos");
  const r2 = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(r2.en_base, 5, "los que quedaron en duda no se vuelven a mirar enseguida");
  assert.deepEqual(d.ig.pedidos.map((p) => p.id), ["cx"], "y en la segunda le toca al viejo");
});

test("una duda que ya pasó sus horas se vuelve a buscar, y si ahora se sabe que nadie le contestó, sale", async () => {
  const d = armar({ comentarios: [CS[0]], bandeja: [charla("juliovasquez", delLead(MENSAJES_POR_HILO, "2026-10-29T17:40:00Z"))] });
  d.ig.hiloDe = async () => { throw Object.assign(new Error("límite"), { code: 4 }); };
  await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(d.base.filas.get("c1")?.estado, "en_duda");
  // Pasadas las horas, Instagram ya contesta: la charla tiene un mensaje de antes del comentario.
  d.base.dudasVencidas = new Set(["c1"]);
  d.ig.hiloDe = async () => charla("juliovasquez", [...delLead(MENSAJES_POR_HILO, "2026-10-29T17:40:00Z"), ["lead", "2026-10-28T10:00:00Z"]]);
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.deepEqual(d.ig.pedidos.map((p) => p.id), ["c1"]);
  assert.equal(d.base.filas.get("c1")?.estado, "enviada");
  assert.equal(r.enviadas, 1);
});

test("pasado el tiempo de la vuelta no se empieza nada nuevo", async () => {
  const d = armar({ comentarios: CS });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora, limite: ahora.getTime() });
  assert.equal(d.ig.pedidos.length, 0);
  assert.equal(r.sin_tiempo, true);
  assert.equal(d.base.filas.size, 0, "nada quedó tomado a medias");
});

// ---- el comentario más viejo de lo que cubre la bandeja ----
//
// El 31/10, leyendo la bandeja entera, de los 66 CV de la semana había una dev que comentó el 29 a
// las 04:33 y nunca recibió nada: no tenía charla con la cuenta. El cron no la veía porque las 3
// páginas de la bandeja cubren unas horas. Ahora su charla se busca sola, con el id que trae el
// comentario.

const viejoCon = (id, usuario) => ({ id, text: "CV", timestamp: "2026-10-29T07:06:24+0000", username: usuario, from: { id: `ig-${usuario}` } });
/** Una bandeja que dice que hay más páginas y no las da: lo leído cubre desde las 17:00 del 29. */
const bandejaCorta = (d) => { d.ig.pagina = async () => ({ lista: [hilo("quiensea", "2026-10-29T17:00:00Z", true)], despues: "hay-mas" }); };

test("un comentario más viejo que la bandeja, de alguien sin charla con la cuenta, recibe su DM", async () => {
  const d = armar({ comentarios: [viejoCon("cx", "devsincharla")] });
  bandejaCorta(d);
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.deepEqual(d.ig.hondas, [{ igsid: "ig-devsincharla", n: MENSAJES_HONDOS }]);
  assert.deepEqual(d.ig.pedidos.map((p) => p.id), ["cx"]);
  assert.equal(r.sin_mirar, 0);
});

test("un comentario más viejo que la bandeja que ya tenía respuesta no sale, y queda anotado para no buscarlo otra vez", async () => {
  const suya = charla("otradev", [["lead", "2026-10-29T07:10:00Z"], ["cuenta", "2026-10-29T07:06:31Z", AUTOMATICO_CV_MANYCHAT]]);
  const d = armar({ comentarios: [viejoCon("cx", "otradev")], hondas: { "ig-otradev": suya } });
  bandejaCorta(d);
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(d.ig.pedidos.length, 0);
  assert.equal(r.ya_tenia, 1);
  assert.equal(d.base.filas.get("cx")?.estado, "ya_tenia");
  // La vuelta siguiente ni lo busca.
  d.ig.hondas.length = 0;
  const r2 = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(d.ig.hondas.length, 0);
  assert.equal(r2.en_base, 1);
});

test("un comentario que ya está en la base no se vuelve a mirar", async () => {
  const d = armar({ comentarios: [CS[0], CS[3]], tomados: new Set(["c1"]) });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.deepEqual(d.ig.pedidos.map((p) => p.id), ["c4"]);
  assert.equal(r.en_base, 1);
});

test("las charlas que se buscan de a una tienen tope por vuelta", async () => {
  const viejos = Array.from({ length: 7 }, (_, i) => ({ ...viejoCon(`v${i}`, `dev${i}`), timestamp: `2026-10-29T07:0${i}:00+0000` }));
  const d = armar({ comentarios: viejos });
  bandejaCorta(d);
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(d.ig.hondas.length, 5, "son pedidos de a uno y la función tiene 2 minutos");
  assert.equal(r.buscadas, 5);
  assert.equal(r.enviadas, 5);
  assert.equal(r.sin_mirar, 2, "los otros dos quedan para la vuelta siguiente");
});

test("si falla una página de la bandeja que no es la primera, se corta ahí y lo más viejo queda sin mirar", async () => {
  const viejo = { id: "cx", text: "CV", timestamp: "2026-10-29T07:06:24+0000", username: "alguien" };
  const d = armar({ comentarios: [CS[0], viejo] });
  let vez = 0;
  d.ig.pagina = async () => {
    if (vez++ > 0) throw Object.assign(new Error("Please reduce the amount of data you're asking for"), { code: 1 });
    return { lista: [hilo("quiensea", "2026-10-29T17:00:00Z", false)], despues: "hay-mas" };
  };
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.deepEqual(d.ig.pedidos.map((p) => p.id), ["c1"]);
  assert.equal(r.sin_mirar, 1);
});

test("si falla la primera página de la bandeja, la vuelta falla (y avisa la conexión)", async () => {
  const d = armar({ comentarios: [CS[0]] });
  d.ig.pagina = async () => { throw Object.assign(new Error("token vencido"), { code: 190 }); };
  await assert.rejects(contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora }), /token vencido/);
  assert.equal(d.ig.pedidos.length, 0);
});

test("un comentario más viejo de lo que se alcanzó a mirar en la bandeja no se contesta", async () => {
  // La bandeja leída llega hasta las 17:00 del 29; el comentario de las 07:06 queda sin mirar.
  const viejo = { id: "cx", text: "CV", timestamp: "2026-10-29T07:06:24+0000", username: "alguien" };
  const bandeja = [hilo("quiensea", "2026-10-29T17:00:00Z", true)];
  const d = armar({ comentarios: [CS[0], viejo], bandeja });
  // La bandeja no devuelve más páginas, así que lo leído es todo lo que hay... para que quede un
  // corte real, el doble dice que hay otra página y no la da.
  d.ig.pagina = async () => ({ lista: bandeja, despues: "hay-mas" });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.deepEqual(d.ig.pedidos.map((p) => p.id), ["c1"], "el nuevo sí, el que no se pudo mirar no");
  assert.equal(r.sin_mirar, 1);
});

test("si se leyó la bandeja entera, nada queda sin mirar", async () => {
  const viejo = { id: "cx", text: "CV", timestamp: "2026-10-26T07:06:24+0000", username: "alguien" };
  const d = armar({ comentarios: [viejo], bandeja: [hilo("quiensea", "2026-10-29T17:00:00Z", true)] });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(r.sin_mirar, 0);
  assert.equal(r.enviadas, 1);
});

test("el tope por vuelta se respeta", async () => {
  const d = armar({ comentarios: CS });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora, tope: 1 });
  assert.equal(r.enviadas, 1);
  assert.deepEqual(d.ig.pedidos.map((p) => p.id), ["c1"], "el más nuevo");
});

test("tres errores raros seguidos cortan la vuelta", async () => {
  const raro = () => Object.assign(new Error("qué sé yo"), { code: 190 });
  const d = armar({ comentarios: CS, fallas: { c1: raro(), c2: raro(), c4: raro() } });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(r.errores, 3);
  assert.equal(r.enviadas, 0);
});

test("un post de hace más de 7 días no se mira", async () => {
  const d = armar({ comentarios: CS });
  d.ig.medios = async () => [{ id: "viejo", timestamp: "2026-10-15T15:15:32+0000", comments_count: 50 }];
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(r.medios, 0);
  assert.deepEqual(d.ig.pedidos, []);
});

// ---- el cron ----

const pedido = (extra = {}) => ({ method: "GET", headers: {}, ...extra });

test("el cron no entra sin CRON_SECRET, corre cada 15 minutos y arranca apagado", async () => {
  const { default: handler, config } = await import("../pages/api/dm/comentarios.js");
  const llamar = async (req) => { const res = respuesta(); await handler(req, res); return res; };
  delete process.env.CRON_SECRET;
  assert.equal((await llamar(pedido())).codigo, 401);
  process.env.CRON_SECRET = "secreto-de-prueba";
  try {
    assert.equal((await llamar(pedido({ headers: { authorization: "Bearer otro" } }))).codigo, 401);
    const bien = await llamar(pedido({ headers: { authorization: "Bearer secreto-de-prueba" } }));
    assert.equal(bien.codigo, 200);
    assert.deepEqual(bien.cuerpo, { ok: true, motivo: "sin base" });
  } finally {
    delete process.env.CRON_SECRET;
  }
  assert.equal(config.maxDuration, 120);
  const crons = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8")).crons;
  assert.deepEqual(crons.find((c) => c.path === "/api/dm/comentarios"), { path: "/api/dm/comentarios", schedule: "*/15 * * * *" });
});

test("la constancia va antes del envío y no se borra una que ya salió", async () => {
  const src = await readFile(new URL("../lib/dm/comentariosBase.js", import.meta.url), "utf8");
  // Tomar es un INSERT que no pisa: si el comentario ya estaba, no devuelve fila y no se manda nada.
  // La única excepción es el que cayó en una solicitud sin aceptar y ya pasó SIN_ACEPTAR_HORAS: ese
  // vuelve a quedar en "enviando" porque Cande puede haber aceptado la solicitud mientras tanto.
  // Cualquier otro estado (enviada, ya_tenia, vencido, error) no entra en ese WHERE y no vuelve.
  assert.match(src, /INSERT INTO dm_comentarios[\s\S]*ON CONFLICT \(id\) DO UPDATE SET estado = 'enviando'[\s\S]*WHERE dm_comentarios\.estado = 'sin_aceptar'[\s\S]*RETURNING id/);
  assert.match(src, /DELETE FROM dm_comentarios WHERE id = \$\{String\(id\)\} AND estado = 'enviando'/, "soltar solo lo que no salió");
  assert.match(src, /id\s+TEXT PRIMARY KEY/, "un comentario, una fila");
});

// ---- el que quedó en una solicitud sin aceptar ----
//
// El aviso que recibe Cande dice "aceptale la solicitud en Instagram y le mando la lista". Hasta el
// 31/10 esa promesa era falsa: el comentario quedaba anotado y no se intentaba nunca más, así que
// ella aceptaba y no pasaba nada. Ahora vuelve a entrar pasadas SIN_ACEPTAR_HORAS.

test("un comentario que quedó en una solicitud sin aceptar se reintenta, y si ya la aceptó sale", async () => {
  const fallas = { c1: Object.assign(new Error("(#10) no es propietaria del hilo"), { code: 10, subcode: 2534037 }) };
  const d = armar({ comentarios: [CS[0]], fallas });
  const r1 = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(r1.sin_aceptar, 1);
  assert.equal(d.base.filas.get("c1").estado, "sin_aceptar");
  assert.equal(d.avisos.length, 1, "la primera vez sí le avisa a Cande");

  // Tres horas después, con la solicitud ya aceptada: el mismo comentario vuelve a entrar y sale.
  d.base.sinAceptarVencidos = new Set(["c1"]);
  delete fallas.c1;
  const r2 = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(r2.enviadas, 1, "ahora sí le llega la lista");
  assert.equal(d.base.filas.get("c1").estado, "enviada");
});

test("y si todavía no la aceptó, no le avisa a Cande de nuevo", async () => {
  const sinAceptar = Object.assign(new Error("(#10) no es propietaria del hilo"), { code: 10, subcode: 2534037 });
  const d = armar({ comentarios: [CS[0]], fallas: { c1: sinAceptar } });
  await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(d.avisos.length, 1);

  d.base.sinAceptarVencidos = new Set(["c1"]);
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(r.sin_aceptar, 1, "se reintentó");
  assert.equal(d.avisos.length, 1, "un aviso cada tres horas sería ruido: el primero ya salió");
});

// ---- DEV: la llamada para founders (02/11) ----
//
// Lo último que quedaba en ManyChat ("DEV → llamada (comentario DEV)"). Misma regla estricta que CV,
// mismas trabas (la base antes de mandar, la bandeja, contestadoDesde, una respuesta por persona);
// cambia el texto.

test("DEV: la palabra sola, o con relleno, pide la llamada; adentro de una frase no", () => {
  for (const t of ["DEV", "Dev", "dev", "  DEV  ", "DEV.", "DEV 🙌🏼", "Dev porfa", "Hola, DEV please", "dev gracias!!"]) {
    assert.equal(esPalabraDEV(t), true, `tendría que disparar con ${JSON.stringify(t)}`);
  }
  const no = [
    "Soy dev", "dev rico", "busco un dev", "developer", "devs", "devops", "cuántos devs tenés?",
    "cv dev", "dev cv",              // dos pedidos: es una charla, no un pedido
    "", "   ", null, undefined, "🙌🏼",
  ];
  for (const t of no) assert.equal(esPalabraDEV(t), false, `no tendría que disparar con ${JSON.stringify(t)}`);
});

test("un comentario es CV, DEV o ninguno: nunca los dos, y CV sigue como estaba", () => {
  assert.equal(tipoDelComentario("CV"), "cv");
  assert.equal(tipoDelComentario("Holaaa! Cv. 🙌🏻"), "cv");
  assert.equal(tipoDelComentario("DEV"), "dev");
  assert.equal(tipoDelComentario("cv dev"), null);
  assert.equal(tipoDelComentario("CV rico 😋"), null);
  assert.equal(esPalabraCV("DEV"), false, "DEV no es CV");
  assert.equal(esPalabraDEV("CV"), false, "CV no es DEV");
});

test("el texto de DEV es uno solo, lleva el link de la agenda y la red de la bandeja lo reconoce como automático", async () => {
  assert.match(TEXTO_DEV, /strategy\.opengatehub\.com/, "el link va adentro: Instagram deja un solo mensaje por comentario");
  assert.ok(!/\?|utm_|https?:\/\//.test(TEXTO_DEV), "el link va limpio y sin signos de pregunta");
  assert.ok(TEXTO_DEV.length <= 1000, "Instagram corta a los 1.000 caracteres");
  assert.ok(!TEXTO_DEV.includes("—"), TEXTO_DEV);
  assert.ok(!/[¿¡]/.test(TEXTO_DEV), TEXTO_DEV);
  assert.equal(TEXTO_DEV.includes("botón"), false, "una private reply no lleva botones: no puede mandar a tocar uno");
  // Es el mismo link que el agente le da a las empresas.
  const frenos = await readFile(new URL("../lib/dm/frenos.js", import.meta.url), "utf8");
  assert.match(frenos, /const LINK_REUNION = "strategy\.opengatehub\.com"/);
  // Si la bandeja no lo reconoce, el agente se sale de la charla del founder que contesta (lib/dm/bandeja.js).
  assert.equal(esAutomatico(TEXTO_DEV, [claveTexto(AUTOMATICO_DEV_MANYCHAT)]), true);
  assert.equal(esAutomatico(TEXTO_CV, [claveTexto(AUTOMATICO_DEV_MANYCHAT)]), false, "y los dos textos no se confunden");
});

test("esDmDeDev reconoce el DM de DEV (el nuestro o lo que lleve el link de la agenda) y nada más", () => {
  assert.equal(esDmDeDev(TEXTO_DEV), true);
  assert.equal(esDmDeDev("Agendá acá: https://strategy.opengatehub.com"), true);
  assert.equal(esDmDeDev(TEXTO_CV), false);
  assert.equal(esDmDeDev("Holii! Pudiste anotarte o te quedó para después?"), false);
  assert.equal(esDmDeDev(""), false);
  assert.equal(esDmDeDev(null), false);
});

const DEVS = [
  { id: "d1", text: "DEV", timestamp: "2026-10-29T17:32:15+0000", username: "founderuno" },
  { id: "d2", text: "Dev 🙌", timestamp: "2026-10-29T17:23:49+0000", username: "founderdos" },
  { id: "d3", text: "dev rico", timestamp: "2026-10-29T07:06:24+0000", username: "gezulupo17" },
];

test("DEV: cada comentario recibe su texto, el de CV el suyo, y el que no pide nada ninguno", async () => {
  const d = armar({ comentarios: [...CS, ...DEVS] });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  const por = Object.fromEntries(d.ig.pedidos.map((p) => [p.id, p.texto]));
  assert.deepEqual(Object.keys(por).sort(), ["c1", "c2", "c4", "d1", "d2"]);
  assert.equal(por.d1, TEXTO_DEV);
  assert.equal(por.d2, TEXTO_DEV);
  assert.equal(por.c1, TEXTO_CV, "CV sigue saliendo con su lista");
  assert.equal(r.enviadas, 5);
  assert.equal(d.base.filas.has("d3"), false, "'dev rico' no pide la llamada: no se toca");
  assert.equal(d.base.filas.get("d1").estado, "enviada");
});

test("DEV: queda tomado ANTES de mandar, y uno ya tomado no recibe nada", async () => {
  const d = armar({ comentarios: DEVS, tomados: new Set(["d1"]) });
  let estadoAlMandar = null;
  const mandar = d.ig.responderComentario;
  d.ig.responderComentario = async (id, texto) => { estadoAlMandar = d.base.filas.get(id)?.estado; return mandar(id, texto); };
  await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.deepEqual(d.ig.pedidos.map((p) => p.id), ["d2"]);
  assert.equal(estadoAlMandar, "enviando", "la constancia va antes del envío");
});

test("DEV: a quien ya le contestaron desde que comentó no se le manda nada", async () => {
  const bandeja = [
    hilo("founderuno", "2026-10-29T17:32:26Z", true),     // ManyChat o el agente, a los 11 segundos
    hilo("founderdos", "2026-10-29T17:23:49Z", false),    // escribió él y nadie le contestó
    hilo("otracualquiera", "2026-10-29T06:00:00Z", true),
  ];
  const d = armar({ comentarios: DEVS, bandeja });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.deepEqual(d.ig.pedidos.map((p) => p.id), ["d2"]);
  assert.equal(r.ya_tenia, 1);
});

test("DEV: el que ya recibió el link de la llamada o el DM de CV, aunque sea de antes, no lo recibe otra vez", async () => {
  const t = Date.parse("2026-10-29T17:32:15Z");
  const m = (texto) => [{ igsid: "x", pedidos: MENSAJES_POR_HILO, mensajes: [{ deLaCuenta: true, creado: new Date("2026-10-20T12:00:00Z"), texto }] }];
  assert.equal(contestadoDesde(m(TEXTO_DEV), t), "si", "ya recibió el nuestro");
  assert.equal(contestadoDesde(m("Agendá acá: strategy.opengatehub.com"), t), "si", "el agente ya le dio la agenda");
  assert.equal(contestadoDesde(m(TEXTO_CV), t), "si", "un DM fijo es un DM fijo");
  assert.equal(contestadoDesde(m("Buenass, cómo andás?"), t), "no", "una charla vieja cualquiera no tapa el comentario");
});

test("DEV: una respuesta por persona, entre CV y DEV y entre vueltas", async () => {
  // Misma persona con CV y DEV en la vuelta: sale uno solo, por el comentario más nuevo.
  const mismo = [
    { id: "x1", text: "CV", timestamp: "2026-10-29T10:00:00+0000", username: "mismapersona" },
    { id: "x2", text: "DEV", timestamp: "2026-10-29T12:00:00+0000", username: "MismaPersona" },
  ];
  const a = armar({ comentarios: mismo });
  await contestarComentarios({ ig: a.ig, base: a.dobleBase, avisar: a.avisar, ahora: () => ahora });
  assert.deepEqual(a.ig.pedidos.map((p) => [p.id, p.texto]), [["x2", TEXTO_DEV]]);
  // Otra vuelta: la base dice que ya le salió su DM por otro comentario.
  const b = armar({ comentarios: DEVS, conDm: ["founderuno"] });
  await contestarComentarios({ ig: b.ig, base: b.dobleBase, avisar: b.avisar, ahora: () => ahora });
  assert.deepEqual(b.ig.pedidos.map((p) => p.id), ["d2"]);
});

test("DEV: si el DM queda en una solicitud sin aceptar, el aviso a Cande habla de DEV y de la llamada", async () => {
  const fallas = { d1: Object.assign(new Error("La página no es propietaria del hilo"), { code: 100, subcode: 2534037 }) };
  const d = armar({ comentarios: DEVS, fallas });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(r.sin_aceptar, 1);
  assert.equal(d.avisos.length, 1);
  assert.match(d.avisos[0].titulo, /DEV/);
  assert.match(d.avisos[0].campos.Qué, /DEV/);
  assert.match(d.avisos[0].campos.Hacé, /llamada/);
  assert.equal(r.enviadas, 1, "el otro no se frena por eso");
});

test("el aviso de CV sigue hablando de CV y de la lista", async () => {
  const fallas = { c1: Object.assign(new Error("La página no es propietaria del hilo"), { code: 100, subcode: 2534037 }) };
  const d = armar({ comentarios: CS, fallas });
  await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.match(d.avisos[0].titulo, /CV/);
  assert.match(d.avisos[0].campos.Hacé, /lista/);
});

test("DEV: pasada la ventana de 7 días o escrito por la cuenta misma, no sale", () => {
  const cs = [
    { id: "1", text: "DEV", timestamp: "2026-10-01T10:00:00+0000", username: "viejo" },
    { id: "2", text: "DEV", timestamp: "2026-10-29T10:00:00+0000", username: CUENTA.username },
    { id: "3", text: "DEV", timestamp: "2026-10-29T12:00:00+0000", username: "uno" },
  ];
  assert.deepEqual(comentariosParaContestar(cs, CUENTA, ahora).map((c) => [c.id, c.tipo]), [["3", "dev"]]);
});

// ---- la respuesta pública abajo del comentario (02/11) ----

test("los tres textos de la respuesta pública son los que aprobó Cande, sin guion largo ni signos de apertura", () => {
  assert.deepEqual(RESPUESTAS_PUBLICAS, [
    "Te mandé DM 💌 si no lo ves, fijate en solicitudes",
    "Listo, te escribí por privado! Si no aparece, mirá en solicitudes",
    "Ya te llegó por DM :) fijate en solicitudes si no lo ves",
  ]);
  for (const t of RESPUESTAS_PUBLICAS) {
    assert.ok(!t.includes("—"), t);
    assert.ok(!/[¿¡]/.test(t), t);
  }
});

test("la respuesta pública rota entre los tres textos y el mismo comentario siempre recibe el mismo", () => {
  const ids = Array.from({ length: 30 }, (_, i) => `1789${1000000000 + i * 7919}`);
  const usados = new Set(ids.map(respuestaPublica));
  assert.equal(usados.size, 3, "en 30 comentarios aparecen los tres");
  for (const id of ids) assert.equal(respuestaPublica(id), respuestaPublica(id));
});

test("después de la private reply, el cron contesta también en público, una vez por comentario", async () => {
  const d = armar({ comentarios: CS });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.deepEqual(d.ig.publicas.map((p) => p.id), ["c1", "c2", "c4"]);
  for (const p of d.ig.publicas) assert.equal(p.texto, respuestaPublica(p.id));
  assert.equal(r.enviadas, 3);
  assert.equal(r.publicas, 3);
  assert.equal(d.base.filas.get("c1").publica, true, "queda anotada");
  // La segunda vuelta no repite nada: los comentarios ya están en la base.
  await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(d.ig.publicas.length, 3);
});

test("si la private reply falla, no hay respuesta pública", async () => {
  const d = armar({ comentarios: CS, fallas: { c1: Object.assign(new Error("(#-1) el comentario es demasiado antiguo"), { subcode: 2534024 }) } });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.deepEqual(d.ig.publicas.map((p) => p.id), ["c2", "c4"], "c1 no recibió DM, así que tampoco la línea pública");
  assert.equal(r.publicas, 2);
});

test("si la respuesta pública falla, no frena nada: el DM ya salió y la vuelta sigue", async () => {
  const registrados = [];
  const d = armar({ comentarios: CS, fallasPublicas: { c1: new Error("sin permiso") } });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora, registrar: (m) => registrados.push(m) });
  assert.equal(r.enviadas, 3, "los tres DM salieron");
  assert.equal(r.publicas, 2);
  assert.equal(r.errores, 0, "no cuenta como error del DM");
  assert.equal(d.base.filas.get("c1").estado, "enviada", "el DM sigue anotado como enviado");
  assert.deepEqual(registrados, ["publica"]);
  // No se reintenta: la vuelta siguiente no la repite.
  await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(d.ig.publicas.filter((p) => p.id === "c1").length, 1);
});

test("un comentario que ya tiene su respuesta pública no recibe otra", async () => {
  const d = armar({ comentarios: CS });
  d.base.filas.set("c1", { estado: "enviada", publica: true });
  assert.equal(await responderEnPublico({ ig: d.ig, base: d.dobleBase, id: "c1" }), false);
  assert.equal(d.ig.publicas.length, 0);
});

test("la respuesta pública también sale en un comentario DEV", async () => {
  const d = armar({ comentarios: [{ id: "d1", text: "DEV", timestamp: "2026-10-29T17:32:15+0000", username: "founder1" }] });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(r.publicas, 1);
  assert.equal(d.ig.pedidos[0].texto, TEXTO_DEV);
});

test("sin responderPublico o sin tomarPublica no hace nada ni tira", async () => {
  assert.equal(await responderEnPublico({ ig: {}, base: {}, id: "c1" }), false);
  assert.equal(await responderEnPublico({ ig: { responderPublico: async () => ({}) }, base: {}, id: "c1" }), false);
});

test("el cliente de Instagram contesta en público con POST /{comentario}/replies y el token de la página", async () => {
  const { crearInstagram } = await import("../lib/dm/instagram.js");
  const llamadas = [];
  const pedir = async (url, init = {}) => {
    llamadas.push({ url: String(url), init });
    const r = String(url).includes("/me/accounts")
      ? { data: [{ id: "pag1", access_token: "TOKEN_PAGINA", instagram_business_account: { id: "ig1" } }] }
      : { id: "resp-1" };
    return { ok: true, status: 200, json: async () => r };
  };
  const ig = crearInstagram({
    pedir, leerConfig: async () => null, guardarConfig: async () => {}, tokenEnv: () => "x",
    credencialFb: async () => ({ id: "ig1", token: "TOKEN_USUARIO" }),
  });
  const r = await ig.responderPublico("1789999", "Te mandé DM 💌 si no lo ves, fijate en solicitudes");
  assert.equal(r.id, "resp-1");
  const ultima = llamadas.at(-1);
  assert.match(ultima.url, /graph\.facebook\.com\/v\d+\.\d+\/1789999\/replies\?access_token=TOKEN_PAGINA$/);
  assert.equal(ultima.init.method, "POST");
  assert.deepEqual(JSON.parse(ultima.init.body), { message: "Te mandé DM 💌 si no lo ves, fijate en solicitudes" });
  // Sin el permiso de la página no hay respuestas: tira, y responderEnPublico lo atrapa.
  const sinFb = crearInstagram({ pedir, leerConfig: async () => null, guardarConfig: async () => {}, tokenEnv: () => "x" });
  await assert.rejects(() => sinFb.responderPublico("1", "x"), /página de Facebook/);
});

// ---- las dos listas de comentarios de Instagram (06/11) ----
//
// `/comments` se come comentarios de primer nivel sin avisar: el 06/11 devolvía 125 de 213 en los
// medios de dos semanas, y comentarios que ya había devuelto dejaban de aparecer. `/ordered_comments`
// los trae. El cliente lee esa, y `/comments` solo si esa no anda. Los datos de abajo son inventados.

/** Un cliente con la página de Facebook y un Instagram de mentira: `listas` dice qué contesta cada borde. */
function clienteConListas(listas) {
  const pedidos = [];
  const pedir = async (url) => {
    const u = new URL(String(url));
    pedidos.push(u.pathname + (u.searchParams.get("after") ? `?after=${u.searchParams.get("after")}` : ""));
    if (u.pathname.endsWith("/me/accounts")) {
      return { ok: true, status: 200, json: async () => ({ data: [{ id: "pag1", access_token: "TOKEN_PAGINA", instagram_business_account: { id: "ig1" } }] }) };
    }
    const borde = u.pathname.split("/").at(-1);
    const r = listas[borde]?.(u.searchParams.get("after")) ?? { data: [] };
    if (r.error) return { ok: false, status: 400, json: async () => r };
    return { ok: true, status: 200, json: async () => r };
  };
  return { pedidos, pedir };
}

const coment = (id, usuario, cuando = "2026-11-05T10:00:00+0000") => ({ id, text: "CV", timestamp: cuando, username: usuario, from: { id: `ig-${usuario}` } });

async function clienteFb(pedir) {
  const { crearInstagram } = await import("../lib/dm/instagram.js");
  return crearInstagram({
    pedir, leerConfig: async () => null, guardarConfig: async () => {}, tokenEnv: () => "x",
    credencialFb: async () => ({ id: "ig1", token: "TOKEN_USUARIO" }),
  });
}

test("los comentarios salen de /ordered_comments, con todas sus páginas", async () => {
  const { pedidos, pedir } = clienteConListas({
    // La lista de la app trae todos, en dos páginas.
    ordered_comments: (despues) => (despues
      ? { data: [coment("k3", "devtres")] }
      : { data: [coment("k1", "devuno"), coment("k2", "devdos")], paging: { cursors: { after: "p2" }, next: "https://graph.facebook.com/x" } }),
    // /comments se come k2 y k3.
    comments: () => ({ data: [coment("k1", "devuno")] }),
  });
  const ig = await clienteFb(pedir);
  const cs = await ig.comentarios("medio1");
  assert.deepEqual(cs.map((c) => c.id), ["k1", "k2", "k3"]);
  assert.ok(pedidos.includes("/v23.0/medio1/ordered_comments?after=p2"), "sigue las páginas de la lista de la app");
  assert.ok(!pedidos.includes("/v23.0/medio1/comments"), "con la de la app andando, /comments no se pide");
});

test("si /ordered_comments no anda en un medio, quedan los de /comments como antes", async () => {
  const { pedir } = clienteConListas({
    ordered_comments: () => ({ error: { message: "Unsupported get request", code: 100, error_subcode: 33 } }),
    comments: () => ({ data: [coment("k1", "devuno")] }),
  });
  const ig = await clienteFb(pedir);
  assert.deepEqual((await ig.comentarios("medio1")).map((c) => c.id), ["k1"]);
  // Vacía (así contesta Meta sin el permiso): también quedan los de /comments.
  const vacia = clienteConListas({ ordered_comments: () => ({ data: [] }), comments: () => ({ data: [coment("k1", "devuno")] }) });
  assert.deepEqual((await (await clienteFb(vacia.pedir)).comentarios("medio1")).map((c) => c.id), ["k1"]);
});

test("una falla de la conexión en /ordered_comments corta la vuelta, como en /comments", async () => {
  const { pedir } = clienteConListas({
    ordered_comments: () => ({ error: { message: "Error validating access token", code: 190 } }),
    comments: () => ({ data: [coment("k1", "devuno")] }),
  });
  const ig = await clienteFb(pedir);
  await assert.rejects(() => ig.comentarios("medio1"), (e) => e.code === 190);
});

test("un CV que solo trae /ordered_comments recibe su lista", async () => {
  const { pedir } = clienteConListas({
    ordered_comments: () => ({ data: [coment("k1", "devuno", "2026-10-29T17:30:00+0000"), coment("k2", "devdos", "2026-10-29T17:31:00+0000")] }),
    comments: () => ({ data: [coment("k1", "devuno", "2026-10-29T17:30:00+0000")] }),
  });
  const real = await clienteFb(pedir);
  const d = armar({ comentarios: [] });
  d.ig.comentarios = (m) => real.comentarios(m);
  d.ig.medios = async () => [{ id: "m1", timestamp: "2026-10-29T15:15:32+0000", comments_count: 2, permalink: "https://instagram.com/p/x" }];
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(r.enviadas, 2);
  assert.deepEqual(d.ig.pedidos.map((p) => p.id), ["k2", "k1"]);
});

// ---- los posts viejos con comentarios nuevos (06/11) ----
//
// La ventana de 7 días corre desde el comentario, no desde el post. Un post viejo se lee mientras
// su número de comentarios haya cambiado en los últimos 7 días. Datos inventados.

const reciente = { id: "nuevo", timestamp: "2026-10-29T15:00:00+0000", comments_count: 3 };
const viejo = (n) => ({ id: "viejo", timestamp: "2026-10-10T15:00:00+0000", comments_count: n });

test("mediosParaLeer: los de la semana siempre; un viejo, solo si sus comentarios cambiaron hace menos de 7 días", () => {
  // Sin nada anotado: el viejo queda anotado y no se lee (no se sabe desde cuándo tiene lo que tiene).
  let r = mediosParaLeer([reciente, viejo(4)], null, ahora);
  assert.deepEqual(r.leer.map((m) => m.id), ["nuevo"]);
  assert.deepEqual(r.anotados.viejo, { n: 4, cambio: null });
  // Mismo número que la vuelta anterior: no se lee.
  r = mediosParaLeer([reciente, viejo(4)], r.anotados, ahora);
  assert.deepEqual(r.leer.map((m) => m.id), ["nuevo"]);
  // Le entró un comentario: se lee, y se anota cuándo cambió.
  r = mediosParaLeer([reciente, viejo(5)], r.anotados, ahora);
  assert.deepEqual(r.leer.map((m) => m.id), ["nuevo", "viejo"]);
  assert.deepEqual(r.anotados.viejo, { n: 5, cambio: ahora.toISOString() });
  // Tres días después, sin más cambios: se sigue leyendo (ese comentario todavía se puede contestar).
  const en3 = new Date(ahora.getTime() + 3 * 86400000);
  const r3 = mediosParaLeer([viejo(5)], r.anotados, en3);
  assert.deepEqual(r3.leer.map((m) => m.id), ["viejo"]);
  assert.equal(r3.anotados.viejo.cambio, ahora.toISOString(), "el cambio queda en la fecha en que pasó");
  // Pasados los 7 días del cambio: ya no.
  const en8 = new Date(ahora.getTime() + 8 * 86400000);
  assert.deepEqual(mediosParaLeer([viejo(5)], r.anotados, en8).leer, []);
  // Sin comentarios no se lee nada, pero queda anotado.
  const vacio = mediosParaLeer([{ ...reciente, comments_count: 0 }], null, ahora);
  assert.deepEqual(vacio.leer, []);
  assert.deepEqual(vacio.anotados.nuevo, { n: 0, cambio: null });
});

/** La vuelta con un post viejo que tiene un CV de ayer, y lo anotado en una base de mentira. */
function conViejo({ anotado = null, fallaLeer = false } = {}) {
  const cv = { id: "v1", text: "CV", timestamp: "2026-10-29T20:00:00+0000", username: "devdeprueba" };
  const d = armar({ comentarios: [cv] });
  d.ig.medios = async () => [viejo(7)];
  d.ig.leidos = [];
  d.ig.comentarios = async (m) => { d.ig.leidos.push(m); return [cv]; };
  d.guardados = [];
  d.dobleBase.leerMedios = async () => { if (fallaLeer) throw new Error("la base no contesta"); return anotado; };
  d.dobleBase.guardarMedios = async (v) => { d.guardados.push(v); };
  return d;
}

test("un CV nuevo en un post de hace más de 7 días recibe su lista", async () => {
  const d = conViejo({ anotado: { viejo: { n: 6, cambio: null } } });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(r.viejos, 1);
  assert.equal(r.enviadas, 1);
  assert.deepEqual(d.ig.pedidos.map((p) => p.id), ["v1"]);
  assert.deepEqual(d.guardados.at(-1).viejo, { n: 7, cambio: ahora.toISOString() });
});

test("un post viejo que se ve por primera vez se anota y no se lee", async () => {
  const d = conViejo();
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(r.medios, 0);
  assert.deepEqual(d.ig.leidos, []);
  assert.deepEqual(d.guardados.at(-1).viejo, { n: 7, cambio: null });
});

test("si lo anotado no se puede leer, se miran solo los de la semana y no se pisa nada", async () => {
  const d = conViejo({ fallaLeer: true });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.equal(r.medios, 0);
  assert.deepEqual(d.guardados, [], "no se guarda encima de lo que no se pudo leer");
});

test("el cron lista 300 posts (3 páginas de 100) y anota lo de cada uno en dm_config", async () => {
  const fuente = await readFile(new URL("../pages/api/dm/comentarios.js", import.meta.url), "utf8");
  assert.match(fuente, /MEDIOS_POR_VUELTA = 100;/);
  assert.match(fuente, /PAGINAS_DE_MEDIOS = 3;/);
  assert.match(fuente, /paginasDeMedios: PAGINAS_DE_MEDIOS/);
  assert.match(fuente, /leerMedios: \(\) => leerConfig\(CLAVE_MEDIOS\)/);
  assert.match(fuente, /guardarMedios: \(v\) => guardarConfig\(CLAVE_MEDIOS, v\)/);
});

test("el cliente lista los posts de a páginas, siguiendo el cursor, hasta las que se piden", async () => {
  const { pedidos, pedir } = clienteConListas({
    media: (despues) => ({
      data: [{ id: `p-${despues || "1"}`, timestamp: "2026-10-29T15:00:00+0000", comments_count: 1 }],
      paging: { cursors: { after: `${despues || "1"}x` }, next: "https://graph.facebook.com/x" },
    }),
  });
  const ig = await clienteFb(pedir);
  assert.deepEqual((await ig.medios({ limite: 100, paginas: 3 })).map((m) => m.id), ["p-1", "p-1x", "p-1xx"]);
  assert.equal(pedidos.filter((p) => p.includes("/ig1/media")).length, 3);
  // Por defecto, una sola página, como antes.
  assert.equal((await ig.medios()).length, 1);
});

// ---- FORMULARIO: el formulario "Contame tu realidad" (13/11) ----
//
// Tercer pedido por comentario, con la misma regla estricta y las mismas trabas que CV y DEV. Dos diferencias: arranca
// apagado (sin `formulario`, el cron hace exactamente lo de antes), y no se tapa con CV: el dev que ya recibió la
// lista es justo el que tiene que recibir el formulario.

const PRENDIDO = { desde: null };
const FORMS = [
  { id: "f1", text: "FORMULARIO", timestamp: "2026-10-29T18:00:00+0000", username: "devuno" },
  { id: "f2", text: "Formulario 🙌 porfa", timestamp: "2026-10-29T17:50:00+0000", username: "devdos" },
  { id: "f3", text: "qué formulario?", timestamp: "2026-10-29T17:40:00+0000", username: "devtres" },
];

test("FORMULARIO: la palabra sola, o con relleno, pide el formulario; adentro de una frase no", () => {
  assert.equal(PALABRA_FORMULARIO, "formulario");
  for (const t of ["FORMULARIO", "Formulario", "formulario", "  FORMULARIO  ", "Formulario!", "FORMULARIO 🙌🏼", "formulario porfa", "Hola, formulario please", "Formulário"]) {
    assert.equal(esPalabraFormulario(t), true, `tendría que disparar con ${JSON.stringify(t)}`);
  }
  const no = [
    "qué formulario?", "ya llené el formulario", "formularios", "el formulario no anda", "formulario cv", "cv formulario",
    "", "   ", null, undefined, "🙌🏼",
  ];
  for (const t of no) assert.equal(esPalabraFormulario(t), false, `no tendría que disparar con ${JSON.stringify(t)}`);
});

test("FORMULARIO: apagado es una charla más; prendido es su propio pedido, y CV y DEV no cambian", () => {
  assert.equal(tipoDelComentario("FORMULARIO"), null, "apagado no dispara nada");
  assert.equal(tipoDelComentario("FORMULARIO", { formulario: true }), "formulario");
  assert.equal(tipoDelComentario("CV", { formulario: true }), "cv");
  assert.equal(tipoDelComentario("DEV", { formulario: true }), "dev");
  assert.equal(tipoDelComentario("cv formulario", { formulario: true }), null, "dos pedidos: es una charla");
});

test("FORMULARIO: el texto lleva el link limpio de la bio, entra en un mensaje y la bandeja lo toma por automático", () => {
  assert.equal(LINK_FORMULARIO, "https://forms.gle/Kw2uyAMzTizsnr7V7");
  assert.ok(TEXTO_FORMULARIO.includes(LINK_FORMULARIO), "el link va adentro: Instagram deja un solo mensaje por comentario");
  assert.ok(!/\?|utm_|[?&]de=/.test(LINK_FORMULARIO), "el link va limpio");
  assert.ok(TEXTO_FORMULARIO.length <= 1000, "Instagram corta a los 1.000 caracteres");
  assert.ok(!TEXTO_FORMULARIO.includes("—"), TEXTO_FORMULARIO);
  assert.ok(!/[¿¡]/.test(TEXTO_FORMULARIO), TEXTO_FORMULARIO);
  // Si la bandeja no lo reconoce como automático, el agente se sale de la charla del dev que contesta (lib/dm/bandeja.js).
  assert.equal(esAutomatico(TEXTO_FORMULARIO, [claveTexto(AUTOMATICO_CV_MANYCHAT)]), true);
  // Y no pasa por el DM de CV ni por el de DEV, ni al revés.
  assert.equal(esDmDeCV(TEXTO_FORMULARIO), false);
  assert.equal(esDmDeDev(TEXTO_FORMULARIO), false);
  assert.equal(esDmDeFormulario(TEXTO_FORMULARIO), true);
  assert.equal(esDmDeFormulario("te dejo el link: forms.gle/Kw2uyAMzTizsnr7V7"), true);
  assert.equal(esDmDeFormulario(TEXTO_CV), false);
  assert.equal(esDmDeFormulario(TEXTO_DEV), false);
  assert.equal(esDmDeFormulario(""), false);
});

test("FORMULARIO apagado: el cron no le contesta a nadie que lo comente, y CV sale como siempre", async () => {
  const d = armar({ comentarios: [...CS, ...FORMS] });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora });
  assert.deepEqual(d.ig.pedidos.map((p) => p.id), ["c1", "c2", "c4"]);
  assert.ok(d.ig.pedidos.every((p) => p.texto === TEXTO_CV));
  assert.equal(r.formulario, undefined, "la cuenta de antes, sin nada nuevo");
  assert.equal(d.base.filas.has("f1"), false);
});

test("FORMULARIO prendido: cada pedido recibe su texto, y lo que no pide nada no se toca", async () => {
  const d = armar({ comentarios: [...CS, ...DEVS, ...FORMS] });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora, formulario: PRENDIDO });
  const por = Object.fromEntries(d.ig.pedidos.map((p) => [p.id, p.texto]));
  assert.deepEqual(Object.keys(por).sort(), ["c1", "c2", "c4", "d1", "d2", "f1", "f2"]);
  assert.equal(por.f1, TEXTO_FORMULARIO);
  assert.equal(por.f2, TEXTO_FORMULARIO);
  assert.equal(por.c1, TEXTO_CV);
  assert.equal(por.d1, TEXTO_DEV);
  assert.equal(r.enviadas, 7);
  assert.equal(r.formulario, 2);
  assert.equal(d.base.filas.get("f1").tipo, "formulario", "queda anotado qué pidió");
  assert.equal(d.base.filas.get("c1").tipo, "cv");
  assert.equal(d.base.filas.has("f3"), false, "'qué formulario?' es una pregunta, no un pedido");
});

test("FORMULARIO: los comentarios de antes de prenderlo no reciben nada", async () => {
  const d = armar({ comentarios: FORMS });
  await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora, formulario: { desde: "2026-10-29T17:55:00Z" } });
  assert.deepEqual(d.ig.pedidos.map((p) => p.id), ["f1"], "f2 es de 17:50, antes de prenderlo");
  // Una fecha mal escrita no abre la puerta a todos los de la semana: no sale ninguno.
  const e = armar({ comentarios: [...FORMS, ...CS] });
  await contestarComentarios({ ig: e.ig, base: e.dobleBase, avisar: e.avisar, ahora: () => ahora, formulario: { desde: "ayer" } });
  assert.deepEqual(e.ig.pedidos.map((p) => p.id), ["c1", "c2", "c4"], "CV sale igual");
});

test("FORMULARIO: tener la lista de CV no saca el formulario, y tener el formulario no saca la lista", async () => {
  // devuno ya tiene el DM de CV (otra vuelta) y devdos ya tiene el del formulario.
  const comentarios = [
    FORMS[0],
    FORMS[1],
    { id: "c9", text: "CV", timestamp: "2026-10-29T17:00:00+0000", username: "devdos" },
  ];
  const d = armar({ comentarios, conDm: ["devuno"], conDmForm: ["devdos"] });
  await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora, formulario: PRENDIDO });
  assert.deepEqual(d.ig.pedidos.map((p) => [p.id, p.texto]), [["f1", TEXTO_FORMULARIO], ["c9", TEXTO_CV]]);
});

test("FORMULARIO: la misma persona con CV y FORMULARIO en la vuelta recibe los dos; con dos FORMULARIO, uno", async () => {
  const comentarios = [
    { id: "y1", text: "CV", timestamp: "2026-10-29T10:00:00+0000", username: "mismapersona" },
    { id: "y2", text: "FORMULARIO", timestamp: "2026-10-29T12:00:00+0000", username: "MismaPersona" },
    { id: "y3", text: "formulario", timestamp: "2026-10-29T13:00:00+0000", username: "mismapersona" },
  ];
  const d = armar({ comentarios });
  await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora, formulario: PRENDIDO });
  assert.deepEqual(d.ig.pedidos.map((p) => [p.id, p.texto]), [["y3", TEXTO_FORMULARIO], ["y1", TEXTO_CV]]);
});

test("FORMULARIO: el que ya recibió el formulario no lo recibe otra vez; el DM de CV de antes no lo frena", () => {
  const t = Date.parse("2026-10-29T17:32:15Z");
  const m = (texto) => [{ igsid: "x", pedidos: MENSAJES_POR_HILO, mensajes: [{ deLaCuenta: true, creado: new Date("2026-10-20T12:00:00Z"), texto }] }];
  assert.equal(contestadoDesde(m(TEXTO_FORMULARIO), t, "formulario"), "si", "ya recibió el nuestro");
  assert.equal(contestadoDesde(m(TEXTO_CV), t, "formulario"), "no", "la lista de CV es otra cosa");
  assert.equal(contestadoDesde(m(TEXTO_DEV), t, "formulario"), "no");
  assert.equal(contestadoDesde(m(TEXTO_FORMULARIO), t), "no", "y el formulario no cuenta como el DM de CV");
  assert.equal(contestadoDesde(m(TEXTO_CV), t), "si", "CV sigue como estaba");
  // Lo que la cuenta le escribió DESPUÉS del comentario sí frena, como con CV: alguien ya le contestó.
  const despues = [{ igsid: "x", pedidos: MENSAJES_POR_HILO, mensajes: [{ deLaCuenta: true, creado: new Date("2026-10-29T18:00:00Z"), texto: "hola!" }] }];
  assert.equal(contestadoDesde(despues, t, "formulario"), "si");
});

test("FORMULARIO: a quien ya le contestaron desde que comentó no se le manda nada", async () => {
  const bandeja = [
    hilo("devuno", "2026-10-29T18:00:20Z", true),     // la cuenta le escribió después del comentario
    hilo("devdos", "2026-10-29T17:50:00Z", false),    // escribió él y nadie le contestó
    hilo("otracualquiera", "2026-10-29T06:00:00Z", true),
  ];
  const d = armar({ comentarios: FORMS, bandeja });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora, formulario: PRENDIDO });
  assert.deepEqual(d.ig.pedidos.map((p) => p.id), ["f2"]);
  assert.equal(r.ya_tenia, 1);
});

test("FORMULARIO: si el DM queda en una solicitud sin aceptar, el aviso habla del formulario", async () => {
  const fallas = { f1: Object.assign(new Error("La página no es propietaria del hilo"), { code: 100, subcode: 2534037 }) };
  const d = armar({ comentarios: FORMS, fallas });
  const r = await contestarComentarios({ ig: d.ig, base: d.dobleBase, avisar: d.avisar, ahora: () => ahora, formulario: PRENDIDO });
  assert.equal(r.sin_aceptar, 1);
  assert.match(d.avisos[0].titulo, /FORMULARIO/);
  assert.match(d.avisos[0].campos.Hacé, /formulario/);
  assert.equal(r.enviadas, 1, "el otro no se frena por eso");
  assert.equal(r.formulario, 1);
});

test("el cron prende el formulario solo desde dm_config y con la columna tipo en la base", async () => {
  const fuente = await readFile(new URL("../pages/api/dm/comentarios.js", import.meta.url), "utf8");
  assert.match(fuente, /ajuste\.formulario\?\.activo === true && conTipos\(\)/);
  assert.match(fuente, /formulario,\n/);
});
