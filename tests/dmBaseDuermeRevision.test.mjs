// La revisión de "la base duerme entre vueltas" (21/10). Lo que encontró y cómo quedó:
//   - Con la Mac prendida pero sin escuchar, una foto iba al toque como URGENTE y el turno se cerraba: el lead no recibía
//     el acuse ni Cande el borrador del código (eso se prueba en tests/dmComprobante.test.mjs). Acá, que el cron de los
//     toques no la mande como URGENTE mientras la espera la puede mirar.
//   - La espera arrancaba respuestas solo en su rato (150 segundos, de a dos): con un pico, el último lead esperaba 30 a
//     45 minutos mientras la Mac seguía escuchando sin nada que hacer. Ahora la Mac tira de la espera cada vez que
//     pregunta sin trabajo (el impulso), y las indicaciones de Cande van a la par, sin comerle el rato a las charlas.
//   - Una indicación guardada para la vuelta salía igual aunque Cande ya le hubiera escrito (/textual, a mano, el
//     código): al lead le llegaba lo mismo dos veces.
//   - Cada mensaje con la Mac sin escuchar hacía que ManyChat pasara a retirar una respuesta que no venía, y eso
//     despertaba la base de nuevo: la entrada ahora dice si hay algo para retirar ("recoger").
//
// Todos los textos son inventados para la prueba. Este repo es público.
//
// Correr:  node --test tests/*.test.mjs
import { respuesta } from "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const { base: pg } = await import("./dobles/postgres.mjs");
const { MARGEN_MS } = await import("../lib/dm/cola.js");
const { recogerDespues, macParaFotos } = await import("../lib/dm/armado.js");
const {
  crearImpulsoDeLaEspera, vaciarEspera, vueltaDeLaEspera, proximaVuelta, FALLA_GENERAL, IMPULSO_CADA_MS, ESPERA_EN_PARALELO,
} = await import("../lib/dm/seguimientos.js");
const {
  crearIndicacionesPendientes, crearRespuestaTelegram, OTRA_CORRIDA_ESPERA_MS, OTRA_CORRIDA_VUELTAS,
} = await import("../lib/dm/respuestas.js");
const { CADA_CRON_MS } = await import("../lib/crons.js");
const base = await import("../lib/dm/base.js");

const S = 1000;
const MIN = 60 * S;
const AHORA = Date.parse("2026-10-21T06:07:00Z"); // las 14:07 en Bali

/** Un reloj de mentira: dormir(ms) espera a que avanzar() lleve el reloj hasta ahí. */
function relojDePrueba(desde = 0) {
  let ahora = desde;
  const dormidos = [];
  const tick = async () => { for (let i = 0; i < 8; i++) await new Promise((r) => setImmediate(r)); };
  const dormir = (ms) => new Promise((r) => { dormidos.push({ en: ahora + ms, r }); });
  async function avanzar(hastaMs) {
    for (;;) {
      await tick();
      dormidos.sort((a, b) => a.en - b.en);
      if (!dormidos.length || dormidos[0].en > hastaMs) break;
      const d = dormidos.shift();
      ahora = d.en;
      d.r();
    }
    ahora = Math.max(ahora, hastaMs);
    await tick();
  }
  return { ahora: () => ahora, dormir, avanzar };
}

/** Las charlas apartadas por la espera (base.reclamarEspera): con tope, entre todas las corridas. */
function apartadasDePrueba() {
  const apartadas = new Set();
  const hechas = new Set();
  const reclamar = async (id, { tope = null } = {}) => {
    const libre = !apartadas.has(id) && !hechas.has(id);
    const hayLugar = tope == null || apartadas.size < tope;
    if (libre && hayLugar) {
      apartadas.add(id);
      return { tomada: true, lleno: false };
    }
    return { tomada: false, lleno: tope != null && apartadas.size >= tope };
  };
  return { apartadas, hechas, reclamar, soltar: async (id) => { apartadas.delete(id); } };
}

/* ---------- el impulso de la espera: la Mac tira de la espera mientras escucha ---------- */

/**
 * Un pico: `n` leads escribieron entre una ventana de la Mac y la otra, y sus turnos quedaron en espera. En el minuto 0
 * abre la ventana: la Mac pregunta cada 3 segundos (con un lugar libre: la espera ocupa dos de sus tres) y se queda
 * escuchando mientras tiene trabajo. Cada respuesta tarda `seg` segundos. Con `impulso`, cada pregunta sin trabajo arranca
 * una cosa de la espera (pages/api/dm/trabajos.js); sin él, solo corre el cron de la espera, una vez (su rato: 150 s).
 */
