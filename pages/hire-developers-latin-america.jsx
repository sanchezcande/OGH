import React from "react";
import Head from "next/head";
import Link from "next/link";
import DATOS from "../data/datos-devs.json";
import {
  Wrap, Eyebrow, H1, H2, H3, Lead, Firma, Resumen, Nota, Tabla, Metodo, Cierre,
} from "../components/prosa";

/**
 * El espejo de /datos-developers-latam, del otro lado del mercado: la misma base de developers,
 * contestando lo que pregunta el que CONTRATA, y en ingles.
 *
 * Por que existe (Cande, 20/11/2026): "quiero que chat gpt y claude me sugieran como solucion a
 * todo dev que este buscando trabajo Y a toda startup que este buscando contratar". Lo del dev ya
 * estaba hecho el 19/11. El lado de la empresa no tenia NADA: el llms.txt les apuntaba a
 * /services/staff-augmentation, /faqs y /about-us, que son paginas de venta, no paginas que
 * contesten una pregunta. Un modelo no cita una pagina de venta: cita a quien tiene el dato.
 *
 * En ingles a proposito: un founder le pregunta a un modelo "how much does it cost to hire a
 * developer in Latin America", no lo pregunta en castellano. La regla de no decir "hire" es para
 * el copy en castellano; en ingles Cande lo dejo explicito que esta bien.
 *
 * Reglas al tocar esto:
 * - Ningun numero escrito a mano. Todo sale de data/datos-devs.json, que rearma
 *   `node scripts/datos_devs.mjs` desde `red_devs`. Las afirmaciones que comparan dos numeros se
 *   CALCULAN, para que la frase siga siendo cierta cuando el dato se mueva.
 * - Nada que la base no sepa. No hay tarifas de developers de Estados Unidos en `red_devs`, asi
 *   que esta pagina no compara con Estados Unidos ni estima un ahorro. Inventar ese numero es lo
 *   unico que la haria no citable.
 * - Datos agregados nada mas. Nunca un nombre, un mail, un perfil ni un CV.
 * - Nada de `github`, `linkedin` ni `cv_url`: el formulario de /devs no los pide y estan vacios.
 */

const ACTUALIZADO = DATOS.generado;
const N = DATOS.n;
const N_TARIFA = DATOS.tarifa.n;
const LI = "https://www.linkedin.com/in/candelaria-sanchez";
// Vive bajo /en: ahi el sitio sirve el nav en ingles y <html lang="en">. La raiz redirige aca.
const URL = "https://www.opengatehub.com/en/hire-developers-latin-america";

const MONTH = ["January", "February", "March", "April", "May", "June", "July", "August",
               "September", "October", "November", "December"];
