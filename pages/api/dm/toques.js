// El cron del agente de DM. Lo llama Vercel cada 10 minutos (ver vercel.json). Hace tres cosas:
//
//   1. Red de seguridad, siempre, esté el agente prendido o apagado: las respuestas que ManyChat
//      no vino a retirar y las charlas del agente que quedaron con un mensaje sin atender (una
//      función que murió a mitad de camino, o un mensaje que entró con el agente apagado) pasan
//      a Cande con aviso. Apagado, lo que escribe un lead del agente no puede quedar sin que
//      ella se entere.
//   2. Seguimientos ("te anotaste?", "viste el video?"), solo si están prendidos en los ajustes, la
//      Mac está contestando y es de día en Argentina (de 9 a 21).
//      Cada toque vencido se reclama de a uno y pasa por el agente con el evento "seguimiento":
//      el agente vuelve a mirar que la charla siga siendo suya, que el lead no haya escrito y
//      que la ventana de 24 horas de Instagram siga abierta.
//   3. Borra lo guardado de las charlas que llevan 90 días quietas.
//
// Devuelve solo cantidades: los ids de los contactos no salen en la respuesta ni en los registros.
import { agente, colaDe } from "../../../lib/dm/armado";
import { borrarTrabajosViejos, segundosDesdeElLatido } from "../../../lib/dm/cola";
import { horaDeToques } from "../../../lib/dm/frenos";
import { correrToques } from "../../../lib/dm/seguimientos";
import {
  ajustes, borrarViejas, hayBase, reclamarToque, sinContestar, tablas, vencerPendientes,
} from "../../../lib/dm/base";

const TOQUES_POR_CORRIDA = 10;
const MAC_VIVA_SEGUNDOS = 180; // la Mac pregunta cada pocos segundos y el latido se guarda una vez por minuto

/** Qué se le dice a Cande de una charla que quedó con un mensaje sin atender. */
function avisoDe(c, prendido) {
  // La respuesta llegó a anotarse para mandar: si ella contesta sin mirar, puede salir dos veces.
  if (c.quizas_salio) return { aviso: "No sé si la respuesta salió: mirá la charla antes de contestar", motivo: "envío sin confirmar" };
  if (!prendido) return { aviso: "escribió y el agente está apagado: la charla vuelve a vos", motivo: "agente apagado" };
  return { aviso: "quedó un mensaje sin contestar: el agente no llegó a atenderlo", motivo: "sin respuesta" };
}

export default async function handler(req, res) {
  const inicio = Date.now();
  // Solo el cron de Vercel (manda "Bearer CRON_SECRET"). Sin el secreto cargado no entra nadie.
  const s = process.env.CRON_SECRET;
  if (!s || req.headers.authorization !== `Bearer ${s}`) return res.status(401).json({ error: "no" });
  if (!hayBase()) return res.status(200).json({ ok: true, hechos: 0 });
  await tablas();

  const aj = await ajustes();
  const prendido = aj.modo === "auto" || aj.modo === "sombra";
  let hechos = 0;
  let sinAtender = 0;

  // Primero lo que nadie retiró: esas charlas ya pasan a Cande con su motivo, y la búsqueda de
  // abajo no las vuelve a avisar.
  for (const c of await vencerPendientes()) {
    await agente.pasarACande(c, { aviso: "una respuesta quedó sin salir: ManyChat no la vino a retirar", motivo: "retiro vencido" });
    sinAtender++;
  }
  for (const c of await sinContestar()) {
    await agente.pasarACande(c, avisoDe(c, prendido));
    sinAtender++;
  }

  // Los toques los redacta la Mac de Cande (salvo cerebro "api"). Si no está contestando, o es de
  // noche en Argentina, no se reclama ninguno: siguen en la fila y salen en una corrida de después
  // (los que se pasan de las 24 horas los limpia reclamarToque). Reclamar uno con la Mac dormida lo
  // perdería: el modelo no contesta y el toque no se reintenta.
  const latido = aj.cerebro === "api" ? 0 : await segundosDesdeElLatido();
  const macViva = latido !== null && latido < MAC_VIVA_SEGUNDOS;
  if (prendido && aj.toques === true && macViva && horaDeToques(new Date())) {
    // Cada toque puede tardar lo que tarda el modelo (91 segundos como mucho) más el envío: no
    // se arranca uno si no queda ese margen antes de que Vercel corte la función. El margen se
    // cuenta desde que arrancó: la red de arriba puede tardar (una llamada a ManyChat y un aviso
    // por charla).
    hechos += await correrToques({
      reclamar: reclamarToque,
      procesar: (id) => agente.procesar(id, null, { evento: "seguimiento" }),
      hasta: inicio + (config.maxDuration - 130) * 1000,
      tope: TOQUES_POR_CORRIDA,
      registrar: (id, e) => console.error("dm: falló el toque", colaDe(id), e.message),
    });
  }

  try {
    await borrarViejas();
    await borrarTrabajosViejos();
  } catch (e) {
    console.error("dm: no se pudo borrar lo viejo", e.message);
  }
  return res.status(200).json({ ok: true, hechos, sin_atender: sinAtender, ...(prendido ? {} : { motivo: "apagado" }) });
}

export const config = { maxDuration: 300 };
