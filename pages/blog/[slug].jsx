import React from "react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Head from "next/head"; // <-- NUEVA IMPORTACIÓN
import {
  ArticleContainer,
  Title,
  ImageContainer,
  Content,
  ErrorMessage,
} from "../../src/styles/pagesStyles/blogStyles/Slug.styles";

function renderArticleBlock(block, key) {
  const trimmed = block.trim();
  if (!trimmed) return null;

  // Headings (markdown-ish)
  if (trimmed.startsWith("### ")) {
    return (
      <h3 key={key} style={{ fontWeight: 800, marginTop: "1.25rem" }}>
        {trimmed.replace(/^###\s+/, "")}
      </h3>
    );
  }
  if (trimmed.startsWith("## ")) {
    return (
      <h2 key={key} style={{ fontWeight: 800, marginTop: "1.5rem" }}>
        {trimmed.replace(/^##\s+/, "")}
      </h2>
    );
  }

  // Bullet lists (all lines start with "- ")
  const lines = trimmed.split("\n");
  const isBulletList = lines.length > 1 && lines.every((l) => l.trim().startsWith("- "));
  if (isBulletList) {
    return (
      <ul key={key} style={{ paddingLeft: "1.25rem", marginTop: "0.75rem" }}>
        {lines.map((l, idx) => (
          <li key={idx}>{l.trim().replace(/^-+\s+/, "")}</li>
        ))}
      </ul>
    );
  }

  // Paragraph (preserve single newlines)
  return (
    <p key={key}>
      {lines.map((line, idx) => (
        <React.Fragment key={idx}>
          {line}
          {idx < lines.length - 1 ? <br /> : null}
        </React.Fragment>
      ))}
    </p>
  );
}

export default function ArticlePage() {
  const { query } = useRouter();
  const { slug } = query;
  const { t } = useTranslation();
  const articles = t("articles", { returnObjects: true }) || [];

  const article = articles.find((article) => article.slug === slug);

  if (!article) {
    return <ErrorMessage>{t("articleNotFound")}</ErrorMessage>;
  }

  // Obtenemos el extracto para la descripción (usando los primeros 150 caracteres)
  const descriptionExcerpt =
    article.content.split("\n\n")[0].substring(0, 150) + "...";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      <Head>
        {/* Título dinámico */}
        <title>{article.title} | OpenGateHub</title>

        {/* Descripción dinámica */}
        <meta name="description" content={descriptionExcerpt} />

        <meta property="og:title" content={article.title} />
      </Head>

      <ArticleContainer>
        {/* Aseguramos que el título principal sea un H1 para SEO */}
        <Title as="h1">{article.title}</Title>

        <ImageContainer>
          <img src={article.image} alt={article.title} />
        </ImageContainer>

        <Content>
          {article.content
            .split("\n\n")
            .map((block, index) => renderArticleBlock(block, index))}
        </Content>
      </ArticleContainer>
    </motion.div>
  );
}
