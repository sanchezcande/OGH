// El cron de la espera del agente de DM. Lo llama Vercel cada 15 minutos, en los mismos minutos que los
// demás crons (ver vercel.json y lib/crons.js: así la base duerme entre una vuelta y la otra).
//
// Las charlas del agente con un mensaje del lead que el agente no pudo contestar (casi siempre la Mac
// de Cande apagada, dormida o sin su Claude) quedan en espera: del agente, sin aviso y sin pasarlas a
// Cande (19/10, Cande: "deberían quedar on hold y cuando prendo la pc las deberías agarrar vos").
// Cuando la Mac vuelve, este cron las contesta tarde, por la API de ManyChat, de la más vieja a la más
// nueva: dos a la vez (la Mac redacta tres: el otro lugar queda para quien escribe en ese momento) y
// apenas termina una arranca la siguiente. Ver vaciarEspera en lib/dm/seguimientos.js.
//
// Desde el 21/10 la Mac no escucha todo el tiempo: abre una ventana en cada cuarto de hora (de 10 segundos antes a
// 90 después de cada vuelta de los crons) y se queda mientras tiene trabajo (lib/dm/cola.js). Un mensaje que llega
// entre una ventana y la otra no se intenta en el momento (armado.pedir): queda en espera con una falla general, y
// lo toma la vuelta siguiente (base.sinContestar lo toma sin esperar los 5 minutos, porque su intento ya falló).
// Sale como mucho unos 15 minutos después, más lo que tarda en redactarse. Lo que guarda la red de la bandeja
// (sin intento en vivo) espera sus 5 minutos: sale en la vuelta que sigue a la de la red.
//
// A la par de las charlas, las indicaciones que Cande mandó por Telegram con la Mac sin escuchar
// (crearIndicacionesPendientes en lib/dm/respuestas.js): las de más de 2 horas vencen y se le avisa. Van por su
// lado (vueltaDeLaEspera): no le comen a la espera su rato. Las charlas que tienen una indicación guardada no las
// contesta la espera por su lado: el turno de la indicación contesta también lo que escribió el lead.
//
// Caudal: cada respuesta tarda lo que la Mac en tomarla, redactarla y revisarla, más el envío: entre 45
// y 90 segundos. Cada corrida arranca respuestas durante 150 segundos, de a dos: de 4 a 8 por vuelta. Lo que
// no entra no espera a la vuelta siguiente: mientras la Mac escucha, cada vez que pregunta por trabajo y no hay,
// el sitio arranca otra de la espera (el impulso, crearImpulsoDeLaEspera en lib/dm/seguimientos.js, desde
// /api/dm/trabajos), y como la Mac se queda escuchando 5 minutos después de cada trabajo, la espera se vacía de
// a dos a la vez sin parar: doce charlas de un pico salen en unos 7 minutos, no en 45. Si las corridas se pisan
// (el impulso, un cron que se dispara de más, una llamada a mano), entre todas nunca hay más de dos
// (base.reclamarEspera). Antes del 19/10 el cron de cada 10 minutos las contestaba de a una, 3 o 4 por vuelta, y a
// la hora se las pasaba a Cande.
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
import { agente, colaDe, decirleACande } from "../../../lib/dm/armado";
import * as base from "../../../lib/dm/base";
import { MARGEN_MS, macEncendida, macEscuchando } from "../../../lib/dm/cola";
import { crearIndicacionesPendientes } from "../../../lib/dm/respuestas";
import {
  ESPERA_EN_PARALELO, REINTENTO_MAX_FALLOS, vaciarEspera, vueltaDeLaEspera,
} from "../../../lib/dm/seguimientos";
import {
  ajustes, contactosConIndicacion, hayBase, reclamarEspera, sinContestar, soltarEspera, tablas,
} from "../../../lib/dm/base";

const indicaciones = crearIndicacionesPendientes({ base, agente, decir: decirleACande, macEncendida });

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

  const aj = await ajustes();
  const prendido = aj.modo === "auto" || aj.modo === "sombra";
  // Las redacta la Mac de Cande (salvo cerebro "api"): sin ella escuchando, siguen esperando. Cada respuesta pasa
  // además por el portón de armado.pedir, que mira de nuevo en el momento de crear el trabajo.
  const macViva = aj.cerebro === "api" || (await macEscuchando(MARGEN_MS.espera));
  const hasta = inicio + (config.maxDuration - MARGEN_S) * 1000;

  // Las indicaciones de Cande y las charlas, a la par. Las charlas con una indicación guardada las contesta el turno de
  // la indicación (se miran antes de que esa corrida las saque de la fila).
  let conIndicacion = new Set();
  try {
    conIndicacion = new Set(await contactosConIndicacion());
  } catch (e) {
    console.error("dm: no se pudieron leer las indicaciones pendientes", e.message);
  }
  const { ind, r, motivo } = await vueltaDeLaEspera({
    prendido, macViva,
    indicaciones: ({ conMac }) => indicaciones({ hasta, conMac }),
    contestar: async () => vaciarEspera({
      filas: (await sinContestar()).filter((c) => !conIndicacion.has(c.id)), prendido, macViva, maxFallos: REINTENTO_MAX_FALLOS,
      reclamar: (id) => reclamarEspera(id, { tope: ESPERA_EN_PARALELO }),
      soltar: soltarEspera,
      procesar: (id, idLead) => agente.procesar(id, idLead, { tarde: true }),
      hasta,
      enParalelo: ESPERA_EN_PARALELO,
      registrar: (id, e) => console.error("dm: falló una respuesta de la espera", colaDe(id), e.message),
    }),
    registrar: (que, e) => console.error(`dm: falló la espera (${que})`, e.message),
  });
  const deCande = ind.hechas || ind.vencidas || ind.viejas
    ? { indicaciones: ind.hechas, indicaciones_vencidas: ind.vencidas, indicaciones_viejas: ind.viejas } : {};

  // Apagado no se contesta nada: el cron de los toques le pasa esas charlas a Cande.
  if (motivo) return res.status(200).json({ ok: true, reintentos: 0, ...deCande, motivo });
  return res.status(200).json({ ok: true, reintentos: r.reintentos, ...deCande, ...(r.cayo ? { motivo: "el modelo no contesta" } : {}) });
}

export const config = { maxDuration: 300 };
