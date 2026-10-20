// La red de la bandeja (lib/dm/bandeja.js, 20/10): que no quede ninguna charla sin contestar aunque el webhook de
// ManyChat no llegue. Con un Instagram, una base y un ManyChat de mentira: ninguna prueba sale a la red ni manda
// un mensaje. Los usuarios, ids, nombres y textos son inventados (este repo es público).
//
// Lo que NO cubren: las consultas de lib/dm/base.js (el doble de Postgres no las conoce). Antes de subir se
// prueban a mano contra un Postgres de verdad: que anotarDesdeBandeja guarde solo en charlas del agente, no repita
// un ig_mid, y si no guardó nada no toque ultimo_lead, los toques ni lo pendiente; que darDeAltaDesdeBandeja no toque
// a quien ya figura, respete su propio tope y deje contacto y mensajes juntos; que la entrada y la red cuenten cada
// una sus altas; que guardadosPorLaRed y marcarEco dejen absorber un solo eco por mensaje; que salidaSinLlegar mire
// solo respuestas enviadas; que la migración de personal deje como personales solo las altas borradas; que guardarIg
// con soloDelAgente no toque una charla personal ni una de Cande (y sin él, como siempre); y que enviadosEnLaCharla
// traiga lo del agente y de Cande sin los automáticos. Abajo hay una revisión del texto de esas consultas.
//
// Correr:  node --test tests/*.test.mjs
import { respuesta } from "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const {
  revisarBandeja, vigilarRed, armarResumen, faltantes, sinRespuesta, identificar, haceCuanto, esConocida, esAutomatico, largoVisible,
  GRACIA_MS, RESUMEN_CADA_MS, TITULO_RESUMEN, SECCION_VOS, SECCION_MANO, SECCION_ETIQUETA, BUSQUEDAS_POR_VUELTA, LARGO_AVISO,
  CHARLAS_POR_PAGINA, ETIQUETA_AGENTE,
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

// Un automático de prueba (la bienvenida), cargado en dm_config "automaticos": no es Cande escribiendo.
const AUTOMATICO = "Hola! Este es un mensaje fijo de prueba que sale solo a quien escribe por primera vez";
const CON_AUTOMATICOS = { automaticos: { textos: [AUTOMATICO] } };

/**
 * Una charla como la devuelve Instagram. `lineas`: [quien, texto, hace cuántos minutos], de la más vieja a la más
 * nueva; quien es "cuenta" o "lead"; texto null es un audio o una foto. Instagram las da al revés.
 */
const charla = (n, p, lineas) => {
  const yo = { id: CUENTA.id, username: CUENTA.username };
  const data = lineas.map(([quien, texto, min], i) => ({
    id: `m${n}-${i}`, created_time: ISO(hace(min)), from: quien === "cuenta" ? yo : p, to: { data: [quien === "cuenta" ? p : yo] }, message: texto,
  })).reverse();
  return { id: `h${n}`, updated_time: ISO(hace(Math.min(...lineas.map((l) => l[2])))), messages: { data } };
};

/**
 * El mundo de mentira. `contactos`, `mensajes` y `salidas` son la base; `hilos`, la bandeja de Instagram (con
 * páginas de verdad: limit y after); `perfiles`, lo que da Instagram de cada persona; `directorio`, ManyChat.
 */
function mundo({
  contactos = [], mensajes = [], salidas = [], hilos = [], perfiles = {}, directorio = [], aj = {}, seguidos = [], config = {}, conUsuarioEnBusqueda = true,
} = {}) {
  const w = {
    ahora: AHORA, hilos, perfiles, directorio, conUsuarioEnBusqueda, mcCaido: false, etiquetaCaida: false, altasRedHoy: 0,
    contactos: new Map(contactos.map((c) => [c.id, { dueno: "agente", ig_id: null, ig_usuario: null, toques: 0, proximo_toque: null, personal: false, alta_por: null, ...c }])),
    mensajes: mensajes.map((m, i) => ({ id: i + 1, ig_mid: null, guardado_red: null, eco_en: null, creado: AHORA, ...m })),
    salidas: salidas.map((s) => ({ accion: "responder", estado: "enviada", mensajes: ["Respuesta de prueba"], enviado: null, ...s })),
    config: { ...config }, seguidos: new Set(seguidos), tomado: new Map(), avisos: [], busquedas: [], pedidosDatos: 0, pedidosIg: [], etiquetas: [],
    aj: { modo: "auto", altas: true, altas_por_dia: 25, altas_bandeja_por_dia: 10, contexto_alta: "", seguidos: false, ...aj },
    alPedir: null,
  };
  const copia = (c) => (c ? { ...c } : null);
  const nuevoMensaje = (m) => w.mensajes.push({ id: w.mensajes.length + 1, ig_mid: null, guardado_red: null, eco_en: null, ...m });
  w.base = {
    leerConfig: async (k) => (w.config[k] === undefined ? null : JSON.parse(JSON.stringify(w.config[k]))),
    guardarConfig: async (k, v) => { w.config[k] = JSON.parse(JSON.stringify(v)); },
    // Como la consulta: por el id de Instagram, o por el usuario si todavía no tiene id.
    contactoDeIg: async ({ igId, usuario }) => {
      const l = [...w.contactos.values()];
      return copia(l.find((c) => igId && c.ig_id === igId) || l.find((c) => usuario && c.ig_usuario === usuario && !c.ig_id));
    },
    contacto: async (id) => copia(w.contactos.get(id)),
    // Como la consulta: con soloDelAgente, solo en una charla del agente (nunca en una personal o borrada, que son de Cande).
    guardarIg: async (id, { usuario = null, igId = null, soloDelAgente = false } = {}) => {
      const c = w.contactos.get(id);
      if (!c || (soloDelAgente && (c.dueno !== "agente" || c.personal === true))) return;
      if (usuario !== null) c.ig_usuario = usuario;
      if (igId !== null) c.ig_id = igId;
    },
    loSigue: async (u) => w.seguidos.has(u),
    // Como la consulta: con `desde`, solo lo que se escribió después de esa hora (los automáticos cargados, siempre).
    textosDeLaCuenta: async (id, { desde = null } = {}) => [
      ...w.mensajes.filter((m) => m.contacto === id && ["agente", "cande", "automatico"].includes(m.quien) && (!desde || new Date(m.creado) > desde))
        .map((m) => m.texto),
      ...(w.config.automaticos?.textos || []),
    ],
    enviadosEnLaCharla: async (id) => [
      ...w.mensajes.filter((m) => m.contacto === id && ["agente", "cande"].includes(m.quien)).map((m) => m.texto),
      ...w.salidas.filter((s) => s.contacto === id && ["pendiente", "enviando", "enviada", "incierta"].includes(s.estado)).flatMap((s) => s.mensajes),
    ],
    leadsGuardados: async (id) => w.mensajes.filter((m) => m.contacto === id && m.quien === "lead").map((m) => ({ ...m })),
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
        nuevoMensaje({ contacto: id, quien: "lead", texto: m.texto, creado: new Date(m.creado), ig_mid: m.mid, guardado_red: w.ahora });
        c.ultimo_lead = new Date(Math.max(c.ultimo_lead ? c.ultimo_lead.getTime() : 0, new Date(m.creado).getTime()));
        n++;
      }
      if (n) Object.assign(c, { toques: 0, proximo_toque: null });
      return n;
    },
    // Como la consulta: solo en una charla del agente y una vez por ig_mid; lo del lead hasta el último de esos mensajes
    // (por la hora) queda contestado, el toque se cancela y la marca de retomada queda usada hasta ese mensaje (si ya
    // estaba usada, queda como estaba).
    anotarCandeDesdeIg: async (id, lista) => {
      const c = w.contactos.get(id);
      if (!c || c.dueno !== "agente") return 0;
      const nuevos = lista.filter((m) => !w.mensajes.some((x) => x.ig_mid === m.mid));
      for (const m of nuevos) nuevoMensaje({ contacto: id, quien: "cande", texto: m.texto, creado: new Date(m.creado), ig_mid: m.mid });
      if (nuevos.length) {
        const tope = Math.max(...nuevos.map((m) => new Date(m.creado).getTime()));
        const leads = w.mensajes.filter((x) => x.contacto === id && x.quien === "lead" && x.creado.getTime() <= tope).map((x) => x.id);
        Object.assign(c, { respondido_hasta: Math.max(c.respondido_hasta || 0, ...leads), proximo_toque: null });
        const marca = w.config.retomadas?.[id];
        if (marca && marca.usada == null) marca.usada = tope;
      }
      return nuevos.length;
    },
    darDeAltaDesdeBandeja: async (id, { nombre, mensajes: lista, contexto, tope, igId, usuario }) => {
      const van = w.altasRedHoy;
      if (w.contactos.has(id) || van >= tope) return { guardados: 0, van };
      w.altasRedHoy++;
      w.contactos.set(id, {
        id, nombre, dueno: "agente", contexto: contexto || null, alta_en: w.ahora, alta_por: "bandeja", alta_avisada: false, ig_id: igId, ig_usuario: usuario,
        ultimo_lead: new Date(Math.max(...lista.map((m) => new Date(m.creado).getTime()))), respondido_hasta: 0, toques: 0, proximo_toque: null, personal: false,
      });
      for (const m of lista) nuevoMensaje({ contacto: id, quien: "lead", texto: m.texto, creado: new Date(m.creado), ig_mid: m.mid, guardado_red: w.ahora });
      return { guardados: lista.length, van };
    },
    salidaSinLlegar: async (id, desde) => w.salidas.some((s) => s.contacto === id && s.estado === "enviada" && s.accion !== "callar" &&
      s.mensajes.length > 0 && s.creado >= new Date(desde) && (s.enviado || s.creado) < w.ahora - 10 * MIN),
    guardadosPorLaRed: async (id) => w.mensajes
      .filter((m) => m.contacto === id && m.quien === "lead" && m.ig_mid && m.guardado_red && w.ahora - m.guardado_red < 24 * HORA)
      .map((m) => ({ id: m.id, texto: m.texto, creado: m.creado, ig_mid: m.ig_mid, eco_en: m.eco_en, eco_reciente: Boolean(m.eco_en && w.ahora - m.eco_en < MIN) })),
    marcarEco: async (idMensaje) => {
      const m = w.mensajes.find((x) => x.id === idMensaje);
      if (!m || m.eco_en) return false;
      m.eco_en = w.ahora;
      return true;
    },
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
    ponerEtiqueta: async (id, etiqueta) => {
      w.etiquetas.push([id, etiqueta]);
      return w.etiquetaCaida ? { ok: false, error: "ManyChat de prueba caído" } : { ok: true };
    },
  };
  // Instagram de mentira, con el cliente de verdad (lib/dm/instagram.js). La lista va de a páginas (limit, after).
  const pedir = async (url) => {
    const u = new URL(url);
    const ruta = u.pathname.replace(/^\/v\d+\.\d+/, "");
    w.pedidosIg.push(ruta);
    if (w.alPedir) await w.alPedir(ruta, u);
    let r;
    if (ruta === "/me") r = { user_id: CUENTA.id, username: CUENTA.username };
    else if (ruta === "/me/conversations") {
      const todas = [...w.hilos].sort((a, b) => b.updated_time.localeCompare(a.updated_time));
      const desde = Number(u.searchParams.get("after") || 0);
      const n = Number(u.searchParams.get("limit") || 25);
      r = { data: todas.slice(desde, desde + n), paging: { cursors: { after: String(desde + n) }, ...(desde + n < todas.length ? { next: "https://siguiente.prueba" } : {}) } };
    } else if (w.perfiles[ruta.slice(1)]) r = w.perfiles[ruta.slice(1)];
    else if (/^\/m/.test(ruta)) r = { error: { message: "Instagram de prueba pidió que vaya más despacio", code: 4 } };
    else r = { error: { message: `ruta de prueba desconocida ${ruta}`, code: 100 } };
    return { ok: !r.error, status: r.error ? 400 : 200, json: async () => r };
  };
  const cfgIg = {};
  w.ig = crearInstagram({ pedir, leerConfig: async (k) => cfgIg[k] ?? null, guardarConfig: async (k, v) => { cfgIg[k] = v; }, tokenEnv: () => "t" });
  w.avisar = async (titulo, campos, opciones) => { w.avisos.push({ titulo, campos, opciones }); return true; };
  w.resumenes = () => w.avisos.filter((a) => a.titulo === TITULO_RESUMEN);
  w.revisar = (extra = {}) => revisarBandeja({ ig: w.ig, base: w.base, manychat: w.manychat, aj: w.aj, avisar: w.avisar, ahora: () => w.ahora, ...extra });
  w.delContacto = (id) => w.mensajes.filter((m) => m.contacto === id);
  w.pasar = (min) => { w.ahora = new Date(w.ahora.getTime() + min * MIN); };
  return w;
}

