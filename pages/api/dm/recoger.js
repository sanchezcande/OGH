// Retiro de la respuesta, para el modo de envío "campo".
//
// Si mandar por la API de ManyChat no anda en Instagram, el flujo de ManyChat espera unos
// segundos después de /api/dm/entrada, llama acá y guarda m1, m2 y m3 en campos del contacto
// para mandarlos él. Devuelve los tres siempre (vacíos si no hay nada) para que el mapeo de
// la respuesta en ManyChat no falle.
//
// Si la respuesta todavía se está generando, la espera antes de contestar vacío: sin eso, la
// que llega tarde saldría recién en el turno siguiente. Contesta como mucho a los 6 segundos
// de haber entrado el pedido (ManyChat corta a los 10), contando lo que tarda la base en un
// arranque en frío: si ManyChat cortara, la respuesta figuraría como enviada sin haber salido.
// Lo que nadie retira en 3 minutos se vence y el cron le avisa a Cande.
// Este camino no se pudo probar sin ManyChat: se confirma en la primera prueba real.
import { secretoDmValido } from "../../../lib/dm/armado";
import { ajustes, anotar, contacto, hayBase, retirarSalida, tablas } from "../../../lib/dm/base";

const NADA = { hay: "no", m1: "", m2: "", m3: "", accion: "" };
const ESPERA_MS = 6000;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req, res) {
  const inicio = Date.now();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!(await secretoDmValido(req))) return res.status(401).json({ error: "no" });
  if (!hayBase()) return res.status(200).json(NADA);

  const id = String(req.body?.contacto ?? req.body?.subscriber_id ?? "").trim();
  if (!id) return res.status(400).json({ error: "falta contacto" });

  await tablas();
  // Apagado o en sombra no sale nada, tampoco lo que había quedado listo antes de apagar.
  if ((await ajustes()).modo !== "auto") return res.status(200).json(NADA);
  const c = await contacto(id);
  if (!c) return res.status(200).json(NADA);

  // Solo se espera por una charla del agente. Si Cande la tomó, lo pendiente ya se descartó;
  // si el agente se la pasó, queda su última pregunta para retirar y no hay nada más en camino.
  // No arranca otra vuelta si con el segundo de espera se pasa del límite.
  const limite = inicio + (c.dueno === "agente" ? ESPERA_MS : 0);
  let s = await retirarSalida(id);
  while (!s && Date.now() + 1000 <= limite) {
    await dormir(1000);
    s = await retirarSalida(id);
  }
  if (!s || !s.mensajes?.length) return res.status(200).json(NADA);

  // Recién acá quedan anotados como mandados (y el turno, cerrado): el agente no lo hace cuando los deja listos.
  for (const m of s.mensajes) await anotar(id, "agente", m);
  const [m1 = "", m2 = "", m3 = ""] = s.mensajes;
  return res.status(200).json({ hay: "si", m1, m2, m3, accion: s.accion });
}

export const config = { maxDuration: 30 };
