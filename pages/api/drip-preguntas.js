import { sql } from "@vercel/postgres";
import { Resend } from "resend";

// Cadena de nurture para founders que bajaron "9 de las preguntas" (leads_preguntas).
// Misma arquitectura psicológica que el goteo de devs (ver /api/drip.js), adaptada
// al dolor del founder en vez del dolor del dev (Cande, 18/09):
//   1, 2, 3, descanso, 7, 12, 17 días. Seis golpes, cada uno con un ángulo distinto:
//   D1 refuerza el valor único, D2 mete el costo real de una mala contratación,
//   D3 da un bonus + promesa de descanso, D7 juega la inevitabilidad ("no hay
//   segunda primera impresión"), D12 arma el binario (dos tipos de founder),
//   D17 cierra honesto con la puerta abierta.
// Producto = la llamada gratis (no un $27 como en devs), así que la urgencia acá
// es el costo de NO prepararse, nunca un descuento por vencer.
const KEY = process.env.RESEND_API_KEY;
const FROM = process.env.DEVS_MAIL_FROM || "OpenGateHub <onboarding@resend.dev>";
const REPLY_TO = process.env.PREGUNTAS_MAIL_REPLYTO || "candelaria@opengatehub.com";
const LLAMADA = "https://strategy.opengatehub.com";

const TOQUES = [
  {
    col: "drip_d1", dias: 1,
    asunto: "Ya las probaste?",
    cuerpo: (pila) => `Hola${pila}!

Estas 9 preguntas no las vas a encontrar en un curso de management ni en un blog de RRHH: son las que uso yo, entrevistando developers, afinadas durante años de hacerlo mal y corregir.

Si ya entrevistaste a alguien con ellas, contame cómo te fue. Me interesa de verdad.

Y si todavía no las usaste: guardalas donde las vayas a ver antes de tu próxima entrevista técnica. La diferencia entre elegir bien y elegir mal casi nunca se nota en el papel. Se nota en cómo responde a estas 9.

Si querés que las apliquemos juntos a tu búsqueda puntual, la llamada sigue gratis: ${LLAMADA}

Cande`,
  },
  {
    col: "drip_d2", dias: 2,
    asunto: "Una mala contratación te cuesta el 30% de un sueldo anual",
    cuerpo: (pila) => `Hola${pila}!

Un dato que uso seguido: según el Departamento de Trabajo de EEUU, una contratación equivocada te cuesta, como mínimo, el 30% del sueldo anual de esa persona. Y eso sin contar los meses de proyecto frenado.

La mayoría de los founders no técnicos no tiene forma de filtrar esto antes de que pase, porque no saben qué preguntar, y el que entrevistan sabe programar mejor que ellos hablar de programación.

Las 9 preguntas están para eso. Y si querés que te arme el plan completo para tu búsqueda puntual, es gratis: ${LLAMADA}

Cande`,
  },
  {
    col: "drip_d3", dias: 3,
    asunto: "La pregunta que más veces me salvó",
    cuerpo: (pila) => `Hola${pila}!

Te dejo una que no está en el PDF porque la uso más para mí que para el candidato: después de la entrevista, antes de decidir, me pregunto esto. ¿Lo contrataría si mañana tuviera que darle mi contraseña de todo?

Suena exagerado, pero es la que más rápido me saca de la duda cuando alguien "parece bien" en el papel.

Después de este mail te dejo tranquilo unos días, prometido 🙂

Si en algún momento querés que pensemos juntos tu búsqueda: ${LLAMADA}

Cande`,
  },
  {
    col: "drip_d7", dias: 7,
    asunto: "Un consejo antes de que armes el equipo",
    cuerpo: (pila) => `Hola${pila}!

Un consejo honesto: cuando por fin encontrás candidatos, todo pasa rápido. Entrevistás, decidís, y en unos días ya está trabajando en tu producto. No hay mucho margen para pensarlo dos veces después.

Y es UNA entrevista. No hay segunda primera impresión.

El filtro se arma ANTES, cuando no hay apuro. Por eso la llamada es gratis y no vende nada: el objetivo es que llegues a esa entrevista con un criterio armado, no improvisando con lo que se te ocurra en el momento.

30 minutos, sin costo: ${LLAMADA}

Cande`,
  },
  {
    col: "drip_d12", dias: 12,
    asunto: "Dos tipos de founders",
    cuerpo: (pila) => `Hola${pila}!

En mi experiencia hay dos tipos de founders no técnicos: los que arman un filtro antes de contratar, y los que aprenden el filtro después de una mala contratación. Los segundos son la mayoría, y son los que después me escriben.

No hay tercera categoría.

Si todavía no armaste el tuyo, prefiero ayudarte antes que después. La llamada sigue gratis: ${LLAMADA}

Cande`,
  },
  {
    col: "drip_d17", dias: 17,
    asunto: "Último mail sobre esto",
    cuerpo: (pila) => `Hola${pila}!

Este es el último mail que te mando sobre esto. No soy de insistir, y ya te conté todo lo que tenía para decirte.

Solo te dejo esto: hablé con muchos founders no técnicos, y la diferencia entre los que contratan bien y los que no casi nunca es el ojo para la tecnología. Es tener un filtro armado antes de necesitarlo. Lo vi demasiadas veces como para no decírtelo.

Si todavía no armaste el tuyo, la oferta sigue en pie: 30 minutos, gratis. ${LLAMADA}

Y si ya contrataste, contame cómo te fue. Me interesa de verdad.

Cande`,
  },
];

const COLS = TOQUES.map((t) => t.col);

export default async function handler(req, res) {
  if (!KEY) return res.status(200).json({ ok: false, error: "sin RESEND_API_KEY" });
  const resend = new Resend(KEY);

  try {
    await sql`SELECT 1 FROM leads_preguntas LIMIT 1`;
  } catch {
    return res.status(200).json({ ok: true, enviados: {}, nota: "sin tabla leads_preguntas todavía" });
  }
  for (const c of COLS) {
    await sql.query(`ALTER TABLE leads_preguntas ADD COLUMN IF NOT EXISTS ${c} TIMESTAMPTZ`);
  }
  await sql`ALTER TABLE leads_preguntas ADD COLUMN IF NOT EXISTS drip_off BOOLEAN NOT NULL DEFAULT FALSE`;

  const enviados = {};
  // Máximo UN mail por persona por corrida, igual que en el goteo de devs.
  const yaLeMande = new Set();
  for (const t of TOQUES) {
    enviados[t.col] = 0;
    const { rows } = await sql.query(
      `SELECT id, nombre, email FROM leads_preguntas
       WHERE email IS NOT NULL AND NOT drip_off AND ${t.col} IS NULL
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
        await sql.query(`UPDATE leads_preguntas SET ${t.col} = NOW() WHERE id = $1`, [r.id]);
        enviados[t.col]++;
        yaLeMande.add(r.id);
      } catch (e) {
        console.error(`drip-preguntas ${t.col} → ${r.email}:`, e.message);
      }
    }
  }
  return res.status(200).json({ ok: true, enviados });
}
