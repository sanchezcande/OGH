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
  AUTOMATICO_CV_MANYCHAT, TEXTO_CV, VENTANA_DIAS, comentariosParaContestar, contestarComentarios, enVentana, esPalabraCV, motivoDelError,
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
  assert.equal(enVentana("2026-10-29T17:32:15+0000", ahora), true, "de ayer sí");
  assert.equal(enVentana("2026-10-24T03:47:12+0000", ahora), true, "de hace 6 días todavía");
  // Un comentario de 6 días y 23 horas se puede vencer entre que se lo lee y que sale el DM.
  assert.equal(enVentana("2026-10-23T07:00:00+0000", ahora), false, "a punto de vencerse, no se toma");
  assert.equal(enVentana("2026-10-20T14:48:26+0000", ahora), false, "de hace 10 días no");
  assert.equal(enVentana("2026-10-31T00:00:00+0000", ahora), false, "del futuro tampoco");
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

/** Un cliente de Instagram y una base de mentira. `fallas` dice con qué error contesta cada comentario. */
function armar({ comentarios, fallas = {}, tomados = new Set() } = {}) {
  const base = { filas: new Map(), tomados };
  const ig = {
    pedidos: [],
    cuenta: async () => CUENTA,
    medios: async () => [{ id: "m1", timestamp: "2026-10-29T15:15:32+0000", comments_count: comentarios.length, permalink: "https://instagram.com/p/x" }],
    comentarios: async () => comentarios,
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
  assert.equal(config.maxDuration, 60);
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
