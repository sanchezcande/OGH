// El cron de la espera del agente de DM. Lo llama Vercel cada 2 minutos (ver vercel.json).
//
// Las charlas del agente con un mensaje del lead que el agente no pudo contestar (casi siempre la Mac
// de Cande apagada, dormida o sin su Claude) quedan en espera: del agente, sin aviso y sin pasarlas a
// Cande (19/10, Cande: "deberían quedar on hold y cuando prendo la pc las deberías agarrar vos").
// Cuando la Mac vuelve, este cron las contesta tarde, por la API de ManyChat, de la más vieja a la más
// nueva: dos a la vez (la Mac redacta tres: el otro lugar queda para quien escribe en ese momento) y
// apenas termina una arranca la siguiente. Ver vaciarEspera en lib/dm/seguimientos.js.
//
// Caudal: cada respuesta tarda lo que la Mac en tomarla, redactarla y revisarla, más el envío: entre 45
// y 90 segundos. Cada corrida arranca respuestas durante 150 segundos y el cron corre cada 2 minutos:
// las corridas se pisan a propósito, así siempre hay una arrancando la siguiente, y entre todas nunca
// hay más de dos (base.reclamarEspera). Salen entre 1,3 y 2,7 por minuto: las 50 charlas de una noche,
// en 20 a 40 minutos. Antes el cron de cada 10 minutos las contestaba de a una, 3 o 4 por vuelta
// (más de 2 horas para 50), y a la hora se las pasaba a Cande.
//
// Una charla con la que el modelo falla siempre (se niega, o es tan larga que no llega a tiempo) no frena
// a las demás: después de cada falla espera su pausa (10 minutos, el doble con cada falla, hasta 2 horas)
// y las otras siguen saliendo. La corrida corta recién si el modelo está caído para todas (la Mac se fue
// o se quedó sin uso, o fallan dos charlas seguidas). Ver decidirSinContestar y vigiaDelModelo.
//
// Nunca dos veces: cada charla se aparta para una sola corrida, sin una respuesta que pudo haber salido,
// y el agente vuelve a mirar todo antes de mandar (lib/dm/agente.js). Lo que no tiene arreglo (el
// agente apagado, un envío sin confirmar, el modelo que falla con esa charla) lo pasa el cron de los
// toques (/api/dm/toques).
//
// Devuelve solo cantidades: los ids de los contactos no salen en la respuesta ni en los registros.
import { agente, colaDe } from "../../../lib/dm/armado";
import { segundosDesdeElLatido } from "../../../lib/dm/cola";
import {
  ESPERA_EN_PARALELO, MAC_VIVA_SEGUNDOS, REINTENTO_MAX_FALLOS, vaciarEspera,
} from "../../../lib/dm/seguimientos";
import { ajustes, hayBase, reclamarEspera, sinContestar, soltarEspera, tablas } from "../../../lib/dm/base";

// Una respuesta tarde puede tardar hasta unos 140 segundos (las dos miradas a Instagram, el modelo y el
// envío, con sus topes): no se arranca ninguna si no queda ese margen antes de que Vercel corte.
const MARGEN_S = 150;

export default async function handler(req, res) {
  const inicio = Date.now();
  // Solo el cron de Vercel (manda "Bearer CRON_SECRET"). Sin el secreto cargado no entra nadie.
  const s = process.env.CRON_SECRET;
  if (!s || req.headers.authorization !== `Bearer ${s}`) return res.status(401).json({ error: "no" });
  if (!hayBase()) return res.status(200).json({ ok: true, reintentos: 0 });
  await tablas();

  // Apagado no se contesta nada: el cron de los toques le pasa esas charlas a Cande.
  const aj = await ajustes();
  const prendido = aj.modo === "auto" || aj.modo === "sombra";
  if (!prendido) return res.status(200).json({ ok: true, reintentos: 0, motivo: "apagado" });
  // Las redacta la Mac de Cande (salvo cerebro "api"): sin ella, siguen esperando.
  const latido = aj.cerebro === "api" ? 0 : await segundosDesdeElLatido();
  const macViva = latido !== null && latido < MAC_VIVA_SEGUNDOS;
  if (!macViva) return res.status(200).json({ ok: true, reintentos: 0, motivo: "sin Mac" });

  let r = { reintentos: 0, cayo: false };
  try {
    r = await vaciarEspera({
      filas: await sinContestar(), prendido, macViva, maxFallos: REINTENTO_MAX_FALLOS,
      reclamar: (id) => reclamarEspera(id, { tope: ESPERA_EN_PARALELO }),
      soltar: soltarEspera,
      procesar: (id, idLead) => agente.procesar(id, idLead, { tarde: true }),
      hasta: inicio + (config.maxDuration - MARGEN_S) * 1000,
      enParalelo: ESPERA_EN_PARALELO,
      registrar: (id, e) => console.error("dm: falló una respuesta de la espera", colaDe(id), e.message),
    });
  } catch (e) {
    console.error("dm: falló la espera", e.message);
  }
  return res.status(200).json({ ok: true, reintentos: r.reintentos, ...(r.cayo ? { motivo: "el modelo no contesta" } : {}) });
}

export const config = { maxDuration: 300 };
