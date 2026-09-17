import { put } from "@vercel/blob";
import { sql } from "@vercel/postgres";
import { avisar } from "../../lib/notificar";

// Recibe el webhook de Resend cuando un dev responde a cv@in.opengatehub.com
// con su CV adjunto. Guarda el PDF en Blob (privado), lo linkea a su fila de
// red_devs por el email del remitente, y avisa por Telegram.
//
// Seguridad sin secreto de firma: solo se procesan mails cuyo remitente YA
// existe en red_devs. Un desconocido que escriba a esa casilla no genera nada.
export const config = { api: { bodyParser: { sizeLimit: "15mb" } } };

const RESEND_KEY = process.env.RESEND_API_KEY;

async function bajarAdjunto(a, emailId) {
  // Resend manda el contenido base64 en el payload cuando es chico; si no,
  // deja una URL o hay que pedirlo por API.
  if (a.content) return Buffer.from(a.content, "base64");
  const url = a.download_url || a.url;
  if (url) {
    const r = await fetch(url, { headers: RESEND_KEY ? { Authorization: `Bearer ${RESEND_KEY}` } : {} });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
  }
  if (emailId && a.id && RESEND_KEY) {
    const r = await fetch(`https://api.resend.com/emails/${emailId}/attachments/${a.id}`,
      { headers: { Authorization: `Bearer ${RESEND_KEY}` } });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const evt = req.body || {};
    // Caja negra temporal: guardar el payload crudo para depurar la forma real.
    try {
      await sql`CREATE TABLE IF NOT EXISTS webhook_debug (id SERIAL PRIMARY KEY, payload JSONB, creado TIMESTAMPTZ DEFAULT NOW())`;
      await sql`INSERT INTO webhook_debug (payload) VALUES (${JSON.stringify(evt).slice(0, 50000)})`;
    } catch {}
    if (evt.type && evt.type !== "email.received") return res.status(200).json({ ok: true, ignorado: evt.type });
    const d = evt.data || evt;

    const remitente = String(d.from?.email || d.from || "").match(/[^\s<>"]+@[^\s<>"]+/)?.[0]?.toLowerCase();
    if (!remitente) return res.status(200).json({ ok: true, ignorado: "sin remitente" });

    // Solo gente que ya está en la red. Lo demás se ignora en silencio.
    const { rows } = await sql`SELECT id, nombre FROM red_devs WHERE lower(email) = ${remitente} LIMIT 1`;
    if (!rows.length) return res.status(200).json({ ok: true, ignorado: "remitente desconocido" });
    const dev = rows[0];

    const adjuntos = (d.attachments || []).filter((a) => {
      const n = (a.filename || a.name || "").toLowerCase();
      return n.endsWith(".pdf") || n.endsWith(".doc") || n.endsWith(".docx");
    });
    if (!adjuntos.length) {
      await avisar("Respuesta de dev SIN CV adjunto", { Nombre: dev.nombre, Email: remitente });
      return res.status(200).json({ ok: true, ignorado: "sin adjunto" });
    }

    let guardados = 0;
    for (const a of adjuntos.slice(0, 3)) {
      const datos = await bajarAdjunto(a, d.email_id || d.id);
      if (!datos || !datos.length) continue;
      const nombreArchivo = a.filename || a.name || `cv-${dev.id}.pdf`;
      const { url } = await put(`cvs-red/${nombreArchivo}`, datos, {
        access: "private",
        contentType: a.content_type || "application/pdf",
        addRandomSuffix: true,
      });
      await sql`UPDATE red_devs SET cv_url = ${url} WHERE id = ${dev.id}`;
      guardados++;
    }

    await avisar(guardados ? "📎 CV guardado y linkeado" : "CV llegó pero no pude bajarlo", {
      Nombre: dev.nombre,
      Email: remitente,
      Archivos: adjuntos.map((a) => a.filename || a.name).join(", "),
      Guardados: guardados,
    });
    return res.status(200).json({ ok: true, guardados });
  } catch (e) {
    console.error("cv-inbound:", e.message);
    return res.status(200).json({ ok: false });
  }
}
