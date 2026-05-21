import React, { useEffect, useRef } from "react";
import {
  PageWrapper,
  PageHeader,
  PageTitle,
  PageSubtitle,
  TextRevealSection,
  TextRevealInner,
  RevealText,
  RevealWord,
  FounderStrip,
  HighlightedWord,
} from "../../src/styles/pagesStyles/AboutUs.styles";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import CallToActionBlock from "../../src/components/CallToAction/CallToAction";
import SEO from "../../src/components/SEO/SEO";
import Image from "next/image";
import AboutTimeline from "../../src/components/Timeline/AboutTimeline";
import TeamSection from "../../src/components/TeamSection/TeamSection";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export const AboutUsCallToAction = () => {
  const { t } = useTranslation();
  const callToAction = t("aboutUsCallToAction", { returnObjects: true });

  return (
    <CallToActionBlock
      title={callToAction.title}
      description={callToAction.description}
      buttonText={callToAction.buttonText}
      highlightWord="Right"
    />
  );
};

const AboutUs = React.forwardRef((props, ref) => {
  const { t } = useTranslation();
  const headerRef = useRef(null);
  const revealRef = useRef(null);
  const founderRef = useRef(null);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      const ctx = gsap.context(() => {
        /* ---------- HEADER ANIMATIONS ---------- */
        const title = headerRef.current?.querySelector(".page-title");
        const sub = headerRef.current?.querySelector(".page-sub");

        if (title) {
          gsap.fromTo(title,
            { opacity: 0, y: 50, scale: 0.97 },
            { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: "power3.out", delay: 0.1 }
          );
        }
        if (sub) {
          gsap.fromTo(sub,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.4 }
          );
        }

        /* ---------- TEXT REVEAL (pinned scroll) ---------- */
        const revealSection = revealRef.current?.closest("section");
        const words = revealRef.current?.querySelectorAll(".reveal-word");

        if (words?.length && revealSection) {
          const mobile = window.innerWidth <= 768;
          gsap.to(words, {
            opacity: 1,
            stagger: 0.05,
            scrollTrigger: {
              trigger: revealSection,
              start: "top top",
              end: mobile ? "+=80%" : "+=150%",
              pin: true,
              scrub: 0.3,
              anticipatePin: 1,
            },
          });
        }

        /* ---------- FOUNDER STRIP ---------- */
        const founder = founderRef.current;
        if (founder) {
          const accentLine = founder.querySelector(".founder-accent-line");
          const mobile = window.innerWidth <= 768;

          gsap.set(accentLine, mobile ? { width: 0 } : { height: 0 });

          if (mobile) {
            // Mobile: clip-path reveal from bottom (same as desktop, no wipe-out)
            gsap.set(founder, { clipPath: "inset(100% 0 0 0)" });

            const fTl = gsap.timeline({
              scrollTrigger: {
                trigger: founder,
                start: "top 95%",
                end: "top 40%",
                scrub: 0.5,
              },
            });

            fTl.to(founder, { clipPath: "inset(0% 0 0 0)", ease: "none" }, 0);
            fTl.to(accentLine, { width: "100%" }, 0.2);
          } else {
            gsap.set(founder, { clipPath: "inset(100% 0 0 0)" });

            const fTl = gsap.timeline({
              scrollTrigger: {
                trigger: founder,
                start: "top 85%",
                end: "bottom 15%",
                scrub: 0.5,
              },
            });

            // Wipe in from bottom
            fTl.to(founder, { clipPath: "inset(0% 0 0 0)", ease: "none" }, 0);
            // Accent line
            fTl.to(accentLine, { height: "100%" }, 0.2);
            // Wipe out to top — desktop only
            fTl.to(founder, { clipPath: "inset(0 0 100% 0)", ease: "none" }, 0.6);
          }
        }

        ScrollTrigger.refresh();
      });

      headerRef._gsapCtx = ctx;
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (headerRef._gsapCtx) headerRef._gsapCtx.revert();
    };
  }, []);

  // Split text into words for reveal effect
  const aboutText = t("aboutUsText") + " " + t("aboutUsLastLine") + " " + t("aboutUsTextBold");
  const words = aboutText.split(/\s+/).filter(Boolean);

  return (
    <PageWrapper ref={ref}>
      <SEO
        title="About OpenGateHub — Workflow Automation & Staff Augmentation LATAM"
        description="We're a human-first automation and engineering company from Latin America. Nearshore senior teams that embed into your workflow — 9.7/10 CSAT, 87% on-time delivery. 300+ processes automated across 50+ companies."
        keywords="OpenGateHub, workflow automation company LATAM, staff augmentation Latin America, nearshore engineering team, process automation, nearshore development company, about OpenGateHub, automation agency Latin America"
      />

      {/* --- HEADER --- */}
      <PageHeader ref={headerRef}>
        <PageTitle className="page-title">
          {t("aboutUsTitle_part1")}
          <span style={{ color: "#CC5A50" }}>{t("aboutUsTitle_highlight")}</span>
          {t("aboutUsTitle_part2")}
        </PageTitle>
        <PageSubtitle className="page-sub">{t("aboutUsSubtitle")}</PageSubtitle>
      </PageHeader>

      {/* --- TEXT REVEAL (pinned) --- */}
      <TextRevealSection>
        <TextRevealInner ref={revealRef}>
          <RevealText>
            {words.map((word, i) => (
              <RevealWord key={i} className="reveal-word">
                {word}
              </RevealWord>
            ))}
          </RevealText>
        </TextRevealInner>
      </TextRevealSection>

      {/* --- FOUNDER (dark editorial block) --- */}
      <FounderStrip ref={founderRef}>
        <div className="founder-inner">
          <div className="founder-accent-line" />
          <div className="founder-content">
            <span className="founder-eyebrow">From the founder</span>
            <div className="founder-columns">
              {t("aboutUsFounderBio").split("\n\n").map((paragraph, i) => (
                <p key={i} className="founder-quote">{paragraph}</p>
              ))}
            </div>
            <div className="founder-credit">
              <div className="founder-avatar">
                <Image
                  src="/images/Cande.png"
                  width={40}
                  height={40}
                  quality={90}
                  alt="Candelaria Sanchez"
                  style={{ objectFit: "cover", objectPosition: "center top" }}
                />
              </div>
              <div className="founder-meta">
                <span className="founder-name">Candelaria Sanchez</span>
                <span className="founder-role">Founder & CTO</span>
              </div>
            </div>
          </div>
        </div>
      </FounderStrip>

      {/* --- TIMELINE --- */}
      <AboutTimeline />

      {/* --- TEAM --- */}
      <TeamSection />

      {/* --- CTA --- */}
      <AboutUsCallToAction />
    </PageWrapper>
  );
});

AboutUs.displayName = "AboutUs";

export default AboutUs;
