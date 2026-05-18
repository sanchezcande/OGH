import styled, { keyframes, css } from "styled-components";

/* ═══════════════════════════════════════════
   KEYFRAMES
   ═══════════════════════════════════════════ */

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const floatAnim = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
`;

const marquee = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

const grain = keyframes`
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-5%, -10%); }
  20% { transform: translate(-15%, 5%); }
  30% { transform: translate(7%, -25%); }
  40% { transform: translate(-5%, 25%); }
  50% { transform: translate(-15%, 10%); }
  60% { transform: translate(15%, 0%); }
  70% { transform: translate(0%, 15%); }
  80% { transform: translate(3%, 35%); }
  90% { transform: translate(-10%, 10%); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const slideIn = keyframes`
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const accentLine = keyframes`
  from { width: 0; opacity: 0; }
  to { width: 30px; opacity: 1; }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

/* ═══════════════════════════════════════════
   MAIN CONTAINER
   ═══════════════════════════════════════════ */

export const Container = styled.div`
  position: relative;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

/* ═══════════════════════════════════════════
   HERO SECTION
   ═══════════════════════════════════════════ */

export const Hero = styled.section`
  position: relative;
  width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
  background: #0a0a0a;
  padding: 120px 24px 80px;

  /* Film grain overlay */
  &::before {
    content: "";
    position: absolute;
    inset: -200%;
    width: 400%;
    height: 400%;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    animation: ${grain} 8s steps(10) infinite;
    pointer-events: none;
    z-index: 1;
    opacity: 0.5;
  }

  /* Gradient mesh */
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0, 0, 0, 0.06) 0%, transparent 60%),
      radial-gradient(ellipse 60% 80% at 80% 50%, rgba(0, 0, 0, 0.04) 0%, transparent 50%),
      radial-gradient(ellipse 60% 60% at 20% 80%, rgba(0, 0, 0, 0.03) 0%, transparent 50%);
    z-index: 1;
    pointer-events: none;
  }

  & > * {
    position: relative;
    z-index: 2;
  }

  @media (max-width: 768px) {
    min-height: 90vh;
    padding: 100px 16px 60px;
  }
`;

export const HeroOrb = styled.div`
  position: absolute;
  border-radius: 50%;
  filter: blur(${({ $blur }) => $blur || "120px"});
  opacity: ${({ $opacity }) => $opacity || 0.3};
  background: ${({ $color }) => $color || "rgba(120, 120, 120, 0.4)"};
  width: ${({ $size }) => $size || "600px"};
  height: ${({ $size }) => $size || "600px"};
  top: ${({ $top }) => $top || "auto"};
  left: ${({ $left }) => $left || "auto"};
  right: ${({ $right }) => $right || "auto"};
  bottom: ${({ $bottom }) => $bottom || "auto"};
  animation: ${floatAnim} ${({ $duration }) => $duration || "20s"} ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay || "0s"};
  z-index: 0;
  will-change: transform;
  pointer-events: none;
`;

export const Title = styled.h1`
  color: rgba(255, 255, 255, 0.45);
  font-size: clamp(2.8rem, 6vw, 5rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.03em;
  max-width: 900px;
  margin: 0 auto 24px;

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
    color: white;
    opacity: 1;
  }

  @media (max-width: 768px) {
    font-size: clamp(2rem, 8vw, 3rem);
    letter-spacing: -0.02em;
  }
`;

export const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: clamp(1rem, 1.5vw, 1.25rem);
  font-weight: 400;
  line-height: 1.7;
  max-width: 600px;
  margin: 0 auto 40px;
  opacity: 0;
  transform: translateY(20px);

  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 32px;
  }
`;

export const HeroCTAGroup = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transform: translateY(20px);
`;

export const CTAButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 16px 32px;
  font-weight: 600;
  font-size: 1rem;
  border-radius: 60px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
  border: none;

  &.primary-cta {
    background: white;
    color: #111111;
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0), 0 8px 32px rgba(255, 255, 255, 0.1);

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
      background-size: 200% 100%;
      animation: ${shimmer} 3s ease-in-out infinite;
    }

    &:hover {
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 0 40px rgba(255, 255, 255, 0.15), 0 12px 40px rgba(255, 255, 255, 0.1);
      color: #111111;
    }
  }

  &.secondary-cta {
    background: transparent;
    color: rgba(255, 255, 255, 0.8);
    border: 1.5px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(4px);

    &:hover {
      border-color: rgba(255, 255, 255, 0.5);
      color: white;
      background: rgba(255, 255, 255, 0.05);
      transform: translateY(-2px);
    }
  }

  @media (max-width: 768px) {
    padding: 14px 28px;
    font-size: 0.95rem;
  }
`;

