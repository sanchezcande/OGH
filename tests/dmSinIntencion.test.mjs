// La etiqueta sin_intencion de ManyChat (lib/dm/sinIntencion.js, 30/10): a quién se le pone, el barrido de los que ya
// existen (/api/dm/config, accion sin_intencion) y lo que hace "borrar". Lo que hace el agente en cada turno está en
// tests/dm.test.mjs (sección "la etiqueta sin_intencion").
//
// Todos los ids y textos son inventados (este repo es público). Ninguna prueba sale a la red: ManyChat es un fetch de
// mentira y la base, el doble de tests/dobles.
//
// Lo que estas pruebas NO cubren: la consulta de base.paraSinIntencion contra un Postgres de verdad (el doble no entiende
// SQL). Antes de subir hay que mirarla contra uno: que traiga a los que tienen la etiqueta, a las charlas personales y a
// los no_dev del agente (y a nadie más), que compro sea true con una compra sin devolución del mail de su formulario o un
// codigo_mp, y que del_lead traiga solo lo que escribió el lead, en orden.
//
// Correr:  node --test tests/*.test.mjs
import { respuesta, registros } from "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const { base: pg } = await import("./dobles/postgres.mjs");
const {
  ETIQUETA_SIN_INTENCION, TANDA_SIN_INTENCION, barrerSinIntencion, dijoQueCompro, etiquetarSinIntencion, motivoSinIntencion,
  revisarSinIntencion,
} = await import("../lib/dm/sinIntencion.js");

const noDev = { quien: "no_dev", dueno: "agente", personal: false };

/* ---------- a quién se le pone ---------- */

test("la llevan quien no es dev en una charla del agente y las charlas personales", () => {
  assert.equal(ETIQUETA_SIN_INTENCION, "sin_intencion");
  assert.equal(motivoSinIntencion(noDev), null);
  assert.equal(motivoSinIntencion({ ...noDev, charlaDelLead: ["no me interesa, gracias", "hola de prueba"] }), null);
  // Una charla personal ya no tiene nada guardado (borrarCharla deja el estado vacío y de Cande).
  assert.equal(motivoSinIntencion({ personal: true, dueno: "cande" }), null);
  assert.equal(motivoSinIntencion({ personal: true, dueno: "cande", quien: "no_dev" }), null);
});

test("nunca: devs, estudiantes, empresas, quien construye algo, no_se_sabe, compradores ni charlas de Cande que no son personales", () => {
  for (const quien of ["dev", "estudia", "empresa", "construye", "no_se_sabe"]) {
    assert.notEqual(motivoSinIntencion({ ...noDev, quien }), null, quien);
    // Ni aunque la charla figure como personal.
    assert.notEqual(motivoSinIntencion({ quien, personal: true, dueno: "cande" }), null, `${quien} personal`);
  }
  assert.notEqual(motivoSinIntencion({ ...noDev, quien: null }), null, "sin saber quién es");
  assert.equal(motivoSinIntencion({ ...noDev, compro: true }), "compró");
  assert.equal(motivoSinIntencion({ personal: true, dueno: "cande", compro: true }), "compró");
  assert.equal(motivoSinIntencion({ ...noDev, dueno: "cande" }), "es de Cande");
  assert.equal(motivoSinIntencion({ ...noDev, contexto: "Ya compró el programa (contexto de prueba)" }), "el contexto dice que compró");
  assert.equal(motivoSinIntencion({ ...noDev, charlaDelLead: ["ya pagué, de prueba"] }), "habló de un pago");
  assert.equal(motivoSinIntencion({ ...noDev, charlaDelLead: ["tengo una agencia de prueba"] }), "dio una señal de empresa");
  assert.equal(motivoSinIntencion({ ...noDev, charlaDelLead: ["buscamos 2 devs para el equipo"] }), "dio una señal de empresa");
});

test("el contexto de las altas no dice nada de la persona: no cuenta como que compró", () => {
  const alta = "Contexto de alta de prueba: si ya compró, ayudalo";
  assert.equal(dijoQueCompro(alta, alta), false);
  assert.equal(dijoQueCompro(alta, "otro"), true);
  assert.equal(dijoQueCompro("Es alumna del programa", ""), true);
  assert.equal(dijoQueCompro("Le interesa comprar más adelante", ""), false);
  assert.equal(dijoQueCompro("", ""), false);
  assert.equal(motivoSinIntencion({ ...noDev, contexto: alta, contextoAlta: alta }), null);
});

/* ---------- una sola, con la base y ManyChat de mentira ---------- */

