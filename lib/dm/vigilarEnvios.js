// El reloj del envío: avisa cuando lo que escribe el agente deja de llegar.
//
// 02/11, decisión de Cande: se cancela ManyChat y las automatizaciones quedan todas de este lado.
// Mientras ManyChat existía, si algo nuestro se rompía ManyChat seguía contestando y el aviso lo
// daba él. Sin ManyChat, un envío que falla no lo ve nadie. Pasó dos veces esta semana:
//
//   - 31/10 y 01/11: el envío intentaba Instagram solo si existía una variable que no está en
//     Vercel, así que todo salía por ManyChat, que con el tope de contactos devolvía "incierta". No
//     llegaron diez pedidos de CV por DM ni cuatro respuestas del agente, y lo descubrimos un día
//     después, a mano.
//   - 31/10 al 01/11: el agente estuvo 34 horas caído y tampoco avisó.
//
// `vigilarRed` (lib/dm/bandeja.js) ya mira que la LECTURA ande. Esto mira lo otro: que lo que se
// escribe salga. Son dos señales distintas y las dos hacen falta.
//
// Qué se considera roto, mirando la última ventana:
//   1. Hay mensajes de leads y NO salió ni una respuesta. Eso es el agente mudo.
//   2. Lo que sale queda en "incierta" o "error" más que lo que sale bien. Eso es el camino de
//      envío roto, que es exactamente lo que pasó el 31/10.
//
// El aviso sale una vez por ventana: un problema de envío dura horas y un Telegram cada 15 minutos
// se vuelve ruido que ella deja de leer, que es peor que no avisar.

/** Cuánto se mira para atrás. Dos horas: menos es ruido de la noche, más llega tarde. */
export const VENTANA_HORAS = 2;
/** Cada cuánto, como mucho, se repite el aviso del mismo problema. */
export const AVISO_CADA_HORAS = 6;

const fecha = (v) => {
  const t = Date.parse(String(v || ""));
  return Number.isFinite(t) ? t : null;
};

/**
 * Mira la última ventana y avisa si el agente quedó mudo o si lo que manda no está llegando.
 *
 * `base` necesita `pulsoEnvios(horas)` (los números de la ventana), `leerConfig` y `guardarConfig`.
 * Devuelve lo que vio, y si avisó.
 */
export async function vigilarEnvios({ base, avisar, horas = VENTANA_HORAS, ahora = () => new Date() }) {
  const t = ahora();
  let p;
  try {
    p = await base.pulsoEnvios(horas);
  } catch {
    // Si no se puede medir, no se inventa una alarma: de eso ya avisa la red de la bandeja.
    return { miro: false, aviso: false };
  }

  const leads = Number(p?.leads || 0);
  const enviadas = Number(p?.enviadas || 0);
  const fallidas = Number(p?.inciertas || 0) + Number(p?.errores || 0);

  // Mudo: le escribieron y no salió nada. Sin mensajes de leads no hay nada que concluir: puede ser
  // simplemente que nadie escribió.
  const mudo = leads > 0 && enviadas === 0;
  // Roto: sale más de lo que falla que de lo que llega. Con pocos envíos no alcanza para afirmarlo.
  const roto = fallidas >= 3 && fallidas > enviadas;
  if (!mudo && !roto) return { miro: true, aviso: false, leads, enviadas, fallidas };

  const salud = (await base.leerConfig("envios_salud")) || {};
  const avisado = fecha(salud.avisado_en);
  if (avisado !== null && t.getTime() - avisado < AVISO_CADA_HORAS * 3600000) {
    return { miro: true, aviso: false, callado: true, leads, enviadas, fallidas };
  }

  let salio = false;
  try {
    salio = await avisar("DM: lo que escribe el agente no está saliendo", {
      Qué: mudo
        ? `te escribieron ${leads} ${leads === 1 ? "vez" : "veces"} en las últimas ${horas} horas y no salió ni una respuesta`
        : `de lo último que mandó, ${fallidas} no llegaron y ${enviadas} sí`,
      Hacé: "mirá la bandeja de Instagram y contestá a mano lo que no pueda esperar",
      Nota: "esto avisa como mucho una vez cada seis horas",
    }, { contestable: false });
  } catch {
    salio = false;
  }
  if (salio) await base.guardarConfig("envios_salud", { ...salud, avisado_en: t.toISOString() });
  return { miro: true, aviso: salio, mudo, roto, leads, enviadas, fallidas };
}
