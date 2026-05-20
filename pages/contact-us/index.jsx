import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import SEO from "../../src/components/SEO/SEO";
import Script from "next/script";
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
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin-bottom: 1rem;
  color: rgba(255, 255, 255, 0.4);

  .word {
    display: inline-block;
    overflow: hidden;
    vertical-align: top;
    padding-bottom: 0.08em;

    .word-inner {
      display: inline-block;
      transform: translateY(120%);
      will-change: transform;
    }
  }

  .highlight {
    color: #fff;
  }
`;

const HeroSub = styled.p`
  font-size: 1.05rem;
  color: rgba(255, 255, 255, 0.4);
  line-height: 1.6;
  max-width: 480px;
  margin: 0 auto;
  opacity: 0;

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
  padding: 6rem 1.5rem 7rem;
`;

const StepsInner = styled.div`
  max-width: 900px;
  margin: 0 auto;
`;

const StepsTitle = styled.h2`
  font-family: "Space Grotesk", sans-serif;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #CC5A50;
  margin-bottom: 4rem;
  text-align: center;
`;

const StepsTimeline = styled.div`
  position: relative;
  max-width: 900px;
  margin: 0 auto;
`;

const TimelineTrack = styled.div`
  position: absolute;
  top: 28px;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.06);

  .timeline-fill {
    height: 100%;
    width: 0%;
    background: #CC5A50;
    transition: none;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const StepsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  position: relative;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    max-width: 400px;
    margin: 0 auto;
  }
`;

const StepCard = styled.div`
  padding: 0 2.5rem;
  position: relative;
  opacity: 0;
  transform: translateY(20px);

  &:first-child {
    padding-left: 0;
  }
  &:last-child {
    padding-right: 0;
  }

  @media (max-width: 768px) {
    padding: 0;
    margin-bottom: 2.5rem;
    &:last-child { margin-bottom: 0; }
  }
`;

const StepDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  margin-bottom: 2rem;
  position: relative;
  transition: all 0.8s ease;

  &.lit {
    background: #CC5A50;
    box-shadow: 0 0 12px rgba(204, 90, 80, 0.4);
  }

  &.done {
    background: rgba(255, 255, 255, 0.25);
    box-shadow: none;
  }

  @media (max-width: 768px) {
    margin-bottom: 1.25rem;
  }
`;

const StepNum = styled.span`
  font-family: "Space Grotesk", sans-serif;
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.15);
  display: block;
  margin-bottom: 0.75rem;
  transition: color 0.6s ease;

  .step-card.active & {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const StepLabel = styled.h3`
  font-family: "Space Grotesk", sans-serif;
  font-size: 1.2rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.2);
  margin-bottom: 0.75rem;
  letter-spacing: -0.01em;
  transition: color 0.6s ease;

  .step-card.active & {
    color: #fff;
  }
`;

const StepText = styled.p`
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.12);
  line-height: 1.65;
  transition: color 0.6s ease;

  .step-card.active & {
    color: rgba(255, 255, 255, 0.6);
  }