/** Un mundo con filas de paraSinIntencion y un ManyChat que anota lo que le piden. */
function mundo(filas, { falla = null } = {}) {
  const m = { filas: filas.map((f) => ({ ...f })), llamadas: [], marcas: [], esperas: 0 };
  const base = {
    ajustes: async () => ({ contexto_alta: "contexto de alta de prueba" }),
    paraSinIntencion: async ({ id = null } = {}) => m.filas.filter((f) => id === null || f.id === id).map((f) => ({ ...f })),
    marcarSinIntencion: async (id, puesta) => {
      m.marcas.push([id, puesta]);
      const f = m.filas.find((x) => x.id === id);
      if (f) f.etiquetado = puesta;
    },
  };
  const responder = (que) => async (id, etiqueta) => {
    m.llamadas.push([que, id, etiqueta]);
    if (falla && falla(id)) return { ok: false, error: "código 9999 | de prueba" };
    return { ok: true };
  };
  const manychat = {
    ponerEtiqueta: responder("poner"), quitarEtiqueta: responder("sacar"),
    crearEtiqueta: async (etiqueta) => { m.creadas = (m.creadas || 0) + 1; return etiqueta === "sin_intencion" ? { ok: true } : { ok: false }; },
  };
  return { m, base, manychat, esperar: async () => { m.esperas++; } };
}
const fila = (id, extra = {}) => ({
  id, dueno: "agente", personal: false, contexto: null, quien: "no_dev", previo_ig: null, etiquetado: false, compro: false, del_lead: ["hola de prueba"], ...extra,
});

test("revisarSinIntencion: pone, no repite, saca y nunca tira", async () => {
  const { m, base, manychat } = mundo([fila("101"), fila("102", { etiquetado: true, quien: "dev" }), fila("103", { etiquetado: true })]);
  assert.equal(await revisarSinIntencion({ base, manychat }, "101"), true);
  assert.equal(await revisarSinIntencion({ base, manychat }, "101"), null, "ya la tiene: no se le pide de nuevo");
  assert.equal(await revisarSinIntencion({ base, manychat }, "102"), true);
  assert.equal(await revisarSinIntencion({ base, manychat }, "103"), null);
  assert.equal(await revisarSinIntencion({ base, manychat }, "999"), null, "no está entre los que la pueden llevar");
  assert.deepEqual(m.llamadas, [["poner", "101", "sin_intencion"], ["sacar", "102", "sin_intencion"]]);
  assert.deepEqual(m.marcas, [["101", true], ["102", false]]);
  // Si el modelo vio un pago en este turno, no la lleva (y si la tenía, se le saca).
  assert.equal(await revisarSinIntencion({ base, manychat }, "103", { pagoPesos: "dice" }), true);
  assert.deepEqual(m.llamadas.at(-1), ["sacar", "103", "sin_intencion"]);
  // La base o ManyChat caídos: false, sin tirar.
  const caida = { ...base, paraSinIntencion: async () => { throw new Error("base caída"); } };
  assert.equal(await revisarSinIntencion({ base: caida, manychat }, "101"), false);
  const tira = { ponerEtiqueta: async () => { throw new Error("ManyChat caído"); } };
  assert.equal(await etiquetarSinIntencion({ base, manychat: tira }, { id: "104", sin_intencion_en: null }, true), false);
  // Sin las funciones (un doble viejo), no hace nada.
  assert.equal(await revisarSinIntencion({ base: {}, manychat }, "101"), null);
});

/* ---------- el barrido ---------- */

const PARA_EL_BARRIDO = () => [
  fila("201"), // no_dev del agente: la lleva
  fila("202", { dueno: "cande", personal: true, quien: null, del_lead: [] }), // personal: la lleva
  fila("203", { quien: "dev", etiquetado: true }), // la tiene y ya es dev: se le saca
  fila("204", { compro: true }), // compró: no
  fila("205", { del_lead: ["ya pagué ayer, de prueba"] }), // habló de un pago: no
  fila("206", { etiquetado: true }), // la tiene y la sigue llevando: nada
  fila("207"),
];

