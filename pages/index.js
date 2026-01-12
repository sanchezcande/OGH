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
import { FaProjectDiagram, FaExternalLinkAlt, FaUsers } from "react-icons/fa";
import { FaChevronLeft, FaChevronRight, FaQuoteLeft } from "react-icons/fa";
import Link from "next/link";
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
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [showHover, setShowHover] = useState(false);
  const [hoverPosition, setHoverPosition] = useState(null);
  const cardRef = React.useRef(null);

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
          cursor: "pointer",
          transition: "all 0.3s ease",
          zIndex: showHover ? "999999999999" : "999999",
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => {
          if (!isMobile) {
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
                  width: "auto",
                  maxWidth: "200px",
                  maxHeight: "120px",
                  objectFit: "contain",
                  transition: "transform 0.3s ease-out",
                  filter: "grayscale(20%)",
                  cursor: isMobile ? "default" : "pointer",
                }}
                onMouseEnter={(e) =>
                  !isMobile && (e.target.style.transform = "scale(1.02)")
                }
                onMouseLeave={(e) =>
                  !isMobile && (e.target.style.transform = "scale(1)")
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
    <CallToActionBlock
      title={callToAction.title}
      description={callToAction.description}
      buttonText={callToAction.buttonText}
      highlightWord="aligned"
    />
  );
};

const TestimonialsCarousel = ({ testimonials }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

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

  const nextSlide = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const prevSlide = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setCurrentSlide(
        (prev) => (prev - 1 + testimonials.length) % testimonials.length,
      );
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const goToSlide = (index) => {
    if (!isAnimating && index !== currentSlide) {
      setIsAnimating(true);
      setCurrentSlide(index);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  // Auto-play
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [currentSlide, isAnimating]);

  return (
    <div
      style={{
        maxWidth: isMobile ? "100%" : "1000px",
        margin: isMobile ? 0 : "0 auto",
        position: "relative",
        padding: isMobile ? 0 : "0 2rem",
      }}
    >
      {/* Main Carousel */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: isMobile ? 0 : "20px",
          background: "white",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.1)",
          minHeight: isMobile ? "350px" : "400px",
          margin: 0,
          padding: isMobile ? 0 : undefined,
        }}
      >
        {/* Navigation Buttons */}
        <button
          onClick={prevSlide}
          disabled={isAnimating}
          style={{
            position: "absolute",
            left: isMobile ? 6 : "20px",
            top: "50%",
            transform: "translateY(-50%)",
            background: isMobile ? "none" : "rgba(255, 255, 255, 0.9)",
            border: "none",
            borderRadius: "50%",
            width: isMobile ? 28 : 50,
            height: isMobile ? 28 : 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 10,
            boxShadow: isMobile ? "none" : "0 4px 20px rgba(0, 0, 0, 0.1)",
            transition: "all 0.3s ease",
            opacity: isMobile ? 0.4 : isAnimating ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-50%) scale(1.1)";
            e.target.style.background = "rgba(255, 255, 255, 1)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(-50%) scale(1)";
            e.target.style.background = "rgba(255, 255, 255, 0.9)";
          }}
        >
          <FaChevronLeft
            style={{
              color: isMobile ? "#F97B72" : "#F97B72",
              fontSize: isMobile ? "1rem" : "1.2rem",
              opacity: isMobile ? 1 : 1,
            }}
          />
        </button>

        <button
          onClick={nextSlide}
          disabled={isAnimating}
          style={{
            position: "absolute",
            right: isMobile ? 6 : "20px",
            top: "50%",
            transform: "translateY(-50%)",
            background: isMobile ? "none" : "rgba(255, 255, 255, 0.9)",
            border: "none",
            borderRadius: "50%",
            width: isMobile ? 28 : 50,
            height: isMobile ? 32 : 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 10,
            boxShadow: isMobile ? "none" : "0 4px 20px rgba(0, 0, 0, 0.1)",
            transition: "all 0.3s ease",
            opacity: isMobile ? 0.4 : isAnimating ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-50%) scale(1.1)";
            e.target.style.background = "rgba(255, 255, 255, 1)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(-50%) scale(1)";
            e.target.style.background = "rgba(255, 255, 255, 0.9)";
          }}
        >
          <FaChevronRight
            style={{
              color: isMobile ? "#F97B72" : "#F97B72",
              fontSize: isMobile ? "1rem" : "1.2rem",
              opacity: isMobile ? 1 : 1,
              paddingTop: isMobile ? 2 : 0,
            }}
          />
        </button>

        {/* Slides Container */}
        <div
          style={{
            display: "flex",
            transition: "transform 0.3s ease",
            transform: `translateX(-${currentSlide * 100}%)`,
            height: "100%",
          }}
        >
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              style={{
                minWidth: "100%",
                padding: isMobile ? "1.5rem 0" : "3rem 4rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                position: "relative",
                "@media (max-width: 768px)": {
                  padding: "1.5rem 0",
                  minHeight: "350px",
                },
              }}
            >
              {/* Quote Icon */}
              <div
                style={{
                  position: "absolute",
                  top: "2rem",
                  left: "2rem",
                  fontSize: "3rem",
                  color: "#F97B72",
                  opacity: 0.1,
                  "@media (max-width: 768px)": {
                    top: "1rem",
                    left: "1rem",
                    fontSize: "2rem",
                  },
                }}
              >
                <FaQuoteLeft />
              </div>

              {/* Content */}
              <p
                style={{
                  fontSize: isMobile ? "1rem" : "1.3rem",
                  lineHeight: isMobile ? "1.6" : "1.8",
                  color: "#333",
                  marginBottom: isMobile ? "1.5rem" : "2rem",
                  fontStyle: "italic",
                  maxWidth: "600px",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  hyphens: "auto",
                  textAlign: "left",
                  padding: isMobile ? "0 12px" : 0,
                }}
              >
                "{testimonial.content}"
              </p>

              {/* Author Info */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <p
                  style={{
                    fontWeight: "700",
                    fontSize: "1.2rem",
                    color: "#F97B72",
                    margin: 0,
                    "@media (max-width: 768px)": {
                      fontSize: "1.1rem",
                    },
                  }}
                >
                  {testimonial.company}
                </p>
                <p
                  style={{
                    fontSize: "1rem",
                    color: "#666",
                    margin: 0,
                    "@media (max-width: 768px)": {
                      fontSize: "0.9rem",
                    },
                  }}
                >
                  {testimonial.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "0.5rem",
          marginTop: "2rem",
        }}
      >
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            style={{
              width: index === currentSlide ? "30px" : "12px",
              height: "12px",
              borderRadius: "6px",
              border: "none",
              background: index === currentSlide ? "#F97B72" : "#ddd",
              cursor: "pointer",
              transition: "all 0.3s ease",
              opacity: isAnimating ? 0.5 : 1,
            }}
          />
        ))}
      </div>
    </div>
  );
};

