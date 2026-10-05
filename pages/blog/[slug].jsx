import React from "react";
import Link from "next/link";
import styled from "styled-components";
import SEO from "../../src/components/SEO/SEO";
import ClosingCall from "../../src/components/ClosingCall/ClosingCall";
import es from "../../src/locales/es/translation.json";
import en from "../../src/locales/en/translation.json";
import { Display, Lead, Page, TextLink, Wrap, color, font, mq } from "../../src/styles/kit";

// Los artículos viven en los textos de cada idioma (clave "articles") y acá solo se leen.
const ARTICLES = { es: es.articles || [], en: en.articles || [] };
const SITE_URL = "https://www.opengatehub.com";

const COPY = {
  es: {
    blog: "Blog",
    back: "Volver al blog",
    minutes: (n) => `${n} min de lectura`,
  },
  en: {
    blog: "Blog",
    back: "Back to the blog",
    minutes: (n) => `${n} min read`,
  },
};

// El mismo artículo en otro idioma: mismo slug o, cuando el slug cambia, la misma imagen.
const findTwin = (article, lang) =>
  ARTICLES[lang].find((other) => other.slug === article.slug) ||
  ARTICLES[lang].find((other) => other.image === article.image);

const articlePath = (lang, slug) => `${lang === "en" ? "/en" : ""}/blog/${slug}`;

// El servidor busca el slug en el idioma de la dirección (/ es español, /en es inglés) y entrega
// el primer HTML ya con título, descripción y texto. Un slug que no existe da 404 de verdad.
// Si el slug es del otro idioma (hay artículos con slug distinto en cada uno), se redirige a la
// dirección de ese idioma. "alternates" le dice al menú y a Google cuál es la versión en cada idioma.
export async function getServerSideProps({ params, locale }) {
  const slug = String(params?.slug || "");
  const site = locale === "en" ? "en" : "es";
  const other = site === "en" ? "es" : "en";

  const here = ARTICLES[site].findIndex((article) => article.slug === slug);
  if (here !== -1) {
    const twin = findTwin(ARTICLES[site][here], other);
    const alternates = { [site]: articlePath(site, slug) };
    if (twin) alternates[other] = articlePath(other, twin.slug);
    return { props: { slug, lang: site, index: here, alternates } };
  }

  const there = ARTICLES[other].findIndex((article) => article.slug === slug);
  if (there === -1) return { notFound: true };

  return { redirect: { destination: articlePath(other, slug), permanent: false } };
}

const readingMinutes = (article) => Math.max(1, Math.round(article.content.trim().split(/\s+/).length / 200));

/* ───────── Markdown mínimo de los artículos: ##, ###, listas y párrafos ───────── */

// Negrita con doble asterisco: lo único en línea que usan los artículos.
function inline(text) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part));
}

const isBullet = (line) => line.trim().startsWith("- ");

const renderList = (lines, key) => (
  <ul key={key}>
    {lines.map((line, i) => (
      <li key={i}>{inline(line.trim().replace(/^-+\s+/, ""))}</li>
    ))}
  </ul>
);

// Párrafo: se conservan los saltos de línea simples.
const renderParagraph = (lines, key) => (
  <p key={key}>
    {lines.map((line, i) => (
      <React.Fragment key={i}>
        {inline(line)}
        {i < lines.length - 1 ? <br /> : null}
      </React.Fragment>
    ))}
  </p>
);