test("el barrido en dry no escribe nada: cuenta, explica y da una muestra sin textos", async () => {
  const { m, base, manychat, esperar } = mundo(PARA_EL_BARRIDO());
  const r = await barrerSinIntencion({ base, manychat, esperar, dry: true, limite: 2 });
  assert.deepEqual(m.llamadas, [], "ni un pedido a ManyChat");
  assert.equal(m.creadas, undefined, "ni siquiera crear la etiqueta");
  assert.deepEqual(m.marcas, [], "ni una escritura en la base");
  assert.equal(r.dry, true);
  assert.equal(r.para_poner, 3);
  assert.equal(r.para_sacar, 1);
  assert.deepEqual(r.no_la_llevan, { compró: 1, "habló de un pago": 1 });
  assert.deepEqual(r.muestra, [{ id: "201", quien: "no_dev", personal: false }, { id: "202", quien: null, personal: true }]);
  assert.deepEqual(r.muestra_sacar, [{ id: "203", quien: "dev", personal: false }]);
  assert.doesNotMatch(JSON.stringify(r), /de prueba/, "sin textos de los leads");
  // Lo que pasa si no se dice nada es dry.
  await barrerSinIntencion({ base, manychat, esperar });
  assert.deepEqual(m.llamadas, []);
});

test("el barrido sin dry saca primero, pone después, de a uno con pausa y hasta el límite", async () => {
  const { m, base, manychat, esperar } = mundo(PARA_EL_BARRIDO());
  const r = await barrerSinIntencion({ base, manychat, esperar, dry: false, limite: 3 });
  assert.deepEqual(m.llamadas, [["sacar", "203", "sin_intencion"], ["poner", "201", "sin_intencion"], ["poner", "202", "sin_intencion"]]);
  assert.deepEqual(m.marcas, [["203", false], ["201", true], ["202", true]]);
  assert.equal(m.creadas, 1, "antes de ponerla, la etiqueta se crea por si falta");
  assert.equal(m.esperas, 3, "una pausa entre pedido y pedido");
  assert.deepEqual({ puestas: r.puestas, sacadas: r.sacadas, quedan: r.quedan, fallaron: r.fallaron }, { puestas: 2, sacadas: 1, quedan: 1, fallaron: [] });
  // La tanda siguiente sigue donde quedó, sin repetir.
  const otra = await barrerSinIntencion({ base, manychat, esperar, dry: false });
  assert.deepEqual(m.llamadas.slice(3), [["poner", "207", "sin_intencion"]]);
  assert.equal(otra.quedan, 0);
  // Y cuando no queda nada, no pide nada.
  const nada = await barrerSinIntencion({ base, manychat, esperar, dry: false });
  assert.deepEqual([nada.puestas, nada.sacadas, nada.quedan, m.llamadas.length], [0, 0, 0, 4]);
});

test("el barrido sigue si ManyChat falla con uno, no lo anota y lo deja para la próxima; corta a la hora", async () => {
  const { m, base, manychat, esperar } = mundo(PARA_EL_BARRIDO(), { falla: (id) => id === "201" });
  const r = await barrerSinIntencion({ base, manychat, esperar, dry: false, limite: 10 });
  assert.deepEqual(r.fallaron, ["201"]);
  assert.equal(r.quedan, 1);
  assert.ok(!m.marcas.some(([id]) => id === "201"));
  assert.ok(registros.some((x) => x.includes("sin_intencion") && !x.includes("201")), "registrado, sin el id");
  const tarde = mundo(PARA_EL_BARRIDO());
  const cortado = await barrerSinIntencion({ ...tarde, dry: false, hasta: Date.now() - 1 });
  assert.deepEqual(tarde.m.llamadas, []);
  assert.equal(cortado.quedan, 4);
});

/* ---------- /api/dm/config y ManyChat ---------- */

const SECRETO = "secreto-de-prueba";
/** Llama a /api/dm/config con la base de mentira: `filas` es lo que contesta paraSinIntencion. Devuelve lo que pasó. */
async function conConfig(body, { filas = [], manychat = true } = {}) {
  const { default: handler } = await import("../pages/api/dm/config.js");
  const consultas = [];
  const pedidos = [];
  pg.otras = (t, params) => {
    consultas.push(t);
    if (t.startsWith("SELECT c.id, c.dueno, c.personal")) {
      const id = params[0];
      return { rows: filas.filter((f) => id == null || f.id === id).map((f) => ({ ...f })) };
    }
    if (/^(CREATE|ALTER|UPDATE|SELECT valor FROM dm_config)/.test(t)) return { rows: [] };
    // borrarCharla: lo que borró.
    if (t.startsWith("WITH m AS (DELETE FROM dm_mensajes")) return { rows: [{ mensajes: 0, salidas: 0, contactos: 1 }] };
    return undefined;
  };
  const antes = globalThis.fetch;
  globalThis.fetch = async (url, op) => {
    pedidos.push({ url: String(url), cuerpo: JSON.parse(op?.body || "{}") });
    return { ok: true, status: 200, json: async () => ({ status: "success" }) };
  };
  process.env.COLA_SECRET = SECRETO;
  process.env.POSTGRES_URL = "postgres://de-prueba";
  if (manychat) process.env.MANYCHAT_API_KEY = "clave-de-prueba";
  try {
    const res = respuesta();
    await handler({ method: "POST", headers: { authorization: `Bearer ${SECRETO}` }, body }, res);
    return { res, consultas, pedidos };
  } finally {
    globalThis.fetch = antes;
    pg.otras = null;
    delete process.env.COLA_SECRET;
    delete process.env.POSTGRES_URL;
    delete process.env.MANYCHAT_API_KEY;
  }
}

