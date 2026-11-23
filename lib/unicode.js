// Medio emoji (23/11). Un emoji como 🙏 son dos caracteres para JavaScript (un par sustituto de UTF-16). Si un texto se
// corta con .slice justo entre los dos, queda la primera mitad suelta, y eso no lo acepta nadie:
//   - Postgres no lo guarda en un JSONB: "invalid input syntax for type json" (22P02).
//   - Telegram no lo manda: "text must be encoded in UTF-8" (400).
// El 23/11 a las 18:25 (UTC) un lead escribió un mensaje con un emoji justo en el carácter 60, donde la red de la bandeja
// corta lo que muestra en el resumen. Desde ahí ninguna vuelta pudo guardar su estado (dm_config "bandeja_estado" y
// "bandeja_paginas"), el resumen a Cande rebotó en Telegram en cada pasada y a la hora saltó "DM: la red de la bandeja
// no anda". Las charlas se siguieron mirando y contestando, pero la vuelta nunca terminaba.
//
// Por eso: se corta por letra entera (cortar), y lo que va a la base o a Telegram pasa antes por bienFormado, que saca
// las mitades sueltas que hayan quedado de cualquier otro lado.

/** Una mitad de un par sustituto sin su pareja. */
const SUELTA = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;

/** El texto sin mitades de emoji sueltas (las saca: no hay nada que mostrar de medio emoji). */
export const bienFormado = (s) => String(s).replace(SUELTA, "");

/** Los primeros `n` caracteres de verdad (un emoji cuenta como uno y nunca queda partido). */
export const cortar = (s, n) => Array.from(String(s ?? "")).slice(0, n).join("");

/** Si hace falta cortarlo a `n` caracteres de verdad. */
export const pasaDe = (s, n) => {
  const t = String(s ?? "");
  // Rápido para lo corto: con n o menos unidades de UTF-16 no puede tener más de n caracteres.
  return t.length > n && Array.from(t).length > n;
};

/** Para JSON.stringify (su segundo argumento): cada texto adentro del objeto, sin mitades sueltas. */
export const sinMitades = (_clave, v) => (typeof v === "string" ? bienFormado(v) : v);

/** El JSON de `valor` listo para Postgres o para Telegram. */
export const jsonSano = (valor) => JSON.stringify(valor, sinMitades);
