// El link de pago en pesos del 1 a 1 ("Conseguí trabajo de dev en 4 semanas"), para Argentina.
//
// Cande, 09/11: el 1 a 1 no cierra (12 agendas, 6 llamadas, 0 ventas) y la objeción de las llamadas es
// la plata: 473 dólares de entrada, sin cuotas ni pesos. Este link cobra en pesos y deja pagar en cuotas
// con tarjeta: las cuotas las financia MercadoPago (el interés lo paga el que compra y a ella le llega el
// total). Lo manda ella en la llamada; el agente de DM nunca manda link de pago del 1 a 1.
//
// Mismo circuito que pagar-pesos.js: la preferencia lleva el webhook adentro y `external_reference`
// empieza con "1a1-", que es lo que el webhook mira para no mandarle el código del curso de 27.
//
// Config en Vercel:
//   MP_ACCESS_TOKEN     → el mismo de pagar-pesos
//   MP_PRECIO_1A1_ARS   → el precio en pesos (por defecto 720000, los USD 473 a ~1.520)
//
// Si MercadoPago no contesta, va al checkout en dólares de Gumroad: nadie que ya decidió se queda sin
// dónde pagar.
import { guardarEvento, hayBase } from "../../lib/db";
import { avisar } from "../../lib/notificar";

const SITIO = "https://www.opengatehub.com";
const PRECIO = Number(process.env.MP_PRECIO_1A1_ARS || 720000);
const CUOTAS = 12;
const LISTO = "https://docs.google.com/document/d/16OGpF3zBge4MKWxPW12FGJUdU7XMBmcQ-2zzfVahy2I/edit";
const DOLARES = "https://sanchezgcandelaria.gumroad.com/l/trabajo-en-4-semanas";
const VENTAS = { token: process.env.TELEGRAM_BOT_VENTAS, chat: process.env.TELEGRAM_CHAT_VENTAS };

async function caida(motivo, detalle) {
  try {
    await avisar("Alguien quiso pagar el 1 a 1 en pesos y no pudo", {
      "Qué pasó": motivo,
      ...(detalle ? { Detalle: detalle } : {}),
      "Mientras tanto": "lo mandé al checkout en dólares",
    }, VENTAS);
  } catch (_) {}
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    console.error("pagar-1a1: falta MP_ACCESS_TOKEN");
    await caida("falta MP_ACCESS_TOKEN en Vercel");
    return res.redirect(302, DOLARES);
  }

  try {
    const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{
          title: "Conseguí trabajo de dev en 4 semanas",
          description: "Acompañamiento 1 a 1 con Cande",
          quantity: 1,
          currency_id: "ARS",
          unit_price: PRECIO,
        }],
        // Hasta 12 cuotas con tarjeta, financiadas por MercadoPago.
        payment_methods: { installments: CUOTAS },
        notification_url: `${SITIO}/api/mp-webhook`,
        back_urls: { success: LISTO, pending: `${SITIO}/`, failure: `${SITIO}/` },
        auto_return: "approved",
        statement_descriptor: "OPENGATEHUB",
        external_reference: `1a1-pesos-${Date.now()}`,
      }),
    });
    const d = await r.json().catch(() => ({}));
    const ir = d.init_point || d.sandbox_init_point;
    if (!r.ok || !ir) {
      console.error("pagar-1a1: MercadoPago contestó", r.status, JSON.stringify(d).slice(0, 300));
      await caida(`MercadoPago contestó ${r.status}`, (d.message || d.error || "sin detalle").toString().slice(0, 200));
      return res.redirect(302, DOLARES);
    }
    if (hayBase()) {
      try { await guardarEvento("mp_checkout_1a1", null); } catch (e) { console.error("pagar-1a1 evento:", e.message); }
    }
    return res.redirect(302, ir);
  } catch (e) {
    console.error("pagar-1a1:", e.message);
    return res.redirect(302, DOLARES);
  }
}
