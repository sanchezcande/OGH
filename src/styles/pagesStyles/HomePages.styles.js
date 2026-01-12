// Este archivo reemplaza el anterior HomePage.styles.js con mejoras visuales fuertes
import styled, { keyframes } from "styled-components";

// Animaciones
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
`;

const glow = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(249, 123, 114, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(249, 123, 114, 0); }
  100% { box-shadow: 0 0 0 0 rgba(249, 123, 114, 0); }
`;

const floatingg = keyframes`
  0% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-48%, -52%) scale(1.05); }
  100% { transform: translate(-50%, -50%) scale(1); }
`;

const glowAnimation = keyframes`
  0% { text-shadow: 0 0 10px ${({ theme }) => theme.colors.accent}33; }
  50% { text-shadow: 0 0 20px ${({ theme }) => theme.colors.accent}66; }
  100% { text-shadow: 0 0 10px ${({ theme }) => theme.colors.accent}33; }
`;

const gradientText = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const slideIn = keyframes`
  0% {
    transform: translateX(-20px);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
`;

const accentLine = keyframes`
  0% {
    width: 0;
    opacity: 0;
  }
  100% {
    width: 30px;
    opacity: 1;
  }
`;

const growLine = keyframes`
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
`;

// Enhanced button hover animation
const buttonHover = keyframes`
  0% { transform: translateY(0); box-shadow: 0 4px 20px rgba(249, 123, 114, 0.3); }
  50% { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(249, 123, 114, 0.4); }
  100% { transform: translateY(0); box-shadow: 0 4px 20px rgba(249, 123, 114, 0.3); }
`;

export const Container = styled.div`
  position: relative;
  background: radial-gradient(
    circle at 50% 50%,
    ${({ theme }) => theme.colors.backgroundAlt}22,
    ${({ theme }) => theme.colors.background} 70%
  );
  overflow: hidden;
  padding: 40px 0px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: ${fadeIn} 0.8s ease;
  overflow: hidden;
  z-index: 0;

  /* Adding more whitespace between sections */
  & > * {
    margin-bottom: 1rem;
  }

  & .full-width {
    width: 100%;
    max-width: 1400px;
    padding: 2rem 1rem;
  }
`;

export const Hero = styled.div`
  position: relative;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-right: calc(-50vw + 50%);
  padding: 60px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  overflow: hidden;
  margin-bottom: 4rem;
  background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%);
  color: white;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
    opacity: 0.3;
    z-index: 1;
  }

  & > * {
    position: relative;
    z-index: 2;
  }

  @media (max-width: 768px) {
    width: 100vw;
    margin-left: calc(-50vw + 50%);
    margin-right: calc(-50vw + 50%);
    padding: 50px 15px;
    margin-bottom: 3rem;
  }

  @media (max-width: 480px) {
    width: 100vw;
    margin-left: calc(-50vw + 50%);
    margin-right: calc(-50vw + 50%);
    padding: 40px 10px;
    margin-bottom: 2rem;
  }
`;

export const GradientOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    145deg,
    ${({ theme }) => theme.colors.backgroundAlt},
    transparent
  );
  z-index: -2;
`;

export const Glow = styled.div`
  width: 300px;
  height: 300px;
  background: ${({ theme }) => theme.colors.accent}44;
  border-radius: 50%;
  position: absolute;
  top: -100px;
  right: -100px;
  z-index: -1;
  filter: blur(120px);
  animation: ${glow} 6s ease-in-out infinite;

  &::after {
    content: "";
    position: absolute;
    width: 200px;
    height: 200px;
    background: ${({ theme }) => theme.colors.accent}33;
    border-radius: 50%;
    bottom: -100px;
    left: -150px;
    filter: blur(80px);
    animation: ${glow} 8s ease-in-out infinite reverse;
  }
`;

export const FloatingBlob = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1000px;
  height: 1000px;
  background: radial-gradient(
    circle,
    ${({ theme }) => theme.colors.accent},
    transparent 70%
  );
  opacity: 0.35;
  filter: blur(200px);
  border-radius: 50%;
  animation: ${floatingg} 20s ease-in-out infinite;
  transform: translate(-50%, -50%);
  z-index: -5; /* MÁS AL FONDO QUE TODO */
`;

