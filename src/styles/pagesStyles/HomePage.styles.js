
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
  font-size: 36px;
  font-weight: 700;
  margin-top: 30px;
  span {
    font-weight: 400;
  }
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
  max-height: 500px;
  margin-bottom: 40px;
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
