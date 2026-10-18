// El comprobante del pago en pesos por foto (19/10): con la Mac contestando, el agente mira la foto del
// lead; si es un comprobante (o el lead dice que pagó), a Cande le llega un aviso YA con la foto y el
// borrador del código, y el bot lo manda cuando ella responde ok. Sin la Mac, o si no la pudo ver, la foto
// va a Cande con el aviso URGENTE de siempre.
//
// Base, modelo, ManyChat, Instagram y Telegram de mentira. Ninguna prueba sale a la red. Todos los textos,
// links, códigos y plantillas son inventados para la prueba: este repo es público, el código de acceso y el
// texto del mensaje viven solo en la base.
//
// Lo que NO cubren: las consultas de lib/dm/base.js (codigoDe, tomarBorradorCodigo, guardarBorradorCodigo,
// marcarAvisoCodigo, codigosSinAviso, reclamarAvisoFoto con soloVistas, la columna imagenes de dm_trabajos),
// que Instagram de verdad dé los adjuntos con attachments{image_data{url}} y que Telegram baje la foto de Meta
// con sendPhoto. Eso se mira con la base y el bot reales antes de subir.
//
// Correr:  node --test tests/*.test.mjs
import "./dobles/preparar.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";

const { crearAgente, esFoto, urlDeFoto, SIN_TEXTO } = await import("../lib/dm/agente.js");
const { revisar, normalizar, tieneCodigo } = await import("../lib/dm/frenos.js");
const { validarAjustes } = await import("../lib/dm/base.js");
const { crearCerebroLocal } = await import("../lib/dm/cola.js");
const {
  crearRespuestaTelegram, leerRespuesta, esOk, ofreceCodigo, MARCA_OK, TITULOS_CODIGO,
} = await import("../lib/dm/respuestas.js");
const { crearReglasInstagram, crearInstagram } = await import("../lib/dm/instagram.js");
const { avisar: avisarTelegram } = await import("../lib/notificar.js");
const { Salida } = await import("../lib/dm/modelo.js");

const HORA = 3600000;
const AHORA = new Date("2026-10-19T15:00:00Z");
const ID = "123456789";
const FOTO = "https://lookaside.fbsbx.com/ig_messaging_cdn/?asset_id=111&signature=prueba";
const FOTO_2 = "https://lookaside.fbsbx.com/ig_messaging_cdn/?asset_id=222&signature=prueba";
const FOTO_IG = "https://scontent.xx.fbcdn.net/v/t1.15752-9/foto-de-prueba.jpg";
const CODIGO = "CODIGOPRUEBA";
const PLANTILLA = "Mensaje de prueba con el código {codigo}\n{link}";
const LINK_PAGO = "https://pago.ejemplo.com/programa-de-prueba";
const BORRADOR = `Mensaje de prueba con el código ${CODIGO}\n${LINK_PAGO}/${CODIGO}`;

const estadoDev = { quien: "dev", busca: "si", dolor: "de prueba", etapa: "precio", link_formulario_enviado: true, precio_dicho: true };
const salida = (mensajes, extra = {}) => ({
  accion: "responder", mensajes, estado: estadoDev, aviso_para_cande: "", seguimiento_en_horas: null, motivo: "prueba", ...extra,
});
/** Lo que devuelve el cerebro nuevo: la salida y cuántas fotos pudo ver. */
const vio = (n, extra = {}) => ({ ...salida(["Acuse de prueba"], extra), _imagenes_vistas: n });
const COMPROBANTE = { pago_pesos: "comprobante", aviso_para_cande: "YA: comprobante de prueba aprobado" };

/**
 * Un agente con todo de mentira. `m` es el mundo: lo guardado y lo que hizo el agente. La charla arranca con un
 * mensaje del lead ya contestado; cada prueba le suma lo suyo con `entra`.
 */
