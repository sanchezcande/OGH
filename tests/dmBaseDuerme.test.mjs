// La base duerme entre una vuelta de los crons y la otra (21/10). La base de Neon se apaga sola a los 5 minutos sin
// consultas y cobra por hora prendida, y la Mac de Cande preguntaba cada 10 segundos: no dormía nunca. Ahora la Mac
// pregunta en una ventana de cada cuarto de hora (de 10 segundos antes a 90 después de los minutos 0, 15, 30 y 45) y
// mientras tiene trabajo, y en cada pregunta dice hasta cuándo va a seguir preguntando ("hasta"). El sitio nunca le crea
// un trabajo fuera de ese rato, y lo que no se intentó lo contesta la vuelta siguiente. Ver lib/dm/cola.js.
//
// Todos los textos son inventados para la prueba. Este repo es público.
//
// Lo que estas pruebas NO cubren: lo que hace Postgres con las consultas nuevas de lib/dm/base.js (sinContestar con la
// falla general, guardarIndicacion, vencerIndicaciones, tomarIndicaciones, borrarIndicaciones, contactosConIndicacion,
// ultimoDeLaCuenta y fotosSinAviso con conMac). Antes de subir se prueban a mano contra un Postgres de verdad: que
// sinContestar tome en el momento una charla con una falla general anotada después de su último mensaje (y no una con
// una falla propia o dudosa, ni una de un toque, que no tiene motivo), que tomarIndicaciones saque todas las de la
// charla que tiene la más vieja, que vencerIndicaciones saque solo las de antes de la hora dada, que guardarIndicacion
// con `creado` la deje con esa hora, y que fotosSinAviso con la Mac escuchando deje afuera la foto de hace menos de 20
// minutos que tiene una falla general después.
//
// Correr:  node --test tests/*.test.mjs
import { respuesta } from "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const { base: pg } = await import("./dobles/postgres.mjs");
const {
  HASTA_TOPE_MS, LATIDO_SIN_HASTA_MS, MAC_ENCENDIDA_MS, MARGEN_MS, encendidaSegun, escuchaSegun, estadoDelCerebro, hastaDelLatido,
  latidoNuevo,
} = await import("../lib/dm/cola.js");
const { crearPedir, veFotos, SIN_MAC } = await import("../lib/dm/armado.js");
const { correrToques, FALLA_GENERAL } = await import("../lib/dm/seguimientos.js");
const {
  crearRespuestaTelegram, crearIndicacionesPendientes, horaDeLaVuelta, porQueNoSalio, INDICACION_VENCE_MS,
} = await import("../lib/dm/respuestas.js");
const { CADA_CRON_MS } = await import("../lib/crons.js");
const base = await import("../lib/dm/base.js");

const S = 1000;
const MIN = 60 * S;
const AHORA = Date.parse("2026-10-21T06:07:00Z"); // las 14:07 en Bali

/* ---------- hasta cuándo escucha la Mac ---------- */

test("con 'hasta', la Mac escucha mientras le quede el margen pedido, y ni un segundo más", () => {
  const l = { ms: AHORA, hasta: AHORA + 90 * S };
  assert.equal(escuchaSegun(l, MARGEN_MS.pedir, AHORA), true);
  assert.equal(escuchaSegun(l, MARGEN_MS.pedir, AHORA + 84 * S), true);
  assert.equal(escuchaSegun(l, MARGEN_MS.pedir, AHORA + 85 * S), false, "con 5 segundos de margen, a los 85 ya no");
  assert.equal(escuchaSegun(l, MARGEN_MS.toque, AHORA + 31 * S), false, "un toque necesita un minuto entero");
  // Antes: el latido de hace 14 minutos (la Mac preguntó en la vuelta anterior) daba la Mac por caída, y uno de hace
  // 2 minutos la daba por viva aunque se hubiera ido. Ahora cuenta lo que prometió.
  assert.equal(escuchaSegun({ ms: AHORA - 14 * MIN, hasta: AHORA - 12 * MIN }, 0, AHORA), false);
  assert.equal(escuchaSegun({ ms: AHORA - 2 * MIN, hasta: AHORA - 30 * S }, 0, AHORA), false);
  assert.equal(escuchaSegun({ ms: AHORA - 4 * MIN, hasta: AHORA + MIN }, MARGEN_MS.espera, AHORA), true, "en la cola de una charla");
  assert.equal(escuchaSegun(null, 0, AHORA), false, "nunca preguntó");
});

