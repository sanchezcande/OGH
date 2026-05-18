import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { ReviewsContainer } from "../../styles/components/Reviews.styles";
import { SectionTitle } from "../../styles/pagesStyles/HomePages.styles";
import { InView } from "../InView/InView";

const StarRating = () => (
  <div style={{ display: "flex", gap: "2px", marginBottom: "0.75rem" }}>
    {[1,2,3,4,5].map((s) => (
      <span key={s} style={{ color: "#111111", fontSize: "1rem" }}>★</span>
    ))}
  </div>
);

const ReviewCardInline = ({ review, company, role, isMobile }) => (
  <div style={{
    background: "white",
    border: "1.5px solid #f0f0f0",
    borderRadius: "16px",
    padding: "1.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    flex: isMobile ? "0 0 85vw" : "1",
    minWidth: isMobile ? "85vw" : "0",
    maxWidth: isMobile ? "85vw" : undefined,
  }}>
    <StarRating />
    <p style={{
      fontSize: "0.95rem",
      lineHeight: 1.65,
      color: "#374151",
      fontStyle: "italic",
      margin: 0,
      flex: 1,
    }}>
      &ldquo;{review}&rdquo;
    </p>
    <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "0.75rem" }}>
      <div style={{ fontWeight: 700, color: "#111827", fontSize: "0.95rem" }}>{company}</div>
      {role && <div style={{ color: "#111111", fontSize: "0.82rem", marginTop: "2px" }}>{role}</div>}
    </div>
  </div>
);

export const ReviewsSection = () => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const reviewKeys = ["farzad", "vantage", "skylar", "techvision", "greenleaf", "innovatelab"];

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
            /* Mobile: all cards stacked, normal scroll */
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "0 1rem" }}>
              {reviewKeys.map((key) => (
                <ReviewCardInline
                  key={key}
                  review={t(`reviews.${key}.text`)}
                  company={t(`reviews.${key}.company`)}
                  role={t(`reviews.${key}.role`)}
                  isMobile={false}
                />
              ))}
            </div>
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