function mundo({
  macViva = true, responde = () => vio(1, COMPROBANTE), ajustes = {}, avisoSale = true, instagram = null, mandar = null,
} = {}) {
  const m = {
    ajustes: {
      modo: "auto", envio: "api", espera_ms: 0, tope_por_dia: 12, toques: false, aviso_ia: false,
      link_de_pago: LINK_PAGO, link_mercadopago: "", codigo_mercadopago: CODIGO, mensaje_codigo_mp: PLANTILLA, ...ajustes,
    },
    contacto: {
      id: ID, nombre: "Lead De Prueba", dueno: "agente", toques: 0, proximo_toque: null, respondido_hasta: 1, contexto: null,
      estado: estadoDev, ultimo_lead: new Date(AHORA - HORA), ig_usuario: "lead.prueba", foto_avisada_hasta: 0, foto_avisada_en: null,
    },
    mensajes: [{ id: 1, quien: "lead", texto: "mensaje de prueba", creado: new Date(AHORA - HORA) }],
    salidas: [], enviados: [], avisos: [], pedidos: [], tomado: null, vistos: new Set(), tope: 0, macViva,
  };
  m.entra = (texto, seg = 0) => {
    const id = m.mensajes.length + 1;
    m.mensajes.push({ id, quien: "lead", texto, creado: new Date(AHORA.getTime() - seg * 1000) });
    m.contacto.ultimo_lead = AHORA;
    return id;
  };
  const delLead = () => m.mensajes.filter((x) => x.quien === "lead");
  const CODIGOS = ["borrador", "enviando", "enviada", "incierta"];
  const base = {
    tablas: async () => {},
    ajustes: async () => m.ajustes,
    prompt: async () => "PROMPT DE PRUEBA",
    contacto: async () => (m.contacto ? { ...m.contacto } : null),
    ultimoIdLead: async () => delLead().at(-1)?.id ?? null,
    historial: async (id, tope = 80) => m.mensajes.slice(-tope),
    corridasEnUnDia: async () => m.tope,
    tomar: async (id, marca, { cualquierDueno = false } = {}) => {
      if (m.tomado || (m.contacto.dueno !== "agente" && !cualquierDueno)) return null;
      m.tomado = marca;
      return { ...m.contacto };
    },
    soltar: async (id, marca) => { if (m.tomado === marca) m.tomado = null; },
    descartarPendientes: async () => {},
    ponerDueno: async (id, d) => { m.contacto.dueno = d; },
    guardarSalida: async (s) => { m.salidas.push({ ...s, creado: AHORA }); return m.salidas.length; },
    marcarSalida: async (idSalida, estado, detalle) => { Object.assign(m.salidas[idSalida - 1], { estado, detalle }); },
    anotar: async (id, quien, texto) => { m.mensajes.push({ id: m.mensajes.length + 1, quien, texto, creado: AHORA }); },
    anotarDeCande: async (id, texto) => { m.mensajes.push({ id: m.mensajes.length + 1, quien: "cande", texto, creado: AHORA }); },
    guardarEstado: async (id, e) => { m.contacto.estado = e; },
    cerrarTurno: async (id, cual) => { m.contacto.respondido_hasta = Math.max(m.contacto.respondido_hasta, cual); },
    marcarAltaAvisada: async () => {},
    guardarIg: async () => {},
    // Como base.reclamarAvisoFoto: el aviso del pago (soloVistas) sale aunque haga poco de otro y no junta las que siguen.
    reclamarAvisoFoto: async (id, hasta, { soloVistas = false } = {}) => {
      const c = m.contacto;
      const en = c.foto_avisada_en ? c.foto_avisada_en.getTime() : null;
      if ((c.foto_avisada_hasta || 0) >= hasta) return null;
      if (!soloVistas && en !== null && en >= (m.ahora ?? AHORA).getTime() - 2 * 60000) return null;
      const antes = { hasta: c.foto_avisada_hasta || 0, en: c.foto_avisada_en || null };
      Object.assign(c, { foto_avisada_hasta: hasta, foto_avisada_en: soloVistas ? null : new Date((m.ahora ?? AHORA).getTime()) });
      return antes;
    },
    soltarAvisoFoto: async (id, hasta, antes) => {
      if (m.contacto.foto_avisada_hasta === hasta) Object.assign(m.contacto, { foto_avisada_hasta: antes.hasta, foto_avisada_en: antes.en });
    },
    codigoDe: async () => {
      const i = m.salidas.findLastIndex((s) => s.accion === "codigo_mp" && CODIGOS.includes(s.estado));
      return i < 0 ? null : { id: i + 1, ...m.salidas[i] };
    },
    guardarBorradorCodigo: async ({ contacto, mensajes, motivo, aviso }) => {
      m.salidas.push({ contacto, accion: "codigo_mp", mensajes, motivo, aviso: JSON.stringify(aviso), estado: "borrador", detalle: "aviso sin salir", creado: AHORA });
      return m.salidas.length;
    },
    marcarAvisoCodigo: async (idSalida, { salio = false, aviso = null } = {}) => {
      const s = m.salidas[idSalida - 1];
      if (s?.accion !== "codigo_mp" || s.estado !== "borrador") return;
      Object.assign(s, { detalle: salio ? "aviso salió" : "aviso sin salir" }, aviso ? { aviso: JSON.stringify(aviso) } : {});
    },
    codigosSinAviso: async () => m.salidas.map((s, i) => ({ id: i + 1, ...s }))
      .filter((s) => s.accion === "codigo_mp" && s.estado === "borrador" && s.detalle === "aviso sin salir"),
    tomarBorradorCodigo: async () => {
      const i = m.salidas.findLastIndex((s) => s.accion === "codigo_mp" && s.estado === "borrador");
      if (i < 0) return null;
      m.salidas[i].estado = "enviando";
      return { id: i + 1, mensajes: m.salidas[i].mensajes };
    },
    reclamarNovedad: async (u) => { if (m.vistos.has(u)) return false; m.vistos.add(u); return true; },
  };
  const pedir = async (p) => {
    m.pedidos.push(p);
    return responde(p, m);
  };
  const manychat = {
    hayManyChat: () => true,
    mandarTextos: mandar || (async (id, textos) => { m.enviados.push(...textos); return { ok: true }; }),
    ponerCampo: async () => ({ ok: true }),
  };
  const avisar = async (titulo, campos, opciones = {}) => {
    const sale = typeof avisoSale === "function" ? avisoSale(titulo, campos) : avisoSale;
    m.avisos.push({ titulo, campos, foto: opciones.foto || null, sale });
    return sale;
  };
  const agente = crearAgente({
    base, pedir, manychat, avisar, esperar: async () => {}, reloj: () => AHORA, instagram, esperaInstagramMs: 50,
    veFotos: async () => m.macViva,
  });
  const dichos = [];
  const responder = crearRespuestaTelegram({ base, manychat, decir: async (t) => { dichos.push(t); }, agente });
  return { agente, m, base, responder, dichos };
}

/** El aviso como lo ve Cande en Telegram (lib/notificar.js, sin las marcas de HTML). */
const comoLoVe = (a) => `🔔 ${a.titulo}\n\n${Object.entries(a.campos).filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => `${k}: ${v}`).join("\n")}`;
/** Cande responde ese aviso en su chat con el bot. Si el aviso fue con foto, el texto llega como epígrafe. */
let novedades = 100;
const respondeAviso = (aviso, texto, { updateId = ++novedades } = {}) => ({
  update_id: updateId,
  message: {
    message_id: 9, text: texto, chat: { id: "42", type: "private" }, from: { id: "42" },
    reply_to_message: { [aviso.foto ? "caption" : "text"]: comoLoVe(aviso), date: Math.floor(AHORA.getTime() / 1000), from: { is_bot: true } },
  },
});
const urgentesDeFoto = (m) => m.avisos.filter((a) => /URGENTE: mandó una foto$/.test(a.titulo));
const sinSignos = (x) => assert.doesNotMatch(JSON.stringify(x), /[—¿¡]/);

/* ---------- la foto con la Mac contestando ---------- */

