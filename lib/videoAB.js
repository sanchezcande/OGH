// Prueba A/B del video de /devs/gracias (12/10/2026). Mientras dura, las fases de esa página
// se mandan con el sufijo de la versión que le tocó a la persona: gracias_vista_a,
// click_gumroad_b... Una sola lista para los dos lados: /api/evento acepta solo estas, y el
// sync del CRM (scripts/crm_embudo.mjs) las cuenta como la fase de siempre más su versión.
// Si se suma una fase al video, se suma acá y los dos lados se enteran.
export const FASES_VIDEO = [
  "gracias_vista", "video_play", "video_25", "video_50", "video_75", "video_fin", "click_gumroad", "click_mp",
];

export const CON_VERSION = new RegExp(`^(${FASES_VIDEO.join("|")})_([ab])$`);

/** "click_gumroad_b" → { fase: "click_gumroad", version: "b" }. Cualquier otra fase queda igual, sin versión. */
export function separarVersion(fase) {
  const m = CON_VERSION.exec(fase || "");
  return m ? { fase: m[1], version: m[2] } : { fase, version: null };
}
