import styled, { keyframes } from "styled-components";

// Animaciones
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const glow = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
`;

const typewriter = keyframes`
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
`;

const cursorBlink = keyframes`
  0% { border-color: transparent; }
  50% { border-color: ${({ theme }) => theme.colors.text}; }
  100% { border-color: transparent; }
`;

// Container principal
export const Container = styled.div`
  padding: 40px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: ${fadeIn} 0.8s ease;
`;

// Hero: título principal
export const Title = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  margin: 20px 0 10px 0;
  text-align: center;
  color: ${({ theme }) => theme.colors.text};
  overflow: hidden;

  .animated {
    display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    border-right: 2px solid ${({ theme }) => theme.colors.accent}; /* 👈 palito */
    animation:
      typing 3s steps(30, end) forwards,
      blink-caret 0.7s step-end infinite;
  }

  .highlighted-word {
    color: ${({ theme }) => theme.colors.accent};
    font-weight: 700;
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
    0%, 100% {
      border-color: transparent;
    }
    50% {
      border-color: ${({ theme }) => theme.colors.accent};
    }
  }

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;



// Subtítulo debajo del hero
export const Subtitle = styled.h2`
  color: ${({ theme }) => theme.colors.text};
  font-size: 1.3rem;
  font-weight: 400;
  margin-bottom: 30px;
  max-width: 800px;
  line-height: 1.6;
`;

// Sección de texto general
export const Section = styled.section`
  max-width: 800px;
  margin: 40px 0;
  text-align: left;
  animation: ${fadeIn} 0.6s ease;
`;

// Título de cada sección
export const SectionTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 10px;
  color: ${({ theme }) => theme.colors.primary};
`;

// Párrafo dentro de cada sección
export const SectionText = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text};
`;

// CTA principal
export const CTAButton = styled.a`
  background-color: ${({ theme }) => theme.colors.accent};
  color: white;
  padding: 12px 24px;
  font-weight: bold;
  border-radius: ${({ theme }) => theme.borderRadius};
  text-decoration: none;
  margin-top: 25px;
  display: inline-block;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 4px 12px rgba(249, 123, 114, 0.2);

  &:hover {
    transform: scale(1.1);
    background-color: ${({ theme }) => theme.colors.accentDark};
    box-shadow: 0 6px 20px rgba(249, 123, 114, 0.4);
    color:white;
  }
`;

// Imagen animada (ej. Lottie)
export const ImageContainer = styled.div`
  width: 100%;
  max-width: 700px;
  margin-bottom: 20px;
  animation: ${fadeIn} 0.8s ease;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

// Componente de glow decorativo (opcional)
export const Glow = styled.div`
  width: 300px;
  height: 300px;
  background: ${({ theme }) => theme.colors.accent}44;
  border-radius: 50%;
  position: absolute;
  top: -100px;
  right: -100px;
  z-index: -1;
  filter: blur(100px);
  animation: ${glow} 6s ease-in-out infinite;
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

export const Highlight = styled.span`
  color: ${({ theme }) => theme.colors.accent};
  font-weight: bold;
`;

export const PlanSteps = styled.ol`
  list-style: none;
  padding: 0;
  margin-top: 1rem;

  li {
    font-size: 1rem;
    line-height: 1.8;
    margin-bottom: 1rem;
    display: flex;
    gap: 0.5rem;

    strong {
      color: ${({ theme }) => theme.colors.primary};
      min-width: 1.5rem;
    }
  }
`;
