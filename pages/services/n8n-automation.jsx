import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import Head from "next/head";
import {
  ServiceContainer,
  ServiceTitle,
  Divider,
  Description,
} from "../../src/styles/pagesStyles/servicesStyles/AI.styles";
import CallToActionBlock from "../../src/components/CallToAction/CallToAction";
import { 
  FaCheckCircle, 
  FaCogs, 
  FaSyncAlt, 
  FaRocket, 
  FaCloud, 
  FaUsers, 
  FaProjectDiagram,
  FaShieldAlt,
  FaLightbulb,
  FaChartLine
} from "react-icons/fa";

// Componentes visuales mejorados
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
        background: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><pattern id=\"circles\" width=\"20\" height=\"20\" patternUnits=\"userSpaceOnUse\"><circle cx=\"10\" cy=\"10\" r=\"2\" fill=\"rgba(255,255,255,0.1)\"/></pattern></defs><rect width=\"100\" height=\"100\" fill=\"url(%23circles)\"/></svg>')",
        opacity: 0.4,
        zIndex: 1,
      }}
    />
    <div style={{ position: "relative", zIndex: 2 }}>
      {children}
    </div>
    <div
      style={{
        position: "absolute",
        top: "-50%",
        right: "-20%",
        width: "200px",
        height: "200px",
        background: "rgba(249, 123, 114, 0.2)",
        borderRadius: "50%",
        zIndex: 1,
      }}
    />
  </div>
);

const ProfessionalCard = ({ children, style, className, hasPattern = false }) => (
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
    <div style={{ position: "relative", zIndex: 2 }}>
      {children}
    </div>
  </div>
);

const FeatureGrid = ({ children }) => (
  <div style={{ 
    display: "grid", 
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "1.5rem",
    marginBottom: "2rem"
  }}>
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
    <div style={{ 
      fontSize: "2.5rem", 
      color: "#F97B72", 
      marginBottom: "1rem",
      textAlign: "center"
    }}>
      {icon}
    </div>
    <h4 style={{ 
      fontSize: "1.2rem", 
      fontWeight: "600", 
      marginBottom: "0.5rem",
      color: "#2B2B2B",
      textAlign: "center"
    }}>
      {title}
    </h4>
    <p style={{ 
      fontSize: "0.95rem", 
      lineHeight: "1.6",
      color: "#6B7280",
      textAlign: "center"
    }}>
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
  <h2 style={{
    fontSize: "2rem",
    fontWeight: "700",
    marginBottom: "1.5rem",
    color: "#2B2B2B",
    textAlign: "center",
    ...style,
  }}>
    {children}
  </h2>
);

const Subtitle = ({ children, style }) => (
  <p style={{
    fontSize: "1.1rem",
    lineHeight: "1.6",
    color: "#6B7280",
    textAlign: "center",
    marginBottom: "2rem",
    maxWidth: "600px",
    margin: "0 auto 2rem auto",
    ...style,
  }}>
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
    />
  );
};

