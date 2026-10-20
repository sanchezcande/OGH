// La lectura directa de Instagram del agente de DM (lib/dm/instagram.js): el token y su renovación,
// cómo se lee una charla, el "--" de Cande y si lo sigue, con un Instagram y un ManyChat de mentira.
// Ninguna prueba sale a la red. Los usuarios, ids y textos son inventados (este repo es público).
//
// Lo que NO cubren: que Instagram de verdad conteste así. Las rutas y campos salen de su
// documentación; lo que no está documentado (los mensajes anidados en la charla, que from.id sea el
// user_id de /me, que un lead sin rol en la app se pueda leer) se prueba con el token real usando
// config { accion: "instagram", contacto } antes de prender el ajuste.
//
// Correr:  node --test tests/*.test.mjs
import "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const {
  fechaDe, leerHilo, esDeLaCuenta, codigoEnHilo, desdeDe, crearInstagram, crearReglasInstagram, buscarCodigos, explicarError,
  ErrorInstagram, usuarioIg, manualEnHilo, desdeManual, manualesEnHilo, esRetomada, CLAVE_RETOMADAS, NO_AHORA, paraPegar,
  marcaDe, seAnotaComoRetomada, conLaMarca, escritoConLaMarca,
} = await import("../lib/dm/instagram.js");

const AHORA = new Date("2026-10-18T15:00:00Z");
const CUENTA = { user_id: "900", username: "cuenta.prueba" };
const ISO = (d) => d.toISOString().replace(/\.\d{3}Z$/, "+0000");
const hace = (min) => new Date(AHORA.getTime() - min * 60000);

/** Un mensaje como lo devuelve Instagram. De la cuenta si `deCuenta`; si no, de la otra persona. */
const msj = (id, texto, { deCuenta = false, min = 1, otro = { id: "501", username: "lead.prueba" } } = {}) => {
  const yo = { id: CUENTA.user_id, username: CUENTA.username };
  return { id: `m${id}`, created_time: ISO(hace(min)), from: deCuenta ? yo : otro, to: { data: [deCuenta ? otro : yo] }, message: texto };
};
const hiloCrudo = (id, mensajes, min = 1) => ({ id: `h${id}`, updated_time: ISO(hace(min)), messages: { data: mensajes } });

/** Un config en memoria (lo de dm_config). */
const configFalso = (inicial = {}) => {
  const datos = { ...inicial };
  return { datos, leerConfig: async (k) => datos[k] ?? null, guardarConfig: async (k, v) => { datos[k] = v; } };
};

/**
 * Un Instagram de mentira: `rutas` decide qué contesta según la ruta y los parámetros. Anota cada
 * pedido (sin el token) y el token con que llegó.
 */
function instagramFalso(rutas) {
  const pedidos = [];
  const pedir = async (url) => {
    const u = new URL(url);
    const params = Object.fromEntries(u.searchParams);
    pedidos.push({ ruta: u.pathname.replace(/^\/v\d+\.\d+/, ""), params, token: params.access_token });
    const r = await rutas(u.pathname.replace(/^\/v\d+\.\d+/, ""), params);
    const status = r?.__status || (r?.error ? 400 : 200);
    return { ok: status < 300, status, json: async () => r };
  };
  return { pedir, pedidos };
}

const rutasDeSiempre = (extra = {}) => async (ruta, p) => {
  if (ruta === "/me") return { user_id: CUENTA.user_id, username: CUENTA.username };
  if (extra[ruta]) return extra[ruta](p);
  return { error: { message: `ruta de prueba desconocida ${ruta}`, code: 100 } };
};

/* ---------- lo que no habla con nadie ---------- */

test("las fechas de Instagram se leen con +0000, con dos puntos o en segundos", () => {
  assert.equal(fechaDe("2026-10-18T12:00:00+0000").toISOString(), "2026-10-18T12:00:00.000Z");
  assert.equal(fechaDe("2026-10-18T09:00:00-0300").toISOString(), "2026-10-18T12:00:00.000Z");
  assert.equal(fechaDe("2026-10-18T12:00:00Z").toISOString(), "2026-10-18T12:00:00.000Z");
  assert.equal(fechaDe(1792411200).toISOString(), new Date(1792411200 * 1000).toISOString());
  assert.equal(fechaDe(""), null);
  assert.equal(fechaDe("cualquier cosa"), null);
});

test("de una charla sale quién es la otra persona, mire quien mire el primer mensaje", () => {
  const h = leerHilo(hiloCrudo(1, [msj(2, "hola", { deCuenta: true }), msj(1, "buenas")]), CUENTA);
  assert.deepEqual(h.otro, { id: "501", usuario: "lead.prueba" });
  assert.equal(h.mensajes.length, 2);
  assert.equal(h.mensajes[0].texto, "hola");
  assert.equal(leerHilo(hiloCrudo(2, []), CUENTA).otro, null);
});

test("lo escrito por la cuenta se reconoce por id y, si el id no coincide, por usuario", () => {
  assert.equal(esDeLaCuenta({ id: "900", usuario: "" }, CUENTA), true);
  assert.equal(esDeLaCuenta({ id: "123", usuario: "cuenta.prueba" }, CUENTA), true);
  assert.equal(esDeLaCuenta({ id: "501", usuario: "lead.prueba" }, CUENTA), false);
  assert.equal(esDeLaCuenta({ id: "", usuario: "" }, CUENTA), false);
  assert.equal(usuarioIg(" @Lead.Prueba "), "lead.prueba");
});

test("el -- cuenta si lo escribió Cande después de que la charla pasó a quien la tiene; el del lead o uno viejo, no", () => {
  const h = (mensajes) => leerHilo(hiloCrudo(1, mensajes), CUENTA);
  assert.ok(codigoEnHilo(h([msj(1, "--", { deCuenta: true, min: 3 })]), CUENTA, hace(10)));
  assert.ok(codigoEnHilo(h([msj(1, " — ", { deCuenta: true, min: 3 })]), CUENTA, hace(10)), "el guion que pone el corrector del teléfono");
  assert.ok(codigoEnHilo(h([msj(1, "/yo", { deCuenta: true, min: 3 })]), CUENTA, null));
  assert.equal(codigoEnHilo(h([msj(1, "--")]), CUENTA, null), null, "lo escribió el lead");
  assert.equal(codigoEnHilo(h([msj(1, "-- hola", { deCuenta: true })]), CUENTA, null), null, "no es el código solo");
  assert.equal(codigoEnHilo(h([msj(1, "--", { deCuenta: true, min: 30 })]), CUENTA, hace(10)), null, "es de antes de que volviera al agente");
});

test("desde cuándo cuenta un --: desde que la charla es de quien es; en un alta sin confirmar, siempre", () => {
  assert.equal(desdeDe({ alta_avisada: false, dueno_desde: hace(5) }), null);
  assert.deepEqual(desdeDe({ alta_avisada: true, dueno_desde: hace(5) }), hace(5));
  assert.equal(desdeDe({ alta_avisada: true, dueno_desde: null }), null);
});

test("cada error de Instagram se le explica a Cande con lo que tiene que hacer", () => {
  assert.match(explicarError(new ErrorInstagram("x", { code: 190 })), /venció.*INSTAGRAM_TOKEN/);
  assert.match(explicarError(new ErrorInstagram("sin permiso", { code: 10 })), /permiso/);
  assert.match(explicarError(new ErrorInstagram("despacio", { code: 4 })), /más despacio/);
  assert.equal(explicarError(new Error("otra cosa")), "otra cosa");
});

/* ---------- el cliente ---------- */

test("sin token no hay pedidos; con token, vale el renovado solo si salió del token que está en Vercel", async () => {
  const { pedir, pedidos } = instagramFalso(rutasDeSiempre());
  const sin = crearInstagram({ pedir, ...configFalso(), tokenEnv: () => "" });
  assert.equal(await sin.token(), null);
  await assert.rejects(sin.cuenta(), /falta INSTAGRAM_TOKEN/);
  assert.equal(pedidos.length, 0);

  const cfg = configFalso();
  const ig = crearInstagram({ pedir, ...cfg, tokenEnv: () => "token-vercel", reloj: () => AHORA });
  assert.equal(await ig.token(), "token-vercel");
  await cfg.guardarConfig("instagram_token", { de: "otra-huella", token: "token-viejo" });
  assert.equal(await ig.token(), "token-vercel", "si Cande pegó un token nuevo en Vercel, manda ese");
});

test("la renovación: una vez por semana, guarda el token nuevo y su vencimiento, y si falla prueba al día siguiente", async () => {
  let falla = false;
  const { pedir, pedidos } = instagramFalso(async (ruta, p) => {
    if (ruta !== "/refresh_access_token") return { error: { message: "ruta", code: 100 } };
    if (falla) return { error: { message: `Error validating access_token=${p.access_token}`, code: 190 } };
    return { access_token: `renovado-de-${p.access_token}`, token_type: "bearer", expires_in: 5184000 };
  });
  let ahora = AHORA;
  const cfg = configFalso();
  const ig = crearInstagram({ pedir, ...cfg, tokenEnv: () => "token-vercel", reloj: () => ahora });

  assert.equal((await ig.renovar()).hecho, "renovado");
  assert.equal(pedidos[0].params.grant_type, "ig_refresh_token");
  assert.equal(await ig.token(), "renovado-de-token-vercel");
  assert.equal(await ig.diasQueQuedan(), 60);

  ahora = new Date(AHORA.getTime() + 3 * 86400000);
  assert.equal((await ig.renovar()).hecho, "no toca");
  ahora = new Date(AHORA.getTime() + 8 * 86400000);
  falla = true;
  const r = await ig.renovar();
  assert.equal(r.hecho, "falló");
  assert.equal(r.error.code, 190);
  assert.doesNotMatch(r.error.message, /renovado-de/, "el token no queda en el mensaje de error");
  assert.equal(await ig.token(), "renovado-de-token-vercel", "si falla, el último que anduvo sigue valiendo");
  ahora = new Date(ahora.getTime() + 3600000);
  assert.equal((await ig.renovar()).hecho, "no toca");
  ahora = new Date(ahora.getTime() + 86400000);
  falla = false;
  assert.equal((await ig.renovar()).hecho, "renovado");
  assert.equal(await ig.token(), "renovado-de-renovado-de-token-vercel");
});

