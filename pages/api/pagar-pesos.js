// El link de pago en pesos, hecho por nosotros y no a mano desde el panel.
//
// Cande, 19/10: "que sea automático". El webhook (`mp-webhook.js`) ya manda el código solo cuando
// MercadoPago confirma el pago, pero para que MercadoPago avise hay que decirle a dónde. Un link
// armado a mano en el panel de MercadoPago (los `mpago.li/...`) no lleva esa dirección adentro, así
// que el aviso puede no llegar nunca y el comprador se queda esperando igual que antes.
//
// Acá la preferencia se crea por API con `notification_url` escrita adentro: MercadoPago se
// compromete a avisar a esa URL por ese pago. Es la única forma de que el circuito cierre siempre.
//
// Además, el que paga cae directo en el link de Gumroad con el código puesto (`back_urls.success`),
// así entra al curso en el momento sin esperar el mail. El mail sale igual, por si cierra la
// pestaña.
//
// Config en Vercel:
//   MP_ACCESS_TOKEN  → el token productivo de la app "Checkout Pro"
//   MP_PRECIO_ARS    → el precio en pesos (por defecto 39750, que es lo que cobraba el link viejo)
//   MP_CODIGO_URL    → el link de Gumroad con el código puesto (el mismo que usa mp-webhook)
//
// Si MercadoPago no contesta, NO se muestra un error: se manda al checkout en dólares de siempre.
// Alguien que ya decidió comprar no puede quedarse sin dónde pagar porque se cayó una API.
import { guardarEvento, hayBase } from "../../lib/db";
import { avisar } from "../../lib/notificar";

const SITIO = "https://www.opengatehub.com";
const PRECIO = Number(process.env.MP_PRECIO_ARS || 39750);
const CODIGO_URL = process.env.MP_CODIGO_URL || "https://get.opengatehub.com/l/acelerador-de-carrera/PARAVOS";
const DOLARES = "https://get.opengatehub.com/l/acelerador-de-carrera";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    console.error("pagar-pesos: falta MP_ACCESS_TOKEN");
    try {
      await avisar("Alguien quiso pagar en pesos y no pudo", {
        "Qué pasó": "falta MP_ACCESS_TOKEN en Vercel",
        "Mientras tanto": "lo mandé al checkout en dólares",
      }, { token: process.env.TELEGRAM_BOT_VENTAS, chat: process.env.TELEGRAM_CHAT_VENTAS });
    } catch (_) {}
    return res.redirect(302, DOLARES);
  }

  try {
    const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{
          title: "Acelerador de Carrera Tech",
          description: "11 módulos y 2 PDFs para conseguir trabajo como dev en el exterior",
          quantity: 1,
          currency_id: "ARS",
          unit_price: PRECIO,
        }],
        // Lo que hace que el código salga solo: MercadoPago avisa a esta URL por este pago.
        notification_url: `${SITIO}/api/mp-webhook`,
        back_urls: { success: CODIGO_URL, pending: `${SITIO}/`, failure: `${SITIO}/` },
        auto_return: "approved",
        statement_descriptor: "OPENGATEHUB",
        external_reference: `curso-pesos-${Date.now()}`,
      }),
    });
    const d = await r.json().catch(() => ({}));
    const ir = d.init_point || d.sandbox_init_point;
    if (!r.ok || !ir) {
      console.error("pagar-pesos: MercadoPago contestó", r.status, JSON.stringify(d).slice(0, 300));
      try {
        await avisar("Alguien quiso pagar en pesos y no pudo", {
          "Qué pasó": `MercadoPago contestó ${r.status}`,
          Detalle: (d.message || d.error || "sin detalle").toString().slice(0, 200),
          "Mientras tanto": "lo mandé al checkout en dólares",
        }, { token: process.env.TELEGRAM_BOT_VENTAS, chat: process.env.TELEGRAM_CHAT_VENTAS });
      } catch (_) {}
      return res.redirect(302, DOLARES);
    }
    // Mismo embudo que el resto: así se puede contar cuántos llegan al checkout en pesos contra
    // cuántos terminan pagando (`mp_pagado`), que es la pregunta que abrió todo esto.
    if (hayBase()) {
      try { await guardarEvento("mp_checkout", null); } catch (e) { console.error("pagar-pesos evento:", e.message); }
    }
    return res.redirect(302, ir);
  } catch (e) {
    console.error("pagar-pesos:", e.message);
    return res.redirect(302, DOLARES);
  }
}
