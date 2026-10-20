// La red de la bandeja (lib/dm/bandeja.js, 20/10): que no quede ninguna charla sin contestar aunque el webhook de
// ManyChat no llegue. Con un Instagram, una base y un ManyChat de mentira: ninguna prueba sale a la red ni manda
// un mensaje. Los usuarios, ids, nombres y textos son inventados (este repo es público).
//
// Lo que NO cubren: las consultas de lib/dm/base.js (el doble de Postgres no las conoce). Antes de subir se
// prueban a mano contra un Postgres de verdad: que anotarDesdeBandeja guarde solo en charlas del agente, no repita
// un ig_mid, y si no guardó nada no toque ultimo_lead, los toques ni lo pendiente; que darDeAltaDesdeBandeja no toque
// a quien ya figura, respete el tope y deje contacto y mensajes juntos; que entroPorLaBandeja mire solo lo guardado
// por la red en las últimas 2 horas; y que el índice único de ig_mid se cree sobre la tabla con datos. Abajo hay
// una revisión del texto de esas consultas.
//
// Correr:  node --test tests/*.test.mjs
import { respuesta } from "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const {
  revisarBandeja, armarResumen, faltantes, sinRespuesta, identificar, haceCuanto, esConocida,
  GRACIA_MS, RESUMEN_CADA_MS, TITULO_RESUMEN, SECCION_VOS, SECCION_MANO, BUSQUEDAS_POR_VUELTA,
} = await import("../lib/dm/bandeja.js");
const { crearInstagram } = await import("../lib/dm/instagram.js");
const { crearAgente, SIN_TEXTO } = await import("../lib/dm/agente.js");

const MIN = 60000;
const HORA = 60 * MIN;
const AHORA = new Date("2026-10-20T15:00:00Z");
const hace = (min) => new Date(AHORA.getTime() - min * MIN);
const ISO = (d) => d.toISOString().replace(/\.\d{3}Z$/, "+0000");
const CUENTA = { id: "900", username: "cuenta.prueba" };

/** Una persona de Instagram: su id en la app de Cande y su usuario. */
const persona = (id, username) => ({ id, username });
const NUEVO = persona("601", "lead.nuevo");
const DEL_AGENTE = persona("501", "lead.agente");
const DE_CANDE = persona("701", "lead.cande");
const OTRO = persona("801", "lead.otro");

// Un automático de prueba que sale en varias charlas (la bienvenida): no es Cande escribiendo.
const AUTOMATICO = "Hola! Este es un mensaje fijo de prueba que sale solo a quien escribe por primera vez";

/**
 * Una charla como la devuelve Instagram. `lineas`: [quien, texto, hace cuántos minutos], de la más vieja a la más
 * nueva; quien es "cuenta" o "lead". Instagram las da al revés: de la más nueva a la más vieja.
 */
const charla = (n, p, lineas) => {
  const yo = { id: CUENTA.id, username: CUENTA.username };
  const data = lineas.map(([quien, texto, min], i) => ({
    id: `m${n}-${i}`, created_time: ISO(hace(min)), from: quien === "cuenta" ? yo : p, to: { data: [quien === "cuenta" ? p : yo] }, message: texto,
  })).reverse();
  return { id: `h${n}`, updated_time: ISO(hace(Math.min(...lineas.map((l) => l[2])))), messages: { data } };
};

/**
 * El mundo de mentira. `contactos` y `mensajes` son la base; `hilos`, la bandeja de Instagram; `perfiles`, lo que da
 * Instagram de cada persona; `directorio`, los contactos de ManyChat.
 */