test("'hasta' nunca más de 15 minutos adelante: una Mac con el reloj corrido no deja al sitio creyendo que escucha", () => {
  assert.equal(hastaDelLatido({ ms: AHORA, hasta: AHORA + 5 * 3600000 }), AHORA + HASTA_TOPE_MS);
  assert.equal(escuchaSegun({ ms: AHORA, hasta: AHORA + 5 * 3600000 }, 0, AHORA + 16 * MIN), false);
  assert.equal(latidoNuevo(null, AHORA + 5 * 3600000, AHORA).hasta, AHORA + HASTA_TOPE_MS);
});

test("un cerebro de antes (sin 'hasta', pregunta siempre) sigue valiendo como antes: escucha si preguntó hace menos de 3 minutos", () => {
  // Así el sitio se puede subir antes que el cerebro nuevo sin cortar nada.
  assert.equal(LATIDO_SIN_HASTA_MS, 180 * S);
  assert.equal(escuchaSegun({ ms: AHORA - 2 * MIN }, MARGEN_MS.pedir, AHORA), true);
  assert.equal(escuchaSegun({ ms: AHORA - 3 * MIN }, MARGEN_MS.pedir, AHORA), false);
  // Y su latido se guarda como antes: una vez por minuto, sin "hasta".
  assert.deepEqual(latidoNuevo({ ms: AHORA - 61 * S }, undefined, AHORA), { ms: AHORA });
  assert.equal(latidoNuevo({ ms: AHORA - 30 * S }, undefined, AHORA), null);
});

test("el latido se escribe cuando cambia 'hasta' o cuando tiene más de 15 segundos; si no, no se toca la base de más", () => {
  const previo = { ms: AHORA - 10 * S, hasta: AHORA + 80 * S };
  assert.equal(latidoNuevo(previo, AHORA + 80 * S, AHORA), null, "la misma ventana, hace 10 segundos");
  assert.deepEqual(latidoNuevo(previo, AHORA + 80 * S, AHORA + 6 * S), { ms: AHORA + 6 * S, hasta: AHORA + 80 * S });
  assert.deepEqual(latidoNuevo(previo, AHORA + 300 * S, AHORA), { ms: AHORA, hasta: AHORA + 300 * S }, "tomó un trabajo: 5 minutos más");
  // Una Mac que se reinició en medio de su cola promete menos: vale lo nuevo, no lo de antes.
  assert.deepEqual(latidoNuevo({ ms: AHORA - 5 * S, hasta: AHORA + 250 * S }, AHORA + 60 * S, AHORA), { ms: AHORA, hasta: AHORA + 60 * S });
});

test("la Mac está prendida si preguntó en los últimos 20 minutos, escuche ahora o no (solo para los textos)", () => {
  assert.equal(MAC_ENCENDIDA_MS, CADA_CRON_MS + 5 * MIN);
  assert.equal(encendidaSegun({ ms: AHORA - 14 * MIN, hasta: AHORA - 12 * MIN }, AHORA), true);
  assert.equal(encendidaSegun({ ms: AHORA - 21 * MIN, hasta: AHORA - 19 * MIN }, AHORA), false);
  assert.equal(encendidaSegun(null, AHORA), false);
});

/** Corre `fn` con un Postgres de mentira que guarda dm_config en memoria y anota cada consulta. */
async function conBase(fn, { config = {}, extra = null } = {}) {
  const guardado = { ...config };
  const consultas = [];
  pg.otras = (t, params) => {
    consultas.push({ t, params });
    if (extra) {
      const r = extra(t, params);
      if (r !== undefined) return r;
    }
    if (t === "SELECT valor FROM dm_config WHERE clave = ?") return { rows: params[0] in guardado ? [{ valor: guardado[params[0]] }] : [] };
    if (t.startsWith("INSERT INTO dm_config (clave, valor) VALUES (?, ?::jsonb)")) {
      guardado[params[0]] = JSON.parse(params[1]);
      return { rows: [] };
    }
    if (/^(CREATE|ALTER)/.test(t)) return { rows: [] };
    if (t.startsWith("UPDATE dm_trabajos SET estado = 'tomado'")) return { rows: [] };
    return undefined;
  };
  process.env.POSTGRES_URL = "postgres://de-prueba";
  process.env.COLA_SECRET = "secreto-de-prueba";
  try {
    return await fn({ guardado, consultas });
  } finally {
    pg.otras = null;
    delete process.env.POSTGRES_URL;
    delete process.env.COLA_SECRET;
  }
}

