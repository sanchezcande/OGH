import { guardarEvento, hayBase } from "../../lib/db";

// Recibe un evento anónimo del embudo de devs (form_visto, paso_2, enviado,
// video_50, click_gumroad...). Dispará-y-olvidate: nunca rompe la página.
const FASES = new Set([
  "form_visto", "paso_2", "paso_3", "enviado",
  "gracias_vista", "video_play", "video_25", "video_50", "video_75", "video_fin",
  "click_gumroad",
  "preguntas_vista", "preguntas_pdf_click", "preguntas_llamada_click",
  "hola_vista", "hola_contrata", "hola_dev",
]);

// La bifurcación de /hola puede llevar ?de=ig, ?de=li... y manda la misma fase con
// ese sufijo para poder contar por red sin tocar la base. Se acepta por patrón, no
// por lista, pero acotado: solo esas tres fases y un origen corto de letras/números.
// Sin esto, cualquiera podría escribir basura en funnel_eventos.
const CON_ORIGEN = /^hola_(vista|contrata|dev)_[a-z0-9]{1,16}$/;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { fase, sid } = req.body || {};
    if (!FASES.has(fase) && !CON_ORIGEN.test(fase)) return res.status(400).json({ ok: false });
    if (hayBase()) await guardarEvento(fase, String(sid || "").slice(0, 40));
  } catch (e) {
    console.error("evento:", e.message);
  }
  return res.status(200).json({ ok: true });
}
