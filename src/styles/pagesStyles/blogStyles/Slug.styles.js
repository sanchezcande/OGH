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
  padding: 40px 40px;
  background-color: #ffffff;
  color: #1f2937;
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
  font-size: ${({ theme }) => theme.fontSizes.body.desktop};
  max-width: 900px;
  margin: 0 auto 40px auto;
  border-radius: 8px;
  animation: ${fadeIn} 0.6s ease-out;

  @media (max-width: 768px) {
    padding: 24px 20px;
    font-size: ${({ theme }) => theme.fontSizes.body.mobile};
    margin: 0 auto 20px auto;
  }
`;

export const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.sectionTitle.desktop};
  font-family: ${({ theme }) => theme.fonts.main};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: #1f2937;
  text-align: left;
  margin-bottom: 24px;
  line-height: ${({ theme }) => theme.lineHeights.tight};

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.sectionTitle.mobile};
    line-height: ${({ theme }) => theme.lineHeights.relaxed};
    margin-bottom: 20px;
  }
`;

export const ImageContainer = styled.div`
  margin: 0 0 32px 0;
  display: flex;
  justify-content: center;
  width: 100%;

  img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

export const Content = styled.div`
  margin-top: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: ${({ theme }) => theme.fonts.main};
  text-align: left;
  font-size: ${({ theme }) => theme.fontSizes.body.desktop};
  line-height: ${({ theme }) => theme.lineHeights.normal};
  color: #374151;

  p {
    margin: 0;
    color: #374151;
  }

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.body.mobile};
    gap: 16px;
  }

  ul {
    margin: 10px 0;
    padding-left: 20px;
    color: #374151;

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
