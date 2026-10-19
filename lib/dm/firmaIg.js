// La firma del id de charla en el link del formulario (20/10/2026). SOLO SERVIDOR: usa node:crypto y la clave del
// entorno. No se importa desde nada que corra en el navegador (pages/devs/index.jsx, lib/dm/linkFormulario.js).
//
// El link que manda el agente lleva el id de la charla en claro (opengatehub.com/devs?ig=<id>, ver
// lib/dm/linkFormulario.js). Sin firma, cualquiera que cambie el número a mano ata su formulario a la charla de
// otra persona. Con la firma (&f=<firma>), /api/devs-red guarda ig_contacto solo si la firma es la de ese id: un
// número cambiado ya no coincide. Un link reenviado entero sí sigue valiendo; eso lo resuelve el "link compartido"
// de lib/db.js (guardarDev) y de /api/devs-red.
//
// La firma: HMAC-SHA256 de "ig-form:" + id con IG_LINK_SECRET (o CRON_SECRET, si no hay una propia), en base64url y
// cortada a 10 caracteres (60 bits: alcanza para que adivinarla a mano no sea una opción, y el link sigue corto).
import { createHmac, timingSafeEqual } from "node:crypto";
import { idDeCharla } from "./linkFormulario";

// Se lee en cada llamada y no al cargar el archivo: así cambiarla en el entorno (o en una prueba) no pide reiniciar.
const clave = () => process.env.IG_LINK_SECRET || process.env.CRON_SECRET || "";

export const LARGO_FIRMA = 10;

/**
 * La firma del id de charla para el &f= del link, o null si el id no vale o si no hay ninguna clave configurada
 * (entonces el link sale sin firma, como antes).
 */
export function firmarIg(id) {
  const k = clave();
  const ig = idDeCharla(id);
  if (!k || !ig) return null;
  return createHmac("sha256", k).update(`ig-form:${ig}`).digest("base64url").slice(0, LARGO_FIRMA);
}

/**
 * La firma que llegó con el formulario es la de este id? Compara en tiempo constante; una firma de otro largo, que
 * no es un texto o que falta, no vale.
 *
 * Sin ninguna clave configurada no hay firma que mirar: devuelve true y el id se usa como hasta hoy (el link salió
 * sin &f=, porque firmarIg tampoco firma). Así un entorno sin la clave (una prueba, una copia local) no pierde la
 * unión con la charla. En producción alcanza con CRON_SECRET, la de los crons de Vercel.
 */
export function firmaValida(id, firma) {
  if (!clave()) return true;
  const esperada = firmarIg(id);
  if (!esperada || typeof firma !== "string") return false;
  const a = Buffer.from(firma);
  const b = Buffer.from(esperada);
  return a.length === b.length && timingSafeEqual(a, b);
}
