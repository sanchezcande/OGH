// La palabra clave de una historia: alguien contesta "TRABAJO" y le llega el doc de la oferta.
//
// 29/10. Antes esto lo hacía ManyChat, que cobra por contacto: una historia que funciona le mete
// cientos de contactos pagos a la cuenta. Acá no hay tope, y además la respuesta es fija, así que
// no depende de que el modelo se acuerde de la oferta (que no la conoce: su guion no se tocó).
//
// Es a propósito más estricta que ManyChat: palabra sola, nada más. "CV por DM (contiene CV)" se
// metía en charlas reales cuando alguien escribía "mandé muchos cv" y hubo que apagarlo (08/10).
// Acá la regla es la misma que quedó para DEV y CV: el mensaje ES la palabra, y listo.
//
// Lo que sale es texto fijo, sin modelo. El link es el del DOC, no el de pago: el de pago sirve
// solo para pagar y si tiene info al lado aparecen preguntas en vez de compras (Hooman, 28/10).

import { DOC_OFERTA } from "../ofertaWhatsapp";

/** El texto sin tildes, sin mayúsculas, sin signos y con los espacios juntados. */
const plano = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Las palabras que disparan una respuesta fija, con lo que contestan. */
export const PALABRAS = {
  trabajo: {
    nombre: "trabajo",
    // El mismo marco que pidió Hooman y que ya usa el WhatsApp a los compradores
    // (lib/ofertaWhatsapp.js): "busco 5 devs", nunca "tomo" ni "nosotros", y la pregunta al final.
    // Es el mismo que ella manda a mano por Instagram, sin la línea personal (acá no hay charla
    // previa: el lead solo escribió la palabra).
    // El link es el del DOC y va al final, después de la pregunta.
    textos: [
      "Holii! Estoy buscando 5 devs para ayudarlos a conseguir trabajo este mes, los acompaño yo 1 a 1. Vas a ser vos o alguien más?",
      `Te dejo el detalle acá: ${DOC_OFERTA}`,
    ],
  },
};

/**
 * Si el mensaje ES una palabra clave, devuelve su respuesta. Si no, null.
 *
 * Tiene que ser la palabra sola: "trabajo" sí, "busco trabajo" no, "TRABAJO!" sí (el signo no
 * cuenta). Alguien que escribe una frase con la palabra adentro está hablando, no pidiendo el link,
 * y ese mensaje lo sigue atendiendo el agente como siempre.
 */
export function palabraClaveDe(texto) {
  const p = plano(texto);
  if (!p || p.includes(" ")) return null;
  return PALABRAS[p] || null;
}
