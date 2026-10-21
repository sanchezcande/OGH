// Cada cuánto corren los crons que tocan la base (vercel.json): cada 15 minutos, todos en los mismos minutos (0, 15, 30
// y 45 de cada hora). Así la base de Neon se despierta una vez, hace todo junto y vuelve a dormir hasta la vuelta
// siguiente. Con crons cada 2 o 3 minutos no dormía nunca y el 21/10 se quedó sin las horas de cómputo del plan gratis:
// no se publicó nada y el agente de DM se quedó sin base. El reloj de GitHub para la cola
// (.github/workflows/cola-publicar.yml) ya no tiene horario: no lo cumplía y despertaba la base en minutos cualquiera.
// La Mac de Cande (tracker/dm_cerebro.py) pregunta en una ventana alrededor de estos mismos minutos (lib/dm/cola.js).
//
// Lo que esto no hace (revisión del 21/10): que la base duerma la mayor parte del día. Cada vuelta la despierta igual,
// haya algo que hacer o no (cada cron consulta la base al arrancar), y Neon tarda 5 minutos en apagarse después de la
// última consulta: cada vuelta la deja prendida unos 7 minutos, 96 vueltas por día, unas 11 horas aunque no escriba
// nadie. Con los mensajes, las charlas en vivo y las publicaciones, de 12 a 21 horas por día según el día (simulado con
// el registro real del 13 al 21/10), contra 24 de antes. Bajar de ahí pide no despertarla en las vueltas sin nada que
// hacer: una señal barata fuera de Neon (si hay mensajes o indicaciones esperando, el próximo toque, la próxima
// publicación) que cada cron y la Mac miren primero. Los eventos del embudo ya se juntan fuera (lib/eventosPendientes.js).
//
// Lo que depende de la cadencia (cuándo una alarma es una caída de verdad, cuánto puede tardar la espera en tomar un
// mensaje, cada cuánto repasa la red de la bandeja) se cuenta con esto, así no queda atado a un número viejo.
// Las cadenas de mails (/api/drip, /api/drip-preguntas) corren una vez por día y van aparte.
// tests/crons.test.mjs controla que vercel.json diga lo mismo que acá y que el workflow no tenga horario.
export const CADA_CRON_MIN = 15;
export const CADA_CRON_MS = CADA_CRON_MIN * 60000;
/** El horario de cada uno, en el formato de vercel.json. */
export const HORARIO_CRON = `*/${CADA_CRON_MIN} * * * *`;
