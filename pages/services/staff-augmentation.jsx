import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import SEO from "../../src/components/SEO/SEO";
import CallToActionBlock from "../../src/components/CallToAction/CallToAction";

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
  height: 100vh;
  min-height: 600px;
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
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 0 2rem;
  max-width: 900px;
`;

const HeroTitle = styled.h1`
  font-family: "Space Grotesk", sans-serif;
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin: 0 0 1.5rem;
`;

const HeroSubtitle = styled.p`
  font-family: "Space Grotesk", sans-serif;
  font-size: clamp(1rem, 2vw, 1.35rem);
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
`;

const HeroLine = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(204, 90, 80, 0.3),
    transparent
  );
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

/* ---------- FEATURES / BENEFITS ---------- */
const FeaturesSection = styled.section`
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
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  font-weight: 700;
  color: #111;
  letter-spacing: -0.02em;
  margin: 0 0 1rem;
`;

const SectionSubtext = styled.p`
  font-family: "Space Grotesk", sans-serif;
  font-size: 1.1rem;
  color: #777;
  line-height: 1.6;
  max-width: 560px;
  margin: 0 0 3.5rem;
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
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 16px;
  padding: 2rem;
  transition: border-color 0.3s, box-shadow 0.3s;

  &:hover {
    border-color: #ccc;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  }
`;

const FeatureNumber = styled.span`
  display: inline-block;
  font-family: "Space Grotesk", sans-serif;
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(204, 90, 80, 0.45);
  letter-spacing: 0.06em;
  margin-bottom: 1.2rem;
`;

const FeatureTitle = styled.h3`
  font-family: "Space Grotesk", sans-serif;
  font-size: 1.15rem;
  font-weight: 600;
  color: #111;
  margin: 0 0 0.6rem;
`;

const FeatureDesc = styled.p`
  font-family: "Space Grotesk", sans-serif;
  font-size: 0.95rem;
  color: #888;
  line-height: 1.6;
  margin: 0;
`;

/* ---------- HORIZONTAL SCROLL (How We Work) ---------- */
const HorizontalSection = styled.section`
  position: relative;
  background: #0a0a0a;
  overflow: hidden;
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
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  font-weight: 700;
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
    padding: 0 2rem 4rem;
    gap: 1.5rem;
  }
`;

const StepCard = styled.div`
  flex-shrink: 0;
  width: min(75vw, 800px);
  min-height: 240px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
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
    width: 85vw;
    min-height: 200px;
    padding: 2rem;
    gap: 1.5rem;
  }
`;

const StepNumber = styled.span`
  font-family: "Space Grotesk", sans-serif;
  font-size: 6rem;
  font-weight: 700;
  color: rgba(204, 90, 80, 0.12);
  line-height: 1;
  flex-shrink: 0;
  min-width: 100px;
  text-align: center;
`;

const StepTitle = styled.h3`
  font-family: "Space Grotesk", sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
  margin: 0 0 1rem;
`;

const StepDesc = styled.p`
  font-family: "Space Grotesk", sans-serif;
  font-size: 1.05rem;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.7;
  margin: 0;
  max-width: 480px;
`;

/* ---------- USE CASES ---------- */
const UseCasesSection = styled.section`
  position: relative;
  padding: 8rem 2rem;
  background: #fff;
  border-bottom: 1px solid #eee;
`;

const UseCasesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const UseCaseCard = styled.div`
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 16px;
  padding: 2.5rem;
  transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s;

  &:hover {
    border-color: #ccc;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06);
    transform: translateY(-4px);
  }
`;

const UseCaseIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #CC5A50;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;

  & svg {
    width: 20px;
    height: 20px;
  }
`;

const UseCaseTitle = styled.h3`
  font-family: "Space Grotesk", sans-serif;
  font-size: 1.2rem;
  font-weight: 600;
  color: #111;
  margin: 0 0 0.6rem;
`;

const UseCaseDesc = styled.p`
  font-family: "Space Grotesk", sans-serif;
  font-size: 0.95rem;
  color: #888;
  line-height: 1.6;
  margin: 0;
`;

