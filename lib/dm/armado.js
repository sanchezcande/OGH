// El agente armado con las piezas reales (base, Claude, ManyChat, Telegram).
// Los endpoints importan de acá; las pruebas arman el suyo con dobles (lib/dm/agente.js).
import { createHash, timingSafeEqual } from "node:crypto";
import { avisar, tokenBotDm } from "../notificar";
import { crearAgente } from "./agente";
import * as base from "./base";
import { crearCerebroLocal, segundosDesdeElLatido } from "./cola";
import { crearEnvio } from "./envio";
import { crearInstagram, crearReglasInstagram } from "./instagram";
import * as manychat from "./manychat";
import { pedir as pedirApi } from "./modelo";
import { MAC_VIVA_SEGUNDOS, quienRedacta } from "./seguimientos";

const pedirLocal = crearCerebroLocal();

/** Si hay clave de la API de Anthropic en el entorno (sin ella, el respaldo no existe y todo es como antes). */
export const hayClaveApi = () => Boolean(process.env.ANTHROPIC_API_KEY);

/** Quién redacta ahora: "mac", "api" o null (lib/dm/seguimientos.js, quienRedacta). */
export async function cerebroAhora(aj) {
  return quienRedacta(aj, aj?.cerebro === "api" ? 0 : await segundosDesdeElLatido(), hayClaveApi());
}

/**
 * Quién redacta: el Claude de la Mac de Cande (por defecto) o la API de Anthropic, que se elige en los ajustes o
 * entra sola de respaldo cuando la Mac no contesta (sin internet, apagada) y hay clave. Las fotos del lead (imagenes,
 * sus links) solo las mira la Mac.
 */
export async function pedir({ prompt, turno, imagenes = [] }) {
  const aj = await base.ajustes();
  if ((await cerebroAhora(aj)) === "api") return pedirApi({ prompt, turno });
  return pedirLocal({ turno, linkDePago: aj.link_de_pago, imagenes });
}

/**
 * Si el agente puede mirar las fotos del lead: las mira el Claude de la Mac, así que solo con el cerebro local
 * y la Mac contestando (su latido de hace menos de 3 minutos). Si no, la foto va a Cande como siempre.
 */
export async function veFotos(aj) {
  if (aj?.cerebro === "api") return false;
  const s = await segundosDesdeElLatido();
  return s !== null && s < MAC_VIVA_SEGUNDOS;
}

/**
 * Los avisos del agente no se mezclan con los de los devs del formulario. Van, en este orden:
 * 1. por el bot aparte del agente (TELEGRAM_DM_BOT_TOKEN), al chat privado de Cande con ese bot;
 * 2. si no hay bot aparte, al grupo de Telegram que Cande conectó para eso (dm_config "telegram_dm");
 * 3. al chat de siempre.
 * Si un camino falla (bot sin Iniciar, grupo borrado), sigue con el próximo y lo dice en "Ojo":
 * un aviso del agente no se pierde por haber cambiado de chat.
 */
export function crearAvisoDm({ avisar: mandar, leerChat, tokenBot = () => null, respuestas = async () => false }) {
  return async (titulo, campos, { contestable = true, foto = null, silencioso = false } = {}) => {
    // La foto que mandó el lead, si el aviso la trae, y si llega sin sonido (el resumen de las notas): lib/notificar.js.
    const comoSale = { ...(foto ? { foto } : {}), ...(silencioso ? { silencioso: true } : {}) };
    const ojos = [campos?.Ojo];
    const token = tokenBot();
    if (token) {
      // Si Cande puede contestar desde el bot (pages/api/dm/telegram.js), el aviso de una charla se lo recuerda.
      let pista = false;
      try {
        pista = contestable && /\(\d+\)/.test(String(campos?.Quién || "")) && (await respuestas());
      } catch {
        pista = false;
      }
      const conPista = pista ? { ...campos, Contestar: "respondé este mensaje con lo que querés que le diga y el agente se lo escribe" } : campos;
      if (await mandar(titulo, conPista, { token, ...comoSale })) return true;
      ojos.push("no pude avisar por el bot del agente");
    }
    let chat = null;
    try {
      chat = await leerChat();
    } catch {
      chat = null;
    }
    const conOjo = () => {
      const ojo = ojos.filter(Boolean).join("; ");
      return ojo ? { ...campos, Ojo: ojo } : campos;
    };
    if (chat) {
      if (await mandar(titulo, conOjo(), { chat, ...comoSale })) return true;
      ojos.push("no pude avisar en el grupo del agente");
    }
    return mandar(titulo, conOjo(), comoSale);
  };
}

