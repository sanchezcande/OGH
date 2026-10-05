import React from "react";
import Link from "next/link";
import styled from "styled-components";
import SEO from "../../src/components/SEO/SEO";
import EstimateForm from "../../src/components/ContactForm/EstimateForm";
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

// La página de la llamada. Dos caminos: agendar (el principal) o escribir.
// La agenda se abre siempre en una pestaña nueva, igual en computadora y en celular.
const BOOKING_URL = "https://strategy.opengatehub.com";

// Todo lo que se afirma acá está confirmado en docs/afirmaciones.md.
const COPY = {
  es: {
    seo: {
      title: "Agendá tu llamada gratis de 20 minutos | OpenGateHub",
      description:
        "Agendá una llamada gratis de 20 minutos con Candelaria Sanchez, founder de OpenGateHub, o escribinos y contanos qué developer necesitás.",
    },
    hero: {
      eyebrow: "Contacto",
      title: "Hablemos de tu búsqueda",
      lead: "Agendá una llamada gratis de 20 minutos o escribinos.",
    },
    call: {
      eyebrow: "La llamada",
      title: "20 minutos, gratis",
      who: "Hablás con Candelaria Sanchez, founder de OpenGateHub.",
      what: "Nos contás qué estás construyendo y vemos cómo armar la búsqueda de tu developer.",
      cta: "Agendá tu llamada",
      note: "Sin compromiso. La agenda se abre en una pestaña nueva.",
    },
    form: {
      eyebrow: "Por escrito",
      title: "Preferís escribir?",
    },
    next: {
      eyebrow: "Si nos escribís",
      title: "Qué pasa después",
      steps: [
        { title: "Leemos tu mensaje", text: "Te respondemos en menos de 24 horas." },
        {
          title: "Te decimos cómo armaríamos la búsqueda",
          text: "Y qué forma de contratar te conviene: que el developer se sume a tu equipo y facturemos por mes, o que lo contrates directo y cobremos la búsqueda.",
        },
        { title: "Decidís vos", text: "Sin compromiso. Si te sirve, empezamos la búsqueda." },
      ],
    },
    devs: { text: "Sos developer?", link: "Entrá a la lista" },
  },
  en: {
    seo: {
      title: "Book a Free 20-Minute Call | OpenGateHub",
      description:
        "Book a free 20-minute call with Candelaria Sanchez, founder of OpenGateHub, or send us a message about the developer you need.",
    },
    hero: {
      eyebrow: "Contact",
      title: "Let's talk about your search",
      lead: "Book a free 20-minute call or send us a message.",
    },
    call: {
      eyebrow: "The call",
      title: "20 minutes, free",
      who: "You talk to Candelaria Sanchez, founder of OpenGateHub.",
      what: "You tell us what you're building and we work out how to set up the search for your developer.",
      cta: "Book your call",
      note: "No commitment. The calendar opens in a new tab.",
    },
    form: {
      eyebrow: "In writing",
      title: "Prefer to write?",
    },
    next: {
      eyebrow: "If you write to us",
      title: "What happens next",
      steps: [
        { title: "We read your message", text: "We reply within 24 hours." },
        {
          title: "We tell you how we'd run the search",
          text: "And which way of hiring suits you: the developer joins your team and we bill monthly, or you hire them directly and we charge for the search.",
        },
        { title: "You decide", text: "No commitment. If it works for you, we start the search." },
      ],
    },
    devs: { text: "Are you a developer?", link: "Join the list" },
  },
};

