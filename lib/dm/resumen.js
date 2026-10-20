// El resumen de las notas del agente de DM (20/10, Cande: "la mayoría de los mensajes que me pasás por telegram son
// re resolvibles por vos, no entiendo por qué me los pasás").
//
// Lo que el agente quiere que Cande sepa pero no necesita nada de ella ya (un aviso_para_cande que arranca con
// "NOTA:": lo que no supo contestar, lo que le ofrecen, quien ya compró, lo que marcó el repaso de la Mac) no suena
// en el momento. Le llega junto, dos veces por día (las 9 y las 18 de Bali) y sin sonido, con un número por charla,
// lo que dice la nota, cuánto queda para escribirle por acá y el link a la charla en Instagram. Respondiendo el
// resumen con "2: lo que quiere que le diga", el agente se lo escribe a esa charla (lib/dm/respuestas.js).
// Con sonido siguen llegando solo los "HOY:" (la charla pasa a ella) y los "YA:" (riesgo para la persona o un pago).
//
// Lo manda el cron de los toques (pages/api/dm/toques.js), que corre cada 10 minutos: la primera vuelta después de
// cada hora se lo queda (base.reclamarResumen, una sola vez aunque corran dos a la vez). Si Telegram no lo deja
// salir, lo intenta la vuelta siguiente con las mismas notas.
import { linkCharlaIg, usuarioParaAviso } from "./instagram";
import { TITULO_RESUMEN } from "./respuestas";

const HORA = 3600000;
const BALI = 8; // Cande vive en Bali (UTC+8)
/** Las horas del resumen, en UTC: las 9 y las 18 de Bali. */
export const HORAS_UTC = [1, 10];
/** Tope de charlas por resumen y de largo (Telegram corta a los 4.096 caracteres). */
export const TOPE_CHARLAS = 25;
const TOPE_TEXTO = 3300;
const TOPE_NOTA = 220;
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

const sinPrefijo = (aviso) => String(aviso || "").replace(/^NOTA:\s*/, "").replace(/\s+/g, " ").trim();
const recorte = (s, n) => (Array.from(s).length > n ? `${Array.from(s).slice(0, n).join("")}…` : s);

/**
 * Las notas agrupadas por charla, en el orden en que llegaron: [{ contacto, nombre, ig_usuario, ultimo_lead, notas }].
 * Una nota repetida en la misma charla va una vez.
 */
export function agrupar(filas) {
  const charlas = new Map();
  for (const f of filas || []) {
    const id = String(f.contacto);
    if (!charlas.has(id)) charlas.set(id, { contacto: id, nombre: f.nombre, ig_usuario: f.ig_usuario, ultimo_lead: f.ultimo_lead, notas: [] });
    const c = charlas.get(id);
    const nota = sinPrefijo(f.aviso);
    if (nota && !c.notas.includes(nota)) c.notas.push(nota);
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
 * Los renglones del resumen y el número de cada charla: { renglones, mapa: { "1": contacto, ... }, afuera }.
 * `links`: el link a la charla en Instagram de cada contacto que se pudo saber.
 */
export function armarRenglones(charlas, { ahora, links = {} }) {
  const renglones = [];
  const mapa = {};
  let largo = 0;
  for (const c of charlas) {
    const n = renglones.length + 1;
    const nombre = recorte(String(c.nombre || "sin nombre").replace(/\s+/g, " "), 40);
    const link = links[c.contacto] ? ` ${links[c.contacto]}` : "";
    const renglon = `${n}. ${nombre}: ${recorte(c.notas.join(" / "), TOPE_NOTA)} (${ventanaDe(c.ultimo_lead, ahora)})${link}`;
    if (n > TOPE_CHARLAS || largo + renglon.length > TOPE_TEXTO) break;
    renglones.push(renglon);
    mapa[String(n)] = c.contacto;
    largo += renglon.length + 1;
  }
  return { renglones, mapa, afuera: charlas.length - renglones.length };
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
      const charlas = agrupar(await base.notasParaResumen(desde, ahora));
      if (!charlas.length) {
        await base.cerrarResumen(franja.toISOString(), ahora, null);
        cerrado = true;
        return { hecho: "sin notas", charlas: 0 };
      }
      const links = {};
      for (const c of charlas.slice(0, TOPE_CHARLAS)) {
        const usuario = ahoraMs() < hasta ? await usuarioParaAviso({ id: c.contacto, ig_usuario: c.ig_usuario }, { base, manychat }) : c.ig_usuario || null;
        const link = linkCharlaIg(usuario);
        if (link) links[c.contacto] = link;
      }
      const { renglones, mapa, afuera } = armarRenglones(charlas, { ahora, links });
      const etiqueta = etiquetaDe(franja);
      salio = await avisar(`${TITULO_RESUMEN} · ${etiqueta}`, {
        Notas: `\n${renglones.join("\n")}${afuera > 0 ? `\n(y ${afuera} más: no entraron)` : ""}`,
        Contestar: "respondé este mensaje con el número y lo que querés que le diga (por ejemplo: 2: decile que sí), o 2: -- para quedártela vos",
      }, { contestable: false, silencioso: true });
      if (salio) {
        await base.cerrarResumen(franja.toISOString(), ahora, { etiqueta, mapa });
        cerrado = true;
      }
      return { hecho: salio ? "enviado" : "no salió", charlas: salio ? renglones.length : 0 };
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
