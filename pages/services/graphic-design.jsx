import React from "react";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import Head from "next/head";
import { FaPalette, FaEye, FaBrush, FaLayerGroup, FaCheckCircle, FaRocket, FaUsers, FaStar, FaPaintBrush, FaImage, FaPenNib, FaMagic, FaArrowRight } from "react-icons/fa";
import CallToActionBlock from "../../src/components/CallToAction/CallToAction";

const GraphicDesign = () => {
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

  const services = [
    {
      icon: <FaBrush />,
      title: lang === "es" ? "Branding" : "Branding",
      desc: lang === "es" ? "Identidad visual completa y memorable" : "Complete and memorable visual identity"
    },
    {
      icon: <FaImage />,
      title: lang === "es" ? "Diseño Digital" : "Digital Design",
      desc: lang === "es" ? "Gráficos para web, apps y redes sociales" : "Graphics for web, apps and social media"
    },
    {
      icon: <FaPenNib />,
      title: lang === "es" ? "Ilustración" : "Illustration",
      desc: lang === "es" ? "Ilustraciones únicas y personalizadas" : "Unique and personalized illustrations"
    },
    {
      icon: <FaLayerGroup />,
      title: lang === "es" ? "Material Impreso" : "Print Material",
      desc: lang === "es" ? "Folletos, tarjetas y material promocional" : "Brochures, cards and promotional material"
    }
  ];

  const process = [
    {
      icon: <FaEye />,
      title: lang === "es" ? "Descubrimiento" : "Discovery",
      desc: lang === "es" ? "Entendemos tu marca y objetivos" : "We understand your brand and goals"
    },
    {
      icon: <FaPalette />,
      title: lang === "es" ? "Conceptualización" : "Conceptualization",
      desc: lang === "es" ? "Desarrollamos conceptos creativos" : "We develop creative concepts"
    },
    {
      icon: <FaPaintBrush />,
      title: lang === "es" ? "Creación" : "Creation",
      desc: lang === "es" ? "Diseñamos con pasión y precisión" : "We design with passion and precision"
    },
    {
      icon: <FaCheckCircle />,
      title: lang === "es" ? "Entrega" : "Delivery",
      desc: lang === "es" ? "Archivos listos para usar" : "Files ready to use"
    }
  ];

  const colors = [
    { color: "#FF6B6B", name: "Coral" },
    { color: "#4ECDC4", name: "Turquoise" },
    { color: "#45B7D1", name: "Blue" },
    { color: "#96CEB4", name: "Mint" },
    { color: "#FFEAA7", name: "Yellow" },
    { color: "#DDA0DD", name: "Purple" }
  ];

  return (
    <>
      <Head>
        <title>Graphic Design - OpenGateHub</title>
        <meta name="description" content={t("graphicDesign.description")} />
        <meta
          name="keywords"
          content="Graphic Design, Branding, Visual Identity, Professional Graphics, Digital Campaigns"
        />
        <meta name="author" content="OpenGateHub" />
      </Head>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
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
        .service-card {
          transition: all 0.3s ease;
        }
        .service-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 12px 40px rgba(0,0,0,0.15);
        }
        .color-palette {
          transition: all 0.3s ease;
        }
        .color-palette:hover {
          transform: scale(1.1);
          box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        }
        /* Ensure navigation is always on top */
        nav {
          position: relative !important;
          z-index: 10000 !important;
        }
      `}</style>

      {/* HERO SECTION */}
      <section style={{ 
        minHeight: "50vh", 
        display: "flex", 
        alignItems: "center", 
        background: "linear-gradient(135deg, #5a6c7d 0%, #3d4a5a 100%)",
        color: "white",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><pattern id=\"circles\" width=\"20\" height=\"20\" patternUnits=\"userSpaceOnUse\"><circle cx=\"10\" cy=\"10\" r=\"2\" fill=\"rgba(255,255,255,0.1)\"/></pattern></defs><rect width=\"100\" height=\"100\" fill=\"url(%23circles)\"/></svg>')",
          opacity: 0.4
        }} />
        
        <div style={{ 
          maxWidth: 900, 
          margin: "0 auto", 
          padding: "2rem",
          textAlign: "center"
        }}>
          <div className="animate" style={{ animationDelay: "0.1s" }}>
            <div style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "12px",
              background: "rgba(255,255,255,0.1)",
              padding: "10px 18px",
              borderRadius: "50px",
              marginBottom: "20px",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.2)"
            }}>
              <FaPalette style={{ fontSize: 18, color: "#F97B72" }} />
              <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>Graphic Design</span>
            </div>
            
            <h1 style={{ 
              fontSize: "3rem", 
              fontWeight: 800, 
              marginBottom: "20px",
              lineHeight: 1.1,
              color: "white"
            }}>
              {lang === "es" ? "Diseño que inspira" : "Design that inspires"}
            </h1>
            
            <p style={{ 
              fontSize: "1.2rem", 
              opacity: 0.9, 
              marginBottom: "24px",
              lineHeight: 1.6,
              maxWidth: 600,
              margin: "0 auto 24px auto"
            }}>
              {lang === "es" 
                ? "Creamos experiencias visuales únicas que cuentan tu historia y conectan con tu audiencia."
                : "We create unique visual experiences that tell your story and connect with your audience."
              }
            </p>

            <div style={{ 
              display: "flex", 
              justifyContent: "center", 
              gap: "1.5rem",
              flexWrap: "wrap"
            }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "8px",
                background: "rgba(255,255,255,0.2)",
                padding: "10px 18px",
                borderRadius: "25px",
                backdropFilter: "blur(10px)"
              }}>
                <FaCheckCircle style={{ fontSize: 16, color: "#4ade80" }} />
                <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>Creative</span>
              </div>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "8px",
                background: "rgba(255,255,255,0.2)",
                padding: "10px 18px",
                borderRadius: "25px",
                backdropFilter: "blur(10px)"
              }}>
                <FaCheckCircle style={{ fontSize: 16, color: "#4ade80" }} />
                <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>Professional</span>
              </div>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "8px",
                background: "rgba(255,255,255,0.2)",
                padding: "10px 18px",
                borderRadius: "25px",
                backdropFilter: "blur(10px)"
              }}>
                <FaCheckCircle style={{ fontSize: 16, color: "#4ade80" }} />
                <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>Unique</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES & PROCESS COMBINED */}
      <section style={{ 
        padding: "3rem 2rem", 
        background: "#f8fafc"
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="animate" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <h2 style={{ 
              fontSize: "2rem", 
              fontWeight: 700, 
              marginBottom: "12px",
              color: "#1e293b"
            }}>
              {lang === "es" ? "Nuestros servicios" : "Our services"}
            </h2>
            <p style={{ 
              fontSize: "1rem", 
              color: "#64748b",
              lineHeight: 1.6
            }}>
              {lang === "es" 
                ? "Cada diseño es una obra de arte única que refleja tu identidad"
                : "Every design is a unique work of art that reflects your identity"
              }
            </p>
          </div>

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
            gap: "1.5rem",
            marginBottom: "3rem"
          }}>
            {services.map((service, index) => (
              <div key={service.title} className="animate service-card" style={{
                background: "white",
                padding: "2rem 1.5rem",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                textAlign: "center",
                animationDelay: `${0.2 + index * 0.1}s`,
                position: "relative",
                overflow: "hidden"
              }}>
                <div style={{
                  position: "absolute",
                  top: "15px",
                  right: "15px",
                  width: "20px",
                  height: "20px",
                  background: "linear-gradient(135deg, #F97B72 0%, #e85d64 100%)",
                  borderRadius: "50%",
                  opacity: 0.6,
                  animation: "pulse 2s ease-in-out infinite"
                }} />
                <div style={{ 
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 70,
                  height: 70,
                  background: "linear-gradient(135deg, #F97B72 0%, #e85d64 100%)",
                  borderRadius: "50%",
                  marginBottom: "16px",
                  color: "white",
                  fontSize: "2rem",
                  boxShadow: "0 6px 20px rgba(249, 123, 114, 0.3)"
                }}>
                  {service.icon}
                </div>
                <h3 style={{ 
                  fontSize: "1.2rem", 
                  fontWeight: 600, 
                  marginBottom: "8px",
                  color: "#1e293b"
                }}>
                  {service.title}
                </h3>
                <p style={{ 
                  color: "#64748b",
                  lineHeight: 1.5,
                  fontSize: "0.95rem"
                }}>
                  {service.desc}
                </p>
              </div>
            ))}
          </div>

          {/* PROCESS - COMPACT VERSION */}
          <div className="animate" style={{ textAlign: "center", marginBottom: "2rem", animationDelay: "0.4s" }}>
            <h2 style={{ 
              fontSize: "2rem", 
              fontWeight: 700, 
              marginBottom: "12px",
              color: "#1e293b"
            }}>
              {lang === "es" ? "Proceso creativo" : "Creative process"}
            </h2>
            <p style={{ 
              fontSize: "1rem", 
              color: "#64748b",
              lineHeight: 1.6
            }}>
              {lang === "es" 
                ? "Cómo transformamos tu visión en realidad"
                : "How we transform your vision into reality"
              }
            </p>
          </div>

          <div style={{ 
            display: "flex", 
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "1rem"
          }}>
            {process.map((step, index) => (
              <React.Fragment key={step.title}>
                <div className="animate service-card" style={{
                  background: "white",
                  padding: "1.5rem",
                  borderRadius: "16px",
                  textAlign: "center",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  animationDelay: `${0.5 + index * 0.1}s`,
                  width: "220px",
                  height: "180px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}>
                  <div style={{ 
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 60,
                    height: 60,
                    background: "linear-gradient(135deg, #F97B72 0%, #e85d64 100%)",
                    borderRadius: "50%",
                    marginBottom: "12px",
                    color: "white",
                    fontSize: "1.5rem",
                    margin: "0 auto 12px auto"
                  }}>
                    {step.icon}
                  </div>
                  <h3 style={{ 
                    fontSize: "1.1rem", 
                    fontWeight: 600, 
                    marginBottom: "6px",
                    color: "#1e293b"
                  }}>
                    {step.title}
                  </h3>
                  <p style={{ 
                    color: "#64748b",
                    lineHeight: 1.4,
                    fontSize: "0.9rem"
                  }}>
                    {step.desc}
                  </p>
                </div>
                
                {index < process.length - 1 && (
                  <div className="animate" style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#F97B72",
                    fontSize: "1.5rem",
                    animationDelay: `${0.6 + index * 0.1}s`,
                    margin: "0 0.5rem"
                  }}>
                    <FaArrowRight />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* BRAND COLORS - KEEPING THIS ONE AS YOU LOVE IT */}
      <section style={{ 
        padding: "3rem 2rem", 
        background: "linear-gradient(135deg, #5a6c7d 0%, #3d4a5a 100%)",
        color: "white",
        textAlign: "center"
      }}>
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><pattern id=\"circles\" width=\"20\" height=\"20\" patternUnits=\"userSpaceOnUse\"><circle cx=\"10\" cy=\"10\" r=\"2\" fill=\"rgba(255,255,255,0.1)\"/></pattern></defs><rect width=\"100\" height=\"100\" fill=\"url(%23circles)\"/></svg>')",
          opacity: 0.3
        }} />
        
        <div className="animate" style={{ maxWidth: 800, margin: "0 auto", marginBottom: "2.5rem", position: "relative", zIndex: 1 }}>
          <h2 style={{ 
            fontSize: "2rem", 
            fontWeight: 700, 
            marginBottom: "12px"
          }}>
            {lang === "es" ? "Colores que cuentan historias" : "Colors that tell stories"}
          </h2>
          <p style={{ 
            fontSize: "1rem", 
            opacity: 0.9,
            lineHeight: 1.6
          }}>
            {lang === "es" 
              ? "Creamos paletas únicas que reflejan la personalidad de tu marca"
              : "We create unique palettes that reflect your brand's personality"
            }
          </p>
        </div>

        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          gap: "1.5rem",
          flexWrap: "wrap",
          maxWidth: 800,
          margin: "0 auto",
          position: "relative",
          zIndex: 1
        }}>
          {colors.map((color, index) => (
            <div key={color.name} className="animate color-palette" style={{
              width: 80,
              height: 80,
              background: color.color,
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 600,
              fontSize: "0.9rem",
              animationDelay: `${0.3 + index * 0.1}s`,
              boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
              border: "2px solid rgba(255,255,255,0.2)"
            }}>
              {color.name}
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIAL & CTA COMBINED */}
      <section style={{ 
        padding: "3rem 2rem", 
        background: "white"
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div className="animate" style={{ 
            textAlign: "center",
            marginBottom: "2rem",
            animationDelay: "0.6s"
          }}>
            <div style={{ fontSize: "2rem", marginBottom: "16px", color: "#F97B72" }}>
              <FaStar />
            </div>
            <p style={{ 
              fontSize: "1.1rem", 
              fontStyle: "italic",
              marginBottom: "16px",
              lineHeight: 1.6,
              color: "#1e293b"
            }}>
              {lang === "es" 
                ? "Trabajé con OGH en el rediseño de mi marca y quedé impresionada. No solo entendieron mi visión, sino que la superaron. El logo y la paleta de colores que crearon son exactamente lo que necesitaba para destacar en mi industria."
                : "I worked with OGH on my brand redesign and was blown away. They not only understood my vision but exceeded it. The logo and color palette they created are exactly what I needed to stand out in my industry."
              }
            </p>
            <div style={{ fontWeight: 600, fontSize: "1rem", color: "#F97B72" }}>
              {lang === "es" ? "— Laura Martínez, CEO de TechFlow" : "— Jennifer Rodriguez, CEO of TechFlow"}
            </div>
          </div>

          <div className="animate" style={{ textAlign: "center", animationDelay: "0.7s" }}>
            <h2 style={{ 
              fontSize: "2rem", 
              fontWeight: 700, 
              marginBottom: "16px",
              color: "#232946"
            }}>
              {lang === "es" ? "¿Listo para crear algo increíble?" : "Ready to create something amazing?"}
            </h2>
            <p style={{ 
              fontSize: "1.1rem", 
              color: "#64748b",
              marginBottom: "1.5rem",
              lineHeight: 1.6
            }}>
              {lang === "es" 
                ? "Hablemos de tu proyecto de diseño y creemos juntos algo que destaque."
                : "Let's talk about your design project and create something that stands out together."
              }
            </p>
            <CallToActionBlock
              title={lang === "es" ? "¡Diseñemos algo que destaque!" : "Let's design something that stands out!"}
              description={lang === "es" ? "Descubrí cómo podemos transformar tu idea en un diseño increíble." : "Discover how we can transform your idea into an amazing design."}
              buttonText={lang === "es" ? "Quiero saber más" : "I want to know more"}
              highlightWord="stands"
            />
          </div>
        </div>
      </section>
    </>
  );
};

export default GraphicDesign;
