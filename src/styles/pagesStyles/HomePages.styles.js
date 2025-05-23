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
  padding: 40px 20px;
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
    
    .animated {
      white-space: normal;
      border-right: none;
    }
    
    .highlighted-word {
      display: inline;
    }
  }
  @media (max-width: 610px) {
    font-size: 1.2rem;
  }
`;

export const Subtitle = styled.h2`
  color: #333333;
  mix-blend-mode: normal;
  z-index: 1;
  position: relative;
  font-size: 1.3rem;
  font-weight: 500;
  margin-bottom: 30px;
  max-width: 800px;
  line-height: 1.6;
  display: inline-block;
  padding: 20px;
  cursor: default;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
    padding: 10px;
  }
`;

export const Section = styled.section`
  max-width: 1200px;
  margin: 80px auto;
  text-align: left;
  animation: ${fadeIn} 0.6s ease;
  position: relative;
  width: 100%;
  
  &.process-section {
    background: #fff;
    border-radius: 16px;
    padding: 5rem 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    margin: 6rem auto;
  }
  
  @media (max-width: 768px) {
    margin: 60px auto;
    
    &.process-section {
      padding: 3rem 1.5rem;
      margin: 4rem auto;
    }
  }
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
    font-size: 1.8rem;
    flex-wrap: wrap;
    
    .highlighted-word {
      display: inline;
    }
  }
`;

export const SectionText = styled.p`
  font-size: 1.2rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.textMuted};
  position: relative;
  z-index: 1;
  font-weight: 500;

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
    font-size: 1.1rem;
  }
`;

export const CTAButton = styled.a`
  background-color: ${({ theme }) => theme.colors.accent};
  color: white;
  padding: 16px 36px;
  font-weight: bold;
  font-size: 1.1rem;
  border-radius: ${({ theme }) => theme.borderRadius || '8px'};
  text-decoration: none;
  margin-top: 25px;
  display: inline-block;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  z-index: 1;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(249, 123, 114, 0.3);
  
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, ${({ theme }) => theme.colors.accent}, ${({ theme }) => theme.colors.accentDark});
    z-index: -1;
    transition: all 0.4s ease;
  }
  
  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: ${({ theme }) => theme.colors.accentDark};
    z-index: 2;
    transform: scaleX(0);
    transform-origin: right;
    transition: transform 0.4s ease;
  }

  &:hover {
    transform: translateY(-5px);
    color: white;
    box-shadow: 0 10px 25px rgba(249, 123, 114, 0.4);
    
    &::after {
      transform: scaleX(1);
      transform-origin: left;
    }
  }
  
  &.primary-cta {
    padding: 18px 40px;
    font-weight: 700;
    font-size: 1.2rem;
    letter-spacing: 0.5px;
    animation: ${pulse} 3s infinite;
  }
  
  &.secondary-cta {
    background-color: transparent;
    color: ${({ theme }) => theme.colors.accent};
    border: 2px solid ${({ theme }) => theme.colors.accent};
    box-shadow: none;
    
    &::before {
      background: transparent;
    }
    
    &:hover {
      background-color: ${({ theme }) => theme.colors.accent}11;
      color: ${({ theme }) => theme.colors.accent};
      box-shadow: 0 5px 15px rgba(249, 123, 114, 0.15);
    }
  }
  
  @media (max-width: 768px) {
    padding: 14px 30px;
    font-size: 1rem;
    
    &.primary-cta {
      padding: 16px 36px;
      font-size: 1.1rem;
    }
  }
`;

export const InteractiveCircleContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 1200px;
  padding: 3rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rem;
  margin: 4rem 0;
  
  ${SectionTitle} {
    @media (max-width: 768px) {
      word-break: normal;
      word-wrap: break-word;
      hyphens: auto;
      padding-right: 0.5rem;
    }
  }
  
  @media (max-width: 768px) {
    padding: 2rem 1rem;
    gap: 3rem;
    margin: 3rem 0;
  }
`;

export const PlanSteps = styled.ul`
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

export const PlanSection = styled.section`
  max-width: 800px;
  margin: 60px auto;
  text-align: left;
  position: relative;
  padding: 20px;
  
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
  
  @media (max-width: 768px) {
    margin: 40px auto;
    padding: 10px;
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
    content: '';
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
