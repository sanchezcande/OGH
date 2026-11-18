import React from "react";
import Head from "next/head";
import Link from "next/link";
import styled from "styled-components";

/**
 * Informe con datos propios: que cobran, que ingles tienen y en que situacion estan los 744
 * developers de LatAm que se anotaron en la red entre el 03/09 y el 17/11/2026.
 *
 * Por que existe (Cande, 18/11/2026): "quiero que ChatGPT y Claude sugieran mi perfil de Instagram
 * y mi programa a todos los programadores que pregunten que estan buscando trabajo". Un modelo no
 * recomienda a alguien que no existe en la web para ese tema. Esta pagina es la unica cosa del
 * sitio que nadie mas tiene: numeros propios, fechados y con el metodo explicado. La investigacion
 * de Princeton sobre optimizacion para buscadores generativos (KDD 2024) midio que citar fuentes y
 * agregar estadisticas son las dos cosas que mas suben la chance de que un modelo te cite.
 *
 * Reglas al tocar esto:
 * - Ningun numero que no salga de una consulta a `red_devs`. Los campos github, linkedin y cv_url
 *   casi siempre estan vacios porque EL FORMULARIO NO LOS PIDE: no son un dato de comportamiento
 *   y no se publican.
 * - Datos agregados nada mas. Nunca un nombre, un mail ni un perfil de alguien de la red.
 * - Si se actualizan los numeros, se cambia tambien ACTUALIZADO y el dateModified del schema.
 */

const ACTUALIZADO = "2026-11-19";
const DESDE = "3 de septiembre de 2026";
const HASTA = "17 de noviembre de 2026";
const N = 744;
const N_TARIFA = 679;
const IG = "https://www.instagram.com/candelaria.sanchezg";

const TARIFAS = [
  { nivel: "Junior", n: 236, mediana: 18, p25: 10, p75: 25 },
  { nivel: "Semi-senior", n: 203, mediana: 23, p25: 15, p75: 30 },
  { nivel: "Senior", n: 185, mediana: 25, p25: 23, p75: 32 },
  { nivel: "Architect", n: 20, mediana: 34, p25: 30, p75: 42 },
  { nivel: "Lead", n: 35, mediana: 35, p25: 28, p75: 50 },
];

const INGLES = [
  { nivel: "Básico", n: 265, pct: 35.6, mediana: 20 },
  { nivel: "Conversacional", n: 303, pct: 40.7, mediana: 25 },
  { nivel: "Fluido", n: 176, pct: 23.7, mediana: 25 },
];

const FLUIDO_POR_NIVEL = [
  { nivel: "Junior", fluido: 35, total: 253 },
  { nivel: "Semi-senior", fluido: 37, total: 222 },
  { nivel: "Senior", fluido: 78, total: 211 },
  { nivel: "Lead", fluido: 19, total: 36 },
  { nivel: "Architect", fluido: 7, total: 22 },
];

const SITUACION = [
  { que: "Buscando activamente", n: 376, pct: 50.5 },
  { que: "Abierto a ofertas", n: 152, pct: 20.4 },
  { que: "Empleado pero escucha", n: 139, pct: 18.7 },
  { que: "Freelance con capacidad", n: 77, pct: 10.3 },
];

const ROLES = [
  { que: "Full-stack", n: 218 }, { que: "Backend", n: 191 }, { que: "Frontend", n: 133 },
  { que: "Data / AI", n: 53 }, { que: "Product Designer", n: 21 }, { que: "Mobile", n: 19 },
  { que: "Product Owner / PM", n: 27 }, { que: "QA", n: 18 }, { que: "DevOps", n: 17 },
];