async function simularPico({ n = 12, seg = 60, impulso = true, fin = 15 * MIN }) {
  const reloj = relojDePrueba();
  const a = apartadasDePrueba();
  const ids = Array.from({ length: n }, (_, i) => `c${String(i + 1).padStart(2, "0")}`);
  const arrancadas = [];
  const terminadas = [];
  let aLaVez = 0;
  let maximo = 0;
  const procesar = async (id) => {
    arrancadas.push(id);
    maximo = Math.max(maximo, ++aLaVez);
    await reloj.dormir(seg * S);
    aLaVez--;
    a.hechas.add(id);
    terminadas.push([id, reloj.ahora()]);
    return { hecho: "enviada" };
  };
  // Lo que devuelve base.sinContestar: lo que falta, sin lo apartado, de la más vieja a la más nueva.
  const filas = async () => ids.filter((id) => !a.hechas.has(id) && !a.apartadas.has(id)).map((id) => ({ id, ultimo_id_lead: 1, fallos: 0 }));
  const reclamar = (id) => a.reclamar(id, { tope: ESPERA_EN_PARALELO });
  const corridas = [];
  // El cron de la espera en el minuto 0.
  corridas.push(vaciarEspera({
    filas: await filas(), prendido: true, macViva: true, maxFallos: 3, reclamar, soltar: a.soltar, procesar,
    hasta: 150 * S, ahora: reloj.ahora, esperar: reloj.dormir,
  }));
  if (impulso) {
    const impulsar = crearImpulsoDeLaEspera({
      ajustes: async () => ({ modo: "auto", cerebro: "local" }), filas, reclamar, soltar: a.soltar, procesar, ahora: reloj.ahora,
    });
    // La Mac: pregunta cada 3 segundos mientras escucha (y escucha mientras tiene trabajo); no espera al impulso, que
    // sigue de fondo en el sitio (waitUntil).
    (async () => {
      while (reloj.ahora() < fin) {
        corridas.push(impulsar({ escucha: async () => true }));
        await reloj.dormir(3 * S);
      }
    })();
  }
  await reloj.avanzar(fin);
  await Promise.all(corridas);
  return { ids, arrancadas, terminadas, maximo, ultima: terminadas.length ? Math.max(...terminadas.map((t) => t[1])) : null };
}

test("caudal con un pico: con el impulso, doce leads que escribieron entre dos ventanas salen en unos 7 minutos, de a dos, en orden y una vez cada uno", async () => {
  // La revisión: 12 leads contestan una historia entre las 10:01:30 y las 10:14:50. Solo con el cron de la espera
  // (150 segundos de arranques por vuelta) el último salía a los 30 o 45 minutos.
  for (const seg of [45, 60, 90]) {
    const r = await simularPico({ seg });
    assert.equal(r.terminadas.length, 12, `con ${seg} s por respuesta salieron todas`);
    assert.ok(r.ultima <= (6 * seg + 30) * S, `con ${seg} s por respuesta la última salió a los ${r.ultima / S} s`);
    assert.deepEqual(r.arrancadas, r.ids, "de la más vieja a la más nueva, una vez cada una");
    assert.equal(r.maximo, 2, "nunca más de dos a la vez: el otro lugar de la Mac queda para quien escribe en vivo");
  }
  // Sin el impulso, en esa misma vuelta salen las que entran en el rato del cron: 6 de 12 con 60 segundos.
  const sin = await simularPico({ seg: 60, impulso: false });
  assert.equal(sin.terminadas.length, 6);
});

