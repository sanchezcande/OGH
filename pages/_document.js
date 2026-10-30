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
                  "https://www.linkedin.com/company/opengatehub"
                ],
                "serviceType": [
                  "Staff Augmentation",
                  "Developer Hiring"
                ],
                "knowsAbout": [
                  "Staff Augmentation",
                  "Hiring Developers",
                  "Technical Interviews"
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
