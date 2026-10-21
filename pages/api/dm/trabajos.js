// Ventanilla del cerebro local: la Mac de Cande retira acá los turnos que hay que redactar y
// entrega la respuesta. La llama tracker/dm_cerebro.py con el secreto del dashboard (COLA_SECRET).
// Ver lib/dm/cola.js.
//
//   { accion: "tomar", hasta }             → { trabajo: { id, turno, link_de_pago, imagenes, edad } } o { trabajo: null }
//                                            (hasta: hasta cuándo, en ms, la Mac promete seguir preguntando: el fin de
//                                            su ventana del cuarto de hora, o 5 minutos después de su último trabajo.
//                                            El sitio no le crea trabajos fuera de ese rato. Sin hasta, un cerebro de
//                                            antes del 21/10: pregunta siempre y vale lo de antes.
//                                            edad: segundos desde que se armó el turno; la Mac descuenta eso
//                                            del tiempo que tiene antes de que ManyChat retire la respuesta.
//                                            imagenes: los links de las fotos que mandó el lead en ese turno,
//                                            casi siempre vacío; la Mac se las muestra a Claude)
//   { accion: "latido", hasta }            → { ok }: la Mac tiene sus lugares ocupados y no toma nada, pero sigue
//                                            escuchando hasta `hasta`
//   { accion: "resultado", id, salida }    → entrega la salida del modelo (con imagenes_vistas: cuántas de esas
//                                            fotos pudo ver; sin el dato, el agente las da por no vistas)
//   { accion: "resultado", id, error }     → avisa que no pudo: el turno queda en espera (lib/dm/cola.js)
//
// Cuando la Mac pregunta ("tomar") y no hay trabajo, tiene un lugar libre y está escuchando: el sitio arranca de fondo
// una cosa más de la espera (una indicación guardada de Cande o la charla en espera más vieja), el impulso de la
// espera (crearImpulsoDeLaEspera en lib/dm/seguimientos.js, 21/10). Así lo que llegó entre una ventana y la otra sale
// de a dos a la vez mientras la Mac escucha, y no solo lo que entra en el rato del cron de la espera.
import { waitUntil } from "@vercel/functions";
import { agente, colaDe, decirleACande, mismoSecreto, secretoDe } from "../../../lib/dm/armado";
import * as base from "../../../lib/dm/base";
import { MARGEN_MS, entregarTrabajo, escuchaSegun, latido, macEncendida, tomarTrabajo } from "../../../lib/dm/cola";
import { crearIndicacionesPendientes } from "../../../lib/dm/respuestas";
import { ESPERA_EN_PARALELO, crearImpulsoDeLaEspera } from "../../../lib/dm/seguimientos";

const impulsar = crearImpulsoDeLaEspera({
  ajustes: base.ajustes,
  filas: base.sinContestar,
  reclamar: (id) => base.reclamarEspera(id, { tope: ESPERA_EN_PARALELO }),
  soltar: base.soltarEspera,
  procesar: (id, idLead) => agente.procesar(id, idLead, { tarde: true }),
  indicaciones: crearIndicacionesPendientes({ base, agente, decir: decirleACande, macEncendida }),
  registrar: (id, e) => console.error("dm: falló una respuesta del impulso de la espera", colaDe(id), e.message),
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!mismoSecreto(secretoDe(req), process.env.COLA_SECRET)) return res.status(401).json({ error: "no" });
  if (!base.hayBase()) return res.status(503).json({ error: "sin base" });

  const b = req.body || {};
  if (b.accion === "tomar") {
    await latido(b.hasta);
    const trabajo = await tomarTrabajo();
    if (!trabajo) {
      // La Mac escucha si lo que acaba de prometer le da para tomar lo que se arranque (un cerebro de antes, sin
      // "hasta", pregunta siempre: vale como antes).
      const escucha = async () => escuchaSegun({ ms: Date.now(), hasta: b.hasta }, MARGEN_MS.espera);
      waitUntil(
        base.tablas()
          .then(() => impulsar({ escucha }))
          .catch((e) => console.error("dm: falló el impulso de la espera", e.message)),
      );
    }
    return res.status(200).json({ trabajo });
  }
  if (b.accion === "latido") {
    await latido(b.hasta);
    return res.status(200).json({ ok: true });
  }
  if (b.accion === "resultado") {
    const id = Number(b.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "falta id" });
    const resultado = b.salida && typeof b.salida === "object" ? b.salida : { error: String(b.error || "sin detalle").slice(0, 300) };
    return res.status(200).json({ ok: await entregarTrabajo(id, resultado) });
  }
  return res.status(400).json({ error: "accion desconocida" });
}

// El impulso de la espera sigue de fondo después de contestarle a la Mac (una respuesta tarda hasta unos 140 segundos).
export const config = { maxDuration: 300 };