test("/api/dm/trabajos: la Mac manda 'hasta' al tomar, y con sus lugares ocupados avisa con la acción 'latido' que sigue escuchando", async () => {
  const { default: handler } = await import("../pages/api/dm/trabajos.js");
  const llamar = async (body) => {
    const res = respuesta();
    await handler({ method: "POST", headers: { authorization: "Bearer secreto-de-prueba" }, body }, res);
    return res;
  };
  await conBase(async ({ guardado }) => {
    const hasta = Date.now() + 90 * S;
    const t = await llamar({ accion: "tomar", hasta });
    assert.equal(t.codigo, 200);
    assert.deepEqual(t.cuerpo, { trabajo: null });
    assert.equal(guardado.cerebro_latido.hasta, hasta);
    const mas = Date.now() + 300 * S;
    const l = await llamar({ accion: "latido", hasta: mas });
    assert.equal(l.codigo, 200);
    assert.deepEqual(l.cuerpo, { ok: true });
    assert.equal(guardado.cerebro_latido.hasta, mas);
  });
});

test("el estado del agente dice cuándo preguntó la Mac por última vez y hasta cuándo escucha, no solo los segundos", async () => {
  const ms = Date.now() - 4 * MIN;
  await conBase(async () => {
    const e = await estadoDelCerebro();
    assert.equal(e.cerebro_ultima_vez, new Date(ms).toISOString());
    assert.equal(e.cerebro_escucha_hasta, new Date(ms + 90 * S).toISOString());
    assert.equal(e.cerebro_escuchando, false, "su ventana ya pasó");
    assert.equal(e.cerebro_encendido, true, "pero está prendida");
    assert.ok(e.cerebro_local_hace_segundos >= 239);
  }, { config: { cerebro_latido: { ms, hasta: ms + 90 * S } } });
});

/* ---------- el portón: sin la Mac escuchando, ni se crea el trabajo ---------- */

test("pedir: con la Mac sin escuchar no crea el trabajo ni espera 75 segundos: falla general y transitoria al toque", async () => {
  const pedidos = [];
  const margenes = [];
  const pedirLocal = async (p) => { pedidos.push(p); return { accion: "callar" }; };
  const armar = (escucha, cerebro = "local") => crearPedir({
    ajustes: async () => ({ cerebro, link_de_pago: "" }),
    pedirApi: async () => ({ accion: "api" }),
    pedirLocal,
    escuchando: async (m) => { margenes.push(m); return escucha; },
  });
  await assert.rejects(armar(false)({ prompt: "P", turno: {} }), (e) => {
    assert.equal(e.message, SIN_MAC);
    assert.equal(e.general, true);
    assert.equal(e.transitorio, true);
    assert.equal(e.dudosa, false);
    return true;
  });
  assert.equal(pedidos.length, 0, "no se creó ningún trabajo");
  assert.deepEqual(margenes, [MARGEN_MS.pedir]);
  assert.deepEqual(await armar(true)({ prompt: "P", turno: { mensajes_del_lead: ["hola"] } }), { accion: "callar" });
  assert.equal(pedidos.length, 1);
  // El cerebro de la API no depende de la Mac.
  assert.deepEqual(await armar(false, "api")({ prompt: "P", turno: {} }), { accion: "api" });
});

test("las fotos las mira el agente solo si la Mac va a seguir escuchando después de la ráfaga (15 segundos)", async () => {
  const margenes = [];
  assert.equal(await veFotos({ cerebro: "local" }, { escuchando: async (m) => { margenes.push(m); return true; } }), true);
  assert.equal(await veFotos({ cerebro: "local" }, { escuchando: async () => false }), false);
  assert.equal(await veFotos({ cerebro: "api" }, { escuchando: async () => true }), false);
  assert.deepEqual(margenes, [MARGEN_MS.fotos]);
  assert.equal(MARGEN_MS.fotos, 15 * S);
});

/* ---------- los toques: la Mac se mira antes de reclamar cada uno ---------- */

test("toques: si la ventana de la Mac se cierra en medio de la vuelta, no se reclama ninguno más (reclamar lo saca de la fila)", async () => {
  const reclamados = [];
  let escucha = 2;
  const hechos = await correrToques({
    reclamar: async () => { reclamados.push(reclamados.length + 1); return String(reclamados.length); },
    procesar: async () => ({ hecho: "enviada" }),
    hasta: Infinity, tope: 10,
    seguir: async () => escucha-- > 0,
  });
  assert.equal(hechos, 2);
  assert.deepEqual(reclamados, [1, 2], "el tercero sigue en la fila para otra vuelta");
  const nada = await correrToques({
    reclamar: async () => { throw new Error("no tenía que reclamar"); }, procesar: async () => ({}), hasta: Infinity, tope: 10, seguir: async () => false,
  });
  assert.equal(nada, 0);
  assert.equal(MARGEN_MS.toque, 60 * S);
});

