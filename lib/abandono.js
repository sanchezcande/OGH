// Quién apretó pagar y no pagó, con nombre y con cómo escribirle.
//
// Pedido de Cande (09/11, canal CEO): "cuando un lead se va del embudo, que reciba un mensaje al
// toque preguntando por qué no compró". El tamaño del agujero, medido el 10/11 sobre los últimos
// 30 días: **53 personas apretaron pagar y 12 pagaron**. Las otras 41 no tenían nombre.
//
// Por qué no lo tenían: `funnel_eventos` guarda fase, sid y fecha, y nada más. El sid es un número
// al azar del navegador (lib/embudo.js) y no estaba en ningún otro lado, así que un "tocó pagar"
// no se podía atar a una persona. Desde el 10/11 el formulario guarda ese sid junto a la ficha
// (`red_devs.sid`, lib/db.js), y con eso las dos puntas se juntan.
//
// OJO con lo que esto NO arregla: solo alcanza a quien llenó el formulario DESPUÉS del 10/11.
// A los 41 de los 30 días anteriores no los recupera nadie: su sid no quedó guardado. El número
// va a arrancar en cero y subir.
//
// Este archivo solo LEE. Mandar el mensaje es aparte, y el texto lo dicta Cande: no se inventa.
import { sql } from "@vercel/postgres";

/** Las fases que cuentan como "se fue estando por pagar", de más caliente a menos. */
export const FASES_ABANDONO = ["click_mp", "click_gumroad"];

/**
 * Los que apretaron pagar en la ventana pedida y no tienen compra.
 *
 * @param {object} opciones
 *   desdeMinutos  hace cuánto como mucho fue el clic (por defecto 7 días)
 *   hastaMinutos  y hace cuánto como poco: el colchón para no escribirle a alguien que está
 *                 pagando en este momento (Cande pidió ~10 minutos, no 0)
 * Devuelve [{ email, nombre, whatsapp, telegram, ig_contacto, pais, fase, cuando }], lo más
 * reciente primero. Nunca tira: sin base devuelve lista vacía.
 */
export async function sinComprar({ desdeMinutos = 60 * 24 * 7, hastaMinutos = 10 } = {}) {
  if (!process.env.POSTGRES_URL) return [];
  const { rows } = await sql`
    WITH clics AS (
      SELECT DISTINCT ON (e.sid) e.sid, e.fase, e.creado
      FROM funnel_eventos e
      WHERE e.sid IS NOT NULL
        AND (e.fase LIKE 'click_mp%' OR e.fase LIKE 'click_gumroad%')
        AND e.creado > now() - make_interval(mins => ${desdeMinutos})
        AND e.creado < now() - make_interval(mins => ${hastaMinutos})
      ORDER BY e.sid, e.creado DESC
    )
    SELECT r.email, r.nombre, r.whatsapp, r.telegram, r.ig_contacto, r.pais,
           c.fase, c.creado AS cuando
    FROM clics c
    JOIN red_devs r ON r.sid = c.sid
    -- Sin compra con ese mail. Las de baja (devolución) no cuentan como compra.
    WHERE NOT EXISTS (
      SELECT 1 FROM compras p WHERE lower(p.email) = lower(r.email) AND NOT p.baja
    )
    ORDER BY c.creado DESC`;
  return rows;
}

/** En qué moneda se estaba yendo, para que el mensaje no le hable del checkout equivocado. */
export const enPesos = (fase) => String(fase || "").startsWith("click_mp");
