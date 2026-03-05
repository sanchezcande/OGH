import {
  Container,
  Hero,
  Title,
  Subtitle,
  CTAButton,
  GradientOverlay,
  Highlight,
  Section,
  SectionTitle,
  FloatingBlob,
  PlanSteps,
  SectionText,
  ImageContainer,
  Glow,
  PlanSection,
} from "../src/styles/pagesStyles/HomePages.styles";
import { useTranslation } from "react-i18next";
import CallToActionBlock from "../src/components/CallToAction/CallToAction";
import Head from "next/head";
import { InView } from "../src/components/InView/InView";
import { ReviewsSection } from "../src/components/Reviews/ReviewsSection";
import MetricsSection from "../src/components/Metrics/MetricsSection";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import React from "react";
import { createPortal } from "react-dom";
import {
  FaProjectDiagram,
  FaExternalLinkAlt,
  FaUsers,
  FaChevronLeft,
  FaChevronRight,
  FaQuoteLeft,
  FaClock,
  FaBolt,
  FaDollarSign,
  FaTasks,
} from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/router";
import useMediaQuery from "../src/Hooks/useMediaQuery";

// Tabs Component
const ProjectTabs = ({ activeTab, onTabChange, isMobile }) => {
  const tabs = [
    { id: "all", label: "All" },
    { id: "saas", label: "SaaS" },
    { id: "web-performance", label: "Web Performance" },
    { id: "commerce", label: "Commerce" },
  ];

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "0.5rem",
        marginBottom: "2rem",
        flexWrap: "wrap",
        paddingLeft: isMobile ? "1.5rem" : "1rem",
        paddingRight: isMobile ? "1.5rem" : "1rem",
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "20px",
            border: "none",
            background: activeTab === tab.id ? "#F97B72" : "#f3f4f6",
            color: activeTab === tab.id ? "white" : "#6B7280",
            fontSize: "0.9rem",
            fontWeight: "500",
            cursor: "pointer",
            transition: "all 0.2s ease",
            whiteSpace: "nowrap",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

// Featured Work Card Component
const FeaturedWorkCard = ({
  image,
  title,
  description,
  metrics,
  link,
  hoverContent,
  delay = 0,
  badges = ["35% faster", "0 bugs", "Live product"],
  category,
  imageScale = 1,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [showHover, setShowHover] = useState(false);
  const [hoverPosition, setHoverPosition] = useState(null);
  const cardRef = React.useRef(null);
  const hasValidLink = Boolean(link && link !== "#");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkMobile = () => {
        setIsMobile(window.innerWidth <= 768);
      };
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }
  }, []);

  const handleMouseEnter = (event) => {
    if (!isMobile) {
      // Calcular posición ANTES de mostrar el hover
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        // Usar el centro exacto del div interno (donde está el logo) - width: 320px
        // El hover también tiene width: 320px, así que deben alinearse perfectamente
        const centerX = rect.left + rect.width / 2;
        setHoverPosition({
          top: rect.bottom + 5,
          left: centerX,
        });
      }
      setShowHover(true);
      // Aumentar z-index cuando se hace hover
      event.currentTarget.style.zIndex = "99999999999";
    }
  };

  const handleMouseLeave = (event) => {
    if (!isMobile) {
      setShowHover(false);
      // Restaurar z-index cuando se quita el hover
      event.currentTarget.style.zIndex = "999999";
    }
  };

  // Actualizar posición cuando se hace scroll o resize
  useEffect(() => {
    if (showHover && cardRef.current) {
      const updatePosition = () => {
        if (cardRef.current) {
          const rect = cardRef.current.getBoundingClientRect();
          // Usar el centro del div interno (donde está el logo) - width: 320px
          const centerX = rect.left + rect.width / 2;
          setHoverPosition({
            top: rect.bottom + 5,
            left: centerX,
          });
        }
      };

      // Pequeño delay para asegurar que el DOM esté actualizado
      const timeoutId = setTimeout(updatePosition, 10);

      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [showHover]);

  const handleTouchStart = (event) => {
    if (isMobile) {
      event.preventDefault();
      setShowHover(!showHover);
      // Aumentar z-index cuando se activa
      event.currentTarget.style.zIndex = showHover ? "999999" : "9999999999";
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: isMobile ? "0.5rem" : "2rem",
          cursor: hasValidLink ? "pointer" : "default",
          transition: "all 0.3s ease",
          zIndex: showHover ? "999999999999" : "999999",
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => {
          if (!isMobile && hasValidLink) {
            window.open(link, "_blank", "noopener,noreferrer");
          }
        }}
      >
        <div
          ref={cardRef}
          style={{
            position: "relative",
            width: isMobile ? "250px" : "320px",
            textAlign: "center",
            zIndex: showHover ? "999999999999" : "999999",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
            }}
          >
            <div
              style={{
                height: "120px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                marginBottom: "0.25rem",
              }}
            >
              <img
                src={image}
                alt={title}
                style={{
                  width: category === "web-performance" ? "auto" : "auto",
                  maxWidth: "200px",
                  height: category === "web-performance" ? "70px" : "auto",
                  maxHeight: category === "web-performance" ? "70px" : "120px",
                  objectFit: "contain",
                  transition: "transform 0.3s ease-out",
                  filter: "grayscale(20%)",
                  cursor: !isMobile && hasValidLink ? "pointer" : "default",
                  transform: `scale(${imageScale})`,
                }}
                onMouseEnter={(e) =>
                  !isMobile &&
                  (e.target.style.transform = `scale(${1.02 * imageScale})`)
                }
                onMouseLeave={(e) =>
                  !isMobile &&
                  (e.target.style.transform = `scale(${imageScale})`)
                }
              />
            </div>
            <div
              style={{
                marginTop: "0.25rem",
                fontSize: "0.8rem",
                color: "#6B7280",
                fontWeight: "500",
              }}
            >
              {title}
            </div>
            {isMobile && (
              <div
                style={{
                  marginTop: "0.75rem",
                  display: "flex",
                  flexDirection: "row",
                  gap: "0.5rem",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <button
                  style={{
                    fontSize: "0.75rem",
                    color: "#6B7280",
                    fontWeight: "600",
                    background: "transparent",
                    border: "none",
                    padding: "0.4rem 1rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    textDecoration: "underline",
                    textUnderlineOffset: "3px",
                    textDecorationThickness: "1.5px",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (cardRef.current) {
                      const rect = cardRef.current.getBoundingClientRect();
                      const centerX = rect.left + rect.width / 2;
                      setHoverPosition({
                        top: rect.bottom + 5,
                        left: centerX,
                      });
                    }
                    setShowHover(!showHover);
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.opacity = "0.7";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.opacity = "1";
                  }}
                >
                  {showHover ? "Hide" : "Details"}
                </button>
                {hasValidLink && (
                  <button
                    style={{
                      fontSize: "0.75rem",
                      color: "#6B7280",
                      fontWeight: "600",
                      background: "transparent",
                      border: "none",
                      padding: "0.4rem 1rem",
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      textDecoration: "underline",
                      textUnderlineOffset: "3px",
                      textDecorationThickness: "1.5px",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(link, "_blank", "noopener,noreferrer");
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.opacity = "0.7";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.opacity = "1";
                    }}
                  >
                    Website
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Hover Card - Renderizado con portal para evitar overflow */}
          {showHover &&
            typeof window !== "undefined" &&
            hoverPosition &&
            hoverPosition.top > 0 &&
            hoverContent &&
            Array.isArray(badges) &&
            (() => {
              if (typeof document === "undefined" || !document.body)
                return null;
              return createPortal(
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  style={{
                    position: "fixed",
                    top: `${hoverPosition.top}px`,
                    left: `${hoverPosition.left - (isMobile ? 100 : 160)}px`,
                    background: "white",
                    borderRadius: "8px",
                    padding: "1.25rem 1rem",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                    border: "1px solid #f3f4f6",
                    width: isMobile ? "200px" : "320px",
                    maxWidth: isMobile ? "200px" : "320px",
                    minWidth: isMobile ? "200px" : "320px",
                    boxSizing: "border-box",
                    zIndex: 999999999999,
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "-6px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "0",
                      height: "0",
                      borderLeft: "6px solid transparent",
                      borderRight: "6px solid transparent",
                      borderBottom: "6px solid white",
                    }}
                  />

                  <div
                    style={{
                      fontSize: "0.85rem",
                      lineHeight: "1.5",
                      color: "#374151",
                      marginBottom: "0.75rem",
                      textAlign: "left",
                    }}
                  >
                    {hoverContent}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                      paddingTop: "0.75rem",
                      borderTop: "1px solid #f3f4f6",
                    }}
                  >
                    {badges.map((badge, index) => (
                      <span
                        key={index}
                        style={{
                          background: "#f3f4f6",
                          color: "#374151",
                          padding: "0.25rem 0.6rem",
                          borderRadius: "4px",
                          fontSize: "0.7rem",
                          fontWeight: "500",
                          whiteSpace: "nowrap",
                          border: "1px solid #d1d5db",
                        }}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </motion.div>,
                document.body,
              );
            })()}
        </div>
      </motion.div>
    </>
  );
};

export async function getServerSideProps() {
  return { props: {} };
}

export const HomeCallToAction = () => {
  const { t } = useTranslation();
  const callToAction = t("homeCallToAction", { returnObjects: true });

  return (
    <div style={{ position: "relative" }}>
      <CallToActionBlock
        title={callToAction.title}
        description={callToAction.description}
        buttonText={callToAction.buttonText}
        highlightWord="costs"
      />
      <div style={{
        textAlign: "center",
        marginTop: "-1.5rem",
        paddingBottom: "2rem",
        color: "rgba(255,255,255,0.65)",
        fontSize: "0.82rem",
        letterSpacing: "0.03em",
      }}>
        {t("homeCallToAction.noCommitment", "Free call · No commitment · No pitch")}
      </div>
    </div>
  );
};

const TestimonialsCarousel = ({ testimonials }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const PER_PAGE = 3;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkMobile = () => setIsMobile(window.innerWidth <= 768);
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }
  }, []);

  const totalPages = isMobile ? testimonials.length : Math.ceil(testimonials.length / PER_PAGE);
  const visibleTestimonials = isMobile
    ? [testimonials[currentPage]]
    : testimonials.slice(currentPage * PER_PAGE, currentPage * PER_PAGE + PER_PAGE);

  const nextSlide = () => setCurrentPage((prev) => (prev + 1) % totalPages);
  const prevSlide = () => setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  const goToSlide = (index) => setCurrentPage(index);

  // Auto-play
  useEffect(() => {
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [currentPage, isMobile]);

  const ChevronLeft = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
  const ChevronRight = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: isMobile ? "0 1rem" : "0 2rem" }}>
      {/* Cards grid with side arrows */}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "0.5rem" : "1.25rem" }}>
        {/* Prev arrow */}
        <button
          onClick={prevSlide}
          aria-label="Previous reviews"
          style={{
            background: "white",
            border: "none",
            borderRadius: "50%",
            width: "44px",
            height: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            color: "#F97B72",
            boxShadow: "0 2px 12px rgba(0,0,0,0.10), 0 0 0 1.5px rgba(249,123,114,0.18)",
            transition: "box-shadow 0.2s, transform 0.15s, background 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#FFF5F5"; e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(249,123,114,0.25), 0 0 0 1.5px rgba(249,123,114,0.35)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.10), 0 0 0 1.5px rgba(249,123,114,0.18)"; }}
        >
          <ChevronLeft />
        </button>

        {/* Cards grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: "1.25rem",
          alignItems: "stretch",
          flex: 1,
        }}>
          {visibleTestimonials.map((testimonial, index) => (
            <div
              key={`${currentPage}-${index}`}
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "1.75rem",
                boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
                border: "1.5px solid #f0f0f0",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                position: "relative",
              }}
            >
              {/* Stars */}
              <div style={{ display: "flex", gap: "2px" }}>
                {[1,2,3,4,5].map((s) => (
                  <span key={s} style={{ color: "#f97b72", fontSize: "0.95rem" }}>★</span>
                ))}
              </div>

              {/* Quote */}
              <p style={{
                fontSize: "0.93rem",
                lineHeight: 1.65,
                color: "#374151",
                fontStyle: "italic",
                margin: 0,
                flex: 1,
              }}>
                &ldquo;{testimonial.content}&rdquo;
              </p>

              {/* Author */}
              <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "0.75rem" }}>
                <div style={{ fontWeight: 700, color: "#111827", fontSize: "0.93rem" }}>
                  {testimonial.company}
                </div>
                {testimonial.role && (
                  <div style={{ color: "#f97b72", fontSize: "0.8rem", marginTop: "2px" }}>
                    {testimonial.role}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Next arrow */}
        <button
          onClick={nextSlide}
          aria-label="Next reviews"
          style={{
            background: "white",
            border: "none",
            borderRadius: "50%",
            width: "44px",
            height: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            color: "#F97B72",
            boxShadow: "0 2px 12px rgba(0,0,0,0.10), 0 0 0 1.5px rgba(249,123,114,0.18)",
            transition: "box-shadow 0.2s, transform 0.15s, background 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#FFF5F5"; e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(249,123,114,0.25), 0 0 0 1.5px rgba(249,123,114,0.35)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.10), 0 0 0 1.5px rgba(249,123,114,0.18)"; }}
        >
          <ChevronRight />
        </button>
      </div>

      {/* Dots Indicator */}
      <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "2rem" }}>
        {Array.from({ length: totalPages }).map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            style={{
              width: index === currentPage ? "28px" : "8px",
              height: "8px",
              borderRadius: "100px",
              border: "none",
              background: index === currentPage ? "#F97B72" : "#d1d5db",
              cursor: "pointer",
              transition: "all 0.3s ease",
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
};

const ServiceBox = ({ icon, title, description, delay = 0, link, subcategories = [], ctaText, badge }) => {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  // Prefetch las páginas cuando se hace hover sobre la caja
  useEffect(() => {
    if (subcategories.length > 0) {
      subcategories.forEach((item) => {
        router.prefetch(item.href);
      });
    } else if (link) {
      router.prefetch(link);
    }
  }, [subcategories, link, router]);

  const boxContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      {badge && (
        <div style={{
          position: "absolute",
          top: "-1rem",
          right: "-1rem",
          background: "#f97b72",
          color: "white",
          fontSize: "0.68rem",
          fontWeight: 700,
          padding: "0.2rem 0.65rem",
          borderRadius: "100px",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}>
          {badge}
        </div>
      )}
      <motion.div
        initial={{ scale: 1 }}
        animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
        transition={{ duration: 0.1 }}
        style={{
          fontSize: "2.25rem",
          color: "var(--color-accent, #FF6B6B)",
          marginBottom: "0.5rem",
          display: "inline-block",
        }}
      >
        {icon}
      </motion.div>

      <h3
        style={{
          fontSize: "1.15rem",
          fontWeight: "600",
          marginBottom: "0.5rem",
          color: "var(--color-text, #333)",
          transition: "color 0.2s ease",
          ...(isHovered ? { color: "#E35A52" } : {}),
        }}
      >
        {title}
      </h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        style={{
          fontSize: "0.9rem",
          lineHeight: "1.5",
          color: "#444444",
          marginBottom: subcategories.length > 0 ? "1rem" : "0",
          flex: subcategories.length > 0 ? "0 0 auto" : 1,
        }}
      >
        {description}
      </motion.p>

      {subcategories.length > 0 && (
        <div style={{ marginTop: "auto", paddingTop: "1rem" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              marginBottom: "0.5rem",
              alignItems: "center",
            }}
          >
            {subcategories.map((item, index) => (
              <Link 
                key={index}
                href={item.href} 
                style={{ textDecoration: "none" }}
                onClick={(e) => e.stopPropagation()}
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  style={{
                    fontSize: "0.85rem",
                    color: "#6B7280",
                    fontWeight: "500",
                    cursor: "pointer",
                    borderBottom: "1px solid transparent",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#F97B72";
                    e.currentTarget.style.borderBottomColor = "#F97B72";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#6B7280";
                    e.currentTarget.style.borderBottomColor = "transparent";
                  }}
                >
                  {item.text}
                </motion.span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!subcategories.length && ctaText && link && (
        <Link href={link} style={{ textDecoration: "none", marginTop: "auto" }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#F97B72",
              fontSize: "0.95rem",
              fontWeight: "600",
              cursor: "pointer",
              paddingTop: "1rem",
              borderTop: "1px solid rgba(249, 123, 114, 0.2)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.8";
              e.currentTarget.style.color = "#E35A52";
              e.currentTarget.style.borderTopColor = "rgba(249, 123, 114, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.color = "#F97B72";
              e.currentTarget.style.borderTopColor = "rgba(249, 123, 114, 0.2)";
            }}
          >
            {ctaText}
            <span style={{ fontSize: "0.9rem", transition: "transform 0.2s ease" }}>
              →
            </span>
          </motion.div>
        </Link>
      )}

      <motion.div
        className="service-bg-circle"
        initial={{ scale: 0, opacity: 0 }}
        animate={
          isHovered ? { scale: 1, opacity: 0.1 } : { scale: 0, opacity: 0 }
        }
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{
          position: "absolute",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "var(--color-accent, #FF6B6B)",
          right: "-150px",
          bottom: "-150px",
          zIndex: "-1",
        }}
      />
    </div>
  );

  const boxStyle = {
    background: "linear-gradient(145deg, #ffffff, #f0f0f0)",
    borderRadius: "12px",
    padding: "1.25rem",
    height: "100%",
    cursor: subcategories.length > 0 ? "default" : (link ? "pointer" : "default"),
    position: "relative",
    overflow: "hidden",
    border: "1px solid rgba(249, 123, 114, 0.2)",
    transition: "all 0.15s ease",
    display: "flex",
    flexDirection: "column",
  };

  // Si no hay subcategorías pero hay un link directo, hacer toda la caja clickeable
  if (!subcategories.length && link) {
    return (
      <Link href={link} style={{ textDecoration: "none", color: "inherit" }}>
        <motion.div
          className="service-box"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.15, delay: delay * 0.1 }}
          whileHover={{
            scale: 1.02,
            transition: { duration: 0.1 },
          }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          style={boxStyle}
        >
          {boxContent}
        </motion.div>
      </Link>
    );
  }

  // Si hay subcategorías, NO envolver en Link (evitar <a> anidados)
  // Los Links individuales dentro de boxContent manejan la navegación
  if (subcategories.length > 0) {
    return (
      <motion.div
        className="service-box"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.15, delay: delay * 0.1 }}
        whileHover={{
          scale: 1.02,
          transition: { duration: 0.1 },
        }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        style={boxStyle}
      >
        {boxContent}
      </motion.div>
    );
  }

  // Si no hay subcategorías ni link, solo mostrar la caja
  return (
    <motion.div
      className="service-box"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.15, delay: delay * 0.1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={boxStyle}
    >
      {boxContent}
    </motion.div>
  );
};

const TestimonialCard = ({ author, role, company, content, delay = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="testimonial-card"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.15, delay: delay * 0.1 }}
      whileHover={{
        y: -4,
        transition: { duration: 0.1 },
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        background: "#fff",
        borderRadius: "16px",
        padding: "2rem",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        border: "1px solid rgba(249, 123, 114, 0.2)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.15s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "var(--color-accent, #FF6B6B)",
            zIndex: 0,
          }}
        />
      )}

      <motion.div
        style={{
          fontSize: "2rem",
          color: "var(--color-accent, #FF6B6B)",
          marginBottom: "1rem",
          position: "relative",
          zIndex: 1,
        }}
        animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
        transition={{ duration: 0.1 }}
      >
        "
      </motion.div>

      <p
        style={{
          fontSize: "1rem",
          lineHeight: "1.8",
          flex: 1,
          marginBottom: "1.5rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        {content}
      </p>

      <div style={{ position: "relative", zIndex: 1 }}>
        <p
          style={{
            fontWeight: "700",
            fontSize: "1.1rem",
            marginBottom: "0.2rem",
            color: isHovered ? "#E35A52" : "var(--color-text, #333)",
            transition: "color 0.2s ease",
          }}
        >
          {company}
        </p>
        <p
          style={{
            fontSize: "0.9rem",
            color: "var(--color-text-muted, #666)",
          }}
        >
          {role}
        </p>
      </div>
    </motion.div>
  );
};

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState("all");
  const [carouselPaused, setCarouselPaused] = useState(false);
  const carouselTrackRef = React.useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkMobile = () => {
        setIsMobile(window.innerWidth <= 768);
      };
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }
  }, []);

  // Inyectar estilos del carrusel
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const styleId = "infinite-carousel-styles";
    let styleElement = document.getElementById(styleId);

    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = `
      @keyframes infiniteScrollCarousel {
        0% {
          transform: translateX(0);
        }
        100% {
          transform: translateX(-50%);
        }
      }
    `;
  }, []);

  const parseHighlightedText = (text) => {
    if (!text) return [];
    const parts = text.split(/<highlight>|<\/highlight>/);
    const result = [];
    
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 1) {
        // This is a highlighted word
        const highlightedWord = parts[i];
        const nextPart = parts[i + 1] || "";
        const isPunctuationOnly = /^[.,;:!?]+$/.test(nextPart.trim());
        
        if (isPunctuationOnly) {
          result.push(
            <span key={i} className="highlighted-word-with-punctuation">
              <span className="highlighted-word">{highlightedWord}</span>
              <span className="highlighted-punctuation">{nextPart}</span>
            </span>
          );
          i++; // Skip the next part since we already included it
        } else {
          result.push(
            <span key={i} className="highlighted-word">
              {highlightedWord}
            </span>
          );
        }
      } else {
        // This is regular text
        if (parts[i]) {
          result.push(<React.Fragment key={i}>{parts[i]}</React.Fragment>);
        }
      }
    }
    
    return result;
  };

  const testimonialData = [
    {
      content: t("reviews.farzad.text"),
      company: t("reviews.farzad.company"),
      role: t("reviews.farzad.role"),
    },
    {
      content: t("reviews.vantage.text"),
      company: t("reviews.vantage.company"),
      role: t("reviews.vantage.role"),
    },
    {
      content: t("reviews.skylar.text"),
      company: t("reviews.skylar.company"),
      role: t("reviews.skylar.role"),
    },
    {
      content: t("reviews.techvision.text"),
      company: t("reviews.techvision.company"),
      role: t("reviews.techvision.role"),
    },
    {
      content: t("reviews.greenleaf.text"),
      company: t("reviews.greenleaf.company"),
      role: t("reviews.greenleaf.role"),
    },
    {
      content: t("reviews.innovatelab.text"),
      company: t("reviews.innovatelab.company"),
      role: t("reviews.innovatelab.role"),
    },
  ];

  const lang = i18n.language?.startsWith("es") ? "es" : "en";
  const benchmarkCards = [
    {
      icon: <FaTasks />,
      value: "58%",
      title:
        lang === "es"
          ? "del tiempo en coordinación"
          : "of time spent on coordination",
      description:
        lang === "es"
          ? "Trabajo operativo y coordinación ('work about work') en equipos de conocimiento."
          : "Operational coordination ('work about work') in knowledge teams.",
      sourceLabel: "Asana Anatomy of Work (2023)",
      sourceUrl:
        "https://investors.asana.com/news-releases/news-release-details/asana-anatomy-work-global-index-2023-smart-collaboration-and/",
    },
    {
      icon: <FaClock />,
      value: "4.9h",
      title:
        lang === "es"
          ? "ahorrables por persona/semana"
          : "recoverable per person/week",
      description:
        lang === "es"
          ? "Horas que los trabajadores estiman recuperar con mejores procesos."
          : "Hours workers estimate they could recover with better processes.",
      sourceLabel: "Asana Anatomy of Work (2023)",
      sourceUrl:
        "https://investors.asana.com/news-releases/news-release-details/asana-anatomy-work-global-index-2023-smart-collaboration-and/",
    },
    {
      icon: <FaBolt />,
      value: "2 min",
      title:
        lang === "es"
          ? "entre interrupciones promedio"
          : "between average interruptions",
      description:
        lang === "es"
          ? "Meetings, emails y chats interrumpen el foco de trabajo."
          : "Meetings, emails, and chats interrupt focused work.",
      sourceLabel: "Microsoft Work Trend Index (2025)",
      sourceUrl:
        "https://www.microsoft.com/en-us/worklab/work-trend-index/breaking-down-infinite-workday/",
    },
    {
      icon: <FaDollarSign />,
      value: "32%",
      title:
        lang === "es"
          ? "reducción promedio de costos"
          : "average cost reduction",
      description:
        lang === "es"
          ? "Organizaciones maduras en automatización reportan reducción de costos."
          : "Mature automation organizations report cost reduction.",
      sourceLabel: "Deloitte Intelligent Automation Survey (2022)",
      sourceUrl:
        "https://www.deloitte.com/us/en/insights/topics/talent/intelligent-automation-2022-survey-results.html",
    },
  ];

  const benchmarkBars = [
    {
      label:
        lang === "es"
          ? "Tiempo en coordinación manual"
          : "Time spent on manual coordination",
      value: 58,
      color: "#F97B72",
    },
    {
      label:
        lang === "es"
          ? "Trabajo percibido como caótico"
          : "Work perceived as chaotic",
      value: 48,
      color: "#FB7185",
    },
    {
      label:
        lang === "es"
          ? "Reducción de costos (automatización madura)"
          : "Cost reduction (mature automation)",
      value: 32,
      color: "#38BDF8",
    },
    {
      label:
        lang === "es"
          ? "Roles con actividades técnicamente automatizables"
          : "Roles with technically automatable activities",
      value: 60,
      color: "#818CF8",
    },
  ];

  return (
    <>
      <Head>
        <title>Workflow & Process Automation for Companies | OpenGateHub</title>
        <meta
          name="description"
          content="Your team is losing 8+ hours per person each week to tasks automation handles in minutes. OpenGateHub automates your workflows, embeds senior engineers, and delivers results in 7.3 days."
        />
        <meta
          name="keywords"
          content="workflow automation, process automation, staff augmentation, n8n automation, AI automation, operational efficiency, reduce manual work, business automation"
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Workflow & Process Automation for Companies | OpenGateHub" />
        <meta
          property="og:description"
          content="Stop losing hours to manual work. We automate your workflows, connect your tools, and embed senior engineers — 9.7/10 CSAT, 7.3-day kickoff, 50+ sprints shipped."
        />
        <meta property="og:image" content="https://opengatehub.com/Reducido4oscuro.png" />
        <meta property="og:url" content="https://opengatehub.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Workflow & Process Automation for Companies | OpenGateHub" />
        <meta name="twitter:description" content="Stop losing hours to manual work. We automate workflows, connect tools, and embed senior engineers." />
        <meta name="twitter:image" content="https://opengatehub.com/Reducido4oscuro.png" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
      </Head>

      <Container>
        <FloatingBlob />
        <Hero>
          <GradientOverlay />
          {/* <ImageContainer>
            <LottieAnimation
              animationPath="/animations/home.json"
              width="100%"
              height="auto"
            />
          </ImageContainer> */}
          {/* ⬅ este! */}

          <Glow />
          <Title>
            {/* Desktop version with animation */}
            <span className="animated desktop-only">
              {t("heroAnimatedText.part1")}
              <span className="highlighted-word">
                {t("heroAnimatedText.highlight1")}
              </span>{" "}
              {t("heroAnimatedText.part2")}{" "}
              <span className="highlighted-word">
                {t("heroAnimatedText.highlight2")}
              </span>
              .
            </span>

            {/* Mobile version without animation */}
            <span className="mobile-only">
              {t("heroAnimatedText.part1")}
              <span className="highlighted-word">
                {t("heroAnimatedText.highlight1")}
              </span>{" "}
              {t("heroAnimatedText.part2")}{" "}
              <span className="highlighted-word">
                {t("heroAnimatedText.highlight2")}
              </span>
              .
            </span>
          </Title>
          <Subtitle>{t("heroSubtitle")}</Subtitle>
          {/* Primary + Secondary CTAs */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center", alignItems: "center", marginTop: "1.75rem" }}>
            <CTAButton
              href={isMobile ? "https://calendly.com/sanchezgcandelaria/15min" : "/contact-us"}
              target={isMobile ? "_blank" : "_self"}
              rel={isMobile ? "noopener noreferrer" : undefined}
              className="primary-cta"
              style={{ marginTop: 0 }}
            >
              {t("ctaButton")}
            </CTAButton>
            <CTAButton
              href="/calculator"
              className="secondary-cta"
              style={{ marginTop: 0 }}
            >
              {t("heroSecondaryCTA", "See what it's costing you →")}
            </CTAButton>
          </div>

          {/* Trust chips */}
          <div style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: "1.5rem",
          }}>
            {[
              t("heroTrustChip1", "9.7/10 CSAT"),
              t("heroTrustChip2", "7.3-day kickoff"),
              t("heroTrustChip3", "50+ sprints shipped"),
            ].map((chip) => (
              <span key={chip} style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "100px",
                padding: "0.3rem 0.9rem",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.9)",
                backdropFilter: "blur(4px)",
              }}>
                ✓ {chip}
              </span>
            ))}
          </div>
        </Hero>

        <Section
          className="serious-block"
          style={{
            paddingLeft: isMobile ? "20px" : undefined,
            paddingRight: isMobile ? "20px" : undefined,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.15 }}
          >
            <SectionTitle style={{ "--i": 0 }}>
              {parseHighlightedText(t("problemTitle"))}
            </SectionTitle>
            <SectionText>{t("problemText")}</SectionText>
          </motion.div>
        </Section>

        <Section
          className="serious-block"
          style={{
            paddingLeft: isMobile ? "20px" : undefined,
            paddingRight: isMobile ? "20px" : undefined,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.15 }}
          >
            <SectionTitle style={{ "--i": 1 }}>
              {parseHighlightedText(t("weGetYouTitle"))}
            </SectionTitle>
            <SectionText>{t("weGetYouText")}</SectionText>
          </motion.div>
        </Section>

        <Section className="full-width" style={{ background: "#f8fafc" }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.2 }}
            style={{ textAlign: "center", marginBottom: "2rem" }}
          >
            <h2
              style={{
                fontSize: isMobile ? "1.8rem" : "2rem",
                fontWeight: "700",
                marginBottom: "0.75rem",
                color: "#1F2937",
              }}
            >
              {lang === "es"
                ? "Automatizar impacta negocio, no solo tecnología"
                : "Automation impacts business, not just tech"}
            </h2>
            <p
              style={{
                maxWidth: "840px",
                margin: "0 auto",
                color: "#4B5563",
                fontSize: isMobile ? "1rem" : "1.08rem",
                lineHeight: 1.6,
              }}
            >
              {lang === "es"
                ? "Benchmarks globales muestran cuánto tiempo, foco y costo se pierde sin workflows conectados. Estos números explican por qué la automatización libera capacidad real del equipo."
                : "Global benchmarks show how much time, focus, and budget is lost without connected workflows. These numbers explain why automation unlocks real team capacity."}
            </p>
          </motion.div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1rem",
              maxWidth: "1200px",
              margin: "0 auto 2rem auto",
              padding: "0 1rem",
            }}
          >
            {benchmarkCards.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.15, delay: index * 0.05 }}
                style={{
                  background: "#ffffff",
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  padding: "1rem",
                  boxShadow: "0 4px 16px rgba(15, 23, 42, 0.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: "rgba(249, 123, 114, 0.12)",
                      color: "#F97B72",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1rem",
                    }}
                  >
                    {item.icon}
                  </div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#111827" }}>
                    {item.value}
                  </div>
                </div>
                <div style={{ fontWeight: 600, color: "#1F2937", marginBottom: "0.35rem" }}>
                  {item.title}
                </div>
                <p style={{ color: "#4B5563", fontSize: "0.92rem", lineHeight: 1.5, marginBottom: "0.65rem" }}>
                  {item.description}
                </p>
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#0EA5E9",
                    fontSize: "0.82rem",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  {lang === "es" ? "Fuente:" : "Source:"} {item.sourceLabel}
                </a>
              </motion.div>
            ))}
          </div>

          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "0 1rem",
            }}
          >
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #E5E7EB",
                borderRadius: "14px",
                padding: isMobile ? "1rem" : "1.25rem",
                boxShadow: "0 6px 24px rgba(15, 23, 42, 0.06)",
              }}
            >
              <h3 style={{ marginBottom: "1rem", color: "#111827", fontSize: "1.1rem" }}>
                {lang === "es"
                  ? "Benchmarks visuales de fricción operativa"
                  : "Visual benchmarks of operational friction"}
              </h3>
              {benchmarkBars.map((bar, idx) => (
                <div key={idx} style={{ marginBottom: idx === benchmarkBars.length - 1 ? 0 : "0.95rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "1rem",
                      marginBottom: "0.35rem",
                      fontSize: "0.9rem",
                      color: "#374151",
                    }}
                  >
                    <span>{bar.label}</span>
                    <strong>{bar.value}%</strong>
                  </div>
                  <div
                    style={{
                      height: "10px",
                      width: "100%",
                      background: "#F1F5F9",
                      borderRadius: "999px",
                      overflow: "hidden",
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${bar.value}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: idx * 0.07 }}
                      style={{
                        height: "100%",
                        borderRadius: "999px",
                        background: bar.color,
                      }}
                    />
                  </div>
                </div>
              ))}
              <div
                style={{
                  marginTop: "1rem",
                  color: "#6B7280",
                  fontSize: "0.82rem",
                  lineHeight: 1.5,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.8rem 1rem",
                }}
              >
                {[
                  {
                    label: "Asana 2023",
                    url: "https://investors.asana.com/news-releases/news-release-details/asana-anatomy-work-global-index-2023-smart-collaboration-and/",
                  },
                  {
                    label: "Microsoft 2025",
                    url: "https://www.microsoft.com/en-us/worklab/work-trend-index/breaking-down-infinite-workday/",
                  },
                  {
                    label: "Deloitte 2022",
                    url: "https://www.deloitte.com/us/en/insights/topics/talent/intelligent-automation-2022-survey-results.html",
                  },
                  {
                    label: "McKinsey 2017",
                    url: "https://www.mckinsey.com/featured-insights/employment-and-growth/jobs-lost-jobs-gained-what-the-future-of-work-will-mean-for-jobs-skills-and-wages",
                  },
                ].map((source, idx) => (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#0EA5E9",
                      textDecoration: "none",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    {lang === "es" ? "Fuente" : "Source"}: {source.label}
                    <FaExternalLinkAlt style={{ fontSize: "0.65rem" }} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Benchmarks CTA nudge */}
        <div style={{ textAlign: "center", padding: "0.5rem 1rem 2.5rem", width: "100%" }}>
          <Link href="/calculator" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            color: "#f97b72",
            fontWeight: 700,
            fontSize: "0.97rem",
            textDecoration: "none",
            borderBottom: "2px solid #f97b72",
            paddingBottom: "2px",
            transition: "opacity 0.2s",
          }}>
            {t("caseStudiesSection.benchmarksCTA", "Calculate your team's potential savings →")}
          </Link>
        </div>

        {/* Capabilities Section - How we build */}
        <Section className="full-width">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.2 }}
            style={{ textAlign: "center", marginBottom: "3rem" }}
          >
            <h2
              style={{
                fontSize: isMobile ? "1.8rem" : "2rem",
                fontWeight: "700",
                marginBottom: "1rem",
              }}
            >
              <span style={{ color: "var(--color-accent, #FF6B6B)" }}>
                {t("homeCapabilitiesSection.title")}
              </span>
            </h2>
            <p
              style={{
                fontSize: isMobile ? "1rem" : "1.1rem",
                maxWidth: "800px",
                margin: "0 auto",
                color: "var(--color-text-muted, #666)",
              }}
            >
              {t("homeCapabilitiesSection.subtitle")}
            </p>
          </motion.div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "2rem",
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "0 1rem",
            }}
          >
            {/* Staff Augmentation */}
            <ServiceBox
              icon="🤝"
              title={t("homeCapabilitiesSection.cards.softwareDevelopment.title")}
              description={t(
                "homeCapabilitiesSection.cards.softwareDevelopment.description",
              )}
              delay={0.1}
              subcategories={[
                {
                  text: lang === "es" ? "Staff Augmentation" : "Staff Augmentation",
                  href: "/services/staff-augmentation",
                },
                {
                  text: lang === "es" ? "Automatización de Flujos" : "Workflow Automation",
                  href: "/services/workflow-automation",
                },
              ]}
            />
            
            {/* Workflow Automation */}
            <ServiceBox
              icon="⚙️"
              title={t("homeCapabilitiesSection.cards.mobileDevelopment.title")}
              description={t(
                "homeCapabilitiesSection.cards.mobileDevelopment.description",
              )}
              badge={t("homeCapabilitiesSection.mostPopular", "Most Popular")}
              delay={0.2}
              subcategories={[
                {
                  text: lang === "es" ? "Automatización de Flujos" : "Workflow Automation",
                  href: "/services/workflow-automation",
                },
                {
                  text: lang === "es" ? "Automatización n8n" : "n8n Automation",
                  href: "/services/n8n-automation",
                },
              ]}
            />
            
            {/* AI + Automation Ops */}
            <ServiceBox
              icon="📈"
              title={t("homeCapabilitiesSection.cards.dataAutomation.title")}
              description={t(
                "homeCapabilitiesSection.cards.dataAutomation.description",
              )}
              delay={0.3}
              subcategories={[
                { text: t("aiTitle"), href: "/services/AI" },
                {
                  text: lang === "es" ? "Automatización n8n" : "n8n Automation",
                  href: "/services/n8n-automation",
                },
              ]}
            />
          </div>
        </Section>

        {/* Metrics Section */}
        <MetricsSection />

        {/* Calculator Section */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            width: "100%",
            background: "white",
            borderTop: "1px solid #e5e7eb",
            borderBottom: "1px solid #e5e7eb",
            padding: isMobile ? "4rem 1.5rem" : "6rem 2rem",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: "660px", margin: "0 auto" }}>
            {/* Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                background: "#fff5f5",
                border: "1.5px solid #fecaca",
                borderRadius: "100px",
                padding: "0.3rem 0.9rem",
                fontSize: "0.73rem",
                fontWeight: 700,
                color: "#f97b72",
                marginBottom: "1.5rem",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {t("calculator.bannerEyebrow")}
            </div>

            {/* Headline */}
            <h2
              style={{
                fontSize: isMobile ? "1.85rem" : "2.7rem",
                fontWeight: 800,
                color: "#111827",
                lineHeight: 1.2,
                marginBottom: "1rem",
                letterSpacing: "-0.02em",
              }}
            >
              {t("calculator.bannerTitle")}
            </h2>

            {/* Subtitle */}
            <p
              style={{
                fontSize: "1.05rem",
                color: "#6b7280",
                lineHeight: 1.7,
                maxWidth: "460px",
                margin: "0 auto 2.75rem",
              }}
            >
              {t("calculator.bannerSub")}
            </p>

            {/* Stat cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                gap: "1rem",
                maxWidth: "560px",
                margin: "0 auto 2.5rem",
              }}
            >
              {[
                { value: "8h",    labelKey: "calculator.bannerStat1Label", source: "Zapier, 2021" },
                { value: "60%",   labelKey: "calculator.bannerStat2Label", source: "Flobotics, 2024" },
                { value: "2 min", labelKey: "calculator.bannerStat3Label", source: "Microsoft WTI, 2025" },
              ].map((stat) => (
                <div
                  key={stat.value}
                  style={{
                    background: "white",
                    border: "1.5px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "1.5rem 1rem",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0, left: 0, right: 0,
                      height: "3px",
                      background: "linear-gradient(90deg, #f97b72, #e35a52)",
                    }}
                  />
                  <p
                    style={{
                      fontSize: "2rem",
                      fontWeight: 900,
                      color: "#f97b72",
                      lineHeight: 1,
                      marginBottom: "0.4rem",
                    }}
                  >
                    {stat.value}
                  </p>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "#6b7280",
                      fontWeight: 500,
                      lineHeight: 1.4,
                    }}
                  >
                    {t(stat.labelKey)}
                  </p>
                  <p style={{ fontSize: "0.65rem", color: "#d1d5db", marginTop: "0.4rem", fontWeight: 400 }}>
                    {stat.source}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA button */}
            <Link href="/calculator">
              <button
                style={{
                  background: "linear-gradient(135deg, #f97b72 0%, #e35a52 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  padding: "1rem 2.5rem",
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: "0 4px 20px rgba(249,123,114,0.38)",
                  transition: "all 0.22s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 28px rgba(249,123,114,0.48)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(249,123,114,0.38)";
                }}
              >
                {t("calculator.bannerCTA")}
              </button>
            </Link>
            <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.875rem" }}>
              {t("calculator.trustLine")}
            </p>
          </div>
        </motion.div>

        {/* Case Studies Section */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            width: "100%",
            background: "white",
            borderTop: "1px solid #f0f0f0",
            padding: isMobile ? "4rem 1.5rem" : "6rem 2rem",
          }}
        >
          <div style={{ maxWidth: "1040px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: isMobile ? "2.5rem" : "3.5rem" }}>
              <div
                style={{
                  display: "inline-flex",
                  background: "#fff5f5",
                  border: "1.5px solid #fecaca",
                  borderRadius: "100px",
                  padding: "0.3rem 0.9rem",
                  fontSize: "0.73rem",
                  fontWeight: 700,
                  color: "#f97b72",
                  marginBottom: "1rem",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                {t("caseStudiesSection.eyebrow")}
              </div>
              <h2
                style={{
                  fontSize: isMobile ? "1.85rem" : "2.5rem",
                  fontWeight: 800,
                  color: "#111827",
                  lineHeight: 1.2,
                  marginBottom: "0.75rem",
                  letterSpacing: "-0.02em",
                }}
              >
                {t("caseStudiesSection.title")}
              </h2>
              <p style={{ fontSize: "1rem", color: "#6b7280", lineHeight: 1.6 }}>
                {t("caseStudiesSection.subtitle")}
              </p>
            </div>

            {/* Cards grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
                gap: "1.5rem",
              }}
            >
              {[
                {
                  img: "/case-studies/valthor.jpeg",
                  categoryKey: "caseStudiesSection.valthorCategory",
                  titleKey: "caseStudiesSection.valthorTitle",
                  descKey: "caseStudiesSection.valthorDesc",
                  stat: { value: "40%", labelKey: "caseStudiesSection.valthorStat" },
                },
                {
                  img: "/case-studies/hot-date-kitchen.jpeg",
                  categoryKey: "caseStudiesSection.hotdateCategory",
                  titleKey: "caseStudiesSection.hotdateTitle",
                  descKey: "caseStudiesSection.hotdateDesc",
                  stat: null,
                },
                {
                  img: "/case-studies/smarters-city.jpeg",
                  categoryKey: "caseStudiesSection.smartersCategory",
                  titleKey: "caseStudiesSection.smartersTitle",
                  descKey: "caseStudiesSection.smartersDesc",
                  stat: null,
                },
                {
                  img: "/case-studies/vantage.jpeg",
                  categoryKey: "caseStudiesSection.vantageCategory",
                  titleKey: "caseStudiesSection.vantageTitle",
                  descKey: "caseStudiesSection.vantageDesc",
                  stat: null,
                },
              ].map((cs) => (
                <div
                  key={cs.titleKey}
                  style={{
                    background: "#fafafa",
                    border: "1.5px solid #e5e7eb",
                    borderRadius: "16px",
                    overflow: "hidden",
                    transition: "box-shadow 0.2s ease, transform 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.09)";
                    e.currentTarget.style.transform = "translateY(-3px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ height: "220px", overflow: "hidden", borderRadius: "14px 14px 0 0" }}>
                    <img
                      src={cs.img}
                      alt={t(cs.titleKey)}
                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }}
                    />
                  </div>
                  <div style={{ padding: "1.5rem" }}>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        color: "#f97b72",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {t(cs.categoryKey)}
                    </span>
                    <h3
                      style={{
                        fontSize: "1.15rem",
                        fontWeight: 700,
                        color: "#111827",
                        margin: "0.4rem 0 0.5rem",
                      }}
                    >
                      {t(cs.titleKey)}
                    </h3>
                    <p style={{ fontSize: "0.9rem", color: "#6b7280", lineHeight: 1.6, marginBottom: cs.stat ? "1rem" : 0 }}>
                      {t(cs.descKey)}
                    </p>
                    {cs.stat && (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "baseline",
                          gap: "0.4rem",
                          background: "#fff5f5",
                          border: "1px solid #ffe3e1",
                          borderRadius: "8px",
                          padding: "0.5rem 0.875rem",
                        }}
                      >
                        <span style={{ fontSize: "1.4rem", fontWeight: 900, color: "#f97b72", lineHeight: 1 }}>
                          {cs.stat.value}
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 500 }}>
                          {t(cs.stat.labelKey)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Featured Work Section */}
        <div
          style={{
            background: "white",
            marginTop: "-1px",
            width: "100%",
            overflow: "hidden",
          }}
        >
          <Section
            className="full-width"
            style={{
              padding: "2rem 0",
              margin: "0",
              borderTop: "none",
              borderBottom: "1px solid #e5e7eb",
              position: "relative",
              zIndex: 999999,
              overflow: "visible",
              background: "white",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.2 }}
              style={{
                textAlign: "center",
                marginBottom: "2rem",
              }}
            >
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  color: "#6B7280",
                  paddingLeft: isMobile ? "1.5rem" : "1rem",
                  paddingRight: isMobile ? "1.5rem" : "1rem",
                }}
              >
                {t("featuredWorkSection.title")}
              </h3>
              <p
                style={{
                  fontSize: "1rem",
                  maxWidth: "600px",
                  margin: "auto",
                  color: "#9CA3AF",
                  paddingLeft: isMobile ? "1.5rem" : "1rem",
                  paddingRight: isMobile ? "1.5rem" : "1rem",
                }}
              >
                {t("featuredWorkSection.subtitle")}
              </p>
            </motion.div>

            <ProjectTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              isMobile={isMobile}
            />

            {(() => {
              const projects = [
                // SaaS first
                {
                  image: "/smarters-card.png",
                  title: t("featuredWorkSection.smartersCity.title"),
                  description: t(
                    "featuredWorkSection.smartersCity.description",
                  ),
                  metrics: t("featuredWorkSection.smartersCity.metrics", {
                    returnObjects: true,
                  }),
                  link: "https://smarters.city/",
                  hoverContent: (
                    <>
                      <strong>Embedded Dev Partners</strong> — boosted UI +
                      APIs, kept their roadmap on track
                    </>
                  ),
                  category: "saas",
                  delay: 0.1,
                },
                {
                  image: "/valthor-logo.e3b5a398.png",
                  title: "Valthor CRM",
                  description:
                    lang === "es"
                      ? "Plataforma CRM moderna optimizada con IA"
                      : "Modern CRM platform optimized with AI",
                  metrics:
                    lang === "es"
                      ? ["Omnichannel", "99.9% uptime", "SEO optimized"]
                      : ["Omnichannel", "99.9% uptime", "SEO optimized"],
                  link: "https://www.valthorcrm.com/",
                  hoverContent: (
                    <>
                      <strong>Modern CRM platform</strong> — powered with{" "}
                      <strong>AI</strong>.
                    </>
                  ),
                  badges: ["CRM", "AI", "24/7"],
                  category: "saas",
                  delay: 0.2,
                },
                {
                  image: "/Cicero.png",
                  title: t("featuredWorkSection.cicero.title"),
                  description: t("featuredWorkSection.cicero.description"),
                  metrics: t("featuredWorkSection.cicero.metrics", {
                    returnObjects: true,
                  }),
                  link: "https://www.linkedin.com/company/cicerolearn/",
                  hoverContent: (
                    <>
                      <strong>Product direction + early development</strong> —
                      AI-powered personal librarian. View on LinkedIn.
                    </>
                  ),
                  badges: ["AI", "Early-stage", "View on LinkedIn"],
                  category: "saas",
                  delay: 0.3,
                  imageScale: 0.7,
                },
                {
                  image: "/vantage.svg",
                  title: t("featuredWorkSection.vantage.title"),
                  description: t("featuredWorkSection.vantage.description"),
                  metrics: t("featuredWorkSection.vantage.metrics", {
                    returnObjects: true,
                  }),
                  link: "https://vantageinc.ai/",
                  hoverContent: (
                    <>
                      <strong>Staff Augmentation</strong> — embedded engineers &
                      QA, accelerating their roadmap and product velocity.
                    </>
                  ),
                  badges: ["Staff Aug", "Engineers + QA", "Faster roadmap"],
                  category: "saas",
                  delay: 0.35,
                  imageScale: 0.75,
                },
                {
                  image: "/vivabots_azul.png",
                  title: "Vivabots RPA",
                  description:
                    lang === "es"
                      ? "Plataforma RPA moderna y optimizada"
                      : "Modern and optimized RPA platform",
                  metrics: ["99.9% uptime", "99.9% efficiency"],
                  link: "https://vivabots.com/",
                  hoverContent: (
                    <>
                      Modern and Powerful <strong>RPA platform</strong>{" "}
                    </>
                  ),
                  badges: ["RPA Platform", "Web & Desktop", "3,200+ Bots"],
                  category: "saas",
                  delay: 0.4,
                },
                // Then the rest
                {
                  image: "/estudio-sab.png",
                  title: t("featuredWorkSection.estudioSab.title"),
                  description: t("featuredWorkSection.estudioSab.description"),
                  metrics: t("featuredWorkSection.estudioSab.metrics", {
                    returnObjects: true,
                  }),
                  link: "https://estudiosab.com/",
                  hoverContent: (
                    <>
                      <strong>All-In Dev Studio</strong> — designed, built,
                      shipped.
                    </>
                  ),
                  badges: ["Fast pages", "SEO ready", "Modern stack"],
                  category: "web-performance",
                  delay: 0.5,
                },
                {
                  image: "/Skylar.png",
                  title: t("featuredWorkSection.skylar.title"),
                  description: t("featuredWorkSection.skylar.description"),
                  metrics: t("featuredWorkSection.skylar.metrics", {
                    returnObjects: true,
                  }),
                  link: "https://skylar.ar/",
                  hoverContent: (
                    <>
                      <strong>Code-Side Overhaul</strong> — rebuilt store,
                      conversions up 28%
                    </>
                  ),
                  badges: ["≤2s TTI", "+28% conversions", "Live catalog"],
                  category: "commerce",
                  delay: 0.55,
                },
                {
                  image: "/HotDate.png",
                  title: t("featuredWorkSection.hotDateKitchen.title"),
                  description: t(
                    "featuredWorkSection.hotDateKitchen.description",
                  ),
                  metrics: t("featuredWorkSection.hotDateKitchen.metrics", {
                    returnObjects: true,
                  }),
                  link: "https://hotdatekitchen.com/",
                  hoverContent: (
                    <>
                      <strong>Landing + E-commerce</strong> — premium snack
                      brand, Shopify store, 99% recommend
                    </>
                  ),
                  badges: [
                    "Landing page",
                    "E-commerce",
                    "Carbon neutral brand",
                  ],
                  category: "commerce",
                  delay: 0.6,
                  imageScale: 0.9,
                },
                {
                  image: "/GBS.png",
                  title: "GBS Abogados",
                  description:
                    lang === "es"
                      ? "Plataforma web moderna y optimizada"
                      : "Modern and optimized web platform",
                  metrics:
                    lang === "es"
                      ? ["+40% speed", "99.9% uptime", "SEO optimized"]
                      : ["+40% speed", "99.9% uptime", "SEO optimized"],
                  link: "#",
                  hoverContent: (
                    <>
                      <strong>Web Development</strong> — modern platform,
                      optimized performance.
                    </>
                  ),
                  badges: ["Dynamic transitions", "SEO ready", "Fast load"],
                  category: "web-performance",
                  delay: 0.65,
                },
                {
                  image: "/kdabogados.png",
                  title: "KD Abogados",
                  description:
                    lang === "es"
                      ? "Sitio web profesional y responsive"
                      : "Professional and responsive website",
                  metrics:
                    lang === "es"
                      ? ["Fast and secure", "99.9% uptime", "SEO optimized"]
                      : ["Fast and secure", "99.9% uptime", "SEO optimized"],
                  link: "https://kdabogados.com.ar/",
                  hoverContent: (
                    <>
                      <strong>Web Development</strong> — professional website,
                      responsive design.
                    </>
                  ),
                  badges: ["Responsive", "SEO ready", "Fast load"],
                  category: "web-performance",
                  delay: 0.7,
                },
              ];

              const filteredProjects = projects.filter(
                (project) =>
                  activeTab === "all" || project.category === activeTab,
              );

              // Duplicar proyectos para efecto infinito
              // Si hay pocas tarjetas, duplicar más veces para que el carrusel se vea mejor
              const minDuplications = filteredProjects.length <= 3 ? 4 : 2;
              const duplicatedProjects = Array(minDuplications)
                .fill(filteredProjects)
                .flat();

              return (
                <>
                  <style
                    dangerouslySetInnerHTML={{
                      __html: `
                  @keyframes infiniteScrollCarousel {
                    0% {
                      transform: translateX(0);
                    }
                    100% {
                      transform: translateX(-50%);
                    }
                  }
                `,
                    }}
                  />
                  <div
                    style={{
                      width: "100%",
                      position: "relative",
                      zIndex: 999999,
                      overflow: "hidden",
                      padding: "0",
                      display: "flex",
                      alignItems: "center",
                      minHeight: "280px",
                      height: "280px",
                    }}
                    onMouseEnter={() => setCarouselPaused(true)}
                    onMouseLeave={() => setCarouselPaused(false)}
                  >
                    <div
                      ref={carouselTrackRef}
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: isMobile ? "15px" : "0.75rem",
                        animation: "infiniteScrollCarousel 40s linear infinite",
                        width: "fit-content",
                        willChange: "transform",
                        animationPlayState: carouselPaused
                          ? "paused"
                          : "running",
                      }}
                    >
                      {duplicatedProjects.map((project, index) => (
                        <div
                          key={`${project.title}-${index}`}
                          style={{
                            flexShrink: 0,
                            flexGrow: 0,
                          }}
                        >
                          <FeaturedWorkCard
                            image={project.image}
                            title={project.title}
                            description={project.description}
                            metrics={project.metrics}
                            link={project.link}
                            hoverContent={project.hoverContent}
                            badges={project.badges}
                            category={project.category}
                            delay={0}
                            imageScale={project.imageScale}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </Section>
        </div>

        {/* Original Plan Section */}
        <PlanSection>
          <SectionTitle style={{ "--i": 2 }}>{t("planTitle")}</SectionTitle>
          <PlanSteps>
            <li style={{ "--i": 0 }}>
              <strong>1</strong>
              {t("planSteps.step1")}
            </li>
            <li style={{ "--i": 1 }}>
              <strong>2</strong>
              {t("planSteps.step2")}
            </li>
            <li style={{ "--i": 2 }}>
              <strong>3</strong>
              {t("planSteps.step3")}
            </li>
          </PlanSteps>

          {/* New CTA button below plan section */}
          <div style={{ textAlign: "center", marginTop: "3rem" }}>
            <CTAButton
              href={isMobile ? "https://calendly.com/sanchezgcandelaria/15min" : "/contact-us"}
              target={isMobile ? "_blank" : "_self"}
              rel={isMobile ? "noopener noreferrer" : undefined}
              className="secondary-cta"
            >
              {t("homeServicesSection.startJourneyButton")}
            </CTAButton>
          </div>
        </PlanSection>

        {/* Testimonials Carousel Section */}
        <Section
          className="full-width testimonials-section"
          style={{
            background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
            padding: "4rem 1rem",
            margin: "0",
            marginTop: "0",
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.2 }}
            style={{ textAlign: "center", marginBottom: "3rem" }}
          >
            <h2
              style={{
                fontSize: isMobile ? "1.8rem" : "2rem",
                fontWeight: "700",
                marginBottom: "1rem",
              }}
            >
              {t("reviewsTitle")}
            </h2>
            <p
              style={{
                fontSize: isMobile ? "1rem" : "1.1rem",
                maxWidth: "800px",
                margin: "0 auto",
                color: "#444444",
              }}
            >
              {t("reviewsSubtitle")}
            </p>
          </motion.div>

          <TestimonialsCarousel testimonials={testimonialData} />
        </Section>

        {/* Final CTA Section */}
        <HomeCallToAction />
      </Container>
    </>
  );
}
