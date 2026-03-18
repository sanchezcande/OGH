import Document, { Html, Head, Main, NextScript } from "next/document";
import { ServerStyleSheet } from "styled-components";

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
      <Html lang="en">
        <Head>
          {/* Organization Schema - Global */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "OpenGateHub",
                "url": "https://opengatehub.com",
                "logo": "https://opengatehub.com/browser-link-logo.png",
                "description": "OpenGateHub is a workflow automation and staff augmentation company from Latin America. We help companies eliminate manual work through AI integration, n8n automation, and embedded nearshore engineering teams.",
                "sameAs": [
                  "https://www.linkedin.com/company/opengatehub"
                ],
                "areaServed": [
                  { "@type": "Place", "name": "Latin America" },
                  { "@type": "Place", "name": "United States" },
                  { "@type": "Place", "name": "North America" }
                ],
                "serviceType": [
                  "Workflow Automation",
                  "Staff Augmentation",
                  "AI Automation",
                  "n8n Automation",
                  "Nearshore Software Development"
                ],
                "knowsAbout": [
                  "Workflow Automation",
                  "Staff Augmentation",
                  "AI Integration",
                  "n8n",
                  "Nearshore Development",
                  "Process Automation",
                  "Business Process Optimization"
                ],
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": "9.7",
                  "bestRating": "10",
                  "ratingCount": "50"
                }
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
                "url": "https://opengatehub.com",
                "name": "OpenGateHub",
                "description": "Workflow Automation & Staff Augmentation from Latin America",
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": "https://opengatehub.com/blog?q={search_term_string}"
                  },
                  "query-input": "required name=search_term_string"
                }
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
