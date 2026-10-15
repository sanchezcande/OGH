// La vuelta de toques del cron (pages/api/dm/toques.js), aparte para poder probarla sin base.
//
// Reclama toques vencidos de a uno y los pasa por el agente hasta el tope o la hora límite. Si el
// modelo no contesta (la Mac se durmió en el medio, o su Claude falla), no reclama más en esta
// corrida: reclamar le saca el toque a la fila, y con el modelo caído se perderían todos. Los que
// quedan siguen en la fila para la próxima.
export async function correrToques({ reclamar, procesar, hasta, tope, ahora = () => Date.now(), registrar = () => {} }) {
  let hechos = 0;
  for (let n = 0; n < tope && ahora() < hasta; n++) {
    const id = await reclamar();
    if (!id) break;
    try {
      const r = await procesar(id);
      hechos++;
      if (r?.hecho === "error del modelo") break;
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
export function decidirSinContestar(c, { prendido, macViva, maxMinutos }) {
  if (c.quizas_salio) return { que: "pasar", aviso: "No sé si la respuesta salió: mirá la charla antes de contestar", motivo: "envío sin confirmar" };
  if (!prendido) return { que: "pasar", aviso: "escribió y el agente está apagado: la charla vuelve a vos", motivo: "agente apagado" };
  if (Number(c.minutos) >= maxMinutos) {
    return { que: "pasar", aviso: `el agente no pudo contestarle en ${Math.round(maxMinutos / 60)} horas: la charla vuelve a vos`, motivo: "sin respuesta" };
  }
  return { que: macViva ? "reintentar" : "esperar" };
}