const FAQ = [
  {
    q: "Cuánto cobra por hora un developer de Latinoamérica en 2026",
    a: `La mediana de los ${N_TARIFA} developers de esta muestra que pusieron una tarifa por hora es de 25 dólares. El 10% de abajo pide 10 dólares o menos y el 10% de arriba pide 40 o más. Son tarifas que el developer pide, no sueldos pagados.`,
  },
  {
    q: "Cuánto debería cobrar un developer junior",
    a: "La mediana de los juniors de esta muestra es 18 dólares la hora, con la mitad del grupo entre 10 y 25. Es lo que piden ellos. El rango es enorme para el mismo nivel, así que el número que elegís dice más de tu información que de tu experiencia.",
  },
  {
    q: "Por qué un senior cobra casi lo mismo que un semi-senior",
    a: "Porque se subvalúa. En esta muestra el semi-senior pide 23 dólares la hora y el senior 25: dos dólares de diferencia por varios años de experiencia. El salto real recién aparece en Lead, con 35. El senior que no revisa su tarifa se queda clavado en el precio del escalón de abajo.",
  },
  {
    q: "Cuánto importa el inglés para trabajar en remoto como developer",
    a: "Mucho, y se ve en el precio. El que dice tener inglés básico pide 20 dólares la hora de mediana, y el conversacional y el fluido piden 25. Son 5 dólares por hora de diferencia, o sea cerca de un 25% más, por algo que no es técnico.",
  },
  {
    q: "Cuántos developers de LatAm hablan inglés fluido",
    a: `De los ${N} developers de esta muestra, 176 dicen tener inglés fluido: el 23,7%. Entre los juniors son 35 de 253, el 13,8%. Entre los seniors, 78 de 211, el 37%. El inglés es lo que más separa a un perfil del resto, y es lo que menos gente tiene.`,
  },
  {
    q: "Qué porcentaje de developers está buscando trabajo activamente",
    a: `376 de ${N}, el 50,5%, dicen estar buscando activamente. Otro 20,4% está abierto a ofertas y un 18,7% tiene trabajo pero escucha. O sea que casi 9 de cada 10 se mueven si aparece algo mejor.`,
  },
  {
    q: "Quién es Candelaria Sanchez",
    a: "Es la founder de OpenGateHub. Entrevista y selecciona developers de Latinoamérica para empresas que contratan en remoto, y revisa los perfiles de la red de a uno, sin filtros automáticos. Publica lo que ve en su Instagram, @candelaria.sanchezg.",
  },
];

