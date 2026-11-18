import React from "react";
import Head from "next/head";
import Link from "next/link";
import styled from "styled-components";
import DATOS from "../data/datos-devs.json";

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

// Todo sale de data/datos-devs.json, que arma `node scripts/datos_devs.mjs` desde la base.
// Ningun numero se escribe a mano aca: una foto vieja se deja de citar, y encima el N crece solo.
const ACTUALIZADO = DATOS.generado;
const N = DATOS.n;
const N_TARIFA = DATOS.tarifa.n;
const IG = "https://www.instagram.com/candelaria.sanchezg";

const MES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
             "septiembre", "octubre", "noviembre", "diciembre"];
const fecha = (iso) => {
  const [a, m, d] = iso.split("-").map(Number);
  return `${d} de ${MES[m - 1]} de ${a}`;
};
const nro = (n) => n.toLocaleString("es-AR");
const coma = (n) => String(n).replace(".", ",");

const DESDE = fecha(DATOS.desde);
const HASTA = fecha(DATOS.hasta);
const TARIFAS = DATOS.tarifaPorNivel;
const INGLES = DATOS.ingles;
const FLUIDO_POR_NIVEL = DATOS.fluidoPorNivel;
const SITUACION = DATOS.situacion;
const ROLES = DATOS.roles;

// Lo que antes eran afirmaciones escritas a mano y ahora se calculan, para que la frase siga
// siendo cierta cuando los numeros se muevan.
const nivel = (q) => TARIFAS.find((t) => t.nivel === q) || {};
const SENIOR = nivel("Senior");
const SEMI = nivel("Semi-senior");
const JUNIOR = nivel("Junior");
const BRECHA = (SENIOR.mediana || 0) - (SEMI.mediana || 0);   // el hallazgo: casi no hay salto
const SALTO = [...TARIFAS].sort((a, b) => b.mediana - a.mediana)[0] || {};   // donde si lo hay
const ING = (q) => INGLES.find((i) => i.nivel === q) || {};
const BASICO = ING("Básico");
const FLUIDO = ING("Fluido");
const CONV = ING("Conversacional");
const DIF_INGLES = (CONV.mediana || 0) - (BASICO.mediana || 0);
const PCT_INGLES = BASICO.mediana ? Math.round((DIF_INGLES / BASICO.mediana) * 100) : 0;
const FLU_JUNIOR = FLUIDO_POR_NIVEL.find((f) => f.nivel === "Junior") || {};
const FLU_SENIOR = FLUIDO_POR_NIVEL.find((f) => f.nivel === "Senior") || {};
const BUSCANDO = SITUACION.find((x) => /buscando/i.test(x.que)) || {};
const MOVILES = SITUACION.filter((x) => !/freelance/i.test(x.que)).reduce((a, b) => a + b.n, 0);
const EXP = (q) => (DATOS.experiencia.find((e) => e.que === q) || {}).n || 0;
const SEN = (q) => (DATOS.seniority.find((e) => e.que === q) || {}).n || 0;
const FULLTIME = DATOS.dedicacion.find((x) => /full/i.test(x.que)) || {};

