import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import Head from "next/head";
import {
  FaCode,
  FaMobileAlt,
  FaDesktop,
  FaRocket,
  FaPalette,
  FaCogs,
  FaUsers,
  FaCheckCircle,
  FaArrowRight,
  FaLaptopCode,
  FaTabletAlt,
  FaMobile,
} from "react-icons/fa";
import CallToActionBlock from "../../src/components/CallToAction/CallToAction";

const FrontEnd = () => {
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
      { threshold: 0.1 },
    );

    const items = document.querySelectorAll(".animate");
    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  const technologies = [
    { name: "React", color: "#61DAFB" },
    { name: "Vue", color: "#4FC08D" },
    { name: "Angular", color: "#DD0031" },
    { name: "Svelte", color: "#FF3E00" },
    { name: "Next.js", color: "#000000" },
    { name: "Astro", color: "#FF5D01" },
  ];

  const devices = [
    { icon: <FaDesktop />, name: lang === "es" ? "Desktop" : "Desktop" },
    { icon: <FaTabletAlt />, name: lang === "es" ? "Tablet" : "Tablet" },
    { icon: <FaMobile />, name: lang === "es" ? "Mobile" : "Mobile" },
  ];

  return (
    <>
      <Head>
        <title>Frontend - OpenGateHub</title>
        <meta name="description" content={t("frontend.description")} />
        <meta
          name="keywords"
          content="Frontend, Responsive Design, React, Modern Frameworks, Web Development"
        />
        <meta name="author" content="OpenGateHub" />
      </Head>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate { opacity: 0; transform: translateY(30px); transition: all 0.8s ease; }
        .visible { opacity: 1 !important; transform: translateY(0) !important; }
        .float-animation { animation: float 3s ease-in-out infinite; }
        .pulse-animation { animation: pulse 2s ease-in-out infinite; }
        .tech-badge {
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .tech-badge:hover {
          transform: translateY(-5px) scale(1.1);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        .device-card {
          transition: all 0.3s ease;
        }
        .device-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 40px rgba(35, 41, 70, 0.15);
        }
      `}</style>

      {/* HERO SECTION - Split Layout */}
      <section
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          background: "linear-gradient(135deg, #4a5568 0%, #2d3748 100%)",
          color: "white",
          position: "relative",
          overflow: "hidden",
          marginTop: "1rem",
          "@media (max-width: 768px)": {
            marginTop: "2rem",
          },
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
              'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>\')',
            opacity: 0.3,
          }}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4rem",
            maxWidth: 1200,
            margin: "0 auto",
            padding: "2rem",
            alignItems: "center",
          }}
        >
          {/* Left Side - Text */}
          <div className="animate" style={{ animationDelay: "0.1s" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                background: "rgba(249, 123, 114, 0.2)",
                padding: "12px 20px",
                borderRadius: "50px",
                marginBottom: "24px",
                backdropFilter: "blur(10px)",
              }}
            >
              <FaCode style={{ fontSize: 20, color: "#F97B72" }} />
              <span
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  color: "#F97B72",
                }}
              >
                Frontend Development
              </span>
            </div>

            <h1
              style={{
                fontSize: "3rem",
                fontWeight: 800,
                marginBottom: "20px",
                lineHeight: 1.1,
                color: "white",
              }}
            >
              {lang === "es"
                ? "Construimos experiencias digitales que cautivan"
                : "We build digital experiences that captivate"}
            </h1>

            <p
              style={{
                fontSize: "1.2rem",
                opacity: 0.9,
                marginBottom: "24px",
                lineHeight: 1.6,
              }}
            >
              {lang === "es"
                ? "Desarrollamos interfaces modernas, responsivas y accesibles que convierten visitantes en clientes."
                : "We develop modern, responsive, and accessible interfaces that turn visitors into customers."}
            </p>

            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(255,255,255,0.1)",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  backdropFilter: "blur(10px)",
                }}
              >
                <FaCheckCircle style={{ fontSize: 16, color: "#4ade80" }} />
                <span style={{ fontSize: "0.9rem" }}>Responsive</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(255,255,255,0.1)",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  backdropFilter: "blur(10px)",
                }}
              >
                <FaCheckCircle style={{ fontSize: 16, color: "#4ade80" }} />
                <span style={{ fontSize: "0.9rem" }}>Modern</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(255,255,255,0.1)",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  backdropFilter: "blur(10px)",
                }}
              >
                <FaCheckCircle style={{ fontSize: 16, color: "#4ade80" }} />
                <span style={{ fontSize: "0.9rem" }}>Fast</span>
              </div>
            </div>
          </div>

          {/* Right Side - Visual Elements */}
          <div
            className="animate"
            style={{ animationDelay: "0.3s", textAlign: "center" }}
          >
            <div
              style={{
                position: "relative",
                display: "inline-block",
              }}
            >
              {/* Main Device */}
              <div
                style={{
                  width: 300,
                  height: 200,
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "20px",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                  position: "relative",
                }}
              >
                <FaDesktop style={{ fontSize: 60, opacity: 0.8 }} />
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    width: "12px",
                    height: "12px",
                    background: "#ff6b6b",
                    borderRadius: "50%",
                    animation: "pulse 2s infinite",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: "30px",
                    width: "12px",
                    height: "12px",
                    background: "#ffd93d",
                    borderRadius: "50%",
                    animation: "pulse 2s infinite 0.5s",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: "50px",
                    width: "12px",
                    height: "12px",
                    background: "#6bcf7f",
                    borderRadius: "50%",
                    animation: "pulse 2s infinite 1s",
                  }}
                />
              </div>

              {/* Floating Elements */}
              <div
                style={{
                  position: "absolute",
                  top: "-20px",
                  right: "-20px",
                  width: 80,
                  height: 80,
                  background: "rgba(249, 123, 114, 0.2)",
                  borderRadius: "50%",
                  backdropFilter: "blur(10px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "float 3s ease-in-out infinite",
                }}
              >
                <FaMobileAlt style={{ fontSize: 30, color: "#F97B72" }} />
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: "-20px",
                  left: "-20px",
                  width: 60,
                  height: 60,
                  background: "rgba(249, 123, 114, 0.2)",
                  borderRadius: "50%",
                  backdropFilter: "blur(10px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "float 3s ease-in-out infinite 1.5s",
                }}
              >
                <FaTabletAlt style={{ fontSize: 25, color: "#F97B72" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TECHNOLOGIES SECTION */}
      <section
        style={{
          padding: "5rem 2rem",
          background: "#f8fafc",
          textAlign: "center",
        }}
      >
        <div
          className="animate"
          style={{ maxWidth: 800, margin: "0 auto", marginBottom: "3rem" }}
        >
          <h2
            style={{
              fontSize: "2.5rem",
              fontWeight: 700,
              marginBottom: "16px",
              color: "#1e293b",
            }}
          >
            {lang === "es"
              ? "Tecnologías que dominamos"
              : "Technologies we master"}
          </h2>
          <p
            style={{
              fontSize: "1.1rem",
              color: "#64748b",
              lineHeight: 1.6,
            }}
          >
            {lang === "es"
              ? "Utilizamos las herramientas más modernas y confiables del mercado"
              : "We use the most modern and reliable tools in the market"}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "1.5rem",
            maxWidth: 900,
            margin: "0 auto",
          }}
        >
          {technologies.map((tech, index) => (
            <div
              key={tech.name}
              className="animate tech-badge"
              style={{
                background: "white",
                padding: "1.5rem 2rem",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                border: `2px solid ${tech.color}20`,
                animationDelay: `${0.2 + index * 0.1}s`,
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: tech.color,
                  marginBottom: "8px",
                }}
              >
                {tech.name}
              </div>
              <div
                style={{
                  width: "40px",
                  height: "4px",
                  background: tech.color,
                  borderRadius: "2px",
                  margin: "0 auto",
                }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* RESPONSIVE DESIGN SECTION */}
      <section
        style={{
          padding: "5rem 2rem",
          background: "white",
          textAlign: "center",
        }}
      >
        <div
          className="animate"
          style={{ maxWidth: 800, margin: "0 auto", marginBottom: "4rem" }}
        >
          <h2
            style={{
              fontSize: "2.5rem",
              fontWeight: 700,
              marginBottom: "16px",
              color: "#1e293b",
            }}
          >
            {lang === "es"
              ? "Diseño responsivo perfecto"
              : "Perfect responsive design"}
          </h2>
          <p
            style={{
              fontSize: "1.1rem",
              color: "#64748b",
              lineHeight: 1.6,
            }}
          >
            {lang === "es"
              ? "Tu sitio se ve perfecto en cualquier dispositivo"
              : "Your site looks perfect on any device"}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "3rem",
            flexWrap: "wrap",
            maxWidth: 800,
            margin: "0 auto",
          }}
        >
          {devices.map((device, index) => (
            <div
              key={device.name}
              className="animate device-card"
              style={{
                background: "linear-gradient(135deg, #4a5568 0%, #2d3748 100%)",
                color: "white",
                padding: "2.5rem 2rem",
                borderRadius: "20px",
                minWidth: 200,
                textAlign: "center",
                animationDelay: `${0.3 + index * 0.2}s`,
              }}
            >
              <div
                style={{
                  fontSize: "3rem",
                  marginBottom: "16px",
                  opacity: 0.9,
                }}
              >
                {device.icon}
              </div>
              <div
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  marginBottom: "8px",
                }}
              >
                {device.name}
              </div>
              <div
                style={{
                  fontSize: "0.9rem",
                  opacity: 0.8,
                }}
              >
                {lang === "es" ? "Optimizado" : "Optimized"}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROCESS SECTION */}
      <section
        style={{
          padding: "5rem 2rem",
          background: "#f8fafc",
        }}
      >
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div
            className="animate"
            style={{ textAlign: "center", marginBottom: "4rem" }}
          >
            <h2
              style={{
                fontSize: "2.5rem",
                fontWeight: 700,
                marginBottom: "16px",
                color: "#1e293b",
              }}
            >
              {lang === "es" ? "Nuestro proceso" : "Our process"}
            </h2>
            <p
              style={{
                fontSize: "1.1rem",
                color: "#64748b",
                lineHeight: 1.6,
              }}
            >
              {lang === "es"
                ? "Cómo transformamos tu idea en una experiencia digital"
                : "How we transform your idea into a digital experience"}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "2rem",
            }}
          >
            {[
              {
                icon: <FaPalette />,
                title: lang === "es" ? "Diseño" : "Design",
                description:
                  lang === "es"
                    ? "Creamos wireframes y prototipos visuales"
                    : "We create wireframes and visual prototypes",
              },
              {
                icon: <FaCode />,
                title: lang === "es" ? "Desarrollo" : "Development",
                description:
                  lang === "es"
                    ? "Codificamos con las mejores prácticas"
                    : "We code with best practices",
              },
              {
                icon: <FaCogs />,
                title: lang === "es" ? "Optimización" : "Optimization",
                description:
                  lang === "es"
                    ? "Mejoramos performance y accesibilidad"
                    : "We improve performance and accessibility",
              },
              {
                icon: <FaRocket />,
                title: lang === "es" ? "Lanzamiento" : "Launch",
                description:
                  lang === "es"
                    ? "Desplegamos y monitoreamos"
                    : "We deploy and monitor",
              },
            ].map((step, index) => (
              <div
                key={step.title}
                className="animate"
                style={{
                  background: "white",
                  padding: "2.5rem 2rem",
                  borderRadius: "20px",
                  textAlign: "center",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  animationDelay: `${0.4 + index * 0.1}s`,
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 80,
                    height: 80,
                    background:
                      "linear-gradient(135deg, #F97B72 0%, #e85d64 100%)",
                    borderRadius: "50%",
                    marginBottom: "20px",
                    color: "white",
                    fontSize: "2rem",
                  }}
                >
                  {step.icon}
                </div>
                <h3
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: 600,
                    marginBottom: "12px",
                    color: "#1e293b",
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    color: "#64748b",
                    lineHeight: 1.6,
                  }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section
        style={{
          padding: "5rem 2rem",
          background: "#fff",
          color: "#232946",
          textAlign: "center",
        }}
      >
        <div className="animate" style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "2.5rem",
              fontWeight: 700,
              marginBottom: "20px",
              color: "#232946",
            }}
          >
            {lang === "es"
              ? "¿Listo para crear algo increíble?"
              : "Ready to create something amazing?"}
          </h2>
          <p
            style={{
              fontSize: "1.2rem",
              color: "#64748b",
              marginBottom: "2rem",
              lineHeight: 1.6,
            }}
          >
            {lang === "es"
              ? "Hablemos de tu proyecto frontend y construyamos juntos la experiencia digital que tu negocio merece."
              : "Let's talk about your frontend project and build together the digital experience your business deserves."}
          </p>
          <CallToActionBlock
            title={
              lang === "es" ? "¡Iniciá tu proyecto!" : "Start your project!"
            }
            description={
              lang === "es"
                ? "Descubrí cómo podemos transformar tu idea en una experiencia digital."
                : "Discover how we can transform your idea into a digital experience."
            }
            buttonText={
              lang === "es" ? "Quiero saber más" : "I want to know more"
            }
            highlightWord="your"
          />
        </div>
      </section>
    </>
  );
};

export default FrontEnd;
