import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import SEO from "../../src/components/SEO/SEO";
import Script from "next/script";
import { motion } from "framer-motion";
import useMediaQuery from "../../src/Hooks/useMediaQuery";
import EstimateForm from "../../src/components/ContactForm/EstimateForm";
import styled from "styled-components";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ═══════════ STYLED COMPONENTS ═══════════ */

const PageWrapper = styled.div`
  background: #fff;
  min-height: 100vh;
  overflow-x: hidden;
`;

const DarkSection = styled.div`
  background: #0a0a0a;
  color: #fff;
`;

const HeroSection = styled.section`
  padding: 10rem 1.5rem 5rem;
  text-align: center;
  max-width: 640px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 7rem 1.25rem 3rem;
  }
`;

const HeroTitle = styled.h1`
  font-size: clamp(2.2rem, 5vw, 3.2rem);
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin-bottom: 1rem;
  color: #fff;

  span {
    color: rgba(255, 255, 255, 0.35);
    font-weight: 400;
  }
`;

const HeroSub = styled.p`
  font-size: 1.05rem;
  color: rgba(255, 255, 255, 0.4);
  line-height: 1.6;
  max-width: 480px;
  margin: 0 auto;

  @media (max-width: 768px) {
    font-size: 0.95rem;
  }
`;

const WhiteSection = styled.div`
  background: #fff;
  padding: 5rem 1.5rem;

  @media (max-width: 768px) {
    padding: 2.5rem 1.25rem;
  }
`;

const ContentGrid = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const Card = styled.div`
  background: #fafafa;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 4px;
  padding: 2rem;
  opacity: 0;
  transform: translateY(30px);

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const CardLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #CC5A50;
  margin-bottom: 1rem;
  display: block;
`;

const CardTitle = styled.h2`
  font-size: 1.35rem;
  font-weight: 600;
  color: #111;
  margin-bottom: 0.5rem;
  letter-spacing: -0.01em;

  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const CardDesc = styled.p`
  font-size: 0.9rem;
  color: #666;
  line-height: 1.55;
  margin-bottom: 1.5rem;
`;

const CalendlyEmbed = styled.div`
  min-width: 320px;
  height: 660px;
  width: 100%;
  border-radius: 4px;
  overflow: hidden;

  & iframe {
    border-radius: 4px;
  }
`;

const MobileBookButton = styled.a`
  display: block;
  width: 100%;
  padding: 13px 24px;
  text-align: center;
  font-weight: 500;
  font-size: 0.9rem;
  color: #fff;
  background: #111;
  border: none;
  border-radius: 60px;
  text-decoration: none;
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(
      105deg,
      transparent 20%,
      rgba(255, 255, 255, 0.15) 50%,
      transparent 80%
    );
    transition: none;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);

    &::before {
      transition: left 0.5s ease;
      left: 150%;
    }
  }
`;

const Disclaimer = styled.p`
  font-size: 0.78rem;
  color: #999;
  margin-top: 1rem;
  margin-bottom: 0;
  line-height: 1.4;
`;

const StepsOuter = styled.div`
  background: #0a0a0a;
  padding: 5rem 1.5rem 6rem;
`;

const StepsInner = styled.div`
  max-width: 960px;
  margin: 0 auto;
`;

const StepsTitle = styled.h2`
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #CC5A50;
  margin-bottom: 3.5rem;
  text-align: center;
`;

const StepsTimeline = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
  max-width: 600px;
  margin: 0 auto;

  /* Vertical line */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 23px;
    width: 1px;
    height: 100%;
    background: rgba(255, 255, 255, 0.06);

    @media (max-width: 768px) {
      left: 19px;
    }
  }
`;

const StepLine = styled.div`
  position: absolute;
  top: 0;
  left: 23px;
  width: 1px;
  height: 0;
  background: #CC5A50;
  z-index: 1;
  transition: none;

  @media (max-width: 768px) {
    left: 19px;
  }
`;

const Step = styled.div`
  display: flex;
  gap: 2rem;
  padding: 2.5rem 0;
  opacity: 0;
  transform: translateX(-20px);

  @media (max-width: 768px) {
    gap: 1.5rem;
    padding: 2rem 0;
  }
`;