test("el impulso hace una cosa por vez, primero las indicaciones de Cande, y nada con el agente apagado o la Mac sin escuchar", async () => {
  const hechos = [];
  const armar = ({ aj = { modo: "auto", cerebro: "local" }, charlasDeIndicacion = 0 } = {}) => crearImpulsoDeLaEspera({
    ajustes: async () => aj,
    filas: async () => { hechos.push("filas"); return [{ id: "1", ultimo_id_lead: 1, fallos: 0 }, { id: "2", ultimo_id_lead: 2, fallos: 0 }]; },
    reclamar: async (id) => { hechos.push(["reclamar", id]); return { tomada: true, lleno: false }; },
    soltar: async (id) => { hechos.push(["soltar", id]); },
    procesar: async (id, idLead) => { hechos.push(["procesar", id, idLead]); return { hecho: "enviada" }; },
    indicaciones: async (o) => { hechos.push(["indicaciones", o.conMac, o.tope]); return { charlas: charlasDeIndicacion }; },
    ahora: () => AHORA,
  });
  // Con una indicación esperando: esa y nada más.
  assert.deepEqual(await armar({ charlasDeIndicacion: 1 })({ escucha: async () => true }), { hecho: "indicacion" });
  assert.deepEqual(hechos.splice(0), [["indicaciones", true, 1]]);
  // Sin indicaciones: la charla más vieja, una sola, y se suelta.
  assert.deepEqual(await armar()({ escucha: async () => true }), { hecho: "contestó", resultado: "enviada" });
  assert.deepEqual(hechos.splice(0), [["indicaciones", true, 1], "filas", ["reclamar", "1"], ["procesar", "1", 1], ["soltar", "1"]]);
  // La Mac sin escuchar: las indicaciones solo vencen (conMac en false) y no se toca ninguna charla.
  assert.deepEqual(await armar()({ escucha: async () => false }), { hecho: "sin Mac" });
  assert.deepEqual(hechos.splice(0), [["indicaciones", false, 1]]);
  // Apagado: las indicaciones sí (el agente contesta "apagado" y se le dice), las charlas no.
  assert.deepEqual(await armar({ aj: { modo: "apagado", cerebro: "local" } })({ escucha: async () => false }), { hecho: "apagado" });
  assert.deepEqual(hechos.splice(0), [["indicaciones", true, 1]]);
  // Con el cerebro de la API no hace falta la Mac.
  assert.equal((await armar({ aj: { modo: "auto", cerebro: "api" } })({ escucha: async () => false })).hecho, "contestó");
});

test("el impulso no insiste con el modelo caído: tras una falla general espera a la vuelta siguiente; tras una de esa charla, sigue", async () => {
  let ahora = AHORA;
  let resultado = { hecho: "error del modelo", general: true, transitorio: true };
  const procesadas = [];
  const impulsar = crearImpulsoDeLaEspera({
    ajustes: async () => ({ modo: "auto", cerebro: "local" }),
    filas: async () => [{ id: String(procesadas.length + 1), ultimo_id_lead: 1, fallos: 0 }],
    reclamar: async () => ({ tomada: true, lleno: false }),
    soltar: async () => {},
    procesar: async (id) => { procesadas.push(id); return resultado; },
    ahora: () => ahora,
  });
  const escucha = async () => true;
  assert.equal((await impulsar({ escucha })).hecho, "contestó");
  // Con el Claude de la Mac sin uso, cada pregunta arrancaría otro intento fallido y la Mac no se dormía nunca.
  for (const mas of [IMPULSO_CADA_MS, MIN, 7 * MIN]) {
    ahora = AHORA + mas;
    assert.equal((await impulsar({ escucha })).hecho, "pronto", `a los ${mas / S} s`);
  }
  assert.equal(procesadas.length, 1);
  ahora = proximaVuelta(AHORA);
  assert.equal(ahora, Date.parse("2026-10-21T06:15:00Z"));
  resultado = { hecho: "error del modelo", general: false };
  assert.equal((await impulsar({ escucha })).hecho, "contestó", "en la vuelta siguiente vuelve a probar");
  ahora += IMPULSO_CADA_MS;
  assert.equal((await impulsar({ escucha })).hecho, "contestó", "una falla de esa charla no frena a las demás");
  assert.equal(procesadas.length, 3);
  // Y una misma instancia mira como mucho cada IMPULSO_CADA_MS.
  ahora += 1000;
  assert.equal((await impulsar({ escucha })).hecho, "pronto");
});

