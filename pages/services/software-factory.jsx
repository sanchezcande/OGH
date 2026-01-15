import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import Head from "next/head";
import CallToActionBlock from "../../src/components/CallToAction/CallToAction";
import {
  FaProjectDiagram,
  FaRocket,
  FaCode,
  FaChartLine,
  FaShieldAlt,
  FaTasks,
  FaCog,
  FaTruck,
} from "react-icons/fa";
import React from "react";

// Componentes visuales mejorados (mismo estilo que otras páginas)
const HeroSection = ({ children, style }) => (
  <div
    style={{
      background: "linear-gradient(135deg, #5a6c7d 0%, #3d4a5a 100%)",
      borderRadius: "16px",
      padding: "2.5rem 2rem",
      marginTop: "1rem",
      marginBottom: "2rem",
      textAlign: "center",
      color: "white",
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
      ...style,
    }}
  >
    {/* Patrón de fondo sutil */}
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background:
          'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="circles" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="2" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23circles)"/></svg>\')',
        opacity: 0.4,
        zIndex: 1,
      }}
    />
    <div style={{ position: "relative", zIndex: 2 }}>{children}</div>
    <div
      style={{
        position: "absolute",
        top: "-50%",
        right: "-20%",
        width: "200px",
        height: "200px",
        background: "rgba(255, 255, 255, 0.2)",
        borderRadius: "50%",
        zIndex: 1,
      }}
    />
  </div>
);

