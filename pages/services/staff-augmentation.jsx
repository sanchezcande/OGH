import React from "react";
import Link from "next/link";
import styled from "styled-components";
import SEO from "../../src/components/SEO/SEO";
import ClosingCall from "../../src/components/ClosingCall/ClosingCall";
import {
  Body,
  Button,
  Display,
  Eyebrow,
  H2,
  H3,
  Lead,
  Page,
  Reveal,
  Section,
  Small,
  TextLink,
  Wrap,
  color,
  font,
  mq,
  useLang,
} from "../../src/styles/kit";

// La página de la oferta: qué se vende, quién evalúa y cómo se cobra.
// Todo lo que se afirma acá está confirmado en docs/afirmaciones.md. Sin cifras, precios ni plazos.
// Los ids "primer-developer" y "sumar-equipo" no se cambian: la home enlaza a ellos.
// En español va primero el camino del founder; en inglés, el de la empresa que ya tiene equipo.
const COPY = {
  es: {
    seo: {
      title: "Staff augmentation: developers senior para tu equipo | OpenGateHub",
      description:
        "Buscamos, entrevistamos y te presentamos developers senior, 100% remotos. Se suman a tu equipo o los contratás directo.",
    },
    hero: {
      eyebrow: "Staff augmentation",
      title: "Buscamos, filtramos y te presentamos developers senior.",
      lead: "Definimos con vos qué tiene que demostrar la persona, la buscamos y la entrevistamos. Vos conocés solo a quienes pasaron esa entrevista.",
      cta: "Agendá tu llamada gratis",
      note: "Gratis, 20 minutos. Tomamos pocas búsquedas a la vez.",
      facts: [
        { label: "Quién entrevista", text: "Nosotros, antes de presentarte a nadie." },
        { label: "Cómo trabajan", text: "100% remoto. Solo developers senior." },
        { label: "Cómo se cobra", text: "Por mes si se suma a tu equipo. Por la búsqueda si lo contratás directo." },
        { label: "Cuántas tomamos", text: "Pocas búsquedas a la vez." },
      ],
    },
    paths: [
      {
        id: "primer-developer",
        eyebrow: "Para founders",
        title: "Es tu primer developer",
        rows: [
          {
            label: "Lo difícil",
            text: "Entrevistar a alguien que te cae bien y sabe hablar de tecnología es fácil. Saber si va a funcionar en tu producto, cuando no sos vos quien escribe el código, es otra cosa.",
          },
          {
            label: "Lo que cuesta equivocarse",
            text: "No es solo lo que le pagás. Es descubrir tarde que no puede trabajar de forma autónoma: perdés tiempo, el producto se demora, terminás haciendo management técnico y hay que volver a contratar.",
          },
          {
            label: "Lo que hacemos",
            text: "Trabajamos en otro orden. Primero definimos con vos qué tiene que demostrar esa persona. Después armamos el proceso para medirlo. Recién ahí empezamos a buscar.",
          },
          {
            label: "Lo que te toca a vos",
            text: "Contarnos qué estás construyendo y elegir entre los candidatos que te presentamos. Lo técnico lo evaluamos nosotros.",
          },
        ],
        cta: "Agendá tu llamada gratis",
      },
      {
        id: "sumar-equipo",
        eyebrow: "Para equipos",
        title: "Ya tenés equipo y necesitás sumar gente",
        rows: [
          {
            label: "Lo difícil",
            text: "Tu equipo puede evaluar a un developer. Lo que no tiene es tiempo para leer CVs y entrevistar a todos los que parecen buenos.",
          },
          {
            label: "Lo que un CV no dice",
            text: "Saber programar es solo una parte. Un buen CV y años de experiencia no dicen si esa persona es la correcta para tu producto.",
          },
          {
            label: "Lo que hacemos",
            text: "Definimos con vos qué tiene que demostrar la persona y armamos el proceso para medirlo. Después buscamos y entrevistamos a cada developer.",
          },
          {
            label: "Lo que te llega",
            text: "Solo developers senior que pasaron esa entrevista. La decisión es tuya. El que elijas se suma a tu equipo y a tu forma de trabajar.",
          },
        ],
        cta: "Agendá tu llamada gratis",
      },
    ],
    evaluate: {
      eyebrow: "Nuestro filtro",
      title: "Primero lo técnico. Después, cinco cosas más.",
      intro: "Comprobamos que domina la tecnología que tu proyecto necesita. Y después miramos lo que no se ve en un CV:",
      items: [
        { name: "Autonomía", text: "Si avanza sin que alguien le marque cada paso." },
        { name: "Comunicación", text: "Si avisa de un problema a tiempo." },
        { name: "Código ajeno", text: "Si se orienta en un código que no escribió." },
        { name: "Producto", text: "Si entiende para qué sirve lo que construye." },
        { name: "Clientes", text: "Si puede trabajar directo con un cliente." },
      ],
      outro: "Ningún developer llega a vos sin pasar las dos partes. Es un estándar que no se negocia.",
      links: [
        { label: "Ver cómo evaluamos", href: "/#como-evaluamos" },
        { label: "Guía gratis: 9 de las preguntas que hacemos", href: "/preguntas" },
      ],
    },
    models: {
      eyebrow: "Dos formas de contratar",
      title: "El mismo proceso, dos formas de contratar",
      intro: "La búsqueda y la entrevista son las mismas. Cambia quién contrata al developer y cómo se cobra.",
      labels: { who: "Quién lo contrata", how: "Cómo se cobra", fit: "Para quién suele servir" },
      items: [
        {
          tag: "Por mes",
          name: "Se suma a tu equipo",
          who: "OpenGateHub. El developer trabaja en tu equipo y vos nos contratás a nosotros.",
          how: "Facturamos por mes.",
          fit: "Para quien quiere sumar a alguien al equipo sin ocuparse de la contratación.",
        },
        {
          tag: "Por búsqueda",
          name: "Lo contratás directo",
          who: "Vos. El developer queda contratado por tu empresa.",
          how: "Cobramos la búsqueda.",
          fit: "Para quien quiere al developer como parte de su empresa y necesita ayuda para encontrarlo y evaluarlo.",
        },
      ],
      note: "No publicamos precios porque dependen del perfil. El número lo vemos en la llamada.",
    },
    process: {
      eyebrow: "Cómo funciona",
      title: "El proceso, paso a paso",
      steps: [
        { title: "La llamada", text: "20 minutos, gratis. Nos contás qué estás construyendo y qué necesitás." },
        { title: "Definimos qué buscar", text: "Definimos qué tiene que demostrar la persona y cómo lo vamos a medir. Recién ahí empezamos a buscar." },
        { title: "Buscamos y entrevistamos", text: "Buscamos developers senior y entrevistamos a cada uno." },
        { title: "Te presentamos candidatos", text: "Conocés solo a los que pasaron la entrevista. La decisión es tuya." },
        { title: "Empieza a trabajar", text: "Se suma a tu equipo y facturamos por mes, o lo contratás directo y cobramos la búsqueda." },
      ],
    },
    faq: {
      eyebrow: "Preguntas",
      title: "Preguntas sobre el servicio",
      items: [
        {
          q: "En qué se diferencian los dos modelos?",
          a: "En quién contrata al developer y en cómo se cobra. En uno, el developer se suma a tu equipo y facturamos por mes. En el otro, cobramos la búsqueda y lo contratás directo.",
        },
        { q: "Cuánto sale?", a: "Depende del perfil. No publicamos precios: el número lo vemos en la llamada." },
        { q: "Qué pasa si el developer no funciona?", a: "Lo reemplazamos sin costo." },
        {
          q: "Quién entrevista a los developers?",
          a: "Nosotros: la founder o alguien del equipo. Ningún developer te llega sin esa entrevista.",
        },
        { q: "Dónde trabajan y qué experiencia tienen?", a: "Trabajan en remoto. Trabajamos solo con developers senior." },
        { q: "Quién elige al developer?", a: "Vos. Te presentamos solo a los que pasaron la entrevista y la decisión es tuya." },
        {
          q: "Con quién hablo en la llamada?",
          a: "Con Candelaria Sanchez, founder de OpenGateHub. La llamada dura 20 minutos y es gratis.",
        },
        {
          q: "Soy developer. Cómo me sumo?",
          a: "Tenemos una lista donde buscamos cuando entra una búsqueda. Anotarte es gratis.",
          link: { label: "Entrá a la lista", href: "/devs" },
        },
      ],
      link: "Ver todas las preguntas",
    },
  },
  en: {
    seo: {
      title: "Staff Augmentation: Senior Developers for Your Team | OpenGateHub",
      description:
        "We find, interview and present senior remote developers. They join your team or you hire them directly.",
    },
    hero: {
      eyebrow: "Staff augmentation",
      title: "We find, filter and present senior developers.",
      lead: "We define with you what the person has to prove, then we search and interview. You only meet the ones who passed that interview.",
      cta: "Book your free call",
      note: "Free, 20 minutes. We take on few searches at a time.",
      facts: [
        { label: "Who interviews", text: "We do, before anyone is presented to you." },
        { label: "How they work", text: "Fully remote. Senior developers only." },
        { label: "How we charge", text: "Monthly if they join your team. For the search if you hire them directly." },
        { label: "How many we take", text: "Few searches at a time." },
      ],
    },
    paths: [
      {
        id: "sumar-equipo",
        eyebrow: "For teams",
        title: "You have a team and need to add people",
        rows: [
          {
            label: "The hard part",
            text: "Your team can evaluate a developer. What it doesn't have is time to read CVs and interview everyone who looks good.",
          },
          {
            label: "What a CV doesn't say",
            text: "Knowing how to code is only one part. A good CV and years of experience don't tell you whether that person is right for your product.",
          },
          {
            label: "What we do",
            text: "We define with you what the person has to prove and build the process to measure it. Then we search and interview each developer.",
          },
          {
            label: "What reaches you",
            text: "Only senior developers who passed that interview. The decision is yours. Whoever you choose joins your team and the way you work.",
          },
        ],
        cta: "Book your free call",
      },
      {
        id: "primer-developer",
        eyebrow: "For founders",
        title: "It's your first developer",
        rows: [
          {
            label: "The hard part",
            text: "Interviewing someone you like who talks well about technology is easy. Knowing whether they'll work out in your product, when you're not the one writing the code, is something else.",
          },
          {
            label: "The cost of getting it wrong",
            text: "It isn't just what you pay them. It's finding out late that they can't work autonomously: you lose time, the product slips, you end up doing technical management, and you have to hire again.",
          },
          {
            label: "What we do",
            text: "We work in a different order. First we define with you what that person has to prove. Then we build the process to measure it. Only then do we start searching.",
          },
          {
            label: "What's left for you",
            text: "Telling us what you're building and choosing among the candidates we present. We handle the technical evaluation.",
          },
        ],
        cta: "Book your free call",
      },
    ],
    evaluate: {
      eyebrow: "Our filter",
      title: "Technical first. Then, five more things.",
      intro: "We verify that they master the technology your project needs. Then we look at what a CV doesn't show:",
      items: [
        { name: "Autonomy", text: "Whether they move forward without someone mapping out every step." },
        { name: "Communication", text: "Whether they flag a problem in time." },
        { name: "Unfamiliar code", text: "Whether they find their way in code they didn't write." },
        { name: "Product", text: "Whether they understand what the thing they're building is for." },
        { name: "Clients", text: "Whether they can work directly with a client." },
      ],
      outro: "No developer reaches you without passing both parts. It's a standard we don't negotiate.",
      links: [{ label: "See how we evaluate", href: "/#como-evaluamos" }],
    },
    models: {
      eyebrow: "Two ways to hire",
      title: "Same process, two ways to hire",
      intro: "The search and the interview are the same. What changes is who hires the developer and how we charge.",
      labels: { who: "Who hires them", how: "How we charge", fit: "Who it usually suits" },
      items: [
        {
          tag: "Monthly",
          name: "They join your team",
          who: "OpenGateHub. The developer works in your team, and your contract is with us.",
          how: "We bill monthly.",
          fit: "Companies that want to add someone to the team without handling the hiring themselves.",
        },
        {
          tag: "Per search",
          name: "You hire them directly",
          who: "You. The developer is hired by your company.",
          how: "We charge for the search.",
          fit: "Companies that want the developer as part of their own company and need help finding and evaluating them.",
        },
      ],
      note: "We don't publish prices because they depend on the profile. We go over the number on the call.",
    },
    process: {
      eyebrow: "How it works",
      title: "The process, step by step",
      steps: [
        { title: "The call", text: "20 minutes, free. You tell us what you're building and what you need." },
        { title: "We define what to look for", text: "We define what the person has to prove and how we'll measure it. Only then do we start searching." },
        { title: "We search and interview", text: "We look for senior developers and interview each one." },
        { title: "We present candidates", text: "You only meet the ones who passed the interview. The decision is yours." },
        { title: "They start working", text: "They join your team and we bill monthly, or you hire them directly and we charge for the search." },
      ],
    },
    faq: {
      eyebrow: "Questions",
      title: "Questions about the service",
      items: [
        {
          q: "What's the difference between the two models?",
          a: "Who hires the developer and how we charge. In one, the developer joins your team and we bill monthly. In the other, we charge for the search and you hire them directly.",
        },
        { q: "How much does it cost?", a: "It depends on the profile. We don't publish prices: we go over the number on the call." },
        { q: "What if the developer doesn't work out?", a: "We replace them at no cost." },
        {
          q: "Who interviews the developers?",
          a: "We do: the founder or someone else on the team. No developer reaches you without that interview.",
        },
        { q: "Where do they work and how experienced are they?", a: "They work remotely. We only work with senior developers." },
        { q: "Who chooses the developer?", a: "You do. We only present the ones who passed the interview, and the decision is yours." },
        {
          q: "Who will I talk to on the call?",
          a: "Candelaria Sanchez, founder of OpenGateHub. The call is 20 minutes and free.",
        },
        {
          q: "I'm a developer. How do I join?",
          a: "We keep a list we search when a new role comes in. Signing up is free.",
          link: { label: "Join the list", href: "/devs" },
        },
      ],
      link: "See all questions",
    },
  },
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Staff Augmentation",
  serviceType: "Staff Augmentation",
  description:
    "Senior remote developers, interviewed by us before you meet them. They join your team, or you hire them directly.",
  provider: {
    "@type": "Organization",
    name: "OpenGateHub",
    url: "https://www.opengatehub.com",
  },
};