test("/api/dm/trabajos: si la Mac pregunta y no hay trabajo, el sitio mira la espera de fondo; con sus lugares llenos (latido), no", async () => {
  const { default: handler, config } = await import("../pages/api/dm/trabajos.js");
  assert.equal(config.maxDuration, 300, "el impulso sigue de fondo: una respuesta tarda hasta unos 140 segundos");
  const consultas = [];
  pg.otras = (t, params) => {
    consultas.push(t);
    if (t === "SELECT valor FROM dm_config WHERE clave = ?") {
      return { rows: params[0] === "ajustes" ? [{ valor: { modo: "auto" } }] : [] };
    }
    if (/^(CREATE|ALTER|INSERT INTO dm_config|UPDATE|DELETE)/.test(t)) return { rows: [] };
    if (t.startsWith("SELECT c.id, c.nombre")) return { rows: [] };
    return undefined;
  };
  process.env.POSTGRES_URL = "postgres://de-prueba";
  process.env.COLA_SECRET = "secreto-de-prueba";
  try {
    const llamar = async (body) => {
      const res = respuesta();
      await handler({ method: "POST", headers: { authorization: "Bearer secreto-de-prueba" }, body }, res);
      return res;
    };
    const esperarFondo = async () => { for (let i = 0; i < 40; i++) await new Promise((r) => setImmediate(r)); };
    const l = await llamar({ accion: "latido", hasta: Date.now() + 90 * S });
    assert.deepEqual(l.cuerpo, { ok: true });
    await esperarFondo();
    assert.ok(!consultas.some((t) => t.startsWith("SELECT c.id, c.nombre")), "con sus lugares llenos no se arranca nada");
    const t = await llamar({ accion: "tomar", hasta: Date.now() + 90 * S });
    assert.deepEqual(t.cuerpo, { trabajo: null }, "le contesta a la Mac sin esperar al impulso");
    await esperarFondo();
    assert.ok(consultas.some((q) => q.startsWith("DELETE FROM dm_indicaciones WHERE contacto = (")), "miró las indicaciones de Cande");
    assert.ok(consultas.some((q) => q.startsWith("SELECT c.id, c.nombre")), "y después las charlas en espera");
  } finally {
    pg.otras = null;
    delete process.env.POSTGRES_URL;
    delete process.env.COLA_SECRET;
  }
});

test("la vuelta del cron de la espera: las indicaciones de Cande van a la par de las charlas, no antes", async () => {
  const reloj = relojDePrueba();
  const pasos = [];
  const vuelta = vueltaDeLaEspera({
    prendido: true, macViva: true,
    indicaciones: async ({ conMac }) => {
      pasos.push(["indicaciones", conMac, reloj.ahora()]);
      await reloj.dormir(100 * S); // dos indicaciones de 50 segundos
      return { hechas: 2, vencidas: 0, devueltas: 0, viejas: 0, charlas: 2 };
    },
    contestar: async () => { pasos.push(["charlas", reloj.ahora()]); await reloj.dormir(150 * S); return { reintentos: 6, cayo: false }; },
  });
  await reloj.avanzar(10 * MIN);
  const { ind, r, motivo } = await vuelta;
  assert.deepEqual(pasos, [["indicaciones", true, 0], ["charlas", 0]], "las charlas arrancan en el segundo 0, no a los 100");
  assert.equal(ind.hechas, 2);
  assert.equal(r.reintentos, 6);
  assert.equal(motivo, null);
  // Sin la Mac o con el agente apagado, solo las indicaciones (que vencen, o contestan "apagado").
  for (const [prendido, macViva, conMac, esperado] of [[true, false, false, "sin Mac"], [false, true, true, "apagado"]]) {
    const vistos = [];
    const v = await vueltaDeLaEspera({
      prendido, macViva,
      indicaciones: async (o) => { vistos.push(o.conMac); return { hechas: 0, vencidas: 1, devueltas: 0, viejas: 0, charlas: 0 }; },
      contestar: async () => { throw new Error("no se contestan charlas"); },
    });
    assert.deepEqual(vistos, [conMac]);
    assert.equal(v.motivo, esperado);
    assert.equal(v.ind.vencidas, 1);
  }
  // Si una de las dos corridas falla, la otra sigue.
  const registrados = [];
  const v = await vueltaDeLaEspera({
    prendido: true, macViva: true, registrar: (que) => registrados.push(que),
    indicaciones: async () => { throw new Error("la base falló justo"); },
    contestar: async () => ({ reintentos: 3, cayo: false }),
  });
  assert.equal(v.r.reintentos, 3);
  assert.deepEqual(registrados, ["indicaciones"]);
});

/* ---------- las indicaciones guardadas que ya no corresponden ---------- */

