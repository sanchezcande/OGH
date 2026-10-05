import React from "react";
import Link from "next/link";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import SEO from "../src/components/SEO/SEO";
import ClosingCall from "../src/components/ClosingCall/ClosingCall";
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
} from "../src/styles/kit";

// Todo lo que se afirma acá está confirmado por la dueña.
// No se agregan cifras, clientes ni promesas sin confirmar.
const COPY = {
  es: {
    seo: {
      title: "Staff augmentation y contratación de developers senior | OpenGateHub",
      description:
        "Te conseguimos el developer senior que tu proyecto necesita. 100% remoto y entrevistado por nosotros antes de que lo conozcas. Llamada gratis de 20 minutos.",
    },
    hero: {
      eyebrow: "Staff augmentation · Contratación de developers",
      title: "Te conseguimos el developer que tu proyecto necesita.",
      lead: "Vos no leés CVs ni entrevistás a ciegas. Nuestros ingenieros evalúan lo técnico y cómo trabaja cada persona, y te presentamos únicamente al top 5%.",
      primary: "Agendá tu llamada gratis",
      secondary: { text: "Guía gratis:", label: "9 preguntas para entrevistar a un developer", href: "/preguntas" },
      note: "Gratis, 20 minutos. Tomamos pocas búsquedas a la vez.",
      assurances: [
        { title: "Evaluados por ingenieros", text: "No por reclutadores: por gente que programa." },
        { title: "Solo senior, 100% remoto", text: "Es el único perfil con el que trabajamos." },
        { title: "Calidad garantizada", text: "Solo te presentamos a quien contrataríamos nosotros." },
      ],
    },
    offer: {
      eyebrow: "Sin letra chica",
      title: "Qué es gratis y qué se paga",
      rows: [
        {
          tag: "Gratis",
          name: "La guía",
          text: "9 preguntas para entrevistar a un developer, con lo que tenés que escuchar en cada respuesta.",
          cta: "Llevate la guía",
          href: "/preguntas",
        },
        {
          tag: "Gratis",
          name: "La llamada",
          text: "20 minutos. Nos contás qué estás construyendo y vemos cómo armar la búsqueda de tu developer.",
          cta: "Agendá tu llamada",
          href: "/contact-us",
        },
        {
          tag: "Pago",
          name: "El servicio",
          text: "Buscamos, filtramos y te presentamos solo developers senior que pasaron nuestro filtro técnico y humano. Se suman a tu equipo y facturamos por mes, o cobramos la búsqueda y lo contratás directo.",
          cta: "Ver cómo funciona",
          href: "/services/staff-augmentation",
        },
      ],
    },
    problem: {
      eyebrow: "El problema",
      title: "Un mal developer no te cuesta un sueldo. Te cuesta meses.",
      paragraphs: [
        "El problema no es encontrar candidatos. Es que tres parecen buenos y tenés que elegir uno.",
        "Un buen CV, buen inglés y cinco años de React no dicen si esa persona es la correcta para tu producto. Te enterás dos meses después: perdés tiempo, el producto se demora, terminás haciendo management técnico y tenés que volver a contratar.",
        "Por eso el filtro va antes de contratar, no después.",
      ],
    },
    audience: {
      eyebrow: "Para quién",
      title: "Dos formas de llegar acá",
      cards: [
        {
          title: "Es tu primer developer",
          text: "Vas a elegir a alguien que sabe más que vos de su trabajo. Definimos con vos qué tiene que demostrar, lo buscamos y lo entrevistamos. Vos elegís entre los que pasaron los dos filtros.",
          cta: "Cómo trabajamos con founders",
          href: "/services/staff-augmentation#primer-developer",
        },
        {
          title: "Ya tenés equipo y necesitás sumar gente",
          text: "Tu equipo no tiene tiempo para leer cien CVs. Te presentamos developers senior ya entrevistados, listos para sumarse a tu forma de trabajar.",
          cta: "Cómo sumamos a un equipo",
          href: "/services/staff-augmentation#sumar-equipo",
        },
      ],
    },
    evaluate: {
      eyebrow: "Nuestro filtro",
      title: "Primero, que sepa. Después, todo lo demás.",
      intro: "Empezamos por lo técnico: comprobamos que domina la tecnología que tu proyecto necesita. Después viene lo que no se ve en un CV:",
      items: [
        "Puede trabajar sin que alguien le diga qué hacer cada hora?",
        "Sabe comunicar un problema antes de que se convierta en un desastre?",
        "Puede entrar a un código que no conoce y orientarse?",
        "Entiende el producto o solamente ejecuta tareas?",
        "Lo dejarías trabajando directamente con un cliente?",
      ],
      outro: "Ningún developer llega a vos sin pasar las dos partes. Es un estándar que no se negocia.",
      link: { label: "Guía gratis: 9 de las preguntas que hacemos en una entrevista", href: "/preguntas" },
    },
    process: {
      eyebrow: "Cómo funciona",
      title: "De la llamada al developer trabajando con vos",
      steps: [
        { title: "La llamada", text: "20 minutos, gratis. Nos contás qué estás construyendo y qué necesitás." },
        { title: "Definimos qué buscar", text: "Primero definimos qué tiene que demostrar la persona. Recién ahí empezamos a buscar." },
        { title: "Buscamos y filtramos", text: "Buscamos developers senior y cada uno pasa el filtro técnico y el humano." },
        { title: "Te presentamos a los mejores", text: "Conocés solo a los que pasaron los dos filtros. La decisión es tuya." },
        { title: "Empieza a trabajar", text: "Se suma a tu equipo y facturamos por mes, o lo contratás directo y cobramos la búsqueda." },
      ],
    },
    team: {
      text: "Somos un equipo chico. Vas a hablar con personas, no con una plataforma.",
      link: "Conocé al equipo",
    },
    clients: {
      eyebrow: "Con quién trabajamos",
      title: "Equipos y productos reales",
      text: "Equipos a los que sumamos developers y productos que construyó nuestro equipo.",
      staff: "Staff augmentation",
      own: "Producto propio",
      visit: "Ver sitio",
    },
    proof: {
      eyebrow: "Testimonios",
      title: "Lo que dicen quienes trabajaron con nosotros",
    },
    faq: {
      eyebrow: "Preguntas",
      title: "Lo que nos preguntan antes de empezar",
      items: [
        {
          q: "Cuánto sale y cómo se cobra?",
          a: "Hay dos modelos. En uno, el developer se suma a tu equipo y facturamos por mes. En el otro, cobramos la búsqueda y lo contratás directo. El número depende del perfil y lo vemos en la llamada.",
        },
        { q: "Qué pasa si el developer no funciona?", a: "Lo reemplazamos sin costo." },
        { q: "Para quién no es?", a: "Si buscás perfiles junior, no somos nosotros. Trabajamos solo con developers senior." },
        { q: "Dónde trabajan los developers?", a: "En remoto. Trabajamos solo con perfiles senior y solo en modalidad remota." },
        { q: "Quién los entrevista?", a: "Nosotros. Alguien de nuestro equipo habla con cada candidato antes de presentártelo." },
        { q: "Cuánto tarda?", a: "Depende del perfil. En la llamada te decimos un plazo realista para tu búsqueda." },
      ],
      link: "Ver todas las preguntas",
    },
    devs: {
      title: "Sos developer?",
      text: "Entrá a la lista donde buscamos cuando entra una búsqueda. Anotarte es gratis y te escribimos cuando hay una que encaja con vos.",
      cta: "Entrá a la lista",
    },
  },
  en: {
    seo: {
      title: "Staff Augmentation: Hire Senior Developers | OpenGateHub",
      description:
        "We find, interview and place senior remote developers in your team. We interview each one before you meet them. Free 20-minute call.",
    },
    hero: {
      eyebrow: "Staff augmentation · Developer hiring",
      title: "Hire senior developers who fit your team.",
      lead: "You don't read CVs or interview blind. Our engineers evaluate the technical side and how each person works, and we only present the top 5%.",
      primary: "Book your free call",
      secondary: null,
      note: "Free, 20 minutes. We take on few searches at a time.",
      assurances: [
        { title: "Vetted by engineers", text: "Not by recruiters: by people who code." },
        { title: "Senior only, fully remote", text: "It's the only profile we work with." },
        { title: "Guaranteed quality", text: "We only present people we'd hire ourselves." },
      ],
    },
    offer: {
      eyebrow: "No fine print",
      title: "What's free and what's paid",
      rows: [
        {
          tag: "Free",
          name: "The call",
          text: "20 minutes. Tell us what you're building and we'll see how to set up the search for your developer.",
          cta: "Book your call",
          href: "/contact-us",
        },
        {
          tag: "Paid",
          name: "The service",
          text: "We find, filter and present only senior developers who passed our technical and human filter. They join your team and we bill monthly, or we charge for the search and you hire them directly.",
          cta: "See how it works",
          href: "/services/staff-augmentation",
        },
      ],
    },
    problem: {
      eyebrow: "The problem",
      title: "A bad developer doesn't cost you a salary. It costs you months.",
      paragraphs: [
        "The problem isn't finding candidates. It's that three of them look good and you have to pick one.",
        "A good CV, good English and five years of React don't tell you whether that person is right for your product. You find out two months later: you lose time, the product slips, you end up doing technical management, and you have to hire again.",
        "That's why the filter goes before the hire, not after.",
      ],
    },
    audience: {
      eyebrow: "Who it's for",
      title: "Two ways people get here",
      cards: [
        {
          title: "You have a team and need to add people",
          text: "Your team doesn't have time to read a hundred CVs. We present senior developers who've already been interviewed and who adapt to how you work.",
          cta: "How we add to a team",
          href: "/services/staff-augmentation#sumar-equipo",
        },
        {
          title: "It's your first developer",
          text: "You don't know how to evaluate someone who knows more about their job than you do. We define with you what that person has to prove, then find and interview them.",
          cta: "How we work with founders",
          href: "/services/staff-augmentation#primer-developer",
        },
      ],
    },
    evaluate: {
      eyebrow: "Our filter",
      title: "First, they know the craft. Then, everything else.",
      intro: "We start with the technical side: we verify that they master the technology your project needs. Then comes what a CV doesn't show:",
      items: [
        "Can they work without someone telling them what to do every hour?",
        "Do they flag a problem before it turns into a disaster?",
        "Can they walk into a codebase they don't know and find their way?",
        "Do they understand the product, or only execute tasks?",
        "Would you leave them working directly with a client?",
      ],
      outro: "No developer reaches you without passing both parts. It's a standard we don't negotiate.",
      link: null,
    },
    process: {
      eyebrow: "How it works",
      title: "From the call to a developer working with you",
      steps: [
        { title: "The call", text: "20 minutes, free. You tell us what you're building and what you need." },
        { title: "We define what to look for", text: "First we define what the person has to prove. Only then do we start searching." },
        { title: "We search and filter", text: "We look for senior developers, and each one goes through the technical and the human filter." },
        { title: "We present the best", text: "You only meet the ones who passed both filters. The decision is yours." },
        { title: "They start working", text: "They join your team and we bill monthly, or you hire them directly and we charge for the search." },
      ],
    },
    team: {
      text: "We're a small team. You'll talk to people, not a platform.",
      link: "Meet the team",
    },
    clients: {
      eyebrow: "Who we've worked with",
      title: "Real teams, real products",
      text: "Teams we added developers to, and products our team built.",
      staff: "Staff augmentation",
      own: "Our own product",
      visit: "Visit site",
    },
    proof: {
      eyebrow: "Testimonials",
      title: "What the people who worked with us say",
    },
    faq: {
      eyebrow: "Questions",
      title: "What people ask before starting",
      items: [
        {
          q: "How much does it cost and how do you charge?",
          a: "There are two models. In one, the developer joins your team and we bill monthly. In the other, we charge for the search and you hire them directly. The number depends on the profile, and we go over it on the call.",
        },
        { q: "What if the developer doesn't work out?", a: "We replace them at no cost." },
        { q: "Who is this not for?", a: "If you're looking for junior profiles, we're not the right fit. We only work with senior developers." },
        { q: "Where do the developers work?", a: "Remotely. We only work with senior profiles, and only remote." },
        { q: "Who interviews them?", a: "We do. Someone on our team talks to every candidate before presenting them to you." },
        { q: "How long does it take?", a: "It depends on the profile. On the call we give you a realistic timeline for your search." },
      ],
      link: "See all questions",
    },
    devs: {
      title: "Are you a developer?",
      text: "Join the list we search when a new role comes in. Signing up is free and we write to you when there's one that fits.",
      cta: "Join the list",
    },
  },
};

