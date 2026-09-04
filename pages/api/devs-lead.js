import { Resend } from "resend";
import { guardarLead, hayBase } from "../../lib/db";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const limpiar = (v, max = 300) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const nombre = limpiar(req.body?.nombre, 120);
  const email = limpiar(req.body?.email, 200).toLowerCase();
  const seniority = limpiar(req.body?.seniority, 40);
  const buscando = limpiar(req.body?.buscando, 60);
  const trabadoEn = limpiar(req.body?.trabadoEn, 500);
  const origen = limpiar(req.body?.origen, 60) || "devs";

  if (!nombre || !email) return res.status(400).json({ error: "Falta nombre o email" });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "Email inválido" });

  const datos = { nombre, email, seniority, buscando, trabadoEn, origen };

  // La base es lo que queremos, pero un lead no se pierde por un problema de
  // infraestructura: si Postgres no está configurado o falla, seguimos al mail.
  let guardado = false;
  if (hayBase()) {
    try {
      await guardarLead(datos);
      guardado = true;
    } catch (e) {
      console.error("devs-lead: no pude guardar en Postgres:", e.message);
    }
  }

  if (resend) {
    try {
      await resend.emails.send({
        from: "OpenGateHub <onboarding@resend.dev>",
        to: "candelaria@opengatehub.com",
        subject: `Nuevo dev en la guía — ${nombre}`,
        html: `<div style="font-family:system-ui,sans-serif;max-width:560px;color:#1A1518">
          <div style="background:#0D0D0E;padding:20px 26px;border-radius:8px 8px 0 0">
            <h1 style="color:#fff;margin:0;font-size:17px">Nuevo dev en la guía</h1>
            <p style="color:#B9B2B5;margin:5px 0 0;font-size:13px">
              ${guardado ? "Guardado en la base" : "⚠️ NO se guardó en la base, solo llegó este mail"}
            </p>
          </div>
          <table style="width:100%;border-collapse:collapse;padding:20px 26px;background:#F6F3F4">
            <tr><td style="padding:14px 26px 4px;font-size:13px;color:#8E7E85;width:110px">Nombre</td>
                <td style="padding:14px 26px 4px;font-size:13px;font-weight:600">${nombre}</td></tr>
            <tr><td style="padding:4px 26px;font-size:13px;color:#8E7E85">Email</td>
                <td style="padding:4px 26px;font-size:13px;font-weight:600">
                  <a href="mailto:${email}" style="color:#CC5A50">${email}</a></td></tr>
            <tr><td style="padding:4px 26px;font-size:13px;color:#8E7E85">Seniority</td>
                <td style="padding:4px 26px;font-size:13px;font-weight:600">${seniority || "—"}</td></tr>
            <tr><td style="padding:4px 26px;font-size:13px;color:#8E7E85">Busca</td>
                <td style="padding:4px 26px;font-size:13px;font-weight:600">${buscando || "—"}</td></tr>
            <tr><td style="padding:4px 26px 16px;font-size:13px;color:#8E7E85;vertical-align:top">Dónde se traba</td>
                <td style="padding:4px 26px 16px;font-size:13px;font-weight:600">${trabadoEn || "—"}</td></tr>
          </table>
        </div>`,
      });
    } catch (e) {
      console.error("devs-lead: Resend falló:", e.message);
    }
  }

  // Nunca bloqueamos al usuario: si llegó hasta acá, para él el formulario anduvo.
  return res.status(200).json({ ok: true, guardado });
}
