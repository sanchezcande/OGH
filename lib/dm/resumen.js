// El resumen de las notas del agente de DM (20/10, Cande: "la mayoría de los mensajes que me pasás por telegram son
// re resolvibles por vos, no entiendo por qué me los pasás").
//
// Lo que el agente quiere que Cande sepa pero no necesita nada de ella ya (un aviso_para_cande que no arranca con
// "HOY:" ni "YA:" (esUrgente, abajo), con "NOTA:" o sin nada: lo que no supo contestar, lo que le ofrecen, quien ya
// compró, lo que marcó el repaso de la Mac) no suena en el momento. Le llega junto, dos veces por día (las 9 y las 18
// de Bali) y sin sonido, con un número por charla, su nota más nueva entera (y cuántas hubo antes), cuánto queda para
// escribirle por acá y el link a la charla en Instagram. Respondiendo el resumen con "2: lo que quiere que le diga",
// el agente se lo escribe a esa charla (lib/dm/respuestas.js).
// Con sonido siguen llegando solo los "HOY:" (la charla pasa a ella) y los "YA:" (riesgo para la persona o un pago).
//
// Lo manda el cron de los toques (pages/api/dm/toques.js), que corre cada 10 minutos: la primera vuelta después de
// cada hora se lo queda (base.reclamarResumen, una sola vez aunque corran dos a la vez). Si Telegram no lo deja
// salir, lo intenta la vuelta siguiente con las mismas notas. Ninguna nota se pierde: si no entran en un mensaje van
// en varios, con la numeración seguida, y lo que no llegó a salir vuelve en el resumen siguiente (el corte se queda
// antes de su primera nota).
//
// No es el resumen de la red de la bandeja (lib/dm/bandeja.js, "DM: charlas que esperan respuesta tuya"), y van
// separados a propósito: aquel trae lo que tiene que contestar ella misma desde Instagram (charlas suyas sin respuesta,
// las de más de 23 horas), suena, sale cada 3 horas como mucho y solo si hay algo nuevo; este trae lo que el agente
// sigue llevando, no suena y se contesta por número. Juntarlos haría esperar hasta 15 horas a quien ya espera a Cande
// (y alguno pasaría las 24 horas de Instagram) o haría sonar las notas. Casi no repiten charlas: una del agente donde
// calló con su nota no va al de la bandeja (ya decidió qué hacer); va en los dos solo si además su respuesta figura
// enviada y no le llegó por Instagram.
import { linkCharlaIg, usuarioParaAviso } from "./instagram";
import { TITULO_RESUMEN } from "./respuestas";

const HORA = 3600000;
const BALI = 8; // Cande vive en Bali (UTC+8)
/** Las horas del resumen, en UTC: las 9 y las 18 de Bali. */
export const HORAS_UTC = [1, 10];
/** Largo de cada mensaje del resumen (Telegram corta a los 4.096 caracteres) y cuántos mensajes como mucho. */
export const TOPE_TEXTO = 3300;
export const TOPE_PARTES = 10;
/**
 * La nota más nueva de cada charla va entera: el aviso del modelo llega hasta 600 caracteres (frenos.normalizar) y la
 * del repaso hasta 500. Recortarla le escondía justo lo último que pasó (20/10, revisión del PR).
 */
export const TOPE_NOTA = 600;
/** Cuántos resúmenes se guardan para contestarlos por número: los de las últimas 72 horas, y siempre los últimos 6. */
export const GUARDAR_RESUMENES = 6;
const GUARDAR_HORAS = 72;
/** Cuántas notas trae la consulta como mucho (base.notasParaResumen). */
export const TOPE_FILAS = 300;
/** La ventana de Instagram para escribirle por acá, como la del agente (frenos.ventanaAbierta). */
const VENTANA_HORAS = 23.5;

