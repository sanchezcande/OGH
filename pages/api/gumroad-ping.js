// Aviso a Telegram cada vez que alguien compra en Gumroad.
//
// Cande, 14/10: "que me lleguen todas las compras y de donde salieron y sus números de Wpp
// así los recibo". Antes se enteraba por el mail de Gumroad, que no dice quién es la persona
// en su embudo ni cómo contactarla, y había que ir a buscarla al CRM a mano.
//
// Gumroad lo llama "Ping": se configura en Settings → Advanced → Ping endpoint con la URL
// https://opengatehub.com/api/gumroad-ping y manda un POST form-encoded por cada venta.
//
// Config en Vercel:
//   TELEGRAM_BOT_VENTAS   → el token de @oghventas_bot (si falta, usa el bot de los leads)
//   TELEGRAM_CHAT_VENTAS  → el chat SOLO de ventas (si falta, usa TELEGRAM_CHAT_ID)
//   GUMROAD_PING_SECRET   → opcional; si está, la URL tiene que llevar ?k=<secret>
//
// El aviso nunca puede fallar la respuesta: Gumroad reintenta si no le contestamos 200, y
// un reintento sería un segundo mensaje por la misma venta. Se contesta 200 siempre.
import { sql } from "@vercel/postgres";
import { camposCompra, ficha } from "../../lib/avisoCompra";
import { asegurarTablaCompras, esCodigoDePesos } from "../../lib/compras";
import { avisar } from "../../lib/notificar";
import { PAGO_EN_PESOS, correspondeOferta, linkOferta, mensajeOferta } from "../../lib/ofertaWhatsapp";

