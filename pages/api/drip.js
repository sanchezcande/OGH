import { sql } from "@vercel/postgres";
import { Resend } from "resend";

// Campaña de goteo para la red de devs. La llama el cron de Vercel una vez por
// día (ver vercel.json). Dos toques después de aplicar:
//   día 2 → "viste el video? la guía te prepara"
//   día 6 → "las búsquedas están saliendo, llegá preparado"
// Cada toque se marca en la fila (drip2/drip6), así que aunque el endpoint se
// llame mil veces, cada persona recibe cada mail UNA sola vez. Sin token de
// cron a propósito: el peor abuso posible es adelantar un mail legítimo.
const KEY = process.env.RESEND_API_KEY;
const FROM = process.env.DEVS_MAIL_FROM || "OpenGateHub <onboarding@resend.dev>";
const REPLY_TO = process.env.DEVS_MAIL_REPLYTO || "hubopengate@gmail.com";
const GUIA = "https://get.opengatehub.com/l/acelerador-de-carrera";

const TOQUES = [
  {
    col: "drip2", dias: 2,
    asunto: "Viste el video?",
    cuerpo: (pila) => `Hola${pila}!

Te escribo cortito: ya tengo tu aplicación${""} y las búsquedas siguen su curso.

Mientras tanto, si no viste el video que te dejé después del form, miralo — ahí te cuento de la guía con la que llegás preparado a estas entrevistas: las 9 preguntas que hago, el CV que pasa el filtro, qué contar sin que te lo pregunten.

El descuento sigue por poco tiempo: ${GUIA}

Cuanto más preparado llegues, mejor puesto te puedo conseguir. Ahí ganamos los dos.

Cande`,
  },
  {
    col: "drip6", dias: 6,
    asunto: "Un consejo antes de que te toque",
    cuerpo: (pila) => `Hola${pila}!

Te escribo con un consejo honesto: cuando un puesto aparece, todo pasa rápido — te contacto, coordinamos, y la entrevista es en días. Ahí ya no hay tiempo de prepararse. La preparación se hace ahora, que no hay apuro.

Para eso armé la guía: no es teoría, es exactamente lo que yo miro cuando entrevisto a un dev.

Todavía está con el descuento: ${GUIA}

Preparate tranquilo ahora, que cuando te toque quiero que la rompas.

Cande`,
  },
];

export default async function handler(req, res) {
  if (!KEY) return res.status(200).json({ ok: false, error: "sin RESEND_API_KEY" });
  const resend = new Resend(KEY);

  await sql`ALTER TABLE red_devs ADD COLUMN IF NOT EXISTS drip2 TIMESTAMPTZ`;
  await sql`ALTER TABLE red_devs ADD COLUMN IF NOT EXISTS drip6 TIMESTAMPTZ`;
  await sql`ALTER TABLE red_devs ADD COLUMN IF NOT EXISTS drip_off BOOLEAN NOT NULL DEFAULT FALSE`;

  const enviados = { drip2: 0, drip6: 0 };
  for (const t of TOQUES) {
    // Solo los que aplicaron por formulario (tienen email) hace >= N días,
    // no recibieron este toque, y no están silenciados (drip_off).
    const { rows } = t.col === "drip2"
      ? await sql`SELECT id, nombre, email FROM red_devs
          WHERE email IS NOT NULL AND NOT drip_off AND drip2 IS NULL
            AND origen = 'formulario'
            AND creado < NOW() - INTERVAL '2 days' LIMIT 40`
      : await sql`SELECT id, nombre, email FROM red_devs
          WHERE email IS NOT NULL AND NOT drip_off AND drip6 IS NULL
            AND origen = 'formulario'
            AND creado < NOW() - INTERVAL '6 days' LIMIT 40`;
    for (const r of rows) {
      const pila = r.nombre ? " " + r.nombre.trim().split(/\s+/)[0] : "";
      try {
        await resend.emails.send({
          from: FROM, to: r.email, replyTo: REPLY_TO,
          subject: t.asunto, text: t.cuerpo(pila),
        });
        if (t.col === "drip2") await sql`UPDATE red_devs SET drip2 = NOW() WHERE id = ${r.id}`;
        else await sql`UPDATE red_devs SET drip6 = NOW() WHERE id = ${r.id}`;
        enviados[t.col]++;
      } catch (e) {
        console.error(`drip ${t.col} → ${r.email}:`, e.message);
      }
    }
  }
  return res.status(200).json({ ok: true, enviados });
}
