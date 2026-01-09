import { useTranslation } from "react-i18next";
import Head from "next/head";
import {
  FaServer,
  FaCloud,
  FaLock,
  FaRocket,
  FaBolt,
  FaCogs,
  FaNetworkWired,
  FaAws,
  FaDocker,
  FaNodeJs,
  FaGoogle,
  FaMicrosoft,
} from "react-icons/fa";
import CallToActionBlock from "../../src/components/CallToAction/CallToAction";
import React from "react";

const techIcons = [
  { icon: <FaAws />, name: "AWS" },
  { icon: <FaGoogle />, name: "Google Cloud" },
  { icon: <FaMicrosoft />, name: "Azure" },
  { icon: <FaNodeJs />, name: "Node.js" },
  { icon: <FaDocker />, name: "Docker" },
  { icon: <FaCogs />, name: "Kubernetes" },
];

const badgeData = (lang) => [
  {
    icon: <FaRocket />,
    title: lang === "es" ? "Escalabilidad" : "Scalability",
    desc:
      lang === "es"
        ? "Crece sin límites, sin preocuparte por la infraestructura."
        : "Grow without limits, no infrastructure worries.",
  },
  {
    icon: <FaLock />,
    title: lang === "es" ? "Seguridad" : "Security",
    desc:
      lang === "es"
        ? "Tus datos siempre protegidos y respaldados."
        : "Your data always protected and backed up.",
  },
  {
    icon: <FaBolt />,
    title: lang === "es" ? "Performance" : "Performance",
    desc:
      lang === "es"
        ? "Velocidad y eficiencia en cada proceso."
        : "Speed and efficiency in every process.",
  },
  {
    icon: <FaNetworkWired />,
    title: lang === "es" ? "Integración" : "Integration",
    desc:
      lang === "es"
        ? "Conecta todo tu ecosistema digital."
        : "Connect your entire digital ecosystem.",
  },
];

const timelineData = (lang) => [
  {
    icon: <FaServer />,
    title: lang === "es" ? "Diagnóstico" : "Diagnosis",
    desc:
      lang === "es"
        ? "Analizamos tu situación actual y objetivos."
        : "We analyze your current situation and goals.",
  },
  {
    icon: <FaCogs />,
    title: lang === "es" ? "Arquitectura" : "Architecture",
    desc:
      lang === "es"
        ? "Diseñamos la mejor solución para tu negocio."
        : "We design the best solution for your business.",
  },
  {
    icon: <FaCloud />,
    title: lang === "es" ? "Migración" : "Migration",
    desc:
      lang === "es"
        ? "Llevamos tu negocio a la nube de forma segura."
        : "We move your business to the cloud safely.",
  },
  {
    icon: <FaBolt />,
    title: lang === "es" ? "Soporte & Optimización" : "Support & Optimization",
    desc:
      lang === "es"
        ? "Siempre a tu lado, mejorando y escalando."
        : "Always by your side, improving and scaling.",
  },
];

const quote = {
  es: {
    text: "No ves el backend ni la nube, pero sentís la diferencia cuando todo funciona.",
    author: "Equipo OGH",
  },
  en: {
    text: "You don’t see the backend or the cloud, but you feel the difference when everything just works.",
    author: "OGH Team",
  },
};

