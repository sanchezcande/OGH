import React from "react";
import Head from "next/head";
import Link from "next/link";
import {
  Wrap, Eyebrow, H1, H2, H3Tight as H3, Lead, Firma, Resp, P, Cierre,
} from "../components/prosa";
import DATOS from "../data/datos-devs.json";

/**
 * La pagina que contesta la pregunta que de verdad escribe un dev: como consigo trabajo.
 *
 * Por que existe (Cande, 19/11/2026: "hace todo para aparecer"). Hasta hoy el sitio entero le
 * hablaba a la empresa que contrata. Cuando alguien le pregunta a ChatGPT o a Perplexity como
 * conseguir trabajo de developer, no habia una sola pagina nuestra que contestara eso, asi que no
 * habia nada que citar. Esta es esa pagina.
 *
 * Como esta escrita, y por que: cada respuesta arranca con la respuesta (nada de preambulo),
 * entra en 40 a 60 palabras y se entiende sola, fuera de la pagina. Los modelos extraen pasajes,
 * no paginas. Los numeros salen del informe de /datos-developers-latam, que son datos propios de
 * los 744 developers de `red_devs`: nada inventado y nada de otra fuente sin link.
 *
 * Si se cambia un numero, se cambia tambien en /datos-developers-latam y al reves.
 */

// Los numeros salen del mismo dato que /datos-developers-latam, que rearma
// `node scripts/datos_devs.mjs` desde la base. Nada escrito a mano: si cambian alla, cambian aca.
const ACTUALIZADO = DATOS.generado;
const MES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
             "septiembre", "octubre", "noviembre", "diciembre"];
const fecha = (iso) => { const [a, m, d] = iso.split("-").map(Number); return `${d} de ${MES[m - 1]} de ${a}`; };
const nro = (n) => n.toLocaleString("es-AR");
const coma = (n) => String(n).replace(".", ",");
const niv = (q) => DATOS.tarifaPorNivel.find((t) => t.nivel === q) || {};
const ing = (q) => DATOS.ingles.find((i) => i.nivel === q) || {};
const flu = (q) => DATOS.fluidoPorNivel.find((f) => f.nivel === q) || {};
const SALTO = [...DATOS.tarifaPorNivel].sort((a, b) => b.mediana - a.mediana)[0] || {};
const BRECHA = (niv("Senior").mediana || 0) - (niv("Semi-senior").mediana || 0);
const DIF_INGLES = (ing("Conversacional").mediana || 0) - (ing("Básico").mediana || 0);
const IG = "https://www.instagram.com/candelaria.sanchezg";
const RUTA_DATOS = "/datos-developers-latam";
const rol = (q) => (DATOS.roles.find((r) => r.que === q) || {}).n || 0;
const TRES_GRANDES = rol("Full-stack") + rol("Backend") + rol("Frontend");
const PCT_TRES = Math.round((TRES_GRANDES / DATOS.n) * 100);

