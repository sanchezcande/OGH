// Un solo formato para TODOS los avisos de compra.
//
// Cande, 22/10: "los mensajes tienen que tener los mismos campos, si son de compra, uno tiene que
// decir el código si tiene código, otro pesos y otro dólares pero mismo formato para todos porque
// es re confuso así".
//
// Antes había dos formatos distintos: el de Gumroad traía once campos y el de MercadoPago cuatro,
// así que la misma persona aparecía dos veces y con fichas que no se podían comparar. Ahora los dos
// arman los mismos campos, en el mismo orden, y lo único que cambia es el valor: la plata va en
// dólares o en pesos, y el código aparece cuando hubo uno.
import { sql } from "@vercel/postgres";

/** La ficha del comprador en la red de devs, por mail. Si no está, no es un lead conocido. */
export async function ficha(email) {
  if (!process.env.POSTGRES_URL || !email) return null;
  try {
    const { rows } = await sql`
      SELECT nombre, pais, rol_principal, seniority, whatsapp, telegram, origen,
             como_llegaste, cv_url, creado
      FROM red_devs WHERE lower(email) = ${email} LIMIT 1`;
    return rows[0] || null;
  } catch (e) {
    console.error("avisoCompra: no pude leer la ficha:", e.message);
    return null;
  }
}

const corto = (v, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * Los campos del aviso, iguales para los dos caminos.
 *
 * @param {object} d
 *   que      qué pasó, en una línea ("Compró en dólares", "Pagó en pesos", "Entró con el código")
 *   email    mail de la persona
 *   nombre   si lo sabemos
 *   plata    "27.00 USD" o "$39.750 ARS", ya armado
 *   codigo   el código usado, si hubo
 *   producto nombre del producto
 *   ficha    lo que devolvió ficha(), o null
 *   deDonde  de dónde salió, si el camino lo sabe mejor que la ficha
 *   extra    pares sueltos que solo tienen sentido en ese camino
 */
export function camposCompra(d) {
  const f = d.ficha || null;
  const dias = f?.creado ? Math.round((Date.now() - new Date(f.creado)) / 86400000) : null;
  const salio = d.deDonde
    || (f?.origen ? `${f.origen}${f.como_llegaste ? ` · dijo "${corto(f.como_llegaste, 80)}"` : ""}` : "")
    || "no está en la red de devs";
  return {
    "Qué pasó": d.que,
    Quién: corto(d.nombre) || f?.nombre || d.email || "—",
    WhatsApp: f?.whatsapp || "no tengo",
    Email: d.email || "—",
    Plata: d.plata || "—",
    Código: d.codigo || "sin código",
    "De dónde salió": salio,
    País: f?.pais || d.pais || "—",
    Rol: f ? `${f.rol_principal || "—"} · ${f.seniority || "—"}` : "—",
    "Entró a la red hace": dias === null ? "—" : dias === 0 ? "hoy" : `${dias} días`,
    CV: f?.cv_url ? "sí, lo tengo" : "no me lo pasó",
    Producto: corto(d.producto, 120) || "Acelerador de Carrera Tech",
    ...(d.extra || {}),
  };
}
