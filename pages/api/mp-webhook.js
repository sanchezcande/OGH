// Checkout automático en pesos: MercadoPago avisa que cobró y el código sale solo.
//
// Cande, 19/10: "se puede hacer un checkout que paguen mercadopago y les salga el código
// enseguida?". Hasta hoy el link de pesos era un link suelto: cobraba y no le avisaba a nadie,
// así que entre que alguien pagaba y entraba al curso había tres pasos a mano (mandar el
// comprobante por Instagram, que ella lo viera, que ella mandara el código). Si alguien pagaba
// de madrugada, esperaba hasta la mañana.
//
// Qué hace: MercadoPago manda un POST por cada pago. Acá NO se le cree al POST: se le pregunta
// a MercadoPago por ese pago con el token, y recién si contesta `approved` sale el código. Sin
// esa consulta, cualquiera que supiera la URL se mandaba un POST y se llevaba el curso gratis.
//
// Config en Vercel:
//   MP_ACCESS_TOKEN    → el token productivo de la app "Checkout Pro" (Credenciales de producción)
//   MP_CODIGO_URL      → el link de Gumroad con el código puesto. Por defecto, el de PARAVOS.
//   RESEND_API_KEY     → ya está, es el de los goteos
//   TELEGRAM_*         → ya están, para que a Cande le llegue el aviso igual
//
// Siempre contesta 200, incluso cuando algo falla: MercadoPago reintenta mientras no reciba un
// 200 y cada reintento sería otro mail a la misma persona. Lo que salió mal queda en el log y
// en el aviso de Telegram, que es donde ella lo va a ver.
import { Resend } from "resend";
import { guardarEvento, hayBase } from "../../lib/db";
import { mandarMail } from "../../lib/mandarMail";
import { avisar } from "../../lib/notificar";

const CODIGO_URL = process.env.MP_CODIGO_URL || "https://get.opengatehub.com/l/acelerador-de-carrera/PARAVOS";
const DE = "Cande de OpenGateHub <cande@opengatehub.com>";

/** El id del pago viene en tres formas distintas según cómo MercadoPago mande el aviso. */
function idDelPago(req) {
  const q = req.query || {};
  const b = req.body || {};
  if (q["data.id"]) return String(q["data.id"]);
  if (b?.data?.id) return String(b.data.id);
  if (q.id && (q.topic === "payment" || q.type === "payment")) return String(q.id);
  if (b?.type === "payment" && b?.id) return String(b.id);
  return null;
}

/** Le pregunta a MercadoPago por el pago. Es la única fuente de verdad: el POST no alcanza. */
async function traerPago(id, token) {
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return { error: `MercadoPago contestó ${r.status}` };
  return { pago: await r.json() };
}

const cuerpoMail = (nombre) => `Hola${nombre ? " " + nombre : ""},

Ya me llegó tu pago, gracias 🤍

Acá está tu acceso al Acelerador de Carrera Tech. El link ya viene con tu código puesto, no tenés que escribir nada:

${CODIGO_URL}

Apretá "I want this!" y te deja entrar sin pagar nada más, porque ya pagaste en pesos.

Son 11 módulos y 2 PDFs. Lo mirás en una tarde.

Cualquier cosa contestame este mail o escribime por Instagram, lo leo yo.

Cande`;

export default async function handler(req, res) {
  // MercadoPago usa GET para probar la URL cuando la configurás en el panel.
  if (req.method === "GET") return res.status(200).json({ ok: true, listo: true });
  if (req.method !== "POST") return res.status(405).end();

  const token = process.env.MP_ACCESS_TOKEN;
  try {
    const id = idDelPago(req);
    // Un aviso que no es de un pago (MercadoPago manda varios tipos) no es un error.
    if (!id) return res.status(200).json({ ok: true, ignorado: true });
    if (!token) {
      console.error("mp-webhook: falta MP_ACCESS_TOKEN");
      await avisar("Pago en pesos SIN procesar", { "Qué pasó": "falta MP_ACCESS_TOKEN en Vercel", "Pago": id });
      return res.status(200).json({ ok: true, sinToken: true });
    }

    const { pago, error } = await traerPago(id, token);
    if (error || !pago) {
      console.error("mp-webhook:", error);
      await avisar("Pago en pesos sin verificar", { "Qué pasó": error || "MercadoPago no contestó", "Pago": id });
      return res.status(200).json({ ok: true, noVerificado: true });
    }
    if (pago.status !== "approved") {
      return res.status(200).json({ ok: true, estado: pago.status });
    }

    const mail = (pago.payer?.email || "").trim();
    const nombre = (pago.payer?.first_name || "").trim();
    const monto = pago.transaction_amount;

    if (hayBase()) {
      // Queda en el mismo embudo que el resto, para poder contar cuántos pagan en pesos.
      try { await guardarEvento("mp_pagado", `mp-${id}`); } catch (e) { console.error("mp-webhook evento:", e.message); }
    }

    let mailOk = false, motivo = "sin mail del pagador";
    if (mail && process.env.RESEND_API_KEY) {
      const r = await mandarMail(new Resend(process.env.RESEND_API_KEY), {
        from: DE, to: mail, reply_to: "cande@opengatehub.com",
        subject: "Tu acceso al Acelerador de Carrera Tech",
        text: cuerpoMail(nombre),
      });
      mailOk = r.ok; motivo = r.ok ? "" : r.motivo;
    }

    // El aviso va SIEMPRE, salga o no el mail: si el mail falló, ella lo manda a mano y se
    // entera en el momento, que es lo que hoy no pasa.
    await avisar("Pagó en pesos 💸", {
      Quién: nombre || "sin nombre",
      Mail: mail || "sin mail",
      Pagó: `$${monto} ARS`,
      Código: mailOk ? "ya se lo mandé por mail" : `NO salió el mail (${motivo}), mandáselo vos: ${CODIGO_URL}`,
    });
    return res.status(200).json({ ok: true, mail: mailOk });
  } catch (e) {
    console.error("mp-webhook:", e.message);
    try { await avisar("El webhook de MercadoPago falló", { Error: e.message }); } catch (_) {}
    return res.status(200).json({ ok: true, error: true });
  }
}
