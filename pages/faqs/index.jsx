import React from "react";
import Link from "next/link";
import styled from "styled-components";
import SEO from "../../src/components/SEO/SEO";
import ClosingCall from "../../src/components/ClosingCall/ClosingCall";
import {
  Body,
  Display,
  Eyebrow,
  H2,
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

// Cada respuesta dice solo lo que está confirmado en docs/afirmaciones.md.
// Cuando la respuesta honesta es "depende", se dice así y se deriva a la llamada.
// Sin precios, plazos ni tecnologías.
const COPY = {
  es: {
    seo: {
      title: "Preguntas frecuentes | OpenGateHub",
      description:
        "Qué hace OpenGateHub, cómo se cobra y quién entrevista a los developers. Respuestas cortas antes de la llamada gratis de 20 minutos.",
    },
    hero: {
      eyebrow: "Preguntas frecuentes",
      title: "Lo que nos preguntan, respondido sin vueltas.",
      lead: "Cuando la respuesta honesta es que depende, lo decimos así y lo vemos en la llamada.",
    },
    groups: [
      {
        title: "El servicio",
        items: [
          {
            q: "Qué hace OpenGateHub?",
            a: "Buscamos, entrevistamos y te presentamos developers senior, 100% remotos. Hoy es lo único que hacemos: staff augmentation y contratación de developers.",
          },
          {
            q: "Para quién es?",
            a: "Para dos situaciones. Si es tu primer developer, definimos con vos qué tiene que demostrar esa persona, la buscamos y la entrevistamos. Si ya tenés equipo y necesitás sumar gente, te presentamos developers senior ya entrevistados.",
          },
          {
            q: "Cómo se cobra?",
            a: "Hay dos formas. En una, el developer se suma a tu equipo y facturamos por mes. En la otra, cobramos la búsqueda y lo contratás directo. El número depende del perfil y lo vemos en la llamada.",
          },
          {
            q: "Quién contrata al developer en cada caso?",
            a: "Depende de la forma que elijas. Si se suma a tu equipo y facturamos por mes, trabaja con vos pero nos pagás a nosotros: no lo contratás vos. Si cobramos la búsqueda, lo contratás vos, directo. Cuál te conviene lo vemos en la llamada.",
          },
        ],
      },
      {
        title: "Los developers",
        items: [
          {
            q: "Dónde trabajan y qué seniority tienen?",
            a: "Trabajan en remoto. Trabajamos solo con developers senior.",
          },
          {
            q: "Quién los entrevista y qué se mira?",
            a: "Entrevistamos a cada developer antes de presentártelo. Saber programar es solo una parte. También queremos saber si puede trabajar sin que alguien le diga qué hacer cada hora, si avisa de un problema antes de que crezca, si puede orientarse en un código que no conoce y si entiende el producto o solamente ejecuta tareas.",
          },
          {
            q: "Qué pasa si el developer no funciona?",
            a: "Lo reemplazamos sin costo. Es parte del servicio, no un extra.",
          },
        ],
      },
      {
        title: "Para empezar",
        items: [
          {
            q: "Cuánto tarda?",
            a: "Depende del perfil. En la llamada te decimos un plazo realista para tu búsqueda.",
          },
          {
            q: "Cómo se empieza?",
            a: "Con una llamada gratis de 20 minutos, sin compromiso. La hace siempre Candelaria Sanchez, nuestra founder. Nos contás qué estás construyendo y qué necesitás.",
            link: { label: "Agendá tu llamada", href: "/contact-us" },
          },
          {
            q: "Soy developer. Cómo entro a la lista?",
            a: "Te anotás en la lista para developers. Es donde buscamos cuando entra una búsqueda. Anotarte es gratis y te escribimos cuando hay una que encaja con vos.",
            link: { label: "Entrá a la lista", href: "/devs" },
          },
        ],
      },
    ],
  },
  en: {
    seo: {
      title: "FAQ: Hiring Senior Developers | OpenGateHub",
      description:
        "What OpenGateHub does, how we charge and who interviews the developers. Short answers before your free 20-minute call.",
    },
    hero: {
      eyebrow: "Frequently asked questions",
      title: "What people ask us, answered plainly.",
      lead: "When the honest answer is that it depends, we say so and go over it on the call.",
    },
    groups: [
      {
        title: "The service",
        items: [
          {
            q: "What does OpenGateHub do?",
            a: "We find, interview and present senior remote developers. Today it's the only thing we do: staff augmentation and developer hiring.",
          },
          {
            q: "Who is it for?",
            a: "Two situations. If you already have a team and need to add people, we present senior developers who've already been interviewed. If it's your first developer, we define with you what that person has to prove, then find and interview them.",
          },
          {
            q: "How do you charge?",
            a: "There are two ways. In one, the developer joins your team and we bill monthly. In the other, we charge for the search and you hire them directly. The number depends on the profile, and we go over it on the call.",
          },
          {
            q: "Who hires the developer in each case?",
            a: "It depends on the way you choose. If they join your team and we bill monthly, they work with you but you pay us: you don't hire them yourself. If we charge for the search, you hire them directly. We go over which one suits you on the call.",
          },
        ],
      },
      {
        title: "The developers",
        items: [
          {
            q: "Where do they work, and how senior are they?",
            a: "They work remotely. We only work with senior developers.",
          },
          {
            q: "Who interviews them, and what do you look at?",
            a: "We interview every developer before presenting them to you. Knowing how to code is only one part. We also want to know whether they can work without someone telling them what to do every hour, whether they flag a problem before it grows, whether they can find their way in a codebase they don't know, and whether they understand the product or only execute tasks.",
          },
          {
            q: "What if the developer doesn't work out?",
            a: "We replace them at no cost. It's part of the service, not an add-on.",
          },
        ],
      },
      {
        title: "Getting started",
        items: [
          {
            q: "How long does it take?",
            a: "It depends on the profile. On the call we give you a realistic timeline for your search.",
          },
          {
            q: "How do I start?",
            a: "With a free 20-minute call, no commitment. Candelaria Sanchez, our founder, takes every call. You tell us what you're building and what you need.",
            link: { label: "Book your call", href: "/contact-us" },
          },
          {
            q: "I'm a developer. How do I get on the list?",
            a: "You sign up to the developer list. It's where we search when a new role comes in. Signing up is free, and we write to you when there's one that fits.",
            link: { label: "Join the list", href: "/devs" },
          },
        ],
      },
    ],
  },
};

export default function FAQsPage() {
  const copy = COPY[useLang()];

  // Datos estructurados armados con la misma lista que se ve en la página, en el idioma activo.
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: copy.groups.flatMap((group) =>
      group.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    ),
  };

  return (
    <Page>
      <SEO title={copy.seo.title} description={copy.seo.description}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      </SEO>

      {/* Titular */}
      <Hero>
        <Wrap>
          <Eyebrow>{copy.hero.eyebrow}</Eyebrow>
          <HeroTitle>{copy.hero.title}</HeroTitle>
          <HeroLead>{copy.hero.lead}</HeroLead>
        </Wrap>
      </Hero>

      {/* Preguntas, en tres bloques */}
      <Questions>
        <Wrap>
          {copy.groups.map((group, g) => (
            <Group key={group.title}>
              <Aside>
                <Sticky>
                  <GroupNumber>{String(g + 1).padStart(2, "0")}</GroupNumber>
                  <GroupTitle>{group.title}</GroupTitle>
                </Sticky>
              </Aside>
              <Faq as={Reveal}>
                {group.items.map((item) => (
                  <details key={item.q}>
                    <summary>{item.q}</summary>
                    <Answer>
                      <Body>{item.a}</Body>
                      {item.link && (
                        <TextLink as={Link} href={item.link.href}>
                          {item.link.label} <span aria-hidden="true">→</span>
                        </TextLink>
                      )}
                    </Answer>
                  </details>
                ))}
              </Faq>
            </Group>
          ))}
        </Wrap>
      </Questions>

      <ClosingCall />
    </Page>
  );
}