/* ---------- la espera toma en el momento lo que ya falló en vivo ---------- */

test("sinContestar toma ya un mensaje cuyo intento en vivo falló porque la Mac no estaba, sin esperar los 5 minutos", async () => {
  await conBase(async ({ consultas }) => {
    await base.sinContestar();
    const q = consultas.find((c) => c.t.startsWith("SELECT c.id, c.nombre"));
    assert.ok(q, "corrió la consulta");
    assert.match(q.t, /AND c\.ultimo_lead >= NOW\(\) - INTERVAL '23 hours' AND \(c\.ultimo_lead <= NOW\(\) - INTERVAL '5 minutes' OR EXISTS \(/);
    assert.match(q.t, /g\.accion IN \('error', 'reintento'\) AND g\.estado = 'error' AND g\.motivo = \? AND g\.creado >= c\.ultimo_lead\)\)/);
    assert.ok(q.params.includes(FALLA_GENERAL), "solo la falla general: la Mac no estaba");
    // Las trabas de 6 minutos (una corrida en marcha) siguen igual: nunca dos respuestas.
    assert.match(q.t, /AND \(c\.tomado_en IS NULL OR c\.tomado_en < NOW\(\) - INTERVAL '6 minutes'\)/);
    assert.match(q.t, /AND \(c\.reintento_en IS NULL OR c\.reintento_en < NOW\(\) - INTERVAL '6 minutes'\)/);
  }, { extra: (t) => (t.startsWith("SELECT c.id, c.nombre") ? { rows: [] } : undefined) });
});

/* ---------- las indicaciones de Cande con la Mac sin escuchar ---------- */

test("la vuelta siguiente se dice en hora de Bali, al cuarto de hora que sigue", () => {
  assert.equal(horaDeLaVuelta(AHORA), "14:15");
  assert.equal(horaDeLaVuelta(Date.parse("2026-10-21T15:59:59Z")), "00:00");
  assert.equal(horaDeLaVuelta(Date.parse("2026-10-21T06:15:00Z")), "14:30", "justo en una vuelta: la que sigue");
});

function telegramDePrueba({ escucha = true, procesado = { hecho: "enviada", enviado: ["Mensaje de prueba"] } } = {}) {
  const hechos = [];
  const dichos = [];
  const fakeBase = {
    reclamarNovedad: async () => true,
    contacto: async (id) => (id === "123456789" ? { id, nombre: "Lead De Prueba", dueno: "agente" } : null),
    guardarIndicacion: async (i) => { hechos.push(["guardarIndicacion", i.contacto, i.texto]); },
  };
  const agente = { procesar: async (id, idDisparo, o) => { hechos.push(["procesar", id, o.evento]); return procesado; } };
  const responder = crearRespuestaTelegram({
    base: fakeBase, manychat: {}, decir: async (t) => dichos.push(t), agente, macEscucha: async () => escucha, ahora: () => AHORA,
  });
  return { hechos, dichos, responder };
}
const INDICACION = { contacto: "123456789", accion: "indicacion", texto: "decile algo de prueba", fechaAviso: new Date(AHORA) };

test("una indicación de Cande con la Mac sin escuchar no se intenta: se guarda para la vuelta y se le dice a qué hora sale", async () => {
  const { hechos, dichos, responder } = telegramDePrueba({ escucha: false });
  assert.equal(await responder(INDICACION, { updateId: 1 }), "indicacion para la vuelta");
  assert.deepEqual(hechos, [["guardarIndicacion", "123456789", "decile algo de prueba"]]);
  assert.equal(dichos.length, 1);
  assert.match(dichos[0], /^Sale en la vuelta de las 14:15/);
  assert.match(dichos[0], /\/textual/);
  assert.doesNotMatch(dichos[0], /apagada|sin red/, "no le dice que la Mac está apagada");
});

test("si la Mac no tomó la indicación a tiempo (se cerró su ventana justo), no salió nada y va a la vuelta, en vez de 'apagada'", async () => {
  const { hechos, dichos, responder } = telegramDePrueba({
    procesado: { hecho: "error del modelo", error: SIN_MAC, general: true, transitorio: true, reintento: false },
  });
  assert.equal(await responder(INDICACION, { updateId: 2 }), "indicacion para la vuelta");
  assert.deepEqual(hechos.map((h) => h[0]), ["procesar", "guardarIndicacion"]);
  assert.match(dichos[0], /^Sale en la vuelta de las 14:15/);
});

