import React, { useEffect, useState, useRef } from "react";
import Script from "next/script";
import SEO from "../../src/components/SEO/SEO";
import {
  FaWhatsapp,
  FaFacebookMessenger,
  FaInstagram,
  FaRobot,
  FaHome,
  FaTable,
  FaClock,
  FaBolt,
  FaCheckCircle,
  FaComments,
  FaBuilding,
  FaKey,
  FaChartLine,
  FaFileExcel,
  FaSearch,
  FaBed,
  FaBath,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaStar,
  FaQuoteLeft,
  FaShieldAlt,
  FaMobileAlt,
  FaSync,
  FaFilter,
} from "react-icons/fa";
import { SiGooglesheets } from "react-icons/si";
import {
  TbBuildingEstate,
  TbMessageChatbot,
} from "react-icons/tb";

// ── Animaciones globales ──────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-10px); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.6; }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-20px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes typewriter {
    from { width: 0; }
    to   { width: 100%; }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes rotateSlow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  .anim-card {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.6s ease, transform 0.6s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  }
  .anim-card.visible { opacity: 1; transform: translateY(0); }
  .feature-card:hover {
    transform: translateY(-6px) !important;
    box-shadow: 0 16px 40px rgba(0,0,0,0.13) !important;
    border-color: rgba(217,119,6,0.4) !important;
  }
  .platform-pill:hover {
    transform: translateY(-4px) scale(1.04);
    box-shadow: 0 12px 30px rgba(0,0,0,0.15) !important;
  }
  .step-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 35px rgba(0,0,0,0.12) !important;
  }
  .price-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 50px rgba(217,119,6,0.25) !important;
  }
  .faq-item:hover { border-color: rgba(217,119,6,0.5) !important; }
  .chat-bubble-in  { animation: slideIn 0.5s ease forwards; }
  @media (max-width: 760px) {
    .calendly-grid { grid-template-columns: 1fr !important; }
  }
  .shimmer-text {
    background: linear-gradient(90deg, #fff 0%, #D97706 50%, #fff 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 3s linear infinite;
  }
`;

// ── Componentes reutilizables ─────────────────────────────────────────────────
const SectionTitle = ({ children, light = false, style = {} }) => (
  <h2
    style={{
      fontSize: "clamp(1.7rem, 3vw, 2.2rem)",
      fontWeight: 700,
      color: light ? "#fff" : "#2B2B2B",
      textAlign: "center",
      marginBottom: "0.75rem",
      ...style,
    }}
  >
    {children}
  </h2>
);

const SectionSubtitle = ({ children, light = false, style = {} }) => (
  <p
    style={{
      fontSize: "1.05rem",
      color: light ? "rgba(255,255,255,0.82)" : "#6B7280",
      textAlign: "center",
      maxWidth: 620,
      margin: "0 auto 2.5rem auto",
      lineHeight: 1.7,
      ...style,
    }}
  >
    {children}
  </p>
);

const Badge = ({ children, color = "#D97706", bg = "#FEF3C7" }) => (
  <span
    style={{
      display: "inline-block",
      background: bg,
      color,
      fontSize: "0.78rem",
      fontWeight: 700,
      padding: "4px 12px",
      borderRadius: 999,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      marginBottom: "0.75rem",
    }}
  >
    {children}
  </span>
);

// ── Mock de conversación de WhatsApp ──────────────────────────────────────────
const ChatBubble = ({ text, type = "user", delay = 0, icon = null }) => {
  const isUser = type === "user";
  return (
    <div
      className="chat-bubble-in"
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "0.6rem",
        animationDelay: `${delay}s`,
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #25D366, #128C7E)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 8,
            flexShrink: 0,
            fontSize: "1rem",
            color: "white",
          }}
        >
          <FaRobot />
        </div>
      )}
      <div
        style={{
          maxWidth: "78%",
          padding: "0.6rem 0.9rem",
          borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
          background: isUser ? "#DCF8C6" : "white",
          boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
          fontSize: "0.88rem",
          color: "#2B2B2B",
          lineHeight: 1.55,
          position: "relative",
        }}
      >
        {icon && (
          <span style={{ marginRight: 6, color: "#25D366" }}>{icon}</span>
        )}
        {text}
        <span
          style={{
            display: "block",
            fontSize: "0.7rem",
            color: "#9EA6AF",
            textAlign: "right",
            marginTop: 2,
          }}
        >
          {new Date().toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
};

// ── Tarjeta de propiedad (como la envía el bot) ───────────────────────────────
const PropertyCard = ({ prop }) => (
  <div
    style={{
      background: "white",
      borderRadius: 12,
      padding: "1rem 1.1rem",
      boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
      border: "1px solid rgba(217,119,6,0.2)",
      maxWidth: 280,
      fontSize: "0.85rem",
    }}
  >
    <div
      style={{
        background: "linear-gradient(135deg, #D97706, #F59E0B)",
        height: 90,
        borderRadius: 8,
        marginBottom: "0.7rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "2.5rem",
        color: "white",
      }}
    >
      {prop.icon}
    </div>
    <div
      style={{ fontWeight: 700, color: "#2B2B2B", marginBottom: 4, fontSize: "0.92rem" }}
    >
      {prop.titulo}
    </div>
    <div
      style={{
        color: "#D97706",
        fontWeight: 700,
        fontSize: "1rem",
        marginBottom: 6,
      }}
    >
      {prop.precio}
    </div>
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 4,
        marginBottom: 6,
      }}
    >
      {prop.tags.map((t) => (
        <span
          key={t}
          style={{
            background: "#F0F0F0",
            color: "#555",
            padding: "2px 8px",
            borderRadius: 999,
            fontSize: "0.75rem",
          }}
        >
          {t}
        </span>
      ))}
    </div>
    <div style={{ color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
      <FaMapMarkerAlt style={{ color: "#D97706", flexShrink: 0 }} />
      {prop.direccion}
    </div>
  </div>
);

// ── Demo de Video IA con Ken Burns effect ─────────────────────────────────────
const PROPERTY_SLIDES = [
  {
    label: "Living comedor",
    photo: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=700&q=85&fit=crop",
    detail: "Amplios ambientes con luz natural",
    kenBurns: { startScale: 1.15, endScale: 1.0, startX: -3, startY: -2, endX: 3, endY: 2 },
  },
  {
    label: "Cocina equipada",
    photo: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=700&q=85&fit=crop",
    detail: "Mesada de granito · Alacenas nuevas",
    kenBurns: { startScale: 1.0, endScale: 1.18, startX: 4, startY: 0, endX: -2, endY: -3 },
  },
  {
    label: "Dormitorio principal",
    photo: "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=700&q=85&fit=crop",
    detail: "Suite con walk-in closet",
    kenBurns: { startScale: 1.2, endScale: 1.05, startX: 2, startY: 3, endX: -4, endY: -1 },
  },
  {
    label: "Jardín y pileta",
    photo: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=700&q=85&fit=crop",
    detail: "Pileta + quincho · 350 m² totales",
    kenBurns: { startScale: 1.05, endScale: 1.2, startX: -4, startY: 1, endX: 2, endY: -3 },
  },
  {
    label: "Fachada",
    photo: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=700&q=85&fit=crop",
    detail: "Frente reciclado · Cochera doble",
    kenBurns: { startScale: 1.1, endScale: 1.0, startX: 0, startY: -4, endX: 0, endY: 2 },
  },
];

const SLIDE_DURATION = 3200; // ms por slide

const VideoDemoSection = () => {
  const [playing, setPlaying] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const intervalRef = React.useRef(null);
  const progressRef = React.useRef(null);

  const startVideo = () => {
    setPlaying(true);
    setDone(false);
    setCurrentSlide(0);
    setProgress(0);
  };

  const stopVideo = () => {
    setPlaying(false);
    clearInterval(intervalRef.current);
    clearInterval(progressRef.current);
    setCurrentSlide(0);
    setProgress(0);
    setDone(false);
  };

  useEffect(() => {
    if (!playing) return;

    // Avanza slides
    intervalRef.current = setInterval(() => {
      setCurrentSlide((s) => {
        const next = s + 1;
        if (next >= PROPERTY_SLIDES.length) {
          clearInterval(intervalRef.current);
          clearInterval(progressRef.current);
          setPlaying(false);
          setDone(true);
          setProgress(100);
          return s;
        }
        return next;
      });
    }, SLIDE_DURATION);

    // Barra de progreso suave
    const totalDuration = PROPERTY_SLIDES.length * SLIDE_DURATION;
    const tick = 80;
    let elapsed = 0;
    progressRef.current = setInterval(() => {
      elapsed += tick;
      setProgress(Math.min((elapsed / totalDuration) * 100, 99));
    }, tick);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(progressRef.current);
    };
  }, [playing]);

  const slide = PROPERTY_SLIDES[currentSlide];
  const kb = slide.kenBurns;

  return (
    <section
      style={{
        background: "white",
        padding: "4rem 2rem",
        borderTop: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes kenburns {
            from {
              transform: scale(var(--kb-start-scale)) translate(var(--kb-start-x), var(--kb-start-y));
            }
            to {
              transform: scale(var(--kb-end-scale)) translate(var(--kb-end-x), var(--kb-end-y));
            }
          }
          @keyframes fadeSlide {
            0%   { opacity: 0; }
            8%   { opacity: 1; }
            88%  { opacity: 1; }
            100% { opacity: 0; }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes scanline {
            0%   { top: -4px; }
            100% { top: 100%; }
          }
          .kb-image {
            animation: kenburns var(--kb-duration, 3.2s) ease-in-out forwards,
                       fadeSlide var(--kb-duration, 3.2s) ease-in-out forwards;
          }
          .text-overlay { animation: slideUp 0.5s 0.3s ease forwards; opacity: 0; }
        `
      }} />

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="anim-card" style={{ textAlign: "center" }}>
          <Badge color="#D97706" bg="#FEF3C7">Premium · Video IA</Badge>
        </div>
        <SectionTitle className="anim-card">
          De fotos de la planilla a video listo para redes
        </SectionTitle>
        <SectionSubtitle>
          El bot toma las fotos de cada propiedad, aplica efectos cinematográficos, suma música y texto automático. Resultado: un video profesional para Instagram y Facebook sin editar nada.
        </SectionSubtitle>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2.5rem",
            alignItems: "center",
          }}
          className="anim-card"
        >
          {/* Panel izquierdo: flujo */}
          <div>
            {[
              { step: "1", icon: "📸", title: "Link de fotos en Drive", desc: "En la columna fotos_drive de la plantilla ponés el link de la carpeta de Drive con las fotos de esa propiedad." },
              { step: "2", icon: "🤖", title: "IA aplica Ken Burns + texto", desc: "Cada foto recibe zoom, paneo y texto descriptivo generado automáticamente: título, precio, barrio, características clave." },
              { step: "3", icon: "🎵", title: "Música de fondo automática", desc: "Selección de música ambiente según el tipo de propiedad: moderna para departamentos, cálida para casas de familia." },
              { step: "4", icon: "📲", title: "Video listo en minutos", desc: "Formato vertical (Reels/Stories) u horizontal (Feed). Listo para publicar directamente desde el bot." },
            ].map((item, i) => (
              <div
                key={item.step}
                style={{
                  display: "flex",
                  gap: 14,
                  marginBottom: "1.4rem",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #D97706, #F59E0B)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.8rem",
                    fontWeight: 800,
                    color: "white",
                    flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(217,119,6,0.35)",
                  }}
                >
                  {item.step}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#2B2B2B", marginBottom: 2 }}>
                    {item.icon} {item.title}
                  </div>
                  <div style={{ fontSize: "0.86rem", color: "#6B7280", lineHeight: 1.55 }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}

            {/* Detalle de precio incluido */}
            <div
              style={{
                background: "#F8FAFC",
                borderRadius: 12,
                padding: "1rem 1.2rem",
                border: "1px solid rgba(217,119,6,0.2)",
                fontSize: "0.88rem",
                color: "#4B5563",
                lineHeight: 1.6,
              }}
            >
              <span style={{ fontWeight: 700, color: "#2B2B2B" }}>Plan Premium incluye 4 videos/mes.</span> Videos adicionales disponibles por unidad. Sin límite de fotos por propiedad.
            </div>
          </div>

          {/* Panel derecho: simulador de video */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            {/* Pantalla del video */}
            <div
              style={{
                width: "100%",
                maxWidth: 340,
                aspectRatio: "9/16",
                borderRadius: 24,
                overflow: "hidden",
                background: "#111",
                position: "relative",
                boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
                border: "3px solid rgba(255,255,255,0.1)",
              }}
            >
              {/* Notch */}
              <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", width: 60, height: 6, background: "rgba(255,255,255,0.15)", borderRadius: 999, zIndex: 20 }} />

              {playing || done ? (
                <>
                  {/* Imagen con Ken Burns */}
                  <div
                    key={`slide-${currentSlide}`}
                    className="kb-image"
                    style={{
                      position: "absolute",
                      inset: "-10%",
                      backgroundImage: `url(${slide.photo})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      "--kb-start-scale": kb.startScale,
                      "--kb-end-scale": kb.endScale,
                      "--kb-start-x": `${kb.startX}%`,
                      "--kb-start-y": `${kb.startY}%`,
                      "--kb-end-x": `${kb.endX}%`,
                      "--kb-end-y": `${kb.endY}%`,
                      "--kb-duration": `${SLIDE_DURATION}ms`,
                    }}
                  />

                  {/* Scanline efecto video */}
                  {playing && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        height: 4,
                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
                        animation: `scanline ${SLIDE_DURATION}ms linear infinite`,
                        zIndex: 10,
                      }}
                    />
                  )}

                  {/* Overlay gradiente inferior */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)",
                      zIndex: 5,
                    }}
                  />

                  {/* Logo marca agua */}
                  <div
                    style={{
                      position: "absolute",
                      top: 20,
                      right: 16,
                      background: "rgba(255,255,255,0.15)",
                      backdropFilter: "blur(8px)",
                      borderRadius: 8,
                      padding: "3px 10px",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "white",
                      zIndex: 15,
                    }}
                  >
                    PropBot
                  </div>

                  {/* Texto de la propiedad */}
                  <div
                    key={`text-${currentSlide}`}
                    className="text-overlay"
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: "1.2rem 1rem 1.5rem",
                      zIndex: 15,
                    }}
                  >
                    <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.7)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {currentSlide + 1} / {PROPERTY_SLIDES.length}
                    </div>
                    <div style={{ fontSize: "1rem", fontWeight: 800, color: "white", marginBottom: 2 }}>
                      {slide.label}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.8)" }}>
                      {slide.detail}
                    </div>
                    {currentSlide === 0 && (
                      <div style={{ marginTop: 8, fontSize: "1.1rem", fontWeight: 900, color: "#D97706" }}>
                        Casa con pileta — USD 220.000
                      </div>
                    )}
                  </div>

                  {/* Pantalla de fin */}
                  {done && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.75)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 20,
                        gap: 8,
                      }}
                    >
                      <div style={{ fontSize: "2.5rem" }}>✅</div>
                      <div style={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}>Video listo!</div>
                      <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.78rem" }}>Listo para publicar</div>
                      <button
                        onClick={stopVideo}
                        style={{
                          marginTop: 8,
                          background: "#D97706",
                          color: "white",
                          border: "none",
                          borderRadius: 999,
                          padding: "6px 18px",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Ver de nuevo
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* Pantalla de inicio */
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(155deg, #1a2a1a 0%, #0d1f0d 100%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                  }}
                >
                  <div style={{ fontSize: "3.5rem" }}>🏠</div>
                  <div style={{ color: "white", fontWeight: 700, fontSize: "1rem", textAlign: "center", padding: "0 1rem" }}>
                    Casa con pileta y quincho
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.8rem" }}>5 fotos · generando video...</div>
                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                      marginTop: 4,
                    }}
                  >
                    {PROPERTY_SLIDES.map((s, i) => (
                      <div
                        key={i}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          backgroundImage: `url(${s.photo})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          border: "1px solid rgba(255,255,255,0.15)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Barra de progreso */}
            {(playing || done) && (
              <div
                style={{
                  width: "100%",
                  maxWidth: 340,
                  height: 4,
                  background: "rgba(0,0,0,0.1)",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, #D97706, #F59E0B)",
                    borderRadius: 999,
                    transition: "width 0.1s linear",
                  }}
                />
              </div>
            )}

            {/* Botón play */}
            {!playing && !done && (
              <button
                onClick={startVideo}
                style={{
                  background: "linear-gradient(135deg, #D97706, #F59E0B)",
                  color: "white",
                  border: "none",
                  borderRadius: 999,
                  padding: "0.75rem 2rem",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 8px 25px rgba(217,119,6,0.4)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                ▶ Ver demo del video
              </button>
            )}

            <p style={{ fontSize: "0.78rem", color: "#9CA3AF", textAlign: "center", maxWidth: 280, lineHeight: 1.5, margin: 0 }}>
              Demo simulada. El video real se genera con las fotos de tu planilla y se entrega listo para publicar.
            </p>
          </div>
        </div>

        {/* Responsive: en mobile stack vertical */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 680px) {
              .video-demo-grid { grid-template-columns: 1fr !important; }
            }
          `
        }} />
      </div>
    </section>
  );
};

// ── Página principal ──────────────────────────────────────────────────────────
const RealEstateBot = () => {
  const [activeTab, setActiveTab] = useState("whatsapp");
  const [activeFaq, setActiveFaq] = useState(null);
  const [chatStep, setChatStep] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".anim-card").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const maxSteps = conversations[activeTab].length;
    if (chatStep < maxSteps) {
      const t = setTimeout(() => setChatStep((s) => s + 1), 900);
      return () => clearTimeout(t);
    }
  }, [chatStep, activeTab]);

  useEffect(() => {
    setChatStep(0);
  }, [activeTab]);

  const [showSticky, setShowSticky] = useState(false);
  const [calendlyLoaded, setCalendlyLoaded] = useState(false);
  const calendlyRef = useRef(null);
  const CALENDLY_URL =
    "https://calendly.com/sanchezgcandelaria/15min?hide_event_type_details=1&hide_gdpr_banner=1&text_color=0f172a&primary_color=d97706";
  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 700);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const conversations = {
    whatsapp: [
      { type: "user", text: "Hola! Busco un departamento en alquiler en el centro, 2 ambientes, con balcón." },
      {
        type: "bot",
        text: "¡Hola! 👋 Encontré 3 propiedades que coinciden con tu búsqueda en Centro. Acá va la primera:",
      },
      { type: "card", prop: { titulo: "Depto 2 amb con balcón", precio: "USD 550/mes", icon: <FaBuilding />, tags: ["2 amb", "Balcón", "Piso 5"], direccion: "Rivadavia 2340, Centro" } },
      { type: "bot", text: "¿Querés que te mande más opciones o te interesa agendar una visita? Los horarios disponibles son: martes a jueves 10-13 y 15-18. 📅" },
      { type: "user", text: "Sí, me interesa! ¿Tiene cochera?" },
      { type: "bot", text: "Sí tiene cochera incluida 🚗. Las fotos completas están acá: drive.google.com/… ¿Confirmamos turno?" },
    ],
    messenger: [
      { type: "user", text: "Buenas, busco casa en venta con pileta y quincho, presupuesto hasta USD 250.000." },
      { type: "bot", text: "¡Buenas! 🏠 Tengo exactamente lo que buscás. Mirá estas opciones que encontré en la base:" },
      { type: "card", prop: { titulo: "Casa con pileta y quincho", precio: "USD 220.000", icon: <FaHome />, tags: ["5 amb", "Pileta", "Quincho", "350 m²"], direccion: "Bello Horizonte" } },
      { type: "bot", text: "Esta propiedad tiene pileta, quincho, jardín, 4 dormitorios y 3 baños. Acepta crédito hipotecario ✅. ¿Te envío las fotos y más detalles?" },
      { type: "user", text: "Perfecto, sí mándame todo." },
      { type: "bot", text: "📸 Fotos: drive.google.com/… \n📍 Dirección completa: Estados Unidos 5314\n📞 Para coordinar visita: miércoles 10-13 o viernes 10-13. ¿Cuál te viene mejor?" },
    ],
    instagram: [
      { type: "user", text: "Hola! Vi el post del chalet en barrio privado. ¿Cuánto sale?" },
      { type: "bot", text: "¡Hola! 🏡 El chalet en Las Golondrinas está a USD 310.000. Es un emprendimiento a estrenar con:" },
      { type: "card", prop: { titulo: "Chalet en barrio privado", precio: "USD 310.000", icon: <FaKey />, tags: ["5 amb", "500 m²", "Seguridad 24hs", "A estrenar"], direccion: "Ecuador 9999 · Las Golondrinas" } },
      { type: "bot", text: "Incluye: 4 dormitorios, 3 baños, pileta, quincho, jardín y cochera 🌟. Barrio privado con seguridad 24hs. ¿Querés que un asesor te contacte?" },
      { type: "user", text: "Sí por favor, soy de otra provincia y no puedo ir pronto." },
      { type: "bot", text: "Sin problema 😊 Te conecto con el asesor para una videollamada. Dejame tu número y te escribimos por WhatsApp para coordinar. 📱" },
    ],
  };

  const platformConfig = {
    whatsapp: { color: "#25D366", darkColor: "#128C7E", icon: <FaWhatsapp />, label: "WhatsApp" },
    messenger: { color: "#0084FF", darkColor: "#0068CC", icon: <FaFacebookMessenger />, label: "Messenger" },
    instagram: { color: "#E1306C", darkColor: "#C13584", icon: <FaInstagram />, label: "Instagram" },
  };

  const activePlatform = platformConfig[activeTab];

  const features = [
    {
      icon: <SiGooglesheets />,
      color: "#0F9D58",
      title: "Completás nuestra plantilla",
      desc: "Te damos la plantilla de Google Sheets ya armada con todas las columnas. Solo la completás con tus propiedades y ponés el link de la carpeta de Drive con las fotos de cada una.",
    },
    {
      icon: <FaFilter />,
      color: "#D97706",
      title: "Filtros inteligentes por consulta",
      desc: 'Si el cliente dice "busco depto 2 amb con balcón en alquiler en Palermo", el bot filtra tipo_operacion, tipo_propiedad, ambientes, balcon y barrio en tiempo real.',
    },
    {
      icon: <FaSync />,
      color: "#3B82F6",
      title: "Actualización en tiempo real",
      desc: "Modificás la planilla y el bot ya tiene los datos nuevos. Agregás una propiedad a la mañana y al mediodía ya aparece en las respuestas. Sin reinicios.",
    },
    {
      icon: <FaMobileAlt />,
      color: "#8B5CF6",
      title: "Tres canales, un solo bot",
      desc: "El mismo bot atiende WhatsApp Business, Facebook Messenger e Instagram DMs simultáneamente. Un solo setup, tres canales activos.",
    },
    {
      icon: <FaClock />,
      color: "#F59E0B",
      title: "Atención 24/7 sin descanso",
      desc: "Consultas a las 2 AM del domingo? El bot responde igual. Con los horarios de visita de cada propiedad incluidos en la respuesta automáticamente.",
    },
    {
      icon: <FaShieldAlt />,
      color: "#10B981",
      title: "Escala a humano cuando hace falta",
      desc: "Cuando el cliente quiere cerrar trato, el bot transfiere la conversación al asesor disponible con todo el contexto de la consulta ya registrado.",
    },
  ];

  const steps = [
    {
      num: "01",
      icon: <FaTable />,
      title: "Completás nuestra plantilla",
      desc: "Te mandamos nuestra plantilla de Google Sheets ya armada. La completás con tus propiedades e incluís el link a la carpeta de Drive con las fotos de cada una.",
      color: "#D97706",
    },
    {
      num: "02",
      icon: <FaRobot />,
      title: "Configuramos el bot",
      desc: "Conectamos el bot a tu WhatsApp Business, página de Facebook e Instagram. Lo personalizamos con el tono de tu inmobiliaria.",
      color: "#3B82F6",
    },
    {
      num: "03",
      icon: <FaBolt />,
      title: "Live en 48 hs",
      desc: "En 48 horas el bot está activo recibiendo y respondiendo consultas. Hacemos pruebas con vos antes de activar para asegurarnos que todo funcione perfecto.",
      color: "#10B981",
    },
    {
      num: "04",
      icon: <FaChartLine />,
      title: "Medís resultados",
      desc: "Dashboard con métricas de consultas recibidas, propiedades más buscadas, horarios pico y tasa de conversión a visitas.",
      color: "#8B5CF6",
    },
  ];

  const sheetColumns = [
    { col: "titulo", ejemplo: "Casa familiar con jardín", desc: "Título descriptivo de la propiedad" },
    { col: "precio_usd", ejemplo: "120000 / 500", desc: "Precio en USD (venta) o mensual (alquiler)" },
    { col: "tipo_operacion", ejemplo: "venta / alquiler", desc: "El bot filtra por esta columna" },
    { col: "tipo_propiedad", ejemplo: "casa / departamento / chalet…", desc: "Tipo de inmueble" },
    { col: "barrio", ejemplo: "Palermo / Centro", desc: "Zona de búsqueda del cliente" },
    { col: "ambientes / dormitorios / banos", ejemplo: "3 / 2 / 1", desc: "Filtros numéricos automáticos" },
    { col: "cochera / pileta / balcon…", ejemplo: "sí / no", desc: "+15 características reconocidas" },
    { col: "fotos_drive", ejemplo: "drive.google.com/carpeta/…", desc: "Link de carpeta de Drive con las fotos de esa propiedad. El bot las envía al cliente automáticamente." },
    { col: "horarios_visita", ejemplo: "Lunes 9-12, Sáb 10-13", desc: "Incluidos en la respuesta del bot" },
  ];

  const plans = [
    {
      name: "Starter",
      channel: "WhatsApp",
      channelColor: "#25D366",
      channelIcon: <FaWhatsapp />,
      desc: "El bot, punto. Para inmobiliarias que quieren automatizar consultas sin complicarse.",
      features: [
        "Bot 24/7 por WhatsApp Business",
        "Responde consultas y filtra propiedades",
        "Agenda visitas automáticamente",
        "Escala a humano con contexto completo",
        "Plantilla de Google Sheets incluida",
        "Setup completo en 48hs",
      ],
      cta: "Agenda una llamada",
      ctaHref: "#contacto",
      highlight: false,
      badge: null,
    },
    {
      name: "Pro",
      channel: "WhatsApp + Instagram + Facebook",
      channelColor: "#8B5CF6",
      channelIcon: <span style={{ display: "flex", gap: 4 }}><FaWhatsapp /><FaInstagram /><FaFacebookMessenger /></span>,
      desc: "Los tres canales activos más el dashboard para entender qué está pasando con tus leads.",
      features: [
        "Todo lo del plan Starter",
        "Instagram Direct integrado",
        "Facebook Messenger integrado",
        "Dashboard: consultas, propiedades más buscadas y horarios pico",
        "Tasa de conversión consulta → visita",
        "Múltiples sucursales / planillas",
        "Soporte prioritario",
      ],
      cta: "Agenda una llamada",
      ctaHref: "#contacto",
      highlight: true,
      badge: "Más elegido",
    },
    {
      name: "Premium",
      channel: "Pro + Analytics + Video IA",
      channelColor: "#D97706",
      channelIcon: <span>🎬</span>,
      desc: "Para inmobiliarias que quieren tomar decisiones con datos y contenido generado automáticamente.",
      features: [
        "Todo lo del plan Pro",
        "Analytics avanzadas: leads calificados, tiempo hasta cierre, comparativa por período",
        "Exportación de reportes PDF / CSV",
        "4 videos de propiedades/mes generados con IA",
        "Fotos + música + texto automáticos listos para publicar",
        "Ideal para desarrolladoras y carteras grandes",
      ],
      cta: "Agenda una llamada",
      ctaHref: "#contacto",
      highlight: false,
      badge: "Completo",
    },
  ];

  const testimonials = [
    {
      name: "Marcela Gómez",
      role: "Dueña, Inmobiliaria del Norte",
      text: "Antes perdíamos consultas de WhatsApp los fines de semana. Desde que tenemos el bot, cada mensaje tiene respuesta inmediata y los clientes ya van pre-filtrados cuando llaman.",
      stars: 5,
    },
    {
      name: "Roberto Peralta",
      role: "Gerente comercial, PropiedadesYA",
      text: "La planilla ya la teníamos en Google Sheets. En dos días el bot estaba andando. El 40% de nuestras visitas ahora vienen del chat automático de Instagram.",
      stars: 5,
    },
    {
      name: "Daniela Rizzo",
      role: "Directora, Grupo Rizzo Inmuebles",
      text: "Lo que más nos sorprendió es que el bot entiende cuando alguien pregunta 'algo con patio para un perro' y filtra las propiedades con patio trasero. Es como tener un asesor más.",
      stars: 5,
    },
  ];

  const faqs = [
    {
      q: "¿Necesito saber programar para usarlo?",
      a: "Para nada. Vos manejás la planilla de Google Sheets como siempre. Nosotros nos encargamos de toda la parte técnica: conexión, configuración y mantenimiento del bot.",
    },
    {
      q: "¿Cómo cargo mis propiedades?",
      a: "Nosotros te damos la plantilla de Google Sheets ya armada con todas las columnas. Vos la completás con tus propiedades, ponés el link a la carpeta de Drive con las fotos de cada una, y listo. Sin adaptar nada ni migrar datos.",
    },
    {
      q: "¿Qué pasa si el cliente hace una pregunta muy específica que el bot no entiende?",
      a: "El bot detecta cuando no puede resolver la consulta y transfiere al asesor humano con un resumen de lo que el cliente buscó. No deja a nadie sin respuesta.",
    },
    {
      q: "¿Cuánto tarda la implementación?",
      a: "Generalmente 48-72 horas desde que nos pasás la planilla y damos acceso a los canales. Incluye pruebas y ajustes antes del lanzamiento.",
    },
    {
      q: "¿Puedo tener varias sucursales con sus propias planillas?",
      a: "Sí, el plan Pro y Enterprise soportan múltiples planillas. El bot puede segmentar las propiedades por sucursal y responder según la fuente de la consulta.",
    },
    {
      q: "¿Qué pasa si agrego o saco propiedades de la planilla?",
      a: "Los cambios se reflejan automáticamente. El bot lee la planilla en tiempo real, por lo que no necesitás notificarnos ni hacer ninguna actualización manual del sistema.",
    },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      <SEO
        title="PropBot — Automatizá las consultas de tu inmobiliaria con IA"
        description="Bot inteligente que responde consultas de ventas y alquileres por WhatsApp, Facebook e Instagram leyendo tu Google Sheet o Excel. Activo 24/7, sin código."
        keywords="bot inmobiliaria, bot whatsapp propiedades, automatización inmobiliaria, chatbot real estate, responder consultas inmobiliaria, bot google sheets propiedades"
      />
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="lazyOnload"
        onLoad={() => setCalendlyLoaded(true)}
      />

      {/* ── PROPBOT HEADER ──────────────────────────────────────────────────── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          background: "rgba(11,26,62,0.96)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          padding: "0.8rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
            <div
              style={{
                width: 44,
                height: 44,
                background: "linear-gradient(145deg, #92400E, #D97706)",
                borderRadius: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 18px rgba(217,119,6,0.5)",
              }}
            >
              <TbBuildingEstate size={26} color="white" />
            </div>
            <div
              style={{
                position: "absolute",
                bottom: -5,
                right: -5,
                width: 22,
                height: 22,
                background: "white",
                borderRadius: 7,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
              }}
            >
              <TbMessageChatbot size={14} color="#D97706" />
            </div>
          </div>
          <span style={{ fontWeight: 900, fontSize: "1.25rem", letterSpacing: "-0.02em" }}>
            <span style={{ color: "white" }}>Prop</span><span style={{ color: "#FCD34D" }}>Bot</span>
          </span>
        </div>
        <a
          href="#contacto"
          style={{
            background: "linear-gradient(135deg, #D97706, #F59E0B)",
            color: "white",
            padding: "0.55rem 1.5rem",
            borderRadius: 999,
            fontWeight: 700,
            fontSize: "0.9rem",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            boxShadow: "0 4px 14px rgba(217,119,6,0.35)",
          }}
        >
          <FaWhatsapp /> Consultar
        </a>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section
        style={{
          background: "linear-gradient(135deg, #0B1A3E 0%, #0D2252 50%, #0B1A3E 100%)",
          padding: "5rem 2rem 4rem",
          textAlign: "center",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Patrón de fondo */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><defs><pattern id="g" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M0 40 L40 0 L80 40 L40 80 Z" fill="none" stroke="rgba(217,119,6,0.06)" stroke-width="1"/><circle cx="40" cy="40" r="2" fill="rgba(37,211,102,0.08)"/></pattern></defs><rect width="80" height="80" fill="url(%23g)"/></svg>\')',
            opacity: 0.8,
          }}
        />
        {/* Orbs */}
        <div style={{ position: "absolute", top: "10%", left: "5%", width: 300, height: 300, background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 250, height: 250, background: "radial-gradient(circle, rgba(217,119,6,0.18) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(40px)" }} />

        <div style={{ position: "relative", zIndex: 2, maxWidth: 900, margin: "0 auto" }}>
          {/* Plataformas badge */}
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: "1.5rem", flexWrap: "wrap" }}>
            {[
              { icon: <FaWhatsapp />, label: "WhatsApp", color: "#25D366" },
              { icon: <FaFacebookMessenger />, label: "Messenger", color: "#0084FF" },
              { icon: <FaInstagram />, label: "Instagram", color: "#E1306C" },
            ].map((p) => (
              <div
                key={p.label}
                className="platform-pill"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(255,255,255,0.08)",
                  border: `1px solid ${p.color}40`,
                  borderRadius: 999,
                  padding: "6px 14px",
                  fontSize: "0.85rem",
                  color: p.color,
                  cursor: "default",
                  transition: "all 0.3s ease",
                }}
              >
                {p.icon} {p.label}
              </div>
            ))}
          </div>

          <h1
            style={{
              fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
              fontWeight: 900,
              lineHeight: 1.15,
              marginBottom: "1.2rem",
              animation: "fadeInUp 0.7s ease forwards",
            }}
          >
            Cada consulta sin responder es{" "}
            <span className="shimmer-text">una venta que se pierde</span>
          </h1>

          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.2rem)",
              color: "rgba(255,255,255,0.78)",
              maxWidth: 620,
              margin: "0 auto 2rem",
              lineHeight: 1.75,
              animation: "fadeInUp 0.7s 0.15s ease forwards",
              opacity: 0,
            }}
          >
            PropBot responde por WhatsApp, Instagram y Facebook en{" "}
            <strong style={{ color: "#FCD34D" }}>menos de 5 segundos</strong> — ventas, alquileres, agendado de visitas — las 24 horas, sin que tu equipo mueva un dedo.
          </p>

          <div
            style={{
              display: "flex",
              gap: 14,
              justifyContent: "center",
              flexWrap: "wrap",
              animation: "fadeInUp 0.7s 0.3s ease forwards",
              opacity: 0,
            }}
          >
            <a
              href="#contacto"
              style={{
                background: "linear-gradient(135deg, #D97706, #F59E0B)",
                color: "white",
                padding: "0.9rem 2rem",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: "1rem",
                textDecoration: "none",
                boxShadow: "0 8px 25px rgba(217,119,6,0.4)",
                transition: "all 0.3s ease",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <FaBolt /> Quiero el bot — gratis los primeros 14 días
            </a>
            <a
              href="#como-funciona"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "white",
                padding: "0.9rem 2rem",
                borderRadius: 999,
                fontWeight: 600,
                fontSize: "1rem",
                textDecoration: "none",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
            >
              Ver cómo funciona
            </a>
          </div>

          {/* Métricas hero */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "2.5rem",
              marginTop: "3rem",
              flexWrap: "wrap",
              animation: "fadeInUp 0.7s 0.45s ease forwards",
              opacity: 0,
            }}
          >
            {[
              { num: "< 5s", label: "Primera respuesta" },
              { num: "24/7", label: "Todos los días del año" },
              { num: "0", label: "Leads sin contestar" },
              { num: "48hs", label: "Setup incluido" },
            ].map((m) => (
              <div key={m.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#D97706" }}>{m.num}</div>
                <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)" }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ───────────────────────────────────────────────────────── */}
      <div
        style={{
          background: "#0B1A3E",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "0.9rem 2rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "2.5rem",
          flexWrap: "wrap",
        }}
      >
        {[
          { icon: "✅", text: "Sin contratos" },
          { icon: "🔄", text: "Cancelás cuando querés" },
          { icon: "⚡", text: "Setup en 48hs" },
          { icon: "🛡️", text: "Garantía 30 días" },
          { icon: "🏢", text: "+127 inmobiliarias activas" },
        ].map((item) => (
          <div
            key={item.text}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: "0.85rem",
              color: "rgba(255,255,255,0.72)",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            <span>{item.icon}</span> {item.text}
          </div>
        ))}
      </div>

      {/* ── EL COSTO DE NO RESPONDER ─────────────────────────────────────────── */}
      <section style={{ background: "#FAFAFA", padding: "4.5rem 2rem", borderBottom: "2px solid #F3F4F6" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="anim-card" style={{ textAlign: "center" }}>
            <Badge color="#EF4444" bg="rgba(239,68,68,0.1)">El costo de no responder</Badge>
          </div>
          <SectionTitle className="anim-card">
            Cada hora de silencio le cuesta ventas a tu inmobiliaria
          </SectionTitle>
          <SectionSubtitle>
            Los clientes no esperan. Si no respondés en minutos, ya están hablando con la competencia.
          </SectionSubtitle>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.5rem",
              marginTop: "1rem",
            }}
          >
            {[
              {
                num: "78%",
                title: "elige a quien responde primero",
                desc: "De los compradores y locatarios que contactan por chat, casi 8 de 10 terminan eligiendo la inmobiliaria que respondió más rápido.",
                color: "#EF4444",
                icon: "⏱️",
              },
              {
                num: "8 min",
                title: "es lo que esperan antes de irse",
                desc: "Después de 8 minutos sin respuesta, la mayoría abandona la conversación y busca otra opción. Para siempre.",
                color: "#F59E0B",
                icon: "💨",
              },
              {
                num: "3hs",
                title: "por día en respuestas repetidas",
                desc: "Tu equipo pasa horas respondiendo 'tiene cochera', 'cuántos ambientes', 'cuál es el precio'. PropBot lo hace en 5 segundos.",
                color: "#8B5CF6",
                icon: "🔁",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="anim-card feature-card"
                style={{
                  background: "white",
                  border: `1px solid ${stat.color}20`,
                  borderTop: `4px solid ${stat.color}`,
                  borderRadius: 16,
                  padding: "1.8rem",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ fontSize: "2.2rem", marginBottom: "0.6rem" }}>{stat.icon}</div>
                <div style={{ fontSize: "2.8rem", fontWeight: 900, color: stat.color, lineHeight: 1, marginBottom: "0.4rem" }}>
                  {stat.num}
                </div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#1F2937", marginBottom: "0.75rem" }}>
                  {stat.title}
                </div>
                <div style={{ fontSize: "0.9rem", color: "#6B7280", lineHeight: 1.65 }}>
                  {stat.desc}
                </div>
              </div>
            ))}
          </div>

          <div
            className="anim-card"
            style={{
              marginTop: "2.5rem",
              background: "linear-gradient(135deg, #0B1A3E, #0D2252)",
              borderRadius: 16,
              padding: "2rem 2.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "2rem",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "white", marginBottom: "0.4rem" }}>
                PropBot responde en menos de 5 segundos. Siempre.
              </div>
              <div style={{ fontSize: "0.92rem", color: "rgba(255,255,255,0.6)" }}>
                A las 3 AM del domingo, en feriados, mientras tu equipo está en una visita.
              </div>
            </div>
            <a
              href="#contacto"
              style={{
                background: "linear-gradient(135deg, #D97706, #F59E0B)",
                color: "white",
                padding: "0.85rem 2rem",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: "0.95rem",
                textDecoration: "none",
                whiteSpace: "nowrap",
                flexShrink: 0,
                boxShadow: "0 6px 20px rgba(217,119,6,0.4)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <FaBolt /> Quiero el bot ahora
            </a>
          </div>
        </div>
      </section>

      {/* ── DEMO CONVERSACIONES ─────────────────────────────────────────────── */}
      <section style={{ background: "#F8FAFC", padding: "4rem 2rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="anim-card">
            <Badge>Demo en vivo</Badge>
          </div>
          <SectionTitle style={{ textAlign: "center" }} className="anim-card">
            Así responde el bot a tus clientes
          </SectionTitle>
          <SectionSubtitle>
            Seleccioná la plataforma y mirá cómo se ve una conversación real
          </SectionSubtitle>

          {/* Tabs de plataforma */}
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: "2rem", flexWrap: "wrap" }}>
            {Object.entries(platformConfig).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "0.65rem 1.4rem",
                  borderRadius: 999,
                  border: "2px solid",
                  borderColor: activeTab === key ? cfg.color : "#E5E7EB",
                  background: activeTab === key ? cfg.color : "white",
                  color: activeTab === key ? "white" : "#6B7280",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: activeTab === key ? `0 6px 20px ${cfg.color}40` : "none",
                }}
              >
                {cfg.icon} {cfg.label}
              </button>
            ))}
          </div>

          {/* Ventana de chat */}
          <div
            className="anim-card"
            style={{
              maxWidth: 480,
              margin: "0 auto",
              background: "#ECE5DD",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}
          >
            {/* Header del chat */}
            <div
              style={{
                background: `linear-gradient(135deg, ${activePlatform.darkColor}, ${activePlatform.color})`,
                padding: "1rem 1.2rem",
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "white",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.3rem",
                }}
              >
                <FaRobot />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>PropBot · Tu Inmobiliaria</div>
                <div style={{ fontSize: "0.75rem", opacity: 0.85, display: "flex", alignItems: "center", gap: 4 }}>
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#4ade80",
                      display: "inline-block",
                      animation: "pulse 2s ease infinite",
                    }}
                  />
                  En línea · Responde al instante
                </div>
              </div>
              <div style={{ marginLeft: "auto", fontSize: "1.4rem", opacity: 0.9 }}>
                {activePlatform.icon}
              </div>
            </div>

            {/* Mensajes */}
            <div
              style={{
                padding: "1rem",
                minHeight: 340,
                maxHeight: 420,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {conversations[activeTab].slice(0, chatStep).map((msg, i) => {
                if (msg.type === "card") {
                  return (
                    <div key={i} className="chat-bubble-in" style={{ animationDelay: "0s", display: "flex", marginBottom: "0.6rem" }}>
                      <div style={{ width: 32, flexShrink: 0, marginRight: 8 }} />
                      <PropertyCard prop={msg.prop} />
                    </div>
                  );
                }
                return (
                  <ChatBubble
                    key={i}
                    text={msg.text}
                    type={msg.type === "user" ? "user" : "bot"}
                    delay={0}
                  />
                );
              })}
              {chatStep < conversations[activeTab].length && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0.4rem 0.6rem" }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${activePlatform.color}, ${activePlatform.darkColor})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.9rem",
                      color: "white",
                      flexShrink: 0,
                    }}
                  >
                    <FaRobot />
                  </div>
                  <div
                    style={{
                      background: "white",
                      borderRadius: "4px 16px 16px 16px",
                      padding: "0.5rem 0.8rem",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    <span style={{ animation: "pulse 1s ease infinite", color: "#9EA6AF", fontSize: "1.2rem", letterSpacing: 2 }}>
                      ●●●
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ───────────────────────────────────────────────────── */}
      <section id="como-funciona" style={{ padding: "4rem 2rem", background: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="anim-card" style={{ textAlign: "center" }}>
            <Badge>Proceso simple</Badge>
          </div>
          <SectionTitle className="anim-card">De tu planilla a tus clientes en 4 pasos</SectionTitle>
          <SectionSubtitle>Sin código, sin complicaciones. Solo conectás y el bot empieza a trabajar.</SectionSubtitle>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {steps.map((step, i) => (
              <div
                key={step.num}
                className="anim-card step-card"
                style={{
                  background: "white",
                  borderRadius: 16,
                  padding: "2rem 1.5rem",
                  border: `2px solid ${step.color}20`,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
                  transition: "all 0.3s ease",
                  transitionDelay: `${i * 0.1}s`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 16,
                    fontSize: "3rem",
                    fontWeight: 900,
                    color: `${step.color}15`,
                    lineHeight: 1,
                  }}
                >
                  {step.num}
                </div>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: `${step.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    color: step.color,
                    marginBottom: "1rem",
                  }}
                >
                  {step.icon}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: "1.05rem", color: "#2B2B2B", marginBottom: "0.5rem" }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: "0.9rem", color: "#6B7280", lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORMATO DE PLANILLA ─────────────────────────────────────────────── */}
      <section
        style={{
          background: "linear-gradient(135deg, #0d1f0d 0%, #1a2a1a 100%)",
          padding: "4rem 2rem",
          color: "white",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="anim-card" style={{ textAlign: "center" }}>
            <Badge color="#0F9D58" bg="rgba(15,157,88,0.15)">Google Sheets / Excel</Badge>
          </div>
          <SectionTitle light className="anim-card">
            Tu plantilla, lista para completar
          </SectionTitle>
          <SectionSubtitle light>
            Te damos la plantilla con todas las columnas armadas. Solo la completás con tus propiedades y agregás el link de Drive con las fotos de cada una.
          </SectionSubtitle>

          {/* Tabla de columnas */}
          <div
            className="anim-card"
            style={{
              background: "rgba(255,255,255,0.04)",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.1)",
              overflow: "hidden",
              backdropFilter: "blur(10px)",
            }}
          >
            {/* Header de tabla fake tipo Sheets */}
            <div
              style={{
                background: "rgba(15,157,88,0.2)",
                padding: "0.7rem 1.2rem",
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderBottom: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <SiGooglesheets style={{ color: "#0F9D58", fontSize: "1.2rem" }} />
              <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
                Propiedades_inmobiliaria.xlsx — Hoja 1
              </span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.06)" }}>
                    <th style={{ padding: "0.7rem 1rem", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 600, whiteSpace: "nowrap" }}>Columna</th>
                    <th style={{ padding: "0.7rem 1rem", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 600, whiteSpace: "nowrap" }}>Ejemplo</th>
                    <th style={{ padding: "0.7rem 1rem", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Qué hace el bot con esto</th>
                  </tr>
                </thead>
                <tbody>
                  {sheetColumns.map((row, i) => (
                    <tr
                      key={row.col}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                      }}
                    >
                      <td style={{ padding: "0.65rem 1rem", whiteSpace: "nowrap" }}>
                        <code
                          style={{
                            background: "rgba(15,157,88,0.2)",
                            color: "#4ade80",
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontSize: "0.82rem",
                          }}
                        >
                          {row.col}
                        </code>
                      </td>
                      <td style={{ padding: "0.65rem 1rem", color: "rgba(255,255,255,0.65)", whiteSpace: "nowrap" }}>
                        {row.ejemplo}
                      </td>
                      <td style={{ padding: "0.65rem 1rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                        {row.desc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p
            style={{
              textAlign: "center",
              marginTop: "1.5rem",
              color: "rgba(255,255,255,0.5)",
              fontSize: "0.88rem",
            }}
          >
            Pedí la plantilla gratis.{" "}
            <a
              href="#contacto"
              style={{ color: "#FCD34D", textDecoration: "underline", cursor: "pointer" }}
            >
              La recibís lista para completar
            </a>{" "}
            con todas las columnas, incluida la de fotos en Drive.
          </p>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section style={{ padding: "4rem 2rem", background: "#F8FAFC" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="anim-card" style={{ textAlign: "center" }}>
            <Badge>Funcionalidades</Badge>
          </div>
          <SectionTitle className="anim-card">Todo lo que el bot hace por vos</SectionTitle>
          <SectionSubtitle>Diseñado específicamente para el negocio inmobiliario argentino.</SectionSubtitle>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {features.map((f, i) => (
              <div
                key={f.title}
                className="anim-card feature-card"
                style={{
                  background: "white",
                  borderRadius: 16,
                  padding: "1.8rem",
                  border: "1px solid rgba(0,0,0,0.05)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                  transition: "all 0.3s ease",
                  transitionDelay: `${i * 0.08}s`,
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 12,
                    background: `${f.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.4rem",
                    color: f.color,
                    marginBottom: "1rem",
                  }}
                >
                  {f.icon}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: "1.05rem", color: "#2B2B2B", marginBottom: "0.5rem" }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: "0.9rem", color: "#6B7280", lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EJEMPLO DE FILTROS ──────────────────────────────────────────────── */}
      <section style={{ padding: "4rem 2rem", background: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="anim-card" style={{ textAlign: "center" }}>
            <Badge color="#8B5CF6" bg="#EDE9FE">Motor de búsqueda inteligente</Badge>
          </div>
          <SectionTitle className="anim-card">El bot entiende lenguaje natural</SectionTitle>
          <SectionSubtitle>
            No necesita comandos exactos. Interpreta cómo habla la gente.
          </SectionSubtitle>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {[
              {
                consulta: '"busco depto 2 amb con balcón en alquiler en Palermo"',
                filtros: ["tipo_operacion: alquiler", "tipo_propiedad: departamento", "ambientes: 2", "balcon: sí", "barrio: Palermo"],
                color: "#25D366",
              },
              {
                consulta: '"quiero comprar casa con pileta, máximo 200 mil dólares"',
                filtros: ["tipo_operacion: venta", "tipo_propiedad: casa", "pileta: sí", "precio_usd: ≤ 200000"],
                color: "#0084FF",
              },
              {
                consulta: '"local comercial en microcentro para alquilar"',
                filtros: ["tipo_operacion: alquiler", "tipo_propiedad: local", "barrio: Microcentro"],
                color: "#E1306C",
              },
              {
                consulta: '"3 dormitorios, suite, cochera, apto crédito"',
                filtros: ["dormitorios: 3", "suite: sí", "cochera: sí", "apto_credito: sí"],
                color: "#D97706",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="anim-card feature-card"
                style={{
                  background: "white",
                  borderRadius: 16,
                  padding: "1.5rem",
                  border: "1px solid rgba(0,0,0,0.07)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                  transitionDelay: `${i * 0.1}s`,
                }}
              >
                <div
                  style={{
                    background: "#F8FAFC",
                    borderRadius: 10,
                    padding: "0.75rem 1rem",
                    marginBottom: "1rem",
                    fontSize: "0.88rem",
                    color: "#2B2B2B",
                    fontStyle: "italic",
                    lineHeight: 1.5,
                    borderLeft: `3px solid ${item.color}`,
                  }}
                >
                  <FaComments style={{ color: item.color, marginRight: 6 }} />
                  {item.consulta}
                </div>
                <div style={{ fontSize: "0.78rem", color: "#6B7280", marginBottom: "0.5rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Filtros aplicados automáticamente:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {item.filtros.map((f) => (
                    <span
                      key={f}
                      style={{
                        background: `${item.color}12`,
                        color: item.color,
                        border: `1px solid ${item.color}30`,
                        borderRadius: 999,
                        padding: "3px 10px",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <FaCheckCircle style={{ fontSize: "0.7rem" }} /> {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIOS ─────────────────────────────────────────────────────── */}
      <section
        style={{
          background: "linear-gradient(135deg, #1a2a1a 0%, #0d1f0d 100%)",
          padding: "4rem 2rem",
          color: "white",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="anim-card" style={{ textAlign: "center" }}>
            <Badge color="#D97706" bg="rgba(217,119,6,0.15)">Testimonios</Badge>
          </div>
          <SectionTitle light className="anim-card">
            Lo que dicen las inmobiliarias que ya lo usan
          </SectionTitle>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.5rem",
              marginTop: "2rem",
            }}
          >
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                className="anim-card"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 16,
                  padding: "2rem",
                  backdropFilter: "blur(10px)",
                  transitionDelay: `${i * 0.12}s`,
                }}
              >
                <FaQuoteLeft style={{ color: "#D97706", fontSize: "1.5rem", marginBottom: "1rem", opacity: 0.7 }} />
                <p style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "rgba(255,255,255,0.82)", marginBottom: "1.2rem" }}>
                  {t.text}
                </p>
                <div style={{ display: "flex", gap: 3, marginBottom: "0.75rem" }}>
                  {Array.from({ length: t.stars }).map((_, si) => (
                    <FaStar key={si} style={{ color: "#F59E0B", fontSize: "0.85rem" }} />
                  ))}
                </div>
                <div style={{ fontWeight: 700, color: "white", fontSize: "0.92rem" }}>{t.name}</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.82rem" }}>{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARACIÓN ─────────────────────────────────────────────────────── */}
      <section style={{ background: "white", padding: "4.5rem 2rem" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div className="anim-card" style={{ textAlign: "center" }}>
            <Badge color="#D97706" bg="#FEF3C7">PropBot vs. la alternativa</Badge>
          </div>
          <SectionTitle className="anim-card">
            ¿Cuánto cuesta atender redes con una persona?
          </SectionTitle>
          <SectionSubtitle>
            Antes de ver los precios, mirá la comparación real.
          </SectionSubtitle>

          <div
            className="anim-card"
            style={{
              background: "white",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
              border: "1px solid #E5E7EB",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr" }}>
              <div style={{ padding: "1.1rem 1.5rem", background: "#F9FAFB", borderBottom: "2px solid #E5E7EB" }}>
                <span style={{ fontSize: "0.8rem", color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Característica</span>
              </div>
              <div style={{ padding: "1.1rem 1.5rem", background: "#FEF2F2", borderBottom: "2px solid #FECACA", textAlign: "center" }}>
                <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#DC2626" }}>❌ Sin bot</div>
                <div style={{ fontSize: "0.72rem", color: "#9CA3AF" }}>Asesor de redes</div>
              </div>
              <div style={{ padding: "1.1rem 1.5rem", background: "linear-gradient(135deg, #D97706, #F59E0B)", borderBottom: "2px solid #D97706", textAlign: "center" }}>
                <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "white" }}>✅ PropBot</div>
                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.8)" }}>Automatizado</div>
              </div>
            </div>

            {[
              { feature: "Horario de atención", no: "8hs × 5 días", yes: "24 / 7 · 365 días" },
              { feature: "Tiempo de 1ª respuesta", no: "15–60 minutos", yes: "< 5 segundos" },
              { feature: "Canales cubiertos", no: "1 (difícil cubrir 3)", yes: "WhatsApp + IG + FB" },
              { feature: "Tiempo libre del equipo", no: "0 — todos atentos al chat", yes: "3+ horas/día recuperadas" },
              { feature: "Feriados y fines de semana", no: "Sin cobertura", yes: "Funciona igual" },
              { feature: "Escala a humano", no: "Siempre manual", yes: "Automático con contexto" },
              { feature: "Vacaciones / bajas", no: "Para todo", yes: "No aplica" },
            ].map((row, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1fr 1fr",
                  borderBottom: "1px solid #F3F4F6",
                }}
              >
                <div style={{ padding: "0.9rem 1.5rem", fontSize: "0.88rem", fontWeight: 600, color: "#374151" }}>
                  {row.feature}
                </div>
                <div style={{ padding: "0.9rem 1.5rem", fontSize: "0.85rem", color: "#DC2626", textAlign: "center", background: "rgba(254,242,242,0.4)" }}>
                  {row.no}
                </div>
                <div style={{ padding: "0.9rem 1.5rem", fontSize: "0.85rem", color: "#065F46", fontWeight: 600, textAlign: "center", background: "rgba(236,253,245,0.4)" }}>
                  {row.yes}
                </div>
              </div>
            ))}
          </div>

          <p style={{ textAlign: "center", marginTop: "1.2rem", fontSize: "0.82rem", color: "#9CA3AF" }}>
            * Estimación para Argentina 2025. PropBot no tiene aportes, aguinaldo ni vacaciones.
          </p>
        </div>
      </section>

      {/* ── PRECIOS ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: "4rem 2rem", background: "#F8FAFC" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="anim-card" style={{ textAlign: "center" }}>
            <Badge>Paquetes</Badge>
          </div>
          <SectionTitle className="anim-card">Tres paquetes, un precio a medida</SectionTitle>
          <SectionSubtitle>
            Cada inmobiliaria es distinta. Agendá una llamada y te armamos la propuesta según tu volumen de consultas y canales.
          </SectionSubtitle>

          <div
            className="anim-card"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "2rem",
              flexWrap: "wrap",
              marginBottom: "2.5rem",
            }}
          >
            {[
              { icon: "🛡️", text: "Garantía 30 días o te devolvemos el dinero" },
              { icon: "⚡", text: "14 días gratis para probar" },
              { icon: "🔓", text: "Sin contratos, cancelás cuando querés" },
            ].map((g) => (
              <div
                key={g.text}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "white",
                  border: "1.5px solid #E5E7EB",
                  borderRadius: 999,
                  padding: "0.55rem 1.2rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#374151",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                <span>{g.icon}</span> {g.text}
              </div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1.5rem",
              alignItems: "stretch",
            }}
          >
            {plans.map((plan, i) => (
              <div
                key={plan.name}
                className="anim-card price-card"
                style={{
                  background: plan.highlight
                    ? "linear-gradient(155deg, #1a2a1a 0%, #0d1f0d 100%)"
                    : "white",
                  borderRadius: 20,
                  padding: "2rem 1.8rem",
                  border: plan.highlight
                    ? "2px solid #8B5CF6"
                    : "2px solid rgba(0,0,0,0.07)",
                  boxShadow: plan.highlight
                    ? "0 12px 40px rgba(139,92,246,0.2)"
                    : "0 4px 20px rgba(0,0,0,0.07)",
                  transition: "all 0.3s ease",
                  transitionDelay: `${i * 0.1}s`,
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {plan.badge && (
                  <div
                    style={{
                      position: "absolute",
                      top: -14,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: plan.highlight
                        ? "linear-gradient(135deg, #8B5CF6, #6D28D9)"
                        : "linear-gradient(135deg, #D97706, #F59E0B)",
                      color: "white",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "4px 16px",
                      borderRadius: 999,
                      whiteSpace: "nowrap",
                      boxShadow: plan.highlight
                        ? "0 4px 15px rgba(139,92,246,0.4)"
                        : "0 4px 15px rgba(217,119,6,0.4)",
                    }}
                  >
                    {plan.badge === "Más elegido" ? "⭐ " : "✨ "}{plan.badge}
                  </div>
                )}

                {/* Nombre + canal */}
                <div style={{ marginBottom: "1.2rem" }}>
                  <h3
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: 800,
                      color: plan.highlight ? "white" : "#2B2B2B",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {plan.name}
                  </h3>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: `${plan.channelColor}18`,
                      border: `1px solid ${plan.channelColor}40`,
                      borderRadius: 999,
                      padding: "4px 12px",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: plan.channelColor,
                    }}
                  >
                    <span style={{ fontSize: "1rem" }}>{plan.channelIcon}</span>
                    {plan.channel}
                  </div>
                </div>

                <p
                  style={{
                    fontSize: "0.88rem",
                    color: plan.highlight ? "rgba(255,255,255,0.65)" : "#6B7280",
                    marginBottom: "1.5rem",
                    lineHeight: 1.6,
                  }}
                >
                  {plan.desc}
                </p>

                <div style={{ marginBottom: "1.8rem", flexGrow: 1 }}>
                  {plan.features.map((feat) => (
                    <div
                      key={feat}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        marginBottom: "0.6rem",
                        fontSize: "0.88rem",
                        color: plan.highlight ? "rgba(255,255,255,0.82)" : "#4B5563",
                        lineHeight: 1.45,
                      }}
                    >
                      <FaCheckCircle
                        style={{
                          color: plan.channelColor,
                          flexShrink: 0,
                          fontSize: "0.85rem",
                          marginTop: 2,
                        }}
                      />
                      {feat}
                    </div>
                  ))}
                </div>

                {/* CTA sin precio */}
                <a
                  href={plan.ctaHref}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "0.85rem",
                    borderRadius: 12,
                    background: plan.highlight
                      ? `linear-gradient(135deg, ${plan.channelColor}, #6D28D9)`
                      : `${plan.channelColor}15`,
                    border: plan.highlight ? "none" : `2px solid ${plan.channelColor}40`,
                    color: plan.highlight ? "white" : plan.channelColor,
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    textDecoration: "none",
                    transition: "all 0.3s ease",
                    boxShadow: plan.highlight
                      ? `0 6px 20px ${plan.channelColor}40`
                      : "none",
                    marginTop: "auto",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = `0 10px 28px ${plan.channelColor}35`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = plan.highlight
                      ? `0 6px 20px ${plan.channelColor}40`
                      : "none";
                  }}
                >
                  <FaComments style={{ fontSize: "1rem" }} />
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>

          {/* Nota de video IA */}
          <div
            className="anim-card"
            style={{
              marginTop: "2rem",
              background: "linear-gradient(135deg, #FFF7ED, #FEF3C7)",
              border: "1px solid rgba(217,119,6,0.25)",
              borderRadius: 16,
              padding: "1.2rem 1.8rem",
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "1.8rem" }}>🎬</span>
            <div>
              <div style={{ fontWeight: 700, color: "#2B2B2B", fontSize: "0.95rem", marginBottom: 2 }}>
                Premium incluye 4 videos de propiedades por mes generados con IA
              </div>
              <div style={{ fontSize: "0.85rem", color: "#6B7280" }}>
                Fotos de la planilla + música + texto → video listo para Instagram y Facebook. Videos adicionales disponibles por unidad.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VIDEO IA DEMO ───────────────────────────────────────────────────── */}
      <VideoDemoSection />

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section style={{ padding: "4rem 2rem", background: "white" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <div className="anim-card" style={{ textAlign: "center" }}>
            <Badge>Preguntas frecuentes</Badge>
          </div>
          <SectionTitle className="anim-card">Respuestas a las dudas más comunes</SectionTitle>

          <div style={{ marginTop: "2rem" }}>
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="anim-card faq-item"
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                style={{
                  background: "#FAFAFA",
                  border: `1px solid ${activeFaq === i ? "rgba(217,119,6,0.4)" : "rgba(0,0,0,0.07)"}`,
                  borderRadius: 12,
                  marginBottom: "0.75rem",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  transitionDelay: `${i * 0.05}s`,
                }}
              >
                <div
                  style={{
                    padding: "1.1rem 1.3rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#2B2B2B", fontSize: "0.95rem", lineHeight: 1.4 }}>
                    {faq.q}
                  </span>
                  <span
                    style={{
                      fontSize: "1.2rem",
                      color: "#D97706",
                      flexShrink: 0,
                      transition: "transform 0.3s ease",
                      transform: activeFaq === i ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                  >
                    +
                  </span>
                </div>
                {activeFaq === i && (
                  <div
                    style={{
                      padding: "0 1.3rem 1.1rem",
                      fontSize: "0.92rem",
                      color: "#6B7280",
                      lineHeight: 1.7,
                      borderTop: "1px solid rgba(0,0,0,0.06)",
                      paddingTop: "1rem",
                    }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AGENDÁ UNA LLAMADA ───────────────────────────────────────────────── */}
      <section
        id="contacto"
        style={{
          background: "linear-gradient(160deg, #0B1A3E 0%, #0D2252 50%, #0B1A3E 100%)",
          padding: "5rem 2rem",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Orb de fondo */}
        <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: 700, height: 400, background: "radial-gradient(circle, rgba(217,119,6,0.1) 0%, transparent 65%)", filter: "blur(60px)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 2, maxWidth: 1100, margin: "0 auto" }}>
          {/* Header de sección */}
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <Badge color="#D97706" bg="rgba(217,119,6,0.2)">Reservá tu lugar</Badge>
            <h2 style={{ fontSize: "clamp(1.9rem, 4vw, 2.6rem)", fontWeight: 900, marginTop: "0.6rem", marginBottom: "0.8rem", lineHeight: 1.2 }}>
              Agendá una llamada de 15 minutos
            </h2>
            <p style={{ color: "rgba(255,255,255,0.65)", maxWidth: 480, margin: "0 auto", lineHeight: 1.7, fontSize: "1rem" }}>
              Te mostramos el bot en vivo con propiedades reales y te armamos la propuesta según tu volumen de consultas.
            </p>
          </div>

          {/* Layout: bullets izq + widget der */}
          <div
            className="calendly-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr) minmax(0,2fr)",
              gap: "3rem",
              alignItems: "start",
            }}
          >
            {/* Columna izquierda — qué pasa en la llamada */}
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: "1.2rem" }}>
                En 15 minutos vas a ver
              </div>
              {[
                { icon: "🤖", text: "El bot respondiendo consultas en vivo con propiedades reales" },
                { icon: "📊", text: "Cómo se integra con tu Google Sheet o la plantilla que te damos" },
                { icon: "⚡", text: "El proceso de setup de 48hs explicado paso a paso" },
                { icon: "💰", text: "Precio final según tu cantidad de canales y propiedades" },
                { icon: "🛡️", text: "Garantía 30 días — si no te convence, te devolvemos el dinero" },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    marginBottom: "1.1rem",
                    padding: "0.9rem 1rem",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <span style={{ fontSize: "1.2rem", flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>
                  <span style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.5 }}>{item.text}</span>
                </div>
              ))}

              <div
                style={{
                  marginTop: "1.5rem",
                  padding: "1rem",
                  background: "rgba(217,119,6,0.12)",
                  border: "1px solid rgba(217,119,6,0.3)",
                  borderRadius: 10,
                  fontSize: "0.85rem",
                  color: "#FCD34D",
                  lineHeight: 1.5,
                }}
              >
                🔒 Sin compromiso. Si no es para vos, no hay problema.
              </div>
            </div>

            {/* Columna derecha — Calendly widget */}
            <div
              style={{
                background: "white",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                minHeight: 600,
              }}
            >
              {calendlyLoaded ? (
                <div
                  ref={calendlyRef}
                  className="calendly-inline-widget"
                  data-url={CALENDLY_URL}
                  style={{ minWidth: "100%", height: 630 }}
                />
              ) : (
                <div style={{ height: 630, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
                  <div style={{ width: 36, height: 36, border: "3px solid #E5E7EB", borderTopColor: "#D97706", borderRadius: "50%", animation: "rotateSlow 0.8s linear infinite" }} />
                  <span style={{ color: "#9CA3AF", fontSize: "0.88rem" }}>Cargando calendario…</span>
                </div>
              )}
            </div>
          </div>

          {/* Mobile fallback */}
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <a
              href="https://calendly.com/sanchezgcandelaria/15min"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.85rem",
                color: "rgba(255,255,255,0.45)",
                textDecoration: "underline",
              }}
            >
              ¿No carga el calendario? Abrilo acá →
            </a>
          </div>
        </div>
      </section>

      {/* ── STICKY CTA BAR ──────────────────────────────────────────────────── */}
      {showSticky && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 999,
            background: "rgba(11,26,62,0.97)",
            borderTop: "2px solid rgba(217,119,6,0.5)",
            padding: "0.85rem 2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "2.5rem",
            flexWrap: "wrap",
            backdropFilter: "blur(12px)",
            boxShadow: "0 -8px 30px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "1.4rem" }}>⚡</span>
            <div>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "white", lineHeight: 1.3 }}>
                14 días gratis · Setup en 48hs · Garantía 30 días
              </div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>
                Respondé cada consulta en menos de 5 segundos
              </div>
            </div>
          </div>
          <a
            href="#contacto"
            style={{
              background: "linear-gradient(135deg, #D97706, #F59E0B)",
              color: "white",
              padding: "0.7rem 2rem",
              borderRadius: 999,
              fontWeight: 700,
              fontSize: "0.9rem",
              textDecoration: "none",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 16px rgba(217,119,6,0.45)",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            <FaBolt /> Empezar gratis
          </a>
        </div>
      )}

      {/* ── SCROLL TO TOP ───────────────────────────────────────────────────── */}
      {showSticky && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            position: "fixed",
            bottom: showSticky ? 88 : 92,
            right: 90,
            zIndex: 998,
            width: 40,
            height: 40,
            background: "rgba(11,26,62,0.9)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
            transition: "transform 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          aria-label="Volver arriba"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      )}

      {/* ── WA FLOTANTE ─────────────────────────────────────────────────────── */}
      <a
        href="https://wa.me/5491123485638"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "fixed",
          bottom: showSticky ? 80 : 24,
          right: 24,
          zIndex: 998,
          width: 56,
          height: 56,
          background: "#25D366",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(37,211,102,0.5)",
          transition: "bottom 0.3s ease, transform 0.2s ease",
          textDecoration: "none",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        aria-label="Escribinos por WhatsApp"
      >
        <FaWhatsapp style={{ color: "white", fontSize: "1.7rem" }} />
      </a>

      {/* ── PROPBOT FOOTER ──────────────────────────────────────────────────── */}
      <footer
        style={{
          background: "#060F24",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "2.2rem 2rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 9,
            marginBottom: "0.65rem",
          }}
        >
          <div style={{ position: "relative", width: 34, height: 34 }}>
            <div
              style={{
                width: 34,
                height: 34,
                background: "linear-gradient(145deg, #92400E, #D97706)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TbBuildingEstate size={20} color="white" />
            </div>
            <div
              style={{
                position: "absolute",
                bottom: -4,
                right: -4,
                width: 17,
                height: 17,
                background: "white",
                borderRadius: 5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 5px rgba(0,0,0,0.2)",
              }}
            >
              <TbMessageChatbot size={11} color="#D97706" />
            </div>
          </div>
          <span style={{ fontWeight: 900, fontSize: "1.05rem", letterSpacing: "-0.02em" }}>
            <span style={{ color: "white" }}>Prop</span><span style={{ color: "#FCD34D" }}>Bot</span>
          </span>
        </div>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.78rem", margin: 0 }}>
          © {new Date().getFullYear()} PropBot · Todos los derechos reservados.
        </p>
      </footer>
    </>
  );
};

export default RealEstateBot;