function mundo({
  contactos = [], mensajes = [], hilos = [], perfiles = {}, directorio = [], aj = {}, seguidos = [], config = {}, conUsuarioEnBusqueda = true,
} = {}) {
  const w = {
    ahora: AHORA, hilos, perfiles, directorio, conUsuarioEnBusqueda, mcCaido: false, altasHoy: 0,
    contactos: new Map(contactos.map((c) => [c.id, { dueno: "agente", ig_id: null, ig_usuario: null, toques: 0, proximo_toque: null, ...c }])),
    mensajes: mensajes.map((m, i) => ({ id: i + 1, ig_mid: null, creado: AHORA, ...m })),
    config: { ...config }, seguidos: new Set(seguidos), tomado: new Map(), avisos: [], busquedas: [], pedidosDatos: 0, pedidosIg: [],
    aj: { modo: "auto", altas: true, altas_por_dia: 25, contexto_alta: "", seguidos: false, ...aj },
  };
  const copia = (c) => (c ? { ...c } : null);
  w.base = {
    leerConfig: async (k) => (w.config[k] === undefined ? null : JSON.parse(JSON.stringify(w.config[k]))),
    guardarConfig: async (k, v) => { w.config[k] = JSON.parse(JSON.stringify(v)); },
    // Como la consulta: por el id de Instagram, o por el usuario si todavía no tiene id.
    contactoDeIg: async ({ igId, usuario }) => {
      const l = [...w.contactos.values()];
      return copia(l.find((c) => igId && c.ig_id === igId) || l.find((c) => usuario && c.ig_usuario === usuario && !c.ig_id));
    },
    contacto: async (id) => copia(w.contactos.get(id)),
    guardarIg: async (id, { usuario = null, igId = null } = {}) => {
      const c = w.contactos.get(id);
      if (!c) return;
      if (usuario !== null) c.ig_usuario = usuario;
      if (igId !== null) c.ig_id = igId;
    },
    loSigue: async (u) => w.seguidos.has(u),
    textosDeLaCuenta: async (id) => [
      ...w.mensajes.filter((m) => m.contacto === id && ["agente", "cande", "automatico"].includes(m.quien)).map((m) => m.texto),
      ...(w.config.automaticos?.textos || []),
    ],
    leadsGuardados: async (id) => w.mensajes.filter((m) => m.contacto === id && m.quien === "lead").map((m) => ({ ...m })),
    fueDelAgente: async (id) => w.mensajes.some((m) => m.contacto === id && m.quien === "lead"),
    tomar: async (id, marca) => {
      const c = w.contactos.get(id);
      if (!c || c.dueno !== "agente" || w.tomado.has(id)) return null;
      w.tomado.set(id, marca);
      return copia(c);
    },
    soltar: async (id, marca) => { if (w.tomado.get(id) === marca) w.tomado.delete(id); },
    anotarDesdeBandeja: async (id, lista) => {
      const c = w.contactos.get(id);
      if (!c || c.dueno !== "agente") return 0;
      let n = 0;
      for (const m of lista) {
        if (w.mensajes.some((x) => x.ig_mid === m.mid)) continue;
        w.mensajes.push({ id: w.mensajes.length + 1, contacto: id, quien: "lead", texto: m.texto, creado: new Date(m.creado), ig_mid: m.mid });
        c.ultimo_lead = new Date(Math.max(c.ultimo_lead ? c.ultimo_lead.getTime() : 0, new Date(m.creado).getTime()));
        n++;
      }
      if (n) Object.assign(c, { toques: 0, proximo_toque: null });
      return n;
    },
    darDeAltaDesdeBandeja: async (id, { nombre, mensajes: lista, contexto, tope, igId, usuario }) => {
      if (w.contactos.has(id) || w.altasHoy >= tope) return 0;
      w.altasHoy++;
      w.contactos.set(id, {
        id, nombre, dueno: "agente", contexto: contexto || null, alta_en: w.ahora, alta_avisada: false, ig_id: igId, ig_usuario: usuario,
        ultimo_lead: new Date(Math.max(...lista.map((m) => new Date(m.creado).getTime()))), respondido_hasta: 0, toques: 0, proximo_toque: null,
      });
      for (const m of lista) w.mensajes.push({ id: w.mensajes.length + 1, contacto: id, quien: "lead", texto: m.texto, creado: new Date(m.creado), ig_mid: m.mid });
      return lista.length;
    },
    entroPorLaBandeja: async (id, textos) => w.mensajes.some((m) =>
      m.contacto === id && m.quien === "lead" && m.ig_mid && w.ahora - m.creado < 2 * HORA && textos.includes(m.texto)),
  };
  w.manychat = {
    hayManyChat: () => true,
    buscarPorNombre: async (n) => {
      w.busquedas.push(n);
      if (w.mcCaido) return { ok: false, error: "ManyChat de prueba caído" };
      const hallados = w.directorio.filter((d) => d.nombre.toLowerCase().includes(n.toLowerCase()));
      return { ok: true, contactos: hallados.map((d) => ({ id: d.id, nombre: d.nombre, ig_username: w.conUsuarioEnBusqueda ? d.ig_username : null, ig_id: null })) };
    },
    datosDe: async (id) => {
      w.pedidosDatos++;
      const d = w.directorio.find((x) => x.id === id);
      return d ? { ok: true, ig_username: d.ig_username, ig_id: d.ig_id ?? null } : { ok: false, error: "no existe" };
    },
  };
  // Instagram de mentira, con el cliente de verdad (lib/dm/instagram.js).
  const pedir = async (url) => {
    const u = new URL(url);
    const ruta = u.pathname.replace(/^\/v\d+\.\d+/, "");
    w.pedidosIg.push(ruta);
    let r;
    if (ruta === "/me") r = { user_id: CUENTA.id, username: CUENTA.username };
    else if (ruta === "/me/conversations") r = { data: [...w.hilos].sort((a, b) => b.updated_time.localeCompare(a.updated_time)) };
    else if (w.perfiles[ruta.slice(1)]) r = w.perfiles[ruta.slice(1)];
    else r = { error: { message: `ruta de prueba desconocida ${ruta}`, code: 100 } };
    return { ok: !r.error, status: r.error ? 400 : 200, json: async () => r };
  };
  const cfgIg = {};
  w.ig = crearInstagram({ pedir, leerConfig: async (k) => cfgIg[k] ?? null, guardarConfig: async (k, v) => { cfgIg[k] = v; }, tokenEnv: () => "t" });
  w.avisar = async (titulo, campos, opciones) => { w.avisos.push({ titulo, campos, opciones }); return true; };
  w.revisar = (extra = {}) => revisarBandeja({ ig: w.ig, base: w.base, manychat: w.manychat, aj: w.aj, avisar: w.avisar, ahora: () => w.ahora, ...extra });
  w.delContacto = (id) => w.mensajes.filter((m) => m.contacto === id);
  return w;
}

/** El perfil de Instagram de una persona: su nombre, su usuario y si Cande la sigue. */
const perfil = (nombre, username, sigue = false) => ({ name: nombre, username, is_business_follow_user: sigue });

/** La charla de bienvenida de otra persona: así el automático sale en dos charlas y se reconoce como automático. */
const otraConElAutomatico = () => charla(9, OTRO, [["cuenta", AUTOMATICO, 300], ["lead", "gracias, de prueba", 290], ["cuenta", "Respuesta de prueba que ya salió", 289]]);

/* ---------- 1. alguien nuevo que nunca entró ---------- */