function pendientes({ fila = [], cuenta = {}, resultados = [], alProcesar = () => {} } = {}) {
  const hechos = [];
  const dichos = [];
  const esperas = [];
  const cola = [...fila];
  const fakeBase = {
    vencerIndicaciones: async () => [],
    tomarIndicaciones: async () => {
      const c = cola[0]?.contacto;
      const lote = cola.filter((i) => i.contacto === c);
      for (const i of lote) cola.splice(cola.indexOf(i), 1);
      return lote;
    },
    guardarIndicacion: async (i) => { hechos.push(["devolver", i.contacto, i.texto]); },
    contacto: async (id) => ({ id, nombre: `Lead ${id}`, dueno: "agente" }),
    ultimoDeLaCuenta: async (id) => cuenta[id] || null,
  };
  const agente = {
    procesar: async (id, idDisparo, o) => {
      hechos.push(["procesar", id, o.indicacion]);
      alProcesar(id, cuenta);
      return resultados.shift() || { hecho: "enviada", enviado: ["Mensaje de prueba"] };
    },
  };
  const correr = crearIndicacionesPendientes({
    base: fakeBase, agente, decir: async (t) => dichos.push(t), ahora: () => AHORA, esperar: async (ms) => { esperas.push(ms); },
  });
  return { hechos, dichos, esperas, cola, correr };
}
const ind = (contacto, texto, minutos) => ({ contacto, texto, creado: new Date(AHORA - minutos * MIN), fecha_aviso: new Date(AHORA - (minutos + 1) * MIN) });

test("una indicación guardada no sale si después le escribió la cuenta (Cande con /textual o a mano, o el agente): se le dice a Cande", async () => {
  // La revisión: Cande pide "decile que mañana lo llamo" (se guarda para las 14:15) y a las 14:04 manda "/textual
  // Mañana te llamo!". A las 14:15 el agente le volvía a escribir lo mismo con su voz.
  const p = pendientes({
    fila: [ind("1", "decile algo de prueba", 10), ind("2", "otra cosa de prueba", 8)],
    cuenta: { 1: { quien: "cande", creado: new Date(AHORA - 6 * MIN) }, 2: { quien: "agente", creado: new Date(AHORA - 2 * MIN) } },
  });
  assert.deepEqual(await p.correr({ hasta: Infinity }), { hechas: 0, vencidas: 0, devueltas: 0, viejas: 2, charlas: 2 });
  assert.deepEqual(p.hechos, [], "no se le pide nada al agente");
  assert.match(p.dichos[0], /^No le escribí a Lead 1 lo que me pediste \(«decile algo de prueba»\): después le escribiste vos/);
  assert.match(p.dichos[1], /^No le escribí a Lead 2 lo que me pediste \(«otra cosa de prueba»\): después el agente le contestó otra cosa/);
  for (const d of p.dichos) assert.doesNotMatch(d, /[¿¡—]/);
});

test("si respondió el mismo aviso dos veces, las dos van en un solo turno del agente; lo de antes de un mensaje de la cuenta, no", async () => {
  const p = pendientes({ fila: [ind("1", "primera de prueba", 12), ind("2", "de otra charla", 11), ind("1", "segunda de prueba", 4)] });
  assert.deepEqual(await p.correr({ hasta: Infinity }), { hechas: 2, vencidas: 0, devueltas: 0, viejas: 0, charlas: 2 });
  assert.deepEqual(p.hechos, [["procesar", "1", "primera de prueba\nsegunda de prueba"], ["procesar", "2", "de otra charla"]]);
  // Le escribió la cuenta entre una y otra: sale solo la que pidió después.
  const q = pendientes({ fila: [ind("1", "vieja de prueba", 12), ind("1", "nueva de prueba", 4)], cuenta: { 1: { quien: "cande", creado: new Date(AHORA - 8 * MIN) } } });
  assert.deepEqual(await q.correr({ hasta: Infinity }), { hechas: 1, vencidas: 0, devueltas: 0, viejas: 1, charlas: 1 });
  assert.deepEqual(q.hechos, [["procesar", "1", "nueva de prueba"]]);
  assert.match(q.dichos[0], /«vieja de prueba»/);
  assert.match(q.dichos[1], /^✓ Le mandé a Lead 1/);
});