test("la cuenta de Cande se pide una vez y queda guardada", async () => {
  const { pedir, pedidos } = instagramFalso(rutasDeSiempre());
  const cfg = configFalso();
  const ig = crearInstagram({ pedir, ...cfg, tokenEnv: () => "t" });
  assert.deepEqual(await ig.cuenta(), { ...CUENTA, de: cfg.datos.instagram_cuenta.de });
  await ig.cuenta();
  const otra = crearInstagram({ pedir, ...cfg, tokenEnv: () => "t" }); // otra instancia de la función
  await otra.cuenta();
  assert.equal(pedidos.filter((p) => p.ruta === "/me").length, 1);
});

test("la bandeja: si Instagram no trae los mensajes adentro de la charla, se pide el detalle, y solo los que hacen falta", async () => {
  const detalle = { m1: msj(1, "--", { deCuenta: true }), m2: msj(2, "hola"), m3: msj(3, "otra") };
  const { pedir, pedidos } = instagramFalso(rutasDeSiempre({
    "/me/conversations": () => ({ data: [{ id: "h1", updated_time: ISO(hace(1)), messages: { data: [
      { id: "m1", created_time: ISO(hace(1)) }, { id: "m2", created_time: ISO(hace(2)) }, { id: "m3", created_time: ISO(hace(3)) },
    ] } }] }),
    "/m1": () => detalle.m1, "/m2": () => detalle.m2, "/m3": () => ({ error: { message: "mensaje viejo", code: 100 } }),
  }));
  const ig = crearInstagram({ pedir, ...configFalso(), tokenEnv: () => "t" });
  const [h] = await ig.hilos();
  assert.equal(h.otro, null);
  const uno = await ig.completo(h, 1);
  assert.deepEqual(uno.otro, { id: "501", usuario: "lead.prueba" });
  assert.equal(pedidos.filter((p) => /^\/m\d$/.test(p.ruta)).length, 1);
  const todo = await ig.completo(h);
  assert.equal(todo.mensajes.filter((m) => m.texto != null).length, 2, "el que no se puede leer queda sin texto");
  assert.ok(codigoEnHilo(todo, CUENTA, null));
});

test("si los mensajes vienen adentro de la charla, no se pide nada más", async () => {
  const { pedir, pedidos } = instagramFalso(rutasDeSiempre({
    "/me/conversations": (p) => ({ data: [hiloCrudo(p.user_id || 1, [msj(1, "--", { deCuenta: true }), msj(2, "hola")])] }),
  }));
  const ig = crearInstagram({ pedir, ...configFalso(), tokenEnv: () => "t" });
  const h = await ig.hiloDe("501");
  assert.equal(pedidos.at(-1).params.user_id, "501");
  assert.equal(pedidos.at(-1).params.platform, "instagram");
  assert.ok(codigoEnHilo(h, CUENTA, null));
  assert.equal(pedidos.filter((p) => /^\/m\d$/.test(p.ruta)).length, 0);
});

/* ---------- las reglas ---------- */

/** Base, ManyChat y avisos de mentira para las reglas. */
function mundoReglas({ contacto = {}, manychat = { ok: true, ig_username: "Lead.Prueba", ig_id: null }, rutas = {}, ahora = () => AHORA } = {}) {
  const m = {
    contacto: {
      id: "77", dueno: "agente", alta_avisada: true, dueno_desde: hace(60), ig_usuario: null, ig_id: null, ig_id_mc: null,
      entregada: false, ...contacto,
    },
    guardados: [], avisos: [], campos: [], notas: [], borrada: false, descartados: 0, pedidosManyChat: 0, tomado: null,
  };
  const cfg = configFalso();
  const base = {
    ...cfg,
    guardarIg: async (id, { usuario = null, igId = null, igIdMc = null }) => {
      m.guardados.push({ usuario, igId, igIdMc });
      if (usuario !== null) m.contacto.ig_usuario = usuario;
      if (igId !== null) m.contacto.ig_id = igId;
      if (igIdMc !== null) m.contacto.ig_id_mc = igIdMc;
    },
    // Como la consulta: por id, o por usuario si todavía no tiene id.
    contactoDeIg: async ({ igId, usuario }) =>
      (m.contacto.ig_id && m.contacto.ig_id === igId) || (!m.contacto.ig_id && m.contacto.ig_usuario && m.contacto.ig_usuario === usuario)
        ? { ...m.contacto } : null,
    seguidos: new Set(),
    // Lo de la cuenta en la base: un texto suelto es de antes de todo (lo sembrado, lo viejo); { texto, creado }, con su
    // hora. Como la consulta: con `desde`, solo lo que se escribió después de esa hora.
    conocidos: [],
    textosDeLaCuenta: async (id, { desde = null } = {}) => base.conocidos
      .filter((x) => !desde || (typeof x === "object" && new Date(x.creado) > desde))
      .map((x) => (typeof x === "object" ? x.texto : x)),
    loSigue: async (u) => base.seguidos.has(u),
    anotarSeguidos: async (us) => { us.forEach((u) => base.seguidos.add(u)); return base.seguidos.size; },
    tomar: async (id, marca) => (m.tomado || m.contacto.dueno !== "agente" ? null : ((m.tomado = marca), { ...m.contacto })),
    soltar: async (id, marca) => { if (m.tomado === marca) m.tomado = null; },
    descartarPendientes: async () => { m.descartados++; },
    borrarCharla: async () => { m.borrada = true; m.contacto.dueno = "cande"; },
    ponerDueno: async (id, d) => { m.contacto.dueno = d; },
    anotar: async (id, quien, texto) => { m.notas.push({ quien, texto }); },
    // Como la consulta (lib/dm/base.js): una vez por id de Instagram, y solo en una charla del agente. Lo anotado ya
    // es de la cuenta (textosDeLaCuenta lo trae), y la marca de retomada queda usada hasta lo último que se anotó (si
    // ya estaba usada, queda como estaba).
    anotadasCande: [],
    anotarCandeDesdeIg: async (id, lista) => {
      if (m.contacto.dueno !== "agente") return 0;
      const nuevas = lista.filter((x) => !base.anotadasCande.some((y) => y.mid === x.mid));
      base.anotadasCande.push(...nuevas);
      base.conocidos = [...base.conocidos, ...nuevas.map((x) => ({ texto: x.texto, creado: x.creado }))];
      const marcas = cfg.datos[CLAVE_RETOMADAS];
      if (nuevas.length && marcas?.[id] && marcas[id].usada == null) {
        marcas[id] = { ...marcas[id], usada: Math.max(...nuevas.map((x) => new Date(x.creado).getTime())) };
      }
      return nuevas.length;
    },
  };
  const mc = {
    datosDe: async () => { m.pedidosManyChat++; return manychat; },
    ponerCampo: async (id, campo, valor) => { m.campos.push([campo, valor]); return { ok: true }; },
  };
  const falso = instagramFalso(rutasDeSiempre(rutas));
  const ig = crearInstagram({ pedir: falso.pedir, ...cfg, tokenEnv: () => "t", reloj: ahora });
  const reglas = crearReglasInstagram({
    ig, base, manychat: mc, reloj: ahora, avisar: async (titulo, campos) => { m.avisos.push({ titulo, campos }); return true; },
  });
  return { m, ig, base, reglas, pedidos: falso.pedidos };
}

const bandeja = (...hilos) => () => ({ data: hilos });
const perfilDe = (seguido, usuario = "lead.prueba") => () => ({ username: usuario, is_business_follow_user: seguido });

test("el id de Instagram de un contacto se busca en la bandeja por su usuario de ManyChat, y queda guardado", async () => {
  const { m, reglas } = mundoReglas({ rutas: {
    "/me/conversations": bandeja(hiloCrudo(9, [msj(1, "hola", { otro: { id: "777", username: "otro.lead" } })]), hiloCrudo(1, [msj(2, "hola")])),
  } });
  assert.equal(await reglas.resolver(m.contacto), "501");
  assert.equal(m.contacto.ig_usuario, "lead.prueba");
  assert.equal(m.contacto.ig_id, "501");
  assert.equal(await reglas.resolver(m.contacto), "501");
  assert.equal(m.pedidosManyChat, 1);
});

test("el id que da ManyChat vale solo si Instagram dice que es el mismo usuario", async () => {
  const igual = mundoReglas({ manychat: { ok: true, ig_username: "lead.prueba", ig_id: 501 }, rutas: { "/501": perfilDe(false) } });
  assert.equal(await igual.reglas.resolver(igual.m.contacto), "501");
  assert.equal(igual.pedidos.filter((p) => p.ruta === "/me/conversations").length, 0);
  const distinto = mundoReglas({
    manychat: { ok: true, ig_username: "lead.prueba", ig_id: 333 },
    rutas: { "/333": perfilDe(false, "alguien.mas"), "/me/conversations": bandeja(hiloCrudo(1, [msj(1, "hola")])) },
  });
  assert.equal(await distinto.reglas.resolver(distinto.m.contacto), "501");
});

test("sin usuario de Instagram en ManyChat no se busca nada, y no se le vuelve a preguntar", async () => {
  const { m, reglas, pedidos } = mundoReglas({ manychat: { ok: true, ig_username: "", ig_id: null } });
  assert.equal(await reglas.resolver(m.contacto), null);
  assert.equal(m.contacto.ig_usuario, "");
  assert.equal(await reglas.resolver(m.contacto), null);
  assert.equal(m.pedidosManyChat, 1);
  assert.equal(pedidos.length, 0);
});