export const TrustChips = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 48px;
  opacity: 0;
  transform: translateY(20px);
`;

export const TrustChip = styled.span`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 100px;
  padding: 6px 16px;
  font-size: 0.78rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;
  letter-spacing: 0.02em;

  &:hover {
    border-color: rgba(255, 255, 255, 0.25);
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.08);
  }
`;

/* ═══════════════════════════════════════════
   MARQUEE BANNER
   ═══════════════════════════════════════════ */

export const MarqueeBanner = styled.div`
  width: 100vw;
  overflow: hidden;
  background: #111111;
  padding: 14px 0;
  position: relative;
  z-index: 5;
`;

export const MarqueeTrack = styled.div`
  display: flex;
  width: fit-content;
  animation: ${marquee} 25s linear infinite;
  will-change: transform;

  &:hover {
    animation-play-state: paused;
  }
`;

export const MarqueeItem = styled.span`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  white-space: nowrap;
  padding: 0 40px;
  display: flex;
  align-items: center;
  gap: 40px;

  &::after {
    content: "·";
    font-size: 1rem;
    color: #CC5A50;
    opacity: 0.5;
  }
`;

/* ═══════════════════════════════════════════
   TEXT REVEAL SECTION
   ═══════════════════════════════════════════ */

export const TextRevealSection = styled.section`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 140px 2rem;
  background: #fff;
  position: relative;

  @media (max-width: 768px) {
    padding: 80px 20px;
  }
`;

export const TextRevealContent = styled.div`
  max-width: 900px;
  width: 100%;
`;

export const RevealText = styled.p`
  font-size: clamp(1.1rem, 2.2vw, 1.6rem);
  font-weight: 500;
  line-height: 1.65;
  color: #111;
  letter-spacing: -0.005em;

  .reveal-word {
    display: inline-block;
    color: rgba(17, 17, 17, 0.1);
    transition: color 0.3s ease;
    margin-right: 0.2em;

    &.active {
      color: #111;
    }
  }

  @media (max-width: 768px) {
    font-size: clamp(1rem, 4vw, 1.3rem);
  }
`;

/* ═══════════════════════════════════════════
   SECTION COMMONS
   ═══════════════════════════════════════════ */

export const Section = styled.section`
  width: 100%;
  position: relative;
  padding: ${({ $padding }) => $padding || "100px 24px"};
  background: ${({ $bg }) => $bg || "transparent"};
  overflow: hidden;

  @media (max-width: 768px) {
    padding: ${({ $mobilePadding }) => $mobilePadding || "60px 16px"};
  }
`;

export const SectionInner = styled.div`
  max-width: ${({ $maxWidth }) => $maxWidth || "1200px"};
  margin: 0 auto;
  position: relative;
`;

export const SectionEyebrow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(204, 90, 80, 0.05);
  border: 1.5px solid rgba(204, 90, 80, 0.12);
  border-radius: 100px;
  padding: 6px 16px;
  font-size: 0.73rem;
  font-weight: 600;
  color: #CC5A50;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 20px;
`;

export const SectionTitle = styled.h2`
  font-size: clamp(2rem, 3.5vw, 2.8rem);
  font-weight: 800;
  color: #111827;
  line-height: 1.15;
  letter-spacing: -0.025em;
  margin-bottom: 16px;

  .highlighted-word {
    color: #fff;
    position: relative;
    font-weight: 700;
    background: #111111;
    padding: 0.05em 0.2em;
    border-radius: 4px;
  }

  .highlighted-word-with-punctuation {
    display: inline-block;
    .highlighted-punctuation {
      color: #111827;
    }
  }

  @media (max-width: 768px) {
    font-size: clamp(1.6rem, 6vw, 2.2rem);
  }
`;