export default function ContactPage() {
  const copy = COPY[useLang()];

  return (
    <Page>
      <SEO title={copy.seo.title} description={copy.seo.description} />

      {/* Titular y los dos caminos */}
      <Hero>
        <Wrap>
          <Eyebrow>{copy.hero.eyebrow}</Eyebrow>
          <Display>{copy.hero.title}</Display>
          <HeroLead>{copy.hero.lead}</HeroLead>

          <Columns>
            {/* La llamada: opción principal */}
            <CallPanel>
              <Eyebrow $onInk>{copy.call.eyebrow}</Eyebrow>
              <CallTitle>{copy.call.title}</CallTitle>
              <Who>{copy.call.who}</Who>
              <Body $onInk>{copy.call.what}</Body>
              <CallButton href={BOOKING_URL} target="_blank" rel="noopener noreferrer" $variant="onInk" $block>
                {copy.call.cta}
              </CallButton>
              <Small $onInk>{copy.call.note}</Small>
            </CallPanel>

            {/* El formulario: para quien prefiere escribir */}
            <FormColumn>
              <Eyebrow>{copy.form.eyebrow}</Eyebrow>
              <FormTitle>{copy.form.title}</FormTitle>
              <EstimateForm />
            </FormColumn>
          </Columns>
        </Wrap>
      </Hero>

      {/* Qué pasa después */}
      <Section $tone="alt" $tight>
        <Wrap>
          <Reveal>
            <Eyebrow>{copy.next.eyebrow}</Eyebrow>
            <H2>{copy.next.title}</H2>
          </Reveal>
          <Reveal>
            <Steps>
              {copy.next.steps.map((step, i) => (
                <li key={step.title}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <H3>{step.title}</H3>
                  <Body>{step.text}</Body>
                </li>
              ))}
            </Steps>
          </Reveal>
        </Wrap>
      </Section>

      {/* Línea para developers. Esta página no lleva el cierre con la llamada: ya es la página de la llamada. */}
      <DevLine>
        <Wrap>
          <Small>
            {copy.devs.text}{" "}
            <TextLink as={Link} href="/devs" locale={false} style={{ fontSize: "inherit" }}>
              {copy.devs.link}
            </TextLink>
          </Small>
        </Wrap>
      </DevLine>
    </Page>
  );
}

/* ───────── Estilos propios de la página ───────── */

const Hero = styled.section`
  padding: clamp(48px, 6vw, 88px) 0 clamp(72px, 9vw, 128px);
`;

const HeroLead = styled(Lead)`
  margin-top: 24px;
`;

const Columns = styled.div`
  margin-top: clamp(40px, 5vw, 64px);
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
  gap: clamp(32px, 5vw, 72px);
  align-items: start;

  ${mq.tablet} {
    grid-template-columns: minmax(0, 1fr);
    gap: 56px;
  }
`;

const CallPanel = styled.div`
  position: sticky;
  top: 96px;
  padding: clamp(28px, 3.5vw, 44px);
  border-radius: 4px;
  --accent: ${color.accentBrand};
  background: ${color.ink};
  color: ${color.onInk};

  ${Small} {
    margin-top: 14px;
  }

  ${mq.tablet} {
    position: static;
  }
`;

const CallTitle = styled(H2)`
  font-size: clamp(1.9rem, 3.1vw, 2.5rem);
`;

const Who = styled.p`
  margin: 24px 0 12px;
  font-family: ${font.serif};
  font-size: clamp(1.1875rem, 1.6vw, 1.3125rem);
  line-height: 1.35;
  letter-spacing: -0.01em;
  color: ${color.onInk};
`;

const CallButton = styled(Button)`
  width: 100%;
  max-width: 420px;
  min-height: 60px;
  margin-top: 32px;
  font-size: 1.0625rem;
`;

const FormColumn = styled.div`
  padding-top: clamp(28px, 3.5vw, 44px);
  border-top: 1px solid ${color.ink};
`;

const FormTitle = styled(H2)`
  margin-bottom: 32px;
  font-size: clamp(1.5rem, 2.2vw, 1.875rem);
`;

const Steps = styled.ol`
  list-style: none;
  padding: 0;
  margin: 48px 0 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid ${color.ink};

  li {
    padding: 28px 32px 0 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  li + li {
    padding-left: 32px;
    border-left: 1px solid ${color.line};
  }

  li > span {
    font-family: ${font.brand};
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    color: ${color.accent};
  }

  ${mq.tablet} {
    grid-template-columns: minmax(0, 1fr);

    li,
    li + li {
      padding: 24px 0;
      border-left: 0;
      border-bottom: 1px solid ${color.line};
    }
  }
`;

const DevLine = styled.section`
  padding: 28px 0;
  border-top: 1px solid ${color.line};
`;
