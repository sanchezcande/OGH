// El cron del controlador del agente de DM (lib/dm/controlador.js). Lo llama Vercel cada 15 minutos, en los mismos
// minutos que los demás crons (ver vercel.json y lib/crons.js: así la base duerme entre una vuelta y la otra). Arranca
// junto con el cron de los toques, que también le pide turnos a la Mac: una charla que tiene tomada otra corrida se
// corrige en la vuelta siguiente, y a una a la que le toca un seguimiento, el seguimiento va primero.
//
// Reglas fijas, sin modelo, que miran las charlas de las últimas 72 horas: corrigen solas lo que es seguro (un sí a una
// oferta sin lo que tenía que seguir, quien vio el video y opinó a favor sin saber cuánto sale) y lo demás se lo listan
// a Cande en el resumen de las notas, sin sonido. Con el ajuste "controlador" en false no hace nada. Cómo reconocen el
// recorrido vive en la base (dm_config "controlador_patrones"): sin eso, solo miran quién quedó sin respuesta.
//
// Devuelve solo cantidades: ni ids ni nombres salen en la respuesta ni en los registros.
import { agente } from "../../../lib/dm/armado";
import * as base from "../../../lib/dm/base";
import { segundosDesdeElLatido } from "../../../lib/dm/cola";
import { crearControlador } from "../../../lib/dm/controlador";
import { MAC_VIVA_SEGUNDOS } from "../../../lib/dm/seguimientos";

/** Si la Mac está redactando (salvo con el cerebro de la API): sin ella no se corrige, queda para la vuelta siguiente. */
async function macViva(aj) {
  if (aj?.cerebro === "api") return true;
  const s = await segundosDesdeElLatido();
  return s !== null && s < MAC_VIVA_SEGUNDOS;
}

const controlar = crearControlador({ base, agente, macViva });

// Una corrección puede tardar hasta unos 140 segundos (las dos miradas a Instagram, el modelo y el envío, con sus
// topes): no se arranca ninguna si no queda ese margen antes de que Vercel corte.
const MARGEN_S = 150;

export default async function handler(req, res) {
  const inicio = Date.now();
  // Solo el cron de Vercel (manda "Bearer CRON_SECRET"). Sin el secreto cargado no entra nadie.
  const s = process.env.CRON_SECRET;
  if (!s || req.headers.authorization !== `Bearer ${s}`) return res.status(401).json({ error: "no" });
  if (!base.hayBase()) return res.status(200).json({ ok: true, motivo: "sin base" });
  try {
    await base.tablas();
    const r = await controlar({ hasta: inicio + (config.maxDuration - MARGEN_S) * 1000 });
    return res.status(200).json({ ok: true, ...r });
  } catch (e) {
    console.error("dm: falló el controlador", String(e?.message || "").replace(/\d{6,}/g, "…"));
    return res.status(200).json({ ok: false });
  }
}

export const config = { maxDuration: 300 };
