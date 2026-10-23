// Por qué puerta entró la persona al formulario de /devs (15/10/2026).
//
// Lista blanca a propósito, no un patrón de forma. Con `[a-z0-9-]{1,24}` cualquier cosa entra
// y en tres semanas funnel_eventos tiene la misma puerta escrita de cinco maneras (cv-dm, cvdm,
// CV_DM...) y no se puede agrupar nada. Las puertas reales son pocas y las conocemos.
//
// Lo que no está en la lista NO se pierde: se guarda como `otro`. Así, si aparece una puerta
// nueva, nos enteramos de que existe aunque todavía no sepamos cuál es.
//
// Para sumar una puerta: se agrega acá y se despliega ANTES de ponerle el ?de= al link.
export const ORIGENES = [
  "cv-comentario",   // comentó CV en un post y ManyChat le mandó el link
  "cv-dm",           // mandó CV por privado
  "dev-comentario",  // comentó DEV
  "bienvenida",      // el DM automático a seguidores nuevos
  "dm",              // se lo pasó Cande a mano por privado
  "bio",             // el link de la bio, sin pasar por /hola
];

export const OTRO = "otro";

/** "CV-DM " → "cv-dm". Lo que no está en la lista cae en "otro". Vacío o basura → null. */
export function normalizarOrigen(de) {
  const limpio = String(de || "").trim().toLowerCase();
  if (!limpio) return null;
  return ORIGENES.includes(limpio) ? limpio : OTRO;
}

/** Las fases que la API tiene que aceptar. */
export const FASES_ORIGEN_FORM = new Set([...ORIGENES, OTRO].map((o) => `form_visto_${o}`));

// Por qué no hay un ?de= por cada post de LinkedIn (24/10/2026): se probó y Cande lo frenó, porque
// un link con cosas raras le da desconfianza a un dev, que es justo a quien le habla. No hace falta:
// LinkedIn da los clics al link POR PUBLICACIÓN en la página de análisis de cada post, y eso dice
// cuánta gente mandó cada uno al formulario sin ensuciar el link. Lo trae
// .factory/RUTINA-LINKEDIN-METRICAS.md dos veces por semana.