test("comprobante: la foto va al agente con su link, al lead solo el acuse (sin código), y a Cande un aviso YA con la foto y el borrador", async () => {
  const { agente, m } = mundo();
  const foto = m.entra(FOTO);
  const r = await agente.procesar(ID, foto);
  assert.equal(r.hecho, "enviada");
  assert.deepEqual(m.pedidos[0].imagenes, [FOTO], "el trabajo trae el link de la foto");
  assert.deepEqual(m.pedidos[0].turno.mensajes_del_lead, [FOTO]);
  assert.deepEqual(m.enviados, ["Acuse de prueba"]);
  assert.ok(!m.enviados.some((t) => tieneCodigo(t, CODIGO)), "el código no sale solo");
  // El borrador, desde la plantilla de los ajustes, esperando el ok.
  const borradores = m.salidas.filter((s) => s.accion === "codigo_mp");
  assert.deepEqual(borradores.map((s) => [s.estado, s.mensajes]), [["borrador", [BORRADOR]]]);
  // Un solo aviso: el YA con la foto. Ni el URGENTE de siempre.
  assert.equal(m.avisos.length, 1);
  const a = m.avisos[0];
  assert.equal(a.titulo, `Lead De Prueba · ${TITULOS_CODIGO.comprobante}`);
  assert.equal(a.foto, FOTO);
  assert.equal(Object.keys(a.campos)[0], "Quién");
  assert.match(a.campos.Aviso, /^YA: /);
  assert.match(a.campos.Aviso, /comprobante de prueba aprobado/, "lo que vio el agente");
  assert.equal(a.campos.Borrador, BORRADOR, "el borrador tal cual");
  assert.equal(a.campos["Si está bien"], MARCA_OK);
  assert.equal(a.campos.Instagram, "https://ig.me/m/lead.prueba");
  sinSignos(a);
  // La foto queda con su constancia (el cron no la vuelve a avisar) y el turno, atendido.
  assert.equal(m.contacto.foto_avisada_hasta, foto);
  assert.equal(m.contacto.respondido_hasta, foto);
  assert.equal(m.contacto.dueno, "agente");
  assert.equal(await agente.avisarFotosPendientes([ID]), 0);
});

test("dice que pagó (sin foto): el mismo aviso YA con el borrador, sin foto", async () => {
  const { agente, m } = mundo({ responde: () => salida(["Acuse de prueba"], { pago_pesos: "dice", aviso_para_cande: "YA: avisó que pagó" }) });
  const r = await agente.procesar(ID, m.entra("listo, ya lo pagué por la app de prueba"));
  assert.equal(r.hecho, "enviada");
  assert.equal(m.pedidos[0].imagenes, undefined, "sin fotos el pedido es el de siempre");
  assert.deepEqual(m.enviados, ["Acuse de prueba"]);
  assert.equal(m.avisos.length, 1);
  assert.equal(m.avisos[0].titulo, `Lead De Prueba · ${TITULOS_CODIGO.dice}`);
  assert.equal(m.avisos[0].foto, null);
  assert.equal(m.avisos[0].campos.Borrador, BORRADOR);
  assert.equal(m.avisos[0].campos.Dijo, "listo, ya lo pagué por la app de prueba");
});

test("dudoso: el aviso YA con la foto y por qué, pero sin borrador ni ok", async () => {
  const { agente, m } = mundo({ responde: () => vio(1, { pago_pesos: "dudoso", aviso_para_cande: "YA: el monto no es el del programa" }) });
  const foto = m.entra(FOTO);
  await agente.procesar(ID, foto);
  assert.equal(m.avisos.length, 1);
  const a = m.avisos[0];
  assert.match(a.titulo, /mandó una foto que no pude confirmar como pago$/);
  assert.match(a.campos.Aviso, /^YA: Mandó una foto que no pude confirmar como pago\. el monto no es el del programa/);
  assert.equal(a.foto, FOTO);
  assert.equal(a.campos.Borrador, undefined);
  assert.equal(a.campos["Si está bien"], undefined);
  assert.equal(m.salidas.filter((s) => s.accion === "codigo_mp").length, 0);
  assert.equal(ofreceCodigo(comoLoVe(a)), false);
  assert.equal(m.contacto.foto_avisada_hasta, foto);
  sinSignos(a);
});

test("una foto que el agente vio y no es un pago: el URGENTE de siempre, con la foto", async () => {
  const { agente, m } = mundo({ responde: () => vio(1, { pago_pesos: null }) });
  await agente.procesar(ID, m.entra(FOTO));
  assert.equal(urgentesDeFoto(m).length, 1);
  assert.equal(urgentesDeFoto(m)[0].foto, FOTO);
  assert.equal(m.salidas.filter((s) => s.accion === "codigo_mp").length, 0);
});

/* ---------- el ok de Cande ---------- */

test("ok de Cande: sale el borrador tal cual, una sola vez, aunque Telegram reintente o responda ok de nuevo", async () => {
  const { agente, m, responder, dichos } = mundo();
  await agente.procesar(ID, m.entra(FOTO));
  const aviso = m.avisos[0];
  const novedad = respondeAviso(aviso, "ok");
  const r = leerRespuesta(novedad, { duena: "42" });
  assert.equal(r.accion, "ok");
  assert.equal(r.contacto, ID);
  assert.equal(await responder(r, { updateId: novedad.update_id }), "codigo enviado");
  assert.deepEqual(m.enviados, ["Acuse de prueba", BORRADOR]);
  assert.equal(m.salidas.find((s) => s.accion === "codigo_mp").estado, "enviada");
  assert.equal(m.mensajes.at(-1).quien, "cande", "queda en el historial como de Cande");
  assert.match(dichos.at(-1), /^✓ Le mandé el código a Lead De Prueba/);
  // Telegram reintenta la misma novedad: nada.
  assert.equal(await responder(r, { updateId: novedad.update_id }), "repetida");
  // Responde ok de nuevo (otra novedad): nada, y se lo dice.
  for (const t of ["dale", "Sí", "mandá", "listo!"]) {
    const otra = respondeAviso(aviso, t);
    assert.equal(await responder(leerRespuesta(otra, { duena: "42" }), { updateId: otra.update_id }), "ok sin borrador", t);
  }
  assert.match(dichos.at(-1), /Ya se lo había mandado/);
  assert.deepEqual(m.enviados, ["Acuse de prueba", BORRADOR], "salió una sola vez");
});

test("ok sin borrador vigente: no manda nada y se lo dice", async () => {
  const { m, responder, dichos } = mundo();
  const aviso = { titulo: `Lead De Prueba · ${TITULOS_CODIGO.comprobante}`, campos: { Quién: `Lead De Prueba (${ID})`, "Si está bien": MARCA_OK }, foto: FOTO };
  const novedad = respondeAviso(aviso, "OK");
  const r = leerRespuesta(novedad, { duena: "42" });
  assert.equal(r.accion, "ok");
  assert.equal(await responder(r, { updateId: novedad.update_id }), "ok sin borrador");
  assert.deepEqual(m.enviados, []);
  assert.match(dichos[0], /No hay nada pendiente para mandarle a Lead De Prueba/);
});

