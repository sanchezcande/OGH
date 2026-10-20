// Lectura directa de Instagram, para dos reglas que ManyChat no puede ver (16/10, Cande):
//   1. "si yo sigo a la persona no se meta": si la cuenta sigue al lead, el agente sale.
//   2. "--" escrito por ella en el chat desde la app de Instagram saca al agente de esa charla.
// ManyChat no ve lo que ella escribe desde la app ni a quién sigue, así que esto lee Instagram
// con su propio permiso: la API de Instagram con inicio de sesión de Instagram (graph.instagram.com),
// con los permisos instagram_business_basic e instagram_business_manage_messages. Solo lee:
// los mensajes siguen saliendo por ManyChat.
//
// Config en Vercel: INSTAGRAM_TOKEN, el token largo (60 días) que genera Cande en su app de Meta.
// Nunca se registra ni se devuelve. Se renueva solo (ver renovar) y el renovado queda en la base.
// Sin token no hace nada; con token, las reglas corren recién con el ajuste "instagram" en true.
//
// Sin webhooks: para recibir mensajes de leads la app tendría que estar publicada, con acceso
// avanzado y la empresa verificada. Se lee la bandeja (la API de conversaciones) cuando hace falta.
//
// Si Instagram falla, el agente sigue como siempre (las reglas no frenan nada) y a Cande le llega
// un aviso por día como mucho. Todo entra por parámetro para probarlo sin red.
import { createHash, randomUUID } from "node:crypto";
import { esCodigoSalir } from "./respuestas";

const API = "https://graph.instagram.com/v25.0";
// El otro camino (17/10): el permiso con el que el sitio ya publica en Instagram (tokens_redes "ig", lo
// sube el dashboard y lo renueva) tiene instagram_manage_messages. Con la página de Facebook de la
// cuenta se leen las mismas charlas, sin crear otra app ni pegar otro token.
const GRAPH_FB = "https://graph.facebook.com/v23.0";
const RENOVAR = "https://graph.instagram.com/refresh_access_token";
const DIA = 86400000;
const ESPERA_MS = 12000; // cada pedido a Instagram
const ESPERA_LISTA_MS = 25000; // la lista de charlas con sus mensajes (solo la piden el cron y la búsqueda de un contacto)
const RENOVAR_CADA = 7 * DIA; // el token dura 60 días: se renueva una vez por semana
const AVISO_CADA = DIA; // si la conexión falla, a Cande le llega un aviso por día como mucho
const MENSAJES_POR_HILO = 10; // Instagram da el detalle de los últimos 20 mensajes de cada charla

export const hayInstagram = () => Boolean(process.env.INSTAGRAM_TOKEN);

const huella = (texto) => createHash("sha256").update(String(texto)).digest("hex");
/** El link que abre la charla con esa persona en Instagram (en el celu abre la app). */
export const linkCharlaIg = (usuario) => (/^[a-z0-9._]{1,30}$/.test(String(usuario || "")) ? `https://ig.me/m/${usuario}` : null);

/**
 * El usuario de Instagram de un contacto para el link del aviso: el guardado o, si no se sabe, el que da
 * ManyChat (y queda guardado). Nunca tira: sin usuario, el aviso sale sin link.
 */
export async function usuarioParaAviso(c, { base, manychat }) {
  try {
    if (c?.ig_usuario != null) return c.ig_usuario || null;
    if (!c?.id || !manychat?.datosDe) return null;
    const d = await manychat.datosDe(c.id);
    if (!d?.ok) return null;
    const usuario = usuarioIg(d.ig_username);
    try {
      await base.guardarIg(c.id, { usuario });
    } catch {
      // queda para la próxima
    }
    return usuario || null;
  } catch {
    return null;
  }
}

/** Un usuario de Instagram como se guarda y se compara: sin @ y en minúscula. */
export const usuarioIg = (s) => String(s || "").trim().replace(/^@/, "").toLowerCase();
const minuscula = usuarioIg;

