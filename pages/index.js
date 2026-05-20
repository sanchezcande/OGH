import { useEffect, useRef, useState, useCallback } from "react";
import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import Link from "next/link";
import { useRouter } from "next/router";
import SEO from "../src/components/SEO/SEO";
import CallToActionBlock from "../src/components/CallToAction/CallToAction";
// MetricsSection replaced by StickyMetrics inline
import useMediaQuery from "../src/Hooks/useMediaQuery";
import {
  FaTasks,
  FaClock,
  FaBolt,
  FaDollarSign,
  FaExternalLinkAlt,
} from "react-icons/fa";
import {
  Container,
  Hero,
  HeroOrb,
  Title,
  Subtitle,
  HeroCTAGroup,
  CTAButton,
  TrustChips,
  TrustChip,
  MarqueeBanner,
  MarqueeTrack,
  MarqueeItem,
  TextRevealSection,
  TextRevealContent,
  RevealText,
  Section,
  SectionInner,
  SectionEyebrow,
  SectionTitle,
  SectionText,
  ServiceCard,
  ServiceIcon,
  ServiceTitle,
  ServiceDescription,
  ServiceBadge,
  ServiceLinks,
  ServiceLink,
  BenchmarkGrid,
  BenchmarkCard,
  BenchmarkValue,
  BenchmarkBar,
  CaseStudyGrid,
  CaseStudyCard,
  CarouselSection,
  CarouselTrack,
  CarouselCard,
  PlanSection,
  PlanSteps,
  PlanStep,
  TestimonialsSection,
  ReviewsMarquee,
  TestimonialCardStyled,
  CalculatorBanner,
  ScrollProgress,
  ParallaxShowcase,
  TiltCard,
  ZoomRevealSection,
  GridBackground,
  StickyMetricsWrapper,
  StickyMetricsViewport,
  StickyMetricsProgress,
  StickyMetricSlide,
  StickyMetricDots,
  StickyMetricDot,
} from "../src/styles/pagesStyles/HomePages.styles";

// Register GSAP
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ═══════════════════════════════════════════
   HELPER COMPONENTS
   ═══════════════════════════════════════════ */

const ReviewsInfiniteMarquee = ({ testimonials }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const scrollRef = useRef(null);
  const isTouching = useRef(false);
  const autoScrollRAF = useRef(null);
  const resumeTimer = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Auto-scroll for mobile: scrolls continuously, pauses on touch, resumes after release
  useEffect(() => {
    if (!isMobile) return;
    const el = scrollRef.current;
    if (!el) return;

    const speed = 0.5; // px per frame
    const totalCards = testimonials.length;

    const step = () => {
      if (!isTouching.current && el) {
        el.scrollLeft += speed;
        // When we've scrolled past the duplicated set, jump back seamlessly
        const singleSetWidth = el.scrollWidth / 2;
        if (el.scrollLeft >= singleSetWidth) {
          el.scrollLeft -= singleSetWidth;
        }
      }
      autoScrollRAF.current = requestAnimationFrame(step);
    };

    autoScrollRAF.current = requestAnimationFrame(step);
    return () => {
      if (autoScrollRAF.current) cancelAnimationFrame(autoScrollRAF.current);
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, [isMobile, testimonials.length]);

  const handleTouchStart = useCallback(() => {
    isTouching.current = true;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  }, []);

  const handleTouchEnd = useCallback(() => {
    // Resume auto-scroll after 3s of no touch
    resumeTimer.current = setTimeout(() => {
      isTouching.current = false;
    }, 3000);
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.children[0];
    if (!card) return;
    const cardWidth = card.offsetWidth;
    const gap = 16;
    const index = Math.round(el.scrollLeft / (cardWidth + gap)) % testimonials.length;
    setActiveCard(Math.min(index, testimonials.length - 1));
  }, [testimonials.length]);

  if (isMobile) {
    // Duplicate for seamless infinite scroll
    const doubled = [...testimonials, ...testimonials];
    return (
      <div style={{ width: "100%" }}>
        <style>{`.reviews-mobile-scroll::-webkit-scrollbar { display: none; }`}</style>
        <div
          ref={scrollRef}
          className="reviews-mobile-scroll"
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            display: "flex",
            gap: "16px",
            overflowX: "scroll",
            WebkitOverflowScrolling: "touch",
            paddingLeft: "20px",
            paddingRight: "20px",
            paddingBottom: "8px",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            touchAction: "pan-x pan-y",
          }}
        >
          {doubled.map((t, i) => (
            <TestimonialCardStyled
              key={i}
              style={{
                width: "80vw",
                minWidth: "80vw",
                flexShrink: 0,
              }}
            >
              <div className="stars">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s}>★</span>
                ))}
              </div>
              <p className="quote">&ldquo;{t.content}&rdquo;</p>
              <div className="author">
                <div className="author-company">{t.company}</div>
                {t.role && <div className="author-role">{t.role}</div>}
              </div>
            </TestimonialCardStyled>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "20px" }}>
          {testimonials.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === activeCard ? "24px" : "8px",
                height: "8px",
                borderRadius: "100px",
                background: i === activeCard ? "#ffffff" : "rgba(255,255,255,0.25)",
                transition: "all 0.25s ease",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Desktop: infinite marquee via CSS animation
  const doubled = [...testimonials, ...testimonials];
  return (
    <ReviewsMarquee $duration="50s">
      {doubled.map((t, i) => (
        <TestimonialCardStyled key={i}>
          <div className="stars">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s}>★</span>
            ))}
          </div>
          <p className="quote">&ldquo;{t.content}&rdquo;</p>
          <div className="author">
            <div className="author-company">{t.company}</div>
            {t.role && <div className="author-role">{t.role}</div>}
          </div>
        </TestimonialCardStyled>
      ))}
    </ReviewsMarquee>
  );
};