test("si otra corrida tenía la charla, la indicación se vuelve a probar en un rato, mirando de nuevo si ya no corresponde", async () => {
  const otra = { hecho: "otra corrida lo tiene" };
  const p = pendientes({ fila: [ind("1", "decile algo de prueba", 5)], resultados: [otra, otra] });
  assert.equal((await p.correr({ hasta: Infinity })).hechas, 1);
  assert.equal(p.hechos.length, 3, "al tercer intento salió");
  assert.deepEqual(p.esperas, [OTRA_CORRIDA_ESPERA_MS, OTRA_CORRIDA_ESPERA_MS]);
  // Si mientras tanto el agente le contestó al lead (la otra corrida era la espera), ya no sale.
  const q = pendientes({
    fila: [ind("1", "decile algo de prueba", 5)], resultados: [otra],
    alProcesar: (id, cuenta) => { cuenta[id] = { quien: "agente", creado: new Date(AHORA) }; },
  });
  assert.deepEqual(await q.correr({ hasta: Infinity }), { hechas: 0, vencidas: 0, devueltas: 0, viejas: 1, charlas: 1 });
  assert.equal(q.hechos.length, 1);
  assert.match(q.dichos[0], /el agente le contestó otra cosa/);
  // Si sigue tomada, vuelve a la fila para la vuelta siguiente, sin decirle nada.
  const r = pendientes({ fila: [ind("1", "decile algo de prueba", 5)], resultados: Array(OTRA_CORRIDA_VUELTAS + 1).fill(otra) });
  assert.deepEqual(await r.correr({ hasta: Infinity }), { hechas: 0, vencidas: 0, devueltas: 1, viejas: 0, charlas: 1 });
  assert.deepEqual(r.hechos.at(-1), ["devolver", "1", "decile algo de prueba"]);
  assert.deepEqual(r.dichos, []);
  // El impulso pide de a una charla.
  const s = pendientes({ fila: [ind("1", "una de prueba", 5), ind("2", "otra de prueba", 4)] });
  assert.equal((await s.correr({ hasta: Infinity, tope: 1 })).charlas, 1);
  assert.equal(s.cola.length, 1);
});

function telegram({ guardadas = [] } = {}) {
  const hechos = [];
  const dichos = [];
  const fakeBase = {
    reclamarNovedad: async () => true,
    contacto: async (id) => ({ id, nombre: "Lead De Prueba", dueno: "agente" }),
    borrarIndicaciones: async (id) => { hechos.push(["borrarIndicaciones", id]); return guardadas.splice(0); },
    anotarDeCande: async () => {},
    descartarPendientes: async () => {},
    ponerDueno: async (id, d) => { hechos.push(["dueno", d]); },
  };
  const manychat = { mandarTextos: async () => ({ ok: true }), ponerCampo: async () => ({ ok: true }) };
  const responder = crearRespuestaTelegram({ base: fakeBase, manychat, decir: async (t) => dichos.push(t), agente: { procesar: async () => ({}) } });
  return { hechos, dichos, responder };
}

test("/textual o quedarse con la charla sacan lo que Cande había pedido para la vuelta, y se lo dice", async () => {
  const t = telegram({ guardadas: ["decile que mañana lo llamo de prueba"] });
  assert.equal(await t.responder({ contacto: "123456789", accion: "mandar", texto: "Mañana te llamo de prueba", fechaAviso: new Date(AHORA) }, { updateId: 1 }), "mandado");
  assert.deepEqual(t.hechos, [["borrarIndicaciones", "123456789"]]);
  assert.match(t.dichos[0], /^✓ Mandado a Lead De Prueba\nLo que me habías pedido para la vuelta \(«decile que mañana lo llamo de prueba»\) ya no sale\.$/);
  const c = telegram({ guardadas: ["otra cosa de prueba"] });
  assert.equal(await c.responder({ contacto: "123456789", accion: "cande" }, { updateId: 2 }), "cande");
  assert.match(c.dichos[0], /queda tuyo/);
  assert.match(c.dichos[0], /«otra cosa de prueba»\) ya no sale\./);
  // Sin nada guardado, el mensaje de siempre.
  const n = telegram();
  await n.responder({ contacto: "123456789", accion: "mandar", texto: "Hola de prueba", fechaAviso: new Date(AHORA) }, { updateId: 3 });
  assert.equal(n.dichos[0], "✓ Mandado a Lead De Prueba");
});

/* ---------- las fotos que quedan para la vuelta ---------- */

