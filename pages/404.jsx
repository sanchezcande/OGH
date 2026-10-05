import React from "react";
import Link from "next/link";
import styled from "styled-components";
import SEO from "../src/components/SEO/SEO";
import { Button, Display, Eyebrow, Lead, Page, TextLink, Wrap, color, mq, useLang } from "../src/styles/kit";

const COPY = {
  es: {
    seo: {
      title: "No encontramos esa página | OpenGateHub",
      description: "La página que buscás no existe o cambió de lugar.",
    },
    eyebrow: "Error 404",
    title: "No encontramos esa página",
    text: "Puede que el enlace esté viejo o que la dirección tenga un error.",
    call: "Agendá tu llamada gratis",
    devs: "Sos developer? Entrá a la lista",
    home: "Volver al inicio",
  },
  en: {
    seo: {
      title: "We couldn't find that page | OpenGateHub",
      description: "The page you're looking for doesn't exist or has moved.",
    },
    eyebrow: "Error 404",
    title: "We couldn't find that page",
    text: "The link may be old, or the address may have a typo.",
    call: "Book your free call",
    devs: "Are you a developer? Join the list",
    home: "Back to the home page",
  },
};

export default function NotFoundPage() {
  const copy = COPY[useLang()];

  return (
    <Page>
      <SEO title={copy.seo.title} description={copy.seo.description} robots="noindex, follow" />

      <Main>
        <Wrap>
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <Display>{copy.title}</Display>
          <Text>{copy.text}</Text>

          <Paths>
            <Button as={Link} href="/contact-us" $block>
              {copy.call}
            </Button>
            <TextLink as={Link} href="/devs" locale={false}>
              {copy.devs} <span aria-hidden="true">→</span>
            </TextLink>
          </Paths>

          <Home>
            <TextLink as={Link} href="/">
              <span aria-hidden="true">←</span> {copy.home}
            </TextLink>
          </Home>
        </Wrap>
      </Main>
    </Page>
  );
}

/* ───────── Estilos propios de la página de error ───────── */

const Main = styled.section`
  padding: clamp(72px, 12vw, 168px) 0 clamp(72px, 10vw, 136px);
`;

const Text = styled(Lead)`
  margin-top: 28px;
`;

const Paths = styled.div`
  margin-top: 40px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px 32px;

  ${mq.mobile} {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Home = styled.div`
  margin-top: clamp(56px, 8vw, 96px);
  padding-top: 28px;
  border-top: 1px solid ${color.line};
`;
