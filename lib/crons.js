// Cada cuánto corren los crons que tocan la base (vercel.json y .github/workflows/cola-publicar.yml): cada 15
// minutos, todos en los mismos minutos (0, 15, 30 y 45 de cada hora). Así la base de Neon se despierta una vez, hace
// todo junto y vuelve a dormir hasta la vuelta siguiente. Con crons cada 2 o 3 minutos no dormía nunca y el 21/10 se
// quedó sin las horas de cómputo del plan gratis: no se publicó nada y el agente de DM se quedó sin base.
//
// Lo que depende de la cadencia (cuándo una alarma es una caída de verdad, cuánto puede tardar la espera en tomar un
// mensaje, cada cuánto repasa la red de la bandeja) se cuenta con esto, así no queda atado a un número viejo.
// Las cadenas de mails (/api/drip, /api/drip-preguntas) corren una vez por día y van aparte, y la pasada rápida de
// la bandeja va cada 3 minutos (ver abajo: es el aviso de que hay un mensaje nuevo, que antes daba ManyChat).
// tests/crons.test.mjs controla que vercel.json y el workflow digan lo mismo que acá.
export const CADA_CRON_MIN = 15;
export const CADA_CRON_MS = CADA_CRON_MIN * 60000;
/** El horario de cada uno, en el formato de vercel.json. */
export const HORARIO_CRON = `*/${CADA_CRON_MIN} * * * *`;

// La pasada rápida de la bandeja (30/10, pages/api/dm/bandeja-rapida.js) es la única excepción a la cadencia de
// arriba, y va aparte por dos motivos:
//   - Hace falta: desde que ManyChat pausó sus automatizaciones nadie le avisa al agente de un mensaje nuevo, y
//     esperar la vuelta de los 15 minutos (más el ciclo de 10 páginas del barrido) le costaba hasta media hora.
//     Lee UNA página de la bandeja: un pedido a Meta y dos lecturas de la base por vuelta.
//   - Ya se puede: lo que obligaba a la cadencia única era la cuota del plan gratis de Neon (la base no dormía
//     nunca y el 21/10 se quedó sin horas de cómputo). Cande pagó el plan de Neon ese mismo día, así que la base
//     prendida ya no se paga en caídas.
// Los minutos van corridos (1, 4, 7… 58) para no caer nunca en los del barrido (0, 15, 30 y 45): las dos vueltas
// aguantan cruzarse (las trabas de lib/dm/bandeja.js), pero no tiene sentido buscarlo.
export const RAPIDA_CRON_MIN = 3;
export const RAPIDA_CRON_MS = RAPIDA_CRON_MIN * 60000;
export const HORARIO_RAPIDA = `1-59/${RAPIDA_CRON_MIN} * * * *`;
