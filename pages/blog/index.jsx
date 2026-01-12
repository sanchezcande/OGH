import React, { useState, useEffect } from "react";
import {
  BlogContainer,
  Gallery,
  ArticleCard,
  SearchInput,
} from "../../src/styles/pagesStyles/blogStyles/Blog.styles";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function Blog() {
  const { t } = useTranslation();
  const articles = t("articles", { returnObjects: true }) || [];
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const filteredArticles = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 },
    );

    const cards = document.querySelectorAll(".article-card");
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [filteredArticles]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setIsSearching(true);
  };

  const handleSearchBlur = () => {
    if (searchTerm === "") {
      setIsSearching(false);
    }
  };

  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };

  return (
    <BlogContainer>
      <SearchInput
        type="text"
        placeholder={t("searchPlaceholder") || "Buscar artículos..."}
        value={searchTerm}
        onChange={handleSearch}
        onBlur={handleSearchBlur}
      />

      <Gallery>
        {filteredArticles.map((article) => (
          <ArticleCard key={article.slug} className="article-card">
            <img
              src={article.image}
              alt={article.title}
              loading="lazy"
              onLoad={handleImageLoad}
            />
            <h2>{article.title}</h2>
            <p>{article.summary}</p>
            <Link href={`/blog/${article.slug}`}>{t("readMore")}</Link>
          </ArticleCard>
        ))}
      </Gallery>
    </BlogContainer>
  );
}