export const SectionText = styled.p`
  font-size: 1.1rem;
  line-height: 1.7;
  color: #6B7280;
  max-width: 700px;

  strong {
    color: #111111;
    font-weight: 600;
  }

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

/* ═══════════════════════════════════════════
   SERVICE CARDS (Horizontal Scroll)
   ═══════════════════════════════════════════ */

export const HorizontalScrollWrapper = styled.div`
  position: relative;
  overflow: hidden;
`;

export const HorizontalScrollTrack = styled.div`
  display: flex;
  gap: 24px;
  width: fit-content;
  padding: 40px 0;
  will-change: transform;
`;

export const ServiceCard = styled.div`
  width: 380px;
  min-width: 380px;
  background: white;
  border-radius: 20px;
  padding: 40px 32px;
  border: 1px solid #E5E7EB;
  position: relative;
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  cursor: default;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: #CC5A50;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
    border-color: rgba(204, 90, 80, 0.2);

    &::before {
      transform: scaleX(1);
    }
  }

  @media (max-width: 768px) {
    width: 320px;
    min-width: 320px;
    padding: 32px 24px;
  }
`;

export const ServiceIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 20px;
  color: #111111;
  transition: transform 0.3s ease;

  ${ServiceCard}:hover & {
    transform: scale(1.15);
    color: #CC5A50;
  }
`;

export const ServiceTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 12px;
`;

export const ServiceDescription = styled.p`
  font-size: 0.95rem;
  line-height: 1.6;
  color: #6B7280;
  flex: 1;
`;

export const ServiceBadge = styled.span`
  position: absolute;
  top: 16px;
  right: 16px;
  background: #111111;
  color: white;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 100px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

export const ServiceLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #F3F4F6;
`;

export const ServiceLink = styled.a`
  font-size: 0.85rem;
  color: #6B7280;
  font-weight: 500;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: all 0.2s ease;

  &:hover {
    color: #111111;
    border-bottom-color: #111111;
  }
`;

/* ═══════════════════════════════════════════
   BENCHMARK CARDS
   ═══════════════════════════════════════════ */

export const BenchmarkGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
`;

export const BenchmarkCard = styled.div`
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  padding: 28px 24px;
  transition: box-shadow 0.4s ease, border-color 0.4s ease;
  opacity: 0;
  transform: translateY(60px) scale(0.92);
  filter: blur(6px);

  &.visible {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0px);
  }

  &:hover {
    transform: translateY(-4px) scale(1);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06);
    border-color: #d1d5db;
  }
`;

export const BenchmarkValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #111111;
  line-height: 1;
  margin-bottom: 4px;
  font-variant-numeric: tabular-nums;