const ServiceBox = ({ icon, title, description, delay = 0, link, menuItems = [] }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const boxRef = React.useRef(null);

  // Cerrar el menú al hacer click fuera
  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    // Agregar un pequeño delay para evitar que se cierre inmediatamente
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showMenu]);

  const boxContent = (
    <>
      <motion.div
        initial={{ scale: 1 }}
        animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
        transition={{ duration: 0.1 }}
        style={{
          fontSize: "3rem",
          color: "var(--color-accent, #FF6B6B)",
          marginBottom: "1rem",
          display: "inline-block",
        }}
      >
        {icon}
      </motion.div>

      <h3
        style={{
          fontSize: "1.5rem",
          fontWeight: "700",
          marginBottom: "1rem",
          color: "var(--color-text, #333)",
          transition: "color 0.2s ease",
          ...(isHovered ? { color: "#E35A52" } : {}),
        }}
      >
        {title}
      </h3>

      {menuItems.length > 0 && showMenu ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            marginTop: "0.5rem",
          }}
        >
          {menuItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              style={{ textDecoration: "none" }}
              onClick={() => setShowMenu(false)}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
                style={{
                  padding: "12px 16px",
                  cursor: "pointer",
                  color: "#1f2937",
                  fontSize: "0.95rem",
                  fontWeight: "500",
                  backgroundColor: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f97b72";
                  e.target.style.color = "#ffffff";
                  e.target.style.borderColor = "#f97b72";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#f9fafb";
                  e.target.style.color = "#1f2937";
                  e.target.style.borderColor = "#e5e7eb";
                }}
              >
                {item.text}
              </motion.div>
            </Link>
          ))}
        </motion.div>
      ) : (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            fontSize: "1rem",
            lineHeight: "1.6",
            color: "#444444",
          }}
        >
          {description}
        </motion.p>
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

    </>
  );

  const boxStyle = {
    background: "linear-gradient(145deg, #ffffff, #f0f0f0)",
    borderRadius: "16px",
    padding: "2rem",
    height: "100%",
    cursor: menuItems.length > 0 || link ? "pointer" : "default",
    position: "relative",
    overflow: "hidden",
    border: "1px solid rgba(249, 123, 114, 0.2)",
    transition: "all 0.15s ease",
  };

  if (link && menuItems.length === 0) {
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

  return (
    <>
      <motion.div
        ref={boxRef}
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
        onClick={(e) => {
          e.stopPropagation();
          if (menuItems.length > 0) {
            setShowMenu(!showMenu);
          }
        }}
        style={boxStyle}
      >
        {boxContent}
      </motion.div>
    </>
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
  const { t } = useTranslation();
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
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <span key={index} className="highlighted-word">
            {part}
          </span>
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  const testimonialData = [
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

  return (
    <>
      <Head>
        <title>OpenGateHub</title>
        <meta name="description" content="OpenGateHub" />
        <meta property="og:title" content={t("OpenGateHub")} />
        <meta
          name="keywords"
          content="OpenGateHub, Open Gate Hub, Open GateHub, software develop, web develop, páginas web"
        />
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
              {t("heroAnimatedText.part1")}{" "}
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
              {t("heroAnimatedText.part1")}{" "}
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
          <CTAButton
            href="https://calendly.com/sanchezgcandelaria"
            target="_blank"
            rel="noopener noreferrer"
            className="primary-cta"
          >
            {t("ctaButton")}
          </CTAButton>
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

        {/* Services Section with Interactive Boxes */}
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
                fontSize: "2.8rem",
                fontWeight: "800",
                marginBottom: "1rem",
              }}
            >
              <span style={{ color: "var(--color-accent, #FF6B6B)" }}>
                {t("homeServicesSection.title")}
              </span>
            </h2>
            <p
              style={{
                fontSize: "1.2rem",
                maxWidth: "800px",
                margin: "0 auto",
                color: "var(--color-text-muted, #666)",
              }}
            >
              {t("homeServicesSection.subtitle")}
            </p>
          </motion.div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "2rem",
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "0 1rem",
            }}
          >
            <ServiceBox
              icon={<FaUsers style={{ color: "#E35A52", fontSize: "3rem" }} />}
              title={t("homeServicesSection.cards.staffAugmentation.title")}
              description={t(
                "homeServicesSection.cards.staffAugmentation.description",
              )}
              delay={0.05}
              link="/services/staff-augmentation"
            />
            <ServiceBox
              icon="💻"
              title={t("homeServicesSection.cards.softwareDevelopment.title")}
              description={t(
                "homeServicesSection.cards.softwareDevelopment.description",
              )}
              delay={0.1}
              menuItems={[
                { text: t("frontendTitle"), href: "/services/front-end" },
                { text: t("backendTitle"), href: "/services/back-end" },
              ]}
            />
            <ServiceBox
              icon="🎨"
              title={t("homeServicesSection.cards.uxUiDesign.title")}
              description={t(
                "homeServicesSection.cards.uxUiDesign.description",
              )}
              delay={0.15}
              menuItems={[
                { text: t("uxuiTitle"), href: "/services/ux-ui" },
                { text: t("graphicDesignTitle"), href: "/services/graphic-design" },
              ]}
            />
            <ServiceBox
              icon="🤖"
              title={t("homeServicesSection.cards.aiAndAutomation.title")}
              description={t(
                "homeServicesSection.cards.aiAndAutomation.description",
              )}
              delay={0.2}
              menuItems={[
                { text: "n8n Automation", href: "/services/n8n-automation" },
                { text: t("aiTitle"), href: "/services/AI" },
              ]}
            />
            <ServiceBox
              icon="📊"
              title={t("homeServicesSection.cards.dataAnalytics.title")}
              description={t(
                "homeServicesSection.cards.dataAnalytics.description",
              )}
              delay={0.25}
              link="/services/back-end"
            />
            <ServiceBox
              icon="📱"
              title={t("homeServicesSection.cards.mobileDevelopment.title")}
              description={t(
                "homeServicesSection.cards.mobileDevelopment.description",
              )}
              delay={0.3}
              menuItems={[
                { text: t("frontendTitle"), href: "/services/front-end" },
                { text: t("backendTitle"), href: "/services/back-end" },
              ]}
            />
          </div>
        </Section>

        {/* Metrics Section */}
        <MetricsSection />

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
                  badges: ["Fast pages", "SEO ready", "Always on"],
                  category: "web-performance",
                  delay: 0.2,
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
                  delay: 0.3,
                },
                {
                  image: "/GBS.png",
                  title: "GBS Abogados",
                  description: "Plataforma web moderna y optimizada",
                  metrics: ["+40% velocidad", "99.9% uptime", "SEO optimizado"],
                  link: "#",
                  hoverContent: (
                    <>
                      <strong>Web Development</strong> — modern platform,
                      optimized performance.
                    </>
                  ),
                  badges: ["Dynamic transitions", "SEO ready", "Always on"],
                  category: "web-performance",
                  delay: 0.4,
                },
                {
                  image: "/valthor-logo.e3b5a398.png",
                  title: "Valthor CRM",
                  description: "Plataforma CRM moderna y optimizada con IA",
                  metrics: ["Omnicanal", "99.9% uptime", "SEO optimizado"],
                  link: "#",
                  hoverContent: (
                    <>
                      <strong>Modern CRM platform</strong> — powered with{" "}
                      <strong>AI</strong>.
                    </>
                  ),
                  badges: ["CRM", "AI", "Always on"],
                  category: "saas",
                  delay: 0.5,
                },
                {
                  image: "/vivabots_azul.png",
                  title: "Vivabots RPA",
                  description: "Plataforma RPA moderna y optimizada",
                  metrics: ["99.9% uptime", "99.9% efficienty"],
                  link: "https://vivabots.com/",
                  hoverContent: (
                    <>
                      Modern and Powerful <strong>RPA platform</strong>{" "}
                    </>
                  ),
                  badges: ["RPA Platform", "Web & Desktop", "3,200+ Bots"],
                  category: "saas",
                  delay: 0.6,
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
              href="https://calendly.com/sanchezgcandelaria"
              target="_blank"
              rel="noopener noreferrer"
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
            margin: "4rem 0",
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
                fontSize: "2.8rem",
                fontWeight: "800",
                marginBottom: "1rem",
              }}
            >
              {t("reviewsTitle")}
            </h2>
            <p
              style={{
                fontSize: "1.2rem",
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