/* ───────── Estilos propios de preguntas frecuentes ───────── */

const Hero = styled.section`
  padding: clamp(56px, 9vw, 120px) 0 clamp(48px, 6vw, 80px);
`;

const HeroTitle = styled(Display)`
  max-width: 18ch;
`;

const HeroLead = styled(Lead)`
  margin-top: 28px;
  max-width: 50ch;
`;

const Questions = styled(Section)`
  padding-top: 0;
`;

const Group = styled.div`
  display: grid;
  grid-template-columns: 4fr 7fr;
  gap: clamp(32px, 6vw, 96px);
  align-items: start;

  & + & {
    margin-top: clamp(64px, 8vw, 112px);
  }

  ${mq.tablet} {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

// La columna ocupa todo el alto del bloque para que el subtítulo pueda acompañar el scroll.
const Aside = styled(Reveal)`
  align-self: stretch;
`;

const Sticky = styled.div`
  position: sticky;
  top: 112px;

  ${mq.tablet} {
    position: static;
  }
`;

const GroupNumber = styled.span`
  display: block;
  margin-bottom: 14px;
  font-family: ${font.brand};
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  color: ${color.accent};
`;

const GroupTitle = styled(H2)`
  font-size: clamp(1.6rem, 2.6vw, 2.25rem);
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

  summary:focus-visible {
    outline: 2px solid ${color.accent};
    outline-offset: 3px;
  }
`;

const Answer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  padding: 0 40px 28px 0;

  ${mq.mobile} {
    padding-right: 0;
  }
`;