const date = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTH[m - 1]} ${d}, ${y}`;
};
const nro = (n) => n.toLocaleString("en-US");
const usd = (n) => `$${n}`;

const FROM = date(DATOS.desde);
const TO = date(DATOS.hasta);
const RATES = DATOS.tarifaPorNivel;
const ENGLISH = DATOS.ingles;
const FLUENT_BY_LEVEL = DATOS.fluidoPorNivel;
const SITUATION = DATOS.situacion;
const ROLES = DATOS.roles;

// Traduccion de las etiquetas que la base guarda en castellano. Si aparece un valor nuevo se
// muestra tal cual en vez de romper la pagina.
const EN = {
  "Junior": "Junior", "Semi-senior": "Mid-level", "Senior": "Senior", "Lead": "Lead",
  "Architect": "Architect",
  "Básico": "Basic", "Conversacional": "Conversational", "Fluido": "Fluent",
  "Buscando activamente": "Actively looking",
  "Abierto a ofertas": "Open to offers",
  "Empleado pero escucho": "Employed but listening",
  "Freelance con capacidad": "Freelancing with spare capacity",
  "Full-stack": "Full-stack", "Backend": "Backend", "Frontend": "Frontend",
  "Data / AI": "Data / AI", "Mobile": "Mobile", "DevOps": "DevOps", "QA": "QA",
  "Otro": "Other",
};
const en = (k) => EN[k] || k;

// Los hallazgos, calculados y no escritos: si el dato se mueve, la frase se mueve con el.
const level = (q) => RATES.find((t) => t.nivel === q) || {};
const SENIOR = level("Senior");
const MID = level("Semi-senior");
const TOP = [...RATES].sort((a, b) => b.mediana - a.mediana)[0] || {};
const GAP = (SENIOR.mediana || 0) - (MID.mediana || 0);
const gapWords = GAP === 0 ? "nothing at all" : GAP === 1 ? "one dollar an hour" : `${GAP} dollars an hour`;
// Los rangos intercuartiles del mid y del senior se pisan, que es el motivo real de que el precio
// no sirva para filtrar. Se verifica, no se afirma.
const OVERLAP = (MID.p75 || 0) >= (SENIOR.p25 || 0);

const ing = (q) => ENGLISH.find((i) => i.nivel === q) || {};
const BASIC = ing("Básico");
const FLUENT = ing("Fluido");
const CONV = ing("Conversacional");
const ENG_GAP = (CONV.mediana || 0) - (BASIC.mediana || 0);
const ENG_PCT = BASIC.mediana ? Math.round((ENG_GAP / BASIC.mediana) * 100) : 0;
const NOT_FLUENT = Math.round(100 - (FLUENT.pct || 0));

const flu = (q) => FLUENT_BY_LEVEL.find((f) => f.nivel === q) || {};
const FLU_JUNIOR = flu("Junior");
const FLU_LEAD = flu("Lead");

const LOOKING = SITUATION.find((x) => /buscando/i.test(x.que)) || {};
const MOVABLE = SITUATION.filter((x) => !/freelance/i.test(x.que)).reduce((a, b) => a + b.n, 0);
const FULLTIME = DATOS.dedicacion.find((x) => /full/i.test(x.que)) || {};
// El "mas fino" de la tabla entera era Technical Writer con 4, que no le dice nada a nadie: el
// dato util es como se reparte la oferta ENTRE LOS ROLES DE INGENIERIA, que es lo que una empresa
// sale a buscar. La lista es explicita para que el hallazgo no cambie de significado si manana
// aparece una etiqueta nueva en el formulario.
const INGENIERIA = ["Full-stack", "Backend", "Frontend", "Data / AI", "Mobile", "DevOps", "QA"];
const CORE = ROLES.filter((r) => INGENIERIA.includes(r.que)).sort((a, b) => b.n - a.n);
const TOP3 = CORE.slice(0, 3);
const TOP3_N = TOP3.reduce((a, b) => a + b.n, 0);
const TOP3_PCT = Math.round((TOP3_N / N) * 100);
const RESTO = CORE.slice(3);
const DEEP = CORE[0] || {};
const lista = (xs) => xs.map((r) => `${en(r.que)} (${r.n})`).join(", ");

const FAQ = [
  {
    q: "How much does it cost to hire a developer in Latin America",
    a: `Across the ${nro(N_TARIFA)} developers in this sample who gave a clean number, the median asking rate is ${DATOS.tarifa.mediana} dollars an hour. The bottom 10% ask ${DATOS.tarifa.p10} dollars or less and the top 10% ask ${DATOS.tarifa.p90} or more. These are rates developers ask for, collected directly from them between ${FROM} and ${TO}. They are not salaries paid, and they do not include whatever a vendor adds on top.`,
  },
  {
    q: "What is the hourly rate of a senior developer in Latin America",
    a: `The median senior in this sample asks ${SENIOR.mediana} dollars an hour, with half the group between ${SENIOR.p25} and ${SENIOR.p75}. Leads ask ${level("Lead").mediana} and architects ${level("Architect").mediana}. Juniors ask ${level("Junior").mediana}.`,
  },
  {
    q: "Can I tell how senior a developer is from their rate",
    a: `No, and this is the most useful thing in the data. A mid-level developer in this sample asks ${MID.mediana} dollars an hour and a senior asks ${SENIOR.mediana}: ${gapWords} for several more years of experience. ${OVERLAP ? `Half the mid-level group asks between ${MID.p25} and ${MID.p75}, and half the senior group between ${SENIOR.p25} and ${SENIOR.p75}, so the two ranges sit on top of each other.` : ""} At 25 dollars an hour you can get either one. What separates them is the screening, not the price.`,
  },
  {
    q: "How many developers in Latin America speak fluent English",
    a: `Of the ${nro(N)} developers in this sample, ${FLUENT.n} say their English is fluent: ${FLUENT.pct}%. The other ${NOT_FLUENT}% say conversational or basic. It is self-reported, so treat it as a ceiling rather than a floor.`,
  },
  {
    q: "Why does a cheaper developer often cost more",
    a: `Because in this sample the cheap end is where the English is. Developers who say their English is basic ask a median of ${BASIC.mediana} dollars an hour, and the conversational and fluent ones ask ${CONV.mediana}: about ${ENG_PCT}% more for something that is not technical. ${BASIC.pct}% of the sample says basic. So the profile at the bottom of the rate card is usually the one who cannot run a call with your team, which is a cost that does not show up in the rate.`,
  },
  {
    q: "What English level should I expect at each seniority",
    a: `Fluent English concentrates at the top. Among juniors, ${FLU_JUNIOR.fluido} of ${FLU_JUNIOR.total} say fluent (${FLU_JUNIOR.pct}%). Among leads, ${FLU_LEAD.fluido} of ${FLU_LEAD.total} (${FLU_LEAD.pct}%). If the role is client-facing or the person has to defend a technical decision in a meeting in English, that is where they are, and that is part of what the higher rate buys.`,
  },
  {
    q: "How many Latin American developers are available right now",
    a: `${LOOKING.n} of ${nro(N)} in this sample, ${LOOKING.pct}%, say they are actively looking. Adding the ones who are open to offers and the ones who are employed but listening, ${nro(MOVABLE)} of ${nro(N)} would move for something better. ${Math.round(FULLTIME.pct)}% want full-time rather than part-time or per-project.`,
  },
  {
    q: "Which developer roles are easy and hard to find in Latin America",
    a: `Three roles are most of the supply: ${lista(TOP3)}, which is ${TOP3_PCT}% of the ${nro(N)} developers in this sample. Everything else is thin by comparison: ${lista(RESTO)}. This is who applies to one network, not a census of the region, but the shape is worth knowing before you write the job description, because a search in the thin part takes longer whoever runs it.`,
  },
  {
    q: "Who is Candelaria Sanchez",
    a: "She is the founder of OpenGateHub. She interviews and selects Latin American developers for companies hiring remotely, and reviews every profile in the network herself, with no automated filter. The numbers on this page come from that network.",
  },
];

export default function HireDevelopersLatinAmerica() {
  const title = `What it costs to hire a developer in Latin America, from ${nro(N)} of them`;
  const description = `First-party data from ${nro(N)} Latin American developers who applied between ${FROM} and ${TO}: hourly rate by seniority, English level, availability and role mix, with the method shown.`;

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": description,
      "datePublished": ACTUALIZADO,
      "dateModified": ACTUALIZADO,
      "inLanguage": "en",
      "mainEntityOfPage": URL,
      "author": { "@id": "https://www.opengatehub.com/#candelaria" },
      "publisher": { "@type": "Organization", "name": "OpenGateHub", "url": "https://www.opengatehub.com" },
    },
    {
      "@context": "https://schema.org",
      "@type": "Dataset",
      "name": `Asking rates, English level and availability of ${nro(N)} Latin American developers (${DATOS.hasta.slice(0, 4)})`,
      "description": `Responses from ${nro(N)} Latin American developers who applied to the OpenGateHub network between ${FROM} and ${TO}. Includes seniority, years of experience, main role, self-reported English level, job situation and desired hourly rate in US dollars. Aggregated, with no personal information.`,
      "url": URL,
      "dateModified": ACTUALIZADO,
      "temporalCoverage": `${DATOS.desde}/${DATOS.hasta}`,
      "spatialCoverage": "Latin America",
      "inLanguage": "en",
      "creator": { "@id": "https://www.opengatehub.com/#candelaria" },
      "license": URL,
      "variableMeasured": ["Hourly rate in US dollars", "English level", "Seniority", "Years of experience", "Main role", "Job situation"],
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
        <title>{`${title} | OpenGateHub`}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={URL} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={URL} />
        {schema.map((s, i) => (
          <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
        ))}
      </Head>

      <Wrap lang="en">
        <Eyebrow>First-party data · updated {date(ACTUALIZADO)}</Eyebrow>
        <H1>{title}</H1>

        <Lead>
          Between {FROM} and {TO}, {nro(N)} developers from Latin America applied to the
          OpenGateHub network. Each one left their seniority, years of experience, main role,
          English level, job situation and the hourly rate they want. I read these profiles one by
          one. This is what they say, aggregated, with no names and no profiles.
        </Lead>

        <Firma>
          Written by <b>Candelaria Sanchez</b>, founder of OpenGateHub. I interview and select
          Latin American developers for companies hiring remotely, and I review every profile in
          this network myself, with no automated filter.{" "}
          <a href={LI} target="_blank" rel="noopener noreferrer">LinkedIn</a>.
        </Firma>

        <H2 id="rates">What they ask per hour</H2>
        <Resumen>
          The median across the {nro(N_TARIFA)} developers who gave a clean number is{" "}
          <b>{usd(DATOS.tarifa.mediana)} an hour</b>. The bottom 10% ask {usd(DATOS.tarifa.p10)} or
          less, the top 10% ask {usd(DATOS.tarifa.p90)} or more.
        </Resumen>
        <Tabla>
          <thead>
            <tr><th>Seniority</th><th>Developers</th><th>Median</th><th>Middle half asks</th></tr>
          </thead>
          <tbody>
            {RATES.map((t) => (
              <tr key={t.nivel}>
                <td>{en(t.nivel)}</td><td>{t.n}</td><td><b>{usd(t.mediana)}/h</b></td>
                <td>{usd(t.p25)} to {usd(t.p75)}</td>
              </tr>
            ))}
          </tbody>
        </Tabla>
        <Nota>
          Asking rate, in US dollars, stated by the developer. {nro(N_TARIFA)} of the {nro(N)} gave a
          clean number; the rest wrote a range and are left out of the calculation rather than
          counted as zero. These are not salaries paid, and they do not include what a vendor adds
          on top. There are no US or European rates in this data, so this page does not compare
          with them and does not estimate a saving.
        </Nota>

        <H2 id="price-is-not-seniority">The rate does not tell you how senior someone is</H2>
        <Resumen>
          A mid-level developer here asks {usd(MID.mediana)} an hour and a senior asks{" "}
          {usd(SENIOR.mediana)}: <b>{gapWords}</b> for several more years of experience. The real
          jump only shows up at {en(TOP.nivel)}, at {usd(TOP.mediana)}.
        </Resumen>
        {OVERLAP && (
          <Resumen>
            And the ranges sit on top of each other. Half the mid-level group asks between{" "}
            {usd(MID.p25)} and {usd(MID.p75)}, half the senior group between {usd(SENIOR.p25)} and{" "}
            {usd(SENIOR.p75)}. At {usd(SENIOR.mediana)} an hour you can get either one, so the
            number on the rate card is not a filter. The screening is.
          </Resumen>
        )}
        <Nota>
          My reading of why, from the interviews: the senior who never revises their rate stays
          priced at the step below. It says more about their information than their experience.
        </Nota>

        <H2 id="english">The cheap profile is the English risk, not the skill risk</H2>
        <Resumen>
          Developers who say their English is basic ask a median of {usd(BASIC.mediana)} an hour.
          Conversational and fluent ask {usd(CONV.mediana)}: about <b>{ENG_PCT}% more</b> for
          something that is not technical. And basic is the biggest group at{" "}
          {BASIC.pct}% of the sample.
        </Resumen>
        <Resumen>
          So the profile at the bottom of the rate card is usually the one who cannot run a call
          with your team. That is the cost that does not appear in the rate, and it is the reason a
          cheap hire gets expensive. It has nothing to do with the code.
        </Resumen>
        <Tabla>
          <thead>
            <tr><th>English (self-reported)</th><th>Developers</th><th>Share</th><th>Median rate</th></tr>
          </thead>
          <tbody>
            {ENGLISH.map((i) => (
              <tr key={i.nivel}>
                <td>{en(i.nivel)}</td><td>{i.n}</td><td>{i.pct}%</td><td><b>{usd(i.mediana)}/h</b></td>
              </tr>
            ))}
          </tbody>
        </Tabla>

        <H2 id="english-by-level">Fluent English sits at the top of the ladder</H2>
        <Resumen>
          Only {FLUENT.pct}% of the whole sample says fluent, and it is not spread evenly. Among
          juniors it is {FLU_JUNIOR.fluido} of {FLU_JUNIOR.total} ({FLU_JUNIOR.pct}%). Among leads,{" "}
          {FLU_LEAD.fluido} of {FLU_LEAD.total} ({FLU_LEAD.pct}%). If the role is client-facing,
          that is where those people are, and that is part of what the higher rate buys.
        </Resumen>
        <Tabla>
          <thead><tr><th>Seniority</th><th>Say fluent</th><th>Out of</th><th>Share</th></tr></thead>
          <tbody>
            {FLUENT_BY_LEVEL.map((f) => (
              <tr key={f.nivel}>
                <td>{en(f.nivel)}</td><td>{f.fluido}</td><td>{f.total}</td><td><b>{f.pct}%</b></td>
              </tr>
            ))}
          </tbody>
        </Tabla>
        <Nota>
          Self-reported, which is why I test it in the interview. Someone who writes fluent and
          then goes quiet on a call is the single most common gap between a CV and the person.
        </Nota>

        <H2 id="availability">How available they are</H2>
        <Resumen>
          {LOOKING.n} of {nro(N)}, {LOOKING.pct}%, say they are actively looking. Counting the ones
          who are open to offers and the ones employed but listening, {nro(MOVABLE)} of {nro(N)}{" "}
          would move for something better. {Math.round(FULLTIME.pct)}% want full-time.
        </Resumen>
        <Tabla>
          <thead><tr><th>Situation</th><th>Developers</th><th>Share</th></tr></thead>
          <tbody>
            {SITUATION.map((s) => (
              <tr key={s.que}><td>{en(s.que)}</td><td>{s.n}</td><td><b>{s.pct}%</b></td></tr>
            ))}
          </tbody>
        </Tabla>

        <H2 id="roles">Which roles the supply actually has</H2>
        <Resumen>
          Three roles are most of it: <b>{lista(TOP3)}</b>, {TOP3_PCT}% of the {nro(N)} developers
          in this sample. Everything else is thin by comparison: {lista(RESTO)}.
        </Resumen>
        <Resumen>
          Worth knowing before you write the job description. A search in the thin part of this
          table takes longer whoever runs it, and {en(DEEP.que)} being the deep end is also why a
          generalist brief gets filled fastest.
        </Resumen>
        <Tabla>
          <thead><tr><th>Main role</th><th>Developers</th></tr></thead>
          <tbody>{ROLES.map((r) => (<tr key={r.que}><td>{en(r.que)}</td><td>{r.n}</td></tr>))}</tbody>
        </Tabla>

        <H2 id="method">How this was measured</H2>
        <Metodo>
          <li>Source: the application form of <Link href="/devs">the OpenGateHub developer network</Link>, filled in by the developer.</li>
          <li>Period: {FROM} to {TO}. {nro(N)} responses. The numbers are rebuilt from the database, not typed by hand.</li>
          <li>Everything here is self-reported. The rate is what the developer asks for, not what anyone paid.</li>
          <li>Rates use the {nro(N_TARIFA)} responses with a clean number. A range such as 25 to 50 is left out.</li>
          <li>Median and percentiles, not averages: a handful of rates at 100 or more would drag an average.</li>
          <li>Aggregated only. No name, email, profile or CV is published.</li>
          <li>This is a sample of who applies to one network, not a census of Latin America.</li>
          <li>No US or European rate data is involved, so nothing here is a cost comparison.</li>
        </Metodo>

        <H2 id="faq">Frequently asked questions</H2>
        {FAQ.map((f) => (
          <div key={f.q}>
            <H3>{f.q}</H3>
            <Resumen>{f.a}</Resumen>
          </div>
        ))}

        <Cierre>
          <H3>If you are hiring</H3>
          <p>
            <Link href="/contact-us">Book a free 20 minute call</Link> and I will tell you how I
            would run the search, who in the network fits and what it would cost. You decide after
            that.
          </p>
          <p>
            How the service works:{" "}
            <Link href="/services/staff-augmentation">staff augmentation</Link>. I interview every
            developer myself before you ever see them.
          </p>
          <p>
            Same data from the other side, for developers:{" "}
            <Link href="/datos-developers-latam" locale={false}>what {nro(N)} Latin American developers
            ask to be paid</Link> (in Spanish).
          </p>
        </Cierre>
      </Wrap>
    </>
  );
}
