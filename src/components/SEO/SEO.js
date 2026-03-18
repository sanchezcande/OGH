import Head from "next/head";
import { useRouter } from "next/router";

const SEO = ({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = "website",
  twitterHandle = "@opengatehub",
  canonical,
  robots = "index, follow",
  children,
}) => {
  const router = useRouter();
  const siteUrl = "https://opengatehub.com";
  const fullCanonical = canonical || `${siteUrl}${router.asPath.split("?")[0]}`;
  const defaultTitle = "Workflow Automation & Staff Augmentation in Latin America | OpenGateHub";
  const defaultDescription = "OpenGateHub helps companies eliminate manual work through workflow automation, AI integration, and nearshore engineering teams from Latin America. Kickoff in 7.3 days. 9.7/10 CSAT.";
  const defaultOgImage = "https://opengatehub.com/Reducido4oscuro.png";

  const displayTitle = title || defaultTitle;
  const displayDescription = description || defaultDescription;

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{displayTitle}</title>
      <meta name="title" content={displayTitle} />
      <meta name="description" content={displayDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={robots} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      {/* Canonical */}
      <link rel="canonical" href={fullCanonical} />

      {/* Hreflang - Bilingual support */}
      <link rel="alternate" hrefLang="en" href={fullCanonical} />
      <link rel="alternate" hrefLang="es" href={fullCanonical} />
      <link rel="alternate" hrefLang="x-default" href={fullCanonical} />

      {/* Geo targeting */}
      <meta name="geo.region" content="LATAM" />
      <meta name="geo.placename" content="Latin America" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:title" content={ogTitle || displayTitle} />
      <meta property="og:description" content={ogDescription || displayDescription} />
      <meta property="og:image" content={ogImage || defaultOgImage} />
      <meta property="og:site_name" content="OpenGateHub" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:locale:alternate" content="es_LA" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullCanonical} />
      <meta name="twitter:title" content={ogTitle || displayTitle} />
      <meta name="twitter:description" content={ogDescription || displayDescription} />
      <meta name="twitter:image" content={ogImage || defaultOgImage} />
      {twitterHandle && <meta name="twitter:site" content={twitterHandle} />}

      {/* Favicon */}
      <link rel="icon" href="/browser-link-logo.png" type="image/png" />

      {children}
    </Head>
  );
};

export default SEO;
