// El cron del agente de DM. Lo llama Vercel cada 15 minutos, en los mismos minutos que los demás crons (ver
// vercel.json y lib/crons.js). Hace seis cosas:
//
//   1. Red de seguridad, siempre, esté el agente prendido o apagado: las respuestas que ManyChat
//      no vino a retirar salen por la API si todavía corresponde, y si no pasan a Cande
//      (agente.rescatarVencida, 20/10). De las charlas que tiene el agente con un mensaje sin atender pasan a
//      Cande solo las que no tienen arreglo: el agente está apagado, una respuesta pudo haber salido
//      (no se manda dos veces) o el modelo falló 3 veces con esa charla en particular (mientras con
//      las demás andaba). Las demás quedan en espera, del agente y sin aviso, por más que pase el
//      tiempo (19/10, Cande: "deberían quedar on hold y cuando prendo la pc las deberías agarrar
//      vos"). Antes pasaban a la hora y le llegaba un aviso por charla cada vez que apagaba la compu.
//      Las contesta el cron de la espera (/api/dm/espera, cada 15 minutos) cuando la Mac vuelve.
//   2. Las que esperaron tanto que Instagram ya no deja escribirles (23 horas y media desde lo último
//      del lead: la Mac apagada casi un día): UN aviso por vuelta con la lista, nombre y link de cada
//      una, y el turno de cada una se cierra (no vuelve a salir en otro aviso).
//   3. Las fotos del lead que se quedaron sin su aviso URGENTE (Telegram no anduvo, o la corrida se
//      cortó antes de avisar): se avisan de nuevo, una vez cada una, esté la Mac o no y sea de quien sea
//      la charla (en ese turno pudo pasar a Cande). Lo mismo con el aviso YA del código de quien pagó en
//      pesos: el borrador quedó guardado y su aviso no salió. Los dos, con el mismo tope de tiempo que los
//      toques: lo que no entra queda para la vuelta siguiente.
//   4. Seguimientos ("te anotaste?", "viste el video?"), solo si están prendidos en los ajustes, la
//      Mac está contestando, no hay charlas esperando respuesta (primero se contesta a quien escribió)
//      y es de día en Argentina (de 9 a 21).
//      Cada toque vencido se reclama de a uno y pasa por el agente con el evento "seguimiento":
//      el agente vuelve a mirar que la charla siga siendo suya, que el lead no haya escrito y
//      que la ventana de 24 horas de Instagram siga abierta.
//   5. El resumen de las notas del agente, a las 9 y a las 18 de Bali y sin sonido (lib/dm/resumen.js, 20/10):
//      lo que Cande tiene que saber y no necesita nada de ella ya.
//   6. Borra lo guardado de las charlas que llevan 90 días quietas.
//
// Devuelve solo cantidades: los ids de los contactos no salen en la respuesta ni en los registros.
import { agente, avisarDm, colaDe } from "../../../lib/dm/armado";
import { borrarTrabajosViejos, segundosDesdeElLatido } from "../../../lib/dm/cola";
import { horaDeToques } from "../../../lib/dm/frenos";
import * as manychat from "../../../lib/dm/manychat";
import { crearResumen } from "../../../lib/dm/resumen";
import {
  MAC_VIVA_SEGUNDOS, REINTENTO_MAX_FALLOS, correrToques, hayEspera, pasarSinContestar,
} from "../../../lib/dm/seguimientos";
import * as base from "../../../lib/dm/base";
import {
  ajustes, borrarViejas, codigosSinAviso, fotosSinAviso, hayBase, reclamarCaliente, reclamarEspera, reclamarToque, sinContestar, sinVentana,
  soltarEspera, tablas, vencerPendientes,
} from "../../../lib/dm/base";
import { CALIENTES } from "../../../lib/dm/pagina";

const mandarResumen = crearResumen({ base, manychat, avisar: avisarDm });

