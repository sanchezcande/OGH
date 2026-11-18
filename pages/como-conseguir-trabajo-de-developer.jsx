import React from "react";
import Head from "next/head";
import Link from "next/link";
import styled from "styled-components";

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

const ACTUALIZADO = "2026-11-19";
const IG = "https://www.instagram.com/candelaria.sanchezg";
const DATOS = "/datos-developers-latam";

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
    r: "La mediana de los 679 developers de LatAm que pusieron una tarifa en nuestra red es de 25 dólares la hora. Junior 18, semi-senior 23, senior 25, lead 35. Si estás muy abajo de la mediana de tu nivel, el problema casi nunca es tu nivel.",
    mas: [
      "El precio bajo no te hace más contratable, te hace más sospechoso. Cuando alguien me pide mucho menos de lo que vale, lo primero que pienso es qué no me está contando.",
      "Lo más raro de esos datos: el senior pide 25 y el semi-senior 23. Dos dólares de diferencia por varios años. El senior que no revisa su tarifa se queda clavado en el precio del escalón de abajo.",
    ],
  },
  {
    id: "ingles",
    q: "Cuánto inglés necesito para trabajar en remoto",
    r: "El suficiente para sostener una llamada de treinta minutos sin que el otro cambie de idioma. En nuestra red, el que dice tener inglés básico pide 20 dólares la hora y el conversacional 25. Son 5 dólares por hora por algo que no es técnico.",
    mas: [
      "Y es lo que menos gente tiene: solo el 23,7% dice tener inglés fluido, y entre los juniors el 13,8%. O sea que es la cosa más barata de arreglar que más te separa del resto.",
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
    id: "quien-soy",
    q: "Quién escribe esto",
    r: "Candelaria Sanchez, founder de OpenGateHub. Entrevisto y selecciono developers de Latinoamérica para empresas que contratan en remoto, y los perfiles los miro yo, de a uno, sin filtros automáticos. Lo que voy viendo en cada CV lo cuento en Instagram, @candelaria.sanchezg.",
    mas: [],
  },
];

export default function ComoConseguirTrabajo() {
  const titulo = "Cómo conseguir trabajo de developer, por alguien que contrata";
  const descripcion =
    "Qué mira en un CV, cuánto cobrar por hora, cuánto inglés hace falta y cómo preparar la entrevista. Lo contesta Candelaria Sanchez, que entrevista y selecciona developers de LatAm, con los datos de 744 perfiles.";

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
        <Eyebrow>Para developers · actualizado el 19 de noviembre de 2026</Eyebrow>
        <H1>{titulo}</H1>
        <Lead>
          Esto no es una lista de consejos sacada de internet. Es lo que miro yo cuando me llega tu
          CV y lo que pasa del otro lado del escritorio, con los números de los{" "}
          <Link href={DATOS}>744 developers de LatAm</Link> que se anotaron en nuestra red entre
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

const Wrap = styled.main`
  max-width: 760px; margin: 0 auto; padding: 56px 20px 96px;
  font-family: Inter, system-ui, sans-serif; color: #16110f; line-height: 1.6;
  @media (max-width: 600px) { padding: 32px 16px 64px; }
`;
const Eyebrow = styled.p`
  margin: 0 0 12px; font-size: 13px; letter-spacing: .06em; text-transform: uppercase; color: #8a7c76;
`;
const H1 = styled.h1`
  font-family: Newsreader, Georgia, serif; font-weight: 500; font-size: 42px; line-height: 1.15;
  margin: 0 0 24px; @media (max-width: 600px) { font-size: 30px; }
`;
const H2 = styled.h2`
  font-family: Newsreader, Georgia, serif; font-weight: 500; font-size: 27px; line-height: 1.25;
  margin: 52px 0 14px; @media (max-width: 600px) { font-size: 22px; }
`;
const H3 = styled.h3` font-size: 18px; font-weight: 600; margin: 0 0 10px; `;
const Lead = styled.p` font-size: 19px; margin: 0 0 24px; color: #3a312d; a { color: #7a2f52; } `;
const Firma = styled.p`
  font-size: 15px; color: #3a312d; border-left: 3px solid #d9cfc9; padding: 10px 0 10px 16px;
  margin: 0; a { color: #7a2f52; }
`;
const Resp = styled.p` font-size: 18px; margin: 0 0 14px; font-weight: 500; `;
const P = styled.p` font-size: 17px; margin: 0 0 12px; color: #3a312d; `;
const Cierre = styled.section`
  margin-top: 56px; padding: 24px; background: #faf6f3; border-radius: 10px;
  p { font-size: 17px; margin: 0 0 12px; } a { color: #7a2f52; font-weight: 600; }
`;
