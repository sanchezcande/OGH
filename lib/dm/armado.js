// El agente armado con las piezas reales (base, Claude, ManyChat, Telegram).
// Los endpoints importan de acá; las pruebas arman el suyo con dobles (lib/dm/agente.js).
import { createHash, timingSafeEqual } from "node:crypto";
import { avisar } from "../notificar";
import { crearAgente } from "./agente";
import * as base from "./base";
import { crearCerebroLocal } from "./cola";
import * as manychat from "./manychat";
import { pedir as pedirApi } from "./modelo";

const pedirLocal = crearCerebroLocal();

/** Quién redacta: el Claude de la Mac de Cande (por defecto) o la API de Anthropic. Se elige en los ajustes. */
export async function pedir({ prompt, turno }) {
  const aj = await base.ajustes();
  if (aj.cerebro === "api") return pedirApi({ prompt, turno });
  return pedirLocal({ turno, linkDePago: aj.link_de_pago });
}

/**
 * Los avisos del agente van al grupo de Telegram que Cande conectó para eso (dm_config
 * "telegram_dm"), así no se mezclan con los de los devs del formulario. Si no hay grupo, o el
 * aviso ahí no sale (sacaron al bot, borraron el grupo), va al chat de siempre: un aviso del
 * agente no se pierde por haber cambiado de chat.
 */
export function crearAvisoDm({ avisar: mandar, leerChat }) {
  return async (titulo, campos) => {
    let chat = null;
    try {
      chat = await leerChat();
    } catch {
      chat = null;
    }
    if (!chat) return mandar(titulo, campos);
    if (await mandar(titulo, campos, { chat })) return true;
    const ojo = [campos?.Ojo, "no pude avisar en el grupo del agente"].filter(Boolean).join("; ");
    return mandar(titulo, { ...campos, Ojo: ojo });
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

export const avisarDm = crearAvisoDm({ avisar, leerChat: leerChatDm });

export const agente = crearAgente({ base, pedir, manychat, avisar: avisarDm });

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