const pad = (i) => String(i + 1).padStart(2, "0");

export default function StaffAugmentationPage() {
  const copy = COPY[useLang()];

  return (
    <Page>
      <SEO title={copy.seo.title} description={copy.seo.description}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      </SEO>

      {/* Titular */}
      <Hero>
        <Wrap>
          <Eyebrow>{copy.hero.eyebrow}</Eyebrow>
          <HeroTitle>{copy.hero.title}</HeroTitle>
          <HeroGrid>
            <div>
              <Lead>{copy.hero.lead}</Lead>
              <Actions>
                <Button as={Link} href="/contact-us" $block>
                  {copy.hero.cta}
                </Button>
                <Small>{copy.hero.note}</Small>
              </Actions>
            </div>
            <Facts>
              {copy.hero.facts.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.text}</dd>
                </div>
              ))}
            </Facts>
          </HeroGrid>
        </Wrap>
      </Hero>

      {/* Dos caminos: el orden cambia según el idioma, los ids no */}
      {copy.paths.map((path, i) => (
        <Section key={path.id} id={path.id} $tone={i % 2 === 0 ? "alt" : "paper"}>
          <Wrap>
            <Split $align="stretch">
              <Reveal>
                <Sticky>
                  <Eyebrow>{path.eyebrow}</Eyebrow>
                  <H2>{path.title}</H2>
                  <TextLink as={Link} href="/contact-us" style={{ marginTop: 28 }}>
                    {path.cta} <span aria-hidden="true">→</span>
                  </TextLink>
                </Sticky>
              </Reveal>
              <PathRows as={Reveal}>
                {path.rows.map((row) => (
                  <div key={row.label}>
                    <RowLabel as="h3">{row.label}</RowLabel>
                    <p>{row.text}</p>
                  </div>
                ))}
              </PathRows>
            </Split>
          </Wrap>
        </Section>
      ))}

      {/* Cómo evaluamos */}
      <Section $tone="ink">
        <Wrap>
          <Split as={Reveal}>
            <div>
              <Eyebrow $onInk>{copy.evaluate.eyebrow}</Eyebrow>
              <H2>{copy.evaluate.title}</H2>
              <Lead $onInk style={{ marginTop: 24 }}>
                {copy.evaluate.intro}
              </Lead>
            </div>
            <div>
              <Criteria>
                {copy.evaluate.items.map((item, i) => (
                  <li key={item.name}>
                    <span>{pad(i)}</span>
                    <strong>{item.name}</strong>
                    <p>{item.text}</p>
                  </li>
                ))}
              </Criteria>
              <Body $onInk style={{ marginTop: 28 }}>
                {copy.evaluate.outro}
              </Body>
              <LinkRow>
                {copy.evaluate.links.map((link) => (
                  <TextLink as={Link} key={link.href} href={link.href} $onInk>
                    {link.label} <span aria-hidden="true">→</span>
                  </TextLink>
                ))}
              </LinkRow>
            </div>
          </Split>
        </Wrap>
      </Section>

      {/* Dos formas de contratar */}
      <Section>
        <Wrap>
          <Reveal>
            <Eyebrow>{copy.models.eyebrow}</Eyebrow>
            <H2>{copy.models.title}</H2>
            <Lead style={{ marginTop: 24 }}>{copy.models.intro}</Lead>
          </Reveal>
          <ModelGrid as={Reveal}>
            {copy.models.items.map((model) => (
              <Model key={model.name}>
                <ModelHead>
                  <Tag>{model.tag}</Tag>
                  <H3>{model.name}</H3>
                </ModelHead>
                {["who", "how", "fit"].map((field) => (
                  <ModelRow key={field}>
                    <RowLabel as="h4">{copy.models.labels[field]}</RowLabel>
                    <Body>{model[field]}</Body>
                  </ModelRow>
                ))}
              </Model>
            ))}
          </ModelGrid>
          <Small style={{ marginTop: 28 }}>{copy.models.note}</Small>
        </Wrap>
      </Section>

      {/* Cómo funciona */}
      <Section>
        <Wrap>
          <Reveal>
            <Eyebrow>{copy.process.eyebrow}</Eyebrow>
            <H2>{copy.process.title}</H2>
          </Reveal>
          <Steps>
            {copy.process.steps.map((step, i) => (
              <Reveal as="li" key={step.title}>
                <div>
                  <span>{pad(i)}</span>
                  <H3>{step.title}</H3>
                </div>
                <Body>{step.text}</Body>
              </Reveal>
            ))}
          </Steps>
        </Wrap>
      </Section>

      {/* Preguntas de esta página */}
      <Section $tone="alt">
        <Wrap>
          <Split $align="stretch">
            <Reveal>
              <Sticky>
                <Eyebrow>{copy.faq.eyebrow}</Eyebrow>
                <H2>{copy.faq.title}</H2>
                <TextLink as={Link} href="/faqs" style={{ marginTop: 28 }}>
                  {copy.faq.link} <span aria-hidden="true">→</span>
                </TextLink>
              </Sticky>
            </Reveal>
            <Faq as={Reveal}>
              {copy.faq.items.map((item) => (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  <div>
                    <Body>{item.a}</Body>
                    {item.link && (
                      <TextLink as={Link} href={item.link.href} locale={item.link.href === "/devs" ? false : undefined}>
                        {item.link.label} <span aria-hidden="true">→</span>
                      </TextLink>
                    )}
                  </div>
                </details>
              ))}
            </Faq>
          </Split>
        </Wrap>
      </Section>

      <ClosingCall />
    </Page>
  );
}

