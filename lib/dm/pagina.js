// Lo que pasa en la página del video, del lado de la charla (22/10/2026).
//
// El agente no veía nada de lo que pasaba después del link del formulario: si la persona vio el video entero, si
// tocó pagar, si pagó. Le preguntaba si había visto el video a quien ya había tocado pagar y le mandaba un toque
// de venta a quien ya había comprado. Cande, 22/10: "corregí estas cosas".
//
// Acá viven los textos que le llegan al agente: las notas de sistema que deja la página en la charla (como la del
// formulario, lib/dm/linkFormulario.js), la línea del país y de la compra que van en el contexto de cada turno, y lo
// que se le pide en un turno inmediato (agendarCaliente en lib/dm/base.js; lo corre el cron de los toques). Ninguno
// es un mensaje para el lead: el agente escribe con su voz siguiendo el prompt.

/** Las notas que deja la página en la charla. Se comparan por texto exacto: no cambiarlas sin migrar las viejas. */
export const NOTA_VIDEO_ENTERO = "Vio el video entero de la página (lo confirma el sitio): no hace falta preguntarle si lo vio.";
export const NOTA_TOCO_PESOS = "Tocó el botón para pagar en pesos con MercadoPago (lo confirma el sitio) y el pago todavía no aparece.";
export const NOTA_TOCO_DOLARES = "Tocó el botón para pagar en dólares (Gumroad) (lo confirma el sitio) y el pago todavía no aparece.";

/** La fase del evento de la página y la nota que deja en la charla. Solo estas tres llegan a la charla. */
export const NOTA_DE_FASE = {
  video_fin: NOTA_VIDEO_ENTERO,
  click_mp: NOTA_TOCO_PESOS,
  click_gumroad: NOTA_TOCO_DOLARES,
};

/** Las fases que piden un turno inmediato sobre el pago si no aparece la compra. */
export const FASES_DE_PAGO = new Set(["click_mp", "click_gumroad"]);

/** En el contexto de cada turno de alguien que ya tiene el programa. */
export const NOTA_COMPRO =
  "Ya tiene el programa: hay una compra o un acceso con el mail de su formulario (lo confirma el sitio). No le vendas ni " +
  "le mandes links de pago; si escribe, ayudalo con lo que pregunte.";

// Los países que se reconocen en "País y ciudad" del formulario, sobre el texto en minúsculas y sin tildes.
const PAISES = [
  ["Argentina", /\bargentin|^ar$|\bcaba\b|\bbuenos aires\b/],
  ["México", /\bmexic|^mx$/], ["Colombia", /\bcolombi|^co$/], ["Chile", /\bchile\b|^cl$/], ["Perú", /\bperu\b|^pe$/],
  ["Uruguay", /\buruguay|^uy$/], ["Paraguay", /\bparaguay|^py$/], ["Bolivia", /\bbolivia/], ["Ecuador", /\becuador/],
  ["Venezuela", /\bvenezuel/], ["España", /\bespana\b|\bspain\b|^es$|\bmadrid\b|\bbarcelona\b/],
  ["Estados Unidos", /\bestados unidos\b|\busa\b|\bunited states\b|^us$/], ["Costa Rica", /\bcosta rica\b/],
  ["Guatemala", /\bguatemal/], ["Honduras", /\bhondur/], ["El Salvador", /\bel salvador\b/], ["Nicaragua", /\bnicaragu/],
  ["Panamá", /\bpanama\b/], ["Cuba", /\bcuba\b/], ["República Dominicana", /\bdominicana\b/], ["Puerto Rico", /\bpuerto rico\b/],
  ["Brasil", /\bbrasil\b|\bbrazil\b/],
];

/**
 * De dónde es, según "País y ciudad" del formulario, para el contexto. Es texto libre de una página pública: no se
 * manda tal cual (podría traer instrucciones para el agente), solo el nombre del país si se reconoce, o nada.
 */
export function notaPais(pais) {
  const p = String(pais || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  const hallado = p && PAISES.find(([, re]) => re.test(p));
  return hallado ? `En el formulario puso que es de ${hallado[0]}.` : null;
}

/**
 * Los turnos inmediatos, de menos a más avanzado: uno más avanzado pisa al que estaba esperando (si tocó pagar, ya no
 * corresponde preguntarle por el formulario). Los minutos se cuentan desde lo que lo disparó.
 */
export const CALIENTES = ["link", "promesa", "formulario", "pago"];
export const MINUTOS_CALIENTE = { link: 90, promesa: 60, formulario: 15, pago: 30 };

/** Lo que se le pide al agente en cada turno inmediato (va como indicación del controlador: lib/dm/agente.js). */
export const INDICACION_CALIENTE = {
  link:
    "Pasó una hora y media desde que le llegó el link del formulario y no lo llenó ni escribió. Mandale el toque corto " +
    "de después del link (freno 17). Si en la charla dijo para cuándo lo iba a llenar, o ya dijo que no, callá.",
  promesa:
    "Dijo que llenaba el formulario ya y pasó una hora sin que lo llene ni escriba. Mandale solo este mensaje, tal " +
    "cual, sin agregarle nada: de unaa, pudiste?",
  formulario:
    "El sitio confirma que llenó el formulario hace unos minutos y después no escribió. Un solo mensaje corto sobre el " +
    "video del final: si lo vio y qué le pareció (si hay una nota de que lo vio entero, directo qué le pareció).",
  pago:
    "El sitio confirma que tocó el botón de pagar hace media hora y el pago no aparece. Un solo mensaje corto sobre el " +
    "pago, el de freno 17 para quien tocó comprar y no pagó; si es de Argentina y tocó pagar en dólares, la pregunta de " +
    "pesos del paso 9.",
};

/**
 * Si el lead promete llenar el formulario ya ("dale, ahí lo lleno", "horita lo lleno", "ahí mismo"), a la hora sale
 * "de unaa, pudiste?" si sigue sin llenarlo ni escribir (24/10, Cande: "poné que a los minutos diga: de unaa,
 * pudiste?", "diría una hora después"). Antes el agente callaba esperando el formulario y el turno del link no salía
 * porque el lead había escrito después: la charla quedaba sin nada. El que lo deja para más adelante (mañana, a la
 * noche, el finde) no entra: a ese lo sigue el toque de siempre.
 */
const PROMETE =
  /\b(?:lo|la)\s+(?:lleno|completo|relleno|termino)\b|\b(?:ya|ahora|ahi|horita|ahorita|enseguida)\s+(?:lo\s+)?(?:lleno|completo|relleno|hago)\b|\b(?:voy a|ya voy a|ahora voy a)\s+(?:llenarlo|completarlo|llenar|completar)\b|\bahi mismo\b|\b(?:lo|la)\s+estoy\s+(?:llenando|completando)\b|\b(?:llenandolo|completandolo)\b/;
const PARA_DESPUES =
  /\b(?:manana|noche|tarde|finde|fin de semana|semanas?|lunes|martes|miercoles|jueves|viernes|sabado|domingo|despues|luego|cuando (?:pueda|llegue|tenga|salga|vuelva))\b/;
export function prometeLlenar(texto) {
  const t = String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ");
  return PROMETE.test(t) && !PARA_DESPUES.test(t);
}
