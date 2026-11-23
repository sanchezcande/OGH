// El recordatorio de la llamada de 15 minutos, por Instagram, una hora antes.
//
// 23/11/2026, Cande: "hoy ya van 3 no shows, hay que hacer ayer el mensaje automatizado para que
// esto no pase más", y "no con gmail, con whatsapp o instagram". Por mail ya avisa la agenda de
// Google un día antes y aun así faltan. WhatsApp todavía no se puede (el número de la API está sin
// dar de alta, PR 205 abierto), así que el recordatorio sale por donde el agente ya habla: Instagram.
//
// Cómo llega el usuario de Instagram: el 23/11 se agregó al formulario de reserva de la agenda el
// campo obligatorio "Tu usuario de Instagram (te mando el recordatorio por ahi)", así que viene en
// la descripción del evento, abajo del nombre, el mail y el teléfono. Las reservas hechas antes de
// ese día no lo traen: para esas se busca el contacto por nombre y solo sale si hay UNO solo.
//
// Acá adentro no hay base ni red: solo las cuentas y los textos, para poder probarlo.

/** Cuánto antes de la llamada sale el recordatorio. */
export const MINUTOS_ANTES = 60;
/** Si falta menos que esto para la llamada, ya no se manda: llega tarde y molesta. */
export const MINUTOS_TARDE = 10;

/** El usuario de Instagram como lo escribió la persona -> "juanperez". "" si no se entiende. */
export function usuarioIg(texto) {
  let t = String(texto || "").trim().toLowerCase();
  if (!t) return "";
  const m = t.match(/instagram\.com\/([^/?#\s]+)/);
  if (m) t = m[1];
  t = t.replace(/^@+/, "").replace(/\/+$/, "").trim();
  return /^[a-z0-9._]{1,30}$/.test(t) ? t : "";
}

/** El nombre sin tildes ni mayúsculas, para emparejar un contacto cuando no hay usuario. */
export const claveNombre = (t) => String(t || "")
  .normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Lo que dejó la agenda en la descripción del evento ("Programada por" + los campos del
 * formulario). Devuelve { nombre, mail, telefono, usuario }. Lo que no esté viene vacío.
 */
export function datosDeLaReserva({ titulo = "", descripcion = "" } = {}) {
  const texto = String(descripcion || "")
    .replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "\n").replace(/\\n/g, "\n");
  const renglones = texto.split("\n").map((x) => x.trim()).filter(Boolean);
  const mail = renglones.find((x) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x)) || "";
  const telefono = renglones.find((x) => /^\+?[\d\s()-]{8,}$/.test(x)) || "";
  // El usuario de Instagram. La pregunta del formulario lleva la palabra "Instagram", así que
  // primero se busca ese renglón: la respuesta puede venir en el mismo (después de los dos puntos)
  // o en el de abajo. Si no aparece la pregunta, sirve cualquier renglón con forma de usuario que
  // no sea el mail ni el teléfono ni el encabezado.
  let usuario = "";
  const i = renglones.findIndex((r) => /instagram/i.test(r));
  if (i >= 0) {
    usuario = usuarioIg(renglones[i].split(":").slice(1).join(":")) || usuarioIg(renglones[i + 1]);
  }
  if (!usuario) {
    usuario = renglones
      .filter((r) => r !== mail && r !== telefono && !/programada por/i.test(r))
      .map(usuarioIg)
      .find(Boolean) || "";
  }
  const m = String(titulo || "").match(/\(([^)]+)\)\s*$/);
  let nombre = m ? m[1].trim() : "";
  if (!nombre) {
    const i = renglones.findIndex((x) => /programada por/i.test(x));
    if (i >= 0 && renglones[i + 1]) nombre = renglones[i + 1];
  }
  return { nombre, mail, telefono, usuario };
}

/** Cuándo sale el recordatorio de una llamada que arranca en `inicio` (Date o ms). */
export const cuandoSale = (inicio) => new Date(new Date(inicio).getTime() - MINUTOS_ANTES * 60000);

/**
 * Si este recordatorio se manda ahora: ya le tocaba y la llamada todavía no es inminente.
 * `fila` tiene { mandar_a, cuando }.
 */
export function leToca(fila, ahora = new Date()) {
  const t = new Date(ahora).getTime();
  const sale = new Date(fila.mandar_a).getTime();
  const llamada = new Date(fila.cuando).getTime();
  return t >= sale && llamada - t > MINUTOS_TARDE * 60000;
}

/** El primer nombre, que es como le escribe ella. */
export const primerNombre = (nombre) => String(nombre || "").trim().split(/\s+/)[0] || "";

/**
 * Lo que le llega al lead. Habla ella, en primera persona: nunca "la llamada con Cande".
 * El segundo texto le da la salida fácil, que es lo que evita el plantón: si no llega, que avise.
 */
export function textosDelRecordatorio(nombre, link) {
  const n = primerNombre(nombre);
  const hola = n ? `Buenas ${n}! ` : "Buenas! ";
  return [
    `${hola}En una hora tenemos la llamada de 15 minutos.`,
    link
      ? `Te dejo el link: ${link}. Si no llegás avisame y la movemos.`
      : "Si no llegás avisame y la movemos.",
  ];
}
