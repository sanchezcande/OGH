import React from "react";
import Image from "next/image";
import Link from "next/link";
import styled from "styled-components";
import SEO from "../../src/components/SEO/SEO";
import ClosingCall from "../../src/components/ClosingCall/ClosingCall";
import TeamSection from "../../src/components/TeamSection/TeamSection";
import {
  Body,
  Display,
  Eyebrow,
  H2,
  H3,
  Lead,
  Page,
  Reveal,
  Section,
  TextLink,
  Wrap,
  color,
  font,
  mq,
  useLang,
} from "../../src/styles/kit";

// Qué transmite esta página: quiénes son las personas detrás, por qué existe la empresa
// y por qué se le puede confiar una contratación.
// Los hechos del servicio están confirmados en docs/afirmaciones.md. La historia de Candelaria
// sale de lo que ella contó (about-me-historia.md): no se agregan fechas, lugares ni logros.
const COPY = {
  es: {
    seo: {
      title: "Nosotros: las personas detrás de OpenGateHub",
      description:
        "Somos un equipo chico que busca y entrevista developers senior, 100% remotos. Conocé a Candelaria Sanchez, Founder, y al equipo.",
    },
    hero: {
      eyebrow: "Nosotros",
      title: "No somos otra agencia.",
      lead: "Somos un equipo chico que busca y entrevista developers senior. Que la persona encaje con tu equipo es nuestro primer filtro, no un extra.",
    },
    founder: {
      eyebrow: "La founder",
      title: "Gente inteligente en el contexto equivocado.",
      role: "Founder",
      paragraphs: [
        "Candelaria Sanchez es ingeniera de software y antes trabajó en cine. Empezó OpenGateHub porque veía el mismo problema en todos lados: empresas que contrataban ingenieros excelentes que no encajaban con el equipo.",
        "Por eso armó una empresa donde encajar con el equipo no es un extra, es el primer filtro. A cada developer lo miramos por cómo se comunica, cómo trabaja y si de verdad le va a importar lo que está construyendo.",
      ],
      note: "La llamada de 20 minutos la hace siempre ella.",
    },
    principles: {
      eyebrow: "Cómo trabajamos",
      title: "Lo que no cambia de una búsqueda a otra",
      items: [
        {
          title: "Entrevistamos a cada developer",
          text: "Antes de presentártelo, alguien de nuestro equipo habla con esa persona. Conocés solo a quienes pasaron la entrevista.",
        },
        { title: "Solo developers senior", text: "Trabajan 100% remoto." },
        { title: "Tomamos pocas búsquedas a la vez", text: "Es una firma chica, y así la queremos." },
        {
          title: "Hablás con personas",
          text: "La primera llamada es con Candelaria. No hay una plataforma en el medio.",
        },
      ],
      link: "Ver cómo funciona el servicio",
    },
  },
  en: {
    seo: {
      title: "About: The People Behind OpenGateHub",
      description:
        "We're a small team that finds and interviews senior remote developers. Meet Candelaria Sanchez, Founder, and the team.",
    },
    hero: {
      eyebrow: "About",
      title: "We're not another agency.",
      lead: "We're a small team that finds and interviews senior developers. Whether a person fits your team is our first filter, not an extra.",
    },
    founder: {
      eyebrow: "The founder",
      title: "Smart people in the wrong context.",
      role: "Founder",
      paragraphs: [
        "Candelaria Sanchez is a software engineer who started out in film. She founded OpenGateHub because she kept seeing the same problem everywhere: companies hiring great engineers who didn't fit the team.",
        "So she built a company where fitting the team isn't an extra, it's the first filter. We look at how each developer communicates, how they work, and whether they'll genuinely care about what they're building.",
      ],
      note: "She takes every 20-minute call herself.",
    },
    principles: {
      eyebrow: "How we work",
      title: "What doesn't change from one search to the next",
      items: [
        {
          title: "We interview every developer",
          text: "Before we present anyone, someone on our team talks to them. You only meet the ones who passed the interview.",
        },
        { title: "Senior developers only", text: "Fully remote." },
        { title: "We take on few searches at a time", text: "We're a small firm, and we like it that way." },
        {
          title: "You talk to people",
          text: "The first call is with Candelaria. There's no platform in between.",
        },
      ],
      link: "See how the service works",
    },
  },
};