/** Instagram manda las fechas como "2026-10-17T12:00:00+0000" o como segundos. */
export function fechaDe(valor) {
  if (valor == null || valor === "") return null;
  if (typeof valor === "number" || /^\d+$/.test(String(valor))) {
    const n = Number(valor);
    return new Date(n < 1e12 ? n * 1000 : n);
  }
  const d = new Date(String(valor).replace(/([+-]\d{2})(\d{2})$/, "$1:$2"));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Un error de Instagram con su código: 190 es token vencido o revocado. */
export class ErrorInstagram extends Error {
  constructor(mensaje, { code = null, status = null, demora = false } = {}) {
    super(mensaje);
    this.code = code;
    this.status = status;
    this.demora = demora;
  }
}

/** Lo que se le dice a Cande cuando la conexión no anda. */
export function explicarError(e) {
  if (e?.code === 190) return "el token de Instagram venció o se revocó: generá uno nuevo en tu app de Meta y pegalo en Vercel (INSTAGRAM_TOKEN)";
  if (e?.code === 10 || e?.code === 200 || e?.code === 230) return `Instagram no da permiso para leer esto (${e.message})`;
  if ([4, 17, 32, 613, 80002].includes(e?.code)) return "Instagram pidió que se le pregunte más despacio: se reintenta solo";
  return e?.message || "no sé por qué";
}

/**
 * La charla como la devuelve Instagram, ya ordenada: quién es la otra persona y sus últimos
 * mensajes (los más nuevos primero). La otra persona sale de los mensajes: el que no es la cuenta.
 */
export function leerHilo(crudo, cuenta) {
  const mensajes = (crudo?.messages?.data || []).map((m) => ({
    id: m.id,
    creado: fechaDe(m.created_time),
    de: m.from ? { id: String(m.from.id ?? ""), usuario: minuscula(m.from.username) } : null,
    para: (m.to?.data || []).map((p) => ({ id: String(p.id ?? ""), usuario: minuscula(p.username) })),
    texto: typeof m.message === "string" ? m.message : null,
  }));
  const esCuenta = (p) => esDeLaCuenta(p, cuenta);
  let otro = null;
  for (const m of mensajes) {
    const candidatos = [m.de, ...m.para].filter((p) => p && (p.id || p.usuario) && !esCuenta(p));
    if (candidatos.length) {
      otro = candidatos[0];
      break;
    }
  }
  return { id: crudo?.id, actualizado: fechaDe(crudo?.updated_time), otro, mensajes };
}

/** Si lo escribió la cuenta de Cande (por id o, si el id no coincide, por usuario). */
export function esDeLaCuenta(p, cuenta) {
  if (!p || !cuenta) return false;
  return (Boolean(p.id) && p.id === String(cuenta.user_id)) || (Boolean(p.usuario) && p.usuario === minuscula(cuenta.username));
}

/**
 * Desde cuándo cuenta un "--" en la charla de este contacto: desde que la charla es de quien es
 * ahora (si volvió al agente con /agente, el "--" de antes ya se usó). En un alta todavía sin
 * confirmar cuenta cualquiera: pudo escribirlo antes de que la persona entrara a la base.
 */
export const desdeDe = (c) => (c.alta_avisada === false || !c.dueno_desde ? null : new Date(c.dueno_desde));

/** Un texto para comparar: sin tildes, sin mayúsculas, sin signos ni emojis. */
export const claveTexto = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** Si un mensaje que salió de la cuenta es uno de los conocidos (lo mandó el agente, un automático o ya está anotado). */
function esConocido(texto, claves) {
  const k = claveTexto(texto);
  if (k.length < 4) return true; // un emoji, un "ok": no dice nada
  return claves.some((c) => c && (c.includes(k.slice(0, 50)) || k.includes(c.slice(0, 50))));
}

/**
 * Un mensaje que Cande escribió a mano en la charla (desde Instagram o la Bandeja de ManyChat) después
 * de `desde`: sale de la cuenta y no es nada que haya mandado el agente ni un automático. Cande, 17/10:
 * "me metí en una charla que la venía llevando re bien y de repente te metés".
 */
export function manualEnHilo(hilo, cuenta, conocidos, desde) {
  const claves = conocidos.map(claveTexto).filter((c) => c.length >= 4);
  return hilo.mensajes.find((m) =>
    esDeLaCuenta(m.de, cuenta) && m.texto && !esCodigoSalir(m.texto) && desde && m.creado && m.creado > desde &&
    (esCandeAqui(m.texto, claves) || !esConocido(m.texto, claves))) || null;
}

/**
 * "Cande aquí" al principio del mensaje es Cande presentándose (17/10: "podemos poner como código Cande
 * aquí"). Cuenta aunque se parezca a un automático, salvo que sea ese automático tal cual (el del CV
 * arranca igual).
 */
function esCandeAqui(texto, claves) {
  const k = claveTexto(texto);
  return k.startsWith("candeaqui") && !claves.includes(k);
}

/** Desde cuándo cuenta un mensaje a mano de Cande: desde que la charla es del agente (lo de antes ya lo sabía). */
export function desdeManual(c) {
  const fechas = [c.dueno_desde, c.alta_en].filter(Boolean).map((f) => new Date(f).getTime());
  return fechas.length ? new Date(Math.max(...fechas)) : null;
}

/** El "--" (o /yo) que escribió Cande en la charla después de `desde` (null: en cualquier momento). */
export function codigoEnHilo(hilo, cuenta, desde = null) {
  return hilo.mensajes.find((m) =>
    esDeLaCuenta(m.de, cuenta) && m.texto != null && esCodigoSalir(m.texto) && (!desde || (m.creado && m.creado > desde))) || null;
}

/**
 * El cliente de Instagram. `pedir` es fetch; `config` lee y guarda en dm_config (el token renovado,
 * la cuenta y el estado de la conexión).
 */
export function crearInstagram({
  pedir = (...a) => globalThis.fetch(...a), leerConfig, guardarConfig, tokenEnv = () => process.env.INSTAGRAM_TOKEN,
  reloj = () => new Date(), credencialFb = null,
}) {
  let cuentaGuardada = null;
  let fb = null; // { pagina, token, igId, hasta }: la página de Facebook de la cuenta, con su token

  /** Con credencialFb ({ id de la cuenta de Instagram, token de usuario }), la página y su token. Se guarda una hora. */
  async function conexionFb() {
    if (fb && fb.hasta > Date.now()) return fb;
    const cred = await credencialFb();
    if (!cred?.token || !cred?.id) throw new ErrorInstagram("falta el permiso de Instagram del sitio (lo sube el dashboard)");
    const q = new URLSearchParams({ fields: "id,access_token,instagram_business_account", limit: "100", access_token: cred.token });
    const r = await llamar(`${GRAPH_FB}/me/accounts?${q}`);
    const p = (r.data || []).find((a) => String(a.instagram_business_account?.id || "") === String(cred.id));
    if (!p?.access_token) throw new ErrorInstagram("el permiso de Instagram del sitio no tiene la página de la cuenta");
    fb = { pagina: String(p.id), token: p.access_token, igId: String(cred.id), hasta: Date.now() + 3600000 };
    return fb;
  }
  const rutaCharlas = async () => (credencialFb ? `/${(await conexionFb()).pagina}/conversations` : "/me/conversations");

  /** El token que vale: el renovado, si se renovó a partir del que está en Vercel; si no, el de Vercel. */
  async function token() {
    const env = tokenEnv();
    if (!env) return null;
    const guardado = await leerConfig("instagram_token");
    return guardado?.de === huella(env) && guardado.token ? guardado.token : env;
  }

  async function llamar(url, espera = ESPERA_MS) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), espera);
    try {
      const r = await pedir(url, { headers: { Accept: "application/json" }, signal: ctrl.signal });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.error) {
        const e = j.error || {};
        // Sin el token en el mensaje: Instagram a veces lo repite en el error.
        const texto = String(e.message || `Instagram contestó ${r.status}`).replace(/access_token=[^&\s]+/g, "access_token=…");
        throw new ErrorInstagram(texto.slice(0, 200), { code: e.code ?? null, status: r.status });
      }
      return j;
    } catch (e) {
      if (e instanceof ErrorInstagram) throw e;
      throw new ErrorInstagram(e.name === "AbortError" ? `Instagram tardó más de ${Math.round(espera / 1000)} segundos` : e.message, { demora: true });
    } finally {
      clearTimeout(t);
    }
  }

  async function get(ruta, params = {}, espera = ESPERA_MS) {
    if (credencialFb) {
      const c = await conexionFb();
      return llamar(`${GRAPH_FB}${ruta}?${new URLSearchParams({ ...params, access_token: c.token })}`, espera);
    }
    const t = await token();
    if (!t) throw new ErrorInstagram("falta INSTAGRAM_TOKEN");
    const q = new URLSearchParams({ ...params, access_token: t });
    return llamar(`${API}${ruta}?${q}`, espera);
  }

  /** La cuenta de Cande: user_id es el id con el que figuran sus mensajes. Se guarda una vez. */
  async function cuenta() {
    if (cuentaGuardada) return cuentaGuardada;
    if (credencialFb) {
      const c = await conexionFb();
      const yo = await get(`/${c.igId}`, { fields: "username" });
      return (cuentaGuardada = { user_id: c.igId, username: minuscula(yo.username) });
    }
    const env = huella(tokenEnv() || "");
    const g = await leerConfig("instagram_cuenta");
    if (g?.user_id && g.de === env) return (cuentaGuardada = g);
    const yo = await get("/me", { fields: "user_id,username" });
    cuentaGuardada = { user_id: String(yo.user_id ?? yo.id), username: minuscula(yo.username), de: env };
    await guardarConfig("instagram_cuenta", cuentaGuardada);
    return cuentaGuardada;
  }

  const CAMPOS_HILO = `updated_time,messages.limit(${MENSAJES_POR_HILO}){id,created_time,from,to,message}`;

  /**
   * La charla con el detalle de sus `n` mensajes más nuevos. Si Instagram no los expandió adentro
   * de la charla (la sintaxis anidada no figura en su documentación de esta API), se pide el
   * detalle de cada uno: para saber quién es la otra persona alcanza con uno.
   */
  async function completo(h, n = MENSAJES_POR_HILO) {
    const ms = h.crudo?.messages?.data || [];
    if (!ms.length || ms.slice(0, n).every((m) => m.from)) return h;
    const data = [];
    for (const m of ms.slice(0, n)) {
      try {
        data.push(m.from ? m : await get(`/${m.id}`, { fields: "id,created_time,from,to,message" }));
      } catch (e) {
        // El detalle de los mensajes viejos (más allá de los últimos 20) ya no se puede leer: queda sin
        // texto. Cualquier otra falla (límite de pedidos, token, permiso) corta acá y se avisa.
        if (e?.code !== 100) throw e;
        data.push(m);
      }
    }
    const crudo = { ...h.crudo, messages: { data } };
    return { ...leerHilo(crudo, await cuenta()), crudo };
  }

  /**
   * Una página de la bandeja, las charlas movidas más recientes primero (sin completar: ver completo), y el
   * cursor de la página siguiente (`despues`, null si no hay más). La red de la bandeja (lib/dm/bandeja.js) lee
   * más de una página: una charla que quedó debajo de las primeras 50 no se pierde.
   */
  async function pagina({ limite = 20, mensajes = 5, despues = null } = {}) {
    const yo = await cuenta();
    // La lista con sus mensajes tarda: Meta contestó en 9 segundos con 50 charlas de 10 mensajes (17/10).
    const campos = `updated_time,messages.limit(${mensajes}){id,created_time,from,to,message}`;
    const params = { platform: "instagram", fields: campos, limit: String(limite), ...(despues ? { after: String(despues) } : {}) };
    const r = await get(await rutaCharlas(), params, ESPERA_LISTA_MS);
    const lista = (r.data || []).map((h) => ({ ...leerHilo(h, yo), crudo: h }));
    const siguiente = r.paging?.next && r.paging?.cursors?.after ? String(r.paging.cursors.after) : null;
    return { lista, despues: lista.length ? siguiente : null };
  }

  /** Las charlas de la bandeja, las movidas más recientes primero (sin completar: ver completo). */
  async function hilos({ limite = 20, mensajes = 5 } = {}) {
    return (await pagina({ limite, mensajes })).lista;
  }

  /** La charla con esa persona (por su id de Instagram), completa, o null. */
  async function hiloDe(igsid) {
    const yo = await cuenta();
    const r = await get(await rutaCharlas(), { platform: "instagram", user_id: String(igsid), fields: CAMPOS_HILO });
    const h = (r.data || [])[0];
    return h ? completo({ ...leerHilo(h, yo), crudo: h }) : null;
  }

  const CAMPOS_ADJUNTOS = "id,created_time,from,attachments{image_data{url},video_data{url},file_url}";

  /**
   * Los mensajes de la persona (no los de la cuenta) que traen un adjunto, de los `n` más nuevos de la charla:
   * [{ creado, urls }], los más nuevos primero. Para las fotos que ManyChat entrega sin link (19/10): el
   * agente las mira y, si es el comprobante del pago en pesos, le arma a Cande el borrador del código.
   */
  async function adjuntosDe(igsid, n = MENSAJES_POR_HILO) {
    const yo = await cuenta();
    const r = await get(await rutaCharlas(), { platform: "instagram", user_id: String(igsid), fields: `messages.limit(${n}){${CAMPOS_ADJUNTOS}}` });
    const lista = [];
    for (const m of ((r.data || [])[0]?.messages?.data || []).slice(0, n)) {
      let x = m;
      if (!m.from) {
        try {
          x = await get(`/${m.id}`, { fields: CAMPOS_ADJUNTOS });
        } catch (e) {
          if (e?.code !== 100) throw e; // como en completo: un mensaje viejo que ya no se puede leer se saltea
          continue;
        }
      }
      const de = x.from ? { id: String(x.from.id ?? ""), usuario: minuscula(x.from.username) } : null;
      if (!de || esDeLaCuenta(de, yo)) continue;
      const urls = (x.attachments?.data || []).map((a) => a?.image_data?.url || a?.video_data?.url || a?.file_url).filter(Boolean).map(String);
      if (urls.length) lista.push({ creado: fechaDe(x.created_time), urls });
    }
    return lista;
  }

  /**
   * Usuario de la persona y si la cuenta de Cande la sigue. `conNombre`: también el nombre de su perfil, para
   * buscarla en ManyChat (la red de la bandeja, lib/dm/bandeja.js). Las miradas de cada respuesta no lo piden.
   */
  async function perfil(igsid, { conNombre = false } = {}) {
    const p = await get(`/${encodeURIComponent(igsid)}`, { fields: `${conNombre ? "name," : ""}username,is_business_follow_user` });
    return {
      usuario: minuscula(p.username), laSigue: p.is_business_follow_user === true,
      ...(conNombre ? { nombre: String(p.name || "").replace(/\s+/g, " ").trim() || null } : {}),
    };
  }

  /**
   * Renueva el token si hace una semana que no se renueva. Instagram solo renueva tokens de más de
   * 24 horas: si es más nuevo, falla y se prueba al día siguiente. Devuelve qué pasó.
   */
  async function renovar() {
    if (credencialFb) return { hecho: "lo renueva el dashboard" };
    const env = tokenEnv();
    if (!env) return { hecho: "sin token" };
    const g = await leerConfig("instagram_token");
    const mismo = g?.de === huella(env);
    const ultimo = mismo ? fechaDe(g.intento || g.renovado) : null;
    if (ultimo && reloj() - ultimo < (g.error ? DIA : RENOVAR_CADA)) return { hecho: "no toca" };
    const actual = mismo && g.token ? g.token : env;
    try {
      const r = await llamar(`${RENOVAR}?${new URLSearchParams({ grant_type: "ig_refresh_token", access_token: actual })}`);
      if (!r.access_token) throw new ErrorInstagram("Instagram no devolvió el token renovado");
      const vence = new Date(reloj().getTime() + (Number(r.expires_in) || 60 * 86400) * 1000);
      await guardarConfig("instagram_token", {
        de: huella(env), token: r.access_token, renovado: reloj().toISOString(), intento: reloj().toISOString(), vence: vence.toISOString(),
      });
      return { hecho: "renovado", vence };
    } catch (e) {
      await guardarConfig("instagram_token", {
        ...(mismo ? g : {}), de: huella(env), intento: reloj().toISOString(), error: explicarError(e),
      });
      return { hecho: "falló", error: e };
    }
  }

  /** Cuántos días le quedan al token, si se sabe (lo dice la última renovación). */
  async function diasQueQuedan() {
    if (credencialFb) return null;
    const env = tokenEnv();
    const g = env ? await leerConfig("instagram_token") : null;
    const vence = g?.de === huella(env) ? fechaDe(g.vence) : null;
    return vence ? Math.floor((vence - reloj()) / DIA) : null;
  }

  /** Si el token anda (lee la cuenta, sin lo guardado). Tira el error de Instagram si no. */
  async function anda() {
    if (credencialFb) await cuenta();
    else await get("/me", { fields: "user_id" });
    return true;
  }

  return { token, cuenta, pagina, hilos, completo, hiloDe, adjuntosDe, perfil, renovar, diasQueQuedan, anda };
}

