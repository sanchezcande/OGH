import styled from 'styled-components';

export const Container = styled.div`
  padding: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const Title = styled.h1`
  color: ${({ theme }) => theme.colors.secondary};
  font-size: 30px;
  font-weight: 600;
  text-align: center;
  opacity: 0;
  transform: translateX(-30px); /* Inicial desde la izquierda */
  animation: slideInFromLeft 0.8s ease forwards;

  span {
    font-weight: 400;
  }

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

export const Title2 = styled.h2`
  color: ${({ theme }) => theme.colors.secondary};
  font-size: 20px;
  font-weight: 100;
  margin-bottom: 50px;
  margin-top: 10px;
  line-height: 1.8;
  margin-left: 1rem;
  margin-right: 1rem;
  text-align: center;
  max-width: 800px;
  opacity: 0;
  transform: translateX(-30px); /* Inicial desde la izquierda */
  animation: slideInFromLeft 1s ease forwards;
  animation-delay: 0.3s; /* Un ligero retraso para variar con el h1 */

  span {
    font-weight: 600;
  }

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

export const ImageContainer = styled.div`
  width: auto;
  max-height: 500px;
  margin-bottom: -150px;
  margin-top: 0;

  video {
    margin-top: -180px;
    width: 70%;
    height: auto;
    margin-bottom: 20px;
  }

  @media (max-width: 768px) {
    video {
    margin-top: -80px;
    margin-bottom: 80px;

      width: 100%;
      height: auto
  }
`;

export const ButtonsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
`;