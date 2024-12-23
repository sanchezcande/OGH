import React, { useRef, useState } from "react";
import { BlogContainer, Gallery, ArticleCard, ScrollToTopButton } from "../../src/styles/pagesStyles/Blog.styles";
import Link from "next/link";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";


export default function Blog() {
  const articles = [
    { title: "Primer artículo", slug: "first-article", summary: "Explora el contenido de este artículo." },
    { title: "Segundo artículo", slug: "second-article", summary: "Detalles interesantes en este artículo." },
    { title: "Tercer artículo", slug: "third-article", summary: "Más información sobre este tema." },
    { title: "Cuarto artículo", slug: "fourth-article", summary: "Descubre más sobre este contenido." },
    { title: "Quinto artículo", slug: "fifth-article", summary: "Más detalles interesantes aquí." },
    { title: "Sexto artículo", slug: "sixth-article", summary: "Este es un nuevo artículo interesante." },
    { title: "Primer artículo", slug: "first-article", summary: "Explora el contenido de este artículo." },
    { title: "Segundo artículo", slug: "second-article", summary: "Detalles interesantes en este artículo." },
    { title: "Tercer artículo", slug: "third-article", summary: "Más información sobre este tema." },
    { title: "Cuarto artículo", slug: "fourth-article", summary: "Descubre más sobre este contenido." },
    { title: "Quinto artículo", slug: "fifth-article", summary: "Más detalles interesantes aquí." },
    { title: "Sexto artículo", slug: "sixth-article", summary: "Este es un nuevo artículo interesante." },
    { title: "Primer artículo", slug: "first-article", summary: "Explora el contenido de este artículo." },
    { title: "Segundo artículo", slug: "second-article", summary: "Detalles interesantes en este artículo." },
    { title: "Tercer artículo", slug: "third-article", summary: "Más información sobre este tema." },
    { title: "Cuarto artículo", slug: "fourth-article", summary: "Descubre más sobre este contenido." },
    { title: "Quinto artículo", slug: "fifth-article", summary: "Más detalles interesantes aquí." },
    { title: "Sexto artículo", slug: "sixth-article", summary: "Este es un nuevo artículo interesante." },
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <BlogContainer>
      <Gallery>
        {articles.map((article) => (
          <ArticleCard key={article.slug}>
            <h2>{article.title}</h2>
            <p>{article.summary}</p>
            <Link href={`/blog/${article.slug}`}>
              Leer más
            </Link>
          </ArticleCard>
        ))}
      </Gallery>
      <ScrollToTopButton onClick={scrollToTop}>          <FontAwesomeIcon icon={faArrowUp} size="lg" />
      </ScrollToTopButton>
    </BlogContainer>
  );
}