const TEAM = [
  { name: "Gustavo", src: "/team/gus.jpg" },
  { name: "Javier", src: "/team/javi.jpg" },
  { name: "Laura", src: "/team/lau.jpg" },
  { name: "Alejandría", src: "/team/ale.jpg" },
  { name: "Giuliano", src: "/team/giuli.jpg" },
  { name: "Vadym", src: "/team/Vadym.JPG" },
  { name: "Ilia", src: "/team/Ilia.jpeg" },
];

// Logos de las empresas y productos con los que trabajó el equipo.
const LOGOS = [
  { name: "Vantage", src: "/vantage.svg", href: "https://vantageinc.ai/" },
  { name: "Valthor CRM", src: "/valthor-logo.e3b5a398.png", href: "https://www.valthorcrm.com/" },
  { name: "Smarters City", src: "/smarters-card.png", href: "https://smarters.city/" },
  { name: "Hot Date Kitchen", src: "/HotDate.png", href: "https://hotdatekitchen.com/" },
  { name: "Skylar", src: "/Skylar.png", href: "https://skylar.ar/" },
  { name: "Cicero", src: "/Cicero.png", href: "https://www.linkedin.com/company/cicerolearn/" },
  { name: "Vivabots", src: "/vivabots_azul.png", href: "https://vivabots.com/" },
  { name: "Estudio Sab", src: "/estudio-sab.png", href: "https://estudiosab.com/" },
  { name: "KD Abogados", src: "/kdabogados.png", href: "https://kdabogados.com.ar/" },
  { name: "GBS Abogados", src: "/GBS.png", href: null },
  { name: "Sistema Manu Gil", src: "/sistema-manu-gil-logo.png", href: null },
  { name: "PropBot", src: "/propbot-logo.svg", href: "https://propbot.cc" },
];

