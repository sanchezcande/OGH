import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import SEO from "../../src/components/SEO/SEO";
import CallToActionBlock from "../../src/components/CallToAction/CallToAction";
import ScrollRevealText from "../../src/components/TypewriterText/TypewriterText";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ===================================================================
   STYLED COMPONENTS
   =================================================================== */

const PageWrapper = styled.div`
  overflow-x: hidden;
  background: #fff;
`;

/* ---------- HERO ---------- */
const HeroSection = styled.section`
  position: relative;
  height: 80vh;
  min-height: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #0a0a0a;
  overflow: hidden;
`;

const HeroGrid = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 0 2rem;
  max-width: 640px;
`;

const HeroTitle = styled.h1`
  font-family: "Space Grotesk", sans-serif;
  font-size: clamp(1.5rem, 3.2vw, 2.2rem);
  font-weight: 500;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: -0.025em;
  line-height: 1.2;
  margin: 0 0 1.25rem;

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

const HeroSubtitle = styled.p`
  font-family: "Space Grotesk", sans-serif;
  font-size: clamp(0.82rem, 1.1vw, 0.95rem);
  color: rgba(255, 255, 255, 0.4);
  line-height: 1.7;
  max-width: 460px;
  margin: 0 auto;
`;

const HeroLine = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.06), transparent);
`;

/* ---------- TEXT REVEAL ---------- */
const TextRevealSection = styled.section`
  position: relative;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  padding: 0 2rem;
`;

const TextRevealInner = styled.div`
  max-width: 900px;
  width: 100%;
`;

const RevealText = styled.p`
  font-family: "Space Grotesk", sans-serif;
  font-size: clamp(1.1rem, 2.2vw, 1.6rem);
  font-weight: 500;
  line-height: 1.65;
  color: #111;
  letter-spacing: -0.005em;
`;

const RevealWord = styled.span`
  opacity: 0.12;
  transition: opacity 0.1s;
  display: inline-block;
  margin-right: 0.3em;
`;

/* ---------- METRICS ---------- */
const MetricsSection = styled.section`
  position: relative;
  padding: 8rem 2rem;
  background: #fafafa;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
`;

const SectionContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const SectionLabel = styled.span`
  display: inline-block;
  font-family: "Space Grotesk", sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #CC5A50;
  margin-bottom: 1rem;
`;

const SectionHeading = styled.h2`
  font-family: "Space Grotesk", sans-serif;
  font-size: clamp(1.2rem, 2.2vw, 1.6rem);
  font-weight: 500;
  color: #111;
  letter-spacing: -0.015em;
  margin: 0 0 0.85rem;
`;

const SectionSubtext = styled.p`
  font-family: "Space Grotesk", sans-serif;
  font-size: 0.92rem;
  color: #777;
  line-height: 1.6;
  max-width: 560px;
  margin: 0 0 3.5rem;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const MetricCard = styled.div`
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 2rem;
  text-align: center;
  transition: border-color 0.3s, box-shadow 0.3s;

  &:hover {
    border-color: #ccc;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  }
`;

const MetricValue = styled.div`
  font-family: "Space Grotesk", sans-serif;
  font-size: 1.8rem;
  font-weight: 600;
  color: #111;
  margin-bottom: 0.5rem;
`;

const MetricTitle = styled.div`
  font-family: "Space Grotesk", sans-serif;
  font-size: 0.88rem;
  font-weight: 500;
  color: #333;
  margin-bottom: 0.4rem;
`;

const MetricDesc = styled.div`
  font-family: "Space Grotesk", sans-serif;
  font-size: 0.85rem;
  color: #999;
  line-height: 1.5;
`;

/* ---------- FEATURES / WHEN TO USE ---------- */
const FeaturesSection = styled.section`
  position: relative;
  padding: 8rem 2rem;
  background: #fff;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled.div`
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 2.5rem;
  transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s;

  &:hover {
    border-color: #ccc;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06);
    transform: translateY(-4px);
  }
