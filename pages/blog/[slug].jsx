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
  ErrorMessage
} from "../../src/styles/pagesStyles/blogStyles/Slug.styles";

export default function ArticlePage() {
  const { query } = useRouter();
  const { slug } = query;
  const { t } = useTranslation();
  const articles = t("articles", { returnObjects: true }) || [];

  const article = articles.find((article) => article.slug === slug);

  if (!article) {
    return (
      <ErrorMessage>
        {t("articleNotFound")}
      </ErrorMessage>
    );
  }

  // Obtenemos el extracto para la descripción (usando los primeros 150 caracteres)
  const descriptionExcerpt = article.content.split("\n\n")[0].substring(0, 150) + '...';

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
        <meta
          name="description"
          content={descriptionExcerpt}
        />

        <meta property="og:title" content={article.title} />
      </Head>

      <ArticleContainer>
        <ImageContainer>
          <img src={article.image} alt={article.title} />
        </ImageContainer>

        {/* Aseguramos que el título principal sea un H1 para SEO */}
        <Title as="h1">{article.title}</Title>

        <Content>
          {article.content.split("\n\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </Content>
      </ArticleContainer>
    </motion.div>
  );
}