// Todos los casos juntos. Cada tarjeta dice qué fue: staff augmentation, un proyecto o un producto propio.
const CASES = [
  { key: "vantage", img: "/case-studies/vantage.jpeg", href: "https://vantageinc.ai/", kind: "staff", size: "large" },
  { key: "valthor", img: "/case-studies/valthor.jpeg", href: "https://www.valthorcrm.com/", kind: "staff", size: "large" },
  { key: "hotdate", img: "/case-studies/hot-date-kitchen.jpeg", href: "https://hotdatekitchen.com/" },
  { key: "smarters", img: "/case-studies/smarters-city.jpeg", href: "https://smarters.city/", position: "top center" },
  { key: "mangil", img: "/case-studies/sistema-manu-gil.png", href: null, position: "top left" },
  { key: "propbot", img: "/case-studies/propbot.png", href: "https://propbot.cc", kind: "own", size: "large" },
  { key: "labsmail", img: "/case-studies/labsmail.png", href: "/labsmail", kind: "own", size: "large" },
];

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "OpenGateHub",
  url: "https://www.opengatehub.com",
  logo: "https://www.opengatehub.com/og-image.png",
  sameAs: ["https://www.linkedin.com/company/opengatehub"],
  description:
    "OpenGateHub is a staff augmentation company. We find, interview and place senior remote developers in your team.",
};

