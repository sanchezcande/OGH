import { sql } from "@vercel/postgres";
import { Resend } from "resend";

// Campaña de goteo para la red de devs. La llama el cron de Vercel una vez por
// día (ver vercel.json). Cadencia (decisión Cande 17/09):
//   1 por día los primeros 3 días → 3 días de descanso → 1 cada 5 días, 3 veces.
//   días: 1, 2, 3, 7, 12, 17 después de aplicar.
// Cada toque queda marcado en la fila: aunque el endpoint se llame mil veces,
// cada persona recibe cada mail UNA sola vez. drip_off silencia a cualquiera.
//
// Versión de Cande + su mentor (18/09): el que llega ya vio el video y ya
// conoce la oferta, así que los mails no vuelven a explicarla. Atacan las
// razones por las que todavía no compró (ya sé entrevistarme, mi CV está
// bien, no tengo plata, lo hago después...). Sin repetir "$500", "top 5%"
// ni "ninguna excusa" del video: eso ya lo escuchó, acá se construye marca
// a largo plazo, no se insiste con lo mismo.
const KEY = process.env.RESEND_API_KEY;
const FROM = process.env.DEVS_MAIL_FROM || "OpenGateHub <onboarding@resend.dev>";
const REPLY_TO = process.env.DEVS_MAIL_REPLYTO || "cv@in.opengatehub.com";
// El link de cada mail pasa por opengatehub.com/api/ir, que anota el click y redirige
// a Gumroad. Así se mide el CTR por mail sin el click tracking de Resend, que reescribe
// los links con un dominio suyo y castiga la entregabilidad (ver pages/api/ir.js).
const SITIO = process.env.NEXT_PUBLIC_SITE_URL || "https://opengatehub.com";
const GUIA = (col) => `${SITIO}/api/ir?a=guia&m=${col.replace("drip_", "")}`;

// El mail sale en texto Y en HTML. El HTML está por una sola razón: sin él no hay
// forma de medir nada. Las aperturas se cuentan con un pixel que va adentro del
// HTML, y los clicks los cuenta Resend reescribiendo los links del HTML. Un mail
// de texto plano no tiene dónde poner ninguna de las dos cosas, y por eso hasta
// el 04/10/2026 esta cadena no tuvo ni open rate ni CTR.
// Se mantiene a propósito sin diseño: esto tiene que seguir pareciendo un mail
// que escribió una persona, no una newsletter. Misma tipografía del sistema,
// mismo texto, y el único link con el coral de la marca.
const _esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function aHtml(texto) {
  const cuerpo = _esc(texto)
    .split("\n")
    .map((l) => {
      if (!l.trim()) return "";
      const link = l.match(/^(.*?):\s*(https?:\/\/\S+)$/);
      if (link) return `<p style="margin:0 0 18px"><a href="${link[2]}" style="color:#cc5a50">${link[1]}</a></p>`;
      if (l.startsWith("\u2022 ")) return `<p style="margin:0 0 6px;padding-left:14px">${l}</p>`;
      return `<p style="margin:0 0 16px">${l}</p>`;
    })
    .filter(Boolean)
    .join("\n");
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1a1518;max-width:560px">\n${cuerpo}\n</div>`;
}


// Reescritos el 04/10/2026 con la devolución de Hooman: los asuntos eran genéricos
// y los mails largos. Ahora cada mail son 4 a 6 líneas y un solo link, y el asunto
// lleva el nombre y arranca con un verbo de ella (pará, mirá, preparate), que es lo
// que hace que suene a una persona y no a una marca.
// Cande, 04/10: el asunto tiene que entenderse solo. Los que dejaban la situación sin
// nombrar ("no sos vos", "los que quedan") los rechazó por crípticos.
// Lo que NO se usa, aunque lo sugirió Hooman: asuntos que prometen un puesto concreto
// ("tengo un rol abierto", "aplicá a este puesto"). El mail vende la guía, no un
// trabajo, y ese malentendido ya está medido: 5 de 13 llamadas salieron del embudo sin
// entender qué se vendía, y Leonel lo dijo textual ("me dio la sensación de que me
// querían vender algo").
const _conNombre = (pila, frase) =>
  pila ? `${pila.trim()}, ${frase}` : frase.charAt(0).toUpperCase() + frase.slice(1);

