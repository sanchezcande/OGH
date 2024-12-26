import styled from "styled-components";

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
    animation: fadeInUp 0.6s ease forwards; /* Referencia al keyframe global */
  }

  div {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }

  div.visible {
    animation: fadeInUp 0.6s ease forwards; /* Referencia al keyframe global */
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