const TOQUES_POR_CORRIDA = 10;
const CALIENTES_POR_CORRIDA = 10;

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

  // Primero lo que nadie retiró: sale por la API si todavía corresponde; si no, la charla pasa a Cande con su motivo,
  // y la búsqueda de abajo no la vuelve a avisar.
  // Cada rescate puede tardar hasta unos 15 s mirando Instagram: pasado un minuto y medio, las que quedan pasan a Cande
  // como antes (con su aviso), así ninguna queda vencida sin mandar y sin aviso si Vercel corta la función.
  let reenviadas = 0;
  const topeRescate = inicio + 90 * 1000;
  for (const v of await vencerPendientes()) {
    if (Date.now() > topeRescate) {
      await agente.pasarACande(v, { aviso: "una respuesta quedó sin salir: ManyChat no la vino a retirar", motivo: "retiro vencido" });
      sinAtender++;
      continue;
    }
    const r = await agente.rescatarVencida(v);
    if (r === "reenviada") reenviadas++;
    else if (r !== "descartada") sinAtender++; // descartada: la charla sigue del agente (una retomada donde escribió Cande)
  }
  // Los toques y las respuestas de la espera los redacta la Mac de Cande (salvo cerebro "api").
  const latido = aj.cerebro === "api" ? 0 : await segundosDesdeElLatido();
  const macViva = latido !== null && latido < MAC_VIVA_SEGUNDOS;
  const limite = inicio + (config.maxDuration - 130) * 1000;

  // Las charlas sin atender: acá solo se pasa lo que no tiene arreglo. Lo demás queda en espera.
  const filas = await sinContestar();
  const ops = { prendido, macViva, maxFallos: REINTENTO_MAX_FALLOS };
  sinAtender += await pasarSinContestar({
    filas, ...ops,
    apartar: async (id) => (await reclamarEspera(id, { paraPasar: true })).tomada,
    soltar: soltarEspera,
    pasar: (c, aviso) => agente.pasarACande(c, aviso),
  });

  // Las que ya no se pueden contestar: un solo aviso con todas (avisarSinVentana). Preguntarle a
  // ManyChat el usuario de cada una tarda: si se pasa de 40 segundos, salen sin link las que falten.
  let sinVentanaAvisadas = 0;
  try {
    sinVentanaAvisadas = await agente.avisarSinVentana(await sinVentana(), { hasta: Date.now() + 40000 });
  } catch (e) {
    console.error("dm: no se pudo avisar de las charlas sin ventana", e.message);
  }

  // Los avisos del código que no salieron: el lead ya tiene el acuse que le promete el código.
  let codigos = 0;
  try {
    codigos = await agente.avisarCodigosPendientes(await codigosSinAviso(), { hasta: limite });
  } catch (e) {
    console.error("dm: no se pudieron avisar los códigos pendientes", e.message);
  }

  // Las fotos sin aviso: después de los pases (una charla que se acaba de pasar ya le llegó a Cande).
  let fotos = 0;
  try {
    fotos = await agente.avisarFotosPendientes(await fotosSinAviso(), { hasta: limite });
  } catch (e) {
    console.error("dm: no se pudieron avisar las fotos pendientes", e.message);
  }

  // El resumen de las notas: la primera vuelta después de las 9 y de las 18 de Bali (una sola vez por franja).
  let resumen = { hecho: "no toca", charlas: 0 };
  try {
    resumen = await mandarResumen({ hasta: Date.now() + 30000 });
  } catch (e) {
    console.error("dm: no se pudo mandar el resumen de las notas", e.message);
  }

  // Los turnos inmediatos (lib/dm/pagina.js, 22/10): después del formulario, del clic en pagar o del link sin llenar. Van
  // antes que los toques y con las mismas condiciones, salvo la hora: el del formulario y el del pago siguen a algo que
  // la persona acaba de hacer en la página, así que salen también de noche; el del link, solo en el horario de los toques.
  if (prendido && aj.toques === true && macViva && !hayEspera(filas, ops)) {
    const motivos = horaDeToques(new Date()) ? CALIENTES : CALIENTES.filter((m) => m !== "link");
    for (let i = 0; i < CALIENTES_POR_CORRIDA && Date.now() < limite; i++) {
      const t = await reclamarCaliente({ motivos });
      if (!t) break;
      try {
        const r = await agente.turnoCaliente(t);
        if (r?.hecho === "enviada") hechos++;
      } catch (e) {
        console.error("dm: falló el turno inmediato", colaDe(t.id), e.message);
      }
    }
  }

  // Toques: si la Mac no está contestando, si hay charlas esperando respuesta (las contesta el cron de
  // la espera, y la Mac no da para todo a la vez) o si es de noche en Argentina, no se reclama ninguno:
  // siguen en la fila y salen en una corrida de después (los que se pasan de las 24 horas los limpia
  // reclamarToque). Reclamar uno con la Mac dormida lo perdería: el toque no se reintenta.
  if (prendido && aj.toques === true && macViva && !hayEspera(filas, ops) && horaDeToques(new Date())) {
    // Cada toque puede tardar lo que tarda el modelo (91 segundos como mucho) más el envío: no
    // se arranca uno si no queda ese margen antes de que Vercel corte la función. El margen se
    // cuenta desde que arrancó: lo de arriba puede tardar (una llamada a ManyChat y un aviso
    // por charla).
    hechos += await correrToques({
      reclamar: reclamarToque,
      procesar: (id) => agente.procesar(id, null, { evento: "seguimiento" }),
      hasta: limite,
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
  return res.status(200).json({
    ok: true, hechos, sin_atender: sinAtender, reenviadas, sin_ventana: sinVentanaAvisadas, fotos, codigos, resumen: resumen.charlas,
    ...(prendido ? {} : { motivo: "apagado" }),
  });
}

export const config = { maxDuration: 300 };
