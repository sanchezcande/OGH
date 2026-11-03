// La palabra clave de una historia (lib/dm/palabraClave.js).
//
// Lo que no puede fallar: que se dispare con la palabra sola y NUNCA en medio de una charla. El
// automático viejo de ManyChat era "contiene CV" y saltaba cuando alguien escribía "mandé muchos
// cv", también en una charla personal con una amiga. Hubo que apagarlo (08/10).
import "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

import { readFileSync } from "node:fs";

const { palabraClaveDe, PALABRAS } = await import("../lib/dm/palabraClave.js");

test("la palabra sola dispara", () => {
  for (const t of ["TRABAJO", "trabajo", "Trabajo", "  trabajo  ", "trabajo!", "TRABAJO.", "trabajó"]) {
    assert.equal(palabraClaveDe(t)?.nombre, "trabajo", `tendría que disparar con ${JSON.stringify(t)}`);
  }
});

test("adentro de una frase NO dispara", () => {
  const frases = [
    "busco trabajo",
    "hola, estoy buscando trabajo hace meses",
    "trabajo en una fintech",
    "gracias por el trabajo que haces",
    "me quedé sin trabajo",
    "trabajo remoto",
  ];
  for (const f of frases) assert.equal(palabraClaveDe(f), null, `no tendría que disparar con ${JSON.stringify(f)}`);
});

test("otras palabras no disparan", () => {
  // "dev" era de ManyChat y apuntaba a founders: no se portó (0 ejecuciones desde el 02/10 y la
  // oferta de esa automatización ya no es la de ahora).
  for (const t of ["dev", "hola", "", null, undefined, "   "]) assert.equal(palabraClaveDe(t), null);
});

test("CV manda la lista y NO le pasa la charla a Cande", () => {
  const cv = palabraClaveDe("CV");
  assert.ok(cv, "CV sola tiene que disparar: es lo que hacía ManyChat y ya no contesta");
  assert.equal(cv.pasa, false, "la lista es un link que se sirve solo: la charla sigue con el agente");
  assert.equal(cv.textos.length, 1);
  assert.match(cv.textos[0], /opengatehub\.com\/devs/);
  assert.equal(palabraClaveDe("cv"), cv, "en minúscula es la misma");
  assert.equal(palabraClaveDe("mandé muchos cv y nada"), null, "adentro de una frase no");
});

test("CV dice lo mismo por DM que por comentario", async () => {
  const { TEXTO_CV } = await import("../lib/dm/comentarios.js");
  assert.equal(palabraClaveDe("cv").textos[0], TEXTO_CV, "una sola redacción para la misma promesa");
});

test("TRABAJO sí le pasa la charla a Cande", () => {
  assert.equal(palabraClaveDe("TRABAJO").pasa, true);
});

test("lo que contesta lleva la agenda, y ni el doc ni el link de pago", () => {
  const todo = PALABRAS.trabajo.textos.join(" ");
  assert.match(todo, /opengatehub\.com\/15min/, "el que va es el link de agendar");
  assert.ok(!/docs\.google\.com/.test(todo), "el doc muere en la charla (Hooman, 31/10): va a la llamada");
  assert.ok(!/gumroad|pagar-pesos/.test(todo), "el link de pago sirve solo para pagar (Hooman, 28/10)");
});

test("el link va limpio, sin parámetros", () => {
  const todo = PALABRAS.trabajo.textos.join(" ");
  // Un link con ?utm= o ?de= le da desconfianza al dev, y a Cande ya la acusaron de estafa esta
  // semana. La cuenta de clicks pasa del lado del servidor, en pages/15min.js.
  assert.ok(!/opengatehub\.com\/15min\?/.test(todo), "el link que ve el dev no lleva parámetros");
});

test("no repite lo que ya dice la historia", () => {
  const todo = PALABRAS.trabajo.textos.join(" ");
  assert.ok(!/buscando 5 devs/i.test(todo), "eso ya lo leyó en la historia, no se lo repetimos");
  assert.ok(!/vas a ser vos o alguien/i.test(todo), "la pregunta de la historia tampoco se repite");
  assert.match(todo, /agend/i, "entrega lo que la historia prometió: dónde sigue la charla");
});