/* ---------- WHY CHOOSE (commitment banner) ---------- */
const CommitmentSection = styled.section`
  position: relative;
  padding: 6rem 2rem;
  background: #0a0a0a;
  text-align: center;
`;

const CommitmentText = styled.p`
  font-family: "Space Grotesk", sans-serif;
  font-size: clamp(1.1rem, 2vw, 1.4rem);
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.7;
  max-width: 700px;
  margin: 0 auto;
`;

/* ---------- CTA WRAPPER ---------- */
const CTAWrapper = styled.div`
  position: relative;
`;

/* ===================================================================
   PAGE COMPONENT
   =================================================================== */
const StaffAugmentation = () => {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);

  // Refs
  const heroRef = useRef(null);
  const heroTitleRef = useRef(null);
  const heroSubRef = useRef(null);
  const revealSectionRef = useRef(null);
  const revealTextRef = useRef(null);
  const featuresSectionRef = useRef(null);
  const featuresCardsRef = useRef([]);
  const horizontalWrapperRef = useRef(null);
  const horizontalTrackRef = useRef(null);
  const useCasesSectionRef = useRef(null);
  const useCasesCardsRef = useRef([]);
  const commitmentRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsMobile(window.innerWidth <= 768);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let ctx;

    const timer = setTimeout(() => {
      ctx = gsap.context(() => {

        /* ---------- 1. CINEMATIC HERO ---------- */
        // Entrance (once)
        gsap.fromTo(heroTitleRef.current,
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 1.2, ease: "power3.out", delay: 0.1 }
        );
        gsap.fromTo(heroSubRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.4 }
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
          .to(heroTitleRef.current, { scale: 0.85, opacity: 0, y: -40 })
          .to(heroSubRef.current, { opacity: 0, y: -30 }, 0.1);

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

        /* ---------- 3. FEATURES STAGGER ---------- */
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

        /* ---------- 4. HORIZONTAL SCROLL TIMELINE ---------- */
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

        /* ---------- 5. USE CASES SCALE REVEAL ---------- */
        const useCaseCards = useCasesCardsRef.current.filter(Boolean);
        if (useCaseCards.length > 0) {
          gsap.from(useCaseCards, {
            scale: 0.9,
            opacity: 0,
            duration: 0.7,
            stagger: 0.15,
            ease: "power2.out",
            scrollTrigger: {
              trigger: useCasesSectionRef.current,
              start: "top 75%",
              toggleActions: "play none none none",
            },
          });
        }

        /* ---------- COMMITMENT FADE ---------- */
        if (commitmentRef.current) {
          gsap.from(commitmentRef.current, {
            opacity: 0,
            y: 40,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: commitmentRef.current,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          });
        }

        ScrollTrigger.refresh();
      });
    }, 150);

    return () => {
      clearTimeout(timer);
      if (ctx) ctx.revert();
    };
  }, [isMobile]);

  /* ---------- Helpers ---------- */
  const whatIsText = t("staffAugmentation.whatIsDescription");
  const revealWords = whatIsText ? whatIsText.split(" ") : [];

  const benefits = [
    {
      key: "01",
      title: t("staffAugmentation.keyBenefits.extendedTeamTitle"),
      desc: t("staffAugmentation.keyBenefits.extendedTeamDescription"),
    },
    {
      key: "02",
      title: t("staffAugmentation.keyBenefits.quickStartTitle"),
      desc: t("staffAugmentation.keyBenefits.quickStartDescription"),
    },
    {
      key: "03",
      title: t("staffAugmentation.keyBenefits.scalabilityTitle"),
      desc: t("staffAugmentation.keyBenefits.scalabilityDescription"),
    },
    {
      key: "04",
      title: t("staffAugmentation.keyBenefits.guaranteedQualityTitle"),
      desc: t("staffAugmentation.keyBenefits.guaranteedQualityDescription"),
    },
    {
      key: "05",
      title: t("staffAugmentation.keyBenefits.flexibilityTitle"),
      desc: t("staffAugmentation.keyBenefits.flexibilityDescription"),
    },
    {
      key: "06",
      title: t("staffAugmentation.keyBenefits.culturalFitTitle"),
      desc: t("staffAugmentation.keyBenefits.culturalFitDescription"),
    },
  ];

  const steps = [
    {
      num: "01",
      title: t("staffAugmentation.howWeWork.step1Title"),
      desc: t("staffAugmentation.howWeWork.step1Description"),
    },
    {
      num: "02",
      title: t("staffAugmentation.howWeWork.step2Title"),
      desc: t("staffAugmentation.howWeWork.step2Description"),
    },
    {
      num: "03",
      title: t("staffAugmentation.howWeWork.step3Title"),
      desc: t("staffAugmentation.howWeWork.step3Description"),
    },
    {
      num: "04",
      title: t("staffAugmentation.howWeWork.step4Title"),
      desc: t("staffAugmentation.howWeWork.step4Description"),
    },
  ];

  const useCases = [
    {
      title: t("staffAugmentation.useCases.growingStartupsTitle"),
      desc: t("staffAugmentation.useCases.growingStartupsDescription"),
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      ),
    },
    {
      title: t("staffAugmentation.useCases.specificProjectsTitle"),
      desc: t("staffAugmentation.useCases.specificProjectsDescription"),
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      ),
    },
    {
      title: t("staffAugmentation.useCases.distributedTeamsTitle"),
      desc: t("staffAugmentation.useCases.distributedTeamsDescription"),
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <SEO
        title="Staff Augmentation in Latin America — Nearshore Senior Engineers | OpenGateHub"
        description="Scale your engineering team in 7.3 days with nearshore developers from Latin America. We embed senior developers and QA engineers who join your standups, ship in your sprints, and match your culture — 9.7/10 CSAT, 87% on-time delivery."
        keywords="staff augmentation LATAM, nearshore staff augmentation, staff augmentation Latin America, hire developers Latin America, nearshore development, embedded engineering team, remote developers LATAM, senior developers for hire, nearshore software development, QA engineers Latin America"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Service",
              name: "Staff Augmentation in Latin America",
              description:
                "Scale your engineering team in 7.3 days with nearshore senior developers from Latin America. Cultural fit, timezone alignment, 87% on-time delivery.",
              provider: {
                "@type": "Organization",
                name: "OpenGateHub",
                url: "https://opengatehub.com",
              },
              areaServed: [
                "Latin America",
                "United States",
                "North America",
                "Europe",
              ],
              serviceType: "Staff Augmentation",
              offers: {
                "@type": "Offer",
                availability: "https://schema.org/InStock",
                priceSpecification: {
                  "@type": "PriceSpecification",
                  priceCurrency: "USD",
                },
              },
            }),
          }}
        />
      </SEO>

      <PageWrapper>
        {/* ============================================================
            1. CINEMATIC HERO
            ============================================================ */}
        <HeroSection ref={heroRef}>
          <HeroGrid />
          <HeroContent>
            <div ref={heroTitleRef}>
              <HeroTitle>Staff Augmentation</HeroTitle>
            </div>
            <div ref={heroSubRef}>
              <HeroSubtitle>
                {t("staffAugmentation.heroSubtitle")}
              </HeroSubtitle>
            </div>
          </HeroContent>
          <HeroLine />
        </HeroSection>

        {/* ============================================================
            2. SCROLL TEXT REVEAL
            ============================================================ */}
        <div style={{ height: "6rem", background: "#fff" }} />
        <TextRevealSection ref={revealSectionRef}>
          <TextRevealInner>
            <SectionLabel>{t("staffAugmentation.whatIsTitle")}</SectionLabel>
            <RevealText ref={revealTextRef}>
              {revealWords.map((word, i) => (
                <RevealWord key={i} className="reveal-word">
                  {word}
                </RevealWord>
              ))}
            </RevealText>
          </TextRevealInner>
        </TextRevealSection>

        {/* ============================================================
            3. FEATURES / KEY BENEFITS
            ============================================================ */}
        <FeaturesSection ref={featuresSectionRef}>
          <SectionContainer>
            <SectionLabel>
              {t("staffAugmentation.keyBenefitsTitle")}
            </SectionLabel>
            <SectionHeading>
              {t("staffAugmentation.whyChooseTitle")}
            </SectionHeading>
            <SectionSubtext>
              {t("staffAugmentation.benefits.commitment")}
            </SectionSubtext>

            <FeaturesGrid>
              {benefits.map((b, i) => (
                <FeatureCard
                  key={b.key}
                  ref={(el) => (featuresCardsRef.current[i] = el)}
                >
                  <FeatureNumber>{b.key}</FeatureNumber>
                  <FeatureTitle>{b.title}</FeatureTitle>
                  <FeatureDesc>{b.desc}</FeatureDesc>
                </FeatureCard>
              ))}
            </FeaturesGrid>
          </SectionContainer>
        </FeaturesSection>

        {/* ============================================================
            4. HORIZONTAL SCROLL — HOW WE WORK
            ============================================================ */}
        <HorizontalSection>
          <HorizontalWrapper ref={horizontalWrapperRef}>
            <HorizontalHeader>
              <SectionLabel style={{ color: "#666" }}>Process</SectionLabel>
              <HorizontalHeaderTitle>
                {t("staffAugmentation.howWeWorkTitle")}
              </HorizontalHeaderTitle>
            </HorizontalHeader>
            <HorizontalTrack ref={horizontalTrackRef}>
              {steps.map((step) => (
                <StepCard key={step.num}>
                  <StepNumber>{step.num}</StepNumber>
                  <div>
                    <StepTitle>{step.title}</StepTitle>
                    <StepDesc>{step.desc}</StepDesc>
                  </div>
                </StepCard>
              ))}
            </HorizontalTrack>
          </HorizontalWrapper>
        </HorizontalSection>

        {/* ============================================================
            5. USE CASES — SCALE REVEAL
            ============================================================ */}
        <UseCasesSection ref={useCasesSectionRef}>
          <SectionContainer>
            <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
              <SectionLabel>
                {t("staffAugmentation.useCasesTitle")}
              </SectionLabel>
              <SectionHeading
                style={{ maxWidth: 600, margin: "0 auto" }}
              >
                {t("staffAugmentation.useCasesTitle")}
              </SectionHeading>
            </div>
            <UseCasesGrid>
              {useCases.map((uc, i) => (
                <UseCaseCard
                  key={i}
                  ref={(el) => (useCasesCardsRef.current[i] = el)}
                >
                  <UseCaseIcon>{uc.icon}</UseCaseIcon>
                  <UseCaseTitle>{uc.title}</UseCaseTitle>
                  <UseCaseDesc>{uc.desc}</UseCaseDesc>
                </UseCaseCard>
              ))}
            </UseCasesGrid>
          </SectionContainer>
        </UseCasesSection>

        {/* ============================================================
            COMMITMENT BANNER (Why Choose benefits)
            ============================================================ */}
        <CommitmentSection ref={commitmentRef}>
          <SectionContainer>
            <SectionLabel style={{ color: "#666" }}>
              {t("staffAugmentation.whyChooseTitle")}
            </SectionLabel>
            <CommitmentText>
              {t("staffAugmentation.benefits.commitment")}
            </CommitmentText>
          </SectionContainer>
        </CommitmentSection>

        {/* ============================================================
            6. CTA
            ============================================================ */}
        <CTAWrapper>
          <CallToActionBlock
            title={t("staffAugmentation.ctaTitle")}
            description={t("servicesCallToAction.description")}
            buttonText={t("servicesCallToAction.buttonText")}
            highlightWord={t("staffAugmentation.ctaHighlightWord")}
          />
        </CTAWrapper>
      </PageWrapper>
    </>
  );
};

export default StaffAugmentation;