test("porQueSale: el -- de Cande, que lo siga, o nada", async () => {
  const conCodigo = mundoReglas({ contacto: { ig_id: "501", ig_usuario: "lead.prueba" }, rutas: {
    "/me/conversations": bandeja(hiloCrudo(1, [msj(2, "--", { deCuenta: true }), msj(1, "hola")])), "/501": perfilDe(false),
  } });
  assert.equal(await conCodigo.reglas.porQueSale(conCodigo.m.contacto), "escribiste -- en Instagram");
  const seguido = mundoReglas({ contacto: { ig_id: "501", ig_usuario: "lead.prueba" }, rutas: {
    "/me/conversations": bandeja(hiloCrudo(1, [msj(1, "hola")])), "/501": perfilDe(true),
  } });
  assert.equal(await seguido.reglas.porQueSale(seguido.m.contacto), "la seguís en Instagram");
  const nada = mundoReglas({ contacto: { ig_id: "501", ig_usuario: "lead.prueba" }, rutas: {
    "/me/conversations": bandeja(hiloCrudo(1, [msj(2, "--", { deCuenta: true, min: 120 }), msj(1, "hola")])), "/501": perfilDe(false),
  } });
  assert.equal(await nada.reglas.porQueSale(nada.m.contacto), null, "el -- es de antes de que la charla volviera al agente");
  assert.equal(nada.m.avisos.length, 0);
});

test("si Instagram falla, porQueSale dice que no y a Cande le llega un aviso por día como mucho", async () => {
  let ahora = AHORA;
  const { m, reglas } = mundoReglas({ contacto: { ig_id: "501" }, ahora: () => ahora, rutas: {
    "/me/conversations": () => ({ error: { message: "Error validating access token", code: 190 } }), "/501": perfilDe(false),
  } });
  assert.equal(await reglas.porQueSale(m.contacto), null);
  assert.equal(await reglas.porQueSale(m.contacto), null);
  assert.equal(m.avisos.length, 1);
  assert.match(m.avisos[0].campos.Motivo, /venció/);
  ahora = new Date(AHORA.getTime() + 25 * 3600000);
  await reglas.porQueSale(m.contacto);
  assert.equal(m.avisos.length, 2);
});

test("sacar: la charla queda de Cande con una nota; un alta todavía sin confirmar se borra entera", async () => {
  const { m, reglas } = mundoReglas();
  await reglas.sacar(m.contacto, "la seguís en Instagram");
  assert.equal(m.contacto.dueno, "cande");
  assert.equal(m.descartados, 1);
  assert.deepEqual(m.campos, [["dm_dueno", "cande"]]);
  assert.match(m.notas[0].texto, /la seguís/);
  assert.equal(m.notas[0].quien, "sistema");
  const alta = mundoReglas({ contacto: { alta_en: AHORA, alta_avisada: false } });
  await alta.reglas.sacar(alta.m.contacto, "la seguís en Instagram");
  assert.equal(alta.m.borrada, true);
  assert.equal(alta.m.notas.length, 0);
});

test("la vuelta del cron: saca al agente de las charlas con un -- nuevo, hasta donde miró la vez anterior", async () => {
  const otro2 = { id: "502", username: "lead.dos" };
  const { m, ig, base, reglas } = mundoReglas({ contacto: { ig_usuario: "lead.prueba" }, rutas: {
    "/me/conversations": bandeja(
      hiloCrudo(1, [msj(2, "--", { deCuenta: true, min: 1 }), msj(1, "hola")], 1),
      hiloCrudo(2, [msj(3, "--", { deCuenta: true, min: 20, otro: otro2 })], 20), // de antes de la vuelta anterior
    ),
  } });
  const r = await buscarCodigos({ ig, base, reglas, desde: hace(10) });
  assert.deepEqual({ miradas: r.miradas, sacadas: r.sacadas }, { miradas: 1, sacadas: 1 });
  assert.deepEqual(r.hasta, hace(1));
  assert.equal(m.contacto.dueno, "cande");
  assert.equal(m.contacto.ig_id, "501", "de paso queda el id de la persona");
});

test("la vuelta del cron no toca charlas que ya son de Cande ni las que no reconoce", async () => {
  const { m, ig, base, reglas } = mundoReglas({ contacto: { ig_usuario: "lead.prueba", dueno: "cande" }, rutas: {
    "/me/conversations": bandeja(
      hiloCrudo(1, [msj(2, "--", { deCuenta: true })]),
      hiloCrudo(2, [msj(3, "--", { deCuenta: true, otro: { id: "503", username: "desconocido" } })]),
    ),
  } });
  const r = await buscarCodigos({ ig, base, reglas, desde: null });
  assert.equal(r.sacadas, 0);
  assert.equal(r.miradas, 2);
  assert.equal(m.descartados, 0);
});

test("la vuelta del cron no toca una charla que el agente está contestando: la ve su propia mirada", async () => {
  const { m, ig, base, reglas } = mundoReglas({ contacto: { ig_usuario: "lead.prueba" }, rutas: {
    "/me/conversations": bandeja(hiloCrudo(1, [msj(2, "--", { deCuenta: true })])),
  } });
  m.tomado = "otra corrida";
  const r = await buscarCodigos({ ig, base, reglas, desde: null });
  assert.equal(r.sacadas, 0);
  assert.equal(m.contacto.dueno, "agente");
  assert.equal(m.tomado, "otra corrida");
});

test("una persona con el mismo usuario pero otro id no se confunde con el contacto", async () => {
  const { m, ig, base, reglas } = mundoReglas({ contacto: { ig_usuario: "lead.prueba", ig_id: "999" }, rutas: {
    "/me/conversations": bandeja(hiloCrudo(1, [msj(2, "--", { deCuenta: true })])),
  } });
  assert.equal((await buscarCodigos({ ig, base, reglas, desde: null })).sacadas, 0);
  assert.equal(m.contacto.dueno, "agente");
});

test("si Cande se la dio al agente a propósito, que la siga no la saca; su -- sí", async () => {
  const rutas = (codigo) => ({
    "/me/conversations": bandeja(hiloCrudo(1, [...(codigo ? [msj(2, "--", { deCuenta: true })] : []), msj(1, "hola")])), "/501": perfilDe(true),
  });
  const entregada = mundoReglas({ contacto: { ig_id: "501", entregada: true }, rutas: rutas(false) });
  assert.equal(await entregada.reglas.porQueSale(entregada.m.contacto), null);
  const conCodigo = mundoReglas({ contacto: { ig_id: "501", entregada: true }, rutas: rutas(true) });
  assert.equal(await conCodigo.reglas.porQueSale(conCodigo.m.contacto), "escribiste -- en Instagram");
});

test("si falla leer el perfil, el -- que se vio en la charla vale igual", async () => {
  const { m, reglas } = mundoReglas({ contacto: { ig_id: "501" }, rutas: {
    "/me/conversations": bandeja(hiloCrudo(1, [msj(2, "--", { deCuenta: true })])),
    "/501": () => ({ error: { message: "despacio", code: 4 } }),
  } });
  assert.equal(await reglas.porQueSale(m.contacto), "escribiste -- en Instagram");
});

test("si Instagram corta por límite de pedidos mientras se leen los mensajes, la vuelta del cron falla entera y no avanza", async () => {
  const { ig, base, reglas } = mundoReglas({ contacto: { ig_usuario: "lead.prueba" }, rutas: {
    "/me/conversations": () => ({ data: [{ id: "h1", updated_time: ISO(hace(1)), messages: { data: [{ id: "m1", created_time: ISO(hace(1)) }] } }] }),
    "/m1": () => ({ error: { message: "Application request limit reached", code: 4 } }),
  } });
  await assert.rejects(buscarCodigos({ ig, base, reglas, desde: null }), (e) => e.code === 4);
});

test("el id que dio ManyChat se guarda y se prueba sin volver a preguntarle; si Instagram dice que no existe, no se prueba más", async () => {
  const guardado = mundoReglas({ contacto: { ig_usuario: "lead.prueba", ig_id_mc: "501" }, rutas: { "/501": perfilDe(false) } });
  assert.equal(await guardado.reglas.resolver(guardado.m.contacto), "501");
  assert.equal(guardado.m.pedidosManyChat, 0);
  const malo = mundoReglas({ contacto: { ig_usuario: "lead.prueba", ig_id_mc: "333" }, rutas: {
    "/333": () => ({ error: { message: "Unsupported get request", code: 100 } }),
    "/me/conversations": bandeja(hiloCrudo(1, [msj(1, "hola")])),
  } });
  assert.equal(await malo.reglas.resolver(malo.m.contacto), "501");
  assert.equal(malo.m.contacto.ig_id_mc, "");
  const corte = mundoReglas({ contacto: { ig_usuario: "lead.prueba", ig_id_mc: "333" }, rutas: {
    "/333": () => ({ error: { message: "despacio", code: 4 } }),
  } });
  await assert.rejects(corte.reglas.resolver(corte.m.contacto));
  assert.equal(corte.m.contacto.ig_id_mc, "333", "un corte no dice que el id no sirva");
});

test("la lista de seguidos: sin token, con el usuario que da ManyChat, el agente sale si Cande lo sigue", async () => {
  const { m, base, reglas } = mundoReglas();
  const sinToken = crearReglasInstagram({ ig: null, base, manychat: { datosDe: async () => { m.pedidosManyChat++; return { ok: true, ig_username: "@Lead.Prueba", ig_id: null }; } }, avisar: async () => true });
  assert.equal(await sinToken.porQueSale(m.contacto, { lista: true, api: true }), null, "todavía no está en la lista");
  base.seguidos.add("lead.prueba");
  assert.equal(await sinToken.porQueSale(m.contacto, { lista: true, api: true }), "la seguís en Instagram");
  assert.equal(m.pedidosManyChat, 1, "el usuario se pide una sola vez");
  assert.equal(await sinToken.porQueSale({ ...m.contacto, entregada: true }, { lista: true }), null, "si Cande se la dio al agente, no sale");
  assert.equal(await sinToken.porQueSale(m.contacto, { lista: false }), null, "sin el ajuste no se mira");
  assert.equal(sinToken.conApi, false);
  assert.equal(reglas.conApi, true);
});