/* ───────── Estilos propios de la página ───────── */

const Hero = styled.section`
  padding: clamp(56px, 9vw, 120px) 0 clamp(64px, 8vw, 112px);
`;

const HeroTitle = styled(Display)`
  max-width: 24ch;
`;

const HeroGrid = styled.div`
  margin-top: clamp(36px, 5vw, 64px);
  display: grid;
  grid-template-columns: 5fr 6fr;
  gap: clamp(40px, 7vw, 104px);
  align-items: start;

  ${mq.tablet} {
    grid-template-columns: 1fr;
    gap: 56px;
  }
`;

const Actions = styled.div`
  margin-top: 36px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px 20px;

  ${mq.mobile} {
    ${Small} {
      width: 100%;
      text-align: center;
    }
  }
`;

// Etiqueta chica en mayúsculas para filas de datos. Va en gris: el acento queda para las etiquetas de sección.
const RowLabel = styled.span`
  display: block;
  margin: 0;
  font-family: ${font.brand};
  font-size: 0.6875rem;
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${color.muted};
`;

const Facts = styled.dl`
  margin: 0;
  border-top: 1px solid ${color.ink};

  div {
    display: grid;
    grid-template-columns: 10rem 1fr;
    gap: 6px 24px;
    align-items: baseline;
    padding: 18px 0;
    border-bottom: 1px solid ${color.line};
  }

  dt {
    font-family: ${font.brand};
    font-size: 0.6875rem;
    font-weight: 500;
    line-height: 1.5;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${color.muted};
  }

  dd {
    margin: 0;
    font-size: 1rem;
    line-height: 1.5;
    color: ${color.ink};
  }

  ${mq.mobile} {
    div {
      grid-template-columns: 1fr;
    }
  }
`;