test("si ManyChat no lo deja salir, el borrador sigue guardado y un ok después lo manda", async () => {
  let anda = false;
  const salidos = [];
  const { agente, m, responder, dichos } = mundo({
    mandar: async (id, textos) => {
      if (textos.includes(BORRADOR) && !anda) return { ok: false, code: 3011, error: "fuera de la ventana" };
      salidos.push(...textos);
      return { ok: true };
    },
  });
  await agente.procesar(ID, m.entra(FOTO));
  const aviso = m.avisos[0];
  const uno = respondeAviso(aviso, "ok");
  assert.equal(await responder(leerRespuesta(uno, { duena: "42" }), { updateId: uno.update_id }), "codigo sin salir");
  assert.match(dichos.at(-1), /El borrador sigue guardado/);
  assert.equal(m.salidas.find((s) => s.accion === "codigo_mp").estado, "borrador");
  anda = true;
  const dos = respondeAviso(aviso, "ok");
  assert.equal(await responder(leerRespuesta(dos, { duena: "42" }), { updateId: dos.update_id }), "codigo enviado");
  assert.deepEqual(salidos.filter((t) => t === BORRADOR), [BORRADOR]);
});

test("cualquier otra respuesta al aviso del código sigue siendo una indicación, como hoy; un ok a otro aviso también", () => {
  const aviso = { titulo: `Lead De Prueba · ${TITULOS_CODIGO.dice}`, campos: { Quién: `Lead De Prueba (${ID})`, Borrador: BORRADOR, "Si está bien": MARCA_OK }, foto: null };
  for (const t of ["decile que gracias", "ok pero cambiale el link", "okey dale", "no"]) {
    assert.equal(leerRespuesta(respondeAviso(aviso, t), { duena: "42" }).accion, "indicacion", t);
  }
  assert.equal(leerRespuesta(respondeAviso(aviso, "/textual hola"), { duena: "42" }).accion, "mandar");
  assert.equal(leerRespuesta(respondeAviso(aviso, "--"), { duena: "42" }).accion, "cande");
  const otro = { titulo: "Lead De Prueba · DM: te paso una charla", campos: { Quién: `Lead De Prueba (${ID})`, Dijo: MARCA_OK }, foto: null };
  assert.equal(leerRespuesta(respondeAviso(otro, "ok"), { duena: "42" }).accion, "indicacion", "un ok a otro aviso no manda el código");
  // El nombre del lead no puede fingir el título: el título es el final del primer renglón.
  const fingido = { titulo: `${TITULOS_CODIGO.dice} · DM: te paso una charla`, campos: { Quién: `x (${ID})`, Dijo: MARCA_OK }, foto: null };
  assert.equal(ofreceCodigo(comoLoVe(fingido)), false);
  for (const t of ["ok", "OK", "Ok.", "dale", "si", "sí", "Sí!", "mandalo", "mandá", "va", "listo"]) assert.equal(esOk(t), true, t);
  for (const t of ["ok gracias", "dale mandale", "sii", "", "no"]) assert.equal(esOk(t), false, t);
});

/* ---------- un solo código por lead, y lo que falta ---------- */

test("un solo código por lead: si ya salió (por un ok o en la charla) no se arma otro; si hay uno esperando, es ese", async () => {
  const yaSalio = mundo();
  yaSalio.m.salidas.push({ contacto: ID, accion: "codigo_mp", mensajes: [BORRADOR], estado: "enviada", creado: AHORA });
  await yaSalio.agente.procesar(ID, yaSalio.m.entra(FOTO));
  assert.equal(yaSalio.m.salidas.filter((s) => s.accion === "codigo_mp").length, 1);
  assert.equal(yaSalio.m.avisos[0].campos.Borrador, undefined);
  assert.match(yaSalio.m.avisos[0].campos.Ojo, /ya le salió antes/);

  const enLaCharla = mundo();
  enLaCharla.m.mensajes.push({ id: 2, quien: "cande", texto: `tomá: ${CODIGO.toLowerCase()}`, creado: AHORA });
  await enLaCharla.agente.procesar(ID, enLaCharla.m.entra(FOTO));
  assert.equal(enLaCharla.m.salidas.filter((s) => s.accion === "codigo_mp").length, 0);
  assert.match(enLaCharla.m.avisos[0].campos.Ojo, /ya le salió antes en la charla/);

  const esperando = mundo();
  esperando.m.salidas.push({ contacto: ID, accion: "codigo_mp", mensajes: ["Borrador anterior de prueba"], estado: "borrador", creado: AHORA });
  await esperando.agente.procesar(ID, esperando.m.entra(FOTO));
  assert.equal(esperando.m.salidas.filter((s) => s.accion === "codigo_mp").length, 1);
  assert.equal(esperando.m.avisos[0].campos.Borrador, "Borrador anterior de prueba");
  assert.equal(esperando.m.avisos[0].campos["Si está bien"], MARCA_OK);
});

test("sin la plantilla (o sin el código) cargados no hay borrador, y el aviso dice qué falta", async () => {
  for (const [ajustes, falta] of [[{ mensaje_codigo_mp: "" }, /mensaje_codigo_mp/], [{ codigo_mercadopago: "" }, /codigo_mercadopago/]]) {
    const { agente, m } = mundo({ ajustes });
    await agente.procesar(ID, m.entra(FOTO));
    assert.equal(m.salidas.filter((s) => s.accion === "codigo_mp").length, 0);
    assert.equal(m.avisos.length, 1);
    assert.equal(m.avisos[0].campos.Borrador, undefined);
    assert.match(m.avisos[0].campos.Ojo, falta);
    assert.equal(m.avisos[0].campos["Si está bien"], undefined, "sin borrador no se ofrece el ok");
  }
  assert.equal(validarAjustes({ mensaje_codigo_mp: PLANTILLA }).ok, true);
  assert.equal(validarAjustes({ mensaje_codigo_mp: "x".repeat(901) }).ok, false);
  assert.equal(validarAjustes({ mensaje_codigo_mp: 7 }).ok, false);
});

