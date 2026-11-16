/**
 * La foto semanal del embudo de venta de /devs/gracias.
 *
 *   node scripts/embudo_semanal.mjs            # las últimas 10 semanas
 *   node scripts/embudo_semanal.mjs 16         # cuántas semanas mirar
 *
 * Por qué existe (15/11/2026): ese día se sacó la reja que escondía el botón de compra detrás
 * de 110 segundos de video, y se puso el precio en la página. Para saber si sirvió hay que
 * mirar la misma cuenta todas las semanas, no consultas sueltas que cada vez miden algo
 * distinto.
 *
 * Todo va en RATIOS POR VISITA y nunca en totales: el 04/11 se murió la puerta de ManyChat y
 * el tráfico a la página cayó un 96% en una semana. Comparar totales antes y después mediría
 * ese desplome, no el cambio de la página.
 *
 * Las fases llegan con la versión de la prueba A/B pegada (click_gumroad_a, gracias_vista_b),
 * así que se cuentan por prefijo, igual que en scripts/crm_embudo.mjs.
 */
import { sql } from "@vercel/postgres";

const semanas = Number(process.argv[2] || 10);

const filas = (await sql`
  SELECT to_char(date_trunc('week', creado), 'YYYY-MM-DD') AS semana,
         COUNT(DISTINCT sid) FILTER (WHERE fase LIKE 'gracias_vista%')::int AS visitas,
         COUNT(DISTINCT sid) FILTER (WHERE fase = 'video_play')::int        AS play,
         COUNT(*) FILTER (WHERE fase LIKE 'click_gumroad%')::int            AS click_usd,
         COUNT(*) FILTER (WHERE fase LIKE 'click_mp%')::int                 AS click_ars
    FROM funnel_eventos
   WHERE creado > NOW() - make_interval(weeks => ${semanas}::int)
   GROUP BY 1 ORDER BY 1`).rows;

const compras = (await sql`
  SELECT to_char(date_trunc('week', creado), 'YYYY-MM-DD') AS semana,
         COUNT(*) FILTER (WHERE precio <> '0')::int AS pagas,
         COUNT(*) FILTER (WHERE precio = '0')::int  AS regaladas
    FROM compras
   WHERE creado > NOW() - make_interval(weeks => ${semanas}::int)
   GROUP BY 1`).rows;
const porSemana = Object.fromEntries(compras.map((c) => [c.semana, c]));

const pct = (a, b) => (b > 0 ? `${((a / b) * 100).toFixed(1)}%` : "  .  ");

console.log("semana      visitas  play  clicks  pagas  regaladas   clicks/visita  pagas/visita");
for (const f of filas) {
  const c = porSemana[f.semana] || { pagas: 0, regaladas: 0 };
  const clicks = f.click_usd + f.click_ars;
  console.log(
    `${f.semana}  ${String(f.visitas).padStart(7)}  ${String(f.play).padStart(4)}  ` +
    `${String(clicks).padStart(6)}  ${String(c.pagas).padStart(5)}  ${String(c.regaladas).padStart(9)}   ` +
    `${pct(clicks, f.visitas).padStart(13)}  ${pct(c.pagas, f.visitas).padStart(12)}`
  );
}

/*
 * CRITERIO, escrito el 15/11/2026 ANTES de ver una sola semana posterior al cambio.
 *
 * Línea de base, las 3 semanas previas (26/10, 02/11, 09/11):
 *   clicks/visita  9,2%  11,5%  16,3%   → mediana 11,5%
 *   pagas/visita   3,1%   2,5%   2,3%   → mediana  2,5%
 *
 * Se mira a las 4 semanas, el 13/12, no antes y no se corta porque venga lindo.
 *
 *   - Si clicks/visita sube arriba de 20% Y pagas/visita arriba de 4%: la reja era el problema.
 *   - Si clicks/visita sube y pagas/visita NO: ahora sí el problema es el precio o el checkout,
 *     y recién ahí se trabaja eso, sabiendo que antes no se podía saber.
 *   - Si no se mueve ninguna de las dos: el botón no era la causa y hay que volver a buscar.
 *
 * Nunca comparar totales: el 04/11 murió la puerta de ManyChat y el tráfico cayó 96% en una
 * semana. Los totales miden ese desplome, no la página.
 *
 * Ojo con las semanas de pocas visitas (43 en la del 09/11): con esos números un click de más
 * mueve el porcentaje dos puntos. Por eso la decisión es a 4 semanas y no a una.
 */