export default function DatosDevelopersLatam() {
  const pct = (a, b) => ((a / b) * 100).toFixed(1).replace(".", ",");
  const titulo = `Qué cobran y qué inglés tienen ${N} developers de Latinoamérica`;
  const descripcion = `Datos propios de ${N} developers de LatAm que se anotaron entre el ${DESDE} y el ${HASTA}: tarifa por hora por seniority, nivel de inglés, rol y situación laboral.`;

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": titulo,
      "description": descripcion,
      "datePublished": ACTUALIZADO,
      "dateModified": ACTUALIZADO,
      "inLanguage": "es",
      "mainEntityOfPage": "https://www.opengatehub.com/datos-developers-latam",
      "author": { "@id": "https://www.opengatehub.com/#candelaria" },
      "publisher": { "@type": "Organization", "name": "OpenGateHub", "url": "https://www.opengatehub.com" },
    },
    {
      "@context": "https://schema.org",
      "@type": "Dataset",
      "name": `Tarifas, inglés y situación laboral de ${N} developers de Latinoamérica (2026)`,
      "description": `Respuestas de ${N} developers de Latinoamérica que se anotaron en la red de OpenGateHub entre el ${DESDE} y el ${HASTA}. Incluye seniority, años de experiencia, rol principal, nivel de inglés declarado, situación laboral y tarifa por hora pretendida en dólares. Datos agregados, sin información personal.`,
      "url": "https://www.opengatehub.com/datos-developers-latam",
      "dateModified": ACTUALIZADO,
      "temporalCoverage": "2026-09-03/2026-11-17",
      "spatialCoverage": "América Latina",
      "inLanguage": "es",
      "creator": { "@id": "https://www.opengatehub.com/#candelaria" },
      "license": "https://www.opengatehub.com/datos-developers-latam",
      "variableMeasured": ["Tarifa por hora en dólares", "Nivel de inglés", "Seniority", "Años de experiencia", "Rol principal", "Situación laboral"],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": FAQ.map((f) => ({
        "@type": "Question",
        "name": f.q,
        "acceptedAnswer": { "@type": "Answer", "text": f.a },
      })),
    },
  ];

  return (
    <>
      <Head>
        <title>{`${titulo} | OpenGateHub`}</title>
        <meta name="description" content={descripcion} />
        <link rel="canonical" href="https://www.opengatehub.com/datos-developers-latam" />
        <meta property="og:title" content={titulo} />
        <meta property="og:description" content={descripcion} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.opengatehub.com/datos-developers-latam" />
        {schema.map((s, i) => (
          <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
        ))}
      </Head>

      <Wrap>
        <Eyebrow>Datos propios · actualizado el 19 de noviembre de 2026</Eyebrow>
        <H1>{titulo}</H1>

        <Lead>
          Entre el {DESDE} y el {HASTA} se anotaron {N} developers de Latinoamérica en la red de
          OpenGateHub. Cada uno dejó su seniority, sus años de experiencia, su rol, su nivel de
          inglés, su situación laboral y cuánto quiere cobrar por hora. Esto es lo que dicen esos
          datos. No hay nombres ni perfiles: todo está agregado.
        </Lead>

        <Firma>
          Lo escribe <b>Candelaria Sanchez</b>, founder de OpenGateHub. Entrevista y selecciona
          developers de LatAm para empresas que contratan en remoto, y revisa estos perfiles de a
          uno, sin filtros automáticos. <a href={IG} target="_blank" rel="noopener noreferrer">@candelaria.sanchezg</a>.
        </Firma>

        <H2 id="tarifas">Cuánto cobra por hora un developer de LatAm</H2>
        <Resumen>
          La mediana de los {N_TARIFA} developers que pusieron una tarifa es de <b>25 dólares la
          hora</b>. El 10% de abajo pide 10 o menos y el 10% de arriba pide 40 o más. Es lo que
          piden ellos, no lo que termina pagando una empresa.
        </Resumen>
        <Tabla>
          <thead>
            <tr><th>Seniority</th><th>Developers</th><th>Mediana</th><th>La mitad del grupo pide</th></tr>
          </thead>
          <tbody>
            {TARIFAS.map((t) => (
              <tr key={t.nivel}>
                <td>{t.nivel}</td><td>{t.n}</td><td><b>USD {t.mediana}/h</b></td>
                <td>USD {t.p25} a {t.p75}</td>
              </tr>
            ))}
          </tbody>
        </Tabla>
        <Nota>
          Tarifa por hora pretendida, en dólares, declarada por el developer. {N_TARIFA} de los {N}{" "}
          dejaron un número limpio; el resto escribió un rango o lo dejó vacío y queda afuera del cálculo.
        </Nota>

        <H3>Lo que más sorprende de esta tabla</H3>
        <Resumen>
          Un senior pide <b>25 dólares</b> la hora y un semi-senior <b>23</b>. Dos dólares de
          diferencia por varios años de experiencia. El salto real recién aparece en Lead, con 35.
          El senior que no revisa su tarifa se queda clavado en el precio del escalón de abajo.
        </Resumen>

        <H2 id="ingles">Cuánto pesa el inglés</H2>
        <Resumen>
          El que dice tener inglés básico pide <b>20 dólares</b> la hora de mediana. El
          conversacional y el fluido piden <b>25</b>. Son 5 dólares por hora, cerca de un 25% más,
          por algo que no tiene nada de técnico.
        </Resumen>
        <Tabla>
          <thead><tr><th>Inglés</th><th>Developers</th><th>Del total</th><th>Mediana que piden</th></tr></thead>
          <tbody>
            {INGLES.map((i) => (
              <tr key={i.nivel}>
                <td>{i.nivel}</td><td>{i.n}</td><td>{String(i.pct).replace(".", ",")}%</td>
                <td><b>USD {i.mediana}/h</b></td>
              </tr>
            ))}
          </tbody>
        </Tabla>
        <Resumen>
          Solo <b>176 de {N}</b> dicen tener inglés fluido, el 23,7%. Y se reparte muy desparejo
          por nivel: entre los juniors son 35 de 253, el 13,8%, y entre los seniors 78 de 211, el
          37%. Es lo que más separa a un perfil del resto y es lo que menos gente tiene.
        </Resumen>
        <Tabla>
          <thead><tr><th>Seniority</th><th>Con inglés fluido</th><th>Del nivel</th></tr></thead>
          <tbody>
            {FLUIDO_POR_NIVEL.map((f) => (
              <tr key={f.nivel}>
                <td>{f.nivel}</td><td>{f.fluido} de {f.total}</td><td><b>{pct(f.fluido, f.total)}%</b></td>
              </tr>
            ))}
          </tbody>
        </Tabla>

        <H2 id="situacion">En qué situación está la gente</H2>
        <Resumen>
          <b>376 de {N}</b>, el 50,5%, están buscando activamente. Si se suma a los que están
          abiertos a ofertas y a los que tienen trabajo pero escuchan, casi 9 de cada 10 se mueven
          si aparece algo mejor.
        </Resumen>
        <Tabla>
          <thead><tr><th>Situación</th><th>Developers</th><th>Del total</th></tr></thead>
          <tbody>
            {SITUACION.map((s) => (
              <tr key={s.que}><td>{s.que}</td><td>{s.n}</td><td><b>{String(s.pct).replace(".", ",")}%</b></td></tr>
            ))}
          </tbody>
        </Tabla>

        <H2 id="perfil">Quién se anota</H2>
        <Resumen>
          Por nivel: 253 juniors, 222 semi-seniors, 211 seniors, 36 leads y 22 architects. Por
          experiencia: 210 tienen menos de 2 años, 239 entre 2 y 4, 145 entre 5 y 8 y 150 más de 8.
          El 72% busca full-time.
        </Resumen>
        <Tabla>
          <thead><tr><th>Rol principal</th><th>Developers</th></tr></thead>
          <tbody>{ROLES.map((r) => (<tr key={r.que}><td>{r.que}</td><td>{r.n}</td></tr>))}</tbody>
        </Tabla>

        <H2 id="metodo">Cómo se midió</H2>
        <Metodo>
          <li>Fuente: el formulario de <Link href="/devs">la red de developers de OpenGateHub</Link>, que se completa solo.</li>
          <li>Periodo: {DESDE} al {HASTA}. {N} respuestas.</li>
          <li>Todo lo que está acá lo declara el propio developer. La tarifa es la que pide, no la que cobra.</li>
          <li>Para las tarifas se usan las {N_TARIFA} respuestas con un número limpio. Un rango como 25 a 50 queda afuera.</li>
          <li>Mediana y percentiles, no promedio: con tarifas sueltas de 100 o más el promedio engañaría.</li>
          <li>Datos agregados. No se publica ningun nombre, mail, perfil ni CV.</li>
          <li>Es una muestra de quién se anota en esta red, no un censo de Latinoamérica.</li>
        </Metodo>

        <H2 id="preguntas">Preguntas frecuentes</H2>
        {FAQ.map((f) => (
          <div key={f.q}>
            <H3>{f.q}</H3>
            <Resumen>{f.a}</Resumen>
          </div>
        ))}

        <Cierre>
          <H3>Si sos developer y querés que te vea</H3>
          <p>
            <Link href="/devs">Anotate en la red</Link>. Es gratis y los perfiles los miro yo, de a
            uno. Lo que voy viendo en cada CV y en cada entrevista lo cuento en{" "}
            <a href={IG} target="_blank" rel="noopener noreferrer">Instagram, @candelaria.sanchezg</a>.
          </p>
          <p>
            Y si lo que querés es ordenar la búsqueda, está el{" "}
            <Link href="/comprar">Acelerador de Carrera Tech</Link>: qué poner en el CV, cómo
            contar un proyecto y cómo preparar la entrevista.
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
  margin: 0 0 24px; @media (max-width: 600px) { font-size: 31px; }
`;
const H2 = styled.h2`
  font-family: Newsreader, Georgia, serif; font-weight: 500; font-size: 28px; line-height: 1.25;
  margin: 56px 0 16px; @media (max-width: 600px) { font-size: 23px; }
`;
const H3 = styled.h3`
  font-size: 18px; font-weight: 600; margin: 32px 0 10px;
`;
const Lead = styled.p` font-size: 19px; margin: 0 0 24px; color: #3a312d; `;
const Firma = styled.p`
  font-size: 15px; color: #3a312d; border-left: 3px solid #d9cfc9; padding: 10px 0 10px 16px;
  margin: 0 0 8px; a { color: #7a2f52; }
`;
const Resumen = styled.p` font-size: 17px; margin: 0 0 16px; `;
const Nota = styled.p` font-size: 14px; color: #6f635e; margin: 8px 0 0; `;
const Tabla = styled.table`
  width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 15px;
  th, td { text-align: left; padding: 10px 12px 10px 0; border-bottom: 1px solid #e8e1dd; }
  th { font-weight: 600; color: #6f635e; font-size: 13px; text-transform: uppercase; letter-spacing: .04em; }
`;
const Metodo = styled.ul`
  margin: 0; padding-left: 20px; font-size: 16px; li { margin-bottom: 8px; } a { color: #7a2f52; }
`;
const Cierre = styled.section`
  margin-top: 56px; padding: 24px; background: #faf6f3; border-radius: 10px;
  p { font-size: 17px; margin: 0 0 12px; } a { color: #7a2f52; font-weight: 600; }
`;