`;

const FeatureIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 4px;
  background: #CC5A50;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
  color: #fff;
  font-size: 1rem;
`;

const FeatureTitle = styled.h3`
  font-family: "Space Grotesk", sans-serif;
  font-size: 1.02rem;
  font-weight: 500;
  color: #111;
  margin: 0 0 0.6rem;
`;

const FeatureDesc = styled.p`
  font-family: "Space Grotesk", sans-serif;
  font-size: 0.85rem;
  color: #888;
  line-height: 1.6;
  margin: 0;
`;

/* ---------- HORIZONTAL SCROLL (Process) ---------- */
const HorizontalSection = styled.section`
  position: relative;
  background: #0a0a0a;
  overflow: hidden;

  @media (max-width: 768px) {
    overflow: visible;
  }
`;

const HorizontalWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const HorizontalHeader = styled.div`
  padding: 5rem 2rem 3rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const HorizontalHeaderTitle = styled.h2`
  font-family: "Space Grotesk", sans-serif;
  font-size: clamp(1.3rem, 2.5vw, 1.7rem);
  font-weight: 500;
  color: #fff;
  letter-spacing: -0.02em;
  margin: 0;
`;

const HorizontalTrack = styled.div`
  display: flex;
  gap: 2rem;
  padding: 0 4rem 5rem;
  will-change: transform;

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 0 1.5rem 4rem;
    gap: 1.5rem;
  }
`;

const StepCard = styled.div`
  flex-shrink: 0;
  width: min(75vw, 800px);
  min-height: 240px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  padding: 3rem 3.5rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 3rem;
  transition: border-color 0.3s;

  &:hover {
    border-color: rgba(255, 255, 255, 0.2);
  }

  @media (max-width: 768px) {
    width: 100%;
    flex-shrink: 1;
    min-height: auto;
    padding: 2rem;
    gap: 1.5rem;
  }
`;

const StepNumber = styled.span`
  font-family: "Space Grotesk", sans-serif;
  font-size: 4rem;
  font-weight: 600;
  color: rgba(204, 90, 80, 0.12);
  line-height: 1;
  flex-shrink: 0;
  min-width: 100px;
  text-align: center;
`;

const StepTitle = styled.h3`
  font-family: "Space Grotesk", sans-serif;
  font-size: 1.15rem;
  font-weight: 500;
  color: #fff;
  margin: 0 0 1rem;
`;

const StepDesc = styled.p`
  font-family: "Space Grotesk", sans-serif;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.7;
  margin: 0;
  max-width: 480px;
`;

/* ---------- OUTCOMES ---------- */
const OutcomesSection = styled.section`
  position: relative;
  padding: 8rem 2rem;
  background: #fff;
  border-bottom: 1px solid #eee;