const StepDot = styled.div`
  width: 47px;
  min-width: 47px;
  height: 47px;
  border-radius: 50%;
  background: #0a0a0a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.3);
  position: relative;
  z-index: 2;
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);

  &.active {
    border-color: #CC5A50;
    color: #CC5A50;
    box-shadow: 0 0 20px rgba(204, 90, 80, 0.2);
  }

  @media (max-width: 768px) {
    width: 39px;
    min-width: 39px;
    height: 39px;
    font-size: 0.7rem;
  }
`;

const StepContent = styled.div`
  padding-top: 0.6rem;
`;

const StepLabel = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.4rem;
`;

const StepText = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.6;
`;

/* ═══════════ COMPONENT ═══════════ */

const stepsData = [
  { num: "01", labelEn: "Review", labelEs: "Revisión", textEn: "We review your request and respond within 24 hours with a clear assessment.", textEs: "Revisamos tu solicitud y respondemos en 24 horas con una evaluación clara." },
  { num: "02", labelEn: "Recommend", labelEs: "Recomendación", textEn: "We recommend the best engagement model — automation, augmentation, or both.", textEs: "Recomendamos el mejor modelo — automatización, augmentation, o ambos." },
  { num: "03", labelEn: "Execute", labelEs: "Ejecución", textEn: "You get a clear next step — a strategy call or a detailed proposal.", textEs: "Obtenés un siguiente paso claro — una llamada estratégica o propuesta detallada." },
];

