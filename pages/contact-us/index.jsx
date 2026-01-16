import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Head from "next/head";
import Script from "next/script";
import { motion } from "framer-motion";
import useMediaQuery from "../../src/Hooks/useMediaQuery";
import EstimateForm from "../../src/components/ContactForm/EstimateForm";

const ContactUs = () => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const calendlyUrl = "https://calendly.com/sanchezgcandelaria/15min?hide_event_type_details=1&text_color=1e293b&primary_color=f97b72";
  const calendlyWidgetRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = React.useState(false);

  useEffect(() => {
    // Solo inicializar Calendly si el script está cargado y no estamos en mobile
    if (scriptLoaded && !isMobile && typeof window !== "undefined" && window.Calendly) {
      // El script automáticamente inicializará los widgets con la clase calendly-inline-widget
      // No necesitamos llamar manualmente a initInlineWidget
    }
  }, [scriptLoaded, isMobile]);

  return (
    <>
      <Head>
        <title>{t("contactUsMetaTitle", "Contact Us - OpenGateHub")}</title>
        <meta
          name="description"
          content={t(
            "contactUsMetaDescription",
            "Choose the fastest way to move forward — book a call or request an estimate.",
          )}
        />
      </Head>

      {/* Calendly Widget Script - Solo cargar en desktop */}
      {!isMobile && (
        <Script
          src="https://assets.calendly.com/assets/external/widget.js"
          strategy="lazyOnload"
          onLoad={() => setScriptLoaded(true)}
        />
      )}

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: isMobile ? "1.5rem 1rem" : "1.5rem 1rem",
        }}
      >
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            textAlign: "center",
            marginBottom: "2rem",
          }}
        >
          <h1
            style={{
              fontSize: isMobile ? "1.75rem" : "2rem",
              fontWeight: "700",
              marginBottom: "0.75rem",
              color: "#1e293b",
            }}
          >
            {t("contactPage.heroTitle") || "Let's talk about your project"}
          </h1>
          <p
            style={{
              fontSize: isMobile ? "0.9rem" : "1rem",
              color: "#64748b",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            {t("contactPage.heroSubtitle") || 
              "Choose the fastest way to move forward — book a call or request an estimate."}
          </p>
        </motion.div>

        {/* Two Conversion Paths */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          {/* Path A: Book a Call */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{
              background: "white",
              borderRadius: "12px",
              padding: isMobile ? "1.5rem" : "1.75rem",
              border: "none",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
            }}
          >
            <h2
              style={{
                fontSize: isMobile ? "1.25rem" : "1.35rem",
                fontWeight: "600",
                marginBottom: "0.4rem",
                color: "#1e293b",
              }}
            >
              {t("contactPage.bookCallTitle") || "Book a strategy call"}
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#64748b",
                marginBottom: "1.25rem",
              }}
            >
              {t("contactPage.bookCallDescription") || 
                "For teams ready to scale with senior engineers."}
            </p>

            {isMobile ? (
              // Mobile: Botón que redirige a Calendly
              <a
                href={calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "10px 20px",
                  backgroundColor: "#f97b72",
                  color: "white",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  transition: "all 0.3s ease",
                  width: "100%",
                  textAlign: "center",
                  border: "2px solid #f97b72",
                  cursor: "pointer",
                  boxShadow: "none",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#e06a5f";
                  e.currentTarget.style.borderColor = "#e06a5f";
                  // Crear la línea inferior
                  if (!e.currentTarget.querySelector(".bottom-line")) {
                    const line = document.createElement("div");
                    line.className = "bottom-line";
                    line.style.cssText = "position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: white; transform: scaleX(0); transform-origin: right; transition: transform 0.3s ease;";
                    e.currentTarget.appendChild(line);
                    setTimeout(() => {
                      line.style.transform = "scaleX(1)";
                      line.style.transformOrigin = "left";
                    }, 10);
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#f97b72";
                  e.currentTarget.style.borderColor = "#f97b72";
                  const line = e.currentTarget.querySelector(".bottom-line");
                  if (line) {
                    line.style.transform = "scaleX(0)";
                    line.style.transformOrigin = "right";
                    setTimeout(() => line.remove(), 300);
                  }
                }}
              >
                {t("contactPage.bookCallButton") || "Book a 15-min strategy call"}
              </a>
            ) : (
              // Desktop: Embed de Calendly
              <div
                ref={calendlyWidgetRef}
                className="calendly-inline-widget"
                data-url={calendlyUrl}
                style={{
                  minWidth: "320px",
                  height: "700px",
                  width: "100%",
                }}
              />
            )}
            <p
              style={{
                fontSize: "0.8rem",
                color: "#94a3b8",
                textAlign: isMobile ? "left" : "center",
                marginTop: "0.75rem",
                marginBottom: "0",
                lineHeight: "1.4",
              }}
            >
              {t("contactPage.bookCallDisclaimer") || "No commitment. We'll assess fit and next steps."}
            </p>
          </motion.div>

          {/* Path B: Get an Estimate */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{
              background: "white",
              borderRadius: "12px",
              padding: isMobile ? "1.5rem" : "1.75rem",
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
          >
            <h2
              style={{
                fontSize: isMobile ? "1.25rem" : "1.35rem",
                fontWeight: "600",
                marginBottom: "0.4rem",
                color: "#1e293b",
              }}
            >
              {t("contactPage.getEstimateTitle") || "Request a project estimate"}
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#64748b",
                marginBottom: "1.25rem",
              }}
            >
              {t("contactPage.getEstimateDescription") || 
                "Tell us a bit about your needs and we'll suggest the best engagement model."}
            </p>

            <EstimateForm />
          </motion.div>
        </div>

        {/* What Happens Next Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          style={{
            textAlign: "center",
            marginBottom: "3rem",
          }}
        >
          <h2
            style={{
              fontSize: isMobile ? "1.5rem" : "2rem",
              fontWeight: "700",
              marginBottom: "2rem",
              color: "#1e293b",
            }}
          >
            {t("contactPage.whatHappensNext") || "What happens next"}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
              gap: "2rem",
              maxWidth: "900px",
              margin: "0 auto",
            }}
          >
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                style={{
                  padding: "1.5rem",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #F97B72 0%, #E35A52 100%)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "700",
                    fontSize: "1.25rem",
                    margin: "0 auto 1rem",
                  }}
                >
                  {step}
                </div>
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: "600",
                    marginBottom: "0.5rem",
                    color: "#1e293b",
                  }}
                >
                  {t(`contactPage.step${step}Title`) || 
                    (step === 1 ? "We review your request within 24 hours" :
                     step === 2 ? "We recommend the best engagement model" :
                     "You get a clear next step — call or proposal.")}
                </h3>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          style={{
            textAlign: "center",
            padding: "1.25rem",
            background: "#f8fafc",
            borderRadius: "12px",
          }}
        >
          <p
            style={{
              fontSize: "0.9rem",
              color: "#64748b",
              marginBottom: "0.75rem",
            }}
          >
            {t("contactPage.footerCTAText") || "Prefer to talk first?"}
          </p>
          <a
            href={calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#F97B72",
              fontWeight: "600",
              textDecoration: "none",
              fontSize: "0.9rem",
              borderBottom: "2px solid #F97B72",
              paddingBottom: "2px",
              transition: "all 0.2s ease",
              display: "inline-block",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#E35A52";
              e.currentTarget.style.borderBottomColor = "#E35A52";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#F97B72";
              e.currentTarget.style.borderBottomColor = "#F97B72";
            }}
          >
            {t("contactPage.footerCTALink") || "Book a call"} →
          </a>
        </motion.div>
      </div>
    </>
  );
};

export default ContactUs;