const N8nAutomation = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    const items = document.querySelectorAll(".animate");
    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Head>
        <title>n8n Automation - OpenGateHub</title>
        <meta name="description" content={t("homeServicesSection.cards.n8nAutomation.description")}/>
        <meta
          name="keywords"
          content="n8n, Automation, Workflow, Integrations, No-code, Business Efficiency"
        />
        <meta name="author" content="OpenGateHub" />
      </Head>

      {/* Hero Section - Full Width */}
      <section style={{ 
        background: "linear-gradient(135deg, #6a7c8d 0%, #4d5a6a 100%)",
        padding: "3rem 2rem",
        marginTop: "1rem",
        marginBottom: "2rem",
        textAlign: "center",
        color: "white",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Patrón de fondo tecnológico */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><pattern id=\"hex\" width=\"40\" height=\"35\" patternUnits=\"userSpaceOnUse\"><path d=\"M20 0l20 11.5v23L20 46 0 34.5v-23L20 0z\" fill=\"none\" stroke=\"rgba(255,255,255,0.06)\" stroke-width=\"0.5\"/><path d=\"M40 0l20 11.5v23L40 46 20 34.5v-23L40 0z\" fill=\"none\" stroke=\"rgba(255,255,255,0.06)\" stroke-width=\"0.5\"/><circle cx=\"20\" cy=\"23\" r=\"1.5\" fill=\"rgba(255,255,255,0.08)\"/></pattern></defs><rect width=\"100\" height=\"100\" fill=\"url(%23hex)\"/></svg>')",
            opacity: 0.7,
          }}
        />
        <div style={{ position: "relative", zIndex: 2, maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ 
            fontSize: "4rem", 
            marginBottom: "1rem",
            animation: "float 3s ease-in-out infinite",
            display: "inline-block",
            color: "#F97B72",
            textShadow: "0 0 15px rgba(249, 123, 114, 0.4)"
          }}>
            <FaProjectDiagram />
          </div>
          <style>{`
            @keyframes float {
              0%, 100% { 
                transform: translateY(0px) rotate(0deg); 
              }
              50% { 
                transform: translateY(-10px) rotate(5deg); 
              }
            }
          `}</style>
          <h1 style={{ 
            fontSize: "2.5rem", 
            fontWeight: "700", 
            marginBottom: "1rem",
            color: "white"
          }}>
            n8n Automation
          </h1>
          <p style={{ 
            fontSize: "1.2rem", 
            opacity: 0.9,
            maxWidth: "600px",
            margin: "0 auto"
          }}>
            {lang === "es" 
              ? "Conectá tus herramientas y automatizá flujos de trabajo sin código"
              : "Connect your tools and automate workflows without code"
            }
          </p>
        </div>
      </section>

      {/* Main Content - Full Width */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 2rem" }}>
        {/* Main Description */}
        <div style={{ 
          position: "relative",
          padding: "2rem",
          marginBottom: "2rem",
          borderRadius: "12px",
          overflow: "hidden",
          background: "#f8f9fa",
        }}>
          <div>
            <SectionTitle>
              {lang === "es" ? "¿Qué es n8n?" : "What is n8n?"}
            </SectionTitle>
            <Subtitle>
              {lang === "es"
                ? "n8n es una plataforma visual de automatización de flujos de trabajo de código abierto. Permite conectar aplicaciones, automatizar procesos y crear integraciones personalizadas sin necesidad de programar."
                : "n8n is an open-source, visual workflow automation platform. It empowers businesses and teams to connect apps, automate processes, and build custom integrations—no coding required."
              }
            </Subtitle>
          </div>
        </div>

        {/* Key Benefits */}
        <SectionTitle>
          {lang === "es" ? "¿Por qué elegir n8n?" : "Why choose n8n?"}
        </SectionTitle>
        <FeatureGrid>
          <FeatureCard
            icon={<FaCogs />}
            title={lang === "es" ? "Open Source" : "Open Source"}
            description={lang === "es" ? "Código abierto y económico, sin costos ocultos" : "Open-source and cost-effective, no hidden costs"}
            delay={1}
          />
          <FeatureCard
            icon={<FaSyncAlt />}
            title={lang === "es" ? "Sin Código" : "No Code"}
            description={lang === "es" ? "Interfaz visual intuitiva, sin programación requerida" : "Intuitive visual interface, no programming required"}
            delay={2}
          />
          <FeatureCard
            icon={<FaCloud />}
            title={lang === "es" ? "200+ Integraciones" : "200+ Integrations"}
            description={lang === "es" ? "Conecta con todas tus herramientas favoritas" : "Connect with all your favorite tools"}
            delay={3}
          />
          <FeatureCard
            icon={<FaShieldAlt />}
            title={lang === "es" ? "Flexible" : "Flexible"}
            description={lang === "es" ? "Cloud o self-hosted, según tus necesidades" : "Cloud or self-hosted, based on your needs"}
            delay={4}
          />
          <FeatureCard
            icon={<FaChartLine />}
            title={lang === "es" ? "Productividad" : "Productivity"}
            description={lang === "es" ? "Aumenta la eficiencia y reduce errores" : "Increase efficiency and reduce errors"}
            delay={5}
          />
          <FeatureCard
            icon={<FaLightbulb />}
            title={lang === "es" ? "Escalable" : "Scalable"}
            description={lang === "es" ? "Crece con tu negocio, desde startups hasta enterprise" : "Grows with your business, from startups to enterprise"}
            delay={6}
          />
        </FeatureGrid>
      </div>

      {/* Use Cases - Full Width Section */}
      <section style={{ 
        background: "linear-gradient(135deg, #6a7c8d 0%, #4d5a6a 100%)",
        padding: "3rem 2rem",
        marginBottom: "2rem",
        textAlign: "center",
        color: "white",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Patrón de fondo tecnológico */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><pattern id=\"hex2\" width=\"40\" height=\"35\" patternUnits=\"userSpaceOnUse\"><path d=\"M20 0l20 11.5v23L20 46 0 34.5v-23L20 0z\" fill=\"none\" stroke=\"rgba(255,255,255,0.06)\" stroke-width=\"0.5\"/><path d=\"M40 0l20 11.5v23L40 46 20 34.5v-23L40 0z\" fill=\"none\" stroke=\"rgba(255,255,255,0.06)\" stroke-width=\"0.5\"/><circle cx=\"20\" cy=\"23\" r=\"1.5\" fill=\"rgba(255,255,255,0.08)\"/></pattern></defs><rect width=\"100\" height=\"100\" fill=\"url(%23hex2)\"/></svg>')",
            opacity: 0.7,
          }}
        />
        <div style={{ position: "relative", zIndex: 2, maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ 
            fontSize: "2rem", 
            fontWeight: "700", 
            marginBottom: "1.5rem",
            color: "white"
          }}>
            {lang === "es" ? "Casos de uso comunes" : "Common use cases"}
          </h2>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1.5rem"
          }}>
          <div 
            className="use-case-card"
            style={{ 
              padding: "1.5rem", 
              background: "white", 
              borderRadius: "8px", 
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              border: "1px solid rgba(0,0,0,0.05)",
              cursor: "pointer",
              transition: "all 0.3s ease",
              transform: "translateY(0)"
            }}
          >
            <div style={{ fontSize: "1.5rem", color: "#F97B72", marginBottom: "0.5rem", textAlign: "center", transition: "all 0.3s ease" }}>
              <FaUsers />
            </div>
            <h4 style={{ fontWeight: "600", marginBottom: "0.5rem", textAlign: "center", color: "#2B2B2B", transition: "all 0.3s ease" }}>
              {lang === "es" ? "Sincronización de datos" : "Data synchronization"}
            </h4>
            <p style={{ fontSize: "0.9rem", color: "#6B7280", textAlign: "center", lineHeight: "1.5", transition: "all 0.3s ease" }}>
              {lang === "es" ? "Sincroniza información entre CRM, email marketing y sistemas de soporte" : "Sync information between CRM, email marketing and support systems"}
            </p>
          </div>
          <div 
            className="use-case-card"
            style={{ 
              padding: "1.5rem", 
              background: "white", 
              borderRadius: "8px", 
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              border: "1px solid rgba(0,0,0,0.05)",
              cursor: "pointer",
              transition: "all 0.3s ease",
              transform: "translateY(0)"
            }}
          >
            <div style={{ fontSize: "1.5rem", color: "#F97B72", marginBottom: "0.5rem", textAlign: "center", transition: "all 0.3s ease" }}>
              <FaRocket />
            </div>
            <h4 style={{ fontWeight: "600", marginBottom: "0.5rem", textAlign: "center", color: "#2B2B2B", transition: "all 0.3s ease" }}>
              {lang === "es" ? "Gestión de leads" : "Lead management"}
            </h4>
            <p style={{ fontSize: "0.9rem", color: "#6B7280", textAlign: "center", lineHeight: "1.5", transition: "all 0.3s ease" }}>
              {lang === "es" ? "Captura leads y automatiza el seguimiento y notificaciones" : "Capture leads and automate follow-up and notifications"}
            </p>
          </div>
          <div 
            className="use-case-card"
            style={{ 
              padding: "1.5rem", 
              background: "white", 
              borderRadius: "8px", 
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              border: "1px solid rgba(0,0,0,0.05)",
              cursor: "pointer",
              transition: "all 0.3s ease",
              transform: "translateY(0)"
            }}
          >
            <div style={{ fontSize: "1.5rem", color: "#F97B72", marginBottom: "0.5rem", textAlign: "center", transition: "all 0.3s ease" }}>
              <FaCogs />
            </div>
            <h4 style={{ fontWeight: "600", marginBottom: "0.5rem", textAlign: "center", color: "#2B2B2B", transition: "all 0.3s ease" }}>
              {lang === "es" ? "Procesamiento de pedidos" : "Order processing"}
            </h4>
            <p style={{ fontSize: "0.9rem", color: "#6B7280", textAlign: "center", lineHeight: "1.5", transition: "all 0.3s ease" }}>
              {lang === "es" ? "Automatiza el cumplimiento de pedidos y gestión de inventario" : "Automate order fulfillment and inventory management"}
            </p>
          </div>
        </div>
        <style>{`
          .use-case-card:hover {
            transform: translateY(-8px) !important;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
            border-color: rgba(249, 123, 114, 0.3) !important;
          }
          .use-case-card:hover > div:first-child {
            transform: scale(1.1);
            color: #ff6b6b !important;
          }
          .use-case-card:hover h4 {
            color: #F97B72 !important;
          }
        `}</style>
      </div>
    </section>

      <ServiceContainer>
        {/* Call to Action */}
        <ProfessionalCard style={{ 
          background: "#f8f9fa",
          textAlign: "center"
        }}>
          <h3 style={{ 
            fontSize: "1.5rem", 
            fontWeight: "600", 
            marginBottom: "1rem",
            color: "#2B2B2B"
          }}>
            {lang === "es" 
              ? "¿Listo para automatizar tu negocio?" 
              : "Ready to automate your business?"
            }
          </h3>
          <p style={{ 
            fontSize: "1.1rem", 
            color: "#6B7280",
            marginBottom: "2rem"
          }}>
            {lang === "es"
              ? "Con n8n, tu equipo se enfoca en lo que realmente importa y tu negocio escala con procesos inteligentes y confiables."
              : "With n8n, your team focuses on what really matters and your business scales with smart, reliable processes."
            }
          </p>
        </ProfessionalCard>

        <ServicesCallToAction />
      </ServiceContainer>
    </>
  );
};

export default N8nAutomation; 