// El cron de la red de la bandeja (lib/dm/bandeja.js). Lo llama Vercel cada 3 minutos (ver vercel.json).
//
// Mira la bandeja real de Instagram (con el permiso con el que el sitio publica, como /api/dm/instagram) para que
// no quede ninguna charla sin contestar aunque el webhook de ManyChat no haya llegado: guarda lo que no entró y
// lo contesta la espera (/api/dm/espera), da de alta a quien nunca entró, y a Cande le llega como mucho un
// resumen cada 3 horas con lo que tiene que contestar ella. Va aparte del cron de Instagram (que tiene 60
// segundos): leer 50 charlas con sus mensajes le lleva a Meta de 4 a 9 segundos, y buscar a alguien nuevo en
// ManyChat, varios pedidos más.
//
// Corre siempre que haya base, salvo con el ajuste "bandeja" en false. Si Instagram falla, se avisa como en el
// cron de Instagram (un aviso por día como mucho, y nada por una demora).
//
// Devuelve solo cantidades: ni ids ni usuarios salen en la respuesta ni en los registros.
import { avisarDm, instagram, reglasInstagram } from "../../../lib/dm/armado";
import { revisarBandeja } from "../../../lib/dm/bandeja";
import {
  ajustes, anotarDesdeBandeja, contacto, contactoDeIg, darDeAltaDesdeBandeja, fueDelAgente, guardarConfig, guardarIg, hayBase,
  leadsGuardados, leerConfig, loSigue, soltar, tablas, textosDeLaCuenta, tomar,
} from "../../../lib/dm/base";
import { buscarPorNombre, datosDe, hayManyChat } from "../../../lib/dm/manychat";

// La lista de charlas puede tardar 25 segundos y el resumen, otros 15 (los tres caminos de Telegram): no se mira
// otra charla pasados los 80 segundos.
const MARGEN_S = 40;

export default async function handler(req, res) {
  const inicio = Date.now();
  // Solo el cron de Vercel (manda "Bearer CRON_SECRET"). Sin el secreto cargado no entra nadie.
  const s = process.env.CRON_SECRET;
  if (!s || req.headers.authorization !== `Bearer ${s}`) return res.status(401).json({ error: "no" });
  if (!hayBase()) return res.status(200).json({ ok: true, motivo: "sin base" });
  await tablas();
  const aj = await ajustes();
  if (aj.bandeja === false) return res.status(200).json({ ok: true, motivo: "red de la bandeja apagada" });

  let r = { miradas: 0, recuperados: 0, altas: 0, pendientes: 0, resumen: false };
  try {
    r = await revisarBandeja({
      ig: instagram,
      base: {
        leerConfig, guardarConfig, contactoDeIg, contacto, guardarIg, loSigue, textosDeLaCuenta, leadsGuardados, fueDelAgente,
        tomar, soltar, anotarDesdeBandeja, darDeAltaDesdeBandeja,
      },
      manychat: { hayManyChat, buscarPorNombre, datosDe },
      aj,
      avisar: avisarDm,
      hasta: inicio + (config.maxDuration - MARGEN_S) * 1000,
      // Sin ids en el registro: Instagram los repite en sus errores.
      registrar: (e) => console.error("dm: falló una charla de la bandeja", e?.code ?? "", String(e?.message || "").replace(/\d{6,}/g, "…")),
    });
  } catch (e) {
    await reglasInstagram.fallo(e);
  }
  return res.status(200).json({ ok: true, ...r });
}

export const config = { maxDuration: 120 };