test("lo que Instagram dice que Cande sigue se suma a la lista", async () => {
  const { m, base, reglas } = mundoReglas({ contacto: { ig_id: "501", entregada: true }, rutas: {
    "/me/conversations": bandeja(hiloCrudo(1, [msj(1, "hola")])), "/501": perfilDe(true),
  } });
  assert.equal(await reglas.porQueSale(m.contacto), null);
  assert.ok(base.seguidos.has("lead.prueba"));
});

/* ---------- Cande escribiendo a mano, y el permiso con el que publica el sitio ---------- */

test("un mensaje de la cuenta que no mandó el agente ni un automático, después de que la charla es del agente, es Cande a mano", () => {
  const h = (mensajes) => leerHilo(hiloCrudo(1, mensajes), CUENTA);
  const desde = hace(60);
  const conocidos = ["Mensaje de prueba del agente, con pregunta?", "Saludo fijo de prueba que manda un automático"];
  assert.ok(manualEnHilo(h([msj(2, "Uy si ahí vi, ya te contesto yo", { deCuenta: true, min: 5 })]), CUENTA, conocidos, desde));
  assert.equal(manualEnHilo(h([msj(2, "Mensaje de prueba del agente,\ncon pregunta?", { deCuenta: true, min: 5 })]), CUENTA, conocidos, desde), null, "lo mandó el agente");
  assert.equal(manualEnHilo(h([msj(2, "Saludo fijo de prueba que manda un automático", { deCuenta: true, min: 5 })]), CUENTA, conocidos, desde), null, "es el automático");
  assert.equal(manualEnHilo(h([msj(2, "Te escribo yo esto a mano", { deCuenta: true, min: 120 })]), CUENTA, conocidos, desde), null, "es de antes de que la charla fuera del agente");
  assert.equal(manualEnHilo(h([msj(2, "Te escribo yo esto a mano", { min: 5 })]), CUENTA, conocidos, desde), null, "lo escribió el lead");
  assert.equal(manualEnHilo(h([msj(2, "❤️", { deCuenta: true, min: 5 })]), CUENTA, conocidos, desde), null, "un emoji no dice nada");
  assert.equal(manualEnHilo(h([msj(2, "algo", { deCuenta: true, min: 5 })]), CUENTA, conocidos, null), null, "sin fecha de inicio no se mira");
  assert.deepEqual(desdeManual({ dueno_desde: hace(60), alta_en: hace(30) }), hace(30));
});

test("porQueSale: si Cande le escribió a mano, el agente sale", async () => {
  const { m, base, reglas } = mundoReglas({ contacto: { ig_id: "501", dueno_desde: hace(60) }, rutas: {
    "/me/conversations": bandeja(hiloCrudo(1, [msj(3, "Uy si, ya te contesto yo", { deCuenta: true, min: 2 }), msj(2, "hola", { min: 3 })])),
    "/501": perfilDe(false),
  } });
  assert.equal(await reglas.porQueSale(m.contacto), "le escribiste vos");
  base.conocidos = ["Uy si, ya te contesto yo"];
  assert.equal(await reglas.porQueSale(m.contacto), null, "si ya está anotado, no");
});

test("la vuelta del cron: un texto que salió igual en dos charlas es un automático, no Cande", async () => {
  const otro2 = { id: "502", username: "lead.dos" };
  const auto = "Hola! Este es un mensaje fijo que sale solo";
  const { m, ig, base, reglas } = mundoReglas({ contacto: { ig_usuario: "lead.prueba", dueno_desde: hace(60) }, rutas: {
    "/me/conversations": bandeja(
      hiloCrudo(1, [msj(2, auto, { deCuenta: true, min: 2 }), msj(1, "hola", { min: 3 })], 1),
      hiloCrudo(2, [msj(3, auto, { deCuenta: true, min: 2, otro: otro2 })], 2),
    ),
  } });
  assert.equal((await buscarCodigos({ ig, base, reglas, desde: null })).sacadas, 0);
  assert.equal(m.contacto.dueno, "agente");
});

test("con el permiso del sitio (Facebook), lee las charlas por la página de la cuenta, sin otro token", async () => {
  const pedidos = [];
  const pedir = async (url) => {
    const u = new URL(url);
    pedidos.push({ host: u.host, ruta: u.pathname, tok: u.searchParams.get("access_token") });
    const p = u.pathname.replace(/^\/v\d+\.\d+/, "");
    const r = p === "/me/accounts" ? { data: [{ id: "77001", access_token: "tok-pagina", instagram_business_account: { id: "900" } }] }
      : p === "/900" ? { username: "cuenta.prueba" }
      : p === "/77001/conversations" ? { data: [hiloCrudo(1, [msj(1, "--", { deCuenta: true }), msj(2, "hola")])] }
      : { error: { message: "ruta " + p, code: 100 } };
    return { ok: !r.error, status: r.error ? 400 : 200, json: async () => r };
  };
  const ig = crearInstagram({ pedir, ...configFalso(), tokenEnv: () => "", credencialFb: async () => ({ id: "900", token: "tok-usuario" }) });
  assert.deepEqual(await ig.cuenta(), { user_id: "900", username: "cuenta.prueba" });
  const h = await ig.hiloDe("501");
  assert.ok(codigoEnHilo(h, await ig.cuenta(), null));
  assert.ok(pedidos.every((p) => p.host === "graph.facebook.com"));
  assert.equal(pedidos.find((p) => p.ruta.endsWith("/me/accounts")).tok, "tok-usuario");
  assert.ok(pedidos.filter((p) => p.ruta.endsWith("/conversations")).every((p) => p.tok === "tok-pagina"));
  assert.equal((await ig.renovar()).hecho, "lo renueva el dashboard");
  const sin = crearInstagram({ pedir, ...configFalso(), credencialFb: async () => null });
  await assert.rejects(sin.cuenta(), /falta el permiso/);
});

test("\"Cande aquí\" al principio es Cande presentándose, aunque un automático arranque igual; el automático tal cual, no", () => {
  const h = (texto) => leerHilo(hiloCrudo(1, [msj(2, texto, { deCuenta: true, min: 5 })]), CUENTA);
  const auto = "Cande aquí, mensaje fijo de prueba?";
  assert.ok(manualEnHilo(h("Cande aquí"), CUENTA, [auto], hace(60)));
  assert.ok(manualEnHilo(h("Cande aquí! cómo va eso?"), CUENTA, [auto], hace(60)));
  assert.equal(manualEnHilo(h(auto), CUENTA, [auto], hace(60)), null);
});

test("una demora o el límite de pedidos de Instagram no le llegan a Cande como aviso; un permiso vencido sí", async () => {
  const demora = mundoReglas({ contacto: { ig_id: "501" }, rutas: { "/me/conversations": () => ({ error: { message: "despacio", code: 4 } }), "/501": () => ({ error: { message: "despacio", code: 4 } }) } });
  assert.equal(await demora.reglas.porQueSale(demora.m.contacto), null);
  await demora.reglas.fallo(new ErrorInstagram("Instagram tardó más de 12 segundos", { demora: true }));
  assert.equal(demora.m.avisos.length, 0);
  await demora.reglas.fallo(new ErrorInstagram("Error validating access token", { code: 190 }));
  assert.equal(demora.m.avisos.length, 1);
});

/* ---------- charlas retomadas (20/10): Cande contesta a mano charlas viejas y las sigue el agente ---------- */

/**
 * La marca de dm_config "retomadas" para ese contacto, vigente `dias` días más. Se marcó hace 50 minutos: después de que
 * la charla fue del agente (hace 60) y antes de que Cande pegara.
 */
const MARCADA = hace(50).getTime();
const marca = (id = "77", dias = 7) => ({ [id]: { hasta: AHORA.getTime() + dias * 86400000, marcada: MARCADA } });
const ANOTADO = "Texto anotado antes de que lo pegue, de prueba";
const PEGADO = "Texto que pegó cambiado, de prueba";
const OTRO_SUYO = "Y otra cosa que agregó, de prueba";

test("una marca de retomada vale para su charla y hasta que vence", () => {
  assert.equal(esRetomada(marca(), "77", AHORA), true);
  assert.equal(esRetomada(marca(), 77, AHORA), true, "el id puede venir como número");
  assert.equal(esRetomada(marca("78"), "77", AHORA), false, "es de otra charla");
  assert.equal(esRetomada({ 77: { hasta: AHORA.getTime() - 1 } }, "77", AHORA), false, "venció");
  assert.equal(esRetomada({ 77: { hasta: "cualquier cosa" } }, "77", AHORA), false);
  assert.equal(esRetomada(null, "77", AHORA), false);
});

test("manualesEnHilo trae todo lo que Cande escribió a mano, del más viejo al más nuevo; manualEnHilo sigue dando el más nuevo", () => {
  const h = leerHilo(hiloCrudo(1, [
    msj(4, OTRO_SUYO, { deCuenta: true, min: 2 }), msj(3, PEGADO, { deCuenta: true, min: 3 }), msj(2, "hola", { min: 30 }),
    msj(1, "Mensaje viejo de antes de que fuera del agente", { deCuenta: true, min: 120 }),
  ]), CUENTA);
  assert.deepEqual(manualesEnHilo(h, CUENTA, [ANOTADO], hace(60)).map((m) => m.texto), [PEGADO, OTRO_SUYO]);
  assert.equal(manualEnHilo(h, CUENTA, [ANOTADO], hace(60)).texto, OTRO_SUYO);
  assert.deepEqual(manualesEnHilo(h, CUENTA, [PEGADO, OTRO_SUYO], hace(60)), [], "lo ya anotado no es a mano");
});