`;

/* ═══════════ COMPONENT ═══════════ */

const stepsData = [
  { num: "01", labelEn: "Review", labelEs: "Revisión", textEn: "We review your request and respond within 24 hours with a clear assessment.", textEs: "Revisamos tu solicitud y respondemos en 24 horas con una evaluación clara." },
  { num: "02", labelEn: "Recommend", labelEs: "Recomendación", textEn: "We recommend the best engagement model — automation, augmentation, or both.", textEs: "Recomendamos el mejor modelo — automatización, augmentation, o ambos." },
  { num: "03", labelEn: "Execute", labelEs: "Ejecución", textEn: "You get a clear next step — a strategy call or a detailed proposal.", textEs: "Obtenés un siguiente paso claro — una llamada estratégica o propuesta detallada." },
];

const splitHeroWords = (text, highlights = []) =>
  text.split(" ").map((word, i) => {
    const isHl = highlights.some(
      (h) => word.toLowerCase().replace(/[^a-záéíóúñ]/gi, "") === h.toLowerCase()
    );
    return (
      <span className="word" key={i}>
        <span className={`word-inner${isHl ? " highlight" : ""}`}>{word}&nbsp;</span>
      </span>
    );
  });

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
  const fillRef = useRef(null);

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
      // Hero entrance — word-by-word reveal (same as home hero)
      const words = heroTitleRef.current?.querySelectorAll(".word-inner");
      if (words?.length) {
        gsap.to(words, {
          y: 0,
          duration: 1,
          stagger: 0.08,
          ease: "power4.out",
          delay: 0.3,
        });
      }
      if (heroSubRef.current) {
        gsap.fromTo(heroSubRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.9 }
        );
      }

      // Hero parallax on scroll — use fromTo to avoid capturing entrance animation's inline opacity:0
      if (heroRef.current) {
        gsap.fromTo(heroTitleRef.current,
          { yPercent: 0, opacity: 1, scale: 1 },
          {
            yPercent: -50,
            opacity: 0,
            ease: "none",
            scrollTrigger: {
              trigger: heroRef.current,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          }
        );
        gsap.fromTo(heroSubRef.current,
          { yPercent: 0, opacity: 1 },
          {
            yPercent: -25,
            opacity: 0,
            ease: "none",
            scrollTrigger: {
              trigger: heroRef.current,
              start: "top top",
              end: "80% top",
              scrub: true,
            },
          }
        );
      }

      // Cards stagger reveal on scroll
      const cards = cardsRef.current?.querySelectorAll(".contact-card");
      if (cards?.length) {
        ScrollTrigger.create({
          trigger: cardsRef.current,
          start: "top 90%",
          once: true,
          onEnter: () => {
            cards.forEach((card, i) => {
              gsap.to(card, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: "power3.out",
                delay: i * 0.15,
              });
            });
          },
        });
        // Fallback: if already in view on load
        setTimeout(() => {
          cards.forEach((card) => {
            if (card.style.opacity === "0" || card.style.opacity === "") {
              gsap.to(card, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" });
            }
          });
        }, 500);
      }

      // Steps — timeline draw + sequential reveal
      const stepsEl = stepsRef.current;
      const steps = stepsEl?.querySelectorAll(".step-card");
      const dots = stepsEl?.querySelectorAll(".step-dot");
      const fill = fillRef.current;
      const mobile = window.innerWidth <= 768;

      if (steps?.length && mobile) {
        // Mobile: each step reveals individually on scroll
        steps.forEach((step, i) => {
          ScrollTrigger.create({
            trigger: step,
            start: "top 88%",
            once: true,
            onEnter: () => {
              gsap.to(step, {
                opacity: 1, y: 0, duration: 0.7, ease: "power2.out",
                onComplete: () => step.classList.add("active"),
              });

              if (dots[i]) {
                gsap.delayedCall(0.15, () => dots[i].classList.add("lit"));
              }

              if (i > 0 && dots[i - 1]) {
                dots[i - 1].classList.remove("lit");
                dots[i - 1].classList.add("done");
              }
            },
          });
        });
      } else if (steps?.length) {
        // Desktop: timeline draw + sequential reveal
        ScrollTrigger.create({
          trigger: stepsEl,
          start: "top 75%",
          once: true,
          onEnter: () => {
            const dur = 3;
            const n = steps.length;

            if (fill) {
              gsap.to(fill, { width: "100%", duration: dur, ease: "none" });
            }

            steps.forEach((step, i) => {
              const t = Math.max(0, ((i / n) * dur) - 0.9);

              gsap.to(step, {
                opacity: 1, y: 0, duration: 0.8, ease: "power2.out", delay: t,
                onComplete: () => step.classList.add("active"),
              });

              if (dots[i]) {
                gsap.delayedCall(t + 0.1, () => dots[i].classList.add("lit"));
              }

              if (i > 0 && dots[i - 1]) {
                gsap.delayedCall(t + 0.1, () => {
                  dots[i - 1].classList.remove("lit");
                  dots[i - 1].classList.add("done");
                });
              }
            });
          },
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

      {/* Hero (dark) + parallax */}
      <DarkSection>
        <HeroSection ref={heroRef}>
          <HeroTitle ref={heroTitleRef}>
            {splitHeroWords(
              isSpanish ? "Optimicemos tus operaciones" : "Let's optimize your operations",
              isSpanish ? ["Optimicemos"] : ["optimize"]
            )}
          </HeroTitle>
          <HeroSub ref={heroSubRef}>
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
        <StepsInner>
          <StepsTitle>{t("contactPage.whatHappensNext") || "What happens next"}</StepsTitle>
          <StepsTimeline>
            <TimelineTrack>
              <div className="timeline-fill" ref={fillRef} />
            </TimelineTrack>
            <StepsGrid ref={stepsRef}>
              {stepsData.map((step) => (
                <StepCard key={step.num} className="step-card">
                  <StepDot className="step-dot" />
                  <StepNum>{step.num}</StepNum>
                  <StepLabel>{isSpanish ? step.labelEs : step.labelEn}</StepLabel>
                  <StepText>{isSpanish ? step.textEs : step.textEn}</StepText>
                </StepCard>
              ))}
            </StepsGrid>
          </StepsTimeline>
        </StepsInner>
      </StepsOuter>
    </PageWrapper>
  );
};

export default ContactUs;
