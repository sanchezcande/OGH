import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  BlogContainer,
  FeaturedCard,
  Gallery,
  ArticleCard,
} from "../../src/styles/pagesStyles/blogStyles/Blog.styles";
import { useRouter } from "next/router";
import SEO from "../../src/components/SEO/SEO";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function FeaturedArticle({ article, searchTerm, onSearchChange }) {
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  return (
    <FeaturedCard
      className="featured-card"
      onClick={(e) => {
        if (e.target.tagName === "INPUT") return;
        router.push(`/blog/${article.slug}`);
      }}
    >
      <div className={`featured-img-wrapper${loaded ? " loaded" : ""}`}>
        <img
          src={article.thumbnail || article.image}
          alt={article.title}
          onLoad={() => setLoaded(true)}
        />
      </div>

      <div className="search-pill" onClick={(e) => e.stopPropagation()}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="featured-overlay">
        <span className="featured-tag">Featured</span>
        <h2 className="featured-title">{article.title}</h2>
        <p className="featured-summary">{article.summary}</p>
      </div>
    </FeaturedCard>
  );
}

function BlogCard({ article, readMoreText }) {
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  return (
    <ArticleCard
      className="article-card"
      onClick={() => router.push(`/blog/${article.slug}`)}
    >
      <div className={`card-image-wrapper${loaded ? " loaded" : ""}`}>
        <img
          src={article.thumbnail || article.image}
          alt={article.title}
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />
      </div>
      <h2>{article.title}</h2>
      <p>{article.summary}</p>
      <span className="read-link">{readMoreText}</span>
    </ArticleCard>
  );
}

export default function Blog() {
  const { t } = useTranslation();
  const articles = t("articles", { returnObjects: true }) || [];
  const [searchTerm, setSearchTerm] = useState("");
  const galleryRef = useRef(null);
  const containerRef = useRef(null);

  // Match blog width to navbar width
  useEffect(() => {
    const syncWidth = () => {
      const nav = document.querySelector("nav");
      if (nav && containerRef.current) {
        containerRef.current.style.width = `${nav.offsetWidth}px`;
      }
    };
    syncWidth();
    window.addEventListener("resize", syncWidth);
    const interval = setInterval(syncWidth, 500);
    return () => {
      window.removeEventListener("resize", syncWidth);
      clearInterval(interval);
    };
  }, []);

  const filteredArticles = useMemo(() =>
    articles.filter(
      (article) =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchTerm.toLowerCase()),
    ), [articles, searchTerm]);

  const featured = filteredArticles[0];
  const rest = filteredArticles.slice(1);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ctx = gsap.context(() => {
      const featuredEl = document.querySelector(".featured-card");
      if (featuredEl) {
        gsap.fromTo(featuredEl,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.1 }
        );
      }

      if (galleryRef.current) {
        const cards = galleryRef.current.querySelectorAll(".article-card");

        cards.forEach((card, i) => {
          const img = card.querySelector(".card-image-wrapper img");
          if (img) {
            gsap.fromTo(img,
              { yPercent: -6 },
              {
                yPercent: 6,
                ease: "none",
                scrollTrigger: {
                  trigger: card,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: true,
                },
              }
            );
          }

          gsap.fromTo(card,
            { opacity: 0, y: 50 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              delay: (i % 2) * 0.12,
              ease: "power3.out",
              scrollTrigger: {
                trigger: card,
                start: "top 88%",
                toggleActions: "play none none none",
              },
            }
          );
        });
      }
    });

    return () => ctx.revert();
  }, [filteredArticles]);

  return (
    <>
      <SEO
        title="Automation, Staff Augmentation & AI Blog | LATAM Insights | OpenGateHub"
        description="Practical guides on workflow automation, n8n, AI tools, staff augmentation in Latin America, and nearshore development."
        keywords="workflow automation blog, staff augmentation LATAM blog, process improvement, n8n tutorials, AI business guides"
      />
      <BlogContainer ref={containerRef}>
        {featured && (
          <FeaturedArticle
            article={featured}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        )}

        <Gallery ref={galleryRef}>
          {rest.map((article) => (
            <BlogCard
              key={article.slug}
              article={article}
              readMoreText={t("readMore")}
            />
          ))}
        </Gallery>
      </BlogContainer>
    </>
  );
}