/** El perfil de Instagram de una persona: su nombre, su usuario y si Cande la sigue. */
const perfil = (nombre, username, sigue = false) => ({ name: nombre, username, is_business_follow_user: sigue });
const NUEVO_PERFIL = { 601: perfil("Nombre Nuevo", "lead.nuevo") };
const NUEVO_EN_MC = [{ id: "5001", nombre: "Nombre Nuevo", ig_username: "lead.nuevo" }];

/* ---------- 1. alguien nuevo que nunca entró ---------- */

test("un lead nuevo que escribió y nunca entró: se lo encuentra en ManyChat, entra como alta con sus mensajes y la etiqueta agente_dm", async () => {
  const w = mundo({
    hilos: [charla(1, NUEVO, [["cuenta", AUTOMATICO, 30], ["lead", "hola, consulta de prueba", 12], ["lead", "sigo por acá", 11]])],
    perfiles: NUEVO_PERFIL,
    directorio: [...NUEVO_EN_MC, { id: "5002", nombre: "Nombre Nuevo Otro", ig_username: "otra.cuenta" }],
    aj: { contexto_alta: "contexto de prueba" }, config: CON_AUTOMATICOS,
  });
  const r = await w.revisar();
  assert.equal(r.altas, 1);
  const c = w.contactos.get("5001");
  assert.equal(c.dueno, "agente");
  assert.equal(c.alta_por, "bandeja", "cuenta en el tope de la red, no en el de la entrada");
  assert.equal(c.alta_avisada, false, "como cualquier alta: el modelo dice si es un lead (o una charla personal)");
  assert.deepEqual([c.ig_id, c.ig_usuario, c.contexto, c.nombre], ["601", "lead.nuevo", "contexto de prueba", "Nombre Nuevo"]);
  const guardados = w.delContacto("5001");
  assert.deepEqual(guardados.map((m) => m.texto), ["hola, consulta de prueba", "sigo por acá"], "los dos, en el orden en que los escribió");
  assert.deepEqual(guardados.map((m) => m.creado), [hace(12), hace(11)], "con la hora en que los escribió, no la de ahora");
  assert.ok(guardados.every((m) => m.ig_mid), "cada uno con su id de Instagram");
  assert.deepEqual(c.ultimo_lead, hace(11), "la ventana de 24 horas cuenta desde lo último que escribió");
  assert.deepEqual(w.etiquetas, [["5001", ETIQUETA_AGENTE]], "sin la etiqueta, lo que escriba después no le llega al agente por ManyChat");
  assert.equal(w.contactos.has("5002"), false);
  assert.equal(w.avisos.length, 0, "un alta no le avisa a Cande: lo atiende el agente");

  // La vuelta siguiente ya lo reconoce por su Instagram: no lo busca ni lo guarda otra vez.
  const busquedas = w.busquedas.length;
  w.pasar(3);
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

test("un automático cargado, con el nombre de la persona adentro, sigue siendo un automático: el agente toma la charla", async () => {
  const conNombre = (n) => `Hola ${n}! Gracias por escribir, este mensaje fijo de prueba sale solo con tu nombre`;
  const w = mundo({
    hilos: [charla(1, NUEVO, [["cuenta", conNombre("Nombre"), 30], ["lead", "hola de prueba", 10]])],
    perfiles: { 601: perfil("Nombre", "lead.nuevo") },
    directorio: [{ id: "5001", nombre: "Nombre", ig_username: "lead.nuevo" }],
    config: { automaticos: { textos: [conNombre("Otronombre")] } },
  });
  assert.equal((await w.revisar()).altas, 1);
});

test("si a alguien nuevo le salió de la cuenta un audio, un Sí, un emoji, un saludo repetido o un --, es de Cande: no hay alta y va al resumen", async () => {
  const SALUDO = "Holaaa, cómo va? Te leo, contame un poco más de prueba";
  for (const [suyo, nota] of [
    [null, /hay mensajes tuyos/], ["Sí", /hay mensajes tuyos/], ["😂", /hay mensajes tuyos/], [SALUDO, /hay mensajes tuyos/], ["--", /escribiste --/],
  ]) {
    const w = mundo({
      hilos: [
        charla(1, NUEVO, [["cuenta", AUTOMATICO, 90], ["lead", "una consulta de prueba", 80], ["cuenta", suyo, 70], ["lead", "dale, gracias de prueba", 40]]),
        // El mismo saludo en otra charla: que se repita no lo hace automático.
        charla(2, OTRO, [["cuenta", SALUDO, 300], ["lead", "ok de prueba", 290], ["cuenta", "Otra respuesta de prueba", 289]]),
      ],
      perfiles: NUEVO_PERFIL, directorio: NUEVO_EN_MC, config: CON_AUTOMATICOS,
    });
    const r = await w.revisar();
    assert.equal(r.altas, 0, String(suyo));
    assert.equal(w.contactos.size, 0, String(suyo));
    const vos = w.resumenes()[0]?.campos[SECCION_VOS] || "";
    assert.match(vos, /Nombre Nuevo, hace 40 min/, String(suyo));
    assert.match(vos, nota, String(suyo));
  }
});

test("a quien se le pasó a Cande en un resumen como nueva no entra después como alta, aunque ManyChat la encuentre", async () => {
  const w = mundo({
    hilos: [charla(1, NUEVO, [["lead", "hola de prueba", 30]])],
    perfiles: NUEVO_PERFIL,
    directorio: [{ id: "5009", nombre: "Nombre Nuevo", ig_username: "otra.cuenta" }], // todavía no se la encuentra
  });
  await w.revisar();
  assert.match(w.resumenes()[0].campos[SECCION_VOS], /nueva, no entró al agente: no la encontré en ManyChat/);
  // Una hora después ManyChat ya la tiene, y ella vuelve a escribir (Cande le contestó con un audio, o no le contestó).
  w.pasar(60);
  w.directorio.push(...NUEVO_EN_MC);
  w.hilos[0] = charla(1, NUEVO, [["lead", "hola de prueba", 90], ["lead", "sigo esperando, de prueba", 5]]);
  assert.equal((await w.revisar()).altas, 0);
  assert.equal(w.contactos.size, 0, "se le dijo a Cande que la conteste: el agente no se mete");
  assert.match(w.config.bandeja_estado.pendientes.h1.nota, /ya te la había pasado/);
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
  assert.deepEqual(w.etiquetas, [["77", ETIQUETA_AGENTE]], "si se perdió un mensaje, que la etiqueta esté");
  assert.equal(w.avisos.length, 0);
  // La vuelta siguiente no lo guarda de nuevo.
  w.pasar(3);
  assert.equal((await w.revisar()).recuperados, 0);
  assert.equal(w.delContacto("77").length, 3);
});

test("un automático de ManyChat después del mensaje del lead no es una respuesta: si se tragó el mensaje, se guarda igual", async () => {
  const w = mundo({
    contactos: [{ id: "77", ig_id: "501", ig_usuario: "lead.agente", respondido_hasta: 0, dueno_desde: hace(600) }],
    mensajes: [{ contacto: "77", quien: "agente", texto: "Respuesta anterior de prueba", creado: hace(60) }],
    hilos: [charla(1, DEL_AGENTE, [["cuenta", "Respuesta anterior de prueba", 60], ["lead", "pregunta de prueba con la palabra clave", 10], ["cuenta", AUTOMATICO, 10]])],
    config: CON_AUTOMATICOS,
  });
  assert.equal((await w.revisar()).recuperados, 1);
  assert.equal(w.delContacto("77").at(-1).texto, "pregunta de prueba con la palabra clave");
  assert.equal(w.resumenes().length, 0);

  // Si ya estaba guardado (llegó por la entrada), no se hace nada: lo contesta la espera.
  const guardado = mundo({
    contactos: [{ id: "77", ig_id: "501", ig_usuario: "lead.agente", respondido_hasta: 0 }],
    mensajes: [{ contacto: "77", quien: "lead", texto: "pregunta de prueba con la palabra clave", creado: hace(10) }],
    hilos: [charla(1, DEL_AGENTE, [["lead", "pregunta de prueba con la palabra clave", 10], ["cuenta", AUTOMATICO, 10]])],
    config: CON_AUTOMATICOS,
  });
  assert.equal((await guardado.revisar()).recuperados, 0);
  assert.equal(guardado.mensajes.length, 1);
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

test("si el agente figura con la respuesta enviada y en Instagram no aparece, no llegó: va al resumen (un silencio del agente, no)", async () => {
  const armarCon = (salida) => mundo({
    contactos: [{ id: "77", nombre: "Lead del agente", ig_id: "501", ig_usuario: "lead.agente", respondido_hasta: 1 }],
    mensajes: [{ contacto: "77", quien: "lead", texto: "pregunta de prueba", creado: hace(30) }],
    salidas: [{ contacto: "77", creado: hace(29), ...salida }],
    hilos: [charla(1, DEL_AGENTE, [["cuenta", "Algo de antes, de prueba", 60], ["lead", "pregunta de prueba", 30]])],
  });
  const w = armarCon({ enviado: hace(29) });
  await w.revisar();
  assert.match(w.resumenes()[0].campos[SECCION_VOS], /Lead del agente, hace 30 min \(el agente le contestó pero no le llegó por Instagram\)/);
  const callo = armarCon({ accion: "callar", estado: "callo", mensajes: [] });
  await callo.revisar();
  assert.equal(callo.resumenes().length, 0, "el agente decidió no contestar: no es una respuesta perdida");
});

test("en una charla del agente, lo que la base sabe que el agente mandó ahí es una respuesta que llegó, aunque repita la frase en otras charlas", async () => {
  // El agente escribe con su voz y repite frases: la misma respuesta les salió a dos personas de la misma página.
  const FRASE = "Frase fija de prueba que el agente repite: contame un poco más de lo tuyo";
  const OTRO_DEL_AGENTE = persona("502", "lead.agente.dos");
  const armar = (lineas) => mundo({
    contactos: [
      { id: "77", nombre: "Lead del agente", ig_id: "501", ig_usuario: "lead.agente", dueno_desde: hace(600) },
      { id: "78", nombre: "Otro del agente", ig_id: "502", ig_usuario: "lead.agente.dos", dueno_desde: hace(600) },
    ],
    mensajes: [
      { contacto: "77", quien: "lead", texto: "una pregunta de prueba", creado: hace(30) },
      { contacto: "77", quien: "agente", texto: FRASE, creado: hace(29) },
      { contacto: "78", quien: "lead", texto: "otra pregunta de prueba", creado: hace(32) },
      { contacto: "78", quien: "agente", texto: FRASE, creado: hace(31) },
    ],
    salidas: [
      { contacto: "77", creado: hace(29), enviado: hace(29), mensajes: [FRASE] },
      { contacto: "78", creado: hace(31), enviado: hace(31), mensajes: [FRASE] },
    ],
    hilos: [charla(1, DEL_AGENTE, lineas), charla(2, OTRO_DEL_AGENTE, [["lead", "otra pregunta de prueba", 32], ["cuenta", FRASE, 31]])],
  });
  const w = armar([["lead", "una pregunta de prueba", 30], ["cuenta", FRASE, 29]]);
  const r = await w.revisar();
  assert.equal(r.recuperados, 0);
  assert.deepEqual(w.config.bandeja_estado.pendientes, {}, "le llegó: no va al resumen como una respuesta que no llegó");
  assert.equal(w.resumenes().length, 0);

  // Si además se perdió un mensaje del lead justo antes de esa respuesta, no se guarda: en Instagram ya tiene
  // respuesta, y guardarlo reabriría el turno (una segunda respuesta, o la charla pasada a Cande por quizas_salio).
  const v = armar([["lead", "una pregunta de prueba", 30], ["lead", "algo más que no llegó, de prueba", 29.5], ["cuenta", FRASE, 29]]);
  assert.equal((await v.revisar()).recuperados, 0);
  assert.equal(v.delContacto("77").length, 2);
  assert.deepEqual(v.config.bandeja_estado.pendientes, {});

  // Y si lo que mandó el agente en esa charla empieza igual que un automático cargado, sigue siendo su respuesta.
  const parecido = `${AUTOMATICO}, y te cuento algo más de prueba`;
  const a = mundo({
    contactos: [{ id: "77", nombre: "Lead del agente", ig_id: "501", ig_usuario: "lead.agente", dueno_desde: hace(600) }],
    mensajes: [
      { contacto: "77", quien: "lead", texto: "una pregunta de prueba", creado: hace(30) },
      { contacto: "77", quien: "agente", texto: parecido, creado: hace(29) },
    ],
    salidas: [{ contacto: "77", creado: hace(29), enviado: hace(29), mensajes: [parecido] }],
    hilos: [charla(1, DEL_AGENTE, [["lead", "una pregunta de prueba", 30], ["cuenta", parecido, 29]])],
    config: CON_AUTOMATICOS,
  });
  await a.revisar();
  assert.deepEqual(a.config.bandeja_estado.pendientes, {});

  // Un texto que se repite en otras charlas y la base no conoce (un saludo que Cande escribió a mano en las dos)
  // tampoco es un automático en una charla del agente: es una respuesta, y el agente no le contesta encima.
  const SALUDO = "Holaaa, cómo va? Te leo, contame un poco más de prueba";
  const s = mundo({
    contactos: [{ id: "77", ig_id: "501", ig_usuario: "lead.agente", dueno_desde: hace(600) }],
    hilos: [
      charla(1, DEL_AGENTE, [["lead", "un mensaje que no llegó, de prueba", 30], ["cuenta", SALUDO, 29]]),
      charla(2, OTRO, [["lead", "hola de prueba", 300], ["cuenta", SALUDO, 299]]),
    ],
    perfiles: { 801: perfil("Nombre Otro", "lead.otro") },
  });
  assert.equal((await s.revisar()).recuperados, 0);
  assert.equal(s.mensajes.length, 0);
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

test("las charlas reservadas y las altas que se sacaron porque Cande escribió no son personales: van al resumen", async () => {
  const w = mundo({
    contactos: [
      { id: "70", dueno: "cande", ig_id: "701", ig_usuario: "lead.cande" }, // reservada antes de prender las altas, sin nada guardado
      { id: "72", dueno: "cande", alta_en: hace(900), personal: false }, // un alta sacada (borrarCharla con personal en false): sin su Instagram
    ],
    hilos: [charla(1, DE_CANDE, [["lead", "quiero contratar, cuánto sale de prueba", 40]]), charla(2, OTRO, [["cuenta", "Te escribo yo, de prueba", 200], ["lead", "respuesta de prueba", 50]])],
    perfiles: { 801: perfil("Nombre Otro", "lead.otro") },
    directorio: [{ id: "72", nombre: "Nombre Otro", ig_username: "lead.otro" }],
  });
  await w.revisar();
  const vos = w.resumenes()[0].campos[SECCION_VOS];
  assert.match(vos, /lead\.cande, hace 40 min/);
  assert.match(vos, /lead\.otro, hace 50 min/);
  assert.equal(w.contactos.get("72").ig_id, null, "la borró borrarCharla: la red no le vuelve a poner su Instagram");
});

test("una charla personal o de alguien que Cande sigue no va a Telegram", async () => {
  const w = mundo({
    contactos: [
      { id: "70", dueno: "cande", ig_id: "701", ig_usuario: "lead.cande", personal: true },
      { id: "71", dueno: "cande", ig_id: "801", ig_usuario: "lead.otro" },
      { id: "73", dueno: "cande", ig_id: "602", ig_usuario: "lead.seguido" },
    ],
    hilos: [charla(1, DE_CANDE, [["lead", "mensaje personal de prueba", 40]]), charla(2, OTRO, [["lead", "otro mensaje de prueba", 50]]), charla(3, persona("602", "lead.seguido"), [["lead", "hola de prueba", 45]])],
    perfiles: { 602: perfil("Seguido", "lead.seguido", true) },
    aj: { seguidos: true }, seguidos: ["lead.otro"],
  });
  const r = await w.revisar();
  assert.equal(r.pendientes, 0);
  assert.equal(w.avisos.length, 0);
});

test("la red no le vuelve a poner su Instagram a una charla personal ni a una que borró borrarCharla", async () => {
  const TRES = persona("603", "lead.tres");
  const w = mundo({
    contactos: [
      { id: "70", dueno: "cande", personal: true }, // la borró el agente (no era un lead) o Cande: sin su Instagram
      { id: "72", dueno: "cande", alta_en: hace(900), personal: false }, // un alta sacada porque Cande escribió (borrarCharla con personal en false)
      { id: "74", dueno: "cande", personal: true, ig_usuario: "lead.tres" }, // personal, con el usuario pero sin el id
    ],
    hilos: [charla(1, DE_CANDE, [["lead", "hola de prueba", 40]]), charla(2, OTRO, [["lead", "hola de prueba", 50]]), charla(3, TRES, [["lead", "hola de prueba", 45]])],
    perfiles: { 701: perfil("Nombre Cande", "lead.cande"), 801: perfil("Nombre Otro", "lead.otro"), 603: perfil("Nombre Tres", "lead.tres") },
    directorio: [{ id: "70", nombre: "Nombre Cande", ig_username: "lead.cande" }, { id: "72", nombre: "Nombre Otro", ig_username: "lead.otro" }],
  });
  const r = await w.revisar();
  assert.equal(r.altas, 0);
  assert.deepEqual(["70", "72", "74"].map((id) => w.contactos.get(id).ig_id), [null, null, null]);
  assert.deepEqual(["70", "72", "74"].map((id) => w.contactos.get(id).ig_usuario), [null, null, "lead.tres"]);
  assert.doesNotMatch(w.resumenes()[0]?.campos[SECCION_VOS] || "", /lead\.(cande|tres)/, "las personales no van al resumen");
});

test("una charla de Cande que espera hace menos de 20 minutos todavía no se recuerda: recién le llegó el aviso de la charla", async () => {
  const w = mundo({
    contactos: [{ id: "70", nombre: "Lead de Cande", dueno: "cande", ig_id: "701" }],
    hilos: [charla(1, DE_CANDE, [["lead", "recién escrito de prueba", 10]])],
  });
  assert.equal((await w.revisar()).pendientes, 0);
  assert.equal(w.avisos.length, 0);
});

test("en una charla de Cande, un automático de ManyChat cuenta como respuesta", async () => {
  const w = mundo({
    contactos: [{ id: "70", nombre: "Lead de Cande", dueno: "cande", ig_id: "701" }],
    hilos: [charla(1, DE_CANDE, [["lead", "palabra clave de prueba", 40], ["cuenta", AUTOMATICO, 40]])],
    config: CON_AUTOMATICOS,
  });
  assert.equal((await w.revisar()).pendientes, 0);
});

/* ---------- 4. lo que pasó las 23 horas ---------- */

test("lo que esperó más de 23 horas va al resumen 'solo a mano', una sola vez y la más nueva primero; lo del agente que ya estaba en la base, no", async () => {
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
    perfiles: NUEVO_PERFIL, directorio: NUEVO_EN_MC,
  });
  const r = await w.revisar();
  assert.deepEqual({ altas: r.altas, recuperados: r.recuperados }, { altas: 0, recuperados: 0 }, "el agente ya no llega: no se guarda ni se da de alta");
  assert.equal(w.avisos.length, 1);
  const mano = w.avisos[0].campos[SECCION_MANO];
  assert.match(mano, /Lead del agente, hace 26 h \(el mensaje no le llegó al agente\)/);
  assert.match(mano, /Nombre Nuevo, hace 40 h \(nunca le llegó al agente\).*ig\.me\/m\/lead\.nuevo/);
  assert.doesNotMatch(mano, /Lead con mensaje guardado/, "ese lo avisa el cron de los toques (sinVentana)");
  assert.ok(mano.indexOf("Lead del agente") < mano.indexOf("Nombre Nuevo"), "la más nueva primero");

  // Cuatro horas después siguen sin respuesta: no se vuelven a avisar.
  w.pasar(4 * 60);
  await w.revisar();
  assert.equal(w.avisos.length, 1);
});

test("una charla de Cande que nadie contestó pasa de 'pasadas a vos' a 'solo a mano' cuando cumple 23 horas, aunque ya no esté arriba", async () => {
  const w = mundo({
    contactos: [{ id: "70", nombre: "Lead de Cande", dueno: "cande", ig_id: "701", ig_usuario: "lead.cande" }],
    hilos: [charla(1, DE_CANDE, [["lead", "pregunta de prueba", 40]])],
  });
  await w.revisar();
  assert.match(w.resumenes()[0].campos[SECCION_VOS], /Lead de Cande/);
  // La charla ya no aparece en lo que se lee (quedó muy abajo): lo anotado entre vueltas la sigue teniendo.
  w.hilos = [];
  w.pasar(23 * 60);
  await w.revisar();
  assert.equal(w.resumenes().length, 2);
  assert.match(w.resumenes()[1].campos[SECCION_MANO], /Lead de Cande, hace 24 h/);
  assert.equal(w.resumenes()[1].campos[SECCION_VOS], null);
});

/* ---------- 5. nada que hacer ---------- */

test("nada que hacer: lo último es de la cuenta, o el lead escribió hace menos de 3 minutos (puede estar entrando por el webhook)", async () => {
  const w = mundo({
    contactos: [{ id: "77", ig_id: "501", ig_usuario: "lead.agente" }],
    hilos: [
      charla(1, DEL_AGENTE, [["lead", "hola de prueba", 20], ["cuenta", "Respuesta del agente de prueba", 19]]),
      charla(2, NUEVO, [["lead", "recién de prueba", GRACIA_MS / MIN - 1]]),
    ],
    perfiles: NUEVO_PERFIL, directorio: NUEVO_EN_MC,
  });
  const r = await w.revisar();
  assert.deepEqual(r, { paginas: 1, miradas: 2, recuperados: 0, altas: 0, pendientes: 0, fallas: 0, resumen: false });
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
      const m = { id: w.mensajes.length + 1, contacto: id, quien: "lead", texto, creado: w.ahora, ig_mid: null, guardado_red: null, eco_en: null };
      w.mensajes.push(m);
      c.ultimo_lead = w.ahora;
      return m.id;
    },
    lugarParaAlta: async (id) => (w.contactos.has(id) ? null : 0),
    darDeAlta: async () => null,
  };
  return crearAgente({ base, pedir: async () => { throw new Error("no se usa"); }, manychat: {}, avisar: async () => true, reloj: () => w.ahora });
}

test("si el webhook llega después de que la red guardó el mensaje, la entrada no lo guarda otra vez (no sale una segunda respuesta)", async () => {
  const w = mundo({
    hilos: [charla(1, NUEVO, [["lead", "hola de prueba", 10]]), charla(2, DEL_AGENTE, [["cuenta", "Respuesta del agente de prueba", 30], ["lead", "una foto", 9]])],
    contactos: [{ id: "77", ig_id: "501", ig_usuario: "lead.agente" }],
    perfiles: NUEVO_PERFIL, directorio: NUEVO_EN_MC,
  });
  w.hilos[1].messages.data[0].message = ""; // una foto: Instagram la da sin texto
  const r = await w.revisar();
  assert.deepEqual({ altas: r.altas, recuperados: r.recuperados }, { altas: 1, recuperados: 1 });
  assert.equal(w.delContacto("77").at(-1).texto, SIN_TEXTO);

  const agente = agenteDe(w);
  w.pasar(4); // ManyChat se acordó tarde: la foto la mandó hace 13 minutos
  assert.equal(await agente.recibir("5001", "hola de prueba", "Nombre Nuevo"), null);
  assert.equal(await agente.recibir("77", "https://lookaside.fbsbx.com/ig_messaging_cdn/?asset_id=1"), null, "la foto con link es la misma que guardó la red sin texto");
  assert.equal(w.delContacto("5001").length, 1);
  assert.equal(w.delContacto("77").length, 1);
  // Lo que escribe después sí entra.
  assert.ok(await agente.recibir("5001", "otro mensaje de prueba"));
  assert.equal(w.delContacto("5001").length, 2);
});

/** Una charla del agente donde lo último que mandó el lead es un adjunto (sin texto en Instagram), hace `min` minutos. */
const conAdjunto = (min) => mundo({
  contactos: [{ id: "77", ig_id: "501", ig_usuario: "lead.agente", dueno_desde: hace(600) }],
  mensajes: [{ contacto: "77", quien: "agente", texto: "Respuesta del agente de prueba", creado: hace(60) }],
  hilos: [charla(1, DEL_AGENTE, [["cuenta", "Respuesta del agente de prueba", 60], ["lead", null, min]])],
});

test("un reel compartido que la red guardó sin texto y llega tarde por el webhook con su link es el mismo mensaje: no entra dos veces", async () => {
  const w = conAdjunto(5);
  assert.equal((await w.revisar()).recuperados, 1);
  assert.equal(w.delContacto("77").at(-1).texto, SIN_TEXTO);
  w.pasar(4); // el webhook llega 9 minutos después de que lo mandó, con el link del reel
  assert.equal(await agenteDe(w).recibir("77", "https://www.instagram.com/reel/PRUEBA123/?igsh=prueba"), null);
  assert.equal(w.delContacto("77").filter((m) => m.quien === "lead").length, 1);
});

test("dos adjuntos no son el mismo mensaje por ser adjuntos: la foto que manda después (el comprobante) entra", async () => {
  const w = conAdjunto(9);
  assert.equal((await w.revisar()).recuperados, 1);
  w.pasar(60);
  assert.ok(await agenteDe(w).recibir("77", "https://lookaside.fbsbx.com/ig_messaging_cdn/?asset_id=2"), "una hora después es otra foto");
  assert.equal(w.delContacto("77").filter((m) => m.quien === "lead").length, 2);
  // Un audio que la red guardó hace un rato tampoco absorbe el que llega al día siguiente.
  const d = conAdjunto(9);
  await d.revisar();
  d.pasar(20 * 60);
  assert.ok(await agenteDe(d).recibir("77", SIN_TEXTO));
});

test("si el webhook trae el id del mensaje de Instagram, es la prueba: el mismo id es el eco, otro id es un mensaje nuevo", async () => {
  const w = mundo({
    contactos: [{ id: "77", ig_id: "501", ig_usuario: "lead.agente", dueno_desde: hace(600) }],
    mensajes: [{ contacto: "77", quien: "agente", texto: "Respuesta del agente de prueba", creado: hace(60) }],
    hilos: [charla(1, DEL_AGENTE, [["cuenta", "Respuesta del agente de prueba", 60], ["lead", "Sí, dale!", 8]])],
  });
  assert.equal((await w.revisar()).recuperados, 1);
  const mid = w.delContacto("77").at(-1).ig_mid;
  const agente = agenteDe(w);
  w.pasar(3);
  assert.ok(await agente.recibir("77", "Sí, dale!", null, { mid: `${mid}-otro` }), "el mismo texto con otro id: lo escribió de nuevo");
  assert.equal(await agente.recibir("77", "texto que ManyChat dio distinto", null, { mid }), null, "el mismo id, aunque el texto llegue distinto");
  assert.equal(await agente.recibir("77", "texto que ManyChat dio distinto", null, { mid }), null, "y el reintento de ManyChat de ese pedido");
  assert.equal(w.delContacto("77").filter((m) => m.quien === "lead").length, 2);
});

test("el webhook que llega más de 2 horas tarde, o con el texto apenas distinto, tampoco se guarda dos veces; uno nuevo igual, sí", async () => {
  const w = mundo({
    contactos: [{ id: "77", ig_id: "501", ig_usuario: "lead.agente", dueno_desde: hace(600) }],
    mensajes: [{ contacto: "77", quien: "agente", texto: "Respuesta del agente de prueba", creado: hace(60) }],
    hilos: [charla(1, DEL_AGENTE, [["cuenta", "Respuesta del agente de prueba", 60], ["lead", "Sí, dale!", 8], ["lead", "otra cosa de prueba", 7]])],
  });
  assert.equal((await w.revisar()).recuperados, 2);
  const agente = agenteDe(w);
  w.pasar(2 * 60 + 10);
  assert.equal(await agente.recibir("77", "Sí, dale!"), null, "dos horas y diez minutos tarde");
  assert.equal(await agente.recibir("77", "Sí, dale!"), null, "el reintento de ManyChat de ese mismo pedido, segundos después");
  assert.equal(await agente.recibir("77", "otra cosa de prueba."), null, "el texto apenas distinto");
  assert.equal(w.delContacto("77").filter((m) => m.quien === "lead").length, 2);
  w.pasar(5);
  assert.ok(await agente.recibir("77", "Sí, dale!"), "cada mensaje de la red absorbe un solo pedido: este es nuevo");
  assert.equal(w.delContacto("77").filter((m) => m.quien === "lead").length, 3);
  // Pasadas 24 horas de que lo guardó la red ya no absorbe nada.
  const w2 = mundo({ contactos: [{ id: "77", ig_id: "501" }], hilos: [charla(1, DEL_AGENTE, [["lead", "Sí, dale!", 8]])] });
  await w2.revisar();
  w2.pasar(25 * 60);
  assert.ok(await agenteDe(w2).recibir("77", "Sí, dale!"));
});

test("si el mensaje entró por la entrada mientras tanto, la red no lo guarda: lo reconoce y no hay alta", async () => {
  const w = mundo({ hilos: [charla(1, NUEVO, [["lead", "hola de prueba", 10]])], perfiles: NUEVO_PERFIL, directorio: NUEVO_EN_MC });
  // Llegó por la entrada (con su alta), todavía sin el usuario de Instagram guardado.
  w.contactos.set("5001", { id: "5001", dueno: "agente", ig_id: null, ig_usuario: null, alta_avisada: false, personal: false });
  w.mensajes.push({ id: 1, contacto: "5001", quien: "lead", texto: "hola de prueba", creado: new Date(hace(10).getTime() + 3000), ig_mid: null });
  const r = await w.revisar();
  assert.deepEqual({ altas: r.altas, recuperados: r.recuperados }, { altas: 0, recuperados: 0 });
  assert.equal(w.delContacto("5001").length, 1);
  assert.equal(w.contactos.get("5001").ig_id, "601", "de paso queda su Instagram: la vuelta siguiente ya no lo busca");
});

test("una charla del agente que alguien está contestando (la traba tomada) queda para la vuelta siguiente", async () => {
  const w = mundo({ contactos: [{ id: "77", ig_id: "501", ig_usuario: "lead.agente" }], hilos: [charla(1, DEL_AGENTE, [["lead", "perdido de prueba", 8]])] });
  w.tomado.set("77", "otra corrida");
  assert.equal((await w.revisar()).recuperados, 0);
  assert.equal(w.tomado.get("77"), "otra corrida");
  w.tomado.clear();
  w.pasar(3);
  assert.equal((await w.revisar()).recuperados, 1);
});

/* ---------- 7. lo que no se toca ---------- */

test("a quien sigue Cande no se lo toma ni se lo avisa: por Instagram o por su lista", async () => {
  const w = mundo({
    hilos: [charla(1, NUEVO, [["lead", "hola de prueba", 10]]), charla(2, OTRO, [["lead", "hola de prueba", 10]])],
    perfiles: { 601: perfil("Nombre Nuevo", "lead.nuevo", true), 801: perfil("Nombre Otro", "lead.otro") },
    directorio: [...NUEVO_EN_MC, { id: "5005", nombre: "Nombre Otro", ig_username: "lead.otro" }],
    aj: { seguidos: true }, seguidos: ["lead.otro"],
  });
  const r = await w.revisar();
  assert.deepEqual({ altas: r.altas, pendientes: r.pendientes }, { altas: 0, pendientes: 0 });
  assert.equal(w.contactos.size, 0);
  assert.deepEqual(w.busquedas, [], "ni se lo buscó en ManyChat");
  assert.ok(!w.pedidosIg.includes("/801"), "con la lista alcanza: ni se pidió su perfil");
  // Instagram dijo que lo sigue: la vuelta siguiente no le vuelve a preguntar.
  const pedidos = w.pedidosIg.filter((p) => p === "/601").length;
  w.pasar(3);
  await w.revisar();
  assert.equal(w.pedidosIg.filter((p) => p === "/601").length, pedidos);
});

test("en una charla del agente donde Cande escribió a mano o puso --, no se guarda nada y, si nadie contesta, va al resumen", async () => {
  for (const [suyo, nota] of [["Le escribo yo esto a mano, de prueba", /le escribiste vos/], ["--", /escribiste --/]]) {
    const w = mundo({
      contactos: [{ id: "77", nombre: "Lead del agente", ig_id: "501", ig_usuario: "lead.agente", dueno_desde: hace(600) }],
      hilos: [charla(1, DEL_AGENTE, [["cuenta", suyo, 60], ["lead", "perdido de prueba", 30]])],
    });
    assert.equal((await w.revisar()).recuperados, 0, suyo);
    assert.equal(w.mensajes.length, 0, suyo);
    assert.match(w.resumenes()[0].campos[SECCION_VOS], nota, suyo);
  }
});

test("en una charla retomada donde Cande escribió a mano, lo suyo queda anotado antes que lo del lead y lo del lead se guarda para la espera", async () => {
  // La marca de las charlas viejas que Cande contesta a mano (lib/dm/instagram.js): lo que escribe no saca al agente.
  const pegado = "Texto que Cande pegó cambiado, de prueba";
  const w = mundo({
    contactos: [{ id: "77", nombre: "Lead del agente", ig_id: "501", ig_usuario: "lead.agente", dueno_desde: hace(600), respondido_hasta: 0 }],
    hilos: [charla(1, DEL_AGENTE, [["cuenta", pegado, 60], ["lead", "respuesta de prueba del lead", 30]])],
    config: { retomadas: { 77: { hasta: AHORA.getTime() + 7 * 24 * HORA } } },
  });
  assert.equal((await w.revisar()).recuperados, 1);
  assert.deepEqual(w.delContacto("77").map((m) => [m.quien, m.texto, m.ig_mid]), [["cande", pegado, "m1-0"], ["lead", "respuesta de prueba del lead", "m1-1"]]);
  assert.equal(w.contactos.get("77").dueno, "agente");
  assert.equal(w.contactos.get("77").respondido_hasta, 0, "lo que el lead escribió después de ella queda abierto: lo contesta la espera");
  assert.equal(w.resumenes().length, 0);
  w.pasar(3);
  await w.revisar();
  assert.equal(w.delContacto("77").length, 2, "la vuelta siguiente no anota nada de nuevo");
  // Con la marca vencida antes de que ella escribiera, como siempre: no se guarda nada y va al resumen.
  const vencida = mundo({
    contactos: [{ id: "77", nombre: "Lead del agente", ig_id: "501", ig_usuario: "lead.agente", dueno_desde: hace(600) }],
    hilos: [charla(1, DEL_AGENTE, [["cuenta", pegado, 60], ["lead", "respuesta de prueba del lead", 30]])],
    config: { retomadas: { 77: { hasta: AHORA.getTime() - 90 * MIN } } },
  });
  assert.equal((await vencida.revisar()).recuperados, 0);
  assert.equal(vencida.mensajes.length, 0);
  assert.match(vencida.resumenes()[0].campos[SECCION_VOS], /le escribiste vos/);
});

test("charla retomada: lo que Cande pegó con la marca vigente se anota aunque la red lo vea después de que venció y aunque haya pegado lo mismo en otra charla; la marca sirve una vez", async () => {
  const OTRA = persona("502", "lead.dos");
  const mismo = "Texto de prueba que Cande pegó igual en dos charlas";
  // Pegó hace 3 horas en las dos; la marca venció hace 2 y los leads contestan recién ahora.
  const marcas = () => ({ retomadas: { 77: { hasta: AHORA.getTime() - 120 * MIN }, 78: { hasta: AHORA.getTime() - 120 * MIN } } });
  const contactos = [
    { id: "77", nombre: "Lead del agente", ig_id: "501", ig_usuario: "lead.agente", dueno_desde: hace(600), respondido_hasta: 0 },
    { id: "78", nombre: "Lead dos", ig_id: "502", ig_usuario: "lead.dos", dueno_desde: hace(600), respondido_hasta: 0 },
  ];
  const w = mundo({
    contactos,
    hilos: [
      charla(1, DEL_AGENTE, [["cuenta", mismo, 180], ["lead", "respuesta de prueba del lead", 30]]),
      charla(2, OTRA, [["cuenta", mismo, 181], ["lead", "otra respuesta de prueba", 31]]),
    ],
    config: marcas(),
  });
  assert.equal((await w.revisar()).recuperados, 2);
  for (const id of ["77", "78"]) {
    assert.deepEqual(w.delContacto(id).map((m) => m.quien), ["cande", "lead"], id);
    assert.equal(w.contactos.get(id).dueno, "agente", id);
  }
  assert.equal(w.resumenes().length, 0);
  // Con la marca ya usada, lo que escribe después a mano no se anota: va al resumen, como siempre.
  w.hilos[0] = charla(1, DEL_AGENTE, [
    ["cuenta", mismo, 180], ["lead", "respuesta de prueba del lead", 30], ["cuenta", "Y esto lo escribí yo a mano después", 20], ["lead", "dale de prueba", 10],
  ]);
  w.pasar(30);
  await w.revisar();
  assert.deepEqual(w.delContacto("77").map((m) => m.quien), ["cande", "lead"], "no anota lo nuevo de ella ni lo del lead");
  assert.match(w.resumenes()[0].campos[SECCION_VOS], /le escribiste vos/);
});

test("charla retomada con un \"Perdón\" viejo sembrado: lo que Cande pegó después de marcarla se anota aunque lo contenga; sin la marca, como siempre", async () => {
  const pegado = "Perdón por la demora! Te cuento lo que hablamos, texto de prueba";
  const armar = (config) => mundo({
    contactos: [{ id: "77", nombre: "Lead del agente", ig_id: "501", ig_usuario: "lead.agente", dueno_desde: hace(600), respondido_hasta: 0 }],
    // La historia sembrada: de antes de que se marcara.
    mensajes: [{ contacto: "77", quien: "cande", texto: "Perdón", creado: hace(700) }],
    hilos: [charla(1, DEL_AGENTE, [["cuenta", pegado, 60], ["lead", "respuesta de prueba del lead", 30]])],
    config,
  });
  const w = armar({ retomadas: { 77: { hasta: AHORA.getTime() + 7 * 24 * HORA, marcada: hace(100).getTime() } } });
  assert.equal((await w.revisar()).recuperados, 1);
  assert.deepEqual(w.delContacto("77").map((m) => [m.quien, m.texto]), [["cande", "Perdón"], ["cande", pegado], ["lead", "respuesta de prueba del lead"]]);
  assert.equal(w.contactos.get("77").dueno, "agente");
  assert.equal(w.resumenes().length, 0);
  // Sin la marca, como siempre: lo pegado pasa por conocido (contiene el "Perdón" viejo) y lo del lead se guarda para
  // la espera.
  const sin = armar({});
  assert.equal((await sin.revisar()).recuperados, 1);
  assert.deepEqual(sin.delContacto("77").map((m) => [m.quien, m.texto]), [["cande", "Perdón"], ["lead", "respuesta de prueba del lead"]]);
  assert.equal(sin.resumenes().length, 0);
});

/* ---------- 8. lo que el agente no puede tomar va al resumen ---------- */

test("si no se la encuentra en ManyChat no se contesta sola: va al resumen con su link, y no se la busca en cada vuelta", async () => {
  const w = mundo({
    hilos: [charla(1, NUEVO, [["lead", "hola de prueba", 30]])],
    perfiles: NUEVO_PERFIL,
    directorio: [{ id: "5009", nombre: "Nombre Nuevo", ig_username: "otra.cuenta" }],
  });
  await w.revisar();
  assert.equal(w.contactos.size, 0);
  assert.match(w.avisos[0].campos[SECCION_VOS], /Nombre Nuevo, hace 30 min \(nueva, no entró al agente: no la encontré en ManyChat\).*ig\.me\/m\/lead\.nuevo/);
  const busquedas = w.busquedas.length;
  w.pasar(10);
  await w.revisar();
  assert.equal(w.busquedas.length, busquedas, "no se busca de nuevo en cada vuelta");
  w.pasar(30);
  await w.revisar();
  assert.ok(w.busquedas.length > busquedas, "pasada media hora, se la busca de nuevo");
});

test("si falla el perfil de Instagram no se sabe si Cande la sigue: no hay alta en esa vuelta, y queda anotada", async () => {
  // ManyChat la encuentra igual (por su usuario), pero sin el perfil no se sabe si Cande la sigue.
  const armar = () => mundo({ hilos: [charla(1, NUEVO, [["lead", "hola de prueba", 10]])], directorio: [{ id: "5001", nombre: "lead.nuevo", ig_username: "lead.nuevo" }] });
  const w = armar();
  assert.equal((await w.revisar()).altas, 0);
  assert.equal(w.contactos.size, 0);
  assert.match(w.config.bandeja_estado.pendientes.h1.nota, /perfil/, "si sigue sin poder verse, le llega a Cande en el resumen");
  // La vuelta siguiente Instagram ya lo da y Cande la sigue: ni se toma ni se avisa.
  w.perfiles["601"] = perfil("Nombre Nuevo", "lead.nuevo", true);
  w.pasar(3);
  assert.equal((await w.revisar()).altas, 0);
  assert.equal(w.contactos.size, 0);
  assert.equal(w.config.bandeja_estado.pendientes.h1, undefined);
  // Si no la sigue, entra en la vuelta siguiente.
  const n = armar();
  await n.revisar();
  n.perfiles["601"] = perfil("Nombre Nuevo", "lead.nuevo");
  n.pasar(3);
  assert.equal((await n.revisar()).altas, 1);
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
  const w = mundo({ hilos: [charla(1, NUEVO, [["lead", "hola de prueba", 10]])], perfiles: NUEVO_PERFIL, directorio: NUEVO_EN_MC });
  w.mcCaido = true;
  assert.equal((await w.revisar()).altas, 0);
  w.mcCaido = false;
  w.pasar(3);
  assert.equal((await w.revisar()).altas, 1);
});

test("con el agente apagado, las altas apagadas o el tope de la red lleno no entra nadie nuevo: va al resumen con el motivo", async () => {
  for (const [aj, motivo, altasRedHoy] of [
    [{ modo: "apagado" }, "el agente está apagado", 0], [{ altas: false }, "las altas están apagadas", 0], [{ altas_bandeja_por_dia: 3 }, "se llenó el tope de altas de la red", 3],
  ]) {
    const w = mundo({ hilos: [charla(1, NUEVO, [["lead", "hola de prueba", 30]])], perfiles: NUEVO_PERFIL, directorio: NUEVO_EN_MC, aj });
    w.altasRedHoy = altasRedHoy;
    assert.equal((await w.revisar()).altas, 0, motivo);
    assert.equal(w.contactos.size, 0, motivo);
    assert.match(w.avisos[0].campos[SECCION_VOS], new RegExp(`nueva, no entró al agente: ${motivo}`), motivo);
  }
});

test("la red tiene su propio tope de altas, aparte del de la entrada, y avisa una vez cuando se llena", async () => {
  const gente = [persona("611", "lead.a"), persona("612", "lead.b"), persona("613", "lead.c")];
  const w = mundo({
    hilos: gente.map((p, i) => charla(i + 1, p, [["lead", "hola de prueba", 30 + i]])),
    perfiles: Object.fromEntries(gente.map((p, i) => [p.id, perfil(`Persona${i}`, p.username)])),
    directorio: gente.map((p, i) => ({ id: `50${i}`, nombre: `Persona${i}`, ig_username: p.username })),
    aj: { altas_bandeja_por_dia: 2, altas_por_dia: 1 }, // el de la entrada no frena a la red
  });
  assert.equal((await w.revisar()).altas, 2);
  const tope = w.avisos.filter((a) => /tope de altas de la red/.test(a.titulo));
  assert.equal(tope.length, 1);
  assert.equal(tope[0].campos["Van en 24 horas"], "2 de 2");
  assert.match(w.resumenes()[0].campos[SECCION_VOS], /se llenó el tope de altas de la red/);
});

test("con el agente apagado, el mensaje perdido de una charla suya se guarda igual (como la entrada): el cron de los toques se la pasa a Cande", async () => {
  const w = mundo({ contactos: [{ id: "77", ig_id: "501", ig_usuario: "lead.agente" }], hilos: [charla(1, DEL_AGENTE, [["lead", "perdido de prueba", 8]])], aj: { modo: "apagado" } });
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
  w.pasar(3);
  assert.equal((await w.revisar()).altas, 2);
});

test("si no se pudo poner la etiqueta agente_dm, se reintenta en cada vuelta y a la media hora va al resumen", async () => {
  const w = mundo({ hilos: [charla(1, NUEVO, [["lead", "hola de prueba", 10]])], perfiles: NUEVO_PERFIL, directorio: NUEVO_EN_MC });
  w.etiquetaCaida = true;
  assert.equal((await w.revisar()).altas, 1, "el alta queda igual: lo que ya escribió lo contesta la espera");
  assert.ok(w.config.bandeja_estado.etiquetas["5001"]);
  w.pasar(3);
  await w.revisar();
  assert.equal(w.etiquetas.length, 2, "se reintentó");
  assert.equal(w.resumenes().length, 0);
  w.pasar(30);
  await w.revisar();
  assert.match(w.resumenes()[0].campos[SECCION_ETIQUETA], /ponésela en ManyChat.*Nombre Nuevo/);
  w.etiquetaCaida = false;
  w.pasar(3);
  await w.revisar();
  assert.deepEqual(w.config.bandeja_estado.etiquetas, {}, "cuando sale, se deja de pedir");
});

/* ---------- 9. más allá de las primeras 50 charlas ---------- */

test("una charla debajo de las primeras 50 también se mira: se leen las páginas que hagan falta", async () => {
  const relleno = Array.from({ length: CHARLAS_POR_PAGINA + 5 }, (_, i) => charla(100 + i, persona(`9${i}`, `relleno.${i}`), [["lead", "hola", 20 + i], ["cuenta", "Respuesta de prueba", 19 + i]]));
  const w = mundo({
    contactos: [{ id: "77", ig_id: "501", ig_usuario: "lead.agente" }],
    hilos: [...relleno, charla(1, DEL_AGENTE, [["lead", "perdido de prueba", 300]])],
  });
  const r = await w.revisar();
  assert.equal(r.paginas, 2);
  assert.equal(r.recuperados, 1);
});

test("si la vuelta se corta por tiempo, la siguiente sigue desde la página donde quedó", async () => {
  const relleno = Array.from({ length: 2 * CHARLAS_POR_PAGINA }, (_, i) => charla(100 + i, persona(`9${i}`, `relleno.${i}`), [["lead", "hola", 20 + i], ["cuenta", "Respuesta de prueba", 19 + i]]));
  const w = mundo({
    contactos: [{ id: "77", ig_id: "501", ig_usuario: "lead.agente" }],
    hilos: [...relleno, charla(1, DEL_AGENTE, [["lead", "perdido de prueba", 600]])],
  });
  // Cada página le lleva a Meta 20 segundos: con 40 de margen entra una sola.
  w.alPedir = (ruta) => { if (ruta === "/me/conversations") w.pasar(1 / 3); };
  const r = await w.revisar({ hasta: AHORA.getTime() + 40000 });
  assert.equal(r.paginas, 1);
  assert.equal(r.recuperados, 0);
  assert.ok(w.config.bandeja_paginas.objetivo, "quedó anotado hasta dónde falta mirar");
  w.pasar(3);
  const r2 = await w.revisar();
  assert.equal(r2.recuperados, 1, "la vuelta siguiente llegó hasta abajo");
  assert.equal(w.config.bandeja_paginas.objetivo, null);
});

test("lo que quedó para después por los topes no se pierde aunque tenga más de 25 horas y esté debajo de lo que repasa la red", async () => {
  const n = BUSQUEDAS_POR_VUELTA + 2;
  const viejos = Array.from({ length: n }, (_, i) => persona(`62${i}`, `lead.viejo${i}`));
  // Una página de charlas recientes y otra de hace 26 horas, todas contestadas; debajo, los que escribieron hace 30 horas.
  const contestadas = (desde, min) => Array.from({ length: CHARLAS_POR_PAGINA }, (_, i) =>
    charla(desde + i, persona(`${desde + i}`, `relleno.${desde + i}`), [["lead", "hola", min + i], ["cuenta", "Respuesta de prueba", min + i - 1]]));
  const w = mundo({
    hilos: [...contestadas(1000, 20), ...contestadas(2000, 26 * 60), ...viejos.map((p, i) => charla(i + 1, p, [["lead", "hola de prueba", 30 * 60 + i]]))],
    perfiles: Object.fromEntries(viejos.map((p, i) => [p.id, perfil(`Persona${i}`, p.username)])),
    directorio: viejos.map((p, i) => ({ id: `50${i}`, nombre: `Persona${i}`, ig_username: p.username })),
  });
  const anotadas = () => viejos.filter((_, i) => w.config.bandeja_estado.pendientes[`h${i + 1}`]).length;
  await w.revisar(); // la primera vez se lee toda la semana: las búsquedas en ManyChat se acaban antes de los dos últimos
  assert.equal(anotadas(), BUSQUEDAS_POR_VUELTA);
  for (let i = 0; i < 20; i++) { // una hora de vueltas, con su repaso de las últimas 25 horas
    w.pasar(3);
    await w.revisar();
  }
  assert.equal(anotadas(), n, "los que quedaron para después también llegan a Cande");
  assert.match(w.config.bandeja_estado.pendientes.h8.nota, /nunca le llegó al agente/);
});

test("después de la primera vez, cada vuelta lee solo lo movido desde la anterior, y cada media hora repasa las últimas 25 horas", async () => {
  const relleno = Array.from({ length: CHARLAS_POR_PAGINA + 5 }, (_, i) => charla(100 + i, persona(`9${i}`, `relleno.${i}`), [["lead", "hola", 60 + i], ["cuenta", "Respuesta de prueba", 59 + i]]));
  const w = mundo({ hilos: relleno });
  assert.equal((await w.revisar()).paginas, 2, "la primera vez, todo");
  w.pasar(3);
  assert.equal((await w.revisar()).paginas, 1, "después, lo de arriba");
  w.pasar(30);
  assert.equal((await w.revisar()).paginas, 2, "a la media hora, el repaso");
});

/* ---------- 10. si algo falla ---------- */

test("una charla que falla (Instagram que limita al leerla) no frena a las demás ni al resumen", async () => {
  const rota = charla(2, OTRO, [["lead", "no se puede leer", 50]]);
  delete rota.messages.data[0].from; // sin el detalle: hay que pedirlo, y Instagram contesta que vaya más despacio
  const w = mundo({
    contactos: [{ id: "70", nombre: "Lead de Cande", dueno: "cande", ig_id: "701", ig_usuario: "lead.cande" }],
    hilos: [rota, charla(1, DE_CANDE, [["lead", "pregunta de prueba", 40]])],
    perfiles: { 701: perfil("Lead de Cande", "lead.cande") },
  });
  const errores = [];
  const r = await w.revisar({ registrar: (e) => errores.push(e) });
  assert.equal(r.fallas, 1);
  assert.deepEqual(errores.map((e) => e.code), [4]);
  assert.equal(r.resumen, true);
  assert.match(w.resumenes()[0].campos[SECCION_VOS], /Lead de Cande/);
});

test("si la red no logra una vuelta entera en media hora, se avisa una vez por caída", async () => {
  const w = mundo();
  const vigilar = () => vigilarRed({ base: w.base, avisar: w.avisar, error: new Error("la base de prueba no contesta"), ahora: () => w.ahora });
  assert.equal(await vigilar(), false, "la primera falla solo anota desde cuándo");
  w.pasar(20);
  assert.equal(await vigilar(), false);
  w.pasar(15);
  assert.equal(await vigilar(), true);
  assert.equal(w.avisos[0].titulo, "DM: la red de la bandeja no anda");
  assert.match(w.avisos[0].campos.Motivo, /la base de prueba no contesta/);
  w.pasar(60);
  assert.equal(await vigilar(), false, "una sola vez por caída");
  // Vuelve a andar, y se cae de nuevo: se avisa otra vez.
  await w.revisar();
  w.pasar(40);
  assert.equal(await vigilar(), true);
  assert.equal(w.avisos.length, 2);
});

test("una vuelta que Vercel corta por tiempo no llega a avisar: lo ve la vuelta siguiente al empezar", async () => {
  const w = mundo();
  const alEmpezar = () => vigilarRed({ base: w.base, avisar: w.avisar, alEmpezar: true, ahora: () => w.ahora });
  assert.equal(await alEmpezar(), false);
  await w.revisar(); // entera
  for (let i = 0; i < 10; i++) {
    w.pasar(3);
    assert.equal(await alEmpezar(), false, "la anterior terminó");
    await w.revisar();
  }
  // La red estuvo apagada dos horas (el ajuste "bandeja"): al volver no es una caída.
  w.pasar(120);
  assert.equal(await alEmpezar(), false);
  await w.revisar();
  // Desde acá cada vuelta empieza y se corta sin terminar.
  w.pasar(3);
  assert.equal(await alEmpezar(), false);
  let avisos = 0;
  for (let i = 0; i < 15; i++) {
    w.pasar(3);
    if (await alEmpezar()) avisos++;
  }
  assert.equal(avisos, 1, "una vez, a la media hora");
  assert.match(w.avisos[0].campos.Motivo, /se cortan por tiempo/);
});

/* ---------- 11. el resumen ---------- */

test("el resumen sale una vez cada 3 horas como mucho, y solo si trae algo nuevo", async () => {
  const w = mundo({
    contactos: [
      { id: "70", nombre: "Lead de Cande", dueno: "cande", ig_id: "701", ig_usuario: "lead.cande" },
      { id: "71", nombre: "Otro de Cande", dueno: "cande", ig_id: "801", ig_usuario: "lead.otro" },
    ],
    hilos: [charla(1, DE_CANDE, [["lead", "pregunta de prueba", 40]])],
  });
  await w.revisar();
  assert.equal(w.avisos.length, 1);

  // Una hora después aparece otra: todavía no pasaron 3 horas.
  w.pasar(60);
  w.hilos.push(charla(2, OTRO, [["lead", "otra pregunta de prueba", -60]]));
  await w.revisar();
  assert.equal(w.avisos.length, 1);

  // A las 3 horas sale, con las dos: primero la nueva.
  w.ahora = new Date(AHORA.getTime() + RESUMEN_CADA_MS + MIN);
  await w.revisar();
  assert.equal(w.avisos.length, 2);
  assert.match(w.avisos[1].campos[SECCION_VOS], /Otro de Cande[\s\S]*Lead de Cande/);

  // Tres horas más, sin nada nuevo: no sale.
  w.ahora = new Date(AHORA.getTime() + 2 * RESUMEN_CADA_MS + 2 * MIN);
  await w.revisar();
  assert.equal(w.avisos.length, 2);
});

test("si el resumen no sale (Telegram caído), se intenta de nuevo la vuelta siguiente", async () => {
  const w = mundo({
    contactos: [{ id: "70", nombre: "Lead de Cande", dueno: "cande", ig_id: "701" }],
    hilos: [charla(1, DE_CANDE, [["lead", "pregunta de prueba", 40]])],
  });
  let sale = false;
  w.avisar = async (titulo, campos) => { w.avisos.push({ titulo, campos }); return sale; };
  assert.equal((await w.revisar()).resumen, false);
  sale = true;
  w.pasar(3);
  assert.equal((await w.revisar()).resumen, true);
  assert.equal(w.avisos.length, 2);
});

const pendiente = (i, min, extra = {}) => ({
  hilo: `h${i}`, mid: `m${i}`, igsid: `6${i}`, creado: hace(min).toISOString(), nombre: `Persona ${i}`, usuario: `lead.p${i}`, texto: "texto de prueba", ...extra,
});

test("lo que pasa de 10 por sección no se da por avisado: sale en el resumen siguiente; en 'solo a mano', la más nueva primero", () => {
  const items = Array.from({ length: 14 }, (_, i) => pendiente(i, (24 + i) * 60));
  const r = armarResumen(items, { ahora: AHORA, estado: null });
  assert.equal(r.mandar, true);
  const mano = r.campos[SECCION_MANO];
  assert.match(mano, /^\n• Persona 0, hace 24 h/, "la más nueva primero");
  assert.match(mano, /y 4 más \(van en el próximo resumen\)$/);
  assert.doesNotMatch(mano, /Persona 1[0-3],/);
  const r2 = armarResumen(items, { ahora: new Date(AHORA.getTime() + RESUMEN_CADA_MS), estado: r.estado });
  assert.equal(r2.mandar, true, "las 4 que no se mostraron son nuevas");
  for (const i of [10, 11, 12, 13]) assert.match(r2.campos[SECCION_MANO], new RegExp(`Persona ${i},`));
  assert.doesNotMatch(r2.campos[SECCION_MANO], /Persona [0-9],/);

  // En 'pasadas a vos', lo nuevo va antes que lo que ya salió: lo viejo no lo tapa.
  const viejas = Array.from({ length: 10 }, (_, i) => pendiente(i, 300 + i));
  const r3 = armarResumen(viejas, { ahora: AHORA, estado: null });
  const nueva = pendiente(99, 25);
  const r4 = armarResumen([...viejas, nueva], { ahora: new Date(AHORA.getTime() + RESUMEN_CADA_MS), estado: r3.estado });
  assert.equal(Object.keys(r3.estado.avisadas).length, 10);
  assert.match(r4.campos[SECCION_VOS], /^\n• Persona 99,/);
  assert.match(r4.campos[SECCION_VOS], /y 1 más/);
});

test("el resumen entra en un mensaje de Telegram: menos renglones si hace falta, y lo que no entró queda para el siguiente", () => {
  const largo = (i, min) => pendiente(i, min, { nombre: "N".repeat(80), texto: "x".repeat(500), nota: "nueva, no entró al agente: hay más de un contacto con ese usuario en ManyChat" });
  const items = [...Array.from({ length: 12 }, (_, i) => largo(i, 30 + i)), ...Array.from({ length: 12 }, (_, i) => largo(50 + i, (24 + i) * 60))];
  const r = armarResumen(items, { ahora: AHORA, estado: null });
  assert.equal(r.mandar, true);
  assert.ok(largoVisible(r.titulo, r.campos) <= LARGO_AVISO, `entra: ${largoVisible(r.titulo, r.campos)}`);
  assert.ok(r.mostradas.length < 20);
  const avisadas = Object.keys(r.estado.avisadas).length;
  assert.equal(avisadas, r.mostradas.length, "solo lo que se mostró cuenta como avisado");
});

test("hace cuánto, en minutos, horas o días", () => {
  assert.equal(haceCuanto(30 * 1000), "1 min");
  assert.equal(haceCuanto(40 * MIN), "40 min");
  assert.equal(haceCuanto(26 * HORA), "26 h");
  assert.equal(haceCuanto(4 * 24 * HORA), "4 días");
});

test("un texto de la cuenta es conocido si es igual, o si comparte 30 letras del principio o del final; un automático, solo si está cargado", () => {
  const a = "holanombregraciasporescribirestemensajefijodepruebasalesolo";
  assert.ok(esConocida(a, [a]));
  assert.ok(esConocida(a, ["holaotronombregraciasporescribirestemensajefijodepruebasalesolo"]));
  assert.ok(!esConocida("estolohiceyoamano", ["holaotronombregraciasporescribirestemensajefijodepruebasalesolo"]));
  assert.deepEqual(sinRespuesta({ mensajes: [{ de: null }] }, { user_id: "900", username: "x" }), []);
  assert.ok(esAutomatico("Hola Nombre! Gracias por escribir, este mensaje fijo de prueba sale solo", [a]));
  assert.ok(!esAutomatico("Sí", [a]));
  assert.ok(!esAutomatico("Cande aquí, gracias por escribir este mensaje fijo de prueba sale solo", ["candeaquigraciasporescribirestemensajefijodepruebasalesolo2"]));
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

test("las consultas de la red: guardar solo en charlas del agente, sin repetir, con su propio tope, y un eco por mensaje", async () => {
  const src = await readFile(new URL("../lib/dm/base.js", import.meta.url), "utf8");
  const cuerpo = (nombre) => {
    const i = src.indexOf(`export async function ${nombre}`);
    assert.ok(i > -1, `falta ${nombre}`);
    return src.slice(i, src.indexOf("\n}\n", i));
  };
  assert.match(src, /CREATE UNIQUE INDEX IF NOT EXISTS dm_mensajes_ig_mid_idx ON dm_mensajes \(ig_mid\) WHERE ig_mid IS NOT NULL/);
  assert.match(src, /SET personal = \(c\.dueno = 'cande' AND c\.alta_en IS NOT NULL AND NOT EXISTS/, "las que ya existían: personal es un alta borrada");
  const anotar = cuerpo("anotarDesdeBandeja");
  assert.match(anotar, /WHERE id = \$\{id\} AND dueno = 'agente'/);
  assert.match(anotar, /ON CONFLICT DO NOTHING/);
  assert.match(anotar, /guardado_red/);
  assert.equal((anotar.match(/EXISTS \(SELECT 1 FROM n\)/g) || []).length, 2, "la ventana, los toques y lo pendiente cambian solo si guardó algo");
  const alta = cuerpo("darDeAltaDesdeBandeja");
  assert.match(alta, /ON CONFLICT \(id\) DO NOTHING/);
  assert.match(alta, /alta_por = 'bandeja'\),/, "cuenta solo las altas de la red");
  assert.match(alta, /hoy\.n < \$\{tope\}::int/);
  assert.match(alta, /alta_avisada/);
  assert.match(cuerpo("lugarParaAlta"), /alta_por IS NULL/, "la entrada cuenta solo las suyas");
  assert.match(cuerpo("darDeAlta"), /alta_por IS NULL/);
  assert.match(cuerpo("guardadosPorLaRed"), /ig_mid IS NOT NULL AND guardado_red > NOW\(\) - INTERVAL '24 hours'/);
  assert.match(cuerpo("guardadosPorLaRed"), /SELECT id, texto, creado, ig_mid, eco_en/, "el eco de un adjunto se reconoce por la hora en que lo mandó");
  assert.match(cuerpo("guardarIg"), /\$\{soloDelAgente\}::boolean = false OR \(dueno = 'agente' AND personal IS NOT TRUE\)/, "nunca en una personal o borrada");
  assert.match(cuerpo("enviadosEnLaCharla"), /quien IN \('agente', 'cande'\)/, "lo del agente y de Cande, sin los automáticos");
  assert.doesNotMatch(cuerpo("enviadosEnLaCharla"), /automatico/);
  assert.match(cuerpo("marcarEco"), /WHERE id = \$\{idMensaje\} AND eco_en IS NULL/);
  assert.match(cuerpo("salidaSinLlegar"), /estado = 'enviada' AND accion <> 'callar' AND jsonb_array_length\(mensajes\) > 0/);
  assert.match(cuerpo("borrarCharla"), /personal = EXCLUDED\.personal/);
});

test("los ajustes de la red de la bandeja: prendida de fábrica, y su tope de altas aparte", async () => {
  const { validarAjustes, AJUSTES_POR_DEFECTO } = await import("../lib/dm/base.js");
  assert.equal(AJUSTES_POR_DEFECTO.bandeja, true);
  assert.equal(validarAjustes({ bandeja: "no" }).ok, false);
  assert.equal(validarAjustes({ bandeja: false }).ok, true);
  assert.equal(AJUSTES_POR_DEFECTO.altas_bandeja_por_dia, 10);
  assert.equal(validarAjustes({ altas_bandeja_por_dia: 0 }).ok, false);
  assert.equal(validarAjustes({ altas_bandeja_por_dia: 15 }).ok, true);
});

/* ---------- tercera revisión de las charlas retomadas (21/10) ---------- */

// Las pruebas que empiezan con "como en main" pasan también con el código de origin/main (se corrieron contra una copia
// de origin/main con este mismo archivo).

test("como en main: si la base no deja leer la marca de retomada, lo que Cande escribió a mano en una charla del agente va al resumen y no se guarda nada", async () => {
  const pegado = "Texto que Cande pegó cambiado, de prueba";
  const w = mundo({
    contactos: [{ id: "77", nombre: "Lead del agente", ig_id: "501", ig_usuario: "lead.agente", dueno_desde: hace(600), respondido_hasta: 0 }],
    hilos: [charla(1, DEL_AGENTE, [["cuenta", pegado, 60], ["lead", "respuesta de prueba del lead", 30]])],
    config: { retomadas: { 77: { hasta: AHORA.getTime() + 7 * 24 * HORA } } },
  });
  const leer = w.base.leerConfig;
  w.base.leerConfig = async (k) => {
    if (k === "retomadas") throw new Error("base caída de prueba");
    return leer(k);
  };
  const r = await w.revisar();
  assert.equal(r.recuperados, 0);
  assert.equal(r.fallas, 0, "no es una charla que falla: es lo de siempre");
  assert.equal(w.mensajes.length, 0);
  assert.equal(w.contactos.get("77").dueno, "agente");
  assert.match(w.resumenes()[0].campos[SECCION_VOS], /le escribiste vos/);
});
