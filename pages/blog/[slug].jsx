import React from "react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion"; // Importa Framer Motion
import {
  ArticleContainer,
  Title,
  ImageContainer,
  Content,
} from "../../src/styles/pagesStyles/blogStyles/Slug.styles";

export default function ArticlePage() {
  const { query } = useRouter();
  const { slug } = query;
  const { t } = useTranslation();
  const articles = t("articles", { returnObjects: true }) || [];

  const article = articles.find((article) => article.slug === slug);

  if (!article) {
    return <div>Artículo no encontrado</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      <ArticleContainer>
        <ImageContainer>
          <img src={article.image} alt={article.title} />
        </ImageContainer>
        <Title>{article.title}</Title>
        <Content>
          {article.content.split("\n\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </Content>
      </ArticleContainer>
    </motion.div>
  );
}