const ContactUs = () => {
  const { t, i18n } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isSpanish = i18n.language === "es";
  const calendlyUrl = "https://calendly.com/sanchezgcandelaria/15min?hide_event_type_details=1&text_color=1e293b&primary_color=111111";
  const calendlyWidgetRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = React.useState(false);

  const heroRef = useRef(null);
  const heroTitleRef = useRef(null);
  const heroSubRef = useRef(null);
  const cardsRef = useRef(null);
  const stepsRef = useRef(null);
  const stepLineRef = useRef(null);

  useEffect(() => {
    if (scriptLoaded && !isMobile && calendlyWidgetRef.current && typeof window !== "undefined" && window.Calendly) {
      window.Calendly.initInlineWidget({
        url: calendlyUrl,
        parentElement: calendlyWidgetRef.current,
      });
    }
  }, [scriptLoaded, isMobile]);

  // Scroll animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero parallax — title moves slower than subtitle
      if (heroTitleRef.current) {
        gsap.to(heroTitleRef.current, {
          yPercent: -30,
          opacity: 0.3,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.3,
          },
        });
      }
      if (heroSubRef.current) {
        gsap.to(heroSubRef.current, {
          yPercent: -15,
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.3,
          },
        });
      }

      // Hero initial entrance
      if (heroRef.current) {
        gsap.from(heroTitleRef.current, { opacity: 0, y: 40, duration: 0.8, ease: "power3.out" });
        gsap.from(heroSubRef.current, { opacity: 0, y: 30, duration: 0.8, ease: "power3.out", delay: 0.15 });
      }

      // Cards stagger reveal
      const cards = cardsRef.current?.querySelectorAll(".contact-card");
      if (cards?.length) {
        cards.forEach((card, i) => {
          gsap.to(card, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            delay: i * 0.12,
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              once: true,
            },
          });
        });
      }

      // Steps timeline — line draws + steps reveal one by one
      const steps = stepsRef.current?.querySelectorAll(".contact-step");
      const dots = stepsRef.current?.querySelectorAll(".step-dot");
      if (steps?.length) {
        // Animate the red line growing
        if (stepLineRef.current) {
          gsap.to(stepLineRef.current, {
            height: "100%",
            duration: 1.8,
            ease: "power2.inOut",
            scrollTrigger: {
              trigger: stepsRef.current,
              start: "top 75%",
              once: true,
            },
          });
        }

        steps.forEach((step, i) => {
          gsap.to(step, {
            opacity: 1,
            x: 0,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: {
              trigger: stepsRef.current,
              start: "top 75%",
              once: true,
            },
            delay: i * 0.3,
          });

          // Dot lights up
          if (dots?.[i]) {
            gsap.delayedCall(i * 0.3 + 0.3, () => {
              dots[i].classList.add("active");
            });
            // Re-trigger with scroll
            ScrollTrigger.create({
              trigger: stepsRef.current,
              start: "top 75%",
              once: true,
              onEnter: () => {
                setTimeout(() => dots[i].classList.add("active"), i * 300 + 300);
              },
            });
          }
        });
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <PageWrapper>
      <SEO
        title="Book a Free Automation Audit | LATAM Experts | OpenGateHub"
        description="Book a free 15-minute automation audit with our LATAM experts. We'll identify your top operational bottlenecks and reply within 24 hours — no pitch, just a clear next step."
        keywords="automation audit, contact OpenGateHub, workflow consulting LATAM, business automation experts Latin America, book a call, nearshore consulting, staff augmentation consultation"
      />

      {!isMobile && (
        <Script
          src="https://assets.calendly.com/assets/external/widget.js"
          strategy="lazyOnload"
          onLoad={() => setScriptLoaded(true)}
        />
      )}

      {/* Hero (dark) */}
      <DarkSection>
        <HeroSection ref={heroRef}>
          <HeroTitle>
            {t("contactPage.heroTitle") || <>Let's optimize <span>your operations</span></>}
          </HeroTitle>
          <HeroSub>
            {t("contactPage.heroSubtitle") ||
              "Choose the fastest path forward: book an automation audit or request an execution estimate."}
          </HeroSub>
        </HeroSection>
      </DarkSection>

      {/* Two Paths (white) */}
      <WhiteSection>
        <ContentGrid ref={cardsRef}>
          {/* Path A: Book a Call */}
          <Card className="contact-card">
            <CardLabel>{t("contactPage.bookCallLabel") || "Fastest"}</CardLabel>
            <CardTitle>
              {t("contactPage.bookCallTitle") || "Book an automation audit"}
            </CardTitle>
            <CardDesc>
              {t("contactPage.bookCallDescription") ||
                "For teams that want to reduce manual work and improve operational speed."}
            </CardDesc>

            {isMobile ? (
              <MobileBookButton
                href={calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("contactPage.bookCallButton") || "Book a 15-min automation audit"} →
              </MobileBookButton>
            ) : (
              <CalendlyEmbed
                ref={calendlyWidgetRef}
                className="calendly-inline-widget"
                data-url={calendlyUrl}
              />
            )}
            <Disclaimer>
              {t("contactPage.bookCallDisclaimer") || "No commitment. You'll leave with a clear next step and priority actions."}
            </Disclaimer>
          </Card>

          {/* Path B: Get an Estimate */}
          <Card className="contact-card">
            <CardLabel>{t("contactPage.getEstimateLabel") || "Detailed"}</CardLabel>
            <CardTitle>
              {t("contactPage.getEstimateTitle") || "Request an execution estimate"}
            </CardTitle>
            <CardDesc>
              {t("contactPage.getEstimateDescription") ||
                "Share your needs and we'll recommend the best model: Workflow Automation, Staff Augmentation, or both."}
            </CardDesc>

            <EstimateForm />
          </Card>
        </ContentGrid>
      </WhiteSection>

      {/* What Happens Next (dark) */}
      <StepsOuter>
        <StepsInner ref={stepsRef}>
          <StepsTitle>{t("contactPage.whatHappensNext") || "What happens next"}</StepsTitle>
          <StepsGrid>
            {stepsData.map((step, i) => (
              <Step key={step.num} className="contact-step">
                <StepNumber>{step.num}</StepNumber>
                <StepLabel>{isSpanish ? step.labelEs : step.labelEn}</StepLabel>
                <StepText>{isSpanish ? step.textEs : step.textEn}</StepText>
              </Step>
            ))}
          </StepsGrid>
        </StepsInner>
      </StepsOuter>
    </PageWrapper>
  );
};

export default ContactUs;
