import { sql } from "@vercel/postgres";
import { Resend } from "resend";
import { hayBase } from "../../lib/db";
import { avisar } from "../../lib/notificar";

// Lead magnet para founders: "Las 9 preguntas que uso para entrevistar a un developer".
// Llega desde LinkedIn (PD de los posts) a /preguntas. Orden (Cande, 17/09):
//   1. guardar el lead (lo que más importa es tener el email)
//   2. mandarle el PDF por mail
//   3. avisarle a Cande por Telegram
// Nada de esto puede dejar al founder sin su PDF: si el mail falla, la página
// igual le muestra el link de descarga.
//
// Env en Vercel (los mismos que usa el goteo de devs):
//   RESEND_API_KEY, DEVS_MAIL_FROM (remitente verificado), POSTGRES_URL

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.DEVS_MAIL_FROM || "OpenGateHub <onboarding@resend.dev>";
const REPLY_TO = process.env.PREGUNTAS_MAIL_REPLYTO || "candelaria@opengatehub.com";
const SITIO = process.env.NEXT_PUBLIC_SITE_URL || "https://opengatehub.com";
export const PDF_PATH = "/guias/9-preguntas-entrevista-developer.pdf";
const LLAMADA = "https://strategy.opengatehub.com";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const limpiar = (v, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

async function guardar({ nombre, email, origen }) {
  await sql`
    CREATE TABLE IF NOT EXISTS leads_preguntas (
      id SERIAL PRIMARY KEY,
      nombre TEXT,
      email TEXT NOT NULL,
      origen TEXT,
      pedidos INT DEFAULT 1,
      creado TIMESTAMPTZ DEFAULT NOW(),
      actualizado TIMESTAMPTZ DEFAULT NOW()
    )`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS leads_preguntas_email ON leads_preguntas (email)`;
  // Si lo vuelve a pedir no duplicamos: sumamos el pedido.
  const { rows } = await sql`
    INSERT INTO leads_preguntas (nombre, email, origen)
    VALUES (${nombre}, ${email}, ${origen})
    ON CONFLICT (email) DO UPDATE SET pedidos = leads_preguntas.pedidos + 1, actualizado = NOW()
    RETURNING pedidos`;
  return rows[0]?.pedidos || 1;
}

function mail(nombre) {
  const pila = nombre ? ` ${nombre.split(" ")[0]}` : "";
  const link = SITIO + PDF_PATH;
  const texto = `Hola${pila}!

Acá tenés las 9 preguntas que uso para entrevistar developers: ${link}

Cada una tiene qué mide, las buenas y malas señales que escucho en la respuesta y qué repreguntar. Al final hay 4 más de repuesto.

Un consejo antes de usarlas: cuando termina de responder, contá hasta cinco antes de hablar. El que armó la respuesta sobre la marcha empieza a rellenar, y ese segundo intento es el que te sirve.

Si estás por contratar y querés que armemos juntos el plan, agendá una llamada gratis de 30 minutos: ${LLAMADA}

Y si tenés una duda sobre alguna pregunta, respondeme este mail.

Cande
Candelaria Sanchez, Founder & CTO, OpenGateHub`;

  const html = `<div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:560px;color:#111111;font-size:15px;line-height:1.6">
  <p>Hola${esc(pila)}!</p>
  <p>Acá tenés las 9 preguntas que uso para entrevistar developers.</p>
  <p style="margin:26px 0"><a href="${link}" style="background:#111111;color:#ffffff;text-decoration:none;padding:13px 22px;border-radius:4px;font-weight:600;display:inline-block">Descargar el PDF</a></p>
  <p>Cada una tiene qué mide, las buenas y malas señales que escucho en la respuesta y qué repreguntar. Al final hay 4 más de repuesto.</p>
  <p>Un consejo antes de usarlas: cuando termina de responder, contá hasta cinco antes de hablar. El que armó la respuesta sobre la marcha empieza a rellenar, y ese segundo intento es el que te sirve.</p>
  <p>Si estás por contratar y querés que armemos juntos el plan, <a href="${LLAMADA}" style="color:#CC5A50;font-weight:600">agendá una llamada gratis de 30 minutos</a>.</p>
  <p>Y si tenés una duda sobre alguna pregunta, respondeme este mail.</p>
  <p style="margin-top:28px">Cande<br><span style="color:#71717A;font-size:13px">Candelaria Sanchez, Founder &amp; CTO, OpenGateHub</span></p>
</div>`;
  return { texto, html };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const nombre = limpiar(req.body?.nombre, 120);
  const email = limpiar(req.body?.email, 200).toLowerCase();
  const origen = limpiar(req.body?.origen, 60) || "directo";
  // Campo trampa: los humanos no lo ven, los bots lo llenan.
  if (limpiar(req.body?.web)) return res.status(200).json({ ok: true, pdf: PDF_PATH });

  if (!email) return res.status(400).json({ error: "Falta el email" });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "Ese email no parece válido" });

  let guardado = false, pedidos = 1;
  if (hayBase()) {
    try {
      pedidos = await guardar({ nombre, email, origen });
      guardado = true;
    } catch (e) {
      console.error("preguntas-lead: no pude guardar en Postgres:", e.message);
    }
  }

  let mandado = false;
  if (resend) {
    try {
      const { texto, html } = mail(nombre);
      const r = await resend.emails.send({
        from: FROM, to: email, replyTo: REPLY_TO,
        subject: "Las 9 preguntas para entrevistar a un developer",
        text: texto, html,
      });
      mandado = !r?.error;
      if (r?.error) console.error("preguntas-lead: Resend:", r.error.message || r.error);
    } catch (e) {
      console.error("preguntas-lead: Resend falló:", e.message);
    }
  }

  await avisar("Founder bajó las 9 preguntas", {
    Nombre: nombre, Email: email, Origen: origen,
    Pedidos: pedidos > 1 ? `${pedidos} (ya lo había pedido)` : undefined,
    Guardado: guardado ? "sí" : "NO",
    "Mail enviado": mandado ? "sí" : "NO",
  });

  return res.status(200).json({ ok: true, mandado, pdf: PDF_PATH });
}