let chatDm = null; // { id, hasta }: para no ir a la base en cada aviso

async function leerChatDm() {
  if (!base.hayBase()) return null;
  if (!chatDm || chatDm.hasta < Date.now()) {
    await base.tablas();
    chatDm = { id: (await base.leerConfig("telegram_dm"))?.id || null, hasta: Date.now() + 60000 };
  }
  return chatDm.id;
}

/** Después de conectar o sacar el grupo, para que el cambio se vea ya en esta instancia. */
export function olvidarChatDm() {
  chatDm = null;
}

let respuestasDm = null; // { activas, hasta }

async function leerRespuestas() {
  if (!base.hayBase()) return false;
  if (!respuestasDm || respuestasDm.hasta < Date.now()) {
    await base.tablas();
    respuestasDm = { activas: Boolean((await base.leerConfig("telegram_respuestas"))?.secreto), hasta: Date.now() + 60000 };
  }
  return respuestasDm.activas;
}

/** Después de conectar o sacar las respuestas por Telegram. */
export function olvidarRespuestas() {
  respuestasDm = null;
}

export const avisarDm = crearAvisoDm({ avisar, leerChat: leerChatDm, tokenBot: tokenBotDm, respuestas: leerRespuestas });

/** La lectura directa de Instagram (lib/dm/instagram.js). Sin INSTAGRAM_TOKEN no hay. */
// Lee Instagram con el permiso con el que el sitio ya publica (tokens_redes "ig"). Las reglas se prenden con el ajuste "instagram".
export const instagram = crearInstagram({
  leerConfig: base.leerConfig, guardarConfig: base.guardarConfig, credencialFb: () => base.tokenRed("ig"),
});
// Sin token igual hay reglas: la lista de cuentas que sigue Cande se compara con el usuario que da ManyChat.
export const reglasInstagram = crearReglasInstagram({
  ig: instagram, base, manychat, avisar: avisarDm,
  // Sin ids en el registro: Instagram los repite en sus errores.
  registrar: (e) => console.error("dm: falló la lectura de Instagram", e.code ?? "", String(e.message || "").replace(/\d{6,}/g, "…")),
});

// Lo que escribe el agente sale primero por Instagram (gratis y sin tope) y por ManyChat solo si
// por ahí no se puede. Tiene la forma de manychat, así que el agente no cambia.
export const envio = crearEnvio({ manychat, ig: instagram, base });

export const agente = crearAgente({ base, pedir, manychat: envio, avisar: avisarDm, instagram: reglasInstagram, veFotos });

/** Compara el secreto que llega con el esperado sin filtrar por tiempo cuánto coincide. */
export function mismoSecreto(dado, esperado) {
  if (!esperado || typeof dado !== "string" || dado.length !== esperado.length) return false;
  let distinto = 0;
  for (let i = 0; i < dado.length; i++) distinto |= dado.charCodeAt(i) ^ esperado.charCodeAt(i);
  return distinto === 0;
}

const huella = (texto) => createHash("sha256").update(String(texto)).digest();

/** Guarda la huella del secreto que ManyChat va a mandar en x-dm-secreto. El secreto en sí no se guarda. */
export async function guardarSecretoDm(valor) {
  await base.guardarConfig("secreto_dm", { huella: huella(valor).toString("hex") });
  cache = null;
}

let cache = null; // { huella, hasta }: para no ir a la base en cada pedido

/**
 * El pedido trae el secreto de ManyChat? Vale el de la variable DM_SECRETO o el que Cande cargó
 * desde su dashboard (queda en la base como huella, así no hace falta tocar Vercel).
 */
export async function secretoDmValido(req) {
  const dado = secretoDe(req);
  if (!dado) return false;
  if (mismoSecreto(dado, process.env.DM_SECRETO)) return true;
  if (!base.hayBase()) return false;
  if (!cache || cache.hasta < Date.now()) {
    await base.tablas();
    const guardada = (await base.leerConfig("secreto_dm"))?.huella;
    cache = { huella: guardada ? Buffer.from(guardada, "hex") : null, hasta: Date.now() + 60000 };
  }
  return Boolean(cache.huella) && cache.huella.length === 32 && timingSafeEqual(huella(dado), cache.huella);
}

/** El secreto puede venir en x-dm-secreto o en Authorization (con o sin "Bearer "). */
export function secretoDe(req) {
  const h = req.headers || {};
  return String(h["x-dm-secreto"] || h.authorization || "").replace(/^Bearer\s+/i, "");
}

/** Para los registros: del id de un contacto, solo los últimos 4 caracteres. El id entero no se registra. */
export const colaDe = (id) => `…${String(id ?? "").slice(-4)}`;