/** La última hora de resumen que ya llegó (hoy o ayer), como fecha. */
export function franjaDeResumen(ahora) {
  const t = new Date(ahora).getTime();
  const d = new Date(t);
  const hoy = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const pasadas = [-1, 0].flatMap((dia) => HORAS_UTC.map((h) => hoy + dia * 24 * HORA + h * HORA)).filter((x) => x <= t);
  return new Date(Math.max(...pasadas));
}

/** "20/10 18 h", en hora de Bali: va en el título del resumen y es la clave de su lista de números. */
export function etiquetaDe(franja) {
  const b = new Date(new Date(franja).getTime() + BALI * HORA);
  return `${String(b.getUTCDate()).padStart(2, "0")}/${String(b.getUTCMonth() + 1).padStart(2, "0")} ${b.getUTCHours()} h`;
}

/**
 * Qué aviso suena al toque: el que empieza por "HOY:" o por "YA:", en mayúsculas o no y con espacios o no. Es la misma
 * definición para el agente (lo que manda en el momento, lib/dm/agente.js) y para el resumen (lo que deja afuera,
 * base.notasParaResumen): así un aviso no puede quedar sin sonar y fuera del resumen a la vez. URGENTE se escribe
 * para que valga igual como RegExp de JavaScript (con "i") y en Postgres (~*).
 */
export const URGENTE = "^\\s*(HOY|YA)\\s*:";
const URGENTE_RE = new RegExp(URGENTE, "i");
export const esUrgente = (aviso) => URGENTE_RE.test(String(aviso || ""));

const sinPrefijo = (aviso) => String(aviso || "").replace(/^\s*nota\s*[:.-]\s*/i, "").replace(/\s+/g, " ").trim();
const recorte = (s, n) => (Array.from(s).length > n ? `${Array.from(s).slice(0, n).join("")}…` : s);

/**
 * Las notas agrupadas por charla, en el orden en que llegaron: [{ contacto, nombre, ig_usuario, ultimo_lead, notas,
 * primera }]. `primera` es cuándo se guardó su primera nota (si la charla no llega a salir, el corte se queda antes).
 * Una nota repetida en la misma charla va una vez, en el lugar de la última vez que llegó: la más nueva es la última.
 */
export function agrupar(filas) {
  const charlas = new Map();
  for (const f of filas || []) {
    const id = String(f.contacto);
    if (!charlas.has(id)) {
      charlas.set(id, { contacto: id, nombre: f.nombre, ig_usuario: f.ig_usuario, ultimo_lead: f.ultimo_lead, notas: [], primera: f.creado ?? null });
    }
    const c = charlas.get(id);
    const nota = sinPrefijo(f.aviso);
    if (nota) c.notas = [...c.notas.filter((x) => x !== nota), nota];
    if (f.ultimo_lead) c.ultimo_lead = f.ultimo_lead;
  }
  return [...charlas.values()].filter((c) => c.notas.length);
}

/** Cuánto queda para escribirle por acá, dicho para ella. */
export function ventanaDe(ultimoLead, ahora) {
  if (!ultimoLead) return "sin ventana: escribile desde la app";
  const quedan = VENTANA_HORAS - (new Date(ahora).getTime() - new Date(ultimoLead).getTime()) / HORA;
  if (quedan <= 0) return "pasó el día: escribile desde la app";
  return quedan < 1 ? "queda menos de 1 h para escribirle por acá" : `quedan ${Math.floor(quedan)} h para escribirle por acá`;
}

/**
 * El renglón de una charla: su nota más nueva entera (hasta TOPE_NOTA) y cuántas hubo antes. Las de antes no van: en
 * un renglón no entran todas sin cortar la nueva, y la que importa es la última (20/10, revisión del PR: 21 de 82
 * charlas del día tenían 2 notas o más).
 */
export function notaDelRenglon(notas) {
  const nueva = recorte(String(notas.at(-1) || ""), TOPE_NOTA);
  const antes = notas.length - 1;
  return antes > 0 ? `${nueva} (+${antes} ${antes === 1 ? "nota" : "notas"} antes)` : nueva;
}