`;

export const BenchmarkBar = styled.div`
  height: 8px;
  width: 100%;
  background: #F1F5F9;
  border-radius: 100px;
  overflow: hidden;
  margin-top: 8px;

  .bar-fill {
    height: 100%;
    border-radius: 100px;
    width: 0%;
    transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
`;

/* ═══════════════════════════════════════════
   CASE STUDY CARDS
   ═══════════════════════════════════════════ */

export const CaseStudyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const CaseStudyCard = styled.div`
  background: #fafafa;
  border: 1.5px solid #e5e7eb;
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  opacity: 0;
  transform: translateY(60px) scale(0.95);

  &.visible {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  &:hover {
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
    transform: translateY(-6px) scale(1.01);
    border-color: rgba(0, 0, 0, 0.1);
  }

  .case-img {
    height: 220px;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 30%;
      transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
  }

  &:hover .case-img img {
    transform: scale(1.06);
  }

  .case-content {
    padding: 24px;
  }

  .case-category {
    font-size: 0.7rem;
    font-weight: 700;
    color: #71717A;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .case-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: #111827;
    margin: 8px 0;
  }

  .case-desc {
    font-size: 0.9rem;
    color: #6B7280;
    line-height: 1.6;
  }

  .case-stat {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    background: #F5F5F5;
    border: 1px solid #E4E4E7;
    border-radius: 10px;
    padding: 8px 14px;
    margin-top: 16px;
  }

  .case-stat-value {
    font-size: 1.4rem;
    font-weight: 900;
    color: #111111;
  }

  .case-stat-label {
    font-size: 0.8rem;
    color: #6B7280;
    font-weight: 500;
  }
`;

/* ═══════════════════════════════════════════
   FEATURED WORK CAROUSEL
   ═══════════════════════════════════════════ */

export const CarouselSection = styled.div`
  width: 100%;
  overflow: hidden;
  background: white;
  padding: 60px 0;
  border-top: 1px solid #E5E7EB;
  border-bottom: 1px solid #E5E7EB;
`;

export const CarouselTrack = styled.div`
  display: flex;
  gap: 16px;
  animation: ${marquee} 40s linear infinite;
  width: fit-content;
  will-change: transform;

  &:hover {
    animation-play-state: paused;
  }
`;

export const CarouselCard = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 32px;
  width: 280px;
  text-align: center;
  cursor: ${({ $hasLink }) => ($hasLink ? "pointer" : "default")};
  transition: all 0.3s ease;
  border-radius: 12px;

  &:hover {
    background: rgba(0, 0, 0, 0.02);
  }

  .carousel-logo {
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;

    img {
      max-width: 180px;
      max-height: 90px;
      object-fit: contain;
      filter: grayscale(20%);
      transition: filter 0.3s ease, transform 0.3s ease;
    }
  }

  &:hover .carousel-logo img {
    filter: grayscale(0%);
    transform: scale(1.04);
  }

  .carousel-title {
    font-size: 0.82rem;
    color: #6B7280;
    font-weight: 500;
  }
`;

/* ═══════════════════════════════════════════
   HOW IT WORKS (PLAN) SECTION
   ═══════════════════════════════════════════ */

export const PlanSection = styled.section`
  width: 100vw;
  position: relative;
  padding: 100px 24px;
  background: #0a0a0a;
  color: white;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 40% at 50% 100%, rgba(0, 0, 0, 0.05) 0%, transparent 50%);
    pointer-events: none;
  }

  @media (max-width: 768px) {
    padding: 60px 16px;
  }
`;

export const PlanSteps = styled.div`
  display: flex;
  gap: 32px;
  max-width: 1100px;
  margin: 48px auto 0;
  justify-content: center;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }
`;

export const PlanStep = styled.div`
  flex: 1;
  max-width: 340px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 36px 28px;
  text-align: center;
  backdrop-filter: blur(10px);
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  opacity: 0;
  transform: translateY(40px);
  position: relative;

  &.visible {
    opacity: 1;
    transform: translateY(0);
  }

  &:hover {
    transform: translateY(-8px);
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .step-number {
    font-size: 3rem;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.3);
    line-height: 1;
    margin-bottom: 16px;
    font-variant-numeric: tabular-nums;
  }

  .step-text {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.6;
  }

  /* Connector arrow */
  &:not(:last-child)::after {
    content: "→";
    position: absolute;
    right: -24px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1.2rem;
    color: rgba(255, 255, 255, 0.3);
    font-weight: bold;

    @media (max-width: 768px) {
      content: "↓";
      right: 50%;
      top: auto;
      bottom: -20px;
      transform: translateX(50%);
    }
  }

  @media (max-width: 768px) {
    max-width: 100%;
    width: 100%;
  }
`;

/* ═══════════════════════════════════════════
   TESTIMONIALS
   ═══════════════════════════════════════════ */

export const TestimonialsSection = styled.section`
  width: 100%;
  padding: 80px 0;
  background: #0a0a0a;
  position: relative;
  overflow: hidden;

  .reviews-header {
    text-align: center;
    margin-bottom: 48px;
    padding: 0 24px;
  }

  .reviews-eyebrow {
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.3);
    text-transform: uppercase;
    letter-spacing: 0.2em;
    margin-bottom: 16px;
  }

  .reviews-title {
    font-size: clamp(1.8rem, 3vw, 2.4rem);
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.03em;
    line-height: 1.2;
  }

  @media (max-width: 768px) {
    padding: 60px 0;
  }
`;

const reviewsScroll = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

export const ReviewsMarquee = styled.div`
  display: flex;
  gap: 24px;
  animation: ${reviewsScroll} ${({ $duration }) => $duration || "40s"} linear infinite;
  width: max-content;
  will-change: transform;

  &:hover {
    animation-play-state: paused;
  }
`;

export const TestimonialCardStyled = styled.div`
  background: rgba(255, 255, 255, 0.04);
  border-radius: 16px;
  padding: 32px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  width: 380px;
  min-width: 380px;
  flex-shrink: 0;
  cursor: default;

  &:hover {
    background: rgba(255, 255, 255, 0.07);
    border-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-4px);
  }

  .stars {
    display: flex;
    gap: 2px;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.85rem;
  }

  .quote {
    font-size: 0.9rem;
    line-height: 1.7;
    color: rgba(255, 255, 255, 0.6);
    flex: 1;
  }

  .author {
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 12px;
  }

  .author-company {
    font-weight: 700;
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.9rem;
  }

  .author-role {
    color: rgba(255, 255, 255, 0.35);
    font-size: 0.8rem;
    margin-top: 2px;
  }

  @media (max-width: 768px) {
    width: 300px;
    min-width: 300px;
    padding: 24px;
  }
`;

/* ═══════════════════════════════════════════
   CALCULATOR BANNER
   ═══════════════════════════════════════════ */

export const CalculatorBanner = styled.div`
  width: 100%;
  background: white;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  padding: ${({ $isMobile }) => ($isMobile ? "60px 20px" : "100px 24px")};
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 80% 60% at 50% 100%, rgba(0, 0, 0, 0.03) 0%, transparent 60%);
    pointer-events: none;
  }
`;

/* ═══════════════════════════════════════════
   SCROLL PROGRESS
   ═══════════════════════════════════════════ */

export const ScrollProgress = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 0%;
  height: 3px;
  background: #111111;
  z-index: 9999;
  transition: width 0.1s linear;
`;

/* ═══════════════════════════════════════════
   PARALLAX SHOWCASE SECTION
   ═══════════════════════════════════════════ */

export const ParallaxShowcase = styled.section`
  position: relative;
  width: 100vw;
  height: 80vh;
  min-height: 500px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  .parallax-bg {
    position: absolute;
    inset: -20%;
    width: 140%;
    height: 140%;
    background: linear-gradient(135deg, #0a0a0a 0%, #111111 40%, #0a0a0a 100%);
    will-change: transform;
    z-index: 0;

    &::after {
      content: "";
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 50% 50% at 30% 50%, rgba(255, 255, 255, 0.04) 0%, transparent 70%),
        radial-gradient(ellipse 40% 60% at 70% 60%, rgba(255, 255, 255, 0.03) 0%, transparent 60%);
    }
  }

  .parallax-content {
    position: relative;
    z-index: 2;
    text-align: center;
    max-width: 800px;
    padding: 0 24px;
  }

  .parallax-number {
    font-size: clamp(5rem, 12vw, 10rem);
    font-weight: 900;
    color: transparent;
    -webkit-text-stroke: 1.5px rgba(255, 255, 255, 0.2);
    line-height: 1;
    margin-bottom: 16px;
    letter-spacing: -0.05em;
    opacity: 0;
    transform: scale(0.8);
    transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);

    &.visible {
      opacity: 1;
      transform: scale(1);
    }
  }

  .parallax-stat-label {
    font-size: clamp(1.2rem, 2.5vw, 1.8rem);
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 12px;
    letter-spacing: -0.01em;
  }

  .parallax-stat-desc {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.45);
    max-width: 500px;
    margin: 0 auto;
    line-height: 1.7;
  }
