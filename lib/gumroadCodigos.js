// Los códigos de 100% de Gumroad para entrar al Acelerador sin pagar ahí: el de cada pago en pesos
// (pages/api/mp-webhook.js) y el de cada dev de Cuba que escribe CUBA por DM (lib/dm/palabraClave.js).
// Vive acá y no en el webhook para que los dos caminos creen el código igual.
//
// Config en Vercel:
//   MP_CODIGO_URL         → el link de Gumroad con el código general puesto. Por defecto, el de PARAVOS.
//   GUMROAD_ACCESS_TOKEN  → para crear los códigos. Sin él no se crea ninguno y cada camino hace lo suyo.

export const CODIGO_URL = process.env.MP_CODIGO_URL || "https://get.opengatehub.com/l/acelerador-de-carrera/PARAVOS";

/** El permalink del producto, sacado del link general: .../l/acelerador-de-carrera/PARAVOS */
const PERMALINK = (CODIGO_URL.match(/\/l\/([^/?#]+)/) || [])[1] || "acelerador-de-carrera";
export const BASE_LINK = CODIGO_URL.slice(0, CODIGO_URL.indexOf("/l/") + 3 + PERMALINK.length);

/** El link de compra con el código puesto: la persona aprieta "I want this!" y entra sin pagar. */
export const linkConCodigo = (codigo) => `${BASE_LINK}/${codigo}`;

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

/** Si el producto ya tiene un código con ese nombre (Gumroad no deja crear dos iguales). */
async function existeCodigo(token, producto, nombre) {
  const r = await fetch(`https://api.gumroad.com/v2/products/${encodeURIComponent(producto)}/offer_codes?access_token=${encodeURIComponent(token)}`);
  if (!r.ok) return false;
  const d = await r.json().catch(() => ({}));
  return (d.offer_codes || []).some((c) => String(c.name || "").toLowerCase() === nombre.toLowerCase());
}

/** Crea en Gumroad un código de 100% de UN SOLO USO con ese nombre y lo devuelve. Si ya existía uno con ese nombre (un
 *  reintento después de crearlo y no poder mandarlo), devuelve ese. Si algo falla, devuelve null: qué hacer entonces
 *  lo decide quien lo pidió. */
export async function crearCodigo100(nombre) {
  const token = process.env.GUMROAD_ACCESS_TOKEN;
  if (!token) return null;
  let producto = null;
  try {
    producto = await idDelProducto(token);
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
    if (producto && (await existeCodigo(token, producto, nombre).catch(() => false))) return nombre;
    console.error("gumroad: no pude crear el código único:", e.message);
    return null;
  }
}