test("un lead nuevo que escribió y nunca entró: se lo encuentra en ManyChat y entra como alta con sus mensajes, para que lo conteste la espera", async () => {
  const w = mundo({
    hilos: [charla(1, NUEVO, [["cuenta", AUTOMATICO, 30], ["lead", "hola, consulta de prueba", 12], ["lead", "sigo por acá", 11]]), otraConElAutomatico()],
    perfiles: { 601: perfil("Nombre Nuevo", "lead.nuevo") },
    directorio: [{ id: "5001", nombre: "Nombre Nuevo", ig_username: "lead.nuevo" }, { id: "5002", nombre: "Nombre Nuevo Otro", ig_username: "otra.cuenta" }],
    aj: { contexto_alta: "contexto de prueba" },
  });
  const r = await w.revisar();
  assert.equal(r.altas, 1);
  const c = w.contactos.get("5001");
  assert.equal(c.dueno, "agente");
  assert.equal(c.alta_avisada, false, "como cualquier alta: el modelo dice si es un lead (o una charla personal)");
  assert.equal(c.ig_id, "601");
  assert.equal(c.ig_usuario, "lead.nuevo");
  assert.equal(c.contexto, "contexto de prueba");
  assert.equal(c.nombre, "Nombre Nuevo");
  const guardados = w.delContacto("5001");
  assert.deepEqual(guardados.map((m) => m.texto), ["hola, consulta de prueba", "sigo por acá"], "los dos, en el orden en que los escribió");
  assert.deepEqual(guardados.map((m) => m.creado), [hace(12), hace(11)], "con la hora en que los escribió, no la de ahora");
  assert.ok(guardados.every((m) => m.ig_mid), "cada uno con su id de Instagram");
  assert.deepEqual(c.ultimo_lead, hace(11), "la ventana de 24 horas cuenta desde lo último que escribió");
  assert.equal(w.contactos.has("5002"), false);
  assert.equal(w.avisos.length, 0, "un alta no le avisa a Cande: lo atiende el agente");

  // La vuelta siguiente ya lo reconoce por su Instagram: no lo busca ni lo guarda otra vez.
  const busquedas = w.busquedas.length;
  const r2 = await w.revisar();
  assert.deepEqual({ altas: r2.altas, recuperados: r2.recuperados }, { altas: 0, recuperados: 0 });
  assert.equal(w.delContacto("5001").length, 2);
  assert.equal(w.busquedas.length, busquedas);
});

test("si ManyChat no trae el usuario en la búsqueda, se lo pide a cada uno y vale solo el de esa cuenta de Instagram", async () => {
  const w = mundo({
    hilos: [charla(1, NUEVO, [["lead", "hola de prueba", 10]])],
    perfiles: { 601: perfil("Nombre Repetido", "lead.nuevo") },
    directorio: [{ id: "5003", nombre: "Nombre Repetido", ig_username: "otra.persona" }, { id: "5004", nombre: "Nombre Repetido", ig_username: "Lead.Nuevo" }],
    conUsuarioEnBusqueda: false,
  });
  assert.equal((await w.revisar()).altas, 1);
  assert.ok(w.contactos.has("5004"));
  assert.equal(w.contactos.has("5003"), false);
  assert.equal(w.pedidosDatos, 2);
});

test("un automático con el nombre de la persona adentro sigue siendo un automático: el agente toma la charla", async () => {
  const conNombre = (n) => `Hola ${n}! Gracias por escribir, este mensaje fijo de prueba sale solo con tu nombre`;
  const w = mundo({
    hilos: [
      charla(1, NUEVO, [["cuenta", conNombre("Nombre"), 30], ["lead", "hola de prueba", 10]]),
      charla(2, OTRO, [["cuenta", conNombre("Otronombre"), 300], ["lead", "ok de prueba", 290], ["cuenta", "Respuesta de prueba que ya salió", 289]]),
    ],
    perfiles: { 601: perfil("Nombre", "lead.nuevo") },
    directorio: [{ id: "5001", nombre: "Nombre", ig_username: "lead.nuevo" }],
  });
  assert.equal((await w.revisar()).altas, 1);
});

/* ---------- 2. un mensaje perdido de una charla del agente ---------- */

test("un mensaje del lead que no llegó a una charla del agente se guarda con su hora y el turno queda abierto para la espera", async () => {
  const w = mundo({
    contactos: [{ id: "77", nombre: "Lead del agente", ig_id: "501", ig_usuario: "lead.agente", respondido_hasta: 1, toques: 1, proximo_toque: hace(-60), ultimo_lead: hace(60), dueno_desde: hace(600) }],
    mensajes: [
      { contacto: "77", quien: "lead", texto: "primero de prueba", creado: hace(60) },
      { contacto: "77", quien: "agente", texto: "Respuesta del agente de prueba", creado: hace(59) },
    ],
    hilos: [charla(1, DEL_AGENTE, [["lead", "primero de prueba", 60], ["cuenta", "Respuesta del agente de prueba", 59], ["lead", "segundo de prueba", 8]])],
  });
  const r = await w.revisar();
  assert.equal(r.recuperados, 1);
  const nuevo = w.delContacto("77").at(-1);
  assert.deepEqual({ quien: nuevo.quien, texto: nuevo.texto, creado: nuevo.creado }, { quien: "lead", texto: "segundo de prueba", creado: hace(8) });
  assert.ok(nuevo.ig_mid);
  const c = w.contactos.get("77");
  assert.ok(nuevo.id > c.respondido_hasta, "el turno queda abierto: lo contesta la espera");
  assert.deepEqual(c.ultimo_lead, hace(8));
  assert.deepEqual({ toques: c.toques, proximo_toque: c.proximo_toque }, { toques: 0, proximo_toque: null }, "como cualquier mensaje: los seguimientos vuelven a cero");
  assert.equal(w.tomado.size, 0, "la traba quedó suelta");
  assert.equal(w.avisos.length, 0);
  // La vuelta siguiente no lo guarda de nuevo.
  assert.equal((await w.revisar()).recuperados, 0);
  assert.equal(w.delContacto("77").length, 3);
});

test("lo que ya entró por la entrada no se guarda de nuevo: por texto, o por la hora si ManyChat lo mandó un poco distinto", async () => {
  const base = (texto, segundos) => mundo({
    contactos: [{ id: "77", ig_id: "501", ig_usuario: "lead.agente", respondido_hasta: 0, ultimo_lead: hace(10) }],
    mensajes: [{ contacto: "77", quien: "lead", texto, creado: new Date(hace(10).getTime() + segundos * 1000) }],
    hilos: [charla(1, DEL_AGENTE, [["cuenta", "Algo que salió antes, de prueba", 30], ["lead", "Mensaje de Prueba ✅", 10]])],
  });
  const igual = base("mensaje de prueba", 4);
  assert.equal((await igual.revisar()).recuperados, 0, "el mismo texto, sin tildes ni signos, segundos después");
  const distinto = base("texto que ManyChat cambió", 30);
  assert.equal((await distinto.revisar()).recuperados, 0, "otro texto, pero entró 30 segundos después de que lo escribió");
  const viejo = base("mensaje de prueba", -25 * 60);
  assert.equal((await viejo.revisar()).recuperados, 1, "uno igual pero de antes de lo último de la cuenta es otro mensaje");
});

