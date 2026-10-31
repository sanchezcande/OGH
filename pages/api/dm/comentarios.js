// El cron de "comentá CV y te mando la lista" (30/10). Lo llama Vercel cada 15 minutos, en los
// mismos minutos que los demás crons (ver vercel.json y lib/crons.js).
//
// Mira los posts y reels de la última semana, busca los comentarios que piden la lista y le manda a
// cada uno su DM con una private reply (lib/dm/comentarios.js). Esto reemplaza la automatización de
// CV de ManyChat, que quedó pausada cuando la cuenta se pasó del tope de contactos del plan Pro.
//
// Convive con ManyChat en vez de reemplazarlo de golpe: el 30/10, mandando uno de verdad, se vio
// que el automático de CV de ManyChat seguía vivo y contestaba los comentarios a los 7 segundos
// (@juliovasquez_m.a recibió el mismo link dos veces por eso). Así que antes de mandar se mira la
// bandeja y a quien ya recibió algo de la cuenta desde que comentó (o el DM de CV, cuando sea) no se
// le manda nada: esto contesta solo lo que ManyChat dejó pasar. Cuando la automatización de ManyChat esté de verdad apagada, esto contesta
// todo sin que haya que cambiarle nada.
//
// Arranca apagado: se prende con dm_config "comentarios" en { activo: true }. El tope por vuelta
// (`tope`, 10 por defecto) está para que la primera vez no salga una tanda entera de una.
//
// Devuelve solo cantidades: ni ids ni usuarios salen en la respuesta ni en los registros.
import { avisarDm, instagram, reglasInstagram } from "../../../lib/dm/armado";
import { ajustes, hayBase, leerConfig } from "../../../lib/dm/base";
import { contestarComentarios } from "../../../lib/dm/comentarios";
import {
  anotarComentario, anotarEnDuda, anotarYaContestado, comentariosEnLaBase, contarComentarios, soltarComentario, soltarDuda, tablaComentarios,
  tomarComentario, usuariosConDm,
} from "../../../lib/dm/comentariosBase";

const TOPE_POR_VUELTA = 10;
/** Pasado este rato la vuelta no empieza nada nuevo (ver `limite` en contestarComentarios). */
const TIEMPO_MS = 90000;
/** Los posts y reels que mira cada vuelta: con 6 por día, 25 cubre de sobra los 7 días de la ventana. */
const MEDIOS_POR_VUELTA = 25;

export default async function handler(req, res) {
  const arranque = Date.now();
  const s = process.env.CRON_SECRET;
  if (!s || req.headers.authorization !== `Bearer ${s}`) return res.status(401).json({ error: "no" });
  if (!hayBase()) return res.status(200).json({ ok: true, motivo: "sin base" });
  await tablaComentarios();

  const ajuste = (await leerConfig("comentarios")) || {};
  if (ajuste.activo !== true) return res.status(200).json({ ok: true, motivo: "apagado" });
  // Con el agente apagado del todo no sale nada de la cuenta: lo que entra por acá después lo
  // atiende él, y si ella lo apagó es porque no quiere que la cuenta le escriba a nadie. En sombra
  // sí sale: el DM de CV es un texto fijo, no lo redacta el modelo.
  const aj = await ajustes();
  if (aj.modo === "apagado") return res.status(200).json({ ok: true, motivo: "el agente está apagado" });

  try {
    const cuentas = await contestarComentarios({
      ig: instagram,
      base: { tomarComentario, anotarComentario, soltarComentario, comentariosEnLaBase, anotarYaContestado, anotarEnDuda, soltarDuda, usuariosConDm },
      // Lo que falta para los 120 segundos queda de margen para el envío que esté saliendo.
      limite: arranque + TIEMPO_MS,
      avisar: avisarDm,
      tope: Number.isInteger(ajuste.tope) && ajuste.tope > 0 ? ajuste.tope : TOPE_POR_VUELTA,
      mediosQueMira: MEDIOS_POR_VUELTA,
      // Sin ids ni textos en el registro: Instagram los repite en sus errores.
      registrar: (motivo, e) => console.error("dm: un comentario con CV no se pudo contestar", motivo, e?.code ?? "", e?.subcode ?? ""),
    });
    return res.status(200).json({ ok: true, ...cuentas, total: await contarComentarios() });
  } catch (e) {
    // Si Instagram no contesta, el aviso de la conexión es el de siempre (uno por día como mucho).
    await reglasInstagram.fallo(e);
    return res.status(200).json({ ok: false, error: e?.code ?? e?.name ?? "falló" });
  }
}

// Mirar la bandeja antes de mandar se lleva unos 30 segundos (ver bandejaDe en lib/dm/comentarios.js),
// leer los comentarios otros 30, y buscar charlas de a una, unos segundos cada una (como mucho 5).
export const config = { maxDuration: 120 };