test("charla retomada: si Cande escribió a mano distinto de lo anotado, el agente no sale y lo suyo queda anotado tal cual, una sola vez; su -- la saca igual", async () => {
  const { m, base, reglas } = mundoReglas({ contacto: { ig_id: "501", dueno_desde: hace(60) }, rutas: {
    "/me/conversations": bandeja(hiloCrudo(1, [
      msj(4, OTRO_SUYO, { deCuenta: true, min: 2 }), msj(3, PEGADO, { deCuenta: true, min: 3 }), msj(2, "hola", { min: 30 }),
    ])),
    "/501": perfilDe(false),
  } });
  base.conocidos = [ANOTADO];
  await base.guardarConfig(CLAVE_RETOMADAS, marca());
  assert.equal(await reglas.porQueSale(m.contacto), null);
  assert.deepEqual(base.anotadasCande, [
    { texto: PEGADO, creado: hace(3).toISOString(), mid: "m3" },
    { texto: OTRO_SUYO, creado: hace(2).toISOString(), mid: "m4" },
  ]);
  assert.equal(m.contacto.dueno, "agente");
  assert.deepEqual({ notas: m.notas, campos: m.campos, descartados: m.descartados, avisos: m.avisos }, { notas: [], campos: [], descartados: 0, avisos: [] });
  assert.equal(await reglas.porQueSale(m.contacto), null);
  assert.equal(base.anotadasCande.length, 2, "la mirada siguiente no lo anota de nuevo");

  // Su "--" la saca igual, y sin marca vigente (vencida o de otra charla) lo escrito a mano la saca como siempre.
  const rutas = (texto) => ({
    "/me/conversations": bandeja(hiloCrudo(1, [msj(3, texto, { deCuenta: true, min: 2 }), msj(2, "hola", { min: 30 })])), "/501": perfilDe(false),
  });
  const conCodigo = mundoReglas({ contacto: { ig_id: "501", dueno_desde: hace(60) }, rutas: rutas("--") });
  await conCodigo.base.guardarConfig(CLAVE_RETOMADAS, marca());
  assert.equal(await conCodigo.reglas.porQueSale(conCodigo.m.contacto), "escribiste -- en Instagram");
  assert.deepEqual(conCodigo.base.anotadasCande, []);
  // Vencida: venció antes de que ella escribiera (lo escrito con la marca vigente cuenta aunque se vea después, ver abajo).
  for (const [retomadas, por] of [[{ 77: { hasta: hace(3).getTime() } }, "vencida"], [marca("78"), "de otra charla"], [null, "sin marca"]]) {
    const w = mundoReglas({ contacto: { ig_id: "501", dueno_desde: hace(60) }, rutas: rutas(PEGADO) });
    if (retomadas) await w.base.guardarConfig(CLAVE_RETOMADAS, retomadas);
    assert.equal(await w.reglas.porQueSale(w.m.contacto), "le escribiste vos", por);
    assert.deepEqual(w.base.anotadasCande, [], por);
  }
});

test("la vuelta del cron: en una charla retomada anota lo que Cande escribió a mano y la deja del agente; sin la marca, la saca", async () => {
  const rutas = { "/me/conversations": bandeja(hiloCrudo(1, [msj(3, PEGADO, { deCuenta: true, min: 2 }), msj(2, "hola", { min: 30 })], 2)) };
  const con = mundoReglas({ contacto: { ig_usuario: "lead.prueba", dueno_desde: hace(60) }, rutas });
  await con.base.guardarConfig(CLAVE_RETOMADAS, marca());
  const r = await buscarCodigos({ ig: con.ig, base: con.base, reglas: con.reglas, desde: null });
  assert.deepEqual({ sacadas: r.sacadas, anotadas: r.anotadas }, { sacadas: 0, anotadas: 1 });
  assert.equal(con.m.contacto.dueno, "agente");
  assert.deepEqual(con.base.anotadasCande.map((x) => [x.texto, x.mid]), [[PEGADO, "m3"]]);
  assert.equal(con.m.tomado, null, "suelta la traba");
  assert.equal((await buscarCodigos({ ig: con.ig, base: con.base, reglas: con.reglas, desde: null })).anotadas, 0, "la vuelta siguiente no lo anota de nuevo");
  const sin = mundoReglas({ contacto: { ig_usuario: "lead.prueba", dueno_desde: hace(60) }, rutas });
  const r2 = await buscarCodigos({ ig: sin.ig, base: sin.base, reglas: sin.reglas, desde: null });
  assert.deepEqual({ sacadas: r2.sacadas, anotadas: r2.anotadas }, { sacadas: 1, anotadas: 0 });
  assert.equal(sin.m.contacto.dueno, "cande");
});

test("la vuelta del cron: en una charla retomada, el -- de Cande la saca", async () => {
  const { m, ig, base, reglas } = mundoReglas({ contacto: { ig_usuario: "lead.prueba", dueno_desde: hace(60) }, rutas: {
    "/me/conversations": bandeja(hiloCrudo(1, [msj(4, "--", { deCuenta: true, min: 1 }), msj(3, PEGADO, { deCuenta: true, min: 2 }), msj(2, "hola", { min: 30 })], 1)),
  } });
  await base.guardarConfig(CLAVE_RETOMADAS, marca());
  const r = await buscarCodigos({ ig, base, reglas, desde: null });
  assert.deepEqual({ sacadas: r.sacadas, anotadas: r.anotadas }, { sacadas: 1, anotadas: 0 });
  assert.equal(m.contacto.dueno, "cande");
});

/* ---------- revisión de las charlas retomadas (21/10) ---------- */

test("Cande escribió a mano y la base no deja leer la marca o anotar lo suyo: porQueSale dice NO_AHORA (ni sale ni contesta encima) y no avisa de Instagram", async () => {
  const rutas = {
    "/me/conversations": bandeja(hiloCrudo(1, [msj(3, PEGADO, { deCuenta: true, min: 2 }), msj(2, "hola", { min: 30 })])), "/501": perfilDe(false),
  };
  // Sin la marca y sin poder leerla: antes contestaba encima de Cande, con un aviso de la conexión de Instagram que no era.
  const sinLeer = mundoReglas({ contacto: { ig_id: "501", dueno_desde: hace(60) }, rutas });
  const leer = sinLeer.base.leerConfig;
  sinLeer.base.leerConfig = async (k) => {
    if (k === CLAVE_RETOMADAS) throw new Error("base caída de prueba");
    return leer(k);
  };
  assert.equal(await sinLeer.reglas.porQueSale(sinLeer.m.contacto), NO_AHORA);
  assert.deepEqual(sinLeer.m.avisos, []);
  assert.equal(sinLeer.m.contacto.dueno, "agente");
  // Con la marca y sin poder anotar lo suyo: sin esto el agente seguía sin lo de ella (un toque salía detrás).
  const sinAnotar = mundoReglas({ contacto: { ig_id: "501", dueno_desde: hace(60) }, rutas });
  await sinAnotar.base.guardarConfig(CLAVE_RETOMADAS, marca());
  sinAnotar.base.anotarCandeDesdeIg = async () => { throw new Error("base caída de prueba"); };
  assert.equal(await sinAnotar.reglas.porQueSale(sinAnotar.m.contacto), NO_AHORA);
  assert.deepEqual(sinAnotar.m.avisos, []);
  assert.equal(sinAnotar.m.contacto.dueno, "agente");
});

test("paraPegar: le toca pegar solo en una charla del agente, con la marca, sin nada de la cuenta después del último mensaje del lead y sin respuesta por salir", () => {
  const fila = (extra = {}) => ({ id: "77", dueno: "agente", ultimo_del_lead: hace(3000), ultimo_de_la_cuenta: hace(4000), por_salir: false, ...extra });
  const con = marca();
  assert.deepEqual(paraPegar("77", fila(), con, AHORA), {
    contacto: "77", pegar: true, motivo: null, retomada: true,
    ultimo_del_lead: hace(3000).toISOString(), ultimo_de_la_cuenta: hace(4000).toISOString(),
  });
  for (const [caso, f, retomadas, motivo] of [
    ["no está en la base", null, con, "no está en la base"],
    ["es de Cande", fila({ dueno: "cande" }), con, "no es del agente"],
    ["ya pegó, o le contestó el agente", fila({ ultimo_de_la_cuenta: hace(2) }), con, "ya le escribió la cuenta"],
    ["la cuenta le escribió y el lead nunca", fila({ ultimo_del_lead: null }), con, "ya le escribió la cuenta"],
    ["el agente está por contestar", fila({ ultimo_del_lead: hace(1), por_salir: true }), con, "el agente está por contestar"],
    ["sin marca", fila(), null, "no tiene la marca de retomada"],
    ["la marca venció", fila(), { 77: { hasta: AHORA.getTime() - 1 } }, "no tiene la marca de retomada"],
  ]) {
    const r = paraPegar("77", f, retomadas, AHORA);
    assert.equal(r.pegar, false, caso);
    assert.equal(r.motivo, motivo, caso);
  }
});

/* ---------- segunda revisión de las charlas retomadas (21/10) ---------- */