test("faltan solo los de después del último que está en la base: no se reabre lo que el agente ya atendió", () => {
  const p = (id, texto, min) => ({ id, texto, creado: hace(min), de: { id: "501" } });
  const pend = [p("a", "uno", 10), p("b", "dos", 9), p("c", "tres", 8)];
  assert.deepEqual(faltantes(pend, []).map((m) => m.id), ["a", "b", "c"]);
  assert.deepEqual(faltantes(pend, [{ id: 1, texto: "dos", creado: hace(9) }]).map((m) => m.id), ["c"], "el primero quedó antes de uno que está");
  assert.deepEqual(faltantes(pend, [{ id: 1, texto: "otro", creado: hace(30), ig_mid: "c" }]).map((m) => m.id), [], "el guardado por la red se reconoce por su id");
  assert.deepEqual(faltantes([p("f", "", 5)], [{ id: 1, texto: "https://lookaside.fbsbx.com/ig_messaging_cdn/?asset_id=1", creado: hace(4.9) }]), [], "una foto es la misma con o sin link");
});

/* ---------- 3. las charlas de Cande ---------- */

test("una charla de Cande no se toma: va al resumen, en 'pasadas a vos', con su link, hace cuánto y lo último que dijo", async () => {
  const w = mundo({
    contactos: [{ id: "70", nombre: "Lead de Cande", dueno: "cande", ig_id: "701", ig_usuario: "lead.cande" }],
    mensajes: [{ contacto: "70", quien: "lead", texto: "algo de antes, de prueba", creado: hace(300) }],
    hilos: [charla(1, DE_CANDE, [["cuenta", "Respuesta de prueba que ya salió", 120], ["lead", "una pregunta de prueba para vos", 40]])],
  });
  const r = await w.revisar();
  assert.deepEqual({ altas: r.altas, recuperados: r.recuperados, pendientes: r.pendientes, resumen: r.resumen }, { altas: 0, recuperados: 0, pendientes: 1, resumen: true });
  assert.equal(w.delContacto("70").length, 1, "no se guarda nada en una charla de Cande");
  assert.equal(w.tomado.size, 0);
  assert.equal(w.avisos.length, 1);
  const a = w.avisos[0];
  assert.equal(a.titulo, TITULO_RESUMEN);
  assert.equal(a.opciones.contestable, false);
  assert.match(a.campos[SECCION_VOS], /Lead de Cande, hace 40 min: «una pregunta de prueba para vos» https:\/\/ig\.me\/m\/lead\.cande/);
  assert.equal(a.campos[SECCION_MANO], null);
  assert.doesNotMatch(JSON.stringify(a.campos), /[—¿¡]/, "sin guion largo ni signos de apertura");
});

test("una charla personal (de Cande, sin nada del lead guardado) o de alguien que ella sigue no va a Telegram", async () => {
  const w = mundo({
    contactos: [{ id: "70", dueno: "cande", ig_id: "701", ig_usuario: "lead.cande" }, { id: "71", dueno: "cande", ig_id: "801", ig_usuario: "lead.otro" }],
    mensajes: [{ contacto: "71", quien: "lead", texto: "algo de antes, de prueba", creado: hace(300) }],
    hilos: [charla(1, DE_CANDE, [["lead", "mensaje personal de prueba", 40]]), charla(2, OTRO, [["lead", "otro mensaje de prueba", 50]])],
    aj: { seguidos: true }, seguidos: ["lead.otro"],
  });
  const r = await w.revisar();
  assert.equal(r.pendientes, 0);
  assert.equal(w.avisos.length, 0);
});

test("una charla de Cande que espera hace menos de 20 minutos todavía no se recuerda: recién le llegó el aviso de la charla", async () => {
  const w = mundo({
    contactos: [{ id: "70", nombre: "Lead de Cande", dueno: "cande", ig_id: "701" }],
    mensajes: [{ contacto: "70", quien: "lead", texto: "algo de antes, de prueba", creado: hace(300) }],
    hilos: [charla(1, DE_CANDE, [["lead", "recién escrito de prueba", 10]])],
  });
  assert.equal((await w.revisar()).pendientes, 0);
  assert.equal(w.avisos.length, 0);
});

/* ---------- 4. lo que pasó las 23 horas ---------- */

test("lo que esperó más de 23 horas va al resumen 'solo a mano', una sola vez; lo del agente que ya estaba en la base, no (lo avisa el cron de los toques)", async () => {
  const w = mundo({
    contactos: [
      { id: "77", nombre: "Lead del agente", ig_id: "501", ig_usuario: "lead.agente" },
      { id: "78", nombre: "Lead con mensaje guardado", ig_id: "502", ig_usuario: "lead.guardado" },
    ],
    mensajes: [{ contacto: "78", quien: "lead", texto: "ya guardado de prueba", creado: hace(30 * 60) }],
    hilos: [
      charla(1, DEL_AGENTE, [["lead", "perdido de prueba", 26 * 60]]),
      charla(2, persona("502", "lead.guardado"), [["lead", "ya guardado de prueba", 30 * 60]]),
      charla(3, NUEVO, [["lead", "nunca entró, de prueba", 40 * 60]]),
    ],
    perfiles: { 601: perfil("Nombre Nuevo", "lead.nuevo") },
    directorio: [{ id: "5001", nombre: "Nombre Nuevo", ig_username: "lead.nuevo" }],
  });
  const r = await w.revisar();
  assert.deepEqual({ altas: r.altas, recuperados: r.recuperados }, { altas: 0, recuperados: 0 }, "el agente ya no llega: no se guarda ni se da de alta");
  assert.equal(w.avisos.length, 1);
  const mano = w.avisos[0].campos[SECCION_MANO];
  assert.match(mano, /Lead del agente, hace 26 h \(el mensaje no le llegó al agente\)/);
  assert.match(mano, /Nombre Nuevo, hace 40 h \(nunca le llegó al agente\).*ig\.me\/m\/lead\.nuevo/);
  assert.doesNotMatch(mano, /Lead con mensaje guardado/);
  assert.ok(mano.indexOf("Nombre Nuevo") < mano.indexOf("Lead del agente"), "la que más esperó primero");

  // Cuatro horas después siguen sin respuesta: no se vuelven a avisar.
  w.ahora = new Date(AHORA.getTime() + 4 * HORA);
  await w.revisar();
  assert.equal(w.avisos.length, 1);
});

