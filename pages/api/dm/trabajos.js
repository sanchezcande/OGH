// Ventanilla del cerebro local: la Mac de Cande retira acá los turnos que hay que redactar y
// entrega la respuesta. La llama tracker/dm_cerebro.py con el secreto del dashboard (COLA_SECRET).
// Ver lib/dm/cola.js.
//
//   { accion: "tomar" }                    → { trabajo: { id, turno, link_de_pago, edad } } o { trabajo: null }
//                                            (edad: segundos desde que se armó el turno; la Mac descuenta eso
//                                            del tiempo que tiene antes de que ManyChat retire la respuesta)
//   { accion: "resultado", id, salida }    → entrega la salida del modelo
//   { accion: "resultado", id, error }     → avisa que no pudo: la charla pasa a ser de Cande
import { mismoSecreto, secretoDe } from "../../../lib/dm/armado";
import { hayBase } from "../../../lib/dm/base";
import { entregarTrabajo, latido, tomarTrabajo } from "../../../lib/dm/cola";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!mismoSecreto(secretoDe(req), process.env.COLA_SECRET)) return res.status(401).json({ error: "no" });
  if (!hayBase()) return res.status(503).json({ error: "sin base" });

  const b = req.body || {};
  if (b.accion === "tomar") {
    await latido();
    return res.status(200).json({ trabajo: await tomarTrabajo() });
  }
  if (b.accion === "resultado") {
    const id = Number(b.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "falta id" });
    const resultado = b.salida && typeof b.salida === "object" ? b.salida : { error: String(b.error || "sin detalle").slice(0, 300) };
    return res.status(200).json({ ok: await entregarTrabajo(id, resultado) });
  }
  return res.status(400).json({ error: "accion desconocida" });
}