const ProfessionalCard = ({
  children,
  style,
  className,
  hasPattern = false,
}) => (
  <div
    className={className}
    style={{
      background: "white",
      borderRadius: "12px",
      padding: "2rem",
      marginBottom: "2rem",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      border: "1px solid rgba(0,0,0,0.05)",
      transition: "all 0.3s ease",
      position: "relative",
      overflow: "hidden",
      ...style,
    }}
  >
    {hasPattern && (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(45deg, rgba(249, 123, 114, 0.03) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(249, 123, 114, 0.03) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(249, 123, 114, 0.03) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(249, 123, 114, 0.03) 75%)
          `,
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
          zIndex: 1,
        }}
      />
    )}
    <div style={{ position: "relative", zIndex: 2 }}>{children}</div>
  </div>
);

const FeatureGrid = ({ children }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "1.5rem",
      marginBottom: "2rem",
    }}
  >
    {children}
  </div>
);

const FeatureCard = ({ icon, title, description, delay = 0 }) => (
  <div
    className="animate"
    style={{
      background: "white",
      borderRadius: "12px",
      padding: "1.5rem",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      border: "1px solid rgba(0,0,0,0.04)",
      transition: "all 0.3s ease",
      opacity: 0,
      transform: "translateY(20px)",
      animation: "fadeInUp 0.6s forwards",
      animationDelay: `${delay * 0.1}s`,
    }}
  >
    <div
      style={{
        fontSize: "2.5rem",
        color: "#F97B72",
        marginBottom: "1rem",
        textAlign: "center",
      }}
    >
      {icon}
    </div>
    <h4
      style={{
        fontSize: "1.2rem",
        fontWeight: "600",
        marginBottom: "0.5rem",
        color: "#2B2B2B",
        textAlign: "center",
      }}
    >
      {title}
    </h4>
    <p
      style={{
        fontSize: "0.95rem",
        lineHeight: "1.6",
        color: "#6B7280",
        textAlign: "center",
      }}
    >
      {description}
    </p>
    <style>{`
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `}</style>
  </div>
);

const SectionTitle = ({ children, style }) => (
  <h2
    style={{
      fontSize: "2rem",
      fontWeight: "700",
      marginBottom: "1.5rem",
      color: "#2B2B2B",
      textAlign: "center",
      ...style,
    }}
  >
    {children}
  </h2>
);

const Subtitle = ({ children, style }) => (
  <p
    style={{
      fontSize: "1.1rem",
      lineHeight: "1.6",
      color: "#6B7280",
      textAlign: "center",
      marginBottom: "2rem",
      maxWidth: "600px",
      margin: "0 auto 2rem auto",
      ...style,
    }}
  >
    {children}
  </p>
);

const SoftwareFactory = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  useEffect(() => {
    if (typeof window === "undefined") return;
    
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
    
    const items = document.querySelectorAll(".animate");
    items.forEach((item) => observer.observe(item));
    
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Head>
        <title>Software Factory - OpenGateHub</title>
        <meta
          name="description"
          content={t("softwareFactory.metaDescription")}
        />
        <meta
          name="keywords"
          content="Software Factory, Custom Software Development, End-to-End Development, Project Delivery, Software Solutions"
        />
        <meta name="author" content="OpenGateHub" />
      </Head>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate { opacity: 0; transform: translateY(20px); transition: opacity 0.7s, transform 0.7s; }
        .visible { opacity: 1 !important; transform: translateY(0) !important; }
        @keyframes factoryPulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 1;
          }
          50% { 
            transform: scale(1.05);
            opacity: 0.9;
          }
        }
      `}</style>

      {/* Hero Section - Full Width */}
      <section
        style={{
          background: "linear-gradient(135deg, #5a6c7d 0%, #3d4a5a 100%)",
          padding: "3rem 2rem",
          marginTop: "1rem",
          marginBottom: "2rem",
          textAlign: "center",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="circles" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="2" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23circles)"/></svg>\')',
            opacity: 0.4,
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          <div
            className="animate"
            style={{
              fontSize: "4rem",
              marginBottom: "1rem",
              animationDelay: "0.05s",
              color: "#F97B72",
              textShadow: "0 0 15px rgba(249, 123, 114, 0.4)",
              animation: "factoryPulse 3s ease-in-out infinite",
            }}
          >
            <FaProjectDiagram />
          </div>
          <h1
            className="animate"
            style={{
              fontSize: "2.5rem",
              fontWeight: "700",
              marginBottom: "1rem",
              animationDelay: "0.1s",
            }}
          >
            Software Factory
          </h1>
          <p
            className="animate"
            style={{
              fontSize: "1.2rem",
              opacity: 0.95,
              maxWidth: "600px",
              margin: "0 auto",
              animationDelay: "0.15s",
            }}
          >
            {t("softwareFactory.heroSubtitle")}
          </p>
        </div>
      </section>

      {/* Main Content - Full Width */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 2rem" }}>
        {/* Main Description */}
        <div
          className="animate"
          style={{
            position: "relative",
            padding: "2rem",
            marginBottom: "2rem",
            borderRadius: "12px",
            overflow: "hidden",
            animationDelay: "0.2s",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                linear-gradient(45deg, rgba(249, 123, 114, 0.03) 25%, transparent 25%),
                linear-gradient(-45deg, rgba(249, 123, 114, 0.03) 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, rgba(249, 123, 114, 0.03) 75%),
                linear-gradient(-45deg, transparent 75%, rgba(249, 123, 114, 0.03) 75%)
              `,
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
              zIndex: 1,
            }}
          />
          <div style={{ position: "relative", zIndex: 2 }}>
            <SectionTitle>
              {t("softwareFactory.whatIsTitle")}
            </SectionTitle>
            <Subtitle>
              {t("softwareFactory.whatIsDescription")}
            </Subtitle>
          </div>
        </div>

        {/* When to Use Section */}
        <ProfessionalCard
          className="animate"
          style={{ animationDelay: "0.25s" }}
        >
          <SectionTitle>
            {t("softwareFactory.whenToUseTitle")}
          </SectionTitle>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "1.5rem",
              marginBottom: "1rem",
            }}
          >
            <div
              className="animate"
              style={{
                padding: "1.5rem",
                background: "#F0F9FF",
                borderRadius: "8px",
                border: "1px solid #BAE6FD",
                animationDelay: "0.3s",
                minWidth: "240px",
                maxWidth: "280px",
                flex: "1 1 240px",
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  color: "#F97B72",
                  marginBottom: "0.5rem",
                }}
              >
                <FaRocket />
              </div>
              <h4
                style={{
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  color: "#2B2B2B",
                }}
              >
                {t("softwareFactory.whenToUse.newProductTitle")}
              </h4>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: "#6B7280",
                  lineHeight: "1.5",
                }}
              >
                {t("softwareFactory.whenToUse.newProductDescription")}
              </p>
            </div>
            <div
              className="animate"
              style={{
                padding: "1.5rem",
                background: "#F0F9FF",
                borderRadius: "8px",
                border: "1px solid #BAE6FD",
                animationDelay: "0.35s",
                minWidth: "240px",
                maxWidth: "280px",
                flex: "1 1 240px",
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  color: "#F97B72",
                  marginBottom: "0.5rem",
                }}
              >
                <FaCog />
              </div>
              <h4
                style={{
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  color: "#2B2B2B",
                }}
              >
                {t("softwareFactory.whenToUse.completeSolutionTitle")}
              </h4>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: "#6B7280",
                  lineHeight: "1.5",
                }}
              >
                {t("softwareFactory.whenToUse.completeSolutionDescription")}
              </p>
            </div>
            <div
              className="animate"
              style={{
                padding: "1.5rem",
                background: "#F0F9FF",
                borderRadius: "8px",
                border: "1px solid #BAE6FD",
                animationDelay: "0.4s",
                minWidth: "240px",
                maxWidth: "280px",
                flex: "1 1 240px",
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  color: "#F97B72",
                  marginBottom: "0.5rem",
                }}
              >
                <FaTruck />
              </div>
              <h4
                style={{
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  color: "#2B2B2B",
                }}
              >
                {t("softwareFactory.whenToUse.tightDeadlineTitle")}
              </h4>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: "#6B7280",
                  lineHeight: "1.5",
                }}
              >
                {t("softwareFactory.whenToUse.tightDeadlineDescription")}
              </p>
            </div>
          </div>
        </ProfessionalCard>

        {/* Process Section */}
        <SectionTitle className="animate" style={{ animationDelay: "0.5s" }}>
          {t("softwareFactory.processTitle")}
        </SectionTitle>
        <ProfessionalCard
          className="animate"
          style={{
            textAlign: "center",
            padding: "2.5rem 1.5rem",
            animationDelay: "0.55s",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "stretch",
              width: "100%",
              minHeight: 220,
              margin: "0 auto",
            }}
          >
            <div
              style={{
                width: 6,
                minWidth: 6,
                background: "#F97B72",
                borderRadius: 3,
                height: "calc(100% - 32px)",
                marginTop: 16,
                marginBottom: 16,
                marginRight: 32,
                boxShadow: "0 0 8px 0 #f97b7233",
              }}
            />
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                textAlign: "left",
                width: "100%",
                maxWidth: 480,
              }}
            >
              {[1, 2, 3, 4, 5].map((step, index) => (
                <li
                  key={index}
                  className="animate"
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    marginBottom: "1.5rem",
                    animationDelay: `${0.6 + index * 0.05}s`,
                  }}
                >
                  <span
                    style={{
                      color: "#F97B72",
                      fontWeight: 700,
                      fontSize: "1.3rem",
                      minWidth: 28,
                      display: "inline-block",
                      textAlign: "center",
                      marginRight: 18,
                    }}
                  >
                    {step}.
                  </span>
                  <div>
                    <span
                      style={{
                        fontWeight: 600,
                        color: "#222",
                        fontSize: "1.08rem",
                      }}
                    >
                      {t(`softwareFactory.process.step${step}Title`)}
                    </span>
                    <div
                      style={{ color: "#6B7280", fontSize: "1rem", marginTop: 2 }}
                    >
                      {t(`softwareFactory.process.step${step}Description`)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </ProfessionalCard>

        {/* Outcomes Section */}
        <SectionTitle className="animate" style={{ animationDelay: "0.85s" }}>
          {t("softwareFactory.outcomesTitle")}
        </SectionTitle>
        <FeatureGrid>
          <FeatureCard
            className="animate"
            icon={<FaCode />}
            title={t("softwareFactory.outcomes.fullyFunctionalTitle")}
            description={t("softwareFactory.outcomes.fullyFunctionalDescription")}
            delay={1}
          />
          <FeatureCard
            className="animate"
            icon={<FaShieldAlt />}
            title={t("softwareFactory.outcomes.productionReadyTitle")}
            description={t("softwareFactory.outcomes.productionReadyDescription")}
            delay={2}
          />
          <FeatureCard
            className="animate"
            icon={<FaChartLine />}
            title={t("softwareFactory.outcomes.scalableArchitectureTitle")}
            description={t("softwareFactory.outcomes.scalableArchitectureDescription")}
            delay={3}
          />
          <FeatureCard
            className="animate"
            icon={<FaTasks />}
            title={t("softwareFactory.outcomes.completeDocumentationTitle")}
            description={t("softwareFactory.outcomes.completeDocumentationDescription")}
            delay={4}
          />
        </FeatureGrid>

        {/* Call to Action */}
        <div className="animate" style={{ animationDelay: "1s" }}>
          <CallToActionBlock
            title={t("softwareFactory.ctaTitle")}
            description={t("softwareFactory.ctaDescription")}
            buttonText={t("softwareFactory.ctaButtonText")}
            highlightWord={t("softwareFactory.ctaHighlightWord")}
          />
        </div>
      </div>
    </>
  );
};

export default SoftwareFactory;