/**
 * Los mensajes del resumen: { partes: [{ renglones, numeros }], afuera }. Cada charla tiene su número, seguido de un
 * mensaje al otro, y cada mensaje entra en TOPE_TEXTO: lo que no entra va en el mensaje siguiente, nunca recortado;
 * como mucho TOPE_PARTES mensajes. `afuera` son las charlas que no entraron en ninguno (vuelven en el resumen
 * siguiente). `links`: el link a la charla en Instagram de cada contacto que se pudo saber.
 */
export function armarPartes(charlas, { ahora, links = {} }) {
  const partes = [];
  let parte = null;
  let largo = 0;
  let n = 0;
  for (const c of charlas) {
    const nombre = recorte(String(c.nombre || "sin nombre").replace(/\s+/g, " "), 40);
    const link = links[c.contacto] ? ` ${links[c.contacto]}` : "";
    const renglon = `${n + 1}. ${nombre}: ${notaDelRenglon(c.notas)} (${ventanaDe(c.ultimo_lead, ahora)})${link}`;
    if (!parte || largo + renglon.length > TOPE_TEXTO) {
      if (partes.length >= TOPE_PARTES) break;
      parte = { renglones: [], numeros: {} };
      partes.push(parte);
      largo = 0;
    }
    n++;
    parte.renglones.push(renglon);
    parte.numeros[String(n)] = c.contacto;
    largo += renglon.length + 1;
  }
  return { partes, afuera: charlas.length - n };
}

/**
 * La lista de resúmenes guardada con uno nuevo ({ etiqueta, en, mapa }: `en` es la hora de su franja en ISO), en el
 * orden de las franjas: quedan los de las últimas GUARDAR_HORAS y, como mínimo, los últimos GUARDAR_RESUMENES. Es una
 * lista y no un objeto por etiqueta: jsonb no guarda el orden de las claves, y al recortar por orden se borraba el
 * resumen de las 9 al guardar el de las 18 (20/10, revisión del PR). Lo que no tiene esa forma (una lista vieja) no
 * queda.
 */
export function conResumen(previas, nuevo) {
  const validas = (Array.isArray(previas) ? previas : [])
    .filter((x) => x && typeof x.etiqueta === "string" && Number.isFinite(Date.parse(x.en)) && x.mapa && typeof x.mapa === "object")
    .filter((x) => x.etiqueta !== nuevo.etiqueta);
  const todas = [...validas, nuevo].sort((a, b) => Date.parse(a.en) - Date.parse(b.en));
  const desde = Date.parse(nuevo.en) - GUARDAR_HORAS * HORA;
  return todas.filter((x, i) => i >= todas.length - GUARDAR_RESUMENES || Date.parse(x.en) >= desde);
}

/**
 * El contacto del número `numero` en el resumen con esa etiqueta (el que Cande respondió), o null. Si esa etiqueta no
 * está guardada, null: buscarlo en otro resumen le escribiría a otra persona (cada resumen numera de nuevo).
 */
export function numeroEn(lista, etiqueta, numero) {
  const deEse = (Array.isArray(lista) ? lista : []).filter((x) => x?.etiqueta === etiqueta);
  const id = deEse.at(-1)?.mapa?.[String(numero)];
  return id ? String(id) : null;
}

/**
 * Hasta dónde llega este resumen: si salieron todas, hasta `ahora` (o hasta la última nota leída, si la consulta llegó
 * a su tope); si alguna charla no salió, justo antes de su primera nota, así vuelve en el siguiente (alguna que ya
 * salió puede repetirse: mejor eso que perder una).
 */
export function corteDe({ ahora, quedaron = [], ultimaLeida = null }) {
  const primeras = quedaron.map((c) => new Date(c.primera).getTime()).filter(Number.isFinite);
  if (primeras.length) return new Date(Math.min(...primeras) - 1);
  return ultimaLeida ? new Date(ultimaLeida) : new Date(ahora);
}