/* ---------- 5. nada que hacer ---------- */

test("nada que hacer: lo último es de la cuenta, o el lead escribió hace menos de 3 minutos (puede estar entrando por el webhook)", async () => {
  const w = mundo({
    contactos: [{ id: "77", ig_id: "501", ig_usuario: "lead.agente" }],
    hilos: [
      charla(1, DEL_AGENTE, [["lead", "hola de prueba", 20], ["cuenta", "Respuesta del agente de prueba", 19]]),
      charla(2, NUEVO, [["lead", "recién de prueba", GRACIA_MS / MIN - 1]]),
    ],
    perfiles: { 601: perfil("Nombre Nuevo", "lead.nuevo") },
    directorio: [{ id: "5001", nombre: "Nombre Nuevo", ig_username: "lead.nuevo" }],
  });
  const r = await w.revisar();
  assert.deepEqual(r, { miradas: 2, recuperados: 0, altas: 0, pendientes: 0, resumen: false });
  assert.equal(w.mensajes.length, 0);
  assert.equal(w.busquedas.length, 0, "ni se lo buscó en ManyChat");
  assert.equal(w.avisos.length, 0);
});

/* ---------- 6. nunca dos respuestas al mismo mensaje ---------- */

/** El agente de verdad (lib/dm/agente.js) con la base del mundo: para ver qué hace la entrada si el webhook llega después. */
function agenteDe(w) {
  const base = {
    ...w.base,
    ajustes: async () => w.aj,
    anotarLead: async (id, texto) => {
      const c = w.contactos.get(id);
      if (!c || c.dueno !== "agente") return null;
      const m = { id: w.mensajes.length + 1, contacto: id, quien: "lead", texto, creado: w.ahora, ig_mid: null };
      w.mensajes.push(m);
      c.ultimo_lead = w.ahora;
      return m.id;
    },
    lugarParaAlta: async (id) => (w.contactos.has(id) ? null : 0),
    darDeAlta: async () => null,
  };
  return crearAgente({ base, pedir: async () => { throw new Error("no se usa"); }, manychat: {}, avisar: async () => true });
}

test("si el webhook llega después de que la red guardó el mensaje, la entrada no lo guarda otra vez (no sale una segunda respuesta)", async () => {
  const w = mundo({
    hilos: [charla(1, NUEVO, [["lead", "hola de prueba", 10]]), charla(2, DEL_AGENTE, [["cuenta", "Respuesta del agente de prueba", 30], ["lead", "una foto", 9]])],
    contactos: [{ id: "77", ig_id: "501", ig_usuario: "lead.agente" }],
    perfiles: { 601: perfil("Nombre Nuevo", "lead.nuevo") },
    directorio: [{ id: "5001", nombre: "Nombre Nuevo", ig_username: "lead.nuevo" }],
  });
  w.hilos[1].messages.data[0].message = ""; // una foto: Instagram la da sin texto
  const r = await w.revisar();
  assert.deepEqual({ altas: r.altas, recuperados: r.recuperados }, { altas: 1, recuperados: 1 });
  assert.equal(w.delContacto("77").at(-1).texto, SIN_TEXTO);

  const agente = agenteDe(w);
  w.ahora = new Date(AHORA.getTime() + 20 * MIN); // ManyChat se acordó tarde
  assert.equal(await agente.recibir("5001", "hola de prueba", "Nombre Nuevo"), null);
  assert.equal(await agente.recibir("77", "https://lookaside.fbsbx.com/ig_messaging_cdn/?asset_id=1"), null, "la foto con link es la misma que guardó la red sin texto");
  assert.equal(w.delContacto("5001").length, 1);
  assert.equal(w.delContacto("77").length, 1);
  // Lo que escribe después sí entra.
  assert.ok(await agente.recibir("5001", "otro mensaje de prueba"));
  assert.equal(w.delContacto("5001").length, 2);
});

test("si el mensaje entró por la entrada mientras tanto, la red no lo guarda: lo reconoce y no hay alta", async () => {
  const w = mundo({
    hilos: [charla(1, NUEVO, [["lead", "hola de prueba", 10]])],
    perfiles: { 601: perfil("Nombre Nuevo", "lead.nuevo") },
    directorio: [{ id: "5001", nombre: "Nombre Nuevo", ig_username: "lead.nuevo" }],
  });
  // Llegó por la entrada (con su alta), todavía sin el usuario de Instagram guardado.
  w.contactos.set("5001", { id: "5001", dueno: "agente", ig_id: null, ig_usuario: null, alta_avisada: false });
  w.mensajes.push({ id: 1, contacto: "5001", quien: "lead", texto: "hola de prueba", creado: new Date(hace(10).getTime() + 3000), ig_mid: null });
  const r = await w.revisar();
  assert.deepEqual({ altas: r.altas, recuperados: r.recuperados }, { altas: 0, recuperados: 0 });
  assert.equal(w.delContacto("5001").length, 1);
  assert.equal(w.contactos.get("5001").ig_id, "601", "de paso queda su Instagram: la vuelta siguiente ya no lo busca");
});

