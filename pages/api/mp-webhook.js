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
import { sql } from "@vercel/postgres";
import { Resend } from "resend";
import { camposCompra, ficha } from "../../lib/avisoCompra";
import { asegurarTablaCompras } from "../../lib/compras";
import { guardarEvento, hayBase } from "../../lib/db";
import { mandarMail } from "../../lib/mandarMail";
import { avisar } from "../../lib/notificar";

const CODIGO_URL = process.env.MP_CODIGO_URL || "https://get.opengatehub.com/l/acelerador-de-carrera/PARAVOS";
const DE = "Cande de OpenGateHub <cande@opengatehub.com>";
// Las ventas van al bot de ventas (@oghventas_bot), igual que las de Gumroad: ahí es donde ella
// las mira. Si ese bot no está configurado, `avisar` cae solo en el de los leads.
const VENTAS = { token: process.env.TELEGRAM_BOT_VENTAS, chat: process.env.TELEGRAM_CHAT_VENTAS };

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

/** Completa la fila con el código que terminó saliendo. La fila se inserta antes, porque es el
 *  candado contra el aviso repetido de MercadoPago, y el código se crea después: si se creara
 *  antes, cada aviso repetido crearía un código nuevo. */
async function guardarCodigo(id, codigo) {
  if (!hayBase() || !codigo) return;
  try {
    await sql`UPDATE compras SET codigo = ${codigo} WHERE venta_id = ${`mp-${id}`}`;
  } catch (e) {
    console.error("mp-webhook: no pude guardar el código:", e.message);
  }
}

