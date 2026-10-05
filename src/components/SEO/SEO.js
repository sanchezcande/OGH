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
  alternates,
  children,
}) => {
  const router = useRouter();
  const siteUrl = "https://www.opengatehub.com";
  // Cada idioma tiene su dirección: español en la raíz, inglés en /en.
  const isEnglish = router.locale === "en";
  const path = router.asPath.split("?")[0].split("#")[0];
  const pathNoSlash = path === "/" ? "" : path;
  // "alternates" lo pasan las páginas cuya dirección cambia según el idioma (artículos del blog).
  const urlEs = alternates ? alternates.es && `${siteUrl}${alternates.es}` : `${siteUrl}${path}`;
  const urlEn = alternates ? alternates.en && `${siteUrl}${alternates.en}` : `${siteUrl}/en${pathNoSlash}`;
  const fullCanonical = canonical || (isEnglish ? urlEn : urlEs) || `${siteUrl}${isEnglish ? "/en" : ""}${pathNoSlash || "/"}`;
  const defaultTitle = "Staff Augmentation: Hire Senior Developers | OpenGateHub";
  const defaultDescription = "OpenGateHub finds, interviews and places senior remote developers in your team.";
  const defaultOgImage = "https://www.opengatehub.com/og-image.png";

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
      {urlEs && <link rel="alternate" hrefLang="es" href={urlEs} />}
      {urlEn && <link rel="alternate" hrefLang="en" href={urlEn} />}
      <link rel="alternate" hrefLang="x-default" href={urlEs || urlEn} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:title" content={ogTitle || displayTitle} />
      <meta property="og:description" content={ogDescription || displayDescription} />
      <meta property="og:image" content={ogImage || defaultOgImage} />
      <meta property="og:site_name" content="OpenGateHub" />
      <meta property="og:locale" content={isEnglish ? "en_US" : "es_AR"} />
      <meta property="og:locale:alternate" content={isEnglish ? "es_AR" : "en_US"} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullCanonical} />
      <meta name="twitter:title" content={ogTitle || displayTitle} />
      <meta name="twitter:description" content={ogDescription || displayDescription} />
      <meta name="twitter:image" content={ogImage || defaultOgImage} />
      {twitterHandle && <meta name="twitter:site" content={twitterHandle} />}

      {/* Favicon */}
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />

      {children}
    </Head>
  );
};

export default SEO;
