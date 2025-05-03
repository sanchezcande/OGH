
import styled from 'styled-components';

export const Container = styled.div`
  padding: 40px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text};
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
  color: ${({ theme }) => theme.colors.text};
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
`;

export const Subtitle = styled.h2`
  color: ${({ theme }) => theme.colors.text};
  font-size: 22px;
  font-weight: 400;
  margin-bottom: 40px;
  max-width: 800px;
`;

export const Section = styled.section`
  max-width: 800px;
  margin: 40px 0;
  text-align: left;
`;

export const SectionTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 10px;
`;

export const SectionText = styled.p`
  font-size: 16px;
  line-height: 1.5;
`;


export const ImageContainer = styled.div`
  width: 100%;
  margin-left: 0;
  margin-right: 0;

  @media (min-width: 1250px) {
    margin-bottom: -30px;
  }
    
  @media (min-width: 768px) {
    width: 60%;
  }

`;

export const CTAButton = styled.a`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: 12px 24px;
  font-weight: bold;
  border-radius: 5px;
  text-decoration: none;
  margin-top: 20px;
  display: inline-block;
`;