`;

const OutcomesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const OutcomeCard = styled.div`
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 2.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  transition: border-color 0.3s, box-shadow 0.3s;

  &:hover {
    border-color: #ccc;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  }
`;

const OutcomeNumber = styled.span`
  font-family: "Space Grotesk", sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: rgba(204, 90, 80, 0.3);
  flex-shrink: 0;
  min-width: 40px;
`;

const OutcomeTitle = styled.h3`
  font-family: "Space Grotesk", sans-serif;
  font-size: 1.02rem;
  font-weight: 500;
  color: #111;
  margin: 0 0 0.5rem;
`;

const OutcomeDesc = styled.p`
  font-family: "Space Grotesk", sans-serif;
  font-size: 0.85rem;
  color: #888;
  line-height: 1.6;
  margin: 0;
`;

/* ---------- COMMITMENT ---------- */
const CommitmentSection = styled.section`
  position: relative;
  padding: 6rem 2rem;
  background: #0a0a0a;
  text-align: center;
`;

const CommitmentText = styled.p`
  font-family: "Space Grotesk", sans-serif;
  font-size: clamp(0.92rem, 1.6vw, 1.15rem);
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.7;
  max-width: 700px;
  margin: 0 auto;
`;

const CTAWrapper = styled.div`
  position: relative;
`;

/* ---------- MOBILE PROCESS ---------- */
const MobileProcessSection = styled.section`
  background: #0a0a0a;
  padding: 4rem 1.5rem;
`;

const MobileProcessCard = styled.div`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
`;

const splitHeroWords = (text, highlights = []) =>
  text.split(" ").map((word, i) => {
    const clean = word.toLowerCase().replace(/[^a-záéíóúñ]/gi, "");
    const isHl = highlights.some((h) => clean === h.toLowerCase());
    return (
      <span className="word" key={i}>
        <span className={`word-inner${isHl ? " highlight" : ""}`}>{word}&nbsp;</span>
      </span>
    );
  });

/* ===================================================================
   PAGE COMPONENT
   =================================================================== */
function CountUp({ target, suffix = "", decimals = 0, duration = 1400 }) {
  const [display, setDisplay] = useState("0" + (decimals > 0 ? "." + "0".repeat(decimals) : "") + suffix);
  const ref = useRef(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const start = performance.now();
          const step = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = eased * target;
            setDisplay(current.toFixed(decimals) + suffix);
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, suffix, decimals, duration]);

  return <span ref={ref}>{display}</span>;
}

function parseMetricValue(value) {
  const match = value.match(/^([\d.]+)\s*(.*)$/);
  if (!match) return { target: 0, suffix: value, decimals: 0 };
  const num = parseFloat(match[1]);
  const suffix = match[2] || "";
  const decimals = match[1].includes(".") ? match[1].split(".")[1].length : 0;
  return { target: num, suffix, decimals };
}

const SoftwareFactory = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isSpanish = lang?.startsWith("es");
  const [isMobile, setIsMobile] = useState(false);

  // Refs
  const heroRef = useRef(null);
  const heroTitleRef = useRef(null);
  const heroSubRef = useRef(null);
  const revealSectionRef = useRef(null);
  const revealTextRef = useRef(null);
  const metricsSectionRef = useRef(null);
  const metricsCardsRef = useRef([]);
  const featuresSectionRef = useRef(null);
  const featuresCardsRef = useRef([]);
  const horizontalWrapperRef = useRef(null);
  const horizontalTrackRef = useRef(null);
  const outcomesSectionRef = useRef(null);
  const outcomesCardsRef = useRef([]);
  const commitmentRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsMobile(window.innerWidth <= 768);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ctx = gsap.context(() => {
      /* ---------- 1. CINEMATIC HERO ---------- */
      // Word-by-word reveal entrance
      const heroWords = heroTitleRef.current?.querySelectorAll(".word-inner");
      if (heroWords?.length) {
        gsap.to(heroWords, {
          y: 0,
          duration: 1,
          stagger: 0.08,
          ease: "power4.out",
          delay: 0.3,
        });
      }
      gsap.fromTo(heroSubRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.9 }
      );

      // Exit/return on scroll (scrub = bidirectional)
      const heroTl = gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.5,
        },
      });
      heroTl
        .fromTo(heroTitleRef.current, { scale: 1, opacity: 1, y: 0 }, { scale: 0.85, opacity: 0, y: -40 })
        .fromTo(heroSubRef.current, { opacity: 1, y: 0 }, { opacity: 0, y: -30 }, 0.1);

      /* ---------- 2. SCROLL TEXT REVEAL (pinned) ---------- */
      if (revealTextRef.current) {
        const words = revealTextRef.current.querySelectorAll(".reveal-word");
        if (words.length > 0) {
          gsap.to(words, {
            opacity: 1,
            stagger: 0.05,
            scrollTrigger: {
              trigger: revealSectionRef.current,
              start: "top top",
              end: "+=150%",
              pin: true,
              scrub: 0.3,
              anticipatePin: 1,
            },
          });
        }
      }

      /* ---------- 3. METRICS STAGGER ---------- */
      const metricCards = metricsCardsRef.current.filter(Boolean);
      if (metricCards.length > 0) {
        gsap.from(metricCards, {
          opacity: 0,
          y: 50,
          scale: 0.95,
          duration: 0.7,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: metricsSectionRef.current,
            start: "top 75%",
            toggleActions: "play none none none",
          },
        });
      }

      /* ---------- 4. FEATURES STAGGER ---------- */
      const featureCards = featuresCardsRef.current.filter(Boolean);
      if (featureCards.length > 0) {
        gsap.from(featureCards, {
          opacity: 0,
          y: 60,
          filter: "blur(6px)",
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: featuresSectionRef.current,
            start: "top 75%",
            toggleActions: "play none none none",
          },
        });
      }

      /* ---------- 5. HORIZONTAL SCROLL TIMELINE ---------- */
      if (
        horizontalWrapperRef.current &&
        horizontalTrackRef.current &&
        !isMobile
      ) {
        const track = horizontalTrackRef.current;
        if (track.children.length > 0) {
          const getScrollAmount = () =>
            track.scrollWidth - window.innerWidth + 100;

          gsap.to(track, {
            x: () => -getScrollAmount(),
            ease: "none",
            scrollTrigger: {
              trigger: horizontalWrapperRef.current,
              start: "top top",
              end: () => `+=${getScrollAmount()}`,
              pin: true,
              scrub: 0.5,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });
        }
      }

      /* ---------- 6. OUTCOMES SCALE REVEAL ---------- */
      const outcomeCards = outcomesCardsRef.current.filter(Boolean);
      if (outcomeCards.length > 0) {
        gsap.from(outcomeCards, {
          scale: 0.9,
          opacity: 0,
          duration: 0.7,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: outcomesSectionRef.current,
            start: "top 75%",
            toggleActions: "play none none none",
          },
        });
      }

      /* COMMITMENT section — typewriter handles its own reveal */
    });

    return () => ctx.revert();
  }, [isMobile]);

  /* ---------- Data ---------- */
  const whatIsText = t("softwareFactory.whatIsDescription");
  const revealWords = whatIsText ? whatIsText.split(" ") : [];

  const metrics = [
    { value: "58%", title: isSpanish ? "Tiempo en coordinación" : "Time on coordination", desc: "Asana Anatomy of Work (2023)" },
    { value: "4.9h", title: isSpanish ? "Recuperables por semana" : "Recoverable per week", desc: "Asana Anatomy of Work (2023)" },
    { value: "2 min", title: isSpanish ? "Entre interrupciones" : "Between interruptions", desc: "Microsoft Work Trend (2025)" },
    { value: "32%", title: isSpanish ? "Reducción de costos" : "Cost reduction", desc: "Deloitte Automation (2022)" },
  ];

  const whenToUse = [
    {
      title: t("softwareFactory.whenToUse.newProductTitle"),
      desc: t("softwareFactory.whenToUse.newProductDescription"),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      ),
    },
    {
      title: t("softwareFactory.whenToUse.completeSolutionTitle"),
      desc: t("softwareFactory.whenToUse.completeSolutionDescription"),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
      ),
    },
    {
      title: t("softwareFactory.whenToUse.tightDeadlineTitle"),
      desc: t("softwareFactory.whenToUse.tightDeadlineDescription"),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
  ];

  const processSteps = [1, 2, 3, 4, 5];

  const outcomes = [
    { key: "fullyFunctional" },
    { key: "productionReady" },
    { key: "scalableArchitecture" },
    { key: "completeDocumentation" },
  ];

  return (
    <>
      <SEO
        title="Workflow Automation Services for Companies | LATAM Automation Agency | OpenGateHub"
        description="We automate approvals, data transfers, reports, and cross-team handoffs. Reduce cycle time by 28% and cut manual work costs by 60%. Nearshore automation experts from Latin America."
        keywords="workflow automation services, business process automation, workflow automation LATAM, process automation Latin America, n8n automation, AI workflows, process optimization, reduce manual work, automation agency nearshore"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Service",
              name: "Workflow Automation Services",
              description: "We automate approvals, data transfers, reports, and cross-team handoffs. Powered by n8n, AI, and custom integrations.",
              provider: { "@type": "Organization", name: "OpenGateHub", url: "https://opengatehub.com" },
              areaServed: ["Latin America", "United States", "North America", "Europe"],
              serviceType: "Workflow Automation",
            }),
          }}
        />
      </SEO>

      <PageWrapper>
        {/* 1. CINEMATIC HERO */}
        <HeroSection ref={heroRef}>
          <HeroGrid />
          <HeroContent>
            <div ref={heroTitleRef}>
              <HeroTitle>
                {splitHeroWords(
                  isSpanish ? "Workflow Automation" : "Workflow Automation",
                  ["Automation"]
                )}
              </HeroTitle>
            </div>
            <div ref={heroSubRef}>
              <HeroSubtitle>{t("softwareFactory.heroSubtitle")}</HeroSubtitle>
            </div>
          </HeroContent>
          <HeroLine />
        </HeroSection>

        {/* 2. SCROLL TEXT REVEAL */}
        <TextRevealSection ref={revealSectionRef}>
          <TextRevealInner>
            <SectionLabel>{t("softwareFactory.whatIsTitle")}</SectionLabel>
            <RevealText ref={revealTextRef}>
              {revealWords.map((word, i) => (
                <RevealWord key={i} className="reveal-word">
                  {word}
                </RevealWord>
              ))}
            </RevealText>
          </TextRevealInner>
        </TextRevealSection>

        {/* 3. IMPACT METRICS */}
        <MetricsSection ref={metricsSectionRef}>
          <SectionContainer>
            <SectionLabel>
              {isSpanish ? "Impacto" : "Impact"}
            </SectionLabel>
            <SectionHeading>
              {isSpanish
                ? "Impacto medible de automatizar workflows"
                : "Measurable impact of workflow automation"}
            </SectionHeading>
            <SectionSubtext>
              {isSpanish
                ? "Estos benchmarks respaldan por qué automatizar procesos es una decisión de negocio."
                : "These benchmarks show why process automation is a business decision."}
            </SectionSubtext>
            <MetricsGrid>
              {metrics.map((m, i) => (
                <MetricCard key={i} ref={(el) => (metricsCardsRef.current[i] = el)}>
                  <MetricValue>
                    <CountUp {...parseMetricValue(m.value)} />
                  </MetricValue>
                  <MetricTitle>{m.title}</MetricTitle>
                  <MetricDesc>{m.desc}</MetricDesc>
                </MetricCard>
              ))}
            </MetricsGrid>
          </SectionContainer>
        </MetricsSection>

        {/* 4. WHEN TO USE */}
        <FeaturesSection ref={featuresSectionRef}>
          <SectionContainer>
            <SectionLabel>
              {isSpanish ? "Casos de uso" : "Use Cases"}
            </SectionLabel>
            <SectionHeading>
              {t("softwareFactory.whenToUseTitle")}
            </SectionHeading>
            <SectionSubtext>
              {isSpanish
                ? "Situaciones donde la automatización genera el mayor retorno."
                : "Situations where automation delivers the highest return."}
            </SectionSubtext>
            <FeaturesGrid>
              {whenToUse.map((item, i) => (
                <FeatureCard key={i} ref={(el) => (featuresCardsRef.current[i] = el)}>
                  <FeatureIcon>{item.icon}</FeatureIcon>
                  <FeatureTitle>{item.title}</FeatureTitle>
                  <FeatureDesc>{item.desc}</FeatureDesc>
                </FeatureCard>
              ))}
            </FeaturesGrid>
          </SectionContainer>
        </FeaturesSection>

        {/* 5. HORIZONTAL SCROLL — PROCESS */}
        {!isMobile ? (
          <HorizontalSection>
            <HorizontalWrapper ref={horizontalWrapperRef}>
              <HorizontalHeader>
                <SectionLabel style={{ color: "#666" }}>
                  {isSpanish ? "Metodología" : "Methodology"}
                </SectionLabel>
                <HorizontalHeaderTitle>
                  {t("softwareFactory.processTitle")}
                </HorizontalHeaderTitle>
              </HorizontalHeader>
              <HorizontalTrack ref={horizontalTrackRef}>
                {processSteps.map((step) => (
                  <StepCard key={step}>
                    <StepNumber>0{step}</StepNumber>
                    <div>
                      <StepTitle>{t(`softwareFactory.process.step${step}Title`)}</StepTitle>
                      <StepDesc>{t(`softwareFactory.process.step${step}Description`)}</StepDesc>
                    </div>
                  </StepCard>
                ))}
              </HorizontalTrack>
            </HorizontalWrapper>
          </HorizontalSection>
        ) : (
          <MobileProcessSection>
            <SectionContainer>
              <SectionLabel style={{ color: "#666" }}>
                {isSpanish ? "Metodología" : "Methodology"}
              </SectionLabel>
              <HorizontalHeaderTitle style={{ marginBottom: "2rem" }}>
                {t("softwareFactory.processTitle")}
              </HorizontalHeaderTitle>
              {processSteps.map((step) => (
                <MobileProcessCard key={step}>
                  <StepNumber style={{ fontSize: "3rem", minWidth: "60px" }}>0{step}</StepNumber>
                  <div>
                    <StepTitle style={{ fontSize: "1.2rem" }}>{t(`softwareFactory.process.step${step}Title`)}</StepTitle>
                    <StepDesc style={{ fontSize: "0.95rem" }}>{t(`softwareFactory.process.step${step}Description`)}</StepDesc>
                  </div>
                </MobileProcessCard>
              ))}
            </SectionContainer>
          </MobileProcessSection>
        )}

        {/* 6. OUTCOMES */}
        <OutcomesSection ref={outcomesSectionRef}>
          <SectionContainer>
            <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
              <SectionLabel>
                {isSpanish ? "Resultados" : "Outcomes"}
              </SectionLabel>
              <SectionHeading style={{ maxWidth: 600, margin: "0 auto" }}>
                {t("softwareFactory.outcomesTitle")}
              </SectionHeading>
            </div>
            <OutcomesGrid>
              {outcomes.map((item, i) => (
                <OutcomeCard key={item.key} ref={(el) => (outcomesCardsRef.current[i] = el)}>
                  <OutcomeNumber>0{i + 1}</OutcomeNumber>
                  <div>
                    <OutcomeTitle>{t(`softwareFactory.outcomes.${item.key}Title`)}</OutcomeTitle>
                    <OutcomeDesc>{t(`softwareFactory.outcomes.${item.key}Description`)}</OutcomeDesc>
                  </div>
                </OutcomeCard>
              ))}
            </OutcomesGrid>
          </SectionContainer>
        </OutcomesSection>

        {/* COMMITMENT BANNER */}
        <CommitmentSection ref={commitmentRef}>
          <SectionContainer>
            <SectionLabel style={{ color: "#666" }}>
              {isSpanish ? "Compromiso" : "Our Commitment"}
            </SectionLabel>
            <ScrollRevealText
              text={isSpanish
                ? "Automatizamos tus procesos más críticos para que tu equipo se enfoque en lo que realmente importa. Sin fricciones, sin complejidad innecesaria."
                : "We automate your most critical processes so your team can focus on what truly matters. No friction, no unnecessary complexity."}
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "clamp(1.1rem, 2vw, 1.4rem)",
                lineHeight: 1.7,
                maxWidth: "700px",
                margin: "0 auto",
                minHeight: "6em",
              }}
            />
          </SectionContainer>
        </CommitmentSection>

        {/* CTA */}
        <CTAWrapper>
          <CallToActionBlock
            title={t("softwareFactory.ctaTitle")}
            description={t("softwareFactory.ctaDescription")}
            buttonText={t("softwareFactory.ctaButtonText")}
            highlightWord={t("softwareFactory.ctaHighlightWord")}
          />
        </CTAWrapper>
      </PageWrapper>
    </>
  );
};

export default SoftwareFactory;