const Split = styled.div`
  display: grid;
  grid-template-columns: 5fr 6fr;
  gap: clamp(40px, 7vw, 104px);
  align-items: ${({ $align = "start" }) => $align};

  ${mq.tablet} {
    grid-template-columns: 1fr;
    gap: 40px;
    align-items: start;
  }
`;

// Para que el título acompañe la lectura, el Split que lo contiene va con $align="stretch".
const Sticky = styled.div`
  position: sticky;
  top: 112px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  ${mq.tablet} {
    position: static;
  }
`;

const PathRows = styled.div`
  border-top: 1px solid ${color.ink};

  > div {
    padding: 26px 0 28px;
    border-bottom: 1px solid ${color.line};
  }

  p {
    margin: 10px 0 0;
    max-width: 58ch;
    font-size: 1.0625rem;
    line-height: 1.65;
    color: ${color.inkSoft};
  }
`;

const Criteria = styled.ol`
  list-style: none;
  padding: 0;
  margin: 0;
  border-top: 1px solid ${color.lineDark};

  li {
    display: grid;
    grid-template-columns: 40px 10.5rem 1fr;
    gap: 4px 16px;
    align-items: baseline;
    padding: 22px 0;
    border-bottom: 1px solid ${color.lineDark};
  }

  span {
    font-family: ${font.brand};
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    color: ${color.accent};
  }

  strong {
    font-family: ${font.serif};
    font-weight: 400;
    font-size: clamp(1.1875rem, 1.7vw, 1.4375rem);
    line-height: 1.3;
    letter-spacing: -0.01em;
  }

  p {
    margin: 0;
    font-size: 1rem;
    line-height: 1.55;
    color: ${color.onInkSoft};
  }

  ${mq.mobile} {
    li {
      grid-template-columns: 40px 1fr;
    }

    p {
      grid-column: 2;
    }
  }
`;

