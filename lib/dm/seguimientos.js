// Lo que hacen los crons del agente con las charlas: la espera (pages/api/dm/espera.js), la red de
// seguridad y los toques (pages/api/dm/toques.js). Aparte, para poder probarlo sin base.
//
// La espera (19/10, Cande: "deberían quedar on hold y cuando prendo la pc las deberías agarrar vos"):
// un mensaje del lead que el agente no pudo contestar (la Mac apagada, dormida o sin su Claude) deja
// la charla del agente, sin aviso y sin pasarla a Cande, por más que pase el tiempo. Cuando la Mac
// vuelve, el cron de la espera la contesta tarde. A Cande pasa solo lo que no tiene arreglo (ver
// decidirSinContestar).

/** La Mac pregunta cada pocos segundos y el latido se guarda una vez por minuto. */
export const MAC_VIVA_SEGUNDOS = 180;
/** Una charla con la que el modelo falló tantas veces (fallas propias de esa charla) pasa a Cande. */
export const REINTENTO_MAX_FALLOS = 3;
/**
 * Charlas de la espera que se contestan a la vez. La Mac redacta tres a la vez (EN_PARALELO en
 * tracker/dm_cerebro.py): dos para la espera y uno libre para el que escribe en ese momento.
 */
export const ESPERA_EN_PARALELO = 2;

// Cómo queda anotada una falla del modelo con un mensaje del lead (motivo de la salida, ver agente.js).
// Solo las propias cuentan para el tope de esa charla (base.sinContestar): que la Mac esté apagada o
// sin uso le pasa a cualquier charla y se arregla cuando vuelve.
export const FALLA_GENERAL = "falla general";
export const FALLA_PROPIA = "falla propia";

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
async function soltarSinFallar(soltar, id) {
  try {
    await soltar(id);
  } catch {
    // se libera sola a los 6 minutos
  }
}

/** El modelo falló por algo que le pasa a cualquier charla (general), o no se sabe: se corta. */
const modeloCaido = (r) => r?.hecho === "error del modelo" && r?.general !== false;

/**
 * La vuelta de toques: reclama toques vencidos de a uno y los pasa por el agente hasta el tope o la
 * hora límite. Si el modelo no contesta (la Mac se durmió en el medio, o su Claude falla), no reclama
 * más en esta corrida: reclamar le saca el toque a la fila, y con el modelo caído se perderían todos.
 * Los que quedan siguen en la fila para la próxima.
 */
export async function correrToques({ reclamar, procesar, hasta, tope, ahora = () => Date.now(), registrar = () => {}, parar = modeloCaido }) {
  let hechos = 0;
  for (let n = 0; n < tope && ahora() < hasta; n++) {
    const id = await reclamar();
    if (!id) break;
    try {
      const r = await procesar(id);
      hechos++;
      // Si el modelo no está (la Mac sin red o sin uso), los que siguen fallarían igual y se
      // perderían. Si la falla fue de esta charla (el modelo se negó), las otras sí pueden salir.
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
 * esta charla en particular (se negó, devolvió algo que no se puede leer). Las fallas de la Mac no
 * cuentan: son de todas las charlas (19/10: los "no pudo contestarle en una hora" le explotaban el
 * teléfono cada vez que apagaba la compu).
 */
export function decidirSinContestar(c, { prendido, macViva, maxFallos = REINTENTO_MAX_FALLOS }) {
  if (c.quizas_salio) return { que: "pasar", aviso: "No sé si la respuesta salió: mirá la charla antes de contestar", motivo: "envío sin confirmar" };
  if (!prendido) return { que: "pasar", aviso: "escribió y el agente está apagado: la charla vuelve a vos", motivo: "agente apagado" };
  if (Number(c.fallos) >= maxFallos) {
    return {
      que: "pasar", aviso: `el modelo falló ${maxFallos} veces con esta charla (se negó o contestó algo que no se puede leer): la charla vuelve a vos`,
      motivo: "el modelo no pudo con esta charla",
    };
  }
  return { que: macViva ? "reintentar" : "esperar" };
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
 * lugares de la Mac están ocupados, se vuelve a probar en `pausaMs`). Si el modelo falla por algo
 * general (la Mac se fue, o se quedó sin uso), no arranca ninguna más: fallarían igual.
 * Devuelve cuántas intentó y si el modelo no estaba (cayo).
 */
export async function vaciarEspera({
  filas, prendido, macViva, maxFallos, reclamar, soltar, procesar, hasta,
  enParalelo = ESPERA_EN_PARALELO, ahora = () => Date.now(), esperar = dormir, pausaMs = 5000, registrar = () => {},
}) {
  const cola = filas.filter((c) => decidirSinContestar(c, { prendido, macViva, maxFallos }).que === "reintentar");
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
        if (modeloCaido(hecho)) cayo = true;
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
