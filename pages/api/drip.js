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
const GUIA = "https://get.opengatehub.com/l/acelerador-de-carrera";

const TOQUES = [
  {
    col: "drip_d1", dias: 1,
    asunto: "No es otro curso",
    cuerpo: (pila) => `Hola${pila}!

Vi que llegaste hasta el video.

Y quiero aclarar algo porque quizás pensaste: "otro curso más para conseguir trabajo".

No.

No te enseño a programar.

Te enseño a conseguir que te contraten con el conocimiento que ya tenés.

Porque podés ser muy buen developer y aun así:

• tener un CV que no pasa el filtro
• aplicar a puestos donde competís contra cientos de personas
• responder mal una pregunta de entrevista
• no saber vender tu experiencia
• ponerte nervioso y no mostrar lo que realmente sabés

Y esas cosas tienen muchísimo que ver con las oportunidades que terminás consiguiendo.

Armé la guía justamente para trabajar todo eso.

Si viste el video y todavía no la compraste, acá podés acceder.

Quiero la guía: ${GUIA}

Cande`,
  },
  {
    col: "drip_d2", dias: 2,
    asunto: "El problema puede ser tu CV",
    cuerpo: (pila) => `Hola${pila}!

Hay algo que veo constantemente.

Developers que son perfectamente capaces de hacer el trabajo, pero no consiguen entrevistas.

Y entonces empiezan a pensar:

"Hay demasiada competencia."
"Ahora con la IA está imposible."
"Las empresas no están contratando."
"Mi perfil no es suficientemente bueno."

A veces sí.

Pero muchas veces el problema empieza mucho antes de la entrevista.

Tu CV.
Dónde estás aplicando.
Cómo estás presentándote.
Qué estás diciendo en ese primer contacto.

Si estás haciendo todo eso bien, tu búsqueda cambia bastante.

En la guía te muestro exactamente cómo lo abordo yo cuando estoy evaluando perfiles para mis búsquedas.

Todavía podés acceder por el precio especial de este mes.

Ver la guía: ${GUIA}

Cande`,
  },
  {
    col: "drip_d3", dias: 3,
    asunto: "Lo que pasa antes de la primera pregunta",
    cuerpo: (pila) => `Hola${pila}!

Una cosa que quizás te sorprenda.

Muchas entrevistas se pierden antes de que el entrevistador haga la primera pregunta.

No porque seas mal developer.

Sino porque llegás sin haber preparado cómo comunicar lo que sabés hacer.

Cuando te preguntan por un proyecto, ¿sabés qué contar?

Cuando te preguntan por un problema que resolviste, ¿sabés qué parte destacar?

Cuando te preguntan algo que no sabés, ¿sabés cómo responder sin quedar mal?

Y cuando termina la entrevista, ¿sabés qué decir para que se acuerden de vos?

Eso es entrenable.

Y es una de las cosas que trabajé dentro de la guía.

Si tenés entrevistas próximamente, prefiero que llegues preparado.

Quiero prepararme: ${GUIA}

Cande`,
  },
  {
    col: "drip_d7", dias: 7,
    asunto: "Lo que hacen los candidatos que quedan",
    cuerpo: (pila) => `Hola${pila}!

Hay candidatos que responden exactamente lo que les preguntan.

Y hay otros que hacen algo diferente.

Ayudan al entrevistador a entender por qué deberían contratarlos.

No esperan a que les hagan veinte preguntas perfectas.

Saben cuándo contar algo.

Saben qué contexto dar.

Saben mostrar ownership.

Saben hablar de resultados, no solamente de tareas.

Y, sobre todo, hacen que sea fácil imaginarse trabajando con ellos.

Eso no significa inventar cosas ni vender humo.

Significa aprender a comunicar mejor el valor que ya tenés.

Es una de las diferencias que más quiero que entiendas cuando hagas la guía.

Acceder a la guía: ${GUIA}

Cande`,
  },
  {
    col: "drip_d12", dias: 12,
    asunto: "No esperes a tener la entrevista",
    cuerpo: (pila) => `Hola${pila}!

Si estás buscando trabajo activamente, hay una decisión que para mí no tiene mucho sentido.

Esperar a tener una entrevista para empezar a prepararte.

Porque cuando aparece la oportunidad, ya estás corriendo.

Tenés que adaptar el CV.
Preparar la entrevista.
Investigar la empresa.
Pensar ejemplos.
Practicar cómo contar tu experiencia.

Y mientras tanto, seguís aplicando a otros puestos.

Es mucho más fácil hacer todo esto antes.

Por eso hice la guía como algo práctico: no para que consumas horas de teoría, sino para que puedas agarrarla y aplicar lo que dice en tu próxima búsqueda.

El precio especial sigue disponible este mes.

Quiero la guía: ${GUIA}

Cande`,
  },
  {
    col: "drip_d17", dias: 17,
    asunto: "Último mail que te mando sobre esto",
    cuerpo: (pila) => `Hola${pila}!

Último mail que te mando sobre esto.

Si no estás buscando trabajo ahora, perfecto. Probablemente no lo necesites todavía.

Pero si estás buscando una buena oportunidad y sabés que tus próximas entrevistas importan, yo no dejaría la preparación para después.

La competencia cambió.

Hay más developers buscando las mismas oportunidades y las empresas tienen más formas de filtrar candidatos.

No puedo garantizarte que una guía vaya a conseguirte un trabajo.

Lo que sí puedo hacer es darte el proceso que uso para preparar y evaluar candidatos, para que llegues a esas oportunidades mucho mejor preparado.

La guía sigue a 27 dólares durante este mes.

Acceder a la guía: ${GUIA}

Y si nos cruzamos en una búsqueda, quiero que llegues preparado.

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