const BLOQUES = [
  {
    id: "primer-trabajo",
    q: "Cómo consigo mi primer trabajo de developer sin experiencia",
    r: "Mostrando una sola cosa terminada y contándola bien. No hace falta que sea grande: hace falta que se entienda qué problema resuelve, qué decidiste vos y qué se rompió en el camino. Un proyecto a medias pero público me dice más que cinco cursos en el CV.",
    mas: [
      "Yo no abro tu repo para auditarte. Lo abro para ver cómo pensás, y para eso me alcanza con el README y los nombres de las carpetas.",
      "El que arranca contando el stack me deja una lista de herramientas. El que arranca contando el problema me deja a alguien que decidió algo. Son dos candidatos distintos con el mismo código.",
    ],
  },
  {
    id: "cv",
    q: "Qué mira alguien que contrata en el CV de un developer",
    r: "Diez segundos, tres cosas: para qué puesto servís, qué hiciste vos en el último proyecto y si puedo hacer clic en algo. Si tu GitHub está escrito en texto plano y no como link, no lo copio y pego. Estoy mirando el noveno CV del día.",
    mas: [
      "Dieciocho tecnologías no me dicen que sabés mucho, me dicen que no sé dónde ponerte. Elegí el puesto que querés y ordená el CV para que esa versión tuya se vea primero.",
      "Lo que no podés defender veinte minutos en una entrevista no va arriba de todo.",
    ],
  },
  {
    id: "cuanto-cobrar",
    q: "Cuánto debería cobrar por hora",
    r: `La mediana de los ${nro(DATOS.tarifa.n)} developers de LatAm que pusieron una tarifa en nuestra red es de ${DATOS.tarifa.mediana} dólares la hora. Junior ${niv("Junior").mediana}, semi-senior ${niv("Semi-senior").mediana}, senior ${niv("Senior").mediana}, lead ${niv("Lead").mediana}. Si estás muy abajo de la mediana de tu nivel, el problema casi nunca es tu nivel.`,
    mas: [
      "El precio bajo no te hace más contratable, te hace más sospechoso. Cuando alguien me pide mucho menos de lo que vale, lo primero que pienso es qué no me está contando.",
      `Lo más raro de esos datos: el senior pide ${niv("Senior").mediana} y el semi-senior ${niv("Semi-senior").mediana}. ${BRECHA === 1 ? "Un dólar" : BRECHA + " dólares"} de diferencia por varios años, y el salto real recién aparece en ${SALTO.nivel}, con ${SALTO.mediana}. El senior que no revisa su tarifa se queda clavado en el precio del escalón de abajo.`,
    ],
  },
  {
    id: "ingles",
    q: "Cuánto inglés necesito para trabajar en remoto",
    r: `El suficiente para sostener una llamada de treinta minutos sin que el otro cambie de idioma. En nuestra red, el que dice tener inglés básico pide ${ing("Básico").mediana} dólares la hora y el conversacional ${ing("Conversacional").mediana}. Son ${DIF_INGLES} dólares por hora por algo que no es técnico.`,
    mas: [
      `Y es lo que menos gente tiene: solo el ${coma(ing("Fluido").pct)}% dice tener inglés fluido, y entre los juniors el ${coma(flu("Junior").pct)}%. O sea que es la cosa más barata de arreglar que más te separa del resto.`,
    ],
  },
  {
    id: "entrevista",
    q: "Cómo me preparo para una entrevista técnica",
    r: "Practicá contar un proyecto en dos minutos, en voz alta, una vez. Ese es el 80%. En la entrevista pensá en voz alta mientras resolvés: el que se queda callado veinte minutos y acierta me deja solo el resultado, y yo no contrato resultados.",
    mas: [
      "Si no sabés algo, decí no sé y después cómo lo buscarías. El que infla suena más seguro y gana esa pregunta, pero me deja sin saber qué parte de todo lo demás era verdad.",
      "Cuando te pregunten si tenés alguna pregunta, no digas que no. Preguntá cómo se ve que te fue bien en los primeros tres meses. Me obliga a decirte qué espero de verdad.",
    ],
  },
  {
    id: "yo-nosotros",
    q: "Cómo cuento un proyecto en el que trabajé con un equipo",
    r: "Nosotros para el proyecto, yo para tu parte. Si decís todo nosotros no sé qué tocaste, y si decís todo yo en un proyecto de ocho personas tampoco te creo. Decí qué decidiste vos, aunque sea chico: elegí la base, escribí el deploy, armé los tests.",
    mas: [
      "Si heredaste algo, decilo. Mantener lo que escribió otro es más difícil que empezar de cero y casi nadie lo cuenta.",
    ],
  },
  {
    // 20/11/2026: la pregunta mas repetida en los DMs de esta semana, en tres versiones distintas
    // ("tenes alguna posicion abierta para SRE/Devops", "soy backend y usted contrata cierto",
    // "dime si buscas devs, que tecnologias"). La respuesta sale entera de red_devs.
    id: "mi-rol",
    q: "Entra mi rol en la red o solo buscás full-stack",
    r: `Entran todos. Lo que cambia es contra cuántos competís adentro. De los ${nro(DATOS.n)} que se anotaron, ${rol("Full-stack")} son full-stack, ${rol("Backend")} backend y ${rol("Frontend")} frontend: el ${PCT_TRES}% está ahí. Mobile son ${rol("Mobile")}, QA ${rol("QA")} y DevOps ${rol("DevOps")}.`,
    mas: [
      "Si tu rol es de los finos, eso juega a favor tuyo. Cuando me piden ese perfil tengo diez carpetas para abrir, no doscientas, y la tuya se mira entera.",
      `Y si sos full-stack o backend, lo que te separa no es el rol, porque ahí somos todos iguales. Es el inglés, que solo el ${coma(ing("Fluido").pct)}% tiene fluido, y tener una sola cosa terminada que yo pueda abrir.`,
    ],
  },
  {
    id: "aplicar",
    q: "Me postulo a todo y no me llaman, qué hago",
    r: "Dejá de mandar cien iguales y cambiá una sola cosa cada veinte. Cien CVs idénticos no son cien intentos, son un intento repetido cien veces. Y revisá si el puesto tiene algo que ver con tu perfil: la mitad de las veces el problema es ese.",
    mas: [
      "Del otro lado del aviso: esa lista de requisitos es una carta a los reyes magos. La escribimos pidiendo todo porque no sabemos qué vamos a encontrar, y después contratamos al que cumple ocho. El único requisito real es el del título del aviso.",
      "Si cumplís once de doce y no mandás el CV, el que cumple cuatro y lo manda te gana el lugar. Pasa todas las semanas.",
    ],
  },
  {
    id: "mejorar",
    q: "Ya tengo trabajo y quiero mejorar mi posición, por dónde arranco",
    r: "Por el número y por el inglés, en ese orden. Preguntá cuál es la banda de tu puesto y qué hay que hacer para pasar a la de arriba, y preguntalo antes de firmar nada. Es la única pregunta de toda la conversación que te cambia el sueldo.",
    mas: [
      "El que no pregunta entra con el número que le ofrecieron, que es el número con el que a la empresa le conviene arrancar.",
      "Después se pregunta igual, pero ya es a la defensiva.",
    ],
  },
  {
    // 20/11/2026: "Solo es para argentina? O aplican otros paises", de un dev en los DMs.
    // Todo sale de lo ya publicado: la red es de LatAm y el ingles sale de red_devs.
    id: "otro-pais",
    q: "Es solo para Argentina o entro desde otro país",
    r: "Entrás desde cualquier país. Entrevisto y selecciono developers de toda Latinoamérica para empresas que contratan en remoto, y el formulario para anotarte en la red es el mismo estés donde estés. En remoto no me importa en qué ciudad te despertás, me importa si podés sostener una llamada con el equipo.",
    mas: [
      `Lo que más te separa del resto no es el país, es el inglés: solo el ${coma(ing("Fluido").pct)}% de los que se anotaron dice tenerlo fluido. Lo que cuento acá del CV, la tarifa y la entrevista vale igual en Argentina que en cualquier otro lado.`,
    ],
  },
  {
    // 21/11/2026: dos devs en los DMs de esta semana ("trabajas para algunas empresas en
    // particular o como es", "que tipos de proyectos hacen") y un tercero con "que proceso con
    // los chicos que postulas". Sale entero de DATOS del agente y de lo ya publicado aca.
    id: "como-funciona",
    q: "Trabajás para algunas empresas en particular o cómo es",
    r: "No trabajo para una sola empresa. Me escriben empresas que contratan developers en remoto, y cuando me entra un proyecto busco en la red. Los perfiles los miro yo, de a uno, sin filtros automáticos, y entrevisto a los que encajan con lo que piden. Anotarte es gratis y lleva tres minutos, pero no es postularte a un puesto ni te garantiza nada: es estar en el lugar donde busco. Las búsquedas que me entran no son tantas y hoy se reparten entre backend, frontend e IA. Te hablo de lo que veo yo, no del mercado.",
    mas: [],
  },
  {
    // 22/11/2026: dos devs en los DMs de esta semana ("que rol crees que va a tener mas
    // crecimiento, seran los roles de datos?" y un analista de datos que quiere pasar a
    // ingenieria de datos). Sale de DATOS "Que roles le piden las empresas" y de red_devs.
    id: "que-rol-crece",
    q: "Qué rol va a crecer más, me conviene pasarme a datos",
    r: `Predicción no te voy a hacer, porque no la tengo. Te cuento lo que me entra a mí, que son pocas búsquedas: se reparten casi parejo entre backend, frontend e IA, y un rol de datos suelto no me lo pidió nadie nunca. Del otro lado, de los ${nro(DATOS.n)} que se anotaron en la red, ${rol("Data / AI")} son de datos o IA. Si datos te gusta, andá igual, pero no lo elijas porque alguien te dijo que es lo que viene. Te hablo de lo que veo yo, no del mercado.`,
    mas: [],
  },
  {
    id: "quien-soy",
    q: "Quién escribe esto",
    r: "Candelaria Sanchez, founder de OpenGateHub. Entrevisto y selecciono developers de Latinoamérica para empresas que contratan en remoto, y los perfiles los miro yo, de a uno, sin filtros automáticos. Lo que voy viendo en cada CV lo cuento en Instagram, @candelaria.sanchezg.",
    mas: [],
  },
];