test("el agente nunca escribe el código: suelto o en el link, lo frenan los frenos y la charla pasa a Cande", async () => {
  const dev = { textosDelLead: ["listo"], charlaDelLead: ["soy dev y busco", "listo"], estadoPrevio: estadoDev };
  assert.equal(revisar(salida([`Genial! el código es ${CODIGO}`]), { ...dev, codigoMp: CODIGO }).motivo, "el código de acceso sale solo con el ok de Cande");
  assert.equal(revisar(salida([`Acá va: ${LINK_PAGO}/${CODIGO.toLowerCase()}`]), { ...dev, linkDePago: LINK_PAGO, codigoMp: CODIGO }).ok, false);
  assert.deepEqual(revisar(salida(["Acuse de prueba"]), { ...dev, codigoMp: CODIGO }), { ok: true });
  assert.equal(tieneCodigo(`x${CODIGO}x`, CODIGO), false, "pegado a otra palabra no es el código");
  assert.equal(tieneCodigo("cualquier cosa", ""), false);
  const { agente, m } = mundo({ responde: () => salida([`Genial! el código es ${CODIGO}`], { pago_pesos: "dice" }) });
  assert.equal((await agente.procesar(ID, m.entra("ya pagué"))).hecho, "frenada");
  assert.deepEqual(m.enviados, []);
  assert.equal(m.contacto.dueno, "cande");
  assert.ok(m.avisos.some((a) => a.campos.Borrador === BORRADOR), "el borrador le llega igual: lo manda ella con su ok");
});

/* ---------- la foto que llega después del aviso, y el aviso que no sale ---------- */

/** Una foto del lead que llega `seg` segundos después de AHORA (la hora del primer aviso en estas pruebas). */
const llegaDespues = (m, texto, seg) => {
  const id = m.mensajes.length + 1;
  m.ahora = new Date(AHORA.getTime() + seg * 1000);
  m.mensajes.push({ id, quien: "lead", texto, creado: m.ahora });
  return id;
};

test("la foto buena que llega enseguida después del aviso de una dudosa la mira el agente y arma el borrador", async () => {
  for (const seg of [40, 90]) {
    const { agente, m } = mundo({
      responde: (p) => (p.imagenes?.[0] === FOTO
        ? vio(1, { pago_pesos: "dudoso", aviso_para_cande: "YA: pendiente de prueba" })
        : vio(1, COMPROBANTE)),
    });
    await agente.procesar(ID, m.entra(FOTO, 30));
    assert.equal(m.avisos.length, 1, `${seg}: el aviso de la dudosa`);
    const buena = llegaDespues(m, FOTO_2, seg);
    assert.equal((await agente.procesar(ID, buena)).hecho, "enviada", `${seg}: no se cierra como solo foto`);
    assert.deepEqual(m.pedidos.map((p) => p.imagenes), [[FOTO], [FOTO_2]], `${seg}: el agente mira la segunda`);
    assert.equal(m.avisos.length, 2);
    assert.equal(m.avisos[1].titulo, `Lead De Prueba · ${TITULOS_CODIGO.comprobante}`);
    assert.equal(m.avisos[1].foto, FOTO_2);
    assert.equal(m.avisos[1].campos.Borrador, BORRADOR);
    assert.equal(m.contacto.foto_avisada_hasta, buena);
    assert.equal(await agente.avisarFotosPendientes([ID]), 0, `${seg}: el cron no la repite`);
  }
});

test("después del aviso del pago no se junta ninguna foto: sin la Mac va con el URGENTE, y si la corrida se cortó, la avisa el cron", async () => {
  const sinMac = mundo({ responde: () => vio(1, { pago_pesos: "dudoso", aviso_para_cande: "YA: pendiente de prueba" }) });
  await sinMac.agente.procesar(ID, sinMac.m.entra(FOTO, 30));
  sinMac.m.macViva = false;
  const otra = llegaDespues(sinMac.m, FOTO_2, 30);
  assert.equal((await sinMac.agente.procesar(ID, otra)).hecho, "solo foto");
  assert.equal(urgentesDeFoto(sinMac.m).length, 1);
  assert.equal(urgentesDeFoto(sinMac.m)[0].foto, FOTO_2);

  const cortada = mundo({ responde: () => vio(1, { pago_pesos: "dudoso", aviso_para_cande: "YA: pendiente de prueba" }) });
  await cortada.agente.procesar(ID, cortada.m.entra(FOTO, 30));
  llegaDespues(cortada.m, FOTO_2, 60); // su corrida no llegó a nada
  assert.equal(await cortada.agente.avisarFotosPendientes([ID]), 1);
  assert.equal(urgentesDeFoto(cortada.m)[0].foto, FOTO_2);
  assert.equal(await cortada.agente.avisarFotosPendientes([ID]), 0);
});

test("ok a un aviso del código que no trae borrador (ya salió, o falta la plantilla): no va al agente y no le manda nada", async () => {
  const sinPlantilla = mundo({ ajustes: { mensaje_codigo_mp: "" } });
  await sinPlantilla.agente.procesar(ID, sinPlantilla.m.entra(FOTO));
  const yaSalio = mundo();
  yaSalio.m.salidas.push({ contacto: ID, accion: "codigo_mp", mensajes: [BORRADOR], estado: "enviada", creado: AHORA });
  await yaSalio.agente.procesar(ID, yaSalio.m.entra(FOTO));
  for (const [{ m, responder, dichos }, dice] of [[sinPlantilla, /No hay nada pendiente/], [yaSalio, /Ya se lo había mandado/]]) {
    const aviso = m.avisos[0];
    assert.equal(aviso.campos.Borrador, undefined);
    assert.equal(ofreceCodigo(comoLoVe(aviso)), true, "es el aviso del código aunque no traiga borrador");
    const novedad = respondeAviso(aviso, "ok");
    const r = leerRespuesta(novedad, { duena: "42" });
    assert.equal(r.accion, "ok");
    const pedidos = m.pedidos.length;
    assert.equal(await responder(r, { updateId: novedad.update_id }), "ok sin borrador");
    assert.equal(m.pedidos.length, pedidos, "no se le pide nada al agente");
    assert.deepEqual(m.enviados, ["Acuse de prueba"], "al lead no le sale nada más");
    assert.match(dichos.at(-1), dice);
  }
});