const TOQUES = [
  {
    col: "drip_d1", dias: 1,
    asunto: (pila) => _conNombre(pila, "pará antes de mandar otro CV"),
    cuerpo: (pila, guia) => `Hola${pila},

Siete segundos y medio. Eso es lo que mira una persona un CV antes de decidir si sigue leyendo. Está medido.

Lo que más me hace descartar a alguien no es el stack, es cómo está escrito.

Te armé una guía con lo que miro yo, y con un CV entero corregido adentro. 27 dólares.

La quiero: ${guia}

Cande`,
  },
  {
    col: "drip_d2", dias: 2,
    asunto: (pila) => _conNombre(pila, "si no te contestan no es tu perfil"),
    cuerpo: (pila, guia) => `Hola${pila},

Mandás CVs y no te contesta nadie, y pensás que sos vos.

Casi nunca sos vos. Es dónde estás aplicando y cómo estás llegando.

Las dos cosas están adentro.

Verla: ${guia}

Cande`,
  },
  {
    col: "drip_d3", dias: 3,
    asunto: (pila) => _conNombre(pila, "te lo digo antes de tu próxima entrevista"),
    cuerpo: (pila, guia) => `Hola${pila},

Un montón de entrevistas ya están perdidas antes de que te pregunten nada. No por saber poco, sino por llegar sin saber qué contar.

Eso se entrena, y es la mitad de la guía.

Quiero prepararme: ${guia}

Cande`,
  },
  {
    col: "drip_d7", dias: 7,
    asunto: (pila) => _conNombre(pila, "qué hacen distinto los que quedan"),
    cuerpo: (pila, guia) => `Hola${pila},

Los que quedan no contestan mejor que vos. Cuentan cosas que nadie les preguntó.

Cuáles, y en qué momento, está adentro.

Quiero verlo: ${guia}

Cande`,
  },
  {
    col: "drip_d12", dias: 12,
    asunto: (pila) => _conNombre(pila, "preparate antes de que te llamen"),
    cuerpo: (pila, guia) => `Hola${pila},

El día que te llaman ya estás corriendo: adaptar el CV, mirar la empresa, pensar ejemplos.

Todo eso es muchísimo más fácil antes.

La quiero: ${guia}

Cande`,
  },
  {
    col: "drip_d17", dias: 17,
    asunto: (pila) => _conNombre(pila, "último mail sobre esto"),
    cuerpo: (pila, guia) => `Hola${pila},

Último mail que te mando sobre esto, prometido.

No te puedo prometer que una guía te consiga trabajo. Lo que sí te puedo dar es el proceso que uso yo para evaluar gente.

Y si nos cruzamos en una búsqueda, quiero que llegues preparado.

Acceder: ${guia}

Cande`,
  },
];

const COLS = TOQUES.map((t) => t.col);

export default async function handler(req, res) {
  // Solo el cron de Vercel (manda "Bearer CRON_SECRET"): sin esto, cualquiera que pegara
  // la URL varias veces le mandaba toda la secuencia de mails a todos en minutos.
  const s = process.env.CRON_SECRET;
  if (s && req.headers.authorization !== `Bearer ${s}`) return res.status(401).json({ error: "no" });
  if (!KEY) return res.status(200).json({ ok: false, error: "sin RESEND_API_KEY" });
  const resend = new Resend(KEY);

  for (const c of COLS) {
    await sql.query(`ALTER TABLE red_devs ADD COLUMN IF NOT EXISTS ${c} TIMESTAMPTZ`);
  }
  await sql`ALTER TABLE red_devs ADD COLUMN IF NOT EXISTS drip_off BOOLEAN NOT NULL DEFAULT FALSE`;

  const enviados = {};
  // Máximo UN mail por persona por corrida: si alguien entró con días acumulados,
  // recibe la escalera de a un escalón por día, nunca todos juntos.
  const yaLeMande = new Set();
  for (const t of TOQUES) {
    enviados[t.col] = 0;
    // Solo aplicantes del formulario (tienen email), que no estén silenciados,
    // que no hayan recibido ESTE toque, con la antigüedad que corresponde.
    const { rows } = await sql.query(
      `SELECT id, nombre, email FROM red_devs
       WHERE email IS NOT NULL AND NOT drip_off AND ${t.col} IS NULL
         AND origen = 'formulario'
         AND creado < NOW() - make_interval(days => $1)
       LIMIT 40`, [t.dias]);
    for (const r of rows) {
      if (yaLeMande.has(r.id)) continue;
      const pila = r.nombre ? " " + r.nombre.trim().split(/\s+/)[0] : "";
      const cuerpo = t.cuerpo(pila, GUIA(t.col));   // una sola vez: va igual en texto y en HTML
      try {
        await resend.emails.send({
          from: FROM, to: r.email, replyTo: REPLY_TO,
          subject: t.asunto(pila), text: cuerpo, html: aHtml(cuerpo),
        });
        await sql.query(`UPDATE red_devs SET ${t.col} = NOW() WHERE id = $1`, [r.id]);
        enviados[t.col]++;
        yaLeMande.add(r.id);
      } catch (e) {
        console.error(`drip ${t.col} → ${r.email}:`, e.message);
      }
    }
  }
  return res.status(200).json({ ok: true, enviados });
}
