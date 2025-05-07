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

export const Container = styled.div`
position: relative;
background-color: black;
overflow: hidden;
  padding: 40px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: ${fadeIn} 0.8s ease;
  // background: radial-gradient(circle at 30% 30%, ${({ theme }) => theme.colors.backgroundAlt}, ${({ theme }) => theme.colors.background});

  overflow: hidden;
  z-index:0;
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
color: white;
mix-blend-mode: difference;
z-index: 1;
position: relative;
  font-size: clamp(2rem, 6vw, 3rem);
  font-weight: 700;
  margin: 20px 0 10px 0;
  text-align: center;
  // color: ${({ theme }) => theme.colors.text};
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
color: white;
mix-blend-mode: difference;
z-index: 1;
position: relative;
  // color: ${({ theme }) => theme.colors.text};
  font-size: 1.3rem;
  font-weight: 400;
  margin-bottom: 30px;
  max-width: 800px;
  line-height: 1.6;
`;

export const Section = styled.section`
  max-width: 800px;
  margin: 40px 0;
  text-align: left;
  animation: ${fadeIn} 0.6s ease;
`;

export const SectionTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 10px;
  color: ${({ theme }) => theme.colors.primary};
`;

export const SectionText = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text};
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
  margin-top: 1rem;
  border-left: 3px solid ${({ theme }) => theme.colors.accent}66;
  padding-left: 1rem;

  li {
    font-size: 1rem;
    line-height: 1.8;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: start;
    gap: 0.75rem;
    opacity: 0;
    animation: ${slideInLeft} 0.6s ease forwards;
    animation-delay: calc(0.2s * var(--i));

    strong {
      color: ${({ theme }) => theme.colors.primary};
      min-width: 1.5rem;
    }
  }
`;