`;

/* ═══════════════════════════════════════════
   3D TILT CARD WRAPPER
   ═══════════════════════════════════════════ */

export const TiltCard = styled.div`
  perspective: 1000px;
  width: 100%;

  .tilt-inner {
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    transform-style: preserve-3d;
    will-change: transform;
  }

  &:hover .tilt-inner {
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.12);
  }
`;

/* ═══════════════════════════════════════════
   ZOOM REVEAL SECTION
   ═══════════════════════════════════════════ */

export const ZoomRevealSection = styled.section`
  position: relative;
  width: 100%;
  overflow: hidden;
  background: #0a0a0a;
  padding: 0;

  .zoom-inner {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 100px 24px;
    transform-origin: center center;
    will-change: transform, border-radius;

    @media (max-width: 768px) {
      padding: 60px 16px;
      min-height: auto;
    }
  }

  .zoom-title {
    font-size: clamp(2.2rem, 5vw, 4rem);
    font-weight: 800;
    color: white;
    text-align: center;
    letter-spacing: -0.03em;
    line-height: 1.1;
    max-width: 900px;
    margin-bottom: 24px;

    span {
      background: linear-gradient(135deg, #ffffff, rgba(255,255,255,0.6));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  .zoom-subtitle {
    font-size: 1.15rem;
    color: rgba(255, 255, 255, 0.5);
    text-align: center;
    max-width: 600px;
    line-height: 1.7;
    margin-bottom: 48px;
  }

  .zoom-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2px;
    max-width: 1000px;
    width: 100%;
    border-radius: 20px;
    overflow: hidden;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  .zoom-card {
    background: rgba(255, 255, 255, 0.03);
    padding: 40px 28px;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.06);
    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 50% 120%, rgba(255, 255, 255, 0.06) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.5s ease;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.06);
      transform: translateY(-4px);

      &::before {
        opacity: 1;
      }
    }

    .zoom-card-value {
      font-size: 2.5rem;
      font-weight: 900;
      color: #ffffff;
      margin-bottom: 8px;
      font-variant-numeric: tabular-nums;
    }

    .zoom-card-label {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.6);
      font-weight: 500;
    }
  }
