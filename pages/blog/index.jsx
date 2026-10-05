import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import SEO from "../../src/components/SEO/SEO";
import ClosingCall from "../../src/components/ClosingCall/ClosingCall";
import {
  Body,
  Display,
  Eyebrow,
  H2,
  H3,
  Lead,
  Page,
  Reveal,
  Section,
  Wrap,
  color,
  font,
  mq,
  useLang,
} from "../../src/styles/kit";

// Los artículos viven en src/locales/<idioma>/translation.json (clave "articles") y acá solo se leen.
const COPY = {
  es: {
    seo: {
      title: "Blog: contratación de developers y staff augmentation | OpenGateHub",
      description:
        "Artículos sobre contratación de developers y staff augmentation, para leer antes de sumar a alguien a tu equipo.",
    },
    eyebrow: "Blog",
    title: "Notas sobre contratar developers.",
    lead: "Artículos sobre contratación y staff augmentation, para leer antes de sumar a alguien a tu equipo.",
    search: { label: "Buscar en el blog", placeholder: "Buscar" },
    featured: "Destacado",
    more: "Más artículos",
    results: "Resultados",
    empty: "No hay artículos para esa búsqueda.",
    read: "Leer el artículo",
    minutes: (n) => `${n} min de lectura`,
  },
  en: {
    seo: {
      title: "Blog: Hiring Developers and Staff Augmentation | OpenGateHub",
      description:
        "Articles on hiring developers and staff augmentation, to read before you add someone to your team.",
    },
    eyebrow: "Blog",
    title: "Notes on hiring developers.",
    lead: "Articles on hiring and staff augmentation, to read before you add someone to your team.",
    search: { label: "Search the blog", placeholder: "Search" },
    featured: "Featured",
    more: "More articles",
    results: "Results",
    empty: "No articles match that search.",
    read: "Read the article",
    minutes: (n) => `${n} min read`,
  },
};

// Orden en que se muestran (los datos no se tocan): primero lo que habla de contratación
// y staff augmentation, después el resto tal como está cargado.
const HIRING = ["first-developer", "staff-augmentation", "dev-agencies", "latam"];
// El ranking de empresas va en la lista común, pero nunca como destacado.
const NEVER_FEATURED = ["top-staff-augmentation-companies"];

const isHiring = (article) => HIRING.some((key) => article.slug.includes(key));
// Solo un artículo de contratación puede ser el destacado: los de otros temas quedan afuera por regla.
const canBeFeatured = (article) => isHiring(article) && !NEVER_FEATURED.some((key) => article.slug.includes(key));

const normalize = (text) =>
  String(text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const readingMinutes = (article) => Math.max(1, Math.round(article.content.trim().split(/\s+/).length / 200));

export default function Blog() {
  const { t } = useTranslation();
  const copy = COPY[useLang()];
  const [query, setQuery] = useState("");

  const loaded = t("articles", { returnObjects: true });
  const all = Array.isArray(loaded) ? loaded : [];
  // Se muestran todos. Primero los de contratación y staff augmentation, después el resto.
  const articles = [...all.filter(isHiring), ...all.filter((article) => !isHiring(article))];

  const term = normalize(query.trim());
  const searching = term.length > 0;
  // Al buscar no hay destacado: los resultados van todos en la misma lista.
  const featured = searching ? null : articles.find(canBeFeatured);
  const list = searching
    ? articles.filter((article) => normalize(article.title).includes(term) || normalize(article.summary).includes(term))
    : articles.filter((article) => article.slug !== featured?.slug);

  return (
    <Page>
      <SEO title={copy.seo.title} description={copy.seo.description} />

      <Head>
        <Wrap>
          <HeadRow>
            <div>
              <Eyebrow>{copy.eyebrow}</Eyebrow>
              <Title>{copy.title}</Title>
              <HeadLead>{copy.lead}</HeadLead>
            </div>
            <Search role="search" onSubmit={(event) => event.preventDefault()}>
              <label htmlFor="blog-search">{copy.search.label}</label>
              <input
                id="blog-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.search.placeholder}
                autoComplete="off"
              />
            </Search>
          </HeadRow>
        </Wrap>
      </Head>

      <Listing $tight>
        <Wrap>
          {featured && (
            <Featured href={`/blog/${featured.slug}`}>
              <div>
                <Label>
                  <em>{copy.featured}</em>
                  <span aria-hidden="true">·</span>
                  {copy.minutes(readingMinutes(featured))}
                </Label>
                <H2>{featured.title}</H2>
                <Lead>{featured.summary}</Lead>
                <span className="cta">
                  {copy.read} <span aria-hidden="true">→</span>
                </span>
              </div>
              <Figure>
                <Image
                  src={featured.image}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 960px) 100vw, 520px"
                  style={{ objectFit: "cover" }}
                />
              </Figure>
            </Featured>
          )}

          <ListTitle aria-live="polite">{searching ? `${copy.results} (${list.length})` : copy.more}</ListTitle>

          {list.length > 0 ? (
            <Grid as={Reveal}>
              {list.map((article) => (
                <Item key={article.slug} href={`/blog/${article.slug}`}>
                  <Label>{copy.minutes(readingMinutes(article))}</Label>
                  <H3>{article.title}</H3>
                  <Body>{article.summary}</Body>
                  <span className="cta">
                    {copy.read} <span aria-hidden="true">→</span>
                  </span>
                </Item>
              ))}
            </Grid>
          ) : (
            <Empty>{copy.empty}</Empty>
          )}
        </Wrap>
      </Listing>

      <ClosingCall />
    </Page>
  );
}