test("una charla del agente que alguien está contestando (la traba tomada) queda para la vuelta siguiente", async () => {
  const w = mundo({
    contactos: [{ id: "77", ig_id: "501", ig_usuario: "lead.agente" }],
    hilos: [charla(1, DEL_AGENTE, [["lead", "perdido de prueba", 8]])],
  });
  w.tomado.set("77", "otra corrida");
  assert.equal((await w.revisar()).recuperados, 0);
  assert.equal(w.tomado.get("77"), "otra corrida");
  w.tomado.clear();
  assert.equal((await w.revisar()).recuperados, 1);
});

/* ---------- 7. lo que no se toca ---------- */

test("a quien sigue Cande no se lo toma ni se lo avisa: por Instagram o por su lista", async () => {
  const w = mundo({
    hilos: [charla(1, NUEVO, [["lead", "hola de prueba", 10]]), charla(2, OTRO, [["lead", "hola de prueba", 10]])],
    perfiles: { 601: perfil("Nombre Nuevo", "lead.nuevo", true), 801: perfil("Nombre Otro", "lead.otro") },
    directorio: [{ id: "5001", nombre: "Nombre Nuevo", ig_username: "lead.nuevo" }, { id: "5005", nombre: "Nombre Otro", ig_username: "lead.otro" }],
    aj: { seguidos: true }, seguidos: ["lead.otro"],
  });
  const r = await w.revisar();
  assert.deepEqual({ altas: r.altas, pendientes: r.pendientes }, { altas: 0, pendientes: 0 });
  assert.equal(w.contactos.size, 0);
  assert.deepEqual(w.busquedas, [], "ni se lo buscó en ManyChat");
  assert.ok(!w.pedidosIg.includes("/801"), "con la lista alcanza: ni se pidió su perfil");
  // Instagram dijo que lo sigue: la vuelta siguiente no le vuelve a preguntar.
  const pedidos = w.pedidosIg.filter((p) => p === "/601").length;
  await w.revisar();
  assert.equal(w.pedidosIg.filter((p) => p === "/601").length, pedidos);
});

test("si Cande le escribió a mano a alguien nuevo, el agente no se mete: va al resumen para ella; con su -- ni eso", async () => {
  const w = mundo({
    hilos: [
      charla(1, NUEVO, [["cuenta", "Esto lo escribí yo a mano, de prueba", 60], ["lead", "respuesta de prueba", 40]]),
      charla(2, OTRO, [["cuenta", "--", 60], ["lead", "otra respuesta de prueba", 40]]),
    ],
    perfiles: { 601: perfil("Nombre Nuevo", "lead.nuevo"), 801: perfil("Nombre Otro", "lead.otro") },
    directorio: [{ id: "5001", nombre: "Nombre Nuevo", ig_username: "lead.nuevo" }, { id: "5005", nombre: "Nombre Otro", ig_username: "lead.otro" }],
  });
  const r = await w.revisar();
  assert.equal(r.altas, 0);
  assert.equal(w.contactos.size, 0);
  assert.equal(w.avisos.length, 1);
  const vos = w.avisos[0].campos[SECCION_VOS];
  assert.match(vos, /Nombre Nuevo, hace 40 min \(hay mensajes tuyos a mano: el agente no se metió\)/);
  assert.doesNotMatch(vos, /Nombre Otro/);
});

test("en una charla del agente donde Cande escribió a mano o puso --, no se guarda nada: la saca la vuelta de Instagram", async () => {
  for (const suyo of ["Le escribo yo esto a mano, de prueba", "--"]) {
    const w = mundo({
      contactos: [{ id: "77", ig_id: "501", ig_usuario: "lead.agente", dueno_desde: hace(600) }],
      hilos: [charla(1, DEL_AGENTE, [["cuenta", suyo, 60], ["lead", "perdido de prueba", 8]])],
    });
    assert.equal((await w.revisar()).recuperados, 0, suyo);
    assert.equal(w.mensajes.length, 0, suyo);
  }
});

/* ---------- 8. lo que el agente no puede tomar va al resumen ---------- */

test("si no se la encuentra en ManyChat no se contesta sola: va al resumen con su link, y no se la busca en cada vuelta", async () => {
  const w = mundo({
    hilos: [charla(1, NUEVO, [["lead", "hola de prueba", 30]])],
    perfiles: { 601: perfil("Nombre Nuevo", "lead.nuevo") },
    directorio: [{ id: "5009", nombre: "Nombre Nuevo", ig_username: "otra.cuenta" }],
  });
  await w.revisar();
  assert.equal(w.contactos.size, 0);
  assert.match(w.avisos[0].campos[SECCION_VOS], /Nombre Nuevo, hace 30 min \(nueva, no entró al agente: no la encontré en ManyChat\).*ig\.me\/m\/lead\.nuevo/);
  const busquedas = w.busquedas.length;
  w.ahora = new Date(AHORA.getTime() + 10 * MIN);
  await w.revisar();
  assert.equal(w.busquedas.length, busquedas, "no se busca de nuevo en cada vuelta");
  w.ahora = new Date(AHORA.getTime() + 40 * MIN);
  await w.revisar();
  assert.ok(w.busquedas.length > busquedas, "pasada media hora, se la busca de nuevo");
});

test("dos contactos de ManyChat con el mismo Instagram: no se elige ninguno", async () => {
  const manychat = {
    buscarPorNombre: async () => ({ ok: true, contactos: [{ id: "1", ig_username: "lead.nuevo" }, { id: "2", ig_username: "lead.nuevo" }] }),
    datosDe: async () => ({ ok: false }),
  };
  assert.deepEqual(await identificar(manychat, { igsid: "601", usuario: "lead.nuevo", nombres: ["Nombre"] }), { id: null, falla: false, varios: true });
  const caido = { buscarPorNombre: async () => ({ ok: false, error: "no" }), datosDe: async () => ({ ok: false }) };
  assert.equal((await identificar(caido, { igsid: "601", usuario: "lead.nuevo", nombres: ["Nombre"] })).falla, true);
  const porId = { buscarPorNombre: async () => ({ ok: true, contactos: [{ id: "3", ig_username: "cambio.de.usuario", ig_id: "601" }] }), datosDe: async () => ({ ok: false }) };
  assert.equal((await identificar(porId, { igsid: "601", usuario: "lead.nuevo", nombres: ["Nombre"] })).id, "3", "el mismo id de Instagram también vale");
});