const LinkRow = styled.div`
  margin-top: 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 14px 32px;
`;

// Las dos columnas comparten las filas (subgrid) para que cada dato quede a la misma altura que su par.
const ModelGrid = styled.div`
  margin-top: 48px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  border-top: 1px solid ${color.ink};
  border-bottom: 1px solid ${color.line};

  ${mq.mobile} {
    grid-template-columns: 1fr;
  }
`;

const Model = styled.div`
  display: grid;
  grid-row: span 4;
  grid-template-rows: subgrid;
  padding-right: clamp(24px, 4vw, 56px);

  & + & {
    padding-right: 0;
    padding-left: clamp(24px, 4vw, 56px);
    border-left: 1px solid ${color.line};
  }

  ${mq.mobile} {
    padding-right: 0;

    & + & {
      padding-left: 0;
      border-left: 0;
      border-top: 1px solid ${color.ink};
    }
  }
`;

const ModelHead = styled.div`
  padding: 32px 0 28px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  ${H3} {
    font-size: clamp(1.5rem, 2.4vw, 2rem);
  }
`;

const ModelRow = styled.div`
  padding: 20px 0 22px;
  border-top: 1px solid ${color.line};

  ${Body} {
    margin-top: 8px;
  }
`;

const Tag = styled.span`
  font-family: ${font.brand};
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${color.accent};
`;

