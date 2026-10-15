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