export async function getServerSideProps() {
  return { props: {} };
}

export default function HomePage() {
  const { t } = useTranslation();
  const copy = COPY[useLang()];

  const featuredVantage = {
    name: t("reviews.vantage.role"),
    company: t("reviews.vantage.company"),
  };
  const featured = {
    text: t("reviews.techvision.text"),
    name: t("reviews.techvision.role"),
    company: t("reviews.techvision.company"),
  };
  // En los textos, "company" a veces guarda el nombre de la persona (Farzad, Vicente) y "role" su cargo.
  const quotes = [
    { key: "farzad", person: "company" },
    { key: "vantage", person: "role" },
    { key: "innovatelab", person: "role" },
    { key: "greenleaf", person: "company" },
    { key: "skylar", person: "role" },
  ].map(({ key, person }) => ({
    key,
    text: t(`reviews.${key}.text`),
    name: t(`reviews.${key}.${person}`),
    company: t(`reviews.${key}.${person === "role" ? "company" : "role"}`),
  }));

  return (
    <Page>
      <SEO title={copy.seo.title} description={copy.seo.description}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      </SEO>

      {/* Titular */}
      <Hero>
        <Wrap>
          <HeroGrid>
            <div>
              <Eyebrow>{copy.hero.eyebrow}</Eyebrow>
              <HeroTitle>{copy.hero.title}</HeroTitle>
              <HeroLead>{copy.hero.lead}</HeroLead>
              <Actions>
                <Button as={Link} href="/contact-us" $block>
                  {copy.hero.primary}
                </Button>
                <Small>{copy.hero.note}</Small>
              </Actions>
              {copy.hero.secondary && (
                <HeroAlt>
                  {copy.hero.secondary.text}{" "}
                  <TextLink as={Link} href={copy.hero.secondary.href} locale={false} style={{ fontSize: "inherit" }}>
                    {copy.hero.secondary.label} <span aria-hidden="true">→</span>
                  </TextLink>
                </HeroAlt>
              )}
            </div>
            <HeroQuote>
              <blockquote>{t("homeHeroQuote")}</blockquote>
              <figcaption>
                <strong>{featuredVantage.name}</strong>
                <span>{featuredVantage.company}</span>
              </figcaption>
            </HeroQuote>
          </HeroGrid>
          <Assurances>
            {copy.hero.assurances.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </li>
            ))}
          </Assurances>
        </Wrap>
      </Hero>

      {/* Qué es gratis y qué se paga */}
      <Section $tight>
        <Wrap>
          <Reveal>
            <Eyebrow>{copy.offer.eyebrow}</Eyebrow>
            <H2>{copy.offer.title}</H2>
          </Reveal>
          <OfferGrid as={Reveal} $count={copy.offer.rows.length}>
            {copy.offer.rows.map((row) => (
              <OfferItem key={row.name}>
                <Tag>{row.tag}</Tag>
                <H3>{row.name}</H3>
                <Body>{row.text}</Body>
                <TextLink as={Link} href={row.href}>
                  {row.cta} <span aria-hidden="true">→</span>
                </TextLink>
              </OfferItem>
            ))}
          </OfferGrid>
        </Wrap>
      </Section>

      {/* El problema */}
      <Section $tone="alt">
        <Wrap>
          <Split as={Reveal}>
            <div>
              <Eyebrow>{copy.problem.eyebrow}</Eyebrow>
              <H2>{copy.problem.title}</H2>
            </div>
            <Stack>
              {copy.problem.paragraphs.map((paragraph, i) => (
                <Lead key={i} style={i === copy.problem.paragraphs.length - 1 ? { color: color.ink, fontWeight: 500 } : undefined}>
                  {paragraph}
                </Lead>
              ))}
            </Stack>
          </Split>
        </Wrap>
      </Section>

      {/* Para quién */}
      <Section>
        <Wrap>
          <Reveal>
            <Eyebrow>{copy.audience.eyebrow}</Eyebrow>
            <H2>{copy.audience.title}</H2>
          </Reveal>
          <AudienceGrid as={Reveal}>
            {copy.audience.cards.map((card) => (
              <AudienceCard key={card.href} href={card.href}>
                <H3>{card.title}</H3>
                <Body>{card.text}</Body>
                <span className="cta">
                  {card.cta} <span aria-hidden="true">→</span>
                </span>
              </AudienceCard>
            ))}
          </AudienceGrid>
        </Wrap>
      </Section>

      {/* Cómo evaluamos */}
      <Section $tone="ink" id="como-evaluamos">
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
              <Questions>
                {copy.evaluate.items.map((item, i) => (
                  <li key={item}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    {item}
                  </li>
                ))}
              </Questions>
              <Body $onInk style={{ marginTop: 28 }}>
                {copy.evaluate.outro}
              </Body>
              {copy.evaluate.link && (
                <TextLink as={Link} href={copy.evaluate.link.href} $onInk style={{ marginTop: 20 }}>
                  {copy.evaluate.link.label} <span aria-hidden="true">→</span>
                </TextLink>
              )}
            </div>
          </Split>
        </Wrap>
      </Section>

      {/* Cómo funciona */}
      <Section>
        <Wrap>
          <Split>
            <Reveal style={{ alignSelf: "stretch" }}>
              <Sticky>
                <Eyebrow>{copy.process.eyebrow}</Eyebrow>
                <H2>{copy.process.title}</H2>
                <TeamLine>
                  <Avatars aria-hidden="true">
                    {TEAM.map((person) => (
                      <img key={person.name} src={person.src} alt="" loading="lazy" width={40} height={40} />
                    ))}
                  </Avatars>
                  <Small>{copy.team.text}</Small>
                  <TextLink as={Link} href="/about-us">
                    {copy.team.link} <span aria-hidden="true">→</span>
                  </TextLink>
                </TeamLine>
              </Sticky>
            </Reveal>
            <div>
              <Steps>
                {copy.process.steps.map((step, i) => (
                  <Reveal as="li" key={step.title}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <H3>{step.title}</H3>
                      <Body>{step.text}</Body>
                    </div>
                  </Reveal>
                ))}
              </Steps>
            </div>
          </Split>
        </Wrap>
      </Section>

      {/* Con quién trabajamos: logos y casos, todos juntos */}
      <Section style={{ borderTop: `1px solid ${color.line}` }}>
        <Wrap>
          <Reveal>
            <Eyebrow>{copy.clients.eyebrow}</Eyebrow>
            <H2>{copy.clients.title}</H2>
            <Lead style={{ marginTop: 20 }}>{copy.clients.text}</Lead>
          </Reveal>

          <LogoWall as={Reveal}>
            {LOGOS.map((logo) =>
              logo.href ? (
                <a key={logo.name} href={logo.href} target="_blank" rel="noopener noreferrer" aria-label={logo.name}>
                  <img src={logo.src} alt={logo.name} loading="lazy" />
                </a>
              ) : (
                <span key={logo.name}>
                  <img src={logo.src} alt={logo.name} loading="lazy" />
                </span>
              ),
            )}
          </LogoWall>

          <CaseGrid>
            {CASES.map((item) => {
              const label =
                item.kind === "staff"
                  ? copy.clients.staff
                  : item.kind === "own"
                    ? copy.clients.own
                    : t(`caseStudiesSection.${item.key}Category`);
              return (
                <CaseCard as={Reveal} key={item.key} $large={item.size === "large"}>
                  <div className="photo">
                    <img
                      src={item.img}
                      alt={t(`caseStudiesSection.${item.key}Title`)}
                      loading="lazy"
                      style={item.position ? { objectPosition: item.position } : undefined}
                    />
                  </div>
                  <div className="text">
                    <span className="label">{label}</span>
                    <H3>{t(`caseStudiesSection.${item.key}Title`)}</H3>
                    <Body>{t(`caseStudiesSection.${item.key}Desc`)}</Body>
                    {item.href && (
                      <TextLink href={item.href} target="_blank" rel="noopener noreferrer">
                        {copy.clients.visit} <span aria-hidden="true">↗</span>
                      </TextLink>
                    )}
                  </div>
                </CaseCard>
              );
            })}
          </CaseGrid>
        </Wrap>
      </Section>

      {/* Testimonios */}
      <Section $tone="alt">
        <Wrap>
          <Reveal>
            <Eyebrow>{copy.proof.eyebrow}</Eyebrow>
            <H2>{copy.proof.title}</H2>
          </Reveal>

          <Featured as={Reveal}>
            <blockquote>{featured.text}</blockquote>
            <figcaption>
              <strong>{featured.name}</strong>
              <span>{featured.company}</span>
            </figcaption>
          </Featured>

          <Quotes>
            {quotes.map((quote) => (
              <Reveal as="figure" key={quote.key}>
                <blockquote>
                  {quote.text.split("\n\n").map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </blockquote>
                <figcaption>
                  <strong>{quote.name}</strong>
                  {quote.company && <span>{quote.company}</span>}
                </figcaption>
              </Reveal>
            ))}
          </Quotes>

        </Wrap>
      </Section>

      {/* Preguntas de comprador */}
      <Section>
        <Wrap>
          <Split>
            <Reveal style={{ alignSelf: "stretch" }}>
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
                  <Body>{item.a}</Body>
                </details>
              ))}
            </Faq>
          </Split>
        </Wrap>
      </Section>

      {/* Franja para developers */}
      <DevBand>
        <Wrap>
          <div>
            <H3>{copy.devs.title}</H3>
            <Body>{copy.devs.text}</Body>
          </div>
          <Button as={Link} href="/devs" locale={false} $variant="secondary">
            {copy.devs.cta}
          </Button>
        </Wrap>
      </DevBand>

      <ClosingCall />
    </Page>
  );
}