/**
 * Las reglas sobre una charla del agente: si Cande sigue a la persona o escribió "--", el agente
 * sale. `ig` es el cliente de arriba; `base` y `manychat`, los de siempre; `avisar(titulo, campos)`
 * le escribe a Cande. Nunca tira: si Instagram falla, la respuesta es "no sale" y a Cande le llega
 * un aviso por día como mucho.
 */
export function crearReglasInstagram({ ig = null, base, manychat, avisar, reloj = () => new Date(), registrar = () => {} }) {
  /**
   * El usuario de Instagram del contacto y el id que le da ManyChat. Se le pregunta a ManyChat una
   * sola vez y queda guardado (vacío: no tiene usuario).
   */
  async function datosIg(c) {
    if (c.ig_usuario != null) return { usuario: c.ig_usuario, idManyChat: c.ig_id_mc ?? null };
    const d = await manychat.datosDe(c.id);
    if (!d.ok) throw new Error(`ManyChat no dio el usuario de Instagram: ${d.error}`);
    const usuario = minuscula(d.ig_username);
    const idManyChat = d.ig_id != null && d.ig_id !== "" ? String(d.ig_id) : "";
    await base.guardarIg(c.id, { usuario, igIdMc: idManyChat });
    return { usuario, idManyChat };
  }

  /** El id de Instagram de un contacto de ManyChat, en la app de Cande. Se guarda al encontrarlo. */
  async function resolver(c) {
    if (c.ig_id) return c.ig_id;
    if (!ig) return null;
    const { usuario, idManyChat } = await datosIg(c);
    if (!usuario) return null;
    // El id que da ManyChat puede ser el mismo que ve la app de Cande, o no (son apps distintas):
    // vale solo si el perfil que devuelve Instagram es el mismo usuario.
    if (idManyChat) {
      let p = null;
      try {
        p = await ig.perfil(idManyChat);
      } catch (e) {
        if (e?.code !== 100) throw e; // un corte o el límite de pedidos no dicen que el id no sirva
      }
      if (p?.usuario === usuario) {
        await base.guardarIg(c.id, { igId: idManyChat });
        return idManyChat;
      }
      await base.guardarIg(c.id, { igIdMc: "" });
    }
    // La charla tiene que estar entre las últimas movidas: el lead acaba de escribir, o el agente le
    // escribió. Si no está, el cron la encuentra la próxima vez que se mueva (buscarCodigos).
    for (const h of await ig.hilos({ limite: 20, mensajes: 3 })) {
      const hc = await ig.completo(h, 1);
      if (hc.otro?.usuario === usuario && hc.otro.id) {
        await base.guardarIg(c.id, { igId: hc.otro.id });
        return hc.otro.id;
      }
    }
    return null;
  }

  async function fallo(e) {
    registrar(e);
    // Una demora, el límite de pedidos o un error de Meta se arreglan solos en la vuelta siguiente: no se avisa
    // (17/10: le llegó "Instagram tardó más de 12 segundos"). Se avisa lo que necesita que ella haga algo.
    if (e?.demora || [4, 17, 32, 613, 80002].includes(e?.code) || (e?.status >= 500)) return;
    try {
      const estado = (await base.leerConfig("instagram_estado")) || {};
      const ultimo = estado.avisado ? new Date(estado.avisado) : null;
      if (ultimo && reloj() - ultimo < AVISO_CADA) return;
      await base.guardarConfig("instagram_estado", { avisado: reloj().toISOString(), error: explicarError(e) });
      await avisar("DM: la conexión con Instagram no anda", {
        Motivo: explicarError(e),
        Nota: "mientras tanto el agente sigue igual, pero no ve si seguís a alguien ni tus --",
      });
    } catch {
      // sin base ni Telegram no hay dónde avisar
    }
  }

  /**
   * Por qué el agente tiene que salir de esta charla, o null.
   *   lista: la persona está en la lista de cuentas que sigue Cande (la que ella bajó de Instagram,
   *          base.loSigue). No necesita el token: el usuario sale de ManyChat.
   *   api:   lo que dice Instagram en el momento (el "--" en la charla y si la sigue). Necesita el token.
   * Los "--" de antes de que la charla volviera al agente no cuentan; en un alta sin confirmar, cualquiera.
   * Si Cande se la dio al agente a propósito, que la siga no la saca (su "--" sí).
   */
  async function porQueSale(c, { lista = false, api = true } = {}) {
    if (lista && !c.entregada) {
      try {
        const { usuario } = await datosIg(c);
        if (usuario && (await base.loSigue(usuario))) return "la seguís en Instagram";
      } catch (e) {
        registrar(e); // sin el usuario no se puede comparar: el agente sigue igual
      }
    }
    if (!api || !ig) return null;
    try {
      const igsid = await resolver(c);
      if (!igsid) return null;
      // Las dos lecturas a la vez: esto corre antes de cada respuesta y el lead está esperando. Si
      // una falla, la otra vale igual.
      const yo = await ig.cuenta();
      const [hilo, p] = await Promise.allSettled([ig.hiloDe(igsid), ig.perfil(igsid)]);
      if (hilo.status === "fulfilled" && hilo.value && codigoEnHilo(hilo.value, yo, desdeDe(c))) return "escribiste -- en Instagram";
      if (hilo.status === "fulfilled" && hilo.value && manualEnHilo(hilo.value, yo, await base.textosDeLaCuenta(c.id), desdeManual(c))) {
        return "le escribiste vos";
      }
      // Si Cande se la dio al agente a propósito, que la siga no la saca (su "--" sí).
      if (p.status === "fulfilled" && p.value.laSigue) {
        // Lo que dice Instagram también suma a la lista: así queda al día sin volver a bajarla.
        try {
          if (p.value.usuario) await base.anotarSeguidos([p.value.usuario]);
        } catch {
          // la lista se completa la próxima vez
        }
        if (!c.entregada) return "la seguís en Instagram";
      }
      const falla = [hilo, p].find((r) => r.status === "rejected");
      if (falla) await fallo(falla.reason);
      return null;
    } catch (e) {
      await fallo(e);
      return null;
    }
  }

  /**
   * Los links de las últimas `cuantas` fotos (o archivos) que mandó la persona desde `desde` (con 2 minutos de
   * margen), en el orden en que las mandó. Para cuando ManyChat entrega la foto sin link. Nunca tira: si
   * Instagram no las da, devuelve lo que encontró (o nada) y la foto va a Cande como siempre. No avisa de la
   * falla: ya la avisa la mirada de cada respuesta.
   */
  async function imagenesDelLead(c, { cuantas = 1, desde = null } = {}) {
    if (!ig?.adjuntosDe || cuantas < 1) return [];
    try {
      const igsid = await resolver(c);
      if (!igsid) return [];
      const piso = desde ? new Date(desde).getTime() - 2 * 60000 : null;
      const urls = (await ig.adjuntosDe(igsid))
        .filter((m) => piso === null || (m.creado && m.creado.getTime() >= piso))
        .reverse()
        .flatMap((m) => m.urls);
      return urls.slice(-cuantas);
    } catch (e) {
      registrar(e);
      return [];
    }
  }

  /**
   * Saca al agente: la charla queda de Cande, sin aviso (ella ya sabe: la sigue o escribió --).
   * Un alta que todavía no se confirmó como lead se borra entera, como una charla personal, pero no queda
   * marcada como personal: es de Cande, y si el lead escribe y nadie le contesta, la red de la bandeja
   * (lib/dm/bandeja.js) se la recuerda en su resumen.
   */
  async function sacar(c, motivo) {
    await base.descartarPendientes(c.id);
    if (c.alta_en && c.alta_avisada === false) {
      await base.borrarCharla(c.id, { personal: false });
    } else {
      await base.ponerDueno(c.id, "cande");
      await base.anotar(c.id, "sistema", `La charla quedó de Cande: ${motivo}`);
    }
    try {
      await manychat.ponerCampo(c.id, "dm_dueno", "cande");
    } catch {
      // el campo es para los automáticos de ManyChat: el agente ya no le escribe
    }
  }

  return { resolver, porQueSale, sacar, fallo, imagenesDelLead, conApi: Boolean(ig) };
}

