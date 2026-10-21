// El cron de la red de la bandeja (lib/dm/bandeja.js). Lo llama Vercel cada 15 minutos, en los mismos minutos que los
// demás crons (ver vercel.json y lib/crons.js).
//
// Mira la bandeja real de Instagram (con el permiso con el que el sitio publica, como /api/dm/instagram) para que
// no quede ninguna charla sin contestar aunque el webhook de ManyChat no haya llegado: guarda lo que no entró y
// lo contesta la espera (/api/dm/espera), da de alta a quien nunca entró, y a Cande le llega como mucho un
// resumen cada 3 horas con lo que tiene que contestar ella. Va aparte del cron de Instagram (que tiene 60
// segundos): leer 50 charlas con sus mensajes le lleva a Meta de 4 a 9 segundos por página, y buscar a alguien
// nuevo en ManyChat, varios pedidos más.
//
// Corre siempre que haya base, salvo con el ajuste "bandeja" en false. Si Instagram falla, se avisa como en el
// cron de Instagram (un aviso por día como mucho, y nada por una demora). Si tres vueltas seguidas de la red no
// terminan, sea por lo que sea (Instagram que limita durante horas, la base, una vuelta que Vercel corta por tiempo),
// se avisa una vez (vigilarRed).
//
// Devuelve solo cantidades: ni ids ni usuarios salen en la respuesta ni en los registros.
import { avisarDm, instagram, reglasInstagram } from "../../../lib/dm/armado";
import { revisarBandeja, vigilarRed } from "../../../lib/dm/bandeja";
import {
  ajustes, anotarCandeDesdeIg, anotarDesdeBandeja, contacto, contactoDeIg, darDeAltaDesdeBandeja, enviadosEnLaCharla, guardarConfig, guardarIg, hayBase,
  leadsGuardados, leerConfig, loSigue, salidaSinLlegar, soltar, tablas, textosDeLaCuenta, tomar,
} from "../../../lib/dm/base";
import { ErrorInstagram } from "../../../lib/dm/instagram";
import { buscarPorNombre, datosDe, hayManyChat, ponerEtiqueta } from "../../../lib/dm/manychat";

// Una página de charlas puede tardar 25 segundos y el resumen, otros 15 (los tres caminos de Telegram): no se mira
// otra charla pasados los 80 segundos, ni se pide otra página pasados los 55.
const MARGEN_S = 40;

// Sin ids en el registro: Instagram los repite en sus errores.
const registrar = (e) => console.error("dm: falló algo en la red de la bandeja", e?.code ?? "", String(e?.message || "").replace(/\d{6,}/g, "…"));

export default async function handler(req, res) {
  const inicio = Date.now();
  // Solo el cron de Vercel (manda "Bearer CRON_SECRET"). Sin el secreto cargado no entra nadie.
  const s = process.env.CRON_SECRET;
  if (!s || req.headers.authorization !== `Bearer ${s}`) return res.status(401).json({ error: "no" });
  if (!hayBase()) return res.status(200).json({ ok: true, motivo: "sin base" });

  let r = { paginas: 0, miradas: 0, recuperados: 0, altas: 0, pendientes: 0, fallas: 0, resumen: false };
  try {
    await tablas();
    const aj = await ajustes();
    if (aj.bandeja === false) return res.status(200).json({ ok: true, motivo: "red de la bandeja apagada" });
    // Si la vuelta anterior no terminó (Vercel la cortó por tiempo y no llegó a avisar) y ya van tres así.
    await vigilarRed({ base: { leerConfig, guardarConfig }, avisar: avisarDm, alEmpezar: true });
    r = await revisarBandeja({
      ig: instagram,
      base: {
        leerConfig, guardarConfig, contactoDeIg, contacto, guardarIg, loSigue, textosDeLaCuenta, enviadosEnLaCharla, leadsGuardados,
        tomar, soltar, anotarDesdeBandeja, anotarCandeDesdeIg, darDeAltaDesdeBandeja, salidaSinLlegar,
      },
      manychat: { hayManyChat, buscarPorNombre, datosDe, ponerEtiqueta },
      aj,
      avisar: avisarDm,
      hasta: inicio + (config.maxDuration - MARGEN_S) * 1000,
      registrar,
    });
  } catch (e) {
    // Lo de Instagram, como el cron de Instagram (un aviso por día, nada por una demora). Lo demás (la base) no es
    // "la conexión con Instagram no anda": lo cubre el aviso de la red caída.
    if (e instanceof ErrorInstagram) await reglasInstagram.fallo(e);
    else registrar(e);
    try {
      await vigilarRed({ base: { leerConfig, guardarConfig }, avisar: avisarDm, error: e });
    } catch (e2) {
      registrar(e2); // sin base no hay dónde mirar
    }
    return res.status(200).json({ ok: false, ...r });
  }
  return res.status(200).json({ ok: true, ...r });
}

export const config = { maxDuration: 120 };
