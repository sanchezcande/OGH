import React, { useState } from "react";
import { BlogContainer, Gallery, ArticleCard, ScrollToTopButton, SearchInput } from "../../src/styles/pagesStyles/blogStyles/Blog.styles";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";

export default function Blog() {
  const { t } = useTranslation(); 
  const articles = t("articles", { returnObjects: true }) || [];

  const [searchTerm, setSearchTerm] = useState("");

  const filteredArticles = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <BlogContainer>
      <SearchInput
        type="text"
        placeholder={t("searchPlaceholder") || "Buscar artículos..."}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <Gallery>
        {filteredArticles.map((article) => (
          <ArticleCard key={article.slug}>
            <img src={article.image} alt={article.title} />
            <h2>{article.title}</h2>
            <p>{article.summary}</p>
            <Link href={`/blog/${article.slug}`}>
              {t("readMore")}
            </Link>
          </ArticleCard>
        ))}
      </Gallery>

      <ScrollToTopButton onClick={scrollToTop}>
        <FontAwesomeIcon icon={faArrowUp} size="lg" />
      </ScrollToTopButton>
    </BlogContainer>
  );
}
