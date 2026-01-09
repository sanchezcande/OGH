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
  line-height: 1.8;
  font-size: 1.1rem;
  max-width: 1200px;
  margin: 0 auto 20px auto;
  border-radius: ${({ theme }) => theme.borderRadius};
  animation: ${fadeIn} 0.6s ease-out;
`;

export const Title = styled.h1`
  font-size: 2rem;
  font-family: ${({ theme }) => theme.fonts.main};
  color: ${({ theme }) => theme.colors.accent};
  text-align: left;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    font-size: 1.3rem;
    line-height: 1.8;
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
  font-size: 14px;

  p {
    margin: 0;
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
  font-size: 2.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
`;