test("por qué no salió: con la Mac prendida no dice que está apagada", () => {
  assert.match(porQueNoSalio({ hecho: "error del modelo" }), /la Mac sin red o apagada/);
  const prendida = porQueNoSalio({ hecho: "error del modelo" }, { encendida: true });
  assert.doesNotMatch(prendida, /apagada/);
  assert.match(prendida, /la Mac está prendida/);
});

function pendientesDePrueba({ fila = [], vencidas = [], resultados = [], cuenta = {}, esperar = async () => {} } = {}) {
  const hechos = [];
  const dichos = [];
  const cola = [...fila];
  const fakeBase = {
    vencerIndicaciones: async (antes) => { hechos.push(["vencer", antes.getTime()]); return vencidas; },
    // Como base.tomarIndicaciones: todas las de la charla que tiene la más vieja.
    tomarIndicaciones: async () => {
      const c = cola[0]?.contacto;
      const lote = cola.filter((i) => i.contacto === c);
      for (const i of lote) cola.splice(cola.indexOf(i), 1);
      return lote;
    },
    guardarIndicacion: async (i) => { hechos.push(["devolver", i.contacto, i.creado]); },
    contacto: async (id) => ({ id, nombre: `Lead ${id}`, dueno: "agente" }),
    ultimoDeLaCuenta: async (id) => cuenta[id] || null,
  };
  const agente = {
    procesar: async (id, idDisparo, o) => {
      hechos.push(["procesar", id, idDisparo, o.evento, o.indicacion]);
      return resultados.shift() || { hecho: "enviada", enviado: ["Mensaje de prueba"] };
    },
  };
  const correr = crearIndicacionesPendientes({ base: fakeBase, agente, decir: async (t) => dichos.push(t), ahora: () => AHORA, esperar });
  return { hechos, dichos, correr, cola };
}

test("la espera escribe primero las indicaciones guardadas, de la más vieja a la más nueva, y le cuenta a Cande cada una", async () => {
  const p = pendientesDePrueba({
    fila: [{ contacto: "1", texto: "primera de prueba", creado: new Date(AHORA - 20 * MIN) }, { contacto: "2", texto: "segunda de prueba", creado: new Date(AHORA - 5 * MIN) }],
  });
  assert.deepEqual(await p.correr({ hasta: Infinity }), { hechas: 2, vencidas: 0, devueltas: 0, viejas: 0, charlas: 2 });
  assert.deepEqual(p.hechos, [
    ["vencer", AHORA - INDICACION_VENCE_MS],
    ["procesar", "1", null, "indicacion", "primera de prueba"],
    ["procesar", "2", null, "indicacion", "segunda de prueba"],
  ]);
  assert.deepEqual(p.dichos, ["✓ Le mandé a Lead 1: «Mensaje de prueba»", "✓ Le mandé a Lead 2: «Mensaje de prueba»"]);
});

test("si la Mac no la toma, la indicación vuelve a la fila con su hora y no se intenta ninguna más; a las 2 horas vence y se avisa", async () => {
  const creado = new Date(AHORA - 30 * MIN);
  const p = pendientesDePrueba({
    fila: [{ contacto: "1", texto: "una de prueba", creado }, { contacto: "2", texto: "otra de prueba", creado }],
    resultados: [{ hecho: "error del modelo", general: true, transitorio: true }],
  });
  assert.deepEqual(await p.correr({ hasta: Infinity }), { hechas: 0, vencidas: 0, devueltas: 1, viejas: 0, charlas: 1 });
  assert.deepEqual(p.hechos.slice(1), [["procesar", "1", null, "indicacion", "una de prueba"], ["devolver", "1", creado]]);
  assert.equal(p.cola.length, 1, "la otra sigue en la fila");
  assert.deepEqual(p.dichos, [], "no se le dice nada: sale en la vuelta siguiente");

  const vieja = pendientesDePrueba({ vencidas: [{ contacto: "3", texto: "una vieja de prueba", creado: new Date(AHORA - 3 * 3600000) }] });
  assert.deepEqual(await vieja.correr({ conMac: false }), { hechas: 0, vencidas: 1, devueltas: 0, viejas: 0, charlas: 0 });
  assert.equal(vieja.hechos.filter((h) => h[0] === "procesar").length, 0, "sin la Mac no se intenta nada");
  assert.match(vieja.dichos[0], /^No le escribí a Lead 3 lo que me pediste hace más de 2 horas \(«una vieja de prueba»\)/);
  assert.match(vieja.dichos[0], /\/textual/);
});