/** Una vuelta del cron con varias charlas del agente: `contactos` [{ id, otro: { id, username }, ... }], `hilos` crudos. */
function mundoVarias({ contactos, hilos, marcas = null }) {
  const cfg = configFalso(marcas ? { [CLAVE_RETOMADAS]: marcas } : {});
  const w = { contactos: new Map(), anotadas: [], sacadas: [], registradas: [], avisos: [] };
  for (const c of contactos) {
    w.contactos.set(c.id, { dueno: "agente", alta_avisada: true, dueno_desde: hace(600), ig_id: c.otro.id, ig_usuario: c.otro.username, ...c, otro: undefined });
  }
  const base = {
    ...cfg,
    contactoDeIg: async ({ igId }) => {
      const c = [...w.contactos.values()].find((x) => x.ig_id === igId);
      return c ? { ...c } : null;
    },
    guardarIg: async () => {},
    // Como la consulta: con `desde`, solo lo que se escribió después de esa hora.
    textosDeLaCuenta: async (id, { desde = null } = {}) =>
      w.anotadas.filter((x) => x.id === id && (!desde || new Date(x.creado) > desde)).map((x) => x.texto),
    tomar: async (id) => (w.contactos.get(id)?.dueno === "agente" ? { ...w.contactos.get(id) } : null),
    soltar: async () => {},
    descartarPendientes: async () => {},
    ponerDueno: async (id, d) => { w.contactos.get(id).dueno = d; },
    anotar: async () => {},
    // Como la consulta: una vez por id de Instagram, solo en una charla del agente, y la marca queda usada.
    anotarCandeDesdeIg: async (id, lista) => {
      if (w.contactos.get(id)?.dueno !== "agente") return 0;
      const nuevas = lista.filter((x) => !w.anotadas.some((y) => y.mid === x.mid));
      w.anotadas.push(...nuevas.map((x) => ({ id, ...x })));
      const m = cfg.datos[CLAVE_RETOMADAS]?.[id];
      if (nuevas.length && m && m.usada == null) m.usada = Math.max(...nuevas.map((x) => new Date(x.creado).getTime()));
      return nuevas.length;
    },
  };
  const falso = instagramFalso(rutasDeSiempre({ "/me/conversations": () => ({ data: hilos }) }));
  const ig = crearInstagram({ pedir: falso.pedir, ...cfg, tokenEnv: () => "t", reloj: () => AHORA });
  const reglas = crearReglasInstagram({
    ig, base, manychat: { ponerCampo: async () => ({ ok: true }) }, reloj: () => AHORA,
    avisar: async (titulo) => { w.avisos.push(titulo); return true; },
  });
  w.vuelta = (desde = null) => buscarCodigos({ ig, base, reglas, desde, registrar: (e) => w.registradas.push(e) });
  return { w, base, cfg, reglas };
}
const LEAD_A = { id: "501", username: "lead.prueba" };
const LEAD_B = { id: "502", username: "lead.dos" };

test("la marca de retomada sirve una vez: lo que pegó se anota y lo que escribe a mano después saca al agente, como siempre", async () => {
  const enIg = [msj(3, PEGADO, { deCuenta: true, min: 3 }), msj(2, "hola", { min: 30 })];
  const { m, base, reglas } = mundoReglas({ contacto: { ig_id: "501", dueno_desde: hace(60) }, rutas: {
    "/me/conversations": () => ({ data: [hiloCrudo(1, enIg)] }), "/501": perfilDe(false),
  } });
  await base.guardarConfig(CLAVE_RETOMADAS, marca());
  assert.equal(await reglas.porQueSale(m.contacto), null);
  assert.deepEqual(base.anotadasCande.map((x) => x.texto), [PEGADO]);
  const marcas = await base.leerConfig(CLAVE_RETOMADAS);
  assert.deepEqual(marcaDe(marcas, "77"), { hasta: marca()["77"].hasta, marcada: MARCADA, usada: hace(3).getTime() }, "queda usada hasta lo que se anotó");
  assert.equal(esRetomada(marcas, "77", AHORA), false, "ya no le toca pegar ahí");
  assert.equal(await reglas.retomada(m.contacto), true, "para el rescate sigue siendo una charla retomada");
  // Otra mirada que corrió a la vez y leyó lo pegado como a mano antes de que se anotara: lo sigue cubriendo la marca.
  assert.equal(seAnotaComoRetomada(m.contacto, [{ creado: hace(3) }], marcas), true);
  // Lo que escribe a mano después saca al agente (17/10: "de repente te metés").
  enIg.unshift(msj(4, OTRO_SUYO, { deCuenta: true, min: 1 }));
  assert.equal(await reglas.porQueSale(m.contacto), "le escribiste vos");
  assert.equal(base.anotadasCande.length, 1, "no se anota");
  // Marcarla de nuevo (retomar_marcar) la deja sin usar.
  await base.guardarConfig(CLAVE_RETOMADAS, marca());
  assert.equal(await reglas.porQueSale(m.contacto), null);
  assert.deepEqual(base.anotadasCande.map((x) => x.texto), [PEGADO, OTRO_SUYO]);
});

test("la vuelta del cron: con la marca ya usada, lo que Cande escribe a mano después saca al agente", async () => {
  const { w } = mundoVarias({
    contactos: [{ id: "77", otro: LEAD_A }],
    hilos: [hiloCrudo(1, [msj(4, OTRO_SUYO, { deCuenta: true, min: 1 }), msj(3, PEGADO, { deCuenta: true, min: 3 }), msj(2, "hola", { min: 30 })], 1)],
    marcas: { 77: { hasta: AHORA.getTime() + 86400000, usada: hace(3).getTime() } },
  });
  w.anotadas.push({ id: "77", texto: PEGADO, mid: "m3" });
  const r = await w.vuelta();
  assert.deepEqual({ sacadas: r.sacadas, anotadas: r.anotadas }, { sacadas: 1, anotadas: 0 });
  assert.equal(w.contactos.get("77").dueno, "cande");
});

/*
 * Sin la marca de retomada, lo de la cuenta que ya se conoce se compara como siempre (esConocido, como en main). La
 * revisión del 21/10 lo había cambiado para todas las charlas (conocidos cortos solo iguales, 30 letras, el link del
 * formulario pelado) y una verificación encontró dos regresiones en las charlas no marcadas: (a) lo que Cande escribe a
 * mano con 30 letras del principio o del final iguales a algo de la cuenta pasaba por conocido y el agente no salía, y
 * (b) una plantilla automática corta con link dejaba de reconocerse y sacaba al agente.
 */
const DEL_AGENTE_LARGO = "Te paso el formulario de prueba para que lo completes cuando tengas un rato libre";
const A_MANO_MISMO_PRINCIPIO = "Te paso el formulario de prueba para que lo completes y después hablamos";
const DEL_AGENTE_CON_LINK = "Si querés avanzar, completá el de prueba: opengatehub.com/devs?ig=12345&f=AbCdEfGhIj";
const A_MANO_MISMO_FINAL = "Te dejo lo que hablamos, completá el de prueba: opengatehub.com/devs";
const AUTO_LINK = "Acá va el link: opengatehub.com/devs?de=cv";
const AUTO_LINK_LARGO = `${AUTO_LINK} Cualquier duda me escribís por acá`;

/** Una charla del agente con un mensaje de la cuenta (`texto`) después de lo del lead, para la mirada y para el cron. */
const conUnoDeLaCuenta = (texto, antes = []) => ({
  "/me/conversations": bandeja(hiloCrudo(1, [msj(4, texto, { deCuenta: true, min: 2 }), ...antes, msj(2, "hola", { min: 30 })], 1)),
  "/501": perfilDe(false),
});

test("sin la marca de retomada, lo que Cande escribe a mano con 30 letras del principio o del final iguales a algo de la cuenta sigue siendo a mano y saca al agente", async () => {
  const h = (texto) => leerHilo(hiloCrudo(1, [msj(2, texto, { deCuenta: true, min: 5 })]), CUENTA);
  const desde = hace(60);
  assert.ok(manualEnHilo(h(A_MANO_MISMO_PRINCIPIO), CUENTA, [DEL_AGENTE_LARGO], desde), "las mismas 44 letras del principio");
  assert.ok(manualEnHilo(h(A_MANO_MISMO_FINAL), CUENTA, [DEL_AGENTE_CON_LINK], desde), "el mismo final, con el link del formulario");
  // Como siempre: lo que mandó el agente, tal cual, es del agente; lo que no empieza igual, es de ella.
  assert.equal(manualEnHilo(h(DEL_AGENTE_LARGO), CUENTA, [DEL_AGENTE_LARGO], desde), null);
  assert.equal(manualEnHilo(h(DEL_AGENTE_CON_LINK), CUENTA, [DEL_AGENTE_CON_LINK], desde), null);
  assert.equal(manualEnHilo(h("Disculpá!"), CUENTA, ["Disculpá"], desde), null, "el mismo texto corto");
  assert.equal(manualEnHilo(h("dale"), CUENTA, ["Dale!"], desde), null);
  const auto = "Hola Nombre! Gracias por escribir, este mensaje fijo de prueba sale solo";
  assert.ok(manualEnHilo(h("Gracias por escribir, te contesto yo a mano en un rato"), CUENTA, [auto], desde));
  const enviado = "Acá va: opengatehub.com/devs?ig=12345&f=AbCdEfGhIj";
  assert.ok(manualEnHilo(h("Acá va otra cosa que escribí yo: opengatehub.com/devs"), CUENTA, [enviado], desde), "lo que escribió ella con el link");
  for (const [aMano, delAgente] of [[A_MANO_MISMO_PRINCIPIO, DEL_AGENTE_LARGO], [A_MANO_MISMO_FINAL, DEL_AGENTE_CON_LINK]]) {
    const rutas = conUnoDeLaCuenta(aMano, [msj(3, delAgente, { deCuenta: true, min: 20 })]);
    // La mirada de cada respuesta.
    const w = mundoReglas({ contacto: { ig_id: "501", dueno_desde: hace(60) }, rutas });
    w.base.conocidos = [delAgente];
    assert.equal(await w.reglas.porQueSale(w.m.contacto), "le escribiste vos", aMano);
    assert.deepEqual(w.base.anotadasCande, [], aMano);
    // La vuelta del cron.
    const c = mundoReglas({ contacto: { ig_usuario: "lead.prueba", dueno_desde: hace(60) }, rutas });
    c.base.conocidos = [delAgente];
    const r = await buscarCodigos({ ig: c.ig, base: c.base, reglas: c.reglas, desde: null });
    assert.deepEqual({ sacadas: r.sacadas, anotadas: r.anotadas }, { sacadas: 1, anotadas: 0 }, aMano);
    assert.equal(c.m.contacto.dueno, "cande", aMano);
  }
});