function renderArticleBlock(block, key) {
  const trimmed = block.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("### ")) return <h3 key={key}>{inline(trimmed.replace(/^###\s+/, ""))}</h3>;
  if (trimmed.startsWith("## ")) return <h2 key={key}>{inline(trimmed.replace(/^##\s+/, ""))}</h2>;

  const lines = trimmed.split("\n");

  // Lista: todas las líneas empiezan con "- ".
  if (lines.length > 1 && lines.every(isBullet)) return renderList(lines, key);

  // Una frase de entrada y debajo la lista.
  const firstBullet = lines.findIndex(isBullet);
  if (firstBullet > 0 && lines.slice(firstBullet).every(isBullet)) {
    return (
      <React.Fragment key={key}>
        {renderParagraph(lines.slice(0, firstBullet))}
        {renderList(lines.slice(firstBullet))}
      </React.Fragment>
    );
  }

  return renderParagraph(lines, key);
}

export default function ArticlePage({ lang, index, alternates }) {
  const article = ARTICLES[lang]?.[index];

  if (!article) return null;

  const copy = COPY[lang];

  return (
    <Page>
      <SEO
        title={`${article.title} | OpenGateHub`}
        description={article.summary}
        ogImage={article.image ? `${SITE_URL}${article.image}` : undefined}
        ogType="article"
        alternates={alternates}
      />

      <Article lang={lang}>
        <Wrap $narrow>
          <Meta>
            <Link href="/blog">{copy.blog}</Link>
            <span aria-hidden="true">·</span>
            {copy.minutes(readingMinutes(article))}
          </Meta>
          <Title>{article.title}</Title>
          <Dek>{article.summary}</Dek>

          <Prose>{article.content.split("\n\n").map((block, i) => renderArticleBlock(block, i))}</Prose>

          <Foot>
            <TextLink as={Link} href="/blog">
              <span aria-hidden="true">←</span> {copy.back}
            </TextLink>
          </Foot>
        </Wrap>
      </Article>

      <ClosingCall />
    </Page>
  );
}

/* ───────── Estilos propios del artículo ───────── */

const Article = styled.article`
  padding: clamp(48px, 7vw, 96px) 0 clamp(72px, 10vw, 136px);
`;

const Meta = styled.p`
  display: flex;
  flex-wrap: wrap;
  gap: 0 10px;
  margin: 0 0 24px;
  font-family: ${font.brand};
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${color.muted};

  a {
    color: ${color.accent};
  }

  a:hover {
    color: ${color.accentDark};
    text-decoration: underline;
    text-underline-offset: 4px;
  }
`;

const Title = styled(Display)`
  font-size: clamp(2rem, 4.6vw, 3.375rem);
  line-height: 1.08;
`;

const Dek = styled(Lead)`
  margin-top: 28px;
  max-width: none;
  font-size: clamp(1.1875rem, 1.7vw, 1.375rem);
  line-height: 1.5;
`;

const Prose = styled.div`
  margin-top: clamp(36px, 5vw, 56px);
  padding-top: clamp(36px, 5vw, 56px);
  border-top: 1px solid ${color.line};
  font-family: ${font.sans};
  font-size: 1.125rem;
  line-height: 1.75;
  color: ${color.inkSoft};
  overflow-wrap: break-word;

  > * + * {
    margin-top: 1.3em;
  }

  h2,
  h3 {
    font-family: ${font.serif};
    color: ${color.ink};
    text-wrap: balance;
  }

  h2 {
    font-weight: 400;
    font-size: clamp(1.625rem, 2.8vw, 2.125rem);
    line-height: 1.18;
    letter-spacing: -0.016em;
  }

  h3 {
    font-weight: 500;
    font-size: clamp(1.3125rem, 2vw, 1.5rem);
    line-height: 1.28;
    letter-spacing: -0.01em;
  }

  > * + h2 {
    margin-top: 2em;
  }

  > * + h3 {
    margin-top: 1.7em;
  }

  > h2 + *,
  > h3 + * {
    margin-top: 0.9em;
  }

  > h2 + h3 {
    margin-top: 1.1em;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    position: relative;
    padding-left: 1.6em;
  }

  li + li {
    margin-top: 0.55em;
  }

  li::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0.72em;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: ${color.accent};
  }

  /* Una frase de entrada pegada a su lista */
  > p + ul {
    margin-top: 0.8em;
  }

  strong {
    font-weight: 600;
    color: ${color.ink};
  }

  ${mq.mobile} {
    font-size: 1.0625rem;
    line-height: 1.7;
  }
`;

const Foot = styled.div`
  margin-top: clamp(48px, 6vw, 72px);
  padding-top: 28px;
  border-top: 1px solid ${color.line};
`;
