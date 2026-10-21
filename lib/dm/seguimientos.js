// Lo que hacen los crons del agente con las charlas: la espera (pages/api/dm/espera.js), la red de
// seguridad y los toques (pages/api/dm/toques.js). Aparte, para poder probarlo sin base.
//
// La espera (19/10, Cande: "deberían quedar on hold y cuando prendo la pc las deberías agarrar vos"):
// un mensaje del lead que el agente no pudo contestar (la Mac apagada, dormida o sin su Claude) deja
// la charla del agente, sin aviso y sin pasarla a Cande, por más que pase el tiempo. Cuando la Mac
// vuelve, el cron de la espera la contesta tarde. A Cande pasa solo lo que no tiene arreglo (ver
// decidirSinContestar).

// Si la Mac está para contestar lo dice su latido (lib/dm/cola.js): desde el 21/10 pregunta en una ventana de cada
// cuarto de hora y mientras tiene trabajo, y avisa hasta cuándo (macEscuchando). Los crons lo miran en el momento de
// usarla, no al arrancar la corrida.
/** Una charla con la que el modelo falló tantas veces (fallas propias de esa charla) pasa a Cande. */
export const REINTENTO_MAX_FALLOS = 3;
/**
 * Charlas de la espera que se contestan a la vez. La Mac redacta tres a la vez (EN_PARALELO en
 * tracker/dm_cerebro.py): dos para la espera y uno libre para el que escribe en ese momento.
 */
export const ESPERA_EN_PARALELO = 2;

// Cómo queda anotada una falla del modelo con un mensaje del lead (motivo de la salida, ver agente.js).
// Para el tope de esa charla (base.sinContestar) cuentan las propias, y las dudosas solo si en ese rato
// otras charlas salieron bien (la Mac andaba: era esta charla). Las generales nunca: que la Mac esté
// apagada o sin uso le pasa a cualquier charla y se arregla cuando vuelve. Ver ModeloNoContesto.
export const FALLA_GENERAL = "falla general";
export const FALLA_PROPIA = "falla propia";
export const FALLA_DUDOSA = "falla dudosa";

/**
 * Cuántos minutos espera para el próximo intento una charla con la que el modelo acaba de fallar (una
 * falla propia o dudosa: la Mac contestó, y cada intento le gasta uso). 10 después de la primera, el
 * doble con cada una que sigue, hasta 2 horas. Así una charla que falla siempre no encabeza cada corrida
 * de la espera (las demás salen igual) ni la frena días. Tras una falla general no hay pausa: la Mac no
 * estaba, y cuando vuelve se contesta todo.
 */
export const PAUSA_TRAS_FALLA_MIN = 10;
export const PAUSA_MAX_MIN = 120;
export const pausaTrasFallas = (intentos) => Math.min(PAUSA_MAX_MIN, PAUSA_TRAS_FALLA_MIN * 2 ** Math.max(0, Number(intentos) - 1));

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
async function soltarSinFallar(soltar, id) {
  try {
    await soltar(id);
  } catch {
    // se libera sola a los 6 minutos
  }
}

/**
 * Dice, corrida por corrida, si el modelo está caído y no vale la pena arrancar más: una falla general
 * alcanza (la Mac no retiró el trabajo o se quedó sin uso: las que siguen fallarían igual); una dudosa
 * no, porque puede ser de esa charla, salvo que la anterior también lo haya sido (dos charlas distintas
 * seguidas: es la Mac). Lo que no es una falla del modelo vuelve a empezar la cuenta.
 */
export function vigiaDelModelo() {
  let dudosas = 0;
  return (r) => {
    if (r?.hecho !== "error del modelo" || r?.general === false) {
      dudosas = 0;
      return false;
    }
    if (r.dudosa !== true) return true;
    return ++dudosas >= 2;
  };
}

/**
 * La vuelta de toques: reclama toques vencidos de a uno y los pasa por el agente hasta el tope o la
 * hora límite. Si el modelo está caído (la Mac se durmió en el medio, o su Claude falla: vigiaDelModelo),
 * no reclama más en esta corrida: reclamar le saca el toque a la fila, y con el modelo caído se
 * perderían todos. Los que quedan siguen en la fila para la próxima.
 * `seguir` se mira justo antes de reclamar cada uno: si la Mac ya no va a estar escuchando cuando el toque llegue a
 * pedir (se cerró su ventana mientras el cron hacía lo de antes), no se reclama ninguno más y quedan para otra vuelta.
 */
export async function correrToques({
  reclamar, procesar, hasta, tope, ahora = () => Date.now(), registrar = () => {}, parar = vigiaDelModelo(), seguir = async () => true,
}) {
  let hechos = 0;
  for (let n = 0; n < tope && ahora() < hasta; n++) {
    if (!(await seguir())) break;
    const id = await reclamar();
    if (!id) break;
    try {
      const r = await procesar(id);
      hechos++;
      // Si el modelo no está (la Mac sin red o sin uso), los que siguen fallarían igual y se
      // perderían. Si la falla fue de esta charla (el modelo se negó), las otras sí pueden salir.
      // Si no se sabe (dudosa), se sigue con la próxima y se corta si esa también falla.
      if (parar(r)) break;
    } catch (e) {
      registrar(id, e);
    }
  }
  return hechos;
}

