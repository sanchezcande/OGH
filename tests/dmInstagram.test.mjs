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
  ErrorInstagram, usuarioIg, manualEnHilo, desdeManual,
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
    conocidos: [],
    textosDeLaCuenta: async () => base.conocidos,
    loSigue: async (u) => base.seguidos.has(u),
    anotarSeguidos: async (us) => { us.forEach((u) => base.seguidos.add(u)); return base.seguidos.size; },
    tomar: async (id, marca) => (m.tomado || m.contacto.dueno !== "agente" ? null : ((m.tomado = marca), { ...m.contacto })),
    soltar: async (id, marca) => { if (m.tomado === marca) m.tomado = null; },
    descartarPendientes: async () => { m.descartados++; },
    borrarCharla: async () => { m.borrada = true; m.contacto.dueno = "cande"; },
    ponerDueno: async (id, d) => { m.contacto.dueno = d; },
    anotar: async (id, quien, texto) => { m.notas.push({ quien, texto }); },
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
  const conocidos = ["Qué piolaaa! Y estás buscando trabajo?", "Holiii gracias por seguirme! :) tenemos alguien en común o te aparecí en el feed?"];
  assert.ok(manualEnHilo(h([msj(2, "Uy si ahí vi, ya te contesto yo", { deCuenta: true, min: 5 })]), CUENTA, conocidos, desde));
  assert.equal(manualEnHilo(h([msj(2, "Qué piolaaa!\nY estás buscando trabajo?", { deCuenta: true, min: 5 })]), CUENTA, conocidos, desde), null, "lo mandó el agente");
  assert.equal(manualEnHilo(h([msj(2, "Holiii gracias por seguirme! :) tenemos alguien en común o te aparecí en el feed?", { deCuenta: true, min: 5 })]), CUENTA, conocidos, desde), null, "es el automático");
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
