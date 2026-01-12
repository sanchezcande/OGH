import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import Head from "next/head";
import {
  ServiceTitle,
  Divider,
  Description,
} from "../../src/styles/pagesStyles/servicesStyles/AI.styles";
import CallToActionBlock from "../../src/components/CallToAction/CallToAction";
import {
  FaUsers,
  FaRocket,
  FaHandshake,
  FaCode,
  FaClock,
  FaChartLine,
  FaShieldAlt,
  FaSyncAlt,
  FaUserTie,
  FaUsersCog,
  FaCheckCircle,
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

export const ServicesCallToAction = () => {
  const { t } = useTranslation();
  const callToAction = t("servicesCallToAction", { returnObjects: true });

  return (
    <CallToActionBlock
      title={callToAction.title}
      description={callToAction.description}
      buttonText={callToAction.buttonText}
      highlightWord="Innovate"
    />
  );
};

const staffAugmentation = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  React.useEffect(() => {
    const observer = new window.IntersectionObserver(
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
        <title>Staff Augmentation - OpenGateHub</title>
        <meta
          name="description"
          content={
            lang === "es"
              ? "Ampliamos tu equipo priorizando el match cultural y la calidad humana. Nosotros seleccionamos desarrolladores que se alinean con tus valores y forma de trabajar."
              : "We scale your team prioritizing cultural fit and human quality. We select developers who align with your values and way of working."
          }
        />
        <meta
          name="keywords"
          content="Staff Augmentation, Remote Developers, Software Development Team, IT Consulting, Development Services"
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
        @keyframes usersPulse {
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
              animation: "usersPulse 3s ease-in-out infinite",
            }}
          >
            <FaUsers />
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
            Staff Augmentation
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
            {lang === "es"
              ? "Ampliamos tu equipo priorizando el match cultural y la calidad humana"
              : "We scale your team prioritizing cultural fit and human quality"}
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
          {/* Patrón de fondo sutil */}
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
              {lang === "es"
                ? "¿Qué es Staff Augmentation?"
                : "What is Staff Augmentation?"}
            </SectionTitle>
            <Subtitle>
              {lang === "es"
                ? "Staff Augmentation es nuestro servicio estrella. Nosotros priorizamos el match cultural y la calidad humana por encima de todo. No solo buscamos desarrolladores expertos, sino personas que se alineen con tus valores, tu forma de trabajar y tu visión. Trabajamos como parte de tu equipo para entregar resultados de calidad y acelerar tu roadmap sin la complejidad de contrataciones tradicionales."
                : "Staff Augmentation is our flagship service. We prioritize cultural fit and human quality above all else. We don't just find expert developers—we find people who align with your values, your way of working, and your vision. We work as part of your team to deliver quality results and accelerate your roadmap without the complexity of traditional hiring."}
            </Subtitle>
          </div>
        </div>

        {/* Business Challenges Section */}
        <ProfessionalCard
          className="animate"
          style={{ animationDelay: "0.25s" }}
        >
          <SectionTitle>
            {lang === "es"
              ? "¿Por qué elegir Staff Augmentation?"
              : "Why choose Staff Augmentation?"}
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
            {/* Cada card de beneficio */}
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
                {lang === "es"
                  ? "Acelerá tu roadmap"
                  : "Accelerate your roadmap"}
              </h4>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: "#6B7280",
                  lineHeight: "1.5",
                }}
              >
                {lang === "es"
                  ? "Agregá talento experto rápidamente sin los tiempos de contratación tradicionales."
                  : "Add expert talent quickly without traditional hiring timelines."}
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
                <FaHandshake />
              </div>
              <h4
                style={{
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  color: "#2B2B2B",
                }}
              >
                {lang === "es" ? "Integración perfecta" : "Perfect integration"}
              </h4>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: "#6B7280",
                  lineHeight: "1.5",
                }}
              >
                {lang === "es"
                  ? "Nuestros desarrolladores se integran como parte de tu equipo, alineados con tu cultura."
                  : "Our developers integrate as part of your team, aligned with your culture."}
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
                <FaCode />
              </div>
              <h4
                style={{
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  color: "#2B2B2B",
                }}
              >
                {lang === "es" ? "Expertos en tecnología" : "Tech experts"}
              </h4>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: "#6B7280",
                  lineHeight: "1.5",
                }}
              >
                {lang === "es"
                  ? "Accedé a desarrolladores senior con experiencia en las tecnologías que necesitás."
                  : "Access senior developers with experience in the technologies you need."}
              </p>
            </div>
          </div>
          <div
            className="animate"
            style={{
              padding: "1.5rem",
              background: "#FFF5F5",
              borderRadius: "8px",
              border: "1px solid #FECACA",
              marginTop: "1rem",
              animationDelay: "0.45s",
            }}
          >
            <p
              style={{
                fontSize: "1.1rem",
                color: "#2B2B2B",
                lineHeight: "1.6",
                textAlign: "center",
                fontWeight: "500",
              }}
            >
              {lang === "es"
                ? "Para nosotros, el match cultural y la calidad humana son la prioridad. Trabajamos como parte de tu equipo, no como un proveedor externo. Nuestro compromiso es con tu éxito."
                : "For us, cultural fit and human quality are the priority. We work as part of your team, not as an external vendor. Our commitment is to your success."}
            </p>
          </div>
        </ProfessionalCard>

        {/* Key Benefits */}
        <SectionTitle className="animate" style={{ animationDelay: "0.5s" }}>
          {lang === "es" ? "Beneficios clave" : "Key Benefits"}
        </SectionTitle>
        <FeatureGrid>
          <FeatureCard
            className="animate"
            icon={<FaUsersCog />}
            title={lang === "es" ? "Equipo Extendido" : "Extended Team"}
            description={
              lang === "es"
                ? "Desarrolladores que trabajan como parte de tu equipo, no como contratistas externos"
                : "Developers who work as part of your team, not as external contractors"
            }
            delay={1}
          />
          <FeatureCard
            className="animate"
            icon={<FaClock />}
            title={lang === "es" ? "Tiempo de Respuesta" : "Quick Start"}
            description={
              lang === "es"
                ? "Integración rápida, sin procesos largos de contratación"
                : "Quick integration, without long hiring processes"
            }
            delay={2}
          />
          <FeatureCard
            className="animate"
            icon={<FaChartLine />}
            title={lang === "es" ? "Escalabilidad" : "Scalability"}
            description={
              lang === "es"
                ? "Ajustá el tamaño de tu equipo según tus necesidades del proyecto"
                : "Adjust your team size based on your project needs"
            }
            delay={3}
          />
          <FeatureCard
            className="animate"
            icon={<FaShieldAlt />}
            title={lang === "es" ? "Calidad Garantizada" : "Guaranteed Quality"}
            description={
              lang === "es"
                ? "Desarrolladores senior con experiencia comprobada en proyectos complejos"
                : "Senior developers with proven experience in complex projects"
            }
            delay={4}
          />
          <FeatureCard
            className="animate"
            icon={<FaSyncAlt />}
            title={lang === "es" ? "Flexibilidad" : "Flexibility"}
            description={
              lang === "es"
                ? "Adaptación rápida a cambios en requerimientos y prioridades"
                : "Quick adaptation to changes in requirements and priorities"
            }
            delay={5}
          />
          <FeatureCard
            className="animate"
            icon={<FaUserTie />}
            title={lang === "es" ? "Alineación Cultural" : "Cultural Fit"}
            description={
              lang === "es"
                ? "Desarrolladores que comparten tus valores y forma de trabajar"
                : "Developers who share your values and way of working"
            }
            delay={6}
          />
        </FeatureGrid>

        {/* How We Work Section */}
        <ProfessionalCard
          className="animate"
          style={{
            textAlign: "center",
            padding: "2.5rem 1.5rem",
            animationDelay: "0.55s",
          }}
        >
          <SectionTitle>
            {lang === "es"
              ? "¿Cómo trabajamos con vos?"
              : "How do we work with you?"}
          </SectionTitle>
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
            {/* Línea vertical visible */}
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
            {/* Lista de pasos */}
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
              <li
                className="animate"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  marginBottom: "1.5rem",
                  animationDelay: "0.6s",
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
                  1.
                </span>
                <div>
                  <span
                    style={{
                      fontWeight: 600,
                      color: "#222",
                      fontSize: "1.08rem",
                    }}
                  >
                    {lang === "es"
                      ? "Entendemos tu cultura"
                      : "Understand your culture"}
                  </span>
                  <div
                    style={{ color: "#6B7280", fontSize: "1rem", marginTop: 2 }}
                  >
                    {lang === "es"
                      ? "Priorizamos entender tus valores, tu forma de trabajar y tu visión. El match cultural es nuestra prioridad número uno."
                      : "We prioritize understanding your values, your way of working, and your vision. Cultural fit is our number one priority."}
                  </div>
                </div>
              </li>
              <li
                className="animate"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  marginBottom: "1.5rem",
                  animationDelay: "0.65s",
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
                  2.
                </span>
                <div>
                  <span
                    style={{
                      fontWeight: 600,
                      color: "#222",
                      fontSize: "1.08rem",
                    }}
                  >
                    {lang === "es"
                      ? "Seleccionamos por match cultural"
                      : "Select for cultural fit"}
                  </span>
                  <div
                    style={{ color: "#6B7280", fontSize: "1rem", marginTop: 2 }}
                  >
                    {lang === "es"
                      ? "Nosotros evaluamos y seleccionamos desarrolladores priorizando el match cultural y la calidad humana, no solo las habilidades técnicas."
                      : "We evaluate and select developers prioritizing cultural fit and human quality, not just technical skills."}
                  </div>
                </div>
              </li>
              <li
                className="animate"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  marginBottom: "1.5rem",
                  animationDelay: "0.7s",
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
                  3.
                </span>
                <div>
                  <span
                    style={{
                      fontWeight: 600,
                      color: "#222",
                      fontSize: "1.08rem",
                    }}
                  >
                    {lang === "es" ? "Integración rápida" : "Quick integration"}
                  </span>
                  <div
                    style={{ color: "#6B7280", fontSize: "1rem", marginTop: 2 }}
                  >
                    {lang === "es"
                      ? "Nuestros desarrolladores se integran a tu equipo y procesos desde el día uno."
                      : "Our developers integrate into your team and processes from day one."}
                  </div>
                </div>
              </li>
              <li
                className="animate"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  animationDelay: "0.75s",
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
                  4.
                </span>
                <div>
                  <span
                    style={{
                      fontWeight: 600,
                      color: "#222",
                      fontSize: "1.08rem",
                    }}
                  >
                    {lang === "es" ? "Trabajamos juntos" : "Work together"}
                  </span>
                  <div
                    style={{ color: "#6B7280", fontSize: "1rem", marginTop: 2 }}
                  >
                    {lang === "es"
                      ? "Colaboramos de cerca, entregamos resultados y aceleramos tu roadmap."
                      : "We collaborate closely, deliver results and accelerate your roadmap."}
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </ProfessionalCard>
      </div>

      {/* Use Cases - Full Width Section */}
      <section
        className="animate"
        style={{
          background: "linear-gradient(135deg, #5a6c7d 0%, #3d4a5a 100%)",
          padding: "3rem 2rem",
          marginBottom: "2rem",
          textAlign: "center",
          color: "white",
          position: "relative",
          overflow: "hidden",
          animationDelay: "0.8s",
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
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: "700",
              marginBottom: "1.5rem",
              color: "white",
            }}
          >
            {lang === "es" ? "Casos de uso ideales" : "Ideal use cases"}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1.5rem",
            }}
          >
            <div
              className="animate"
              style={{
                padding: "1.5rem",
                background: "white",
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                animationDelay: "0.85s",
                cursor: "pointer",
                transition: "all 0.3s ease",
                transform: "translateY(0)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
                e.currentTarget.style.borderColor = "rgba(249, 123, 114, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                e.currentTarget.style.borderColor = "#E5E7EB";
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  color: "#F97B72",
                  marginBottom: "1rem",
                  textAlign: "center",
                }}
              >
                <FaRocket />
              </div>
              <h4
                style={{
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  textAlign: "center",
                  color: "#2B2B2B",
                }}
              >
                {lang === "es" ? "Startups en crecimiento" : "Growing startups"}
              </h4>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: "#6B7280",
                  textAlign: "center",
                  lineHeight: "1.5",
                }}
              >
                {lang === "es"
                  ? "Escalá tu equipo rápidamente para cumplir con deadlines y objetivos ambiciosos"
                  : "Scale your team quickly to meet deadlines and ambitious goals"}
              </p>
            </div>
            <div
              className="animate"
              style={{
                padding: "1.5rem",
                background: "white",
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                animationDelay: "0.9s",
                cursor: "pointer",
                transition: "all 0.3s ease",
                transform: "translateY(0)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
                e.currentTarget.style.borderColor = "rgba(249, 123, 114, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                e.currentTarget.style.borderColor = "#E5E7EB";
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  color: "#F97B72",
                  marginBottom: "1rem",
                  textAlign: "center",
                }}
              >
                <FaCode />
              </div>
              <h4
                style={{
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  textAlign: "center",
                  color: "#2B2B2B",
                }}
              >
                {lang === "es" ? "Proyectos específicos" : "Specific projects"}
              </h4>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: "#6B7280",
                  textAlign: "center",
                  lineHeight: "1.5",
                }}
              >
                {lang === "es"
                  ? "Agregá expertise en tecnologías específicas para proyectos puntuales"
                  : "Add expertise in specific technologies for targeted projects"}
              </p>
            </div>
            <div
              className="animate"
              style={{
                padding: "1.5rem",
                background: "white",
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                animationDelay: "0.95s",
                cursor: "pointer",
                transition: "all 0.3s ease",
                transform: "translateY(0)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
                e.currentTarget.style.borderColor = "rgba(249, 123, 114, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                e.currentTarget.style.borderColor = "#E5E7EB";
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  color: "#F97B72",
                  marginBottom: "1rem",
                  textAlign: "center",
                }}
              >
                <FaUsers />
              </div>
              <h4
                style={{
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  textAlign: "center",
                  color: "#2B2B2B",
                }}
              >
                {lang === "es" ? "Equipos distribuidos" : "Distributed teams"}
              </h4>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: "#6B7280",
                  textAlign: "center",
                  lineHeight: "1.5",
                }}
              >
                {lang === "es"
                  ? "Ampliá tu equipo remoto con desarrolladores que trabajan en tu timezone"
                  : "Expand your remote team with developers who work in your timezone"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <div className="animate" style={{ animationDelay: "1s" }}>
        <CallToActionBlock
          title={
            lang === "es"
              ? "¿Listo para ampliar tu equipo?"
              : "Ready to scale your team?"
          }
          description={t("servicesCallToAction.description")}
          buttonText={t("servicesCallToAction.buttonText")}
          highlightWord="Ready"
        />
      </div>
    </>
  );
};

export default staffAugmentation;