/** El permalink del producto, sacado del link general: .../l/acelerador-de-carrera/PARAVOS */
const PERMALINK = (CODIGO_URL.match(/\/l\/([^/?#]+)/) || [])[1] || "acelerador-de-carrera";
const BASE_LINK = CODIGO_URL.slice(0, CODIGO_URL.indexOf("/l/") + 3 + PERMALINK.length);

/** El id interno del producto en Gumroad, buscado por su permalink. Se busca en vez de tenerlo en
 *  una variable de entorno para que no haya un id más que mantener a mano. */
async function idDelProducto(token) {
  const r = await fetch(`https://api.gumroad.com/v2/products?access_token=${encodeURIComponent(token)}`);
  if (!r.ok) throw new Error(`products devolvió ${r.status}`);
  const d = await r.json();
  const p = (d.products || []).find((x) => x.custom_permalink === PERMALINK || x.permalink === PERMALINK);
  if (!p) throw new Error(`no encontré el producto ${PERMALINK}`);
  return p.id;
}

/** Un código de 100% de UN SOLO USO para este pago.
 *
 *  Cande, 22/10: "pero cómo sabés que es la misma persona? puede haber entrado de otro browser".
 *  Tenía razón: con un código igual para todos, nada ata el pago con la entrada al curso, y encima
 *  el código se puede reusar (`patricio.pastor07` entró dos veces con el mismo mail). Con uno por
 *  pago las dos cosas se arreglan: se sabe quién entró con qué pago y no se puede compartir.
 *
 *  Si algo de esto falla, devuelve null y sale el código general. Un código repetido es un problema
 *  chico; que alguien pague y se quede sin curso, no. */
async function codigoUnico(id) {
  const token = process.env.GUMROAD_ACCESS_TOKEN;
  if (!token) return null;
  try {
    const producto = await idDelProducto(token);
    const nombre = `PESOS${String(id).replace(/\D/g, "").slice(-9)}`;
    const r = await fetch(`https://api.gumroad.com/v2/products/${encodeURIComponent(producto)}/offer_codes`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        access_token: token, name: nombre, offer_type: "percent",
        amount_off: "100", max_purchase_count: "1",
      }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || d.success === false) {
      throw new Error(`offer_codes devolvió ${r.status} ${JSON.stringify(d).slice(0, 120)}`);
    }
    return nombre;
  } catch (e) {
    console.error("mp-webhook: no pude crear el código único:", e.message);
    return null;
  }
}

/** Anota la venta y dice si es la PRIMERA vez que vemos este pago.
 *
 *  MercadoPago manda más de un aviso por el mismo pago (el 20/10 llegaron dos en el mismo minuto,
 *  `payment.created` y `payment.updated`), y sin esto cada uno mandaba otro mail con el código a
 *  la misma persona. El `venta_id` tiene un índice único, así que el que inserta primero gana y
 *  el segundo no devuelve fila.
 *
 *  Si la base falla, devuelve true y el mail sale igual: un mail repetido molesta, quedarse sin
 *  el código después de pagar no. */
async function anotarVenta(pago, id) {
  if (!hayBase()) return true;
  try {
    await asegurarTablaCompras();
    const { rows } = await sql`
      INSERT INTO compras (email, nombre, producto, precio, moneda, recurrencia, baja, origen, como_llego, pais, codigo, venta_id)
      VALUES (${(pago.payer?.email || "").trim().toLowerCase()},
              ${[pago.payer?.first_name, pago.payer?.last_name].filter(Boolean).join(" ").trim() || null},
              'Acelerador de Carrera Tech', ${pago.transaction_amount}, ${(pago.currency_id || "ars").toLowerCase()},
              NULL, FALSE, 'mercadopago', 'pagó en pesos', NULL,
              NULL, ${`mp-${id}`})
      ON CONFLICT (venta_id) WHERE venta_id IS NOT NULL DO NOTHING
      RETURNING id`;
    return rows.length > 0;
  } catch (e) {
    console.error("mp-webhook: no pude anotar la venta:", e.message);
    return true;
  }
}

const cuerpoMail = (nombre, link) => `Hola${nombre ? " " + nombre : ""},

Ya me llegó tu pago, gracias 🤍

Acá está tu acceso al Acelerador de Carrera Tech. El link ya viene con tu código puesto, no tenés que escribir nada:

${link}

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
      await avisar("Pago en pesos SIN procesar", { "Qué pasó": "falta MP_ACCESS_TOKEN en Vercel", "Pago": id }, VENTAS);
      return res.status(200).json({ ok: true, sinToken: true });
    }

    const { pago, error } = await traerPago(id, token);
    if (error || !pago) {
      console.error("mp-webhook:", error);
      await avisar("Pago en pesos sin verificar", { "Qué pasó": error || "MercadoPago no contestó", "Pago": id }, VENTAS);
      return res.status(200).json({ ok: true, noVerificado: true });
    }
    if (pago.status !== "approved") {
      return res.status(200).json({ ok: true, estado: pago.status });
    }

    const mail = (pago.payer?.email || "").trim();
    const nombre = (pago.payer?.first_name || "").trim();
    const monto = pago.transaction_amount;

    // Primero el candado: si este pago ya se procesó, este aviso es un repetido de MercadoPago y
    // el código ya salió. Contestar 200 y no hacer nada más.
    const primera = await anotarVenta(pago, id);
    if (!primera) return res.status(200).json({ ok: true, repetido: true });

    if (hayBase()) {
      // Queda en el mismo embudo que el resto, para poder contar cuántos pagan en pesos.
      try { await guardarEvento("mp_pagado", `mp-${id}`); } catch (e) { console.error("mp-webhook evento:", e.message); }
    }

    // Un código propio para este pago, de un solo uso. Si no sale, va el general.
    const propio = await codigoUnico(id);
    const link = propio ? `${BASE_LINK}/${propio}` : CODIGO_URL;
    await guardarCodigo(id, propio || (process.env.MP_CODIGO || "PARAVOS").toUpperCase());

    let mailOk = false, motivo = "sin mail del pagador";
    if (mail && process.env.RESEND_API_KEY) {
      const r = await mandarMail(new Resend(process.env.RESEND_API_KEY), {
        from: DE, to: mail, reply_to: "cande@opengatehub.com",
        subject: "Tu acceso al Acelerador de Carrera Tech",
        text: cuerpoMail(nombre, link),
      });
      mailOk = r.ok; motivo = r.ok ? "" : r.motivo;
    }

    // El aviso va SIEMPRE, salga o no el mail: si el mail falló, ella lo manda a mano y se
    // entera en el momento, que es lo que hoy no pasa.
    // Mismos campos que el aviso de Gumroad, para que la misma persona se pueda comparar: cuando
    // alguien paga en pesos llegan dos avisos, este y el de Gumroad al canjear el código.
    const f = await ficha(mail);
    await avisar("Pagó en pesos 💸", camposCompra({
      que: "Pagó en pesos por MercadoPago",
      email: mail, nombre, ficha: f,
      plata: `$${monto} ${(pago.currency_id || "ARS").toUpperCase()}`,
      codigo: propio || (process.env.MP_CODIGO || "PARAVOS").toUpperCase(),
      deDonde: f ? null : "pagó en pesos, todavía no está en la red de devs",
      extra: {
        "El código": mailOk
          ? `ya se lo mandé por mail${propio ? ", es solo suyo y de un solo uso" : " (el general, no pude crear uno propio)"}`
          : `NO salió el mail (${motivo}), mandáselo vos: ${link}`,
      },
    }), VENTAS);
    return res.status(200).json({ ok: true, mail: mailOk });
  } catch (e) {
    console.error("mp-webhook:", e.message);
    try { await avisar("El webhook de MercadoPago falló", { Error: e.message }, VENTAS); } catch (_) {}
    return res.status(200).json({ ok: true, error: true });
  }
}
