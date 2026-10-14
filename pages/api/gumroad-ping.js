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
import { avisar } from "../../lib/notificar";

const limpiar = (v, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Gumroad manda el precio en centavos. */
const plata = (centavos, moneda) => {
  const n = Number(centavos);
  if (!Number.isFinite(n)) return "—";
  return `${(n / 100).toFixed(2)} ${(moneda || "usd").toUpperCase()}`;
};

/** La ficha del comprador en la red de devs, por mail. Si no está, no es un lead conocido. */
async function ficha(email) {
  if (!process.env.POSTGRES_URL || !email) return null;
  try {
    const { rows } = await sql`
      SELECT nombre, pais, rol_principal, seniority, whatsapp, telegram, origen,
             como_llegaste, cv_url, creado
      FROM red_devs WHERE lower(email) = ${email} LIMIT 1`;
    return rows[0] || null;
  } catch (e) {
    console.error("gumroad-ping: no pude leer la ficha:", e.message);
    return null;
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

  const f = await ficha(email);
  const dias = f?.creado ? Math.round((Date.now() - new Date(f.creado)) / 86400000) : null;

  // De dónde salió: lo que ella necesita saber para repetirlo.
  const salio = f?.origen
    ? `${f.origen}${f.como_llegaste ? ` · dijo "${limpiar(f.como_llegaste, 80)}"` : ""}`
    : limpiar(b.referrer, 120) || "no está en la red de devs";

  const titulo = baja ? "Devolución en Gumroad" : prueba ? "Compra de PRUEBA" : "COMPRA NUEVA 🖤";
  const ok = await avisar(titulo, {
    Quién: nombre || f?.nombre || email || "—",
    WhatsApp: f?.whatsapp || "no tengo",
    Email: email || "—",
    Plata: plata(b.price, b.currency) + (b.recurrence ? ` (${limpiar(b.recurrence, 20)})` : ""),
    "De dónde salió": salio,
    País: f?.pais || limpiar(b.ip_country, 60) || "—",
    Rol: f ? `${f.rol_principal || "—"} · ${f.seniority || "—"}` : "—",
    "Entró a la red hace": dias === null ? "—" : dias === 0 ? "hoy" : `${dias} días`,
    CV: f?.cv_url ? "sí, lo tengo" : "no me lo pasó",
    Producto: limpiar(b.product_name, 120),
  }, { token: process.env.TELEGRAM_BOT_VENTAS, chat: process.env.TELEGRAM_CHAT_VENTAS });
  if (!ok) console.error("gumroad-ping: el aviso no salió", { email });

  // 200 siempre: un error acá le dice a Gumroad que reintente y la venta se avisaría dos veces.
  return res.status(200).json({ ok: true });
}