/**
 * Lo que salió igual de la cuenta en dos charlas o más de la lista: es un automático (la bienvenida, el del CV),
 * no Cande escribiendo a mano. Devuelve las claves de esos textos (claveTexto).
 */
export function plantillasDe(lista, cuenta) {
  const veces = new Map();
  for (const h of lista) {
    for (const k of new Set(h.mensajes.filter((m) => esDeLaCuenta(m.de, cuenta) && m.texto).map((m) => claveTexto(m.texto)))) {
      veces.set(k, (veces.get(k) || 0) + 1);
    }
  }
  return [...veces].filter(([k, n]) => n >= 2 && k.length >= 4).map(([k]) => k);
}

/**
 * La vuelta del cron por la bandeja: busca los "--" que escribió Cande en las charlas movidas desde
 * la vuelta anterior y saca al agente de esas charlas, aunque el lead no vuelva a escribir.
 * Devuelve cuántas charlas miró y de cuántas sacó al agente.
 */
export async function buscarCodigos({ ig, base, reglas, desde, limite = 50 }) {
  // base: contactoDeIg, guardarIg, tomar y soltar (la traba: si el agente está contestando esa charla,
  // no se la toca acá; su propia mirada antes de mandar ve el "--").
  const yo = await ig.cuenta();
  let miradas = 0;
  let sacadas = 0;
  let hasta = desde;
  const lista = await ig.hilos({ limite });
  const plantillas = plantillasDe(lista, yo);
  for (const h0 of lista) {
    if (desde && h0.actualizado && h0.actualizado <= desde) break; // vienen de la más nueva a la más vieja
    miradas++;
    if (h0.actualizado && (!hasta || h0.actualizado > hasta)) hasta = h0.actualizado;
    const h = await ig.completo(h0);
    if (!h.otro) continue;
    const c = await base.contactoDeIg({ igId: h.otro.id, usuario: h.otro.usuario });
    if (!c) continue;
    if (c.ig_id && h.otro.id && c.ig_id !== h.otro.id) continue; // es otra persona con ese usuario
    if (!c.ig_id && h.otro.id) await base.guardarIg(c.id, { igId: h.otro.id });
    if (c.dueno !== "agente") continue;
    const codigo = codigoEnHilo(h, yo, desdeDe(c));
    const aMano = !codigo && manualEnHilo(h, yo, [...(await base.textosDeLaCuenta(c.id)), ...plantillas], desdeManual(c));
    if (!codigo && !aMano) continue;
    const marca = randomUUID();
    const tomado = await base.tomar(c.id, marca);
    if (!tomado) continue;
    try {
      await reglas.sacar(tomado, codigo ? "escribiste -- en Instagram" : "le escribiste vos");
      sacadas++;
    } finally {
      await base.soltar(c.id, marca);
    }
  }
  return { miradas, sacadas, hasta };
}