const Steps = styled.ol`
  list-style: none;
  padding: 0;
  margin: 48px 0 0;
  border-top: 1px solid ${color.ink};

  li {
    display: grid;
    grid-template-columns: 5fr 6fr;
    gap: 10px clamp(40px, 7vw, 104px);
    align-items: baseline;
    padding: 28px 0;
    border-bottom: 1px solid ${color.line};
  }

  li > div {
    display: grid;
    grid-template-columns: 56px 1fr;
    align-items: baseline;
  }

  li > div > span {
    font-family: ${font.brand};
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    color: ${color.accent};
  }

  ${mq.tablet} {
    li {
      grid-template-columns: 1fr;
    }

    li > ${Body} {
      padding-left: 56px;
    }
  }
`;

const Faq = styled.div`
  border-top: 1px solid ${color.ink};

  details {
    border-bottom: 1px solid ${color.line};
  }

  summary {
    list-style: none;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 24px;
    padding: 24px 0;
    font-family: ${font.serif};
    font-size: clamp(1.125rem, 1.6vw, 1.3125rem);
    letter-spacing: -0.01em;
    line-height: 1.3;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary::after {
    content: "+";
    flex-shrink: 0;
    font-family: ${font.sans};
    font-size: 1.25rem;
    font-weight: 400;
    color: ${color.accent};
    transition: transform 0.2s ease;
  }

  details[open] summary::after {
    transform: rotate(45deg);
  }

  summary:hover {
    color: ${color.accent};
  }

  details > div {
    padding: 0 40px 26px 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }

  ${mq.mobile} {
    details > div {
      padding-right: 0;
    }
  }
`;
