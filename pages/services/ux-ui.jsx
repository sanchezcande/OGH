import { useTranslation } from "react-i18next";
import Head from "next/head";
import {
  FaUserCheck,
  FaMobileAlt,
  FaExclamationTriangle,
  FaPaintBrush,
  FaUsers,
  FaEye,
  FaCheckCircle,
  FaArrowRight,
  FaRegSadTear,
  FaRegGrinStars,
  FaPalette,
  FaMousePointer,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import CallToActionBlock from "../../src/components/CallToAction/CallToAction";
import React from "react";
import useMediaQuery from "../../src/Hooks/useMediaQuery";

const problems = (lang) => [
  {
    icon: <FaExclamationTriangle />,
    text:
      lang === "es"
        ? "Tus usuarios se pierden o abandonan tu web/app."
        : "Users get lost or abandon your site/app.",
  },
  {
    icon: <FaPaintBrush />,
    text:
      lang === "es"
        ? "Tu diseño no refleja la calidad de tu negocio."
        : "Your design doesn't reflect your business quality.",
  },
  {
    icon: <FaEye />,
    text:
      lang === "es"
        ? "Recibís quejas sobre usabilidad o accesibilidad."
        : "You get complaints about usability or accessibility.",
  },
  {
    icon: <FaUsers />,
    text:
      lang === "es"
        ? "No lográs diferenciarte de la competencia."
        : "You can't stand out from the competition.",
  },
];

const solutions = (lang) => [
  {
    icon: <FaUserCheck />,
    text:
      lang === "es"
        ? "Análisis de experiencia real de usuario"
        : "Real user experience analysis",
  },
  {
    icon: <FaPaintBrush />,
    text:
      lang === "es"
        ? "Rediseño visual alineado a tu marca"
        : "Visual redesign aligned to your brand",
  },
  {
    icon: <FaMobileAlt />,
    text:
      lang === "es"
        ? "Optimización para todos los dispositivos"
        : "Optimization for all devices",
  },
  {
    icon: <FaCheckCircle />,
    text:
      lang === "es"
        ? "Accesibilidad y performance como prioridad"
        : "Accessibility and performance as a priority",
  },
  {
    icon: <FaUsers />,
    text:
      lang === "es"
        ? "Prototipos interactivos y test con usuarios"
        : "Interactive prototypes and user testing",
  },
];

const UxUi = () => {
  const { i18n } = useTranslation();
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

  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <>
      <Head>
        <title>UX/UI - OpenGateHub</title>
        <meta
          name="description"
          content={
            lang === "es"
              ? "Transformamos la manera en que tus clientes ven, usan y aman tu negocio."
              : "We transform how your clients see, use and love your business."
          }
        />
        <meta
          name="keywords"
          content="UX Design, UI Design, User Experience, Wireframes, Prototypes, Intuitive Interfaces"
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
        .card-hover { transition: all 0.3s ease; }
        .card-hover:hover { 
          box-shadow: 0 12px 40px rgba(35, 41, 70, 0.15) !important; 
          transform: translateY(-8px) scale(1.02); 
          z-index: 2; 
        }
        .hero-icon {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>

      {/* HERO */}
      <section
        style={{
          background: "#fff",
          color: "#232946",
          padding: "4rem 2rem 3rem 2rem",
          borderRadius: "0 0 32px 32px",
          marginBottom: "3rem",
          boxShadow: "0 2px 16px rgba(35, 41, 70, 0.06)",
        }}
      >
        <div
          className="animate"
          style={{
            maxWidth: 900,
            margin: "0 auto",
            textAlign: "center",
            animationDelay: "0.05s",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 80,
              height: 80,
              background: "linear-gradient(135deg, #F97B72 0%, #e85d64 100%)",
              borderRadius: "50%",
              marginBottom: 20,
              boxShadow: "0 8px 32px rgba(249, 123, 114, 0.3)",
            }}
          >
            <FaPalette
              className="hero-icon"
              style={{ fontSize: 32, color: "#fff" }}
            />
          </div>
          <h1
            style={{
              fontSize: "2.3rem",
              fontWeight: 800,
              marginBottom: 16,
              letterSpacing: -1,
              lineHeight: 1.2,
            }}
          >
            {lang === "es"
              ? "¿Tu experiencia digital está frenando tu crecimiento?"
              : "Is your digital experience holding you back?"}
          </h1>
          <p
            style={{
              fontSize: "1.2rem",
              opacity: 0.85,
              maxWidth: 650,
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            {lang === "es"
              ? "Transformamos la manera en que tus clientes ven, usan y aman tu negocio."
              : "We transform how your clients see, use and love your business."}
          </p>
        </div>
      </section>

      {/* PROBLEMAS */}
      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          marginBottom: "3rem",
          padding: "0 1rem",
        }}
      >
        <div
          className="animate"
          style={{
            fontWeight: 700,
            fontSize: "1.2rem",
            textAlign: "center",
            marginBottom: 32,
            animationDelay: "0.1s",
          }}
        >
          {lang === "es"
            ? "¿Te sentís identificado con alguno de estos problemas?"
            : "Do you relate to any of these problems?"}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "2rem",
          }}
        >
          {problems(lang).map((p, i) => (
            <div
              key={p.text}
              className="animate card-hover"
              style={{
                background: "#fff",
                borderRadius: 20,
                boxShadow:
                  "0 4px 20px rgba(35, 41, 70, 0.08), 0 1px 3px rgba(35, 41, 70, 0.1)",
                padding: "2.5rem 1.8rem 2rem 1.8rem",
                minWidth: 240,
                maxWidth: 280,
                textAlign: "center",
                flex: "1 1 240px",
                animationDelay: `${0.15 + i * 0.07}s`,
                border: "1px solid rgba(35, 41, 70, 0.06)",
              }}
            >
              <div
                style={{
                  fontSize: 36,
                  color: "#F97B72",
                  marginBottom: 16,
                  filter: "drop-shadow(0 2px 8px rgba(249, 123, 114, 0.2))",
                }}
              >
                {p.icon}
              </div>
              <div
                style={{
                  color: "#232946",
                  fontWeight: 600,
                  fontSize: "1.1rem",
                  lineHeight: 1.4,
                }}
              >
                {p.text}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SOLUCIONES */}
      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          marginBottom: "3rem",
          padding: "0 1rem",
        }}
      >
        <div
          className="animate"
          style={{
            fontWeight: 700,
            fontSize: "1.2rem",
            textAlign: "center",
            marginBottom: 32,
            animationDelay: "0.3s",
          }}
        >
          {lang === "es"
            ? "¿Cómo lo resolvemos juntos?"
            : "How do we solve it together?"}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "2rem",
          }}
        >
          {solutions(lang).map((s, i) => (
            <div
              key={s.text}
              className="animate card-hover"
              style={{
                background: i % 2 === 0 ? "#fff" : "#f8f9fa",
                borderRadius: 20,
                boxShadow:
                  "0 4px 20px rgba(35, 41, 70, 0.08), 0 1px 3px rgba(35, 41, 70, 0.1)",
                padding: "2.5rem 1.8rem 2rem 1.8rem",
                minWidth: 240,
                maxWidth: 280,
                textAlign: "center",
                flex: "1 1 240px",
                animationDelay: `${0.35 + i * 0.07}s`,
                border: "1px solid rgba(35, 41, 70, 0.06)",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -8,
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: 18,
                  color: "#F97B72",
                  opacity: 0.7,
                }}
              >
                <FaArrowDown />
              </div>
              <div
                style={{
                  fontSize: 36,
                  color: "#F97B72",
                  marginBottom: 16,
                  filter: "drop-shadow(0 2px 8px rgba(249, 123, 114, 0.2))",
                }}
              >
                {s.icon}
              </div>
              <div
                style={{
                  color: "#232946",
                  fontWeight: 600,
                  fontSize: "1.1rem",
                  lineHeight: 1.4,
                }}
              >
                {s.text}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TRANSFORMACIÓN: ANTES Y DESPUÉS */}
      <section
        style={{
          maxWidth: 900,
          margin: "0 auto",
          marginBottom: "3rem",
          padding: "0 1rem",
        }}
      >
        <div
          className="animate"
          style={{
            fontWeight: 700,
            fontSize: "1.2rem",
            textAlign: "center",
            marginBottom: 32,
            animationDelay: "0.5s",
          }}
        >
          {lang === "es"
            ? "¿Cómo cambia tu negocio?"
            : "How does your business change?"}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "2rem",
            alignItems: "center",
          }}
        >
          <div
            className="animate card-hover"
            style={{
              background: "#fff",
              borderRadius: 20,
              boxShadow:
                "0 4px 20px rgba(35, 41, 70, 0.08), 0 1px 3px rgba(35, 41, 70, 0.1)",
              padding: "2.5rem 1.8rem",
              minWidth: 240,
              maxWidth: 280,
              textAlign: "center",
              animationDelay: "0.55s",
              border: "1px solid rgba(35, 41, 70, 0.06)",
            }}
          >
            <div
              style={{
                fontSize: 36,
                color: "#F97B72",
                marginBottom: 16,
                filter: "drop-shadow(0 2px 8px rgba(249, 123, 114, 0.2))",
              }}
            >
              <FaRegSadTear />
            </div>
            <div
              style={{
                color: "#232946",
                fontWeight: 700,
                fontSize: "1.2rem",
                marginBottom: 12,
              }}
            >
              {lang === "es" ? "Antes" : "Before"}
            </div>
            <div
              style={{
                color: "#232946",
                fontSize: "1rem",
                opacity: 0.8,
                lineHeight: 1.5,
              }}
            >
              {lang === "es"
                ? "Frustración, abandono, baja conversión."
                : "Frustration, abandonment, low conversion."}
            </div>
          </div>
          {isMobile ? (
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                margin: "-1rem 0 -1rem 0",
              }}
            >
              <FaArrowDown
                style={{
                  fontSize: 36,
                  color: "#F97B72",
                  filter: "drop-shadow(0 2px 8px rgba(249, 123, 114, 0.2))",
                }}
              />
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FaArrowRight
                style={{
                  fontSize: 36,
                  color: "#F97B72",
                  filter: "drop-shadow(0 2px 8px rgba(249, 123, 114, 0.2))",
                }}
              />
            </div>
          )}
          <div
            className="animate card-hover"
            style={{
              background: "#fff",
              borderRadius: 20,
              boxShadow:
                "0 4px 20px rgba(35, 41, 70, 0.08), 0 1px 3px rgba(35, 41, 70, 0.1)",
              padding: "2.5rem 1.8rem",
              minWidth: 240,
              maxWidth: 280,
              textAlign: "center",
              animationDelay: "0.6s",
              border: "1px solid rgba(35, 41, 70, 0.06)",
            }}
          >
            <div
              style={{
                fontSize: 36,
                color: "#F97B72",
                marginBottom: 16,
                filter: "drop-shadow(0 2px 8px rgba(249, 123, 114, 0.2))",
              }}
            >
              <FaRegGrinStars />
            </div>
            <div
              style={{
                color: "#232946",
                fontWeight: 700,
                fontSize: "1.2rem",
                marginBottom: 12,
              }}
            >
              {lang === "es" ? "Después" : "After"}
            </div>
            <div
              style={{
                color: "#232946",
                fontSize: "1rem",
                opacity: 0.8,
                lineHeight: 1.5,
              }}
            >
              {lang === "es"
                ? "Usuarios felices, más ventas, feedback positivo."
                : "Happy users, more sales, positive feedback."}
            </div>
          </div>
        </div>
        <div
          className="animate"
          style={{
            textAlign: "center",
            marginTop: 32,
            fontSize: "1.1rem",
            color: "#232946",
            animationDelay: "0.7s",
            fontWeight: 500,
          }}
        >
          {lang === "es"
            ? "Cuando la experiencia es intuitiva y atractiva, tus clientes se quedan, recomiendan y tu negocio crece."
            : "When the experience is intuitive and attractive, your clients stay, recommend, and your business grows."}
        </div>
      </section>

      {/* TESTIMONIO */}
      <section
        style={{
          maxWidth: 900,
          margin: "0 auto",
          marginBottom: "3rem",
          padding: "0 1rem",
        }}
      >
        <div
          className="animate"
          style={{
            textAlign: "center",
            fontSize: "1.15rem",
            fontStyle: "italic",
            animationDelay: "0.8s",
            color: "#232946",
            opacity: 0.85,
            lineHeight: 1.6,
          }}
        >
          {lang === "es"
            ? "Después del rediseño, nuestros usuarios nos felicitan y las conversiones aumentaron un 30%."
            : "After the redesign, our users congratulated us and conversions increased by 30%."}
        </div>
      </section>

      {/* CTA FINAL */}
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <CallToActionBlock
          title={
            lang === "es"
              ? "¡Diseñemos algo que tus usuarios amen!"
              : "Let's design something your users will love!"
          }
          description={
            lang === "es"
              ? "Descubrí cómo podemos transformar la experiencia de tus usuarios."
              : "Discover how we can transform your users' experience."
          }
          buttonText={
            lang === "es" ? "Quiero saber más" : "I want to know more"
          }
          highlightWord="love"
        />
      </div>
    </>
  );
};

export default UxUi;
