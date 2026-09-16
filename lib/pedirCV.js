// Email automático al dev que completó el form: le pedimos CV y portfolio.
//
// Misma filosofía que notificar.js: dispará y olvidate. Si Resend falla, el
// candidato YA está guardado; el mail se puede mandar a mano después.
//
// Config en Vercel:
//   RESEND_API_KEY   → la misma que usa la calculadora
//   DEVS_MAIL_FROM   → remitente verificado, ej: "Cande de OpenGateHub <cande@opengatehub.com>"
//                      (sin esto usa el sandbox de Resend, que SOLO entrega a tu propia casilla)
import { Resend } from "resend";

const KEY = process.env.RESEND_API_KEY;
const FROM = process.env.DEVS_MAIL_FROM || "OpenGateHub <onboarding@resend.dev>";
const REPLY_TO = process.env.DEVS_MAIL_REPLYTO || "hubopengate@gmail.com";

export async function pedirCV(nombre, email) {
  if (!KEY) return false;
  const pila = (nombre || "").trim().split(/\s+/)[0] || "";
  try {
    const resend = new Resend(KEY);
    await resend.emails.send({
      from: FROM,
      to: email,
      replyTo: REPLY_TO,
      subject: "Recibí tu aplicación — mandame tu CV",
      text:
`Hola${pila ? " " + pila : ""}!

Recibí tu aplicación, gracias por postularte.

Para completarla: por favor respondé este email con tu CV (PDF) y tu portfolio si tenés.

Con eso ya quedás dentro de las búsquedas activas.

Cande
Founder & CTO · OpenGateHub

P.D.: Viste el video? Ahí te cuento de la guía con la que llegás preparado a estas entrevistas. El descuento es por poco tiempo, y las búsquedas salen pronto: https://get.opengatehub.com/l/acelerador-de-carrera`,
    });
    return true;
  } catch (e) {
    console.error("pedirCV: no salió el mail:", e.message);
    return false;
  }
}
