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

export const Container = styled.div`
  position: relative;
  background: radial-gradient(
    circle at 50% 50%,
    ${({ theme }) => theme.colors.backgroundAlt}22,
    ${({ theme }) => theme.colors.background} 70%
  );
  overflow: hidden;
  padding: 40px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: ${fadeIn} 0.8s ease;
  overflow: hidden;
  z-index: 0;
`;

export const Hero = styled.div`
  position: relative;
  width: 100%;
  max-width: 1200px;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  overflow: hidden;
  background: ${({ theme }) => `linear-gradient(145deg, ${theme.colors.backgroundAlt}cc, ${theme.colors.background}dd)`};
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid ${({ theme }) => theme.colors.accent}33;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
`;

export const GradientOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, ${({ theme }) => theme.colors.backgroundAlt}, transparent);
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
`;

export const FloatingBlob = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1000px;
  height: 1000px;
  background: radial-gradient(circle, ${({ theme }) => theme.colors.accent}, transparent 70%);
  opacity: 0.35;
  filter: blur(200px);
  border-radius: 50%;
  animation: ${floatingg} 20s ease-in-out infinite;
  transform: translate(-50%, -50%);
  z-index: -5; /* MÁS AL FONDO QUE TODO */
`;

export const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text};
  mix-blend-mode: normal;
  z-index: 1;
  position: relative;
  font-size: clamp(2rem, 6vw, 3rem);
  font-weight: 700;
  margin: 20px 0 10px 0;
  text-align: center;
  overflow: hidden;

  .animated {
    display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    border-right: 2px solid ${({ theme }) => theme.colors.accent};
    animation: typing 3s steps(30, end) forwards, blink-caret 0.7s step-end infinite;
  }

  .highlighted-word {
    color: ${({ theme }) => theme.colors.accent};
    font-weight: 700;
  }

  @keyframes typing {
    from { width: 0; }
    to { width: 100%; }
  }

  @keyframes blink-caret {
    0%, 100% { border-color: transparent; }
    50% { border-color: ${({ theme }) => theme.colors.accent}; }
  }

  @media (max-width: 900px) {
    font-size: 2.5rem;
  }

  @media (max-width: 768px) {
    font-size: 2rem;
  }
  @media (max-width: 610px) {
    font-size: 1.2rem;
  }
`;

export const Subtitle = styled.h2`
  color: ${({ theme }) => theme.colors.text};
  mix-blend-mode: normal;
  z-index: 1;
  position: relative;
  font-size: 1.3rem;
  font-weight: 400;
  margin-bottom: 30px;
  max-width: 800px;
  line-height: 1.6;
  display: inline-block;
  padding: 20px;
  cursor: default;
`;

export const Section = styled.section`
  max-width: 800px;
  margin: 40px auto;
  text-align: left;
  animation: ${fadeIn} 0.6s ease;
  position: relative;
`;

export const SectionTitle = styled.h3`
  font-size: 2.2rem;
  font-weight: 800;
  margin-bottom: 25px;
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
    content: '';
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
  }
`;

export const SectionText = styled.p`
  font-size: 1.2rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text};
  position: relative;
  z-index: 1;
  mix-blend-mode: difference;

  strong {
    color: ${({ theme }) => theme.colors.accent};
    font-weight: 600;
    mix-blend-mode: difference;
  }

  em {
    color: ${({ theme }) => theme.colors.primary};
    font-style: normal;
    font-weight: 500;
    mix-blend-mode: difference;
  }
`;

export const CTAButton = styled.a`
  background-color: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.background};
  padding: 12px 24px;
  font-weight: bold;
  border-radius: ${({ theme }) => theme.borderRadius};
  text-decoration: none;
  margin-top: 25px;
  display: inline-block;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  animation: ${pulse} 3s infinite;

  &:hover {
    transform: scale(1.1);
    color: ${({ theme }) => theme.colors.background};
    background-color: ${({ theme }) => theme.colors.accentDark};
    box-shadow: 0 6px 20px rgba(249, 123, 114, 0.4);
  }
`;

export const PlanSteps = styled.ol`
  list-style: none;
  padding: 0;
  margin: 2rem auto;
  max-width: 600px;
  position: relative;
  padding-left: 2rem;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 3px;
    background: ${({ theme }) => theme.colors.accent}66;
    transform-origin: top;
    transform: scaleY(0);
    animation: none;
  }

  &.in-view::before {
    animation: ${growLine} 1.5s ease forwards;
  }

  li {
    font-size: 1.1rem;
    line-height: 1.8;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: start;
    gap: 0.75rem;
    opacity: 0;
    transform: translateX(-30px);
    transition: opacity 0.6s ease, transform 0.6s ease;
    transition-delay: calc(0.5s + (0.3s * var(--i, 0)));
    position: relative;
    z-index: 1;

    strong {
      color: ${({ theme }) => theme.colors.accent};
      min-width: 1.5rem;
    }
  }

  &.in-view li {
    opacity: 1;
    transform: translateX(0);
  }
`;

export const PlanSection = styled(Section)`
  .highlighted-word {
    color: ${({ theme }) => theme.colors.accent};
    font-weight: 800;
  }

  ${SectionTitle} {
    mix-blend-mode: normal;
    color: ${({ theme }) => theme.colors.text};
  }

  ${SectionText} {
    mix-blend-mode: normal;
    color: ${({ theme }) => theme.colors.text};
  }
`;

export const InteractiveCircleContainer = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: visible;
  cursor: default;
`;
