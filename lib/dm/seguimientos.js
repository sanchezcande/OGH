// La vuelta de toques del cron (pages/api/dm/toques.js), aparte para poder probarla sin base.
//
// Reclama toques vencidos de a uno y los pasa por el agente hasta el tope o la hora límite. Si el
// modelo no contesta (la Mac se durmió en el medio, o su Claude falla), no reclama más en esta
// corrida: reclamar le saca el toque a la fila, y con el modelo caído se perderían todos. Los que
// quedan siguen en la fila para la próxima.
/** El modelo falló por algo que le pasa a cualquier charla (general), o no se sabe: se corta. */
const modeloCaido = (r) => r?.hecho === "error del modelo" && r?.general !== false;

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
 * Qué hace el cron con una charla del agente que tiene un mensaje del lead sin atender
 * (base.sinContestar). Lo normal es que el modelo no haya contestado (la Mac sin red o dormida):
 * se reintenta cuando la Mac está, y la respuesta sale tarde por la API. A Cande pasa solo si el
 * agente está apagado, si una respuesta pudo haber salido (no se manda dos veces) o si pasaron
 * `maxMinutos` sin poder contestar. Pedido de Cande, 16/10: "no tiene que pasar más".
 */
export function decidirSinContestar(c, { prendido, macViva, maxMinutos, maxFallos = Infinity }) {
  if (c.quizas_salio) return { que: "pasar", aviso: "No sé si la respuesta salió: mirá la charla antes de contestar", motivo: "envío sin confirmar" };
  if (!prendido) return { que: "pasar", aviso: "escribió y el agente está apagado: la charla vuelve a vos", motivo: "agente apagado" };
  if (Number(c.fallos) >= maxFallos) {
    return { que: "pasar", aviso: `el agente no pudo contestarle tras ${maxFallos} intentos: la charla vuelve a vos`, motivo: "sin respuesta" };
  }
  if (Number(c.minutos) >= maxMinutos) {
    const cuanto = maxMinutos >= 120 ? `${Math.round(maxMinutos / 60)} horas` : maxMinutos >= 60 ? "una hora" : `${maxMinutos} minutos`;
    return { que: "pasar", aviso: `el agente no pudo contestarle en ${cuanto}: la charla vuelve a vos`, motivo: "sin respuesta" };
  }
  return { que: macViva ? "reintentar" : "esperar" };
}

/**
 * La red de seguridad del cron con las charlas sin atender (base.sinContestar): decide cada una,
 * pasa a Cande las que corresponde y reintenta las demás, de a una, hasta el tope o la hora
 * límite. Devuelve cuántas pasó, cuántas reintentó y si el modelo no estaba (cayo): ahí el cron
 * no reclama toques en esa corrida, se perderían.
 */
export async function atenderSinContestar({ filas, prendido, macViva, maxMinutos, maxFallos, pasar, procesar, hasta, tope, ahora, registrar }) {
  let pasadas = 0;
  const cola = [];
  for (const c of filas) {
    const d = decidirSinContestar(c, { prendido, macViva, maxMinutos, maxFallos });
    if (d.que === "pasar") {
      await pasar(c, { aviso: d.aviso, motivo: d.motivo });
      pasadas++;
    } else if (d.que === "reintentar") {
      cola.push(c);
    }
  }
  let cayo = false;
  const reintentos = await correrToques({
    reclamar: async () => cola.shift()?.id ?? null,
    procesar: async (id) => {
      const fila = filas.find((f) => String(f.id) === String(id));
      const r = await procesar(id, Number(fila.ultimo_id_lead));
      if (modeloCaido(r)) cayo = true;
      return r;
    },
    hasta, tope, ahora, registrar,
    // Se corta solo si el modelo no está y se va a arreglar solo: esos turnos siguen abiertos y se
    // reintentan después. Si no se arregla solo (la Mac sin uso), cada reintento pasa su charla a
    // Cande enseguida: se sigue, así le llegan todas en esta corrida y no de a una cada 10 minutos.
    parar: (r) => modeloCaido(r) && r?.transitorio === true,
  });
  return { pasadas, reintentos, cayo };
}