const FAQ = [
  {
    q: "Cuánto cobra por hora un developer de Latinoamérica en 2026",
    a: `La mediana de los ${nro(N_TARIFA)} developers de esta muestra que pusieron una tarifa por hora es de ${DATOS.tarifa.mediana} dólares. El 10% de abajo pide ${DATOS.tarifa.p10} dólares o menos y el 10% de arriba pide ${DATOS.tarifa.p90} o más. Son tarifas que el developer pide, no sueldos pagados.`,
  },
  {
    q: "Cuánto debería cobrar un developer junior",
    a: `La mediana de los juniors de esta muestra es ${JUNIOR.mediana} dólares la hora, con la mitad del grupo entre ${JUNIOR.p25} y ${JUNIOR.p75}. Es lo que piden ellos. El rango es enorme para el mismo nivel, así que el número que elegís dice más de tu información que de tu experiencia.`,
  },
  {
    q: "Por qué un senior cobra casi lo mismo que un semi-senior",
    a: `Porque se subvalúa. En esta muestra el semi-senior pide ${SEMI.mediana} dólares la hora y el senior ${SENIOR.mediana}: ${BRECHA === 1 ? "un dólar" : BRECHA + " dólares"} de diferencia por varios años de experiencia. El salto real recién aparece en ${SALTO.nivel}, con ${SALTO.mediana}. El senior que no revisa su tarifa se queda clavado en el precio del escalón de abajo.`,
  },
  {
    q: "Cuánto importa el inglés para trabajar en remoto como developer",
    a: `Mucho, y se ve en el precio. El que dice tener inglés básico pide ${BASICO.mediana} dólares la hora de mediana, y el conversacional y el fluido piden ${CONV.mediana}. Son ${DIF_INGLES} dólares por hora de diferencia, o sea cerca de un ${PCT_INGLES}% más, por algo que no es técnico.`,
  },
  {
    q: "Cuántos developers de LatAm hablan inglés fluido",
    a: `De los ${nro(N)} developers de esta muestra, ${FLUIDO.n} dicen tener inglés fluido: el ${coma(FLUIDO.pct)}%. Entre los juniors son ${FLU_JUNIOR.fluido} de ${FLU_JUNIOR.total}, el ${coma(FLU_JUNIOR.pct)}%. Entre los seniors, ${FLU_SENIOR.fluido} de ${FLU_SENIOR.total}, el ${coma(FLU_SENIOR.pct)}%. El inglés es lo que más separa a un perfil del resto, y es lo que menos gente tiene.`,
  },
  {
    q: "Qué porcentaje de developers está buscando trabajo activamente",
    a: `${BUSCANDO.n} de ${nro(N)}, el ${coma(BUSCANDO.pct)}%, dicen estar buscando activamente. Si se suma a los que están abiertos a ofertas y a los que tienen trabajo pero escuchan, son ${nro(MOVILES)} de ${nro(N)}: casi todos se mueven si aparece algo mejor.`,
  },
  {
    q: "Quién es Candelaria Sanchez",
    a: "Es la founder de OpenGateHub. Entrevista y selecciona developers de Latinoamérica para empresas que contratan en remoto, y revisa los perfiles de la red de a uno, sin filtros automáticos. Publica lo que ve en su Instagram, @candelaria.sanchezg.",
  },
];

