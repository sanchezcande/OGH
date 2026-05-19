import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef, useCallback } from "react";
import { ReviewsContainer } from "../../styles/components/Reviews.styles";
import { SectionTitle } from "../../styles/pagesStyles/HomePages.styles";
import { InView } from "../InView/InView";

const ReviewCardInline = ({ review, company, role, isMobile }) => (
  <div style={{
    background: "#ffffff",
    borderLeft: "3px solid #111",
    padding: "2rem 2rem 1.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "0",
    flex: isMobile ? "0 0 85vw" : "1",
    minWidth: isMobile ? "85vw" : "0",
    maxWidth: isMobile ? "85vw" : undefined,
    position: "relative",
    transition: "all 0.3s ease",
  }}>
    <span style={{
      fontSize: "3.5rem",
      lineHeight: 1,
      color: "#111",
      fontFamily: "Georgia, serif",
      fontWeight: 700,
      marginBottom: "0.5rem",
      display: "block",
      opacity: 0.15,
      userSelect: "none",
    }}>"</span>
    <p style={{
      fontSize: "0.95rem",
      lineHeight: 1.75,
      color: "#374151",
      margin: 0,
      flex: 1,
      letterSpacing: "0.01em",
    }}>
      {review}
    </p>
    <div style={{
      marginTop: "1.5rem",
      paddingTop: "1rem",
      borderTop: "1px solid #e5e7eb",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    }}>
      <div style={{
        width: "6px",
        height: "6px",
        background: "#111",
        flexShrink: 0,
      }} />
      <div>
        <div style={{ fontWeight: 700, color: "#111", fontSize: "0.9rem", letterSpacing: "0.02em", textTransform: "uppercase" }}>{company}</div>
        {role && <div style={{ color: "#6b7280", fontSize: "0.8rem", marginTop: "2px", letterSpacing: "0.01em" }}>{role}</div>}
      </div>
    </div>
  </div>
);

export const ReviewsSection = () => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [activeMobileCard, setActiveMobileCard] = useState(0);
  const scrollRef = useRef(null);
  const reviewKeys = ["farzad", "vantage", "skylar", "techvision", "greenleaf", "innovatelab"];

  const handleMobileScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.firstChild?.offsetWidth || 1;
    const gap = 16;
    const index = Math.round(el.scrollLeft / (cardWidth + gap));
    setActiveMobileCard(Math.min(index, reviewKeys.length - 1));
  }, [reviewKeys.length]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const PER_PAGE = 3;
  const totalPages = Math.ceil(reviewKeys.length / PER_PAGE);
  const visibleKeys = reviewKeys.slice(currentPage * PER_PAGE, currentPage * PER_PAGE + PER_PAGE);

  return (
    <InView>
      {(isInView) => (
        <ReviewsContainer className={isInView ? "visible" : ""}>
          <SectionTitle style={{ "--i": 3 }}>{t("reviewsTitle")}</SectionTitle>
          {t("reviewsSubtitle") && (
            <p style={{
              textAlign: "center",
              color: "#6B7280",
              fontSize: "1rem",
              marginTop: "0.5rem",
              marginBottom: "2.5rem",
            }}>
              {t("reviewsSubtitle")}
            </p>
          )}

          {isMobile ? (
            /* Mobile: horizontal swipeable carousel */
            <>
              <div
                ref={scrollRef}
                className="reviews-scroll"
                onScroll={handleMobileScroll}
                style={{
                  display: "flex",
                  gap: "1rem",
                  overflowX: "auto",
                  scrollSnapType: "x mandatory",
                  WebkitOverflowScrolling: "touch",
                  paddingLeft: "1rem",
                  paddingRight: "1rem",
                  paddingBottom: "0.5rem",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                <style>{`
                  .reviews-scroll::-webkit-scrollbar { display: none; }
                `}</style>
                {reviewKeys.map((key) => (
                  <div
                    key={key}
                    style={{
                      flex: "0 0 85vw",
                      minWidth: "85vw",
                      maxWidth: "85vw",
                      scrollSnapAlign: "center",
                    }}
                  >
                    <ReviewCardInline
                      review={t(`reviews.${key}.text`)}
                      company={t(`reviews.${key}.company`)}
                      role={t(`reviews.${key}.role`)}
                      isMobile={true}
                    />
                  </div>
                ))}
              </div>
              {/* Mobile dots */}
              <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1.25rem" }}>
                {reviewKeys.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: i === activeMobileCard ? "24px" : "8px",
                      height: "8px",
                      borderRadius: "100px",
                      background: i === activeMobileCard ? "#111111" : "#d1d5db",
                      transition: "all 0.25s ease",
                    }}
                  />
                ))}
              </div>
            </>
          ) : (
            /* Desktop: 3-column paginated grid */
            <>
              <div style={{ display: "flex", gap: "1.25rem", alignItems: "stretch" }}>
                {visibleKeys.map((key) => (
                  <ReviewCardInline
                    key={key}
                    review={t(`reviews.${key}.text`)}
                    company={t(`reviews.${key}.company`)}
                    role={t(`reviews.${key}.role`)}
                    isMobile={false}
                  />
                ))}
              </div>

              {/* Dots navigation - desktop only */}
              <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "2rem" }}>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    aria-label={`Go to page ${i + 1}`}
                    style={{
                      width: i === currentPage ? "24px" : "8px",
                      height: "8px",
                      borderRadius: "100px",
                      background: i === currentPage ? "#111111" : "#d1d5db",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      transition: "all 0.25s ease",
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </ReviewsContainer>
      )}
    </InView>
  );
};
