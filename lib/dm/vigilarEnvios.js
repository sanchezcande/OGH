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
//   1. Hay mensajes de leads sin atender hace rato (o escribieron varias charlas) y NO salió ni una
//      respuesta. Eso es el agente mudo.
//   2. Lo que sale queda en "incierta" o "error" más que lo que sale bien. Eso es el camino de
//      envío roto, que es exactamente lo que pasó el 31/10.
//
// El aviso sale una vez por ventana: un problema de envío dura horas y un Telegram cada 15 minutos
// se vuelve ruido que ella deja de leer, que es peor que no avisar.

/** Cuánto se mira para atrás. Dos horas: menos es ruido de la noche, más llega tarde. */
export const VENTANA_HORAS = 2;
/**
 * Cuánto tarda el agente en contestar cuando todo anda: la espera toma lo de más de 5 minutos en la vuelta de cada
 * 15, así que sale entre 5 y 20 minutos después de guardado, más lo que tarda en redactar. Un mensaje más nuevo que
 * esto todavía no es silencio. El 03/11 un lead escribió a las 11:10 UTC después de una noche sin nadie, el aviso
 * salió a las 11:15 diciendo "contestá a mano", Cande contestó y la charla dejó de ser del agente, que la iba a
 * contestar a las 11:30.
 */
export const RESPUESTA_NORMAL_MIN = 30;
/**
 * Con todos los turnos cerrados, cuántas charlas distintas tienen que haber escrito sin que salga nada para avisar
 * igual: un agente que calla con todos tampoco está contestando. Con una o dos es la noche (un "gracias" que el
 * agente deja pasar).
 */
export const CHARLAS_SIN_NADA = 3;
/** Cada cuánto, como mucho, se repite el aviso del mismo problema. */
export const AVISO_CADA_HORAS = 6;

const fecha = (v) => {
  const t = Date.parse(String(v || ""));
  return Number.isFinite(t) ? t : null;
};

/**
 * Mira la última ventana y avisa si el agente quedó mudo o si lo que manda no está llegando.
 *
 * `base` necesita `pulsoEnvios(horas, minutos)` (los números de la ventana), `leerConfig` y `guardarConfig`.
 * Devuelve lo que vio, y si avisó.
 */
export async function vigilarEnvios({ base, avisar, horas = VENTANA_HORAS, ahora = () => new Date() }) {
  const t = ahora();
  let p;
  try {
    p = await base.pulsoEnvios(horas, RESPUESTA_NORMAL_MIN);
  } catch {
    // Si no se puede medir, no se inventa una alarma: de eso ya avisa la red de la bandeja.
    return { miro: false, aviso: false };
  }

  const leads = Number(p?.leads || 0);
  // Sin el número de la base (una base de antes), todo lo que escribieron cuenta como sin atender.
  const pendientes = Number(p?.pendientes ?? leads);
  const enviadas = Number(p?.enviadas || 0);
  const fallidas = Number(p?.inciertas || 0) + Number(p?.errores || 0);

  // Mudo: hay mensajes sin atender hace rato, o escribieron varias charlas, y no salió nada. Sin mensajes de leads
  // no hay nada que concluir: puede ser simplemente que nadie escribió.
  const mudo = enviadas === 0 && (pendientes > 0 || leads >= CHARLAS_SIN_NADA);
  // Roto: sale más de lo que falla que de lo que llega. Con pocos envíos no alcanza para afirmarlo.
  const roto = fallidas >= 3 && fallidas > enviadas;
  if (!mudo && !roto) return { miro: true, aviso: false, leads, pendientes, enviadas, fallidas };

  const salud = (await base.leerConfig("envios_salud")) || {};
  const avisado = fecha(salud.avisado_en);
  if (avisado !== null && t.getTime() - avisado < AVISO_CADA_HORAS * 3600000) {
    return { miro: true, aviso: false, callado: true, leads, pendientes, enviadas, fallidas };
  }

  let salio = false;
  try {
    salio = await avisar("DM: lo que escribe el agente no está saliendo", {
      Qué: mudo && pendientes > 0
        ? `te escribieron ${pendientes} ${pendientes === 1 ? "vez" : "veces"} hace más de ${RESPUESTA_NORMAL_MIN} minutos y sigue sin respuesta; en las últimas ${horas} horas no salió ninguna`
        : mudo
        ? `te escribieron ${leads} personas en las últimas ${horas} horas y el agente no le mandó nada a ninguna`
        : `de lo último que mandó, ${fallidas} no llegaron y ${enviadas} sí`,
      Hacé: "mirá la bandeja de Instagram y contestá a mano lo que no pueda esperar",
      Nota: "esto avisa como mucho una vez cada seis horas",
    }, { contestable: false });
  } catch {
    salio = false;
  }
  if (salio) await base.guardarConfig("envios_salud", { ...salud, avisado_en: t.toISOString() });
  return { miro: true, aviso: salio, mudo, roto, leads, pendientes, enviadas, fallidas };
}