const limpiar = (v, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Los códigos de 100% que NO son una venta nueva: son alguien entrando a la plataforma después
// de haber pagado por otro lado, o un acceso que Cande regaló.
const CODIGOS = {
  [(process.env.MP_CODIGO || "PARAVOS").toLowerCase()]: PAGO_EN_PESOS,
  testimonio: "acceso a cambio de un testimonio",
  paravos: PAGO_EN_PESOS,
};

/** Gumroad manda el precio en centavos. */
const plata = (centavos, moneda) => {
  const n = Number(centavos);
  if (!Number.isFinite(n)) return "—";
  return `${(n / 100).toFixed(2)} ${(moneda || "usd").toUpperCase()}`;
};

/** Deja la venta anotada en la base. Hasta el 20/10 la compra solo existía en Gumroad y en el
 *  aviso de Telegram: la base no sabía quién había comprado (`leads_devs.compro` estaba en false
 *  para los 11 compradores), así que para contestar "quién compró y de dónde salió" había que
 *  abrir Gumroad a mano. Se guarda junto con el origen tal como estaba el día de la venta: el
 *  lead puede editarse después y la foto del momento es la que sirve para medir.
 *
 *  Nunca puede romper el aviso ni la respuesta: si la base está caída, se loguea y sigue. */
async function anotarCompra(datos) {
  if (!process.env.POSTGRES_URL) return;
  await asegurarTablaCompras();
  await sql`
    INSERT INTO compras (email, nombre, producto, precio, moneda, recurrencia, baja, origen, como_llego, pais, codigo, venta_id)
    VALUES (${datos.email}, ${datos.nombre}, ${datos.producto}, ${datos.precio}, ${datos.moneda},
            ${datos.recurrencia}, ${datos.baja}, ${datos.origen}, ${datos.como_llego}, ${datos.pais},
            ${datos.codigo || null}, ${datos.ventaId})
    ON CONFLICT (venta_id) WHERE venta_id IS NOT NULL DO NOTHING`;
}

/** Lo que ya compró esa persona antes de esta venta: con eso se sabe si ya tiene el 1 a 1, o si ya había
 *  entrado al curso (el código de pesos general se puede canjear dos veces, y un reintento de Gumroad trae la
 *  misma venta). No cuenta el pago en pesos que anotó mp-webhook (venta mp-...): es esta misma compra.
 *  Devuelve null si no se pudo saber. */
async function comprasAnteriores(email, ventaId) {
  if (!process.env.POSTGRES_URL || !email) return null;
  try {
    const { rows } = await sql`
      SELECT producto FROM compras
      WHERE lower(email) = ${email} AND NOT baja
        AND venta_id IS DISTINCT FROM ${ventaId} AND (venta_id IS NULL OR venta_id NOT LIKE 'mp-%')`;
    return rows.map((r) => String(r.producto || ""));
  } catch (e) {
    console.error("gumroad-ping: no pude ver las compras anteriores:", e.message);
    return null;
  }
}

/**
 * Hooman, 28/10: el 1 a 1 se ofrece después de que pagó el curso, y a mano. El aviso trae un botón que abre
 * WhatsApp con el mensaje escrito (lib/ofertaWhatsapp.js). Sin un número confiable, o si no se pudo ver si ya
 * era comprador, el texto va en el aviso para mandarlo a mano. Nunca puede romper el aviso de la venta.
 */
function armarOferta({ b, f, antes, producto, baja, gratis, porQue, nombre }) {
  try {
    const recurrente = String(b.is_recurring_charge || "") === "true";
    if (!correspondeOferta({ producto, baja, gratis, porQue, recurrente })) return { wa: null, oferta: null };
    if (antes?.some((p) => /trabajo de dev/i.test(p))) return { wa: null, oferta: null };   // ya tiene el 1 a 1
    if (antes?.some((p) => /acelerador/i.test(p))) {
      return { wa: null, oferta: { "Ofrecele el 1 a 1": "ya había entrado al curso antes: fijate si ya se lo ofreciste" } };
    }
    // El nombre sale de la ficha, como el número: el de Gumroad es el del titular de la tarjeta o del PayPal.
    const quien = f?.nombre || nombre;
    const aMano = (por) => ({ wa: null, oferta: { "Ofrecele el 1 a 1": `${por}, mandale esto a mano: ${mensajeOferta(quien)}` } });
    if (antes === null) return aMano("no pude ver si ya era comprador (fijate antes)");
    const wa = linkOferta({ whatsapp: f?.whatsapp, pais: f?.pais, nombre: quien });
    if (wa) return { wa, oferta: null };
    return aMano(f?.whatsapp ? "no pude armar el link de WhatsApp con su número" : "no tengo su WhatsApp");
  } catch (e) {
    console.error("gumroad-ping: no pude armar la oferta:", e.message);
    return { wa: null, oferta: null };
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const secreto = process.env.GUMROAD_PING_SECRET;
  if (secreto && req.query?.k !== secreto) return res.status(403).json({ error: "no" });

  const b = req.body || {};
  const email = limpiar(b.email, 200).toLowerCase();
  const nombre = limpiar(b.full_name, 120);
  const prueba = String(b.test || "") === "true";
  // Una devolución o una disputa llegan por el mismo ping: no son una venta nueva.
  const baja = String(b.refunded || "") === "true" || String(b.disputed || "") === "true";

  // Cande, 22/10: "me llegan raras en orden los mensajes de chat". Pasaba esto: por cada pago en
  // pesos le llegaban DOS avisos con minutos de diferencia, "Pagó en pesos" del webhook de
  // MercadoPago y después "COMPRA NUEVA" de este ping cuando la persona canjeaba el código. El
  // segundo decía 0 dólares y a veces con otro mail (el de MercadoPago no siempre es el mismo),
  // así que parecían dos personas y una regalada. No es una venta nueva: es la misma entrando.
  const codigo = limpiar(b.offer_code || b.discount_code, 40).toLowerCase();
  const gratis = Number(b.price) === 0;
  const porQue = gratis ? CODIGOS[codigo] || (esCodigoDePesos(codigo) ? PAGO_EN_PESOS : null) : null;
  const titulo = baja
    ? "Devolución en Gumroad"
    : prueba ? "Compra de PRUEBA"
    : porQue ? "Entró al curso ✅"
    : gratis ? "Entró con un código de 100% ✅"
    : "COMPRA NUEVA 🖤";

  const producto = limpiar(b.product_name, 120);
  const ventaId = limpiar(b.sale_id, 80) || null;
  const [f, antes] = await Promise.all([ficha(email), comprasAnteriores(email, ventaId)]);
  const { wa, oferta } = armarOferta({ b, f, antes, producto, baja, gratis, porQue, nombre });
  const que = baja ? "Devolución" : prueba ? "Compra de PRUEBA"
    : porQue ? `Entró al curso, ${porQue}`
    : gratis ? "Entró con un código de 100%"
    : "Compró en dólares";
  const ok = await avisar(titulo, camposCompra({
    que, email, nombre, codigo: codigo ? codigo.toUpperCase() : null,
    plata: plata(b.price, b.currency) + (b.recurrence ? ` (${limpiar(b.recurrence, 20)})` : ""),
    producto, ficha: f,
    deDonde: f ? null : limpiar(b.referrer, 120) || null,
    pais: limpiar(b.ip_country, 60) || null,
    extra: {
      ...(porQue ? { "Ojo": "no es una venta nueva, es la misma persona entrando a la plataforma" } : {}),
      ...oferta,
    },
  }), {
    token: process.env.TELEGRAM_BOT_VENTAS, chat: process.env.TELEGRAM_CHAT_VENTAS,
    boton: wa ? { texto: `Ofrecerle el 1 a 1 por WhatsApp (+${wa.numero})`, url: wa.url } : null,
  });
  if (!ok) console.error("gumroad-ping: el aviso no salió", { email });

  // La venta queda anotada DESPUÉS del aviso: si la base falla, ella se entera igual por Telegram,
  // que es lo que no puede perderse. Una compra de prueba no se guarda.
  if (!prueba) {
    try {
      await anotarCompra({
        email, nombre: nombre || f?.nombre || null, producto: producto || null,
        precio: Number.isFinite(Number(b.price)) ? Number(b.price) / 100 : null,
        moneda: (limpiar(b.currency, 10) || "usd").toLowerCase(),
        recurrencia: limpiar(b.recurrence, 20) || null, baja,
        origen: f?.origen || null, como_llego: f?.como_llegaste || null,
        pais: f?.pais || limpiar(b.ip_country, 60) || null,
        codigo: codigo ? codigo.toUpperCase() : null,
        ventaId,
      });
    } catch (e) {
      console.error("gumroad-ping: no pude anotar la compra:", e.message);
    }
  }

  // 200 siempre: un error acá le dice a Gumroad que reintente y la venta se avisaría dos veces.
  return res.status(200).json({ ok: true });
}
