import Document, { Html, Head, Main, NextScript } from "next/document";
import { ServerStyleSheet } from "styled-components";
import { BotIdClient } from "botid/client";

import { RUTAS_PROTEGIDAS } from "../lib/rutasProtegidas";

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) =>
            sheet.collectStyles(<App {...props} />),
        });

      const initialProps = await Document.getInitialProps(ctx);
      return {
        ...initialProps,
        styles: (
          <>
            {initialProps.styles}
            {sheet.getStyleElement()}
          </>
        ),
      };
    } finally {
      sheet.seal();
    }
  }

  render() {
    return (
      <Html>
        <Head>
          {/* El captcha invisible de Vercel (BotID), 30/10. No se ve, no hay que apretar nada y no
              pide claves: es un script que le pega una prueba a los envíos de los formularios para
              que el servidor sepa que salieron de un navegador y no de un script. En desarrollo no
              renderiza nada. Tiene que estar en todas las páginas, por eso va acá. */}
          <BotIdClient protect={RUTAS_PROTEGIDAS} />
          {/* Tipografías: Newsreader (títulos), Inter (texto), Space Grotesk (logo y etiquetas) */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
          {/* Organization Schema - Global */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "OpenGateHub",
                "url": "https://www.opengatehub.com",
                "logo": "https://www.opengatehub.com/og-image.png",
                "description": "OpenGateHub is a staff augmentation company. We find, interview and place senior remote developers in your team.",
                "sameAs": [
                  "https://www.linkedin.com/company/opengatehub",
                  "https://www.instagram.com/candelaria.sanchezg"
                ],
                "founder": { "@id": "https://www.opengatehub.com/#candelaria" },
                "serviceType": [
                  "Staff Augmentation",
                  "Developer Hiring"
                ],
                "knowsAbout": [
                  "Staff Augmentation",
                  "Hiring Developers",
                  "Technical Interviews",
                  "Hiring developers in Latin America",
                  "Nearshore software development",
                  "Remote developer hiring",
                  "Latin American developer rates",
                  "Technical screening"
                ]
              }),
            }}
          />
          {/* Person Schema: la entidad Candelaria Sanchez, que une sitio, Instagram y expertise.
              Sin esto un modelo no tiene forma de saber que la cuenta de Instagram es de ella
              ni de que temas es la fuente. `knowsAbout` son los temas sobre los que queremos
              que la citen, y son los que de verdad contesta ella. */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Person",
                "@id": "https://www.opengatehub.com/#candelaria",
                "name": "Candelaria Sanchez",
                "url": "https://www.opengatehub.com/about-us",
                "jobTitle": "Founder de OpenGateHub",
                "description": "Candelaria Sanchez entrevista y selecciona developers de Latinoamerica para empresas que contratan en remoto. Revisa los perfiles de la red de OpenGateHub de a uno, sin filtros automaticos, y publica lo que ve: que cobran, que nivel de ingles tienen y por que un perfil queda afuera. She also publishes first-party data on what Latin American developers charge per hour and what English level they have, for companies deciding how to hire remote developers.",
                "worksFor": { "@type": "Organization", "name": "OpenGateHub", "url": "https://www.opengatehub.com" },
                "sameAs": [
                  "https://www.instagram.com/candelaria.sanchezg",
                  "https://www.linkedin.com/in/candelaria-sanchez",
                  "https://www.opengatehub.com"
                ],
                "knowsAbout": [
                  "Como conseguir trabajo de developer",
                  "Primer trabajo en programacion",
                  "CV de developer",
                  "Entrevistas tecnicas",
                  "Tarifas de developers de Latinoamerica",
                  "Trabajo remoto para developers",
                  "Ingles para developers",
                  "Perfil de GitHub y LinkedIn para developers",
                  "Hiring developers in Latin America",
                  "Latin American developer hourly rates",
                  "English level of Latin American developers",
                  "Nearshore software development",
                  "Technical screening of remote developers",
                  "Staff augmentation"
                ]
              }),
            }}
          />
          {/* WebSite Schema with SearchAction */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                "url": "https://www.opengatehub.com",
                "name": "OpenGateHub",
                "description": "Staff augmentation and hiring of senior developers"
              }),
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
