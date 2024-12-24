import styled, { keyframes } from "styled-components";

// Animación desde la derecha
const slideInFromRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

// Animación desde abajo (por si quieres variar entre texto e imagen)
const slideInFromBottom = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 3rem;
  padding: 20px;

  @media (max-width: 768px) {
    margin: 2rem 1rem;
    padding: 10px;
  }
`;

export const ImageText = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  color: white;
  padding: 0 20px;
  max-width: 1320px;
  gap: 20px;
  margin-bottom: 50px;

  .image-container {
    opacity: 0;
    transform: translateX(20px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }

  .image-container.visible {
    animation: ${slideInFromRight} 0.6s ease forwards;
  }

  div {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }

  div.visible {
    animation: ${slideInFromRight} 0.6s ease forwards;
  }

  h1 {
    font-size: 34px;
    font-weight: 600;
    word-wrap: break-word;
  }

  span {
    font-size: 12px;
    font-weight: 400;
    display: block;
    margin-top: 20px;
    line-height: 1.8;
  }

  img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
  }

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    text-align: center;

    h1 {
      font-size: 28px;
    }

    span {
      font-size: 14px;
    }
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 0 10px;

    h1 {
      font-size: 24px;
    }

    span {
      font-size: 12px;
      line-height: 1.6;
    }
  }

  @media (max-width: 480px) {
    h1 {
      font-size: 20px;
    }

    span {
      font-size: 10px;
    }
  }
`;