/**
 * Qué se hace con una charla del agente que tiene un mensaje del lead sin atender (base.sinContestar).
 * Lo normal es que el modelo no haya podido contestar (la Mac apagada o sin red): queda en espera y se
 * reintenta cuando la Mac está, por más horas que pasen. A Cande pasa solo si el agente está apagado,
 * si una respuesta pudo haber salido (no se manda dos veces) o si el modelo falló `maxFallos` veces con
 * esta charla en particular (se negó, contestó algo que no se puede leer, o no pudo mientras con las
 * demás andaba). Las fallas de la Mac no cuentan: son de todas las charlas (19/10: los "no pudo
 * contestarle en una hora" le explotaban el teléfono cada vez que apagaba la compu).
 * Una charla con la que el modelo acaba de fallar espera su pausa (pausaTrasFallas) antes de reintentarse.
 */
export function decidirSinContestar(c, { prendido, macViva, maxFallos = REINTENTO_MAX_FALLOS }) {
  if (c.quizas_salio) return { que: "pasar", aviso: "No sé si la respuesta salió: mirá la charla antes de contestar", motivo: "envío sin confirmar" };
  if (!prendido) return { que: "pasar", aviso: "escribió y el agente está apagado: la charla vuelve a vos", motivo: "agente apagado" };
  if (Number(c.fallos) >= maxFallos) {
    return {
      que: "pasar",
      aviso: `el modelo falló ${maxFallos} veces con esta charla (se negó, contestó algo que no se puede leer o no pudo mientras con las demás andaba): la charla vuelve a vos`,
      motivo: "el modelo no pudo con esta charla",
    };
  }
  if (!macViva) return { que: "esperar" };
  const desdeLaFalla = c.minutos_desde_la_falla == null ? null : Number(c.minutos_desde_la_falla);
  if (desdeLaFalla !== null && desdeLaFalla < pausaTrasFallas(c.intentos || 1)) return { que: "esperar" };
  return { que: "reintentar" };
}

/**
 * La red de seguridad del cron de los toques: de las charlas sin atender, pasa a Cande las que no
 * tienen arreglo (decidirSinContestar). Cada una se aparta antes (base.reclamarEspera): si justo la está
 * contestando el cron de la espera, se decide en la vuelta siguiente. Devuelve cuántas pasó.
 */
export async function pasarSinContestar({ filas, prendido, macViva, maxFallos, apartar, soltar, pasar }) {
  let pasadas = 0;
  for (const c of filas) {
    const d = decidirSinContestar(c, { prendido, macViva, maxFallos });
    if (d.que !== "pasar") continue;
    if (!(await apartar(c.id))) continue;
    try {
      await pasar(c, { aviso: d.aviso, motivo: d.motivo });
      pasadas++;
    } finally {
      await soltarSinFallar(soltar, c.id);
    }
  }
  return pasadas;
}

/** Hay charlas esperando que el agente las conteste ya (la Mac está): primero eso, después los toques. */
export const hayEspera = (filas, ops) => filas.some((c) => decidirSinContestar(c, ops).que === "reintentar");

/**
 * Vacía la espera: contesta tarde las charlas sin atender, de la más vieja a la más nueva (filas viene
 * así de base.sinContestar), `enParalelo` a la vez y apenas termina una arranca la siguiente, hasta la
 * hora límite. Cada charla se aparta antes (reclamar, que dice { tomada, lleno }): otra corrida que anda
 * a la vez no la toma, y entre todas las corridas no hay más de `enParalelo` contestándose (lleno: los
 * lugares de la Mac están ocupados, se vuelve a probar en `pausaMs`). Si el modelo está caído (la Mac se
 * fue o se quedó sin uso, o fallaron dos charlas seguidas: vigiaDelModelo), no arranca ninguna más:
 * fallarían igual. Una charla que falla sola no frena a las demás: queda en su pausa y siguen las otras.
 * Devuelve cuántas intentó y si el modelo no estaba (cayo).
 */
export async function vaciarEspera({
  filas, prendido, macViva, maxFallos, reclamar, soltar, procesar, hasta,
  enParalelo = ESPERA_EN_PARALELO, ahora = () => Date.now(), esperar = dormir, pausaMs = 5000, registrar = () => {},
}) {
  const cola = filas.filter((c) => decidirSinContestar(c, { prendido, macViva, maxFallos }).que === "reintentar");
  const caido = vigiaDelModelo();
  let reintentos = 0;
  let cayo = false;
  // Se toma de a una por vez: así la que arranca es siempre la más vieja que falta. Devuelve la charla
  // apartada, "lleno" si la Mac tiene sus lugares ocupados, o null si no queda nada para esta corrida.
  let turno = Promise.resolve();
  const siguiente = () => {
    const p = turno.then(async () => {
      while (!cayo && cola.length && ahora() < hasta) {
        const c = cola.shift();
        const r = await reclamar(c.id);
        if (r.tomada) return c;
        if (r.lleno) {
          cola.unshift(c); // sigue siendo la próxima
          return "lleno";
        }
        // si no, la tiene otra corrida o ya no espera nada
      }
      return null;
    });
    turno = p.catch(() => {});
    return p;
  };
  const trabajar = async () => {
    for (;;) {
      const c = await siguiente();
      if (!c) return;
      if (c === "lleno") {
        await esperar(pausaMs);
        continue;
      }
      try {
        const hecho = await procesar(c.id, Number(c.ultimo_id_lead));
        reintentos++;
        if (caido(hecho)) cayo = true;
      } catch (e) {
        registrar(c.id, e);
      } finally {
        await soltarSinFallar(soltar, c.id);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, enParalelo) }, trabajar));
  return { reintentos, cayo };
}
