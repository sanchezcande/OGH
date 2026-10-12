// Prueba en seco del agente: le pasa un turno al modelo y devuelve lo que haría, con el
// veredicto de los frenos. No guarda nada, no manda nada y no toca ningún contacto.
// Protegido con COLA_SECRET (lo llama el dashboard de Cande).
//
//   { turno: { contexto, historial: [{ quien, texto }], mensajes_del_lead: ["..."] },
//     estado_previo: { quien, ... } }   ← opcional: lo que el modelo informó en el turno anterior
//
// Los frenos se aplican igual que en una charla de verdad: miran todo lo que el lead escribió
// en el historial, y exigen el aviso de que es automático si todavía no figura.
import { mismoSecreto, pedir, secretoDe } from "../../../lib/dm/armado";
import { ajustes, hayBase, prompt, tablas } from "../../../lib/dm/base";
import { avisaQueEsAutomatico, normalizar, revisar } from "../../../lib/dm/frenos";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!mismoSecreto(secretoDe(req), process.env.COLA_SECRET)) return res.status(401).json({ error: "no" });
  if (!hayBase()) return res.status(503).json({ error: "sin base" });
  await tablas();

  const turno = req.body?.turno;
  if (!turno || !Array.isArray(turno.mensajes_del_lead)) return res.status(400).json({ error: "falta turno" });
  const aj = await ajustes();
  const texto = (await prompt()).replaceAll("{LINK_DE_PAGO}", aj.link_de_pago || "(sin cargar)");
  if (!texto) return res.status(409).json({ error: "no hay prompt cargado" });

  const previos = Array.isArray(turno.historial) ? turno.historial : [];
  const inicio = Date.now();
  try {
    const cruda = await pedir({ prompt: texto, turno });
    const salida = normalizar(cruda);
    const freno = revisar(salida, {
      textosDelLead: turno.mensajes_del_lead,
      charlaDelLead: [...previos.filter((m) => m?.quien === "lead").map((m) => m.texto), ...turno.mensajes_del_lead],
      estadoPrevio: req.body.estado_previo || null,
      linkDePago: aj.link_de_pago,
      // En el turno, lo que salió de la cuenta (del agente o de Cande) figura como "cande".
      exigirAviso: aj.aviso_ia !== false && !previos.some((m) => m?.quien === "cande" && avisaQueEsAutomatico(m.texto)),
    });
    return res.status(200).json({ salida, freno, segundos: (Date.now() - inicio) / 1000, uso: cruda._uso || null });
  } catch (e) {
    return res.status(502).json({ error: e.message, segundos: (Date.now() - inicio) / 1000 });
  }
}

export const config = { maxDuration: 300 };