test("/api/dm/config sin_intencion: en dry no escribe nada ni le pide nada a ManyChat", async () => {
  const filas = [fila("301"), fila("302", { quien: "dev", etiquetado: true })];
  for (const body of [{ accion: "sin_intencion", dry: true }, { accion: "sin_intencion" }]) {
    const { res, consultas, pedidos } = await conConfig(body, { filas });
    assert.equal(res.codigo, 200);
    assert.equal(res.cuerpo.dry, true);
    assert.equal(res.cuerpo.para_poner, 1);
    assert.equal(res.cuerpo.para_sacar, 1);
    assert.deepEqual(pedidos, []);
    assert.ok(!consultas.some((t) => /SET sin_intencion_en/.test(t)), "ninguna escritura de la etiqueta");
  }
});

test("/api/dm/config sin_intencion: sin dry etiqueta por ManyChat y lo anota; el límite se valida", async () => {
  const { res, consultas, pedidos } = await conConfig({ accion: "sin_intencion", dry: false, limite: 5 }, {
    filas: [fila("401"), fila("402", { quien: "estudia", etiquetado: true })],
  });
  assert.equal(res.codigo, 200);
  assert.deepEqual([res.cuerpo.puestas, res.cuerpo.sacadas, res.cuerpo.quedan], [1, 1, 0]);
  assert.deepEqual(pedidos.map((p) => [p.url, p.cuerpo.subscriber_id, p.cuerpo.tag_name ?? p.cuerpo.name]), [
    ["https://api.manychat.com/fb/page/createTag", undefined, "sin_intencion"],
    ["https://api.manychat.com/fb/subscriber/removeTagByName", 402, "sin_intencion"],
    ["https://api.manychat.com/fb/subscriber/addTagByName", 401, "sin_intencion"],
  ]);
  assert.equal(consultas.filter((t) => /SET sin_intencion_en/.test(t)).length, 2);
  for (const limite of [0, 101, 2.5, "10"]) {
    assert.equal((await conConfig({ accion: "sin_intencion", dry: false, limite })).res.codigo, 400, String(limite));
  }
  assert.equal(TANDA_SIN_INTENCION, 25);
  // Sin la clave de ManyChat no arranca (en dry sí: no la necesita).
  assert.equal((await conConfig({ accion: "sin_intencion", dry: false }, { manychat: false })).res.codigo, 503);
  assert.equal((await conConfig({ accion: "sin_intencion", dry: true }, { manychat: false })).res.codigo, 200);
});

test("/api/dm/config sin_intencion: protegida como las demás", async () => {
  const { default: handler } = await import("../pages/api/dm/config.js");
  process.env.COLA_SECRET = SECRETO;
  try {
    const res = respuesta();
    await handler({ method: "POST", headers: { authorization: "Bearer otro" }, body: { accion: "sin_intencion", dry: false } }, res);
    assert.equal(res.codigo, 401);
  } finally {
    delete process.env.COLA_SECRET;
  }
});

test("/api/dm/config borrar: la charla queda personal y lleva la etiqueta, salvo que haya comprado", async () => {
  const personal = (extra = {}) => [fila("501", { dueno: "cande", personal: true, quien: null, del_lead: [], ...extra })];
  const { res, pedidos } = await conConfig({ accion: "borrar", contacto: "501" }, { filas: personal() });
  assert.equal(res.codigo, 200);
  assert.equal(res.cuerpo.sin_intencion, true);
  assert.deepEqual(pedidos.filter((p) => p.url.endsWith("addTagByName")).map((p) => p.cuerpo.tag_name), ["sin_intencion"]);
  const compro = await conConfig({ accion: "borrar", contacto: "501" }, { filas: personal({ compro: true }) });
  assert.equal(compro.res.cuerpo.sin_intencion, null);
  assert.ok(!compro.pedidos.some((p) => p.url.includes("Tag")));
});
