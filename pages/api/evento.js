import { guardarEvento, hayBase } from "../../lib/db";
import { CON_VERSION } from "../../lib/videoAB";
import { FASES_ORIGEN_FORM } from "../../lib/origenForm";

// Recibe un evento anónimo del embudo de devs (form_visto, paso_2, enviado,
// video_50, click_gumroad...). Dispará-y-olvidate: nunca rompe la página.
const FASES = new Set([
  "form_visto", "paso_2", "paso_3", "enviado",
  "gracias_vista", "video_play", "video_25", "video_50", "video_75", "video_fin",
  "click_gumroad", "click_mp",
  "preguntas_vista", "preguntas_pdf_click", "preguntas_llamada_click",
  // preguntas_email_enviado la manda /preguntas desde el 18/09 y NUNCA estuvo en esta lista:
  // la API le contestaba 400 y el paso más importante del embudo de founders, el de completar
  // el formulario, no se registró nunca. Encontrado el 18/10 por tests/foundersNoSePierden.
  "preguntas_email_enviado",
  // 18/10/2026: /preguntas es ahora también la bajada de "quiero contratar" de /hola, y estas
  // dos fases son las de ESA puerta. Van por lista, que son dos y nada más. Si faltaran,
  // /api/evento contestaría 400 y el dato se perdería en silencio, que es exactamente como
  // se rompió el embudo del video el 12/10.
  "preguntas_vista_hola", "preguntas_llamada_click_hola",
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
// leads. Va por LISTA BLANCA y no por patron de forma, para que la misma puerta no termine
// escrita de cinco maneras; lo que no esta en la lista entra como form_visto_otro. La lista
// vive en lib/origenForm.js porque la pagina y la API tienen que coincidir.

// Prueba A/B del video de la página de gracias (12/10/2026): el mismo embudo pero con el sufijo
// de la versión que le tocó a esa persona, para poder partirlo en dos sin tocar la base.
// Acotado igual que el de arriba: solo las fases del video y solo _a o _b. La lista vive en
// lib/videoAB.js porque el sync del CRM tiene que contar exactamente las mismas.

// El embudo en inglés (/apply y /apply/thankyou, la versión en inglés de /devs) manda las
// mismas fases con sufijo _en. NUNCA estuvieron acá: la API contestaba 400 y se tiraban todas,
// así que ese embudo entero no registró un solo evento desde que existe (verificado el 18/10:
// `SELECT count(*) FROM funnel_eventos WHERE fase LIKE '%\_en'` daba 0). Acotado como los de
// arriba: solo estas nueve fases y solo el sufijo _en.
const CON_IDIOMA = /^(form_visto|enviado|gracias_vista|video_play|video_25|video_50|video_75|video_fin|click_gumroad)_en$/;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { fase, sid } = req.body || {};
    if (!FASES.has(fase) && !CON_ORIGEN.test(fase) && !FASES_ORIGEN_FORM.has(fase)
        && !CON_VERSION.test(fase) && !CON_IDIOMA.test(fase)) return res.status(400).json({ ok: false });
    if (hayBase()) await guardarEvento(fase, String(sid || "").slice(0, 40));
  } catch (e) {
    console.error("evento:", e.message);
  }
  return res.status(200).json({ ok: true });
}
