import styled from "styled-components";

const slideInFromLeft = `
  @keyframes slideInFromLeft {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

const bounce = `
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-5px);
    }
  }
`;

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

const pulseBorder = `
  @keyframes pulseBorder {
    0% {
      border-color: #00d4ff;
    }
    50% {
      border-color: #00ffff;
    }
    100% {
      border-color: #00d4ff;
    }
  }
`;

export const ServiceContainer = styled.section`
  background: linear-gradient(145deg, #162447, #1f4068);
  color: ${({ textColor }) => textColor || "#ffffff"};
  padding: 3rem 2rem;
  margin: 2rem auto;
  max-width: 1200px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  border: 2px solid #1f4068;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.6);
  }
`;

export const ServiceTitle = styled.h2`
  font-size: 2.8rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  text-align: left;
  color: #00d4ff;
  text-transform: uppercase;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.7);
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.3s ease;
  transform: translateY(20px);

  &.visible {
    opacity: 1;
    transform: translateY(0);
    animation: fadeInUp 0.5s ease forwards;
  }
  ${fadeInUp}
`;

// Lista de servicios con animación dinámica
export const ServiceList = styled.ul`
  list-style: none;
  margin-left: 0;
  padding-left: 0;

  li {
    font-size: 1.2rem;
    line-height: 1.8;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    color: #ffffff;
    border-left: 3px solid #00d4ff;
    padding-left: 1rem;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.3s ease, transform 0.3s ease;

    &.visible {
      opacity: 1;
      transform: translateY(0);
      animation: fadeInUp 0.5s ease forwards;
    }

    &::before {
      content: "💾";
      font-size: 1.5rem;
      margin-right: 0.5rem;
      color: #00d4ff;
      display: inline-block;
      transition: transform 0.3s ease;
    }

    &:hover::before {
      animation: bounce 0.5s ease infinite;
    }

    &:hover {
      background: rgba(0, 212, 255, 0.1);
      border-left-color: #00ffff;
    }
    ${bounce}
  }
`;

// Descripciones
export const Description = styled.p`
  font-size: 1.2rem;
  line-height: 1.8;
  margin-bottom: 2rem;
  text-align: justify;
  color: #e0e0e0;
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
  font-size: 1.4rem;
  font-weight: 700;
  color: #00d4ff;
  border: 2px dashed #00d4ff;
  padding: 1rem;
  border-radius: 8px;
  background: rgba(0, 212, 255, 0.05);

  &:hover {
    animation: pulseBorder 1s infinite ease;
  }
  ${pulseBorder}
`;

export const Divider = styled.hr`
  border: none;
  height: 3px;
  background-color: #00d4ff;
  margin: 2rem 0;
  width: 0;
  margin-right: auto;
  animation: drawLine 1s ease-out forwards;

  @keyframes drawLine {
    from {
      width: 0;
    }
    to {
      width: 50%;
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
    transition: all 0.3s ease;
    opacity: 0;
    transform: translateY(20px);

    &.visible {
      opacity: 1;
      transform: translateY(0);
      animation: fadeInUp 0.5s ease forwards;
    }

    &::before {
      content: counter(list-counter);
      background-color: #00d4ff;
      color: #123456;
      font-weight: bold;
      font-size: 1.2rem;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 50%;
      margin-right: 1rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      width: 2rem;
      height: 2rem;
      line-height: 2rem;
      min-width: 2rem;
      transition: transform 0.3s ease;
    }

    &:hover::before {
      transform: scale(1.1);
    }
  }
`;