const BackEnd = () => {
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
        <title>Backend & Cloud - OpenGateHub</title>
        <meta
          name="description"
          content={
            lang === "es"
              ? "Infraestructura robusta, escalable y segura para que tu negocio nunca se detenga."
              : "Robust, scalable and secure infrastructure so your business never stops."
          }
        />
        <meta
          name="keywords"
          content="Backend, Cloud, Node.js, AWS, Google Cloud, Azure, Scalable Systems"
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
        .card-hover {
          transition: box-shadow 0.25s, transform 0.25s;
        }
        .card-hover:hover {
          box-shadow: 0 8px 32px #23294622 !important;
          transform: translateY(-6px) scale(1.025);
          z-index: 2;
        }
        .tech-card-hover {
          transition: all 0.3s ease;
        }
        .tech-card-hover:hover {
          transform: translateY(-8px) scale(1.05);
          box-shadow: 0 12px 40px rgba(0,0,0,0.2) !important;
          background: rgba(255,255,255,0.15) !important;
          border-color: rgba(255,255,255,0.3) !important;
        }
      `}</style>
      {/* HERO */}
      <section
        style={{
          background: "linear-gradient(135deg, #5a6c7d 0%, #3d4a5a 100%)",
          color: "white",
          padding: "4rem 2rem 3rem 2rem",
          borderRadius: "0 0 32px 32px",
          position: "relative",
          overflow: "hidden",
          marginBottom: "2.5rem",
          boxShadow: "0 4px 24px rgba(35, 41, 70, 0.08)",
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
          className="animate"
          style={{
            maxWidth: 900,
            margin: "0 auto",
            textAlign: "center",
            animationDelay: "0.05s",
            position: "relative",
            zIndex: 1,
          }}
        >
          <FaCloud
            style={{
              fontSize: 44,
              color: "#F97B72",
              marginBottom: 12,
              filter: "drop-shadow(0 2px 8px #f97b7244)",
            }}
          />
          <h1
            style={{
              fontSize: "2.2rem",
              fontWeight: 800,
              marginBottom: 10,
              letterSpacing: -1,
            }}
          >
            {lang === "es"
              ? "Backend & Cloud Solutions"
              : "Backend & Cloud Solutions"}
          </h1>
          <p
            style={{
              fontSize: "1.15rem",
              opacity: 0.92,
              maxWidth: 600,
              margin: "0 auto",
            }}
          >
            {lang === "es"
              ? "Nuestro trabajo es que nunca tengas que preocuparte por lo que pasa detrás de escena."
              : "Our job is to make sure you never have to worry about what's behind the scenes."}
          </p>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          marginBottom: "2.5rem",
          padding: "0 1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "2rem",
          }}
        >
          {badgeData(lang).map((b, i) => (
            <div
              key={b.title}
              className="animate card-hover"
              style={{
                background: "#fff",
                borderRadius: 16,
                boxShadow: "0 2px 16px #23294608",
                padding: "2rem 1.5rem 1.5rem 1.5rem",
                minWidth: 220,
                maxWidth: 260,
                textAlign: "center",
                flex: "1 1 220px",
                animationDelay: `${0.1 + i * 0.07}s`,
              }}
            >
              <div style={{ fontSize: 32, color: "#F97B72", marginBottom: 10 }}>
                {b.icon}
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "1.12rem",
                  marginBottom: 5,
                }}
              >
                {b.title}
              </div>
              <div
                style={{ color: "#232946", fontSize: "1.01rem", opacity: 0.85 }}
              >
                {b.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TIMELINE */}
      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          marginBottom: "2.5rem",
          padding: "0 1rem",
        }}
      >
        <div
          className="animate"
          style={{
            fontWeight: 700,
            fontSize: "1.3rem",
            textAlign: "center",
            marginBottom: 28,
            animationDelay: "0.3s",
          }}
        >
          {lang === "es" ? "Tu viaje en la nube" : "Your journey to the cloud"}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "2.2rem",
          }}
        >
          {timelineData(lang).map((step, i) => (
            <div
              key={step.title}
              className="animate card-hover"
              style={{
                background: "#fff",
                borderRadius: 16,
                boxShadow: "0 2px 16px #23294608",
                padding: "2rem 1.5rem 1.5rem 1.5rem",
                minWidth: 210,
                maxWidth: 250,
                textAlign: "center",
                position: "relative",
                animationDelay: `${0.35 + i * 0.08}s`,
              }}
            >
              <div style={{ fontSize: 30, color: "#232946", marginBottom: 10 }}>
                {step.icon}
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "1.08rem",
                  marginBottom: 5,
                }}
              >
                {step.title}
              </div>
              <div
                style={{ color: "#232946", fontSize: "0.98rem", opacity: 0.85 }}
              >
                {step.desc}
              </div>
              {i < timelineData(lang).length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    right: -24,
                    top: "50%",
                    width: 24,
                    height: 2,
                    background: "#F97B72",
                    opacity: 0.13,
                    transform: "translateY(-50%)",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* TECNOLOGÍAS */}
      <section
        style={{
          background: "linear-gradient(135deg, #5a6c7d 0%, #3d4a5a 100%)",
          padding: "3rem 2rem 2rem 2rem",
          marginBottom: "2.5rem",
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
              'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>\')',
            opacity: 0.3,
          }}
        />
        <div
          className="animate"
          style={{
            textAlign: "center",
            fontWeight: 700,
            fontSize: "1.3rem",
            marginBottom: 24,
            animationDelay: "0.6s",
            color: "white",
            position: "relative",
            zIndex: 1,
          }}
        >
          {lang === "es" ? "Tecnologías que usamos" : "Technologies we use"}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "2rem",
            position: "relative",
            zIndex: 1,
          }}
        >
          {techIcons.map((t, i) => (
            <div
              key={t.name}
              className="animate tech-card-hover"
              style={{
                background: "rgba(255,255,255,0.1)",
                borderRadius: 16,
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                padding: "1.5rem 2rem",
                minWidth: 120,
                textAlign: "center",
                fontSize: 32,
                color: "white",
                animationDelay: `${0.65 + i * 0.07}s`,
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              {t.icon}
              <div
                style={{
                  fontSize: 14,
                  marginTop: 8,
                  fontWeight: 600,
                  opacity: 0.9,
                }}
              >
                {t.name}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIO / QUOTE */}
      <section
        style={{
          maxWidth: 900,
          margin: "0 auto",
          marginBottom: "2.5rem",
          padding: "0 1rem",
        }}
      >
        <div
          className="animate"
          style={{
            background: "#fff",
            color: "#232946",
            borderRadius: 18,
            padding: "2.2rem 2rem 1.7rem 2rem",
            textAlign: "center",
            fontSize: "1.13rem",
            fontStyle: "italic",
            boxShadow: "0 2px 16px #23294608",
            animationDelay: "0.8s",
          }}
        >
          “{quote[lang]?.text}”
          <div
            style={{
              fontWeight: 700,
              fontSize: "1.05rem",
              marginTop: 14,
              fontStyle: "normal",
              color: "#F97B72",
            }}
          >
            — {quote[lang]?.author}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section
        className="animate"
        style={{
          background: "#fff",
          color: "#232946",
          borderRadius: 18,
          maxWidth: 900,
          margin: "0 auto 2.5rem auto",
          padding: "2.2rem 2rem 1.7rem 2rem",
          textAlign: "center",
          boxShadow: "0 2px 16px #23294608",
          animationDelay: "0.9s",
        }}
      >
        <h2 style={{ fontWeight: 800, fontSize: "1.5rem", marginBottom: 10 }}>
          {lang === "es"
            ? "¿Listo para escalar tu negocio?"
            : "Ready to scale your business?"}
        </h2>
        <p style={{ fontSize: "1.05rem", marginBottom: 20 }}>
          {lang === "es"
            ? "Hablemos de tu backend y la nube."
            : "Let's talk about your backend and the cloud."}
        </p>
        <CallToActionBlock
          title={lang === "es" ? "¡Contáctanos hoy!" : "Contact us today!"}
          description={
            lang === "es"
              ? "Descubrí cómo podemos potenciar tu infraestructura digital."
              : "Discover how we can boost your digital infrastructure."
          }
          buttonText={
            lang === "es" ? "Quiero saber más" : "I want to know more"
          }
          highlightWord="today"
        />
      </section>
    </>
  );
};

export default BackEnd;