export const Title = styled.h1`
  color: white;
  mix-blend-mode: normal;
  z-index: 1;
  position: relative;
  font-size: clamp(2.5rem, 5vw, 3rem);
  font-weight: 700;
  margin: 20px 0 10px 0;
  text-align: center;
  overflow: hidden;

  .animated {
    display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    border-right: 2px solid ${({ theme }) => theme.colors.accent};
    animation:
      typing 3s steps(30, end) forwards,
      blink-caret 0.7s step-end infinite;
  }

  .highlighted-word {
    color: ${({ theme }) => theme.colors.accent};
    font-weight: 700;
    position: relative;
    display: inline-block;

    &::after {
      content: "";
      position: absolute;
      width: 100%;
      height: 0.15em;
      bottom: 0.05em;
      left: 0;
      background-color: ${({ theme }) => theme.colors.accent}44;
      z-index: -1;
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.6s ease;
    }

    &:hover::after {
      transform: scaleX(1);
    }
  }

  @keyframes typing {
    from {
      width: 0;
    }
    to {
      width: 100%;
    }
  }

  @keyframes blink-caret {
    0%,
    100% {
      border-color: transparent;
    }
    50% {
      border-color: ${({ theme }) => theme.colors.accent};
    }
  }

  /* Desktop and mobile visibility classes */
  .desktop-only {
    display: inline-block;
  }

  .mobile-only {
    display: none;
  }

  @media (max-width: 900px) {
    font-size: 3rem;
  }

  @media (max-width: 768px) {
    font-size: 2.5rem;

    .desktop-only {
      display: none;
    }

    .mobile-only {
      display: inline-block;
    }

    .animated {
      white-space: normal;
      border-right: none;
    }

    .highlighted-word {
      display: inline;
    }
  }

  @media (max-width: 610px) {
    font-size: 2rem;
  }
`;

export const Subtitle = styled.h2`
  color: rgba(255, 255, 255, 0.9);
  mix-blend-mode: normal;
  z-index: 1;
  position: relative;
  font-size: 1.2rem;
  font-weight: 400;
  margin-bottom: 30px;
  max-width: 800px;
  line-height: 1.6;
  display: inline-block;
  padding: 20px;
  cursor: default;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    font-size: 1.2rem;
    padding: 10px;
    line-height: 1.5;
  }
`;

export const Section = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  position: relative;
  z-index: 1;

  &.full-width {
    max-width: 100%;
    width: 100%;
    padding: 4rem 2rem;
    background: ${({ theme }) => `${theme.colors.backgroundAlt}11`};
  }

  &.serious-block {
    max-width: 1200px;
    margin: 0 auto;
    background: none;
    text-align: left;
    padding: 2.5rem 2rem 2rem 2rem;
    box-shadow: none;
  }

  @media (max-width: 768px) {
    padding: 0 &.full-width {
      padding: 0;
    }
    &.serious-block {
      padding: 1.5rem 0.5rem 1rem 0.5rem;
    }
  }
`;

export const SectionTitle = styled.h3`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
  color: ${({ theme }) => theme.colors.primary};
  display: inline-flex;
  align-items: center;
  gap: 15px;
  animation: ${slideIn} 0.5s ease forwards;
  animation-delay: calc(0.2s * var(--i, 0));
  opacity: 0;
  transition: transform 0.3s ease;

  &::before {
    content: "";
    width: 0;
    height: 3px;
    background: ${({ theme }) => theme.colors.accent};
    animation: ${accentLine} 0.5s ease forwards;
    animation-delay: calc(0.2s * var(--i, 0) + 0.3s);
  }

  &:hover {
    transform: translateX(10px);
  }

  &:hover::before {
    background: ${({ theme }) => theme.colors.accentDark};
  }

  .highlighted-word {
    color: ${({ theme }) => theme.colors.accent};
    font-weight: 800;
    position: relative;
    display: inline-block;

    &::after {
      content: "";
      position: absolute;
      width: 100%;
      height: 0.15em;
      bottom: 0.05em;
      left: 0;
      background-color: ${({ theme }) => theme.colors.accent}44;
      z-index: -1;
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.6s ease;
    }

    &:hover::after {
      transform: scaleX(1);
    }
  }

  @media (max-width: 768px) {
    font-size: 1.5rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;

    .highlighted-word {
      display: inline;
    }
  }
`;

export const SectionText = styled.p`
  font-size: 1.1rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.textMuted};
  position: relative;
  z-index: 1;
  font-weight: 400;

  strong {
    color: ${({ theme }) => theme.colors.accent};
    font-weight: 600;
  }

  em {
    color: ${({ theme }) => theme.colors.primary};
    font-style: normal;
    font-weight: 500;
  }

  @media (max-width: 768px) {
    font-size: 1rem;
    line-height: 1.5;
  }