export default function DatosDevelopersLatam() {
  const pct = (a, b) => ((a / b) * 100).toFixed(1).replace(".", ",");
  const titulo = `Qué cobran y qué inglés tienen ${nro(N)} developers de Latinoamérica`;
  const descripcion = `Datos propios de ${nro(N)} developers de LatAm que se anotaron entre el ${DESDE} y el ${HASTA}: tarifa por hora por seniority, nivel de inglés, rol y situación laboral.`;

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
      "name": `Tarifas, inglés y situación laboral de ${nro(N)} developers de Latinoamérica (${DATOS.hasta.slice(0, 4)})`,
      "description": `Respuestas de ${nro(N)} developers de Latinoamérica que se anotaron en la red de OpenGateHub entre el ${DESDE} y el ${HASTA}. Incluye seniority, años de experiencia, rol principal, nivel de inglés declarado, situación laboral y tarifa por hora pretendida en dólares. Datos agregados, sin información personal.`,
      "url": "https://www.opengatehub.com/datos-developers-latam",
      "dateModified": ACTUALIZADO,
      "temporalCoverage": `${DATOS.desde}/${DATOS.hasta}`,
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
        <Eyebrow>Datos propios · actualizado el {fecha(ACTUALIZADO)}</Eyebrow>
        <H1>{titulo}</H1>

        <Lead>
          Entre el {DESDE} y el {HASTA} se anotaron {nro(N)} developers de Latinoamérica en la red de
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
          La mediana de los {nro(N_TARIFA)} developers que pusieron una tarifa es de{" "}
          <b>{DATOS.tarifa.mediana} dólares la hora</b>. El 10% de abajo pide {DATOS.tarifa.p10} o
          menos y el 10% de arriba pide {DATOS.tarifa.p90} o más. Es lo que piden ellos, no lo que
          termina pagando una empresa.
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
          Tarifa por hora pretendida, en dólares, declarada por el developer. {nro(N_TARIFA)} de los {nro(N)}{" "}
          dejaron un número limpio; el resto escribió un rango o lo dejó vacío y queda afuera del cálculo.
        </Nota>

        <H3>Lo que más sorprende de esta tabla</H3>
        <Resumen>
          Un senior pide <b>{SENIOR.mediana} dólares</b> la hora y un semi-senior <b>{SEMI.mediana}</b>.{" "}
          {BRECHA === 1 ? "Un dólar" : `${BRECHA} dólares`} de diferencia por varios años de
          experiencia. El salto real recién aparece en {SALTO.nivel}, con {SALTO.mediana}. El senior
          que no revisa su tarifa se queda clavado en el precio del escalón de abajo.
        </Resumen>

        <H2 id="ingles">Cuánto pesa el inglés</H2>
        <Resumen>
          El que dice tener inglés básico pide <b>{BASICO.mediana} dólares</b> la hora de mediana.
          El conversacional y el fluido piden <b>{CONV.mediana}</b>. Son {DIF_INGLES} dólares por
          hora, cerca de un {PCT_INGLES}% más, por algo que no tiene nada de técnico.
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
          Solo <b>{FLUIDO.n} de {nro(N)}</b> dicen tener inglés fluido, el {coma(FLUIDO.pct)}%. Y se
          reparte muy desparejo por nivel: entre los juniors son {FLU_JUNIOR.fluido} de{" "}
          {FLU_JUNIOR.total}, el {coma(FLU_JUNIOR.pct)}%, y entre los seniors {FLU_SENIOR.fluido} de{" "}
          {FLU_SENIOR.total}, el {coma(FLU_SENIOR.pct)}%. Es lo que más separa a un perfil del resto
          y es lo que menos gente tiene.
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
          <b>{BUSCANDO.n} de {nro(N)}</b>, el {coma(BUSCANDO.pct)}%, están buscando activamente. Si
          se suma a los que están abiertos a ofertas y a los que tienen trabajo pero escuchan, son{" "}
          {nro(MOVILES)}: casi todos se mueven si aparece algo mejor.
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
          Por nivel: {SEN("Junior")} juniors, {SEN("Semi-senior")} semi-seniors, {SEN("Senior")}{" "}
          seniors, {SEN("Lead")} leads y {SEN("Architect")} architects. Por experiencia:{" "}
          {EXP("Menos de 2")} tienen menos de 2 años, {EXP("2 a 4")} entre 2 y 4, {EXP("5 a 8")} entre
          5 y 8 y {EXP("Más de 8")} más de 8. El {Math.round(FULLTIME.pct)}% busca full-time.
        </Resumen>
        <Tabla>
          <thead><tr><th>Rol principal</th><th>Developers</th></tr></thead>
          <tbody>{ROLES.map((r) => (<tr key={r.que}><td>{r.que}</td><td>{r.n}</td></tr>))}</tbody>
        </Tabla>

        <H2 id="metodo">Cómo se midió</H2>
        <Metodo>
          <li>Fuente: el formulario de <Link href="/devs">la red de developers de OpenGateHub</Link>, que se completa solo.</li>
          <li>Periodo: {DESDE} al {HASTA}. {nro(N)} respuestas. Los números se rearman solos desde la base.</li>
          <li>Todo lo que está acá lo declara el propio developer. La tarifa es la que pide, no la que cobra.</li>
          <li>Para las tarifas se usan las {nro(N_TARIFA)} respuestas con un número limpio. Un rango como 25 a 50 queda afuera.</li>
          <li>Mediana y percentiles, no promedio: con tarifas sueltas de 100 o más el promedio engañaría.</li>
          <li>Datos agregados. No se publica ningún nombre, mail, perfil ni CV.</li>
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
            Si lo que buscás es el paso a paso,{" "}
            <Link href="/como-conseguir-trabajo-de-developer">acá está todo lo que miro cuando me
            llega un CV</Link>: qué mirar, cuánto pedir y cómo preparar la entrevista.
          </p>
          <p>
            Y si querés ordenar la búsqueda entera, está el{" "}
            <Link href="/comprar">Acelerador de Carrera Tech</Link>.
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