test("si ManyChat no contesta, se la busca de nuevo la vuelta siguiente (no queda como no encontrada)", async () => {
  const w = mundo({
    hilos: [charla(1, NUEVO, [["lead", "hola de prueba", 10]])],
    perfiles: { 601: perfil("Nombre Nuevo", "lead.nuevo") },
    directorio: [{ id: "5001", nombre: "Nombre Nuevo", ig_username: "lead.nuevo" }],
  });
  w.mcCaido = true;
  assert.equal((await w.revisar()).altas, 0);
  w.mcCaido = false;
  w.ahora = new Date(AHORA.getTime() + 3 * MIN);
  assert.equal((await w.revisar()).altas, 1);
});

test("con el agente apagado, las altas apagadas o el tope lleno no entra nadie nuevo: va al resumen con el motivo", async () => {
  for (const [aj, motivo, altasHoy] of [[{ modo: "apagado" }, "el agente está apagado", 0], [{ altas: false }, "las altas están apagadas", 0], [{ altas_por_dia: 3 }, "se llenó el tope de altas del día", 3]]) {
    const w = mundo({
      hilos: [charla(1, NUEVO, [["lead", "hola de prueba", 30]])],
      perfiles: { 601: perfil("Nombre Nuevo", "lead.nuevo") },
      directorio: [{ id: "5001", nombre: "Nombre Nuevo", ig_username: "lead.nuevo" }],
      aj,
    });
    w.altasHoy = altasHoy;
    assert.equal((await w.revisar()).altas, 0, motivo);
    assert.equal(w.contactos.size, 0, motivo);
    assert.match(w.avisos[0].campos[SECCION_VOS], new RegExp(`nueva, no entró al agente: ${motivo}`), motivo);
  }
});

test("con el agente apagado, el mensaje perdido de una charla suya se guarda igual (como la entrada): el cron de los toques se la pasa a Cande", async () => {
  const w = mundo({
    contactos: [{ id: "77", ig_id: "501", ig_usuario: "lead.agente" }],
    hilos: [charla(1, DEL_AGENTE, [["lead", "perdido de prueba", 8]])],
    aj: { modo: "apagado" },
  });
  assert.equal((await w.revisar()).recuperados, 1);
});

test("las búsquedas en ManyChat tienen tope por vuelta: las que no entran quedan para la siguiente, sin aviso", async () => {
  const n = BUSQUEDAS_POR_VUELTA + 2;
  const gente = Array.from({ length: n }, (_, i) => persona(`61${i}`, `lead.n${i}`));
  const w = mundo({
    hilos: gente.map((p, i) => charla(i + 1, p, [["lead", "hola de prueba", 10 + i]])),
    perfiles: Object.fromEntries(gente.map((p, i) => [p.id, perfil(`Persona${i}`, p.username)])),
    directorio: gente.map((p, i) => ({ id: `50${i}`, nombre: `Persona${i}`, ig_username: p.username })),
  });
  assert.equal((await w.revisar()).altas, BUSQUEDAS_POR_VUELTA);
  assert.equal(w.avisos.length, 0);
  w.ahora = new Date(AHORA.getTime() + 3 * MIN);
  assert.equal((await w.revisar()).altas, 2);
});

/* ---------- 9. el resumen ---------- */

test("el resumen sale una vez cada 3 horas como mucho, y solo si trae algo nuevo", async () => {
  const w = mundo({
    contactos: [
      { id: "70", nombre: "Lead de Cande", dueno: "cande", ig_id: "701", ig_usuario: "lead.cande" },
      { id: "71", nombre: "Otro de Cande", dueno: "cande", ig_id: "801", ig_usuario: "lead.otro" },
    ],
    mensajes: [{ contacto: "70", quien: "lead", texto: "de antes", creado: hace(900) }, { contacto: "71", quien: "lead", texto: "de antes", creado: hace(900) }],
    hilos: [charla(1, DE_CANDE, [["lead", "pregunta de prueba", 40]])],
  });
  await w.revisar();
  assert.equal(w.avisos.length, 1);

  // Una hora después aparece otra: todavía no pasaron 3 horas.
  w.ahora = new Date(AHORA.getTime() + HORA);
  w.hilos.push(charla(2, OTRO, [["lead", "otra pregunta de prueba", 0]]));
  await w.revisar();
  assert.equal(w.avisos.length, 1);

  // A las 3 horas sale, con las dos.
  w.ahora = new Date(AHORA.getTime() + RESUMEN_CADA_MS + MIN);
  await w.revisar();
  assert.equal(w.avisos.length, 2);
  assert.match(w.avisos[1].campos[SECCION_VOS], /Lead de Cande[\s\S]*Otro de Cande/);

  // Tres horas más, sin nada nuevo: no sale.
  w.ahora = new Date(AHORA.getTime() + 2 * RESUMEN_CADA_MS + 2 * MIN);
  await w.revisar();
  assert.equal(w.avisos.length, 2);
});

test("si el resumen no sale (Telegram caído), se intenta de nuevo la vuelta siguiente", async () => {
  const w = mundo({
    contactos: [{ id: "70", nombre: "Lead de Cande", dueno: "cande", ig_id: "701" }],
    mensajes: [{ contacto: "70", quien: "lead", texto: "de antes", creado: hace(900) }],
    hilos: [charla(1, DE_CANDE, [["lead", "pregunta de prueba", 40]])],
  });
  let sale = false;
  w.avisar = async (titulo, campos) => { w.avisos.push({ titulo, campos }); return sale; };
  assert.equal((await w.revisar()).resumen, false);
  sale = true;
  w.ahora = new Date(AHORA.getTime() + 3 * MIN);
  assert.equal((await w.revisar()).resumen, true);
  assert.equal(w.avisos.length, 2);
});