test("sin la marca de retomada, una plantilla automática corta con el link del formulario se sigue reconociendo y no saca al agente", async () => {
  const h = (texto) => leerHilo(hiloCrudo(1, [msj(2, texto, { deCuenta: true, min: 5 })]), CUENTA);
  const desde = hace(60);
  assert.equal(manualEnHilo(h(AUTO_LINK), CUENTA, [AUTO_LINK], desde), null, "tal cual");
  assert.equal(manualEnHilo(h(AUTO_LINK), CUENTA, [AUTO_LINK_LARGO], desde), null, "el primer globo de un automático cargado entero");
  assert.equal(manualEnHilo(h(`${AUTO_LINK} Nombre de prueba`), CUENTA, [AUTO_LINK], desde), null, "con algo más atrás");
  for (const [enIg, cargado] of [[AUTO_LINK, AUTO_LINK_LARGO], [`${AUTO_LINK} Nombre de prueba`, AUTO_LINK]]) {
    const rutas = conUnoDeLaCuenta(enIg);
    const w = mundoReglas({ contacto: { ig_id: "501", dueno_desde: hace(60) }, rutas });
    w.base.conocidos = [cargado];
    assert.equal(await w.reglas.porQueSale(w.m.contacto), null, enIg);
    assert.equal(w.m.contacto.dueno, "agente", enIg);
    const c = mundoReglas({ contacto: { ig_usuario: "lead.prueba", dueno_desde: hace(60) }, rutas });
    c.base.conocidos = [cargado];
    const r = await buscarCodigos({ ig: c.ig, base: c.base, reglas: c.reglas, desde: null });
    assert.deepEqual({ sacadas: r.sacadas, anotadas: r.anotadas }, { sacadas: 0, anotadas: 0 }, enIg);
    assert.equal(c.m.contacto.dueno, "agente", enIg);
  }
});

test("charla retomada con un \"Perdón\" viejo de la cuenta en la historia sembrada: lo que Cande pega después de marcarla se anota aunque lo contenga; sin la marca, como siempre", async () => {
  const PEGA = "Perdón por la demora! Te cuento lo que hablamos, texto de prueba";
  const PEGA_OTRO = "Te mandé el formulario de prueba, que te parece?";
  const rutas = conUnoDeLaCuenta(PEGA_OTRO, [msj(3, PEGA, { deCuenta: true, min: 3 })]);
  const sembrado = ["Perdón", "Que te parece?"]; // de antes de la marca
  // La mirada de cada respuesta.
  const w = mundoReglas({ contacto: { ig_id: "501", dueno_desde: hace(60) }, rutas });
  w.base.conocidos = [...sembrado];
  await w.base.guardarConfig(CLAVE_RETOMADAS, marca());
  assert.equal(await w.reglas.porQueSale(w.m.contacto), null);
  assert.deepEqual(w.base.anotadasCande.map((x) => x.texto), [PEGA, PEGA_OTRO], "anotado: el agente lo ve cuando el lead conteste");
  assert.equal(w.m.contacto.dueno, "agente");
  // La vuelta del cron.
  const c = mundoReglas({ contacto: { ig_usuario: "lead.prueba", dueno_desde: hace(60) }, rutas });
  c.base.conocidos = [...sembrado];
  await c.base.guardarConfig(CLAVE_RETOMADAS, marca());
  const r = await buscarCodigos({ ig: c.ig, base: c.base, reglas: c.reglas, desde: null });
  assert.deepEqual({ sacadas: r.sacadas, anotadas: r.anotadas }, { sacadas: 0, anotadas: 1 });
  assert.deepEqual(c.base.anotadasCande.map((x) => x.texto), [PEGA, PEGA_OTRO]);
  // Sin la marca, como siempre: lo que contiene un conocido corto pasa por conocido (ni se anota ni saca al agente).
  const sin = mundoReglas({ contacto: { ig_id: "501", dueno_desde: hace(60) }, rutas });
  sin.base.conocidos = [...sembrado];
  assert.equal(await sin.reglas.porQueSale(sin.m.contacto), null);
  assert.deepEqual(sin.base.anotadasCande, []);
  assert.equal(sin.m.contacto.dueno, "agente");
});

test("charla retomada: si la base no deja leer lo que la cuenta mandó desde la marca, porQueSale dice NO_AHORA; si no deja leer la marca y no se ve nada a mano, sigue como siempre", async () => {
  const PEGA = "Perdón por la demora! Te cuento lo que hablamos, texto de prueba";
  const rutas = conUnoDeLaCuenta(PEGA);
  const w = mundoReglas({ contacto: { ig_id: "501", dueno_desde: hace(60) }, rutas });
  w.base.conocidos = ["Perdón"];
  await w.base.guardarConfig(CLAVE_RETOMADAS, marca());
  const textos = w.base.textosDeLaCuenta;
  w.base.textosDeLaCuenta = async (id, o = {}) => {
    if (o.desde) throw new Error("base caída de prueba");
    return textos(id, o);
  };
  assert.equal(await w.reglas.porQueSale(w.m.contacto), NO_AHORA);
  assert.deepEqual(w.base.anotadasCande, []);
  assert.deepEqual(w.m.avisos, []);
  assert.equal(w.m.contacto.dueno, "agente");
  // Sin poder leer la marca y sin nada a mano a la vista (lo pegado pasa por conocido sin ella): como siempre.
  const sinLeer = mundoReglas({ contacto: { ig_id: "501", dueno_desde: hace(60) }, rutas });
  sinLeer.base.conocidos = ["Perdón"];
  const leer = sinLeer.base.leerConfig;
  sinLeer.base.leerConfig = async (k) => {
    if (k === CLAVE_RETOMADAS) throw new Error("base caída de prueba");
    return leer(k);
  };
  assert.equal(await sinLeer.reglas.porQueSale(sinLeer.m.contacto), null);
  assert.deepEqual(sinLeer.m.avisos, []);
  assert.equal(sinLeer.m.contacto.dueno, "agente");
});

test("con la marca vigente y sin usar, lo que la cuenta escribió después de marcarla es de Cande salvo que sea igual a algo que la cuenta mandó desde la marca", async () => {
  const DEL_AGENTE = "Respuesta de prueba que mandó el agente después de la marca";
  const PEGA = "Perdón, se me pasó! Texto de prueba que pegó Cande";
  const h = leerHilo(hiloCrudo(1, [
    msj(5, PEGA, { deCuenta: true, min: 2 }),
    msj(4, DEL_AGENTE, { deCuenta: true, min: 10 }),
    msj(3, "Perdón, esto lo escribió la cuenta antes de la marca", { deCuenta: true, min: 55 }),
    msj(2, "hola", { min: 58 }),
  ]), CUENTA);
  const c = { id: "77", dueno: "agente", dueno_desde: hace(60) };
  const pedidos = [];
  // Como la consulta: con `desde`, lo que la cuenta mandó desde esa hora; sin, todo (con el "Perdón" sembrado).
  const textos = async (id, { desde = null } = {}) => {
    pedidos.push(desde);
    return desde ? [DEL_AGENTE] : ["Perdón", DEL_AGENTE];
  };
  const conMarca = await conLaMarca(h, CUENTA, c, marca(), textos);
  assert.deepEqual(pedidos, [new Date(MARCADA)], "pregunta lo de la cuenta desde que se marcó");
  // Lo del agente (igual) no es de ella; lo de antes de la marca se compara como siempre (el "Perdón" viejo lo tapa).
  assert.deepEqual(manualesEnHilo(h, CUENTA, await textos("77"), desdeManual(c), conMarca).map((m) => m.texto), [PEGA]);
  assert.deepEqual(manualesEnHilo(h, CUENTA, await textos("77"), desdeManual(c)).map((m) => m.texto), [], "sin la marca, nada");
  // Sin la marca, con la marca usada, sin la hora en que se marcó o vencida antes de que la cuenta escribiera: como
  // siempre, y sin preguntarle nada a la base.
  pedidos.length = 0;
  for (const [marcas, por] of [
    [null, "sin marca"], [{ 77: { ...marca()["77"], usada: hace(40).getTime() } }, "usada"], [{ 77: { hasta: marca()["77"].hasta } }, "sin la hora"],
    [{ 77: { hasta: hace(30).getTime(), marcada: MARCADA } }, "vencida"], [marca("78"), "de otra charla"],
  ]) {
    assert.equal(await conLaMarca(h, CUENTA, c, marcas, textos), null, por);
  }
  assert.deepEqual(pedidos, []);
  assert.equal(escritoConLaMarca(marcaDe(marca(), "77"), { creado: hace(2) }), true);
  assert.equal(escritoConLaMarca(marcaDe(marca(), "77"), { creado: hace(55) }), false, "antes de marcarla");
  assert.equal(escritoConLaMarca(marcaDe({ 77: { hasta: hace(5).getTime(), marcada: MARCADA } }, "77"), { creado: hace(2) }), false, "después de que venció");
});

test("charla retomada con un mensaje corto viejo de la cuenta (lo sembrado): lo que pega se anota igual, en la mirada y en la vuelta del cron", async () => {
  const PEGA = "Texto de prueba con el formulario para completar, te sirve?";
  const rutas = {
    "/me/conversations": bandeja(hiloCrudo(1, [msj(3, PEGA, { deCuenta: true, min: 2 }), msj(2, "hola", { min: 30 })], 1)), "/501": perfilDe(false),
  };
  const w = mundoReglas({ contacto: { ig_id: "501", dueno_desde: hace(60) }, rutas });
  w.base.conocidos = ["Te sirve?", "Disculpá"];
  await w.base.guardarConfig(CLAVE_RETOMADAS, marca());
  assert.equal(await w.reglas.porQueSale(w.m.contacto), null);
  assert.deepEqual(w.base.anotadasCande.map((x) => x.texto), [PEGA], "anotado: el agente lo ve cuando el lead conteste");
  const c = mundoReglas({ contacto: { ig_usuario: "lead.prueba", dueno_desde: hace(60) }, rutas });
  c.base.conocidos = ["Te sirve?"];
  await c.base.guardarConfig(CLAVE_RETOMADAS, marca());
  const r = await buscarCodigos({ ig: c.ig, base: c.base, reglas: c.reglas, desde: null });
  assert.deepEqual({ sacadas: r.sacadas, anotadas: r.anotadas }, { sacadas: 0, anotadas: 1 });
  assert.deepEqual(c.base.anotadasCande.map((x) => x.texto), [PEGA]);
});

