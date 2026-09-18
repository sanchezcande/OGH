import { sql } from "@vercel/postgres";
import { Resend } from "resend";

// Cadena de nurture para founders que bajaron "9 de las preguntas" (leads_preguntas).
// Versión de Cande + su mentor (18/09), reemplaza la anterior: progresión
// problema → costo → autoridad → método → objeción → cierre. Cada mail apunta
// directo a la strategy call, no a "usá las preguntas" (eso ya lo tienen).
// Cadencia igual que el goteo de devs: 1, 2, 3, descanso, 7, 12, 17 días.
const KEY = process.env.RESEND_API_KEY;
const FROM = process.env.DEVS_MAIL_FROM || "OpenGateHub <onboarding@resend.dev>";
const REPLY_TO = process.env.PREGUNTAS_MAIL_REPLYTO || "candelaria@opengatehub.com";
const LLAMADA = "https://strategy.opengatehub.com";

const TOQUES = [
  {
    col: "drip_d1", dias: 1,
    asunto: "El problema no es encontrar candidatos",
    cuerpo: (pila) => `Hola${pila}!

Te mandé las 9 preguntas, pero me quedó algo dando vueltas.

La mayoría de los founders piensa que contratar un buen developer es un problema de encontrar candidatos.

No lo es.

El problema aparece cuando tenés 3 candidatos que parecen buenos y tenés que decidir cuál realmente puede hacer el trabajo.

Porque un buen CV, buen inglés y 5 años de React no necesariamente significan que esa persona sea la correcta para tu producto.

Eso es justamente lo que trabajo con founders: bajar la búsqueda a criterios concretos antes de empezar a entrevistar.

Si estás por contratar, podemos revisar tu caso juntos.

Agendá tu strategy call: ${LLAMADA}

Cande`,
  },
  {
    col: "drip_d2", dias: 2,
    asunto: "El costo real de un mal developer",
    cuerpo: (pila) => `Hola${pila}!

Hay algo que suele subestimarse cuando un founder contrata a su primer developer.

El costo no es solamente lo que le pagás.

Es lo que pasa si dos meses después descubrís que no puede trabajar de forma autónoma.

Perdés tiempo.
El producto se demora.
Vos terminás haciendo management técnico.
Y eventualmente tenés que volver a contratar.

Por eso prefiero dedicar bastante más tiempo al filtro ANTES de contratar.

Si me contás qué estás construyendo, qué necesitás desarrollar y qué presupuesto tenés, podemos revisar cómo estructuraría la búsqueda en tu caso.

Agendá tu strategy call: ${LLAMADA}

Cande`,
  },
  {
    col: "drip_d3", dias: 3,
    asunto: "Lo que no se ve en un CV",
    cuerpo: (pila) => `Hola${pila}!

Después de trabajar varios años con developers, hay algo que aprendí.

La gente suele entrevistar demasiado para comprobar si alguien sabe programar.

Eso es solo una parte.

También quiero saber:

¿Puede trabajar sin que alguien le diga qué hacer cada hora?
¿Sabe comunicar un problema antes de que se convierta en un desastre?
¿Puede entrar a un código que no conoce y orientarse?
¿Entiende el producto o solamente ejecuta tareas?
¿Lo dejarías trabajando directamente con un cliente?

Son cosas bastante difíciles de ver en un CV.

Y son exactamente las cosas que podemos definir antes de que empieces a entrevistar.

Si estás en esa etapa, podemos verlo juntos.

Agendá tu strategy call: ${LLAMADA}

Cande`,
  },
  {
    col: "drip_d7", dias: 7,
    asunto: "El orden que casi nadie sigue",
    cuerpo: (pila) => `Hola${pila}!

Un error que veo bastante.

Primero empiezan a entrevistar.

Después conocen candidatos.

Después comparan impresiones.

Y recién al final intentan decidir qué significa realmente "buen developer".

Yo haría exactamente al revés.

Primero definimos qué necesita demostrar la persona.

Después diseñamos el proceso para medirlo.

Y recién ahí empezamos a buscar.

Parece una diferencia pequeña, pero cambia bastante la contratación.

Si querés, hacemos ese ejercicio con tu búsqueda actual.

Agendá tu strategy call: ${LLAMADA}

Cande`,
  },
  {
    col: "drip_d12", dias: 12,
    asunto: "Podés hacerlo vos mismo",
    cuerpo: (pila) => `Hola${pila}!

Probablemente estés pensando: "Entiendo el punto, pero puedo entrevistar developers yo mismo".

Y sí. Podés.

La pregunta es si tenés una forma objetiva de decidir qué evaluar, cómo evaluarlo y qué señales mirar, cuando no sos vos quien va a escribir el código.

Porque entrevistar a alguien que te cae bien y que sabe hablar de tecnología es bastante fácil.

Saber si esa persona va a funcionar durante los próximos 12 meses en tu empresa es otra cosa.

Ese es el problema que quiero ayudarte a resolver.

Si estás contratando ahora, podemos mirar tu caso juntos.

Agendá tu strategy call: ${LLAMADA}

Cande`,
  },
  {
    col: "drip_d17", dias: 17,
    asunto: "Último mail mío sobre esto",
    cuerpo: (pila) => `Hola${pila}!

Último mail mío sobre esto.

Si ya contrataste a alguien, podés ignorar este mensaje.

Pero si todavía estás buscando y querés asegurarte de que el proceso esté bien armado antes de tomar una decisión, hablemos.

En 30 minutos podemos revisar:

• Qué perfil necesitás realmente
• Qué debería evaluar el proceso
• Qué presupuesto tiene sentido
• Dónde veo los principales riesgos de tu búsqueda

Y si creo que puedo ayudarte más allá de la call, te voy a explicar cómo trabajo.

Si no, también te lo voy a decir.

Agendá tu strategy call: ${LLAMADA}

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