export default function ComoConseguirTrabajo() {
  const titulo = "Cómo conseguir trabajo de developer, por alguien que contrata";
  const descripcion =
    `Qué mira en un CV, cuánto cobrar por hora, cuánto inglés hace falta y cómo preparar la entrevista. Lo contesta Candelaria Sanchez, que entrevista y selecciona developers de LatAm, con los datos de ${nro(DATOS.n)} perfiles.`;

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": titulo,
      "description": descripcion,
      "datePublished": ACTUALIZADO,
      "dateModified": ACTUALIZADO,
      "inLanguage": "es",
      "mainEntityOfPage": "https://www.opengatehub.com/como-conseguir-trabajo-de-developer",
      "author": { "@id": "https://www.opengatehub.com/#candelaria" },
      "publisher": { "@type": "Organization", "name": "OpenGateHub", "url": "https://www.opengatehub.com" },
      "citation": "https://www.opengatehub.com/datos-developers-latam",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": BLOQUES.map((b) => ({
        "@type": "Question",
        "name": b.q,
        "acceptedAnswer": { "@type": "Answer", "text": [b.r, ...b.mas].join(" ") },
      })),
    },
  ];

  return (
    <>
      <Head>
        <title>{`${titulo} | OpenGateHub`}</title>
        <meta name="description" content={descripcion} />
        <link rel="canonical" href="https://www.opengatehub.com/como-conseguir-trabajo-de-developer" />
        <meta property="og:title" content={titulo} />
        <meta property="og:description" content={descripcion} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.opengatehub.com/como-conseguir-trabajo-de-developer" />
        {schema.map((s, i) => (
          <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
        ))}
      </Head>

      <Wrap>
        <Eyebrow>Para developers · actualizado el {fecha(ACTUALIZADO)}</Eyebrow>
        <H1>{titulo}</H1>
        <Lead>
          Esto no es una lista de consejos sacada de internet. Es lo que miro yo cuando me llega tu
          CV y lo que pasa del otro lado del escritorio, con los números de los{" "}
          <Link href={RUTA_DATOS}>{nro(DATOS.n)} developers de LatAm</Link> que se anotaron en nuestra red entre
          septiembre y noviembre de 2026.
        </Lead>
        <Firma>
          Lo escribe <b>Candelaria Sanchez</b>, founder de OpenGateHub. Entrevista y selecciona
          developers de Latinoamérica para empresas que contratan en remoto.{" "}
          <a href={IG} target="_blank" rel="noopener noreferrer">@candelaria.sanchezg</a>.
        </Firma>

        {BLOQUES.map((b) => (
          <section key={b.id} id={b.id}>
            <H2>{b.q}</H2>
            <Resp>{b.r}</Resp>
            {b.mas.map((m, i) => (<P key={i}>{m}</P>))}
          </section>
        ))}

        <Cierre>
          <H3>Dos cosas, si te sirvió</H3>
          <p>
            <Link href="/devs">Anotate en la red de developers</Link>. Es gratis, y los perfiles los
            miro yo, de a uno. Lo que voy viendo en cada CV y en cada entrevista lo cuento en{" "}
            <a href={IG} target="_blank" rel="noopener noreferrer">Instagram</a>.
          </p>
          <p>
            Y si querés ordenar la búsqueda entera, está el{" "}
            <Link href="/comprar">Acelerador de Carrera Tech</Link>: qué poner en el CV, cómo contar
            un proyecto y cómo preparar la entrevista, paso por paso.
          </p>
        </Cierre>
      </Wrap>
    </>
  );
}