/* ───────── Estilos propios del blog ───────── */

const Head = styled.section`
  padding: clamp(56px, 9vw, 120px) 0 clamp(40px, 5vw, 64px);
`;

const HeadRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 280px);
  gap: 40px clamp(40px, 7vw, 104px);
  align-items: end;

  ${mq.tablet} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Title = styled(Display)`
  max-width: 14ch;
`;

const HeadLead = styled(Lead)`
  margin-top: 28px;
  max-width: 52ch;
`;

const Search = styled.form`
  position: relative;

  label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  input {
    width: 100%;
    height: 48px;
    padding: 0;
    border: 0;
    border-bottom: 1px solid ${color.ink};
    border-radius: 0;
    background: transparent;
    font-family: ${font.sans};
    font-size: 1rem;
    color: ${color.ink};
    -webkit-appearance: none;
    appearance: none;
    outline: none;
    transition: border-color 0.2s ease;
  }

  input::placeholder {
    color: ${color.muted};
  }

  input:focus-visible {
    border-bottom-color: ${color.accent};
    box-shadow: 0 1px 0 ${color.accent};
  }
`;

const Listing = styled(Section)`
  padding-top: 0;
`;

const Label = styled.span`
  display: flex;
  flex-wrap: wrap;
  gap: 0 10px;
  font-family: ${font.brand};
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${color.muted};

  em {
    font-style: normal;
    color: ${color.accent};
  }
`;

const Featured = styled(Link)`
  display: grid;
  grid-template-columns: minmax(0, 6fr) minmax(0, 5fr);
  gap: clamp(32px, 6vw, 88px);
  align-items: center;
  padding: clamp(32px, 4.5vw, 56px) 0;
  border-top: 1px solid ${color.ink};
  border-bottom: 1px solid ${color.line};
  color: ${color.ink};

  > div:first-child {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  ${H2} {
    font-size: clamp(1.75rem, 3.2vw, 2.625rem);
    transition: color 0.2s ease;
  }

  .cta {
    margin-top: 4px;
    font-size: 0.9375rem;
    font-weight: 600;
    text-decoration: underline;
    text-decoration-color: ${color.accent};
    text-decoration-thickness: 1px;
    text-underline-offset: 5px;
    transition: color 0.2s ease;
  }

  &:hover {
    color: ${color.ink};
  }

  &:hover .cta {
    color: ${color.accent};
  }

  &:focus-visible {
    outline: 2px solid ${color.accent};
    outline-offset: 6px;
  }

  ${mq.tablet} {
    grid-template-columns: minmax(0, 1fr);
    gap: 28px;
  }
`;

const Figure = styled.div`
  position: relative;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  border-radius: 4px;
  background: ${color.paperAlt};

  img {
    filter: grayscale(1);
  }

  ${mq.tablet} {
    order: -1;
    aspect-ratio: 16 / 9;
  }
`;

const ListTitle = styled.p`
  margin: clamp(48px, 6vw, 72px) 0 20px;
  font-family: ${font.brand};
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${color.muted};

  &:first-child {
    margin-top: 0;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-top: 1px solid ${color.ink};

  ${mq.tablet} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Item = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  padding: 32px clamp(24px, 4vw, 48px) 36px 0;
  border-bottom: 1px solid ${color.line};
  color: ${color.ink};

  &:nth-child(even) {
    padding-left: clamp(24px, 4vw, 48px);
    padding-right: 0;
    border-left: 1px solid ${color.line};
  }

  ${H3} {
    font-size: clamp(1.3125rem, 2vw, 1.625rem);
    line-height: 1.22;
    text-wrap: balance;
  }

  ${Body} {
    flex: 1;
  }

  .cta {
    margin-top: 6px;
    font-size: 0.9375rem;
    font-weight: 600;
    transition: color 0.2s ease;
  }

  &:hover {
    color: ${color.ink};
  }

  &:hover .cta {
    color: ${color.accent};
  }

  &:focus-visible {
    outline: 2px solid ${color.accent};
    outline-offset: -2px;
  }

  ${mq.tablet} {
    padding: 28px 0 30px;

    &:nth-child(even) {
      padding-left: 0;
      border-left: 0;
    }
  }
`;

const Empty = styled(Body)`
  padding: 32px 0;
  border-top: 1px solid ${color.ink};
  border-bottom: 1px solid ${color.line};
  max-width: none;
`;
