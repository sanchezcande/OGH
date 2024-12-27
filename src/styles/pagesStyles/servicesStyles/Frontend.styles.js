import styled from "styled-components";

const fadeInUp = `
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
`;

export const ServiceContainer = styled.section`
  background: linear-gradient(145deg, #101b42, #0b2343);
  color: ${({ textColor }) => textColor || "#ffffff"};
  padding: 3rem 2rem;
  margin: 2rem auto;
  max-width: 1200px;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;

  &::before {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(0, 212, 255, 0.2), transparent);
    z-index: 0;
  }

  &:hover {
    box-shadow: 0 10px 20px rgba(0, 212, 255, 0.5);
  }
`;

export const ServiceTitle = styled.h2`
  font-size: 2.8rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  text-align: center;
  color: white;
  text-transform: uppercase;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.3s ease, transform 0.3s ease;

  &.visible {
    opacity: 1;
    transform: translateY(0);
    animation: fadeInUp 0.5s ease forwards;
  }
  ${fadeInUp}

  
`;
export const ServiceList = styled.ul`
  list-style: none;
  margin-left: 0;
  padding-left: 0;

  li {
    font-size: 1.2rem;
    line-height: 1.8;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    position: relative;
    padding-left: 1rem;
    background: linear-gradient(90deg, rgba(0, 212, 255, 0.1), transparent);
    border-left: 4px solid #00d4ff;
    border-radius: 4px;
    overflow: hidden;

    /* Transiciones iniciales */
    transition: transform 0.3s ease, background 0.3s ease, border-left-color 0.3s ease, opacity 0.3s ease;

    /* Animación inicial reemplazada por transiciones */
    opacity: 0;
    transform: translateY(20px);

    /* Clase visible para animar aparición */
    &.visible {
      opacity: 1;
      transform: translateY(0);
    }

    &::before {
      content: "✨";
      font-size: 1.5rem;
      margin-right: 0.5rem;
      color: #00d4ff;
      animation: iconPulse 1.5s infinite ease-in-out;
    }

    /* Efecto hover */
    &:hover {
      background: rgba(0, 212, 255, 0.2);
      border-left-color: #00ffff;
      transform: scale(1.02);
    }
  }

  /* Keyframes para icono pulsante */
  @keyframes iconPulse {
    0%, 100% {
      transform: scale(1);
      color: #00d4ff;
    }
    50% {
      transform: scale(1.3);
      color: #00ffff;
    }
  }
`;


export const Description = styled.p`
  font-size: 1.3rem;
  line-height: 2;
  margin-bottom: 2rem;
  text-align: center;
  color: #cce7ff;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.3s ease, transform 0.3s ease;

  &.visible {
    opacity: 1;
    transform: translateY(0);
    animation: fadeInUp 0.5s ease forwards;
  }
`;
export const HighlightText = styled.div`
  text-align: center;
  margin: 3rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  border: 2px dashed #00d4ff;
  padding: 1.2rem;
  border-radius: 12px;
  background: rgba(0, 212, 255, 0.05);
  box-shadow: 0 4px 10px rgba(0, 212, 255, 0.3);
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.3s ease, transform 0.3s ease;

  &.visible {
    opacity: 1;
    transform: translateY(0);
  }

  span {
    display: inline-block; 
    transition: transform 0.3s ease, color 0.3s ease;
  }

  span:hover {
    transform: scale(1.03);

  }
`;


export const Divider = styled.hr`
  border: none;
  height: 3px;
  background: white;
  margin: 2rem auto;
  width: 60%;
    animation: slideInDivider 1s ease-out forwards;


  @keyframes slideInDivider {
    from {
      width: 0;
    }
    to {
      width: 60%;
    }
  }
`;

export const NumberedList = styled.ol`
  list-style: none;
  counter-reset: list-counter;
  margin-left: 0;
  padding-left: 0;

  li {
    counter-increment: list-counter;
    font-size: 1.1rem;
    line-height: 1.8;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    position: relative;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease;

    &.visible {
      opacity: 1;
      transform: translateY(0);
      animation: fadeInUp 0.5s ease forwards;
    }

    &::before {
      content: counter(list-counter);
      background: linear-gradient(135deg, #00d4ff, #007acc);
      color: white;
      font-weight: bold;
      font-size: 1.2rem;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 8%;
      margin-right: 1rem;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      transition: transform 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
      width: 2rem;
      height: 2rem;
            min-width: 2rem;

    }
      &:hover::before {
      transform: rotate(360deg) scale(1.2);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
    }

    &:hover {
        text-shadow: 0 0 8px rgba(0, 212, 255, 0.5);
        }
  }
`;