`;

export const CTAButton = styled.a`
  background: #d85a4f;
  color: white;
  padding: 12px 24px;
  font-weight: 600;
  font-size: 1rem;
  border-radius: 8px;
  text-decoration: none;
  margin-top: 30px;
  display: inline-block;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  z-index: 1;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(249, 123, 114, 0.3);

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.2) 50%,
      transparent 100%
    );
    z-index: 1;
    transition: left 0.5s ease;
  }

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: white;
    transform: scaleX(0);
    transform-origin: right;
    transition: transform 0.3s ease;
  }

  &:hover {
    transform: translateY(-2px);
    color: white;
    box-shadow: 0 6px 20px rgba(249, 123, 114, 0.4);
    background: #d88a82;

    &::before {
      left: 100%;
    }

    &::after {
      transform: scaleX(1);
      transform-origin: left;
    }
  }

  &:active {
    transform: translateY(0);
  }

  &.primary-cta {
    padding: 14px 28px;
    font-weight: 600;
    font-size: 1rem;
    background: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 6px 16px rgba(249, 123, 114, 0.4);

    &:hover {
      background: ${({ theme }) => theme.colors.accentDark};
      box-shadow: 0 8px 24px rgba(249, 123, 114, 0.5);
    }
  }

  &.secondary-cta {
    background: transparent;
    color: ${({ theme }) => theme.colors.accent};
    border: 2px solid ${({ theme }) => theme.colors.accent};
    box-shadow: none;
    position: relative;

    &::before {
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(249, 123, 114, 0.1) 50%,
        transparent 100%
      );
    }

    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background: ${({ theme }) => theme.colors.accent};
      transform: scaleX(0);
      transform-origin: right;
      transition: transform 0.3s ease;
    }

    &:hover {
      background-color: ${({ theme }) => theme.colors.accent}11;
      color: ${({ theme }) => theme.colors.accent};
      box-shadow: 0 4px 12px rgba(249, 123, 114, 0.2);

      &::after {
        transform: scaleX(1);
        transform-origin: left;
      }
    }
  }

  @media (max-width: 768px) {
    padding: 12px 24px;
    font-size: 0.95rem;

    &.primary-cta {
      padding: 14px 28px;
      font-size: 1rem;
    }
  }
`;

export const PlanSteps = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;

  li {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 2rem 1.5rem;
    min-width: 280px;
    max-width: 320px;
    text-align: center;
    position: relative;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
    opacity: 0;
    transform: translateY(20px);
    animation: fadeInUp 0.6s ease forwards;
    animation-delay: calc(0.2s * var(--i, 0));

    &:hover {
      transform: translateY(-8px);
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
    }

    strong {
      display: block;
      font-size: 2rem;
      font-weight: 800;
      color: #f97b72;
      margin-bottom: 1rem;
    }

    /* Flecha entre tarjetas */
    &:not(:last-child)::after {
      content: "→";
      position: absolute;
      right: -1.5rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1.5rem;
      color: #f97b72;
      font-weight: bold;
      z-index: 3;
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;

    li {
      min-width: 280px;
      max-width: 320px;

      &:not(:last-child)::after {
        content: "↓";
        right: 50%;
        top: auto;
        bottom: -1.5rem;
        transform: translateX(50%);
      }
    }
  }
`;

export const PlanSection = styled.section`
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin: 60px 0 0 0;
  text-align: center;
  position: relative;
  padding: 60px 20px;
  background: linear-gradient(135deg, #5a6c7d 0%, #3d4a5a 100%);
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border-radius: 20px 20px 0 0;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
    opacity: 0.3;
    z-index: 1;
  }

  & > * {
    position: relative;
    z-index: 2;
  }

  .highlighted-word {
    color: #f97b72;
    font-weight: 800;
  }

  ${SectionTitle} {
    mix-blend-mode: normal;
    color: white;
    margin-bottom: 3rem;

    &::before {
      background: #f97b72;
    }
  }

  ${SectionText} {
    mix-blend-mode: normal;
    color: rgba(255, 255, 255, 0.9);
  }

  @media (max-width: 768px) {
    padding: 40px 15px;
  }
`;

export const ImageContainer = styled.div`
  width: 100%;
  max-width: 500px;
  margin: 20px auto;
  position: relative;
  z-index: 0;
`;

export const Highlight = styled.span`
  color: ${({ theme }) => theme.colors.accent};
  position: relative;

  &::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 0.3em;
    background-color: ${({ theme }) => theme.colors.accent}22;
    z-index: -1;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.6s ease;
  }

  &:hover::after {
    transform: scaleX(1);
  }
`;