/**
 * Arma el que manda el resumen. Las dependencias entran por parámetro para probarlo con dobles. `avisar` es el aviso
 * del agente (armado.avisarDm), que acepta { contestable, silencioso }.
 */
export function crearResumen({ base, manychat = null, avisar, reloj = () => new Date() }) {
  /**
   * Si ya es hora y nadie lo mandó, manda el resumen de las notas desde el anterior. Pasada la hora `hasta`, los
   * links salen solo si el usuario de Instagram ya estaba guardado (preguntarle a ManyChat tarda).
   * Devuelve { hecho, charlas }.
   */
  return async function mandarResumen({ hasta = Infinity, ahoraMs = () => Date.now() } = {}) {
    const ahora = reloj();
    const franja = franjaDeResumen(ahora);
    const reclamo = await base.reclamarResumen(franja.toISOString());
    if (!reclamo) return { hecho: "no toca", charlas: 0 };
    // Desde el corte del anterior; el primero de todos, desde la franja de antes.
    const desde = reclamo.desde ? new Date(reclamo.desde) : franjaDeResumen(new Date(franja.getTime() - 1));
    let salio = false;
    let cerrado = false;
    try {
      const filas = await base.notasParaResumen(desde, ahora);
      // La consulta tiene tope: si llegó, lo que vino después de la última nota leída va en el siguiente.
      const ultimaLeida = filas.length >= TOPE_FILAS ? filas.at(-1)?.creado ?? null : null;
      const charlas = agrupar(filas);
      if (!charlas.length) {
        await base.cerrarResumen(franja.toISOString(), corteDe({ ahora, ultimaLeida }), null);
        cerrado = true;
        return { hecho: "sin notas", charlas: 0 };
      }
      const links = {};
      for (const c of charlas) {
        const usuario = ahoraMs() < hasta ? await usuarioParaAviso({ id: c.contacto, ig_usuario: c.ig_usuario }, { base, manychat }) : c.ig_usuario || null;
        const link = linkCharlaIg(usuario);
        if (link) links[c.contacto] = link;
      }
      const { partes } = armarPartes(charlas, { ahora, links });
      const etiqueta = etiquetaDe(franja);
      const mapa = {};
      for (const [i, parte] of partes.entries()) {
        const titulo = `${TITULO_RESUMEN} · ${etiqueta}${partes.length > 1 ? ` (${i + 1}/${partes.length})` : ""}`;
        const ok = await avisar(titulo, {
          Notas: `\n${parte.renglones.join("\n")}`,
          ...(i === partes.length - 1 ? {
            Contestar: "respondé este mensaje con el número y lo que querés que le diga (por ejemplo: 2: decile que sí), o 2: -- para quedártela vos",
          } : {}),
        }, { contestable: false, silencioso: true });
        if (!ok) break;
        salio = true;
        Object.assign(mapa, parte.numeros);
      }
      if (salio) {
        const salieron = new Set(Object.values(mapa));
        const quedaron = charlas.filter((c) => !salieron.has(c.contacto));
        await base.cerrarResumen(franja.toISOString(), corteDe({ ahora, quedaron, ultimaLeida }), { etiqueta, en: franja.toISOString(), mapa });
        cerrado = true;
      }
      return { hecho: salio ? "enviado" : "no salió", charlas: Object.keys(mapa).length };
    } finally {
      // Si no salió (Telegram caído, la base que falló), la franja vuelve a quedar libre: la próxima vuelta lo intenta
      // con las mismas notas. Si salió y no se pudo cerrar, no se suelta (saldría dos veces): esas notas van de nuevo
      // en el resumen siguiente, porque el corte no avanzó.
      if (!cerrado && !salio) {
        try {
          await base.soltarResumen(franja.toISOString(), reclamo.franja_previa);
        } catch {
          // sin base: queda tomada y las notas salen en la franja siguiente
        }
      }
    }
  };
}