`;

/* ═══════════════════════════════════════════
   FLOATING GRID BACKGROUND
   ═══════════════════════════════════════════ */

export const GridBackground = styled.div`
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent);
  z-index: 0;
  pointer-events: none;
`;

/* ═══════════════════════════════════════════
   STICKY METRICS (full-viewport scroll counter)
   ═══════════════════════════════════════════ */

export const StickyMetricsWrapper = styled.div`
  position: relative;
  width: 100vw;
  align-self: stretch;
`;

export const StickyMetricsViewport = styled.div`
  position: sticky;
  top: 0;
  height: 100vh;
  width: 100%;
  background: #0a0a0a;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,255,255,0.02) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  .sticky-metrics-eyebrow {
    position: absolute;
    top: 48px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.2);
    text-transform: uppercase;
    letter-spacing: 0.25em;
    z-index: 5;
    white-space: nowrap;

    @media (max-width: 768px) {
      top: 32px;
      font-size: 0.65rem;
    }
  }
`;

export const StickyMetricsProgress = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: #fff;
  transition: width 0.1s linear;
  z-index: 10;
`;

export const StickyMetricSlide = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transform: scale(0.85);
  filter: blur(10px);
  z-index: 2;
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              filter 0.6s cubic-bezier(0.16, 1, 0.3, 1);

  &.active {
    opacity: 1;
    pointer-events: auto;
    transform: scale(1);
    filter: blur(0px);
  }

  .metric-counter {
    font-size: clamp(5rem, 14vw, 12rem);
    font-weight: 900;
    color: #ffffff;
    line-height: 1;
    letter-spacing: -0.04em;
    font-variant-numeric: tabular-nums;
    position: relative;
    display: flex;
    align-items: baseline;
    gap: 0.05em;
  }

  .metric-unit {
    font-size: clamp(1.5rem, 4vw, 3.5rem);
    font-weight: 500;
    color: rgba(255, 255, 255, 0.35);
    letter-spacing: -0.02em;
  }

  .metric-label {
    font-size: clamp(0.75rem, 1.2vw, 0.9rem);
    font-weight: 600;
    color: rgba(255, 255, 255, 0.55);
    text-transform: uppercase;
    letter-spacing: 0.2em;
    margin-top: 20px;
  }

  .metric-desc {
    font-size: clamp(0.8rem, 1vw, 0.95rem);
    color: rgba(255, 255, 255, 0.35);
    margin-top: 12px;
    max-width: 500px;
    text-align: center;
    line-height: 1.5;

    @media (max-width: 768px) {
      padding: 0 24px;
    }
  }
`;

export const StickyMetricDots = styled.div`
  position: absolute;
  right: 32px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 10;

  @media (max-width: 768px) {
    right: 16px;
    gap: 10px;
  }
`;

export const StickyMetricDot = styled.div`
  width: 6px;
  height: ${({ $active }) => ($active ? "32px" : "6px")};
  border-radius: 100px;
  background: ${({ $active }) => ($active ? "#ffffff" : "rgba(255,255,255,0.2)")};
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
`;

/* ═══════════════════════════════════════════
   LEGACY EXPORTS (needed by other components)
   ═══════════════════════════════════════════ */

export const GradientOverlay = styled.div``;
export const Highlight = styled.span`
  color: #111111;
  font-weight: 600;
`;
export const FloatingBlob = styled.div``;
export const Glow = styled.div``;
export const ImageContainer = styled.div``;
