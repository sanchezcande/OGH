import { guardarEvento, hayBase } from "../../lib/db";
import { CON_VERSION } from "../../lib/videoAB";

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

// El formulario de /devs hace lo mismo con ?de=: form_visto_cv-dm, form_visto_bienvenida...
// Hace falta porque el 91% de las visitas al formulario NO pasa por /hola (medido el 15/10:
// 871 form_visto contra 76 hola_dev en 30 dias), asi que hoy no se sabe que puerta trae los
// leads. Se acepta el guion ademas de letras y numeros, para nombres como "cv-comentario".
const CON_ORIGEN_FORM = /^form_visto_[a-z0-9-]{1,24}$/;

// Prueba A/B del video de la página de gracias (12/10/2026): el mismo embudo pero con el sufijo
// de la versión que le tocó a esa persona, para poder partirlo en dos sin tocar la base.
// Acotado igual que el de arriba: solo las fases del video y solo _a o _b. La lista vive en
// lib/videoAB.js porque el sync del CRM tiene que contar exactamente las mismas.

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { fase, sid } = req.body || {};
    if (!FASES.has(fase) && !CON_ORIGEN.test(fase) && !CON_ORIGEN_FORM.test(fase) && !CON_VERSION.test(fase)) return res.status(400).json({ ok: false });
    if (hayBase()) await guardarEvento(fase, String(sid || "").slice(0, 40));
  } catch (e) {
    console.error("evento:", e.message);
  }
  return res.status(200).json({ ok: true });
}
