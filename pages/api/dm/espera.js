// El cron de la espera del agente de DM. Lo llama Vercel cada 15 minutos, en los mismos minutos que los
// demás crons (ver vercel.json y lib/crons.js: así la base duerme entre una vuelta y la otra).
//
// Las charlas del agente con un mensaje del lead que el agente no pudo contestar (casi siempre la Mac
// de Cande apagada, dormida o sin su Claude) quedan en espera: del agente, sin aviso y sin pasarlas a
// Cande (19/10, Cande: "deberían quedar on hold y cuando prendo la pc las deberías agarrar vos").
// Cuando la Mac vuelve, este cron las contesta tarde, por la API de ManyChat, de la más vieja a la más
// nueva: dos a la vez (la Mac redacta tres: el otro lugar queda para quien escribe en ese momento) y
// apenas termina una arranca la siguiente. Ver vaciarEspera en lib/dm/seguimientos.js. Un mensaje que no
// se pudo contestar en el momento lo toma la vuelta siguiente (base.sinContestar mira lo de más de 5
// minutos): sale entre 5 y 20 minutos después; lo que guarda la red de la bandeja, en la vuelta que sigue
// a la de la red.
//
// Caudal: cada respuesta tarda lo que la Mac en tomarla, redactarla y revisarla, más el envío: entre 45
// y 90 segundos. Cada corrida arranca respuestas durante 150 segundos, de a dos: de 4 a 8 por vuelta, y
// las 50 charlas de una noche salen en una hora y media a tres horas. Con el cron cada 2 minutos las
// corridas se pisaban y salían en 20 a 40 minutos, pero la base no dormía nunca y el 21/10 se quedó sin
// horas de cómputo. Si las corridas se pisan igual (un cron que se dispara de más, una llamada a mano),
// entre todas nunca hay más de dos (base.reclamarEspera). Antes del 19/10 el cron de cada 10 minutos las
// contestaba de a una, 3 o 4 por vuelta, y a la hora se las pasaba a Cande.
//
// Una charla con la que el modelo falla siempre (se niega, o es tan larga que no llega a tiempo) no frena
// a las demás: después de cada falla espera su pausa (10 minutos, el doble con cada falla, hasta 2 horas)
// y las otras siguen saliendo. La corrida corta recién si el modelo está caído para todas (la Mac se fue
// o se quedó sin uso, o fallan dos charlas seguidas). Ver decidirSinContestar y vigiaDelModelo.
//
// También contesta lo que guarda la red de la bandeja (lib/dm/bandeja.js): los mensajes que el webhook de ManyChat
// no trajo y la gente nueva que nunca entró por la entrada.
//
// Nunca dos veces: cada charla se aparta para una sola corrida, sin una respuesta que pudo haber salido,
// y el agente vuelve a mirar todo antes de mandar (lib/dm/agente.js). Lo que no tiene arreglo (el
// agente apagado, un envío sin confirmar, el modelo que falla con esa charla) lo pasa el cron de los
// toques (/api/dm/toques).
//
// Devuelve solo cantidades: los ids de los contactos no salen en la respuesta ni en los registros.
import { agente, avisarDm, cerebroAhora, colaDe } from "../../../lib/dm/armado";
import {
  ESPERA_EN_PARALELO, REINTENTO_MAX_FALLOS, alarmaDelCerebro, vaciarEspera,
} from "../../../lib/dm/seguimientos";
import {
  ajustes, guardarConfig, hayBase, leerConfig, minutosDesdeElModelo, reclamarEspera, sinContestar, soltarEspera, tablas,
} from "../../../lib/dm/base";

/**
 * Si el modelo no está contestando (nadie retira los turnos o fallan todos) y hay gente esperando hace más de una
 * hora, le avisa a Cande (alarmaDelCerebro, 26/10). Solo se mira cuando esta vuelta vio el modelo caído.
 */
async function alarmaSiHaceFalta(filas) {
  try {
    const a = alarmaDelCerebro({
      filas: filas ?? (await sinContestar()), minutosDesdeElModelo: await minutosDesdeElModelo(),
      ultimaAlarma: (await leerConfig("alarma_cerebro"))?.en ?? null,
    });
    if (!a) return;
    const ok = await avisarDm("DM URGENTE: el agente no está contestando", {
      Esperando: `${a.esperando} ${a.esperando === 1 ? "charla" : "charlas"}, la más vieja hace ${a.horasLaMasVieja} h`,
      "Última respuesta": a.minutosDesdeElModelo === null ? "nunca" : `hace ${Math.round(a.minutosDesdeElModelo / 60)} h`,
      Qué: "el cerebro en la nube no está redactando: avisale a Claude",
    }, { contestable: false });
    if (ok) await guardarConfig("alarma_cerebro", { en: new Date().toISOString() });
  } catch (e) {
    console.error("dm: falló la alarma del cerebro", e.message);
  }
}

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
  // Hay quien redacte: la Mac, o la API de respaldo si la Mac no contesta y hay clave (lib/dm/armado.js).
  const macViva = (await cerebroAhora(aj)) !== null;
  if (!macViva) {
    await alarmaSiHaceFalta(null);
    return res.status(200).json({ ok: true, reintentos: 0, motivo: "sin Mac" });
  }

  let r = { reintentos: 0, cayo: false };
  let filas = null;
  try {
    filas = await sinContestar();
    r = await vaciarEspera({
      filas, prendido, macViva, maxFallos: REINTENTO_MAX_FALLOS,
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
  if (r.cayo) await alarmaSiHaceFalta(filas);
  return res.status(200).json({ ok: true, reintentos: r.reintentos, ...(r.cayo ? { motivo: "el modelo no contesta" } : {}) });
}

export const config = { maxDuration: 300 };
