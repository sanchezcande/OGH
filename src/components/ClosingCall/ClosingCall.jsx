import React from "react";
import Link from "next/link";
import { Button, H2, Lead, Reveal, Section, Small, TextLink, Wrap, useLang } from "../../styles/kit";

// Cierre de todas las páginas del sitio: un solo llamado, la llamada gratis de 20 minutos.
const COPY = {
  es: {
    title: "Antes de contratar, hablemos 20 minutos.",
    text: "Es gratis y sin compromiso. Nos contás qué estás construyendo y vemos cómo armar la búsqueda. Aunque después no trabajemos juntos, te vas sabiendo qué buscar.",
    cta: "Agendá tu llamada gratis",
    scarcity: "Tomamos pocas búsquedas a la vez.",
    secondary: { text: "Guía gratis:", label: "9 preguntas para entrevistar a un developer", href: "/preguntas" },
  },
  en: {
    title: "Before you hire, let's talk for 20 minutes.",
    text: "It's free, with no commitment. Tell us what you're building and we'll work out how to set up the search. Even if we don't end up working together, you'll leave knowing what to look for.",
    cta: "Book your free call",
    scarcity: "We take on few searches at a time.",
    secondary: null,
  },
};

const ClosingCall = ({ title, text }) => {
  const copy = COPY[useLang()];

  return (
    <Section $tone="ink">
      <Wrap $narrow style={{ textAlign: "center" }}>
        <Reveal>
          <H2>{title || copy.title}</H2>
          <Lead $onInk style={{ margin: "24px auto 36px" }}>
            {text || copy.text}
          </Lead>
          <Button as={Link} href="/contact-us" $variant="onInk">
            {copy.cta}
          </Button>
          <Small $onInk style={{ marginTop: 20 }}>
            {copy.scarcity}
          </Small>
          {copy.secondary && (
            <Small $onInk style={{ marginTop: 10 }}>
              {copy.secondary.text}{" "}
              <TextLink as={Link} href={copy.secondary.href} $onInk style={{ fontSize: "inherit" }}>
                {copy.secondary.label}
              </TextLink>
            </Small>
          )}
        </Reveal>
      </Wrap>
    </Section>
  );
};

export default ClosingCall;
