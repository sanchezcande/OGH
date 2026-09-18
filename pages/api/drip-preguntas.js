import { sql } from "@vercel/postgres";
import { Resend } from "resend";

// Cadena de nurture para founders que bajaron "9 de las preguntas" (leads_preguntas).
// Liviana a propósito (Cande, 18/09): 3 toques — día 3, 7 y 14 — sin vender nada,
// solo recordando que existís y empujando suave hacia la llamada gratis.
// La llama el mismo cron diario que el goteo de devs (ver vercel.json).
const KEY = process.env.RESEND_API_KEY;
const FROM = process.env.DEVS_MAIL_FROM || "OpenGateHub <onboarding@resend.dev>";
const REPLY_TO = process.env.PREGUNTAS_MAIL_REPLYTO || "candelaria@opengatehub.com";
const LLAMADA = "https://strategy.opengatehub.com";

const TOQUES = [
  {
    col: "drip_d3", dias: 3,
    asunto: "Una que no está en el PDF",
    cuerpo: (pila) => `Hola${pila}!

Espero que las preguntas te hayan servido. Te dejo una que no puse en el PDF porque la uso más para mí que para el candidato:

Después de la entrevista, antes de decidir, me pregunto: ¿lo contrataría si mañana tuviera que darle mi contraseña de todo?

Suena exagerado, pero es la pregunta que más rápido me saca de la duda cuando alguien "parece bien" en el papel.

Si en algún momento querés que pensemos juntos tu búsqueda, la llamada sigue gratis: ${LLAMADA}

Cande`,
  },
  {
    col: "drip_d7", dias: 7,
    asunto: "El error que más veo",
    cuerpo: (pila) => `Hola${pila}!

Te cuento el error más común que veo en founders no técnicos contratando: eligen al que mejor explica, no al que mejor piensa. Y son cosas distintas — el que mejor explica a veces es el que mejor vendió la entrevista, no el proyecto.

Las preguntas del PDF están pensadas justo para eso: sacan a la luz cómo piensa alguien, no qué tan bien se presenta.

Si querés que lo miremos aplicado a tu caso puntual, es gratis: ${LLAMADA}

Cande`,
  },
  {
    col: "drip_d14", dias: 14,
    asunto: "Última de esta serie",
    cuerpo: (pila) => `Hola${pila}!

Esta es la última que te mando de esta serie — no quiero llenarte la casilla.

Si todavía no contrataste, la oferta sigue en pie: 30 minutos, gratis, y salís con un plan concreto para tu búsqueda. Sin vueltas: ${LLAMADA}

Y si ya contrataste, contame cómo te fue — me interesa de verdad.

Cande`,
  },
];

export default async function handler(req, res) {
  if (!KEY) return res.status(200).json({ ok: false, error: "sin RESEND_API_KEY" });
  const resend = new Resend(KEY);

  try {
    await sql`SELECT 1 FROM leads_preguntas LIMIT 1`;
  } catch {
    return res.status(200).json({ ok: true, enviados: {}, nota: "sin tabla leads_preguntas todavía" });
  }

  const enviados = {};
  const yaLeMande = new Set();
  for (const t of TOQUES) {
    enviados[t.col] = 0;
    const { rows } = await sql.query(
      `SELECT id, nombre, email FROM leads_preguntas
       WHERE email IS NOT NULL AND NOT drip_off AND ${t.col} IS NULL
         AND creado < NOW() - make_interval(days => $1)
       LIMIT 40`, [t.dias]);
    for (const r of rows) {
      if (yaLeMande.has(r.id)) continue;
      const pila = r.nombre ? " " + r.nombre.trim().split(/\s+/)[0] : "";
      try {
        await resend.emails.send({
          from: FROM, to: r.email, replyTo: REPLY_TO,
          subject: t.asunto, text: t.cuerpo(pila),
        });
        await sql.query(`UPDATE leads_preguntas SET ${t.col} = NOW() WHERE id = $1`, [r.id]);
        enviados[t.col]++;
        yaLeMande.add(r.id);
      } catch (e) {
        console.error(`drip-preguntas ${t.col} → ${r.email}:`, e.message);
      }
    }
  }
  return res.status(200).json({ ok: true, enviados });
}
