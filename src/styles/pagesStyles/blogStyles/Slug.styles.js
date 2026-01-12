import styled, { keyframes } from "styled-components";

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

export const ArticleContainer = styled.div`
  padding: 30px 40px;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
  font-size: ${({ theme }) => theme.fontSizes.body.desktop};
  max-width: 1200px;
  margin: 0 auto 20px auto;
  border-radius: ${({ theme }) => theme.borderRadius};
  animation: ${fadeIn} 0.6s ease-out;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.body.mobile};
  }
`;

export const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.sectionTitle.desktop};
  font-family: ${({ theme }) => theme.fonts.main};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.accent};
  text-align: left;
  margin-bottom: 20px;
  line-height: ${({ theme }) => theme.lineHeights.tight};

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.sectionTitle.mobile};
    line-height: ${({ theme }) => theme.lineHeights.relaxed};
    margin-bottom: -10px;
  }
`;

export const ImageContainer = styled.div`
  margin: 15px 0;
  display: flex;
  justify-content: flex-start;

  img {
    max-width: 70%;
    height: auto;
    border-radius: ${({ theme }) => theme.borderRadius};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }
`;

export const Content = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: ${({ theme }) => theme.fonts.main};
  text-align: justify;
  font-size: ${({ theme }) => theme.fontSizes.body.desktop};
  line-height: ${({ theme }) => theme.lineHeights.normal};

  p {
    margin: 0;
  }

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.body.mobile};
  }

  ul {
    margin: 10px 0;
    padding-left: 20px;

    li {
      margin: 5px 0;
    }
  }
`;

export const Highlight = styled.span`
  color: ${({ theme }) => theme.colors.accentDark};
  font-weight: bold;
`;

export const ErrorMessage = styled.div`
  padding: 100px 20px;
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.sectionTitle.desktop};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.primary};

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.sectionTitle.mobile};
  }
`;