/* ───────── Estilos propios de la home ───────── */

const Hero = styled.section`
  padding: clamp(56px, 9vw, 120px) 0 clamp(48px, 7vw, 88px);
`;

const HeroGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 340px);
  gap: clamp(40px, 6vw, 96px);
  align-items: end;

  ${mq.tablet} {
    grid-template-columns: 1fr;
  }
`;

const HeroTitle = styled(Display)`
  max-width: 16ch;
`;

const HeroQuote = styled.figure`
  margin: 0 0 6px;
  padding-left: 24px;
  border-left: 1px solid ${color.accent};

  blockquote {
    margin: 0;
    font-family: ${font.serif};
    font-style: italic;
    font-size: 1.1875rem;
    line-height: 1.5;
    color: ${color.inkSoft};
  }

  figcaption {
    margin-top: 18px;
    display: flex;
    flex-direction: column;
    font-size: 0.875rem;
  }

  figcaption span {
    color: ${color.muted};
  }

  ${mq.tablet} {
    display: none;
  }
`;

const HeroLead = styled(Lead)`
  margin-top: 36px;
  max-width: 52ch;
`;

const Actions = styled.div`
  margin-top: 40px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px 16px;

  ${Small} {
    margin-left: 6px;
  }

  ${mq.mobile} {
    ${Small} {
      width: 100%;
      margin-left: 0;
      text-align: center;
    }
  }
