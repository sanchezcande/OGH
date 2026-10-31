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
// Correr:  node --test tests/*.test.mjs
import "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { respuesta } from "./dobles/preparar.mjs";

const {
  AUTOMATICO_CV_MANYCHAT, FRESCO_MINUTOS, MENSAJES_HONDOS, MENSAJES_POR_HILO, TEXTO_CV, VENTANA_DIAS, comentariosParaContestar, contestadoDesde,
  contestarComentarios, enVentana, esDmDeCV, esPalabraCV, motivoDelError,
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
  assert.equal(FRESCO_MINUTOS, 2);
  assert.equal(enVentana("2026-10-29T17:32:15+0000", ahora), true, "de ayer sí");
  assert.equal(enVentana("2026-10-24T03:47:12+0000", ahora), true, "de hace 6 días todavía");
  // Un comentario de 6 días y 23 horas se puede vencer entre que se lo lee y que sale el DM.
  assert.equal(enVentana("2026-10-23T07:00:00+0000", ahora), false, "a punto de vencerse, no se toma");
  assert.equal(enVentana("2026-10-20T14:48:26+0000", ahora), false, "de hace 10 días no");
  assert.equal(enVentana("2026-10-31T00:00:00+0000", ahora), false, "del futuro tampoco");
  // Recién hecho: primero le toca a ManyChat, que a los contactos que ya tiene les contesta a los
  // segundos. La espera bajó de 5 a 2 minutos el 31/10, cuando ManyChat dejó de atender contactos
  // nuevos: lo que antes era prudencia, ahora es demora.
  assert.equal(enVentana("2026-10-30T05:59:30+0000", ahora), false, "de hace medio minuto espera la vuelta siguiente");
  assert.equal(enVentana("2026-10-30T05:57:00+0000", ahora), true, "de hace 3 minutos ya se puede");
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
function armar({ comentarios, fallas = {}, tomados = new Set(), bandeja = null, hondas = {}, conDm = null } = {}) {
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
  };
  const avisos = [];
  const dobleBase = {
    tomarComentario: async (id, datos) => {
      if (base.tomados.has(id)) return false;
      base.tomados.add(id);
      base.filas.set(id, { ...datos, estado: "enviando" });
      return true;
    },
    anotarComentario: async (id, estado, extra = {}) => base.filas.set(id, { ...base.filas.get(id), estado, ...extra }),
    // `dudasVencidas`: las dudas que ya pasaron DUDA_HORAS y vuelven a mirarse.
    comentariosEnLaBase: async (ids) => ids.filter((id) => base.tomados.has(id) && !(base.dudasVencidas?.has(id))),
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
    ...(conDm ? { usuariosConDm: async () => conDm } : {}),
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
  assert.match(src, /INSERT INTO dm_comentarios[\s\S]*ON CONFLICT \(id\) DO NOTHING RETURNING id/);
  assert.match(src, /DELETE FROM dm_comentarios WHERE id = \$\{String\(id\)\} AND estado = 'enviando'/, "soltar solo lo que no salió");
  assert.match(src, /id\s+TEXT PRIMARY KEY/, "un comentario, una fila");
});