export const HomeCallToAction = () => {
  const { t } = useTranslation();
  const callToAction = t("homeCallToAction", { returnObjects: true });

  return (
    <div style={{ position: "relative" }}>
      <CallToActionBlock
        title={callToAction.title}
        description={callToAction.description}
        buttonText={callToAction.buttonText}
        highlightWord="costs"
      />
      <div
        style={{
          textAlign: "center",
          marginTop: "-1.5rem",
          paddingBottom: "2rem",
          color: "rgba(255,255,255,0.65)",
          fontSize: "0.82rem",
          letterSpacing: "0.03em",
        }}
      >
        {t("homeCallToAction.noCommitment", "Free call · No commitment · No pitch")}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   SERVER SIDE PROPS
   ═══════════════════════════════════════════ */
export async function getServerSideProps() {
  return { props: {} };
}

/* ═══════════════════════════════════════════
   MAIN HOMEPAGE
   ═══════════════════════════════════════════ */
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

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const lang = i18n.language?.startsWith("es") ? "es" : "en";
  const router = useRouter();

  // Refs for GSAP
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const ctaGroupRef = useRef(null);
  const trustRef = useRef(null);
  const revealSectionRef = useRef(null);
  const revealRef = useRef(null);
  const benchmarkRef = useRef(null);
  const caseStudyRef = useRef(null);
  const planRef = useRef(null);
  const servicesRef = useRef(null);
  const parallaxShowcaseRef = useRef(null);
  const zoomRevealRef = useRef(null);
  const stickyMetricsRef = useRef(null);
  const [activeMetric, setActiveMetric] = useState(-1);
  const [activePlanStep, setActivePlanStep] = useState(0);
  const metricsProgressRef = useRef(null);
  const metricCounterRefs = useRef([]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ─── GSAP ANIMATIONS ─── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    let ctx;

    const timer = setTimeout(() => {
      ctx = gsap.context(() => {
      const mobile = window.innerWidth <= 768;

      // 1. HERO TEXT SPLIT REVEAL
      const words = titleRef.current?.querySelectorAll(".word-inner");
      if (words?.length) {
        gsap.to(words, {
          y: 0,
          duration: 1,
          stagger: 0.08,
          ease: "power4.out",
          delay: 0.3,
        });
      }

      // 2. HERO SUBTITLE + CTA fade in
      gsap.to(subtitleRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 1.2,
        ease: "power3.out",
      });

      gsap.to(ctaGroupRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 1.5,
        ease: "power3.out",
      });

      gsap.to(trustRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 1.8,
        ease: "power3.out",
      });

      // 3. HERO PARALLAX ORBS
      gsap.utils.toArray(".hero-orb").forEach((orb) => {
        gsap.to(orb, {
          y: -150,
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1,
          },
        });
      });

      // 4. TEXT REVEAL ON SCROLL (pinned, like staff-augmentation)
      if (revealRef.current) {
        const words = revealRef.current.querySelectorAll(".reveal-word");
        if (words.length > 0) {
          gsap.to(words, {
            color: "#111",
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

      // 5. BENCHMARK CARDS stagger reveal
      const benchCards = benchmarkRef.current?.querySelectorAll(".bench-card");
      if (benchCards?.length) {
        benchCards.forEach((card, i) => {
          gsap.to(card, {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.8,
            delay: i * 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: benchmarkRef.current,
              start: "top 75%",
              once: true,
            },
          });
        });
      }

      // 6. BENCHMARK BARS animate width on scroll
      const bars = benchmarkRef.current?.querySelectorAll(".bar-fill");
      if (bars?.length) {
        bars.forEach((bar, i) => {
          gsap.to(bar, {
            width: bar.dataset.width + "%",
            duration: 1.4,
            delay: i * 0.2,
            ease: "power2.out",
            scrollTrigger: {
              trigger: bar,
              start: "top 90%",
              once: true,
            },
          });
        });
      }

      // 7. CASE STUDY CARDS 3D perspective reveal
      const caseCards = caseStudyRef.current?.querySelectorAll(".case-card");
      if (caseCards?.length) {
        caseCards.forEach((card, i) => {
          gsap.to(card, {
            opacity: 1,
            y: 0,
            rotateX: 0,
            scale: 1,
            duration: 1,
            delay: i * 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 88%",
              once: true,
            },
          });
        });
      }

      // 8. PLAN STEPS — sticky pinned, reveal one by one on scroll (desktop only)
      if (planRef.current && !mobile) {
        let lastPlanIdx = -1;
        ScrollTrigger.create({
          trigger: planRef.current,
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => {
            const p = self.progress;
            // 4 phases: step1, step2, step3, CTA button
            const adjusted = Math.min(1, Math.max(0, (p - 0.08) / 0.85));
            const idx = Math.min(Math.floor(adjusted * 4), 3);
            if (idx !== lastPlanIdx) {
              lastPlanIdx = idx;
              setActivePlanStep(idx);
            }
          },
        });
      }

      // 9. SERVICE CARDS stagger reveal
      const svcCards = servicesRef.current?.querySelectorAll(".svc-card");
      if (svcCards?.length) {
        svcCards.forEach((card, i) => {
          gsap.from(card, {
            opacity: 0,
            y: 60,
            duration: 0.7,
            delay: i * 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              once: true,
            },
          });
        });
      }

      // 10. PARALLAX SHOWCASE - background moves slower, number scales up
      if (parallaxShowcaseRef.current) {
        const bg = parallaxShowcaseRef.current.querySelector(".parallax-bg");
        const num = parallaxShowcaseRef.current.querySelector(".parallax-number");

        if (bg) {
          gsap.to(bg, {
            y: 100,
            scrollTrigger: {
              trigger: parallaxShowcaseRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          });
        }

        if (num) {
          ScrollTrigger.create({
            trigger: parallaxShowcaseRef.current,
            start: "top 60%",
            once: true,
            onEnter: () => num.classList.add("visible"),
          });
        }
      }

      // 11. ZOOM REVEAL - section scales from 1.15 to 1, border-radius reveals (desktop only)
      if (zoomRevealRef.current) {
        const inner = zoomRevealRef.current.querySelector(".zoom-inner");
        if (inner && !mobile) {
          gsap.fromTo(
            inner,
            { scale: 1.15, borderRadius: "40px" },
            {
              scale: 1,
              borderRadius: "0px",
              ease: "none",
              scrollTrigger: {
                trigger: zoomRevealRef.current,
                start: "top 80%",
                end: "top 20%",
                scrub: 1,
              },
            }
          );
        }

        // Zoom cards stagger
        const zCards = zoomRevealRef.current.querySelectorAll(".zoom-card");
        if (zCards?.length) {
          zCards.forEach((card, i) => {
            gsap.from(card, {
              opacity: 0,
              y: 40,
              duration: 0.6,
              delay: i * 0.1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: card,
                start: "top 85%",
                once: true,
              },
            });
          });
        }
      }

      // 12. 3D TILT on hover
      gsap.utils.toArray(".tilt-card").forEach((card) => {
        const inner = card.querySelector(".tilt-inner");
        if (!inner) return;

        card.addEventListener("mousemove", (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateX = ((y - centerY) / centerY) * -6;
          const rotateY = ((x - centerX) / centerX) * 6;
          inner.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });

        card.addEventListener("mouseleave", () => {
          inner.style.transform = "perspective(1000px) rotateX(0) rotateY(0) scale(1)";
        });
      });

      // 13. STICKY METRICS scroll counter (desktop only)
      if (stickyMetricsRef.current && !mobile) {
        const numSlides = stickyMetricsRef.current.querySelectorAll(".metric-slide").length;
        let lastIdx = -1;
        ScrollTrigger.create({
          trigger: stickyMetricsRef.current,
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => {
            const p = self.progress;
            // Update progress bar via DOM directly (no re-render)
            if (metricsProgressRef.current) {
              metricsProgressRef.current.style.width = `${p * 100}%`;
            }
            // 8% padding at start, 12% padding at end (last slide stays visible longer)
            const adjusted = Math.min(1, Math.max(0, (p - 0.08) / 0.80));
            const idx = Math.min(Math.floor(adjusted * numSlides), numSlides - 1);
            if (idx !== lastIdx) {
              lastIdx = idx;
              setActiveMetric(idx);
            }
          },
        });
      }

      // 14. SECTION FADE INS
      gsap.utils.toArray(".gsap-fade-up").forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 50,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            once: true,
          },
        });
      });

      // Refresh after layout settles (sticky metrics changes scroll height)
      ScrollTrigger.refresh();
      setTimeout(() => ScrollTrigger.refresh(), 300);
        ScrollTrigger.refresh();
      });
    }, 150);

    return () => {
      clearTimeout(timer);
      if (ctx) ctx.revert();
    };
  }, [isMobile]);

  // Metric counter animation
  const prevMetricRef = useRef(-2);
  useEffect(() => {
    if (activeMetric < 0) return;
    if (prevMetricRef.current === activeMetric) return;
    prevMetricRef.current = activeMetric;
    const el = metricCounterRefs.current[activeMetric];
    if (!el) return;
    const raw = el.dataset.value;
    const isFloat = raw.includes(".");
    const hasPlus = raw.includes("+");
    const numVal = parseFloat(raw.replace("+", ""));
    if (isNaN(numVal)) { el.textContent = raw; return; }
    const dur = 800;
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / dur, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = numVal * eased;
      el.textContent = isFloat ? current.toFixed(1) : Math.round(current).toString();
      if (hasPlus && progress >= 1) el.textContent += "+";
      if (progress < 1) requestAnimationFrame(animate);
    };
    el.textContent = isFloat ? "0.0" : "0";
    requestAnimationFrame(animate);
  }, [activeMetric]);

  /* ─── PARSE HIGHLIGHTED TEXT (from translations) ─── */
  const parseHighlightedText = useCallback((text) => {
    if (!text) return [];
    const parts = text.split(/<highlight>|<\/highlight>/);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return (
          <span key={i} className="highlighted-word">
            {part}
          </span>
        );
      }
      return part ? <React.Fragment key={i}>{part}</React.Fragment> : null;
    });
  }, []);

  /* ─── SPLIT TEXT INTO WORDS FOR ANIMATION ─── */
  const splitWords = useCallback((text, highlightWords = []) => {
    if (!text) return null;
    return text.split(" ").map((word, i) => {
      const isHighlight = highlightWords.some(
        (hw) => word.toLowerCase().replace(/[^a-z]/g, "") === hw.toLowerCase()
      );
      return (
        <span className="word" key={i}>
          <span className={`word-inner ${isHighlight ? "highlight" : ""}`}>
            {word}&nbsp;
          </span>
        </span>
      );
    });
  }, []);

  /* ─── DATA ─── */
  const testimonialData = [
    { content: t("reviews.farzad.text"), company: t("reviews.farzad.company"), role: t("reviews.farzad.role") },
    { content: t("reviews.vantage.text"), company: t("reviews.vantage.company"), role: t("reviews.vantage.role") },
    { content: t("reviews.skylar.text"), company: t("reviews.skylar.company"), role: t("reviews.skylar.role") },
    { content: t("reviews.techvision.text"), company: t("reviews.techvision.company"), role: t("reviews.techvision.role") },
    { content: t("reviews.greenleaf.text"), company: t("reviews.greenleaf.company"), role: t("reviews.greenleaf.role") },
    { content: t("reviews.innovatelab.text"), company: t("reviews.innovatelab.company"), role: t("reviews.innovatelab.role") },
  ];

  const benchmarkCards = [
    {
      icon: <FaTasks />,
      value: "58%",
      title: lang === "es" ? "del tiempo en coordinación" : "of time spent on coordination",
      description: lang === "es" ? "Trabajo operativo y coordinación en equipos de conocimiento." : "Operational coordination ('work about work') in knowledge teams.",
      sourceLabel: "Asana Anatomy of Work (2023)",
      sourceUrl: "https://investors.asana.com/news-releases/news-release-details/asana-anatomy-work-global-index-2023-smart-collaboration-and/",
    },
    {
      icon: <FaClock />,
      value: "4.9h",
      title: lang === "es" ? "ahorrables por persona/semana" : "recoverable per person/week",
      description: lang === "es" ? "Horas que los trabajadores estiman recuperar con mejores procesos." : "Hours workers estimate they could recover with better processes.",
      sourceLabel: "Asana Anatomy of Work (2023)",
      sourceUrl: "https://investors.asana.com/news-releases/news-release-details/asana-anatomy-work-global-index-2023-smart-collaboration-and/",
    },
    {
      icon: <FaBolt />,
      value: "2 min",
      title: lang === "es" ? "entre interrupciones promedio" : "between average interruptions",
      description: lang === "es" ? "Meetings, emails y chats interrumpen el foco de trabajo." : "Meetings, emails, and chats interrupt focused work.",
      sourceLabel: "Microsoft Work Trend Index (2025)",
      sourceUrl: "https://www.microsoft.com/en-us/worklab/work-trend-index/breaking-down-infinite-workday/",
    },
    {
      icon: <FaDollarSign />,
      value: "32%",
      title: lang === "es" ? "reducción promedio de costos" : "average cost reduction",
      description: lang === "es" ? "Organizaciones maduras en automatización reportan reducción de costos." : "Mature automation organizations report cost reduction.",
      sourceLabel: "Deloitte Intelligent Automation Survey (2022)",
      sourceUrl: "https://www.deloitte.com/us/en/insights/topics/talent/intelligent-automation-2022-survey-results.html",
    },
  ];

  const benchmarkBars = [
    { label: lang === "es" ? "Tiempo en coordinación manual" : "Time spent on manual coordination", value: 58, color: "#CC5A50" },
    { label: lang === "es" ? "Trabajo percibido como caótico" : "Work perceived as chaotic", value: 48, color: "#111111" },
    { label: lang === "es" ? "Reducción de costos (automatización madura)" : "Cost reduction (mature automation)", value: 32, color: "#374151" },
    { label: lang === "es" ? "Roles con actividades automatizables" : "Roles with technically automatable activities", value: 60, color: "#6B7280" },
  ];

  const caseStudies = [
    { img: "/case-studies/valthor.jpeg", categoryKey: "caseStudiesSection.valthorCategory", titleKey: "caseStudiesSection.valthorTitle", descKey: "caseStudiesSection.valthorDesc", stat: { value: "40%", labelKey: "caseStudiesSection.valthorStat" }, link: "https://www.valthorcrm.com/" },
    { img: "/case-studies/hot-date-kitchen.jpeg", categoryKey: "caseStudiesSection.hotdateCategory", titleKey: "caseStudiesSection.hotdateTitle", descKey: "caseStudiesSection.hotdateDesc", stat: null, link: "https://hotdatekitchen.com/" },
    { img: "/case-studies/smarters-city.jpeg", categoryKey: "caseStudiesSection.smartersCategory", titleKey: "caseStudiesSection.smartersTitle", descKey: "caseStudiesSection.smartersDesc", stat: null, link: "https://smarters.city/", imgStyle: { objectPosition: "top center", marginTop: "-45px" } },
    { img: "/case-studies/vantage.jpeg", categoryKey: "caseStudiesSection.vantageCategory", titleKey: "caseStudiesSection.vantageTitle", descKey: "caseStudiesSection.vantageDesc", stat: null, link: "https://vantageinc.ai/" },
    { img: "/case-studies/propbot.png", categoryKey: "caseStudiesSection.propbotCategory", titleKey: "caseStudiesSection.propbotTitle", descKey: "caseStudiesSection.propbotDesc", stat: { value: "60%", labelKey: "caseStudiesSection.propbotStat" }, link: "https://propbot.cc" },
  ];

  const projects = [
    { image: "/smarters-card.png", title: t("featuredWorkSection.smartersCity.title"), link: "https://smarters.city/", fill: true },
    { image: "/valthor-logo.e3b5a398.png", title: "Valthor CRM", link: "https://www.valthorcrm.com/" },
    { image: "/Cicero.png", title: t("featuredWorkSection.cicero.title"), link: "https://www.linkedin.com/company/cicerolearn/", fill: true },
    { image: "/vantage.svg", title: t("featuredWorkSection.vantage.title"), link: "https://vantageinc.ai/" },
    { image: "/vivabots_azul.png", title: "Vivabots RPA", link: "https://vivabots.com/" },
    { image: "/estudio-sab.png", title: t("featuredWorkSection.estudioSab.title"), link: "https://estudiosab.com/", fill: true },
    { image: "/Skylar.png", title: t("featuredWorkSection.skylar.title"), link: "https://skylar.ar/" },
    { image: "/HotDate.png", title: t("featuredWorkSection.hotDateKitchen.title"), link: "https://hotdatekitchen.com/" },
    { image: "/propbot-logo.svg", title: t("featuredWorkSection.propbot.title"), link: "https://propbot.cc" },
    { image: "/GBS.png", title: "GBS Abogados", link: "#", fill: true },
    { image: "/kdabogados.png", title: "KD Abogados", link: "https://kdabogados.com.ar/", fill: true },
  ];

  const duplicatedProjects = [...projects, ...projects];

  const SvcIconPeople = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
  const SvcIconGear = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
  const SvcIconChart = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );

  const services = [
    {
      icon: <SvcIconPeople />,
      titleKey: "homeCapabilitiesSection.cards.softwareDevelopment.title",
      descKey: "homeCapabilitiesSection.cards.softwareDevelopment.description",
      links: [
        { text: "Staff Augmentation", href: "/services/staff-augmentation" },
        { text: lang === "es" ? "Automatización de Flujos" : "Workflow Automation", href: "/services/workflow-automation" },
      ],
    },
    {
      icon: <SvcIconGear />,
      titleKey: "homeCapabilitiesSection.cards.mobileDevelopment.title",
      descKey: "homeCapabilitiesSection.cards.mobileDevelopment.description",
      badge: t("homeCapabilitiesSection.mostPopular", "Most Popular"),
      links: [
        { text: lang === "es" ? "Automatización de Flujos" : "Workflow Automation", href: "/services/workflow-automation" },
        { text: "Staff Augmentation", href: "/services/staff-augmentation" },
      ],
    },
    {
      icon: <SvcIconChart />,
      titleKey: "homeCapabilitiesSection.cards.dataAutomation.title",
      descKey: "homeCapabilitiesSection.cards.dataAutomation.description",
      links: [
        { text: lang === "es" ? "Automatización de Flujos" : "Workflow Automation", href: "/services/workflow-automation" },
        { text: "Staff Augmentation", href: "/services/staff-augmentation" },
      ],
    },
  ];

  const marqueeItems = [
    "WORKFLOW AUTOMATION",
    "STAFF AUGMENTATION",
    "NEARSHORE ENGINEERING",
    "OPERATIONAL EFFICIENCY",
    "PROCESS AUTOMATION",
    "CULTURAL FIT",
  ];

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "OpenGateHub",
    url: "https://opengatehub.com",
    logo: "https://opengatehub.com/og-image.png",
    sameAs: ["https://www.linkedin.com/company/opengatehub"],
    description: "OpenGateHub helps companies eliminate manual work through workflow automation, AI integration, and embedded engineering teams.",
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: "https://opengatehub.com",
    name: "OpenGateHub",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: "https://opengatehub.com/search?q={search_term_string}" },
      "query-input": "required name=search_term_string",
    },
  };

  /* ─── HERO TEXT ─── */
  const heroText = `${t("heroAnimatedText.part1")} ${t("heroAnimatedText.highlight1")} ${t("heroAnimatedText.part2")} ${t("heroAnimatedText.highlight2")}.`;
  const highlightWords = [
    t("heroAnimatedText.highlight1"),
    t("heroAnimatedText.highlight2"),
  ];

  /* ─── PROBLEM TEXT SPLIT FOR REVEAL ─── */
  const problemText = t("problemText");
  const weGetYouText = t("weGetYouText");
  const revealFullText = `${problemText} ${weGetYouText}`;

  return (
    <>
      <SEO
        title="Workflow Automation & Staff Augmentation from Latin America | OpenGateHub"
        description="Your team is losing 8+ hours per person each week to tasks automation handles in minutes. OpenGateHub automates workflows, embeds nearshore senior engineers from LATAM, and delivers results in 7.3 days. 9.7/10 CSAT."
        keywords="workflow automation, process automation, staff augmentation LATAM, nearshore staff augmentation, operational efficiency, nearshore software development, Latin America, business automation, hire developers Latin America"
      >
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      </SEO>

      {/* Scroll progress bar */}
      <ScrollProgress style={{ width: `${scrollProgress}%` }} />

      <Container>
        {/* ═══════════ HERO ═══════════ */}
        <Hero ref={heroRef}>
          <HeroOrb className="hero-orb" $color="rgba(80, 80, 80, 0.2)" $size="700px" $top="-200px" $right="-200px" $blur="150px" $duration="25s" />
          <HeroOrb className="hero-orb" $color="rgba(60, 60, 60, 0.15)" $size="500px" $bottom="-150px" $left="-100px" $blur="130px" $duration="30s" $delay="5s" />
          <HeroOrb className="hero-orb" $color="rgba(100, 100, 100, 0.1)" $size="400px" $top="30%" $left="60%" $blur="100px" $duration="20s" $delay="2s" />

          <Title ref={titleRef}>
            {splitWords(heroText, highlightWords)}
          </Title>

          <Subtitle ref={subtitleRef}>{t("heroSubtitle")}</Subtitle>

          <HeroCTAGroup ref={ctaGroupRef}>
            <CTAButton
              href={isMobile ? "https://calendly.com/sanchezgcandelaria/15min" : "/contact-us"}
              target={isMobile ? "_blank" : "_self"}
              rel={isMobile ? "noopener noreferrer" : undefined}
              className="primary-cta"
            >
              {t("ctaButton")}
              <span style={{ marginLeft: 4, transition: "transform 0.3s", color: "#CC5A50" }}>→</span>
            </CTAButton>
            <CTAButton href="/calculator" className="secondary-cta">
              {t("heroSecondaryCTA", "See what it's costing you →")}
            </CTAButton>
          </HeroCTAGroup>

          <TrustChips ref={trustRef}>
            {[
              t("heroTrustChip1", "9.7/10 CSAT"),
              t("heroTrustChip2", "7.3-day kickoff"),
              t("heroTrustChip3", "50+ sprints shipped"),
            ].map((chip) => (
              <TrustChip key={chip}>{chip}</TrustChip>
            ))}
          </TrustChips>
        </Hero>

        {/* ═══════════ MARQUEE BANNER ═══════════ */}
        <MarqueeBanner>
          <MarqueeTrack>
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <MarqueeItem key={i}>{item}</MarqueeItem>
            ))}
          </MarqueeTrack>
        </MarqueeBanner>
      </Container>

      {/* ═══════════ TEXT REVEAL SECTION (outside flex container for GSAP pin) ═══════════ */}
      <div style={{ height: "6rem", background: "#fff" }} />
      <TextRevealSection ref={revealSectionRef}>
        <TextRevealContent ref={revealRef}>
          <div className="gsap-fade-up" style={{ marginBottom: 32 }}>
            <SectionEyebrow>
              {lang === "es" ? "El problema" : "The Problem"}
            </SectionEyebrow>
          </div>
          <RevealText>
            {revealFullText.split(" ").map((word, i) => (
              <span className="reveal-word" key={i}>
                {word}{" "}
              </span>
            ))}
          </RevealText>
        </TextRevealContent>
      </TextRevealSection>

      <Container>
        {/* ═══════════ BENCHMARKS ═══════════ */}
        <Section $bg="#f8fafc" $padding="100px 24px" $mobilePadding="60px 16px">
          <SectionInner ref={benchmarkRef}>
            <div className="gsap-fade-up" style={{ textAlign: "center", marginBottom: 48 }}>
              <SectionTitle>
                {lang === "es"
                  ? "Automatizar impacta negocio, no solo tecnología"
                  : "Automation impacts business, not just tech"}
              </SectionTitle>
              <SectionText style={{ maxWidth: 840, margin: "0 auto" }}>
                {lang === "es"
                  ? "Benchmarks globales muestran cuánto tiempo, foco y costo se pierde sin workflows conectados."
                  : "Global benchmarks show how much time, focus, and budget is lost without connected workflows."}
              </SectionText>
            </div>

            <BenchmarkGrid>
              {benchmarkCards.map((item, i) => (
                <BenchmarkCard key={i} className="bench-card" style={{ transitionDelay: `${i * 0.1}s` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 4,
                        background: "rgba(0, 0, 0, 0.05)",
                        color: "#111111",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.1rem",
                      }}
                    >
                      {item.icon}
                    </div>
                    <BenchmarkValue>{item.value}</BenchmarkValue>
                  </div>
                  <div style={{ fontWeight: 600, color: "#1F2937", marginBottom: 6 }}>
                    {item.title}
                  </div>
                  <p style={{ color: "#6B7280", fontSize: "0.92rem", lineHeight: 1.6, marginBottom: 10 }}>
                    {item.description}
                  </p>
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#71717A", fontSize: "0.82rem", textDecoration: "none", fontWeight: 600 }}
                  >
                    {lang === "es" ? "Fuente:" : "Source:"} {item.sourceLabel}
                  </a>
                </BenchmarkCard>
              ))}
            </BenchmarkGrid>

            {/* Visual bars */}
            <div
              className="gsap-fade-up"
              style={{
                background: "white",
                border: "1px solid #E5E7EB",
                borderRadius: 4,
                padding: isMobile ? 20 : 28,
                boxShadow: "0 6px 24px rgba(15, 23, 42, 0.05)",
              }}
            >
              <h3 style={{ marginBottom: 20, color: "#111827", fontSize: "1.1rem", fontWeight: 700 }}>
                {lang === "es" ? "Benchmarks visuales de fricción operativa" : "Visual benchmarks of operational friction"}
              </h3>
              {benchmarkBars.map((bar, idx) => (
                <div key={idx} style={{ marginBottom: idx === benchmarkBars.length - 1 ? 0 : 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "0.9rem", color: "#374151" }}>
                    <span>{bar.label}</span>
                    <strong>{bar.value}%</strong>
                  </div>
                  <BenchmarkBar>
                    <div className="bar-fill" data-width={bar.value} style={{ background: bar.color }} />
                  </BenchmarkBar>
                </div>
              ))}
              <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
                {[
                  { label: "Asana 2023", url: "https://investors.asana.com/news-releases/news-release-details/asana-anatomy-work-global-index-2023-smart-collaboration-and/" },
                  { label: "Microsoft 2025", url: "https://www.microsoft.com/en-us/worklab/work-trend-index/breaking-down-infinite-workday/" },
                  { label: "Deloitte 2022", url: "https://www.deloitte.com/us/en/insights/topics/talent/intelligent-automation-2022-survey-results.html" },
                  { label: "McKinsey 2017", url: "https://www.mckinsey.com/featured-insights/employment-and-growth/jobs-lost-jobs-gained-what-the-future-of-work-will-mean-for-jobs-skills-and-wages" },
                ].map((source, idx) => (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#71717A", textDecoration: "none", fontSize: "0.82rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}
                  >
                    Source: {source.label} <FaExternalLinkAlt style={{ fontSize: "0.6rem" }} />
                  </a>
                ))}
              </div>
            </div>

            <div className="gsap-fade-up" style={{ textAlign: "center", padding: "32px 0 0" }}>
              <Link
                href="/calculator"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#111111", fontWeight: 600, fontSize: "0.97rem", textDecoration: "none", borderBottom: "2px solid #111111", paddingBottom: 2 }}
              >
                {t("caseStudiesSection.benchmarksCTA", "Calculate your team's potential savings →")}
              </Link>
            </div>
          </SectionInner>
        </Section>

        {/* ═══════════ PARALLAX SHOWCASE ═══════════ */}
        <ParallaxShowcase ref={parallaxShowcaseRef}>
          <div className="parallax-bg" />
          <div className="parallax-content">
            <div className="parallax-number">
              {lang === "es" ? "8h+" : "8h+"}
            </div>
            <div className="parallax-stat-label">
              {lang === "es"
                ? "perdidas por persona, cada semana"
                : "lost per person, every single week"}
            </div>
            <div className="parallax-stat-desc">
              {lang === "es"
                ? "Tareas repetitivas, coordinación manual, copy-paste entre herramientas. Tiempo que la automatización recupera en minutos."
                : "Repetitive tasks, manual coordination, copy-pasting between tools. Time that automation recovers in minutes."}
            </div>
          </div>
        </ParallaxShowcase>

        {/* ═══════════ SERVICES WITH 3D TILT ═══════════ */}
        <Section ref={servicesRef} $bg="white" $padding="100px 24px" $mobilePadding="60px 16px" style={{ position: "relative" }}>
          <GridBackground />
          <SectionInner>
            <div className="gsap-fade-up" style={{ textAlign: "center", marginBottom: 48 }}>
              <SectionTitle>
                {t("homeCapabilitiesSection.title")}
              </SectionTitle>
              <SectionText style={{ margin: "0 auto" }}>
                {t("homeCapabilitiesSection.subtitle")}
              </SectionText>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
              gap: 24,
            }}>
              {services.map((svc, i) => (
                <div className="tilt-card" key={i}>
                  <ServiceCard className="svc-card tilt-inner" style={{ width: "100%", minWidth: "auto" }}>
                    {svc.badge && <ServiceBadge>{svc.badge}</ServiceBadge>}
                    <ServiceIcon>{svc.icon}</ServiceIcon>
                    <ServiceTitle>{t(svc.titleKey)}</ServiceTitle>
                    <ServiceDescription>{t(svc.descKey)}</ServiceDescription>
                    <ServiceLinks>
                      {svc.links.map((link, j) => (
                        <Link key={j} href={link.href} passHref legacyBehavior>
                          <ServiceLink>{link.text}</ServiceLink>
                        </Link>
                      ))}
                    </ServiceLinks>
                  </ServiceCard>
                </div>
              ))}
            </div>
          </SectionInner>
        </Section>

        {/* ═══════════ ZOOM REVEAL SECTION ═══════════ */}
        <ZoomRevealSection ref={zoomRevealRef}>
          <div className="zoom-inner">
            <div className="zoom-title">
              {lang === "es" ? (
                <>Resultados que <span>hablan solos</span></>
              ) : (
                <>Results that <span>speak for themselves</span></>
              )}
            </div>
            <div className="zoom-subtitle">
              {lang === "es"
                ? "Métricas reales de equipos que dejaron de perder tiempo y empezaron a escalar."
                : "Real metrics from teams that stopped losing time and started scaling."}
            </div>
            <div className="zoom-grid">
              {[
                { target: 9.7, suffix: "/10", decimals: 1, label: "CSAT" },
                { target: 7.3, suffix: "", decimals: 1, label: lang === "es" ? "días avg kickoff" : "days avg kickoff" },
                { target: 50, suffix: "+", decimals: 0, label: lang === "es" ? "sprints entregados" : "sprints shipped" },
                { target: 32, suffix: "%", decimals: 0, label: lang === "es" ? "reducción de costos" : "cost reduction" },
                { target: 4.9, suffix: "h", decimals: 1, label: lang === "es" ? "recuperadas/semana" : "recovered/week" },
                { target: 96, suffix: "%", decimals: 0, label: lang === "es" ? "entregas a tiempo" : "on-time delivery" },
              ].map((item, i) => (
                <div className="zoom-card" key={i}>
                  <div className="zoom-card-value">
                    <CountUp target={item.target} suffix={item.suffix} decimals={item.decimals} />
                  </div>
                  <div className="zoom-card-label">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </ZoomRevealSection>

        {/* ═══════════ STICKY METRICS ═══════════ */}
        {isMobile ? (
          <Section $bg="#0a0a0a" $padding="80px 24px" $mobilePadding="60px 16px">
            <SectionInner>
              <div style={{ textAlign: "center", marginBottom: 40 }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.25em" }}>
                  {t("metricsSection.title", "Proven Results")}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
                {["avgKickoff","onTimeDelivery","npsScore","sprintsShipped","cycleTimeReduction"].map((key) => {
                  const d = t(`metricsSection.metrics.${key}`, { returnObjects: true });
                  return (
                    <div key={key} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "3.5rem", fontWeight: 900, color: "#fff", lineHeight: 1, display: "flex", alignItems: "baseline", justifyContent: "center", gap: "0.05em" }}>
                        {d.value}
                        {d.unit && <span style={{ fontSize: "1.5rem", fontWeight: 500, color: "rgba(255,255,255,0.35)" }}>{d.unit}</span>}
                      </div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.2em", marginTop: 12 }}>
                        {d.label}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.35)", marginTop: 8, lineHeight: 1.5 }}>
                        {d.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionInner>
          </Section>
        ) : (
          <StickyMetricsWrapper
            ref={stickyMetricsRef}
            style={{ height: "700vh" }}
          >
            <StickyMetricsViewport>
              <div className="sticky-metrics-eyebrow">{t("metricsSection.title", "Proven Results")}</div>
              <StickyMetricsProgress ref={metricsProgressRef} style={{ width: 0 }} />
              <StickyMetricDots>
                {["avgKickoff","onTimeDelivery","npsScore","sprintsShipped","cycleTimeReduction"].map((_, i) => (
                  <StickyMetricDot key={i} $active={activeMetric === i} />
                ))}
              </StickyMetricDots>
              {["avgKickoff","onTimeDelivery","npsScore","sprintsShipped","cycleTimeReduction"].map((key, i) => {
                const d = t(`metricsSection.metrics.${key}`, { returnObjects: true });
                return (
                  <StickyMetricSlide key={key} className={`metric-slide ${activeMetric === i ? "active" : ""}`}>
                    <div className="metric-counter">
                      <span
                        ref={(el) => { metricCounterRefs.current[i] = el; }}
                        data-value={d.value}
                      >
                        {d.value}
                      </span>
                      {d.unit && <span className="metric-unit">{d.unit}</span>}
                    </div>
                    <div className="metric-label">{d.label}</div>
                    <div className="metric-desc">{d.description}</div>
                  </StickyMetricSlide>
                );
              })}
            </StickyMetricsViewport>
          </StickyMetricsWrapper>
        )}

        {/* ═══════════ CALCULATOR BANNER ═══════════ */}
        <CalculatorBanner $isMobile={isMobile} className="gsap-fade-up">
          <div style={{ maxWidth: 660, margin: "0 auto", position: "relative", zIndex: 1 }}>
            <SectionEyebrow>{t("calculator.bannerEyebrow")}</SectionEyebrow>
            <h2
              style={{
                fontSize: isMobile ? "1.85rem" : "2.7rem",
                fontWeight: 800,
                color: "#111827",
                lineHeight: 1.2,
                marginBottom: 16,
                letterSpacing: "-0.02em",
              }}
            >
              {t("calculator.bannerTitle")}
            </h2>
            <p style={{ fontSize: "1.05rem", color: "#6b7280", lineHeight: 1.7, maxWidth: 460, margin: "0 auto 40px" }}>
              {t("calculator.bannerSub")}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                gap: 16,
                maxWidth: 560,
                margin: "0 auto 40px",
              }}
            >
              {[
                { value: "8h", labelKey: "calculator.bannerStat1Label", source: "Zapier, 2021" },
                { value: "60%", labelKey: "calculator.bannerStat2Label", source: "Flobotics, 2024" },
                { value: "2 min", labelKey: "calculator.bannerStat3Label", source: "Microsoft WTI, 2025" },
              ].map((stat) => (
                <div
                  key={stat.value}
                  style={{
                    background: "white",
                    border: "1.5px solid #e5e7eb",
                    borderRadius: 4,
                    padding: "24px 16px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#111111" }} />
                  <p style={{ fontSize: "2rem", fontWeight: 700, color: "#111111", lineHeight: 1, marginBottom: 6 }}>
                    {stat.value}
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 500, lineHeight: 1.4 }}>
                    {t(stat.labelKey)}
                  </p>
                  <p style={{ fontSize: "0.65rem", color: "#d1d5db", marginTop: 6 }}>{stat.source}</p>
                </div>
              ))}
            </div>

            <Link href="/calculator">
              <button
                style={{
                  background: "#111111",
                  color: "white",
                  border: "none",
                  borderRadius: 60,
                  padding: "16px 40px",
                  fontSize: "1.05rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                  transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px) scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.15)";
                }}
              >
                {t("calculator.bannerCTA")}
              </button>
            </Link>
            <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: 14 }}>
              {t("calculator.trustLine")}
            </p>
          </div>
        </CalculatorBanner>

        {/* ═══════════ CASE STUDIES ═══════════ */}
        <Section $bg="white" $padding="100px 24px" $mobilePadding="60px 16px">
          <SectionInner $maxWidth="1040px" ref={caseStudyRef}>
            <div className="gsap-fade-up" style={{ textAlign: "center", marginBottom: isMobile ? 40 : 56 }}>
              <SectionEyebrow>{t("caseStudiesSection.eyebrow")}</SectionEyebrow>
              <SectionTitle>{t("caseStudiesSection.title")}</SectionTitle>
              <SectionText style={{ margin: "0 auto" }}>
                {t("caseStudiesSection.subtitle")}
              </SectionText>
            </div>

            <CaseStudyGrid>
              {caseStudies.map((cs) => (
                <CaseStudyCard
                  key={cs.titleKey}
                  className="case-card"
                  onClick={() => window.open(cs.link, "_blank", "noopener,noreferrer")}
                >
                  <div className="case-img">
                    <img src={cs.img} alt={t(cs.titleKey)} loading="lazy" style={cs.imgStyle} />
                  </div>
                  <div className="case-content">
                    <span className="case-category">{t(cs.categoryKey)}</span>
                    <h3 className="case-title">{t(cs.titleKey)}</h3>
                    <p className="case-desc">{t(cs.descKey)}</p>
                    {cs.stat && (
                      <div className="case-stat">
                        <span className="case-stat-value">{cs.stat.value}</span>
                        <span className="case-stat-label">{t(cs.stat.labelKey)}</span>
                      </div>
                    )}
                  </div>
                </CaseStudyCard>
              ))}
            </CaseStudyGrid>
          </SectionInner>
        </Section>

        {/* ═══════════ FEATURED WORK ═══════════ */}
        <CarouselSection>
          <div style={{ textAlign: "center", marginBottom: 32, padding: "0 24px" }}>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 600, color: "#6B7280", marginBottom: 8 }}>
              {t("featuredWorkSection.title")}
            </h3>
            <p style={{ fontSize: "1rem", maxWidth: 600, margin: "0 auto", color: "#9CA3AF" }}>
              {t("featuredWorkSection.subtitle")}
            </p>
          </div>
          <div style={{ overflow: "hidden" }}>
            <CarouselTrack>
              {duplicatedProjects.map((project, i) => (
                <CarouselCard
                  key={`${project.title}-${i}`}
                  $hasLink={project.link && project.link !== "#"}
                  onClick={() => {
                    if (project.link && project.link !== "#") {
                      window.open(project.link, "_blank", "noopener,noreferrer");
                    }
                  }}
                >
                  <div className="carousel-logo">
                    <img
                      src={project.image}
                      alt={project.title}
                      loading="lazy"
                    />
                  </div>
                  <span className="carousel-title">{project.title}</span>
                </CarouselCard>
              ))}
            </CarouselTrack>
          </div>
        </CarouselSection>

        {/* ═══════════ HOW IT WORKS (sticky scroll on desktop, normal flow on mobile) ═══════════ */}
        {isMobile ? (
          <PlanSection>
            <SectionInner>
              <div style={{ textAlign: "center" }}>
                <SectionTitle style={{ color: "white" }}>
                  {t("planTitle")}
                </SectionTitle>
              </div>

              <PlanSteps>
                {[
                  { num: "01", text: t("planSteps.step1") },
                  { num: "02", text: t("planSteps.step2") },
                  { num: "03", text: t("planSteps.step3") },
                ].map((step, i) => (
                  <PlanStep key={i}>
                    <div className="step-number">{step.num}</div>
                    <div className="step-text">{step.text}</div>
                  </PlanStep>
                ))}
              </PlanSteps>

              <div style={{ textAlign: "center", marginTop: 48 }}>
                <CTAButton
                  href="https://calendly.com/sanchezgcandelaria/15min"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="secondary-cta"
                >
                  {t("homeServicesSection.startJourneyButton")}
                </CTAButton>
              </div>
            </SectionInner>
          </PlanSection>
        ) : (
          <div ref={planRef} style={{ position: "relative", height: "800vh", zIndex: 2 }}>
            <PlanSection style={{ position: "sticky", top: 0, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <SectionInner>
                <div style={{ textAlign: "center" }}>
                  <SectionTitle style={{ color: "white" }}>
                    {t("planTitle")}
                  </SectionTitle>
                </div>

                <PlanSteps>
                  {[
                    { num: "01", text: t("planSteps.step1") },
                    { num: "02", text: t("planSteps.step2") },
                    { num: "03", text: t("planSteps.step3") },
                  ].map((step, i) => (
                    <PlanStep
                      key={i}
                      className="plan-step"
                      style={{
                        opacity: activePlanStep >= i ? 1 : 0,
                        transform: activePlanStep >= i ? "translateY(0)" : "translateY(40px)",
                      }}
                    >
                      <div className="step-number">{step.num}</div>
                      <div className="step-text">{step.text}</div>
                    </PlanStep>
                  ))}
                </PlanSteps>

                <div style={{
                  textAlign: "center",
                  marginTop: 48,
                  opacity: activePlanStep >= 3 ? 1 : 0,
                  transform: activePlanStep >= 3 ? "translateY(0)" : "translateY(20px)",
                  transition: "opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                }}>
                  <CTAButton
                    href="/contact-us"
                    target="_self"
                    className="secondary-cta"
                  >
                    {t("homeServicesSection.startJourneyButton")}
                  </CTAButton>
                </div>
              </SectionInner>
            </PlanSection>
          </div>
        )}

        {/* ═══════════ TESTIMONIALS ═══════════ */}
        <TestimonialsSection>
          <div className="reviews-header gsap-fade-up">
            <div className="reviews-eyebrow">{t("reviewsTitle")}</div>
            <div className="reviews-title">{t("reviewsSubtitle")}</div>
          </div>
          <ReviewsInfiniteMarquee testimonials={testimonialData} />
        </TestimonialsSection>

        {/* ═══════════ FINAL CTA ═══════════ */}
        <HomeCallToAction />
      </Container>
    </>
  );
}
