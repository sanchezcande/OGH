// La etiqueta sin_intencion de ManyChat (lib/dm/sinIntencion.js, 30/10): a quién se le pone, el barrido de los que ya
// existen (/api/dm/config, accion sin_intencion) y lo que hace "borrar". Lo que hace el agente en cada turno está en
// tests/dm.test.mjs (sección "la etiqueta sin_intencion").
//
// Todos los ids y textos son inventados (este repo es público). Ninguna prueba sale a la red: ManyChat es un fetch de
// mentira y la base, el doble de tests/dobles.
//
// Lo que estas pruebas NO cubren: el SQL contra un Postgres de verdad (el doble no entiende SQL). El 31/10 se corrió una
// vez contra un Postgres 16 local descartable, con datos inventados: tablas() dos veces; paraSinIntencion trae a los que
// tienen la etiqueta, a las personales (con y sin personal_en) y a los no_dev del agente, y a nadie más; compro con
// codigo_mp o una compra sin devolución del mail de su formulario (sin importar mayúsculas), y no con una devuelta;
// del_lead y de_la_cuenta en orden y sin los de "sistema"; los dos campos del estado; borrarCharla pone personal_en y
// deja personal_dudosa aunque se borre de nuevo; marcarSinIntencion y anotarFallaSinIntencion; y el barrido entero (dry y
// sin dry, con un ManyChat de mentira). En la tercera vuelta (31/10), otra vez: la etapa del estado en paraSinIntencion
// (null en una personal), los emojis tal cual en del_lead, marcarDudosa (solo esa fila y solo esa columna, y queda aunque
// se borre de nuevo) y escribioDespues con el barrido de después. En la cuarta (31/10), sin cambiar el SQL: la etiqueta
// que pudo haber salido queda con sin_intencion_en y sin_intencion_falla, el barrido la vuelve a pedir pasada la espera
// (y la fecha de puesta queda), sacarla sin poder deja el "ojo", escribioDespues la pide sacar en una personal sin la
// etiqueta, y la carrera con el turno. En la quinta (31/10) se sacó personal_en (las personales no la llevan nunca) y se
// volvió a correr: tablas() dos veces, borrarCharla con y sin dudosa, paraSinIntencion sin esa columna, y la etiqueta
// anotada antes de pedirla (un 502, la base que falla después de ManyChat). Si se toca ese SQL, hay que volver a
// mirarlo así.
//
// Correr:  node --test tests/*.test.mjs
import { respuesta, registros } from "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const { base: pg } = await import("./dobles/postgres.mjs");
const {
  ESPERA_FALLA_MS, ETIQUETA_SIN_INTENCION, MOTIVO_DUDOSA, MOTIVO_PERSONAL, MOTIVO_RESPUESTA, TANDA_SIN_INTENCION, antesDeBorrar,
  barrerSinIntencion,
  dijoQueCompro,
  esPregunta, esSuelto, escribioDespues, etiquetarSinIntencion, miraLoQueEscribe, motivoSinIntencion, noLoTieneManyChat,
  revisarSinIntencion, senalDeLaCharla, tipoDeMensaje,
} = await import("../lib/dm/sinIntencion.js");

// Lo único que la lleva (tercera revisión del 31/10): no_dev en una charla del agente que el modelo cerró, y lo que
// escribió el lead es una charla personal o de coqueteo y nada más. Las charlas personales de Cande, nunca (quinta).
const COQUETEO = "hermosa 😍";
const noDev = { quien: "no_dev", dueno: "agente", personal: false, estado: { etapa: "cerrada" }, charlaDelLead: [COQUETEO] };

/* ---------- a quién se le pone ---------- */

