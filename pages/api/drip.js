import { sql } from "@vercel/postgres";
import { Resend } from "resend";

// Campaña de goteo para la red de devs. La llama el cron de Vercel una vez por
// día (ver vercel.json). Cadencia (decisión Cande 17/09):
//   1 por día los primeros 3 días → 3 días de descanso → 1 cada 5 días, 3 veces.
//   días: 1, 2, 3, 7, 12, 17 después de aplicar.
// Cada toque queda marcado en la fila: aunque el endpoint se llame mil veces,
// cada persona recibe cada mail UNA sola vez. drip_off silencia a cualquiera.
const KEY = process.env.RESEND_API_KEY;
const FROM = process.env.DEVS_MAIL_FROM || "OpenGateHub <onboarding@resend.dev>";
const REPLY_TO = process.env.DEVS_MAIL_REPLYTO || "cv@in.opengatehub.com";
const GUIA = "https://get.opengatehub.com/l/acelerador-de-carrera";

const TOQUES = [
  {
    col: "drip_d1", dias: 1,
    asunto: "Viste el video?",
    cuerpo: (pila) => `Hola${pila}!

Ya estás adentro de mis búsquedas — eso es lo primero.

Lo segundo: en algún momento te va a tocar una entrevista conmigo. Y es la única entrevista en la que podés saber de antemano exactamente qué te van a preguntar y qué estoy midiendo con cada respuesta — porque las preguntas las escribí yo, y están todas en la guía que te muestro en el video.

Si no lo viste, miralo. La guía está acá, todavía con descuento: ${GUIA}

De los que aplican conmigo, los que llegan preparados son los que quedan.

Cande`,
  },
  {
    col: "drip_d2", dias: 2,
    asunto: "Tu CV tiene 6 segundos",
    cuerpo: (pila) => `Hola${pila}!

Un dato de mi lado del escritorio: un CV se mira 6 segundos. En 6 segundos se decide si hay entrevista o no hay nada.

Lo bravo: al que queda afuera nadie le avisa por qué. Sigue mandando el mismo CV, y pierde en esos 6 segundos una y otra vez sin enterarse.

En la guía hay un CV entero, real, con el porqué de cada línea: qué pasa el filtro automático y qué hace frenar al humano que lo abre. Es la diferencia entre existir o no existir en una búsqueda.

${GUIA}

Cande`,
  },
  {
    col: "drip_d3", dias: 3,
    asunto: "Sé exactamente qué te van a preguntar",
    cuerpo: (pila) => `Hola${pila}!

Porque las preguntas las hago yo 🙂

Y te cuento algo que sorprende a todos los que entrevisto: ninguna es técnica. Lo técnico ya lo vi en tu perfil — en la entrevista decido otra cosa. Y para esa otra cosa casi nadie viene preparado.

Los que sí, se notan en los primeros dos minutos. Y son los que quedan.

Están en la guía con lo que mido en cada una — más un bonus con otras que también hago: ${GUIA}

Después de este mail te dejo descansar unos días, prometido 🙂

Cande`,
  },
  {
    col: "drip_d7", dias: 7,
    asunto: "Un consejo antes de que te toque",
    cuerpo: (pila) => `Hola${pila}!

Un consejo honesto: cuando el puesto aparece, todo pasa rápido. Te escribo, coordinamos, y la entrevista es en días. Ahí ya no hay tiempo de prepararse.

Y es UNA entrevista. No hay segunda primera impresión.

La preparación se hace ahora, que no hay apuro. Para eso está la guía — no es teoría: es exactamente lo que yo miro cuando tengo un dev enfrente. ${GUIA}

Un puesto de estos paga en dólares. Prepararlo cuesta 27.

Cande`,
  },
  {
    col: "drip_d12", dias: 12,
    asunto: "Uno más del montón, o no",
    cuerpo: (pila) => `Hola${pila}!

No te digo nada nuevo: conseguir trabajo de dev se puso más difícil que nunca. Más gente aplicando, filtros automáticos en todos lados, la IA levantando la vara.

Eso significa que en cada búsqueda hay dos tipos de candidatos: los que se prepararon distinto, y el montón. No hay tercera categoría.

La guía existe para ponerte en la primera: dónde buscar para no ser uno de cien, qué escribir en el primer mensaje, qué contar sin que te lo pregunten. ${GUIA}

Cande`,
  },
  {
    col: "drip_d17", dias: 17,
    asunto: "Último mail sobre esto",
    cuerpo: (pila) => `Hola${pila}!

Este es el último mail que te mando sobre la guía. No soy de insistir, y ya te conté todo lo que tiene.

Solo te dejo esto: entrevisté a mucha gente, y la diferencia entre los que quedan y los que no casi nunca es el talento. Es la preparación. Lo vi demasiadas veces como para no decírtelo.

Queda acá por si la querés: ${GUIA}

Y lo importante: seguís en mi radar. Cuando haya una búsqueda para tu perfil, te escribo yo.

Que andes bien!

Cande`,
  },
];

const COLS = TOQUES.map((t) => t.col);

export default async function handler(req, res) {
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
      try {
        await resend.emails.send({
          from: FROM, to: r.email, replyTo: REPLY_TO,
          subject: t.asunto, text: t.cuerpo(pila),
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