test("el resumen entra en un mensaje de Telegram: hasta 10 por sección y cuántas más", () => {
  const items = Array.from({ length: 25 }, (_, i) => ({
    seccion: "vos", hilo: `h${i}`, mid: `m${i}`, edad: (30 + i) * MIN, nombre: "N".repeat(80), usuario: "lead.prueba", texto: "x".repeat(500),
  }));
  const r = armarResumen(items, { ahora: AHORA, estado: null });
  assert.equal(r.mandar, true);
  assert.match(r.campos[SECCION_VOS], /y 15 más$/);
  assert.ok(JSON.stringify(r.campos).length < 3500);
});

test("hace cuánto, en minutos, horas o días", () => {
  assert.equal(haceCuanto(30 * 1000), "1 min");
  assert.equal(haceCuanto(40 * MIN), "40 min");
  assert.equal(haceCuanto(26 * HORA), "26 h");
  assert.equal(haceCuanto(4 * 24 * HORA), "4 días");
});

test("un texto de la cuenta es conocido si es igual, o si comparte 30 letras del principio o del final", () => {
  const a = "holanombregraciasporescribirestemensajefijodepruebasalesolo";
  assert.ok(esConocida(a, [a]));
  assert.ok(esConocida(a, ["holaotronombregraciasporescribirestemensajefijodepruebasalesolo"]));
  assert.ok(!esConocida("estolohiceyoamano", ["holaotronombregraciasporescribirestemensajefijodepruebasalesolo"]));
  assert.deepEqual(sinRespuesta({ mensajes: [{ de: null }] }, { user_id: "900", username: "x" }), []);
});

test("la búsqueda por nombre de ManyChat: usuario vacío es que no tiene; sin el campo, hay que pedírselo", async () => {
  const { buscarPorNombre } = await import("../lib/dm/manychat.js");
  const antes = globalThis.fetch;
  const pedidos = [];
  process.env.MANYCHAT_API_KEY = "clave-de-prueba";
  globalThis.fetch = async (url) => {
    pedidos.push(String(url));
    return {
      ok: true, status: 200,
      json: async () => ({ status: "success", data: [
        { id: 11, name: "Nombre Prueba", ig_username: "lead.prueba", ig_id: 601 },
        { id: 12, first_name: "Nombre", last_name: "Prueba", ig_username: null },
        { id: 13, name: "Nombre Prueba", ig_username: "" },
        { name: "sin id" },
      ] }),
    };
  };
  try {
    assert.deepEqual(await buscarPorNombre("  "), { ok: true, contactos: [] });
    assert.equal(pedidos.length, 0, "sin nombre no se pregunta");
    const r = await buscarPorNombre("Nombre Prueba");
    assert.match(pedidos[0], /\/fb\/subscriber\/findByName\?name=Nombre%20Prueba$/);
    assert.deepEqual(r.contactos, [
      { id: "11", nombre: "Nombre Prueba", ig_username: "lead.prueba", ig_id: "601" },
      { id: "12", nombre: "Nombre Prueba", ig_username: null, ig_id: null },
      { id: "13", nombre: "Nombre Prueba", ig_username: "", ig_id: null },
    ]);
  } finally {
    globalThis.fetch = antes;
    delete process.env.MANYCHAT_API_KEY;
  }
});

/* ---------- el cron y las consultas ---------- */

const pedido = (extra = {}) => ({ method: "GET", headers: {}, ...extra });

test("el cron de la bandeja no entra sin CRON_SECRET, corre cada 3 minutos y no devuelve ids", async () => {
  const { default: handler, config } = await import("../pages/api/dm/bandeja.js");
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
  assert.deepEqual(crons.find((c) => c.path === "/api/dm/bandeja"), { path: "/api/dm/bandeja", schedule: "*/3 * * * *" });
});

test("las consultas de la red: guardar solo en charlas del agente, sin repetir un mensaje y sin tocar nada si no guardó", async () => {
  const src = await readFile(new URL("../lib/dm/base.js", import.meta.url), "utf8");
  const cuerpo = (nombre) => {
    const i = src.indexOf(`export async function ${nombre}`);
    assert.ok(i > -1, `falta ${nombre}`);
    return src.slice(i, src.indexOf("\n}\n", i));
  };
  assert.match(src, /CREATE UNIQUE INDEX IF NOT EXISTS dm_mensajes_ig_mid_idx ON dm_mensajes \(ig_mid\) WHERE ig_mid IS NOT NULL/);
  const anotar = cuerpo("anotarDesdeBandeja");
  assert.match(anotar, /WHERE id = \$\{id\} AND dueno = 'agente'/);
  assert.match(anotar, /ON CONFLICT DO NOTHING/);
  assert.equal((anotar.match(/EXISTS \(SELECT 1 FROM n\)/g) || []).length, 2, "la ventana, los toques y lo pendiente cambian solo si guardó algo");
  const alta = cuerpo("darDeAltaDesdeBandeja");
  assert.match(alta, /ON CONFLICT \(id\) DO NOTHING/);
  assert.match(alta, /hoy\.n < \$\{tope\}::int/);
  assert.match(alta, /alta_avisada/);
  const entro = cuerpo("entroPorLaBandeja");
  assert.match(entro, /ig_mid IS NOT NULL AND creado > NOW\(\) - INTERVAL '2 hours'/);
});

test("el ajuste de la red de la bandeja es un sí o un no, y arranca prendido", async () => {
  const { validarAjustes, AJUSTES_POR_DEFECTO } = await import("../lib/dm/base.js");
  assert.equal(AJUSTES_POR_DEFECTO.bandeja, true);
  assert.equal(validarAjustes({ bandeja: "no" }).ok, false);
  assert.equal(validarAjustes({ bandeja: false }).ok, true);
});