test("la página de la agenda cuenta el click antes de redirigir", () => {
  const src = readFileSync(new URL("../pages/15min.js", import.meta.url), "utf8");
  assert.match(src, /guardarEvento\(/, "sin esto Cande no sabe cuánta gente abre el calendario");
  assert.match(src, /redirect:/, "y tiene que terminar en el calendario de Google");
  assert.match(src, /catch/, "medir nunca puede romper el click");
});

test("el último mensaje aprieta con el cupo y no pide una opinión", () => {
  const ultimo = PALABRAS.trabajo.textos[PALABRAS.trabajo.textos.length - 1].trim();
  // El 30/10 el cierre era una pregunta ("Te guardo un lugar o se lo queda otro?"). El 02/11 Cande
  // lo reescribió entero y dictó este, que aprieta con el cupo y sin preguntar: "Voy a tomar 5 este
  // mes y ya quedan 3 no másss". Es decisión de ella y queda escrito acá para que no se "arregle"
  // sola más adelante. Lo que sigue valiendo es que el cierre no pida una opinión: con "qué te
  // parece" contesta cualquiera que no va a comprar, y es la falla número uno de sus 26 llamadas.
  assert.match(ultimo, /\b5\b/, "el cierre nombra el cupo");
  assert.ok(!/qué te parece|te gustaría saber/i.test(ultimo), "eso pide una opinión, no una decisión");
});

test("habla ella, no una empresa", () => {
  const todo = PALABRAS.trabajo.textos.join(" ");
  // "nosotros" y "trabajamos" la convierten en una agencia, y el que contesta la historia la busca a
  // ella. "Seguimos" salió de la lista el 02/11: su texto dice "te cuento cómo seguimoss", que es
  // ella hablándole al dev, no una empresa. Lo que se mira es que haya primera persona de ella.
  assert.ok(!/\bnosotros\b|trabajamos/i.test(todo), todo);
  assert.match(todo, /\bconmigo\b|\bvoy a\b|\byo\b/i, "tiene que hablar ella");
});

test("sin signos de apertura", () => {
  for (const t of PALABRAS.trabajo.textos) assert.ok(!/[¿¡]/.test(t), t);
});

test("sin guion largo", () => {
  for (const t of PALABRAS.trabajo.textos) assert.ok(!t.includes("—"), t);
});

// Pedido de Cande, 30/10: "sacalos del agente y mandámelos a mí". El que contesta la palabra recibe
// los dos mensajes y la charla pasa a ella, en código y no en el guion: el que levanta la mano por
// una oferta de 473 lo atiende ella.

test("después de la palabra clave, la charla pasa a Cande", () => {
  const src = readFileSync(new URL("../lib/dm/agente.js", import.meta.url), "utf8");
  const i = src.indexOf("const clave = !evento");
  assert.ok(i > 0, "no encontré el corte de la palabra clave en agente.js");
  const bloque = src.slice(i, i + 2600);
  assert.match(bloque, /pasarACande\(/, "sin esto el agente le sigue hablando al que pidió el 1 a 1");
  assert.match(bloque, /palabra clave/, "y el motivo tiene que decir por qué se la pasa");
});

test("el aviso del tope de altas sale una vez por día, no una por alta", () => {
  const src = readFileSync(new URL("../lib/dm/agente.js", import.meta.url), "utf8");
  assert.match(src, /tocaAvisarDelTope/, "sin la guarda, el aviso sale en cada alta");
  assert.match(src, /AVISO_TOPE_CADA_MS = 86400000/);
  // La guarda va PEGADA a la condición del aviso: si se escribe aparte, igual sale.
  assert.match(src, /van \+ 1 >= aj\.altas_por_dia && \(await tocaAvisarDelTope\(\)\)/);
});

/* ---------- CUBA (03/11): el programa regalado a los devs de Cuba ---------- */

test("CUBA solo dispara con el regalo prendido, y como palabra sola", () => {
  assert.equal(palabraClaveDe("CUBA"), null, "sin el texto cargado lo atiende el agente");
  for (const t of ["CUBA", "cuba", "Cuba!", " CUBA 🇨🇺 "]) {
    const c = palabraClaveDe(t, { regalos: true });
    assert.equal(c?.nombre, "cuba", t);
    assert.equal(c.pasa, false, "no le llena la bandeja a Cande");
    assert.equal(c.regalo, true);
  }
  for (const f of ["soy de cuba", "cuba gracias", "hola desde cuba"]) assert.equal(palabraClaveDe(f, { regalos: true }), null, f);
  assert.equal(palabraClaveDe("trabajo", { regalos: true })?.nombre, "trabajo", "las demás siguen igual");
  assert.equal(palabraClaveDe("constructor"), null, "una propiedad de los objetos no es una palabra clave");
});

test("el regalo: un mensaje por párrafo, con el link donde dice {link}; sin {link} no hay regalo", async () => {
  const { textosDelRegalo } = await import("../lib/dm/palabraClave.js");
  assert.deepEqual(textosDelRegalo("Uno de prueba\n\nDos: {link}", "https://x.test/CUBA1"), ["Uno de prueba", "Dos: https://x.test/CUBA1"]);
  assert.deepEqual(textosDelRegalo("Sin link de prueba", "https://x.test/CUBA1"), []);
  assert.deepEqual(textosDelRegalo("Con {link}", ""), []);
});

test("el código de Cuba: uno por charla, con el id entero, y se reconoce", async () => {
  const { codigoDeCuba, esCodigoDeCuba, esCodigoDePesos } = await import("../lib/compras.js");
  assert.equal(codigoDeCuba("17841400000000001"), "CUBA17841400000000001");
  assert.equal(codigoDeCuba(77), "CUBA77");
  assert.ok(esCodigoDeCuba("cuba77") && esCodigoDeCuba("CUBA77"));
  assert.ok(!esCodigoDeCuba("PESOS77") && !esCodigoDePesos("CUBA77") && !esCodigoDeCuba("cuba"));
});

test("el texto de CUBA se carga solo con {link} (o vacío, que lo apaga)", async () => {
  const { validarAjustes, ajustesDesde } = await import("../lib/dm/base.js");
  assert.equal(ajustesDesde({}).mensaje_cuba, "", "apagado de fábrica");
  assert.equal(validarAjustes({ mensaje_cuba: "Texto de prueba {link}" }).ok, true);
  assert.equal(validarAjustes({ mensaje_cuba: "" }).ok, true);
  assert.equal(validarAjustes({ mensaje_cuba: "Texto de prueba sin link" }).ok, false);
  assert.equal(validarAjustes({ mensaje_cuba: "x".repeat(900) + "{link}" }).ok, false);
});

test("al que tiene el regalo de CUBA no le sale nada que venda: ni la llamada, ni el 1 a 1, ni cuánto sale, ni un link de pago", async () => {
  const { revisar, MOTIVO_REGALO } = await import("../lib/dm/frenos.js");
  const salida = (mensajes) => ({
    accion: "responder", mensajes, aviso_para_cande: "", seguimiento_en_horas: null, motivo: "",
    estado: { quien: "dev", busca: "si", dolor: "", etapa: "seguimiento", link_formulario_enviado: false, precio_dicho: false },
  });
  const op = { textosDelLead: ["de prueba"], linkDePago: "get.opengatehub.com/l/de-prueba", regalo: true };
  for (const m of [
    ["Te cuento todo en una llamada de 15 minutos, agendá acá:\nwww.opengatehub.com/15min"],
    ["Estoy buscando 5 devs para acompañarlos 1 a 1 este mes"],
    ["Por ahora está en 27 dólares porque recién lo estoy lanzando"],
    ["Te dejo el link\nget.opengatehub.com/l/de-prueba"],
  ]) assert.deepEqual(revisar(salida(m), op), { ok: false, motivo: MOTIVO_REGALO }, m.join(" / "));
  assert.deepEqual(revisar(salida(["Daleee, cualquier duda del módulo me escribís :)"]), op), { ok: true });
  assert.deepEqual(revisar(salida(["Te cuento todo en una llamada de 15 minutos, agendá acá:\nwww.opengatehub.com/15min"]), { ...op, regalo: false }), { ok: true },
    "sin el regalo, la llamada sigue saliendo como siempre");
});

test("al que ya tiene el regalo solo le contesta CUBA: las otras palabras van al agente", () => {
  assert.equal(palabraClaveDe("TRABAJO", { regalos: true, conRegalo: true }), null);
  assert.equal(palabraClaveDe("CV", { regalos: true, conRegalo: true }), null);
  assert.equal(palabraClaveDe("CUBA", { regalos: true, conRegalo: true })?.nombre, "cuba");
});

test("el regalo de CUBA no se borra con las charlas viejas: es lo que dice que ya tiene el programa", () => {
  const src = readFileSync(new URL("../lib/dm/base.js", import.meta.url), "utf8");
  const i = src.indexOf("export async function borrarViejas");
  assert.ok(i > 0);
  assert.match(src.slice(i, i + 1200), /NOT \(accion = 'palabra_clave' AND motivo = 'palabra clave: cuba'\)/);
});

test("crear el código de 100% sirve dos veces con el mismo nombre: si ya existe, devuelve ese", async () => {
  const { crearCodigo100 } = await import("../lib/gumroadCodigos.js");
  const antes = { fetch: globalThis.fetch, token: process.env.GUMROAD_ACCESS_TOKEN };
  const pedidos = [];
  process.env.GUMROAD_ACCESS_TOKEN = "token-de-prueba";
  globalThis.fetch = async (url, op = {}) => {
    pedidos.push(`${op.method || "GET"} ${String(url).split("?")[0]}`);
    const json = (d, status = 200) => ({ ok: status < 400, status, json: async () => d });
    if (/\/v2\/products$/.test(String(url).split("?")[0])) return json({ products: [{ id: "p1", custom_permalink: "acelerador-de-carrera" }] });
    if (op.method === "POST") return json({ success: false, message: "ya existe" }, 422);
    return json({ offer_codes: [{ name: "CUBA77" }] });
  };
  try {
    assert.equal(await crearCodigo100("CUBA77"), "CUBA77");
    assert.equal(await crearCodigo100("CUBA88"), null, "si no existe y no se pudo crear, no hay código");
    assert.ok(pedidos.some((p) => p.startsWith("GET") && p.endsWith("/offer_codes")), pedidos.join(" | "));
  } finally {
    globalThis.fetch = antes.fetch;
    if (antes.token === undefined) delete process.env.GUMROAD_ACCESS_TOKEN; else process.env.GUMROAD_ACCESS_TOKEN = antes.token;
  }
});

