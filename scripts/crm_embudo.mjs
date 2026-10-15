/**
 * Las cuentas del embudo de devs para el CRM, aparte de crm_sync.mjs para poder probarlas
 * sin base (tests/crmEmbudo.test.mjs). Reciben los eventos crudos de funnel_eventos
 * ({ fase, sid, creado }) y devuelven lo mismo que antes calculaba el SQL del sync.
 *
 * Desde la prueba A/B del video (12/10/2026) las fases de /devs/gracias llegan con la versión
 * pegada: gracias_vista_a, click_gumroad_b... Acá cuentan como la fase de siempre (si no, el
 * tablero queda en 0 vistas y 0 clicks y nadie figura como que tocó comprar) y además se
 * guardan por versión, para poder medir la prueba.
 */
import { FASES_VIDEO, separarVersion } from "../lib/videoAB.js";

export const VERSIONES = ["a", "b"];

// Columna del tablero → fase del embudo. Las mismas que contaba el SQL de antes.
const COLUMNAS = {
  vieron: "form_visto", enviaron: "enviado", video_pagina: "gracias_vista",
  play: "video_play", terminaron: "video_fin", clicks: "click_gumroad",
};
// Por versión, solo las fases del video: lo de antes del formulario no tiene versión.
const COLUMNAS_VERSION = {
  video_pagina: "gracias_vista", play: "video_play", vio_25: "video_25", vio_50: "video_50",
  vio_75: "video_75", terminaron: "video_fin", clicks: "click_gumroad",
};

/** Las fases que el sync tiene que traer de la base: las del tablero y las del video, con y sin versión. */
export const FASES_A_TRAER = [...new Set([
  ...Object.values(COLUMNAS),
  ...FASES_VIDEO.flatMap((f) => [f, ...VERSIONES.map((v) => `${f}_${v}`)]),
])];

const PARTES_AR = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit",
});
/** "2026-10-12": el día en hora Argentina, armado por partes para no depender del formato del idioma. */
const diaAR = (fecha) => {
  const p = Object.fromEntries(PARTES_AR.formatToParts(new Date(fecha)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
};
const ms = (fecha) => new Date(fecha).getTime();

/** Personas únicas (sid) por columna, en total y por versión. */
function contar(eventos) {
  const sids = new Map();   // "fase" o "fase|a" → Set de sid
  const anotar = (clave, sid) => { if (!sids.has(clave)) sids.set(clave, new Set()); sids.get(clave).add(sid); };
  for (const e of eventos) {
    if (!e.sid) continue;
    const { fase, version } = separarVersion(e.fase);
    anotar(fase, e.sid);
    if (version) anotar(`${fase}|${version}`, e.sid);
  }
  const n = (clave) => (sids.has(clave) ? sids.get(clave).size : 0);
  const porColumna = (columnas, sufijo) =>
    Object.fromEntries(Object.entries(columnas).map(([col, fase]) => [col, n(fase + sufijo)]));
  return {
    ...porColumna(COLUMNAS, ""),
    version: Object.fromEntries(VERSIONES.map((v) => [v, porColumna(COLUMNAS_VERSION, `|${v}`)])),
  };
}

/**
 * Los números del embudo por día (hora Argentina, los últimos `dias` días, el más nuevo primero)
 * y en total. Cada fila trae además `version: { a: {...}, b: {...} }` con las fases del video.
 */
export function contarEmbudo(eventos, { ahora = Date.now(), dias = 21 } = {}) {
  const desde = ahora - dias * 86400000;
  const porDia = new Map();
  for (const e of eventos) {
    if (ms(e.creado) <= desde) continue;
    const dia = diaAR(e.creado);
    if (!porDia.has(dia)) porDia.set(dia, []);
    porDia.get(dia).push(e);
  }
  return {
    dias: [...porDia.keys()].sort().reverse().map((dia) => ({ dia, ...contar(porDia.get(dia)) })),
    total: contar(eventos),
  };
}

// El evento "enviado" cae a los pocos ms de que se guarda la fila en red_devs.
const VENTANA_MS = 5000;

/**
 * Le pone a cada lead `clickeo_comprar` (tocó el botón de compra en la página de gracias) y
 * `video_version` ("a", "b" o null si llegó antes de la prueba). La base no guarda el sid del
 * lead: se lo ata al evento "enviado" más cercano a cuando se guardó su fila.
 */
export function marcarLeads(devs, eventos) {
  const enviados = [];
  const porSid = new Map();   // sid → { clic, version }
  for (const e of [...eventos].sort((x, y) => ms(x.creado) - ms(y.creado))) {
    if (!e.sid) continue;
    const { fase, version } = separarVersion(e.fase);
    const s = porSid.get(e.sid) || { clic: false, version: null };
    if (fase === "enviado") enviados.push({ sid: e.sid, ms: ms(e.creado) });
    if (fase === "click_gumroad") s.clic = true;
    if (version) s.version = version;   // la última que vio, por si borró el navegador y le tocó la otra
    porSid.set(e.sid, s);
  }
  for (const d of devs) {
    let cerca = null;
    for (const e of enviados) {
      const dist = Math.abs(e.ms - ms(d.creado));
      if (dist <= VENTANA_MS && (!cerca || dist < cerca.dist)) cerca = { sid: e.sid, dist };
    }
    const s = cerca && porSid.get(cerca.sid);
    d.clickeo_comprar = Boolean(s && s.clic);
    d.video_version = (s && s.version) || null;
  }
  return devs;
}