export default function AboutUsPage() {
  const copy = COPY[useLang()];

  return (
    <Page>
      <SEO title={copy.seo.title} description={copy.seo.description} />

      {/* Titular */}
      <Hero>
        <Wrap>
          <Eyebrow>{copy.hero.eyebrow}</Eyebrow>
          <Display>{copy.hero.title}</Display>
          <HeroLead>{copy.hero.lead}</HeroLead>
        </Wrap>
      </Hero>

      {/* La founder */}
      <Section $tone="alt">
        <Wrap>
          <FounderGrid as={Reveal}>
            <Portrait>
              <div className="frame">
                <Image
                  src="/images/cande-2026.jpg"
                  alt={`Candelaria Sanchez, ${copy.founder.role}`}
                  fill
                  sizes="(max-width: 960px) 112px, 300px"
                  style={{ objectFit: "cover", objectPosition: "50% 50%" }}
                />
              </div>
              <figcaption>
                <H3 as="p">Candelaria Sanchez</H3>
                <Role>{copy.founder.role}</Role>
              </figcaption>
            </Portrait>

            <div>
              <Eyebrow>{copy.founder.eyebrow}</Eyebrow>
              <H2>{copy.founder.title}</H2>
              <Stack>
                {copy.founder.paragraphs.map((paragraph, i) => (
                  <Lead key={i}>{paragraph}</Lead>
                ))}
                <Lead style={{ color: color.ink, fontWeight: 500 }}>{copy.founder.note}</Lead>
              </Stack>
            </div>
          </FounderGrid>
        </Wrap>
      </Section>

      {/* El equipo */}
      <TeamSection id="equipo" />

      {/* Cómo trabajamos */}
      <Section $tone="alt">
        <Wrap>
          <Reveal>
            <Eyebrow>{copy.principles.eyebrow}</Eyebrow>
            <H2>{copy.principles.title}</H2>
          </Reveal>
          <Principles>
            {copy.principles.items.map((item, i) => (
              <Reveal as="li" key={item.title}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <H3>{item.title}</H3>
                <Body>{item.text}</Body>
              </Reveal>
            ))}
          </Principles>
          <Reveal>
            <TextLink as={Link} href="/services/staff-augmentation" style={{ marginTop: 36 }}>
              {copy.principles.link} <span aria-hidden="true">→</span>
            </TextLink>
          </Reveal>
        </Wrap>
      </Section>

      <ClosingCall />
    </Page>
  );
}

/* ───────── Estilos propios de Nosotros ───────── */

const Hero = styled.section`
  padding: clamp(56px, 9vw, 120px) 0 clamp(56px, 8vw, 104px);
`;

const HeroLead = styled(Lead)`
  margin-top: 28px;
  max-width: 54ch;
`;

const FounderGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 300px) minmax(0, 1fr);
  gap: clamp(40px, 7vw, 104px);
  align-items: start;

  ${mq.tablet} {
    grid-template-columns: 1fr;
    gap: 36px;
  }
`;

const Portrait = styled.figure`
  margin: 0;

  .frame {
    position: relative;
    aspect-ratio: 4 / 5;
    overflow: hidden;
    border-radius: 4px;
    background: ${color.line};
  }

  img {
    filter: grayscale(1);
  }

  figcaption {
    margin-top: 18px;
    padding-top: 16px;
    border-top: 1px solid ${color.line};
  }

  /* En pantallas chicas la foto queda al lado del nombre, sin ocupar toda la pantalla. */
  ${mq.tablet} {
    display: grid;
    grid-template-columns: 112px minmax(0, 1fr);
    gap: 20px;
    align-items: center;

    figcaption {
      margin-top: 0;
      padding-top: 0;
      border-top: 0;
    }
  }
`;

const Role = styled.p`
  margin: 6px 0 0;
  font-family: ${font.brand};
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${color.muted};
`;

const Stack = styled.div`
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  gap: 22px;
`;

// La columna ocupa todo el alto de la fila para que el título pueda acompañar el scroll.
const Principles = styled.ol`
  list-style: none;
  padding: 0;
  margin: 48px 0 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-top: 1px solid ${color.ink};

  li {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 32px 40px 36px 0;
    border-bottom: 1px solid ${color.line};
  }

  li:nth-child(even) {
    padding-left: 40px;
    padding-right: 0;
    border-left: 1px solid ${color.line};
  }

  li > span {
    font-family: ${font.brand};
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    color: ${color.accent};
  }

  ${mq.tablet} {
    grid-template-columns: 1fr;

    li,
    li:nth-child(even) {
      padding: 26px 0;
      border-left: 0;
    }
  }
`;
