// La palabra clave de una historia: alguien contesta "TRABAJO" y le llega la agenda para una llamada.
//
// 29/10. Antes esto lo hacía ManyChat, que cobra por contacto: una historia que funciona le mete
// cientos de contactos pagos a la cuenta. Acá no hay tope, y además la respuesta es fija, así que
// no depende de que el modelo se acuerde de la oferta (que no la conoce: su guion no se tocó).
//
// Es a propósito más estricta que ManyChat: palabra sola, nada más. "CV por DM (contiene CV)" se
// metía en charlas reales cuando alguien escribía "mandé muchos cv" y hubo que apagarlo (08/10).
// Acá la regla es la misma que quedó para DEV y CV: el mensaje ES la palabra, y listo.
//
// 31/10: lo que sale es la AGENDA y ya no el doc. Hooman escuchó la charla de la noche anterior
// (16 personas recibieron el doc y no contestó ninguna) y lo dijo así: "forget about the doc for
// now... promote it on your socials direct to the calendar". El doc entrega información y la
// charla se muere ahí; la agenda la termina de contar ella en la llamada, que es donde cierra.
// El link de pago tampoco va: sirve solo para pagar, y si tiene info al lado aparecen preguntas en
// vez de compras (Hooman, 28/10).

import { TEXTO_CV } from "./comentarios";
import { LINK_LLAMADA } from "../ofertaWhatsapp";

/** El texto sin tildes, sin mayúsculas, sin signos y con los espacios juntados. */
const plano = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Las palabras que disparan una respuesta fija, con lo que contestan.
 *
 * `pasa` dice si después de contestar la charla se le pasa a Cande. Con TRABAJO sí: el que levanta
 * la mano por el 1 a 1 lo atiende ella. Con CV no: la lista es un link que se sirve solo, y el que
 * la pide sigue con el agente como cualquier otro dev.
 */
export const PALABRAS = {
  trabajo: {
    nombre: "trabajo",
    pasa: true,
    // El que escribe la palabra ACABA de leer la historia, que ya dice "busco 5 devs para
    // ayudarlos 1 a 1 a que consigan trabajo en este mes" y "vas a ser vos o alguien más?".
    // Repetírselo acá es hacerle leer dos veces lo mismo (Cande, 30/10). Así que el DM entrega
    // lo que la historia prometió ("te cuento cómo") y cierra pidiendo un veredicto.
    // El cierre es una pregunta SIEMPRE, y pide el lugar y no una opinión: "qué te parece" te lo
    // contesta cualquiera que no va a comprar. Es la falla número uno de sus 26 llamadas.
    // Los 5 lugares son de verdad, así que la urgencia no es inventada.
    // 02/11, dictado por Cande palabra por palabra antes de subir la historia ("ponelo exactamente
    // así"): no se le corrigen las letras estiradas ni los emojis, que es como escribe ella.
    // 03/11: "Manda que quedan 2 ahora". El número lo baja ella a medida que se llenan.
    textos: [
      `Buenaaas 🙂  gracias por escribir! Agendá una llamada de 15 min conmigo y te cuento cómo seguimoss\n\n${LINK_LLAMADA}`,
      "Voy a tomar 5 este mes y ya quedan 2 no másss 😬",
    ],
  },
  // 31/10: lo que hacía la automatización "CV por DM (match exacto)" de ManyChat, que desde que la
  // cuenta tiene el tope de contactos en 2.500 no le contesta a nadie nuevo. El texto es el mismo
  // que ya sale por los comentarios (lib/dm/comentarios.js, TEXTO_CV): una sola redacción para la
  // misma promesa, la pida por comentario o por DM.
  cv: {
    nombre: "cv",
    pasa: false,
    textos: [TEXTO_CV],
  },
  // 03/11, Cande: "decir que si es de Cuba me escriba CUBA por privado y les doy acceso gratis ... así ayudo un poco y
  // armo buena visibilidad en Cuba". Desde Cuba no se puede pagar afuera (ni Gumroad ni MercadoPago), así que el
  // programa de 27 va regalado. Cada uno recibe su propio código de 100% y de un solo uso (lib/gumroadCodigos.js, el
  // mismo camino que el pago en pesos), con su link ya puesto: así queda quién lo pidió y el código no se comparte.
  // El texto no vive acá sino en el ajuste mensaje_cuba, que carga Cande: sin él, CUBA no dispara nada y lo atiende el
  // agente como siempre. No pasa a Cande (serían cientos de charlas en su bandeja), y al que lo recibió el agente no le
  // vende nada después: ni el programa ni el 1 a 1 (lib/dm/agente.js y el freno `regalo` de lib/dm/frenos.js).
  cuba: {
    nombre: "cuba",
    pasa: false,
    regalo: true,
    textos: [],
  },
};

/**
 * Los mensajes de un regalo: el texto del ajuste (mensaje_cuba) partido en un mensaje por párrafo, con el link de la
 * persona donde dice {link}. Vacío si el texto no tiene dónde poner el link: sin link no hay regalo.
 */
export function textosDelRegalo(mensaje, link) {
  const t = String(mensaje || "").trim();
  if (!t.includes("{link}") || !link) return [];
  return t.split(/\n\s*\n/).map((m) => m.trim().replaceAll("{link}", link)).filter(Boolean);
}

/**
 * Si el mensaje ES una palabra clave, devuelve su respuesta. Si no, null.
 *
 * Tiene que ser la palabra sola: "trabajo" sí, "busco trabajo" no, "TRABAJO!" sí (el signo no
 * cuenta). `regalos`: si las palabras que regalan el programa (CUBA) están prendidas. `conRegalo`: si este contacto
 * ya recibió el regalo. Alguien que escribe una frase con la palabra adentro está hablando, no pidiendo el link,
 * y ese mensaje lo sigue atendiendo el agente como siempre.
 */
export function palabraClaveDe(texto, { regalos = false, conRegalo = false } = {}) {
  const p = plano(texto);
  if (!p || p.includes(" ")) return null;
  const clave = Object.hasOwn(PALABRAS, p) ? PALABRAS[p] : null;
  // Un regalo (CUBA) solo con su texto cargado en los ajustes: sin él, el mensaje lo atiende el agente como siempre.
  if (clave?.regalo && !regalos) return null;
  // Al que ya tiene el regalo, las otras palabras no le contestan con su texto fijo (TRABAJO le mandaría la agenda del
  // 1 a 1): las atiende el agente, que sabe que lo tiene regalado y tiene el freno para no venderle.
  if (clave && !clave.regalo && conRegalo) return null;
  return clave;
}