test("lo que Cande escribió con la marca vigente se anota aunque se vea después de que venció; lo escrito después de que venció la saca", async () => {
  // Pegó a las 120 minutos, la marca venció a los 60 y el lead contesta recién ahora: nadie lo había anotado.
  const rutas = (min) => ({
    "/me/conversations": bandeja(hiloCrudo(1, [
      msj(4, "respuesta de prueba del lead", { min: 1 }), msj(3, PEGADO, { deCuenta: true, min }), msj(2, "hola", { min: 600 }),
    ])),
    "/501": perfilDe(false),
  });
  const vencida = { 77: { hasta: hace(60).getTime() } };
  const con = mundoReglas({ contacto: { ig_id: "501", dueno_desde: hace(700) }, rutas: rutas(120) });
  await con.base.guardarConfig(CLAVE_RETOMADAS, vencida);
  assert.equal(await con.reglas.porQueSale(con.m.contacto), null);
  assert.deepEqual(con.base.anotadasCande.map((x) => x.texto), [PEGADO]);
  assert.equal(con.m.contacto.dueno, "agente");
  const despues = mundoReglas({ contacto: { ig_id: "501", dueno_desde: hace(700) }, rutas: rutas(30) });
  await despues.base.guardarConfig(CLAVE_RETOMADAS, vencida);
  assert.equal(await despues.reglas.porQueSale(despues.m.contacto), "le escribiste vos");
  assert.deepEqual(despues.base.anotadasCande, []);
});

test("la vuelta del cron: si Cande pegó el mismo texto en dos charlas marcadas, no es un automático: se anota en las dos", async () => {
  const MISMO = "Texto de prueba que Cande pegó igual en dos charlas";
  const hilos = [
    hiloCrudo(1, [msj(3, MISMO, { deCuenta: true, min: 2, otro: LEAD_A }), msj(2, "hola", { min: 900, otro: LEAD_A })], 2),
    hiloCrudo(2, [msj(13, MISMO, { deCuenta: true, min: 3, otro: LEAD_B }), msj(12, "hola", { min: 900, otro: LEAD_B })], 3),
  ];
  const marcas = { 77: { hasta: AHORA.getTime() + 86400000 }, 78: { hasta: AHORA.getTime() + 86400000 } };
  const { w } = mundoVarias({ contactos: [{ id: "77", otro: LEAD_A }, { id: "78", otro: LEAD_B }], hilos, marcas });
  const r = await w.vuelta();
  assert.deepEqual({ sacadas: r.sacadas, anotadas: r.anotadas }, { sacadas: 0, anotadas: 2 });
  assert.deepEqual(w.anotadas.map((x) => [x.id, x.texto]), [["77", MISMO], ["78", MISMO]]);
  // Sin la marca, lo repetido sigue siendo un automático: no saca a nadie.
  const sin = mundoVarias({ contactos: [{ id: "77", otro: LEAD_A }, { id: "78", otro: LEAD_B }], hilos });
  const r2 = await sin.w.vuelta();
  assert.deepEqual({ sacadas: r2.sacadas, anotadas: r2.anotadas }, { sacadas: 0, anotadas: 0 });
});

test("paraPegar: la cuenta y el lead a la misma hora (lo sembrado) los decide el orden en la base, no la hora sola", () => {
  const misma = hace(30);
  const fila = (extra) => ({ id: "77", dueno: "agente", ultimo_del_lead: misma, ultimo_de_la_cuenta: misma, por_salir: false, ...extra });
  assert.equal(paraPegar("77", fila({ id_ultimo_del_lead: 12, id_ultimo_de_la_cuenta: 11 }), marca(), AHORA).pegar, true, "lo último es del lead");
  assert.equal(paraPegar("77", fila({ id_ultimo_del_lead: 11, id_ultimo_de_la_cuenta: 12 }), marca(), AHORA).motivo, "ya le escribió la cuenta");
  assert.equal(paraPegar("77", fila({ id_ultimo_del_lead: 11, id_ultimo_de_la_cuenta: 12 }), marca(), AHORA).pegar, false);
  // A la mañana el lead escribió y le contestó el agente: la cuenta es más nueva, no pega encima.
  const respondido = fila({ ultimo_del_lead: hace(120), ultimo_de_la_cuenta: hace(119), id_ultimo_del_lead: 30, id_ultimo_de_la_cuenta: 31 });
  assert.equal(paraPegar("77", respondido, marca(), AHORA).motivo, "ya le escribió la cuenta");
  // Con la marca ya usada (pegó y se anotó), tampoco.
  const usada = { 77: { hasta: AHORA.getTime() + 86400000, usada: hace(40).getTime() } };
  assert.equal(paraPegar("77", fila({ id_ultimo_del_lead: 12, id_ultimo_de_la_cuenta: 11 }), usada, AHORA).motivo, "no tiene la marca de retomada");
});

test("una charla que ya es de Cande, con la marca puesta: lo que escribió a mano la deja de ella (no hay nada que anotar)", async () => {
  const { m, base, reglas } = mundoReglas({ contacto: { ig_id: "501", dueno: "cande", dueno_desde: hace(5) }, rutas: {
    "/me/conversations": bandeja(hiloCrudo(1, [msj(3, PEGADO, { deCuenta: true, min: 2 }), msj(2, "hola", { min: 10 })])), "/501": perfilDe(false),
  } });
  await base.guardarConfig(CLAVE_RETOMADAS, marca());
  assert.equal(await reglas.porQueSale(m.contacto), "le escribiste vos");
  assert.deepEqual(base.anotadasCande, []);
});

test("rescate de una respuesta vencida en una charla que ya pasó a Cande, con la marca: no sale detrás de lo que ella escribió a mano", async () => {
  const { crearAgente } = await import("../lib/dm/agente.js");
  const { m, base, reglas } = mundoReglas({ contacto: { ig_id: "501", ig_usuario: "lead.prueba", dueno: "cande", dueno_desde: hace(5) }, rutas: {
    "/me/conversations": bandeja(hiloCrudo(1, [msj(3, PEGADO, { deCuenta: true, min: 2 }), msj(2, "hola", { min: 10 })])), "/501": perfilDe(false),
  } });
  await base.guardarConfig(CLAVE_RETOMADAS, marca());
  const enviados = [];
  const avisos = [];
  const marcadas = [];
  const agente = crearAgente({
    base: {
      ...base,
      ajustes: async () => ({ modo: "auto", envio: "campo", instagram: true }),
      contacto: async () => ({ ...m.contacto }),
      historial: async () => [
        { id: 1, quien: "agente", texto: "Mensaje de prueba del agente?", creado: hace(20) },
        { id: 2, quien: "lead", texto: "hola", creado: hace(10) },
      ],
      marcarSalida: async (id, estado) => { marcadas.push(estado); },
    },
    pedir: async () => { throw new Error("no se le pide nada al modelo"); },
    manychat: {
      mandarTextos: async (id, textos) => { enviados.push(...textos); return { ok: true }; },
      ponerCampo: async () => ({ ok: true }),
      datosDe: async () => ({ ok: true, ig_username: "lead.prueba" }),
    },
    avisar: async (titulo) => { avisos.push(titulo); return true; },
    reloj: () => AHORA, instagram: reglas, esperaInstagramMs: 2000,
  });
  const v = {
    id: "77", nombre: "Lead de prueba", dueno: "cande", ultimo_lead: hace(10), ig_usuario: "lead.prueba", salida: 1, accion: "pasar_a_cande",
    mensajes: ["Te paso con alguien de prueba"], hasta_lead: 2, escribio_despues: false, charla_cambio: false,
  };
  assert.equal(await agente.rescatarVencida(v), "pasada a Cande");
  assert.deepEqual(enviados, [], "no sale nada detrás de ella");
  assert.deepEqual(base.anotadasCande, []);
  assert.equal(m.contacto.dueno, "cande");
});

test("la vuelta del cron: si la base falla en una charla (leer la marca o anotar), sigue con las demás, no avisa de Instagram y esa charla se vuelve a mirar", async () => {
  const hilos = [
    hiloCrudo(1, [msj(3, PEGADO, { deCuenta: true, min: 2, otro: LEAD_A }), msj(2, "hola", { min: 900, otro: LEAD_A })], 2),
    hiloCrudo(2, [msj(13, "--", { deCuenta: true, min: 5, otro: LEAD_B }), msj(12, "hola", { min: 900, otro: LEAD_B })], 5),
  ];
  const corte = () => Object.assign(new Error("la base de prueba cortó la conexión"), { code: "57P01" });
  for (const falla of ["leer la marca", "anotar"]) {
    const { w, base } = mundoVarias({
      contactos: [{ id: "77", otro: LEAD_A }, { id: "78", otro: LEAD_B }], hilos, marcas: { 77: { hasta: AHORA.getTime() + 86400000 } },
    });
    if (falla === "leer la marca") {
      const leer = base.leerConfig;
      base.leerConfig = async (k) => { if (k === CLAVE_RETOMADAS) throw corte(); return leer(k); };
    } else {
      base.anotarCandeDesdeIg = async () => { throw corte(); };
    }
    const desde = hace(10);
    const r = await w.vuelta(desde);
    assert.equal(r.fallidas, 1, falla);
    assert.equal(r.sacadas, 1, `${falla}: la otra charla se mira igual`);
    assert.equal(w.contactos.get("78").dueno, "cande", falla);
    assert.equal(w.contactos.get("77").dueno, "agente", falla);
    assert.equal(w.registradas.length, 1, falla);
    assert.deepEqual(w.avisos, [], `${falla}: no es la conexión con Instagram`);
    assert.ok(r.hasta < hace(2) && r.hasta >= desde, `${falla}: lo mirado queda antes de la charla que falló`);
  }
});