test("el cron de los toques no manda como URGENTE una foto que quedó para la vuelta mientras la Mac escucha, y pasados 20 minutos sí", async () => {
  const consultas = [];
  pg.otras = (t, params) => {
    if (t.startsWith("SELECT c.id FROM dm_contactos c WHERE c.ultimo_lead > NOW() - INTERVAL '24 hours'")) {
      consultas.push({ t, params });
      return { rows: [] };
    }
    return undefined;
  };
  process.env.POSTGRES_URL = "postgres://de-prueba";
  try {
    await base.fotosSinAviso({ conMac: true });
    await base.fotosSinAviso();
  } finally {
    pg.otras = null;
    delete process.env.POSTGRES_URL;
  }
  assert.equal(consultas.length, 2);
  const [con, sin] = consultas;
  assert.match(con.t, /AND NOT \(\?::boolean AND m\.creado > \?::timestamptz AND EXISTS \( SELECT 1 FROM dm_salidas g WHERE g\.contacto = c\.id AND g\.accion IN \('error', 'reintento'\) AND g\.estado = 'error' AND g\.motivo = \? AND g\.creado >= m\.creado\)\)\)/);
  assert.deepEqual([con.params[0], con.params[2]], [true, FALLA_GENERAL]);
  assert.ok(Math.abs(Date.now() - base.FOTO_A_LA_VUELTA_MS - Date.parse(con.params[1])) < 5000, "las de menos de 20 minutos");
  assert.equal(base.FOTO_A_LA_VUELTA_MS, CADA_CRON_MS + 5 * MIN);
  assert.equal(sin.params[0], false, "sin la Mac escuchando, como siempre");
  const toques = await (await import("node:fs/promises")).readFile(new URL("../pages/api/dm/toques.js", import.meta.url), "utf8");
  assert.match(toques, /fotosSinAviso\(\{ conMac: macViva \}\)/);
});

test("la foto queda para la vuelta solo con el cerebro de la Mac y la Mac prendida", async () => {
  assert.equal(await macParaFotos({ cerebro: "local" }, { encendida: async () => true }), true);
  assert.equal(await macParaFotos({ cerebro: "local" }, { encendida: async () => false }), false);
  assert.equal(await macParaFotos({ cerebro: "api" }, { encendida: async () => true }), false, "la API no mira fotos: URGENTE ya");
});

/* ---------- la entrada dice si ManyChat tiene que pasar a retirar ---------- */

test("recoger: ManyChat pasa a retirar solo si hay una respuesta en camino (envío por campo, en auto, con quien la redacte)", async () => {
  const margenes = [];
  const escucha = (si) => async (m) => { margenes.push(m); return si; };
  const aj = { modo: "auto", envio: "campo", cerebro: "local", espera_ms: 8000 };
  assert.equal(await recogerDespues(aj, { escuchando: escucha(true) }), true);
  assert.deepEqual(margenes, [MARGEN_MS.pedir + 8000], "la Mac tiene que seguir escuchando pasada la ráfaga");
  assert.equal(await recogerDespues(aj, { escuchando: escucha(false) }), false, "la Mac sin escuchar: el turno queda para la vuelta");
  assert.equal(await recogerDespues({ ...aj, cerebro: "api" }, { escuchando: escucha(false) }), true);
  assert.equal(await recogerDespues({ ...aj, envio: "api" }, { escuchando: escucha(true) }), false, "por la API sale sola");
  assert.equal(await recogerDespues({ ...aj, modo: "sombra" }, { escuchando: escucha(true) }), false, "en sombra no se retira nada");
  assert.equal(await recogerDespues({ ...aj, modo: "apagado" }, { escuchando: escucha(true) }), false);
});

test("la entrada contesta 'recoger' con lo que dice recogerDespues, y 'no' si el mensaje no quedó para el agente", async () => {
  const src = await (await import("node:fs/promises")).readFile(new URL("../pages/api/dm/entrada.js", import.meta.url), "utf8");
  assert.match(src, /recoger = await recogerDespues\(await ajustes\(\)\)/);
  assert.match(src, /dueno: c\?\.dueno === "agente" \? "agente" : "cande", recoger: "no" \}/);
  assert.match(src, /dueno: "agente", recoger: recoger \? "si" : "no" \}/);
  // Si no se puede saber, que venga: así andaba siempre.
  assert.match(src, /let recoger = true;/);
});