`;

const HeroAlt = styled(Small)`
  margin-top: 28px;
  font-size: 0.9375rem;

  ${mq.mobile} {
    text-align: center;
  }
`;

const Assurances = styled.ul`
  list-style: none;
  padding: 0;
  margin: clamp(56px, 8vw, 96px) 0 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-top: 1px solid ${color.line};

  li {
    padding: 24px 24px 0 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  li + li {
    padding-left: 24px;
    border-left: 1px solid ${color.line};
  }

  strong {
    font-family: ${font.serif};
    font-weight: 500;
    font-size: 1.1875rem;
    letter-spacing: -0.01em;
  }

  span {
    font-size: 0.9375rem;
    color: ${color.muted};
  }

  ${mq.mobile} {
    grid-template-columns: 1fr;

    li,
    li + li {
      padding: 18px 0;
      border-left: 0;
      border-bottom: 1px solid ${color.line};
    }
  }
`;

const OfferGrid = styled.div`
  margin-top: 48px;
  display: grid;
  grid-template-columns: repeat(${({ $count }) => $count}, 1fr);
  border-top: 1px solid ${color.ink};

  ${mq.tablet} {
    grid-template-columns: 1fr;
  }
`;

const OfferItem = styled.div`
  padding: 32px 32px 8px 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;

  & + & {
    padding-left: 32px;
    border-left: 1px solid ${color.line};
  }

  ${Body} {
    flex: 1;
  }

  ${mq.tablet} {
    padding: 28px 0;

    & + & {
      padding-left: 0;
      border-left: 0;
      border-top: 1px solid ${color.line};
    }
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

const Split = styled.div`
  display: grid;
  grid-template-columns: 5fr 6fr;
  gap: clamp(40px, 7vw, 104px);
  align-items: start;

  ${mq.tablet} {
    grid-template-columns: 1fr;
    gap: 40px;
  }
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 22px;
`;

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

const AudienceGrid = styled.div`
  margin-top: 48px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;

  ${mq.tablet} {
    grid-template-columns: 1fr;
  }
`;

const AudienceCard = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: clamp(28px, 3.5vw, 44px);
  border: 1px solid ${color.line};
  border-radius: 4px;
  background: ${color.paper};
  color: ${color.ink};
  transition: border-color 0.2s ease, transform 0.2s ease;

  ${H3} {
    font-size: clamp(1.4rem, 2.1vw, 1.75rem);
  }

  ${Body} {
    flex: 1;
  }

  .cta {
    margin-top: 8px;
    font-size: 0.9375rem;
    font-weight: 600;
    color: ${color.ink};
  }

  &:hover {
    color: ${color.ink};
    border-color: ${color.ink};
    transform: translateY(-2px);
  }

  &:hover .cta {
    color: ${color.accent};
  }
`;

const Questions = styled.ol`
  list-style: none;
  padding: 0;
  margin: 0;
  border-top: 1px solid ${color.lineDark};

  li {
    display: flex;
    align-items: baseline;
    gap: 20px;
    padding: 22px 0;
    border-bottom: 1px solid ${color.lineDark};
    font-family: ${font.serif};
    font-size: clamp(1.1875rem, 1.7vw, 1.4375rem);
    line-height: 1.35;
    letter-spacing: -0.01em;
  }

  span {
    flex-shrink: 0;
    font-family: ${font.brand};
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    color: ${color.accent};
  }
`;

const Steps = styled.ol`
  list-style: none;
  padding: 0;
  margin: 0;
  border-top: 1px solid ${color.ink};

  li {
    display: grid;
    grid-template-columns: 56px 1fr;
    gap: 8px;
    padding: 28px 0;
    border-bottom: 1px solid ${color.line};
  }

  li > span {
    font-family: ${font.brand};
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    color: ${color.accent};
    padding-top: 8px;
  }

  ${Body} {
    margin-top: 8px;
  }
`;

const TeamLine = styled.div`
  margin-top: 48px;
  padding-top: 28px;
  border-top: 1px solid ${color.line};
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  max-width: 34ch;
`;

const Avatars = styled.div`
  display: flex;

  img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    object-position: center top;
    border: 2px solid ${color.paper};
    background: ${color.paperAlt};
    filter: grayscale(1);
  }

  img + img {
    margin-left: -10px;
  }
`;

const Featured = styled.figure`
  margin: 56px 0 0;
  padding: 0 0 56px;
  border-bottom: 1px solid ${color.line};

  blockquote {
    margin: 0;
    font-family: ${font.serif};
    font-size: clamp(1.4rem, 2.6vw, 2.125rem);
    line-height: 1.3;
    letter-spacing: -0.012em;
    max-width: 62rem;
    text-wrap: pretty;
  }

  blockquote::before {
    content: "“";
    color: ${color.accent};
  }

  blockquote::after {
    content: "”";
    color: ${color.accent};
  }

  figcaption {
    margin-top: 28px;
    display: flex;
    flex-direction: column;
    font-size: 0.9375rem;
  }

  figcaption span {
    color: ${color.muted};
  }
`;

const Quotes = styled.div`
  margin-top: 56px;
  columns: 2;
  column-gap: 24px;

  figure {
    break-inside: avoid;
    margin: 0 0 24px;
    padding: 32px;
    background: ${color.paper};
    border: 1px solid ${color.line};
    border-radius: 4px;
  }

  blockquote {
    margin: 0;
    font-size: 1rem;
    line-height: 1.65;
    color: ${color.inkSoft};
  }

  blockquote p + p {
    margin-top: 14px;
  }

  figcaption {
    margin-top: 22px;
    padding-top: 18px;
    border-top: 1px solid ${color.line};
    display: flex;
    flex-direction: column;
    font-size: 0.875rem;
  }

  figcaption span {
    color: ${color.muted};
  }

  ${mq.tablet} {
    columns: 1;
  }

  ${mq.mobile} {
    figure {
      padding: 24px;
    }
  }
`;

const LogoWall = styled.div`
  margin-top: 48px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  border-top: 1px solid ${color.line};
  border-left: 1px solid ${color.line};

  a,
  span {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 112px;
    padding: 20px;
    background: ${color.paper};
    border-right: 1px solid ${color.line};
    border-bottom: 1px solid ${color.line};
  }

  img {
    max-width: 100%;
    max-height: 52px;
    width: auto;
    height: auto;
    object-fit: contain;
    border-radius: 2px;
    transition: transform 0.2s ease;
  }

  a:hover img {
    transform: scale(1.04);
  }

  ${mq.tablet} {
    grid-template-columns: repeat(4, 1fr);
  }

  ${mq.mobile} {
    grid-template-columns: repeat(3, 1fr);

    a,
    span {
      height: 88px;
      padding: 14px;
    }

    img {
      max-height: 40px;
    }
  }
`;

const CaseGrid = styled.div`
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 24px;

  ${mq.tablet} {
    grid-template-columns: repeat(2, 1fr);
  }

  ${mq.mobile} {
    grid-template-columns: 1fr;
  }
`;

const CaseCard = styled.article`
  grid-column: span ${({ $large }) => ($large ? 3 : 2)};
  display: flex;
  flex-direction: column;
  border: 1px solid ${color.line};
  border-radius: 4px;
  overflow: hidden;
  background: ${color.paper};

  .photo {
    aspect-ratio: ${({ $large }) => ($large ? "16 / 9" : "16 / 10")};
    background: ${color.paperAlt};
    border-bottom: 1px solid ${color.line};
    overflow: hidden;
  }

  .photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .text {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 24px 28px 28px;
  }

  .label {
    font-family: ${font.brand};
    font-size: 0.6875rem;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${color.accent};
  }

  ${Body} {
    flex: 1;
    font-size: 0.9375rem;
  }

  ${mq.tablet} {
    grid-column: span 1;
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

  ${Body} {
    padding: 0 40px 26px 0;
  }
`;

const DevBand = styled.section`
  background: ${color.paperAlt};
  border-top: 1px solid ${color.line};
  padding: clamp(40px, 5vw, 64px) 0;

  ${Wrap} {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 32px;
  }

  ${Body} {
    margin-top: 8px;
  }

  ${mq.tablet} {
    ${Wrap} {
      flex-direction: column;
      align-items: flex-start;
    }
  }
`;
