// El QA programado de las charlas del agente (09/11).
//
// Cande, 09/11: "quiero que cada 3 días hagas un QA programado de todas las charlas con lo que funcionó y lo que no, y me
// presentes y corrijamos, sos IA se supone que aprendés de tus errores y ajustás".
//
// El cerebro de la nube (tracker/dm_qa.py en Personal Brand) cada QA_CADA_HORAS, a la mañana de Bali, pide acá las
// charlas de esos días (charlasParaQa), las audita con Claude y le manda a Cande por el bot el resumen con propuestas
// numeradas. Ese mensaje queda guardado como una corrección hecha con las propuestas (guardarQa): cuando ella lo responde
// ("dale 1 y 3", "la 2 no"), lib/dm/correcciones.js lo toma como seguir esa corrección y el corrector aplica las que
// aprobó, con los mismos controles de siempre (tracker/dm_corrector.py, aplicar).
import { sql } from "@vercel/postgres";
import { tablaCorrecciones } from "./correccionesBase";

export const QA_CADA_HORAS = 72;
/** Hasta cuántas charlas entran en un QA (las de más mensajes del lead primero). */
export const TOPE_CHARLAS = 250;

/**
 * Las charlas con algo del lead desde `desde` (Date): su contacto, sus últimos mensajes (hasta 50, con contexto de antes)
 * y las salidas del agente desde `desde` con su motivo. Las que más escribió el lead primero, hasta TOPE_CHARLAS.
 */
export async function charlasParaQa(desde) {
  const iso = desde.toISOString();
  const { rows: contactos } = await sql`
    SELECT c.id, c.nombre, c.ig_usuario, c.dueno, c.estado, c.pase_motivo, c.interes, COUNT(m.id)::int AS del_lead
    FROM dm_contactos c JOIN dm_mensajes m ON m.contacto = c.id AND m.quien = 'lead' AND m.creado > ${iso}
    GROUP BY c.id ORDER BY del_lead DESC LIMIT ${TOPE_CHARLAS}`;
  const out = [];
  for (const c of contactos) {
    const { rows: mensajes } = await sql`
      SELECT quien, texto, creado FROM dm_mensajes WHERE contacto = ${c.id} ORDER BY id DESC LIMIT 50`;
    const { rows: salidas } = await sql`
      SELECT accion, estado, motivo, creado FROM dm_salidas
      WHERE contacto = ${c.id} AND creado > ${iso} AND accion <> 'control' ORDER BY id ASC LIMIT 20`;
    out.push({ contacto: c, mensajes: mensajes.reverse(), salidas });
  }
  return out;
}

/** Lo que las correcciones por Telegram dejaron para arreglar en el código desde `desde` (causa "codigo"). */
export async function pendientesDeCodigo(desde) {
  await tablaCorrecciones();
  const { rows } = await sql`
    SELECT lote, resultado->>'entendi' AS entendi, resultado->>'diagnostico' AS diagnostico, creado
    FROM dm_correcciones
    WHERE id = lote AND estado = 'hecha' AND (resultado->>'pendiente_codigo')::boolean IS TRUE AND creado > ${desde.toISOString()}
    ORDER BY id`;
  return rows;
}

/** Ventas desde `desde`, para que el QA diga qué funcionó (compras pagas, sin los canjes de precio 0). */
export async function ventasDesde(desde) {
  try {
    const { rows } = await sql`
      SELECT COUNT(*)::int AS pagas FROM compras WHERE creado > ${desde.toISOString()} AND precio > 0 AND NOT COALESCE(baja, false)`;
    return rows[0]?.pagas ?? 0;
  } catch {
    return null; // sin la tabla de compras (pruebas, otra base)
  }
}

/**
 * Guarda el QA como una corrección hecha con sus propuestas, para que la respuesta de Cande la siga. `respuestaId`: el
 * mensaje del bot con el resumen (lo que ella va a responder). update_id negativo: no viene de Telegram.
 */
export async function guardarQa({ respuestaId, resumen, propuestas, desde, hasta }) {
  await tablaCorrecciones();
  const resultado = { qa: true, entendi: "el QA de las charlas", resumen, propuestas, desde, hasta };
  const { rows } = await sql`
    INSERT INTO dm_correcciones (update_id, texto, estado, resultado, respuesta_id)
    VALUES (${-Date.now()}, ${"QA programado"}, 'hecha', ${JSON.stringify(resultado)}, ${respuestaId})
    RETURNING id`;
  await sql`UPDATE dm_correcciones SET lote = id WHERE id = ${rows[0].id}`;
  return rows[0].id;
}