// Hasta la cuarta revisión se llamaba "la llevan quien no es dev en una charla del agente y las charlas personales".
test("la lleva quien no es dev en una charla del agente; una charla personal, no (quinta revisión del 31/10)", () => {
  assert.equal(ETIQUETA_SIN_INTENCION, "sin_intencion");
  assert.equal(motivoSinIntencion(noDev), null);
  assert.equal(motivoSinIntencion({ ...noDev, charlaDelLead: ["hola", COQUETEO] }), null);
  // Hasta la tercera revisión, un "gracias!" aparte también la llevaba. Desde la cuarta (31/10) no: un gracias contesta
  // algo que le mandó la cuenta (la guía del CV llega sin texto en el hilo), y ante la duda no la lleva.
  assert.equal(motivoSinIntencion({ ...noDev, charlaDelLead: ["hola", COQUETEO, "gracias!"] }), MOTIVO_RESPUESTA);
  // Hasta la cuarta revisión una charla personal la llevaba. Desde la quinta (31/10) no: lo que el lead escribe en una
  // charla de Cande no lo mira nadie (no se guarda, la red de la bandeja la descarta y a la entrada no llega nada), así
  // que nadie se la sacaría si después pide el programa.
  assert.equal(motivoSinIntencion({ personal: true, dueno: "cande" }), MOTIVO_PERSONAL);
  assert.equal(motivoSinIntencion({ personal: true, dueno: "cande", quien: "no_dev" }), MOTIVO_PERSONAL);
  assert.equal(motivoSinIntencion({ personal: true, dueno: "cande", charlaDelLead: [COQUETEO] }), MOTIVO_PERSONAL);
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
function mundo(filas, { falla = null, error = "código 9999 | de prueba" } = {}) {
  const m = { filas: filas.map((f) => ({ ...f })), llamadas: [], marcas: [], esperas: 0 };
  const base = {
    ajustes: async () => ({ contexto_alta: "contexto de alta de prueba" }),
    paraSinIntencion: async ({ id = null } = {}) => m.filas.filter((f) => id === null || f.id === id).map((f) => ({ ...f })),
    marcarSinIntencion: async (id, puesta) => {
      m.marcas.push([id, puesta]);
      const f = m.filas.find((x) => x.id === id);
      if (f) Object.assign(f, { etiquetado: puesta, falla_en: null, no_existe: false });
    },
    // Como base.anotarFallaSinIntencion: la hora de la falla y si ManyChat no tiene al contacto.
    anotarFallaSinIntencion: async (id, noExiste) => {
      m.fallas = [...(m.fallas || []), [id, noExiste]];
      const f = m.filas.find((x) => x.id === id);
      if (f) Object.assign(f, { falla_en: new Date(), no_existe: noExiste === true });
    },
  };
  const responder = (que) => async (id, etiqueta) => {
    m.llamadas.push([que, id, etiqueta]);
    if (falla && falla(id)) return { ok: false, error };
    return { ok: true };
  };
  const manychat = {
    ponerEtiqueta: responder("poner"), quitarEtiqueta: responder("sacar"),
    crearEtiqueta: async (etiqueta) => { m.creadas = (m.creadas || 0) + 1; return etiqueta === "sin_intencion" ? { ok: true } : { ok: false }; },
  };
  return { m, base, manychat, esperar: async () => { m.esperas++; } };
}
const fila = (id, extra = {}) => ({
  id, dueno: "agente", personal: false, contexto: null, quien: "no_dev", etapa: "cerrada", previo_ig: null, etiquetado: false,
  compro: false, del_lead: [COQUETEO], ...extra,
});

test("revisarSinIntencion: pone, no repite, saca y nunca tira", async () => {
  const { m, base, manychat } = mundo([fila("101"), fila("102", { etiquetado: true, quien: "dev" }), fila("103", { etiquetado: true })]);
  assert.equal(await revisarSinIntencion({ base, manychat }, "101"), true);
  assert.equal(await revisarSinIntencion({ base, manychat }, "101"), null, "ya la tiene: no se le pide de nuevo");
  assert.equal(await revisarSinIntencion({ base, manychat }, "102"), true);
  assert.equal(await revisarSinIntencion({ base, manychat }, "103"), null);
  assert.equal(await revisarSinIntencion({ base, manychat }, "999"), null, "no está entre los que la pueden llevar");
  assert.deepEqual(m.llamadas, [["poner", "101", "sin_intencion"], ["sacar", "102", "sin_intencion"]]);
  // Desde la quinta revisión (31/10), poner se anota dos veces: antes de pedirla (con la falla) y cuando ManyChat dice que sí.
  assert.deepEqual(m.marcas, [["101", true], ["101", true], ["102", false]]);
  assert.deepEqual(m.fallas, [["101", false]], "la falla anotada antes de pedir, que el sí de ManyChat borra");
  assert.equal(m.filas[0].falla_en, null);
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
  // Personal: hasta la cuarta revisión la llevaba; desde la quinta (31/10) no la lleva nunca.
  fila("202", { dueno: "cande", personal: true, quien: null, del_lead: [] }),
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
  // 202 es personal: desde la quinta revisión (31/10) no la lleva, y el dry la cuenta con su motivo.
  assert.equal(r.para_poner, 2);
  assert.equal(r.para_sacar, 1);
  assert.deepEqual(r.no_la_llevan, { compró: 1, "habló de un pago": 1, [MOTIVO_PERSONAL]: 1 });
  assert.deepEqual(r.muestra, [{ id: "201", quien: "no_dev", personal: false }, { id: "207", quien: "no_dev", personal: false }]);
  assert.deepEqual(r.muestra_sacar, [{ id: "203", quien: "dev", personal: false }]);
  assert.doesNotMatch(JSON.stringify(r), /hermosa|de prueba/, "sin textos de los leads");
  // Lo que pasa si no se dice nada es dry.
  await barrerSinIntencion({ base, manychat, esperar });
  assert.deepEqual(m.llamadas, []);
});

test("el barrido sin dry saca primero, pone después, de a uno con pausa y hasta el límite", async () => {
  const { m, base, manychat, esperar } = mundo(PARA_EL_BARRIDO());
  // Desde la quinta revisión (31/10) la personal 202 no la lleva: quedan 3 para hacer, y con el límite en 2 (antes 3)
  // sigue probándose que la tanda corta en el límite y la siguiente sigue donde quedó.
  const r = await barrerSinIntencion({ base, manychat, esperar, dry: false, limite: 2 });
  assert.deepEqual(m.llamadas, [["sacar", "203", "sin_intencion"], ["poner", "201", "sin_intencion"]]);
  // Poner se anota antes de pedirla y otra vez cuando ManyChat dice que sí (quinta revisión).
  assert.deepEqual(m.marcas, [["203", false], ["201", true], ["201", true]]);
  assert.equal(m.creadas, 1, "antes de ponerla, la etiqueta se crea por si falta");
  assert.equal(m.esperas, 2, "una pausa entre pedido y pedido");
  assert.deepEqual({ puestas: r.puestas, sacadas: r.sacadas, quedan: r.quedan, fallaron: r.fallaron }, { puestas: 1, sacadas: 1, quedan: 1, fallaron: [] });
  // La tanda siguiente sigue donde quedó, sin repetir.
  const otra = await barrerSinIntencion({ base, manychat, esperar, dry: false });
  assert.deepEqual(m.llamadas.slice(2), [["poner", "207", "sin_intencion"]]);
  assert.equal(otra.quedan, 0);
  // Y cuando no queda nada, no pide nada.
  const nada = await barrerSinIntencion({ base, manychat, esperar, dry: false });
  assert.deepEqual([nada.puestas, nada.sacadas, nada.quedan, m.llamadas.length], [0, 0, 0, 3]);
});

// Hasta la cuarta revisión se llamaba "... falla con uno, no lo anota y lo deja para la próxima; ..." (ver adentro).
test("el barrido sigue si ManyChat falla con uno, lo deja anotado con la falla y para la próxima; corta a la hora", async () => {
  const { m, base, manychat, esperar } = mundo(PARA_EL_BARRIDO(), { falla: (id) => id === "201" });
  const r = await barrerSinIntencion({ base, manychat, esperar, dry: false, limite: 10 });
  assert.deepEqual(r.fallaron, ["201"]);
  assert.equal(r.quedan, 1);
  // Hasta la cuarta revisión, un error de ManyChat no la anotaba como puesta. Desde la quinta (31/10) se anota antes de
  // pedirla y la falla queda: si ManyChat la puso igual, la base lo sabe y se la saca si deja de llevarla.
  assert.deepEqual(m.marcas.filter(([id]) => id === "201"), [["201", true]], "una sola vez: la de antes de pedir");
  assert.ok(m.filas.find((f) => f.id === "201").falla_en instanceof Date);
  assert.ok(registros.some((x) => x.includes("sin_intencion") && !x.includes("201")), "registrado, sin el id");
  const tarde = mundo(PARA_EL_BARRIDO());
  const cortado = await barrerSinIntencion({ ...tarde, dry: false, hasta: Date.now() - 1 });
  assert.deepEqual(tarde.m.llamadas, []);
  // 3: la personal 202 ya no cuenta (quinta revisión).
  assert.equal(cortado.quedan, 3);
});

/* ---------- /api/dm/config y ManyChat ---------- */

const SECRETO = "secreto-de-prueba";
/** Llama a /api/dm/config con la base de mentira: `filas` es lo que contesta paraSinIntencion. Devuelve lo que pasó. */
async function conConfig(body, { filas = [], manychat = true, contacto = null, mensajes = [] } = {}) {
  const { default: handler } = await import("../pages/api/dm/config.js");
  const consultas = [];
  const parametros = [];
  const pedidos = [];
  pg.otras = (t, params) => {
    consultas.push(t);
    parametros.push([t, params]);
    if (t.startsWith("SELECT c.id, c.dueno, c.personal")) {
      const id = params[0];
      return { rows: filas.filter((f) => id == null || f.id === id).map((f) => ({ ...f })) };
    }
    // contacto y historial (lo que "borrar" mira antes de borrar): `contacto` y `mensajes` ({ quien, texto }).
    if (t.startsWith("SELECT * FROM dm_contactos WHERE id =")) return { rows: contacto ? [{ ...contacto }] : [] };
    if (t.startsWith("SELECT id, quien, texto, creado FROM dm_mensajes WHERE contacto =")) {
      return { rows: mensajes.map((x, i) => ({ id: i + 1, ...x })).reverse() };
    }
    if (/^(CREATE|ALTER|UPDATE|SELECT valor FROM dm_config|INSERT INTO dm_contactos|WITH m AS \( INSERT INTO dm_mensajes)/.test(t)) return { rows: [] };
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
    return { res, consultas, parametros, pedidos };
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
  // 3: sacar una, y poner otra en dos tiempos (antes de pedirla y con el sí de ManyChat, quinta revisión del 31/10).
  assert.equal(consultas.filter((t) => /SET sin_intencion_en/.test(t)).length, 3);
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

// Hasta la cuarta revisión se llamaba "/api/dm/config borrar: la charla queda personal y lleva la etiqueta, salvo que haya
// comprado" (ver adentro).
test("/api/dm/config borrar: la charla queda personal y no lleva la etiqueta, ni con un coqueteo puro; si la tenía, se le saca", async () => {
  const personal = (extra = {}) => [fila("501", { dueno: "cande", personal: true, quien: null, del_lead: [], ...extra })];
  // Lo que se borra es un coqueteo puro. Hasta la cuarta revisión la llevaba; desde la quinta (31/10) una charla
  // personal no la lleva nunca: lo que el lead escriba después no lo mira nadie.
  const coqueteo = { contacto: { id: "501", dueno: "cande", estado: {} }, mensajes: [{ quien: "lead", texto: COQUETEO }] };
  const { res, pedidos } = await conConfig({ accion: "borrar", contacto: "501" }, { filas: personal(), ...coqueteo });
  assert.equal(res.codigo, 200);
  assert.equal(res.cuerpo.sin_intencion, null);
  assert.ok(!pedidos.some((p) => p.url.includes("Tag")));
  // Si la tenía (de cuando era del agente), se le saca.
  const conEtiqueta = await conConfig({ accion: "borrar", contacto: "501" }, { filas: personal({ etiquetado: true }), ...coqueteo });
  assert.equal(conEtiqueta.res.cuerpo.sin_intencion, true);
  assert.deepEqual(conEtiqueta.pedidos.filter((p) => p.url.includes("Tag")).map((p) => p.url.split("/").at(-1)), ["removeTagByName"]);
  const nada = await conConfig({ accion: "borrar", contacto: "501" }, { filas: personal() });
  assert.equal(nada.res.cuerpo.sin_intencion, null, "sin nada del lead, tampoco");
  assert.ok(!nada.pedidos.some((p) => p.url.includes("Tag")));
  const compro = await conConfig({ accion: "borrar", contacto: "501" }, { filas: personal({ compro: true }), ...coqueteo });
  assert.equal(compro.res.cuerpo.sin_intencion, null);
  assert.ok(!compro.pedidos.some((p) => p.url.includes("Tag")));
});


/* ---------- revisión del 31/10: ante la duda, no la lleva ---------- */

// El prompt pone callar y quien no_dev también a un "yo quiero" suelto, a una respuesta a una historia y a todo lo que
// "no es para vos" (freno 0). Que el modelo diga no_dev no alcanza: lo que escribió el lead tiene que decir lo mismo.

test("no la lleva quien mostró interés o habló de trabajo o tech, aunque el modelo diga no_dev (también una personal)", () => {
  const conInteres = [
    "yo quiero 🙌", "Quiero!", "me interesa", "yo", "info?", "precio?", "cuánto sale", "TRABAJO porfa", "soy programador",
    "programo en python", "te mando mi CV", "el programa", "hay un curso?", "lo del 1 a 1", "la mentoría", "busco empleo",
    "tengo una entrevista", "mi linkedin", "el sueldo", "soy dev", "I want it", "how much?",
  ];
  for (const t of conInteres) {
    assert.notEqual(motivoSinIntencion({ ...noDev, charlaDelLead: [COQUETEO, t] }), null, t);
    // Una personal también, si se pasa lo que escribió antes de borrarse.
    assert.notEqual(motivoSinIntencion({ personal: true, dueno: "cande", charlaDelLead: [t] }), null, `${t} personal`);
  }
  // Lo que se habló por Instagram antes de la base también cuenta (charlaDelLead lo trae junto).
  assert.equal(motivoSinIntencion({ ...noDev, charlaDelLead: ["quiero saber más, de prueba"] }), "mostró interés o habló de trabajo");
  // Un "no me interesa" no es interés, pero tampoco una charla personal: desde la tercera revisión del 31/10 ya no la
  // lleva (antes sí, por el criterio del 30/10).
  assert.equal(motivoSinIntencion({ ...noDev, charlaDelLead: ["no me interesa, gracias"] }), "escribió algo que no es una charla personal");
});

test("un coqueteo puro la lleva; una reacción suelta, un sí, un saludo o un adjunto no (no se sabe a qué responde)", () => {
  for (const t of ["hermosa 😍", "Qué linda sos 😘"]) {
    assert.equal(motivoSinIntencion({ ...noDev, charlaDelLead: [t] }), null, t);
    assert.equal(esSuelto(t), false, t);
  }
  // Hasta la cuarta revisión "divina!!" también la llevaba. Desde la quinta (31/10) no: en el Río de la Plata "divina" es
  // amable ("sos una divina" a la guía del CV), no un halago.
  assert.notEqual(motivoSinIntencion({ ...noDev, charlaDelLead: ["divina!!"] }), null);
  assert.equal(esSuelto("divina!!"), false);
  for (const t of ["🔥", "🔥🔥🔥", "😍", "siii!", "Sí", "jajaja", "hola", "Gracias!!", "ok"]) {
    assert.equal(esSuelto(t), true, t);
    assert.equal(motivoSinIntencion({ ...noDev, charlaDelLead: [t] }), "contestó solo algo suelto: no se sabe a qué", t);
  }
  // Un adjunto o un link (puede ser un CV o un comprobante) o un mensaje vacío no se reconocen: no la llevan nunca, ni
  // al lado de un coqueteo.
  for (const t of ["[adjunto o mensaje sin texto]", "https://lookaside.fbsbx.com/de-prueba", ""]) {
    assert.equal(tipoDeMensaje(t), "otro", t);
    assert.equal(motivoSinIntencion({ ...noDev, charlaDelLead: [COQUETEO, t] }), "escribió algo que no es una charla personal", t);
  }
  // Lo suelto frena solo si es lo único (tercera revisión del 31/10): al lado de un coqueteo puro, la lleva.
  assert.equal(motivoSinIntencion({ ...noDev, charlaDelLead: ["hermosa 😍", "🔥"] }), null);
});

test("no la lleva si ya le llegó el formulario o el precio, o si la cuenta le ofreció el programa, el 1 a 1 o una llamada", () => {
  const con = (extra) => motivoSinIntencion({ ...noDev, charlaDelLead: ["hermosa 😍"], ...extra });
  assert.equal(con({}), null);
  assert.equal(con({ estado: { link_formulario_enviado: true } }), "le llegó el formulario");
  assert.equal(con({ estado: { precio_dicho: true } }), "le llegó el precio");
  for (const t of ["Te dejo el programa acá: opengatehub.com/devs", "El 1 a 1 son 473 dólares", "Agendá acá una llamada de 15 minutos"]) {
    assert.equal(con({ charlaDeLaCuenta: ["Hola! de prueba", t] }), "la cuenta le ofreció algo", t);
  }
  assert.equal(con({ charlaDeLaCuenta: ["Hola! de prueba", "Contame, de dónde sos?"] }), null);
  // Una personal también (lo de antes de borrarla).
  assert.notEqual(motivoSinIntencion({ personal: true, dueno: "cande", charlaDelLead: ["hermosa 😍"], estado: { precio_dicho: true } }), null);
});

test("antesDeBorrar junta lo del lead, lo de la cuenta y los estados; senalDeLaCharla dice si había algo", () => {
  const antes = antesDeBorrar({
    previo: [{ quien: "lead", texto: "hola" }, { quien: "cande", texto: "previo de la cuenta" }],
    mensajes: [
      { quien: "lead", texto: COQUETEO }, { quien: "agente", texto: "dos" }, { quien: "sistema", texto: "nota" },
      { quien: "automatico", texto: "tres" }, { quien: "cande", texto: "cuatro" },
    ],
    estados: [{ link_formulario_enviado: false }, null, { precio_dicho: true }],
  });
  assert.deepEqual(antes, {
    charlaDelLead: ["hola", COQUETEO], charlaDeLaCuenta: ["previo de la cuenta", "dos", "tres", "cuatro"],
    estado: { link_formulario_enviado: false, precio_dicho: true },
  });
  assert.equal(senalDeLaCharla(antes), "le llegó el precio");
  assert.equal(senalDeLaCharla(antesDeBorrar({ mensajes: [{ quien: "lead", texto: "hermosa 😍" }] })), null);
  assert.equal(senalDeLaCharla(antesDeBorrar({ mensajes: [{ quien: "lead", texto: "yo quiero 🙌" }] })), "mostró interés o habló de trabajo");
});

test("una personal dudosa (al borrarse decía otra cosa) no la lleva nunca, aunque ya no quede nada guardado", async () => {
  // Desde la quinta revisión (31/10) ninguna personal la lleva, y eso es lo primero que dice el motivo.
  assert.equal(motivoSinIntencion({ personal: true, dueno: "cande", dudosa: true }), MOTIVO_PERSONAL);
  const { m, base, manychat } = mundo([fila("601", { dueno: "cande", personal: true, personal_dudosa: true, quien: null, del_lead: [] })]);
  assert.equal(await revisarSinIntencion({ base, manychat }, "601"), null);
  const r = await barrerSinIntencion({ base, manychat, dry: true });
  assert.equal(r.para_poner, 0);
  assert.deepEqual(m.llamadas, []);
  // Para qué queda dudosa: si la charla vuelve al agente (ponerDueno le saca personal), lo borrado ya no está y lo
  // nuevo puede ser un coqueteo puro. Con dudosa no la lleva nunca.
  assert.equal(motivoSinIntencion({ ...noDev, dudosa: true }), MOTIVO_DUDOSA);
  const vuelta = mundo([fila("602", { personal_dudosa: true })]);
  assert.equal(await revisarSinIntencion({ base: vuelta.base, manychat: vuelta.manychat }, "602"), null);
  assert.deepEqual(vuelta.m.llamadas, []);
});

// Hasta la cuarta revisión se llamaba "... no la llevan, y el dry las cuenta aparte, solo el número" (ver adentro).
test("las personales de antes del 31/10 (sin personal_en) no la llevan, ni las de después; el dry las cuenta con su motivo, solo el número", async () => {
  // Hasta la cuarta revisión las personales de desde el 31/10 (con personal_en) la llevaban y las de antes se contaban
  // aparte (personales_viejas). Desde la quinta (31/10) ninguna la lleva: personal_en se sacó, y el dry las cuenta todas
  // juntas con su motivo, solo el número. La que la tiene se le saca.
  const filas = [
    fila("701", { dueno: "cande", personal: true, personal_en: new Date(), quien: null, del_lead: [] }), // de desde el 31/10: tampoco
    fila("702", { dueno: "cande", personal: true, personal_en: null, quien: null, del_lead: [] }), // vieja: no
    fila("703", { dueno: "cande", personal: true, quien: null, del_lead: [] }), // vieja (sin la columna): no
    fila("704", { dueno: "cande", personal: true, personal_en: null, quien: null, del_lead: [], etiquetado: true }), // vieja con la etiqueta: se le saca
  ];
  const { m, base, manychat, esperar } = mundo(filas);
  const r = await barrerSinIntencion({ base, manychat, esperar, dry: true });
  assert.equal(r.para_poner, 0);
  assert.equal(r.para_sacar, 1);
  assert.equal(r.personales_viejas, undefined);
  assert.deepEqual(r.no_la_llevan, { [MOTIVO_PERSONAL]: 3 });
  assert.deepEqual(r.muestra, []);
  assert.doesNotMatch(JSON.stringify(r), /"70[123]"/, "de las que no la llevan, solo el número");
  assert.match(r.ojo, /^1 tienen la etiqueta y ya no la llevan/);
  await barrerSinIntencion({ base, manychat, esperar, dry: false });
  assert.deepEqual(m.llamadas, [["sacar", "704", "sin_intencion"]]);
});

/* ---------- ManyChat que rechaza siempre ---------- */

test("ManyChat no tiene al contacto: al ponerla no se vuelve a pedir, al sacarla es como sacada", async () => {
  assert.equal(noLoTieneManyChat({ error: "código 400 | Validation error | Subscriber does not exist" }), true);
  assert.equal(noLoTieneManyChat({ error: "Subscriber not found" }), true);
  assert.equal(noLoTieneManyChat({ error: "subscriber with id … not found" }), true);
  assert.equal(noLoTieneManyChat({ error: "código 9999 | de prueba" }), false);
  assert.equal(noLoTieneManyChat({ ok: false, incierto: true, error: "ManyChat tardó más de 8 segundos" }), false);
  const noExiste = (id) => id === "801" || id === "802";
  const { m, base, manychat, esperar } = mundo([fila("801"), fila("802", { quien: "dev", etiquetado: true }), fila("803")], {
    falla: noExiste, error: "Subscriber does not exist",
  });
  const r = await barrerSinIntencion({ base, manychat, esperar, dry: false });
  assert.deepEqual([r.puestas, r.sacadas, r.fallidas], [1, 1, 1]);
  // Desde la quinta revisión (31/10), poner se anota antes de pedirla, con la falla, y la falla se borra solo con el sí
  // de ManyChat: 801 queda anotada (no se sabe qué pasó del otro lado) y dice que ManyChat no lo tiene.
  const estado = (id) => {
    const f = m.filas.find((x) => x.id === id);
    return { etiquetado: f.etiquetado, falla: f.falla_en instanceof Date, no_existe: f.no_existe };
  };
  assert.deepEqual(estado("801"), { etiquetado: true, falla: true, no_existe: true });
  assert.deepEqual(m.fallas.filter(([, noExiste]) => noExiste), [["801", true]]);
  assert.deepEqual(estado("802"), { etiquetado: false, falla: false, no_existe: false }, "802 ya no está en ManyChat: tampoco tiene la etiqueta");
  assert.deepEqual(estado("803"), { etiquetado: true, falla: false, no_existe: false });
  // La tanda siguiente no se lo vuelve a pedir, ni aunque haya pasado la espera: lo cuenta aparte.
  const otra = await barrerSinIntencion({ base, manychat, esperar, dry: false, ahora: Date.now() + 2 * ESPERA_FALLA_MS });
  assert.equal(otra.no_existen, 1);
  assert.equal(otra.quedan, 0);
  assert.equal(m.llamadas.length, 3);
});

test("el que falló hace poco espera; pasada la espera se reintenta; la falla queda anotada con su hora", async () => {
  const hace = (ms) => new Date(Date.now() - ms);
  const filas = [fila("811", { falla_en: hace(60000) }), fila("812", { falla_en: hace(ESPERA_FALLA_MS + 60000) }), fila("813", { etiquetado: true, quien: "dev", falla_en: hace(1000) })];
  const { m, base, manychat, esperar } = mundo(filas);
  const r = await barrerSinIntencion({ base, manychat, esperar, dry: true });
  assert.deepEqual(r.en_espera, { poner: 1, sacar: 1 });
  assert.equal(r.para_poner, 1);
  assert.match(r.ojo, /^1 tienen la etiqueta/, "el que no se pudo sacar se avisa: Cande borra por la etiqueta");
  await barrerSinIntencion({ base, manychat, esperar, dry: false });
  assert.deepEqual(m.llamadas, [["poner", "812", "sin_intencion"]]);
  // Un error cualquiera: queda anotado (no como "no existe") y la fila sale de la cola por un rato.
  const malo = mundo([fila("821")], { falla: () => true });
  await barrerSinIntencion({ ...malo, dry: false });
  assert.deepEqual(malo.m.fallas, [["821", false]]);
  assert.ok(malo.m.filas[0].falla_en instanceof Date);
  const despues = await barrerSinIntencion({ ...malo, dry: true });
  assert.deepEqual([despues.para_poner, despues.en_espera.poner], [0, 1]);
});

test("90 no_dev y 30 que ManyChat rechaza: las tandas como dm_nube.py etiquetan a los 60 y terminan", async () => {
  // El escenario de la revisión del 31/10: antes eran 10 tandas, 260 pedidos, 12 sin etiquetar y cortaba con quedan 42.
  for (const error of ["código 9999 | de prueba", "Subscriber does not exist"]) {
    const filas = Array.from({ length: 90 }, (_, i) => fila(String(1000 + i)));
    const malos = new Set(filas.filter((_, i) => i % 3 === 0).map((f) => f.id));
    const { m, base, manychat, esperar } = mundo(filas, { falla: (id) => malos.has(id), error });
    let tandas = 0;
    let r;
    // Lo mismo que hace dm_nube.py: sigue mientras queden más que los que fallaron.
    do {
      r = await barrerSinIntencion({ base, manychat, esperar, dry: false, limite: 25 });
      tandas++;
    } while (r.quedan > r.fallidas && tandas < 50);
    // Las que ManyChat puso: anotadas y sin falla. Desde la quinta revisión (31/10) las rechazadas también quedan
    // anotadas (antes de pedirlas), pero con la falla.
    const puestas = m.filas.filter((f) => f.etiquetado && f.falla_en == null).map((f) => f.id);
    assert.equal(puestas.length, 60, error);
    assert.ok(m.filas.filter((f) => malos.has(f.id)).every((f) => f.etiquetado && f.falla_en instanceof Date), error);
    assert.ok(puestas.every((id) => !malos.has(id)), error);
    assert.equal(m.llamadas.length, 90, `${error}: a cada uno se le pidió una sola vez`);
    assert.ok(tandas <= 5, `${error}: ${tandas} tandas`);
  }
});

/* ---------- el barrido relee antes de cada uno ---------- */

test("el barrido relee la fila antes de cada uno: si un turno la cambió mientras tanto, decide con lo nuevo", async () => {
  const { m, base, manychat } = mundo([fila("901"), fila("902"), fila("903", { etiquetado: true, quien: "dev" }), fila("904")]);
  // Mientras el barrido va de a uno, entra un turno: 902 resulta dev, a 903 se le saca en el turno y 904 escribe "quiero".
  const esperar = async () => {
    Object.assign(m.filas.find((f) => f.id === "902"), { quien: "dev" });
    Object.assign(m.filas.find((f) => f.id === "903"), { etiquetado: false });
    Object.assign(m.filas.find((f) => f.id === "904"), { del_lead: ["hola de prueba", "quiero info"] });
  };
  const r = await barrerSinIntencion({ base, manychat, esperar, dry: false });
  assert.deepEqual(m.llamadas, [["poner", "901", "sin_intencion"]], "a 902 y 904 no se les pone con la foto vieja, ni se le saca dos veces a 903");
  assert.deepEqual([r.puestas, r.sacadas, r.cambiaron, r.quedan], [1, 0, 3, 0]);
});


/* ---------- borrar, sembrar y dueno (/api/dm/config) ---------- */

test("/api/dm/config borrar: si lo que se borra mostraba interés, queda dudosa y no la lleva", async () => {
  const personal = [fila("511", { dueno: "cande", personal: true, quien: null, del_lead: [] })];
  const borrarCon = (r) => r.parametros.find(([t]) => t.startsWith("WITH m AS (DELETE FROM dm_mensajes"))[1];
  const conInteres = await conConfig({ accion: "borrar", contacto: "511" }, {
    filas: personal, contacto: { id: "511", dueno: "agente", estado: { quien: "no_dev" }, previo_ig: null },
    mensajes: [{ quien: "lead", texto: "yo quiero 🙌" }],
  });
  assert.equal(conInteres.res.codigo, 200);
  assert.equal(borrarCon(conInteres).at(-1), true, "borrarCharla con dudosa");
  assert.equal(conInteres.res.cuerpo.sin_intencion, null);
  assert.ok(!conInteres.pedidos.some((p) => p.url.includes("Tag")));
  // Lo de Instagram de antes de la base también cuenta.
  const previo = await conConfig({ accion: "borrar", contacto: "511" }, {
    filas: personal, contacto: { id: "511", dueno: "agente", estado: {}, previo_ig: [{ quien: "lead", texto: "me interesa el programa" }] },
  });
  assert.equal(borrarCon(previo).at(-1), true);
  assert.ok(!previo.pedidos.some((p) => p.url.includes("Tag")));
  // Un coqueteo: no es dudosa. Hasta la cuarta revisión la llevaba; desde la quinta (31/10) no, porque es personal.
  const coqueteo = await conConfig({ accion: "borrar", contacto: "511" }, {
    filas: personal, contacto: { id: "511", dueno: "agente", estado: {} }, mensajes: [{ quien: "lead", texto: "hermosa 😍" }],
  });
  assert.equal(borrarCon(coqueteo).at(-1), false);
  assert.equal(coqueteo.res.cuerpo.sin_intencion, null);
  assert.ok(!coqueteo.pedidos.some((p) => p.url.includes("Tag")));
});

test("/api/dm/config sembrar: la charla vuelve al agente y, si tenía la etiqueta sin saber quién es, se le saca", async () => {
  const { res, pedidos } = await conConfig(
    { accion: "sembrar", contacto: "521", mensajes: [{ quien: "lead", texto: "hola de prueba" }, { quien: "cande", texto: "respuesta de prueba" }] },
    { filas: [fila("521", { etiquetado: true, quien: null })] },
  );
  assert.equal(res.codigo, 200);
  assert.equal(res.cuerpo.sin_intencion, true);
  assert.deepEqual(pedidos.filter((p) => p.url.includes("Tag")).map((p) => [p.url.split("/").at(-1), p.cuerpo.subscriber_id]), [["removeTagByName", 521]]);
});

test("/api/dm/config dueno: con el dueño nuevo se decide de nuevo (la toma Cande: se le saca)", async () => {
  const { res, pedidos } = await conConfig(
    { accion: "dueno", contacto: "531", dueno: "cande" },
    { filas: [fila("531", { etiquetado: true, dueno: "cande" })], contacto: { id: "531", dueno: "agente", estado: { quien: "no_dev" } } },
  );
  assert.equal(res.codigo, 200);
  assert.deepEqual(pedidos.filter((p) => p.url.includes("Tag")).map((p) => p.url.split("/").at(-1)), ["removeTagByName"]);
});

test("ManyChat: el porqué de un error llega aunque los detalles vengan por campo (así se ve que no tiene al contacto)", async () => {
  const { ponerEtiqueta } = await import("../lib/dm/manychat.js");
  const antes = globalThis.fetch;
  process.env.MANYCHAT_API_KEY = "clave-de-prueba";
  try {
    for (const details of [
      { messages: { subscriber_id: [{ message: "Subscriber does not exist" }] } },
      { messages: [{ message: "Subscriber does not exist" }] },
      { messages: { subscriber_id: ["Subscriber does not exist"] } },
    ]) {
      globalThis.fetch = async () => ({ ok: false, status: 400, json: async () => ({ status: "error", message: "Validation error", details }) });
      const r = await ponerEtiqueta("123", "sin_intencion");
      assert.equal(r.ok, false);
      assert.match(r.error, /Validation error \| Subscriber does not exist/, JSON.stringify(details));
      assert.equal(noLoTieneManyChat(r), true);
    }
  } finally {
    globalThis.fetch = antes;
    delete process.env.MANYCHAT_API_KEY;
  }
});

/* ---------- tercera revisión del 31/10: solo una charla personal o de coqueteo, y nada más ---------- */

// Con la regla de antes (una lista de lo que frena), todo lo que no estaba en la lista la llevaba: "hay cupo?" o "cómo
// pago?" en una respuesta a una historia terminaban con la etiqueta y Cande los borraba. Ahora la regla está al revés.

// Lo que pidió la revisión, y lo que encontró que la llevaba con la regla de antes.
const NO_LA_LLEVAN = [
  "hay cupo?", "cómo pago?", "me cierra, cómo reservo?", "quedan lugares?", "tenés gente?", "tal cual 🙌", "buenísimo!",
  "sos una genia", "info", "cuánto sale", "yo quiero 🙌", "🔥", "salgamos a tomar un café?",
  "acepta mercadopago?", "contame más", "dónde lo compro", "en cuotas?", "aceptan tarjeta?", "descuento?", "es online?",
  "cómo funciona?", "de qué se trata?", "anotame", "me uno", "sigue disponible?", "Is it available?", "sign me up",
  "necesitamos gente", "me recomendás a alguien?", "hay cupo", "cuanto sale el 1 a 1", "tenes lugar", "qué lindo!",
  "qué linda foto", "hermosa 🙌", "hermosa, cuánto sale?", "hermosa! me sirvió mucho", "hola como estas linda",
  "no me interesa, gracias", "[adjunto o mensaje sin texto]", "hola", "gracias!", "jajaja", "😍",
  // Hasta la tercera revisión estaba en LA_LLEVAN. Desde la cuarta (31/10), el número o el whatsapp no alcanzan solos:
  // "dame tu whatsapp" puede ser de alguien que quiere el 1 a 1, que se cierra por WhatsApp.
  "dame tu número",
  // Hasta la cuarta revisión estaban en LA_LLEVAN. Desde la quinta (31/10): "divina" no es un halago (en el Río de la
  // Plata es amable), y el número no cuenta nunca, ni al lado de un halago ("dame" es interés, como "pasame").
  "divina!!", "hermosa, dame tu número 😘",
];
// Una charla personal o de coqueteo y nada más.
const LA_LLEVAN = [
  ["hermosa 😍"], ["hola", "qué linda sos 😘"], ["te vi en la app de citas"], ["buenos días hermosaaa ❤️"],
  ["sos re linda"], ["te extraño"], ["hola", "🔥", "hermosa 🔥"], ["mi amor"], ["Q linda 🥰"],
  // "divina!!" y "hermosa, dame tu número 😘" estaban acá hasta la cuarta revisión: ver NO_LA_LLEVAN.
];

test("no la llevan una pregunta, una compra, una reacción de dev, algo suelto o lo que no se reconoce (en el agente y en una personal)", () => {
  for (const texto of NO_LA_LLEVAN) {
    assert.notEqual(motivoSinIntencion({ ...noDev, charlaDelLead: [texto] }), null, texto);
    // Ni al lado de un coqueteo puro, salvo lo suelto ("hola", "🔥"): eso frena solo si es lo único.
    if (!esSuelto(texto)) assert.notEqual(motivoSinIntencion({ ...noDev, charlaDelLead: [COQUETEO, texto] }), null, `${COQUETEO} + ${texto}`);
    // En el alta y en "borrar" se decide con lo de antes de borrar: si dice algo, la charla queda dudosa.
    assert.notEqual(senalDeLaCharla(antesDeBorrar({ mensajes: [{ quien: "lead", texto }] })), null, `antes: ${texto}`);
    assert.notEqual(tipoDeMensaje(texto), "personal", texto);
  }
});

test("la llevan un halago a ella o algo de su vida o de una cita, solos o con un saludo o un emoji", () => {
  for (const charla of LA_LLEVAN) {
    assert.equal(motivoSinIntencion({ ...noDev, charlaDelLead: charla }), null, charla.join(" + "));
    assert.equal(senalDeLaCharla(antesDeBorrar({ mensajes: charla.map((texto) => ({ quien: "lead", texto })) })), null, charla.join(" + "));
  }
  assert.equal(tipoDeMensaje("qué linda sos 😘"), "personal");
  // Por qué no la llevan (lo cuenta el barrido en no_la_llevan): cada capa dice lo suyo.
  for (const t of ["hay cupo", "cómo reservo", "quedan lugares", "tenés gente", "en cuotas", "acepta mercadopago"]) {
    assert.equal(motivoSinIntencion({ ...noDev, charlaDelLead: [t] }), "mostró interés o habló de trabajo", t);
  }
  for (const t of ["salgamos a tomar un café?", "qué hacés", "hola cómo estás linda", "salgamos?"]) {
    assert.equal(motivoSinIntencion({ ...noDev, charlaDelLead: [t] }), "hizo una pregunta", t);
    assert.equal(tipoDeMensaje(t), "otro", t);
  }
  assert.equal(esPregunta("qué linda sos 😘"), false, "\"qué linda\" es un halago, no una pregunta");
  for (const t of ["qué hacés", "hola cómo estás", "cuanto sale", "hay cupo", "tenés gente", "quedan lugares", "salgamos?"]) {
    assert.equal(esPregunta(t), true, t);
  }
});

test("lo suelto frena solo si es lo único: \"hola\" + \"hermosa 😍\" la lleva, \"hola\" solo no", () => {
  assert.equal(motivoSinIntencion({ ...noDev, charlaDelLead: ["hola", COQUETEO] }), null);
  assert.equal(motivoSinIntencion({ ...noDev, charlaDelLead: ["hola"] }), "contestó solo algo suelto: no se sabe a qué");
  assert.equal(motivoSinIntencion({ ...noDev, charlaDelLead: ["hola", "🔥", "gracias!"] }), "contestó solo algo suelto: no se sabe a qué");
  // Una charla del agente sin nada del lead tampoco (antes la llevaba).
  assert.equal(motivoSinIntencion({ ...noDev, charlaDelLead: [] }), "no escribió nada");
  // Una personal ya borrada no tiene nada del lead. Hasta la cuarta revisión la llevaba (se decidía al borrarla); desde
  // la quinta (31/10) ninguna personal la lleva.
  assert.equal(motivoSinIntencion({ personal: true, dueno: "cande", charlaDelLead: [] }), MOTIVO_PERSONAL);
});

test("una charla del agente la lleva solo cerrada: con \"a qué te dedicás?\" abierta, no", async () => {
  assert.equal(motivoSinIntencion({ ...noDev, estado: { etapa: "quien_es" } }), "la charla sigue abierta");
  assert.equal(motivoSinIntencion({ ...noDev, estado: {} }), "la charla sigue abierta");
  // A una personal no se le mira la etapa (borrarCharla deja el estado vacío): desde la quinta revisión (31/10) no la
  // lleva nunca (antes, null).
  assert.equal(motivoSinIntencion({ personal: true, dueno: "cande", estado: {} }), MOTIVO_PERSONAL);
  // El barrido: una abierta no se pone y, si ya la tenía, se le saca.
  const { m, base, manychat, esperar } = mundo([fila("561", { etapa: "quien_es" }), fila("562", { etapa: null, etiquetado: true }), fila("563")]);
  const r = await barrerSinIntencion({ base, manychat, esperar, dry: true });
  assert.deepEqual([r.para_poner, r.para_sacar], [1, 1]);
  assert.deepEqual(r.no_la_llevan, { "la charla sigue abierta": 1 });
  await barrerSinIntencion({ base, manychat, esperar, dry: false });
  assert.deepEqual(m.llamadas, [["sacar", "562", "sin_intencion"], ["poner", "563", "sin_intencion"]]);
});

/* ---------- lo que escribe después de la etiqueta en una charla de Cande ---------- */

// Hasta la cuarta revisión se llamaba "... con la etiqueta o personal, ...": desde la quinta (31/10), una personal sin la
// etiqueta no se mira (nadie se la pone).
test("escribioDespues: en una charla de Cande con la etiqueta, personal o no, cualquier mensaje la deja dudosa y se la saca", async () => {
  const personal = { id: "571", dueno: "cande", personal: true, personal_en: new Date(), sin_intencion_en: new Date() };
  assert.equal(miraLoQueEscribe(personal), true);
  // Hasta la cuarta revisión se miraba también una personal sin la etiqueta, porque el barrido se la podía poner. Desde
  // la quinta (31/10) ninguna personal la lleva: sin la etiqueta no hay nada que sacar.
  assert.equal(miraLoQueEscribe({ ...personal, sin_intencion_en: null }), false, "personal sin la etiqueta: nadie se la va a poner");
  assert.equal(miraLoQueEscribe({ id: "572", dueno: "cande", personal: false, sin_intencion_en: new Date() }), true);
  assert.equal(miraLoQueEscribe({ ...personal, dueno: "agente" }), false, "lo del agente se guarda y lo mira el turno");
  assert.equal(miraLoQueEscribe({ id: "573", dueno: "cande", personal: true, personal_en: null }), false, "personal vieja sin la etiqueta");
  assert.equal(miraLoQueEscribe({ id: "574", dueno: "cande", personal: false }), false);
  assert.equal(miraLoQueEscribe(null), false);

  const filaPersonal = fila("571", { dueno: "cande", personal: true, personal_en: new Date(), quien: null, del_lead: [], etiquetado: true });
  const { m, base, manychat } = mundo([filaPersonal]);
  const dudosas = [];
  base.marcarDudosa = async (id) => {
    dudosas.push(id);
    Object.assign(m.filas.find((f) => f.id === id), { personal_dudosa: true });
  };
  assert.equal(await escribioDespues({ base, manychat }, personal), true);
  assert.deepEqual(dudosas, ["571"]);
  assert.deepEqual(m.llamadas, [["sacar", "571", "sin_intencion"]]);
  // Y el barrido ya no se la vuelve a poner (desde la quinta revisión, por ser personal; y si vuelve al agente, por dudosa).
  const r = await barrerSinIntencion({ base, manychat, dry: true });
  assert.equal(r.para_poner, 0);
  assert.deepEqual(r.no_la_llevan, { [MOTIVO_PERSONAL]: 1 });
  assert.equal(m.filas[0].personal_dudosa, true);

  // Aunque no se pueda anotar como dudosa, se la saca igual; y si todo falla, no tira.
  const otro = mundo([filaPersonal]);
  otro.base.marcarDudosa = async () => { throw new Error("base caída"); };
  assert.equal(await escribioDespues({ base: otro.base, manychat: otro.manychat }, personal), true);
  assert.deepEqual(otro.m.llamadas, [["sacar", "571", "sin_intencion"]]);
  // La base caída en todo (también al anotar que se sacó, que desde la cuarta revisión es lo único que escribe).
  const caida = {
    marcarDudosa: async () => { throw new Error("base caída"); }, paraSinIntencion: async () => { throw new Error("base caída"); },
    marcarSinIntencion: async () => { throw new Error("base caída"); },
  };
  const antesDeCaer = m.llamadas.length;
  assert.equal(await escribioDespues({ base: caida, manychat }, personal), false);
  assert.deepEqual(m.llamadas.slice(antesDeCaer), [["sacar", "571", "sin_intencion"]], "a ManyChat se le pide igual");
  assert.equal(await escribioDespues({ base, manychat }, { id: "574", dueno: "agente" }), null);
});

/** Llama a /api/dm/entrada con la base de mentira: `contacto` es la fila de dm_contactos y `filas`, lo de paraSinIntencion. */
async function conEntrada(texto, { contacto, filas = [], colgar = false } = {}) {
  const { default: handler } = await import("../pages/api/dm/entrada.js");
  const consultas = [];
  const pedidos = [];
  const tareas = [];
  let soltar;
  const colgado = new Promise((r) => { soltar = r; });
  pg.otras = (t, params) => {
    consultas.push([t, params]);
    if (t.startsWith("SELECT c.id, c.dueno, c.personal")) return { rows: filas.map((f) => ({ ...f })) };
    if (t.startsWith("SELECT * FROM dm_contactos WHERE id =")) return { rows: contacto ? [{ ...contacto }] : [] };
    // tablas, la red de la bandeja, anotarLead (no es del agente: no guarda nada), los ajustes (sin altas) y lo que escribe.
    return { rows: [] };
  };
  const antes = globalThis.fetch;
  globalThis.fetch = async (url, op) => {
    pedidos.push({ url: String(url), cuerpo: JSON.parse(op?.body || "{}") });
    if (colgar) await colgado;
    return { ok: true, status: 200, json: async () => ({ status: "success" }) };
  };
  const CONTEXTO = Symbol.for("@vercel/request-context");
  globalThis[CONTEXTO] = { get: () => ({ waitUntil: (p) => tareas.push(p) }) };
  process.env.DM_SECRETO = SECRETO;
  process.env.POSTGRES_URL = "postgres://de-prueba";
  process.env.MANYCHAT_API_KEY = "clave-de-prueba";
  try {
    const res = respuesta();
    const pedido = handler({ method: "POST", headers: { "x-dm-secreto": SECRETO }, body: { contacto: contacto?.id || "579", texto } }, res);
    // Con ManyChat colgado, el 200 tiene que salir igual (ManyChat corta la entrada a los 10 segundos).
    const aTiempo = await Promise.race([pedido.then(() => true), new Promise((r) => { setTimeout(() => r(false), 2000); })]);
    const alContestar = { aTiempo, pedidos: pedidos.length, sacada: consultas.some(([t]) => /SET sin_intencion_en/.test(t)) };
    soltar();
    await pedido;
    await Promise.all(tareas);
    return { res, consultas, pedidos, tareas, alContestar };
  } finally {
    globalThis.fetch = antes;
    delete globalThis[CONTEXTO];
    pg.otras = null;
    delete process.env.DM_SECRETO;
    delete process.env.POSTGRES_URL;
    delete process.env.MANYCHAT_API_KEY;
  }
}

test("/api/dm/entrada: un mensaje en una charla personal con la etiqueta la deja dudosa y se la saca, después del 200", async () => {
  const contacto = { id: "581", dueno: "cande", personal: true, personal_en: new Date(), sin_intencion_en: new Date() };
  const filas = [fila("581", { dueno: "cande", personal: true, personal_en: new Date(), quien: null, del_lead: [], etiquetado: true, personal_dudosa: true })];
  const { res, consultas, pedidos, tareas, alContestar } = await conEntrada("hola! me interesa el 1 a 1", { contacto, filas, colgar: true });
  assert.equal(res.codigo, 200);
  assert.deepEqual(res.cuerpo, { ok: true, dueno: "cande" });
  assert.equal(tareas.length, 1, "va en waitUntil");
  assert.equal(alContestar.aTiempo, true, "el 200 no espera a ManyChat");
  assert.equal(alContestar.sacada, false, "el 200 no espera a ManyChat");
  const dudosa = consultas.find(([t]) => /^UPDATE dm_contactos SET personal_dudosa = true WHERE id =/.test(t));
  assert.ok(dudosa, "queda dudosa");
  assert.deepEqual(dudosa[1], ["581"]);
  assert.deepEqual(pedidos.map((p) => [p.url.split("/").at(-1), p.cuerpo.subscriber_id, p.cuerpo.tag_name]), [["removeTagByName", 581, "sin_intencion"]]);
  assert.ok(consultas.some(([t]) => /SET sin_intencion_en/.test(t)), "anotada como sacada");
  // El texto del lead no va a nada de la etiqueta (solo a anotarLead, que no guarda nada de una charla de Cande). Desde
  // la cuarta revisión (31/10) no relee la fila: se la pide sacar siempre, así que son dos (dudosa y sacada).
  const deLaEtiqueta = consultas.filter(([t]) => /personal_dudosa = true|SET sin_intencion_en|^SELECT c\.id, c\.dueno/.test(t));
  assert.equal(deLaEtiqueta.length, 2);
  assert.ok(deLaEtiqueta.every(([, params]) => !JSON.stringify(params ?? []).includes("me interesa")), "sin el texto");
});

// Hasta la cuarta revisión se llamaba "... una personal sin la etiqueta queda dudosa y se la saca igual": ver adentro.
test("/api/dm/entrada: cualquier mensaje cuenta, también otro coqueteo; una personal sin la etiqueta no se toca (nadie se la pone)", async () => {
  const etiquetada = { id: "582", dueno: "cande", personal: true, personal_en: new Date(), sin_intencion_en: new Date() };
  const filaEtiquetada = fila("582", { dueno: "cande", personal: true, personal_en: new Date(), quien: null, del_lead: [], etiquetado: true });
  const coqueteo = await conEntrada(COQUETEO, { contacto: etiquetada, filas: [filaEtiquetada] });
  assert.deepEqual(coqueteo.pedidos.map((p) => p.url.split("/").at(-1)), ["removeTagByName"]);

  // Hasta la cuarta revisión, una personal sin la etiqueta quedaba dudosa y se le pedía a ManyChat sacarla, porque el
  // barrido o el turno se la podían estar poniendo. Desde la quinta (31/10) ninguna personal la lleva: nadie se la pone,
  // así que no hay nada que hacer (y la base, que se anota antes de pedirla, la mostraría si alguien la estuviera
  // poniendo). Sin tarea, sin dudosa y sin ManyChat.
  const sinEtiqueta = { ...etiquetada, id: "583", sin_intencion_en: null };
  const r = await conEntrada("hola", { contacto: sinEtiqueta, filas: [fila("583", { dueno: "cande", personal: true, quien: null, del_lead: [] })] });
  assert.equal(r.tareas.length, 0);
  assert.ok(!r.consultas.some(([t]) => /SET personal_dudosa = true/.test(t)));
  assert.deepEqual(r.pedidos, []);
});

test("/api/dm/entrada: una charla de Cande sin la etiqueta y no personal, o una del agente, no se toca", async () => {
  for (const contacto of [{ id: "584", dueno: "cande", personal: false }, { id: "585", dueno: "cande", personal: true, personal_en: null }, null]) {
    const r = await conEntrada("hola", { contacto });
    assert.equal(r.res.codigo, 200, JSON.stringify(contacto));
    assert.equal(r.tareas.length, 0, JSON.stringify(contacto));
    assert.ok(!r.consultas.some(([t]) => /personal_dudosa = true/.test(t)), JSON.stringify(contacto));
  }
});

test("/api/dm/entrada: si la base o ManyChat fallan al sacarla, el 200 sale igual y nada tira", async () => {
  const contacto = { id: "586", dueno: "cande", personal: true, personal_en: new Date(), sin_intencion_en: new Date() };
  const { default: handler } = await import("../pages/api/dm/entrada.js");
  const tareas = [];
  pg.otras = (t) => {
    if (t.startsWith("SELECT * FROM dm_contactos WHERE id =")) return { rows: [{ ...contacto }] };
    if (/personal_dudosa = true|^SELECT c\.id, c\.dueno, c\.personal/.test(t)) throw new Error("base caída");
    return { rows: [] };
  };
  const CONTEXTO = Symbol.for("@vercel/request-context");
  globalThis[CONTEXTO] = { get: () => ({ waitUntil: (p) => tareas.push(p) }) };
  process.env.DM_SECRETO = SECRETO;
  process.env.POSTGRES_URL = "postgres://de-prueba";
  try {
    const res = respuesta();
    await handler({ method: "POST", headers: { "x-dm-secreto": SECRETO }, body: { contacto: "586", texto: "hola" } }, res);
    assert.equal(res.codigo, 200);
    assert.equal(tareas.length, 1);
    assert.equal(await tareas[0], false, "no tira: queda registrado");
  } finally {
    delete globalThis[CONTEXTO];
    pg.otras = null;
    delete process.env.DM_SECRETO;
    delete process.env.POSTGRES_URL;
  }
});

/* ---------- cuarta revisión del 31/10 ---------- */

// Una respuesta (un gracias, un sí, un dale, un ok) contesta algo que le mandó la cuenta, aunque en la charla guardada no
// se vea: la guía del CV del automático llega al hilo sin texto. Y entre mujeres, "gracias hermosa" es la forma común de
// agradecer. Al lado de un halago, en el mismo mensaje o aparte, no la lleva.
const RESPUESTAS_CON_HALAGO = [
  ["gracias hermosa!!"], ["Gracias reina 🥰"], ["graciass amiga"], ["gracias linda ❤️"], ["sii amiga"], ["dale linda"],
  // Hasta la cuarta revisión iba "listo divina 😘". Desde la quinta (31/10) "divina" no se reconoce (no es un halago) y ese
  // mensaje no la lleva por eso: está con las frases de abajo. Acá, el mismo caso con "linda".
  ["ok amiga"], ["gracias!", "hermosa"], ["hermosa 😍", "muchas gracias"], ["Mil gracias hermosa 🙏"], ["listo linda 😘"],
  ["hola", "gracias reina"], ["okeyy hermosa"], ["bueno linda"],
];
// Señales que también dicen otra cosa: un halago al día, una cita que puede ser una frase o la llamada de TRABAJO, el
// número o el whatsapp sin otra señal (el 1 a 1 se cierra por WhatsApp), una despedida, "amiga" sin una señal fuerte, y
// lo que puede ser una respuesta a la foto de una historia.
const SENALES_QUE_DICEN_OTRA_COSA = [
  "linda tarde!", "bella noche", "hermosa tarde", "Linda semanaaa", "hermosa noche ✨", "qué linda la tarde", "linda tarde hermosa",
  "buena cita", "la cita", "cita", "una cita", "hermosa cita", "linda cita 🔥", "el número", "el whatsapp", "dame tu whatsapp", "tu whatsapp", "hermosa, el whatsapp",
  "nos vemos!", "nos vemos 😘", "amiga", "hola amiga hermosa", "hermosa amiga 😍", "cafecito", "bebe",
];

test("una respuesta al lado de un halago no la lleva, en el mismo mensaje o aparte (ante la duda, contesta algo de la cuenta)", () => {
  for (const charla of RESPUESTAS_CON_HALAGO) {
    const cual = charla.join(" + ");
    assert.notEqual(motivoSinIntencion({ ...noDev, charlaDelLead: charla }), null, cual);
    assert.notEqual(motivoSinIntencion({ ...noDev, charlaDelLead: [COQUETEO, ...charla] }), null, `${COQUETEO} + ${cual}`);
    // En el alta y en "borrar", lo de antes de borrar: queda dudosa.
    assert.notEqual(senalDeLaCharla(antesDeBorrar({ mensajes: charla.map((texto) => ({ quien: "lead", texto })) })), null, cual);
    // Alguno es una respuesta (el halago aparte, como "hermosa", sí es personal: frena la respuesta).
    assert.ok(charla.some((t) => tipoDeMensaje(t) === "respuesta"), cual);
  }
  for (const t of ["gracias hermosa!!", "Gracias reina 🥰", "graciass amiga", "dale linda", "ok amiga", "gracias!", "sí"]) {
    assert.equal(tipoDeMensaje(t), "respuesta", t);
  }
  // Una respuesta aparte frena aunque el halago esté solo en otro mensaje: lo dice el barrido en no_la_llevan.
  assert.equal(motivoSinIntencion({ ...noDev, charlaDelLead: ["gracias!", "hermosa"] }), MOTIVO_RESPUESTA);
  // Un saludo, una risa o un emoji sí pueden ir al lado: "hola hermosa 😍" la sigue llevando.
  for (const charla of [["hola hermosa 😍"], ["holaa", "jaja", "hermosa 😍"], ["buenas noches hermosa"], ["hey linda 🔥"]]) {
    assert.equal(motivoSinIntencion({ ...noDev, charlaDelLead: charla }), null, charla.join(" + "));
  }
  // "Gracias!" solo sigue siendo algo suelto (frena igual).
  assert.equal(esSuelto("Gracias!!"), true);
  assert.equal(esSuelto("gracias hermosa!!"), false);
});

test("las señales que también dicen otra cosa no la llevan solas; con otra señal clara, sí", () => {
  for (const t of SENALES_QUE_DICEN_OTRA_COSA) {
    assert.notEqual(motivoSinIntencion({ ...noDev, charlaDelLead: [t] }), null, t);
    assert.notEqual(senalDeLaCharla(antesDeBorrar({ mensajes: [{ quien: "lead", texto: t }] })), null, `antes: ${t}`);
    assert.notEqual(tipoDeMensaje(t), "personal", t);
  }
  // "amiga" o "nos vemos" con una señal fuerte, y "cita" en "app de citas", "una cita conmigo" o con un salgamos: la
  // llevan.
  for (const t of [
    "te extraño amiga", "salgamos amiga 😘", "te vi en la app de citas", "una cita conmigo 😏", "salgamos a una cita",
    "salgamos, nos vemos hermosa 😘", "te extraño, nos vemos", "buenos días hermosaaa ❤️",
  ]) {
    assert.equal(tipoDeMensaje(t), "personal", t);
    assert.equal(motivoSinIntencion({ ...noDev, charlaDelLead: [t] }), null, t);
  }
  // Hasta la cuarta revisión el número con "tu" y otra señal, y "nos vemos" con un halago, la llevaban. Desde la quinta
  // (31/10): "nos vemos" solo con una señal fuerte (puede ser a un vivo), y el número o el whatsapp nunca ("dame" es
  // interés, como "pasame": el 1 a 1 se cierra por WhatsApp).
  for (const t of [
    "hermosa, dame tu número 😘", "hermosa, nos vemos 😘", "nos vemos hermosa", "nos vemos linda 😘", "mi amor, nos vemos",
    "dame tu whatsapp linda", "dame tu cel linda", "hola linda, dame tu wsp", "tu whatsapp hermosa", "hermosa tu número 😘",
  ]) {
    assert.notEqual(tipoDeMensaje(t), "personal", t);
    assert.notEqual(motivoSinIntencion({ ...noDev, charlaDelLead: [t] }), null, t);
    assert.notEqual(motivoSinIntencion({ ...noDev, charlaDelLead: [COQUETEO, t] }), null, `${COQUETEO} + ${t}`);
  }
  for (const t of ["dame tu whatsapp linda", "dame tu cel linda", "dame info"]) {
    assert.equal(motivoSinIntencion({ ...noDev, charlaDelLead: [t] }), "mostró interés o habló de trabajo", t);
  }
});

// Hasta la cuarta revisión se llamaba "... la anota como puesta con la falla; un error de ManyChat no". Desde la quinta
// (31/10) se anota antes de pedirla, así que también con un error de ManyChat queda anotada (ver adentro).
test("ponerla sin saber si salió (tardó, se cortó, tiró o no volvió nada) la anota como puesta con la falla; un error de ManyChat también", async () => {
  const casos = [
    ["tardó", async () => ({ ok: false, incierto: true, error: "ManyChat tardó más de 8 segundos: puede haber salido igual" })],
    ["se cortó la red", async () => ({ ok: false, sinRespuesta: true, error: "fetch failed" })],
    ["tiró", async () => { throw new Error("ManyChat caído"); }],
    ["no volvió nada", async () => undefined],
  ];
  for (const [cual, ponerEtiqueta] of casos) {
    const { m, base } = mundo([fila("701")]);
    assert.equal(await revisarSinIntencion({ base, manychat: { ponerEtiqueta, quitarEtiqueta: async () => ({ ok: true }) } }, "701"), false, cual);
    assert.equal(m.filas[0].etiquetado, true, `${cual}: puede estar en ManyChat, queda anotada como puesta`);
    assert.ok(m.filas[0].falla_en instanceof Date, `${cual}: con la falla, para volver a pedirla`);
    assert.deepEqual(m.fallas, [["701", false]], cual);
  }
  // ManyChat contestó que no (un error, o que no tiene al contacto). Hasta la cuarta revisión no se anotaba como puesta;
  // desde la quinta (31/10) ya estaba anotada antes de pedirla y queda así, con la falla: un "no" de ManyChat no prueba
  // que no la haya puesto, y si deja de llevarla se le pide sacarla. Si no tiene al contacto, también queda dicho.
  for (const error of ["código 9999 | de prueba", "Subscriber does not exist"]) {
    const { m, base, manychat } = mundo([fila("702")], { falla: () => true, error });
    assert.equal(await revisarSinIntencion({ base, manychat }, "702"), false, error);
    assert.equal(m.filas[0].etiquetado, true, error);
    assert.ok(m.filas[0].falla_en instanceof Date, error);
    assert.equal(m.filas[0].no_existe, error === "Subscriber does not exist", error);
  }
  // Un corte de red con el cliente de verdad (lib/dm/manychat.js): también queda anotada. Hasta la cuarta revisión el
  // cliente lo marcaba aparte (sinRespuesta); desde la quinta ya no hace falta, y el error vuelve a ser el de main.
  const mc = await import("../lib/dm/manychat.js");
  const antes = globalThis.fetch;
  process.env.MANYCHAT_API_KEY = "clave-de-prueba";
  globalThis.fetch = async () => { throw new TypeError("fetch failed"); };
  try {
    const r = await mc.ponerEtiqueta("703", "sin_intencion");
    assert.deepEqual(r, { ok: false, error: "fetch failed" });
    const { m, base } = mundo([fila("703")]);
    assert.equal(await revisarSinIntencion({ base, manychat: mc }, "703"), false);
    assert.equal(m.filas[0].etiquetado, true);
    assert.ok(m.filas[0].falla_en instanceof Date);
  } finally {
    globalThis.fetch = antes;
    delete process.env.MANYCHAT_API_KEY;
  }
});

test("la que quedó puesta sin saber si salió se vuelve a pedir; si deja de llevarla se saca, y el dry avisa hasta que salga", async () => {
  let poner = { ok: false, incierto: true, error: "ManyChat tardó, de prueba" };
  let sacar = { ok: false, error: "código 9999 | de prueba" };
  const { m, base } = mundo([fila("711"), fila("712")]);
  const llamadas = [];
  const manychat = {
    ponerEtiqueta: async (id) => { llamadas.push(["poner", id]); return poner; },
    quitarEtiqueta: async (id) => { llamadas.push(["sacar", id]); return sacar; },
    crearEtiqueta: async () => ({ ok: true }),
  };
  for (const id of ["711", "712"]) await revisarSinIntencion({ base, manychat }, id);
  // Recién: espera. Pasada la espera, el barrido las vuelve a pedir (la falla sigue anotada) y, si salen, la borra.
  const recien = await barrerSinIntencion({ base, manychat, dry: true });
  assert.deepEqual([recien.para_poner, recien.en_espera.poner, recien.ojo], [0, 2, undefined]);
  poner = { ok: true };
  const tarde = Date.now() + 2 * ESPERA_FALLA_MS;
  // Mientras tanto 712 resulta dev: la tiene (puede) y ya no la lleva.
  Object.assign(m.filas[1], { quien: "dev" });
  const dry = await barrerSinIntencion({ base, manychat, dry: true, ahora: tarde });
  assert.deepEqual([dry.para_poner, dry.para_sacar], [1, 1]);
  assert.match(dry.ojo, /^1 tienen la etiqueta/, "Cande no borra por la etiqueta hasta que salga");
  const r = await barrerSinIntencion({ base, manychat, dry: false, esperar: async () => {}, ahora: tarde });
  assert.deepEqual(llamadas.slice(2), [["sacar", "712"], ["poner", "711"]]);
  assert.deepEqual([r.puestas, r.sacadas, r.fallidas], [1, 0, 1]);
  assert.deepEqual([m.filas[0].etiquetado, m.filas[0].falla_en], [true, null], "711 salió: sin falla, no se pide más");
  assert.equal(m.filas[1].etiquetado, true, "712 no se pudo sacar: queda puesta, para reintentar");
  assert.match((await barrerSinIntencion({ base, manychat, dry: true, ahora: tarde })).ojo, /^1 tienen la etiqueta/);
  sacar = { ok: true };
  await barrerSinIntencion({ base, manychat, dry: false, esperar: async () => {}, ahora: tarde + 2 * ESPERA_FALLA_MS });
  assert.equal(m.filas[1].etiquetado, false);
  const final = await barrerSinIntencion({ base, manychat, dry: true, ahora: tarde + 2 * ESPERA_FALLA_MS });
  assert.deepEqual([final.ojo, final.para_poner, final.para_sacar], [undefined, 0, 0]);
  // Y la siguiente vuelta, nada más.
  const antes = llamadas.length;
  await revisarSinIntencion({ base, manychat }, "711");
  assert.equal(llamadas.length, antes);
});

/**
 * Una charla del agente con un coqueteo puro, no_dev y cerrada: la lleva. Hasta la cuarta revisión la carrera se probaba
 * con una personal recién borrada; desde la quinta (31/10) las personales no la llevan y la carrera queda en las charlas
 * del agente. `entraLead(texto)`: un mensaje del lead (en una charla del agente se guarda, y el turno lo ve al releer);
 * `tomaCande()`: la charla pasa a Cande; `contacto()`: la fila de dm_contactos como la lee la entrada.
 */
function charlaDelAgente(id) {
  const w = mundo([fila(id)]);
  w.base.marcarDudosa = async (x) => { Object.assign(w.m.filas.find((f) => f.id === x), { personal_dudosa: true }); };
  const f = () => w.m.filas[0];
  return {
    ...w,
    entraLead: (texto) => { f().del_lead = [...f().del_lead, texto]; },
    tomaCande: () => { f().dueno = "cande"; },
    contacto: () => ({ id, dueno: f().dueno, personal: false, sin_intencion_en: f().etiquetado ? new Date() : null }),
  };
}

test("la carrera: si el lead escribe mientras ManyChat le pone la etiqueta, al final no la tiene ni en ManyChat ni en la base", async () => {
  // 1) Entra "cuánto sale el 1 a 1?" mientras sale el pedido: el turno relee la fila, lo ve y la saca.
  {
    const c = charlaDelAgente("731");
    const enManyChat = new Set();
    const manychat = {
      ponerEtiqueta: async (id) => {
        c.entraLead("cuánto sale el 1 a 1?");
        enManyChat.add(id);
        return { ok: true };
      },
      quitarEtiqueta: async (id) => { enManyChat.delete(id); return { ok: true }; },
    };
    await revisarSinIntencion({ base: c.base, manychat }, "731");
    assert.equal(enManyChat.has("731"), false, "el turno releyó la fila, vio la pregunta y la sacó");
    assert.equal(c.m.filas[0].etiquetado, false);
    const dry = await barrerSinIntencion({ base: c.base, manychat, dry: true });
    assert.deepEqual([dry.para_poner, dry.para_sacar, dry.ojo], [0, 0, undefined]);
  }
  // 2) Mientras sale el pedido la toma Cande y el lead escribe: la entrada ya ve la etiqueta (se anotó antes de pedirla)
  //    y la saca antes de que ManyChat termine de ponerla; el turno relee, la ve de Cande y la saca de nuevo.
  {
    const c = charlaDelAgente("732");
    const enManyChat = new Set();
    let entrada;
    const manychat = {
      ponerEtiqueta: async (id) => {
        c.tomaCande();
        const fila = c.contacto();
        assert.ok(fila.sin_intencion_en, "la base ya la tiene anotada");
        entrada = await escribioDespues({ base: c.base, manychat }, fila);
        enManyChat.add(id);
        return { ok: true };
      },
      quitarEtiqueta: async (id) => { enManyChat.delete(id); return { ok: true }; },
    };
    await revisarSinIntencion({ base: c.base, manychat }, "732");
    assert.equal(entrada, true);
    assert.deepEqual([enManyChat.has("732"), c.m.filas[0].etiquetado, c.m.filas[0].personal_dudosa], [false, false, true]);
  }
  // 3) Lo mismo, pero lo que pidió la entrada termina después de que el turno terminó.
  {
    const c = charlaDelAgente("733");
    const enManyChat = new Set();
    let entrada;
    let soltar;
    const demorada = new Promise((r) => { soltar = r; });
    let primera = true;
    const manychat = {
      ponerEtiqueta: async (id) => {
        c.tomaCande();
        entrada = escribioDespues({ base: c.base, manychat }, c.contacto());
        await new Promise((r) => { setImmediate(r); });
        enManyChat.add(id);
        return { ok: true };
      },
      quitarEtiqueta: async (id) => {
        enManyChat.delete(id);
        if (primera) { primera = false; await demorada; }
        return { ok: true };
      },
    };
    await revisarSinIntencion({ base: c.base, manychat }, "733");
    assert.equal(enManyChat.has("733"), false);
    soltar();
    assert.equal(await entrada, true);
    assert.deepEqual([enManyChat.has("733"), c.m.filas[0].etiquetado, c.m.filas[0].personal_dudosa], [false, false, true]);
  }
});

/* ---------- quinta revisión del 31/10 ---------- */

// Respuestas hechas con palabras de relleno, o agradecimientos sin "gracias": "de una" a un "Te paso la guía?", "a vos" a
// un "Gracias por escribir!", "y vos" a un "Cómo va la búsqueda?", y "sos una divina" a la guía del CV, que llega sin
// texto al hilo. Con la regla de la cuarta revisión todos la llevaban (scratchpad de la revisión: cuarenta.mjs, casos 1
// a 11 y 18, y extra.mjs).
const RESPUESTAS_SIN_GRACIAS = [
  "sos una divina ❤️", "ay qué divina 🥰", "sos lo más linda 😘", "sos un amor hermosa 💕", "divinaaa 💕", "sos una reina 😍",
  "sos una diosa ❤️", "qué divina sos 🥰", "de una hermosa ❤️", "a vos linda 😘", "y vos hermosa", "para vos hermosa ❤️",
  "y tu hermosa", "a ti linda", "igualmente hermosa", "sos lo más", "listo divina 😘", "sos una genia linda", "para ti hermosa",
];

test("las respuestas sin \"gracias\" (de una, a vos, y vos, sos una divina, sos lo más) no la llevan, solas ni con un coqueteo", () => {
  for (const t of RESPUESTAS_SIN_GRACIAS) {
    assert.notEqual(tipoDeMensaje(t), "personal", t);
    assert.notEqual(motivoSinIntencion({ ...noDev, charlaDelLead: [t] }), null, t);
    assert.notEqual(motivoSinIntencion({ ...noDev, charlaDelLead: [COQUETEO, t] }), null, `${COQUETEO} + ${t}`);
    // En el alta y en "borrar", lo de antes de borrar: queda dudosa (por si vuelve al agente).
    assert.notEqual(senalDeLaCharla(antesDeBorrar({ mensajes: [{ quien: "lead", texto: t }] })), null, `antes: ${t}`);
  }
  // Las frases cuentan como respuesta sobre el texto preparado (sin tildes, apretado).
  for (const t of ["de una hermosa ❤️", "a vos linda 😘", "para vos hermosa ❤️", "sos un amor hermosa 💕", "sos lo más linda 😘",
    "sos una reina 😍", "sos una diosa ❤️", "sos una divina ❤️", "a tí linda", "igualmente hermosa", "deee unaaa hermosa"]) {
    assert.equal(tipoDeMensaje(t), "respuesta", t);
  }
  assert.equal(motivoSinIntencion({ ...noDev, charlaDelLead: [COQUETEO, "de una hermosa ❤️"] }), MOTIVO_RESPUESTA);
  // "y vos" o "y tú" al principio devuelven la pregunta.
  for (const t of ["y vos hermosa", "y tú hermosa", "y tu linda 😘", "hola y vos hermosa"]) {
    assert.equal(esPregunta(t), true, t);
    assert.equal(motivoSinIntencion({ ...noDev, charlaDelLead: [t] }), "hizo una pregunta", t);
  }
  // "divina" ya no es un halago, pero los demás siguen: "reina" o "diosa" solas, "mi amor" o "hola hermosa" la llevan.
  for (const t of ["reina 😍", "hola diosa", "mi amor 😘", "hola hermosa 😍", "qué linda sos 😘"]) {
    assert.equal(motivoSinIntencion({ ...noDev, charlaDelLead: [t] }), null, t);
  }
});

/** Un ManyChat de verdad (lib/dm/manychat.js) con un fetch de mentira que pone la etiqueta y contesta `respuesta()`. */
async function conManyChatDeVerdad(respuesta, alPedir) {
  const mc = await import("../lib/dm/manychat.js");
  const enManyChat = new Set();
  const antes = globalThis.fetch;
  process.env.MANYCHAT_API_KEY = "clave-de-prueba";
  globalThis.fetch = async (url, op) => {
    const b = JSON.parse(op?.body || "{}");
    const id = String(b.subscriber_id);
    if (String(url).endsWith("/addTagByName")) {
      enManyChat.add(id); // ManyChat la pone, conteste lo que conteste
      return respuesta();
    }
    if (String(url).endsWith("/removeTagByName")) enManyChat.delete(id);
    alPedir?.(url);
    return { ok: true, status: 200, json: async () => ({ status: "success" }) };
  };
  const listo = () => { globalThis.fetch = antes; delete process.env.MANYCHAT_API_KEY; };
  return { mc, enManyChat, listo };
}

test("se anota antes de pedirla: con un 502, un 200 sin cuerpo leído o la base que falla después de ManyChat, al pasar a dev sale el pedido de sacar", async () => {
  const casos = [
    ["502", () => ({ ok: false, status: 502, json: async () => { throw new SyntaxError("Unexpected token <"); } })],
    ["500", () => ({ ok: false, status: 500, json: async () => ({ status: "error", message: "Internal server error" }) })],
    // El corte de los 8 segundos cae mientras se lee el cuerpo del 200: el .catch de manychat.js se lo traga.
    ["200 sin cuerpo", () => ({ ok: true, status: 200, json: async () => { const e = new Error("This operation was aborted"); e.name = "AbortError"; throw e; } })],
  ];
  for (const [cual, respuesta] of casos) {
    const { mc, enManyChat, listo } = await conManyChatDeVerdad(respuesta);
    try {
      const { m, base } = mundo([fila("741")]);
      assert.equal(await revisarSinIntencion({ base, manychat: mc }, "741"), false, cual);
      assert.equal(enManyChat.has("741"), true, `${cual}: ManyChat la puso`);
      assert.equal(m.filas[0].etiquetado, true, `${cual}: la base lo sabe`);
      assert.ok(m.filas[0].falla_en instanceof Date, `${cual}: con la falla`);
      // Al otro día pide el precio del 1 a 1 y el modelo dice dev: sale el pedido de sacar.
      Object.assign(m.filas[0], { quien: "dev", etapa: "si_busca", del_lead: [...m.filas[0].del_lead, "cuánto sale el 1 a 1?"] });
      assert.equal(await revisarSinIntencion({ base, manychat: mc }, "741"), true, cual);
      assert.equal(enManyChat.has("741"), false, `${cual}: ManyChat ya no la tiene`);
      assert.equal(m.filas[0].etiquetado, false, cual);
    } finally {
      listo();
    }
  }
  // ManyChat la pone y dice que sí, pero la base no contesta al anotarlo: queda lo de antes de pedirla (puesta, con la falla).
  const { mc, enManyChat, listo } = await conManyChatDeVerdad(() => ({ ok: true, status: 200, json: async () => ({ status: "success" }) }));
  try {
    const { m, base } = mundo([fila("742")]);
    const anotar = base.marcarSinIntencion;
    let veces = 0;
    base.marcarSinIntencion = async (id, puesta) => {
      veces++;
      if (veces === 2) throw new Error("la base no contesta");
      return anotar(id, puesta);
    };
    assert.equal(await revisarSinIntencion({ base, manychat: mc }, "742"), false);
    assert.equal(enManyChat.has("742"), true);
    assert.deepEqual([m.filas[0].etiquetado, m.filas[0].falla_en instanceof Date], [true, true]);
    // El barrido la vuelve a pedir pasada la espera (la falla sigue): no se pierde de vista.
    const dry = await barrerSinIntencion({ base, manychat: mc, dry: true, ahora: Date.now() + 2 * ESPERA_FALLA_MS });
    assert.equal(dry.para_poner, 1);
    Object.assign(m.filas[0], { quien: "dev" });
    assert.equal(await revisarSinIntencion({ base, manychat: mc }, "742"), true);
    assert.deepEqual([enManyChat.has("742"), m.filas[0].etiquetado], [false, false]);
  } finally {
    listo();
  }
  // Si la base no deja anotarla antes, a ManyChat no se le pide nada (no puede quedar una que la base no conoce).
  const pedidos = [];
  const sinBase = await conManyChatDeVerdad(() => ({ ok: true, status: 200, json: async () => ({ status: "success" }) }));
  try {
    const { base } = mundo([fila("743")]);
    base.anotarFallaSinIntencion = async () => { throw new Error("la base no contesta"); };
    const manychat = { ponerEtiqueta: async (...x) => { pedidos.push(x); return sinBase.mc.ponerEtiqueta(...x); } };
    assert.equal(await revisarSinIntencion({ base, manychat }, "743"), false);
    assert.deepEqual(pedidos, []);
    assert.equal(sinBase.enManyChat.has("743"), false);
  } finally {
    sinBase.listo();
  }
});

test("ninguna charla personal la lleva, ni en el barrido; si una la tiene, se le saca", async () => {
  const filas = [
    fila("751", { dueno: "cande", personal: true, quien: null, del_lead: [] }),
    fila("752", { dueno: "cande", personal: true, quien: "no_dev", etapa: "cerrada", del_lead: [COQUETEO] }),
    fila("753", { dueno: "cande", personal: true, quien: null, del_lead: [], etiquetado: true }),
    fila("754", { dueno: "cande", personal: true, quien: null, del_lead: [], etiquetado: true, falla_en: new Date(0) }),
  ];
  const { m, base, manychat, esperar } = mundo(filas);
  const dry = await barrerSinIntencion({ base, manychat, esperar, dry: true });
  assert.deepEqual([dry.para_poner, dry.para_sacar, dry.no_la_llevan], [0, 2, { [MOTIVO_PERSONAL]: 2 }]);
  assert.match(dry.ojo, /^2 tienen la etiqueta y ya no la llevan/);
  for (const id of ["751", "752"]) assert.equal(await revisarSinIntencion({ base, manychat }, id), null, id);
  const r = await barrerSinIntencion({ base, manychat, esperar, dry: false });
  assert.deepEqual(m.llamadas, [["sacar", "753", "sin_intencion"], ["sacar", "754", "sin_intencion"]]);
  assert.equal(r.sacadas, 2);
  assert.equal((await barrerSinIntencion({ base, manychat, esperar, dry: true })).ojo, undefined);
});
