// La oferta del acompañamiento 1 a 1, por mail, a los devs de la lista que tienen inglés fluido.
//
// Por qué por mail y no por WhatsApp: el 02/11 WhatsApp restringió la cuenta de Cande por
// mensajería masiva. La tanda era de 530 números con el mismo texto a gente que nunca le había
// escrito primero, y la próxima restricción son 24 a 48 horas y la siguiente es permanente. Por
// mail ya le escribimos a esta misma gente (512 de los 530 recibieron la cadena de developers y
// solo 10 se dieron de baja), así que es el canal que está y no quema nada.
//
// Por qué solo inglés fluido: es el único dato de la base que predice que compran (p=0,02), y son
// 130 de 588. A los otros 458 el 1 a 1 no les resuelve lo primero que los frena.
//
// El mail NO lleva el link de pago. La puerta es la llamada de 15 minutos (Cande, 31/10: "NO TIENE
// QUE MANDAR EL LINK DE PAGO, tiene que mandar link a mi calendario"), y el precio tampoco va: el
// número pegado arriba espanta antes de que entienda qué es.
//
// Corre pegado a la cadena de developers (pages/api/drip.js) a propósito: un solo cron, un solo
// cupo de Resend y, si el cupo se acaba, lo que falta queda sin anotar y sale al día siguiente.

/** El link va limpio, sin parámetros: /15min ya cuenta el click en funnel_eventos, y un link con
 *  ?utm= le da desconfianza al dev (Cande, 23/10). */
export const AGENDA = "www.opengatehub.com/15min";

/** El inglés que entra. Tal cual lo guarda el formulario. */
export const INGLES = "Fluido";

/** Cuántos como mucho por corrida. Son 130 en total: con el cupo libre entran en una o dos. */
export const POR_CORRIDA = 120;

/** Un día de gracia desde que se anotan, para no pisar el mail de bienvenida de la otra cadena. */
export const DIAS = 1;

/** El producto del 1 a 1 en la tabla de compras: al que ya lo pagó no se le ofrece. */
export const PRODUCTO_1A1 = "%4 semanas%";

export const TOQUE = {
  col: "mail_1a1",
  dias: DIAS,
  asunto: () => "seguís buscando?",
  cuerpo: (nombre) => `${nombre ? nombre + ", pregunta" : "Pregunta"} corta: seguís buscando trabajo?

Te escribo porque pusiste inglés fluido, y son uno de cada cinco de los que se anotaron. Si con eso todavía no conseguiste, el problema no es técnico, es dónde estás aplicando.

Este mes acompaño a 5 devs uno a uno hasta que firmen. Quedan 3.

15 minutos y vemos si va: ${AGENDA}

Cande`,
};

/**
 * Los que todavía no lo recibieron: de la lista, con mail, sin silenciar, inglés fluido y sin
 * haber comprado ya el 1 a 1.
 */
export const BUSCAR = `SELECT id, nombre, email, creado FROM red_devs
       WHERE email IS NOT NULL AND NOT drip_off AND mail_1a1 IS NULL
         AND origen = 'formulario'
         AND ingles = '${INGLES}'
         AND lower(email) NOT IN (SELECT lower(email) FROM compras WHERE email IS NOT NULL AND producto ILIKE '${PRODUCTO_1A1}')
         AND creado < NOW() - make_interval(days => $1)
       ORDER BY creado ASC, id ASC
       LIMIT ${POR_CORRIDA}`;

/** El primer nombre, como lo escribe ella: "Juan Pérez" → "Juan". */
export const primerNombre = (n) => (n ? String(n).trim().split(/\s+/)[0] : "");
