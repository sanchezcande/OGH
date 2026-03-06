import React, { useState, useEffect } from "react";
import {
  BlogContainer,
  Gallery,
  ArticleCard,
  SearchInput,
  ControlsRow,
  SearchAndSort,
  SortSelect,
  LoadMoreButton,
  CardActions,
  EditLink,
} from "../../src/styles/pagesStyles/blogStyles/Blog.styles";
import Link from "next/link";
import Image from "next/image";
import SEO from "../../src/components/SEO/SEO";
import { useTranslation } from "react-i18next";

export default function Blog() {
  const { t, i18n } = useTranslation();
  const [articles, setArticles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/admin/check-auth");
        const data = await res.json();
        setIsAuthenticated(data.authenticated);
      } catch (error) {
        console.error("Auth check failed", error);
      }
    };
    checkAuth();
  }, []);

  // Reset pagination when central filters change
  useEffect(() => {
    setPage(1);
    setArticles([]);
  }, [i18n.language, searchTerm, sortOrder]);

  useEffect(() => {
    const fetchArticles = async () => {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const lang = i18n.language || "es";
        const response = await fetch(`/api/blog?lang=${lang}&search=${searchTerm}&sort=${sortOrder}&page=${page}&limit=6`);
        if (response.ok) {
          const data = await response.json();
          if (page === 1) {
            setArticles(data.articles);
          } else {
            setArticles(prev => [...prev, ...data.articles]);
          }
          setHasMore(data.hasMore);
        }
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchArticles();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [i18n.language, searchTerm, sortOrder, page]);

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
  }, [articles]);

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
    <>
      <SEO
        title="Automation & Process Improvement Blog | OpenGateHub"
        description="Practical guides on workflow automation, n8n, AI tools, and operational efficiency. Written by the team that's automated 300+ processes across 50+ companies."
        keywords="workflow automation blog, process improvement, n8n tutorials, AI business guides, operational efficiency"
      />
      <BlogContainer>
        <ControlsRow>
          <SearchAndSort>
            <SearchInput
              type="text"
              placeholder={t("searchPlaceholder") || "Buscar artículos..."}
              value={searchTerm}
              onChange={handleSearch}
              onBlur={handleSearchBlur}
            />
            <SortSelect value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="newest">{t("newest") || "Más recientes"}</option>
              <option value="oldest">{t("oldest") || "Más antiguos"}</option>
              <option value="alphabetical">{t("alphabetical") || "Alfabético"}</option>
            </SortSelect>
          </SearchAndSort>

          {isAuthenticated && (
            <Link href="/admin/new-post" style={{
              background: "#0070f3",
              color: "white",
              padding: "0.8rem 1.5rem",
              borderRadius: "5px",
              textDecoration: "none",
              fontWeight: "bold"
            }}>
              + Nuevo Artículo
            </Link>
          )}
        </ControlsRow>

        {loading && page === 1 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#374151" }}>
            {t("loading") || "Cargando..."}
          </div>
        ) : (
          <>
            <Gallery>
              {articles.length > 0 ? (
                articles.map((article) => (
                  <ArticleCard key={article.slug} className="article-card">
                    <Image
                      src={article.thumbnail || article.image || "/images/placeholder.png"}
                      alt={article.title}
                      width={600}
                      height={300}
                      sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 33vw"
                      style={{ width: "100%", height: "200px", objectFit: "cover" }}
                      loading="lazy"
                      onLoad={handleImageLoad}
                    />
                    <h2>{article.title}</h2>
                    <p>{article.summary}</p>
                    <CardActions>
                      <Link href={`/blog/${article.slug}?lang=${i18n.language || "es"}`}>{t("readMore")}</Link>
                      {isAuthenticated && (
                        <EditLink href={`/admin/new-post?edit=${article.slug}&lang=${article.lang}`}>
                          {t("edit") || "Editar"}
                        </EditLink>
                      )}
                    </CardActions>
                  </ArticleCard>
                ))
              ) : (
                <div style={{ textAlign: "center", gridColumn: "1 / -1", padding: "2rem", color: "#374151" }}>
                  {t("noArticlesFound") || "No se encontraron artículos."}
                </div>
              )}
            </Gallery>

            {hasMore && (
              <LoadMoreButton
                onClick={() => setPage(prev => prev + 1)}
                disabled={loadingMore}
              >
                {loadingMore ? (t("loading") || "Cargando...") : (t("loadMore") || "Cargar más")}
              </LoadMoreButton>
            )}
          </>
        )}
      </BlogContainer>
    </>
  );
}