test("si el aviso YA no sale, el borrador queda con su aviso y el cron de los toques lo manda después, con la foto y el ok", async () => {
  let telegram = false;
  const { agente, m, base, responder } = mundo({ avisoSale: () => telegram });
  const foto = m.entra(FOTO);
  assert.equal((await agente.procesar(ID, foto)).hecho, "enviada");
  assert.deepEqual(m.enviados, ["Acuse de prueba"]);
  const fila = m.salidas.find((s) => s.accion === "codigo_mp");
  assert.equal(fila.estado, "borrador");
  assert.equal(fila.detalle, "aviso sin salir");
  // La foto va en el reintento del aviso del código: el cron de las fotos no manda otro URGENTE.
  assert.equal(m.contacto.foto_avisada_hasta, foto);
  assert.equal(await agente.avisarFotosPendientes([ID]), 0);
  // Telegram sigue caído: no sale y queda para la vuelta siguiente.
  assert.equal(await agente.avisarCodigosPendientes(await base.codigosSinAviso()), 0);
  telegram = true;
  assert.equal(await agente.avisarCodigosPendientes(await base.codigosSinAviso()), 1);
  const tarde = m.avisos.at(-1);
  assert.equal(tarde.titulo, `Lead De Prueba · ${TITULOS_CODIGO.comprobante}`);
  assert.equal(tarde.foto, FOTO);
  assert.equal(Object.keys(tarde.campos)[0], "Quién");
  assert.equal(tarde.campos.Borrador, BORRADOR);
  assert.equal(tarde.campos["Si está bien"], MARCA_OK);
  assert.match(tarde.campos.Demora, /no había salido/);
  assert.equal(tarde.campos.Instagram, "https://ig.me/m/lead.prueba");
  sinSignos(tarde);
  assert.equal(fila.detalle, "aviso salió");
  assert.equal(await agente.avisarCodigosPendientes(await base.codigosSinAviso()), 0, "una sola vez");
  // Cande responde ok a ese aviso: sale el borrador.
  const novedad = respondeAviso(tarde, "dale");
  assert.equal(await responder(leerRespuesta(novedad, { duena: "42" }), { updateId: novedad.update_id }), "codigo enviado");
  assert.deepEqual(m.enviados, ["Acuse de prueba", BORRADOR]);

  // Dice que pagó, sin foto: lo mismo.
  let anda = false;
  const dice = mundo({ avisoSale: () => anda, responde: () => salida(["Acuse de prueba"], { pago_pesos: "dice", aviso_para_cande: "YA: avisó que pagó" }) });
  await dice.agente.procesar(ID, dice.m.entra("ya pagué por la app de prueba"));
  anda = true;
  assert.equal(await dice.agente.avisarCodigosPendientes(await dice.base.codigosSinAviso()), 1);
  assert.equal(dice.m.avisos.at(-1).titulo, `Lead De Prueba · ${TITULOS_CODIGO.dice}`);
  assert.equal(dice.m.avisos.at(-1).campos.Borrador, BORRADOR);

  // Sin borrador (dudoso), la foto vuelve a quedar sin aviso y la avisa el cron de las fotos, como siempre.
  let sale = false;
  const dudoso = mundo({ avisoSale: () => sale, responde: () => vio(1, { pago_pesos: "dudoso", aviso_para_cande: "YA: pendiente de prueba" }) });
  await dudoso.agente.procesar(ID, dudoso.m.entra(FOTO));
  sale = true;
  assert.equal(await dudoso.agente.avisarCodigosPendientes(await dudoso.base.codigosSinAviso()), 0);
  assert.equal(await dudoso.agente.avisarFotosPendientes([ID]), 1);
  assert.equal(urgentesDeFoto(dudoso.m).at(-1).foto, FOTO);
});

/* ---------- sin la Mac, o si no la pudo ver ---------- */

test("con la Mac sin contestar, la foto va a Cande como hoy: URGENTE enseguida, con la foto, y el turno cerrado como solo foto", async () => {
  const { agente, m } = mundo({ macViva: false, responde: () => { throw new Error("con la Mac apagada no se le pide nada"); } });
  const foto = m.entra(FOTO);
  assert.equal((await agente.procesar(ID, foto)).hecho, "solo foto");
  assert.equal(m.pedidos.length, 0);
  assert.equal(urgentesDeFoto(m).length, 1);
  assert.equal(urgentesDeFoto(m)[0].foto, FOTO, "el aviso de siempre también va con la foto");
  assert.equal(m.contacto.respondido_hasta, foto);
  assert.equal(m.salidas.length, 0);
});

test("si el modelo falla con un turno de solo fotos: el URGENTE de hoy una sola vez y el turno no queda trabado", async () => {
  const { agente, m } = mundo({ responde: () => { throw Object.assign(new Error("Claude tardó más de 70 segundos"), { transitorio: true }); } });
  const foto = m.entra(FOTO);
  const r = await agente.procesar(ID, foto);
  assert.equal(r.hecho, "solo foto");
  assert.equal(m.pedidos.length, 1, "se intentó que la mirara");
  assert.equal(urgentesDeFoto(m).length, 1);
  assert.equal(m.contacto.respondido_hasta, foto, "el turno queda atendido: la espera no lo vuelve a tomar");
  assert.equal(m.contacto.dueno, "agente");
  assert.equal(await agente.avisarFotosPendientes([ID]), 0, "el cron no lo repite");
  assert.equal(urgentesDeFoto(m).length, 1);
});

test("si el modelo falla con foto y texto: la foto se avisa ya y el texto queda en espera; el reintento no la vuelve a avisar ni a mandar", async () => {
  let falla = true;
  const { agente, m } = mundo({
    responde: (p) => {
      if (falla) throw Object.assign(new Error("Claude no pudo: algo de prueba"), { general: true, dudosa: true });
      return salida(["Respuesta de prueba?"]);
    },
  });
  m.entra("te paso algo de prueba", 5);
  const foto = m.entra(FOTO);
  const r = await agente.procesar(ID, foto);
  assert.equal(r.hecho, "error del modelo");
  assert.equal(r.reintento, true);
  assert.equal(urgentesDeFoto(m).length, 1);
  assert.ok(m.contacto.respondido_hasta < foto, "el texto sigue esperando respuesta");
  falla = false;
  assert.equal((await agente.procesar(ID, foto, { tarde: true })).hecho, "enviada");
  assert.equal(m.pedidos.at(-1).imagenes, undefined, "la foto ya tenía su aviso: no se manda a mirar de nuevo");
  assert.equal(urgentesDeFoto(m).length, 1);
  assert.deepEqual(m.enviados, ["Respuesta de prueba?"]);
});

