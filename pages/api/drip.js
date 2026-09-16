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
const REPLY_TO = process.env.DEVS_MAIL_REPLYTO || "hubopengate@gmail.com";
const GUIA = "https://get.opengatehub.com/l/acelerador-de-carrera";

const TOQUES = [
  {
    col: "drip_d1", dias: 1,
    asunto: "Viste el video?",
    cuerpo: (pila) => `Hola${pila}!

Te escribo cortito: ya tengo tu aplicación y las búsquedas siguen su curso.

Mientras tanto, si no viste el video que te dejé después del form, miralo — ahí te cuento de la guía con la que llegás preparado a estas entrevistas: las 9 preguntas que hago, el CV que pasa el filtro, qué contar sin que te lo pregunten.

El descuento sigue por poco tiempo: ${GUIA}

Cuanto más preparado llegues, mejor puesto te puedo conseguir. Ahí ganamos los dos.

Cande`,
  },
  {
    col: "drip_d2", dias: 2,
    asunto: "Tu CV tiene 6 segundos",
    cuerpo: (pila) => `Hola${pila}!

Un dato de mi lado del escritorio: un CV se mira 6 segundos antes de decidir si se sigue leyendo o no. Y la mayoría muere ahí, no por falta de talento — por cómo está armado.

En la guía hay un CV entero, real, con el porqué de cada línea: qué pasa el filtro automático y qué hace que el humano que lo abre frene.

Está acá, con el descuento: ${GUIA}

Cande`,
  },
  {
    col: "drip_d3", dias: 3,
    asunto: "Ninguna de mis preguntas es técnica",
    cuerpo: (pila) => `Hola${pila}!

Algo que sorprende a casi todos los que entrevisto: mis 9 preguntas no son técnicas. Lo técnico ya lo veo en tu experiencia — lo que decido en la entrevista es otra cosa, y casi nadie viene preparado para eso.

Las 9 están en la guía, con lo que estoy midiendo en cada una. Leerlas antes de una entrevista cambia el partido.

${GUIA}

Después de este te dejo descansar unos días, prometido 🙂

Cande`,
  },
  {
    col: "drip_d7", dias: 7,
    asunto: "Un consejo antes de que te toque",
    cuerpo: (pila) => `Hola${pila}!

Te escribo con un consejo honesto: cuando un puesto aparece, todo pasa rápido — te contacto, coordinamos, y la entrevista es en días. Ahí ya no hay tiempo de prepararse. La preparación se hace ahora, que no hay apuro.

Para eso armé la guía: no es teoría, es exactamente lo que yo miro cuando entrevisto a un dev.

Todavía está con el descuento: ${GUIA}

Preparate tranquilo ahora, que cuando te toque quiero que la rompas.

Cande`,
  },
  {
    col: "drip_d12", dias: 12,
    asunto: "Lo que la IA cambió para los devs",
    cuerpo: (pila) => `Hola${pila}!

No te voy a decir nada que no sepas: conseguir trabajo como dev se puso más difícil. Más gente aplicando, filtros automáticos en todos lados, y la IA levantando la vara.

Lo que sí te digo: los que se preparan distinto quedan. Dónde buscar para no ser uno de cien, qué escribir en el primer mensaje, qué contar sin que te lo pregunten — eso es la guía, y es lo que separa al que queda del que sigue aplicando.

${GUIA}

Cande`,
  },
  {
    col: "drip_d17", dias: 17,
    asunto: "Último mail sobre esto",
    cuerpo: (pila) => `Hola${pila}!

Este es el último mail que te mando sobre la guía — no soy de insistir y ya te conté todo lo que tiene.

Queda acá por si algún día la querés: ${GUIA}

Lo importante: seguís en mi radar. Cuando aparezca una búsqueda que encaje con tu perfil, te escribo yo.

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
