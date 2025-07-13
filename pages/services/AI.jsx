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
  FaBrain,
  FaCogs, 
  FaChartLine,
  FaRobot,
  FaLightbulb,
  FaShieldAlt,
  FaRocket,
  FaUsers,
  FaSyncAlt,
  FaProjectDiagram
} from "react-icons/fa";
import React from "react";

// Componentes visuales mejorados (mismo estilo que n8n)
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
      highlightWord="Innovate"
    />
  );
};

const fadeInUpStyle = {
  opacity: 0,
  transform: "translateY(20px)",
  animation: "fadeInUp 0.7s forwards"
};

const aiSolutions = () => {
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
      { threshold: 0.1 }
    );
    const items = document.querySelectorAll(".animate");
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Head>
        <title>AI Solutions - OpenGateHub</title>
        <meta name="description" content={t("aiSolutions.description")} />
        <meta
          name="keywords"
          content="AI, Artificial Intelligence, Machine Learning, Automation, Business Intelligence, Data Analytics"
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
      `}</style>

      {/* Hero Section - Full Width */}
      <section style={{ 
        background: "linear-gradient(135deg, #5a6c7d 0%, #3d4a5a 100%)",
        padding: "3rem 2rem",
        marginTop: "1rem",
        marginBottom: "2rem",
        textAlign: "center",
        color: "white",
        position: "relative",
        overflow: "hidden"
      }}>
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
          }}
        />
        <div style={{ position: "relative", zIndex: 2, maxWidth: 1200, margin: "0 auto" }}>
          <div className="animate" style={{ 
            fontSize: "4rem", 
            marginBottom: "1rem", 
            animationDelay: "0.05s",
            color: "#F97B72",
            textShadow: "0 0 15px rgba(249, 123, 114, 0.4)",
            animation: "brainPulse 3s ease-in-out infinite"
          }}>
            <FaBrain />
          </div>
          <style>{`
            @keyframes brainPulse {
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
          <h1 className="animate" style={{ fontSize: "2.5rem", fontWeight: "700", marginBottom: "1rem", animationDelay: "0.1s" }}>
            AI Solutions
          </h1>
          <p className="animate" style={{ fontSize: "1.2rem", opacity: 0.9, maxWidth: "600px", margin: "0 auto", animationDelay: "0.15s" }}>
            {lang === "es" 
              ? "Potenciá tu negocio con inteligencia artificial"
              : "Power your business with artificial intelligence"
            }
          </p>
        </div>
      </section>

      {/* Main Content - Full Width */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 2rem" }}>
        {/* Main Description */}
        <div className="animate" style={{ position: "relative", padding: "2rem", marginBottom: "2rem", borderRadius: "12px", overflow: "hidden", animationDelay: "0.2s" }}>
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
            <SectionTitle>{lang === "es" ? "¿Qué es la IA?" : "What is AI?"}</SectionTitle>
            <Subtitle>{t("aiSolutions.description")}</Subtitle>
          </div>
        </div>

        {/* Business Challenges Section */}
        <ProfessionalCard className="animate" style={{ animationDelay: "0.25s" }}>
          <SectionTitle>{lang === "es" ? "¿Te identificás con estos desafíos?" : "Do you face these challenges?"}</SectionTitle>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1.5rem", marginBottom: "1rem" }}>
            {/* Cada card de desafío */}
            <div className="animate" style={{ 
              padding: "1.5rem", 
              background: "#FEF2F2", 
              borderRadius: "8px", 
              border: "1px solid #FECACA", 
              animationDelay: "0.3s",
              minWidth: "240px",
              maxWidth: "280px",
              flex: "1 1 240px"
            }}>
              <div style={{ fontSize: "2rem", color: "#F97B72", marginBottom: "0.5rem" }}><FaCogs /></div>
              <h4 style={{ fontWeight: "600", marginBottom: "0.5rem", color: "#2B2B2B" }}>{lang === "es" ? "Procesos manuales" : "Manual processes"}</h4>
              <p style={{ fontSize: "0.95rem", color: "#6B7280", lineHeight: "1.5" }}>{lang === "es" ? "¿Te cuesta automatizar procesos y analizar datos de manera efectiva?" : "Do you find it challenging to automate processes and analyze data effectively?"}</p>
            </div>
            <div className="animate" style={{ 
              padding: "1.5rem", 
              background: "#FEF2F2", 
              borderRadius: "8px", 
              border: "1px solid #FECACA", 
              animationDelay: "0.35s",
              minWidth: "240px",
              maxWidth: "280px",
              flex: "1 1 240px"
            }}>
              <div style={{ fontSize: "2rem", color: "#F97B72", marginBottom: "0.5rem" }}><FaBrain /></div>
              <h4 style={{ fontWeight: "600", marginBottom: "0.5rem", color: "#2B2B2B" }}>{lang === "es" ? "Falta de expertise" : "Lack of expertise"}</h4>
              <p style={{ fontSize: "0.95rem", color: "#6B7280", lineHeight: "1.5" }}>{lang === "es" ? "¿No tenés el conocimiento interno para implementar IA en tu negocio?" : "Do you lack the internal expertise to implement AI in your business?"}</p>
            </div>
            <div className="animate" style={{ 
              padding: "1.5rem", 
              background: "#FEF2F2", 
              borderRadius: "8px", 
              border: "1px solid #FECACA", 
              animationDelay: "0.4s",
              minWidth: "240px",
              maxWidth: "280px",
              flex: "1 1 240px"
            }}>
              <div style={{ fontSize: "2rem", color: "#F97B72", marginBottom: "0.5rem" }}><FaRocket /></div>
              <h4 style={{ fontWeight: "600", marginBottom: "0.5rem", color: "#2B2B2B" }}>{lang === "es" ? "Ventaja competitiva" : "Competitive edge"}</h4>
              <p style={{ fontSize: "0.95rem", color: "#6B7280", lineHeight: "1.5" }}>{lang === "es" ? "¿Tu negocio se está perdiendo la ventaja competitiva que puede brindar la IA?" : "Is your business missing out on the competitive edge AI can provide?"}</p>
            </div>
          </div>
          <div className="animate" style={{ padding: "1.5rem", background: "#F0F9FF", borderRadius: "8px", border: "1px solid #BAE6FD", marginTop: "1rem", animationDelay: "0.45s" }}>
            <p style={{ fontSize: "1.1rem", color: "#2B2B2B", lineHeight: "1.6", textAlign: "center", fontWeight: "500" }}>{lang === "es" ? "Como líder innovador, tenés el poder de superar estos desafíos y llevar tu negocio al futuro." : "As an innovative leader, you have the power to overcome these challenges and lead your business into the future."}</p>
          </div>
        </ProfessionalCard>

        {/* Key Benefits */}
        <SectionTitle className="animate" style={{ animationDelay: "0.5s" }}>{lang === "es" ? "¿Por qué elegir IA?" : "Why choose AI?"}</SectionTitle>
        <FeatureGrid>
          <FeatureCard className="animate" icon={<FaRobot />} title={lang === "es" ? "Automatización Inteligente" : "Smart Automation"} description={lang === "es" ? "Automatiza procesos complejos con IA que aprende y mejora" : "Automate complex processes with AI that learns and improves"} delay={1} />
          <FeatureCard className="animate" icon={<FaChartLine />} title={lang === "es" ? "Análisis Avanzado" : "Advanced Analytics"} description={lang === "es" ? "Extrae insights valiosos de tus datos con machine learning" : "Extract valuable insights from your data with machine learning"} delay={2} />
          <FeatureCard className="animate" icon={<FaBrain />} title={lang === "es" ? "IA Personalizada" : "Custom AI"} description={lang === "es" ? "Soluciones de IA adaptadas a tus necesidades específicas" : "AI solutions tailored to your specific needs"} delay={3} />
          <FeatureCard className="animate" icon={<FaLightbulb />} title={lang === "es" ? "Innovación" : "Innovation"} description={lang === "es" ? "Mantente a la vanguardia con las últimas tecnologías de IA" : "Stay ahead with the latest AI technologies"} delay={4} />
          <FeatureCard className="animate" icon={<FaShieldAlt />} title={lang === "es" ? "Seguridad" : "Security"} description={lang === "es" ? "IA segura y confiable para proteger tus datos" : "Secure and reliable AI to protect your data"} delay={5} />
          <FeatureCard className="animate" icon={<FaRocket />} title={lang === "es" ? "Escalabilidad" : "Scalability"} description={lang === "es" ? "Soluciones que crecen con tu negocio" : "Solutions that grow with your business"} delay={6} />
        </FeatureGrid>

        {/* How We Work Section */}
        <ProfessionalCard className="animate" style={{ textAlign: "center", padding: "2.5rem 1.5rem", animationDelay: "0.55s" }}>
          <SectionTitle>{lang === "es" ? "¿Cómo trabajamos con vos?" : "How do we work with you?"}</SectionTitle>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "stretch", width: "100%", minHeight: 220, margin: "0 auto" }}>
            {/* Línea vertical visible */}
            <div style={{ width: 6, minWidth: 6, background: "#F97B72", borderRadius: 3, height: "calc(100% - 32px)", marginTop: 16, marginBottom: 16, marginRight: 32, boxShadow: "0 0 8px 0 #f97b7233" }} />
            {/* Lista de pasos */}
            <ul style={{ listStyle: "none", padding: 0, margin: 0, textAlign: "left", width: "100%", maxWidth: 480 }}>
              <li className="animate" style={{ display: "flex", alignItems: "flex-start", marginBottom: "1.5rem", animationDelay: "0.6s" }}>
                <span style={{ color: "#F97B72", fontWeight: 700, fontSize: "1.3rem", minWidth: 28, display: "inline-block", textAlign: "center", marginRight: 18 }}>1.</span>
                <div>
                  <span style={{ fontWeight: 600, color: "#222", fontSize: "1.08rem" }}>{lang === "es" ? "Entendemos tus necesidades" : "Understand your needs"}</span>
                  <div style={{ color: "#6B7280", fontSize: "1rem", marginTop: 2 }}>{lang === "es" ? "Evaluamos tus objetivos de negocio e identificamos oportunidades de IA." : "We assess your business goals and identify AI opportunities."}</div>
                </div>
              </li>
              <li className="animate" style={{ display: "flex", alignItems: "flex-start", marginBottom: "1.5rem", animationDelay: "0.65s" }}>
                <span style={{ color: "#F97B72", fontWeight: 700, fontSize: "1.3rem", minWidth: 28, display: "inline-block", textAlign: "center", marginRight: 18 }}>2.</span>
                <div>
                  <span style={{ fontWeight: 600, color: "#222", fontSize: "1.08rem" }}>{lang === "es" ? "Diseñamos soluciones" : "Design solutions"}</span>
                  <div style={{ color: "#6B7280", fontSize: "1rem", marginTop: 2 }}>{lang === "es" ? "Creamos estrategias y modelos de IA adaptados a tus requerimientos." : "We create AI strategies and models tailored to your requirements."}</div>
                </div>
              </li>
              <li className="animate" style={{ display: "flex", alignItems: "flex-start", marginBottom: "1.5rem", animationDelay: "0.7s" }}>
                <span style={{ color: "#F97B72", fontWeight: 700, fontSize: "1.3rem", minWidth: 28, display: "inline-block", textAlign: "center", marginRight: 18 }}>3.</span>
                <div>
                  <span style={{ fontWeight: 600, color: "#222", fontSize: "1.08rem" }}>{lang === "es" ? "Colaboramos de cerca" : "Collaborate closely"}</span>
                  <div style={{ color: "#6B7280", fontSize: "1rem", marginTop: 2 }}>{lang === "es" ? "Refinamos soluciones basándonos en tu feedback y aseguramos integración perfecta." : "We refine solutions based on your feedback and ensure seamless integration."}</div>
                </div>
              </li>
              <li className="animate" style={{ display: "flex", alignItems: "flex-start", animationDelay: "0.75s" }}>
                <span style={{ color: "#F97B72", fontWeight: 700, fontSize: "1.3rem", minWidth: 28, display: "inline-block", textAlign: "center", marginRight: 18 }}>4.</span>
                <div>
                  <span style={{ fontWeight: 600, color: "#222", fontSize: "1.08rem" }}>{lang === "es" ? "Potenciamos tu negocio" : "Empower your business"}</span>
                  <div style={{ color: "#6B7280", fontSize: "1rem", marginTop: 2 }}>{lang === "es" ? "Entregamos herramientas impulsadas por IA que transforman tus operaciones." : "We deliver AI-driven tools that transform your operations."}</div>
                </div>
              </li>
            </ul>
          </div>
        </ProfessionalCard>
      </div>

      {/* Use Cases - Full Width Section */}
      <section className="animate" style={{ 
        background: "linear-gradient(135deg, #5a6c7d 0%, #3d4a5a 100%)",
        padding: "3rem 2rem",
        marginBottom: "2rem",
        textAlign: "center",
        color: "white",
        position: "relative",
        overflow: "hidden",
        animationDelay: "0.8s"
      }}>
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
          }}
        />
        <div style={{ position: "relative", zIndex: 2, maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ 
            fontSize: "2rem", 
            fontWeight: "700", 
            marginBottom: "1.5rem",
            color: "white"
          }}>
            {lang === "es" ? "Casos de uso de IA" : "AI use cases"}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
          <div 
            className="ai-use-case-card animate" 
            style={{ 
              padding: "1.5rem", 
              background: "white", 
              borderRadius: "8px", 
              border: "1px solid #E5E7EB", 
              animationDelay: "0.85s",
              cursor: "pointer",
              transition: "all 0.3s ease",
              transform: "translateY(0)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-8px)";
              e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
              e.currentTarget.style.borderColor = "rgba(249, 123, 114, 0.3)";
              e.currentTarget.querySelector("div").style.transform = "scale(1.1)";
              e.currentTarget.querySelector("div").style.color = "#ff6b6b";
              e.currentTarget.querySelector("h4").style.color = "#F97B72";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
              e.currentTarget.style.borderColor = "#E5E7EB";
              e.currentTarget.querySelector("div").style.transform = "scale(1)";
              e.currentTarget.querySelector("div").style.color = "#F97B72";
              e.currentTarget.querySelector("h4").style.color = "#2B2B2B";
            }}
          >
            <div style={{ fontSize: "2rem", color: "#F97B72", marginBottom: "1rem", textAlign: "center", transition: "all 0.3s ease" }}><FaUsers /></div>
            <h4 style={{ fontWeight: "600", marginBottom: "0.5rem", textAlign: "center", color: "#2B2B2B", transition: "all 0.3s ease" }}>{lang === "es" ? "Chatbots inteligentes" : "Smart chatbots"}</h4>
            <p style={{ fontSize: "0.95rem", color: "#6B7280", textAlign: "center", lineHeight: "1.5", transition: "all 0.3s ease" }}>{lang === "es" ? "Atención al cliente 24/7 con respuestas inteligentes y personalizadas" : "24/7 customer service with intelligent and personalized responses"}</p>
          </div>
          <div 
            className="ai-use-case-card animate" 
            style={{ 
              padding: "1.5rem", 
              background: "white", 
              borderRadius: "8px", 
              border: "1px solid #E5E7EB", 
              animationDelay: "0.9s",
              cursor: "pointer",
              transition: "all 0.3s ease",
              transform: "translateY(0)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-8px)";
              e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
              e.currentTarget.style.borderColor = "rgba(249, 123, 114, 0.3)";
              e.currentTarget.querySelector("div").style.transform = "scale(1.1)";
              e.currentTarget.querySelector("div").style.color = "#ff6b6b";
              e.currentTarget.querySelector("h4").style.color = "#F97B72";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
              e.currentTarget.style.borderColor = "#E5E7EB";
              e.currentTarget.querySelector("div").style.transform = "scale(1)";
              e.currentTarget.querySelector("div").style.color = "#F97B72";
              e.currentTarget.querySelector("h4").style.color = "#2B2B2B";
            }}
          >
            <div style={{ fontSize: "2rem", color: "#F97B72", marginBottom: "1rem", textAlign: "center", transition: "all 0.3s ease" }}><FaChartLine /></div>
            <h4 style={{ fontWeight: "600", marginBottom: "0.5rem", textAlign: "center", color: "#2B2B2B", transition: "all 0.3s ease" }}>{lang === "es" ? "Predicción de tendencias" : "Trend prediction"}</h4>
            <p style={{ fontSize: "0.95rem", color: "#6B7280", textAlign: "center", lineHeight: "1.5", transition: "all 0.3s ease" }}>{lang === "es" ? "Anticipa el comportamiento del mercado y las necesidades de los clientes" : "Anticipate market behavior and customer needs"}</p>
          </div>
          <div 
            className="ai-use-case-card animate" 
            style={{ 
              padding: "1.5rem", 
              background: "white", 
              borderRadius: "8px", 
              border: "1px solid #E5E7EB", 
              animationDelay: "0.95s",
              cursor: "pointer",
              transition: "all 0.3s ease",
              transform: "translateY(0)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-8px)";
              e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
              e.currentTarget.style.borderColor = "rgba(249, 123, 114, 0.3)";
              e.currentTarget.querySelector("div").style.transform = "scale(1.1)";
              e.currentTarget.querySelector("div").style.color = "#ff6b6b";
              e.currentTarget.querySelector("h4").style.color = "#F97B72";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
              e.currentTarget.style.borderColor = "#E5E7EB";
              e.currentTarget.querySelector("div").style.transform = "scale(1)";
              e.currentTarget.querySelector("div").style.color = "#F97B72";
              e.currentTarget.querySelector("h4").style.color = "#2B2B2B";
            }}
          >
            <div style={{ fontSize: "2rem", color: "#F97B72", marginBottom: "1rem", textAlign: "center", transition: "all 0.3s ease" }}><FaCogs /></div>
            <h4 style={{ fontWeight: "600", marginBottom: "0.5rem", textAlign: "center", color: "#2B2B2B", transition: "all 0.3s ease" }}>{lang === "es" ? "Optimización de procesos" : "Process optimization"}</h4>
            <p style={{ fontSize: "0.95rem", color: "#6B7280", textAlign: "center", lineHeight: "1.5", transition: "all 0.3s ease" }}>{lang === "es" ? "Mejora la eficiencia operativa con IA que optimiza automáticamente" : "Improve operational efficiency with AI that automatically optimizes"}</p>
          </div>
        </div>
      </div>
    </section>

      <ServiceContainer>
        {/* Call to Action */}
        <ProfessionalCard className="animate" style={{ background: "#FFF5F5", textAlign: "center", animationDelay: "1s" }}>
          <h3 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem", color: "#2B2B2B" }}>{lang === "es" ? "¿Listo para el futuro con IA?" : "Ready for the AI future?"}</h3>
          <p style={{ fontSize: "1.1rem", color: "#6B7280", marginBottom: "2rem" }}>{t("aiSolutions.vision")}</p>
        </ProfessionalCard>

        <div className="animate" style={{ animationDelay: "1.05s" }}>
        <ServicesCallToAction />
        </div>
      </ServiceContainer>
    </>
  );
};

export default aiSolutions;