test("cerebro de antes (no dice cuántas vio): la foto va con el URGENTE de hoy y un comprobante sin mirar no arma borrador", async () => {
  const { agente, m } = mundo({ responde: () => salida(["Respuesta de prueba?"], COMPROBANTE) });
  const foto = m.entra(FOTO);
  assert.equal((await agente.procesar(ID, foto)).hecho, "enviada");
  assert.equal(urgentesDeFoto(m).length, 1);
  assert.equal(m.salidas.filter((s) => s.accion === "codigo_mp").length, 0);
  assert.equal(m.contacto.foto_avisada_hasta, foto);
  // Y si vio menos de las que había (un video no se mira), tampoco.
  const parcial = mundo({ responde: () => vio(1, COMPROBANTE) });
  parcial.m.entra(FOTO, 5);
  const segunda = parcial.m.entra(FOTO_2);
  await parcial.agente.procesar(ID, segunda);
  assert.deepEqual(parcial.m.pedidos[0].imagenes, [FOTO, FOTO_2]);
  assert.equal(urgentesDeFoto(parcial.m).length, 1);
  assert.equal(parcial.m.salidas.filter((s) => s.accion === "codigo_mp").length, 0);
});

test("si la charla pasa a Cande antes de que el agente mire la foto (el tope del día), la foto igual le llega con el URGENTE", async () => {
  const { agente, m } = mundo();
  m.tope = 99;
  const foto = m.entra(FOTO);
  assert.equal((await agente.procesar(ID, foto)).hecho, "tope del día");
  assert.equal(m.contacto.dueno, "cande");
  assert.equal(m.pedidos.length, 0);
  assert.equal(urgentesDeFoto(m).length, 1);
  assert.equal(m.contacto.foto_avisada_hasta, foto);
});

test("si llega otro mensaje mientras espera, la foto la mira la corrida de ese mensaje, una vez", async () => {
  const { agente, m } = mundo();
  const foto = m.entra(FOTO, 5);
  const texto = m.entra("ahí te mandé algo de prueba");
  assert.equal((await agente.procesar(ID, foto)).hecho, "llegó otro mensaje");
  assert.equal(m.avisos.length, 0, "no avisa: se encarga la otra corrida");
  assert.equal((await agente.procesar(ID, texto)).hecho, "enviada");
  assert.deepEqual(m.pedidos[0].imagenes, [FOTO]);
  assert.equal(m.avisos.length, 1);
  assert.equal(m.avisos[0].campos.Dijo, "ahí te mandé algo de prueba");
});

/* ---------- la foto que llega sin link ---------- */

test("una foto sin link: el sitio pide el link a Instagram; si lo da, la mira el agente", async () => {
  const pedidosIg = [];
  const instagram = {
    porQueSale: async () => null,
    imagenesDelLead: async (c, opciones) => { pedidosIg.push(opciones); return [FOTO_IG]; },
  };
  const { agente, m } = mundo({ instagram });
  const foto = m.entra(SIN_TEXTO);
  await agente.procesar(ID, foto);
  assert.equal(pedidosIg[0].cuantas, 1);
  assert.deepEqual(m.pedidos[0].imagenes, [FOTO_IG]);
  assert.equal(m.avisos[0].foto, FOTO_IG);
  assert.equal(m.avisos[0].campos.Borrador, BORRADOR);
});

test("una foto sin link que Instagram no da (o tarda, o falla): va a Cande como hoy, sin pedirle nada al modelo", async () => {
  for (const imagenesDelLead of [
    async () => [], async () => { throw new Error("Instagram caído"); }, () => new Promise(() => {}),
    async () => ["https://otro-sitio.ejemplo.com/foto.jpg"],
  ]) {
    const { agente, m } = mundo({ instagram: { porQueSale: async () => null, imagenesDelLead } });
    const foto = m.entra(SIN_TEXTO);
    assert.equal((await agente.procesar(ID, foto)).hecho, "solo foto");
    assert.equal(m.pedidos.length, 0);
    assert.equal(urgentesDeFoto(m).length, 1);
    assert.equal(urgentesDeFoto(m)[0].foto, null, "sin link, el aviso va sin foto");
  }
  // Sin la lectura de Instagram, lo mismo.
  const sin = mundo();
  assert.equal((await sin.agente.procesar(ID, sin.m.entra(""))).hecho, "solo foto");
  assert.equal(urgentesDeFoto(sin.m).length, 1);
});

test("las reglas de Instagram: los adjuntos del lead (no los de la cuenta) desde su mensaje, en el orden en que los mandó", async () => {
  const desde = new Date(AHORA.getTime() - 60000);
  const lista = [
    { creado: new Date(AHORA.getTime() - 10000), urls: [FOTO_2] },
    { creado: new Date(AHORA.getTime() - 30000), urls: [FOTO] },
    { creado: new Date(AHORA.getTime() - 3600000), urls: ["https://scontent.xx.fbcdn.net/vieja.jpg"] },
  ];
  const reglas = crearReglasInstagram({
    ig: { adjuntosDe: async () => lista }, base: {}, manychat: {}, avisar: async () => true,
  });
  const c = { id: ID, ig_id: "501" };
  assert.deepEqual(await reglas.imagenesDelLead(c, { cuantas: 2, desde }), [FOTO, FOTO_2]);
  assert.deepEqual(await reglas.imagenesDelLead(c, { cuantas: 1, desde }), [FOTO_2]);
  const caida = crearReglasInstagram({ ig: { adjuntosDe: async () => { throw new Error("caída"); } }, base: {}, manychat: {}, avisar: async () => true });
  assert.deepEqual(await caida.imagenesDelLead(c, { cuantas: 1 }), []);
  assert.deepEqual(await crearReglasInstagram({ ig: null, base: {}, manychat: {}, avisar: async () => true }).imagenesDelLead(c), []);

  // El cliente: pide los adjuntos de la charla y deja afuera lo que mandó la cuenta.
  const pedidos = [];
  const cfg = { leerConfig: async () => null, guardarConfig: async () => {} };
  const ISO = (d) => d.toISOString().replace(/\.\d{3}Z$/, "+0000");
  const pedir = async (url) => {
    const u = new URL(url);
    pedidos.push(Object.fromEntries(u.searchParams));
    const r = u.pathname.endsWith("/me") ? { user_id: "900", username: "cuenta.prueba" }
      : u.pathname.endsWith("/me/conversations") ? { data: [{ messages: { data: [
        { id: "m3", created_time: ISO(AHORA), from: { id: "900", username: "cuenta.prueba" }, attachments: { data: [{ image_data: { url: FOTO_IG } }] } },
        { id: "m2", created_time: ISO(AHORA), from: { id: "501", username: "lead.prueba" }, attachments: { data: [{ image_data: { url: FOTO } }] } },
        { id: "m1", created_time: ISO(AHORA), from: { id: "501", username: "lead.prueba" } },
      ] } }] }
      : { error: { message: "ruta de prueba", code: 100 } };
    return { ok: !r.error, status: r.error ? 400 : 200, json: async () => r };
  };
  const ig = crearInstagram({ pedir, ...cfg, tokenEnv: () => "token-de-prueba" });
  const adj = await ig.adjuntosDe("501");
  assert.deepEqual(adj.map((x) => x.urls), [[FOTO]]);
  assert.match(pedidos.at(-1).fields, /attachments\{image_data\{url\},video_data\{url\},file_url\}/);
  assert.equal(pedidos.at(-1).user_id, "501");
});

