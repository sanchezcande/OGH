import React, { useEffect, useState } from "react";
import SEO from "../../src/components/SEO/SEO";
import CallToActionBlock from "../../src/components/CallToAction/CallToAction";
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
    border-color: rgba(249,123,114,0.4) !important;
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
    box-shadow: 0 20px 50px rgba(249,123,114,0.25) !important;
  }
  .faq-item:hover { border-color: rgba(249,123,114,0.5) !important; }
  .chat-bubble-in  { animation: slideIn 0.5s ease forwards; }
  .shimmer-text {
    background: linear-gradient(90deg, #fff 0%, #F97B72 50%, #fff 100%);
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

const Badge = ({ children, color = "#F97B72", bg = "#FFE3E1" }) => (
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
      border: "1px solid rgba(249,123,114,0.2)",
      maxWidth: 280,
      fontSize: "0.85rem",
    }}
  >
    <div
      style={{
        background: "linear-gradient(135deg, #F97B72, #ff9a72)",
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
        color: "#F97B72",
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
      <FaMapMarkerAlt style={{ color: "#F97B72", flexShrink: 0 }} />
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
          <Badge color="#F97B72" bg="#FFE3E1">Premium · Video IA</Badge>
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
              { step: "1", icon: "📸", title: "Fotos en la planilla", desc: "Las fotos ya están cargadas en la columna fotos_url de tu Google Sheet." },
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
                    background: "linear-gradient(135deg, #F97B72, #ff9a72)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.8rem",
                    fontWeight: 800,
                    color: "white",
                    flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(249,123,114,0.35)",
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
                border: "1px solid rgba(249,123,114,0.2)",
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
                      <div style={{ marginTop: 8, fontSize: "1.1rem", fontWeight: 900, color: "#F97B72" }}>
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
                          background: "#F97B72",
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
                    background: "linear-gradient(90deg, #F97B72, #ff6b6b)",
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
                  background: "linear-gradient(135deg, #F97B72, #ff6b6b)",
                  color: "white",
                  border: "none",
                  borderRadius: 999,
                  padding: "0.75rem 2rem",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 8px 25px rgba(249,123,114,0.4)",
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
      title: "Lee tu Google Sheet o Excel",
      desc: "Conectá tu planilla existente con las columnas estándar (título, precio, barrio, ambientes, características) y el bot la interpreta automáticamente. Sin migrar datos.",
    },
    {
      icon: <FaFilter />,
      color: "#F97B72",
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
      title: "Compartís tu planilla",
      desc: "Nos pasás tu Google Sheet o Excel con las propiedades en el formato estándar. Si no tenés uno todavía, te damos la plantilla lista.",
      color: "#F97B72",
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
    { col: "fotos_url", ejemplo: "drive.google.com/…", desc: "Enviadas automáticamente al cliente" },
    { col: "horarios_visita", ejemplo: "Lunes 9-12, Sáb 10-13", desc: "Incluidos en la respuesta del bot" },
  ];

  const plans = [
    {
      name: "Starter",
      channel: "WhatsApp",
      channelColor: "#25D366",
      channelIcon: <FaWhatsapp />,
      desc: "Para inmobiliarias que quieren automatizar su canal más activo sin complicarse.",
      features: [
        "Bot 24/7 por WhatsApp Business",
        "Responde consultas y filtra leads",
        "Agenda visitas automáticamente",
        "Notificaciones al asesor en tiempo real",
        "Lee tu Google Sheet o Excel",
        "Setup completo incluido",
      ],
      cta: "Agenda una llamada",
      ctaHref: "/contact-us?plan=starter",
      highlight: false,
      badge: null,
    },
    {
      name: "Pro",
      channel: "WhatsApp + Instagram + Facebook",
      channelColor: "#8B5CF6",
      channelIcon: <span style={{ display: "flex", gap: 4 }}><FaWhatsapp /><FaInstagram /><FaFacebookMessenger /></span>,
      desc: "Un solo bot que cubre todos tus canales sociales simultáneamente.",
      features: [
        "Todo lo del plan Starter",
        "Instagram Direct integrado",
        "Facebook Messenger integrado",
        "Un solo bot, tres canales activos",
        "Múltiples planillas / sucursales",
        "Dashboard de métricas y leads",
        "Soporte prioritario 24hs",
      ],
      cta: "Agenda una llamada",
      ctaHref: "/contact-us?plan=pro",
      highlight: true,
      badge: "Más elegido",
    },
    {
      name: "Premium",
      channel: "Pro + Video IA de propiedades",
      channelColor: "#F97B72",
      channelIcon: <span>🎬</span>,
      desc: "Generación automática de videos de cada propiedad para publicar en redes.",
      features: [
        "Todo lo del plan Pro",
        "4 videos de propiedades/mes con IA",
        "Fotos + música + texto generados automáticamente",
        "Listos para publicar en Instagram y Facebook",
        "Videos extra disponibles",
        "Ideal para desarrolladoras y grandes carteras",
      ],
      cta: "Agenda una llamada",
      ctaHref: "/contact-us?plan=premium",
      highlight: false,
      badge: "Nuevo",
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
      q: "¿Funciona con mi planilla actual de Excel?",
      a: "Sí. Podemos trabajar con Google Sheets o Excel subido a Drive. También te proveemos una plantilla optimizada con todas las columnas que el bot puede leer (incluidas las 30+ características de propiedades).",
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
        title="Real Estate Bot — Automatizá las consultas de tu inmobiliaria | OpenGateHub"
        description="Bot inteligente que responde consultas de ventas y alquileres por WhatsApp, Facebook e Instagram leyendo tu Google Sheet o Excel. Activo 24/7, sin código."
        keywords="bot inmobiliaria, bot whatsapp propiedades, automatización inmobiliaria, chatbot real estate, responder consultas inmobiliaria, bot google sheets propiedades"
      />

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section
        style={{
          background: "linear-gradient(135deg, #1a2a1a 0%, #0d1f0d 50%, #1a1a2e 100%)",
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
              'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><defs><pattern id="g" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M0 40 L40 0 L80 40 L40 80 Z" fill="none" stroke="rgba(249,123,114,0.06)" stroke-width="1"/><circle cx="40" cy="40" r="2" fill="rgba(37,211,102,0.08)"/></pattern></defs><rect width="80" height="80" fill="url(%23g)"/></svg>\')',
            opacity: 0.8,
          }}
        />
        {/* Orbs */}
        <div style={{ position: "absolute", top: "10%", left: "5%", width: 300, height: 300, background: "radial-gradient(circle, rgba(37,211,102,0.12) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 250, height: 250, background: "radial-gradient(circle, rgba(249,123,114,0.15) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(40px)" }} />

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
            Tu inmobiliaria{" "}
            <span className="shimmer-text">atiende sola</span>{" "}
            las consultas
          </h1>

          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.25rem)",
              color: "rgba(255,255,255,0.78)",
              maxWidth: 640,
              margin: "0 auto 2rem",
              lineHeight: 1.7,
              animation: "fadeInUp 0.7s 0.15s ease forwards",
              opacity: 0,
            }}
          >
            Un bot que lee tu Google Sheet o Excel con las propiedades y responde automáticamente por WhatsApp, Facebook e Instagram — ventas y alquileres, 24/7.
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
              href="/contact-us"
              style={{
                background: "linear-gradient(135deg, #F97B72, #ff6b6b)",
                color: "white",
                padding: "0.9rem 2rem",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: "1rem",
                textDecoration: "none",
                boxShadow: "0 8px 25px rgba(249,123,114,0.4)",
                transition: "all 0.3s ease",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <FaBolt /> Quiero el bot para mi inmobiliaria
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
              { num: "24/7", label: "Atención sin cortes" },
              { num: "< 5s", label: "Tiempo de respuesta" },
              { num: "+30", label: "Características de filtro" },
              { num: "48hs", label: "Setup completo" },
            ].map((m) => (
              <div key={m.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#F97B72" }}>{m.num}</div>
                <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)" }}>{m.label}</div>
              </div>
            ))}
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
            El bot entiende tu planilla actual
          </SectionTitle>
          <SectionSubtitle light>
            Compatible con el formato estándar de inmobiliarias. Si ya tenés tus propiedades en una hoja de cálculo, podés empezar hoy.
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
            ¿No tenés planilla todavía?{" "}
            <a
              href="/contact-us"
              style={{ color: "#4ade80", textDecoration: "underline", cursor: "pointer" }}
            >
              Te mandamos la plantilla gratis
            </a>{" "}
            con todas las columnas listas.
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
                color: "#F97B72",
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
            <Badge color="#F97B72" bg="rgba(249,123,114,0.15)">Testimonios</Badge>
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
                <FaQuoteLeft style={{ color: "#F97B72", fontSize: "1.5rem", marginBottom: "1rem", opacity: 0.7 }} />
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
                        : "linear-gradient(135deg, #F97B72, #ff6b6b)",
                      color: "white",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "4px 16px",
                      borderRadius: 999,
                      whiteSpace: "nowrap",
                      boxShadow: plan.highlight
                        ? "0 4px 15px rgba(139,92,246,0.4)"
                        : "0 4px 15px rgba(249,123,114,0.4)",
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
              border: "1px solid rgba(249,123,114,0.25)",
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
                  border: `1px solid ${activeFaq === i ? "rgba(249,123,114,0.4)" : "rgba(0,0,0,0.07)"}`,
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
                      color: "#F97B72",
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

      {/* ── CTA FINAL ───────────────────────────────────────────────────────── */}
      <CallToActionBlock
        title="¿Listo para automatizar tu inmobiliaria?"
        description="Sumá el bot a tu operación y empezá a responder cada consulta en segundos, los 7 días de la semana."
        buttonText="Quiero empezar ahora"
        highlightWord="inmobiliaria"
      />
    </>
  );
};

export default RealEstateBot;