/* ---------- lo que no cambia ---------- */

test("un turno sin fotos con la Mac contestando es el de siempre: el pedido sin imagenes y ningún aviso", async () => {
  const { agente, m } = mundo({ responde: () => salida(["Respuesta de prueba?"]) });
  assert.equal((await agente.procesar(ID, m.entra("una pregunta de prueba"))).hecho, "enviada");
  assert.deepEqual(Object.keys(m.pedidos[0]).sort(), ["prompt", "turno"]);
  assert.equal(m.avisos.length, 0);
  assert.equal(m.salidas.filter((s) => s.accion === "codigo_mp").length, 0);
});

test("el trabajo de la Mac: sin fotos se arma como siempre; con fotos lleva sus links y vuelve cuántas vio", async () => {
  const salidaValida = salida(["Mensaje de prueba?"]);
  const armar = (resultado) => {
    const creados = [];
    const pedirLocal = crearCerebroLocal({
      crear: async (...args) => { creados.push(args); return 7; },
      leer: async () => ({ estado: "hecho", resultado }),
      vencer: async () => {}, vaciar: async () => {}, esperar: async () => {}, tope_ms: 4000, cada_ms: 2000,
    });
    return { creados, pedirLocal };
  };
  const viejo = armar(salidaValida);
  const r = await viejo.pedirLocal({ turno: { mensajes_del_lead: ["hola"] }, linkDePago: "" });
  assert.equal(viejo.creados[0].length, 2, "sin fotos, el trabajo de siempre");
  assert.equal(r._imagenes_vistas, undefined);
  assert.equal(r.pago_pesos, undefined, "una salida de un cerebro de antes no trae pago_pesos");
  assert.equal(normalizar(r).pago_pesos, null);
  const nuevo = armar({ ...salidaValida, pago_pesos: "comprobante", imagenes_vistas: 1 });
  const r2 = await nuevo.pedirLocal({ turno: {}, linkDePago: "", imagenes: [FOTO] });
  assert.deepEqual(nuevo.creados[0][2], [FOTO]);
  assert.equal(r2._imagenes_vistas, 1);
  assert.equal(normalizar(r2).pago_pesos, "comprobante");
  assert.equal(normalizar({ ...r2, pago_pesos: "cualquier cosa" }).pago_pesos, null);
  assert.ok(Salida.safeParse({ ...salidaValida, pago_pesos: "dice" }).success);
  assert.equal(Salida.safeParse({ ...salidaValida, pago_pesos: "regalo" }).success, false);
});

test("qué es el link de una foto: solo https en los servidores de Meta, sin espacios", () => {
  assert.equal(urlDeFoto(` ${FOTO} `), FOTO);
  assert.equal(urlDeFoto(FOTO_IG), FOTO_IG);
  for (const t of [SIN_TEXTO, "", "http://lookaside.fbsbx.com/x", "https://otro-sitio.ejemplo.com/foto.jpg", `mirá ${FOTO}`]) {
    assert.equal(urlDeFoto(t), null, t);
  }
  assert.equal(esFoto(SIN_TEXTO), true);
  assert.equal(esFoto(FOTO), true);
});

/* ---------- el aviso con foto en Telegram ---------- */

test("el aviso con foto sale como foto con su epígrafe; si Telegram no la baja o no entra, sale el de texto con el link", async () => {
  const antes = globalThis.fetch;
  const llamadas = [];
  let fotoAnda = true;
  globalThis.fetch = async (url, opciones) => {
    const metodo = String(url).split("/").pop();
    llamadas.push({ metodo, cuerpo: JSON.parse(opciones.body) });
    const ok = metodo !== "sendPhoto" || fotoAnda;
    return { ok, status: ok ? 200 : 400, text: async () => "" };
  };
  try {
    assert.equal(await avisarTelegram("DM URGENTE: aviso de prueba", { Quién: `Lead (${ID})`, Aviso: "YA: algo <de> prueba" }, { foto: FOTO }), true);
    assert.equal(llamadas.length, 1);
    assert.equal(llamadas[0].metodo, "sendPhoto");
    assert.equal(llamadas[0].cuerpo.photo, FOTO);
    assert.match(llamadas[0].cuerpo.caption, /^🔔 <b>DM URGENTE: aviso de prueba<\/b>\n\n<b>Quién:<\/b> Lead \(123456789\)/);
    assert.match(llamadas[0].cuerpo.caption, /&lt;de&gt;/);
    // Telegram no la pudo bajar: el de texto, con el link.
    fotoAnda = false;
    llamadas.length = 0;
    assert.equal(await avisarTelegram("DM URGENTE: aviso de prueba", { Quién: `Lead (${ID})` }, { foto: FOTO }), true);
    assert.deepEqual(llamadas.map((l) => l.metodo), ["sendPhoto", "sendMessage"]);
    assert.match(llamadas[1].cuerpo.text, /<b>Foto:<\/b> https:\/\/lookaside/);
    // No entra en un epígrafe (1.024): directo el de texto.
    fotoAnda = true;
    llamadas.length = 0;
    await avisarTelegram("DM URGENTE: aviso de prueba", { Quién: `Lead (${ID})`, Borrador: "x".repeat(1100) }, { foto: FOTO });
    assert.deepEqual(llamadas.map((l) => l.metodo), ["sendMessage"]);
    // Sin foto, como siempre.
    llamadas.length = 0;
    await avisarTelegram("DM: aviso de prueba", { Quién: `Lead (${ID})` });
    assert.deepEqual(llamadas.map((l) => l.metodo), ["sendMessage"]);
    assert.equal(llamadas[0].cuerpo.text.includes("Foto:"), false);
  } finally {
    globalThis.fetch = antes;
  }
});
